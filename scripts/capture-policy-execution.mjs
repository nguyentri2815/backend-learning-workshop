import fs from 'node:fs';
import {chromium,expect} from '@playwright/test';
import {reach} from './policy-review-navigation.mjs';
const browser=await chromium.launch({channel:process.env.WORKSHOP_BROWSER_CHANNEL||undefined});
const origin=process.env.PREVIEW_URL||'http://localhost:3182';
const urls={};
for(const mobile of [false,true]){
 const context=await browser.newContext({viewport:mobile?{width:390,height:844}:{width:1512,height:1350},hasTouch:mobile,isMobile:mobile});
 const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(origin+'/journey/policy?group=create&mode=steps&node=quote');await reach(page,'internal-call');
 await expect(page.getByTestId('highlighted-code')).toHaveAttribute('data-ready','true');
 urls.step2=page.url();await page.getByRole('button',{name:'Luồng thực thi',exact:true}).click();
 if(!mobile)await page.getByTestId('trace-group-quote').getByRole('button').first().click();
 await page.locator('.practice-trace-scroll').evaluate(e=>{e.scrollTop=0;});
 await page.screenshot({path:`docs/review/policy-execution-${mobile?'mobile':'desktop'}-step2-graph.png`,animations:'disabled'});
 await page.getByRole('button',{name:'Đóng bảng phụ',exact:true}).click();
 await reach(page,'fill-call');await expect(page.getByTestId('debug-branch')).toContainText('Vào fillMissingValue');
 await expect(page.getByTestId('highlighted-code')).toHaveAttribute('data-ready','true');
 await page.getByTestId('practice-workstation').evaluate(e=>e.scrollIntoView({block:'start'}));
 urls.fillCall=page.url();
 await page.screenshot({path:`docs/review/policy-execution-${mobile?'mobile':'desktop'}-L102.png`,animations:'disabled'});
 if(errors.length)throw Error(errors.join('\n'));
 await context.close();
}
for(const key of Object.keys(urls)){const url=new URL(urls[key]);for(const field of ['follow','opened','reader'])url.searchParams.delete(field);urls[key]=url.toString();}
fs.writeFileSync('docs/review/policy-execution-links.json',JSON.stringify(urls,null,2)+'\n');
await browser.close();
