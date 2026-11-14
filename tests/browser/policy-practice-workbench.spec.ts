import {expect,test} from '@playwright/test';
import {advanceTo,button,header,line,primary,ready,route,runThrough,returnToStop} from './execution-helpers';

test('one six-step stepper, default closed tools and explicit call L67 → method entry L70',async({page})=>{
 await page.goto(route);await advanceTo(page,'quote-read');await ready(page);
 await expect(page.getByRole('navigation',{name:'Sáu bước phát hành trực tiếp'}).getByRole('button')).toHaveCount(6);
 await expect(button(page,'Luồng thực thi')).toHaveAttribute('aria-expanded','false');await expect(button(page,'Network')).toHaveAttribute('aria-expanded','false');
 await expect(line(page,61)).toBeInViewport();expect((await page.getByTestId('code-scroll').boundingBox())!.height).toBeGreaterThan(400);
 await advanceTo(page,'internal-call');await expect(page.getByTestId('debug-branch')).toContainText('Vào runInternal');
 const walk=new URL(page.url()).searchParams.get('walk');await button(page,'Luồng thực thi').click();await page.getByRole('button',{name:'Xem Vào runInternal với Quote đã đọc L70',exact:true}).click();
 await expect(line(page,70)).toHaveAttribute('data-viewing','true');expect(new URL(page.url()).searchParams.get('stop')).toBe('internal-call');expect(new URL(page.url()).searchParams.get('walk')).toBe(walk);
 await expect(page.getByRole('dialog')).toBeVisible();await button(page,'Đóng bảng phụ').click();await returnToStop(page);await expect(line(page,67)).toHaveAttribute('data-viewing','true');await primary(page).click();await expect(header(page)).toHaveAttribute('data-checkpoint-id','internal-enter');await expect(line(page,70)).toBeInViewport();
});
for(const mobile of [false,true])test(`${mobile?'mobile':'desktop'} deep code reading, scopes, tools and next action remain usable`,async({page})=>{
 if(mobile)await page.setViewportSize({width:390,height:844});await page.goto(route);await advanceTo(page,'internal-call');await ready(page);
 await expect(button(page,'Toàn bộ file')).toHaveCount(0);await button(page,'Mở rộng ngữ cảnh').click();await expect(line(page,224)).toContainText('publishedQuote');
 const code=page.getByTestId('code-scroll');await code.evaluate(e=>e.scrollTop=e.scrollHeight);await expect(primary(page)).toBeInViewport();
 const position=await code.evaluate(e=>({x:e.scrollLeft,y:e.scrollTop,w:e.clientWidth})),url=page.url();await button(page,'Network').click();await expect(page.getByTestId('create-network')).toBeVisible();await page.keyboard.press('Escape');
 expect(await code.evaluate(e=>({x:e.scrollLeft,y:e.scrollTop,w:e.clientWidth}))).toEqual(position);expect(page.url()).toBe(url);
 await primary(page).click();await expect(line(page,70)).toBeInViewport();await button(page,'Điểm trước').click();await expect(header(page)).toHaveAttribute('data-checkpoint-id','internal-call');await expect(line(page,70)).toHaveAttribute('data-current','true');
 await returnToStop(page);await expect(header(page)).toHaveAttribute('data-checkpoint-id','internal-enter');
 expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(mobile?390:1512);
});
test('4 → 5 crosses an event; revisiting 5 → 4 → 5 retains Policy and checkpoint log',async({page})=>{
 await page.goto(route);await advanceTo(page,'flow-event');await expect(page.getByTestId('source-handoff')).toContainText('Qua event');
 await button(page,'Luồng thực thi').click();await expect(page.getByTestId('trace-group-flow')).toContainText('CreatePolicyEvent L329 → PolicyWorkflow L24');await button(page,'Đóng bảng phụ').click();
 await runThrough(page,'flow-realtime');const walk=new URL(page.url()).searchParams.get('walk');
 await button(page,'← Bước 4 · Ghi Policy').click();await expect(page.getByTestId('command-written')).toContainText('POL-FROM-QUOTE-LEARN-101');
 await page.getByRole('navigation',{name:'Sáu bước phát hành trực tiếp'}).getByRole('button').nth(4).click();expect(new URL(page.url()).searchParams.get('walk')).toBe(walk);
 await returnToStop(page);await expect(header(page)).toHaveAttribute('data-checkpoint-id','flow-realtime');await expect(page.getByTestId('query-after-view')).toContainText('POL-FROM-QUOTE-LEARN-101');
});
