import type {CommandCaseState} from "./command-cases";
import {caseOriginLabel,commandCases,findCommandCase,emptyCommandCase} from "./command-cases";
import evidence from "../content/setup/command-case-source.json" with {type:"json"};
import type {PracticeContext} from "./project-practice-model";
import "./command-cases.css";

export function CommandCaseLibrary({selected,disabled,onSelect}:{selected:string;disabled:boolean;onSelect:(id:string)=>void}){
 return <details className="command-case-library"><summary>Thử tình huống khác{selected?` · ${findCommandCase(selected)?.title??""}`:""}</summary><p>Chỉ cần thực hành một tình huống. Đổi case khi lần chạy đã dừng; cấu hình I1, Docker và Build giữ nguyên.</p>
  {([['before','Trước khi Spring Boot khởi động'],['connect','Khi khởi tạo và kết nối'],['after','Sau khi đã Started']] as const).map(([id,label])=><details key={id}><summary>{label}</summary><div>{commandCases.filter(item=>item.category===id).map(item=><button type="button" disabled={disabled} key={item.id} aria-pressed={selected===item.id} data-command-case={item.id} onClick={()=>onSelect(item.id)}><b>{item.title}</b><small>{caseOriginLabel(item.origin)}</small></button>)}</div></details>)}
 </details>;
}

