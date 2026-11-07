import {chromium,expect} from '@playwright/test';
// Captures the learning UI only. Does not open IntelliJ, Docker, or any backend.
const origin=process.env.PREVIEW_URL||'http://localhost:3182';
const browser=await chromium.launch({channel:process.env.WORKSHOP_BROWSER_CHANNEL||undefined,headless:true});
const page=await browser.newPage({viewport:{width:1512,height:1050}});
const errors=[];page.on('pageerror',e=>errors.push(e.message));
const button=name=>page.getByRole('button',{name,exact:true});
async function task(id,sim={}){await page.goto(`${origin}/journey/environment?${new URLSearchParams({experience:'project',task:id,pprofile:'dev',psim:JSON.stringify(sim)})}`);await page.locator('.project-practice').waitFor();}
async function action(key){const before=page.url();await page.locator(`[data-ide-action="${key}"]`).click();await expect(page).not.toHaveURL(before);}
async function capture(selector,name){await page.locator(selector).screenshot({path:`.verification/${name}.png`,animations:'disabled'});}
await task('ide',{jdk:21});
for(const key of ['file','structure','project','sdk','sdk-choice','language'])await action(key);
await capture('.ide-practice','labs-intellij-project');
for(const key of ['language-choice','project-apply','project-ok','settings-file','settings','build-settings','gradle-settings','gradle-jvm'])await action(key);
await capture('.ide-practice','labs-intellij-gradle');
for(const key of ['gradle-choice','settings-apply','settings-ok','gradle-window','reload','check'])await action(key);
await capture('.ide-practice','labs-intellij-result');
await task('connections',{daemon:true,containers:{'postgres-write':'running'}});
await button('Xem cấu hình PostgreSQL write').click();
await page.locator('.connection-pair').first().getByTestId('highlighted-code').first().filter({has:page.locator('[data-line="33"]')}).waitFor();
await expect(page.locator('.connection-pair [data-ready=true]').first()).toBeVisible();
await capture('.connection-practice','labs-connections-review');
await task('daemon');await capture('.docker-practice','labs-docker-before');
await button('Mở Docker Desktop trong mô phỏng').click();
await button('Chờ Engine và kiểm tra lại docker version').click();
await capture('.docker-practice','labs-docker-engine-ready');
for(const name of ['Chuẩn bị lệnh Compose','Bắt đầu Compose trong mô phỏng','Hoàn tất chuẩn bị image','Tạo tài nguyên và container','Khởi động container vừa tạo'])await button(name).click();
await page.getByRole('row',{name:'Chọn container postgres-write',exact:true}).click();await button('database system is ready to accept connections').click();
await capture('.docker-practice','labs-docker-container-running');
await task('connections',{infraOpen:true,infraScope:'workspace'});
await page.locator('.react-flow__node[data-id="command"]').waitFor();
await capture('.infrastructure-panel','labs-workspace-infrastructure');
await page.setViewportSize({width:390,height:844});
await task('connections',{dependency:'redis',daemon:true});
await expect(page.locator('.connection-pair [data-ready=true]').first()).toBeVisible();
await capture('.connection-practice','labs-mobile-comparison');
if(errors.length)throw Error(errors.join('\n'));
await browser.close();console.log('Captured IntelliJ, connection comparison, three Docker states, workspace graph and mobile.');
