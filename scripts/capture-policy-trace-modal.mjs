import fs from 'node:fs';
import {chromium,expect} from '@playwright/test';
const browser=await chromium.launch({channel:process.env.WORKSHOP_BROWSER_CHANNEL||undefined});
const origin=process.env.PREVIEW_URL||'http://localhost:3182';
const urls={};
for(const mobile of [false,true]){
 const context=await browser.newContext({viewport:mobile?{width:390,height:844}:{width:1512,height:1050},hasTouch:mobile,isMobile:mobile});
 const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
 for(const [stage,id,node,name] of [['map','status-return','status-return','step3-L87'],['result','detail-read','detail','step6']]){
  const params=new URLSearchParams({group:'create',mode:'steps',node:stage,walk:'quote-ui,quote-request,controller-call,quote-read',stop:'quote-read',at:id});
  await page.goto(`${origin}/journey/policy?${params}`);await expect(page.getByTestId('highlighted-code')).toHaveAttribute('data-ready','true');
  await page.getByTestId('practice-workstation').evaluate(e=>e.scrollIntoView({block:'start'}));
  const position=await page.evaluate(()=>({x:scrollX,y:scrollY}));urls[name]=page.url();
  await page.getByRole('button',{name:'Luồng thực thi',exact:true}).click();
  const target=page.getByTestId(`trace-node-${node}`);
  await expect(target).toBeInViewport({ratio:1});await expect(target.locator(`button[data-checkpoint-id="${id}"]`)).toBeInViewport({ratio:1});
  await expect(target).toHaveAttribute('data-viewing','true');
  expect(await page.evaluate(()=>({x:scrollX,y:scrollY}))).toEqual(position);
  await page.screenshot({path:`docs/review/policy-trace-modal-${mobile?'mobile':'desktop'}-${name}.png`,animations:'disabled'});
  await page.getByRole('button',{name:'Điểm đang dừng',exact:true}).click();
  await expect(page.getByTestId('trace-node-read')).toBeInViewport({ratio:1});
  await expect(page.getByRole('dialog')).toBeVisible();
  expect(await page.evaluate(()=>({x:scrollX,y:scrollY}))).toEqual(position);
  if(stage==='map')await page.screenshot({path:`docs/review/policy-trace-modal-${mobile?'mobile':'desktop'}-stop-L61.png`,animations:'disabled'});
  await page.keyboard.press('Escape');
 }
 if(errors.length)throw Error(errors.join('\n'));
 await context.close();
}
fs.writeFileSync('docs/review/policy-trace-modal-links.json',JSON.stringify(urls,null,2)+'\n');
await browser.close();