type Props={context:PracticeContext;update:(state:CommandCaseState)=>void;onRetry:()=>void;onStop:()=>void};
export function CommandCaseInvestigation({context,update,onRetry,onStop}:Props){
 const s=context.sim,p=s.commandSession.playback,session=s.commandSession;
 const item=findCommandCase(s.commandCase.id||p.caseId||(p.reference==="recorded-failure"?"pg-timeout-recorded":""));
 if(!item)return null;
 const state=s.commandCase.id===item.id?s.commandCase:{...emptyCommandCase(),id:item.id,branch:item.branches[0].id};
 const branch=item.branches.find(b=>b.id===state.branch)??item.branches[0],ready=session.id>0&&p.frame>0&&!p.playing&&!session.starting;
 const running=s.process==="running",resolved=state.phase==="resolved";
 const current=!session.id||!p.frame?"Chưa Run tình huống này; chưa có kết quả khởi động.":p.playing?"Log đang phát; kết luận chỉ tới các dòng đã xuất hiện.":s.process==="stopped"?"Lần chạy đã dừng; log và kết quả trước Stop được giữ lại.":resolved?item.category==="after"?"Phép thử request/client mẫu đã qua mức kiểm tra tương ứng; Command đang chạy. Chưa kiểm chứng nghiệp vụ repo thật.":"Lần thử lại đã tới Started trong bài; chưa chứng minh mọi API/nghiệp vụ đúng.":p.caseRepaired?"Lần thử lại chưa có đủ bằng chứng khắc phục.":item.reached;
 const chooseBranch=(id:string)=>{const branch=item.branches.find(b=>b.id===id)!;update({...state,branch:id,checked:false,repaired:false,draft:branch.before,phase:"inspect",feedback:""});};
 const check=()=>update({...state,checked:true,phase:"fix",draft:branch.before,feedback:""});
 const fix=()=>state.draft===branch.after?update({...state,repaired:true,phase:"retry",feedback:""}):update({...state,feedback:"Giá trị đang chọn chưa khớp kết quả kiểm tra. Đối chiếu lại dữ kiện trong cửa sổ này trước khi áp dụng."});
 return <section className="command-case-investigation" aria-label="Tìm nguyên nhân trong tình huống" data-case-id={item.id} data-case-phase={state.phase}>
  <header><b>{item.title}</b><small>{caseOriginLabel(item.origin)}{item.origin==="recorded"?" · phép kiểm tra/sửa bên dưới là giả lập":" · không phải log/response đã quan sát của repo"}</small></header>
  <p><b>Dấu hiệu của tình huống:</b> {item.signal}</p><p><b>Hiện tại:</b> {current}</p>
  {state.phase==="idle"?<button type="button" disabled={!ready} data-command-action="diagnose" onClick={()=>update({...state,phase:"inspect",branch:branch.id})}>Tìm nguyên nhân</button>:<>
   <div className="case-workspace" data-case-surface={branch.surface}>
    <div className="case-tool-title">{branch.surface==="ide"?"Run/Debug Configurations":branch.surface==="docker"?"Docker · inspector của case":branch.surface==="http"?"HTTP client · request mẫu":branch.surface==="build"?"Build · Problems":branch.surface==="log"?"Run · Caused by / source":"Terminal / cấu hình hiệu lực"}<span>Dữ kiện mô phỏng</span></div>
    <nav aria-label="Vị trí kiểm tra case">{branch.target}</nav><pre>{branch.command}</pre>
    {!state.checked?<button type="button" onClick={check}>Thực hiện kiểm tra trong bài</button>:<>
     <div className="case-check-result" role="status"><b>Kết quả kiểm tra</b><p>{branch.finding}</p><p>{branch.conclusion}</p></div>
     {!state.repaired&&<><label>{branch.field}<select aria-label="Giá trị sửa trong case" value={state.draft} onChange={e=>update({...state,draft:e.target.value,feedback:""})}><option value={branch.before}>{branch.before}</option><option value={branch.after}>{branch.after}</option></select></label><button type="button" onClick={fix}>{branch.fix}</button>{state.feedback&&<p role="alert">{state.feedback}</p>}</>}
     {state.repaired&&!resolved&&<><p>Đã áp dụng thay đổi trong dữ kiện case. Chưa có bằng chứng khắc phục cho tới khi thử lại.</p>{running&&item.category!=="after"?<button type="button" onClick={onStop}>Stop để dùng cấu hình vừa sửa</button>:<button type="button" disabled={!ready||item.category==="after"&&!running} onClick={onRetry}>{item.category==="after"?"Thử lại trong cùng phiên":"Run lại sau kiểm tra"}</button>}{item.category==="after"&&!running&&<p>Process đã dừng; bấm Run cạnh main để tạo lần chạy mới trước khi thử request.</p>}</>}
     {resolved&&<p className="case-resolved" role="status"><b>{running?"Bằng chứng sau thử lại · giả lập:":"Kết quả đã lưu · lần Run đã dừng:"}</b> {branch.proof} {item.category==="after"?`Cùng ID process bài học #${session.id}; hiện ${running?"đang chạy":"đã dừng"}.`:`Lần Run #${session.id} là kịch bản mới, không sửa log phiên thật đã lưu.`}</p>}
    </>}
   </div>
   {item.branches.length>1&&<details><summary>Thử nhánh nguyên nhân khác</summary><p>Dấu hiệu ban đầu có nhiều nguyên nhân. Chọn một bộ dữ kiện giả lập khác, rồi thực hiện kiểm tra; không gán nhánh đó cho phiên thật.</p>{item.branches.map(b=><button type="button" key={b.id} disabled={p.playing} aria-pressed={b.id===branch.id} onClick={()=>chooseBranch(b.id)}>{b.label}</button>)}</details>}
  </>}
  <details><summary>Cách đọc dấu hiệu và nguồn</summary><dl><dt>Tôi vừa làm gì?</dt><dd>{item.action}</dd><dt>Dòng đáng chú ý?</dt><dd><code>{item.log}</code></dd><dt>Nguyên nhân có thể?</dt><dd>{item.branches.map(b=>b.label).join("; ")}. Chỉ kết quả kiểm tra mới xác định nhánh trong case.</dd><dt>Kiểm tra và xử lý?</dt><dd>{branch.command} {state.checked?branch.conclusion:"Thực hiện kiểm tra trong cửa sổ trên trước khi chọn thay đổi."}</dd><dt>Bằng chứng khắc phục?</dt><dd>{resolved?branch.proof:"Chưa có kết quả thử lại; không coi việc chọn một giá trị là đã sửa xong."}</dd></dl>{item.limit&&<p>{item.limit}</p>}{item.refs.map(id=>{const ref=evidence.refs[id as keyof typeof evidence.refs];return ref?<article key={id}><b>{ref.path}:{ref.from}</b><pre>{ref.rows.map(row=>`${row.line} | ${row.text}`).join("\n")}</pre></article>:null;})}<p>{evidence.limits}</p></details>
 </section>;
}
