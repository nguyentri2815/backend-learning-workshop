type Point={id:string;stage:string;error?:string};
// Both lessons use the same rule: reading history cannot execute; a stage opens
// only after every required checkpoint in earlier stages is complete.
export function checkpointNavigation({stepIds,points,done,stageId,viewId,stopId,nextId,complete,failed=false}:{stepIds:string[];points:Point[];done:Set<string>;stageId:string;viewId:string;stopId:string;nextId?:string;complete:boolean[];failed?:boolean}){
 const stage=points.filter(p=>p.stage===stageId),view=points.find(p=>p.id===viewId)!,next=points.find(p=>p.id===nextId);
 const stageIndex=stepIds.indexOf(stageId),pointIndex=stage.findIndex(p=>p.id===viewId),openStages=stepIds.map((_,i)=>complete.slice(0,i).every(Boolean));
 const following=stage[pointIndex+1],reviewNext=following&&done.has(following.id)?following:undefined;
 const runNext=viewId===stopId&&next?.stage===stageId?next:undefined,pointNext=reviewNext??runNext;
 const nextStage=stageIndex<stepIds.length-1&&complete[stageIndex]&&openStages[stageIndex+1]?stepIds[stageIndex+1]:undefined;
 return {previousStage:stageIndex>0?stepIds[stageIndex-1]:undefined,previousPoint:stage[pointIndex-1]?.id,nextPoint:pointNext?.id,executeNext:!reviewNext&&Boolean(runNext),nextStage,openStages,
  pointReason:pointNext?'':view?.error&&done.has(viewId)?`Luồng dừng: ${view.error}`:complete[stageIndex]?'Đã hết checkpoint trong bước':failed?'Luồng đã dừng do lỗi':viewId!==stopId?'Về dòng đang chạy để tiếp tục':'Không còn checkpoint hợp lệ',
  stageReason:nextStage?'':stageIndex===stepIds.length-1?'Đây là bước cuối':failed?'Luồng dừng do lỗi':`Còn ${stage.filter(p=>!done.has(p.id)).length} checkpoint bắt buộc chưa chạy`};
}
