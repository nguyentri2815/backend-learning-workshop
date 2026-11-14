import {expect,test} from '@playwright/test';
import {choosePolicySession} from './policy-session-helpers';
import type {Page} from '@playwright/test';
import {writeFileSync} from 'node:fs';
import {beginnerBaseline,beginnerChangedFiles,beginnerFileStatus,beginnerHistory,beginnerRounds,beginnerRows,beginnerSources} from '../../src/content/policy/beginner-session';
import {beginnerFixture,runBeginnerTrial} from '../../src/policy/beginner-fixture';

const route='/journey/policy?group=create&mode=session&sessionId=quote-beginner';
const session=(page:Page)=>page.getByRole('region',{name:'Mô phỏng cả phiên triển khai',exact:true});
const at=(id:string)=>beginnerRounds.findIndex(r=>r.id===id);

test('Quote-only baseline has no Policy declarations, configuration or hidden registrations; snapshots isolate future files',()=>{
 expect(JSON.stringify(beginnerBaseline)).not.toMatch(/policy|Policy/);
 expect(beginnerChangedFiles(at('data'))).toEqual([]);
 expect(beginnerRows('aggregate',at('marker'))).toEqual([]);
 expect(beginnerRows('controller',at('controller-pattern'))).toEqual([]);
 expect(beginnerRows('command',at('duplicate-trial'))).toEqual([]);
 expect(beginnerRows('event',at('event-base'))).toEqual([]);
 expect(beginnerRows('repositoryBean',at('apply')).map(r=>r.text).join('\n')).not.toContain('Policy');
 expect(beginnerRows('repositoryBean',at('registration')).map(r=>r.text).join('\n')).toContain('policyAggregateRepository');
 expect(beginnerRows('func',at('registration')).map(r=>r.text).join('\n')).not.toContain('policyAggregateRepository.save');
 expect(beginnerRows('func',at('persist')).map(r=>r.text).join('\n')).toContain('policyAggregateRepository.save(command)');
 expect(beginnerRows('aggregate',at('process')).map(r=>r.text).join('\n')).not.toContain('apply(CreatePolicyEvent');
 const end=at('verify');
 expect(beginnerChangedFiles(end)).toHaveLength(11);
 expect(beginnerChangedFiles(end).filter(f=>beginnerFileStatus(f.id,end)==='A')).toHaveLength(10);
 expect(beginnerFileStatus('repositoryBean',end)).toBe('M');
 expect(beginnerHistory('aggregate',end).map(h=>h.round.id)).toEqual(['aggregate-model','process','apply']);
 expect(beginnerHistory('controller',end).map(h=>h.round.id)).toEqual(['controller','wire']);
 for(const r of beginnerRounds)for(const e of r.evidence){expect(e.from).toBeGreaterThan(0);expect(e.to).toBeLessThanOrEqual(beginnerSources[e.ref].rows.length);}
});

test('fixtures stop before writes at guards and return the saved Policy ID only after persistence is wired',()=>{
 expect(runBeginnerTrial('success',at('registration'))).toBeNull();
 expect(runBeginnerTrial('duplicate',at('quote-trial'))).toBeNull();
 const valid=runBeginnerTrial('quote-valid',at('quote-trial'))!;
 expect(valid.writes).toBe(0);expect(valid.policyId).toBeUndefined();
 const missing=runBeginnerTrial('quote-missing',at('quote-trial'))!;
 expect(missing.output).toContain('QUOTE_NOT_EXIST');expect(missing.writes).toBe(0);
 const duplicate=runBeginnerTrial('duplicate',at('duplicate-trial'))!;
 expect(duplicate.output).toContain('QUOTE_CAN_NOT_RELEASE_POLICY');expect(duplicate.writes).toBe(0);
 expect(duplicate.quoteId).toBe('QUOTE-BEGINNER-103');
 const result=runBeginnerTrial('success',at('verify'))!;
 expect(result.writes).toBe(1);expect(result.policyId).toBe(beginnerFixture.policyId);
 expect(result.record).toMatchObject({id:result.policyId,quoteId:beginnerFixture.quote.id,quoteCode:'Q-DEMO-101',customerName:'Nguyễn An',status:'RUNNING',version:1});
 expect(result.record!.id).not.toBe(result.record!.quoteId);
 expect(runBeginnerTrial('success',at('verify'))).toEqual(result);
 const checked=runBeginnerTrial('read-id',at('verify'))!;
 expect(checked.writes).toBe(0);expect(checked.record).toEqual(result.record);
});

