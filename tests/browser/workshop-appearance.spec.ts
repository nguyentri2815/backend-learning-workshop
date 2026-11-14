import {expect,test} from '@playwright/test';
import type {Page} from '@playwright/test';
import {PRACTICE_KEY} from '../../src/setup/project-practice-model';
import {runThrough} from './execution-helpers';

const profile='/journey/environment?experience=project&step=config&task=profile&pfile=dev&pline=33&pview=source';
const save='/journey/policy?group=create&mode=steps&node=save&sim=command&stop=save-return&at=save-return&reader=context&backend=1&sentQuote=QUOTE-LEARN-101';
const readerReviewUrl='/journey/policy?'+new URLSearchParams({group:'create',mode:'steps',node:'validate',walk:'quote-ui,quote-request,controller-call,quote-read,quote-guard,quote-get,internal-call,internal-enter,duplicate-read,objects-read,duplicate-guard',stop:'map-dates',at:'quote-read',reader:'context',backend:'1'});
const appTheme=(page:Page,dark:boolean)=>page.getByRole('button',{name:dark?'Giao diện tối':'Giao diện sáng',exact:true});
async function chooseAppTheme(page:Page,dark:boolean){
 // Click the visible sticky header at its screen position. Locator.click()
 // scrolls sticky elements back toward their original document position.
 const box=(await appTheme(page,dark).boundingBox())!;await page.mouse.click(box.x+box.width/2,box.y+box.height/2);
}
const editorTheme=(page:Page)=>page.getByRole('combobox',{name:'Giao diện workspace code',exact:true});
const syntax=async(page:Page,theme:string)=>{for(const code of await page.getByTestId('highlighted-code').all())await expect(code).toHaveAttribute('data-syntax-theme',theme);};
const settle=(page:Page)=>page.evaluate(()=>new Promise<void>(r=>requestAnimationFrame(()=>requestAnimationFrame(()=>r()))));
const state=(page:Page)=>page.evaluate(()=>({url:location.href,scroll:scrollY,code:[...document.querySelectorAll<HTMLElement>('[data-testid=code-scroll]')].map(e=>[e.scrollTop,e.scrollLeft]),progress:Object.fromEntries(Object.entries(localStorage).filter(([key])=>/progress|practice/.test(key)))}));
async function activeInStrip(page:Page,label:string){
 const strip=page.getByRole('navigation',{name:label,exact:true}),list=strip.locator('ol'),current=strip.locator('[aria-current=step]');
 await expect(current).toBeVisible();
 const outer=(await list.boundingBox())!,inner=(await current.boundingBox())!;
 expect(inner.x).toBeGreaterThanOrEqual(outer.x);expect(inner.x+inner.width).toBeLessThanOrEqual(outer.x+outer.width);
 return strip;
}

