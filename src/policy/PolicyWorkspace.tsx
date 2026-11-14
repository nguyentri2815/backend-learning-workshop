import { lazy, Suspense, useRef } from 'react';
import type { ComponentProps } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowRight, GitBranch, RotateCcw } from 'lucide-react';
import { groups, createNodes, verifiedFlows, claimDesignQuestion } from '../content/policy/flows';
import type { LessonNode, PolicyGroup } from '../content/policy/flows';
import { excerptById, policySource } from '../content/policy/lesson';
import { creationContext, newQuoteAttempt } from './create-model';
import type { PolicyLearningProgress } from './policy-model';
import { PolicyDetailLesson } from './PolicyDetailLesson';
import {beginDetail} from './detail-model';
import {detailPoints,detailSource} from '../content/policy/detail';
import { PolicySourceExplorer } from './PolicySourceExplorer';
import { CreatePolicyLesson } from './CreatePolicyLesson';
import { PolicyDiagram } from './PolicyDiagram';
import { PolicyCreationOverview } from './PolicyCreationOverview';
import {PolicyListLesson} from './PolicyListLesson';
import {listStages,listSource} from '../content/policy/list';
import {currentListStep} from '../content/policy/list-journey';
import './policy.css';
import {executionSession} from './policy-execution';
import {updateModePosition} from './update-position';
import {statusModePosition} from './status-position';
import {PolicySessionPicker} from './PolicySessionPicker';
import {selectedSession} from './policy-session-memory';

const StatusLesson = lazy(() => import('./PolicyStatusLesson').then(module=>({default:module.PolicyStatusLesson})));
const UpdateLesson = lazy(() => import('./PolicyUpdateLesson').then(module=>({default:module.PolicyUpdateLesson})));
const Assembly = lazy(() => import('./PolicyAssembly').then(module => ({default: module.PolicyAssembly})));
const ImplementationSession = lazy(() => import('./PolicyImplementationSession').then(module=>({default:module.PolicyImplementationSession})));
function PolicyAssembly(props: ComponentProps<typeof Assembly>) {
 return <Suspense fallback={<p>Đang mở Tư duy lắp ráp…</p>}><Assembly {...props}/></Suspense>;
}

type Changes=Record<string,string|null>;
// The diagram follows one entry path. Alternative triggers remain evidence links,
// rather than being drawn as calls from one API to another.
const primaryPaths:Record<string,string[]>={
 endorsement:['endorsement-api','endorsement-check','endorsement-write','endorsement-apply','store-update','flow-view'],
 'core-status':['endorsement-api','endorsement-check','endorsement-write','endorsement-apply','store-update','flow-endorsement'],
 permission:['permission-api','permission-check','permission-write','permission-apply','store-update'],
 'online-initial':['payment-quote-api','paid-create','online-initial','online-save','create-apply','store-save'],
 'cash-initial':['payment-quote-api','offline-trigger','cash-trigger','cash-initial','cash-save','store-save'],
};
function flowNodes(flow:typeof verifiedFlows[number]):LessonNode[] {return flow.refs.map((ref,i)=>({id:ref,title:excerptById[ref].symbol,ref,action:i===0?'Tìm tác nhân kích hoạt và lần lời gọi tiếp theo.':'Đọc phần xử lý, đối chiếu điều kiện trước khi ghi.',why:flow.condition,contract:flow.change,check:flow.limit??'Chỉ ra command, event apply và nơi lưu dữ liệu. Chưa chạy Java/backend.',result:flow.change,links:flow.refs[i+1]?[{label:excerptById[flow.refs[i+1]].symbol,ref:flow.refs[i+1],step:flow.refs[i+1]}]:[]}));}

