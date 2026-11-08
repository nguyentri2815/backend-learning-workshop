import { useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowRight, GitBranch, RotateCcw } from 'lucide-react';
import { groups, createNodes, readingNodes, verifiedFlows, claimDesignQuestion } from '../content/policy/flows';
import type { LessonNode, PolicyGroup } from '../content/policy/flows';
import { excerptById, policySource } from '../content/policy/lesson';
import { creationContext } from './create-model';
import type { PolicyLearningProgress } from './policy-model';
import { PolicyReadingLab } from './PolicyReadingLab';
import { PolicySourceExplorer } from './PolicySourceExplorer';
import { CreatePolicyLesson } from './CreatePolicyLesson';
import { PolicyDiagram } from './PolicyDiagram';
import { PolicyCreationOverview } from './PolicyCreationOverview';
import './policy.css';

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
 const mode=requestedMode==='steps'||requestedMode===null&&(params.has('step')||params.has('point')||params.has('ref')||params.has('node'))?'steps':'overview';
 const created=creationContext(params);
 const flow=group==='update'||group==='status' ? verifiedFlows.find(f=>f.group===group&&f.id===params.get('flow'))??verifiedFlows.find(f=>f.id===(group==='update'?'endorsement':'date')) : undefined;
 const nodes=group==='create'?createNodes:group==='list'||group==='detail'?readingNodes(group):flowNodes(flow!);
 const diagramNodes=flow&&primaryPaths[flow.id]?primaryPaths[flow.id].map(id=>nodes.find(n=>n.ref===id)!).filter(Boolean):nodes;
 const requestedNode=params.get('node')??params.get('point');
 const node=nodes.find(n=>n.id===requestedNode)??nodes[0];
 const ref=params.get('ref')??node.ref;
 const invalid=Boolean((explicit&&!groups.some(g=>g.id===explicit))||(requestedMode&&!['steps','overview'].includes(requestedMode))||(requestedNode&&!nodes.some(n=>n.id===requestedNode))||(params.has('ref')&&!excerptById[ref]));
 const position=useRef<Record<string,number>>({});
 function update(changes:Changes,replace=false) {
  setParams(previous=>{const next=new URLSearchParams(previous);const opened=[...new Set([...(previous.get('opened')??'').split(','),ref,previous.get('evidence')??'',changes.ref??'',changes.evidence??''])].filter(id=>excerptById[id]);if(opened.length)next.set('opened',opened.join(','));for(const [key,value] of Object.entries(changes))value===null?next.delete(key):next.set(key,value);return next;},{replace});
 }
 function changeMode(next:string) {position.current[`${group}:${mode}`]=window.scrollY;update({group,mode:next});requestAnimationFrame(()=>window.scrollTo({top:position.current[`${group}:${next}`]??0,behavior:'instant'}));}
 function openNode(id:string) {update({group,mode:'steps',node:id,ref:null,...(group==='create'?{viewLine:null,traceFrom:null,traceLine:null,traceVia:null,caller:null,reader:null,pane:'code'}:{}),...(group==='list'||group==='detail'?{point:id,step:group==='list'?'search':id==='missing-branch'?'missing':'detail'}:{})});if(group==='create')requestAnimationFrame(()=>document.querySelector<HTMLElement>('.policy-practice-station')?.scrollIntoView({block:'start',behavior:'instant'}));}
 function changeGroup(next:PolicyGroup) {if(next===group)return;update({[`${group}Node`]:node.id,[`${group}Mode`]:mode,[`${group}Ref`]:params.get('ref'),[`${group}Point`]:params.get('point'),[`${group}Flow`]:flow?.id??null,[`${group}Step`]:legacyStep,group:next,flow:params.get(`${next}Flow`),mode:params.get(`${next}Mode`)??'overview',node:params.get(`${next}Node`),ref:params.get(`${next}Ref`),point:params.get(`${next}Point`),step:params.get(`${next}Step`)??(next==='list'?'search':next==='detail'?'detail':null)});}
 function toCreatedList() {update({createNode:node.id,createMode:mode,group:'list',mode:'steps',step:'search',node:'list-api',point:'list-api',ref:null,searched:'1',keyword:created.policy.policyCode,status:'all',page:'0',selected:created.policy.id});}
 function openRead(next:'list'|'detail') {const point=next==='list'?'list-api':'detail-api';update({createNode:node.id,createMode:mode,createRef:params.get('ref'),group:next,mode:'steps',step:next==='list'?'search':'detail',node:point,point,ref:null,searched:'1',keyword:created.commandReady?created.policy.policyCode:'S-DEMO',status:'all',page:'0',selected:created.commandReady?created.policy.id:'POL-LEARN-001'});}
 const index=nodes.indexOf(node);
 const scenario=group==='create'?['Một Quote trở thành hợp đồng như thế nào?','Người bán yêu cầu phát hành Policy từ Quote đã có. Lần từng lời gọi và thử cả trường hợp bị chặn.','quoteId trên path; thông tin khách hàng, ngày và đối tượng lấy từ Quote. Không có JSON body.','Command trả Policy vừa tạo. Khi Flow ghi view, Query có thể tìm thấy cùng ID.']:group==='list'?['Tìm đúng hợp đồng trong phạm vi được xem','Người bán DV-A cần tìm hợp đồng; một hồ sơ DV-B nằm ngoài phạm vi mẫu.','Keyword, status, phân trang; username xác định đơn vị bán.','Một trang PolicyListResponse, có id để mở chi tiết.']:group==='detail'?['Mở hợp đồng bằng ID','Mở một dòng kết quả tìm kiếm và giữ nguyên ID.','Policy ID; có thể thử nhánh ID không tồn tại.','Hợp đồng ghép đối tượng bảo hiểm và thông tin thanh toán.']:[flow!.title,flow!.condition,flow!.trigger,flow!.change];
 return <div className={`policy-workspace policy-redesign ${group==='create'?(mode==='overview'?'policy-create-map-active':'policy-create-practice-active'):''}`}>
  <div className="policy-top-links"><Link to="/journey/environment">← Hiểu và chạy dự án</Link><div><button type="button" className="button small secondary" onClick={copyLink}>Sao chép liên kết</button><button type="button" className="button small subtle" onClick={()=>{progress.reset();setParams({group:'create',mode:'overview'});}}><RotateCcw size={14}/>Làm lại bài đọc</button></div></div>
  <header className="policy-heading"><span className="eyebrow">HÀNH TRÌNH 02 · TỪ SOURCE ĐẾN MỘT TÍNH NĂNG</span><h1>Khám phá Policy</h1>{group!=='create'&&<p>Đi theo một yêu cầu thật: tìm cửa vào, lần lời gọi, đọc dữ liệu và nhìn thấy kết quả.</p>}<div className="policy-tags"><span>Đối chiếu agent-system · {policySource.reviewedOn}</span><span className="sample">Workshop · dữ liệu mẫu</span></div></header>
  {progress.warning&&<p role="status" className="notice">{progress.warning}</p>}{invalid&&<p role="status" className="notice">Link có tab, bước hoặc source chưa hợp lệ. Chọn lại một bước phù hợp bên dưới.</p>}
  <nav className="policy-main-tabs" role="tablist" aria-label="Nhóm thao tác Policy">{groups.map((g,i)=><button role="tab" type="button" key={g.id} id={`policy-tab-${g.id}`} aria-selected={g.id===group} aria-controls="policy-content" onClick={()=>changeGroup(g.id)}><span>0{i+1}</span>{g.title}</button>)}</nav>
  <div className="policy-subtab-row"><nav role="tablist" aria-label="Cách học flow"><button type="button" role="tab" aria-selected={mode==='overview'} aria-controls="policy-content" onClick={()=>changeMode('overview')}>Nhìn toàn cảnh</button><button type="button" role="tab" aria-selected={mode==='steps'} aria-controls="policy-content" onClick={()=>changeMode('steps')}>Làm lại từng bước</button></nav><span>{group==='create'?'POST /policy/create/{quoteId}':group==='list'?'POST /policy/search':group==='detail'?'GET /policy/{id}':'Bản đồ flow đã xác minh'}</span></div>
  <section id="policy-content" role="tabpanel" aria-labelledby={`policy-tab-${group}`}>
  {(group==='update'||group==='status')&&<><div className="policy-flow-picker" aria-label="Chọn flow đã xác minh">{verifiedFlows.filter(f=>f.group===group).map(f=><button type="button" key={f.id} aria-pressed={flow?.id===f.id} onClick={()=>update({flow:f.id,node:null,ref:null,point:null})}>{f.initial?'Khởi tạo · ':''}{f.title}</button>)}</div>{group==='status'&&<p className="policy-status-note">Trạng thái hợp đồng: 0 · 100 · -1 · -100. <strong>syncStatus, viaUploaderStatus và paymentStatus là các trục riêng.</strong> “Khởi tạo” gán trạng thái cho Policy mới.</p>}</>}
  {mode==='overview'&&group==='create'?<PolicyCreationOverview update={update} practiceNode={node} resume={()=>update({group:'create',mode:'steps'})} openPractice={(step,failed)=>failed?update({group:'create',mode:'steps',node:'validate',quote:'QUOTE-LEARN-103',sim:null,selected:null,ref:null,attempt:null,sentQuote:null}):openNode(step)} openRead={openRead}/>:mode==='overview'?<>
   <section className="card policy-overview"><div className="policy-section-heading"><div><span className="eyebrow">{group==='create'?'BÀI 01 · TẠO POLICY TỪ QUOTE':'FLOW CÓ BẰNG CHỨNG TRONG SOURCE'}</span><h2>{scenario[0]}</h2></div><GitBranch size={23}/></div><div className="policy-scenario-grid">{['Tình huống','Đầu vào','Kết quả nhìn thấy'].map((label,i)=><div key={label}><strong>{label}</strong><p>{scenario[i+1]}</p></div>)}</div><p className="policy-caption">Bấm một điểm trên sơ đồ để mở đúng bước và source. Sơ đồ không khẳng định thời gian chạy thực tế.</p><PolicyDiagram nodes={diagramNodes} group={group} onOpen={openNode}/>{flow?.limit&&<p className="policy-limit">{flow.limit}</p>}<div className="actions"><button type="button" className="button primary" onClick={()=>openNode(node.id)}>{index>0?'Tiếp tục bước đang học':'Bắt đầu lần code'} <ArrowRight size={16}/></button><span className="policy-caption">{index>0?`Đang giữ bước ${index+1}: ${node.title}`:'Cây thư mục chỉ thêm những file bạn đã mở.'}</span></div></section>
  </>:group==='list'||group==='detail'?<PolicyReadingLab progress={progress}/>:group==='create'?<CreatePolicyLesson params={params} node={node.id} update={update} openNode={openNode} toList={toCreatedList} openRead={openRead}/>:<>
   <div className="policy-step-heading"><span className="eyebrow">ĐỌC FLOW ĐÃ XÁC MINH · {index+1}/{nodes.length}</span><h2>{node.title}</h2></div>
   <div className="policy-build-layout"><PolicySourceExplorer sourceId={ref} contextKey={`${group}:${node.id}`} nodes={nodes} activeNode={node.id} onNode={openNode} onSource={id=>update({ref:id})}/><aside className="policy-guide card"><span className="eyebrow">THAO TÁC CỦA BẠN</span><h3>Tôi cần làm gì?</h3><p>{node.action}</p><h3>Vì sao cần file này?</h3><p>{node.why}</p><h3>Nó nhận gì, gọi ai hoặc trả gì?</h3><p>{node.contract}</p><h3>Kiểm tra trước khi đi tiếp</h3><p>{node.check}</p><p className="policy-limit">{flow!.limit??'Bản đồ source; lượt này chưa xây bài mô phỏng sửa Policy.'}</p>{index<nodes.length-1&&<button type="button" className="button primary" onClick={()=>openNode(nodes[index+1].id)}>Lần tới bước tiếp <ArrowRight size={15}/></button>}</aside></div>
  </>}
  </section>
  <div className="policy-claim-question"><strong>Câu hỏi chuyển sang Claim</strong><p>{claimDesignQuestion}</p><small>Cần xác nhận riêng khi thiết kế Quản lý Yêu cầu bồi thường.</small></div>
  {(group==='update'||group==='status')&&<section className="card policy-audit"><h2>Bằng chứng thao tác → nơi ghi</h2><div className="policy-table-scroll"><table className="policy-result-table"><thead><tr><th>Thao tác</th><th>Tác nhân / điều kiện</th><th>Dữ liệu đổi</th><th>File / method</th></tr></thead><tbody>{verifiedFlows.filter(f=>f.group===group).map(f=><tr key={f.id}><td><strong>{f.title}</strong>{f.initial&&<small>Trạng thái ban đầu</small>}</td><td>{f.trigger}<small>{f.condition}</small></td><td>{f.change}{f.limit&&<small>{f.limit}</small>}</td><td>{f.refs.filter(id=>/write|apply|save|rule|initial/.test(id)).map(id=><button className="text-button" type="button" key={id} onClick={()=>update({flow:f.id,mode:'steps',node:id,ref:id})}>{excerptById[id].symbol} · L{excerptById[id].from}</button>)}</td></tr>)}</tbody></table></div></section>}
  <details className="card policy-provenance"><summary>Source, commit và phạm vi kiểm chứng</summary><p>Đọc từ D:\ALPACA\agent-system; trích nguyên văn, giữ số dòng. Chưa chạy Java, API, DB hay xác nhận frontend nghiệp vụ.</p>{Object.entries(policySource.repositories).map(([id,repo])=><p key={id}><code>{repo.directory}</code> · {repo.branch} · <code>{repo.commit}</code></p>)}</details>
 </div>;
}
