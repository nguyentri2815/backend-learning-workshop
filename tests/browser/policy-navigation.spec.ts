import {expect,test} from '@playwright/test';
import {advance,advanceTo,button,header,line,primary,route,runThrough,returnToStop} from './execution-helpers';
import {sourceMethod,sourceTransition} from '../../src/policy/source-reading';

const controls=['Bước trước','Điểm trước','Điểm sau','Bước sau'];
const group=(page:import('@playwright/test').Page)=>page.getByRole('group',{name:'Điều hướng debug',exact:true});
test('transition identity uses full file paths across excerpts and distinguishes method calls/returns',()=>{
 const from={ref:'create-check',line:76,method:'CreatePolicyFunc.runInternal'},to={ref:'create-data',line:80,method:'CreatePolicyFunc.runInternal'};
 expect(sourceTransition(from,to).title).toBe('Cùng file · CreatePolicyFunc.java · runInternal · L76 → L80');
 expect(sourceTransition({ref:'create-api',line:45,method:'PolicyController.createPolicy'},{ref:'create-check',line:61,method:'CreatePolicyFunc.exec'}).title).toBe('Chuyển file');
 expect(sourceTransition({...to,line:102},{ref:'create-customer',line:204,method:'CreatePolicyFunc.fillMissingValue'}).route).toBe('runInternal:L102 → fillMissingValue:L204');
 expect(sourceTransition({ref:'create-customer',line:215,method:'CreatePolicyFunc.fillMissingValue'},{...to,line:103},'Trả về nơi gọi').title).toContain('Tiếp tục runInternal');
 expect(sourceMethod('create-data',80)).toBe('CreatePolicyFunc.runInternal');expect(sourceMethod('create-customer',206)).toBe('CreatePolicyFunc.fillMissingValue');
});

for(const mobile of [false,true])test(`${mobile?'mobile':'desktop'} final L76 executes once, history L75 → L76 is read only, same file L80 and Explorer links restore the checkpoint`,async({page})=>{
 if(mobile)await page.setViewportSize({width:390,height:844});
 await page.goto(route);await advanceTo(page,'objects-read');
 const positions=()=>group(page).getByRole('button').evaluateAll(es=>{const parent=es[0].parentElement!.getBoundingClientRect();return es.map(e=>{const r=e.getBoundingClientRect();return{x:r.x-parent.x,y:r.y-parent.y,width:r.width,height:r.height};});});
 const fixed=await positions();
 await expect(button(page,'Bước sau')).toBeDisabled();await expect(primary(page)).toBeEnabled();
 await primary(page).click();await expect(header(page)).toHaveAttribute('data-checkpoint-id','duplicate-guard');
 await expect(line(page,76)).toHaveAttribute('data-executed','true');await expect(primary(page)).toBeDisabled();await expect(button(page,'Bước sau')).toBeEnabled();
 expect(await positions()).toEqual(fixed);
 const walked=new URL(page.url()).searchParams.get('walk'),after=await page.getByTestId('debug-after').innerText();
 await button(page,'Điểm trước').click();await expect(line(page,75)).toHaveAttribute('data-viewing','true');
 await primary(page).click();await expect(line(page,76)).toHaveAttribute('data-viewing','true');
 expect(new URL(page.url()).searchParams.get('walk')).toBe(walked);expect(new URL(page.url()).searchParams.get('stop')).toBe('duplicate-guard');expect(await page.getByTestId('debug-after').innerText()).toBe(after);
 await button(page,'Bước sau').click();await expect(header(page)).toHaveAttribute('data-checkpoint-id','map-dates');
 await expect(page.getByTestId('source-handoff')).toContainText('Cùng file · CreatePolicyFunc.java · runInternal · L76 → L80');
 await expect(line(page,80)).toBeInViewport();await expect(line(page,76)).toBeAttached();await expect(page.getByTestId('policy-source')).toHaveAttribute('data-reading-mode','context');
 await expect(page.getByTestId('code-scroll')).toContainText('L79'); // Keep the missing snapshot line explicit.
 if(mobile)await button(page,'Mở cây thư mục').click();
 await expect(page.locator('.tree-file.selected')).toContainText('CreatePolicyFunc.java');
 const previous=page.getByRole('button',{name:/^Xem vị trí trước CreatePolicyFunc.java · runInternal:L76$/});
 await expect(previous).toBeVisible();await previous.focus();await expect(previous).toBeFocused();await previous.press('Enter');
 await expect(header(page)).toHaveAttribute('data-checkpoint-id','duplicate-guard');await expect(line(page,76)).toBeInViewport();
 expect(new URL(page.url()).searchParams.get('walk')).toBe(walked);expect(new URL(page.url()).searchParams.get('stop')).toBe('map-dates');
 await returnToStop(page);await expect(header(page)).toHaveAttribute('data-checkpoint-id','map-dates');
 await expect(line(page,80)).toBeInViewport();await expect(page.getByTestId('debug-after')).toContainText('Chưa chạy dòng này');
 await page.getByRole('button',{name:/^Mở vị trí đang xem CreatePolicyFunc.java · runInternal:L80$/}).click();await expect(line(page,80)).toBeInViewport();
 await expect(page.getByRole('button',{name:/^Xem vị trí trước CreatePolicyFunc.java · runInternal:L76$/})).toBeVisible();expect(await positions()).toEqual(fixed);
 for(const [i,name] of controls.entries())await expect(group(page).getByRole('button').nth(i)).toHaveAccessibleName(name);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(mobile?390:1512);
});

