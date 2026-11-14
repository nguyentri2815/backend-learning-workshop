import {expect} from '@playwright/test';
export const control=(page,name)=>page.getByRole('button',{name,exact:true});
export async function advance(page){
 const previous=page.url();
 const point=control(page,'Điểm sau');
 await (await point.isEnabled()?point:control(page,'Bước sau')).click();
 await expect.poll(()=>page.url()).not.toBe(previous);
 await expect(page.getByTestId('policy-debug')).toHaveAttribute('data-checkpoint-id',new URL(page.url()).searchParams.get('at'));
}
export async function reach(page,id){
 for(let i=0;i<95;i++){if(new URL(page.url()).searchParams.get('stop')===id)return;await advance(page);}
 throw Error('Checkpoint not reached: '+id);
}
