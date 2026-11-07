import {useEffect,useRef,useState} from "react";
import {LocateFixed,RotateCcw,Search} from "lucide-react";
import {StartupLogConsole,StartupGroupNav} from "./StartupLogConsole";
import type {ConsoleLogRow} from "./StartupLogConsole";
import {failureSteps,successSteps,postgresFailureSteps,postgresFailureSource,postgresCauseEvidence,postgresChainComplete,retrySteps,readingRows,groupReading,realLogSource,errorBlockMatches,inspectLogLine} from "./real-log-practice-model";
import type {ReadingSession,ReadingStep,RetryOutcome} from "./real-log-practice-model";
import type {StartupGroup} from "./startup-log-model";
import {emptyReadingState,readingStorageKey,readReadingState} from "./real-log-reading-state";
import type {ReadingState} from "./real-log-reading-state";
import {RedisCheck} from "./RedisLogCheck";
import {RedisConnectionRoute} from "./RedisConnectionRoute";
import {PostgresConnectionRoute} from "./PostgresConnectionRoute";
import "./real-log-practice.css";

export function RealLogPractice({onClose,onComplete}:{onClose:()=>void;onComplete:()=>void}){
 const [state,setState]=useState(readReadingState);
 const [selected,setSelected]=useState<number>(),[group,setGroup]=useState<StartupGroup|null>(null);
 const [hint,setHint]=useState<number>(),[full,setFull]=useState(false),[revealed,setRevealed]=useState<number[]>([]),[jumpTick,setJumpTick]=useState(0);
 const [accepted,setAccepted]=useState(false),[feedback,setFeedback]=useState("");
 const [diagnosisAccepted,setDiagnosisAccepted]=useState(false),[diagnosisFeedback,setDiagnosisFeedback]=useState("");
 const [query,setQuery]=useState(""),[matchLine,setMatchLine]=useState<number>(),[storageWarning,setStorageWarning]=useState(false);
 const consoleRef=useRef<HTMLDivElement>(null),questionRef=useRef<HTMLHeadingElement>(null),searchRef=useRef<HTMLInputElement>(null),rootRef=useRef<HTMLElement>(null);
 const focusConsole=useRef(true);
 const diagnostic=state.focus==="diagnosis",postgresRouteOpen=state.focus==="postgres-route",routeOpen=state.focus==="redis-route"||postgresRouteOpen;
 const diagnosisRetry=diagnostic&&["retry","retry-error","done"].includes(state.diagnosisPhase);
 const session:ReadingSession=routeOpen?(postgresRouteOpen&&state.session==="postgres-failure"?"postgres-failure":"failure"):diagnostic?(diagnosisRetry?"retry":"failure"):state.session;
 const devDb=session==="postgres-failure",recordedSource=devDb?postgresFailureSource:session==="failure"?realLogSource:null;
 const rows=readingRows(session,state.branch,state.retryOutcome),simulated=session==="retry";
 const lessonSteps=state.session==="postgres-failure"?postgresFailureSteps:state.session==="failure"?failureSteps:state.session==="success"?successSteps:retrySteps(state.retryOutcome);
 const lessonIndex=state.session==="postgres-failure"?state.postgresStep:state.session==="failure"?state.failureStep:state.session==="success"?state.successStep:state.retryStep;
 const lessonStep=lessonSteps[lessonIndex],runSteps=retrySteps(state.retryOutcome),diagnosisStep=runSteps[state.diagnosisRetryStep];
 const visible=full?rows:rows.filter(row=>revealed.includes(row.line)||(recordedSource?recordedSource.rows.find(source=>source.line===row.line)?.representative:row.level!=="DEBUG"));
 const searchScope=devDb&&lessonStep?.id!=="db-chain"?"all":"error";
 const matches=errorBlockMatches(rows,query,searchScope),matchIndex=matches.findIndex(row=>row.line===matchLine);
 const lessonAccepted=accepted||devDb&&lessonStep?.id==="db-chain"&&postgresChainComplete(state.postgresEvidence);
 const inspection=selected===undefined?null:inspectLogLine(session,rows,selected);
 const explanation=group?groupReading(session,group,rows):null;
 const redisEvidence=state.diagnosisEvidence.includes(3432)&&state.diagnosisEvidence.includes(3469);
 const searchVisible=Boolean(recordedSource)||session==="retry"&&state.retryOutcome==="next-error";
 const title=devDb?"Log thật đã lưu · 08/11/2026 00:04 · dev · PostgreSQL từ chối kết nối":session==="failure"?"Log thật đã lưu · 07/11/2026 16:09 · default":session==="success"?"Log thật đã lưu · phiên thành công · 04/11/2026 12:43 · default":`Giả lập · lần chạy mới · ${state.retryOutcome==="success"?"startup đã qua":"Redis đã qua, xuất hiện lỗi khác"}`;
 const file=recordedSource?.file??(session==="success"?"logs/app.log · phiên thành công đã lưu":"Console giả lập · lần chạy mới");
 useEffect(()=>{try{localStorage.setItem(readingStorageKey,JSON.stringify({version:1,...state}));setStorageWarning(false);}catch{setStorageWarning(true);}},[state]);
 useEffect(()=>{if(routeOpen&&state.routeAddressEntry)patch({routeAddressEntry:false});},[routeOpen,state.routeAddressEntry]);
 useEffect(()=>{rootRef.current?.scrollIntoView({block:"start"});questionRef.current?.focus({preventScroll:true});},[]);
 useEffect(()=>{
  if(hint===undefined)return;
  const target=consoleRef.current?.querySelector<HTMLButtonElement>(`[data-startup-line="${hint}"]`);
  target?.scrollIntoView({block:"nearest"});if(focusConsole.current)target?.focus({preventScroll:true});
 },[hint,jumpTick,full,session]);
 function patch(value:Partial<ReadingState>){setState(previous=>({...previous,...value}));}
 function clearView(){setSelected(undefined);setGroup(null);setHint(undefined);setFull(false);setRevealed([]);setQuery("");setMatchLine(undefined);}
 function clearAnswer(){setAccepted(false);setFeedback("");}
 function inspect(row:ConsoleLogRow,record=true){
  setSelected(row.line);setGroup(row.group as StartupGroup);
  if(matches.some(match=>match.line===row.line))setMatchLine(row.line);
  if(diagnostic){
   if(record&&session==="failure"&&[3432,3469].includes(row.line))setState(previous=>({...previous,diagnosisEvidence:[...new Set([...previous.diagnosisEvidence,row.line])]}));
   if(record&&session==="retry"&&state.retryOutcome==="next-error"&&row.line===3)patch({newFailureRead:true});
   if(record&&state.diagnosisPhase==="retry"&&diagnosisStep){setDiagnosisAccepted(row.line===diagnosisStep.line);setDiagnosisFeedback(row.line===diagnosisStep.line?diagnosisStep.answer:"Đây là một dòng của lần chạy mới. Tìm bằng chứng đúng câu hỏi, hoặc dùng gợi ý.");}
   return;
  }
  if(!record||!lessonStep||lessonStep.choices)return;
  if(devDb&&lessonStep.id==="db-chain"){
   const evidence=postgresCauseEvidence.some(item=>item.lines.includes(row.line))?[...new Set([...state.postgresEvidence,row.line])]:state.postgresEvidence;
   patch({postgresEvidence:evidence});const complete=postgresChainComplete(evidence);
   setAccepted(complete);setFeedback(complete?lessonStep.answer:"Đang lần chuỗi lỗi của phiên 08/11. Chọn Application run failed, bean bị ảnh hưởng, entityManagerFactory, lỗi JDBC và PostgreSQL refused bên dưới cùng khối lỗi.");return;
  }
  if(row.line===lessonStep.line){setAccepted(true);setFeedback(lessonStep.answer);return;}
  if(devDb&&row.line===182&&lessonStep.id==="db-connect"&&!accepted){setFeedback("L182 chỉ báo Hikari bắt đầu khởi tạo pool, chưa có kết nối thành công. Chọn L377 để biết đích đã thử và kết quả kết nối.");return;}
  // Exploring another line does not revoke an answer already found for the lesson.
  if(!accepted)setFeedback(session==="failure"&&row.line===3432&&lessonStep.id==="kind"?"L3432 cho biết dịch vụ Redis và địa chỉ đích. Câu đang học cần kiểu lỗi cụ thể ở L3469: Connection refused.":`Đang khám phá ${simulated?"SIM":"L"}${row.line} ở phần “Đang xem”. Câu ${lessonIndex+1}/${lessonSteps.length} vẫn được giữ; chọn dòng trả lời câu này khi muốn tiếp tục bài học.`);
 }
 function jump(line:number,record=false,focus=true){
  const row=rows.find(item=>item.line===line);if(!row)return;
  focusConsole.current=focus;
  setRevealed(previous=>[...new Set([...previous,...(!visible.some(item=>item.line===line)?rows.filter(item=>Math.abs(item.line-line)<=1).map(item=>item.line):[line])])]);
  inspect(row,record);setHint(line);setJumpTick(previous=>previous+1);
 }
 function switchSession(value:ReadingSession){patch({session:value,focus:"lesson"});clearView();clearAnswer();}
 function resumeLesson(){
  patch({focus:"lesson"});clearView();
  if(!accepted)setFeedback("Đã quay lại đúng câu đang học. Chọn dòng trả lời trong console để tiếp tục.");
  if(lessonStep?.line!==undefined){setHint(lessonStep.line);setSelected(lessonStep.line);setGroup(readingRows(state.session,state.branch,state.retryOutcome).find(row=>row.line===lessonStep.line)?.group as StartupGroup);setRevealed([lessonStep.line]);setJumpTick(previous=>previous+1);}
  requestAnimationFrame(()=>questionRef.current?.focus({preventScroll:true}));
 }
 function startDiagnosis(newFailure=false){
  // All lesson indexes and its answer stay intact while diagnosis has its own cursor.
  patch({focus:"diagnosis",diagnosisPhase:newFailure?"retry-error":"status"});clearView();setSelected(newFailure?2:3205);setGroup("outcome");setHint(newFailure?2:3205);setJumpTick(previous=>previous+1);setDiagnosisAccepted(false);setDiagnosisFeedback("");
 }
 function openRedisRoute(addressEntry=false){patch({focus:"redis-route",routeReturnFocus:diagnostic?"diagnosis":"lesson",routeAddressEntry:addressEntry});}
 function openPostgresRoute(){patch({focus:"postgres-route",routeReturnFocus:diagnostic?"diagnosis":"lesson"});}
 function closePostgresRoute(){
  patch({focus:state.routeReturnFocus});
  requestAnimationFrame(()=>{
   const target=rootRef.current?.querySelector<HTMLElement>(state.routeReturnFocus==="diagnosis"?".reading-diagnosis h4":".reading-learning-card h4");
   target?.setAttribute("tabindex","-1");
   (target??questionRef.current)?.focus({preventScroll:true});
   (target??questionRef.current)?.scrollIntoView({block:"nearest"});
  });
 }
 function search(value:string){
  setQuery(value);const found=errorBlockMatches(rows,value,searchScope);setMatchLine(found[0]?.line);if(found[0])jump(found[0].line,false,false);
 }
 function moveMatch(direction:number){
  if(!matches.length)return;
  const index=matchIndex<0?(direction>0?0:matches.length-1):(matchIndex+direction+matches.length)%matches.length;
  setMatchLine(matches[index].line);jump(matches[index].line);
 }
 function nextCause(line:number){setQuery("Caused by:");setMatchLine(line);jump(line);}
 function nextLesson(){
  if(!lessonAccepted)return;
  const key=state.session==="postgres-failure"?"postgresStep":state.session==="failure"?"failureStep":state.session==="success"?"successStep":"retryStep";
  const complete=state.session==="retry"&&lessonIndex===lessonSteps.length-1&&state.retryOutcome==="success";
  patch({[key]:lessonIndex+1,...(complete?{doneBranches:[...new Set([...state.doneBranches,state.branch])]}:{})});clearAnswer();
  if(devDb){setQuery("");setMatchLine(undefined);}
  if(complete)onComplete();requestAnimationFrame(()=>questionRef.current?.focus({preventScroll:true}));
 }
 function nextDiagnosis(){
  if(!diagnosisAccepted)return;
  const done=state.diagnosisRetryStep===runSteps.length-1;
  patch({diagnosisRetryStep:state.diagnosisRetryStep+1,...(done?{diagnosisPhase:"done" as const,...(state.retryOutcome==="success"?{doneBranches:[...new Set([...state.doneBranches,state.branch])]}:{})}:{})});
  setDiagnosisAccepted(false);setDiagnosisFeedback("");if(done&&state.retryOutcome==="success")onComplete();
 }
 function retry(outcome:RetryOutcome){
  patch({retryOutcome:outcome,...(diagnostic?{diagnosisPhase:"retry" as const,diagnosisRetryStep:0,newFailureRead:false}:{session:"retry" as const,retryStep:0})});
  clearView();setDiagnosisAccepted(false);setDiagnosisFeedback("");if(!diagnostic)clearAnswer();
 }
 function locate(step:ReadingStep|undefined,forDiagnosis=false){
  const missing=devDb&&step?.id==="db-chain"?postgresCauseEvidence.find(item=>!item.lines.some(line=>state.postgresEvidence.includes(line))):undefined;
  const targetLine=missing?.lines[0]??step?.line;
  if(targetLine===undefined)return;jump(targetLine);
  const message=`Gợi ý: đọc ${simulated?"SIM":"L"}${targetLine}, đã đánh dấu trong console. Bấm vào dòng để trả lời.`;
  if(forDiagnosis)setDiagnosisFeedback(message);else setFeedback(message);
 }
 const inspectorNext=inspection&&"nextCause" in inspection?inspection.nextCause:undefined;
 return <section ref={rootRef} className="real-log-practice startup-replay" aria-label="Bài tập đọc log thật">
  <header className="reading-header"><div><h3>Tập đọc log thật</h3><p>Chọn dòng để khám phá. Câu đang học và luồng chẩn đoán giữ vị trí riêng.</p></div><button type="button" onClick={onClose}>Về Run / Stop</button></header>
  {!routeOpen&&<div className="reading-sessions" aria-label="Chọn phiên để tập đọc"><button type="button" disabled={diagnostic} aria-pressed={session==="failure"} onClick={()=>switchSession("failure")}>Phiên lỗi · 07/11</button><button type="button" disabled={diagnostic} aria-pressed={devDb} onClick={()=>switchSession("postgres-failure")}>08/11 · dev · PostgreSQL từ chối kết nối</button><button type="button" disabled={diagnostic} aria-pressed={session==="success"} onClick={()=>switchSession("success")}>Phiên thành công · đã lưu</button>{state.checkStep===6&&<button type="button" disabled={diagnostic} aria-pressed={session==="retry"} onClick={()=>switchSession("retry")}>Thử lại · Giả lập</button>}</div>}
  <p className="startup-provenance"><b>{title}</b><span>{file} · {simulated?"Dòng SIM do bài học tạo; không phải kết quả chạy backend thật.":"Trích đoạn đã che thông tin nhạy cảm; giữ số dòng gốc, khoảng trống là phần không trích."}</span><span>{simulated?"Kết quả kiểm tra và lần chạy mới là Giả lập.":devDb?"Phiên 08/11 xác nhận PostgreSQL tại localhost:5432 từ chối kết nối; startup dừng ở DB.":session==="failure"?"Phiên 07/11 xác nhận kết nối Redis bị từ chối. Tình trạng container và cổng trên máy thật cần kiểm tra riêng.":"Phiên thành công xác nhận các mốc startup tại thời điểm ghi; chưa xác nhận process hiện tại hoặc API."} Run / Stop và tình huống I2 được giữ nguyên.</span></p>
  {devDb&&<p className="reading-context-note"><b>Bối cảnh do người chạy cung cấp:</b> đã chủ động tắt Docker khi thử. <b>Bằng chứng từ log:</b> Connection refused chỉ xác nhận kết nối tới localhost:5432 bị từ chối; dòng này tự nó không chứng minh Docker đang tắt.</p>}
  {storageWarning&&<p role="status">Chưa lưu được bài đọc trong trình duyệt; bạn vẫn có thể tiếp tục phiên này.</p>}
  {routeOpen?postgresRouteOpen?<PostgresConnectionRoute session={devDb?"postgres-failure":"failure"} onClose={closePostgresRoute}/>:<RedisConnectionRoute addressEntry={state.routeAddressEntry} onClose={()=>patch({focus:state.routeReturnFocus,routeAddressEntry:false})}/>:<><div className="reading-workspace">
   <div className="reading-log-area">
    <div className="startup-controls"><label><input type="checkbox" checked={full} onChange={event=>{setFull(event.target.checked);if(!event.target.checked)setRevealed([]);}}/>Mở rộng DEBUG và stack trace</label><span>{visible.length} dòng trích · {recordedSource?`L1–L${recordedSource.sourceLines} của file gốc`:simulated?"số SIM của lần chạy mới":"số dòng gốc trong Workshop"}{!full&&revealed.length>0?" · đã mở đoạn chứa kết quả tìm kiếm/gợi ý":""}</span></div>
    {searchVisible&&<form className="reading-search" role="search" aria-label="Tìm trong console" onSubmit={event=>{event.preventDefault();moveMatch(1);}}>
     <label><Search size={14}/>{devDb?(searchScope==="all"?"Tìm trong trích đoạn phiên 08/11 · chữ hoặc L114, L377":"Tìm trong khối lỗi sau L3377"):<>Tìm trong khối lỗi {simulated?"mới · Giả lập":"sau L3205"}</>}<input ref={searchRef} aria-label="Tìm trong console" value={query} placeholder={devDb&&searchScope==="all"?"L114, L377 hoặc nội dung log":"Caused by:"} onChange={event=>search(event.target.value)}/></label>
     <div><button type="button" disabled={!matches.length} onClick={()=>moveMatch(-1)}>Kết quả trước</button><button type="button" disabled={!matches.length} onClick={()=>moveMatch(1)}>Kết quả sau</button></div>
     <span role="status">{query.trim()?matches.length?`${matchIndex>=0?matchIndex+1:1}/${matches.length} · ${simulated?"SIM":"L"}${matchLine??matches[0].line}`:"Không có kết quả trong khối lỗi này.":"Nhập Caused by: để tìm cả trong các dòng đang thu gọn."}</span>
    </form>}
    <StartupLogConsole consoleRef={consoleRef} rows={visible} label="Console tập đọc log" selectedLine={selected} hintLine={hint} simulated={simulated} file={file} gaps={!simulated} compact={!full} expandedLines={revealed} searchQuery={query} matchLines={matches.map(row=>row.line)} currentMatch={matchLine} evidenceLines={devDb?state.postgresEvidence:diagnostic&&!diagnosisRetry?[3205,3499,...state.diagnosisEvidence]:[]} onAddressClick={session==="failure"?()=>openRedisRoute(true):undefined} onPostgresClick={devDb?openPostgresRoute:undefined} onSelect={row=>inspect(row)}/>
    <StartupGroupNav selected={group??""} observed={rows.map(row=>row.group)} simulated={simulated} onSelect={setGroup}/>
   </div>
   <aside className="reading-guide" aria-label="Hướng dẫn cạnh console">
    {inspection&&selected!==undefined&&<section className="reading-inspector" aria-label="Dòng đang xem" aria-live="polite">
     <span className="reading-step">Đang xem {simulated?"SIM":"L"}{selected} · {inspection.category}</span><h4>{inspection.title}</h4>
     <p>{inspection.meaning}</p><button type="button" className="reading-proof" onClick={()=>jump(selected)}>{simulated?"SIM":"L"}{selected} · {rows.find(row=>row.line===selected)?.text.slice(0,330)}</button><p>{inspection.limit}</p>
     {session==="failure"&&selected===3205&&!diagnostic&&<button type="button" className="reading-next" onClick={()=>startDiagnosis()}>Lần nguyên nhân lỗi này</button>}
     {session==="failure"&&[3432,3469].includes(selected)&&<button type="button" className="reading-next" onClick={()=>openRedisRoute()}>Lần đường kết nối Redis</button>}
     {session==="failure"&&[183,184,280].includes(selected)&&<button type="button" className="reading-next" onClick={openPostgresRoute}>Lần đường kết nối PostgreSQL</button>}
     {devDb&&[114,182,377,4547,4611].includes(selected)&&<button type="button" className="reading-next" onClick={openPostgresRoute}>Lần đường kết nối PostgreSQL</button>}
     {typeof inspectorNext==="number"&&<button type="button" onClick={()=>nextCause(inspectorNext)}>Xem nguyên nhân bên dưới</button>}
     {session==="retry"&&state.retryOutcome==="next-error"&&selected===2&&state.diagnosisPhase!=="retry-error"&&<button type="button" onClick={()=>startDiagnosis(true)}>Đọc khối lỗi mới</button>}
    </section>}
    {diagnostic&&<section className="reading-diagnosis" aria-label="Luồng chẩn đoán">
     <header><span className="reading-step">Đang chẩn đoán · {diagnosisRetry?"lần chạy mới · Giả lập":"log thật đã lưu · 07/11"}</span><button type="button" onClick={resumeLesson}>Quay lại câu đang học</button></header>
     {state.diagnosisPhase==="status"?<>
      <h4>Xác nhận trạng thái</h4><p><b>Startup thất bại.</b> Application run failed báo kết quả khởi động; exit code 1 xác nhận process đã thoát.</p>
      <button type="button" className="reading-proof" onClick={()=>jump(3205)}>L3205 · Application run failed</button><button type="button" className="reading-proof" onClick={()=>jump(3499)}>L3499 · Process finished with exit code 1</button>
      <button type="button" className="reading-next" onClick={()=>{patch({diagnosisPhase:"search"});requestAnimationFrame(()=>searchRef.current?.focus());}}>Tìm Caused by trong console</button>
     </>:state.diagnosisPhase==="search"?<>
      <h4>Tìm nguyên nhân bên dưới lỗi phụ thuộc</h4><p>Nhập <code>Caused by:</code> vào ô tìm trong console; dùng Kết quả trước / sau. Các dòng thu gọn vẫn được tìm và mở khi cần đọc.</p>
      <p>queueHandler → sharedGlobalConfigService → platformCacheConfig → cacheManager → redissonClient. Tên bean cho biết thành phần bị ảnh hưởng; tiếp tục tới dịch vụ, địa chỉ và kiểu lỗi.</p>
      <ul className="reading-evidence-progress"><li>{state.diagnosisEvidence.includes(3432)?"✓":"○"} Đọc dòng cho dịch vụ Redis và địa chỉ.</li><li>{state.diagnosisEvidence.includes(3469)?"✓":"○"} Đọc dòng cho kiểu lỗi kết nối.</li></ul>
      {redisEvidence&&<><FailureSummary onJump={line=>jump(line)}/><button type="button" className="reading-next" onClick={()=>patch({diagnosisPhase:"check"})}>Kiểm tra Redis</button></>}
     </>:state.diagnosisPhase==="check"?<><FailureSummary onJump={line=>jump(line)}/><RedisCheck step={state.checkStep} branch={state.branch} onChange={patch} onRetry={retry}/></>:state.diagnosisPhase==="retry"&&diagnosisStep?<>
      <h4>Chạy lại và đọc log mới · {state.diagnosisRetryStep+1}/{runSteps.length}</h4><p>{diagnosisStep.question}</p><button type="button" className="reading-hint" onClick={()=>locate(diagnosisStep,true)}><LocateFixed size={15}/>Gợi ý tìm dòng</button>
      <p className="reading-feedback" role="status" data-answer={diagnosisAccepted?"correct":"waiting"}>{diagnosisFeedback||"Tìm bằng chứng mới trong các dòng SIM của lần chạy này."}</p><button type="button" disabled={!diagnosisAccepted} className="reading-next" onClick={nextDiagnosis}>{state.diagnosisRetryStep===runSteps.length-1?"Hoàn tất lần thử lại":"Tiếp tục đọc log mới"}</button>
     </>:state.diagnosisPhase==="retry-error"?<>
      <h4>Điểm chặn đã thay đổi · Giả lập</h4><p>SIM1 xác nhận Redis đã có kết nối; SIM2 mở khối Application run failed mới. Tìm <code>Caused by:</code> bên dưới SIM2 trong chính lần chạy này.</p>
      <button type="button" onClick={()=>{setQuery("");searchRef.current?.focus();}}>Tìm trong khối lỗi mới</button>
      {state.newFailureRead&&<><p>SIM3 chỉ ra PortInUseException: cổng 9901 bị chiếm. Kiểm tra process sở hữu cổng trên đúng máy chạy Command rồi đọc lại log sau xử lý.</p><button type="button" onClick={()=>jump(3)}>SIM3 · Xem bằng chứng điểm chặn mới</button><button type="button" onClick={()=>jump(4)}>SIM4 · Process mới đã thoát</button></>}
     </>:<div className="reading-complete" role="status"><h4>{state.retryOutcome==="success"?"Đã tìm đủ ba bằng chứng mới · Giả lập":"Đã tìm điểm chặn mới · Giả lập"}</h4><p>{state.retryOutcome==="success"?"Redis có kết nối → Tomcat started → Started AgentCommandServiceApplication. Chưa kiểm tra API hoặc máy thật.":"Redis đã qua; startup vẫn thất bại ở cổng 9901. Chưa có Tomcat started hoặc Started. Tiếp tục đọc khối lỗi mới sau SIM2."}</p>{state.retryOutcome==="next-error"&&<button type="button" onClick={()=>{patch({diagnosisPhase:"retry-error"});clearView();jump(2);}}>Đọc khối lỗi mới</button>}<button type="button" onClick={()=>{patch({diagnosisPhase:"check",checkStep:1});clearView();}}>Thử nhánh Redis còn lại</button></div>}
     <p className="reading-intellij-tip"><b>Trong IntelliJ thật:</b> mở đúng tab Run → tìm Application run failed → tìm Caused by: và đọc các kết quả bên dưới trong cùng khối lỗi. Đối chiếu số dòng trong đúng file/phiên.</p>
    </section>}
    <section className={`reading-learning-card ${diagnostic?"is-suspended":""}`} aria-label="Câu đang học">
     <span className="reading-step">Đang học · {Math.min(lessonIndex+1,lessonSteps.length)}/{lessonSteps.length}</span>
     {lessonStep?<><h4 ref={questionRef} tabIndex={-1}>{lessonStep.question}</h4>
      {diagnostic?<><p>Đã lưu vị trí câu này. Khám phá và chẩn đoán không làm tiến câu đang học.</p><button type="button" onClick={resumeLesson}>Tiếp tục bài học</button></>:<>
       <p>{lessonStep.choices?"Chọn một cách kiểm tra bên dưới.":"Bấm dòng trả lời câu này; bạn vẫn có thể khám phá các dòng khác."}</p>
       {devDb&&lessonStep.id==="db-connect"&&<div className="reading-choices" aria-label="Đối chiếu hai dòng kết nối"><button type="button" onClick={()=>jump(182)}>Đọc L182 · Hikari Starting...</button><button type="button" onClick={()=>jump(377)}>Đọc L377 · PostgreSQL refused</button></div>}
       {devDb&&lessonStep.id==="db-chain"&&<div className="reading-db-chain" aria-label="Lần chuỗi lỗi Eventuate và JPA"><p>Bắt đầu từ L3377. Nhập <code>Caused by:</code> vào ô tìm kiếm, dùng Kết quả trước / sau và bấm từng dòng bằng chứng. Phạm vi tìm kiếm của câu này chỉ gồm khối lỗi sau L3377; L377 là lần báo lỗi ở đoạn trước.</p><button type="button" onClick={()=>jump(3377)}>Bắt đầu từ L3377 · Application run failed</button><button type="button" onClick={()=>{search("Caused by:");requestAnimationFrame(()=>searchRef.current?.focus());}}>Tìm Caused by: sau L3377</button><ul className="reading-evidence-progress">{postgresCauseEvidence.map(item=><li key={item.id}>{item.lines.some(line=>state.postgresEvidence.includes(line))?"✓":"○"} {item.label}</li>)}</ul></div>}
       {lessonStep.choices?<div className="reading-choices">{lessonStep.choices.map(choice=><button type="button" key={choice.id} onClick={()=>{setAccepted(Boolean(choice.correct));setFeedback(choice.correct?lessonStep.answer:choice.feedback);}}>{choice.label}</button>)}</div>:<button type="button" className="reading-hint" onClick={()=>locate(lessonStep)}><LocateFixed size={15}/>Gợi ý tìm dòng</button>}
       <p className="reading-feedback" role="status" data-answer={lessonAccepted?"correct":feedback?"try":"waiting"}>{feedback||(lessonAccepted?lessonStep.answer:"Chưa chọn bằng chứng cho câu đang học.")}</p>
       <button type="button" className="reading-next" disabled={!lessonAccepted} onClick={nextLesson}>{lessonIndex===lessonSteps.length-1?(devDb?"Đối chiếu hai phiên":state.session==="failure"?"Kiểm tra Redis":state.session==="retry"?"Hoàn tất lần thử lại":"Hoàn tất đối chiếu"):"Tiếp tục bài học"}</button>
      </>}
     </>:devDb?<div className="reading-complete"><h4 ref={questionRef} tabIndex={-1}>Đã đọc xong phiên 08/11 · dev</h4><p>Biết đích đã thử là localhost:5432; kết nối bị từ chối. Startup dừng ở DB. Java đã bắt đầu chạy rồi tác vụ main() thoát lỗi.</p><FailureComparison/><button type="button" onClick={()=>switchSession("failure")}>Xem lại phiên 07/11 · default</button></div>:diagnostic?<p>Tiến độ bài học được giữ nguyên trong khi bạn chẩn đoán.</p>:state.session==="failure"?<RedisCheck step={state.checkStep} branch={state.branch} onChange={patch} onRetry={retry}/>:<div className="reading-complete" role="status"><h4 ref={questionRef} tabIndex={-1}>{state.session==="retry"?(state.retryOutcome==="success"?"Đã tìm đủ ba bằng chứng mới · Giả lập":"Đã tìm điểm chặn mới · Giả lập"):"Đã đối chiếu phiên thành công"}</h4><p>{state.session==="retry"?(state.retryOutcome==="success"?"Redis có kết nối → Tomcat started → Command Started. Chưa kiểm tra API hoặc môi trường thật.":"Redis đã qua; cần đọc tiếp khối lỗi mới. Chưa có bằng chứng startup thành công."):"Bạn đã phân biệt startup đã qua, cổng lắng nghe và API được kiểm tra."}</p><button type="button" onClick={()=>switchSession(state.session==="retry"?"success":"failure")}>{state.session==="retry"?"Đối chiếu với phiên thành công thật":"Về phiên lỗi 07/11"}</button>{state.session==="retry"&&<button type="button" onClick={()=>{patch({session:"failure",checkStep:1});clearView();clearAnswer();}}>Thử nhánh Redis còn lại</button>}</div>}
    </section>
    {explanation&&<div className="reading-group-explanation" aria-label="Ba câu đọc nhóm log"><dl><dt>App đang làm gì?</dt><dd>{explanation.what}</dd><dt>Dòng nào chứng minh?</dt><dd>{explanation.proof}</dd><dt>Biết được tới mức nào?</dt><dd>{explanation.limit}</dd></dl>{(session==="failure"&&group==="data"&&![183,184,280].includes(selected??0)||devDb&&group==="data"&&![114,182,377,4547,4611].includes(selected??0))&&<button type="button" className="reading-next" onClick={openPostgresRoute}>Lần đường kết nối PostgreSQL</button>}</div>}
   </aside>
  </div>
  {devDb?<details className="reading-intellij"><summary>Áp dụng vào IntelliJ thật</summary><ol><li>Mở đúng tab Run của phiên 08/11; L114 xác nhận dev. Đối chiếu spring.datasource.url và các nguồn ghi đè của đúng lần Run.</li><li>L182 chỉ là Starting...; L377 xác nhận localhost:5432 bị từ chối. Tìm Application run failed rồi Caused by: trong cùng khối lỗi để lần bean → JPA → JDBC → PostgreSQL.</li><li>Kiểm tra cổng localhost:5432 từ chính môi trường chạy Command. Nếu DB của bài do Docker cung cấp, đối chiếu Engine, postgres-write, Status / Logs / Ports.</li><li>L4939 xác nhận Java thoát mã 1; Gradle báo BUILD FAILED vì tác vụ main() thất bại sau khi Java đã bắt đầu chạy.</li><li>Sau xử lý, Run lại và đọc log mới; các dòng cũ không xác nhận kết quả lần chạy mới.</li></ol><p>Đây là hướng dẫn tự kiểm tra, chưa chạy lệnh hoặc Run lại backend ở đây. Bối cảnh đã tắt Docker do người chạy cung cấp riêng.</p></details>:<details className="reading-intellij"><summary>Áp dụng vào IntelliJ thật</summary><ol><li>Mở đúng tab Run của lần chạy. Tìm Application run failed hoặc cặp Tomcat started / Started.</li><li>Đọc tiếp cuối console và trạng thái process: Stop còn bật/tiến trình hoạt động hay đã có Process finished with exit code …? Started cũ chưa xác nhận process hiện tại.</li><li>Tìm Caused by: bên dưới Application run failed trong cùng khối lỗi. Tên bean chỉ thành phần bị ảnh hưởng; lần tiếp tới dịch vụ, địa chỉ và kiểu lỗi.</li><li>Chạy Test-NetConnection 127.0.0.1 -Port 6379 từ đúng máy chạy Command. False: chưa kết nối được; True: mới xác nhận TCP thông.</li><li>Docker → Containers → Redis: đối chiếu Status và Ports với địa chỉ trong log. Command chạy trên host dùng host port, nằm bên trái host:container.</li><li>Run lại, tìm Redis có kết nối, Tomcat started và Started. Nếu có khối lỗi mới, đọc Caused by của khối mới. API cần request và kiểm tra status/body riêng.</li></ol><p>Phiên thật 07/11 xác nhận Connection refused; các kết quả kiểm tra và chạy lại là Giả lập.</p></details>}
  <footer className="reading-footer"><span>{devDb?`${Math.min(state.postgresStep,4)}/4 câu phiên 08/11 đã đọc`:`${state.doneBranches.length}/2 nhánh Redis đã tập xong`}</span><button type="button" onClick={()=>{if(devDb)patch({postgresStep:0,postgresEvidence:[],focus:"lesson"});else setState(emptyReadingState());clearView();clearAnswer();setDiagnosisAccepted(false);setDiagnosisFeedback("");}}><RotateCcw size={14}/>Học lại từ đầu</button><details><summary>Nguồn trích đoạn</summary><p>{(recordedSource??realLogSource).file} · {(recordedSource??realLogSource).sourceDate} · {(recordedSource??realLogSource).sourceLines} dòng · SHA-256 {(recordedSource??realLogSource).sourceSha256}</p><p>{(recordedSource??realLogSource).redaction}</p>{devDb?<p>{postgresFailureSource.contextNote} Các hướng dẫn kiểm tra không phải kết quả kiểm tra máy thật. Ví dụ có nhãn Giả lập được giữ riêng.</p>:<p>Phiên thành công: logs/app.log · 04/11 12:43 · snapshot đã có trong Workshop. L16134 Tomcat started; L18989 Started. Dòng SIM của lần chạy mới là giả lập riêng.</p>}</details></footer>
  </>}
 </section>;
}