for(const fixture of ['QUOTE-NOT-FOUND','QUOTE-LEARN-103'])test(`stopped ${fixture} cannot advance stage by buttons or stepper, history stays readable`,async({page})=>{
 await page.goto(route);await page.getByLabel('Quote mẫu',{exact:true}).selectOption(fixture);await runThrough(page,fixture==='QUOTE-NOT-FOUND'?'quote-guard':'duplicate-guard');
 await expect(primary(page)).toBeDisabled();await expect(button(page,'Bước sau')).toBeDisabled();await expect(page.getByTestId('debug-branch')).toContainText('Luồng dừng do lỗi');
 const steps=page.getByRole('navigation',{name:'Sáu bước phát hành trực tiếp'}).getByRole('button');for(let i=2;i<6;i++)await expect(steps.nth(i)).toBeDisabled();
 const walked=new URL(page.url()).searchParams.get('walk');await button(page,'Điểm trước').click();await expect(primary(page)).toBeEnabled();await primary(page).click();expect(new URL(page.url()).searchParams.get('walk')).toBe(walked);await expect(button(page,'Bước sau')).toBeDisabled();
});

for(const mobile of [false,true])test(`${mobile?'mobile':'desktop'} all six stages keep the four labels/order, gate entries and preserve progress when returning to previous stage`,async({page})=>{
 if(mobile)await page.setViewportSize({width:390,height:844});await page.goto(route);
 await expect(button(page,'Bước trước')).toBeDisabled();await expect(button(page,'Điểm trước')).toBeDisabled();
 const visited=new Set<string>();
 for(let i=0;i<65;i++){
  for(const [j,name] of controls.entries())await expect(group(page).getByRole('button').nth(j)).toHaveAccessibleName(name);
  const u=new URL(page.url());visited.add(u.searchParams.get('node')??'quote');
  if(u.searchParams.get('stop')==='result-compare')break;
  if(await button(page,'Bước sau').isEnabled()){
   await expect(primary(page)).toBeDisabled();await button(page,'Bước sau').click();await expect(button(page,'Điểm trước')).toBeDisabled();
  }else await advance(page);
 }
 await runThrough(page,'result-compare');expect(visited.size).toBe(6);await expect(primary(page)).toBeDisabled();await expect(button(page,'Bước sau')).toBeDisabled();
 const walked=new URL(page.url()).searchParams.get('walk');await button(page,'Bước trước').click();await expect(header(page)).toHaveAttribute('data-checkpoint-id','flow-event');
 expect(new URL(page.url()).searchParams.get('walk')).toBe(walked);expect(new URL(page.url()).searchParams.get('stop')).toBe('result-compare');
 await button(page,'Bước sau').click();await expect(header(page)).toHaveAttribute('data-checkpoint-id','result-request');expect(new URL(page.url()).searchParams.get('walk')).toBe(walked);
 await returnToStop(page);await expect(page.getByTestId('debug-after')).toContainText('POL-FROM-QUOTE-LEARN-101');
});
