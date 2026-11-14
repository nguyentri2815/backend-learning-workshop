import fs from 'node:fs';
import {chromium,expect} from '@playwright/test';
import {reach} from './policy-review-navigation.mjs';

const browser=await chromium.launch({channel:process.env.WORKSHOP_BROWSER_CHANNEL||undefined});
const origin=process.env.PREVIEW_URL||'http://localhost:3182';
const links={};
for(const mobile of [false,true]){
  const context=await browser.newContext({viewport:mobile?{width:390,height:844}:{width:1512,height:1050},isMobile:mobile,hasTouch:mobile});
  const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(origin+'/journey/policy?group=create&mode=steps&node=quote');
  await reach(page,'map-dates');
  await page.getByRole('navigation',{name:'Sáu bước phát hành trực tiếp'}).getByRole('button').nth(1).click();
  await expect(page.getByTestId('policy-debug')).toHaveAttribute('data-checkpoint-id','quote-read');
  await expect(page.getByTestId('highlighted-code')).toHaveAttribute('data-ready','true');
  const frame=page.getByTestId('practice-workstation');
  await frame.evaluate(e=>{const top=parseFloat(getComputedStyle(e.querySelector('.practice-workbench-toolbar')).top)||0;window.scrollTo({top:scrollY+e.getBoundingClientRect().top-top+1,behavior:'instant'});});
  const toolbar=page.locator('.practice-workbench-toolbar');
  await expect(toolbar).toHaveAttribute('data-pinned','true');
  await expect(toolbar).toHaveAttribute('data-expanded','false');
  await expect(page.getByRole('button',{name:'Điểm sau',exact:true})).toBeEnabled();
  await expect(page.locator('.checkpoint-positions')).toContainText('L61');
  await expect(page.locator('.checkpoint-positions')).toContainText('L80');
  links.review=page.url();
  await page.screenshot({path:`docs/review/reader-${mobile?'mobile':'desktop'}-compact-light-L61-stop-L80.png`,animations:'disabled'});
  await page.getByRole('button',{name:'Mở chi tiết',exact:true}).click();
  await expect(toolbar).toHaveAttribute('data-expanded','true');
  await page.screenshot({path:`docs/review/reader-${mobile?'mobile':'desktop'}-expanded-light-L61-stop-L80.png`,animations:'disabled'});
  await page.getByRole('combobox',{name:'Giao diện workspace code',exact:true}).selectOption('dark');
  await expect(page.getByTestId('highlighted-code')).toHaveAttribute('data-syntax-theme','dark');
  await page.screenshot({path:`docs/review/reader-${mobile?'mobile':'desktop'}-expanded-dark-L61-stop-L80.png`,animations:'disabled'});
  await page.getByRole('button',{name:'Thu gọn',exact:true}).click();
  await page.screenshot({path:`docs/review/reader-${mobile?'mobile':'desktop'}-compact-dark-L61-stop-L80.png`,animations:'disabled'});
  await page.reload();await expect(frame).toHaveAttribute('data-code-theme','dark');
  await expect(page.getByTestId('highlighted-code')).toHaveAttribute('data-syntax-theme','dark');
  await expect(page.getByTestId('policy-debug')).toHaveAttribute('data-checkpoint-id','quote-read');
  if(errors.length)throw Error(errors.join('\n'));
  await context.close();
}
for(const key of Object.keys(links)){const url=new URL(links[key]);url.searchParams.delete('follow');url.searchParams.delete('opened');links[key]=url.toString();}
fs.writeFileSync('docs/review/reader-preferences-links.json',JSON.stringify(links,null,2)+'\n');
await browser.close();
