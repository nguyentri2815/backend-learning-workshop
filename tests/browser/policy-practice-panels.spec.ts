import {expect,test} from '@playwright/test';
import type {Page} from '@playwright/test';
import {advance,returnToStop} from './execution-helpers';

const route='/journey/policy?group=create&mode=steps&node=map&sim=checked&quote=QUOTE-LEARN-101&sentQuote=QUOTE-LEARN-101&backend=1&debugVersion=2';
const button=(page:Page,name:string)=>page.getByRole('button',{name,exact:true});
const line=(page:Page,n:number)=>page.getByTestId('policy-source').locator(`[data-line="${n}"]`);
async function position(page:Page){
  return {page:await page.evaluate(()=>({x:window.scrollX,y:window.scrollY})),code:await page.getByTestId('code-scroll').evaluate(e=>({top:e.scrollTop,left:e.scrollLeft,width:e.clientWidth,height:e.clientHeight})),tree:await page.locator('.policy-file-panel').evaluate(e=>({top:e.scrollTop,left:e.scrollLeft,width:e.clientWidth})),url:page.url()};
}

for(const mobile of [false,true])test.describe(mobile?'touch mobile':'desktop keyboard',()=>{
test.use({hasTouch:mobile,isMobile:mobile,viewport:mobile?{width:390,height:844}:{width:1512,height:1050}});
test('step 3 data stays below code, overlays preserve reading position and source nodes keep the panel open',async({page})=>{
  await page.goto(route);
  await expect(page.getByTestId('highlighted-code')).toHaveAttribute('data-ready','true');
  await page.getByTestId('practice-workstation').evaluate(e=>e.scrollIntoView({block:'start'}));
  await expect(button(page,'Code')).toHaveCount(0);
  await expect(page.locator('.practice-pane-tabs')).toHaveCount(0);
  const source=page.getByTestId('policy-source'),data=page.getByTestId('practice-step-data');
  expect((await data.boundingBox())!.y).toBeGreaterThan((await source.boundingBox())!.y+(await source.boundingBox())!.height);
  await data.scrollIntoViewIfNeeded();
  await expect(page.locator('.checkpoint-kicker')).toContainText('Dữ liệu bước 3');
  await button(page,'Ngày hiệu lực').click();
  await expect(page.getByTestId('mapping-trace')).toContainText('Quote.effectiveDate');
  await expect(page.getByTestId('mapping-trace')).toContainText('command.effectiveDate');
  await expect(page.getByTestId('mapping-trace')).toContainText('2026-11-01');
  await button(page,'Mở dòng Java L90 ↗').click();
  await expect(line(page,90)).toBeInViewport();
  await data.scrollIntoViewIfNeeded();await button(page,'Khách hàng').click();
  await expect(page.getByTestId('mapping-trace')).toContainText('Quote.customerModel.name');
  await expect(page.getByTestId('mapping-trace')).toContainText('command.customerName');
  await expect(page.getByTestId('quote-policy-mapping')).toContainText('Khách hàng mẫu Mai');
  await expect(page.getByTestId('quote-policy-mapping')).toContainText('Policy sắp ghi');
  await expect(source).toBeVisible();
  await button(page,'Mở dòng Java L206 ↗').click();await expect(line(page,206)).toBeInViewport();
  await button(page,'Mở rộng ngữ cảnh').click();
  await page.getByTestId('code-scroll').evaluate(e=>{e.scrollTop=e.scrollHeight;});
  await data.scrollIntoViewIfNeeded();
  const before=await position(page);
  const rail=page.getByRole('toolbar',{name:'Công cụ thực hành'}),network=button(page,'Network'),trace=button(page,'Luồng thực thi');
  await expect(rail).toHaveAttribute('aria-orientation','vertical');
  await expect(page.locator('.practice-workbench-toolbar').getByRole('button',{name:'Network',exact:true})).toHaveCount(0);
  const a=(await network.boundingBox())!,b=(await trace.boundingBox())!;
  expect(b.x).toBe(a.x);expect(b.y).toBeGreaterThanOrEqual(a.y+a.height);
  expect((await rail.boundingBox())!.width).toBeLessThanOrEqual(48);
  await page.mouse.move(0,0);await page.getByTestId('code-scroll').evaluate(e=>e.focus({preventScroll:true}));
  await expect(rail.getByRole('tooltip').first()).not.toBeVisible();
  if(mobile)await trace.tap();else{
    await network.hover();await expect(network.getByRole('tooltip')).toBeVisible();await page.mouse.move(0,0);
    await network.focus();await network.press('ArrowUp');await trace.press('ArrowDown');
    await expect(network.getByRole('tooltip')).toBeVisible();
    await network.press('ArrowDown');await expect(trace).toBeFocused();await expect(trace.getByRole('tooltip')).toBeVisible();
    await trace.press('Enter');
  }
  const dialog=page.getByRole('dialog',{name:'Luồng thực thi',exact:true});await expect(dialog).toBeVisible();
  expect((await dialog.boundingBox())!.width).toBeGreaterThan(mobile?370:620);
  await expect(page.getByTestId('trace-node-fill-body')).toBeVisible();
  await expect(page.getByTestId('trace-group-map')).toContainText('runInternal L76 → L80');
  const during=await position(page);expect(during).toEqual(before);
  await page.mouse.wheel(0,300); // Only the panel may scroll while it is open.
  await page.evaluate(()=>new Promise<void>(resolve=>requestAnimationFrame(()=>requestAnimationFrame(()=>resolve()))));
  expect(await position(page)).toEqual(before);
  await page.keyboard.press('Escape');await expect(dialog).not.toBeVisible();await expect(trace).toBeFocused();
  expect(await position(page)).toEqual(before);
  if(mobile)await network.tap();else await network.press('Enter');
  await expect(page.getByRole('dialog',{name:'Network',exact:true})).toBeVisible();
  await expect(page.getByTestId('create-network')).toHaveAttribute('data-state','pending');
  await expect(page.getByTestId('create-network')).toContainText('POST /policy/create/QUOTE-LEARN-101');
  await button(page,'Đóng bảng phụ').click();expect(await position(page)).toEqual(before);
  await trace.click();await page.getByRole('button',{name:'Xem Vào getPolicyStatus L195',exact:true}).click();
  await expect(page.getByRole('dialog')).toBeVisible();await button(page,'Đóng bảng phụ').click();
  await expect(line(page,195)).toHaveAttribute('data-viewing','true');
  expect(await page.evaluate(()=>({x:window.scrollX,y:window.scrollY}))).toEqual(before.page);
  // Selecting in the modal no longer moves the document from the data section.
  // The narrow layout puts the full debug explanation above the source.
  await page.getByTestId(mobile?'checkpoint-editor':'practice-workstation').evaluate(e=>e.scrollIntoView({block:'start'}));await expect(line(page,195)).toBeInViewport();
  await expect(page.getByTestId('policy-source')).toHaveAttribute('data-source-id','create-status');
  expect(new URL(page.url()).searchParams.get('sim')).toBe('checked');
  // Return to the current field/checkpoint without changing the simulated progress.
  await returnToStop(page);await expect(line(page,80)).toHaveAttribute('data-viewing','true');
  for(let i=0;i<30&&new URL(page.url()).searchParams.get('stop')!=='save-call';i++)await advance(page);
  expect(new URL(page.url()).searchParams.get('node')).toBe('save');
  expect(new URL(page.url()).searchParams.get('sim')).toBe('mapped');
  await expect(line(page,115)).toHaveAttribute('data-viewing','true');
  expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(mobile?390:1512);
});
});
