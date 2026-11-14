import fs from 'node:fs';
import {chromium,expect} from '@playwright/test';
import {control,reach} from './policy-review-navigation.mjs';
const browser=await chromium.launch({channel:process.env.WORKSHOP_BROWSER_CHANNEL||undefined});
const origin=process.env.PREVIEW_URL||'http://localhost:3182';
const urls={};
for(const mobile of [false,true]){
 const context=await browser.newContext({viewport:mobile?{width:390,height:844}:{width:1512,height:1050},hasTouch:mobile,isMobile:mobile});
 const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(origin+'/journey/policy?group=create&mode=steps&node=quote');await reach(page,'duplicate-guard');
 await control(page,'Điểm trước').click();await expect(page.getByTestId('policy-debug')).toHaveAttribute('data-checkpoint-id','objects-read');
 await expect(page.getByTestId('highlighted-code')).toHaveAttribute('data-ready','true');
 await page.getByTestId('practice-workstation').evaluate(e=>e.scrollIntoView({block:'start'}));
 urls.step2=page.url();
 await page.screenshot({path:`docs/review/policy-navigation-${mobile?'mobile':'desktop'}-step2.png`,animations:'disabled'});
 await control(page,'Điểm sau').click();await expect(page.getByTestId('policy-debug')).toHaveAttribute('data-checkpoint-id','duplicate-guard');
 await control(page,'Bước sau').click();await expect(page.getByTestId('policy-debug')).toHaveAttribute('data-checkpoint-id','map-dates');
 await expect(page.getByTestId('highlighted-code')).toHaveAttribute('data-ready','true');
 await expect(page.getByTestId('source-handoff')).toContainText('L76 → L80');
 await page.getByTestId('practice-workstation').evaluate(e=>e.scrollIntoView({block:'start'}));
 urls.step3=page.url();
 await page.screenshot({path:`docs/review/policy-navigation-${mobile?'mobile':'desktop'}-L80.png`,animations:'disabled'});
 if(errors.length)throw Error(errors.join('\n'));
 await context.close();
}
for(const key of Object.keys(urls)){const url=new URL(urls[key]);for(const field of ['follow','opened'])url.searchParams.delete(field);urls[key]=url.toString();}
fs.writeFileSync('docs/review/policy-navigation-links.json',JSON.stringify(urls,null,2)+'\n');
await browser.close();
