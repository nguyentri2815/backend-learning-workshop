import {checkpointNavigation} from './checkpoint-navigation';
import { creationContext, quotes, SAMPLE_NOW } from './create-model';
import { debugInstructions, policyInsurance, practiceContext, practiceSteps, quoteInsurance } from './create-practice';
import { detailSample, searchSamples } from './policy-model';
import type { CheckpointView } from './practice-checkpoint';
import type { SourceLocation } from './source-reading';

export type Values=Record<string,unknown>;
export interface ExecutionCheckpoint extends SourceLocation {
  id:string;stage:string;method:string;title:string;purpose:string;before:Values;after:Values;
  changed?:string[];observed?:Values;error?:string;action?:string;via?:string;caller?:SourceLocation;
  sourceKind?:'ui'|'request';
}
const clone=(v:Values):Values=>structuredClone(v);
export const fieldCheckpoint:Record<string,string>={customer:'fill-name',effective:'map-effective',quoteId:'map-command',type:'map-command',status:'status-return',policyCode:'map-code',sync:'map-sync'};
export const writeCheckpoint:Record<string,string>={policy:'save-call',apply:'save-event',store:'save-jpa',insurance:'insurance-save',quote:'published-write','quote-apply':'published-write'};
export const flowCheckpoint:Record<string,string>={event:'save-event',receive:'flow-event',view:'flow-read'};
export const validationIds=['quote-read','quote-guard','quote-get','internal-call','internal-enter','duplicate-read','objects-read','duplicate-guard'];

