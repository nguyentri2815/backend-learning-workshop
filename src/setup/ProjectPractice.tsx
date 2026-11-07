import { InfrastructurePanel } from "./InfrastructurePanel";
import {hasJar} from "./execution-model";
import { ideActions } from "./IntelliJPractice";
import { lazy, startTransition, Suspense, useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, Check, FileCode2, LocateFixed, RotateCcw } from "lucide-react";
import { PracticeTree } from "./PracticeTree";
import { PracticeWorkbench } from "./PracticeWorkbench";
import { commandModule, commandPath, defaultContext, normalizeContext, parents, parsePractice, PRACTICE_KEY, practiceFiles, practiceSearch, practiceSource, practiceTasks, visiblePracticeTasks, readPracticeProgress, runtimeSource, sourceRows, swaggerModule } from "./project-practice-model";
import type { PracticeContext, PracticeTask } from "./project-practice-model";
import { isRuntimeTask, practiceStep, resetSimulation, runtimeFeedback } from "./practice-runtime-model";
import { RuntimeArtifact, RuntimePractice, runtimeCanNext, runtimeInstruction, runtimeLine } from "./RuntimePractice";
import "./project-practice.css";

const CodeBlock=lazy(()=>import("../workshop/CodeBlock").then(module=>({default:module.CodeBlock})));
const rootFiles=["settings","build","wrapper"];
const configFolder=`${commandPath}/src/main/resources`;

