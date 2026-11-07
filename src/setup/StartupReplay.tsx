import {useEffect,useRef,useState} from "react";
import {Pause,Play,SkipForward,RotateCcw} from "lucide-react";
import type {PracticeContext} from "./project-practice-model";
import {caseOriginLabel,findCommandCase} from "./command-cases";
import caseEvidence from "../content/setup/command-case-source.json" with {type:"json"};
import {startupDataset,startupSource} from "./startup-log-model";
import type {StartupGroup,StartupPlayback,StartupReference} from "./startup-log-model";
import type {LogId} from "./command-session-model";
import {StartupLogConsole,StartupGroupNav} from "./StartupLogConsole";
import "./startup-replay.css";

type Props={context:PracticeContext;onPlayback:(patch:Partial<StartupPlayback>)=>void;onReference:(reference:StartupReference)=>void;onNext:()=>void;onReplay:()=>void;onLog:(id:LogId)=>void};
const fullLogs={
 'dev-success':()=>import("../content/setup/command-startup-dev-success.txt?raw"),
 'default-success':()=>import("../content/setup/command-startup-default-success.txt?raw"),
 'default-failure':()=>import("../content/setup/command-startup-default-failure.txt?raw")
};
export function StartupReferenceChoice({reference,disabled,onChange,caseTitle}:{reference:StartupReference;disabled:boolean;onChange:(reference:StartupReference)=>void;caseTitle?:string}){
 return <label className="startup-reference">Chọn tình huống<select aria-label="Phiên log startup" value={caseTitle?"case":reference} disabled={disabled} onChange={e=>{if(e.target.value!=="case")onChange(e.target.value as StartupReference);}}>{caseTitle&&<option value="case">{caseTitle}</option>}<option value="configured">Bài học theo I1 · minh họa bằng log lịch sử</option><option value="recorded-failure">Phiên lỗi thật · default · 06/11 23:24</option><option value="recorded-success">Phiên thành công thật · default · 04/11 12:43</option></select></label>;
}
export function StartupReplay({context,onPlayback,onNext,onReplay,onLog}:Props){
 const s=context.sim,session=s.commandSession,p=session.playback;
 const data=startupDataset(p.reference,session.id?s.launchProfile:context.profile,p),visible=data.rows.slice(0,p.frame),last=visible.at(-1);
 const caseItem=findCommandCase(p.caseId);
 const originalGroup=startupSource.groups.find(group=>group.id===p.group)!;
 const rabbitCase=data.simulated&&caseItem?.id.startsWith("rabbit");
 const group=rabbitCase&&p.group==="events"?{...originalGroup,title:"Messaging / RabbitMQ",kind:"Listener/thread trong Command → RabbitMQ bên ngoài",when:"Listener có thể kết nối/retry lúc startup; handler chỉ xử lý khi có message.",what:"Rabbit listener thử kết nối AMQP trong case; web vẫn có thể Started. Tạo RabbitTemplate không chứng minh đã kết nối hoặc đã gửi message.",why:"Command có @RabbitListener để nhận công việc; không coi thư viện Rabbit là một process mới."}:data.simulated&&caseItem?.category==="before"&&!caseItem.started&&!p.caseRepaired&&p.group==="jvm"?{...originalGroup,title:"Trước khi Spring Boot bắt đầu",kind:caseItem.id==="compile"?"IDE/build tool · chưa tạo process Command":"JVM chưa gọi được main/Boot",when:"Trước main/Spring Boot.",what:caseItem.action,why:"Cần source compile được, JDK và classpath/main khớp trước khi Spring có thể khởi tạo ứng dụng."}:originalGroup;
 const selectedLines=visible.filter(row=>row.group===p.group);
 const relatedSources=[...group.sources,...(data.profile==="dev"&&group.sources.includes("base")?["dev"]:[])];
 const observation=selectedLines.length?(data.simulated?"Dữ kiện giả lập · không phải log thật":"Quan sát trong phiên thật"):data.simulated?"Chưa thực hiện / chưa quan sát":"Chưa quan sát";
 const consoleRef=useRef<HTMLDivElement>(null),manualGroup=useRef(""),[fullText,setFullText]=useState<{id:string;text:string}|null>(null),[loadError,setLoadError]=useState(false),[explanationOpen,setExplanationOpen]=useState(p.group!=="outcome");
 useEffect(()=>{setExplanationOpen(manualGroup.current===p.group||p.group!=="outcome");manualGroup.current="";},[p.group]);
 const active=p.playing||s.process==="running",failed=visible.some(row=>row.fatal);
 useEffect(()=>{
  if(data.simulated||!p.full||fullText?.id===data.id)return;
  let alive=true;setLoadError(false);
  fullLogs[data.id as keyof typeof fullLogs]().then(module=>{if(alive)setFullText({id:data.id,text:module.default});}).catch(()=>{if(alive)setLoadError(true);});return()=>{alive=false;};
 },[p.full,data.id,fullText]);
 useEffect(()=>{
  const targetLine=p.playing&&!p.paused?last?.line:selectedLines.at(-1)?.line;
  const container=consoleRef.current,target=container?.querySelector<HTMLElement>(`[data-startup-line="${targetLine}"]`);
  if(container&&target)container.scrollTop+=target.getBoundingClientRect().top-container.getBoundingClientRect().top-container.clientHeight/3;
 },[p.frame,p.group,p.full,p.paused,fullText]);
 useEffect(()=>{
  if(p.frame===1&&p.playing&&!p.paused)consoleRef.current?.closest(".command-run-window")?.scrollIntoView({block:"start"});
 },[session.id,p.frame,p.playing,p.paused]);
 const limit=p.frame===data.rows.length?data.to:last?.line??data.from-1;
 const rows=p.full&&fullText?.id===data.id?fullText.text.split("\n").filter(Boolean).map(text=>{const split=text.indexOf(" | "),line=Number(text.slice(0,split)),original=data.rows.find(row=>row.line===line);return {line,text:text.slice(split+3),group:original?.group??"",milestone:original?.milestone??"",level:original?.level??text.match(/\[(\w+)/)?.[1]??"TRACE"};}).filter(row=>row.line<=limit):visible;
 const has=(pattern:RegExp)=>visible.some(row=>pattern.test(row.text));
 let result="Chưa có dòng của nhóm trong đoạn đã phát; phần dưới là cấu hình/source, không là bằng chứng nhóm đã hoàn tất.";
 if(selectedLines.length){
  switch(group.id){
   case "jvm":result=has(/profile.*active:|No active profile/)?`Log phiên tham chiếu xác nhận Java 21, profile ${data.profile}. Không có output xác nhận Make hay cấu hình hiệu lực của một lần Run mới.`:"Starting xác nhận JVM Java 21; dòng Boot/profile chưa xuất hiện trong đoạn đã phát.";break;

   case "beans":result=has(/cancelling refresh/)?"Context đã hủy refresh vì bean không khởi tạo được.":"Đã thấy refresh context/đăng ký client Feign. Chưa chứng minh mọi bean hoàn tất, đã gọi HTTP hoặc endpoint ngoài phản hồi.";break;
   case "data":result=failed?`EntityManagerFactory không khởi tạo được. ${has(/SocketTimeoutException/)?"Nguyên nhân sâu nhất đã xuất hiện: PostgreSQL connect timeout.":"Đọc tiếp chuỗi lỗi kết nối; chưa kết luận riêng lỗi mạng, DB hay cấu hình."}`:has(/Initialized JPA EntityManagerFactory/)?"Đã có connection và JPA EntityManagerFactory trong log; chưa chứng minh truy vấn/nghiệp vụ đúng.":has(/The connection attempt failed/)?"Một lần mở kết nối đã báo lỗi. Chưa có EntityManagerFactory khởi tạo thành công; chờ kết quả startup cuối.":has(/HikariPool-1 - Starting/)?"Hikari đang thử mở kết nối PostgreSQL; chưa có Added connection hoặc JPA initialized.":"Đã tìm thấy repository trong đoạn đã phát; đây là quét interface, chưa phải đọc/ghi dữ liệu nghiệp vụ.";break;
   case "clients":result=has(/redisson-netty.*connections initialized/)?"Đã quan sát pool Redisson có connection trên thread trong JVM nối tới Redis ngoài. Chưa chứng minh mọi thao tác cache/lock thành công.":"Mới thấy khởi tạo/thông tin Redisson, chưa có dòng connection initialized trong đoạn đã phát.";break;
   case "events":result="Log có cảnh báo/khởi tạo cấu hình Eventuate; chưa chứng minh mọi bean hoàn tất. Chưa quan sát Creating/Starting consumer, Subscribed, phát Kafka hay xử lý event trong phiên này.";break;
   case "init":result="Chưa quan sát thao tác bootstrap owner/global config trong phiên đã chọn; đây là đường ghi xác định từ source. Không phát log save thành công giả hoặc suy dữ liệu đúng từ Started.";break;
   case "web":result=has(/Tomcat started on port/)?"Tomcat đã started ở port 9901 trong phiên tham chiếu. Chưa có bằng chứng HTTP/nghiệp vụ từ dòng này.":"Tomcat mới initialized; chưa có Tomcat started/Started để kết luận startup hoàn tất.";break;
   case "outcome":result=failed?has(/SocketTimeoutException/)?"Startup thất bại; chuỗi Caused by tới SocketTimeoutException. Không kết luận main:27 là lỗi gốc.":"Đã có lỗi khởi tạo; trace nguyên nhân còn đang xuất hiện. Không lấy dòng main:27 làm lỗi gốc.":session.shown===3?"Đã có Started: startup thành công ở mức log ghi nhận; API/nghiệp vụ chưa được kiểm chứng.":"Chưa có Started hoặc kết luận startup cuối trong đoạn đã phát.";break;
   case "shutdown":result="Context đã bắt đầu hủy khởi tạo (cancelling refresh). Chưa có log xác nhận shutdown/giải phóng tài nguyên hoàn tất của phiên lỗi.";break;
  }
 }
 if(group.id==="init")result="Chưa quan sát trong phiên: log không xác nhận từng lần tạo owner/save global config. Source cho thấy @PostConstruct có thể ghi DB/event và dùng khóa Redis ngay lúc startup; không cần request nghiệp vụ.";
 if(data.simulated)result=selectedLines.length?`${selectedLines.at(-1)?.text}. Đây là dữ kiện giả lập của case, không chứng minh repo từng có kết quả này.`:"Chưa thực hiện / chưa quan sát nhóm này trong case; không phát log thành công cho nhóm chưa tới.";
 if(group.id==="shutdown"&&s.process==="stopped")result="Đã Stop Command trong bài; source/JAR và container Docker giữ nguyên. Tài nguyên/thread bên trong thuộc vòng đời Command; log cleanup lịch sử là bằng chứng riêng.";
 function select(value:StartupGroup){manualGroup.current=value;setExplanationOpen(true);onPlayback({group:value,paused:p.playing});}
 function log(id:LogId){onLog(id);}
 return <section className="startup-replay" aria-label="Khám phá startup Command">
  <p className="startup-provenance"><b>{data.simulated?`${caseOriginLabel(caseItem!.origin==="recorded"?"source":caseItem!.origin)} · ${data.name}`:`Phát lại log đã lưu · ${data.name}`}</b><span>{data.preLaunch?"IDE/build tool · chưa launch JVM":`Java ${data.javaVersion??21}`} · {data.rows.some(row=>row.milestone==="profile")?"profile":"profile dự định · Boot chưa nạp"} <strong>{data.profile}</strong> · output {data.launch} · {data.simulated?"dòng SIM do bài học tạo, không phải raw log repo":"log lịch sử, không có JVM mới từ lượt kiểm chứng này"}.</span>{data.simulated&&data.outcome==="success"&&<span>Kịch bản giả định các điều kiện startup còn lại đã đáp ứng; không đánh dấu dịch vụ G2 hoặc máy thật sẵn sàng.</span>}{!data.simulated&&p.reference!=="configured"&&<span>I1/G2 giữ nguyên; đang xem phiên cũ, không áp dụng lại cấu hình I1.</span>}{!data.simulated&&p.reference==="configured"&&<span>Kịch bản bài học theo I1: giả định điều kiện còn lại đã đáp ứng, minh họa bằng log {data.launch} lịch sử; không phải kết quả chạy thật cấu hình hiện tại.</span>}</p>
  <div className="startup-controls" aria-label="Điều khiển log startup"><button type="button" disabled={!p.playing} onClick={()=>onPlayback({paused:!p.paused})}>{p.paused?<Play size={14}/>:<Pause size={14}/>}<span>{p.paused?"Tiếp tục":"Tạm dừng"}</span></button><button type="button" disabled={!p.playing} onClick={onNext}><SkipForward size={14}/>Nhóm tiếp theo</button><button type="button" disabled={active} onClick={onReplay}><RotateCcw size={14}/>Chạy lại</button><label><input type="checkbox" checked={p.full} disabled={data.simulated} onChange={e=>onPlayback({full:e.target.checked})}/>Xem toàn bộ log</label><span role="status">{p.paused?"Đang tạm dừng":p.playing?"Đang phát":s.process==="stopped"?"Đã dừng trong bài":failed?"Phiên startup thất bại":session.shown===3?"Đã tới Started":"Chờ Run"} · {p.frame}/{data.rows.length} dòng đại diện</span></div>
  <div className="startup-log-layout">
   <StartupLogConsole rows={rows} consoleRef={consoleRef} selectedGroup={p.group} selectedMilestone={session.selected} simulated={data.simulated} file={data.logFile} onSelect={row=>row.milestone?log(row.milestone as LogId):row.group?select(row.group as StartupGroup):undefined}>
    {!rows.length&&<p>Bấm Run cạnh main để xem các nhóm hoạt động. Không cần đọc/tick từng dòng.</p>}
    {p.full&&fullText?.id!==data.id&&<p>{loadError?"Chưa mở được log đầy đủ; bỏ chọn để xem dòng đại diện.":"Đang mở bản log đã che…"}</p>}
    {s.process==="stopped"&&<p className="startup-ui-stop">Thao tác bài học: Stop · lần #{session.id} đã dừng. Source/JAR giữ nguyên; các container Docker vẫn giữ trạng thái trước đó.</p>}
   </StartupLogConsole>
   <StartupGroupNav selected={p.group} observed={visible.map(row=>row.group)} onSelect={select} rabbit={Boolean(rabbitCase)} simulated={Boolean(data.simulated)} live={p.playing?last?.group:undefined}/>
  </div>
  <details open={explanationOpen} className="startup-explanation" data-startup-explanation={group.id} aria-label={`Giải thích: ${group.title}`}>
   <summary onClick={e=>{e.preventDefault();setExplanationOpen(!explanationOpen);}}>Giải thích nhóm: {group.title}</summary>
   <header><h3>{group.title}</h3><span>{group.kind}</span><span>Thời điểm: {group.when}</span></header>
   <p className="startup-evidence-label" data-evidence={selectedLines.length?"observed":"unobserved"}><b>{observation}</b> · {data.simulated?"case giả lập":"phiên lịch sử"} {data.name}. <span>Đối chiếu source</span></p>
   {selectedLines.length>0&&<p className="startup-log-proof">Log đại diện gần nhất của nhóm: {selectedLines.slice(-3).map(row=>`${data.logFile}:${row.line}`).join(", ")}. Có dòng log chưa đồng nghĩa cả nhóm đã thành công.</p>}
   <dl><dt>Đang làm gì?</dt><dd>{group.what}</dd><dt>Vì sao Command cần?</dt><dd>{group.why}</dd><dt>Liên quan source nào?</dt><dd>{relatedSources.map(id=><code key={id} title={startupSource.sources[id as keyof typeof startupSource.sources].path}>{startupSource.sources[id as keyof typeof startupSource.sources].path.split("/").at(-1)} </code>)}</dd><dt>Kết quả hiện tại?</dt><dd>{result}</dd></dl>
   {!data.simulated&&group.id==="outcome"&&failed&&(has(/SocketTimeoutException/)?<div className="startup-root-cause"><b>Thành phần không khởi tạo được</b><p>eventHandlerBeanPostProcessor → Eventuate → transactionManager → entityManagerFactory.</p><b>Nguyên nhân sâu nhất tìm được</b><p>JDBCConnectionException → PSQLException → <strong>SocketTimeoutException: Connect timed out</strong>. JDBC không mở được kết nối để Hibernate chuẩn bị persistence/DDL.</p><b>Cần kiểm tra</b><p>spring.datasource.url và override/profile/env của phiên; khả năng tới PostgreSQL. Log chưa phân biệt được mạng, firewall, DB tắt hay đích kết nối sai.</p><p>AgentCommandServiceApplication.main(...:27) là điểm gọi SpringApplication.run; không phải bằng chứng dòng 27 gây lỗi gốc.</p></div>:<p className="startup-cause-pending">EntityManagerFactory chưa khởi tạo được. Tiếp tục log để đọc chuỗi Caused by trước khi kết luận nguyên nhân sâu nhất.</p>)}
   {group.id==="shutdown"&&<p className="startup-evidence-gap">{data.outcome==="failure"?data.missing:"Stop trong bài không xác nhận tác nhân đã dừng phiên thật. Với phiên default thành công, có đoạn đóng Tomcat/JPA/Hikari cùng phiên đã lưu."}</p>}
   <details><summary>Chi tiết source và bằng chứng</summary>{data.simulated?<><p>Dòng SIM là dữ kiện bài học; source chỉ chứng minh thành phần/đường code có liên quan.</p>{caseItem?.refs.map(id=>{const ref=caseEvidence.refs[id as keyof typeof caseEvidence.refs];return ref?<article key={id}><b>{ref.path}:{ref.from}</b><pre>{ref.rows.map(row=>`${row.line} | ${row.text}`).join("\n")}</pre></article>:null;})}</>:<><p>{startupSource.sourceRoot}/{data.logFile} · dòng {data.from}–{data.to} · SHA-256 {data.logSha256}</p>{relatedSources.map(id=>{const ref=startupSource.sources[id as keyof typeof startupSource.sources];return <article key={id}><b>{ref.path}:{ref.from}</b><pre>{ref.rows.map(row=>`${row.line} | ${row.text}`).join("\n")}</pre></article>;})}<p>{startupSource.limits}</p></>}</details>
  </details>
  {s.process==="stopped"&&session.shown===3&&data.stopRows.length>0&&<details className="startup-stop-reference"><summary>Đoạn shutdown đã lưu cùng phiên default thành công</summary><p>Đây là log lịch sử cùng phiên; chưa biết thao tác/tác nhân đã gây dừng. Không ghép vào phiên lỗi.</p><pre>{data.stopRows.map(row=>`${row.line} | ${row.text}`).join("\n")}</pre></details>}
 </section>;
}
