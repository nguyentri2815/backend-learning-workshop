import {lazy,Suspense,useState,useEffect,useRef} from 'react';
import {ArrowLeft,ArrowRight,Check,Clipboard,FileCode2,GitBranch,Play,RotateCcw} from 'lucide-react';
import {SourceTree} from '../JourneyWorkspace';
import {diffRows} from '../workshop/source';
import type {CodeRow} from '../workshop/source';
import * as direct from '../content/policy/implementation-session';
import * as beginner from '../content/policy/beginner-session';
import {policySessionState,sessionReady as directReady,sessionReset} from './policy-session-state';
import {beginnerSessionId,selectedSession,savePolicySession,storedPolicySession} from './policy-session-memory';
import {BeginnerSessionLesson,BeginnerTrialResult} from './BeginnerSessionLesson';
import {beginnerFixture,runBeginnerTrial} from './beginner-fixture';
import {creationContext,quotes,SAMPLE_NOW} from './create-model';
import {groupFilesByCreation,sessionFileChanges,sessionFileMilestones} from './session-file-changes';
import './policy-implementation-session.css';

const CodeBlock=lazy(()=>import('../workshop/CodeBlock').then(m=>({default:m.CodeBlock})));
type Changes=Record<string,string|null>;
const textOf=(rows:CodeRow[])=>rows.map(r=>r.text).join('\n');
const sample=creationContext(new URLSearchParams({quote:quotes[0].id}));
const trialResults:Record<string,string>={
 'entry-valid':`${quotes[0].id} → Controller → exec → Quote tồn tại → lock/runInternal → không có Policy NOT_RUNNING/RUNNING cùng quoteCode. Được phép dựng Command; chưa ghi Policy.`,
 'entry-missing':`${quotes[3].id} → Optional.empty → QUOTE_NOT_EXIST. Dừng tại exec, trước Command và save; không sinh Policy ID.`,
 'entry-blocked':`${quotes[2].id} → Policy RUNNING cùng quoteCode → QUOTE_CAN_NOT_RELEASE_POLICY. Dừng trong runInternal, không map Command hoặc save.`,
 'pending':`Sau save: ${sample.policy.id} có trong policy_aggregate, GET /policy/{id} đọc được bằng ID. Chưa chạy callback SyncView: policy_view_aggregate chưa có dòng, Danh sách chưa thấy Policy.`,
 'success':`Fixture hợp lệ: ${sample.quote.id} → Command policyType=${sample.policy.policyType}, status=${sample.policy.status}, syncStatus=NOT_SYNC → CreatePolicyEvent → Aggregate → save trả ${sample.policy.id} / version mô phỏng 1. Đối tượng POLICY dùng ID này; Quote PUBLISHED(9), policyId được gắn. Giao Event fixture tới Workflow/SyncView → view có một dòng cùng ID. SMS/email chỉ ghi nhận ý định, không gửi.`,
 'read-id':`Đối chiếu cùng ${sample.policy.id}: POST /policy/search → SearchPolicyFunc → policy_view_aggregate → PolicyListResponse.id; GET /policy/{id} → FindPolicyByIdFunc → PolicyRepository + đối tượng + thanh toán. Không dùng quoteId làm Policy ID.`,
};