export function PolicyWorkspace({progress,copyLink}:{progress:PolicyLearningProgress;copyLink:()=>void}) {
 const [params,setParams]=useSearchParams();
 const explicit=params.get('group');
 const legacyStep=params.get('step');
 const legacyRef=params.get('ref')??'';
 const inferred:PolicyGroup = params.has('file')||params.has('side')||legacyStep==='search'||params.get('point')?.startsWith('list-')?'list':legacyStep==='detail'||legacyStep==='trace'||legacyStep==='missing'||params.get('point')?.startsWith('detail-')||params.get('point')==='missing-branch'?'detail':legacyRef.startsWith('q-')?'list':legacyRef.startsWith('c-')?'detail':legacyRef.startsWith('create')||legacyRef.startsWith('flow')?'create':legacyRef.startsWith('upload')||legacyRef.startsWith('endorsement')||legacyRef.startsWith('permission')?'update':legacyRef.startsWith('state')?'status':'create';
 const group:PolicyGroup=groups.some(g=>g.id===explicit)?explicit as PolicyGroup:inferred;
 const requestedMode=params.get('mode');
 const mode=group==='create'&&requestedMode==='session'?'session':(group==='create'||group==='list'||group==='detail'||group==='update'||group==='status')&&requestedMode==='assembly'?'assembly':requestedMode==='steps'||requestedMode===null&&(params.has('step')||params.has('point')||params.has('ref')||params.has('node'))?'steps':'overview';
 const created=creationContext(params);
 const flow=group==='update'||group==='status' ? verifiedFlows.find(f=>f.group===group&&f.id===params.get('flow'))??verifiedFlows.find(f=>f.id===(group==='update'?'checkout':'date')) : undefined;
 const listRefs=['q-api','request','q-scope','q-filter','q-page','q-source','list-dto','c-api'];
 const nodes:LessonNode[]=group==='create'?createNodes:group==='list'?listStages.map((s,i)=>({id:s.id,title:s.title,ref:listRefs[i],action:s.why,why:s.why,contract:s.data,check:s.why,result:s.data})):group==='detail'?detailPoints.map(p=>({id:p.id,title:p.title,ref:p.ref,action:p.why,why:p.why,contract:p.why,check:p.why,result:p.why})):flowNodes(flow!);
 const diagramNodes=flow&&primaryPaths[flow.id]?primaryPaths[flow.id].map(id=>nodes.find(n=>n.ref===id)!).filter(Boolean):nodes;
 const rawRequestedNode=params.get('node')??params.get('point');
 const listAliases:Record<string,string>={'list-source':'list-page','list-response':'list-result'};
 const requestedNode=group==='list'?(listAliases[rawRequestedNode??'']??rawRequestedNode??(params.has('listJourney')?currentListStep(params).points[0]:null)):rawRequestedNode;
 const node=nodes.find(n=>n.id===requestedNode)??nodes[0];
 const ref=params.get('ref')??node.ref;
 const invalid=Boolean((explicit&&!groups.some(g=>g.id===explicit))||(requestedMode&&!['steps','overview','assembly','session'].includes(requestedMode))||(group!=='update'&&group!=='status'&&requestedNode&&!nodes.some(n=>n.id===requestedNode))||(group!=='update'&&group!=='status'&&params.has('ref')&&!excerptById[ref]));
 const position=useRef<Record<string,number>>({});
 function update(changes:Changes,replace=false) {
  // Router navigation writes history before the next render. Merge with that URL:
  // useSearchParams callbacks do not queue consecutive updates like React state.
  const previous=new URLSearchParams(window.location.search),next=new URLSearchParams(previous);
  const opened=[...new Set([...(previous.get('opened')??'').split(','),ref,previous.get('evidence')??'',changes.ref??'',changes.evidence??''])].filter(id=>excerptById[id]);
  if(opened.length)next.set('opened',opened.join(','));
  for(const [key,value] of Object.entries(changes))value===null?next.delete(key):next.set(key,value);
  setParams(next,{replace});
 }
 function changeMode(next:string) {const memory=group==='update'||group==='status'?`${group}:${params.get('flow')??(group==='status'?'date':'checkout')}`:group;position.current[`${memory}:${mode}`]=window.scrollY;update({group,mode:next,...(group==='update'?updateModePosition(params,mode,next):group==='status'?statusModePosition(params,mode,next):{}),...(group==='create'&&next==='assembly'&&mode==='steps'?{assemblyStep:node.id}:{} )});requestAnimationFrame(()=>window.scrollTo({top:position.current[`${memory}:${next}`]??0,behavior:'instant'}));}
 function returnToAssembly() {
  const saved=new URLSearchParams(params.get('assemblyReturn')!);
  const previous=executionSession(saved,saved.get('node')??'quote');
  const current=executionSession(params,node.id);
  const quoteChanged=current.context.quote.id!==previous.context.quote.id;
  // Viewing changes nothing. If the learner deliberately continued the simulation,
  // returning to the explanation must not roll that work back.
  if(quoteChanged){
   // Selecting another Quote intentionally starts a new simulation. Keep that new
   // attempt, while restoring the explanation's own step/component/source.
   for(const key of Object.keys(newQuoteAttempt(current.context.quote.id))){
    const value=params.get(key);
    value===null?saved.delete(key):saved.set(key,value);
   }
  }else if(current.stop.id!==previous.stop.id||[...current.done].join(',')!==[...previous.done].join(',')){
   for(const [key,value] of Object.entries(current.persist())){
    if(key==='at')continue;
    value===null?saved.delete(key):saved.set(key,value);
   }
  }
  setParams(saved);
  requestAnimationFrame(()=>requestAnimationFrame(()=>window.scrollTo({top:Number(sessionStorage.getItem('assembly-reading-scroll')??0),behavior:'instant'})));
 }
 function openNode(id:string) {update({group,mode:'steps',node:id,ref:null,...(group==='create'?{viewLine:null,readAnchor:null,traceFrom:null,traceLine:null,tracePoint:null,traceVia:null,caller:null,reader:null,pane:null}:{}),...(group==='list'||group==='detail'||group==='update'?{point:id,step:group==='list'?'search':id==='missing-branch'?'missing':'detail'}:{})});if(group==='create')requestAnimationFrame(()=>document.querySelector<HTMLElement>('.policy-practice-station')?.scrollIntoView({block:'start',behavior:'instant'}));}
 function changeGroup(next:PolicyGroup) {
  if(next===group)return;
  // listRef belongs to the complete-file List viewer. Keep the legacy excerpt
  // cursor in a separate key so switching groups cannot overwrite that file.
 const savedRefKey=group==='list'||group==='detail'||group==='update'?`${group}LegacyRef`:`${group}Ref`;
 const nextRef=next==='list'?params.get('listLegacyRef')??(excerptById[params.get('listRef')??'']?params.get('listRef'):null):next==='detail'?params.get('detailLegacyRef'):params.get(`${next}Ref`);
  update({[`${group}Node`]:group==='update'||group==='status'?params.get('node')??node.id:node.id,[`${group}Mode`]:mode,[savedRefKey]:params.get('ref'),[`${group}Point`]:params.get('point'),[`${group}Flow`]:group==='update'?params.get('flow')??'checkout':group==='status'?params.get('flow')??'date':flow?.id??null,[`${group}Step`]:legacyStep,group:next,flow:params.get(`${next}Flow`),mode:params.get(`${next}Mode`)??'overview',node:params.get(`${next}Node`),ref:nextRef,point:params.get(`${next}Point`),step:params.get(`${next}Step`)??(next==='list'?'search':next==='detail'?'detail':null)});
 }
 function toCreatedList() {update({createNode:node.id,createMode:mode,createRef:params.get('ref'),group:'list',mode:'steps',step:'search',node:'list-table',point:'list-table',ref:null,searched:'1',keyword:created.policy.policyCode,status:'all',page:'0',selected:created.policy.id,listRequest:JSON.stringify({keyword:created.policy.policyCode,pageNumber:0,pageSize:2,sort:[{key:'policyCode',asc:true}]}),listDraft:null,listStop:'6',listCursor:'list-table',listPriorPoint:null,listRef:null,listLine:null,listPersona:'seller',listSentPersona:'seller'});}
 function openRead(next:'list'|'detail') {const point=next==='list'?'list-table':'detail-api',keyword=created.commandReady?created.policy.policyCode:'S-DEMO';update({createNode:node.id,createMode:mode,createRef:params.get('ref'),group:next,mode:'steps',step:next==='list'?'search':'detail',node:point,point,ref:null,searched:'1',keyword,status:'all',page:'0',selected:created.commandReady?created.policy.id:'POL-LEARN-001',...(next==='list'?{listRequest:JSON.stringify({keyword,pageNumber:0,pageSize:2,sort:[{key:'policyCode',asc:true}]}),listDraft:null,listStop:'6',listCursor:'list-table',listPriorPoint:null,listRef:null,listLine:null,listPersona:'seller',listSentPersona:'seller'}:{...beginDetail(created.commandReady?created.policy.id:'POL-LEARN-001'),detailDraft:null,detailEntry:'direct'})});}
 const index=nodes.indexOf(node);
 const scenario=group==='create'?['Một Quote trở thành hợp đồng như thế nào?','Người bán yêu cầu phát hành Policy từ Quote đã có. Lần từng lời gọi và thử cả trường hợp bị chặn.','quoteId trên path; thông tin khách hàng, ngày và đối tượng lấy từ Quote. Không có JSON body.','Command trả Policy vừa tạo. Khi Flow ghi view, Query có thể tìm thấy cùng ID.']:group==='list'?['Tìm đúng hợp đồng trong phạm vi được xem','Người bán DV-A cần tìm hợp đồng; một hồ sơ DV-B nằm ngoài phạm vi mẫu.','Keyword, status, phân trang; username xác định đơn vị bán.','Một trang PolicyListResponse, có id để mở chi tiết.']:group==='detail'?['Mở hợp đồng bằng ID','Mở một dòng kết quả tìm kiếm và giữ nguyên ID.','Policy ID; có thể thử nhánh ID không tồn tại.','Hợp đồng ghép đối tượng bảo hiểm và thông tin thanh toán.']:[flow!.title,flow!.condition,flow!.trigger,flow!.change];
 return <div className={`policy-workspace policy-redesign ${group==='create'?(mode==='overview'?'policy-create-map-active':'policy-create-practice-active'):group==='list'||group==='detail'||group==='update'||group==='status'?(mode==='overview'?'policy-list-map-active':'policy-list-practice-active'):''}`}>
  <div className="policy-top-links"><Link to="/journey/environment">← Hiểu và chạy dự án</Link><div><button type="button" className="button small secondary" onClick={copyLink}>Sao chép liên kết</button><button type="button" className="button small subtle" onClick={()=>{progress.reset();setParams({group:'create',mode:'overview'});}}><RotateCcw size={14}/>Làm lại bài đọc</button></div></div>
  <header className="policy-heading"><span className="eyebrow">HÀNH TRÌNH 02 · TỪ SOURCE ĐẾN MỘT TÍNH NĂNG</span><h1>Khám phá Policy</h1>{group!=='create'&&group!=='list'&&group!=='detail'&&group!=='update'&&group!=='status'&&<p>Đi theo một yêu cầu thật: tìm cửa vào, lần lời gọi, đọc dữ liệu và nhìn thấy kết quả.</p>}<div className="policy-tags"><span>Đối chiếu agent-system · {group==='list'?listSource.reviewedOn:group==='detail'?detailSource.reviewedOn:group==='update'||group==='status'?'2026-11-11':policySource.reviewedOn}</span><span className="sample">Workshop · dữ liệu mẫu</span></div></header>
  {progress.warning&&<p role="status" className="notice">{progress.warning}</p>}{invalid&&<p role="status" className="notice">Link có tab, bước hoặc source chưa hợp lệ. Chọn lại một bước phù hợp bên dưới.</p>}
  <nav className="policy-main-tabs" role="tablist" aria-label="Nhóm thao tác Policy">{groups.map((g,i)=><button role="tab" type="button" key={g.id} aria-label={`0${i+1} ${g.title}`} id={`policy-tab-${g.id}`} aria-selected={g.id===group} aria-controls="policy-content" onClick={()=>changeGroup(g.id)}><span>0{i+1}</span>{g.title}</button>)}</nav>
  <div className="policy-subtab-row"><nav role="tablist" aria-label="Cách học flow"><button type="button" role="tab" aria-selected={mode==='overview'} aria-controls="policy-content" onClick={()=>changeMode('overview')}>Nhìn toàn cảnh</button><button type="button" role="tab" aria-selected={mode==='steps'} aria-controls="policy-content" onClick={()=>changeMode('steps')}>Làm lại từng bước</button>{(group==='create'||group==='list'||group==='detail'||group==='update'||group==='status')&&<button type="button" role="tab" aria-selected={mode==='assembly'} aria-controls="policy-content" onClick={()=>changeMode('assembly')}>Tư duy lắp ráp</button>}</nav>{group==='create'&&<PolicySessionPicker params={params} update={update}/>}<span>{group==='create'?'POST /policy/create/{quoteId}':group==='list'?'POST /policy/search':group==='detail'?'GET /policy/{id}':'Bản đồ flow đã xác minh'}</span></div>
  {group==='create'&&params.has('sessionReturn')&&mode!=='session'&&<button className="assembly-return" onClick={()=>{const saved=new URLSearchParams(params.get('sessionReturn')!);for(const [key,value] of params)if(key.startsWith('assemblyPractice.'))saved.set(key,value);setParams(saved);}}>← Trở về phiên triển khai</button>}
  {group==='create'&&params.has('assemblyReturn')&&mode==='steps'&&<button className="assembly-return" onClick={returnToAssembly}>← Trở về Tư duy lắp ráp</button>}<section id="policy-content" role="tabpanel" aria-labelledby={`policy-tab-${group}`}>
  {group==='create'&&mode==='session'?<Suspense fallback={<p>Đang mở phiên triển khai…</p>}><ImplementationSession key={selectedSession(params)} params={params} update={update}/></Suspense>:group==='status'?<Suspense fallback={<p>Đang mở Đổi trạng thái…</p>}><StatusLesson mode={mode} params={params} update={update}/></Suspense>:group==='update'?<Suspense fallback={<p>Đang mở flow Cập nhật…</p>}><UpdateLesson mode={mode} params={params} update={update}/></Suspense>:group==='detail'?<PolicyDetailLesson mode={mode} params={params} update={update} progress={progress}/>:group==='list'?<PolicyListLesson mode={mode} params={params} update={update} progress={progress}/>:mode==='assembly'&&group==='create'?<PolicyAssembly params={params} update={update} onRun={(stage,checkpoint)=>{const saved=new URLSearchParams(params);saved.delete('assemblyReturn');sessionStorage.setItem('assembly-reading-scroll',String(scrollY));update({...executionSession(params,node.id).persist(),assemblyReturn:saved.toString(),mode:'steps',node:stage,at:checkpoint,ref:null,viewLine:null,readAnchor:null});}}/>:mode==='overview'&&group==='create'?<PolicyCreationOverview update={update} practiceNode={node} resume={()=>update({group:'create',mode:'steps'})} openPractice={(step,failed)=>failed?update({group:'create',mode:'steps',node:'validate',quote:'QUOTE-LEARN-103',sim:null,selected:null,ref:null,attempt:null,sentQuote:null}):openNode(step)} openRead={openRead}/>:mode==='overview'?<>
   <section className="card policy-overview"><div className="policy-section-heading"><div><span className="eyebrow">{group==='create'?'BÀI 01 · TẠO POLICY TỪ QUOTE':'FLOW CÓ BẰNG CHỨNG TRONG SOURCE'}</span><h2>{scenario[0]}</h2></div><GitBranch size={23}/></div><div className="policy-scenario-grid">{['Tình huống','Đầu vào','Kết quả nhìn thấy'].map((label,i)=><div key={label}><strong>{label}</strong><p>{scenario[i+1]}</p></div>)}</div><p className="policy-caption">Bấm một điểm trên sơ đồ để mở đúng bước và source. Sơ đồ không khẳng định thời gian chạy thực tế.</p><PolicyDiagram nodes={diagramNodes} group={group} onOpen={openNode}/>{flow?.limit&&<p className="policy-limit">{flow.limit}</p>}<div className="actions"><button type="button" className="button primary" onClick={()=>openNode(node.id)}>{index>0?'Tiếp tục bước đang học':'Bắt đầu lần code'} <ArrowRight size={16}/></button><span className="policy-caption">{index>0?`Đang giữ bước ${index+1}: ${node.title}`:'Cây thư mục chỉ thêm những file bạn đã mở.'}</span></div></section>
  </>:group==='create'?<CreatePolicyLesson params={params} node={node.id} update={update} openNode={openNode} toList={toCreatedList} openRead={openRead}/>:<>
   <div className="policy-step-heading"><span className="eyebrow">ĐỌC FLOW ĐÃ XÁC MINH · {index+1}/{nodes.length}</span><h2>{node.title}</h2></div>
   <div className="policy-build-layout"><PolicySourceExplorer sourceId={ref} contextKey={`${group}:${node.id}`} nodes={nodes} activeNode={node.id} onNode={openNode} onSource={id=>update({ref:id})}/><aside className="policy-guide card"><span className="eyebrow">THAO TÁC CỦA BẠN</span><h3>Tôi cần làm gì?</h3><p>{node.action}</p><h3>Vì sao cần file này?</h3><p>{node.why}</p><h3>Nó nhận gì, gọi ai hoặc trả gì?</h3><p>{node.contract}</p><h3>Kiểm tra trước khi đi tiếp</h3><p>{node.check}</p><p className="policy-limit">{flow!.limit??'Bản đồ source; lượt này chưa xây bài mô phỏng sửa Policy.'}</p>{index<nodes.length-1&&<button type="button" className="button primary" onClick={()=>openNode(nodes[index+1].id)}>Lần tới bước tiếp <ArrowRight size={15}/></button>}</aside></div>
  </>}
  </section>
  <div className="policy-claim-question"><strong>Câu hỏi chuyển sang Claim</strong><p>{claimDesignQuestion}</p><small>Cần xác nhận riêng khi thiết kế Quản lý Yêu cầu bồi thường.</small></div>
  <details className="card policy-provenance"><summary>Source, commit và phạm vi kiểm chứng</summary><p>Đọc từ D:\ALPACA\agent-system; trích nguyên văn, giữ số dòng. Chưa chạy Java, API, DB hay xác nhận frontend nghiệp vụ.</p>{group==='status'?<p>Source Đổi trạng thái trong status-source.json: file Java đầy đủ với commit, SHA256 và số dòng gốc. Điểm tính, điểm sử dụng và điểm ghi được đối chiếu riêng trong từng flow.</p>:group==='update'?<p>Source Cập nhật được đối chiếu trong update-source.json: file Java đầy đủ, commit, SHA256 và trạng thái working tree theo từng file. Xem danh mục flow và phạm vi xác minh ngay phía trên.</p>:group==='detail'?<><p>Đối chiếu 11/11/2026 · 23 file Java đầy đủ. Command: <code>{'GET /policy/{id}'}</code>; PolicyRepository → policy_aggregate; InsuranceObjectRepository → insurance_object_aggregate. Thanh toán từ PolicyAggregate.</p><p>FE core-insurance-portal/services/policy.js:15–19 gọi core-query/policy/find-policy-by-id, khác endpoint này. Các vùng UI trong Workshop là mô phỏng theo DTO. Chưa xác minh HTTP lỗi qua CompletableFuture hoặc quyền runtime. SHA256 và commit lưu theo file trong detail-source.json.</p></>:group==='list'?<><p>Đối chiếu {listSource.reviewedOn} · {Object.keys(listSource.sources).length} file Java đầy đủ. Commit, SHA256 và trạng thái working tree ghi tại từng file. Root HEAD <code>{listSource.rootCommit}</code>.</p><p>FE core-insurance-portal đã đọc dùng core-query/policy/get-all-policies, chưa xác nhận consumer của /policy/search. UI Danh sách là mô phỏng hợp đồng backend.</p></>:Object.entries(policySource.repositories).map(([id,repo])=><p key={id}><code>{repo.directory}</code> · {repo.branch} · <code>{repo.commit}</code></p>)}</details>
 </div>;
}
