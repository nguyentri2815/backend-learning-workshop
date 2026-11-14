import {dateFlow,statusFlowFor,statusKey,statusLabels,statusConstants,statusVariant} from '../content/policy/status';
import type {StatusFlow,StatusInput,StatusPoint} from '../content/policy/status';
import {checkpointNavigation} from './checkpoint-navigation';
import type {LearningChanges} from './learning-contracts';
export type StatusValues=Record<string,unknown>;
const clone=<T,>(v:T):T=>JSON.parse(JSON.stringify(v));
export const STATUS_POLICY_ID='POL-LEARN-001',STATUS_QUOTE_ID='QUOTE-LEARN-101';
export function dateStatus(now:string,effectiveDate:string,expirationDate:string){
 const n=Date.parse(now),e=Date.parse(effectiveDate),x=Date.parse(expirationDate);
 if(![n,e,x].every(Number.isFinite))throw Error('Cần ba thời điểm hợp lệ để đối chiếu Date.before.');
 return n<e?0:x<n?-1:100;
}
export function dateSelection(status:number,now:string,effectiveDate:string,expirationDate:string){
 const n=Date.parse(now),e=Date.parse(effectiveDate),x=Date.parse(expirationDate);
 const conditions=[{clause:'status=0 AND effectiveDate < now',match:status===0&&e<n},{clause:'status=100 AND expirationDate < now',match:status===100&&x<n},{clause:'status=100 AND effectiveDate > now',match:status===100&&e>n},{clause:'status=-1 AND expirationDate > now',match:status===-1&&x>n}];
 return {selected:conditions.some(c=>c.match),conditions};
}
export function defaultStatusInput(flow:StatusFlow,scenario='success'):StatusInput{
 return {now:'2026-11-13T00:00:00+07:00',effectiveDate:'2026-11-11T00:00:00+07:00',expirationDate:'2026-11-15T00:00:00+07:00',storedStatus:0,coreStatus:100,quoteId:STATUS_QUOTE_ID,releaseDate:'',entry:flow.activeEntry??'http',dateRule:'general',...flow.scenarios.find(s=>s.id===scenario)?.input};
}
export function statusInput(flow:StatusFlow,params:URLSearchParams,draft=false):StatusInput{
 const scenario=params.get(statusKey(flow,draft?'draftScenario':'scenario'))??params.get(statusKey(flow,'scenario'))??'success',raw=params.get(statusKey(flow,draft?'draft':'input'));
 try{return {...defaultStatusInput(flow,scenario),...(raw?JSON.parse(raw):{})};}catch{return defaultStatusInput(flow,scenario);}
}
export function statusDescription(value:number){return `${value} · ${statusConstants[value]??'Mã chưa có nhãn trong PolicyStatus'}${statusLabels[value]?' · '+statusLabels[value]:''}`;}
export function initialStatusDates(flow:StatusFlow,input:StatusInput){
 const original={effectiveDate:input.effectiveDate,expirationDate:input.expirationDate},release=Date.parse(input.releaseDate);
 if(!['approve','approveNow','cashCreate'].includes(flow.creator??'')||!Number.isFinite(release))return {...original,changed:false,rule:'Ngày gốc từ Quote',calendarZone:'Fixture UTC+07:00'};
 const offset=7*3600000,day=86400000,start=Date.parse(input.effectiveDate),end=Date.parse(input.expirationDate),localRelease=new Date(release+offset),midnight=(t:number)=>Math.floor((t+offset)/day)*day-offset;
 let effective=start,expiration=end;
 if(input.dateRule==='next-day'&&['approveNow','cashCreate'].includes(flow.creator??'')){
  const next=midnight(release)+day;
  if(start<next){effective=next;expiration=next+Math.trunc((end-start)/day)*day+day-1000;}
 }else if(Math.trunc((release-start)/60000)>0){
  const differenceDays=Math.trunc((midnight(release)-midnight(start))/day),time=localRelease.getUTCHours()*3600000+localRelease.getUTCMinutes()*60000+localRelease.getUTCSeconds()*1000;
  effective=midnight(start)+differenceDays*day+time;expiration=midnight(end)+differenceDays*day+time-60000;
 }
 return {effectiveDate:new Date(effective).toISOString(),expirationDate:new Date(expiration).toISOString(),changed:effective!==start||expiration!==end,rule:input.dateRule==='next-day'?'XG_2_5 active → releaseDate+1 ngày; duration và atEndOfDay':'Nhánh thường → difference ngày/giờ/phút; setDateTime, phút kết thúc -1',calendarZone:'Fixture Calendar UTC+07:00; timezone Java runtime chưa xác minh'};
}
export function statusFixture(flow:StatusFlow,input:StatusInput,scenario:string){
 const selectionPolicy={id:STATUS_POLICY_ID,status:input.storedStatus,effectiveDate:input.effectiveDate,expirationDate:input.expirationDate};
 const original:StatusValues={...selectionPolicy,policyCode:'S-DEMO-001',updatedDate:'2026-11-01T00:00:00+07:00',syncStatus:0,viaUploaderStatus:1,paymentStatus:0};
 if(flow.id==='date'&&scenario==='unchanged')original.status=100;
 if(flow.id==='date'&&scenario==='terminated-after-select')original.status=-100;
 if(flow.id==='core-status')Object.assign(original,{haveEndorsement:false,insuranceTotalAmount:1200000,insuranceTotalAmountVnd:1200000});
 if(flow.family==='initial')Object.assign(original,{status:null,createdDate:null,updatedDate:null,syncStatus:null,viaUploaderStatus:null,paymentStatus:null});
 const eventTime=new Date(Date.parse(input.now)+1000).toISOString();
 const quoteStatus=input.quoteStatus??(flow.creator==='approve'?8:flow.creator==='approveNow'?0:flow.creator==='onlineCreate'?(input.entry==='scan'?11:7):flow.creator==='cashCreate'?8:0);
 return {original,selectionPolicy,eventTime,storageTime:new Date(Date.parse(input.now)+2000).toISOString(),dates:initialStatusDates(flow,input),quote:{id:input.quoteId,quoteCode:'Q-DEMO-001',status:quoteStatus,effectiveDate:input.effectiveDate,expirationDate:input.expirationDate,paymentStatus:0,viaUploaderStatus:1,policyId:quoteStatus===9?'POL-EXISTING-001':null,paymentType:flow.creator==='cashCreate'||flow.creator==='approveNow'?'COLLECTION_AGENT':'VNPay',checkoutInfo:{tx:{status:'pending',createdAt:'2026-11-10T00:00:00+07:00'}}},schedulerMessage:{sentAt:new Date(Date.parse(input.now)-60000).toISOString()},rawIds:scenario==='batch-limit'?[...Array.from({length:10},(_,i)=>`POL-OTHER-${i+1}`),STATUS_POLICY_ID]:[STATUS_POLICY_ID]};
}
export type StatusTrace={point:StatusPoint;before:StatusValues;after:StatusValues};
export function simulateStatus(flow:StatusFlow=dateFlow,input:StatusInput=defaultStatusInput(flow),scenario='success',until=flow.points.length-1){
 flow=statusVariant(flow,input.entry);
 const f=statusFixture(flow,input,scenario),original=clone(f.original),aggregate:StatusValues=flow.family==='initial'?{}:clone(original),stored=clone(original),selection=dateSelection(input.storedStatus,input.now,input.effectiveDate,input.expirationDate),quote=clone(f.quote);
 const expected=flow.id==='core-status'?input.coreStatus:dateStatus(input.now,f.dates.effectiveDate,f.dates.expirationDate);
 let blockedId:string|undefined,message='',returned:unknown=null,blockedReturn:unknown=null,command:StatusValues|null=null,event:StatusValues|null=null,calculated:number|null=null,writes=0,view:StatusValues|null=null,clock:string|null=null;
 if(flow.id==='date'){
  if(!selection.selected){blockedId='date-select';message='Không có Policy ID được query chọn · helper và bước ghi chưa chạy.';}
  else if(!f.rawIds.slice(0,10).filter(id=>id.trim()).includes(STATUS_POLICY_ID)){blockedId='date-batch';message='Policy nằm ngoài 10 ID đầu · chưa gọi runInternal.';}
  else if(scenario==='missing'||scenario==='terminated-after-select'){blockedId='date-guard';message=scenario==='missing'?'DTO không tồn tại · return false trước helper và update.':'DTO đã TERMINATED (-100) · return false trước helper và update.';}
  else if(Number(original.status)===expected){blockedId='date-compare';message='newStatus bằng status DTO · return false · bước ghi chưa chạy.';}
 }else if(flow.id==='core-status'){
  if(scenario==='missing'){blockedId='core-lookup';message='POLICY_NOT_EXIST · chưa tiếp nhận status Core.';}
  else if(scenario==='core-fail'){blockedId='core-fetch';message='ERROR_GET_ENDORSEMENT_FROM_CORE · dừng trước runInternal và update.';}
 }else if(flow.family==='initial'){
  const firstLoad=flow.points.find(p=>p.effect==='load')?.id??flow.points[0].id;
  if(input.entry==='queue'&&!input.quoteId.trim()){blockedId='online-queue-entry';message='QuotePaidEvent.quoteId blank · consumer bỏ qua, không gọi Func.';blockedReturn={consumerReturn:'void'};}
  else if(scenario==='missing'||input.quoteId!==STATUS_QUOTE_ID){blockedId=firstLoad;message='QUOTE_NOT_EXIST · chưa có Policy mới.';}
  else if(flow.id==='online-initial'&&input.entry!=='scan'&&quote.status===9){blockedId='online-entry';message='Quote đã PUBLISHED · trả Policy ID cũ; không gọi creator.';blockedReturn=quote.policyId;}
  else if(scenario==='scan-limit'){blockedId='online-scan-select';message='Query không chọn Quote: retryReleasePolicy vượt 3 · HTTP quét vẫn trả Done.';blockedReturn='Done';}
  else if(scenario==='not-waiting'){blockedId='approve-initial-validate';message='DO_NOT_CHOOSE_PAYMENT_METHOD · Quote không ở WAIT_PAYMENT_CASH / ONLINE.';}
  else if(scenario==='not-confirmed'){blockedId='cash-before';message='QUOTE_NOT_CONFIRM · chưa acceptTerms và chưa confirmOTP.';}
  else if(scenario==='gateway-pending'){blockedId='online-gateway';message='PAYMENT_BAO_LONG_INTERNAL_ERROR · gateway chưa PAYED.';}
  else if(scenario==='duplicate'){blockedId=`${flow.id}-duplicate`;message='QUOTE_CAN_NOT_RELEASE_POLICY · đã có Policy cùng Quote ở 0/100; không tạo mới.';}
  else if(scenario==='sale-unit-missing'){blockedId=`${flow.id}-sale-unit`;message='SALE_UNIT_NOT_FOUND · status đã tính nhưng chưa save Policy.';}
 }
 const blockedAt=flow.points.findIndex(p=>p.id===blockedId),last=Math.min(until,blockedAt>=0?blockedAt:flow.points.length-1),traces:StatusTrace[]=[];
 let dto:StatusValues|null=null,usedDates:ReturnType<typeof initialStatusDates>|null=null,quoteWrites=0,quoteRead=false,queryRead=false;
 const values=():StatusValues=>({input:clone(input),...(clock?{now:clock}:{}),...(flow.family==='initial'?{sourceQuoteFixture:f.quote,...quoteRead?{quote:clone(quote),quoteWrites}:{}}:{selectionSnapshot:clone(f.selectionPolicy)}),...(queryRead?{query:selection}:{}),...(dto?{[flow.id==='date'?'policyDTO':'policyRecord']:clone(dto)}:{}),...(usedDates?{datesForStatus:clone(usedDates)}:{}),...(calculated!==null?{newStatus:calculated}:{}),...(command?{command:clone(command)}:{}),...(event?{event:clone(event),aggregateInMemory:clone(aggregate)}:{}),policyWrites:writes,...(writes?{storedPolicy:clone(stored)}:{}),...(returned!==null?{internalReturn:returned}:{}),...(view?{queryView:clone(view)}:{})});
 for(let i=0;i<=last;i++){
  const p=flow.points[i],before=values();
  if(p.effect==='clock')clock=input.now;
  if(p.effect==='select')queryRead=true;
  if(p.effect==='load'){if(flow.family==='initial')quoteRead=true;else dto=scenario==='missing'?null:{id:STATUS_POLICY_ID,status:original.status,effectiveDate:input.effectiveDate,expirationDate:input.expirationDate};}
  if(p.id===blockedId){returned=blockedReturn;if(p.id==='date-guard'||p.id==='date-compare')returned=false;if(flow.id==='approve-initial'&&scenario==='duplicate')returned=false;if(flow.id==='online-initial'&&input.entry==='scan')returned='Done';traces.push({point:p,before,after:{...values(),skip:message,policyWriteReached:false}});break;}
  if(p.effect==='dates')usedDates=f.dates;
  if(p.effect==='quote-paid'){quote.status=11;quote.checkoutInfo.tx.status='done';quoteWrites++;}
  if(p.effect==='checkout'){quote.checkoutInfo.tx.status='pending';quoteWrites++;}
  if(p.effect==='quote-tx-done')quote.checkoutInfo.tx.status='done';
  if(p.effect==='calculate'){calculated=expected;if(flow.id==='core-status')command={status:calculated,paymentStatus:scenario==='all-paid'?100:0,haveEndorsement:true,insuranceTotalAmount:1500000,insuranceTotalAmountVnd:1500000};}
  if(p.effect==='command')command=flow.id==='core-status'?command:flow.family==='initial'?{quoteId:input.quoteId,quoteCode:quote.quoteCode,status:calculated,effectiveDate:f.dates.effectiveDate,expirationDate:f.dates.expirationDate,createdDate:['approve','approveNow'].includes(flow.creator??'')&&input.releaseDate?input.releaseDate:input.now,updatedDate:input.now,syncStatus:0,viaUploaderStatus:quote.viaUploaderStatus,paymentStatus:0}:{status:calculated,updatedDate:input.now};
  if(p.effect==='apply'){event={...command,createdEventTime:f.eventTime,entityId:STATUS_POLICY_ID,type:flow.eventName};Object.assign(aggregate,command,{status:event.status,updatedDate:f.eventTime},flow.family==='initial'?{createdDate:f.eventTime}:{});}
  if(p.effect==='persist'){Object.assign(stored,clone(aggregate),flow.family==='initial'?{id:STATUS_POLICY_ID,createdDate:f.storageTime,updatedDate:f.storageTime}:{});writes++;}
  if(p.effect==='publish'){quote.status=9;quote.policyId=STATUS_POLICY_ID;quoteWrites++;}
  if(p.effect==='return')returned=flow.id==='core-status'?STATUS_POLICY_ID:flow.resultKind==='boolean'?true:flow.resultKind==='id'?STATUS_POLICY_ID:flow.resultKind==='checkout'?{entityId:STATUS_POLICY_ID,paymentType:'COLLECTION_AGENT',tx:{status:'done'}}:flow.resultKind==='done'?'Done':flow.resultKind==='void'?{internalPolicyId:STATUS_POLICY_ID,consumerReturn:'void'}:flow.family==='initial'?{entityId:STATUS_POLICY_ID,entityVersion:'fixture-version-1'}:true;
  if(p.effect==='view'&&writes)view={id:STATUS_POLICY_ID,status:stored.status,updatedDate:stored.updatedDate,syncStatus:stored.syncStatus,viaUploaderStatus:stored.viaUploaderStatus,paymentStatus:stored.paymentStatus};
  traces.push({point:p,before,after:values()});
 }
 return {flow,fixture:f,original,aggregate,stored,selection,queryRead,expected,calculated,usedDates,command,event,writes,quote,quoteWrites,view,returned,traces,blockedAt,message,stopped:blockedAt>=0&&last>=blockedAt,changes:Object.keys(stored).filter(k=>JSON.stringify(original[k])!==JSON.stringify(stored[k]))};
}
export function inspectStatus(flow:StatusFlow,id:string,prior?:string):LearningChanges{return {flow:flow.id,node:id,point:id,[statusKey(flow,'view')]:id,[statusKey(flow,'prior')]:prior??null,[`status-${flow.id}Ref`]:null,[`status-${flow.id}Line`]:null,[`status-${flow.id}To`]:null,ref:null};}
export function beginStatus(flow:StatusFlow,input:StatusInput,scenario='success'):LearningChanges{flow=statusVariant(flow,input.entry);return {...inspectStatus(flow,flow.points[0].id),[statusKey(flow,'input')]:JSON.stringify(input),[statusKey(flow,'draft')]:JSON.stringify(input),[statusKey(flow,'scenario')]:scenario,[statusKey(flow,'draftScenario')]:scenario,[statusKey(flow,'started')]:'1',[statusKey(flow,'stop')]:'0',[statusKey(flow,'cursor')]:flow.points[0].id};}
export function statusState(params:URLSearchParams){
 const flow=statusFlowFor(params),key=(name:string)=>statusKey(flow,name),input=statusInput(flow,params),draft=statusInput(flow,params,true),scenario=params.get(key('scenario'))??'success',started=params.get(key('started'))==='1',full=simulateStatus(flow,input,scenario);
 const raw=Number(params.get(key('stop'))??'-1'),stop=started?Math.max(-1,Math.min(Number.isInteger(raw)?raw:-1,full.blockedAt>=0?full.blockedAt:flow.points.length-1)):-1,run=simulateStatus(flow,input,scenario,stop);
 const aliases:Record<string,string>={'schedule':'date-schedule','state-queue':'date-listener','state-select':'date-select','state-run':'date-clock','state-rule':'date-calculate','state-apply':'date-apply','store-update':'date-store','flow-update':'date-flow','flow-view':'date-view'};
 const requested=params.get('node')??params.get('point')??params.get(key('view')),view=flow.points.find(p=>p.id===(aliases[requested??'']??requested))??flow.points[0],step=flow.steps.find(s=>s.id===view.stage)!;
 const done=new Set(flow.points.filter((_,i)=>i<=stop).map(p=>p.id)),next=flow.points[stop+1],cursor=flow.points.find(p=>p.id===params.get(key('cursor'))&&(done.has(p.id)||p===next))??flow.points[Math.max(stop,0)],complete=flow.steps.map(s=>flow.points.filter(p=>p.stage===s.id).every(p=>done.has(p.id)));
 const nav=checkpointNavigation({stepIds:flow.steps.map(s=>s.id),points:flow.points.map(p=>({id:p.id,stage:p.stage,error:flow.points[full.blockedAt]?.id===p.id?full.message:undefined})),done,stageId:step.id,viewId:view.id,stopId:started?cursor.id:'none',nextId:started&&!run.stopped?next?.id:undefined,complete,failed:run.stopped});
 return {flow,key,input,draft,scenario,started,stop,run,view,step,cursor,done,next,complete,nav};
}
