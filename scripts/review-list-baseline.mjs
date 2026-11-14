import {chromium,expect} from '@playwright/test';
import fs from 'node:fs';
const browser=await chromium.launch();
const page=await browser.newPage({viewport:{width:1440,height:1000}});
page.setDefaultTimeout(7000);
const observations=[];
for(const mode of ['overview','steps','assembly']){
 await page.goto('http://localhost:3182/journey/policy?group=create&mode='+mode);
 await page.locator(mode==='overview'?'.policy-creation-overview':mode==='steps'?'.policy-practice-station':'.assembly-learning').waitFor();
 await page.screenshot({path:`docs/review/list-redesign-create-${mode}.png`});
 observations.push({mode,headings:await page.locator('h2,h3').allTextContents(),navigation:await page.locator('nav[aria-label]').evaluateAll(es=>es.map(e=>e.getAttribute('aria-label')))});
 if(mode==='overview'){
  await page.getByRole('button',{name:'Thực hành bước tạo Policy',exact:true}).count().then(async n=>{if(n)await page.getByRole('button',{name:'Thực hành bước tạo Policy',exact:true}).click();});
 }
 if(mode==='steps'){
  for(let i=0;i<25;i++){
   if(await page.locator('.learning-steps button').nth(2).isEnabled())break;
   const next=page.locator('.practice-dock-buttons button').nth(2);
   if(await next.isEnabled())await next.click();else await page.locator('.practice-dock-buttons button').nth(3).click();
   await page.waitForTimeout(100);
  }
  await page.locator('.checkpoint-details-toggle').click();
  observations.push({checkpoints:await page.locator('[aria-label="Điểm đang xem"] option').allTextContents(),buttons:await page.locator('.practice-dock-buttons button').allTextContents()});
  await page.locator('.learning-steps button').nth(2).click();
  await expect(page.locator('[data-testid="checkpoint-editor"] [data-testid="highlighted-code"]')).toHaveAttribute('data-ready','true');
  observations.push({source:await page.locator('[data-testid="checkpoint-editor"]').innerText()});
 }
 if(mode==='assembly'){
  await page.locator('.assembly-choice-options input').first().click();
  await expect.poll(()=>new URL(page.url()).searchParams.get('assemblyAnswers.quote')).toBe('0,');
  await page.locator('.assembly-decision-toolbar nav button').nth(1).click();
  await expect(page.locator('.assembly-question')).not.toHaveAttribute('data-decision','receive');
  await page.locator('.assembly-choice-options input').first().click();
  await expect.poll(()=>new URL(page.url()).searchParams.get('assemblyAnswers.quote')).toBe('0,0');
  for(const name of ['Phối hợp','Chọn mẫu']){
   await page.getByRole('tab',{name,exact:true}).click();
   await expect(page.getByRole('tab',{name,exact:true})).toHaveAttribute('aria-selected','true');
   observations.push({view:name,headings:await page.locator('h2,h3,h4').allTextContents(),buttons:await page.locator('.assembly-learning button').allTextContents()});
  }
  await page.getByRole('tab',{name:'KHUNG THÀNH PHẦN',exact:true}).click();
  await page.getByRole('button',{name:'Xem sơ đồ liên quan',exact:true}).first().click();
  await page.getByRole('tab',{name:'Từng bước triển khai',exact:true}).click();
  await expect(page.getByRole('dialog').locator('.implementation-practice')).toBeVisible();
  observations.push({implementation:await page.getByRole('dialog').innerText()});
 }
}
fs.writeFileSync('docs/review/list-redesign-baseline.json',JSON.stringify(observations,null,2));
console.log(observations.map(o=>({mode:o.mode,view:o.view,headings:o.headings,navigation:o.navigation,implementation:o.implementation?.slice(0,600)})));
await browser.close();
