import {listSource,listFrames,listStages} from '../content/policy/list';
import type {ListSourceId} from '../content/policy/list';
import {listDecisions} from '../content/policy/list-journey';
import type {ListJourneyStep} from '../content/policy/list-journey';
import type {listLearningState} from './list-model';
import {listRows} from './list-model';
import type {LearningLesson,LearningPattern,LearningComponent,LearningHandoff,LearningFocus,PatternWorkspaceAdapter,LearningDiagram,SourceCatalog} from './learning-contracts';

export const listLearningSources:SourceCatalog=Object.fromEntries(Object.entries(listSource.sources).map(([key,s])=>[key,{...s,line:s.from}]));
const evidence=(ref:ListSourceId,from:number,to:number)=>({ref,from,to});
const raw=(ref:string,from:number,to:number)=>listLearningSources[ref].rows.slice(from-1,to).map(r=>r.text).join('\n');
function component(id:string,name:string,role:string,ref:ListSourceId,from:number,to:number,input:string,output:string,support:ListSourceId[]=[]):LearningComponent{
 return {id,name,role,input,output,evidence:[evidence(ref,from,to),...support.map(key=>({ref:key}))],frame:listFrames[id]??raw(ref,from,to),change:'Đối chiếu hợp đồng đầu vào, phạm vi, tên trường và kiểu trả về với source. Giữ đúng loại ID.',};
}
function handoff(id:string,from:LearningComponent,to:LearningComponent,label:string,data:string,result:string,kind:'call'|'data'='call',ranges?:[number,number,number,number]):LearningHandoff{
 const a=from.evidence[0],b=to.evidence[0];
 return {id,from:from.id,to:to.id,label,data,result,kind,frame:'',evidence:[{...a,...ranges?{from:ranges[0],to:ranges[1]}:{}},{...b,...ranges?{from:ranges[2],to:ranges[3]}:{}}]};
}
function focus(e:{ref:string;from?:number;to?:number},tone:'caller'|'receiver'|'component'|'support'='component'):LearningFocus{
 const s=listLearningSources[e.ref],start=e.from??s.from,end=e.to??s.to??start;
 return {ref:e.ref,symbol:s.symbol,annotations:[{start,end,tone,label:tone==='caller'?'A · Bên giao':tone==='receiver'?'B · Bên nhận':'Nhóm lệnh đang đối chiếu'}]};
}
const definition=(id:string,title:string,nodes:LearningComponent[],edges:LearningHandoff[],input:string,output:string):LearningPattern=>({id,title,badge:'Mẫu đang dùng trong Danh sách',nodes,edges,input,output,fit:'Mẫu đọc Policy từ view theo đúng phạm vi và tiêu chí đã gửi.',grouping:'Nhóm theo trách nhiệm và hợp đồng dữ liệu, đối chiếu từ snapshot Danh sách.',difference:'Tiêu chí do người dùng nhập; phạm vi do backend xác định. Không suy ra quyền Chi tiết từ bộ lọc Danh sách.',examples:[]});