for(const mobile of [false,true]){
 test(`${mobile?'mobile':'desktop'} global theme, YAML columns, editor override and deep-link reload retain learning state`,async({page})=>{
  if(mobile)await page.setViewportSize({width:390,height:844});
  await page.goto(profile);await expect(page.locator('.practice-loading')).toHaveCount(0);
  await expect(page.getByTestId('highlighted-code')).toHaveCount(2);await syntax(page,'light');
  await expect(appTheme(page,false)).toHaveAttribute('aria-pressed','true');
  await expect(page.locator('body')).toHaveCSS('background-color','rgb(247, 246, 242)');
  await page.getByRole('radio',{name:'Chọn dev trong bài thực hành',exact:true}).click();
  await expect(page.getByRole('radio',{name:'Chọn dev trong bài thực hành',exact:true})).toBeChecked();
  await expect.poll(()=>page.evaluate(key=>JSON.parse(localStorage.getItem(key)??'{}').completed,PRACTICE_KEY)).toContain('profile');
  await appTheme(page,false).scrollIntoViewIfNeeded();
  await page.getByTestId('code-scroll').evaluateAll(nodes=>nodes.forEach(e=>{e.scrollTop+=25;}));await settle(page);
  const before=await state(page);await chooseAppTheme(page,true);await syntax(page,'dark');await settle(page);
  expect(await state(page)).toEqual(before);
  await expect(page.locator('body')).toHaveCSS('background-color','rgb(27, 29, 31)');
  for(const column of await page.getByTestId('code-scroll').all()){
   await expect(column).toHaveCSS('background-color','rgb(30, 31, 34)');
   await expect(column.locator('[data-line="33"]')).toContainText('url:');
  }
  const contrast=await page.locator('.practice-compare').evaluate(element=>{
   const rgb=(value:string)=>value.match(/[\d.]+/g)!.map(Number);
   const luminance=(color:number[])=>color.slice(0,3).map(x=>x/255).map(x=>x<=.04045?x/12.92:((x+.055)/1.055)**2.4).reduce((sum,x,i)=>sum+x*[.2126,.7152,.0722][i],0);
   return [...element.querySelectorAll<HTMLElement>('[data-testid=source-line]>span')].filter(e=>e.textContent?.trim()).map(e=>{
    let parent:HTMLElement|null=e;while(parent&&getComputedStyle(parent).backgroundColor==='rgba(0, 0, 0, 0)')parent=parent.parentElement;
    const fg=luminance(rgb(getComputedStyle(e).color)),bg=luminance(rgb(getComputedStyle(parent!).backgroundColor));return (Math.max(fg,bg)+.05)/(Math.min(fg,bg)+.05);
   });
  });
  expect(Math.min(...contrast)).toBeGreaterThanOrEqual(4.5);
  await activeInStrip(page,'Điều hướng 7 bước');
  await page.reload();await syntax(page,'dark');await expect(page.getByRole('radio',{name:'Chọn dev trong bài thực hành',exact:true})).toBeChecked();
  expect((await state(page)).progress).toEqual(before.progress);
  if(mobile)await page.getByRole('button',{name:'Mở điều hướng',exact:true}).click();
  await page.getByRole('navigation',{name:'Điều hướng chính'}).getByRole('link',{name:'Khám phá Policy',exact:true}).click();
  await expect(appTheme(page,true)).toHaveAttribute('aria-pressed','true');await page.goto(save);await syntax(page,'dark');
  await expect(editorTheme(page)).toHaveValue('system');
  const strip=await activeInStrip(page,'Sáu bước phát hành trực tiếp');
  await expect(strip.locator('.learning-step-arrow')).toHaveCount(5);
  await expect(strip.locator('li').nth(2)).toContainText('Dựng dữ liệu Policy');
  await expect(strip.locator('li').nth(3)).toContainText('Ghi Policy');
  await expect(strip.locator('li').nth(4)).toContainText('Cập nhật dữ liệu tra cứu');
  await expect(strip.locator('li').last().getByRole('button')).toBeDisabled();
  await page.locator('.policy-practice-title').scrollIntoViewIfNeeded();await settle(page);
  const stopped=new URL(page.url()).searchParams.get('stop'),walk=new URL(page.url()).searchParams.get('walk');
  const policyBefore=await state(page);
  await editorTheme(page).selectOption('light');await syntax(page,'light');await settle(page);
  expect(await state(page)).toEqual(policyBefore);
  await expect(page.locator('.practice-code-and-data')).toHaveCSS('background-color','rgb(255, 255, 255)');
  await expect(page.locator('.practice-workbench-toolbar')).toHaveCSS('background-color','rgb(36, 39, 41)');
  await page.reload();await syntax(page,'light');await expect(editorTheme(page)).toHaveValue('light');await expect(appTheme(page,true)).toHaveAttribute('aria-pressed','true');
  await editorTheme(page).selectOption('system');await syntax(page,'dark');
  await page.reload();await syntax(page,'dark');await expect(editorTheme(page)).toHaveValue('system');
  expect(new URL(page.url()).searchParams.get('stop')).toBe(stopped);expect(new URL(page.url()).searchParams.get('walk')).toBe(walk);
  await editorTheme(page).selectOption('dark');await chooseAppTheme(page,false);await syntax(page,'dark');
  await expect(page.locator('body')).toHaveCSS('background-color','rgb(247, 246, 242)');
  await editorTheme(page).selectOption('system');await syntax(page,'light');
  await activeInStrip(page,'Sáu bước phát hành trực tiếp');
  expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(mobile?390:1512);
  if(mobile){await page.setViewportSize({width:360,height:800});await activeInStrip(page,'Sáu bước phát hành trực tiếp');expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(360);}
 });

 test(`${mobile?'mobile':'desktop'} shared ordered strips scroll independently, keep arrows and preserve unlocking and progress`,async({page})=>{
  if(mobile)await page.setViewportSize({width:390,height:844});await page.goto(profile);
  const setup=await activeInStrip(page,'Điều hướng 7 bước');await expect(setup.getByRole('button')).toHaveCount(7);await expect(setup.locator('.learning-step-arrow')).toHaveCount(6);
  const initial=(await state(page)).progress;
  await setup.getByRole('button').last().click();await expect(setup.locator('[aria-current]')).toContainText('Task đầu tiên');await activeInStrip(page,'Điều hướng 7 bước');
  const next=(await state(page)).progress;for(const key of Object.keys(initial))expect(JSON.parse(next[key]).completed).toEqual(JSON.parse(initial[key]).completed);
  await page.goto(save);const policy=await activeInStrip(page,'Sáu bước phát hành trực tiếp');
  await expect(policy.locator('.learning-step-status[aria-label="Đã hoàn thành"]')).toHaveCount(4);
  await expect(policy.locator('.learning-step-arrow[data-traversed=true]')).toHaveCount(4);
  const query=new URL(page.url()).searchParams;
  await policy.getByRole('button').nth(2).click();await expect(policy.locator('[aria-current]')).toContainText('Dựng dữ liệu Policy');await activeInStrip(page,'Sáu bước phát hành trực tiếp');
  expect(new URL(page.url()).searchParams.get('stop')).toBe(query.get('stop'));
  if(mobile){expect(await policy.locator('ol').evaluate(e=>e.scrollWidth>e.clientWidth)).toBe(true);await policy.locator('ol').evaluate(e=>e.scrollLeft=e.scrollWidth);await expect(policy.getByRole('button').last()).toBeVisible();}
  expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(mobile?390:1512);
 });
}

