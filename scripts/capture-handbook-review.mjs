import fs from 'node:fs';
import {chromium,expect} from '@playwright/test';
import {reach} from './policy-review-navigation.mjs';
const phase=process.argv[2]||'after';
const origin=process.env.PREVIEW_URL||'http://localhost:3182';
const browser=await chromium.launch({channel:process.env.WORKSHOP_BROWSER_CHANNEL||undefined});
const links={};
for(const mobile of [false,true]){
  const context=await browser.newContext({viewport:mobile?{width:390,height:844}:{width:1512,height:1050},isMobile:mobile,hasTouch:mobile});
  const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(origin+'/journey/environment?experience=project&step=tools&task=java&pfile=build&pline=48&pview=source');
  await expect(page.locator('.practice-loading')).toHaveCount(0);
  await expect(page.getByTestId('highlighted-code')).toHaveAttribute('data-ready','true');
  await page.evaluate(()=>window.scrollTo(0,0));
  links.F1=page.url();
  await page.screenshot({path:`docs/review/handbook-${mobile?'mobile':'desktop'}-${phase}-F1.png`,animations:'disabled'});
  if(phase==='after'){
    if(mobile)await page.locator('.practice-center').scrollIntoViewIfNeeded();
    await expect(page.locator('.practice-code [data-line="48"]')).toBeInViewport();
    if(mobile)await page.screenshot({path:'docs/review/handbook-mobile-after-F1-code.png',animations:'disabled'});
  }
  await page.goto(origin+'/journey/policy?group=create&mode=steps&node=quote');
  await reach(page,'save-return');
  await expect(page.getByTestId('policy-debug')).toHaveAttribute('data-checkpoint-id','save-return');
  await expect(page.getByTestId('highlighted-code')).toHaveAttribute('data-ready','true');
  const close=page.getByRole('button',{name:'Thu gọn',exact:true});if(await close.isVisible())await close.click();
  await page.locator('.policy-practice-title').evaluate(e=>{
    const nav=document.querySelector('.notebook-header');
    window.scrollTo({top:scrollY+e.getBoundingClientRect().top-(nav?nav.getBoundingClientRect().height+18:24),behavior:'instant'});
  });
  links.L159=page.url();
  await page.screenshot({path:`docs/review/handbook-${mobile?'mobile':'desktop'}-${phase}-L159.png`,animations:'disabled'});
  if(phase==='after'){
    await expect(page.getByTestId('policy-source').locator('[data-line="159"]')).toBeInViewport();
    await page.getByRole('button',{name:'Luồng thực thi',exact:true}).click();
    await expect(page.getByRole('dialog',{name:'Luồng thực thi'})).toBeVisible();
    await expect(page.getByTestId('trace-node-return')).toBeInViewport();
    await page.screenshot({path:`docs/review/handbook-${mobile?'mobile':'desktop'}-trace-L159.png`,animations:'disabled'});
    await page.getByRole('button',{name:'Đóng bảng phụ',exact:true}).click();
    await page.getByRole('combobox',{name:'Giao diện workspace code',exact:true}).selectOption('dark');
    await expect(page.getByTestId('highlighted-code')).toHaveAttribute('data-syntax-theme','dark');
    await page.screenshot({path:`docs/review/handbook-${mobile?'mobile':'desktop'}-dark-L159.png`,animations:'disabled'});
  }
  if(errors.length)throw Error(errors.join('\n'));
  await context.close();
}
for(const key of Object.keys(links)){const url=new URL(links[key]);url.searchParams.delete('follow');url.searchParams.delete('opened');links[key]=url.toString();}
fs.writeFileSync(`docs/review/handbook-${phase}-links.json`,JSON.stringify(links,null,2)+'\n');
await browser.close();
