import {expect,test} from '@playwright/test';
import type {Page} from '@playwright/test';
import {PRACTICE_KEY} from '../../src/setup/project-practice-model';
import {executionSession} from '../../src/policy/policy-execution';

const f1='/journey/environment?experience=project&step=tools&task=java&pfile=build&pline=48&pview=source';
const checkpoints=executionSession(new URLSearchParams(),'quote').all;
const saveWalk=checkpoints.slice(0,checkpoints.findIndex(c=>c.id==='save-return')+1).map(c=>c.id).join(',');
const l159='/journey/policy?'+new URLSearchParams({group:'create',mode:'steps',node:'save',stop:'save-return',at:'save-return',walk:saveWalk,reader:'context',backend:'1'});
const button=(p:Page,name:string)=>p.getByRole('button',{name,exact:true});
const task=(p:Page)=>p.getByRole('combobox',{name:'Nhiệm vụ trong bước',exact:true});
const ready=async(p:Page)=>{await expect(p.locator('.practice-loading')).toHaveCount(0);await expect(task(p)).toBeVisible();};
const progress=(p:Page)=>p.evaluate(key=>JSON.parse(localStorage.getItem(key)??'{}'),PRACTICE_KEY);
async function pin(p:Page){await p.getByTestId('practice-workstation').evaluate(e=>{
 const top=parseFloat(getComputedStyle(e.querySelector('.practice-workbench-toolbar')!).top)||0;
 window.scrollTo({top:scrollY+e.getBoundingClientRect().top-top+1,behavior:'instant'});
});await expect(p.locator('.practice-workbench-toolbar')).toHaveAttribute('data-pinned','true');}
async function stage(p:Page,id:string,index:number){
 const select=p.getByRole('combobox',{name:'Bước thực hành Policy'});
 if(await select.isVisible())await select.selectOption(id);
 else await p.getByRole('navigation',{name:'Sáu bước phát hành trực tiếp'}).getByRole('button').nth(index).click();
}

for(const mobile of [false,true])test(`${mobile?'mobile':'desktop'} handbook F1: step-local tasks, source, both modes and progress survive navigation and reload`,async({page})=>{
 if(mobile)await page.setViewportSize({width:390,height:844});
 await page.goto(f1);await ready(page);
 await expect(page.getByRole('heading',{name:'Hiểu và chạy dự án',exact:true})).toBeVisible();
 await expect(task(page)).toHaveValue('java');
 await expect(task(page).getByRole('option')).toHaveCount(3);
 await expect(task(page)).toContainText('F1 · Java yêu cầu');
 await expect(task(page)).not.toContainText('Docker');
 await expect(page.locator('.practice-task-nav')).toHaveCount(0);
 await expect(page.locator('body')).toHaveCSS('background-color','rgb(247, 246, 242)');
 const line=page.locator('.practice-code [data-line="48"]');
 await expect(page.getByTestId('highlighted-code')).toHaveAttribute('data-ready','true');
 if(mobile)await page.locator('.practice-center').scrollIntoViewIfNeeded();
 await expect(line).toBeInViewport();
 if(!mobile){
  const project=(await page.locator('.practice-project').boundingBox())!,editor=(await page.locator('.practice-center').boundingBox())!,instruction=(await page.locator('.practice-task-panel').boundingBox())!;
  expect(project.x+project.width).toBeLessThanOrEqual(editor.x+1);expect(editor.x+editor.width).toBeLessThanOrEqual(instruction.x+1);expect(editor.width).toBeGreaterThan(800);
 }
 await button(page,'Nhiệm vụ sau').click();await expect(task(page)).toHaveValue('jdk');
 expect((await progress(page)).completed).not.toContain('java');
 await button(page,'Nhiệm vụ trước').click();await expect(task(page)).toHaveValue('java');
 await button(page,'Chọn dòng 48').click();await expect.poll(async()=>(await progress(page)).completed).toContain('java');
 await task(page).selectOption('jdk');await expect(task(page)).toHaveValue('jdk');
 const jdk=page.getByRole('combobox',{name:'JDK cho terminal/Gradle trong bài',exact:true});
 await jdk.selectOption('21');await expect(jdk).toHaveValue('21');
 const saved=(await progress(page)).completed;
 await task(page).selectOption('ide');await expect(task(page)).toHaveValue('ide');
 await task(page).selectOption('jdk');await expect(jdk).toHaveValue('21');
 await page.reload();await ready(page);await expect(task(page)).toHaveValue('jdk');await expect(jdk).toHaveValue('21');
 expect((await progress(page)).completed).toEqual(saved);
 await page.locator('.practice-experience-switch').getByRole('button',{name:'Hướng dẫn trên máy thật',exact:true}).click();
 await expect(page.locator('.guide-action-body')).toBeVisible();
 await page.locator('.practice-experience-switch').getByRole('button',{name:'Thực hành trên project',exact:true}).click();await ready(page);
 expect((await progress(page)).completed).toEqual(saved);
 await page.getByRole('navigation',{name:'Điều hướng 7 bước'}).getByRole('button',{name:/Bước 3:/}).click();await ready(page);await expect(task(page)).toHaveValue('profile');
 expect((await progress(page)).completed).toEqual(saved);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(mobile?390:1512);
});

