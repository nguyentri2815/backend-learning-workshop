import {expect} from '@playwright/test';
import type {Page} from '@playwright/test';
export const button=(p:Page,name:string)=>p.getByRole('button',{name,exact:true});
export const primary=(p:Page)=>button(p,'Điểm sau');
export async function openCheckpointDetails(p:Page){
 const toggle=button(p,'Mở chi tiết');if(await toggle.isVisible())await toggle.click();
}
export async function returnToStop(p:Page){await openCheckpointDetails(p);await button(p,'Quay về dòng đang chạy').click();}
export async function advance(p:Page){
 const previous=p.url();
 if(await primary(p).isEnabled())await primary(p).click();
 else await button(p,'Bước sau').click();
 await expect.poll(()=>p.url()).not.toBe(previous);
 await expect(header(p)).toHaveAttribute('data-checkpoint-id',new URL(p.url()).searchParams.get('at')!);
}
export const line=(p:Page,n:number)=>p.getByTestId('policy-source').locator(`[data-line="${n}"]`);
export const header=(p:Page)=>p.getByTestId('policy-debug');
export const route='/journey/policy?group=create&mode=steps&node=quote';
export async function advanceTo(p:Page,id:string){for(let i=0;i<95;i++){if(new URL(p.url()).searchParams.get('stop')===id)return;await advance(p);}throw Error(`Checkpoint not reached: ${id}`);}
export async function runThrough(p:Page,id:string){await advanceTo(p,id);if(!(new URL(p.url()).searchParams.get('walk')??'').split(',').includes(id))await primary(p).click();}
export async function ready(p:Page){await expect(p.getByTestId('highlighted-code')).toHaveAttribute('data-ready','true');await p.getByTestId('practice-workstation').evaluate(e=>e.scrollIntoView({block:'start'}));}
