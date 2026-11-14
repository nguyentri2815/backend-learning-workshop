import type {CodeRow} from '../workshop/source';
export type SessionFile={id:string;path:string};
export type SessionFileChange=SessionFile&{status:'A'|'M'};
// Compare content, not patch metadata: a file created earlier can be modified now.
export function sessionFileChanges(files:SessionFile[],rows:(ref:string,through:number)=>CodeRow[],before:number,after:number):SessionFileChange[]{
 return files.flatMap(file=>{
  const previous=rows(file.id,before),next=rows(file.id,after);
  if(previous.map(r=>r.text).join('\n')===next.map(r=>r.text).join('\n'))return [];
  return [{...file,status:previous.length?'M' as const:'A' as const}];
 });
}

type FileHistory=(ref:string,through:number)=>{index:number;round:{id:string;title:string}}[];
export type FileMilestone={index:number;id:string;title:string;status:'A'|'M'};
export function sessionFileMilestones(ref:string,rows:(ref:string,through:number)=>CodeRow[],history:FileHistory,through:number):FileMilestone[]{
 return history(ref,through).flatMap(entry=>{
  const before=rows(ref,entry.index-1),after=rows(ref,entry.index);
  if(before.map(r=>r.text).join('\n')===after.map(r=>r.text).join('\n'))return [];
  return [{index:entry.index,id:entry.round.id,title:entry.round.title,status:before.length?'M' as const:'A' as const}];
 });
}
export function groupFilesByCreation(files:SessionFile[],milestones:Record<string,FileMilestone[]>){
 const groups=new Map<number,{milestone:FileMilestone;files:SessionFile[]}>();
 for(const file of files){
  const created=milestones[file.id]?.find(m=>m.status==='A');if(!created)continue;
  if(!groups.has(created.index))groups.set(created.index,{milestone:created,files:[]});
  groups.get(created.index)!.files.push(file);
 }
 return [...groups.values()].sort((a,b)=>a.milestone.index-b.milestone.index);
}