test('beginner completes success and stop branches, reviews unique files and restores historical deep links',async({page})=>{
 test.setTimeout(150_000);
 const errors:string[]=[];page.on('pageerror',error=>errors.push(error.message));
 await page.goto('/journey/policy?group=create&mode=overview');
 await choosePolicySession(page,'quote-beginner');
 const root=session(page);
 await expect(root).toHaveAttribute('data-session','quote-beginner');
 await expect(root.locator('.session-tree')).not.toContainText('Policy');
 await expect(root.locator('.session-code')).toContainText('trước khi đọc Java');
 for(const round of beginnerRounds.filter(r=>r.kind!=='review')){
  await expect(root).toHaveAttribute('data-round',round.id);
  // The five sections appear in the requested learning order, before the Java workspace.
  await expect(root.locator('.beginner-lesson > section > small')).toHaveCount(5);
  if(round.id==='brief'){
   await root.locator('.beginner-predict').getByRole('radio',{name:round.options[1],exact:true}).click();
   await expect(root.locator('.beginner-apply .button')).toBeDisabled();
   await expect(root.getByRole('button',{name:'Sao chép prompt',exact:true})).toBeVisible();
  }
  await root.locator('.beginner-predict').getByRole('radio',{name:round.options[round.answer],exact:true}).click();
  if(round.kind==='survey'){
   await expect(root.locator('.beginner-proposal .session-evidence')).toHaveCount(round.evidence.length);
   for(const e of await root.locator('.beginner-proposal .session-evidence').all())await e.click();
  }
  if(round.patches.length){
   await expect(root.locator('.beginner-apply .button')).toBeDisabled();
   for(const button of await root.locator('.beginner-apply .session-patch-button').all())await button.click();
  }
  for(const id of round.requiredTrials??[]){
   if(id==='read-id'){
    await root.getByLabel('Policy ID để đối chiếu').fill(beginnerFixture.quote.id);
    await root.getByRole('button',{name:'Đối chiếu Policy ID với bản ghi',exact:true}).click();
    await expect(root.locator('.beginner-check [role=status]')).toContainText('ID chưa khớp');
    await expect(root.locator('.beginner-apply .button')).toBeDisabled();
    await root.getByLabel('Policy ID để đối chiếu').fill(beginnerFixture.policyId);
   }
   const labels:Record<string,string>={'quote-valid':'Thử Quote hợp lệ','quote-missing':'Thử Quote không tồn tại',duplicate:'Thử Quote đã có Policy',success:'Chạy tình huống thành công','read-id':'Đối chiếu Policy ID với bản ghi'};
   await root.getByRole('button',{name:labels[id],exact:true}).click();
   await expect(root.locator(`.beginner-check [data-trial="${id}"]`)).toBeVisible();
  }
  await expect(root.locator('.beginner-apply .button')).toBeEnabled();
  await root.locator('.beginner-apply .button').click();
  if(round.id==='wire')await expect(root.getByTestId('session-code')).toContainText('exec(quoteId)');
  if(round.id==='quote-trial')await expect(root.locator('[data-trial=quote-missing]')).toContainText('0 lần ghi');
  if(round.id==='duplicate-trial')await expect(root.locator('[data-trial=duplicate]')).toContainText('0 bản ghi mới');
  await root.getByRole('button',{name:'Mốc sau',exact:true}).click();
 }
 await expect(root).toHaveAttribute('data-round','review');
 await expect(root.locator('.session-review')).toContainText('Hoàn tất phiên triển khai');
 await expect(root.locator('.session-review-files > .beginner-review-file')).toHaveCount(11);
 await expect(root.getByTestId('session-progress')).toContainText('11 file (10 A / 1 M)');
 await expect(root.locator('.session-test-results [data-trial]')).toHaveCount(5);
 await root.locator('.session-review-files').getByRole('button',{name:'Diff và lịch sử · PolicyAggregate.java',exact:true}).click();
 await expect(root.locator('.session-file-history')).toHaveCount(3);
 await root.getByRole('tab',{name:'Từ đầu phiên',exact:true}).click();
 await expect(root.locator('.session-unified')).toContainText('process(CreatePolicyCommand');
 const reviewLink=page.url();
 await root.scrollIntoViewIfNeeded();await root.locator('.session-editor').evaluate(element=>element.scrollTop=0);await page.screenshot({path:'docs/review/policy-beginner-review.png',fullPage:false});
 await root.locator('.session-review-files').getByRole('button',{name:/^A PolicyAggregate.java/}).click();
 await expect(root).toHaveAttribute('data-round','aggregate-model');
 await expect(root.locator('.session-tree')).not.toContainText('CreatePolicyFunc.java');
 await expect(root.locator('.session-tree')).not.toContainText('CreatePolicyEvent.java');
 await root.getByRole('tab',{name:'File tại mốc này',exact:true}).click();
 await expect(root.getByTestId('session-code')).not.toContainText('process(CreatePolicyCommand');
 await page.reload();await expect(root).toHaveAttribute('data-round','aggregate-model');
 await expect(root.getByTestId('session-progress')).toContainText('11 file');
 await page.goto(reviewLink);await expect(root.locator('.session-review')).toContainText('Hoàn tất');
 await page.evaluate(url=>localStorage.setItem('policy-beginner-review-url',url),reviewLink);
 const oldReview='http://localhost:3182/journey/policy?group=create&mode=session&sessionAt=review&sessionDone=10&sessionFile=func&sessionMode=total&sessionTrials=entry-valid,entry-missing,entry-blocked,pending,success,read-id';
 writeFileSync('docs/review/policy-beginner-links.json',JSON.stringify({start:'http://localhost:3182'+route,newReview:reviewLink,existingReview:oldReview},null,2)+'\n');
 const milestones=beginnerRounds.map((r,index)=>({round:index+1,id:r.id,title:r.title,changes:r.patches.map(p=>({file:beginnerSources[p.ref].path,status:beginnerFileStatus(p.ref,index),from:p.from,to:p.to})),checked:r.requiredTrials??[],scope:r.check,source:r.evidence.map(e=>({file:beginnerSources[e.ref].path,from:e.from,to:e.to,finding:e.finding}))}));
 writeFileSync('docs/review/policy-beginner-validation.json',JSON.stringify({fixtureDate:beginnerFixture.now,finalFiles:11,added:10,modified:1,browserErrors:errors,success:runBeginnerTrial('success',at('verify')),stops:['quote-missing','duplicate'].map(id=>runBeginnerTrial(id,at('verify'))),milestones},null,2)+'\n');
 const table=milestones.map(m=>`| ${m.round}. ${m.title} | ${m.changes.map(c=>`${c.status} ${c.file.split('/').at(-1)} L${c.from}–${c.to}`).join('<br>')||'Chỉ đọc / quyết định / chạy fixture'} | ${m.scope} |`).join('\n');
 writeFileSync('docs/review/policy-beginner-session.md',`# Xây Policy từ Quote · Dành cho người mới\n\n[Review phiên mới](${reviewLink}) · [Review phiên hiện tại](${oldReview}) · [Mở phiên mới](http://localhost:3182${route})\n\nPhiên mới có ${beginnerRounds.length-1} lượt và một Review, tiến độ/khởi đầu/làm lại riêng. Deep link cũ không cần sessionId; phiên mới dùng sessionId=quote-beginner. Tiến độ theo URL và localStorage key workshop:policy-session:<id>:v1.\n\n| Mốc | File A/M sau áp dụng | Kết quả và phạm vi kiểm tra |\n| --- | --- | --- |\n| Mốc đầu | ${Object.keys(beginnerBaseline).length} file Quote/hạ tầng; 0 file Policy | Không có tham chiếu Policy trong nội dung, import, bean hoặc hàng đợi; chưa có API đọc Policy. |\n${table}\n| Kết quả cuối | 11 file duy nhất: 10 A / 1 M | QUOTE-BEGINNER-101 → POL-BEGINNER-101, version 1, một bản ghi fixture. Thiếu Quote và tạo trùng: 0 lần ghi mới. |\n\nSource đối chiếu: D:/ALPACA/agent-system; [31 file với SHA-256 và commit](policy-beginner-source-audit.json). Các file Quote và Policy trong cây là trích đoạn cấu trúc được dựng cho bài, lược imports, helper và trường mở rộng; source đầy đủ mở từ từng bằng chứng. Snapshot Java không được biên dịch. Fixture TypeScript mô phỏng guard, mapping, Command → Event → Aggregate → store và đối chiếu ID.\n\nFixture dùng ngày 13/11/2026, khách hàng Nguyễn An, sản phẩm AUTO và paymentInfo rỗng. Chưa kiểm tra tính toán thanh toán, Java/HTTP/Kafka, đối tượng bảo hiểm, PublishedQuote hoặc email/SMS. Chặng tiếp nối phải bổ sung rõ API/Func/model đọc, Workflow/SyncView, view/repository và cấu hình; không dùng ngầm chúng trong phiên tạo mới.\n\nĐã kiểm tra bằng trình duyệt: đi hết phiên thành công và hai nhánh dừng; ID sai rồi đúng; Review 11 file và lịch sử Aggregate; về lượt đầu file xuất hiện; tải lại mốc cũ; đổi hai phiên và reset độc lập; mobile sáng/tối không tràn ngang. [Kết quả fixture và bảng source theo lượt](policy-beginner-validation.json).\n`);
 expect(errors).toEqual([]);
});

