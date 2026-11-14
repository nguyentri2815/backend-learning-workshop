import {chromium} from '@playwright/test';
import fs from 'node:fs';
const base=process.env.PREVIEW_URL??'http://localhost:3182';
const route='/journey/policy?group=list';
const links={overview:base+route+'&mode=overview',steps:base+route+'&mode=steps',pattern:base+route+'&mode=assembly&listAssembly=pattern&listPart=handoff-3',related:base+route+'&mode=assembly&listAssembly=pattern&listPart=handoff-3&listDiagram=1&listDiagramMode=related',implementation:base+route+'&mode=assembly&listAssembly=pattern&listDiagram=1&listDiagramMode=practice'};
const browser=await chromium.launch({channel:process.env.WORKSHOP_BROWSER_CHANNEL||undefined});
for(const mobile of [false,true])for(const dark of [false,true]){
 const context=await browser.newContext({viewport:mobile?{width:390,height:844}:{width:1440,height:1000}}),page=await context.newPage();
 await page.goto(links.overview);if(dark)await page.getByRole('button',{name:'Giao diện tối',exact:true}).click();
 await page.getByRole('heading',{name:'Tìm Policy trong phạm vi được xem',exact:true}).waitFor();
 await page.locator('.list-flow .react-flow__viewport').waitFor();
 await page.evaluate(async()=>{await document.fonts.ready;await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));window.scrollTo(0,0);});
 const suffix=`${mobile?'mobile':'desktop'}-${dark?'dark':'light'}`;
 await page.screenshot({path:`docs/review/list-overview-${suffix}.png`,animations:'disabled'});
 await page.getByRole('tab',{name:'Làm lại từng bước',exact:true}).click();
 await page.getByRole('button',{name:'Tìm hợp đồng mẫu',exact:true}).click();await page.getByRole('button',{name:'Chạy đến bảng',exact:true}).click();
 await page.locator('.list-result-summary').scrollIntoViewIfNeeded();
 await page.screenshot({path:`docs/review/list-table-${suffix}.png`});
 await page.goto(links.pattern);await page.locator('.list-frames').scrollIntoViewIfNeeded();
 await page.locator('.list-frames [data-testid=highlighted-code]').first().waitFor();
 await page.screenshot({path:`docs/review/list-pattern-${suffix}.png`});
 await context.close();
}
fs.writeFileSync('docs/review/policy-list-links.json',JSON.stringify(links,null,2)+'\n');
await browser.close();console.log('Captured List overview, table and pattern at desktop/mobile in both themes.');
