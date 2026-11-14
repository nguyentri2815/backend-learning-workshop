import {expect,test} from '@playwright/test';
import {choosePolicySession} from './policy-session-helpers';
import type {Locator,Page} from '@playwright/test';
import {sessionChangedFiles,sessionFileStatus,sessionHistory,sessionRounds,sessionRows,sessionSources} from '../../src/content/policy/implementation-session';
import {policySessionState,sessionReady} from '../../src/policy/policy-session-state';

const route='/journey/policy?group=create&mode=session';
const session=(page:Page)=>page.getByRole('region',{name:'Mô phỏng cả phiên triển khai',exact:true});
const next=(root:Locator)=>root.getByRole('button',{name:'Mốc sau',exact:true}).click();
async function patches(root:Locator) {const buttons=root.getByRole('button',{name:/Xem patch ·/});await expect(buttons).not.toHaveCount(0);for(const button of await buttons.all())await button.click();}

test('session snapshots preserve source, A/M, multi-turn history and read-only baseline',()=>{
 const source=JSON.stringify(sessionSources);
 expect(sessionChangedFiles(1)).toEqual([]);
 expect(sessionRows('func',1)).toEqual([]);
 expect(sessionRows('controller',1).map(r=>r.text).join('\n')).not.toContain('createPolicy(');
 expect(sessionRows('controller',1).map(r=>r.text).join('\n')).toContain('FindPolicyByIdFunc.class');
 expect(sessionChangedFiles(2).map(f=>f.id)).toEqual(['controller','func']);
 expect(sessionFileStatus('func',2)).toBe('A');expect(sessionFileStatus('controller',2)).toBe('M');
 const beforeSave=sessionRows('func',7).map(r=>r.text).join('\n');
 expect(beforeSave).toContain('command.setPolicyType');expect(beforeSave).toContain('splitPaymentForeignCurrency');expect(beforeSave).not.toContain('policyAggregateRepository.save(command)');
 expect(sessionRows('aggregate',6).map(r=>r.text).join('\n')).toContain('process(CreatePolicyCommand');
 expect(sessionRows('aggregate',6).map(r=>r.text).join('\n')).not.toContain('apply(CreatePolicyEvent');
 expect(sessionRows('aggregate',7).map(r=>r.text).join('\n')).toContain('apply(CreatePolicyEvent');
 expect(sessionChangedFiles(10).map(f=>[f.id,sessionFileStatus(f.id,10)])).toEqual([['controller','M'],['func','A'],['aggregate','M'],['workflow','M']]);
 expect(sessionHistory('func',10).map(h=>h.round.id)).toEqual(['entry','command','payment','persist']);
 expect(sessionHistory('aggregate',10).map(h=>h.round.id)).toEqual(['process','apply']);
 for(const ref of ['controller','func','aggregate','workflow'])expect(sessionRows(ref,10)).toEqual(sessionSources[ref].rows);
 for(const round of sessionRounds)for(const e of [...round.evidence,...round.patches])expect(e.to).toBeLessThanOrEqual(sessionSources[e.ref].rows.length);
 expect(JSON.stringify(sessionSources)).toBe(source);
});

test('session state gates survey, every patch file and both trial outcomes; invalid positions normalize',()=>{
 const params=new URLSearchParams({sessionAt:'survey',sessionDone:'0'});
 expect(sessionReady(policySessionState(params))).toBe(false);
 params.set('sessionReads',sessionRounds[1].evidence.map(e=>`survey:${e.ref}`).join(','));
 expect(sessionReady(policySessionState(params))).toBe(true);
 params.set('sessionAt','entry');params.set('sessionDone','1');params.set('sessionPatches','entry:func');
 expect(sessionReady(policySessionState(params))).toBe(false);params.set('sessionPatches','entry:func,entry:controller');expect(sessionReady(policySessionState(params))).toBe(true);
 params.set('sessionAt','entry-trial');params.set('sessionDone','2');params.set('sessionTrials','entry-valid');
 expect(sessionReady(policySessionState(params))).toBe(false);params.set('sessionTrials','entry-valid,entry-missing');expect(sessionReady(policySessionState(params))).toBe(true);
 params.set('sessionDone','2.5');expect(policySessionState(params).done).toBe(-1);
 params.set('sessionDone','NaN');expect(policySessionState(params).done).toBe(-1);
});

