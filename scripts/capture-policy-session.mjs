import fs from 'node:fs';
import {chromium,expect} from '@playwright/test';

const origin=process.env.PREVIEW_URL||'http://localhost:3182';
const trials='entry-valid,entry-missing,entry-blocked,pending,success,read-id';
const link=(at,done,file,mode='total')=>origin+'/journey/policy?'+new URLSearchParams({group:'create',mode:'session',sessionAt:at,sessionDone:String(done),sessionFile:file,sessionMode:mode,sessionFilter:'changed',sessionTrials:done>=10?trials:'entry-valid,entry-missing,entry-blocked'});
const links={start:origin+'/journey/policy?group=create&mode=session',ide:link('apply',7,'aggregate','round'),beforeSave:link('payment',10,'func','file'),review:link('review',10,'func')};
const browser=await chromium.launch({channel:process.env.WORKSHOP_BROWSER_CHANNEL||undefined});
for(const mobile of [false,true])for(const dark of [false,true]) {
 const context=await browser.newContext({viewport:mobile?{width:390,height:844}:{width:1680,height:1200}});
 const page=await context.newPage();
 for(const target of ['ide','review']) {
  await page.goto(links[target]);
  if(dark)await page.getByRole('button',{name:'Giao diện tối',exact:true}).click();
  const root=page.getByRole('region',{name:'Mô phỏng cả phiên triển khai',exact:true});
  await expect(root).toBeVisible();
  await expect(root.getByTestId('highlighted-code').first()).toHaveAttribute('data-ready','true');
  if(target==='review')await expect(root.locator('.session-review-files button')).toHaveCount(4);
  // Element screenshots include all three panes; mobile records the stacked layout.
  await root.screenshot({path:`docs/review/policy-session-${target}-${mobile?'mobile':'desktop'}-${dark?'dark':'light'}.png`,animations:'disabled'});
  if(!mobile&&!dark)await root.screenshot({path:`docs/review/policy-session-${target}.png`,animations:'disabled'});
 }
 await context.close();
}
fs.writeFileSync('docs/review/policy-session-links.json',JSON.stringify(links,null,2)+'\n');
await browser.close();
console.log('Captured IDE and Review at desktop/mobile, light/dark. Review URLs are fixture snapshots, not a backend run.');