export function listLearningLesson(step:ListJourneyStep,session:ReturnType<typeof listLearningState>,params:URLSearchParams):LearningLesson{
 const r=session.result,req=JSON.stringify(session.request),identity=`${session.sentPersona} → ${r.scope??'không thêm phạm vi / chưa xác định'}`;
 const api=component('list-api','Controller','Nhận JSON body và giao SearchPolicyFunc.exec.','api',24,27,req,'WrapResponse<Page<PolicyListResponse>>',['controllerBase']);
 const dto=component('list-input','DTO','Tiêu chí có kiểu dữ liệu, phân trang kế thừa.','request',14,33,req,'SearchPolicyRequest + mặc định 0/10',['baseSort','basePage']);
 const exec=component('list-result','Func / ánh xạ','Điều phối doFilter, ánh xạ trang và bắt lỗi.','search',112,119,req,`${r.page.totalElements} hợp đồng; metadata giữ nguyên`,['mapping','wrap']);
 const scope=component('list-scope','Phạm vi backend','Từ username xác định tập hợp đồng được xem.','search',38,53,identity,JSON.stringify(r.conditions.filter(c=>c.origin==='backend')),['saleUnit','config','identity']);
 const filter=component('list-filter','Điều kiện tìm','Chuẩn hóa keyword và nối AND vào phạm vi backend.','search',54,109,req,JSON.stringify(r.conditions),['query','text','pageable']);
 const page=component('list-page','Repository','Đếm tổng trước khi áp dụng OFFSET và LIMIT.','repository',26,39,r.sql,`total=${r.page.totalElements}, offset=${r.offset}, content=[${r.page.content.map(row=>row.id)}]`,['entity']);
 const response=component('list-table','Trang kết quả','Hợp đồng dữ liệu của dòng hiển thị, không phải source frontend.','response',13,34,`Page<PolicyListResponse> · ${r.page.content.length} dòng`,JSON.stringify(r.page.content.map(row=>({id:row.id,policyCode:row.policyCode}))),['basePage']);
 const detail=component('list-handoff','Endpoint Chi tiết','Nhận đúng Policy ID của dòng được chọn.','detail',48,51,session.selected??'Chưa chọn dòng',session.selected?`GET /policy/${session.selected}`:'Chưa bàn giao ID');
 let primary:LearningPattern;
 if(step.id==='find')primary=definition('list-entry','JSON tiêu chí → Controller → Func',[api,dto,exec],[handoff('receive',api,exec,'Gửi tiêu chí tìm kiếm',req,'Func nhận đúng SearchPolicyRequest.', 'call',[24,26,112,115]),handoff('defaults',dto,exec,'Tiêu chí và phân trang',req,'DTO không mang quyền xem; bỏ pageNumber/pageSize dùng 0/10.','data')],req,'Tiêu chí đã nhận, sẵn sàng xác định phạm vi.');
 else if(step.id==='scope')primary=definition('list-scope','Phạm vi backend AND tiêu chí tìm',[scope,filter,page],[handoff('scope-filter',scope,filter,'Phạm vi giao với tiêu chí',`${identity}; keyword=${session.request.keyword??''}; điều kiện=${JSON.stringify(r.conditions)}`,r.errorAt===2?'Lỗi username; không dựng điều kiện.':`${r.filtered.length} hợp đồng thỏa tập điều kiện trước phân trang.`,'data',[47,53,54,59]),handoff('query',filter,page,'Giao SQL và Pageable',`${r.sql}; pageNumber=${session.request.pageNumber??0}; pageSize=${session.request.pageSize??10}`,`Repository đếm tổng và giới hạn content theo trang.`,'call',[104,109,26,39])],`${req}; ${identity}`,'SQL và Pageable giao xuống nơi đọc.');
 else if(step.id==='results')primary=definition('list-page','Đọc trang → ánh xạ → kết quả',[page,exec,response],[handoff('page',page,exec,'Trả Page<PolicyViewEntity>',page.output,`${r.page.content.length} dòng trong trang, total=${r.page.totalElements}.`,'data',[34,38,112,119]),handoff('dto',exec,response,'Giữ metadata và ID',response.output,'Màn học hiển thị content; đổi trang giữ request đã gửi.','data',[114,119,13,34])],page.input,response.output);
 else primary=definition('list-detail','ID của dòng → endpoint Chi tiết',[response,detail],[handoff('id',response,detail,'Bàn giao Policy ID',session.selected?`id=${session.selected} → GET /policy/${session.selected}`:'Chưa có dòng được chọn; không tạo ID thay thế.',detail.output,'data')],response.output,detail.output);
 const renewal=component('renewal','Tìm tái tục','Mẫu tham khảo đã xác minh; dùng saleUnitPath prefix thay ANY(pathSaleUnitIds).','renewal',37,68,req,'Cùng view và Page; phạm vi và filter khác.',['request','query','repository']);
 const reference=definition(`list-renewal-${step.id}`,'Tham khảo · tìm Policy tái tục',[renewal,page],[handoff('renewal-page',renewal,page,'Cùng nơi đọc, khác phạm vi',`SearchRenewalPolicyFunc · ${req}`,'Không sao chép nguyên quy tắc quyền của mẫu tham khảo.','call',[104,106,26,39])],req,'Page Policy tái tục theo quy tắc riêng.');
 reference.badge='Mẫu tham khảo đã xác minh';reference.fit='Đối chiếu khung đọc view có phân trang. Phạm vi tái tục dùng saleUnitPath prefix, không áp nguyên vào Danh sách.';reference.difference='Mẫu tái tục không áp dụng các list filter dù nhận chung DTO; phạm vi khác SearchPolicyFunc.';
 const decisions=listDecisions(step,r,session.selected).map((d,i)=>({id:`decision-${i+1}`,shortTitle:d.title,question:d.question,hint:i===0?'Tách dữ liệu người dùng gửi khỏi dữ liệu backend tự xác định. Đối chiếu những dòng đang xem.':'Đọc kiểu dữ liệu ở hai đầu và theo thứ tự lời gọi đã xác minh.',options:d.options.map((label,j)=>({label,consequence:d.feedback[j],fit:j===0?'current' as const:'alternative' as const,fitLabel:j===0?'Khớp source Danh sách':'Đối chiếu lại trách nhiệm'})),reveal:i===0?primary.nodes.slice(0,2).map(n=>n.id):primary.nodes.map(n=>n.id)}));
 if(step.id==='scope'){
  const shown=r.page.content[0],other=listRows(params).find(row=>row.unit==='DV-B');
  decisions[0].question=shown?`Vì sao ${shown.policyCode} được hiển thị${other?`, còn ${other.policyCode} có thể bị loại`:''} với cùng từ khóa “${session.request.keyword??''}”?`:`Vì sao lượt tìm “${session.request.keyword??''}” không có dòng được hiển thị?`;
 }
 return {situation:step.description,input:primary.input,output:primary.output,decisions,patterns:[primary,reference]};
}

