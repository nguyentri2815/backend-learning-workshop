import {useEffect,useRef} from "react";
import {useSearchParams} from "react-router-dom";
import {ArrowLeft,ArrowRight,LocateFixed,RotateCcw} from "lucide-react";
import type {PracticeContext,PracticeTask} from "./project-practice-model";
import {commandPath} from "./project-practice-model";
import {CommandRunWindow} from "./CommandRunWindow";
import {ExecutionState} from "./ExecutionEvidence";
import {SurveySummary} from "./DependencySurvey";
import {ConflictSummary} from "./ConflictPractice";
import {advanceCommandSession,beginCommandSession,emptyCommandSession,logIds,missingCommandConditions,readCommandLog,stopCommandSession} from "./command-session-model";
import type {LogId} from "./command-session-model";
import type {Simulation} from "./practice-runtime-model";
import {RunMethodChoice} from "./CommandRunControls";
import {CommandLocalChecks} from "./CommandLocalChecks";
import {StartupPreflight} from "./StartupPreflight";
import {RealLogPractice} from "./RealLogPractice";
import {CommandCaseLibrary,CommandCaseInvestigation} from "./CommandCases";
import {emptyCommandCase,findCommandCase} from "./command-cases";
import type {CommandCaseState} from "./command-cases";
import type {StartupPlayback,StartupReference} from "./startup-log-model";
import "./command-run.css";
type Props={context:PracticeContext;change:(patch:Partial<PracticeContext>,replace?:boolean)=>void;observe:(key:string,complete?:PracticeTask)=>void;open:(id:string,line?:number)=>void;onRestart:()=>void};
export function RuntimeCommandLesson({context,change,observe,open,onRestart}:Props){
 const [params,setParams]=useSearchParams(),reading=params.get("readlog")==="1";
 function setReading(value:boolean){const next=new URLSearchParams(params);if(value)next.set("readlog","1");else next.delete("readlog");setParams(next,{replace:true});}
 const {sim:s,task}=context,session=s.commandSession,review=s.commandReview,p=session.playback,section=useRef<HTMLElement>(null),generation=useRef(0);
 const summary=task==="summary",results=context.runSection==="results",missing=missingCommandConditions(s,context.profile);
 const active=session.starting||p.playing||s.process==="running",item=findCommandCase(s.commandCase.id||p.caseId);
 const expected=logIds.find(id=>s.logSeen.includes(id)&&!review.checked.includes(id));
 const title=summary?"Chuẩn bị bắt đầu task":"Chạy Command và đọc kết quả";
 function update(patch:Partial<Simulation>,replace=false){change({sim:{...s,...patch}},replace);}
 function playback(patch:Partial<StartupPlayback>){generation.current++;update({commandSession:{...session,playback:{...p,...patch}}});}
 function go(next:PracticeTask){change({task:next,view:"activity",runSection:next==="verify"?"results":"run",sim:{...s,notice:""}});}
 function showResults(api=false){change({task:"startup",view:"activity",runSection:"results",sim:api?{...s,commandReview:{...review,focus:"api",portOpen:true}}:s});}
 function reference(reference:StartupReference){generation.current++;update({process:"idle",logSeen:[],logLine:"",commandCase:emptyCommandCase(),commandSession:{...emptyCommandSession(),id:session.id,playback:{...emptyCommandSession().playback,reference}}});}
 function selectCase(id:string){
  const item=findCommandCase(id);if(!item||active)return;generation.current++;
  change({task:"startup",view:"activity",runSection:"run",file:"main",sim:{...s,process:"idle",logSeen:[],logLine:"",commandReview:{...review,checked:[],httpSent:false,portChecked:false,errorOpen:false},commandCase:{...emptyCommandCase(),id,branch:item.branches[0].id},commandSession:{...emptyCommandSession(),id:session.id,playback:{...emptyCommandSession().playback,reference:item.origin==="recorded"?"recorded-failure":"configured",caseId:id,caseBranch:item.branches[0].id}}}});
 }
 function start(assumed=false){generation.current++;update(beginCommandSession(s,context.profile,assumed));}
 function stop(){generation.current++;update(stopCommandSession(s));if(session.shown===3)observe("startup:stop","startup");}
 function read(id:LogId){generation.current++;update(readCommandLog(s,id,true));if(new Set([...review.checked,id]).size===3)observe("verify:logs","startup");}
 function updateCase(commandCase:CommandCaseState){generation.current++;update({commandCase});}
 function retry(){generation.current++;if(item?.category==="after"&&s.process==="running")update({commandCase:{...s.commandCase,phase:"retry"},commandReview:{...review,httpSent:false},commandSession:{...session,playback:{...p,caseId:item.id,caseRepaired:true,caseBranch:s.commandCase.branch,playing:true,paused:false}}});else start();}
 function fixCondition(item:ReturnType<typeof missingCommandConditions>[number]){
  if(item.id==="engine"){update({daemon:true,desktopOpen:true,notice:"",execution:{...s.execution,last:"engine",lastService:""}});return;}
  if(item.id==="database"){
   if(s.daemon&&s.containers["postgres-write"]==="stopped"&&!s.dockerPortConflict){update({containers:{...s.containers,"postgres-write":"running"},readyEvidence:s.readyEvidence.filter(id=>id!=="postgres-write"),execution:{...s.execution,last:"container-start",lastService:"postgres-write"}});return;}
   change({task:"daemon",view:"activity",sim:{...s,containerSelected:"postgres-write",dockerInspected:Boolean(s.containers["postgres-write"]),...(s.composeService!=="postgres-write"?{composeService:"postgres-write",composePrepared:false,composeStage:"idle"}:{}),notice:""}});return;
  }
  if(item.task==="run-config"){change({task:"run-config",view:"activity",sim:{...s,runSetup:{...s.runSetup,step:"configuration",draftProfile:context.profile,applied:false},notice:""}});return;}
  if(item.task==="ide"){change({task:"ide",view:"activity",sim:{...s,ideStep:"sdk",notice:""}});return;}
  go(item.task);
 }
 useEffect(()=>{if(!p.playing||p.paused)return;const version=generation.current;const timer=window.setTimeout(()=>{if(version===generation.current)update(advanceCommandSession(s),true);},180);return()=>window.clearTimeout(timer);},[p.playing,p.frame,p.paused,s,change]);
 useEffect(()=>{if(summary||!results)return;const frame=requestAnimationFrame(()=>{const target=section.current?.querySelector<HTMLElement>(".command-results");target?.focus({preventScroll:true});target?.scrollIntoView({block:"start"});});return()=>cancelAnimationFrame(frame);},[results,summary]);
 function locate(){const target=section.current?.querySelector<HTMLElement>(summary?".task-start-card button":results?".command-results button:not(:disabled)":p.playing?".startup-controls button":s.process==="running"?"[data-command-action=stop]":"[data-command-action=run]");target?.focus({preventScroll:true});target?.scrollIntoView({block:"nearest"});}
 function back(){if(!summary&&results){change({runSection:"run"});return;}if(summary){showResults();return;}go("run-config");}
 const mission=summary?"Dùng thẻ để mở đúng vị trí, hoặc thực hành lại một vòng ngắn.":p.playing?p.paused?"Chọn nhóm để đọc log/source, rồi Tiếp tục khi sẵn sàng.":"Quan sát nhóm hoạt động sáng lên; có thể tạm dừng để đọc.":s.process==="error"&&p.frame?"Đọc dấu hiệu trong log, rồi Tìm nguyên nhân để kiểm tra và thử lại.":s.process==="running"?"Đọc kết quả; kiểm tra đúng process/port trước khi thử HTTP.":s.process==="stopped"?"Process bài học đã dừng; source/JAR và dịch vụ Docker vẫn giữ nguyên.":"Chọn tình huống, rồi bấm Run cạnh main hoặc Enter lệnh Terminal.";
 return <section ref={section} className="runtime-activity command-lesson" aria-label={title}>
  <header className="command-lesson-heading"><span>BƯỚC {summary?"J2":"I2"}</span><h2>{title}</h2></header>
  {!summary&&<div className="real-log-entry"><p><b>Run ra nhiều log?</b><br/>Tập tìm kết quả và lần lỗi Redis bằng phiên thật ngày 07/11, rồi đối chiếu phiên thành công.</p><button type="button" className="button primary" onClick={()=>setReading(true)}>Tập đọc log thật</button></div>}
  {!summary&&!reading&&<><StartupPreflight/><RunMethodChoice mode={s.runMode} disabled={active} onChange={runMode=>update({runMode})}/></>}
  {(!reading||summary)&&<><div className="ide-mission command-mission"><p>{mission}</p></div>
  <div className="command-lesson-tools"><button className="text-button" onClick={locate}><LocateFixed size={15}/>Chỉ vị trí</button><button className="text-button" onClick={back}><ArrowLeft size={15}/>Quay lại</button><button className="text-button" onClick={()=>{generation.current++;onRestart();}}><RotateCcw size={15}/>Làm lại phần này</button></div></>}
  {summary?<div className="task-start-card">
   <dl><dt>Module đang làm</dt><dd><b>Command</b><button className="text-button" onClick={()=>open("main",26)}>Mở main class</button></dd><dt>Cách chạy / profile</dt><dd>{s.runMode==="intellij"?"IntelliJ":"Terminal · bootRun"} / {session.id?(s.launchProfile==="dev"?"dev":"default của phiên tham chiếu"):context.profile}<button className="text-button" onClick={()=>go("run-config")}>Mở cấu hình</button></dd><dt>Nơi xem log</dt><dd>{s.launchMode==="intellij"?"Run · Command":"Terminal giữ bootRun"}<button className="text-button" onClick={()=>showResults()}>{session.id?`Xem log lần chạy #${session.id}`:"Mở cửa sổ Run"}</button></dd><dt>Dừng và chạy lại</dt><dd>Stop trong Run; Run tạo lần chạy mới.<button className="text-button" onClick={()=>go("startup")}>Mở Run / Stop</button></dd><dt>Cần xác nhận</dt><dd>Môi trường máy thật, nguồn override, DB/schema và từng dependency/API vẫn cần kiểm chứng.<button className="text-button" onClick={()=>showResults(true)}>Xem giới hạn kiểm tra API</button></dd></dl>
   {active&&<p className="command-context-note">Dừng lần chạy tại Run/Stop trước khi thực hành lại cấu hình.</p>}
   <button className="button primary" disabled={active} onClick={()=>change({task:"run-config",view:"activity",sim:{...s,taskPractice:{phase:"configuration",practiced:false},runSetup:{...s.runSetup,step:"configuration",draftProfile:context.profile,applied:false}}})}>Thực hành lại: cấu hình → Run → log → Stop</button>
   {s.taskPractice.phase==="done"&&<p className="task-cycle-done">Đã hoàn tất vòng thực hành trong bài học.</p>}
   <button className="button secondary" disabled={!(s.taskPractice.phase==="done"||s.process==="stopped"&&session.shown===3)} onClick={()=>{update({taskPractice:{...s.taskPractice,practiced:true}});observe("summary:practiced","summary");}}>Đã thực hành</button>{s.taskPractice.practiced&&<p role="status">Đã lưu tiến độ thực hành.</p>}
  </div>:<>
   <CommandRunWindow context={context} logPractice={reading?<RealLogPractice onClose={()=>setReading(false)} onComplete={()=>observe("startup:real-log")}/>:undefined} expected={expected} onRun={()=>start()} onStop={stop} onLog={read} onErrorRead={()=>update({commandReview:{...review,errorRead:true}})} onConfigure={()=>change({task:"run-config",view:"activity",sim:{...s,runSetup:{...s.runSetup,step:"configuration",draftProfile:context.profile,applied:false}}})} onTerminal={()=>update({runSetup:{...s.runSetup,terminalOpen:true}})} onRepair={()=>start(session.assumed)} onPlayback={playback} onReference={reference} onNextGroup={()=>{generation.current++;update(advanceCommandSession(s,true));}} caseLibrary={<CommandCaseLibrary selected={s.commandCase.id} disabled={active} onSelect={selectCase}/>}>
    <section className="command-results" tabIndex={-1} aria-label="Kết quả của cùng phiên Run">
     <h3>Kết quả lần Run{session.id?` #${session.id}`:""}</h3>
     {s.process==="running"&&<p className="command-context-note">Command chạy trong JVM của lần Run này; không tự trở thành container Docker.</p>}
     {!session.selected&&<p>{!session.id?"Chưa có lần Run. Bấm tam giác cạnh main để bắt đầu.":p.playing?"Log đang phát; kết luận chỉ tới các dòng đã xuất hiện.":s.process==="stopped"?"Lần chạy đã dừng; log cũ được giữ, process hiện không còn lắng nghe trong bài.":s.process==="error"?"Lần thử chưa khởi động thành công. Đọc exception cụ thể bên dưới lỗi dây chuyền; không mặc định sửa main:27.":session.shown===3?"Có Started trong tình huống học; chưa chứng minh mọi API/nghiệp vụ hoạt động đúng.":"Chưa có Started; đối chiếu điều kiện kỹ thuật hoặc log đã xuất hiện."}</p>}
     {session.selected&&<p className="command-evidence-note" role="status">{session.selected==="profile"?`Profile của lần chạy này: ${s.launchProfile==="dev"?"dev":"default trong phiên tham chiếu/case"}. Tên Run Configuration không thay cho dòng profile.`:session.selected==="port"?`Log ghi port ${session.port}; kiểm tra process sở hữu port hiện tại trước khi suy ra HTTP.`:"Started xác nhận mức startup đã ghi nhận; chưa chứng minh API hoặc nghiệp vụ đúng."}{s.process==="stopped"?" Process hiện đã dừng.":""}</p>}
     <CommandCaseInvestigation context={context} update={updateCase} onRetry={retry} onStop={stop}/>
     {session.shown===3||s.process==="stopped"?<CommandLocalChecks context={context} update={commandReview=>update({commandReview})}/>:<p>Kiểm tra HTTP chỉ xuất hiện sau khi startup tới Started. Bạn vẫn có thể hoàn thành bước học khi đã hiểu điểm lỗi.</p>}
    </section>
   </CommandRunWindow>
   {!reading&&missing.length>0&&!session.assumed&&!p.caseId&&p.reference==="configured"&&<div className="command-missing"><b>Điều kiện còn thiếu trong bài</b><ul>{missing.map(item=><li key={item.id} data-command-condition={item.id}>{item.text}<button className="text-button" disabled={active||item.id==="database"&&Boolean(s.containers["postgres-write"])&&!s.dockerPortConflict&&!s.daemon} onClick={()=>fixCondition(item)}>{item.action}</button></li>)}</ul><button className="button secondary" disabled={active} onClick={()=>start(true)}>Xem kịch bản: giả định điều kiện đã đáp ứng</button></div>}
   {!reading&&<div className="command-result-tools"><button type="button" className="button secondary" onClick={()=>showResults()}>Đọc kết quả của lần Run này</button><button className="button primary command-next" disabled={p.playing} onClick={()=>{observe("startup:results",session.id&&p.frame?"startup":undefined);go("summary");}}>Tiếp theo: chuẩn bị bắt đầu task<ArrowRight size={16}/></button></div>}
  </>}
  <details className="command-state-details"><summary>Xem trạng thái hiện tại</summary><ExecutionState context={context}/>{summary&&<><SurveySummary sim={s} profile={context.profile}/><ConflictSummary sim={s}/></>}<p>Trạng thái bài học; chưa kiểm chứng cấu hình, DB/schema, từng dependency hoặc API trên máy thật. Run khởi động JVM; Stop dừng Command, giữ source/JAR và trạng thái dịch vụ Docker.</p>{session.assumed&&<p>Kết quả thuộc kịch bản giả định; điều kiện thiếu giữ nguyên.</p>}</details>
  {summary&&<details className="command-module-path"><summary>Đường dẫn module</summary><code>{commandPath}</code><p>Health theo contract mặc định đã đối chiếu; chưa kiểm tra HTTP thật.</p></details>}
 </section>;
}