test('complete a session, inspect historical files, return from lessons and review every file',async({page})=>{
 test.setTimeout(120_000);
 const errors:string[]=[];page.on('pageerror',error=>errors.push(error.message));
 await page.goto('/journey/policy?group=create&mode=overview');
 await choosePolicySession(page,'direct-quote');
 const root=session(page);
 await expect(root).toHaveAttribute('data-round','brief');
 await root.getByRole('button',{name:'Giao yêu cầu',exact:true}).click();await next(root);
 await root.getByRole('button',{name:'Lượt này',exact:true}).click();
 await expect(root.locator('.session-tree .session-empty')).toContainText('Chưa có file thay đổi');
 await expect(root.getByRole('button',{name:'Xác nhận đã khảo sát',exact:true})).toBeDisabled();
 for(const button of await root.locator('.session-evidence').all())await button.click();
 await expect(root.locator('.session-agent')).toContainText('Tạo CreatePolicyFunc');
 await root.getByRole('button',{name:'Xác nhận đã khảo sát',exact:true}).click();
 await expect(root.locator('.session-tree .tree-file')).toHaveCount(0);await next(root);
 await expect(root.getByRole('button',{name:'Áp dụng thay đổi',exact:true})).toBeDisabled();
 await patches(root);await root.getByRole('button',{name:'Áp dụng thay đổi',exact:true}).click();
 await expect(root.locator('.session-tree [data-file-status=A]')).toHaveCount(1);
 await expect(root.locator('.session-tree [data-file-status=M]')).toHaveCount(1);
 await expect(root.getByRole('button',{name:'Đã thực hiện lượt này',exact:true})).toBeDisabled();
 await expect(root.getByTestId('session-progress')).toContainText('2 file (1 A / 1 M)');await next(root);
 await root.getByRole('button',{name:'Thử Quote hợp lệ',exact:true}).click();
 await expect(root.getByRole('button',{name:'Xác nhận kiểm tra đường vào',exact:true})).toBeDisabled();
 await root.getByRole('button',{name:'Thử Quote không tồn tại',exact:true}).click();
 await root.getByRole('button',{name:'Thử Quote đã có Policy',exact:true}).click();
 await expect(root.locator('[data-trial=entry-valid]')).toContainText('chưa ghi Policy');
 await expect(root.locator('[data-trial=entry-missing]')).toContainText('QUOTE_NOT_EXIST');
 await expect(root.locator('[data-trial=entry-blocked]')).toContainText('QUOTE_CAN_NOT_RELEASE_POLICY');
 await root.getByRole('button',{name:'Xác nhận kiểm tra đường vào',exact:true}).click();await next(root);
 for(const id of ['command','payment','process','apply','persist','projection']) {
  await expect(root).toHaveAttribute('data-round',id);await patches(root);await root.getByRole('button',{name:'Áp dụng thay đổi',exact:true}).click();
  if(id==='apply') {
   const before=page.url();await root.getByRole('button',{name:/^Mở Từng bước triển khai/}).click();
   const dialog=page.getByRole('dialog',{name:'Sơ đồ phối hợp và cây workspace'});
   await expect(dialog.getByRole('tab',{name:'Từng bước triển khai',exact:true})).toHaveAttribute('aria-selected','true');
   await dialog.getByRole('button',{name:'Trở về phiên triển khai',exact:true}).click();
   expect(new URL(page.url()).searchParams.get('sessionAt')).toBe(new URL(before).searchParams.get('sessionAt'));
   await expect(root).toHaveAttribute('data-applied','7');
   await root.scrollIntoViewIfNeeded();await page.screenshot({path:'docs/review/policy-session-acceptance-ide.png',fullPage:false,animations:'disabled'});
  }
  await next(root);
 }
 await expect(root).toHaveAttribute('data-round','verify');
 await root.getByRole('button',{name:'Thử view chưa đồng bộ',exact:true}).click();
 await expect(root.locator('[data-trial=pending]')).toContainText('chưa có dòng');
 await root.getByRole('button',{name:'Chạy tình huống thành công',exact:true}).click();
 await root.getByLabel('Policy ID để đối chiếu').fill('QUOTE-LEARN-101');await root.getByRole('button',{name:'Đối chiếu Danh sách và Chi tiết',exact:true}).click();
 await expect(root.getByRole('status')).toContainText('quoteId không phải Policy ID');
 await root.getByLabel('Policy ID để đối chiếu').fill('POL-FROM-QUOTE-LEARN-101');await root.getByRole('button',{name:'Đối chiếu Danh sách và Chi tiết',exact:true}).click();
 await expect(root.locator('.session-read-result tbody tr')).toHaveCount(3);
 await root.getByRole('button',{name:'Xác nhận đối chiếu',exact:true}).click();await next(root);
 await expect(root.locator('.session-review')).toContainText('Hoàn tất phiên triển khai');
 await expect(root.locator('.session-review-files button')).toHaveCount(4);
 await root.locator('.session-review-files').getByRole('button',{name:/PolicyAggregate.java/}).click();
 await expect(root.locator('.session-file-history')).toHaveCount(2);
 await root.locator('.session-file-history').getByRole('button',{name:'Lượt 7 · Bổ sung process cho Command',exact:true}).click();
 await expect(root.locator('.session-code')).toContainText('process(CreatePolicyCommand');
 await expect(root.locator('.session-test-results [data-trial]')).toHaveCount(6);
 await root.getByRole('navigation',{name:'Các mốc của phiên'}).getByRole('button',{name:/Dựng dữ liệu và ghi/}).click();
 await root.getByRole('tab',{name:'File tại mốc này',exact:true}).click();
 await expect(root.getByTestId('session-code')).toHaveAttribute('data-file','func');
 await expect(root.getByTestId('session-code')).toContainText('command.setPolicyType');
 await expect(root.getByTestId('session-code')).not.toContainText('policyAggregateRepository.save(command)');
 await expect(root).toHaveAttribute('data-applied','10');
 await page.reload();await expect(root).toHaveAttribute('data-applied','10');
 await root.getByRole('button',{name:'Trở về mốc hiện tại',exact:true}).click();
 await root.locator('.session-review-files').getByRole('button',{name:/CreatePolicyFunc.java/}).click();
 await expect(root.locator('.session-file-history')).toHaveCount(4);
 await expect(root.getByTestId('session-progress')).toContainText('4 file (1 A / 3 M)');
 await root.scrollIntoViewIfNeeded();await page.screenshot({path:'docs/review/policy-session-acceptance-review.png',fullPage:false,animations:'disabled'});
 await page.evaluate(url=>localStorage.setItem('policy-session-review-url',url),page.url());
 expect(errors).toEqual([]);
 await root.getByRole('button',{name:'Làm lại phiên',exact:true}).click();
 await expect(root).toHaveAttribute('data-round','brief');await expect(root).toHaveAttribute('data-applied','-1');
 await root.getByRole('button',{name:'Lượt này',exact:true}).click();await expect(root.locator('.session-tree .tree-file')).toHaveCount(0);
});