// The URL is the source of truth for profile selection, including Back/Forward.
function ProfileChoice({profile,onChange}: {profile:PracticeContext["profile"];onChange:(value:PracticeContext["profile"])=>void}) {
  return <fieldset className="practice-profile"><legend>Profile trong mô hình học</legend>
    <label><input type="radio" name="practice-profile" checked={profile==="base"} onChange={()=>onChange("base")}/>Không chỉ định profile</label>
    <label><input type="radio" name="practice-profile" checked={profile==="dev"} onChange={()=>onChange("dev")}/>Chọn dev trong bài thực hành</label>
  </fieldset>;
}
export function ProjectPractice({openMachineGuide,navigationReady}: {openMachineGuide:(step?:string)=>void; navigationReady:boolean}) {
  const location=useLocation();
  const navigate=useNavigate();
  const [progress,setProgress]=useState(readPracticeProgress);
  const context=parsePractice(location.search,progress);
  const serialized=practiceSearch(location.search,context);
  const practiceReady=navigationReady&&serialized===location.search.replace(/^\?/,"");
  const task=practiceTasks.find(task=>task.id===context.task)!;
  const index=visiblePracticeTasks.findIndex(item=>item.id===task.id);
  const module=practiceSource.modulePaths.find(module=>module.line===context.moduleLine)!;
  const advanced=isRuntimeTask(context.task);
  const finalTask=["startup","verify","summary"].includes(context.task);
  const focused=["build-task","run-config","startup","verify","summary"].includes(context.task);
  const files=practiceFiles(context.task);
  const file=files.find(file=>file.id===context.file);
  const target=practiceSource.cloneTargets.find(target=>target.path===module.repoPath);
  const [message,setMessage]=useState("");
  const [warning,setWarning]=useState("");
  const [hintPath,setHintPath]=useState("");
  const workspace=useRef<HTMLElement>(null);
  const revealFile=useRef(false);
  const pendingHint=useRef<{path:string;line:number}|null>(null);
  const latest=useRef(context); latest.current=context;
  const mainRevealKey=useRef("");
  useEffect(()=>{
    if(!["run-config","startup","verify","summary"].includes(context.task)||context.file!=="main"){mainRevealKey.current="";return;}
    if(!practiceReady||mainRevealKey.current===`${context.task}:${context.file}`)return;
    mainRevealKey.current=`${context.task}:${context.file}`;
    const frame=requestAnimationFrame(()=>{
      const tree=workspace.current?.querySelector<HTMLElement>(".practice-tree");
      const target=tree?.querySelector<HTMLElement>('[data-run-main-selected="true"]');
      if(tree&&target){tree.scrollTop+=target.getBoundingClientRect().top-tree.getBoundingClientRect().top-tree.clientHeight/2+target.clientHeight/2;if(!(context.task==="startup"&&context.runSection==="results"))target.focus({preventScroll:true});}
    });
    return()=>cancelAnimationFrame(frame);
  },[context.task,context.file,practiceReady]);
  useEffect(()=>{
    if (navigationReady&&serialized!==location.search.replace(/^\?/,"")) navigate({search:serialized},{replace:true});
  },[navigationReady,serialized,location.search,navigate]);
  useEffect(()=>{
    const value=latest.current;
    setProgress(previous=>({...previous,current:value.task,contexts:{...previous.contexts,[value.task]:value}}));
    setMessage(""); setHintPath("");
    const hint=pendingHint.current;
    if (hint) {
      pendingHint.current=null;
      const frame=requestAnimationFrame(()=>{
        setHintPath(hint.path);
        if(!hint.path) {
          workspace.current?.querySelector<HTMLElement>(".runtime-activity button:not(:disabled), .runtime-activity select:not(:disabled)")?.focus();
          setMessage("Vùng thao tác ở giữa: chọn giá trị hoặc nút được chỉ để nhận kết quả trong bài.");
          return;
        }
        const opened=practiceFiles(value.task).find(file=>file.id===value.file);
        if (hint.line&&opened?.path===hint.path) {
          workspace.current?.querySelector<HTMLButtonElement>(`.practice-viewer button[aria-label="Chọn dòng ${hint.line}"]`)?.focus();
        } else {
          [...(workspace.current?.querySelectorAll<HTMLButtonElement>("[data-practice-path]")??[])].find(element=>element.dataset.practicePath===hint.path)?.focus();
        }
        setMessage(hint.line?`Vị trí cần nhìn: ${hint.path}, dòng ${hint.line}. Bấm dòng đó để đối chiếu.`:`Đã chỉ ${hint.path} trong cây. Bấm để mở.`);
      });
      return ()=>cancelAnimationFrame(frame);
    }
  },[location.key]);
  useEffect(()=>{
    const nav=workspace.current?.querySelector<HTMLElement>(".practice-task-nav");
    const current=nav?.querySelector<HTMLElement>("[aria-current]");
    if(nav&&current) nav.scrollLeft=current.offsetLeft-nav.offsetLeft-nav.clientWidth/2+current.clientWidth/2;
  },[context.task,practiceReady]);
  useEffect(()=>{
    try { localStorage.setItem(PRACTICE_KEY,JSON.stringify(progress)); setWarning(""); }
    catch { setWarning("Bài thực hành đang giữ trong phiên này; trình duyệt chưa lưu được tiến độ."); }
  },[progress]);
  useEffect(()=>{
    if (!revealFile.current) return;
    revealFile.current=false;
    workspace.current?.querySelector<HTMLElement>(".practice-viewer")?.scrollIntoView({block:"start"});
  },[location.key]);
  function change(patch:Partial<PracticeContext>,replace=false) {
    const next=normalizeContext({...context,...patch});
    navigate({search:practiceSearch(location.search,next)},{replace});
  }
  function observed(key:string,complete?:PracticeTask) {
    startTransition(()=>setProgress(previous=>({...previous,seen:[...new Set([...previous.seen,key])],completed:complete?[...new Set([...previous.completed,complete])]:previous.completed})));
  }
  function chooseTask(id:PracticeTask,patch:Partial<PracticeContext>={}) {
    const saved=progress.contexts[id];
    const carry={sim:{...context.sim,notice:"" as const},...(isRuntimeTask(id)&&!saved?{file:context.file,line:context.line,expanded:context.expanded,folder:context.folder,profile:context.profile}:{})};
    if(id==="build-task"&&!saved)carry.expanded=[...new Set([...context.expanded,...parents(commandPath),commandPath])];
    change({...saved??defaultContext(id),...(saved?{}:{moduleLine:["command","profile"].includes(id)?commandModule.line:context.moduleLine}),...carry,...patch,task:id});
  }
  function selectFile(id:string,requestedLine?:number) {
    if(id==="artifact") {
      change({file:id,line:0,view:"source",folder:"",expanded:[...new Set([...context.expanded,...parents(runtimeSource.artifact.path)])],sim:{...context.sim,artifactSeen:true}});
      if(hasJar(context.sim)) observed("build-task:artifact","build-task");
      return;
    }
    const opened=files.find(file=>file.id===id)!;
    if(context.task==="run-config"&&id==="main"){
      change({file:id,line:requestedLine??27,view:"activity",folder:"",expanded:[...new Set([...context.expanded,...parents(opened.path)])],sim:{...context.sim,runSetup:{...context.sim.runSetup,step:"inspect",applied:false}}});
      return;
    }
    const line=requestedLine??(id==="settings"?1:id==="build"?48:id==="wrapper"?20:id==="clone"?(target?.line??1):id==="default"||id==="dev"?33:opened.rows[0].line);
    revealFile.current=advanced||window.matchMedia("(max-width: 900px)").matches;
    change({file:id,line,view:"source",folder:"",expanded:[...new Set([...context.expanded,...parents(opened.path)])]});
    if (context.task==="root"&&rootFiles.includes(id)) {
      const seen=[...progress.seen,`root:${id}`];
      observed(`root:${id}`,rootFiles.every(file=>seen.includes(`root:${file}`))?"root":undefined);
    }
    if (context.task==="command"&&(id==="default"||id==="dev")) {
      const other=id==="default"?"dev":"default";
      observed(`command:${id}`,progress.seen.includes(`command:${other}`)?"command":undefined);
    }
  }
  function selectLine(line:number) {
    if(advanced) {
      const action=runtimeLine(context,context.file,line);
      change({line,sim:action.sim});
      if(action.complete) observed(`${action.complete}:line`,action.complete);
      return;
    }
    const included=file?.id==="settings"?practiceSource.modulePaths.find(item=>item.line===line):undefined;
    if (included) {
      change({line,moduleLine:line,folder:""});
    } else change({line});
    if (context.task==="script"&&file?.id==="clone"&&line===target?.line) observed(`script:${module.repoPath}`,"script");
  }
  function selectFolder(path:string) {
    const expanded=context.expanded.includes(path)?context.expanded.filter(value=>value!==path):[...context.expanded,path];
    change({folder:path,expanded,...(context.task==="build-task"&&practiceSource.modulePaths.some(item=>item.path===path)?{sim:{...context.sim,moduleSelected:path===commandPath,notice:"" as const}}:{})});
    if (context.task==="missing"&&path===module.path) observed(`missing:${module.path}`,"missing");
    if (context.task==="after"&&context.phase==="after"&&path===commandPath) observed("after:agent-service","after");
  }
  function locateModule() {
    change({folder:module.path,expanded:[...new Set([...context.expanded,...parents(module.path),module.path])]});
    observed(`missing:${module.path}`,"missing");
  }
  function findSource() {
    if (!target) { setMessage("git-cmd.sh không có target cho Swagger. Cần maintainer xác nhận remote/quyền và cách lấy riêng; không đổi sang script sale-system để lấp chỗ thiếu. Bạn có thể chọn lại Command ở dòng 30."); return; }
    chooseTask("script",{file:"clone",line:target.line,phase:"before",folder:"",moduleLine:module.line});
  }
  function showAfter() { chooseTask("after",{phase:"after",file:"settings",line:module.line,moduleLine:module.line,folder:"",expanded:["workspaces","workspaces/2-infrastructure","workspaces/agent-service"]}); }
  function hint() {
    if(context.task==="ide") { change({view:"activity",sim:{...context.sim,ideHint:true}},true); requestAnimationFrame(()=>workspace.current?.querySelector<HTMLElement>(`[data-ide-action="${context.sim.ideStep}"]`)?.focus()); return; }
    if(context.task==="connections") { const item=runtimeSource.connections.find(c=>c.id===context.sim.dependency)??runtimeSource.connections[0]; change({view:"activity",sim:{...context.sim,dependency:item.id as typeof context.sim.dependency}},true); return; }
    const artifactHint=context.task==="build-task"&&hasJar(context.sim)&&!context.sim.artifactSeen;
    if(advanced&&(!["java","connections","run-config"].includes(context.task)||(context.task==="run-config"&&context.sim.mainSelected))&&!(context.task==="build-task"&&!context.sim.moduleSelected)&&!artifactHint) {
      pendingHint.current={path:"",line:0};
      change({view:"activity"},true);
      return;
    }
    let path="settings.gradle";
    let line=0;
    if (context.task==="root") path=practiceSource.files.find(file=>file.id===(rootFiles.find(id=>!progress.seen.includes(`root:${id}`))??"settings"))!.path;
    if (context.task==="missing") { path="settings.gradle"; line=commandModule.line; }
    if (context.task==="script") { path="git-cmd.sh"; line=target?.line??0; }
    if (context.task==="after") path="workspaces/agent-service";
    if (context.task==="command") path=`${configFolder}/${progress.seen.includes("command:default")?"application-dev.yml":"application.yml"}`;
    if (context.task==="profile") path=`${configFolder}/application-dev.yml`;
    if(context.task==="java") {path="build.gradle";line=48;}
    if(context.task==="build-task") path=commandPath;
    if(artifactHint) path=runtimeSource.artifact.path;
    if(context.task==="run-config") {path=runtimeSource.files.find(file=>file.id==="main")!.path;line=27;}

    const expanded=[...new Set([...context.expanded,...parents(path)])];
    pendingHint.current={path,line};
    change({expanded,...(advanced?{view:"source" as const}:{})},true);
  }
  function resetTask() {
    const taskId=context.task;
    setProgress(previous=>({...previous,completed:previous.completed.filter(id=>id!==taskId&&!(taskId==="startup"&&id==="verify")),seen:previous.seen.filter(key=>!key.startsWith(taskId+":")&&!(taskId==="startup"&&key.startsWith("verify:")))}));
    change({...defaultContext(taskId),...(taskId==="after"?{phase:"before" as const}: {}),...(advanced?{profile:context.profile,sim:resetSimulation(taskId,context.sim)}:{})});
  }
  const selectedDeclaration=file?.id==="settings"&&practiceSource.modulePaths.some(item=>item.line===context.line);
  const missingSeen=progress.seen.includes(`missing:${module.path}`);
  const scriptSeen=progress.seen.includes(`script:${module.repoPath}`)&&file?.id==="clone"&&context.line===target?.line;
  const canNext=advanced?runtimeCanNext(context,progress.seen):context.task==="root"?rootFiles.every(id=>progress.seen.includes(`root:${id}`)):context.task==="missing"?missingSeen:context.task==="script"?scriptSeen:progress.completed.includes(context.task);
  function next() {
    if (context.task==="missing") findSource();
    else if (context.task==="script") showAfter();
    else if (index<visiblePracticeTasks.length-1) {
      const nextTask=visiblePracticeTasks[index+1].id;
      chooseTask(nextTask,isRuntimeTask(nextTask)?{profile:context.profile,sim:{...context.sim,notice:""}}:{});
    }
  }
  function feedback():string {
    if(advanced) {
      if(context.task==="startup"&&context.sim.notice==="run-ok") {
        if(context.sim.logLine==="profile") return "Dòng profile xác nhận dev trong log mô phỏng. Điều này không tự chứng minh mọi kết nối đều local.";
        if(context.sim.logLine==="started") return "Started AgentCommandServiceApplication cho biết process trong ví dụ đã boot. Chưa có response HTTP hoặc kết quả nghiệp vụ.";
        if(context.sim.logLine==="port") return "Dòng Tomcat cho thấy port 9901 được dùng trong ví dụ. Port lắng nghe chưa chứng minh API hoặc nghiệp vụ hoạt động.";
      }
      if(context.task==="ide") return context.sim.ideLast?ideActions[context.sim.ideLast]?.result??runtimeFeedback(context.sim):"Mở menu File để bắt đầu. Chỉ vị trí giúp tìm thao tác hiện tại, không tự thực hiện.";
      if(context.sim.notice) return runtimeFeedback(context.sim);
      if(context.task==="java"&&file?.id==="build") return context.line===48?"JavaLanguageVersion.of(21) yêu cầu toolchain 21. Tiếp theo đối chiếu Java/Gradle trong tình huống học.":"Bạn đang đọc build.gradle; chọn khai báo Java toolchain ở dòng 48 để xác định yêu cầu.";
      if(context.task==="connections"&&(context.sim.connectionModule!=="command"||context.sim.connectionProfile==="test"))return "Module/profile đang chọn chưa có bài thực hành G1. Không lấy cấu hình Command để suy ra dependency cho phạm vi đó.";
      if(context.task==="connections"&&context.sim.dependency) {
        const item=runtimeSource.connections.find(item=>item.id===context.sim.dependency)!;
        return file?.id==="compose"?context.line===item.portLine?`${item.service}: host ${item.hostPort} → container ${item.containerPort}. Đây là mapping trong file, chưa chứng minh dependency hoặc máy thật hoạt động.`:`Dòng ${context.line} chưa phải mapping port của ${item.service}. Chọn dòng ${item.portLine} để đối chiếu.`:`Đang đối chiếu ${item.name}: Java, Compose và container cùng hiển thị. Chọn dòng ${item.portLine} trong vùng Compose để ghi nhận mapping.`;
      }
      if(context.task==="run-config") return context.profile==="dev"?"dev chọn datasource localhost trong mô hình; Redis/RabbitMQ vẫn cần kiểm tra và còn API ngoài. Chọn đúng main class trước khi chạy thử.":"Không chỉ định profile sẽ dùng datasource remote từ file gốc trong mô hình. Đối chiếu Active profiles và override trước khi chạy trên máy thật.";
      return runtimeFeedback(context.sim);
    }
    if (context.task==="root") {
      if (file?.id==="settings") return "rootProject.name là agent-workspaces; include khai báo các module dưới workspaces. Khai báo chưa chứng minh source đã tồn tại.";
      if (file?.id==="build") return "build.gradle chọn Gradle 8.14.3 và toolchain Java 21. Đây là yêu cầu trong file, chưa phải Java đang chạy trên máy bạn.";
      if (file?.id==="wrapper") return "gradlew.bat là điểm gọi Gradle trên Windows. Nó không tự bổ sung source của repo con.";
      if (file) return "File này cũng thuộc phần workspace được trích. Để nhận diện root, hãy xem thêm settings.gradle, build.gradle và gradlew.bat.";
      return "Chọn một file trong cây để bắt đầu quan sát project.";
    }
    if (context.task==="missing") return missingSeen?`${module.path} ${context.phase==="before"?"chưa có source ở trạng thái ban đầu":"được đối chiếu trong trạng thái sau"}. Clone repo cha chưa đảm bảo có code của module được include.`:selectedDeclaration?`Dòng ${module.line} khai báo module. Dấu : ánh xạ thành /; hãy đến đường dẫn tương ứng để xem source có hay chưa.`:"Chọn dòng include trong settings.gradle. Bạn có thể thử module khác; Command nằm ở dòng 30.";
    if (context.task==="script") {
      if (file?.id==="alternate") return "init-shared.sh còn target thuộc sale-system và nhóm khác. Trùng tên thư mục chưa đủ: script được chọn theo báo cáo S02 là git-cmd.sh của agent-system.";
      if (scriptSeen) return `Dòng ${target?.line} lấy repo nhóm agent-system vào ${target?.path}; module ${module.path.split("/").at(-1)} nằm bên trong repo con đó. Không có exact invocation lịch sử để tái hiện.`;
      if (file?.id==="clone"&&context.line&&context.line!==target?.line) return `Dòng ${context.line} trỏ đến ${practiceSource.cloneTargets.find(item=>item.line===context.line)?.path??"một target khác"}; module đang đối chiếu cần repo ${module.repoPath??module.path}. Bạn có thể chọn lại dòng ${target?.line??"phù hợp"}.`;
      return `Tìm target ${module.repoPath??module.path} trong git-cmd.sh, rồi chọn số dòng bên cạnh để nối khai báo với cách lấy source.`;
    }
    if (context.task==="after") return context.phase==="after"?"10 repo con xuất hiện theo S03; source Command đã có. Swagger vẫn thiếu: settings.gradle khai báo nó nhưng git-cmd.sh không có target tương ứng.":"Bạn đã quay về trạng thái trước. Dùng nút xem sau để tái hiện lại thay đổi trong bài học.";
    if (context.task==="command") {
      if (file?.id==="default") return "application.yml: port 9901, datasource PostgreSQL remote đã che. Đây là cấu hình nền khi chưa có profile/override khác.";
      if (file?.id==="dev") return "application-dev.yml: cùng port 9901, datasource localhost/DB alpaca-event. File có hậu tố dev chưa tự kích hoạt profile dev.";
      return "Command là module ứng dụng ghi dữ liệu. Mở src/main/resources để tìm cặp cấu hình gốc và dev.";
    }
    return context.profile==="dev"?"Trong mô hình chỉ xét hai file, dev ghi đè datasource sang localhost; port vẫn 9901.":"Không chọn profile: mô hình dùng datasource remote trong application.yml. application-dev.yml chưa được áp dụng; hãy đối chiếu lại dòng 33 ở hai file.";
  }
  const comparison=[module,practiceSource.modulePaths.find(item=>item.line===2)!,swaggerModule].filter((item,i,all)=>all.findIndex(other=>other.path===item.path)===i);
  const result=message||feedback();
  function viewer(id:string,compare=false) {
    const item=files.find(file=>file.id===id)!;
    const focus=compare?(context.file===id&&context.line?context.line:33):context.line||item.rows[0].line;
    return <div className={`practice-file-panel ${compare?"is-comparison":""}`} key={id}>
      <div className="practice-file-heading"><FileCode2 size={16}/><b>{item.path.split("/").at(-1)}</b><span>{compare?id==="dev"?"profile dev":"cấu hình gốc":`dòng ${focus}`}</span></div>
      <div className="practice-code"><Suspense fallback={<p>Đang mở source…</p>}><CodeBlock path={item.path} rows={sourceRows(id,context.task)} range={{name:"Đoạn đang đối chiếu",qualified:`practice:${id}`,start:focus,end:focus}} highlights={(id==="default"||id==="dev")?[{range:{name:"Port",qualified:`${id}:port`,start:2,end:3},purpose:"related"},{range:{name:"Datasource",qualified:`${id}:db`,start:31,end:45},purpose:"primary"},{range:{name:"Chế độ local",qualified:`${id}:local`,start:94,end:95},purpose:"related"},...(advanced?[{range:{name:"Kết nối được chọn",qualified:`${id}:connection`,start:focus,end:focus},purpose:"primary" as const}]:[])]:id==="build"?[{range:{name:"Gradle Wrapper",qualified:"build:wrapper",start:20,end:22},purpose:"related"},{range:{name:"Java toolchain",qualified:"build:java",start:46,end:50},purpose:"primary"}]:undefined} jump={focus} targetKey={`${context.task}:${id}:${focus}`} preferTarget memoryKey={`practice:${context.task}:${id}`} onLineSelect={line=>{ if (compare) change({file:id,line}); else selectLine(line); }}/></Suspense></div>
    </div>;
  }
  const sourceView=<div className="practice-viewer" aria-label="Source project đã che">{context.file==="artifact"?<RuntimeArtifact sim={context.sim} compact={context.task==="build-task"}/>:context.task==="profile"?<div className="practice-compare">{viewer("default",true)}{viewer("dev",true)}</div>:file?<>{viewer(file.id)}<div className="practice-file-path">{file.path}</div></>:<div className="practice-viewer-empty"><FileCode2 size={34}/><h3>{context.task==="command"?"Đi vào module Command":"Mở một file trong cây project"}</h3><p>{context.task==="command"?"workspaces → agent-service → 1-agent-command-service → src → main → resources":advanced?"Chọn file theo nhiệm vụ bên cạnh; có thể dùng Chỉ vị trí.":"Bắt đầu với settings.gradle. Source sẽ hiện tại đây, giữ nguyên số dòng gốc."}</p></div>}</div>;
  if (!practiceReady) return <p className="practice-loading" role="status">Đang mở vị trí trong project…</p>;
  return <section className="project-practice" ref={workspace} aria-label="Thực hành trên project tái dựng">
    <div className="practice-intro"><div><strong>Thực hành trên project</strong><p>Tái dựng theo báo cáo · Không có snapshot nguyên bản đầy đủ</p></div><span>{visiblePracticeTasks.filter(item=>progress.completed.includes(item.id)).length}/{visiblePracticeTasks.length} nhiệm vụ trong bài</span></div>
    <nav className="practice-task-nav" aria-label="Hành trình thực hành A–J">{visiblePracticeTasks.map(value=><button key={value.id} aria-label={`${value.letter} ${value.label}`} aria-current={value.id===context.task?"step":undefined} onClick={()=>chooseTask(value.id)}><span>{progress.completed.includes(value.id)?<Check size={14}/>:value.letter}</span>{value.label}</button>)}</nav>
    <div className="practice-scope"><b>{advanced?"Mô phỏng tương tác":"Chỉ trong ứng dụng học"}</b><span>Cây và cấu hình bên dưới không đọc/điều khiển IntelliJ, không clone hay chạy dịch vụ.</span></div>
    {advanced&&!focused&&<InfrastructurePanel sim={context.sim} update={patch=>change({sim:{...context.sim,...patch}})}/>}
    <PracticeWorkbench resizable={context.task==="run-config"||finalTask} className={`practice-workbench ${finalTask?"command-focus":""} ${context.task==="run-config"?"run-config-focus":""} ${context.task==="build-task"?"build-focus":""} ${advanced&&context.view==="activity"&&["ide","connections","daemon","conflict"].includes(context.task)?"runtime-focus":""} ${advanced&&context.view==="activity"&&["build-task","run-config","startup"].includes(context.task)?"execution-focus":""}`}>
      <aside className="practice-project"><div className="practice-pane-title">PROJECT <span>{context.phase==="before"?"Trước lấy source":"Sau lấy source · tái dựng"}</span></div><PracticeTree context={context} hintPath={hintPath} onFile={selectFile} onFolder={selectFolder}/><p className="practice-tree-note">{context.task==="build-task"?"build là nơi công cụ đặt kết quả; bạn không cần tự tạo.":"Chỉ hiện phần cây cần cho bài. “Thiếu” là vị trí được khai báo nhưng chưa có trong trạng thái học."}</p></aside>
      <div className="practice-center">
        {advanced&&context.task!=="run-config"&&!finalTask&&<div className="runtime-view-tabs" aria-label="Vùng thao tác"><button aria-pressed={context.view==="activity"} onClick={()=>change({view:"activity"})}>Thao tác và kết quả</button><button aria-pressed={context.view==="source"} onClick={()=>change({view:"source"})}>Source đang mở{file?` · ${file.path.split("/").at(-1)}:${context.line}`:""}</button></div>}
        {context.task!=="run-config"&&!finalTask&&(!advanced||context.view==="source")&&sourceView}
        {["missing","script","after"].includes(context.task)&&<div className="practice-mapping"><h3>Khai báo ↔ thư mục source</h3><div className="practice-table-scroll"><table><thead><tr><th>Được khai báo</th><th>Đường dẫn cần có</th><th>Trạng thái trong bài</th></tr></thead><tbody>{comparison.map(item=><tr key={item.path} className={item.line===module.line?"is-current":""}><td><button onClick={()=>change({file:"settings",line:item.line,moduleLine:item.line,folder:""})}>include · dòng {item.line}</button></td><td>{item.path}</td><td><b className={context.phase==="after"&&item.reportedAfter?"practice-present":"practice-absent"}>{context.phase==="after"&&item.reportedAfter?"Có source":"Thiếu source"}</b></td></tr>)}</tbody></table></div><p>{context.phase==="after"?"Theo S03: 10 repo con đã có; Swagger vẫn thiếu. Không tự hoàn tất mọi mục.":"Theo S00: source repo con chưa có dù settings.gradle đã khai báo."}</p></div>}
        {advanced&&context.sim.surveyOrigin&&!finalTask&&!["connections","build-task"].includes(context.task)&&<div className="survey-return"><button className="text-button" onClick={()=>chooseTask("connections",{view:"activity"})}>Quay lại khảo sát dependency</button></div>}
        {advanced&&<RuntimePractice context={context} change={change} observe={observed} open={selectFile} resetBuild={resetTask}/>}
        {finalTask&&context.view==="source"&&<details open className="command-source-details"><summary>Source đang mở · {context.file==="artifact"?"JAR":file?.path.split("/").at(-1)}</summary>{sourceView}</details>}
        {focused?(finalTask?null:<div className="build-lesson-tools"><button className="text-button" onClick={()=>chooseTask(visiblePracticeTasks[index-1].id)}><ArrowLeft size={16}/>Quay lại nhiệm vụ trước</button></div>):<details className="practice-provenance"><summary>Nguồn, phiên bản và giới hạn đoạn trích</summary><p>{advanced?runtimeSource.limits:practiceSource.limits}</p><p>Báo cáo: {practiceSource.report.path} · {practiceSource.report.date} · {advanced?"S01/S04–S13/S17":"S00/S02/S03/S17"}. Trích source lúc {advanced?runtimeSource.extractedAt:practiceSource.extractedAt} (UTC).</p>{(file?[file]:files.filter(file=>file.id==="default"||file.id==="dev")).map(item=><div key={item.id}><b>{item.sourceRoot}/{item.path}</b><p>Commit: {item.revision??"chưa xác định"}<br/>SHA-256: {item.sourceSha256}<br/>Mtime file: {item.lastModified}</p></div>)}<p>Giữ số dòng gốc; ⋯ là đoạn không trích. URL Git, connection string và credential đã che. Đoạn clone không dùng để sao chép chạy; lịch sử không giữ invocation nguyên văn.</p></details>}
      </div>
      {!focused&&<aside className="practice-task-panel" aria-label="Nhiệm vụ hiện tại"><div className="practice-task-heading"><span>NHIỆM VỤ {task.letter}</span><h2>{task.title}</h2><p>{advanced?runtimeInstruction(context,task.instruction):task.instruction}</p></div>
        <div className="practice-task-tools"><button className="text-button" onClick={hint}><LocateFixed size={16}/>Chỉ vị trí</button><button className="text-button" onClick={resetTask}><RotateCcw size={15}/>{advanced?"Làm lại phần này":"Làm lại bước"}</button>{advanced&&<button className="text-button" onClick={()=>change({sim:{...context.sim,notice:"",...(context.sim.process==="error"?{process:"idle" as const}:{}),...(context.sim.build==="root-error"||context.sim.build==="jdk-error"?{build:"none" as const}:{}),...(context.sim.conflict==="delete"||context.sim.conflict==="all"?{conflict:"none" as const}:{})}})}>Thử lại</button>}</div>
        {context.task==="root"&&<div className="practice-root-seen">{rootFiles.map(id=><span key={id} className={progress.seen.includes(`root:${id}`)?"seen":""}>{progress.seen.includes(`root:${id}`)?"✓":"○"} {practiceSource.files.find(file=>file.id===id)!.path}</span>)}</div>}
        {context.task==="missing"&&selectedDeclaration&&!missingSeen&&<button className="button primary" onClick={locateModule}>Đến thư mục trong cây<ArrowRight size={16}/></button>}
        {context.task==="after"&&context.phase==="before"&&<button className="button primary" onClick={showAfter}>Xem trạng thái sau khi lấy source</button>}
        {context.task==="profile"&&<ProfileChoice profile={context.profile} onChange={profile=>{change({profile,...(profile==="dev"?{file:"dev",line:33}:{})});if(profile==="dev") observed("profile:dev","profile");}}/>}
        <div className="practice-feedback" role="status"><h3>{context.task==="profile"?"Kết quả cấu hình trong mô hình":"Quan sát và ý nghĩa"}</h3><p>{result}</p></div>
        {context.task==="profile"&&<><table className="practice-effective"><caption>Chỉ xét application.yml + profile</caption><tbody><tr><th>Port</th><td>9901 → 9901</td></tr><tr><th>Datasource</th><td>{context.profile==="dev"?"localhost · alpaca-event":"remote đã che"}</td></tr><tr><th>Schema</th><td>platform_event</td></tr><tr><th>alpaca.local</th><td>{context.profile==="dev"?"false (dev)":"true (file gốc hiện tại)"}</td></tr></tbody></table><p className="practice-limit">dev vẫn có API bên ngoài; startup có thể đổi schema. Chưa xác nhận override, DB và dependency trên máy thật.</p></>}
        {context.task!=="summary"&&<button className="button primary practice-next" disabled={!canNext} onClick={next}>{context.task==="missing"?"Tìm cách lấy source":context.task==="script"?"Xem trạng thái sau khi lấy source":context.task==="after"?"Đi vào module Command":context.task==="command"?"So sánh và chọn profile":context.task==="profile"?"Tiếp tục: Java và IDE":"Tiếp tục"}<ArrowRight size={16}/></button>}
        {context.task==="profile"&&context.profile==="dev"&&<div className="practice-finished"><Check size={18}/><span>Đã quan sát lựa chọn trong bài. Tiến độ kiểm tra máy thật không thay đổi.</span></div>}
        {index>0&&<button className="text-button practice-back" onClick={()=>chooseTask(visiblePracticeTasks[index-1].id)}><ArrowLeft size={16}/>Quay lại nhiệm vụ trước</button>}
        <details className="practice-real"><summary>Làm tương ứng trong IntelliJ thật</summary><p>{task.real}</p><b>Ứng dụng học không kiểm chứng thao tác này.</b></details>
        <details className="practice-evidence"><summary>Bằng chứng và phần chưa biết</summary><p>{advanced?"Báo cáo S04/S10/S11 ghi JDK 21, targeted build và process/port trong lịch sử; S12 ghi chênh IDE 17/21. Bảng, artifact xuất hiện và log ở đây là mô phỏng; không là transcript nguyên văn hoặc kiểm tra live. HTTP/auth/nghiệp vụ và override hiện tại vẫn chưa xác nhận.":context.task==="root"?"Các file gốc được đọc lại từ repo hiện tại. Báo cáo S00 chỉ xác nhận workspaces chưa có source con; không có snapshot cây đầy đủ ngay lúc clone.":context.task==="script"?"S02 chọn git-cmd.sh; S03 ghi người dùng đã chạy script nhưng không còn exact invocation. init-shared.sh chứa target của sale-system, không thay thế script agent-system.":context.task==="profile"||context.task==="command"?"S17 chỉ rõ Command cần dev cho datasource local, chưa xác nhận click-run trong IntelliJ. Đoạn trích ở đây là source hiện tại; nguồn override của máy thật chưa được đọc. Chỉ kết luận mô hình hai file.":"S00: source repo con chưa có. S03: các repo con xuất hiện, Swagger còn thiếu và không nằm trong target clone git-cmd.sh."}</p></details>
        {context.task==="profile"&&<button className="text-button" onClick={()=>openMachineGuide()}>Mở hướng dẫn trên máy thật<ArrowRight size={16}/></button>}
        {advanced&&<button className="text-button" onClick={()=>openMachineGuide(practiceStep(context.task))}>Mở hướng dẫn trên máy thật<ArrowRight size={16}/></button>}
      </aside>}
    </PracticeWorkbench>{warning&&<p role="status" className="guide-notice">{warning}</p>}
  </section>;
}
