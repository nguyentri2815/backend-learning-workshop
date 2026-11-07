import {lazy,Suspense,useRef} from "react";
import {ArrowLeft,ArrowRight,LocateFixed,RotateCcw} from "lucide-react";
import type {PracticeContext,PracticeTask} from "./project-practice-model";
import {practiceFiles,sourceRows,runtimeSource,commandPath} from "./project-practice-model";
import {commandMainClass,commandMainName} from "./run-configuration-model";
import type {RunSetup,RunSetupStep} from "./run-configuration-model";
import {executionSource} from "./execution-model";
import "./run-configuration.css";
import {MainRunGutter} from "./MainRunGutter";
import {RunMethodChoice,ConfigurationCompare,RunTerminal} from "./CommandRunControls";

const CodeBlock=lazy(()=>import("../workshop/CodeBlock").then(module=>({default:module.CodeBlock})));
const instructions:Record<RunSetupStep,string>={main:"Mở AgentCommandServiceApplication trong cây hoặc nút bên dưới.",inspect:"Xem main() và SpringApplication.run(...), rồi bấm tam giác để mở lựa chọn chạy.",menu:"Chọn Edit Configurations… để thiết lập cách chạy.",configuration:"Kiểm tra Main class và module Command, rồi chọn profile dev.",apply:"Bấm Apply để áp dụng bản thiết lập trong bài.",ok:"Bấm OK để đóng cửa sổ thiết lập.",saved:"Đã lưu thiết lập. Tiếp tục sang Chạy và dừng để bấm Run."};
type Props={context:PracticeContext;change:(patch:Partial<PracticeContext>)=>void;observe:(key:string,complete?:PracticeTask)=>void;open:(id:string,line?:number)=>void;onRestart:()=>void};
export function RunConfigurationPractice({context,change,observe,open,onRestart}:Props){
 const s=context.sim,r=s.runSetup,section=useRef<HTMLElement>(null);
 const dialog=["configuration","apply","ok"].includes(r.step);
 const locked=s.process==="running"||s.commandSession.starting;
 const file=practiceFiles(context.task).find(file=>file.id===context.file);
 const main=context.file==="main";
 function setup(patch:Partial<RunSetup>){change({view:"activity",sim:{...s,notice:"",runSetup:{...r,...patch}}});}
 function save(){
  if(!r.applied||locked)return;
  change({profile:r.draftProfile,view:"activity",sim:{...s,notice:"",mainSelected:true,runSetup:{...r,step:"saved",saved:true}}});
  observe("run-config:saved","run-config");
 }
 function back(){if(s.runMode==="powershell"){setup(r.saved?{saved:false,step:"configuration"}:{terminalOpen:false});return;}const previous:Record<RunSetupStep,RunSetupStep>={main:"main",inspect:"main",menu:"inspect",configuration:"inspect",apply:"configuration",ok:"apply",saved:"inspect"};setup({step:previous[r.step],applied:false});}
 function hint(){const target=section.current?.querySelector<HTMLElement>(s.runMode==="powershell"?"[data-run-action=terminal]":r.step==="inspect"?".run-main-gutter":r.step==="saved"?".run-setup-summary":`[data-run-action="${r.step}"]`);target?.focus({preventScroll:true});target?.scrollIntoView({block:"nearest"});}
 const path=file?`${file.sourceRoot}/${file.path}`:context.file==="artifact"?`${executionSource.sourceRoot}/${executionSource.artifact.path}`:"";
 return <section ref={section} className="runtime-activity run-configuration-practice" aria-label="Thiết lập cách chạy Command">
  <header className="run-setup-heading"><span>BƯỚC I1</span><h2>Thiết lập cách chạy Command</h2><p>Bạn đang chọn ứng dụng sẽ chạy và bộ cấu hình sử dụng. Bước này chuẩn bị cách chạy; ứng dụng chỉ khởi động khi bạn bấm Run.</p></header>
  <RunMethodChoice mode={s.runMode} disabled={locked} onChange={runMode=>change({profile:runMode==="powershell"?"dev":context.profile,sim:{...s,runMode,runSetup:{...r,...(runMode==="powershell"?{draftProfile:"dev" as const}:{})}}})}/>
  <div className="run-setup-concepts"><div><b>Main class</b><span>Điểm bắt đầu của ứng dụng.</span></div><div><b>Run Configuration</b><span>Bộ thiết lập IntelliJ dùng khi chạy.</span></div></div>
  <div className="ide-mission run-setup-mission"><p>{s.runMode==="powershell"?(r.saved?"Lệnh đã chuẩn bị. Tiếp tục I2 để bấm Enter.":"Mở tab Terminal, xem lệnh tại root và đối chiếu cấu hình trước khi tiếp tục."):instructions[r.step]}</p></div>
  <div className="run-setup-tools"><button className="text-button" onClick={hint}><LocateFixed size={15}/>Chỉ vị trí</button><button className="text-button" disabled={(s.runMode==="powershell"?!r.terminalOpen:r.step==="main")||locked} onClick={back}><ArrowLeft size={15}/>Quay lại</button><button className="text-button" disabled={locked} onClick={onRestart}><RotateCcw size={15}/>Làm lại thiết lập</button></div>
  <div className="ide-shell run-setup-ide">
   <div className="ide-title"><span className="ide-logo">IJ</span><b>agent-workspaces</b><span>IntelliJ IDEA</span></div>
   {s.runMode==="intellij"?<><div className="ide-menubar"><span>File</span><span>Edit</span><button type="button" disabled={r.step==="main"||locked} data-run-action="inspect" className={r.step==="inspect"?"ide-located":""} onClick={()=>setup({step:"menu"})}>Run</button><span>Tools</span></div>
   {r.step==="menu"&&<div className="ide-menu"><button type="button" data-run-action="menu" className="ide-located" onClick={()=>setup({step:"configuration",draftProfile:context.profile,applied:false})}>Edit Configurations…</button></div>}
   {dialog?<div className="ide-dialog run-setup-dialog" role="group" aria-label="Run/Debug Configurations">
    <div className="ide-dialog-title">Run/Debug Configurations</div>
    <div className="ide-dialog-body"><nav aria-label="Loại cấu hình chạy"><small>Spring Boot</small><b>Command</b><small>Bản thiết lập trong bài</small></nav>
     <div className="ide-page"><h4>Command</h4><div className={`run-target-fields ${r.step==="configuration"?"is-current":""}`}><label>Main class<input readOnly value={commandMainClass} title={commandMainClass}/></label><label>Use classpath of module<input readOnly value="1-agent-command-service" title={commandPath}/></label></div>
      <label>Active profiles trong bài<select aria-label="Active profiles trong bài" data-run-action="configuration" className={r.step==="configuration"?"ide-located":""} value={r.draftProfile} disabled={locked} onChange={event=>setup({draftProfile:event.target.value as RunSetup["draftProfile"],step:"apply",applied:false})}><option value="base">Không chỉ định profile</option><option value="dev">dev</option></select></label>
      <label>JDK cần thiết<output>Java 21 · Project SDK hiện tại: {s.sdk}</output></label><ConfigurationCompare profile={r.draftProfile} configKey={r.configKey} onKeyChange={configKey=>setup({configKey})}/>
      <details className="run-extra-fields"><summary>JDK, thư mục và tham số</summary><label>JDK trong bài<output>{s.sdk} · Project SDK</output></label><label>Working directory<output>{executionSource.workspaceDirectory}</output></label><p>Environment variables, VM options và Program arguments trên máy thật chưa được xác minh.</p></details>
     </div></div>
    <footer><button type="button" disabled={locked} onClick={()=>setup({step:r.saved?"saved":"inspect",draftProfile:context.profile,applied:false})}>Cancel</button><button type="button" data-run-action="apply" className={r.step==="apply"?"ide-located":""} disabled={locked||r.draftProfile==="base"&&r.step==="configuration"} onClick={()=>setup({applied:true,step:"ok"})}>Apply</button><button type="button" data-run-action="ok" className={r.step==="ok"?"ide-located":""} disabled={locked||!r.applied} onClick={save}>OK</button></footer>
   </div>:<div className="run-main-editor" aria-label="Main class và source đang xem">
    {path&&<nav className="run-source-breadcrumb" aria-label="Đường dẫn đầy đủ" title={path}>{path}</nav>}
    {file?<><div className="run-editor-title" title={file.path}>{file.path.split("/").at(-1)}</div><div className="run-main-code">{main&&<MainRunGutter disabled={locked} onOpen={()=>setup({step:"menu"})}/>}<Suspense fallback={<p>Đang mở source…</p>}><CodeBlock path={file.path} rows={sourceRows(file.id,context.task)} range={{name:main?"main() và điểm khởi động Spring":"Source đang xem",qualified:`run-config:${file.id}`,start:main?26:context.line||file.rows[0].line,end:main?28:context.line||file.rows[0].line}} highlights={main?[{range:{name:"Hàm main()",qualified:"command:main",start:26,end:28},purpose:"related"},{range:{name:"Khởi động Spring",qualified:"command:spring-run",start:27,end:27},purpose:"primary"}]:undefined} jump={main?26:context.line} targetKey={`run-config:${file.id}`} memoryKey={`run-config:${file.id}`} preferTarget onLineSelect={line=>change({line})}/></Suspense></div>{main&&<p className="run-code-note">Đây là code khởi động; mở file hoặc chọn dòng chưa chạy ứng dụng và chưa lưu Run Configuration.</p>}</>:context.file==="artifact"?<div className="run-jar-preview"><b>JAR trong bài</b><code>{executionSource.artifact.path.split("/").at(-1)}</code></div>:<div className="run-main-empty"><b>Command · source</b><button className="ide-located" type="button" data-run-action="main" onClick={()=>open("main",27)}>Mở main class Command</button></div>}
    {!main&&(file||context.file==="artifact")&&<button type="button" data-run-action="main" onClick={()=>open("main",27)}>Mở main class Command</button>}
   </div>}</>:<><RunTerminal key={r.draftProfile} profile={r.draftProfile} open={r.terminalOpen} onOpen={()=>setup({terminalOpen:true})}/>{r.terminalOpen&&<div className="run-terminal-setup"><label>Profile truyền cho bootRun<select aria-label="Profile lệnh bootRun" value={r.draftProfile} onChange={e=>change({profile:e.target.value as "base"|"dev",sim:{...s,runSetup:{...r,draftProfile:e.target.value as "base"|"dev",saved:false,step:"configuration"}}})}><option value="dev">dev · --spring.profiles.active=dev</option><option value="base">Không đặt profile dev</option></select></label><p>JDK cần thiết: Java 21 · Terminal hiện tại: {s.jdk}</p><ConfigurationCompare profile={r.draftProfile} configKey={r.configKey} onKeyChange={configKey=>setup({configKey})}/><button type="button" onClick={()=>{change({profile:r.draftProfile,sim:{...s,mainSelected:true,runSetup:{...r,step:"saved",saved:true,applied:true}}});observe("run-config:saved","run-config");}}>Dùng lệnh này</button></div>}</>}
  </div>
  {r.step==="saved"&&r.saved&&<div className="run-setup-summary" role="status" tabIndex={-1}><dl><dt>Ứng dụng</dt><dd>Command</dd><dt>Main class</dt><dd>{commandMainName}</dd><dt>Profile</dt><dd>{context.profile}</dd><dt>Trạng thái</dt><dd>{locked?"Đã thiết lập; Command đang chạy trong bài":s.process==="stopped"?"Đã thiết lập; lần chạy trước đã dừng":"Đã thiết lập, chưa chạy"}</dd></dl><button className="text-button" disabled={locked} onClick={()=>setup({step:"configuration",draftProfile:context.profile,applied:false})}>Mở lại Run Configuration</button></div>}
  <button className="button primary run-setup-next" disabled={!r.saved||r.step!=="saved"} onClick={()=>change({task:"startup",view:"activity",sim:{...s,notice:""}})}>Tiếp theo: Chạy và dừng<ArrowRight size={16}/></button>
  <details className="run-setup-limits"><summary>Nguồn cấu hình và giới hạn</summary><p>Command: application.yml + application-dev.yml; server.port 9901. dev đổi datasource sang localhost trong mô hình hai file; Redis/RabbitMQ và API ngoài vẫn cần đối chiếu. Chọn dev không làm mọi kết nối thành local.</p><p>{runtimeSource.limits}</p><p>Kiểm tra override từ environment, VM/program arguments, spring.config.location/additional-location/import và file ngoài trước khi Run thật. Bài không chạy Java hoặc kiểm chứng kết nối.</p><a href="https://www.jetbrains.com/help/idea/run-debug-configuration-spring-boot.html" target="_blank" rel="noreferrer">JetBrains · Spring Boot Run Configuration</a></details>
 </section>;
}