export function executionCheckpoints(params:URLSearchParams):ExecutionCheckpoint[]{
  const ctx=creationContext(params),{quote:q,policy:p}=ctx;
  const all:ExecutionCheckpoint[]=[];
  let state:Values={quoteId:q.id};
  function add(id:string,stage:string,ref:string,line:number,method:string,title:string,purpose:string,patch:Values={},extra:Partial<ExecutionCheckpoint>={}){
    const before=clone(state);state={...state,...patch};
    all.push({id,stage,ref,line,method,title,purpose,before,after:clone(state),changed:Object.keys(patch),...extra});
  }
  add('quote-ui','quote','create-api',43,'UI','Phát hành từ Quote','quoteId lấy từ báo giá đang mở; đây là UI học tập mô phỏng.',{},{sourceKind:'ui'});
  add('quote-request','quote','create-api',43,'HTTP','Gửi request','POST /policy/create/{quoteId} · body trống.',{request:{method:'POST',path:`/policy/create/${q.id}`,body:'Trống'}},{action:'Phát hành thành hợp đồng',sourceKind:'request'});
  add('controller-call','quote','create-api',45,'PolicyController.createPolicy','Controller nhận quoteId và gọi exec','Controller truyền nguyên quoteId vào CreatePolicyFunc.exec(quoteId).',{quoteId:q.id},{action:'Lần vào backend',via:'Gọi method · Controller L45 → exec'});
  const actual=debugInstructions(q),template=debugInstructions(q.missing?quotes[0]:q);
  for(const [i,id] of validationIds.entries()){
    const item=actual[i]??template[i];
    state=clone(item.after);
    all.push({id,stage:'validate',ref:'create-check',line:item.line,to:item.end,method:i<4?'CreatePolicyFunc.exec':'CreatePolicyFunc.runInternal',title:item.title,purpose:item.purpose,before:clone(item.before),after:clone(item.after),changed:item.changed,observed:item.observed,error:actual[i]?.error,
      action:item.enter?'Vào runInternal':undefined,via:item.enter?'Gọi method · exec:L67 → runInternal:L70':undefined,caller:{ref:i<4?'create-api':'create-check',line:i<4?45:67}});
  }
  const shortQuote={id:q.id,quoteCode:q.quoteCode,customerModel:q.customerModel,effectiveDate:q.effectiveDate,expirationDate:q.expirationDate,insuranceTotalAmount:q.insuranceTotalAmount};
  state={quoteAggregate:shortQuote,status:[0,100],policyAggregateList:q.blocked?[{id:'POL-EXISTING-103',status:100}]:[],insuranceObjectList:quoteInsurance(q)};
  add('map-dates','map','create-data',80,'CreatePolicyFunc.runInternal','Đọc ngày trên Quote','Tiếp tục ngay sau điều kiện L76. L80–82 đọc effectiveDate, expirationDate và now.',{effectiveDate:q.effectiveDate,expirationDate:q.expirationDate,now:SAMPLE_NOW},{to:82,caller:{ref:'create-check',line:76},via:'Đủ điều kiện · runInternal:L76 → L80'});
  let command:Values={policyType:q.quoteType,quoteId:q.id,quoteCode:q.quoteCode,insuranceTotalAmount:q.insuranceTotalAmount};
  add('map-command','map','create-data',83,'CreatePolicyFunc.runInternal','Dựng CreatePolicyCommand','L83 map Quote sang command; L84–86 gán policyType, quoteId, quoteCode. Ảnh chụp rút gọn các trường có fixture.',{command},{to:86});
  add('status-call','map','create-data',87,'CreatePolicyFunc.runInternal','Gọi getPolicyStatus','Dừng ở lời gọi với now, effectiveDate, expirationDate; chưa gán command.status.');
  const statusScope=clone(state);
  state={now:SAMPLE_NOW,effectiveDate:q.effectiveDate,expirationDate:q.expirationDate};
  add('status-enter','map','create-status',195,'CreatePolicyFunc.getPolicyStatus','Vào getPolicyStatus','Nhận ba mốc ngày để chọn trạng thái theo source.',{}, {action:'Vào getPolicyStatus',caller:{ref:'create-data',line:87},via:'Gọi method · runInternal:L87 → getPolicyStatus:L195'});
  add('status-choice','map','create-status',p.status===0?197:p.status===-1?199:201,'CreatePolicyFunc.getPolicyStatus','Chọn trạng thái theo ngày','now trước hiệu lực → 0; nếu hết hạn trước now → -1; còn lại → 100.',{returnValue:p.status},{observed:{'now.before(effectiveDate)':p.status===0,'expirationDate.before(now)':p.status===-1,selected:p.status},caller:{ref:'create-data',line:87}});
  command={...command,status:p.status,createdDate:SAMPLE_NOW};
  state=statusScope;
  add('status-return','map','create-data',87,'CreatePolicyFunc.runInternal','Trạng thái ban đầu · trở về runInternal','Nhận giá trị trả về và gán command.status ở L87; L88–89 gán ngày tạo/cập nhật.',{command},{to:89,action:'Trở về runInternal',via:'Trả về nơi gọi · getPolicyStatus → runInternal:L87',caller:{ref:'create-status',line:p.status===0?197:p.status===-1?199:201}});
  command={...command,effectiveDate:q.effectiveDate,expirationDate:q.expirationDate};
  add('map-effective','map','create-data',90,'CreatePolicyFunc.runInternal','Ngày hiệu lực · gán vào command','L90–91 gán ngày. L92–100 xử lý các trường liên quan; không bịa giá trị uploader chưa có trong fixture.',{command},{to:100});
  add('fill-call','map','create-data',102,'CreatePolicyFunc.runInternal','Gọi fillMissingValue','fillMissingValue(quoteAggregate, command) bổ sung trường vào command đang dựng. Hai tham số giữ cùng dữ liệu, chưa vào thân method.');
  const runScope=clone(state);
  state={quoteAggregate:shortQuote,command};
  add('fill-enter','map','create-customer',204,'CreatePolicyFunc.fillMissingValue','Vào fillMissingValue','Nhận quoteAggregate và command từ lời gọi L102, trong cùng CreatePolicyFunc.java.',{},{action:'Vào fillMissingValue',caller:{ref:'create-data',line:102},via:'Gọi method · runInternal:L102 → fillMissingValue:L204'});
  command={...command,customerId:q.customerModel.id};
  add('fill-id','map','create-customer',205,'CreatePolicyFunc.fillMissingValue','Gán customerId','Lấy ID từ Quote.customerModel vào command.customerId.',{command});
  const personal=Number(q.customerModel.type)===0;
  const name=personal?q.customerModel.name:('organizationName' in q.customerModel?q.customerModel.organizationName:'Chưa có trong fixture');
  command={...command,customerName:name};
  add('fill-name','map','create-customer',206,'CreatePolicyFunc.fillMissingValue','Khách hàng · gán tên','PERSONAL(0) lấy name; trường hợp khác lấy organizationName. Chỉ sau khi chạy L206 mới có command.customerName.',{command},{observed:{'CustomerType.PERSONAL == customerModel.type':personal,selected:personal?'name':'organizationName',[personal?'Quote.customerModel.name':'Quote.customerModel.organizationName']:name,'command.customerName':name}});
  command={...command,customerModel:q.customerModel};
  add('fill-rest','map','create-customer',207,'CreatePolicyFunc.fillMissingValue','Bổ sung dữ liệu còn lại','L207–215 còn gán email, định danh, customerModel, quy đổi và uploader. Chỉ hiển thị giá trị đã có trong fixture.',{command},{to:215});
  state={...runScope,command};
  add('fill-return','map','create-data',103,'CreatePolicyFunc.runInternal','Trở về runInternal','fillMissingValue đã kết thúc. Tiếp tục từ L103 ngay sau lời gọi L102; chưa chạy generatePolicyCode.',{},{action:'Trở về runInternal',caller:{ref:'create-customer',line:215},via:'Trả về nơi gọi · fillMissingValue → runInternal:L103'});
  command={...command,policyCode:p.policyCode};
  add('map-code','map','create-data',103,'CreatePolicyFunc.runInternal','Mã hợp đồng','generatePolicyCode trả mã mẫu của Workshop; không chạy bộ sinh mã thật.',{command});
  command={...command,syncStatus:0};
  add('map-sync','map','create-data',104,'CreatePolicyFunc.runInternal','Trạng thái Core · chuẩn bị ghi','L104 gán NOT_SYNC. L105–114 chuẩn bị thanh toán; checkpoint gộp, chỉ có dữ liệu fixture đã biết.',{command},{to:114});
  add('save-call','save','create-data',115,'CreatePolicyFunc.runInternal','Gọi ghi Policy','policyAggregateRepository.save(command). Chưa có kết quả trả về và chưa gắn Policy ID.');
  add('save-event','save','create-apply',329,'PolicyAggregate.process','Tạo CreatePolicyEvent','Repository gọi process(CreatePolicyCommand); event ánh xạ từ command.',{CreatePolicyEvent:command},{to:330,via:'Gọi method · save(command) → process'});
  add('save-apply','save','create-apply',334,'PolicyAggregate.apply','Áp dụng event lên aggregate','L334–339 ánh xạ event lên aggregate; chưa hiển thị ID trước checkpoint gắn ID.',{aggregate:command},{to:339});
  add('save-id','save','store-save',122,'EventuateJdbcAccessImpl.saveWithoutTransaction','Gắn Policy ID','Gắn entityId vào aggregate tại L122. Đây là checkpoint đầu tiên quan sát được Policy ID.',{policyId:p.id,aggregate:p});
  add('save-jpa','save','store-save',126,'EventuateJdbcAccessImpl.saveWithoutTransaction','JPA save aggregate','Lưu aggregate đã có ID; kết quả vẫn thuộc nhánh Command.',{savedAggregate:p});
  add('insurance-call','save','create-after',147,'CreatePolicyFunc.runInternal','Gọi createContractCode','Sau khi save(command) trả về, gọi tạo đối tượng POLICY.',{}, {via:'Trả về nơi gọi · repository → runInternal:L147'});
  add('insurance-save','save','create-quote',256,'CreatePolicyFunc.createContractCode','Ghi đối tượng POLICY','L240–256 dựng và ghi đối tượng POLICY, giữ liên kết tới Quote.',{insuranceObjects:policyInsurance(q,p)},{via:'Gọi method · runInternal:L147 → createContractCode',caller:{ref:'create-after',line:147}});
  add('published-call','save','create-after',158,'CreatePolicyFunc.runInternal','Trở về và gọi publishedQuote','Sau đối tượng POLICY và lời gọi gửi chứng nhận, source cập nhật Quote tại L158. Không mô phỏng email/SMS.',{}, {via:'Trả về nơi gọi · createContractCode → runInternal:L158'});
  add('published-write','save','create-quote',233,'CreatePolicyFunc.publishedQuote','Ghi liên kết trên Quote','PublishedQuoteCommand cập nhật Quote sang PUBLISHED và liên kết Policy ID.',{publishedQuote:{quoteId:q.id,policyId:p.id,policyCode:p.policyCode,status:'PUBLISHED(9)'}},{caller:{ref:'create-after',line:158},via:'Gọi method · runInternal:L158 → publishedQuote:L233'});
  add('save-return','save','create-after',159,'CreatePolicyFunc.runInternal','Trả kết quả Command','Trả policyAggregate về nơi gọi; Network mô phỏng có kết quả Command.',{response:{entityId:p.id,version:'demo-event-version'}},{via:'Trả về nơi gọi · runInternal → exec → Controller'});
  state={CreatePolicyEvent:{entityId:p.id},entityId:p.id};
  add('flow-event','flow','flow-create',24,'PolicyWorkflow.createPolicy','Flow nhận CreatePolicyEvent','Qua event sang handler. Bài chọn checkpoint quan sát; không suy diễn thứ tự HTTP response và event ở runtime.',{}, {via:'Qua event · CreatePolicyEvent L329 → PolicyWorkflow:L24',caller:{ref:'create-apply',line:329}});
  add('flow-executor','flow','flow-view',39,'PolicySyncViewFunc.exec','Gọi executor xử lý','PolicyWorkflow L27 gọi exec(entityId); L39 đưa việc vào executor.',{}, {caller:{ref:'flow-create',line:27},via:'Gọi method · PolicyWorkflow:L27 → PolicySyncViewFunc:L39'});
  add('flow-read','flow','flow-view',41,'PolicySyncViewFunc.exec','Đọc lại Command','Đọc Policy theo cùng ID từ Command.',{policyModel:p});
  add('flow-guard','flow','flow-view',42,'PolicySyncViewFunc.exec','Kiểm tra policyModel','Nếu null thì return ở L43. Fixture hiện tại có Command đã ghi.',{},{observed:{'policyModel == null':false}});
  add('flow-write','flow','flow-view',56,'PolicySyncViewFunc.exec','Ghi Policy View','Map dữ liệu đọc lại và lưu bản ghi tra cứu cùng ID.',{PolicyView:{id:p.id,policyCode:p.policyCode,customerName:p.customerName,status:p.status}});
  add('flow-realtime','flow','flow-view',58,'PolicySyncViewFunc.exec','Queue thông báo tra cứu','Sau khi save view, queue thông báo realtime; Core có đường riêng.',{topic:`/topic/sync-policy-view/${p.id}`},{to:61});
  state={policyId:p.id};
  add('result-request','result','q-api',26,'UI → PolicyController.search','Người dùng tìm Policy · gửi request','POST /policy/search với mã vừa tạo; chưa có kết quả Query.',{request:{keyword:p.policyCode,status:'all',pageNumber:0,pageSize:2}});
  const search=searchSamples({keyword:p.policyCode,status:'all',pageNumber:0,pageSize:2},[p]);
  add('result-query','result','q-source',114,'SearchPolicyFunc.exec','Query trả danh sách','Đọc Policy View và ánh xạ PolicyListResponse.',{PolicyListResponse:search},{to:115,via:'Gọi method · Controller → Query'});
  add('detail-request','result','c-api',50,'UI → PolicyController.findById','Người dùng mở chi tiết · gửi request','GET /policy/{id}; đây là đường Command độc lập với Query.',{request:{method:'GET',path:`/policy/${p.id}`}});
  add('detail-read','result','c-find',32,'FindPolicyByIdFunc.exec','Command trả chi tiết','Đọc aggregate và ghép đối tượng/thanh toán theo đúng policyId.',{PolicyDetailResponse:detailSample(p.id,[p])},{to:37,via:'Gọi method · Controller → Command'});
  add('result-compare','result','c-find',37,'FindPolicyByIdFunc.exec','Đối chiếu cùng Policy ID','UI đối chiếu ID từ Command, Query và response Chi tiết ở L37, giữ nguyên lần chạy.',{samePolicyId:p.id});
  return all;
}

