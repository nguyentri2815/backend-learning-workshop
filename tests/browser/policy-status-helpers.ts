import {expect} from '@playwright/test';
import type {Page} from '@playwright/test';
import {statusFlows,statusFlowFor} from '../../src/content/policy/status';
export async function walkStatus(page:Page,flowId:string,until?:string){
 const flow=statusFlowFor(new URL(page.url()).searchParams);if(flow.id!==flowId)throw Error('Unexpected flow '+flow.id);const target=flow.points.findIndex(p=>p.id===(until??flow.points.at(-1)!.id));
 for(let i=0;i<100;i++){
  const stop=Number(new URL(page.url()).searchParams.get(`s.${flow.id}.stop`)??'-1');if(stop>=target)return;
  const next=flow.points[stop+1],stage=await page.locator('.status-practice').getAttribute('data-business-step');
  if(stage!==next.stage){await page.getByRole('button',{name:'Bước sau',exact:true}).click();await expect(page.getByTestId('status-checkpoint')).toHaveAttribute('data-viewing',next.id);}
  await page.getByRole('button',{name:'Điểm sau',exact:true}).click();await expect(page.getByTestId('status-checkpoint')).toHaveAttribute('data-viewing',next.id);await expect(page.getByTestId('status-checkpoint')).toHaveAttribute('data-executed','true');
 }
 throw Error('Replay did not progress: '+flowId);
}
export async function answerStatus(page:Page,flowId:string,stage:string){
 const step=statusFlows.find(f=>f.id===flowId)!.steps.find(s=>s.id===stage)!;
 for(let i=0;i<step.questions.length;i++){await page.getByRole('navigation',{name:'Tiến trình quyết định',exact:true}).getByRole('button').nth(i).click();await expect(page.locator('.assembly-question')).toContainText(step.questions[i].question);await page.locator('.assembly-choice-options input').first().click();await expect.poll(()=>new URL(page.url()).searchParams.get(`assemblyAnswers.status-${flowId}-${stage}`)?.split(',')[i]).toBe('0');}
}
