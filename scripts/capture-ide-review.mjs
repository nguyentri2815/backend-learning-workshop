import fs from 'node:fs';
import {chromium,expect} from '@playwright/test';
import {control,reach} from './policy-review-navigation.mjs';

const phase=process.argv[2]||'after';
const origin=process.env.PREVIEW_URL||'http://localhost:3182';
const browser=await chromium.launch({channel:process.env.WORKSHOP_BROWSER_CHANNEL||undefined});
const links={};
for(const mobile of [false,true]){
  const context=await browser.newContext({viewport:mobile?{width:390,height:844}:{width:1512,height:1050},isMobile:mobile,hasTouch:mobile});
  const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(origin+'/journey/policy?group=create&mode=steps&node=quote');
  await reach(page,'internal-enter');
  await expect(page.getByTestId('policy-debug')).toHaveAttribute('data-checkpoint-id','internal-enter');
  await expect(page.getByTestId('highlighted-code')).toHaveAttribute('data-ready','true');
  const frame=page.getByTestId('practice-workstation');
  await frame.evaluate(e=>e.scrollIntoView({block:'start'}));
  await page.screenshot({path:`docs/review/ide-${mobile?'mobile':'desktop'}-${phase}-L70.png`,animations:'disabled'});
  links.L70=page.url();
  if(phase==='after'){
    await expect(page.locator('.policy-practice-steps [aria-current=step]')).toContainText('2.');
    await expect(control(page,'Điểm sau')).toBeEnabled();
    await expect(page.getByTestId('policy-source').locator('[data-line="70"]')).toHaveAttribute('data-current','true');
    if(mobile){
      await page.getByTestId('policy-source').evaluate(e=>e.scrollIntoView({block:'center'}));
      await page.screenshot({path:'docs/review/ide-mobile-after-code-L70.png',animations:'disabled'});
    }
    await page.getByRole('button',{name:'Luồng thực thi',exact:true}).click();
    const dialog=page.getByRole('dialog',{name:'Luồng thực thi',exact:true});
    const current=dialog.locator('button[data-checkpoint-id="internal-enter"]');
    await expect(current).toBeInViewport();
    await page.screenshot({path:`docs/review/ide-${mobile?'mobile':'desktop'}-trace-L70.png`,animations:'disabled'});
    await dialog.getByRole('button',{name:'Xem toàn tuyến',exact:true}).click();
    const overlapping=await dialog.evaluate(element=>[...element.querySelectorAll('.trace-group-canvas')].some(group=>{
      const nodes=[...group.querySelectorAll('.practice-trace-node')].filter(node=>node.style.left==='14px').map(node=>node.getBoundingClientRect());
      return nodes.some((node,i)=>i>0&&node.top<nodes[i-1].bottom+8);
    }));
    if(overlapping)throw Error('Trace nodes overlap');
    await dialog.locator('button[data-checkpoint-id="internal-call"]').click();
    await expect(dialog).toBeVisible();
    await expect(page.getByTestId('policy-debug')).toHaveAttribute('data-checkpoint-id','internal-call');
    await dialog.getByRole('button',{name:'Đóng bảng phụ'}).click();
    await frame.evaluate(e=>e.scrollIntoView({block:'start'}));
    links.review=page.url();
    await expect(page.getByTestId('policy-source').locator('[data-line="67"]')).toHaveAttribute('data-viewing','true');
    await expect(page.getByTestId('policy-source').locator('[data-line="70"]')).toHaveAttribute('data-current','true');
    await page.screenshot({path:`docs/review/ide-${mobile?'mobile':'desktop'}-review-L67.png`,animations:'disabled'});
    await page.getByRole('button',{name:'Network',exact:true}).click();
    await expect(page.getByRole('dialog',{name:'Network',exact:true})).toContainText('Đang xử lý');
    await page.screenshot({path:`docs/review/ide-${mobile?'mobile':'desktop'}-network.png`,animations:'disabled'});
    await page.getByRole('button',{name:'Đóng bảng phụ'}).click();
    const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth);
    if(overflow)throw Error('Page overflows viewport');
    await control(page,'Quay về dòng đang chạy').click();
    await control(page,'Điểm sau').click();
    await expect(page.getByTestId('policy-debug')).toHaveAttribute('data-checkpoint-id','duplicate-read');
    await expect(page.getByTestId('debug-after').locator('[data-changed=true]').first()).toBeVisible();
    await (mobile?page.getByTestId('debug-after'):frame).evaluate(e=>e.scrollIntoView({block:'start'}));
    await page.screenshot({path:`docs/review/ide-${mobile?'mobile':'desktop'}-changed-L74.png`,animations:'disabled'});
  }
  if(errors.length)throw Error(errors.join('\n'));
  await context.close();
}
for(const value of Object.values(links)){
  const url=new URL(value);for(const key of ['follow','opened'])url.searchParams.delete(key);
  for(const [key,original] of Object.entries(links))if(original===value)links[key]=url.toString();
}
if(phase==='after'){
  const context=await browser.newContext({viewport:{width:1512,height:1050}});
  const page=await context.newPage();
  for(const [name,path] of [['overview','/'],['setup','/journey/environment']]){
    await page.goto(origin+path);
    await expect(page.locator('.sidebar')).toHaveCSS('background-color','rgb(16, 27, 45)');
    if(name==='setup')await expect(page.locator('.practice-loading')).toHaveCount(0);
    await page.screenshot({path:`docs/review/ide-${name}.png`,animations:'disabled'});
  }
  await context.close();
}
fs.writeFileSync(`docs/review/ide-${phase}-links.json`,JSON.stringify(links,null,2)+'\n');
await browser.close();
