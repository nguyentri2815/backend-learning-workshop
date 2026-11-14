import {chromium,expect} from '@playwright/test';
const browser=await chromium.launch({channel:process.env.WORKSHOP_BROWSER_CHANNEL||undefined});
const page=await browser.newPage({viewport:{width:1512,height:1050}});
const origin=process.env.PREVIEW_URL||'http://localhost:3182';
const route='/journey/policy?group=create&mode=steps&node=validate&quote=QUOTE-LEARN-101&sentQuote=QUOTE-LEARN-101&backend=1&debugVersion=2';
const primary=()=>page.getByRole('button',{name:'Điểm sau',exact:true});
const station=page.getByTestId('practice-workstation');
const errors=[];page.on('pageerror',e=>errors.push(e.message));
for(const mobile of [false,true]){
  await page.setViewportSize(mobile?{width:390,height:844}:{width:1512,height:1050});
  await page.goto(origin+route);
  await expect(page.getByTestId('highlighted-code')).toHaveAttribute('data-ready','true');
  await station.evaluate(e=>e.scrollIntoView({block:'start'}));
  console.log(mobile?'mobile':'desktop',await page.locator('.policy-practice-station,.policy-editor-group,.policy-editor-panel,.policy-code-frame,[data-testid=code-scroll]').evaluateAll(es=>es.map(e=>({class:e.className,rect:e.getBoundingClientRect().toJSON()}))));
  await page.screenshot({path:`docs/review/policy-workbench-${mobile?'mobile':'desktop'}-closed.png`});
  await page.getByRole('button',{name:'Luồng thực thi',exact:true}).click();
  await page.screenshot({path:`docs/review/policy-workbench-${mobile?'mobile':'desktop'}-trace-entry.png`});
  await page.getByRole('button',{name:'Đóng bảng phụ',exact:true}).click();
  for(let i=0;i<4;i++)await primary().click();
  await expect(page.getByTestId('debug-branch')).toContainText('Vào runInternal');
  await page.getByRole('button',{name:'Luồng thực thi',exact:true}).click();
  await page.screenshot({path:`docs/review/policy-workbench-${mobile?'mobile':'desktop'}-trace-L67.png`});
  await page.getByRole('button',{name:'Đóng bảng phụ',exact:true}).click();
}
await browser.close();
if(errors.length)throw Error(errors.join('\n'));
