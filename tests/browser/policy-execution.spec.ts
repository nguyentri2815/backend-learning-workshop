import {expect,test} from '@playwright/test';
import type {Page} from '@playwright/test';
import {advanceTo,button,header,line,primary,runThrough,openCheckpointDetails,returnToStop} from './execution-helpers';
import {executionSession} from '../../src/policy/policy-execution';
import {excerptById} from '../../src/content/policy/lesson';

const root='/journey/policy?group=create&mode=steps&node=quote';
async function inspect(p:Page,id:string){await openCheckpointDetails(p);await p.getByRole('combobox',{name:'Điểm đang xem',exact:true}).selectOption(id);}

test('checkpoint identities reference bundled source; method order and snapshots follow source, not the field picker',()=>{
 const s=executionSession(new URLSearchParams('quote=QUOTE-LEARN-101'),'quote');
 for(const c of s.all){expect(excerptById[c.ref].rows.some(r=>r.line===c.line),`${c.id} source`).toBe(true);}
 const ids=s.all.filter(c=>c.stage==='map').map(c=>c.id);
 expect(ids).toEqual(['map-dates','map-command','status-call','status-enter','status-choice','status-return','map-effective','fill-call','fill-enter','fill-id','fill-name','fill-rest','fill-return','map-code','map-sync']);
 expect(s.byId.get('fill-call')?.after).not.toHaveProperty('command.customerName');
 expect((s.byId.get('fill-name')!.after.command as Record<string,unknown>).customerName).toBe('Khách hàng mẫu Mai');
 expect(s.byId.get('fill-return')!.line).toBe(103);
 expect(s.byId.get('save-apply')!.after).not.toHaveProperty('policyId');
 expect(s.byId.get('save-id')!.after.policyId).toBe('POL-FROM-QUOTE-LEARN-101');
});

for(const mobile of [false,true])test(`${mobile?'mobile':'desktop'} step 2 → 3 continues L76 → L80 → L102 → L204 → L206 → caller L103 with one checkpoint identity`,async({page})=>{
 if(mobile)await page.setViewportSize({width:390,height:844});
 await page.goto(root);await runThrough(page,'duplicate-guard');
 await expect(primary(page)).toBeDisabled();await button(page,'Bước sau').click();
 await expect(header(page)).toHaveAttribute('data-checkpoint-id','map-dates');await expect(line(page,80)).toBeInViewport();
 await expect(page.getByTestId('debug-after')).toContainText('Chưa chạy');
 await advanceTo(page,'fill-call');
 for(const target of [header(page),page.getByTestId('checkpoint-editor'),page.locator('.checkpoint-variable-wrapper')])await expect(target).toHaveAttribute('data-checkpoint-id','fill-call');
 await expect(line(page,102)).toHaveAttribute('data-viewing','true');await expect(page.getByTestId('debug-branch')).toContainText('Vào fillMissingValue');
 await expect(page.getByTestId('debug-before')).toContainText('quoteAggregate');await expect(page.getByTestId('debug-before')).toContainText('command');
 await expect(page.getByTestId('debug-after')).not.toContainText('customerName');
 await primary(page).click();await expect(header(page)).toHaveAttribute('data-checkpoint-id','fill-enter');
 await expect(line(page,204)).toBeInViewport();await expect(page.getByTestId('source-handoff')).toContainText('runInternal:L102 → fillMissingValue:L204');
 if(mobile)await button(page,'Mở cây thư mục').click();
 await expect(page.getByRole('button',{name:'CreatePolicyFunc.java',exact:true})).toBeVisible();
 if(mobile)await button(page,'Thu cây thư mục').click();
 await runThrough(page,'fill-name');await expect(line(page,206)).toHaveAttribute('data-viewing','true');
 await expect(page.getByTestId('debug-after')).toContainText('customerName');await expect(page.getByTestId('debug-after')).toContainText('Khách hàng mẫu Mai');
 await expect(page.getByTestId('debug-after')).toContainText('selected');await expect(page.getByTestId('debug-after')).toContainText('name');
 await advanceTo(page,'fill-rest');await expect(page.getByTestId('debug-branch')).toContainText('Trở về runInternal');
 await primary(page).click();await expect(header(page)).toHaveAttribute('data-checkpoint-id','fill-return');await expect(line(page,103)).toBeInViewport();
 await expect(page.getByTestId('source-handoff')).toContainText('Trả về nơi gọi');
 await expect(page.getByTestId('debug-after')).not.toContainText('policyCode');
 const reached=new URL(page.url()).searchParams.get('stop'),walk=new URL(page.url()).searchParams.get('walk');
 await inspect(page,'map-effective');await expect(header(page)).toHaveAttribute('data-checkpoint-id','map-effective');
 expect(new URL(page.url()).searchParams.get('stop')).toBe(reached);expect(new URL(page.url()).searchParams.get('walk')).toBe(walk);
 await returnToStop(page);await expect(header(page)).toHaveAttribute('data-checkpoint-id','fill-return');
 await expect(primary(page)).toBeInViewport();expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(mobile?390:1512);
});

