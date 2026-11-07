import {chromium,expect} from '@playwright/test';
const browser=await chromium.launch({channel:process.env.WORKSHOP_BROWSER_CHANNEL||undefined,headless:true});
try{
 const page=await browser.newPage({viewport:{width:1512,height:1050}}),errors=[];
 page.on('pageerror',error=>errors.push(error.message));
 const base=process.env.PREVIEW_URL||'http://localhost:3182';
 const sim={jdk:21,sdk:21,daemon:true,containers:{'postgres-write':'running'},readyEvidence:['postgres-write'],build:'module-success'};
 const button=name=>page.getByRole('button',{name,exact:true});
 const shot=async name=>{await page.mouse.move(0,0);await page.evaluate(()=>window.scrollTo(0,0));await page.screenshot({path:`.verification/command-${name}.png`,fullPage:true,animations:'disabled'});};
 await page.goto(`${base}/journey/environment?${new URLSearchParams({experience:'project',task:'run-config',psim:JSON.stringify(sim)})}`);
 await button('Mở main class Command').click();await page.locator('[data-run-action="inspect"]').click();await page.locator('[data-run-action="menu"]').click();
 await page.getByLabel('Active profiles trong bài',{exact:true}).selectOption('dev');await button('Apply').click();await button('OK').click();
 await button('Tiếp theo: Chạy và dừng').click();await expect(page.locator('.command-run-toolbar')).toContainText('Command / dev');await shot('01-before-run');
 await button('Run Command').click();await expect(page.locator('.command-process-status')).toContainText('Command đang chạy trong bài học');await shot('02-running');
 await button('Đọc kết quả của lần Run này').click();await page.locator('[data-command-log="profile"]').click();await page.locator('[data-command-log="port"]').click();await shot('03-verification');
 await page.locator('[data-command-log="started"]').click();await button('Stop Command').click();await button('Tiếp theo: chuẩn bị bắt đầu task').click();await shot('04-task-start');
 if(errors.length)throw Error(errors.join('\n'));
 console.log('Captured I2 before Run, running log, J1 inspection and J2 task card.');
}finally{await browser.close();}