test('switch, reload and reset preserve each session independently, including the original deep link',async({page})=>{
 await page.goto('/journey/policy?group=create&mode=session&sessionAt=entry&sessionDone=1&sessionPatches=entry:func&sessionFile=func');
 const root=session(page);await expect(root).toHaveAttribute('data-applied','1');
 await choosePolicySession(page,'quote-beginner');
 await expect(root).toHaveAttribute('data-applied','-1');
 await root.locator('.beginner-predict').getByRole('radio').first().click();
 await root.locator('.beginner-apply .button').click();
 await root.getByRole('button',{name:'Mốc sau',exact:true}).click();
 await expect(root).toHaveAttribute('data-round','survey');
 await page.reload();await expect(root).toHaveAttribute('data-round','survey');
 await choosePolicySession(page,'direct-quote');
 await expect(root).toHaveAttribute('data-round','entry');await expect(root).toHaveAttribute('data-applied','1');
 await expect(root.getByTestId('session-code')).toHaveAttribute('data-file','func');
 expect(new URL(page.url()).searchParams.get('sessionPatches')).toBe('entry:func');
 await root.getByRole('button',{name:'Làm lại phiên',exact:true}).click();
 await expect(root).toHaveAttribute('data-applied','-1');
 await choosePolicySession(page,'quote-beginner');
 await expect(root).toHaveAttribute('data-round','survey');await expect(root).toHaveAttribute('data-applied','0');
 await root.getByRole('button',{name:'Làm lại phiên',exact:true}).click();
 await expect(root).toHaveAttribute('data-round','brief');await expect(root).toHaveAttribute('data-applied','-1');
 expect(new URL(page.url()).searchParams.has('sessionDecision.brief')).toBe(false);
 await page.reload();await expect(root).toHaveAttribute('data-applied','-1');
 await choosePolicySession(page,'direct-quote');await expect(root).toHaveAttribute('data-applied','-1');
 // Entry without explicit progress resumes only its own saved session.
 await page.goto(route);await expect(root).toHaveAttribute('data-applied','-1');
});

for(const dark of [false,true])test(`beginner mobile ${dark?'dark':'light'} has no overflow and future files stay hidden`,async({page})=>{
 await page.setViewportSize({width:390,height:844});await page.goto(route+'&sessionAt=registration');
 if(dark)await page.getByRole('button',{name:'Giao diện tối',exact:true}).click();
 const root=session(page);await expect(root).toHaveAttribute('data-round','registration');
 await expect(root.locator('.session-tree')).not.toContainText('Policy');
 await expect(root.locator('.beginner-apply .button')).toBeDisabled();
 expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
 await root.scrollIntoViewIfNeeded();await page.screenshot({path:`docs/review/policy-beginner-mobile-${dark?'dark':'light'}.png`,fullPage:false});
});
