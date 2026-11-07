import {chromium,expect} from '@playwright/test';
const browser=await chromium.launch({channel:process.env.WORKSHOP_BROWSER_CHANNEL||undefined,headless:true});
try {
 const page=await browser.newPage({viewport:{width:1512,height:1050}}),errors=[];
 page.on('pageerror',error=>errors.push(error.message));
 const base=process.env.PREVIEW_URL||'http://localhost:3182';
 const params=new URLSearchParams({experience:'project',step:'build',task:'build-task',pview:'activity',pprofile:'dev',psim:JSON.stringify({jdk:21})});
 await page.goto(`${base}/journey/environment?${params}`);
 const button=name=>page.getByRole('button',{name,exact:true});
 const shot=async name=>{await page.mouse.move(0,0);await page.evaluate(()=>window.scrollTo(0,0));await page.screenshot({path:`.verification/build-h-${name}.png`,fullPage:true,animations:'disabled'});};
 await button('Thực hành từ đầu').click();
 await expect(page.getByRole('button',{name:'Thư mục workspaces/agent-service/1-agent-command-service/build',exact:true})).toHaveCount(0);
 await shot('01-source');
 for(const step of ['gradle-window','module','tasks','group','task'])await page.locator(`[data-build-action="${step}"]`).click();
 await expect(page.locator('[data-build-action="run"]')).toBeVisible();
 await shot('02-intellij-task');
 await page.locator('[data-build-action="run"]').click();
 await expect(page.locator('.build-result')).toContainText('Build thành công');
 await button('Thư mục workspaces/agent-service/1-agent-command-service/build').click();
 await button('Thư mục workspaces/agent-service/1-agent-command-service/build/libs').click();
 await expect(button('Mở file workspaces/agent-service/1-agent-command-service/build/libs/1-agent-command-service-0.0.1-SNAPSHOT.jar')).toBeVisible();
 await shot('03-output');
 if(errors.length)throw Error(errors.join('\n'));
 console.log('Captured H: source only, IntelliJ task selection, completed build and JAR.');
} finally {await browser.close();}
