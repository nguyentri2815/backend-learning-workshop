import {chromium,expect} from '@playwright/test';
import fs from 'node:fs';
import {statusFlows,statusFlowFor,statusKey} from '../src/content/policy/status.ts';

const browser=await chromium.launch(),page=await browser.newPage({viewport:{width:1440,height:1000},deviceScaleFactor:1});
page.setDefaultTimeout(15000);
const base='http://localhost:3182/journey/policy',observations=[],errors=[];
page.on('pageerror',e=>errors.push(e.message));
async function shot(flow,name){
 if(['overview','reason','cooperate','pattern'].includes(name))await page.evaluate(()=>scrollTo(0,0));
 await page.evaluate(async()=>{await document.fonts.ready;});
 const path=`docs/review/status-${flow.id}-${name}.png`;
 await page.screenshot({path});
 observations.push({flow:flow.id,name,path,url:page.url(),viewport:page.viewportSize(),zoom:await page.evaluate(()=>visualViewport.scale),deviceScaleFactor:1});
}
async function advance(target){
 const flow=statusFlowFor(new URL(page.url()).searchParams),last=flow.points.findIndex(p=>p.id===target);
 if(last<0)throw Error('Unknown checkpoint '+target);
 for(let i=0;i<100;i++){
  const stop=Number(new URL(page.url()).searchParams.get(statusKey(flow,'stop'))??'-1');if(stop>=last)return;
  const next=flow.points[stop+1],stage=await page.locator('.status-practice').getAttribute('data-business-step');
  if(stage!==next.stage){await page.getByRole('button',{name:'Bước sau',exact:true}).click();await expect(page.getByTestId('status-checkpoint')).toHaveAttribute('data-viewing',next.id);}
  await page.getByRole('button',{name:'Điểm sau',exact:true}).click();await expect(page.getByTestId('status-checkpoint')).toHaveAttribute('data-viewing',next.id);await expect(page.getByTestId('status-checkpoint')).toHaveAttribute('data-executed','true');
 }
 throw Error('No progress in '+flow.id);
}
async function answer(flow){
 const step=flow.steps.find(s=>s.id==='write');
 for(let i=0;i<2;i++){await page.getByRole('navigation',{name:'Tiến trình quyết định',exact:true}).getByRole('button').nth(i).click();await expect(page.locator('.assembly-question')).toContainText(step.questions[i].question);await page.locator('.assembly-choice-options input').first().click();await expect.poll(()=>new URL(page.url()).searchParams.get(`assemblyAnswers.status-${flow.id}-write`)?.split(',')[i]).toBe('0');}
}
for(const flow of statusFlows){
 await page.goto(base+'?'+new URLSearchParams({group:'status',flow:flow.id,mode:'overview'}));await page.getByTestId('status-journey-map').waitFor();await shot(flow,'overview');await page.locator('.policy-shared-map').scrollIntoViewIfNeeded();await shot(flow,'overview-map');
 await page.getByRole('button',{name:'Làm lại từng bước',exact:true}).click();await page.getByRole('button',{name:flow.startLabel,exact:true}).click();await advance(flow.points.find(p=>p.effect==='apply').id);await page.getByTestId('practice-workstation').evaluate(el=>el.scrollIntoView({block:'start',behavior:'instant'}));await shot(flow,'checkpoint');const stop=new URL(page.url()).searchParams.get(statusKey(flow,'stop'));
 await page.getByRole('tab',{name:'Tư duy lắp ráp',exact:true}).click();await page.locator('.assembly-question').waitFor();await shot(flow,'reason');await answer(flow);await page.getByRole('tab',{name:'Phối hợp',exact:true}).click();await expect(page.getByRole('tab',{name:'Phối hợp',exact:true})).toHaveAttribute('aria-selected','true');await shot(flow,'cooperate');await page.getByRole('button',{name:'Xem mẫu thiết kế',exact:true}).click();await expect(page.getByRole('tab',{name:'Chọn mẫu',exact:true})).toHaveAttribute('aria-selected','true');await expect(page.locator('.assembly-pair-frames .assembly-frame [data-ready=true]')).toHaveCount(2);await shot(flow,'pattern');
 if(flow.id==='date'){await page.locator('.assembly-pattern-inspector').scrollIntoViewIfNeeded();await shot(flow,'pattern-code');}
 await page.getByRole('button',{name:'Xem sơ đồ phối hợp',exact:true}).click();const dialog=page.getByRole('dialog');await dialog.waitFor();if(flow.id==='date'){
  await shot(flow,'diagram');const edge=flow.pairs.find(p=>p.stage==='write');
  for(const side of ['A','B']){if(side==='B')await dialog.getByRole('navigation',{name:'Chọn quan hệ của mẫu',exact:true}).getByRole('button',{name:edge.label,exact:true}).click();await dialog.getByRole('button',{name:side==='A'?'A · Đi tới bên gọi / nơi cung cấp':'B · Đi tới bên nhận',exact:true}).click();await dialog.getByRole('button',{name:'Mở toàn bộ file',exact:true}).click();const focus=side==='A'?edge.a:edge.b;await expect(dialog.locator(`[data-full-source=${focus.ref}] [data-line="${focus.from}"]`)).toHaveAttribute('data-code-tone',side==='A'?'caller':'receiver');await shot(flow,'full-source-'+side);}
 }
 await dialog.getByRole('tab',{name:'Từng bước triển khai',exact:true}).click();
 for(const kind of ['locate','connect','trial']){
  await expect(dialog.locator('.list-build-task')).toHaveAttribute('data-task',`write-${kind}`);await dialog.getByRole('button',{name:'Chỉ vị trí',exact:true}).click();
  if(kind==='locate')await dialog.getByRole('button',{name:'Xác nhận vị trí',exact:true}).click();
  if(kind==='connect'){await dialog.getByRole('combobox',{name:'Thao tác triển khai',exact:true}).selectOption('source');await dialog.getByRole('button',{name:'Nối đoạn code',exact:true}).click();await expect(dialog.locator('.list-build-diff')).toBeVisible();await dialog.locator('.list-build-diff').scrollIntoViewIfNeeded();await expect(dialog.locator(':scope > header')).toBeInViewport();await expect(dialog.getByRole('tab',{name:'Sơ đồ liên quan',exact:true})).toBeInViewport();await expect(dialog.locator('.list-tree')).toBeInViewport();await shot(flow,'implementation');}
  if(kind==='trial'){for(const button of await dialog.locator('[data-test-case]').all())await button.click();await expect(dialog.locator('.list-build-result')).toContainText('Đã đối chiếu');await shot(flow,'trial');}
  else await dialog.getByRole('button',{name:'Tiếp theo',exact:true}).click();
 }
 await page.keyboard.press('Escape');await page.getByRole('tab',{name:'Làm lại từng bước',exact:true}).click();expect(new URL(page.url()).searchParams.get(statusKey(flow,'stop'))).toBe(stop);await advance(flow.points.at(-1).id);await page.getByTestId('status-diff').scrollIntoViewIfNeeded();await shot(flow,'result');
 console.log(`Captured ${flow.id}: three modes, implementation, persisted result.`);
}
const date=statusFlows[0],dateCases=[['before','date-view',0,1],['success','date-view',100,1],['after','date-view',-1,1],['effective-boundary','date-select',null,0],['expiration-boundary','date-select',null,0],['boundary-selected','date-view',100,1],['unchanged','date-compare',100,0],['terminated-after-select','date-guard',null,0]];
for(const [scenario,last,calculated,writes] of dateCases){
 await page.goto(base+'?'+new URLSearchParams({group:'status',flow:'date',mode:'steps',[statusKey(date,'draftScenario')]:scenario}));await page.getByRole('button',{name:date.startLabel,exact:true}).click();await advance(last);await expect(page.getByTestId('status-write-count')).toHaveText(String(writes));await expect(page.getByTestId('status-calculated')).toContainText(calculated===null?'Chưa chạy':String(calculated));if(!writes)await expect(page.getByTestId('status-after')).toHaveCount(0);await page.getByTestId(writes?'status-diff':'status-stop').scrollIntoViewIfNeeded();await shot(date,'case-'+scenario);
}
const online=statusFlows.find(f=>f.id==='online-initial');
for(const scenario of ['queue','scan','published','queue-empty']){await page.goto(base+'?'+new URLSearchParams({group:'status',flow:online.id,mode:'steps',[statusKey(online,'draftScenario')]:scenario}));await page.getByRole('button',{name:online.startLabel,exact:true}).click();const active=statusFlowFor(new URL(page.url()).searchParams);await advance(scenario==='published'?'online-entry':scenario==='queue-empty'?'online-queue-entry':active.points.at(-1).id);await page.getByTestId(['published','queue-empty'].includes(scenario)?'status-stop':'status-diff').scrollIntoViewIfNeeded();await shot(online,'entry-'+scenario);}
await page.setViewportSize({width:390,height:844});await page.goto(base+'?group=status&mode=overview');await page.getByTestId('status-journey-map').waitFor();await shot(date,'mobile-overview');await page.getByRole('button',{name:'Làm lại từng bước',exact:true}).click();await page.getByRole('button',{name:date.startLabel,exact:true}).click();await advance('date-apply');await page.getByTestId('practice-workstation').scrollIntoViewIfNeeded();await shot(date,'mobile-checkpoint');
expect(errors).toEqual([]);fs.writeFileSync('docs/review/policy-status-links.json',JSON.stringify({observations,errors},null,2)+'\n');await browser.close();console.log(`Saved ${observations.length} review views and exact links.`);
