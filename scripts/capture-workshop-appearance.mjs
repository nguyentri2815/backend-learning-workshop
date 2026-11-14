import fs from 'node:fs';
import {chromium,expect} from '@playwright/test';
const base=process.env.PREVIEW_URL||'http://localhost:3182';
const urls={profile:base+'/journey/environment?experience=project&step=config&task=profile&pfile=dev&pline=33&pview=source',policy:base+'/journey/policy?group=create&mode=steps&node=save&sim=command&stop=save-return&at=save-return&reader=context&backend=1&sentQuote=QUOTE-LEARN-101'};
const links={};
const browser=await chromium.launch({channel:process.env.WORKSHOP_BROWSER_CHANNEL||undefined});
for(const mobile of [false,true]){
 const context=await browser.newContext({viewport:mobile?{width:390,height:844}:{width:1512,height:1050},isMobile:mobile,hasTouch:mobile});
 const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
 for(const [screen,url] of Object.entries(urls)){
  await page.goto(url);
  await expect(page.getByTestId('highlighted-code').first()).toHaveAttribute('data-ready','true');
  if(screen==='profile'){const dev=page.getByRole('radio',{name:'Chọn dev trong bài thực hành',exact:true});await dev.click();await expect(dev).toBeChecked();}
  for(const theme of ['light','dark']){
   await page.getByRole('button',{name:theme==='light'?'Giao diện sáng':'Giao diện tối',exact:true}).click();
   for(const code of await page.getByTestId('highlighted-code').all())await expect(code).toHaveAttribute('data-syntax-theme',theme);
   if(screen==='profile'){
    if(mobile)await page.locator('.practice-compare').scrollIntoViewIfNeeded();
    else await page.evaluate(()=>window.scrollTo(0,0));
   }else await page.locator('.policy-practice-title').evaluate(e=>window.scrollTo({top:scrollY+e.getBoundingClientRect().top-document.querySelector('.notebook-header').getBoundingClientRect().height-18,behavior:'instant'}));
   await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
   await page.screenshot({path:`docs/review/appearance-${mobile?'mobile':'desktop'}-${screen}-${theme}.png`,animations:'disabled'});
  }
  if(screen==='profile'&&mobile){
   await page.evaluate(()=>window.scrollTo(0,0));await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));await page.screenshot({path:'docs/review/appearance-mobile-profile-dark-steps.png',animations:'disabled'});
  }
  if(screen==='policy'){
   await page.getByRole('combobox',{name:'Giao diện workspace code',exact:true}).selectOption('light');await expect(page.getByTestId('highlighted-code')).toHaveAttribute('data-syntax-theme','light');
   await page.screenshot({path:`docs/review/appearance-${mobile?'mobile':'desktop'}-policy-editor-light.png`,animations:'disabled'});
   await page.getByRole('combobox',{name:'Giao diện workspace code',exact:true}).selectOption('system');await expect(page.getByTestId('highlighted-code')).toHaveAttribute('data-syntax-theme','dark');
   await page.getByRole('button',{name:'Luồng thực thi',exact:true}).click();await expect(page.getByTestId('trace-node-return')).toBeInViewport();
   await page.screenshot({path:`docs/review/appearance-${mobile?'mobile':'desktop'}-trace-dark.png`,animations:'disabled'});
  }
  links[screen]=page.url();
 }
 if(errors.length)throw new Error(errors.join('\n'));
 await context.close();
}
fs.writeFileSync('docs/review/appearance-links.json',JSON.stringify(links,null,2)+'\n');
await browser.close();