for(const mobile of [false,true])test(`${mobile?'mobile':'desktop'} handbook L159: readable pinned source, checkpoint/stage navigation, graph and persisted editor theme`,async({page})=>{
 if(mobile)await page.setViewportSize({width:390,height:844});
 await page.goto(l159);await expect(page.getByTestId('highlighted-code')).toHaveAttribute('data-ready','true');
 await expect(page.getByRole('heading',{name:'Bước 4/6 · Ghi Policy',exact:true})).toBeVisible();
 await expect(page.locator('.policy-practice-title')).toContainText('Trả kết quả Command');
 await expect(page.locator('.practice-workbench-toolbar')).toHaveAttribute('data-expanded','false');
 await pin(page);
 const line=page.getByTestId('policy-source').locator('[data-line="159"]');
 await expect(line).toBeInViewport();await expect(line).toHaveAttribute('data-viewing','true');
 const bounds=(await line.boundingBox())!,toolbar=(await page.locator('.practice-workbench-toolbar').boundingBox())!;
 expect(bounds.y).toBeGreaterThanOrEqual(toolbar.y+toolbar.height);
 expect((await page.getByTestId('code-scroll').boundingBox())!.height).toBeGreaterThan(mobile?200:450);
 await expect(button(page,'Bước sau')).toBeEnabled();await expect(button(page,'Bước sau')).toHaveCSS('background-color','rgb(36, 87, 70)');
 const walked=new URL(page.url()).searchParams.get('walk');
 await button(page,'Điểm trước').click();await expect(page.getByTestId('policy-debug')).toHaveAttribute('data-checkpoint-id','published-write');
 expect(new URL(page.url()).searchParams.get('stop')).toBe('save-return');expect(new URL(page.url()).searchParams.get('walk')).toBe(walked);
 await button(page,'Điểm sau').click();await expect(page.getByTestId('policy-debug')).toHaveAttribute('data-checkpoint-id','save-return');
 await button(page,'Luồng thực thi').click();
 const dialog=page.getByRole('dialog',{name:'Luồng thực thi',exact:true});await expect(dialog).toBeVisible();await expect(page.getByTestId('trace-node-return')).toBeInViewport();
 await dialog.locator('button[data-checkpoint-id="published-call"]').click();await expect(dialog).toBeVisible();
 expect(new URL(page.url()).searchParams.get('stop')).toBe('save-return');
 await dialog.getByRole('button',{name:'Điểm đang dừng',exact:true}).click();await button(page,'Đóng bảng phụ').click();
 await pin(page);await page.getByRole('combobox',{name:'Giao diện workspace code',exact:true}).selectOption('dark');await expect(page.getByTestId('highlighted-code')).toHaveAttribute('data-syntax-theme','dark');
 await expect(page.getByTestId('code-scroll')).toHaveCSS('background-color','rgb(30, 31, 34)');
 const url=page.url();await page.reload();await expect(page.getByTestId('highlighted-code')).toHaveAttribute('data-syntax-theme','dark');expect(page.url()).toBe(url);
 await expect(page.getByTestId('policy-debug')).toHaveAttribute('data-checkpoint-id','save-return');
 await button(page,'Bước sau').click();await expect(page.getByTestId('policy-debug')).toHaveAttribute('data-checkpoint-id','flow-event');
 await stage(page,'save',3);await expect(page.getByTestId('policy-debug')).toHaveAttribute('data-checkpoint-id','save-call');
 expect(new URL(page.url()).searchParams.get('walk')).toBe(walked);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(mobile?390:1512);
});

test('top navigation and references work by keyboard and narrow menu without losing the saved lesson URL',async({page})=>{
 await page.goto(f1);await ready(page);
 const nav=page.getByRole('navigation',{name:'Điều hướng chính',exact:true});
 await expect(nav.getByRole('link')).toHaveCount(4);await expect(page.locator('.sidebar')).toHaveCount(0);
 const saved=page.url();await nav.getByRole('link',{name:'Khám phá Policy',exact:true}).click();
 await nav.getByRole('link',{name:'Hiểu và chạy dự án',exact:true}).click();await expect(page).toHaveURL(saved);
 await page.locator('.notebook-references > summary').click();await expect(page.locator('.notebook-reference-content')).toContainText('agent-service-workspaces');
 await page.keyboard.press('Escape');await expect(page.locator('.notebook-references')).not.toHaveAttribute('open');
 await page.setViewportSize({width:390,height:844});
 await button(page,'Mở điều hướng').click();await expect(nav).toBeVisible();
 await nav.getByRole('link',{name:'Yêu cầu bồi thường',exact:true}).click();await expect(page).toHaveURL(/journey\/claims/);await expect(nav).not.toBeVisible();
 await page.locator('.notebook-references > summary').click();await page.locator('.notebook-reference-content').getByRole('link',{name:/Nguồn & phạm vi/}).click();await expect(page).toHaveURL(/\/sources$/);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
});
