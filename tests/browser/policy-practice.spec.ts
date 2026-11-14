import {expect,test} from '@playwright/test';
import {advanceTo,button,header,primary,route,runThrough,openCheckpointDetails} from './execution-helpers';

test('Quote starts before request; publish and backend entry preserve the same quoteId',async({page})=>{
 await page.goto(route);await expect(page.getByTestId('practice-quote-id')).toHaveText('QUOTE-LEARN-101');await expect(page.getByTestId('policy-source')).toHaveCount(0);await expect(page.getByTestId('debug-after')).toContainText('Chưa chạy');
 await primary(page).click();await expect(page.getByTestId('create-network')).toHaveAttribute('data-state','pending');await expect(page.getByTestId('create-network')).toContainText('POST /policy/create/QUOTE-LEARN-101');await expect(page.getByTestId('policy-source')).toHaveCount(0);
 await primary(page).click();await expect(header(page)).toHaveAttribute('data-checkpoint-id','controller-call');await expect(page.getByTestId('policy-source')).toHaveAttribute('data-source-id','create-api');
 await expect(page.getByTestId('policy-source').locator('[data-line="43"]')).toHaveAttribute('data-executed','false');
});
for(const mobile of [false,true])test(`${mobile?'mobile':'desktop'} full run keeps one Policy ID, Query/Command results and no real API calls`,async({page})=>{
 if(mobile)await page.setViewportSize({width:390,height:844});const calls:string[]=[];page.on('request',r=>{if(/^\/(policy|quote)\//.test(new URL(r.url()).pathname))calls.push(r.url());});await page.goto(route);
 await runThrough(page,'result-compare');await expect(page.getByTestId('created-direct-detail')).toContainText('POL-FROM-QUOTE-LEARN-101');await expect(page.getByTestId('created-search')).toContainText('POL-FROM-QUOTE-LEARN-101');
 await expect(page.getByTestId('created-policy-result')).toContainText('POL-FROM-QUOTE-LEARN-101');
 await expect(page.getByTestId('create-network')).toHaveAttribute('data-state','complete');
 await expect(page.getByRole('navigation',{name:'Sáu bước phát hành trực tiếp'}).getByRole('button').last()).toContainText('đã hoàn thành');
 expect(calls).toEqual([]);await page.reload();await expect(header(page)).toHaveAttribute('data-checkpoint-id','result-compare');
});
for(const q of ['QUOTE-NOT-FOUND','QUOTE-LEARN-103'])test(`blocked ${q} can retry without carrying Policy or checkpoint history`,async({page})=>{
 await page.goto(route);await page.getByLabel('Quote mẫu',{exact:true}).selectOption(q);await runThrough(page,q==='QUOTE-NOT-FOUND'?'quote-guard':'duplicate-guard');
 await expect(page.locator('.checkpoint-summary h3')).toContainText('Lỗi');await expect(page.locator('.checkpoint-summary h3')).toHaveCSS('color','rgb(165, 45, 45)');
 await openCheckpointDetails(page);await button(page,'Đổi sang Quote hợp lệ để thử lại').click();
 await expect(page.getByTestId('practice-quote-id')).toHaveText('QUOTE-LEARN-101');expect(new URL(page.url()).searchParams.has('walk')).toBe(false);await expect(page.getByTestId('create-network')).toHaveCount(0);
 await advanceTo(page,'quote-read');await expect(page.getByTestId('debug-before')).toContainText('Chưa gán');await expect(page.getByTestId('debug-after')).toContainText('Chưa chạy');
});