export function executionSession(params:URLSearchParams,node:string){
  const all=executionCheckpoints(params),byId=new Map(all.map(c=>[c.id,c]));
  const legacy=practiceContext(params);
  const legacyDone=new Set<string>();
  const through=(stage:string)=>all.filter(c=>c.stage===stage).forEach(c=>legacyDone.add(c.id));
  if(legacy.hasRequest){legacyDone.add('quote-ui');legacyDone.add('quote-request');}
  if(legacy.backendOpen)legacyDone.add('controller-call');
  validationIds.slice(0,legacy.reached).forEach(id=>legacyDone.add(id));
  if(legacy.level>=2)through('map');if(legacy.commandReady)through('save');if(legacy.viewReady)through('flow');
  if(legacy.resultSearched){legacyDone.add('result-request');legacyDone.add('result-query');}
  if(legacy.resultDetail){legacyDone.add('detail-request');legacyDone.add('detail-read');}
  if(legacy.complete[5])legacyDone.add('result-compare');
  const done=new Set((params.has('walk')?(params.get('walk')??'').split(','):[...legacyDone]).filter(id=>byId.has(id)));
  // A failed fixture cannot use URL edits to obtain later-stage results.
  const failure=all.find(c=>c.error);
  if(failure){const limit=all.indexOf(failure);for(const id of done)if(all.indexOf(byId.get(id)!)>limit)done.delete(id);}
  const stage=all.filter(c=>c.stage===node);
  const fallbackStop=node==='validate'&&legacy.reached?validationIds[legacy.reached-1]:stage.find(c=>!done.has(c.id))?.id??stage.at(-1)!.id;
  const stop=byId.get(params.get('stop')??'')??byId.get(fallbackStop)!;
  const legacyAt=node==='validate'&&params.has('debug')?validationIds[Math.max(0,legacy.cursor-1)]:params.get('field')?fieldCheckpoint[params.get('field')!]:undefined;
  const viewed=byId.get(params.get('at')??'')??byId.get(legacyAt??'')??stage[0];
  const view=viewed.stage===node?viewed:stage[0];
  const failed=Boolean(failure&&done.has(failure.id));
  const next=failed?undefined:!done.has(stop.id)?stop:all.slice(all.indexOf(stop)+1).find(c=>!done.has(c.id));
  const effective=new URLSearchParams(params);
  const phase=done.has('flow-write')?'view':done.has('save-return')?'command':done.has('map-sync')?'mapped':done.has('duplicate-guard')&&!failed?'checked':'idle';
  effective.set('sim',phase);effective.set('debugVersion','2');
  effective.set('debug',String(view.stage==='validate'&&done.has(view.id)?validationIds.indexOf(view.id)+1:0));
  effective.set('debugMax',String(validationIds.filter(id=>done.has(id)).length));
  const set=(key:string,value:string|undefined)=>value===undefined?effective.delete(key):effective.set(key,value);
  set('sentQuote',done.has('quote-request')?legacy.quote.id:undefined);set('backend',done.has('controller-call')?'1':undefined);
  set('attempt',failed?'failed':undefined);set('resultSearch',done.has('result-query')?'1':undefined);set('resultDetail',done.has('detail-read')?'list':undefined);set('resultViewed',done.has('result-compare')?'1':undefined);
  const base=practiceContext(effective);
  const complete=practiceSteps.map(s=>all.filter(c=>c.stage===s.id).every(c=>done.has(c.id))&&!(s.id==='validate'&&failed));
  const context={...base,complete};
  const stopReached=done.has(stop.id);
  const canInspectValues=done.has(view.id)||view.id===next?.id||view.id===stop.id;
  const location=(c:ExecutionCheckpoint)=>c.sourceKind==='ui'?'Chi tiết Quote · UI mô phỏng':c.sourceKind==='request'?'POST /policy/create/{quoteId}':`${c.method}:L${c.error?c.to??c.line:c.line}`;
  const checkpoint:CheckpointView={title:view.title,purpose:view.purpose,status:done.has(view.id)?view.error?'Đã chạy · dừng do lỗi':'Đã đi qua checkpoint':view.id===stop.id?'Chưa chạy checkpoint':'Đang xem source · checkpoint chưa tới',
    viewing:location(view),achieved:`${location(stop)}${stopReached?'':' · chưa chạy'}`,
    branch:view.error&&done.has(view.id)?view.error:next?`Tiếp theo: ${next.title} · ${next.method}:L${next.line}`:'Đã kết thúc lượt mô phỏng.',
    before:{label:view.stage==='validate'||view.stage==='map'?'Biến trước':'Đầu vào checkpoint',...(canInspectValues?{values:view.before}:{empty:'Checkpoint chưa tới · chỉ đọc source'})},
    after:done.has(view.id)?{label:view.stage==='validate'||view.stage==='map'?'Biến sau':'Kết quả quan sát',values:view.after,changed:view.changed,observed:view.observed}:{label:'Biến sau',empty:'Chưa chạy dòng này'},
  };
  const persist=(viewId=view.id,stopId=stop.id,executed=done)=>({walk:[...executed].join(','),stop:stopId,at:viewId,sim:phase,sentQuote:effective.get('sentQuote'),backend:effective.get('backend'),attempt:effective.get('attempt'),resultSearch:effective.get('resultSearch'),resultDetail:effective.get('resultDetail'),resultViewed:effective.get('resultViewed'),debug:effective.get('debug'),debugMax:effective.get('debugMax'),debugVersion:'2'});
  const navigation=checkpointNavigation({stepIds:practiceSteps.map(s=>s.id),points:all,done,stageId:node,viewId:view.id,stopId:stop.id,nextId:next?.id,complete,failed});
  return {all,byId,done,stop,view,next,failed,checkpoint,context,effective,persist,stage,stopReached,hasPolicyId:done.has('save-id'),navigation};
}
export type ExecutionSession=ReturnType<typeof executionSession>;
