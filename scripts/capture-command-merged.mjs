import fs from 'node:fs/promises';
import {chromium,expect} from '@playwright/test';
const links=JSON.parse(await fs.readFile('.verification/command-case-review-links.json','utf8'));
const browser=await chromium.launch({channel:process.env.WORKSHOP_BROWSER_CHANNEL||undefined,headless:true}),page=await browser.newPage({viewport:{width:1680,height:1100}}),shots=[];
const region=page.getByRole('region',{name:'Thực hành trên project tái dựng',exact:true}),button=name=>region.getByRole('button',{name,exact:true});
const shot=async name=>{const path=`.verification/command-merged-${name}.png`;await page.mouse.move(0,0);await page.evaluate(()=>window.scrollTo(0,0));await page.screenshot({path,fullPage:true,animations:'disabled'});shots.push({name,path,url:page.url()});};
try{
 await page.goto(links.find(item=>item.id==='pg-refused').url);await shot('01-select');await button('Run cạnh main').click();await expect(region.locator('.startup-controls [role=status]')).toContainText('thất bại');await button('Tìm nguyên nhân').click();await button('Thực hiện kiểm tra trong bài').click();await shot('02-investigate');
 await region.getByLabel('Giá trị sửa trong case').selectOption('5432');await button('Áp dụng cổng đã đối chiếu trong bài').click();await button('Run lại sau kiểm tra').click();await expect(region.locator('.case-resolved')).toBeVisible();await shot('03-recovered');await button('Stop Command').click();
 await page.goto(links.find(item=>item.id==='http-404').url);await button('Run cạnh main').click();await expect(button('Tìm nguyên nhân')).toBeEnabled();await button('Tìm nguyên nhân').click();await button('Thực hiện kiểm tra trong bài').click();await shot('04-http');
 await fs.writeFile('.verification/command-merged-shots.json',JSON.stringify(shots,null,2)+'\n');console.log('Captured merged Run, diagnosis, recovered result and HTTP example.');
}finally{await browser.close();}
