import {listStages} from '../content/policy/list';
import {listJourney,journeyForPoint} from '../content/policy/list-journey';
import {checkpointNavigation} from './checkpoint-navigation';
export function listCheckpointMethod(id:string){const methods:Record<string,string>={'list-api':'PolicyController.search','list-input':'SearchPolicyRequest','list-scope':'SearchPolicyFunc.doFilter','list-filter':'SearchPolicyFunc.doFilter','list-page':'QueryCustomRepository.executeCustomSqlQuery','list-result':'SearchPolicyFunc.exec','list-table':'PolicyListResponse','list-handoff':'PolicyController.paymentMethod'};return methods[id]??id;}
export function listReplay({hasRequest,stop,errorAt,params,viewId,stepId}:{hasRequest:boolean;stop:number;errorAt:number|null;params:URLSearchParams;viewId:string;stepId:string}){
 const skipped=(i:number)=>errorAt===2&&(i===3||i===4);
 const done=new Set(listStages.filter((_,i)=>hasRequest&&i<=stop&&!skipped(i)).map(p=>p.id));
 const next=listStages.find((p,i)=>!done.has(p.id)&&!skipped(i));
 const candidate=params.get('listCursor'),cursor=listStages.find(p=>p.id===candidate&&(done.has(p.id)||p.id===next?.id))??listStages[Math.max(0,stop)];
 const complete=listJourney.map(s=>s.points.every(id=>done.has(id)||skipped(listStages.findIndex(p=>p.id===id))));
 const nav=checkpointNavigation({stepIds:listJourney.map(s=>s.id),points:listStages.map(p=>({id:p.id,stage:journeyForPoint(p.id)!.id})),done,stageId:stepId,viewId,stopId:hasRequest?cursor.id:'none',nextId:hasRequest?next?.id:undefined,complete});
 return {done,next,cursor,complete,nav,skipped};
}
