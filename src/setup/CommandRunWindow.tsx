import {findCommandCase} from "./command-cases";
import type {ReactNode} from "react";
import {Play,Square} from "lucide-react";
import type {PracticeContext} from "./project-practice-model";
import type {LogId} from "./command-session-model";
import {executionSource} from "./execution-model";
import {RunTerminal} from "./CommandRunControls";
import {StartupReplay,StartupReferenceChoice} from "./StartupReplay";
import type {StartupPlayback,StartupReference} from "./startup-log-model";
type Props={context:PracticeContext;expected?:LogId;onRun:()=>void;onStop:()=>void;onLog:(id:LogId)=>void;onErrorRead:()=>void;onConfigure:()=>void;onTerminal:()=>void;onRepair:()=>void;onPlayback:(patch:Partial<StartupPlayback>)=>void;onReference:(reference:StartupReference)=>void;onNextGroup:()=>void;caseLibrary?:ReactNode;children?:ReactNode};
export function CommandRunWindow({context,expected,onRun,onStop,onLog,onErrorRead,onConfigure,onTerminal,onRepair,onPlayback,onReference,onNextGroup,caseLibrary,children}:Props){
 const s=context.sim,session=s.commandSession;
 const hasRun=session.shown>0||s.process!=="idle"||session.starting||s.commandReview.errorOpen;
 const profile=hasRun?s.launchProfile:context.profile;
 const terminal=s.runMode==="powershell",active=session.starting||session.playback.playing||s.process==="running";
 const lines:[LogId,string][]=[["profile",`Active profiles: ${profile==="dev"?"dev":"chưa đặt dev · nguồn khác chưa xác định"}`],["port",`Tomcat started on port ${session.port} (http)`],["started","Started AgentCommandServiceApplication"]];
 const caseItem=findCommandCase(session.playback.caseId);
 const error=false,portFailure=s.process==="error"&&session.scenario==="port-busy";
 return <div className="ide-shell command-run-ide" aria-label="IntelliJ Run Command">
  <div className="ide-title"><span className="ide-logo">IJ</span><b>agent-workspaces</b><span>IntelliJ IDEA</span></div>
  <div className="command-run-toolbar"><button type="button" className="command-config-name" title={executionSource.mainClass} disabled={active} onClick={onConfigure}>Command / {context.profile==="dev"?"dev":"chưa đặt dev"} · Edit Configurations…</button>{!terminal&&<button type="button" className={!hasRun||s.process==="stopped"?"ide-located":""} data-command-action="run" aria-label="Run Command" title="Run Command · Shift+F10" disabled={active} onClick={onRun}><Play size={18}/>Run</button>}</div>
  <div className="run-source-breadcrumb" title={`${executionSource.sourceRoot}/${executionSource.modulePath}/src/main/java/com/alpaca/agent/AgentCommandServiceApplication.java`}>{executionSource.modulePath}/src/main/java/com/alpaca/agent/AgentCommandServiceApplication.java</div>
  <StartupReferenceChoice reference={session.playback.reference} disabled={active} onChange={onReference} caseTitle={caseItem?.title}/>
  {caseLibrary}{caseItem&&<p className="command-case-caption">{session.playback.caseRepaired?"Thử lại bằng dữ kiện đã sửa trong bài; phiên log gốc giữ nguyên.":caseItem.action} · {caseItem.origin==="recorded"?"Phiên thật đã lưu; các nhánh xử lý là giả lập.":"Dữ kiện case riêng; không đổi I1/G2 hoặc môi trường thật."}</p>}
  {!terminal?<div className="run-gutter-main"><button type="button" aria-label="Run cạnh main" title="Run AgentCommandServiceApplication.main()" disabled={active} onClick={onRun}><Play size={18}/></button><pre>public static void main(String[] args) {"{"}<br/>  <mark>SpringApplication.run(AgentCommandServiceApplication.class, args);</mark><br/>{"}"}</pre></div>:<RunTerminal key={context.profile} profile={context.profile} disabled={active} open={s.runSetup.terminalOpen} onOpen={onTerminal} onRun={onRun}/>}
  {hasRun?<section className="command-run-window" aria-label="Cửa sổ Run Command"><header><b>{s.launchMode==="intellij"?"Run":"Terminal · bootRun"} · Command <span>#{session.id}{s.process==="stopped"?" · Lần chạy đã dừng":""}</span></b><button type="button" data-command-action="stop" aria-label="Stop Command" title="Stop · Ctrl+F2" className={s.process==="running"?"command-stop-ready":""} disabled={!active} onClick={onStop}><Square size={15}/>Stop</button></header>
   <div className="command-process-status" data-process={s.process==="error"?(portFailure||session.playback.frame>0?"error":"blocked"):s.process} role="status">{s.process==="error"&&session.playback.frame>0&&session.scenario!=="port-busy"?(caseItem&&caseItem.origin!=="recorded"?caseItem.reached:"Khởi động thất bại trong phiên tham chiếu; đang đọc lỗi/hủy context."):session.starting?"Đang khởi động · Command…":s.process==="running"?"Khởi động thành công · Command đang chạy trong bài học":s.process==="stopped"?"Command đã dừng; log lần chạy được giữ lại.":portFailure?"Khởi động thất bại · port đang bị chiếm trong bài.":"Chưa khởi động Command; xử lý điều kiện kỹ thuật rồi bấm Run."}</div>
   {session.assumed&&<p className="command-assumed">Kịch bản: giả định điều kiện đã đáp ứng — dùng dev, Java 21 và các kết nối/cấu hình cần thiết đã sẵn sàng; không bật dịch vụ trong bài.</p>}
   {!session.assumed&&!session.playback.caseId&&session.playback.reference==="configured"&&(session.starting||session.shown>0)&&<p className="command-scenario-note">Tình huống học giả định các kết nối/cấu hình ngoài điều kiện bài đã sẵn sàng; chưa kiểm chứng dịch vụ thật.</p>}
   {!error&&session.scenario!=="port-busy"?<StartupReplay context={context} onPlayback={onPlayback} onReference={onReference} onNext={onNextGroup} onReplay={onRun} onLog={onLog}/>:<div className="command-console" aria-label={error?"Ví dụ log lỗi":"Log lần chạy Command"}>
    <small className="command-log-pending">Log mô phỏng · lần #{session.id}</small>
    {error?<><span className="command-error-caption">Ví dụ lỗi kết nối · không thay đổi lần chạy đang theo dõi</span><code>Application run failed</code><button type="button" data-command-action="error" className={s.commandReview.errorRead?"is-log-selected":"ide-located"} onClick={onErrorRead}>Caused by: Connection refused — PostgreSQL localhost</button></>:<>
     {lines.slice(0,session.shown).map(([id,text])=><button type="button" key={`${session.id}:${id}`} data-command-log={id} data-command-action={id} aria-pressed={session.selected===id} className={`${session.selected===id?"is-log-selected":""} ${expected===id?"is-log-target":""}`} onClick={()=>onLog(id)}>{text}</button>)}
     {session.starting&&<span className="command-log-pending">Đang nhận log…</span>}
     {portFailure&&<><code>APPLICATION FAILED TO START</code><button type="button" data-command-action="error" className="is-log-selected" onClick={onErrorRead}>Web server failed to start. Port {session.port} was already in use.</button><p className="command-error-caption">Tình huống minh họa: process khác đang giữ port {session.port}. Giải phóng port trong bài rồi chạy lại; không đổi dependency.</p><button type="button" onClick={onRepair}>Sửa trong bài học và chạy lại</button></>}
     {!session.starting&&session.shown===0&&<span>Chưa có log startup thành công. Chọn liên kết sửa đúng điều kiện còn thiếu ở dưới.</span>}
     {s.process==="stopped"&&<code className="command-exit">Process stopped · Lần chạy đã dừng</code>}
    </>}
   </div>}
  </section>:<div className="command-run-empty">{terminal?"Mở Terminal rồi Enter lệnh để khởi động.":"Run khởi động ứng dụng; cửa sổ Run sẽ mở khi bạn bấm tam giác."}</div>}
  {children}
 </div>;
}
