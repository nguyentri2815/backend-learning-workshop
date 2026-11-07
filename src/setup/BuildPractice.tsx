import {useEffect,useRef,useState} from "react";
import {ArrowLeft,ArrowRight,ChevronDown,ChevronRight,Copy,CornerDownLeft,LocateFixed,Play,RotateCcw} from "lucide-react";
import type {PracticeContext,PracticeTask} from "./project-practice-model";
import {parents} from "./project-practice-model";
import type {BuildStep,BuildWalk} from "./execution-model";
import {advanceBuild,beginBuild,buildDirectory,emptyBuildWalk,executionCommands,executionSource,hasJar,libsDirectory} from "./execution-model";

const instructions:Record<BuildStep,string>={
 "gradle-window":"Mở cửa sổ Gradle ở mép phải IntelliJ.",module:"Tìm và mở module 1-agent-command-service.",tasks:"Mở nút Tasks của module Command.",group:"Mở nhóm build để tìm task đóng gói.",task:"Mở menu chuột phải của bootJar (chạm nút trong bài).",run:"Chọn Run để chạy bootJar của Command.",terminal:"Mở tab Terminal ở cạnh dưới IntelliJ.",command:"Terminal đang ở root workspace. Xem lệnh rồi bấm Enter.",output:"Xem kết quả bên dưới; mở build → libs trong cây Project.",
};
const gradleSteps:BuildStep[]=["gradle-window","module","tasks","group","task","run"];
type Props={context:PracticeContext;change:(patch:Partial<PracticeContext>,replace?:boolean)=>void;observe:(key:string,complete?:PracticeTask)=>void;onRestart:()=>void};
export function BuildPractice({context,change,observe,onRestart}:Props){
 const s=context.sim,flow=s.execution.flow,section=useRef<HTMLElement>(null);
 const [command,setCommand]=useState(executionCommands.bootJar),[copyMessage,setCopyMessage]=useState("");
 const busy=flow.stage==="compile"||flow.stage==="package";
 const success=!busy&&flow.stage!=="failure"&&(hasJar(s)||flow.stage==="success");
 const output=busy||success||flow.stage==="failure";
 const position=gradleSteps.indexOf(flow.step);
 const moduleOpen=flow.module==="command"&&(position>=2||flow.step==="output");
 const tasksOpen=moduleOpen&&(position>=3||flow.step==="output");
 const groupOpen=tasksOpen&&(position>=4||flow.step==="output");
 function walk(patch:Partial<BuildWalk>){change({view:"activity",sim:{...s,notice:"",execution:{...s.execution,flow:{...flow,...patch}}}});}
 function mode(launcher:BuildWalk["launcher"]){
  const next={...emptyBuildWalk(),launcher,step:launcher==="gradle"?"gradle-window" as const:"terminal" as const};
  change({view:"activity",sim:{...s,notice:"",execution:{...s.execution,flow:next}}});setCopyMessage("");
 }
 function start(){
  const ready={...s,moduleSelected:true,execution:{...s.execution,flow:{...flow,task:"bootJar" as const,module:"command" as const,selectedTask:"bootJar" as const,cwd:"workspace" as const,checked:true,stage:"idle" as const,error:"" as const,feedback:"" as const,step:"output" as const}}};
  change({view:"activity",sim:{...ready,...beginBuild(ready),notice:""}});
 }
 useEffect(()=>{
  if(!busy)return;
  const timer=window.setTimeout(()=>{
   const compiled={...s,...advanceBuild(s)};
   const finished=compiled.execution.flow.stage==="package"?{...compiled,...advanceBuild(compiled)}:compiled;
   change({sim:{...finished,notice:""},folder:buildDirectory,expanded:[...new Set([...context.expanded,...parents(buildDirectory)])]},true);
   observe("build-task:build","build-task");
  },1200);
  return()=>window.clearTimeout(timer);
 },[busy,change,observe,s,context.expanded]);
 useEffect(()=>{
  if(flow.stage!=="success"&&context.folder!==libsDirectory)return;
  const path=context.folder===libsDirectory?executionSource.artifact.path:buildDirectory;
  const frame=requestAnimationFrame(()=>section.current?.closest(".project-practice")?.querySelector<HTMLElement>('[data-practice-path="'+path+'"]')?.scrollIntoView({block:"nearest",inline:"nearest"}));
  return()=>cancelAnimationFrame(frame);
 },[flow.stage,context.folder]);
 function chooseModule(module:BuildWalk["module"]){
  walk(module==="command"?{module,step:"tasks",feedback:""}:{module,step:"module",feedback:"module"});
 }
 function chooseTask(selectedTask:BuildWalk["selectedTask"]){
  walk(selectedTask==="bootJar"?{selectedTask,step:"run",feedback:""}:{selectedTask,step:"task",feedback:"task"});
 }
 function back(){
  const steps=flow.launcher==="gradle"?gradleSteps:["terminal","command"] as BuildStep[];
  const index=steps.indexOf(flow.step);
  walk({step:index<0?steps.at(-1)!:steps[Math.max(0,index-1)],stage:"idle",error:"",feedback:""});
 }
 function retry(){walk({step:flow.stage==="failure"||flow.step==="output"?(flow.launcher==="gradle"?"run":"command"):flow.step,stage:"idle",error:"",feedback:""});}
 function locate(){
  const target=output?(success?section.current?.closest(".project-practice")?.querySelector<HTMLElement>('[data-practice-path="'+buildDirectory+'"]'):section.current?.querySelector<HTMLElement>(".build-result")):section.current?.querySelector<HTMLElement>(`[data-build-action="${flow.step}"]`);
  target?.focus({preventScroll:true});target?.scrollIntoView({block:"nearest"});
 }
 async function copy(){
  try{await navigator.clipboard.writeText(executionCommands.bootJar);setCopyMessage("Đã sao chép lệnh.");}
  catch{setCopyMessage("Chọn lệnh bên dưới để sao chép.");}
 }
 function enter(){
  if(command.trim().replace(/\s+/g," ")!==executionCommands.bootJar){walk({feedback:command.includes("2-agent-flow-service")?"module":"command"});return;}
  start();
 }
 function control(step:BuildStep,label:React.ReactNode,action:()=>void,extra=""){
  return <button type="button" data-build-action={step} className={`${extra} ${flow.step===step?"ide-located":""}`} disabled={busy} onClick={action}>{label}</button>;
 }
 const feedback=flow.feedback==="module"?"Đây là module Flow. Chọn Command: 1-agent-command-service.":flow.feedback==="task"?"jar đóng gói JAR thường. Trong bài này, chọn bootJar để đóng gói ứng dụng Command.":flow.feedback==="command"?"Lệnh chưa được chạy. Dùng bootJar với đầy đủ đường dẫn module Command.":"";
 return <section ref={section} className="runtime-activity build-practice" aria-label="Build Command để kiểm tra source">
  <header className="build-heading"><span>BƯỚC H</span><h2>Build Command để kiểm tra source</h2><p>Bạn đã có source. Tiếp theo, dùng Gradle để tạo kết quả build.</p></header>
  <div className="build-session"><span>Chỉ thay đổi trạng thái bài học.</span><button className="text-button" disabled={busy} onClick={()=>{onRestart();setCommand(executionCommands.bootJar);setCopyMessage("");}}><RotateCcw size={14}/>{hasJar(s)||s.execution.buildDir||flow.stage!=="idle"?"Làm lại bước build":"Thực hành từ đầu"}</button></div>
  <div className="build-methods" role="group" aria-label="Cách thực hành build"><button type="button" aria-pressed={flow.launcher==="gradle"} disabled={busy} onClick={()=>mode("gradle")}>Trong IntelliJ</button><button type="button" aria-pressed={flow.launcher==="terminal"} disabled={busy} onClick={()=>mode("terminal")}>Bằng lệnh Terminal</button></div>
  <div className="ide-mission build-mission"><p>{busy?"Gradle đang xử lý source…":flow.stage==="failure"?"Đọc lỗi trong cửa sổ output, rồi thử lại.":instructions[flow.step]}</p>{feedback&&<p className="build-choice-feedback" role="alert">{feedback}</p>}</div>
  <div className="build-navigation"><button className="text-button" disabled={busy} onClick={locate}><LocateFixed size={15}/>Chỉ vị trí</button><button className="text-button" disabled={busy||flow.step==="gradle-window"||flow.step==="terminal"} onClick={back}><ArrowLeft size={15}/>Quay lại</button><button className="text-button" disabled={busy} onClick={retry}><RotateCcw size={15}/>Thử lại</button></div>
  <div className="ide-shell build-ide" aria-label="IntelliJ mô phỏng build Command">
   <div className="ide-title"><span className="ide-logo">IJ</span><b>agent-workspaces</b><span>Mô phỏng</span></div>
   <div className="build-ide-main">
    {flow.launcher==="gradle"&&flow.toolOpen?<div className="build-gradle-pane" aria-label="Gradle tool window"><header><b>Gradle</b><small>Các module liên quan · cây rút gọn</small></header><div className="build-gradle-tree"><div className="build-gradle-root"><ChevronDown size={15}/>agent-workspaces</div>
     <button type="button" disabled={busy} className="build-module-row" onClick={()=>chooseModule("flow")}><ChevronRight size={15}/>2-agent-flow-service</button>
     {control("module",<>{moduleOpen?<ChevronDown size={15}/>:<ChevronRight size={15}/>}1-agent-command-service</>,()=>chooseModule("command"),"build-module-row")}
     {moduleOpen&&<div className="build-task-branch"><code className="build-module-path">{executionSource.gradlePath}</code>
      {control("tasks",<>{tasksOpen?<ChevronDown size={15}/>:<ChevronRight size={15}/>}Tasks</>,()=>walk({step:"group",feedback:""}))}
      {tasksOpen&&<div className="build-task-branch">{control("group",<>{groupOpen?<ChevronDown size={15}/>:<ChevronRight size={15}/>}build</>,()=>walk({step:"task",feedback:""}))}
       {groupOpen&&<div className="build-task-branch">
        <button type="button" disabled={busy} onClick={()=>chooseTask("jar")}>jar</button>
        <button type="button" data-build-action="task" className={flow.step==="task"?"ide-located":""} disabled={busy} aria-label="bootJar · mở menu chuột phải" onClick={()=>chooseTask("bootJar")} onContextMenu={event=>{event.preventDefault();chooseTask("bootJar");}} onDoubleClick={start}>bootJar <small>chuột phải</small></button>
        {flow.step==="run"&&<div className="ide-menu build-task-menu">{control("run",<><Play size={14}/>Run 'bootJar'</>,start)}</div>}
       </div>}
      </div>}
     </div>}
    </div></div>:<div className="build-ide-editor"><span>Command / build.gradle</span><pre>{"// Source đã có\napply plugin: \"java\"\n\n// Kết quả build do Gradle tạo khi chạy task."}</pre></div>}
    <aside className="build-tool-stripe">{control("gradle-window","Gradle",()=>walk({launcher:"gradle",toolOpen:true,step:"module",feedback:""}))}</aside>
   </div>
   <div className="build-bottom-tabs">{control("terminal","Terminal",()=>walk({launcher:"terminal",terminal:true,cwd:"workspace",checked:true,step:"command",feedback:""}))}<span>Run</span></div>
   {flow.launcher==="terminal"&&flow.terminal&&<div className="build-terminal-window" aria-label="Terminal IntelliJ mô phỏng"><header>Terminal · Local (PowerShell)<button type="button" onClick={copy}><Copy size={13}/>Sao chép lệnh</button></header><code className="build-terminal-cwd">PS {executionSource.workspaceDirectory}&gt;</code>
    <form onSubmit={event=>{event.preventDefault();enter();}}><label htmlFor="build-command-input">Lệnh hướng dẫn</label><textarea id="build-command-input" data-build-action="command" className={flow.step==="command"?"ide-located":""} value={command} disabled={busy} rows={2} onChange={event=>setCommand(event.target.value)} onKeyDown={event=>{if(event.key==="Enter"&&!event.shiftKey){event.preventDefault();if(!busy)enter();}}}/><div><button type="submit" disabled={busy}><CornerDownLeft size={14}/>Enter</button><button type="button" disabled={busy} onClick={()=>setCommand(executionCommands.bootJar)}>Điền lại lệnh</button></div></form>{copyMessage&&<p role="status">{copyMessage}</p>}
   </div>}
   {output&&<div className={`build-result build-output ${success?"is-success":flow.stage==="failure"?"is-error":""}`} tabIndex={-1} role="status" aria-live="polite" aria-atomic="true"><header><span>{flow.launcher==="gradle"?"Run · Command [bootJar]":"Terminal · kết quả task"}</span><small>Mô phỏng</small></header>
    <b>{busy?"Đang build…":success?"Build thành công":"Build lỗi"}</b>
    {busy&&<code>{executionSource.gradlePath}:bootJar</code>}
    {flow.stage==="failure"&&<p>{flow.error==="jdk"?`${flow.launcher==="gradle"?"Gradle JVM (F3)":"JDK Terminal (F2)"} trong bài cần Java 21. Kiểm tra cấu hình rồi Thử lại.`:flow.error==="root"?"Task root :workspaces:bootJar không có main class. Quay lại và chọn bootJar của module Command.":"Terminal cần ở root workspace có gradlew.bat."}</p>}
   </div>}
  </div>
  {success&&<div className="build-success-note"><p>{hasJar(s)?"Gradle vừa tạo thư mục build để chứa kết quả. Task bootJar tạo file JAR trong build/libs; ứng dụng chưa chạy.":"Task trước đã tạo output biên dịch; chưa có JAR. Chọn bootJar để thực hành đóng gói."}</p>{hasJar(s)&&<><code className="build-artifact-name">{executionSource.artifact.path.split("/").at(-1)}</code><button className="text-button" onClick={()=>change({folder:libsDirectory,view:"activity",expanded:[...new Set([...context.expanded,...parents(executionSource.artifact.path),libsDirectory])]})}>Mở build/libs trong cây<ArrowRight size={14}/></button></>}</div>}
  <section className="build-when"><h3>Khi nào build có thể xuất hiện?</h3><ul><li>Chạy task bằng Terminal hoặc Gradle tool window.</li><li>Bấm Build/Test/Run: IDE có thể gọi compile/build theo cấu hình.</li><li>Clone/mở/sync project không đồng nghĩa đã đóng gói JAR.</li></ul></section>
  <p className="build-package-note">bootJar là ví dụ đóng gói trong bài học; không bắt buộc tạo JAR trước mọi lần chạy local.</p>
  <button className="button primary" disabled={busy} onClick={()=>change({task:"run-config",view:"activity",sim:{...s,notice:""}})}>Tiếp theo: chạy Command<ArrowRight size={16}/></button>
  <details className="build-more"><summary>Căn cứ thao tác</summary><p>Module và lệnh: settings.gradle:30; Spring Boot plugin 3.5.16 trong agent-system. <a href="https://www.jetbrains.com/help/idea/work-with-gradle-tasks.html" target="_blank" rel="noreferrer">JetBrains: chạy task qua menu chuột phải</a>; <a href="https://github.com/spring-projects/spring-boot/blob/v3.5.16/spring-boot-project/spring-boot-tools/spring-boot-gradle-plugin/src/main/java/org/springframework/boot/gradle/plugin/JavaPluginAction.java#L146-L175" target="_blank" rel="noreferrer">Spring Boot: bootJar thuộc nhóm build</a>. Vị trí hiển thị có thể khác giữa các phiên bản IDE.</p></details>
 </section>;
}
