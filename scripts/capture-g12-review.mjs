import {chromium,expect} from '@playwright/test';
const browser=await chromium.launch({channel:process.env.WORKSHOP_BROWSER_CHANNEL||undefined,headless:true});
const page=await browser.newPage({viewport:{width:1512,height:1050}});
const origin=process.env.PREVIEW_URL||'http://localhost:3182';
const errors=[];page.on('pageerror',error=>errors.push(error.message));
const button=name=>page.getByRole('button',{name,exact:true});
async function task(id,sim){await page.goto(`${origin}/journey/environment?${new URLSearchParams({experience:'project',task:id,pprofile:'dev',psim:JSON.stringify(sim)})}`);await page.locator('.project-practice').waitFor();}
async function capture(selector,name){await page.locator(selector).screenshot({path:`.verification/${name}.png`,animations:'disabled'});}
await task('connections',{connectionModule:'command',connectionProfile:'dev'});await button('Xem cấu hình PostgreSQL write').click();
await expect(page.locator('.connection-pair [data-ready=true]').first()).toBeVisible();await capture('.connection-practice','g12-method-scope');
await task('daemon',{dockerEntry:'first',daemon:true,desktopOpen:true});
await capture('.docker-desktop','g12-docker-before-create');
await button('Chuẩn bị lệnh Compose').click();await capture('.compose-command-card','g12-compose-command');
await button('Bắt đầu Compose trong mô phỏng').click();await capture('.compose-stages','g12-compose-image');
await button('Hoàn tất chuẩn bị image').click();await button('Tạo tài nguyên và container').click();
await expect(page.getByRole('row',{name:'Chọn container postgres-write',exact:true})).toContainText('stopped');
await capture('.docker-desktop','g12-docker-created');
await button('Khởi động container vừa tạo').click();await page.getByRole('row',{name:'Chọn container postgres-write',exact:true}).click();
await capture('.docker-desktop','g12-docker-running');
await button('database system is ready to accept connections').click();await button('Stop postgres-write').click();
await capture('.docker-desktop','g12-docker-stopped');
await task('daemon',{dockerEntry:'existing',daemon:true,desktopOpen:true});
await page.getByRole('row',{name:'Chọn container postgres-write',exact:true}).click();await button('Start postgres-write').click();
await capture('.docker-desktop','g12-docker-restarted');
if(errors.length)throw Error(errors.join('\n'));
await browser.close();console.log('Captured G1 scope, first creation, running/stopped and existing container restart.');
