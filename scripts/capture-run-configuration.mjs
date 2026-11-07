import {chromium,expect} from '@playwright/test';
import source from '../src/content/setup/practice-runtime-source.json' with {type:'json'};
const browser=await chromium.launch({channel:process.env.WORKSHOP_BROWSER_CHANNEL||undefined,headless:true});
try{
 const page=await browser.newPage({viewport:{width:1512,height:1050}}),errors=[];
 page.on('pageerror',error=>errors.push(error.message));
 const base=process.env.PREVIEW_URL||'http://localhost:3182';
 const params=new URLSearchParams({experience:'project',task:'run-config',pview:'activity',psim:JSON.stringify({jdk:21,build:'module-success'})});
 const button=name=>page.getByRole('button',{name,exact:true});
 const shot=async name=>{await page.mouse.move(0,0);await page.evaluate(()=>window.scrollTo(0,0));await page.screenshot({path:`.verification/run-config-${name}.png`,fullPage:true,animations:'disabled'});};
 await page.goto(`${base}/journey/environment?${params}`);
 await button('Mở main class Command').click();
 const main=source.files.find(file=>file.id==='main');
 await expect(button(`Mở file ${main.path}`)).toHaveClass(/is-selected/);
 await expect(page.locator('.run-main-code')).toContainText('SpringApplication.run');
 await shot('01-tree-main');
 await page.locator('[data-run-action="inspect"]').click();await page.locator('[data-run-action="menu"]').click();
 await page.getByLabel('Active profiles trong bài',{exact:true}).selectOption('dev');
 await shot('02-configuration');
 await button('Apply').click();await button('OK').click();await expect(page.locator('.run-setup-summary')).toContainText('Đã thiết lập, chưa chạy');
 await shot('03-saved');
 if(errors.length)throw Error(errors.join('\n'));
 console.log('Captured I1: main class tree, Run Configuration dialog, saved setup.');
}finally{await browser.close();}
