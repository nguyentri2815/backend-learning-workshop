import {expect} from '@playwright/test';
import type {Page} from '@playwright/test';
import {updateFlows} from '../../src/content/policy/update';
export async function walkUpdate(page:Page,flowId:string,until?:string){
 const flow=updateFlows.find(f=>f.id===flowId)!;
 for(const [i,step] of flow.steps.entries()){
  const points=flow.points.filter(p=>p.stage===step.id);
  if(i>0){await page.getByRole('button',{name:'Bước sau',exact:true}).click();await expect(page.getByTestId('update-checkpoint')).toHaveAttribute('data-viewing',points[0].id);}
  for(const point of points){
   if(point!==flow.points[0]){await page.getByRole('button',{name:'Điểm sau',exact:true}).click();await expect(page.getByTestId('update-checkpoint')).toHaveAttribute('data-viewing',point.id);await expect(page.getByTestId('update-checkpoint')).toHaveAttribute('data-executed','true');}
   if(point.id===until)return;
  }
 }
}
export async function answerUpdate(page:Page,flow='checkout',step='write'){
 for(let i=0;i<2;i++){await page.getByRole('navigation',{name:'Tiến trình quyết định'}).getByRole('button').nth(i).click();await expect(page.locator('.assembly-question')).toContainText(updateFlows.find(f=>f.id===flow)!.steps.find(s=>s.id===step)!.questions[i].question);await page.locator('.assembly-choice-options input').first().click();await expect.poll(()=>new URL(page.url()).searchParams.get(`assemblyAnswers.update-${flow}-${step}`)?.split(',')[i]).toBe('0');}
}