export function listDecisionData(step:ListJourneyStep,session:ReturnType<typeof listLearningState>,params:URLSearchParams,index:number,previousExplored=true){
 const r=session.result,rows=[{label:'keyword',value:String(session.request.keyword??'(bỏ trống)')},{label:'status',value:String(session.request.status??'Tất cả')},{label:'Danh tính backend',value:session.sentPersona}];
 if(step.id==='scope'){
  rows.push({label:'Phạm vi backend',value:String(r.scope??'không thêm / chưa xác định')});
  for(const row of listRows(params).filter(row=>row.id===r.page.content[0]?.id||row.unit==='DV-B').slice(0,3))rows.push({label:row.policyCode,value:`id=${row.id}; pathSaleUnitIds=[${row.pathSaleUnitIds.join(',')}]; status=${row.status}; ${r.page.content.some(item=>item.id===row.id)?'Có trong trang đang xem':'Không có trong trang đang xem'}`});
  if(index>0)rows.push(previousExplored?{label:'Điều kiện truy vấn',value:JSON.stringify(r.conditions)}:{label:'Đầu vào từ quyết định trước',value:'Khám phá quyết định trước để đối chiếu cách hình thành phạm vi.'});
 }else if(step.id==='results')rows.push({label:'Trang / tổng số',value:`pageNumber=${session.request.pageNumber??0}; pageSize=${session.request.pageSize??10}; total=${r.page.totalElements}`},{label:'ID trong trang',value:r.page.content.map(row=>row.id).join(', ')||'[]'});
 else if(step.id==='detail')rows.push({label:'Policy ID đã chọn',value:session.selected??'Chưa chọn dòng'},{label:'Endpoint nhận ID',value:session.selected?`GET /policy/${session.selected}`:'Chưa có request Chi tiết'});
 else rows.push({label:'pageNumber / pageSize',value:`${session.request.pageNumber??0} / ${session.request.pageSize??10}`});
 return rows;
}

export const listPatternModel:Omit<PatternWorkspaceAdapter,'implementation'>={
 sources:listLearningSources,guides:Object.fromEntries(Object.entries(listLearningSources).map(([id,s])=>[id,{role:s.symbol,explanation:listStages.find(p=>p.ref===id)?.why??`Source hỗ trợ đã xác minh: ${s.symbol}. Đối chiếu khai báo và kiểu dữ liệu trong file.`}])),title:'Danh sách Policy',
 componentFocus:e=>focus(e),nodeFocus:(n,ref)=>focus(n.evidence.find(e=>e.ref===ref)??{ref}),
 trace:(_pattern,edge)=>{const a=focus(edge.evidence[0],'caller'),b=focus(edge.evidence[1],'receiver');return {kind:edge.kind??'data',relation:edge.kind==='call'?'Lời gọi':'Bàn giao dữ liệu',caller:{id:'A',label:'Bên giao',focus:a,code:raw(a.ref,a.annotations[0].start,a.annotations[0].end)},receiver:{id:'B',label:'Bên nhận',focus:b,code:raw(b.ref,b.annotations[0].start,b.annotations[0].end)},note:edge.limit};},
 diagram:pattern=>{
  const model:LearningDiagram={nodes:pattern.nodes.map(n=>({id:n.id,title:listLearningSources[n.evidence[0].ref].path.split('/').at(-1)!.replace('.java',''),role:n.name,ref:n.evidence[0].ref,componentId:n.id})),relations:pattern.edges.map(e=>({id:e.id,from:e.from,to:e.to,kind:e.kind??'data',label:e.label,handoff:e})),files:[]};
  for(const n of pattern.nodes)for(const e of n.evidence.slice(1)){
   const id=`support:${e.ref}`;
   if(!model.nodes.some(other=>other.id===id))model.nodes.push({id,title:listLearningSources[e.ref].path.split('/').at(-1)!.replace('.java',''),role:'Thành phần hỗ trợ',ref:e.ref});
   model.relations.push({id:`${n.id}:${e.ref}`,from:n.id,to:id,kind:'support',label:listLearningSources[e.ref].symbol,fromFocus:focus(n.evidence[0]),toFocus:focus(e,'support')});
  }
  const refs=[...new Set(model.nodes.map(n=>n.ref))];model.files=refs.map(ref=>({id:ref,path:listLearningSources[ref].path,nodeIds:model.nodes.filter(n=>n.ref===ref).map(n=>n.id)}));return model;
 },
};
