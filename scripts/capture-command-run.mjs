import {chromium,expect} from '@playwright/test';
const browser=await chromium.launch({channel:process.env.WORKSHOP_BROWSER_CHANNEL||undefined,headless:true});
const page=await browser.newPage({viewport:{width:1512,height:1050},deviceScaleFactor:1});
const app='http://localhost:3182';
const p=page.getByRole('region',{name:'Thực hành trên project tái dựng',exact:true});
const button=name=>p.getByRole('button',{name,exact:true});
const ready={jdk:21,sdk:21,daemon:true,containers:{'postgres-write':'running'},readyEvidence:['postgres-write']};
const shot=async name=>{await page.mouse.move(0,0);await page.evaluate(()=>window.scrollTo(0,0));await page.screenshot({path:`.verification/run-flow-${name}.png`,fullPage:true,animations:'disabled'});};
try{
 await page.goto(`${app}/journey/environment?${new URLSearchParams({experience:'project',task:'run-config',psim:JSON.stringify(ready)})}`);
 await expect(button('Mở main class Command')).toBeVisible();await shot('01-method');
 await button('Mở main class Command').click();await p.locator('.run-main-code [data-line="27"]').waitFor();await p.locator('.run-main-editor').screenshot({path:'.verification/run-flow-main-detail.png',animations:'disabled'});await button('Tam giác Run cạnh main').click();await button('Edit Configurations…').click();
 await p.getByLabel('Active profiles trong bài',{exact:true}).selectOption('dev');await shot('02-configuration');
 await button('Apply').click();await button('OK').click();await button('Tiếp theo: Chạy và dừng').click();await button('Run cạnh main').click();
 await expect(p.locator('.command-process-status')).toContainText('Command đang chạy trong bài học');await shot('03-started');
 await button('Đọc kết quả của lần Run này').click();for(const id of ['profile','port','started'])await p.locator(`[data-command-log="${id}"]`).click();
 await p.locator('.command-port-check summary').click();await button('Enter kiểm tra port trong bài').click();await button('Gửi request trong bài · giả định health UP').click();await shot('04-local');
 console.log('Captured four complete page screenshots in .verification/run-flow-*.png');
}finally{await browser.close();}
