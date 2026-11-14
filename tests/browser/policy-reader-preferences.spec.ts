import {expect,test} from '@playwright/test';
import type {Page} from '@playwright/test';

const walk='quote-ui,quote-request,controller-call,quote-read,quote-guard,quote-get,internal-call,internal-enter,duplicate-read,objects-read,duplicate-guard';
export const readerReviewUrl='/journey/policy?'+new URLSearchParams({group:'create',mode:'steps',node:'validate',walk,stop:'map-dates',at:'quote-read',reader:'context',backend:'1'});
const button=(page:Page,name:string)=>page.getByRole('button',{name,exact:true});
const toolbar=(page:Page)=>page.locator('.practice-workbench-toolbar');
const code=(page:Page)=>page.getByTestId('code-scroll');
const settle=(page:Page)=>page.evaluate(()=>new Promise<void>(resolve=>requestAnimationFrame(()=>requestAnimationFrame(()=>resolve()))));
async function pin(page:Page){
  await page.getByTestId('practice-workstation').evaluate(e=>{
    const top=parseFloat(getComputedStyle(e.querySelector('.practice-workbench-toolbar')!).top)||0;
    window.scrollTo({top:scrollY+e.getBoundingClientRect().top-top+1,behavior:'instant'});
  });
  await expect(toolbar(page)).toHaveAttribute('data-pinned','true');
}
async function position(page:Page){return page.evaluate(()=>{
  const element=document.querySelector<HTMLElement>('[data-testid=code-scroll]')!;
  return {page:scrollY,top:element.scrollTop,left:element.scrollLeft,url:location.href,file:document.querySelector<HTMLElement>('[data-testid=policy-source]')!.dataset.sourceId};
});}

