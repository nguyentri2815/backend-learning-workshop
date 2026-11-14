import {chromium,expect} from '@playwright/test';
const browser=await chromium.launch({channel:process.env.WORKSHOP_BROWSER_CHANNEL||undefined});
const origin=process.env.PREVIEW_URL||'http://localhost:3182';
const base='/journey/policy?group=create&mode=steps&node=validate&quote=QUOTE-LEARN-101&sentQuote=QUOTE-LEARN-101&backend=1&debugVersion=2';
for(const mobile of [false,true]){
  const context=await browser.newContext({viewport:mobile?{width:390,height:844}:{width:1512,height:1050},isMobile:mobile,hasTouch:mobile});
  const page=await context.newPage();
  for(const [name,extra] of [['before-L61',''],['after-L61','&debug=1&debugMax=1'],['review-L61','&debug=1&debugMax=8&sim=checked'],['reached-L76','&debug=8&debugMax=8&sim=checked']]){
    await page.goto(origin+base+extra);await expect(page.getByTestId('highlighted-code')).toHaveAttribute('data-ready','true');
    await page.getByTestId('practice-workstation').evaluate(e=>e.scrollIntoView({block:'start'}));
    if(name==='after-L61'){
      await page.getByTestId('debug-after').locator('[data-variable=optional] > details > summary').click();
      await page.getByTestId('debug-after').locator('[data-variable=value] > details > summary').click();
      if(mobile)await page.getByTestId('checkpoint-variables').scrollIntoViewIfNeeded();
    }
    await page.screenshot({path:`docs/review/policy-checkpoint-${mobile?'mobile':'desktop'}-${name}.png`,animations:'disabled'});
    console.log(mobile?'mobile':'desktop',name,await page.locator('[data-testid=policy-debug],[data-testid=code-scroll],[data-testid=checkpoint-variables]').evaluateAll(es=>es.map(e=>({testid:e.dataset.testid,rect:e.getBoundingClientRect().toJSON()}))));
  }
  await context.close();
}
await browser.close();
