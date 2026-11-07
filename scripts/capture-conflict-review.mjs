import {chromium,expect} from '@playwright/test';
const browser=await chromium.launch({channel:process.env.WORKSHOP_BROWSER_CHANNEL||undefined,headless:true});
const page=await browser.newPage({viewport:{width:1512,height:1050}}),errors=[];
page.on('pageerror',error=>errors.push(error.message));
const base=process.env.PREVIEW_URL||'http://localhost:3182';
const button=name=>page.getByRole('button',{name,exact:true});
const capture=async name=>page.locator('.conflict-practice').screenshot({path:`.verification/g3-${name}.png`,animations:'disabled'});
async function open(kind){await page.goto(`${base}/journey/environment?${new URLSearchParams({experience:'project',task:'conflict',pprofile:'dev',psim:JSON.stringify({conflictCase:kind})})}`);await expect(page.locator('.conflict-practice')).toBeVisible();}
async function fail(kind){await button('Thử tạo/chạy trong bài học').click();await button('Mở Docker Desktop mô phỏng').click();await expect(page.locator('.conflict-error mark')).toHaveText(kind==='name'?'rebrow':'5432');}
await open('name');await capture('goal');await fail('name');await capture('name-error');
await button('Đối chiếu tên hiện hữu rebrow').click();await button('Cần · tạo instance riêng').click();
await page.getByLabel('Tên container trong bản mô phỏng',{exact:true}).fill('rebrow-learning');await button('Áp dụng bản mô phỏng').click();
await page.locator('.conflict-revised').screenshot({path:'.verification/g3-name-before-after.png',animations:'disabled'});
await button('Chạy lại kế hoạch trong bài').click();await expect(page.getByTestId('created-rebrow-learning')).toContainText('running');await capture('name-resolved');
await open('port');await fail('port');await capture('port-error');await button('Đối chiếu host port hiện hữu 5432').click();
await button('Cần · tạo instance riêng').click();await page.getByLabel('Host port trong bản mô phỏng',{exact:true}).fill('15432');await button('Áp dụng bản mô phỏng').click();
await button('Xem cấu hình Java cần đối chiếu').click();await button('Chạy lại kế hoạch trong bài').click();await capture('port-resolved');
await page.setViewportSize({width:390,height:844});await open('name');await fail('name');
await page.locator('.conflict-evidence').screenshot({path:'.verification/g3-mobile-evidence.png',animations:'disabled'});
if(await page.evaluate(()=>document.documentElement.scrollWidth)>390)throw Error('Mobile overflow');
if(errors.length)throw Error(errors.join('\n'));await browser.close();console.log('Captured G3 goal, name/port errors, before/after, retry results and mobile evidence.');