export function PolicyImplementationSession({params,update}:{params:URLSearchParams;update:(changes:Changes)=>void}) {
 const isBeginner=selectedSession(params)===beginnerSessionId;
 const sessionSources=isBeginner?beginner.beginnerSources:direct.sessionSources,sessionRounds=isBeginner?beginner.beginnerRounds:direct.sessionRounds;
 const sessionFiles=isBeginner?beginner.beginnerFiles:direct.sessionFiles,sessionPhases=isBeginner?beginner.beginnerPhases:direct.sessionPhases;
 const sessionRows=isBeginner?beginner.beginnerRows:direct.sessionRows,sessionFileStatus=isBeginner?beginner.beginnerFileStatus:direct.sessionFileStatus;
 const sessionHistory=isBeginner?beginner.beginnerHistory:direct.sessionHistory;
 const sessionPrompt=isBeginner?beginner.beginnerPrompt:direct.sessionPrompt;
 const filename=(ref:string)=>sessionSources[ref].path.split('/').at(-1)!;
 const getState=(value:URLSearchParams)=>policySessionState(value,sessionRounds);
 const sessionReady=(value:ReturnType<typeof getState>)=>isBeginner?beginner.beginnerReady(value,new URLSearchParams(window.location.search)):directReady(value);
 const restored=useRef(false);
 useEffect(()=>{
  if(!restored.current){
   restored.current=true;
   if(!params.has('sessionDone')&&!params.has('sessionAt')){
    const saved=storedPolicySession(selectedSession(params));
    if(saved.size){update(Object.fromEntries(saved));return;}
   }
  }
  savePolicySession(params);
 },[params,update]);
 const state=getState(params),{done,view}=state,round=sessionRounds[view],review=round.kind==='review';
 const applied=done>=view,through=review?done:Math.min(view,done);
 const changed=sessionFileChanges(sessionFiles,sessionRows,-1,through),total=sessionFileChanges(sessionFiles,sessionRows,-1,done);
 const reused=sessionFiles.filter(file=>sessionRows(file.id,-1).length&&!sessionFileStatus(file.id,done));
 const selectedRef=params.get('sessionFile'),candidate=sessionFiles.find(f=>f.id===selectedRef)?.id??round.patches[0]?.ref??round.evidence.find(e=>sessionFiles.some(f=>f.id===e.ref))?.ref??total[0]?.id??(isBeginner?'quoteController':'controller');
 const ref=isBeginner&&!sessionRows(candidate,through).length&&!(round.patches.some(p=>p.ref===candidate)&&params.get('sessionMode')!=='file')?sessionFiles.find(f=>sessionRows(f.id,through).length)?.id??'quoteController':candidate;
 const requestedScope=params.get('sessionScope');
 const scope=requestedScope&&['round','total','all'].includes(requestedScope)?requestedScope:params.get('sessionFilter')==='changed'||params.get('sessionMode')==='total'?'total':params.get('sessionMode')==='file'?'all':'round';
 const mode=params.get('sessionMode')??(scope==='total'?'total':scope==='all'?'file':'round');
 const history=sessionHistory(ref,through),viewHistory=sessionHistory(ref,through);
 const requestedFocus=sessionRounds.findIndex(r=>r.id===params.get('sessionFocus'));
 const focusIndex=review?(history.find(h=>h.index===requestedFocus)?.index??view):view;
 const focus=sessionRounds[focusIndex],canAct=sessionReady(state),current=Math.min(done+1,sessionRounds.length-1);
 const roundChanges=review&&focusIndex===view?[]:sessionFileChanges(sessionFiles,sessionRows,focusIndex-1,focusIndex);
 const appliedRoundChanges=done>=focusIndex?roundChanges:[],planned=!review&&!applied?roundChanges:[];
 const treeThrough=scope==='round'&&review&&focusIndex!==view?focusIndex:through;
 const files=scope==='round'?appliedRoundChanges:scope==='total'?changed:sessionFiles.filter(f=>sessionRows(f.id,through).length);
 const statuses=Object.fromEntries((scope==='round'?appliedRoundChanges:changed).map(f=>[f.id,f.status]));
 const fileMilestones=Object.fromEntries(sessionFiles.map(file=>[file.id,sessionFileMilestones(file.id,sessionRows,sessionHistory,treeThrough)]));
 const labelMilestones=Object.fromEntries(files.map(file=>{const events=fileMilestones[file.id];return [file.id,scope==='round'?events.find(e=>e.index===focusIndex):events.find(e=>e.status==='A')??events.at(-1)];}));
 const fileLabels=Object.fromEntries((scope==='round'?appliedRoundChanges:changed).map(f=>{
  const milestone=labelMilestones[f.id];
  return [f.id,isBeginner&&milestone?`${milestone.status==='A'?'Tạo':'Sửa'} ở lượt ${milestone.index+1}${milestone.index===view?' · Lượt này':''}`:scope==='round'?(f.status==='A'?'Thêm ở lượt này':'Sửa ở lượt này'):(f.status==='A'?'Tạo mới trong phiên':'File có sẵn được sửa')];
 }));
 const creationGroups=groupFilesByCreation(files,fileMilestones);
 const existingModified=files.filter(file=>fileMilestones[file.id].length&&!fileMilestones[file.id].some(m=>m.status==='A'));
 const byCreation=isBeginner&&scope==='total'&&params.get('sessionFileOrder')==='created';
 const before=sessionRows(ref,mode==='total'?-1:Math.min(focusIndex-1,through));
 const after=sessionRows(ref,mode==='total'?through:focus.kind==='patch'&&focusIndex<=done+1?focusIndex:through);
 const referenceLabel=!roundChanges.some(f=>f.id===ref)?(changed.some(f=>f.id===ref)?'Thay đổi ở lượt trước':'File đối chiếu'):null;
 const patches=focus.patches.filter(p=>p.ref===ref);
 const evidence=focus.evidence.find(e=>e.ref===ref)??round.evidence.find(e=>e.ref===ref);
 const from=patches[0]?.from??evidence?.from??sessionSources[ref].line;
 const to=patches[0]?.to??evidence?.to??from+12;
 const focused=(rows:CodeRow[])=>rows.filter(r=>(r.line??0)>=from-2&&(r.line??0)<=Math.min(to+2,from+55));
 const changes=diffRows(sessionSources[ref].path,textOf(before),textOf(after),false);
 const [copied,setCopied]=useState(false),[feedback,setFeedback]=useState(''),[policyId,setPolicyId]=useState('');
 function select(id:string) {const latest=getState(new URLSearchParams(window.location.search));update({sessionFile:id,sessionFocus:null,...(round.kind==='survey'?{sessionReads:[...new Set([...latest.reads,`survey:${id}`])].join(',')}: {})});setFeedback('');}
 function navigate(index:number) {update({sessionAt:sessionRounds[index].id,sessionFile:null,sessionFocus:null,sessionSource:null,sessionSourceFrom:null,sessionSourceTo:null});setFeedback('');}
 function openFileMilestone(id:string){
  const milestone=labelMilestones[id];if(!milestone)return;
  update({sessionAt:milestone.id,sessionFile:id,sessionScope:'round',sessionMode:'round',sessionFocus:null,sessionSource:null,sessionSourceFrom:null,sessionSourceTo:null});setFeedback('');
 }
 function changeScope(next:string){
  const available=next==='round'?[...appliedRoundChanges,...planned]:next==='total'?changed:sessionFiles.filter(f=>sessionRows(f.id,through).length);
  update({sessionScope:next,sessionMode:next==='round'?'round':next==='total'?'total':'file',sessionFile:available.some(f=>f.id===ref)?ref:available[0]?.id??ref,sessionFocus:null,sessionFilter:null});
 }
 function complete() {
  const latest=getState(new URLSearchParams(window.location.search));
  if(!sessionReady(latest))return;
  update({sessionDone:String(latest.view),sessionAt:sessionRounds[latest.view].id});setFeedback('');
 }
 function inspect(evidenceRef:string,evidenceFrom?:number,evidenceTo?:number) {
  const latest=getState(new URLSearchParams(window.location.search));
  update({...isBeginner?{sessionSource:evidenceRef,sessionSourceFrom:evidenceFrom?String(evidenceFrom):null,sessionSourceTo:evidenceTo?String(evidenceTo):null}:{sessionFile:evidenceRef,sessionMode:'file'},sessionReads:[...new Set([...latest.reads,`${round.id}:${evidenceRef}`,...(round.kind==='survey'?[`survey:${evidenceRef}`]:[])])].join(',')});
 }
 function inspectPatch(patchRef:string) {
  const latest=getState(new URLSearchParams(window.location.search));
  update({sessionFile:patchRef,sessionMode:'round',sessionScope:'round',sessionFocus:null,sessionPatches:[...new Set([...latest.patches,`${round.id}:${patchRef}`])].join(',')});
 }
 function trial(id:string) {
  const latest=getState(new URLSearchParams(window.location.search));
  if(latest.done<view-1)return;
  if(isBeginner){
   if(!('requiredTrials' in round)||!Array.isArray(round.requiredTrials)||!round.requiredTrials.includes(id))return;
   if(id==='read-id'&&(!latest.trials.includes('success')||policyId.trim()!==beginnerFixture.policyId)){setFeedback('ID chưa khớp. Nhập Policy ID trả về; Quote ID không phải Policy ID.');return;}
   const snapshot=Math.min(view,latest.done);
   if(!runBeginnerTrial(id,snapshot))return;
   update({sessionTrials:[...new Set([...latest.trials,id])].join(','),['sessionTrialAt.'+id]:String(snapshot)});setFeedback('');return;
  }
  if(id==='read-id'&&policyId.trim()!==sample.policy.id){setFeedback('ID chưa khớp. Dùng Policy ID trả về từ save; quoteId không phải Policy ID.');return;}
  if(id==='read-id'&&!latest.trials.includes('success'))return;
  update({sessionTrials:[...new Set([...latest.trials,id])].join(',')});setFeedback('');
 }
 async function copy() {try{await navigator.clipboard.writeText(sessionPrompt);setCopied(true);}catch{setFeedback('Hãy chọn và sao chép prompt trong khung bên dưới.');}}
 function openLesson() {
  const saved=new URLSearchParams(window.location.search);saved.delete('sessionReturn');
  const step=round.lesson;
  update({sessionReturn:saved.toString(),mode:'assembly',assemblyStep:step,[`assemblyView.${step}`]:'pattern',[`assemblyDiagram.${step}`]:'1',[`assemblyDiagramMode.${step}`]:'practice'});
 }
 function reset() {const clear:Changes={};for(const name of params.keys())if(name.startsWith('sessionDecision.')||name.startsWith('sessionHint.')||name.startsWith('sessionSource')||name.startsWith('sessionTrialAt.'))clear[name]=null;update({...sessionReset,...clear,sessionScope:null,sessionFileOrder:null,mode:'session'});setPolicyId('');setFeedback('');setCopied(false);}
 const trials=state.trials.filter(id=>isBeginner?review&&Number(params.get('sessionTrialAt.'+id)??done)<=done&&Boolean(runBeginnerTrial(id,Number(params.get('sessionTrialAt.'+id)??done))):review||(round.kind==='trial'?id.startsWith('entry-'):round.kind==='verify'?!id.startsWith('entry-'):false));
 return <section className={`policy-session${isBeginner?' beginner-session':''}`} aria-label="Mô phỏng cả phiên triển khai" data-session={isBeginner?'quote-beginner':'direct-quote'} data-round={round.id} data-applied={done}>
  <header className="session-titlebar"><div className="session-title"><GitBranch size={20}/><div><small>PHIÊN VIBE CODING BACKEND · WORKSHOP</small><h2>{isBeginner?beginner.beginnerTitle:'Phát hành trực tiếp từ Quote'}</h2></div></div><span className="session-sim-label">Kịch bản dựng lại · source đã đối chiếu</span><button onClick={reset} title="Xóa riêng tiến độ phiên mô phỏng này"><RotateCcw size={14}/>Làm lại phiên</button></header>
  {isBeginner?<div className="session-provenance">Kịch bản học giả định · đối chiếu source ngày 13/11/2026. Mốc đầu chỉ có Quote và hạ tầng dùng chung; chưa có module, bean, hàng đợi hoặc API đọc riêng của Policy. Mỗi snapshot là trích đoạn cấu trúc có chủ ý, lược imports, field mở rộng và helper; không phải workspace Java biên dịch được. Các lượt thử chạy bằng fixture trong Workshop.
   <details className="session-baseline"><summary>Source thật và phần dựng cho bài</summary><p>Lấy mẫu từ source: đường tạo/đọc Quote; URL tạo Policy; guard; mapping; Command/Event; process/apply; bean AggregateExtRepository và điểm store/JDBC. Mỗi bằng chứng mở được source đầy đủ, kèm đường dẫn và dòng.</p><p>Dựng cho bài: mốc Quote-only và thứ tự các lượt; Controller/Func/model rút gọn; dữ liệu Nguyễn An, Quote/Policy ID, mã, ngày và kho nhớ fixture. Quote gốc có cờ/liên kết Policy và nhiều luồng khác; bài chủ động bỏ chúng ở mốc đầu cùng đăng ký bean/hàng đợi Policy. Không có thay đổi vào source đối chiếu.</p><p>Kiểm tra được: quan hệ gọi, dữ liệu, guard, Command → Event → Aggregate → bản ghi fixture. Chưa kiểm tra Java/HTTP, transport, tính toán payment đầy đủ, đối tượng bảo hiểm, PublishedQuote, email/SMS. Chặng tiếp nối cần triển khai rõ API đọc/model, Workflow/SyncView, repository/view và cấu hình liên quan.</p></details>
  </div>:<div className="session-provenance">Mốc giả lập: chưa có CreatePolicyFunc; Controller / Aggregate / Workflow có sẵn nhưng thiếu các method nêu trong phiên. Command, Event, SyncView, Danh sách và Chi tiết đã có. Thứ tự bên dưới là một cách triển khai được đề xuất, không phải lịch sử commit. Đối chiếu source ngày 12/11/2026.
   <details className="session-baseline"><summary>Mốc khởi đầu theo file / method</summary><table><thead><tr><th>File</th><th>Có sẵn tại mốc đầu</th><th>Bổ sung trong phiên</th></tr></thead><tbody><tr><td>PolicyController.java · Command · M</td><td>Class, imports, các route khác; GET /policy/{'{id}'} dùng lại.</td><td>createPolicy(String quoteId) · L43–46</td></tr><tr><td>CreatePolicyFunc.java · A</td><td>Chưa có cả file.</td><td>Dependency, exec/runInternal, helper; map, payment, save và sau ghi · L1–305</td></tr><tr><td>PolicyAggregate.java · M</td><td>Class, field, các process/apply khác.</td><td>process(CreatePolicyCommand), apply(CreatePolicyEvent) · L328–340</td></tr><tr><td>PolicyWorkflow.java · M</td><td>Subscriber và các handler khác.</td><td>createPolicy(DispatchedEvent&lt;CreatePolicyEvent&gt;) · L23–32</td></tr><tr><td>Phần dùng lại</td><td colSpan={2}>CreatePolicyCommand / CreatePolicyEvent; QuoteRepository; PlatformConfig / AggregateExtRepository / AggregateRepository; PolicySyncViewFunc.exec; Query PolicyController.search / SearchPolicyFunc.exec; FindPolicyByIdFunc.exec và GET /policy/{'{id}'}. Baseline là workspace dựng lại có chủ ý, chưa lắp xong các đầu xử lý CreatePolicy dùng chung.</td></tr></tbody></table></details>
  </div>}
  <nav className="session-phases" aria-label="Các mốc của phiên">{sessionPhases.map((phase,index)=><button key={phase} aria-current={round.phase===index?'step':undefined} onClick={()=>navigate(sessionRounds.findIndex(r=>r.phase===index))}><span>{index+1}</span>{phase}</button>)}</nav>
  <div className="session-toolbar"><button aria-label="Mốc trước" disabled={view===0} onClick={()=>navigate(view-1)}><ArrowLeft size={14}/>Trước</button><div><strong>Đang xem {view+1}/{sessionRounds.length} · {round.title}</strong>
   {!review&&<div className="session-impact" data-testid="session-impact"><b>{applied?'Đã áp dụng':'Dự kiến'}</b>{roundChanges.length?(['A','M'] as const).map(status=>{const entries=roundChanges.filter(f=>f.status===status);return entries.length>0&&<span key={status} data-status={status}>{status==='A'?'Thêm':'Sửa'} {entries.length} file · {entries.map(f=>filename(f.id)).join(', ')}</span>;}):<span>{round.kind==='survey'?'Chỉ khảo sát':'Không sửa code'} · 0 file thay đổi</span>}</div>}
   <small data-testid="session-progress">Đã hoàn thành {done+1}/{sessionRounds.length-1} lượt · Đã áp dụng {total.length} file ({total.filter(f=>f.status==='A').length} A / {total.filter(f=>f.status==='M').length} M)</small></div><button aria-label="Mốc sau" disabled={view===sessionRounds.length-1||view>done} onClick={()=>navigate(view+1)}>Sau<ArrowRight size={14}/></button><button onClick={()=>navigate(sessionRounds.length-1)}>Vào Review</button></div>
  {(view!==current||view<done)&&<div className="session-history-notice" role="status">{view<=done?'Bạn đang xem lại cây và code tại mốc này. Tiến độ đã áp dụng được giữ nguyên.':'Mốc này chưa được triển khai. Cây và code giữ trạng thái đã áp dụng; diff hiển thị đề xuất.'}<button onClick={()=>navigate(current)}>Trở về mốc hiện tại</button></div>}
  {isBeginner&&!review&&<BeginnerSessionLesson round={beginner.beginnerRounds[view]} state={state} params={params} update={update} inspect={inspect} inspectPatch={inspectPatch} complete={complete} canAct={canAct} trial={trial} policyId={policyId} setPolicyId={setPolicyId} copied={copied} copy={copy} feedback={feedback} next={()=>navigate(view+1)}/>}
  <div className="session-ide">
   <aside className="session-tree" aria-label="Workspace của phiên" data-scope={scope}><header><strong>EXPLORER</strong><span data-testid="session-explorer-count">{scope==='round'?`Lượt này · ${appliedRoundChanges.length} file đã áp dụng`:scope==='total'?`Từ đầu phiên · ${changed.length} file duy nhất`:`Tất cả file · ${files.length} file trong snapshot`}</span><small>Mốc {Math.max(0,treeThrough+1)} · {treeThrough>=0?sessionRounds[treeThrough].title:'Đầu phiên'}</small></header>
    <div className="session-file-filter" role="group" aria-label="Phạm vi Explorer">{[{id:'round',label:'Lượt này'},{id:'total',label:'Từ đầu phiên'},{id:'all',label:'Tất cả file'}].map(item=><button key={item.id} aria-pressed={scope===item.id} onClick={()=>changeScope(item.id)}>{item.label}</button>)}</div>
    {isBeginner&&scope==='total'&&<div className="session-file-order" role="group" aria-label="Cách sắp xếp file"><button aria-pressed={!byCreation} onClick={()=>update({sessionFileOrder:null})}>Theo thư mục</button><button aria-pressed={byCreation} onClick={()=>update({sessionFileOrder:'created'})}>Theo lượt tạo</button></div>}
    {scope==='round'&&planned.length>0&&<section className="session-planned" data-testid="session-planned"><strong>Dự kiến · {planned.length} file</strong><small>Chưa nằm trong snapshot hoặc số file đã áp dụng.</small>{planned.map(file=><button key={file.id} disabled={view>done+1||isBeginner&&!applied&&!params.has('sessionDecision.'+round.id)} onClick={()=>inspectPatch(file.id)}><span className="session-file-badge" data-status={file.status}>{file.status}</span><span>{filename(file.id)}<small>{file.status==='A'?'Thêm':'Sửa'} ở lượt này</small></span></button>)}</section>}
    {files.length?(byCreation?<div className="session-creation-timeline" aria-label="File theo lượt tạo">{creationGroups.map(group=><section key={group.milestone.index} data-created-round={group.milestone.index+1}><h4>Lượt {group.milestone.index+1} · {group.milestone.title}</h4>{group.files.map(file=><div key={file.id} className="session-timeline-file"><button aria-pressed={file.id===ref} onClick={()=>select(file.id)}><FileCode2 size={13}/>{filename(file.id)}<span className="session-file-badge" data-status="A">A</span></button><button className="session-file-milestone" onClick={()=>openFileMilestone(file.id)} aria-label={`${fileLabels[file.id]} · ${filename(file.id)}`}>{fileLabels[file.id]}</button></div>)}</section>)}{existingModified.length>0&&<section aria-label="File có sẵn được sửa"><h4>File có sẵn từ đầu phiên · đã sửa</h4>{existingModified.map(file=><div key={file.id} className="session-timeline-file"><button aria-pressed={file.id===ref} onClick={()=>select(file.id)}><FileCode2 size={13}/>{filename(file.id)}<span className="session-file-badge" data-status="M">M</span></button><button className="session-file-milestone" onClick={()=>openFileMilestone(file.id)} aria-label={`${fileLabels[file.id]} · ${filename(file.id)}`}>{fileLabels[file.id]}</button></div>)}</section>}</div>:<SourceTree compactFolders files={files} selected={ref} onSelect={select} label="Cây workspace phiên triển khai" memoryKey={isBeginner?'policy-session-beginner':'policy-session'} fileStatuses={statuses} fileLabels={fileLabels} onFileLabelSelect={isBeginner?openFileMilestone:undefined} highlightedFiles={scope==='all'?appliedRoundChanges.map(f=>f.id):undefined}/>):<div className="session-empty"><p>{scope==='round'?'Chưa có file thay đổi được áp dụng ở lượt này.':'Chưa có file thay đổi tại mốc này.'}</p>{scope==='round'&&<button onClick={()=>changeScope('total')}>Xem file từ đầu phiên</button>}</div>}
    <footer><span className="session-file-badge" data-status="A">A</span> File mới <span className="session-file-badge" data-status="M">M</span> File có sẵn được sửa</footer>
   </aside>
   <main className="session-editor">
    {review&&<section className="session-review" aria-label="Review cả phiên"><div className="session-review-heading"><div><small>REVIEW CẢ PHIÊN</small><h3>{done>=sessionRounds.length-2?'Hoàn tất phiên triển khai':'Phiên đang thực hiện'}</h3></div><span>{total.length} file duy nhất</span></div><div className="session-review-counts"><span><b>{total.filter(f=>sessionFileStatus(f.id,done)==='A').length}</b> tạo mới</span><span><b>{total.filter(f=>sessionFileStatus(f.id,done)==='M').length}</b> sửa</span><span><b>{state.trials.length}</b> tình huống</span></div>
     {!total.length&&<p className="session-empty">Chưa áp dụng thay đổi. Lượt khảo sát và chạy thử không tạo file thay đổi.</p>}
     {isBeginner&&<p className="beginner-review-help">Bấm tên file để về lượt đầu tiên file xuất hiện. “Diff và lịch sử” mở thay đổi từ mốc Quote-only.</p>}
     <div className="session-review-files">{total.map(file=>isBeginner?<div className="beginner-review-file" key={file.id}><button onClick={()=>{const first=sessionHistory(file.id,done)[0];update({sessionAt:first.round.id,sessionFile:file.id,sessionMode:'round',sessionScope:'round',sessionFocus:null});}}><span className="session-file-badge" data-status={sessionFileStatus(file.id,done)}>{sessionFileStatus(file.id,done)}</span><strong>{filename(file.id)}</strong><small>Lượt đầu {sessionHistory(file.id,done)[0].index+1}</small></button><button aria-label={`Diff và lịch sử · ${filename(file.id)}`} aria-pressed={file.id===ref} onClick={()=>{select(file.id);update({sessionMode:'total',sessionScope:'total'});}}>Diff và lịch sử · {sessionHistory(file.id,done).length} lượt</button></div>:<button key={file.id} aria-pressed={file.id===ref} onClick={()=>{select(file.id);update({sessionMode:'total',sessionScope:'total'});}}><span className="session-file-badge" data-status={sessionFileStatus(file.id,done)}>{sessionFileStatus(file.id,done)}</span><FileCode2 size={14}/><strong>{filename(file.id)}</strong><small>{sessionHistory(file.id,done).length} lượt thay đổi</small></button>)}</div>
     <details><summary>Phần dùng lại · {reused.length} file</summary><p>{isBeginner?'Quote và hạ tầng chung được giữ lại; chỉ PlatformConfig có thêm bean Policy. Không có API đọc, Workflow hoặc view Policy dùng ngầm.':'Giữ nguyên hợp đồng Command/Event, repository và cơ chế ghi; SyncView, endpoint Danh sách/Chi tiết và Func đọc đã có.'}</p>{reused.map(file=><button className="session-reuse-file" key={file.id} onClick={()=>{select(file.id);update({sessionMode:'file',sessionScope:'all'});}}>{filename(file.id)}<small>{file.path.split('/').slice(2,3)}</small></button>)}</details>
     {isBeginner&&<p className="beginner-review-limit">{beginner.beginnerRounds.at(-1)!.sample}<br/>{beginner.beginnerRounds.at(-1)!.check}</p>}
    </section>}
    <header className="session-editor-file"><FileCode2 size={16}/><strong>{filename(ref)}</strong>{(scope==='round'?appliedRoundChanges.find(f=>f.id===ref)?.status:sessionFileStatus(ref,through))&&<span className="session-file-badge" data-status={scope==='round'?appliedRoundChanges.find(f=>f.id===ref)?.status:sessionFileStatus(ref,through)}>{scope==='round'?appliedRoundChanges.find(f=>f.id===ref)?.status:sessionFileStatus(ref,through)}</span>}<span>{referenceLabel??(applied?'Thay đổi ở lượt này':'Dự kiến · chưa áp dụng')} · {viewHistory.length} lượt tại mốc này{!sessionRows(ref,through).length?' · File chưa có tại mốc này':''}</span></header><p className="session-file-path">{sessionSources[ref].path}</p>
    <nav className="session-code-tabs" role="tablist" aria-label="Chế độ xem code phiên">{[{id:'round',label:'Thay đổi lượt này'},{id:'total',label:'Từ đầu phiên'},{id:'file',label:'File tại mốc này'}].map(tab=><button role="tab" key={tab.id} aria-selected={mode===tab.id} onClick={()=>changeScope(tab.id==='file'?'all':tab.id)}>{tab.label}</button>)}</nav>
    <div className="session-code" data-testid="session-code" data-file={ref} data-snapshot={through}>
     <Suspense fallback={<p>Đang mở code…</p>}>{isBeginner&&!review&&!applied&&!params.has('sessionDecision.'+round.id)?<p className="session-empty">Đọc tình huống và dữ liệu mẫu, sau đó chọn một phương án trước khi đọc Java.</p>:mode==='file'?sessionRows(ref,through).length?<><p className="session-code-label">Code tại mốc {Math.max(0,through+1)} · {isBeginner?'số dòng tại snapshot bài học; imports, field mở rộng và helper được lược':'số dòng neo theo source gốc · các khối chưa lắp được lược bỏ'}</p><CodeBlock rows={sessionRows(ref,through)} path={sessionSources[ref].path} range={{name:filename(ref),qualified:ref,start:from,end:to}} memoryKey={`${isBeginner?'beginner':'session'}:${through}:${ref}`} targetKey={`${view}:${ref}:${from}`} preferTarget/></>:<p className="session-empty">File này chưa xuất hiện tại mốc đang xem. Mở “Thay đổi lượt này” để xem patch đề xuất trước khi áp dụng.</p>:<>
      <p className="session-code-label">{mode==='total'?`Baseline → mốc ${Math.max(0,through+1)}`:`Lượt ${focusIndex+1} · ${focus.title}`} · {mode==='round'&&focus.kind==='patch'&&focusIndex>done?'Đề xuất chưa áp dụng':'Đã áp dụng tại mốc đang xem'}</p>
      {changes.length?<><div className="session-diff-pair"><section><h4>Trước</h4>{before.length?<CodeBlock rows={focused(before)} path={sessionSources[ref].path} memoryKey={`${isBeginner?'beginner':'session'}-before:${focusIndex}:${ref}:${mode}`}/>:<p className="session-empty">File chưa tồn tại.</p>}</section><section><h4>Sau{mode==='round'&&focusIndex>done?' · đề xuất':''}</h4><CodeBlock rows={focused(after)} path={sessionSources[ref].path} memoryKey={`${isBeginner?'beginner':'session'}-after:${focusIndex}:${ref}:${mode}`}/></section></div><details className="session-unified" open><summary>Diff đầy đủ · {mode==='total'?'từ đầu phiên':'lượt đang chọn'}</summary><CodeBlock rows={changes} path={sessionSources[ref].path} diff memoryKey={`${isBeginner?'beginner':'session'}-diff:${through}:${focusIndex}:${ref}:${mode}`}/></details></>:<p className="session-empty">Không có thay đổi ở file này trong phạm vi đang xem. Lượt đọc source hoặc chạy thử chỉ tạo bản ghi hoạt động.</p>}
     </>}</Suspense>
    </div>
   </main>
   <aside className="session-agent" aria-label="Yêu cầu và đề xuất của agent">
    <header><span className="session-agent-dot"/><strong>{review?'SESSION REVIEW':'AGENT · ĐỀ XUẤT'}</strong><span>{review&&done>=sessionRounds.length-2?'Hoàn tất':applied?'Đã thực hiện':'Đang chờ'}</span></header>
    {!review&&!isBeginner?<>
     <section><small>YÊU CẦU ĐANG XỬ LÝ</small><h3>{round.title}</h3><p>{round.request}</p></section>
     {round.kind==='brief'&&<section className="session-prompt"><button onClick={copy}><Clipboard size={14}/>{copied?'Đã sao chép':'Sao chép prompt'}</button><pre tabIndex={0}>{sessionPrompt}</pre></section>}
     <section><small>BẰNG CHỨNG AGENT ĐỌC ĐƯỢC</small>{round.evidence.map(e=><button className="session-evidence" key={`${e.ref}:${e.from}`} onClick={()=>inspect(e.ref)}><span><FileCode2 size={13}/>{filename(e.ref)} · L{e.from}–{e.to}{state.reads.includes(`${round.id}:${e.ref}`)&&<Check size={13}/>}</span><small>{e.finding}</small></button>)}<p className="session-evidence-note">Mốc và đoạn code lấy từ snapshot đã đối chiếu source. File chưa được tạo chỉ xuất hiện trong patch đề xuất.</p></section>
     <section><small>ĐỀ XUẤT VÀ LÝ DO</small>{round.kind!=='survey'||canAct||applied?<><p>{round.proposal}</p><p className="session-reason">{round.reason}</p></>:<p>Mở các file khảo sát để agent đối chiếu mẫu và hiện đề xuất.</p>}{round.kind==='survey'&&!applied&&<p className="session-read-count">Đã mở {round.evidence.filter(e=>state.reads.includes(`survey:${e.ref}`)).length}/{round.evidence.length} file khảo sát. Mở từng file ở trên trước khi chốt đề xuất.</p>}</section>
     {round.patches.length>0&&<section><small>THAO TÁC CỦA BẠN · XEM PATCH TỪNG FILE</small>{[...new Set(round.patches.map(p=>p.ref))].map(patchRef=><button className="session-patch-button" key={patchRef} onClick={()=>inspectPatch(patchRef)}><span className="session-file-badge" data-status={roundChanges.find(f=>f.id===patchRef)?.status}>{roundChanges.find(f=>f.id===patchRef)?.status}</span>Xem patch · {filename(patchRef)}{state.patches.includes(`${round.id}:${patchRef}`)&&<Check size={14}/>}</button>)}</section>}
     {round.kind==='trial'&&<section className="session-trials"><small>CHẠY THỬ MÔ PHỎNG · CHƯA GỌI BACKEND</small><button disabled={done<view-1} onClick={()=>trial('entry-valid')}><Play size={13}/>Thử Quote hợp lệ</button><button disabled={done<view-1} onClick={()=>trial('entry-missing')}>Thử Quote không tồn tại</button><button disabled={done<view-1} onClick={()=>trial('entry-blocked')}>Thử Quote đã có Policy</button></section>}
     {round.kind==='verify'&&<section className="session-trials"><small>CHẠY THỬ MÔ PHỎNG · FIXTURE {SAMPLE_NOW.slice(0,10)}</small><button disabled={done<view-1} onClick={()=>trial('pending')}>Thử view chưa đồng bộ</button><button disabled={done<view-1} onClick={()=>trial('success')}><Play size={13}/>Chạy tình huống thành công</button><label>Policy ID để đối chiếu<input value={policyId} onChange={event=>setPolicyId(event.target.value)} placeholder={sample.policy.id}/></label><p>Policy ID trả về: <code>{state.trials.includes('success')?sample.policy.id:'Chưa chạy tình huống thành công'}</code></p><button disabled={done<view-1||!state.trials.includes('success')} onClick={()=>trial('read-id')}>Đối chiếu Danh sách và Chi tiết</button>{state.trials.includes('read-id')&&<table className="session-read-result"><caption>Đọc dùng lại · fixture</caption><tbody><tr><th>Danh sách / view</th><td>{sample.policy.id}</td></tr><tr><th>Chi tiết / Aggregate</th><td>{sample.policy.id}</td></tr><tr><th>Mã / khách hàng</th><td>{sample.policy.policyCode} · {sample.policy.customerName}</td></tr></tbody></table>}</section>}
     {feedback&&<p role="status" className="session-feedback">{feedback}</p>}
     <section className="session-apply"><button className="button primary" onClick={complete} disabled={!canAct}>{applied?<Check size={15}/>:<ArrowRight size={15}/>} {applied?'Đã thực hiện lượt này':round.kind==='survey'?'Xác nhận đã khảo sát':round.action}</button>{!applied&&!canAct&&<small>{view>done+1?'Hoàn thành các lượt trước tại mốc hiện tại.':round.kind==='patch'?'Xem patch của từng file trước khi áp dụng.':round.kind==='survey'?'Mở đủ các file khảo sát.':'Chạy đủ các tình huống bắt buộc trước khi xác nhận.'}</small>}{applied&&<div className="session-result"><small>KẾT QUẢ</small><p>{round.result}</p>{view<sessionRounds.length-1&&<button onClick={()=>navigate(view+1)}>Tiếp tục lượt sau<ArrowRight size={13}/></button>}</div>}</section>
    </>:<>
     <section><small>LỊCH SỬ CỦA FILE ĐANG CHỌN</small><h3>{filename(ref)}</h3><p>{isBeginner?`${history.filter(h=>!sessionRows(ref,h.index-1).length).length} lượt tạo · ${history.filter(h=>sessionRows(ref,h.index-1).length).length} lượt sửa`:`${history.length} lượt sửa`} · đếm một lần trong tổng số file.</p>{!history.length&&<p>File dùng lại, không có patch trong phiên.</p>}{history.map(({round:entry,index})=><article className="session-file-history" key={entry.id}>{isBeginner&&<small className="session-history-kind">{sessionRows(ref,index-1).length?"Sửa file":"Tạo file"} · Lượt {index+1}</small>}<button aria-pressed={focusIndex===index} onClick={()=>update(isBeginner?{sessionAt:entry.id,sessionFile:ref,sessionMode:'round',sessionScope:'round',sessionFocus:null}:{sessionFocus:entry.id,sessionMode:'round',sessionScope:'round'})}>Lượt {index+1} · {entry.title}</button><p>{entry.proposal}</p><details><summary>Lý do và căn cứ source</summary><p>{entry.reason}</p>{entry.evidence.map(e=><p key={`${e.ref}:${e.from}`}><code>{filename(e.ref)}:{e.from}–{e.to}</code> · {e.finding}</p>)}</details><small>Đã kiểm tra: {state.trials.length?(isBeginner?beginner.beginnerFileTrials(ref,state.trials):state.trials.filter(t=>ref==='workflow'?!t.startsWith('entry-'):true)).map(t=>({'entry-valid':'Quote hợp lệ','entry-missing':'Thiếu Quote','entry-blocked':'Đã có Policy',success:'Thành công',pending:'View chưa đồng bộ','read-id':'ID hai đầu'}[t]??t)).join(' · '):'Chưa chạy fixture'}. Chi tiết kết quả nằm trong nhật ký bên dưới.</small></article>)}</section>
     <section><small>CÁC QUYẾT ĐỊNH CÓ CĂN CỨ</small>{sessionRounds.filter((r,i)=>i<=through&&r.kind==='patch').map(r=><details key={r.id}><summary>{r.title}</summary><p>{r.reason}</p>{r.evidence.map(e=><p key={`${e.ref}:${e.from}`}><code>{filename(e.ref)}:{e.from}–{e.to}</code> · {e.finding}</p>)}</details>)}</section>
     <section><small>NHẬT KÝ HOẠT ĐỘNG · KHÔNG TĂNG SỐ FILE</small><ol>{sessionRounds.filter((r,i)=>i<=through&&r.kind!=='patch'&&r.kind!=='review').map(r=><li key={r.id}><strong>{r.title}</strong><p>{r.result}</p></li>)}</ol></section>
    </>}
    {trials.length>0&&<section className="session-test-results"><small>KẾT QUẢ CHẠY THỬ MÔ PHỎNG</small>{trials.map(id=>isBeginner?<BeginnerTrialResult key={id} id={id} through={Number(params.get("sessionTrialAt."+id)??done)}/>:<article key={id} data-trial={id}><Check size={14}/><p>{trialResults[id]}</p></article>)}</section>}
    <footer>{!isBeginner&&<button onClick={openLesson}>Mở Từng bước triển khai · {round.lesson}<ArrowRight size={13}/></button>}{params.get('sessionOrigin')&&<button onClick={()=>{const saved=new URLSearchParams(params.get('sessionOrigin')!);const change:Changes={};for(const key of params.keys())if(!saved.has(key)&&!key.startsWith('session'))change[key]=null;for(const [key,value] of saved)change[key]=value;update(change);}}>Trở về bài đã mở phiên</button>}</footer>
   </aside>
  </div>
 </section>;
}
