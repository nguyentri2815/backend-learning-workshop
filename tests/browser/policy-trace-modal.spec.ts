import {expect,test} from '@playwright/test';
import type {Page,Locator} from '@playwright/test';
import {button,header,line,ready} from './execution-helpers';

const walk='quote-ui,quote-request,controller-call,quote-read';
function reviewUrl(stage:string,checkpoint:string,reference=false){
 const params=new URLSearchParams({group:'create',mode:'steps',node:stage,walk,stop:'quote-read',at:checkpoint});
 if(reference){params.set('ref','create-status');params.set('viewLine','195');}
 return '/journey/policy?'+params;
}
const scroller=(page:Page)=>page.getByLabel('Cuộn luồng thực thi',{exact:true});
const pagePosition=(page:Page)=>page.evaluate(()=>({x:window.scrollX,y:window.scrollY}));
const diagramPosition=(page:Page)=>scroller(page).evaluate(e=>({x:e.scrollLeft,y:e.scrollTop}));
const settle=(page:Page)=>page.evaluate(()=>new Promise<void>(resolve=>requestAnimationFrame(()=>requestAnimationFrame(()=>resolve()))));
async function selected(page:Page,id:string){
 for(const region of [header(page),page.getByTestId('checkpoint-editor'),page.locator('.checkpoint-variable-wrapper')])await expect(region).toHaveAttribute('data-checkpoint-id',id);
 expect(new URL(page.url()).searchParams.get('stop')).toBe('quote-read');expect(new URL(page.url()).searchParams.get('walk')).toBe(walk);
 await expect(page.getByRole('dialog',{name:'Luồng thực thi',exact:true})).toBeVisible();
}
async function chooseWithoutMoving(page:Page,target:Locator,id:string){
 await target.scrollIntoViewIfNeeded();await settle(page);const before=await diagramPosition(page),behind=await pagePosition(page);
 await target.click();await selected(page,id);await settle(page);
 expect(await diagramPosition(page)).toEqual(before);expect(await pagePosition(page)).toEqual(behind);
}

for(const mobile of [false,true])for(const entry of [
 {stage:'map',id:'status-return',node:'status-return',line:87,otherNode:'date-fields',other:'map-effective'},
 {stage:'result',id:'detail-read',node:'detail',line:32,otherNode:'compare',other:'result-compare'},
])test(`${mobile?'mobile':'desktop'} open at viewed ${entry.id}, browse nodes/checkpoints in place, explicitly return diagram/code/variables to L61`,async({page})=>{
 if(mobile)await page.setViewportSize({width:390,height:844});
 await page.goto(reviewUrl(entry.stage,entry.id));await ready(page);
 const behind=await pagePosition(page),codeBefore=await page.getByTestId('code-scroll').evaluate(e=>({x:e.scrollLeft,y:e.scrollTop}));
 await button(page,'Luồng thực thi').click();await selected(page,entry.id);
 const node=page.getByTestId(`trace-node-${entry.node}`),point=node.locator(`button[data-checkpoint-id="${entry.id}"]`);
 await expect(page.getByTestId(`trace-group-${entry.stage}`).getByRole('button').first()).toHaveAttribute('aria-expanded','true');
 await expect(node).toBeInViewport({ratio:1});await expect(point).toBeInViewport({ratio:1});await expect(point).toHaveAttribute('aria-current','location');await expect(node).toHaveAttribute('data-viewing','true');
 await settle(page);expect(await pagePosition(page)).toEqual(behind);expect(await page.getByTestId('code-scroll').evaluate(e=>({x:e.scrollLeft,y:e.scrollTop}))).toEqual(codeBefore);
 await expect(line(page,entry.line)).toHaveAttribute('data-viewing','true');
 const other=page.getByTestId(`trace-node-${entry.otherNode}`);
 await chooseWithoutMoving(page,other.locator('.trace-node-main'),entry.other);await expect(other).toHaveAttribute('data-viewing','true');
 await chooseWithoutMoving(page,point,entry.id);await expect(other).toHaveAttribute('data-viewing','false');
 if(!mobile){await page.mouse.click(20,400);await expect(page.getByRole('dialog')).toBeVisible();}
 await button(page,'Điểm đang dừng').click();await selected(page,'quote-read');
 const stopped=page.getByTestId('trace-node-read'),stopPoint=stopped.locator('button[data-checkpoint-id="quote-read"]');
 await expect(stopped).toBeInViewport({ratio:1});await expect(stopPoint).toBeInViewport({ratio:1});await expect(stopPoint).toHaveAttribute('aria-current','location');
 await expect(line(page,61)).toHaveAttribute('data-viewing','true');await expect(page.getByTestId('debug-before')).toContainText('QUOTE-LEARN-101');await expect(page.getByTestId('debug-after')).toContainText('Optional có giá trị');
 await settle(page);expect(await pagePosition(page)).toEqual(behind);
 // Explicit return must also work when the viewed checkpoint has not changed.
 await scroller(page).evaluate(e=>{e.scrollTop=e.scrollHeight;});await button(page,'Điểm đang dừng').click();await expect(stopPoint).toBeInViewport({ratio:1});
 await page.keyboard.press('Escape');await expect(page.getByRole('dialog')).not.toBeVisible();expect(await pagePosition(page)).toEqual(behind);
 await button(page,'Luồng thực thi').click();await expect(stopPoint).toBeInViewport({ratio:1});await button(page,'Đóng bảng phụ').click();await expect(page.getByRole('dialog')).not.toBeVisible();
});

test('reference source falls back to the viewed lesson checkpoint when opening the modal',async({page})=>{
 await page.goto(reviewUrl('map','status-return',true));await ready(page);await expect(page.getByTestId('policy-source')).toHaveAttribute('data-source-id','create-status');
 const original=page.url(),behind=await pagePosition(page);await button(page,'Luồng thực thi').click();
 await expect(page.getByTestId('trace-node-status-return')).toBeInViewport({ratio:1});await expect(page.getByTestId('trace-node-status-return')).toHaveAttribute('data-viewing','true');
 expect(page.url()).toBe(original);expect(await pagePosition(page)).toEqual(behind);await page.keyboard.press('Escape');
 await expect(page.getByTestId('policy-source')).toHaveAttribute('data-source-id','create-status');
});

test('the same open modal supports reviewing all six stages without changing the simulated stop or background scroll',async({page})=>{
 await page.goto(reviewUrl('map','status-return'));await ready(page);await button(page,'Luồng thực thi').click();
 await expect(page.getByTestId('trace-node-status-return')).toBeInViewport();await button(page,'Xem toàn tuyến').click();
 for(const [node,id] of [['ui','quote-ui'],['request','quote-request'],['controller','controller-call'],['read','quote-read'],['status-return','status-return'],['jpa','save-jpa'],['view','flow-write'],['compare','result-compare']]){
  const point=page.getByTestId(`trace-node-${node}`).locator(`button[data-checkpoint-id="${id}"]`);await chooseWithoutMoving(page,point,id);await expect(point).toHaveAttribute('aria-current','location');
 }
 await button(page,'Điểm đang dừng').click();await selected(page,'quote-read');await expect(page.getByTestId('trace-node-read')).toBeInViewport({ratio:1});
});
