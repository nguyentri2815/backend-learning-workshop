import {creationContext} from './create-model';
import {samplePolicies} from './policy-model';
import {detailJourney,detailPoints,detailStepFor} from '../content/policy/detail';
import {checkpointNavigation} from './checkpoint-navigation';
export const detailSamples=[{id:'standard',label:'Có đối tượng · checkout đầy đủ'},{id:'lean',label:'Không có đối tượng · thiếu checkout'},{id:'offline',label:'Đại lý thu hộ · checkoutForPolicy'},{id:'no-tx',label:'Có checkout · thiếu tx'}];
export function detailFixture(id:string,profile='standard',params=new URLSearchParams()){
 const created=creationContext(params);
 const policy=[...samplePolicies,...(created.commandReady?[created.policy]:[])].find(p=>p.id===id);
 if(!policy)return {id,main:null,objects:[],payment:null,response:null,wrapper:null,error:'AGENT.POLICY_NOT_EXIST'};
 const checkout=profile==='lean'?null:{reqPaymentId:`ORDER-${id}`,tx:profile==='no-tx'?null:{createdAt:'2026-10-20T08:30:00.000Z'}};
 const main={id:policy.id,policyCode:policy.policyCode,customerName:policy.customerName,status:policy.status,insuranceTotalAmount:policy.insuranceTotalAmount,paymentType:profile==='offline'?'COLLECTION_AGENT':'VNPay',paymentStatus:1,paymentStatusFromSP:'PAYED',paidTime:'2026-10-20T08:35:00.000Z',paidTimeFromCore:null,checkoutInfo:checkout,checkoutInfoForPolicy:profile==='lean'?null:{reqPaymentId:`COLLECT-${id}`}};
 // Fixture includes unrelated / deleted objects to make the repository predicate observable.
 const allObjects=profile==='lean'?[]:[{id:`INS-${id}-01`,entityId:id,objectType:1,deleted:false,status:100},{id:`INS-${id}-02`,entityId:id,objectType:1,deleted:true,status:100},{id:`INS-${id}-03`,entityId:id,objectType:0,deleted:false,status:100}];
 const objects=profile==='lean'?[]:allObjects.filter(o=>o.entityId===id&&o.objectType===1&&!o.deleted).sort((a,b)=>a.id.localeCompare(b.id));
 const payment={totalInsuranceAmount:main.insuranceTotalAmount,paymentType:main.paymentType,paymentStatusFromCore:main.paymentStatus,createdTime:main.checkoutInfo?.tx?.createdAt??null,paymentTimeFromCore:main.paidTimeFromCore,paymentTimeFromSPL:main.paidTime,paymentStatusFromSPL:main.paymentStatusFromSP,paymentOrderNo:['SmartPay','VNPay','PayMe'].includes(main.paymentType)?main.checkoutInfo?.reqPaymentId??null:main.checkoutInfoForPolicy?.reqPaymentId??null};
 const insuredObjects=objects.map(({deleted,...object})=>{void deleted;return object;});
 const response={id,policyCode:main.policyCode,customerName:main.customerName,status:main.status,insuranceTotalAmount:main.insuranceTotalAmount,insuredObjects,paymentInfoPolicyModel:payment};
 return {id,main,allObjects,objects,payment,response,wrapper:{success:true,statusCode:'200',data:response},error:null};
}
export function detailState(params:URLSearchParams){
 const id=params.get('detailId')??params.get('selected')??'POL-LEARN-001',profile=params.get('detailSample')??'standard';
 const result=detailFixture(id,profile,params);
 const sent=params.get('detailSent')===id;
 const raw=Number(params.get('detailStop')??'-1'),stop=sent?Math.max(-1,Math.min(result.error?2:8,Number.isInteger(raw)?raw:-1)):-1;
 const done=new Set(detailPoints.filter((_,i)=>i<=stop).map(p=>p.id));
 const next=detailPoints[stop+1],candidate=detailPoints.find(p=>p.id===params.get('detailCursor')&&(done.has(p.id)||p===next));
 const cursor=candidate??detailPoints[Math.max(stop,0)],step=currentStep(params);
 const point=detailPoints.find(p=>p.id===(params.get('node')??params.get('point'))&&detailStepFor(p.id)===step)??detailPoints.find(p=>p.id===step.points[0])!;
 const failed=Boolean(sent&&stop>=2&&result.error);
 const complete=detailJourney.map(s=>s.points.every(id=>done.has(id)));
 const nav=checkpointNavigation({stepIds:detailJourney.map(s=>s.id),points:detailPoints.map(p=>({id:p.id,stage:detailStepFor(p.id)!.id,error:p.id==='detail-record'?result.error??undefined:undefined})),done,stageId:step.id,viewId:point.id,stopId:sent?cursor.id:'none',nextId:sent&&!failed?next?.id:undefined,complete,failed});
 return {id,profile,result,sent,stop,done,next,cursor,step,point,failed,complete,nav};
}
function currentStep(params:URLSearchParams){return detailStepFor(params.get('node')??params.get('point'))??detailJourney.find(s=>s.id===params.get('detailJourney'))??detailJourney[0];}
export function detailSnapshots(s:ReturnType<typeof detailState>):Record<string,unknown>[] {
 const r=s.result,request={method:'GET',path:`/policy/${s.id}`,body:null};
 const mapped=r.response?{id:s.id,policyCode:r.response.policyCode,customerName:r.response.customerName,status:r.response.status,insuredObjects:r.response.insuredObjects}:null;
 return [{id:s.id,request},{policyId:s.id,findById:r.main?{present:true,value:r.main}:{present:false}},r.error?{exception:'ServiceException',errorCode:r.error,relatedReads:0}:{policyAggregate:r.main},
 {policyAggregate:r.main,policyId:s.id,objectType:1,deleted:false},{policyAggregate:r.main,insuranceViews:r.objects},
 {policyAggregate:r.main,policyDetailResponse:mapped},
 {policyDetailResponse:mapped,policyId:s.id,paymentInfoPolicyModel:r.payment,paymentSource:r.main?.paymentType==='COLLECTION_AGENT'?'PolicyAggregate.checkoutInfoForPolicy':'PolicyAggregate.checkoutInfo'},
 {policyDetailResponse:r.response},{response:r.wrapper}];
}
export function beginDetail(id:string,profile='standard'){return {detailId:id,detailSent:id,selected:id,detailSample:profile,detailStop:'0',detailCursor:'detail-api',detailPriorPoint:null,detailJourney:'open',node:'detail-api',point:'detail-api',ref:null,detailRef:null,detailLine:null,detailTo:null};}
