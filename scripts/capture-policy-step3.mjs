import {chromium,expect} from '@playwright/test';
const browser=await chromium.launch({channel:process.env.WORKSHOP_BROWSER_CHANNEL||undefined});
const origin=process.env.PREVIEW_URL||'http://localhost:3182';
const route='/journey/policy?group=create&mode=steps&node=map&sim=checked&quote=QUOTE-LEARN-101&sentQuote=QUOTE-LEARN-101&backend=1&debugVersion=2&field=customer';
for(const mobile of [false,true]){
  const context=await browser.newContext({viewport:mobile?{width:390,height:844}:{width:1512,height:1600},hasTouch:mobile,isMobile:mobile});
  const page=await context.newPage();
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(origin+route);
  await expect(page.getByTestId('highlighted-code')).toHaveAttribute('data-ready','true');
  await page.getByTestId('practice-workstation').evaluate(e=>e.scrollIntoView({block:'start'}));
  await page.mouse.move(0,0);
  const prefix=`docs/review/policy-step3-${mobile?'mobile':'desktop'}`;
  await page.screenshot({path:`${prefix}-closed.png`,animations:'disabled'});
  const before=await page.getByTestId('code-scroll').evaluate(e=>({width:e.clientWidth,top:e.scrollTop}));
  await page.getByRole('button',{name:'Luồng thực thi',exact:true}).click();
  await expect(page.getByRole('dialog',{name:'Luồng thực thi',exact:true})).toBeVisible();
  await page.locator('.practice-trace-scroll').evaluate(e=>{e.scrollTop=0;});
  await page.screenshot({path:`${prefix}-trace.png`,animations:'disabled'});
  await page.getByRole('button',{name:'Đóng bảng phụ',exact:true}).click();
  expect(await page.getByTestId('code-scroll').evaluate(e=>({width:e.clientWidth,top:e.scrollTop}))).toEqual(before);
  console.log(mobile?'mobile':'desktop',await page.locator('.practice-reader-pane,.practice-context-pane').evaluateAll(es=>es.map(e=>({class:e.className,rect:e.getBoundingClientRect().toJSON()}))));
  if(errors.length)throw Error(errors.join('\n'));
  await context.close();
}
await browser.close();
