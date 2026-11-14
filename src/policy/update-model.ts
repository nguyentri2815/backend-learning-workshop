import {updateFlowFor,updateKey,updateSource} from '../content/policy/update';
import type {UpdateFlow,UpdatePoint} from '../content/policy/update';
import {checkpointNavigation} from './checkpoint-navigation';
import type {LearningChanges} from './learning-contracts';
export type Values=Record<string,unknown>;
const clone=<T,>(v:T):T=>JSON.parse(JSON.stringify(v));
const now='2026-11-11T03:00:00.000Z',prior='2026-10-20T08:00:00.000Z';
export const fixturePolicyId='POL-LEARN-001',fixtureProcessId='PROCESS-LEARN-001';
export function updateInput(flow:UpdateFlow,params=new URLSearchParams(),draft=false):Values{
 const defaults:Record<string,Values>={checkout:{processId:fixtureProcessId,paymentType:'VNPay'},paid:{orderNo:'POLICY-ORDER-001',paymentType:'VNPay'},endorsement:{endorsementCode:'S-DEMO-001-01',endorsementId:'END-001',policyId:'CORE-POL-001'},permission:{entityId:'DV-A',eventType:'CreateRelationshipEvent'},migration:{method:'GET',path:'/sync-to-view/migrate-data-quote-and-policy'},documents:{policyId:fixturePolicyId,files:[{documentName:'Giấy đề nghị',attachmentId:'ATT-002',attachmentName:'de-nghi.pdf',kind:null}]},correct:{method:'GET',path:'/internal/policy/correct-created-date'}};
 const raw=params.get(updateKey(flow,draft?'draft':'input'));try{return raw?{...defaults[flow.id],...JSON.parse(raw)}:defaults[flow.id]??{};}catch{return defaults[flow.id]??{};}
}
export function fixtureFor(flow:UpdateFlow,scenario:string,input:Values){
 const policy:Values={id:fixturePolicyId,policyCode:'S-DEMO-001',status:100,paymentType:'COLLECTION_AGENT',paymentStatus:0,paymentStatusFromSP:'NONE',paymentPolicyStatus:'NONE',paidTime:null,createdDate:flow.id==='correct'?null:prior,updatedDate:prior,insuranceTotalAmount:1200000,haveEndorsement:scenario==='endorsement',checkoutInfoForPolicy:null,checkoutInfoHistoryForPolicy:{},paymentPolicyRequestId:null,paymentPolicyRequestDate:null,paymentPolicyOrderNo:null,paymentPolicyType:null,paymentPolicyIsOnProcess:false,paymentProcessId:null,saleUnitPath:'/ROOT/OLD/DV-A/',saleUnitPathLevel:2,pathSaleUnitIds:['ROOT','OLD','DV-A'],viaUploader:[{documentId:'DOC-OLD',attachmentId:'ATT-001'}],viaUploaderStatus:0};
 Object.assign(policy,{customerId:'CUSTOMER-OLD',customerName:'Khách hàng mẫu cũ',customerModel:{id:'CUSTOMER-OLD',name:'Khách hàng mẫu cũ'},effectiveDate:'2026-10-01T00:00:00.000Z',expirationDate:'2027-10-01T00:00:00.000Z',distributionChannelName:'Kênh cũ',priceModel:{priceWithTax:1200000},groupCoverPriceModel:[],insuranceTotalAmountVnd:1200000,agencyId:'AGENCY-OLD',agencyCode:'AG-OLD',agencyName:'Đại lý cũ',productGroupCode:'XG',syncCoreSystem:flow.id==='documents'&&scenario!=='local-only'});
 const checkout={paymentType:String(input.paymentType??'VNPay'),paymentId:'PAYREQ-001',reqPaymentId:'GW-REQ-001',orderNo:'POLICY-ORDER-001',paymentUrl:'https://gateway.example/checkout/PAYREQ-001',paymentExpireDate:'2026-11-11T03:15:00.000Z',tx:{status:'pending',createdAt:now,amount:1200000}};
 if(flow.id==='paid'){Object.assign(policy,{checkoutInfoForPolicy:clone(checkout),checkoutInfoHistoryForPolicy:{[checkout.paymentType]:clone(checkout)},paymentProcessId:fixtureProcessId,paymentPolicyIsOnProcess:true,paymentPolicyRequestId:checkout.paymentId,paymentPolicyRequestDate:now,paymentPolicyOrderNo:checkout.orderNo,paymentPolicyType:checkout.paymentType});}
 if(flow.id==='migration')policy.saleUnitPathLevel=null;
 if(flow.id==='documents')policy.viaUploaderStatus=1;
 if(flow.id==='permission'&&scenario==='same-path')policy.saleUnitPath='/ROOT/NEW/DV-A/';
 const process:Values={id:fixtureProcessId,policyIds:[fixturePolicyId],paymentType:'VNPay',paymentStatus:scenario==='paid'?'PAYED':flow.id==='paid'?'OPEN':'NONE',processStatus:scenario==='cancel'?-1:flow.id==='paid'?1:0,paymentOrderNo:'POLICY-ORDER-001',checkoutInfoForPolicy:flow.id==='paid'?clone(checkout):null};
 const changes:Record<string,unknown[]>={effectiveDate:['2026-12-01T00:00:00.000Z'],distributionChannelName:['Kênh mẫu mới']};if(scenario==='customer')changes.customerId=['CUSTOMER-NEW'];
 return {policy,process,checkout,input:clone(input),source:{saleUnit:{id:'DV-A',path:'/ROOT/NEW/DV-A/',pathLevel:2},quote:{id:'QUOTE-LEARN-101',policyId:scenario==='unlinked'?null:fixturePolicyId,saleUnitId:'DV-A',saleUnitPath:'/ROOT/LEGACY/DV-A/'},core:{success:scenario!=='core-fail',status:0,changes,priceModel:{priceWithTax:1500000},groupCoverPriceModel:[],paymentInfo:[{mandatory:[{status:scenario==='all-paid'?100:0}]}],customer:{id:'CUSTOMER-NEW',name:'Khách hàng mẫu sau điều chỉnh'},agencyId:'AGENCY-NEW',agencyCode:'AG-NEW',agencyName:'Đại lý mới',insuredObjects:[{id:'INS-EXIST-001',exists:true},{id:'INS-NEW-002',exists:false}]}},original:clone(policy)};
}
export function changedFields(before:Values,after:Values){return [...new Set([...Object.keys(before),...Object.keys(after)])].filter(k=>JSON.stringify(before[k])!==JSON.stringify(after[k]));}
const eventRefs:Record<string,keyof typeof updateSource.sources>={checkout:'checkoutEvent',paid:'finishEvent',endorsement:'endorsementEvent',permission:'permissionEvent',migration:'migrationEvent',documents:'uploadEvent',correct:'correctEvent'};
export function updateEventFields(flow:UpdateFlow){return updateSource.sources[eventRefs[flow.id]].rows.flatMap(r=>{const match=r.text.match(/^\s*private\s+(?:transient\s+)?[\w<>?,.\[\] ]+\s+(\w+)\s*;/);return match&&!r.text.includes('static ')?[match[1]]:[];});}
export function simulateUpdate(flow:UpdateFlow,scenarioId='success',input:Values=updateInput(flow),stop=flow.points.length-1){
 if(scenarioId==='payme')input={...input,paymentType:'PayMe'};
 const scenario=flow.scenarios.find(s=>s.id===scenarioId)??flow.scenarios[0],f=fixtureFor(flow,scenario.id,input);
 const original=clone(f.original),policy=clone(original),process=clone(f.process),quote=clone(f.source.quote);let stored=clone(policy),view=project(policy),command:Values|null=null,event:Values|null=null,response:unknown=null,writes=0,quoteWrites=0,viewWritten=false;
 let insuranceOperations:Values[]=[],queueMessage:unknown=null,receivedMessage:unknown=null,dispatchResponse:unknown=null;
 let blockedAt=scenario.stopAt?flow.points.findIndex(p=>p.id===scenario.stopAt):-1,message=scenario.message;
 if(flow.id==='checkout'&&input.processId!==fixtureProcessId){blockedAt=flow.points.findIndex(p=>p.id==='checkout-process');message='PAYMENT_POLICY_PROCESS_NOT_EXIST';}
 if(flow.id==='checkout'&&input.paymentType==='PayMe'){blockedAt=flow.points.findIndex(p=>p.id==='checkout-flow-builder');message='INTERNAL_ERROR · Invalid Payment method';}
 if(flow.id==='paid'&&input.orderNo!=='POLICY-ORDER-001'){blockedAt=flow.points.findIndex(p=>p.id==='paid-process');message='PAYMENT_POLICY_PROCESS_NOT_EXIST';}
 if(flow.id==='paid'&&input.paymentType==='PayMe'){blockedAt=flow.points.findIndex(p=>p.id==='paid-guard');message='INTERNAL_ERROR · Invalid Payment method';}
 if(flow.id==='endorsement'&&String(input.endorsementCode).split('-').slice(0,-1).join('-')!=='S-DEMO-001'){blockedAt=flow.points.findIndex(p=>p.id==='endorsement-lookup');message='POLICY_NOT_EXIST';}
 const last=Math.min(stop,blockedAt>=0?blockedAt:flow.points.length-1),traces:{point:UpdatePoint;before:Values;after:Values}[]=[];
 const relevantSource:Values=['permission','migration'].includes(flow.id)?{saleUnit:f.source.saleUnit,quote:f.source.quote}:flow.id==='endorsement'?{core:f.source.core}:flow.id==='documents'?{folder:{id:'6c940f42-863a-11eb-8dcd-0242ac130003',name:'Khác'},syncCoreSystem:f.original.syncCoreSystem}:flow.id==='correct'?{selection:'createdDate IS NULL'}:{gateway:'Fixture · URL mới / xác nhận thanh toán',username:'workshop-user'};
 const values=():Values=>({input:f.input,policy:clone(policy),storedPolicy:clone(stored),...(['checkout','paid'].includes(flow.id)?{process:clone(process)}:{}),sourceData:clone(relevantSource),...(queueMessage!==null?{queueMessage}:{}),...(receivedMessage!==null?{receivedMessage}:{}),...(dispatchResponse!==null?{dispatchResponse}:{}),...(command?{command:clone(command)}:{}),...(event?{event:clone(event)}:{}),...(response!==null?{response:clone(response)}:{}),policyWrites:writes,...(quoteWrites?{quoteWrites,quote:clone(quote)}:{}),...(insuranceOperations.length?{insuranceOperations:clone(insuranceOperations)}:{}),...(viewWritten?{queryView:clone(view)}:{})});
 for(let i=0;i<=last;i++){
  const point=flow.points[i],before=values();
  if(i===blockedAt){if(scenario.kind==='skip')response=flow.id==='permission'&&scenario.id==='missing'||flow.id==='migration'&&scenario.id==='missing'?false:true;traces.push({point,before,after:{...values(),stop:message,policyWriteReached:false}});break;}
  if(point.effect==='checkout')f.checkout.paymentType=String(input.paymentType??'VNPay');
  if(point.effect==='command')command=commandFor(flow,f);
  if(point.effect==='enqueue'){queueMessage=flow.id==='permission'?String(f.input.entityId):f.source.quote.id;if(flow.id==='migration')dispatchResponse=true;}
  if(point.effect==='consume')receivedMessage=queueMessage;
  if(point.effect==='quote'){quoteWrites++;Object.assign(quote,{pathSaleUnitIds:pathIds(f.source.quote.saleUnitPath),saleUnitPathLevel:f.source.saleUnit.pathLevel});}
  if(point.effect==='permission-quote'&&quote.saleUnitPath!==f.source.saleUnit.path){quoteWrites++;Object.assign(quote,{saleUnitPath:f.source.saleUnit.path,pathSaleUnitIds:pathIds(f.source.saleUnit.path),saleUnitPathLevel:f.source.saleUnit.pathLevel});}
  if(point.effect==='objects')insuranceOperations=f.source.core.insuredObjects.map(o=>({id:o.id,operation:o.exists?'update':'create',entityId:fixturePolicyId,source:o.exists?'SyncEndorsementFromCoreFunc:L181–199':'SyncEndorsementFromCoreFunc:L202–241'}));
  if(point.effect==='paid-checkout'){
   f.checkout.tx.status='done';Object.assign(policy,{checkoutInfoForPolicy:clone(f.checkout),checkoutInfoHistoryForPolicy:{...(policy.checkoutInfoHistoryForPolicy as Values),[f.checkout.paymentType]:clone(f.checkout)},paymentPolicyIsOnProcess:false,updatedDate:now});Object.assign(process,{checkoutInfoForPolicy:clone(f.checkout),checkoutInfoHistoryForPolicy:{[f.checkout.paymentType]:clone(f.checkout)},updatedDate:now});stored=clone(policy);writes++;
  }
  if(point.effect==='process-checkout'){Object.assign(process,{checkoutInfoForPolicy:clone(f.checkout),checkoutInfoHistoryForPolicy:{[f.checkout.paymentType]:clone(f.checkout)},paymentType:f.checkout.paymentType,paymentPolicyRequestId:f.checkout.paymentId,updatedDate:now});}
  if(point.effect==='apply'){
   command??=commandFor(flow,f);event={...Object.fromEntries(updateEventFields(flow).filter(k=>k in command!).map(k=>[k,clone(command![k])])),createdEventTime:now};
   applyPolicy(flow,policy,event,f);event={...event,type:flow.eventName,entityId:fixturePolicyId};
  }
  if(point.effect==='persist'){stored=clone(policy);writes++;}
  if(point.effect==='finish'){
   if(flow.id==='checkout'){
    if(point.id==='checkout-process-open'){writes++;process.checkoutInfoForPolicy=clone(f.checkout);process.paymentType=f.checkout.paymentType;process.paymentPolicyRequestId=f.checkout.paymentId;process.paymentStatus='OPEN';stored=clone(policy);}
    if(point.id==='checkout-after-pay')process.processStatus=1;
   }else if(flow.id==='paid'){process.processStatus=2;process.paidTime=now;}
  }
  if(point.effect==='return')response=flow.id==='checkout'?clone(f.checkout):flow.id==='paid'?'Done':['permission','migration','correct'].includes(flow.id)?true:fixturePolicyId;
  if(point.effect==='view'){view=project(stored);viewWritten=true;}
  traces.push({point,before,after:values()});
 }
 return {fixture:f,original,policy,stored,process,quote,view,response,dispatchResponse,command,event,writes,quoteWrites,insuranceOperations,viewWritten,traces,blockedAt,message,failed:blockedAt>=0&&last>=blockedAt,changes:changedFields(original,policy)};
}
function commandFor(flow:UpdateFlow,f:ReturnType<typeof fixtureFor>):Values{
 if(flow.id==='checkout')return {paymentPolicyRequestId:f.checkout.paymentId,paymentPolicyRequestDate:f.checkout.tx.createdAt,checkoutInfoForPolicy:clone(f.checkout),paymentPolicyOrderNo:f.checkout.orderNo,paymentPolicyType:f.checkout.paymentType,paymentPolicyIsOnProcess:true,paymentPolicyStatus:'PAYED',paymentProcessId:fixtureProcessId};
 if(flow.id==='paid')return {paidTime:now,paymentPolicyStatus:'PAYED'};
 if(flow.id==='permission')return {saleUnitPath:f.source.saleUnit.path,pathSaleUnitIds:pathIds(f.source.saleUnit.path),saleUnitPathLevel:f.source.saleUnit.pathLevel};
 if(flow.id==='migration')return {pathSaleUnitIds:pathIds(f.source.quote.saleUnitPath),saleUnitPathLevel:f.source.saleUnit.pathLevel};
 if(flow.id==='correct')return {createdDate:f.policy.createdDate};
 if(flow.id==='documents')return {viaUploader:(f.input.files as Values[]).map((file,i)=>({...file,documentId:`doc-fixture-${i+2}`,kind:file.kind??'insurancePersonal',uploadedBy:'workshop-user',folderId:'6c940f42-863a-11eb-8dcd-0242ac130003',folderName:'Khác',targetObjectType:0,createdDate:now,synced:true})),viaUploaderStatus:0};
 if(flow.id==='endorsement'){
  const core=f.source.core,command:Values=Object.fromEntries(updateEventFields(flow).filter(k=>k in f.original).map(k=>[k,clone(f.original[k])]));
  for(const [key,values] of Object.entries(core.changes))if(['effectiveDate','expirationDate','distributionChannelId','distributionChannelCode','distributionChannelName'].includes(key))command[key]=values[0];
  if(Object.keys(core.changes).some(k=>k.includes('customer')))Object.assign(command,{customerId:core.customer.id,customerName:core.customer.name,customerModel:clone(core.customer)});
  Object.assign(command,{priceModel:core.priceModel,groupCoverPriceModel:core.groupCoverPriceModel,haveEndorsement:true,insuranceTotalAmount:core.priceModel.priceWithTax,insuranceTotalAmountVnd:core.priceModel.priceWithTax,paymentStatus:core.paymentInfo.some(p=>p.mandatory.some(t=>t.status===0))?0:100,status:core.status,changes:core.changes,agencyId:core.agencyId,agencyCode:core.agencyCode,agencyName:core.agencyName});return command;
 }
 return {};
}
function applyPolicy(flow:UpdateFlow,policy:Values,event:Values,f:ReturnType<typeof fixtureFor>){
 for(const k of flow.changed)if(k in event)policy[k]=clone(event[k]);
 if(flow.id==='checkout')policy.checkoutInfoHistoryForPolicy={...(policy.checkoutInfoHistoryForPolicy as Values),[f.checkout.paymentType]:clone(f.checkout)};
 if(flow.id==='paid')policy.paymentStatusFromSP=event.paymentPolicyStatus;
 if(flow.id==='documents')policy.viaUploader=[...(f.original.viaUploader as Values[]),...(event.viaUploader as Values[])];
 if(!['migration','correct'].includes(flow.id))policy.updatedDate=now;
}
function pathIds(path:string){return path.replace(/^\/+/,'').replace(/\/+$/,'').split('/');}
function project(policy:Values):Values{
 const fields=updateSource.sources.viewEntity.rows.flatMap(r=>{const field=r.text.match(/^\s*private\s+[\w<>?,.\[\] ]+\s+(\w+)\s*;/);return field?[field[1]]:[];});
 return Object.fromEntries(fields.filter(k=>k in policy).map(k=>[k,clone(policy[k])]));
}
export function updateState(params:URLSearchParams){
 const flow=updateFlowFor(params),key=(k:string)=>updateKey(flow,k),input=updateInput(flow,params),draft=updateInput(flow,params,true),scenario=params.get(key('scenario'))??'success',started=params.get(key('started'))==='1';
 const raw=Number(params.get(key('stop'))??'-1'),requested=Number.isInteger(raw)?raw:-1,full=simulateUpdate(flow,scenario,input),stop=started?Math.max(-1,Math.min(requested,full.blockedAt>=0?full.blockedAt:flow.points.length-1)):-1;
 const run=simulateUpdate(flow,scenario,input,stop),done=new Set(flow.points.filter((_,i)=>i<=stop).map(p=>p.id)),next=flow.points[stop+1];
 const legacy:Record<string,string>={'payment-api':'checkout-api','checkout-check':'checkout-guard','checkout-write':'checkout-command','checkout-apply':'checkout-event','store-update':flow.points.find(p=>p.effect==='persist')?.id??flow.points[0].id};
 const requestedPoint=params.get('node')??params.get('point'),view=flow.points.find(p=>p.id===(legacy[requestedPoint??'']??requestedPoint))??flow.points.find(p=>p.id===params.get(key('view')))??flow.points[0],step=flow.steps.find(s=>s.id===view.stage)!;
 const candidate=flow.points.find(p=>p.id===params.get(key('cursor'))&&(done.has(p.id)||p===next)),cursor=candidate??flow.points[Math.max(0,stop)];
 const complete=flow.steps.map(s=>flow.points.filter(p=>p.stage===s.id).every(p=>done.has(p.id)));
 const nav=checkpointNavigation({stepIds:flow.steps.map(s=>s.id),points:flow.points.map(p=>({id:p.id,stage:p.stage,error:p.id===flow.points[full.blockedAt]?.id?full.message:undefined})),done,stageId:step.id,viewId:view.id,stopId:started?cursor.id:'none',nextId:started&&!run.failed?next?.id:undefined,complete,failed:run.failed});
 return {flow,key,input,draft,scenario,started,stop,run,done,next,cursor,view,step,complete,nav};
}
export function updateInspect(flow:UpdateFlow,id:string,prior?:string):LearningChanges{return {flow:flow.id,node:id,point:id,ref:null,[updateKey(flow,'view')]:id,[updateKey(flow,'prior')]:prior??null,[`update-${flow.id}Ref`]:null,[`update-${flow.id}Line`]:null,[`update-${flow.id}To`]:null};}
export function beginUpdate(flow:UpdateFlow,input:Values,scenario='success'):LearningChanges{const body=scenario==='payme'?{...input,paymentType:'PayMe'}:input;return {...updateInspect(flow,flow.points[0].id),[updateKey(flow,'input')]:JSON.stringify(body),[updateKey(flow,'draft')]:JSON.stringify(body),[updateKey(flow,'scenario')]:scenario,[updateKey(flow,'started')]:'1',[updateKey(flow,'stop')]:'0',[updateKey(flow,'cursor')]:flow.points[0].id};}