test('dark review checkpoint, errors, graph, network and source comparison retain readable states',async({page})=>{
 await page.goto(readerReviewUrl);await chooseAppTheme(page,true);await syntax(page,'dark');
 await expect(page.locator('.checkpoint-positions')).toContainText('L61');await expect(page.locator('.checkpoint-positions')).toContainText('L80');
 const viewed=page.getByTestId('policy-source').locator('[data-line="61"]'),stop=page.getByTestId('policy-source').locator('[data-line="80"]');
 await expect(viewed).toHaveAttribute('data-viewing','true');await expect(stop).toHaveAttribute('data-current','true');
 expect(await viewed.evaluate(e=>getComputedStyle(e).backgroundColor)).not.toBe(await stop.evaluate(e=>getComputedStyle(e).backgroundColor));
 await page.getByRole('button',{name:'Luồng thực thi',exact:true}).click();const modal=page.getByRole('dialog',{name:'Luồng thực thi',exact:true});
 await expect(modal).toHaveCSS('background-color','rgb(36, 39, 41)');await expect(page.getByTestId('trace-node-read')).toBeInViewport();
 await modal.locator('button[data-checkpoint-id="quote-guard"]').click();await expect(modal).toBeVisible();
 await page.getByRole('button',{name:'Đóng bảng phụ',exact:true}).click();await page.getByRole('button',{name:'Network',exact:true}).click();
 await expect(page.getByRole('dialog',{name:'Network',exact:true})).toHaveCSS('background-color','rgb(36, 39, 41)');
 await page.getByRole('button',{name:'Đóng bảng phụ',exact:true}).click();
 await page.goto('/journey/policy?group=create&mode=steps&node=quote');await page.getByLabel('Quote mẫu',{exact:true}).selectOption('QUOTE-NOT-FOUND');
 await runThrough(page,'quote-guard');
 await expect(page.locator('.practice-workbench-toolbar')).toHaveAttribute('data-error','true');await expect(page.locator('.checkpoint-summary h3')).toContainText('Lỗi');await expect(page.locator('.checkpoint-summary h3')).toHaveCSS('color','rgb(241, 155, 145)');
 await page.goto('/journey/claims?step=implement&view=source&file=claim-draft&side=diff');await syntax(page,'dark');
 const added=page.getByTestId('highlighted-code').locator('[data-new-line]:not([data-old-line])').first(),removed=page.getByTestId('highlighted-code').locator('[data-old-line]:not([data-new-line])').first();
 await expect(added).toContainText('+');await expect(removed).toContainText('−');
 expect(await added.evaluate(e=>getComputedStyle(e).backgroundColor)).not.toBe(await removed.evaluate(e=>getComputedStyle(e).backgroundColor));
 await page.goto('/journey/environment?experience=guide&step=config');await page.locator('.guide-map-toggle').click();await expect(page.getByTestId('setup-graph')).toHaveAttribute('data-ready','true');
 await expect(page.locator('.guide-graph .react-flow')).toHaveCSS('background-color','rgb(27, 29, 31)');await expect(page.locator('.guide-node-card').first()).toHaveCSS('background-color','rgb(36, 39, 41)');
});
