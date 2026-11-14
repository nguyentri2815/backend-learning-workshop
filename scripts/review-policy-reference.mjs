import {chromium,expect} from '@playwright/test';
import fs from 'node:fs';
const browser=await chromium.launch();
const page=await browser.newPage({viewport:{width:1440,height:1000},deviceScaleFactor:1});
page.setDefaultTimeout(10000);
const root='http://localhost:3182/journey/policy?group=create',observations=[];
async function capture(name){await page.evaluate(async()=>{await document.fonts.ready;});await page.screenshot({path:`docs/review/shared-reference-${name}.png`});observations.push({name,url:page.url(),headings:await page.locator('h2,h3,h4').allTextContents()});}
await page.goto(root+'&mode=overview');await page.getByTestId('issuance-map').waitFor();await capture('overview');
await page.getByRole('button',{name:'2A Phát hành trực tiếp',exact:true}).click();await expect(page.getByTestId('issuance-map-detail')).toBeVisible();
await page.getByRole('button',{name:'Làm lại từng bước',exact:true}).click();
await page.goto(root+'&mode=steps&node=validate&quote=QUOTE-LEARN-101&sentQuote=QUOTE-LEARN-101&backend=1&debugVersion=2&tree=1');
await expect(page.getByTestId('policy-source').locator('[data-line="61"]')).toBeVisible();
await page.getByTestId('practice-workstation').evaluate(el=>el.scrollIntoView({block:'start',behavior:'instant'}));await capture('checkpoint');
await page.getByRole('button',{name:'Mở chi tiết',exact:true}).click();await expect(page.getByTestId('checkpoint-details')).toBeVisible();
await page.goto(root+'&mode=assembly&assemblyStep=validate');await page.locator('.assembly-question').waitFor();await capture('reason');
for(let i=0;i<2;i++){
 await page.getByRole('navigation',{name:'Tiến trình quyết định'}).getByRole('button').nth(i).click();
 await page.locator('.assembly-choice-options input').first().click();
 await expect.poll(()=>new URL(page.url()).searchParams.get('assemblyAnswers.validate')?.split(',')[i]).toBe('0');
}
await page.getByRole('tab',{name:'Phối hợp',exact:true}).click();await page.locator('.assembly-handoff').waitFor();await capture('cooperate');
await page.getByRole('button',{name:'Xem mẫu thiết kế',exact:true}).click();await page.locator('.assembly-pattern-workspace').first().waitFor();await expect(page.locator('.assembly-pair-frames .assembly-frame [data-ready=true]')).toHaveCount(2);await capture('pattern');
await page.locator('.assembly-pattern-inspector').evaluate(el=>el.scrollIntoView({block:'start',behavior:'instant'}));await capture('pattern-code');
await page.getByRole('button',{name:'Xem sơ đồ phối hợp',exact:true}).click();await page.getByRole('dialog').waitFor();await capture('diagram');
await page.getByRole('dialog').getByRole('tab',{name:'Từng bước triển khai',exact:true}).click();const practice=page.getByRole('dialog').locator('.implementation-practice');await practice.waitFor();
await practice.getByRole('button',{name:'QuoteRepository.java',exact:true}).click();await practice.getByRole('button',{name:'Mở repository',exact:true}).click();await page.getByRole('dialog').getByRole('button',{name:'Tiếp theo',exact:true}).click();await practice.getByRole('button',{name:'Chỉ vị trí',exact:true}).click();await practice.getByRole('combobox',{name:'Chọn thao tác'}).selectOption('quoteRepository.findById(quoteId)');await practice.getByRole('button',{name:'Thêm lời gọi',exact:true}).click();await expect(practice.locator('.implementation-diff')).toBeVisible();await practice.locator('.implementation-diff').scrollIntoViewIfNeeded();await capture('implementation');
fs.writeFileSync('docs/review/shared-reference-observations.json',JSON.stringify(observations,null,2)+'\n');
await browser.close();console.log('Inspected overview, L61/tree/details, step 2 reasoning/cooperation/pattern and both dialog modes.');
