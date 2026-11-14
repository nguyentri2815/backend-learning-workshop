import {chromium,expect} from '@playwright/test';
import fs from 'node:fs';
const base=process.env.PREVIEW_URL??'http://localhost:3182';
const browser=await chromium.launch();
const links={overview:`${base}/journey/policy?group=list&mode=overview`,steps:`${base}/journey/policy?group=list&mode=steps`,assembly:`${base}/journey/policy?group=list&mode=assembly&node=list-scope`,pattern:`${base}/journey/policy?group=list&mode=assembly&node=list-scope&listAssembly.scope=pattern&listPart.scope=handoff-2`,implementation:`${base}/journey/policy?group=list&mode=assembly&node=list-scope&listAssembly.scope=pattern&listDiagram=1&listDiagramMode=practice`};
const observations=[];
for(const mobile of [false,true])for(const dark of [false,true]){
 const context=await browser.newContext({viewport:mobile?{width:390,height:844}:{width:1440,height:1000},deviceScaleFactor:1});
 const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 for(const mode of ['overview','steps','assembly'])for(const group of ['create','list']){
  await page.goto(`${base}/journey/policy?group=${group}&mode=${mode}`);
  if(dark&&await page.getByRole('button',{name:'Giao diện tối',exact:true}).getAttribute('aria-pressed')!=='true')await page.getByRole('button',{name:'Giao diện tối',exact:true}).click();
  await page.locator(group==='list'?'.policy-list-lesson':mode==='overview'?'.policy-creation-overview':mode==='assembly'?'.assembly-learning':'.policy-practice-station').waitFor();
  await page.evaluate(async()=>{await document.fonts.ready;});
  if(mode==='overview')await page.locator('.react-flow__viewport').first().waitFor({state:'attached'});
  await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
  const name=`list-redesign-${group}-${mode}${mobile?'-mobile':''}${dark?'-dark':''}.png`;
  await page.screenshot({path:`docs/review/${name}`,animations:'disabled'});
  expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(mobile?390:1440);
  observations.push({group,mode,mobile,dark,zoom:await page.evaluate(()=>window.devicePixelRatio),image:name});
 }
 if(!mobile&&!dark){
  await page.goto(links.pattern);await expect(page.locator('.list-frames>section')).toHaveCount(2);
  await expect(page.locator('.list-frames .assembly-frame [data-testid=highlighted-code][data-ready=true]')).toHaveCount(2);
  await page.locator('.list-frames').scrollIntoViewIfNeeded();await page.screenshot({path:'docs/review/list-redesign-pattern.png'});
  await page.getByRole('button',{name:'Xem sơ đồ liên quan',exact:true}).click();await page.getByRole('dialog').getByRole('tab',{name:'Từng bước triển khai',exact:true}).click();
  await expect(page.getByRole('dialog').locator('.list-build-task')).toBeVisible();
  await page.getByRole('dialog').getByRole('button',{name:'Chỉ vị trí',exact:true}).click();
  await expect(page.getByRole('dialog').locator('.list-build-code [data-testid=highlighted-code]')).toHaveAttribute('data-ready','true');
  await page.screenshot({path:'docs/review/list-redesign-implementation.png'});
 }
 expect(errors).toEqual([]);await context.close();
}
fs.writeFileSync('docs/review/list-redesign-links.json',JSON.stringify({links,viewport:{width:1440,height:1000},zoom:'100%',observations},null,2)+'\n');
await browser.close();console.log('Captured 24 Create/List comparisons, frames and implementation; no page errors or page overflow.');