test('six graph groups expand independently; Controller L45 leads to exec; viewing nodes never executes them',async({page})=>{
 await page.goto(root);await advanceTo(page,'internal-call');await button(page,'Luồng thực thi').click();
 for(const id of ['quote','validate','map','save','flow','result'])await expect(page.getByTestId(`trace-group-${id}`)).toBeAttached();
 const quote=page.getByTestId('trace-group-quote'),validate=page.getByTestId('trace-group-validate');
 await expect(validate.getByRole('button').first()).toHaveAttribute('aria-expanded','true');
 await quote.getByRole('button').first().click();await expect(quote.getByTestId('trace-node-controller')).toContainText('L45');
 await expect(validate).toContainText('Controller L45 → CreatePolicyFunc.exec L61');
 await expect(validate.getByTestId('trace-node-duplicate-data')).toContainText('L74');await expect(validate.getByTestId('trace-node-duplicate-data')).toContainText('L75');
 const stop=new URL(page.url()).searchParams.get('stop'),walk=new URL(page.url()).searchParams.get('walk');
 await page.getByTestId('trace-node-controller').getByRole('button').first().click();
 await expect(page.getByRole('dialog')).toBeVisible();await expect(header(page)).toHaveAttribute('data-checkpoint-id','controller-call');
 expect(new URL(page.url()).searchParams.get('stop')).toBe(stop);expect(new URL(page.url()).searchParams.get('walk')).toBe(walk);
 await button(page,'Điểm đang dừng').click();await expect(page.getByRole('dialog')).toBeVisible();await button(page,'Đóng bảng phụ').click();
 await expect(header(page)).toHaveAttribute('data-checkpoint-id','internal-call');await expect(line(page,67)).toBeInViewport();
});

for(const [quote,error,target,node] of [['QUOTE-NOT-FOUND','QUOTE_NOT_EXIST','quote-guard','missing'],['QUOTE-LEARN-103','QUOTE_CAN_NOT_RELEASE_POLICY','duplicate-guard','duplicate']] as const)
test(`actual ${error} branch stops without producing a Policy`,async({page})=>{
 await page.goto(root);await page.getByLabel('Quote mẫu',{exact:true}).selectOption(quote);await runThrough(page,target);
 await expect(page.getByTestId('create-failure')).toContainText(error);await expect(primary(page)).toBeDisabled();await expect(button(page,'Bước sau')).toBeDisabled();
 await button(page,'Luồng thực thi').click();await expect(page.getByTestId(`trace-node-${node}`)).toHaveAttribute('data-state','blocked');
 await expect(page.getByTestId(`trace-edge-${node==='missing'?'optional':'guard'}-${node}`)).toHaveAttribute('data-state','chosen');
 await button(page,'Đóng bảng phụ').click();await expect(page.getByTestId('checkpoint-variables')).not.toContainText('POL-FROM-');
 await expect(page.getByRole('navigation',{name:'Sáu bước phát hành trực tiếp'}).getByRole('button').nth(2)).toBeDisabled();
});

test('run through six stages, gate ID/view, then inspect an old node and restore current source, variables and progress',async({page})=>{
 await page.goto(root);await advanceTo(page,'save-apply');await expect(page.getByTestId('checkpoint-variables')).not.toContainText('POL-FROM-');
 await advanceTo(page,'save-id');await expect(page.getByTestId('debug-after')).toContainText('POL-FROM-QUOTE-LEARN-101');
 await advanceTo(page,'flow-guard');await expect(page.getByTestId('debug-after')).not.toContainText('PolicyView');
 await advanceTo(page,'flow-write');await expect(page.getByTestId('debug-after')).toContainText('PolicyView');
 await runThrough(page,'result-compare');await expect(page.getByTestId('debug-after')).toContainText('POL-FROM-QUOTE-LEARN-101');
 const walk=new URL(page.url()).searchParams.get('walk');
 await button(page,'Luồng thực thi').click();await page.getByTestId('trace-group-map').getByRole('button').first().click();
 await page.getByRole('button',{name:'Xem Gọi fillMissingValue L102',exact:true}).click();
 await expect(header(page)).toHaveAttribute('data-checkpoint-id','fill-call');await expect(line(page,102)).toBeInViewport();
 await expect(page.getByTestId('debug-after')).not.toContainText('customerName');
 expect(new URL(page.url()).searchParams.get('walk')).toBe(walk);expect(new URL(page.url()).searchParams.get('stop')).toBe('result-compare');
 await button(page,'Điểm đang dừng').click();await expect(page.getByRole('dialog')).toBeVisible();await button(page,'Đóng bảng phụ').click();
 await expect(header(page)).toHaveAttribute('data-checkpoint-id','result-compare');await expect(page.getByTestId('debug-after')).toContainText('POL-FROM-QUOTE-LEARN-101');
 await page.reload();await expect(header(page)).toHaveAttribute('data-checkpoint-id','result-compare');expect(new URL(page.url()).searchParams.get('walk')).toBe(walk);
});
