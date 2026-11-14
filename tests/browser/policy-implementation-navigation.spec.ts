import {test,expect} from '@playwright/test';
import {implementationLessons} from '../../src/content/policy/assembly-implementation';

for(const list of [false,true])test(`${list?'List':'Create'}: rapid previous/next pairs use current URL and survive reload`,async({page})=>{
 const params=new URLSearchParams({group:list?'list':'create',mode:'assembly'});
 const id=list?'list-find':'validate';params.set(`assemblyAnswers.${id}`,'0,0');params.set(`assemblyView.${id}`,'pattern');params.set(`assemblyDiagram.${id}`,'1');params.set(`assemblyDiagramMode.${id}`,'practice');
 const tasks=list?['pattern','dto','endpoint']:implementationLessons.validate.tasks.map(t=>t.id),taskKey=list?'listBuildTask':'assemblyPractice.validate.task',doneKey=list?'listBuildDone':'assemblyPractice.validate.done';
 if(list)params.set('node','list-api');else params.set('assemblyStep','validate');params.set(taskKey,tasks.at(-1)!);params.set(doneKey,tasks.join(','));
 await page.goto('/journey/policy?'+params);const dialog=page.getByRole('dialog',{name:'Sơ đồ phối hợp và cây workspace'}),task=dialog.locator(list?'.list-build-task':'.implementation-task');await expect(task).toHaveAttribute('data-task',tasks.at(-1)!);
 await dialog.getByRole('button',{name:'Trước',exact:true}).evaluate(button=>{(button as HTMLButtonElement).click();(button as HTMLButtonElement).click();});
 await expect(task).toHaveAttribute('data-task',tasks.at(-3)!);expect(new URL(page.url()).searchParams.get(taskKey)).toBe(tasks.at(-3));
 await dialog.getByRole('button',{name:'Tiếp theo',exact:true}).evaluate(button=>{(button as HTMLButtonElement).click();(button as HTMLButtonElement).click();});
 await expect(task).toHaveAttribute('data-task',tasks.at(-1)!);await page.reload();await expect(task).toHaveAttribute('data-task',tasks.at(-1)!);
});