function FailureComparison(){
 return <table className="reading-session-comparison" aria-label="Đối chiếu hai phiên lỗi"><thead><tr><th>Phiên</th><th>PostgreSQL</th><th>Điểm dừng startup</th></tr></thead><tbody><tr><th>07/11 · default</th><td>Đã kết nối · L183–184, JPA khởi tạo · L280. Chưa biết host/port từ log.</td><td>Redis · L3432, L3469</td></tr><tr><th>08/11 · dev</th><td>Đích localhost:5432 bị từ chối · L377. Chưa mở được kết nối.</td><td>DB · L3377 → L4083 → L4375 → L4547</td></tr></tbody></table>;
}

function FailureSummary({onJump}:{onJump:(line:number)=>void}){
 return <section className="reading-failure-summary" aria-label="Kết luận từ log thật"><h4>Bằng chứng từ phiên 07/11</h4><p>Command đã kết nối PostgreSQL và khởi tạo JPA. Startup dừng khi Redisson kết nối Redis. Process đã thoát.</p><div><button type="button" onClick={()=>onJump(183)}>PostgreSQL đã kết nối · L183–184</button><button type="button" onClick={()=>onJump(280)}>JPA đã khởi tạo · L280</button><button type="button" onClick={()=>onJump(3432)}>Redisson không kết nối được Redis · L3432</button><button type="button" onClick={()=>onJump(3469)}>Connection refused · L3469</button><button type="button" onClick={()=>onJump(3499)}>Process đã thoát · L3499</button></div></section>;
}
