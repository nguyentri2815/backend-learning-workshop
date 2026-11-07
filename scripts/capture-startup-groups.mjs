import {chromium,expect} from '@playwright/test';
import {writeFile} from 'node:fs/promises';
const prefix=process.argv[2]??'.verification/startup-groups',captures=[];
const browser=await chromium.launch({channel:process.env.WORKSHOP_BROWSER_CHANNEL||undefined,headless:true});
const page=await browser.newPage({viewport:{width:1680,height:1100},deviceScaleFactor:1});
const region=page.getByRole('region',{name:'Thực hành trên project tái dựng',exact:true});
const button=name=>region.getByRole('button',{name,exact:true});
const state=()=>JSON.parse(new URL(page.url()).searchParams.get('psim')??'{}');
try{
 await page.goto('http://localhost:3182/journey/environment?experience=project&task=startup');
 const status=state();if(status.process==='running'||status.commandSession?.playback?.playing)await button('Stop Command').click();
 await region.getByLabel('Phiên log startup').selectOption('recorded-failure');await button('Run cạnh main').click();
 await expect.poll(()=>state().commandSession?.playback?.frame,{intervals:[50,100]}).toBeGreaterThanOrEqual(10);await button('Tạm dừng').click();await expect.poll(()=>state().commandSession.playback.paused).toBe(true);
 await region.getByRole('navigation',{name:'Nhóm hoạt động startup'}).getByRole('button',{name:/Repository, JPA, DB/}).click();
 await region.locator('.startup-console [data-startup-line="19146"]').scrollIntoViewIfNeeded();
 await page.mouse.move(0,0);await page.evaluate(()=>window.scrollTo(0,0));await page.screenshot({path:`${prefix}-initializing.png`,fullPage:true,animations:'disabled'});captures.push({group:'data',url:page.url(),path:`${prefix}-initializing.png`});
 await button('Tiếp tục').click();await expect.poll(()=>state().commandSession.playback.playing,{timeout:15000}).toBe(false);
 await region.getByRole('navigation',{name:'Nhóm hoạt động startup'}).getByRole('button',{name:/Kết quả & nguyên nhân/}).click();await expect(region.locator('.startup-root-cause')).toBeVisible();
 await page.mouse.move(0,0);await page.evaluate(()=>window.scrollTo(0,0));await page.screenshot({path:`${prefix}-failure.png`,fullPage:true,animations:'disabled'});captures.push({group:'outcome',url:page.url(),path:`${prefix}-failure.png`});
 await writeFile(`${prefix}-review.json`,JSON.stringify(captures,null,2)+'\n');
 console.log('Captured initializing and evidenced startup failure (full page).');
}finally{await browser.close();}
