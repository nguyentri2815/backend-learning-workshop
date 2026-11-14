export function implementationPosition(tasks:{id:string}[],params:URLSearchParams,doneKey:string,taskKey:string){
 const done=(params.get(doneKey)??'').split(',').filter(id=>tasks.some(t=>t.id===id));
 const firstPending=tasks.findIndex(t=>!done.includes(t.id)),requested=tasks.findIndex(t=>t.id===params.get(taskKey));
 const limit=firstPending<0?tasks.length-1:firstPending,index=requested>=0?Math.min(requested,limit):Math.max(0,limit);
 return {done,firstPending,index};
}