for(const mobile of [false,true])test(`${mobile?'mobile':'desktop'} L61 / stop L80: sticky details and theme preserve reading and simulated progress`,async({page})=>{
  if(mobile)await page.setViewportSize({width:390,height:844});
  await page.goto(readerReviewUrl);
  await expect(page.getByTestId('highlighted-code')).toHaveAttribute('data-syntax-theme','light');
  await expect(page.getByTestId('practice-workstation')).toHaveAttribute('data-code-theme','light');
  await expect(toolbar(page)).toHaveAttribute('data-expanded','false');
  await pin(page);await expect(toolbar(page)).toHaveAttribute('data-expanded','false');
  await expect(page.locator('.checkpoint-positions')).toContainText('L61');
  await expect(page.locator('.checkpoint-positions')).toContainText('L80');
  await expect(button(page,'Điểm sau')).toBeEnabled();
  const compact=(await toolbar(page).boundingBox())!;
  expect(compact.height).toBeLessThanOrEqual(mobile?114:100);
  const nav=page.getByRole('group',{name:'Điều hướng debug'});
  expect(await nav.getByRole('button').allTextContents()).toEqual(['⇤ Bước trước','← Điểm trước','→ Điểm sau','⇥ Bước sau']);
  for(const element of await nav.getByRole('button').all()){
    const bounds=(await element.boundingBox())!;expect(bounds.height).toBeGreaterThanOrEqual(40);await expect(element).toBeInViewport();
  }
  const before=await position(page);
  await button(page,'Mở chi tiết').click();await settle(page);
  expect(await position(page)).toEqual(before);
  await expect(page.getByTestId('checkpoint-details')).toBeVisible();
  await expect(page.getByLabel('Điểm đang xem',{exact:true})).toBeVisible();
  const expanded=(await toolbar(page).boundingBox())!;
  expect(expanded.height).toBeGreaterThan(compact.height+100);
  const line=page.getByTestId('policy-source').locator('[data-line="61"]');
  const lineBounds=(await line.boundingBox())!;
  expect(lineBounds.y).toBeGreaterThanOrEqual(expanded.y+expanded.height);
  await expect(line).toBeInViewport();
  await page.evaluate(()=>window.scrollBy(0,45));await settle(page);
  await expect(toolbar(page)).toHaveAttribute('data-expanded','true');
  await pin(page);
  const light=await position(page);
  await page.getByRole('combobox',{name:'Giao diện workspace code',exact:true}).selectOption('dark');
  await expect(page.getByTestId('highlighted-code')).toHaveAttribute('data-syntax-theme','dark');
  expect(await position(page)).toEqual(light);
  await expect(code(page)).toHaveCSS('background-color','rgb(30, 31, 34)');
  await expect(line).toHaveAttribute('data-viewing','true');
  const stopped=page.getByTestId('policy-source').locator('[data-line="80"]');
  await expect(stopped).toHaveAttribute('data-current','true');
  expect(await stopped.evaluate(e=>getComputedStyle(e).borderLeftColor)).not.toBe(await line.evaluate(e=>getComputedStyle(e).borderLeftColor));
  await button(page,'Thu gọn').click();await settle(page);
  await expect(toolbar(page)).toHaveAttribute('data-expanded','false');
  await page.evaluate(()=>window.scrollBy(0,-80));await settle(page);await pin(page);
  await expect(toolbar(page)).toHaveAttribute('data-expanded','false');
  // Changing colors also preserves a manually explored horizontal and vertical offset.
  await page.getByRole('checkbox',{name:'Xuống dòng code',exact:true}).uncheck();
  await code(page).evaluate(e=>{e.scrollTop=180;e.scrollLeft=40;});
  const explored=await position(page);
  await page.getByRole('combobox',{name:'Giao diện workspace code',exact:true}).selectOption('light');await expect(page.getByTestId('highlighted-code')).toHaveAttribute('data-syntax-theme','light');
  expect(await position(page)).toEqual(explored);
  await page.getByRole('combobox',{name:'Giao diện workspace code',exact:true}).selectOption('dark');await expect(page.getByTestId('highlighted-code')).toHaveAttribute('data-syntax-theme','dark');
  expect(await position(page)).toEqual(explored);
  const url=page.url();
  await page.reload();await expect(page.getByTestId('highlighted-code')).toHaveAttribute('data-syntax-theme','dark');
  await expect(page.getByRole('combobox',{name:'Giao diện workspace code',exact:true})).toHaveValue('dark');expect(page.url()).toBe(url);
  await pin(page);await expect(toolbar(page)).toHaveAttribute('data-expanded','false');
  await button(page,'Điểm sau').click();
  await expect(page.getByTestId('policy-debug')).toHaveAttribute('data-checkpoint-id','quote-guard');
  await expect(toolbar(page)).toHaveAttribute('data-pinned','true');
  await expect(toolbar(page)).toHaveAttribute('data-expanded','false');
  const params=new URL(page.url()).searchParams;
  expect(params.get('stop')).toBe('map-dates');expect(params.get('walk')).toBe(walk);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(mobile?390:1512);
});

test('all six stages share the theme and details controls; unrelated source viewers keep their light theme',async({page})=>{
  await page.goto(readerReviewUrl);await page.getByRole('combobox',{name:'Giao diện workspace code',exact:true}).selectOption('dark');
  for(const [node,at] of [['quote','controller-call'],['validate','quote-read'],['map','map-dates'],['save','save-call'],['flow','flow-event'],['result','result-request']]){
    const params=new URLSearchParams({group:'create',mode:'steps',node,at,stop:'map-dates',walk,reader:'context',backend:'1'});
    await page.goto('/journey/policy?'+params);
    await expect(page.getByTestId('highlighted-code')).toHaveAttribute('data-syntax-theme','dark');
    await pin(page);await expect(toolbar(page)).toHaveAttribute('data-expanded','false');
    await button(page,'Mở chi tiết').click();await expect(page.getByTestId('checkpoint-details')).toBeVisible();
    await expect(page.getByTestId('policy-debug')).toHaveAttribute('data-checkpoint-id',at);
  }
  await page.goto('/journey/claims?step=implement&view=source&file=claim-draft');
  await expect(page.getByTestId('highlighted-code').first()).toHaveAttribute('data-syntax-theme','light');
});