for(const mobile of [false,true])for(const dark of [false,true])test(`${mobile?'mobile':'desktop'} ${dark?'dark':'light'} session layout and unfinished deep links`,async({page})=>{
 await page.setViewportSize(mobile?{width:390,height:844}:{width:1512,height:1050});
 await page.goto(route+'&sessionAt=projection');
 if(dark)await page.getByRole('button',{name:'Giao diện tối',exact:true}).click();
 const root=session(page);await expect(root).toHaveAttribute('data-round','projection');
 await expect(root.getByRole('button',{name:'Áp dụng thay đổi',exact:true})).toBeDisabled();
 await expect(root.getByTestId('session-code')).not.toContainText('applicationContext.getBean(PolicySyncViewFunc.class)');
 await root.getByRole('button',{name:'Lượt này',exact:true}).click();await expect(root.locator('.session-tree .tree-file')).toHaveCount(0);
 await root.getByRole('button',{name:'Trở về mốc hiện tại',exact:true}).click();await expect(root).toHaveAttribute('data-round','brief');
 expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(mobile?390:1512);
 await page.screenshot({path:`docs/review/policy-session-${mobile?'mobile':'desktop'}-${dark?'dark':'light'}.png`,fullPage:false});
});

test('single-step workspace opens the matching session milestone without inventing progress',async({page})=>{
 const params=new URLSearchParams({group:'create',mode:'assembly',assemblyStep:'save','assemblyAnswers.save':'0,0','assemblyView.save':'pattern','assemblyDiagram.save':'1','assemblyDiagramMode.save':'practice'});
 await page.goto('/journey/policy?'+params);
 const dialog=page.getByRole('dialog',{name:'Sơ đồ phối hợp và cây workspace'});
 await dialog.getByRole('button',{name:'Mở phiên tổng thể tại mốc này',exact:true}).click();
 const root=session(page);await expect(root).toHaveAttribute('data-round','process');await expect(root).toHaveAttribute('data-applied','-1');
 await root.getByRole('button',{name:'Trở về bài đã mở phiên',exact:true}).click();
 await expect(dialog.getByRole('tab',{name:'Từng bước triển khai',exact:true})).toHaveAttribute('aria-selected','true');
});
