import {BuildPractice} from "./BuildPractice";
import {RunConfigurationPractice} from "./RunConfigurationPractice";
import {RuntimeCommandLesson} from "./RuntimeCommandLesson";
import {ActionOutcomes,AgentExecutionHistory,ExecutionState} from "./ExecutionEvidence";
import {buildInstruction,executionSource} from "./execution-model";
import {conflictInstruction} from "./conflict-lab-model";
import { dockerInstruction } from "./docker-practice-model";
import { IntelliJPractice, ideActions } from "./IntelliJPractice";
import { ConnectionPractice } from "./ConnectionPractice";
import { DockerPractice, ConflictPractice } from "./DockerPractice";
import { runtimeSource } from "./project-practice-model";
import type { PracticeContext, PracticeTask } from "./project-practice-model";
import type { Simulation } from "./practice-runtime-model";
import "./runtime-practice.css";
import "./runtime-labs.css";

type Props={context:PracticeContext;change:(value:Partial<PracticeContext>,replace?:boolean)=>void;observe:(key:string,complete?:PracticeTask)=>void;open:(id:string,line?:number)=>void;resetBuild:()=>void};
export function runtimeLine(context:PracticeContext,id:string,line:number) {
  const sim={...context.sim,notice:""} as Simulation;
  let complete:PracticeTask|undefined;
  if(context.task==="java"&&id==="build"&&line===48) complete="java";
  if(context.task==="connections"&&sim.connectionModule==="command"&&sim.connectionProfile!=="test") {
    const connection=runtimeSource.connections.find(item=>item.line===line);
    if(id==="default"||id==="dev") sim.dependency=connection?connection.id as Simulation["dependency"]:"";
    if(connection){sim.surveyGroup=connection.id;sim.surveyStep="config";sim.surveyProof="";}
    const current=runtimeSource.connections.find(item=>item.id===sim.dependency);
    if(id==="compose"&&line===current?.portLine) complete="connections";
  }
  return {sim,complete};
}
export function runtimeCanNext(context:PracticeContext,seen:string[]) {
  const s=context.sim;
  switch(context.task) {
    case "java":return seen.includes("java:line");
    case "jdk":return s.jdk===21;
    case "ide":return s.synced&&s.sdk===21&&s.language===21&&s.gradleJvm===21;
    case "connections":return s.connectionModule==="command"&&s.connectionProfile!=="test"&&(seen.includes("connections:line")||s.surveyRead.length>0);
    case "daemon":return s.daemon&&s.containers["postgres-write"]==="running";
    case "conflict":return s.conflict==="selective"&&s.conflictResolved.length===2;
    case "build-task":return true;
    case "run-config":return s.runSetup.saved&&s.runSetup.step==="saved";
    case "startup":return s.commandSession.shown===3;
    case "verify":return s.commandReview.checked.length===3;
    default:return false;
  }
}
export function runtimeInstruction(context:PracticeContext,fallback:string) {
  if(context.task==="connections"&&(context.sim.connectionModule!=="command"||context.sim.connectionProfile==="test"))return "Phạm vi này chưa có bài G1 được xác minh. Quay lại ví dụ Command • dev để thực hành phương pháp.";
  if(context.task==="ide") return ideActions[context.sim.ideStep]?.instruction??ideActions.file.instruction;
  if(context.task==="daemon") return dockerInstruction(context.sim);
  if(context.task==="build-task")return buildInstruction(context.sim);
  if(context.task==="conflict")return conflictInstruction(context.sim.conflictCase,context.sim.conflictLab[context.sim.conflictCase]);
  if(context.task==="verify") return {window:"Chọn nơi xem log của cách chạy đã chọn.",error:"Trong log lỗi mô phỏng, chọn dòng đầu tiên nêu nguyên nhân cụ thể.",port:"Chọn port thuộc Command theo cấu hình đã đọc.",levels:"Chọn kết luận tối đa mà trạng thái bài học đang hỗ trợ.",done:"Đã phân biệt các mức kiểm tra. Tiếp tục để xem bản tóm tắt từ trạng thái bài học."}[context.sim.review];
  return fallback;
}
function Table({rows,caption}:{rows:[string,string][];caption?:string}) {
  return <div className="runtime-table-wrap"><table className="runtime-table">{caption&&<caption>{caption}</caption>}<tbody>{rows.map(([name,value])=><tr key={name}><th>{name}</th><td>{value}</td></tr>)}</tbody></table></div>;
}
function Result({children}:{children:React.ReactNode}) { return <div className="runtime-result"><b>MÔ PHỎNG · kết quả trong bài học</b>{children}</div>; }
export function RuntimeArtifact({sim,compact=false}:{sim?:Simulation;compact?:boolean}) {
  const artifact=runtimeSource.artifact;
  if(compact)return <div className="runtime-artifact"><h3>JAR của Command</h3><span className="runtime-tag">Kết quả đóng gói · mô phỏng</span><code>{artifact.path}</code><p>{sim?.execution.jarCause==="bootJar"?"Nguồn trong bài: bạn hoàn tất task bootJar của module Command; chưa có process mới từ thao tác đóng gói.":"JAR có trong tiến độ đã lưu; chưa có process mới từ thao tác đóng gói."}</p></div>;
  return <div className="runtime-artifact"><h3>Boot JAR của Command</h3><span className="runtime-tag">Artifact của tình huống học · tên file đối chiếu source và metadata</span><code>{artifact.path}</code><p>{sim?.execution.jarCause==="bootJar"?"Nguồn trong bài: bạn hoàn tất task bootJar của module Command.":"Tiến độ cũ ghi build thành công; thao tác tạo chi tiết chưa được lưu."}</p><p>{sim?.process==="running"?"Process đang chạy được theo dõi riêng; không do việc mở hoặc đóng gói JAR tạo ra.":"JAR là kết quả đóng gói; chưa có process Command mới hoặc container Docker từ thao tác đóng gói."}</p><details><summary>Metadata artifact thật lúc khảo sát · không phải vừa build Java</summary><Table rows={[["Nguồn",executionSource.artifact.kind],["Kích thước quan sát",`${artifact.bytes.toLocaleString("vi-VN")} bytes`],["Mtime filesystem",artifact.lastModified],["Revision",artifact.revision]]}/></details><p>bootRun hoặc Run main có thể dùng classes/classpath mà không cần đóng gói JAR trước mỗi lần chạy.</p></div>;
}
export function RuntimePractice(props:Props){
 const {context,change}=props,s=context.sim;
 if(context.task==="build-task")return <BuildPractice context={context} change={change} observe={props.observe} onRestart={props.resetBuild}/>;
 if(context.task==="run-config")return <RunConfigurationPractice context={context} change={change} observe={props.observe} open={props.open} onRestart={props.resetBuild}/>;
 if(["startup","verify","summary"].includes(context.task))return <RuntimeCommandLesson context={context} change={change} observe={props.observe} open={props.open} onRestart={props.resetBuild}/>;
 if(!["ide","daemon"].includes(context.task))return <RuntimeActivity {...props}/>;
 return <div className="execution-lesson"><ExecutionState context={context}/><RuntimeActivity {...props}/><div className="execution-extras"><ActionOutcomes sim={s} update={patch=>change({sim:{...s,...patch}})} go={task=>change({task,view:"activity",sim:{...s,notice:""}})}/><AgentExecutionHistory kind={context.task==="daemon"?"docker":["run-config","startup","verify"].includes(context.task)?"run":"build"}/></div></div>;
}
function RuntimeActivity({context,change,observe,open}:Props) {
  const {task,sim:s}=context;
  const update=(patch:Partial<Simulation>,complete?:PracticeTask)=>{change({sim:{...s,...patch}});if(complete)observe(`${complete}:action`,complete);};
  if(task==="java") return <section className="runtime-activity"><p>Yêu cầu project nằm ở <button className="text-button" onClick={()=>open("build",48)}>build.gradle:48</button>. Chọn số dòng để đối chiếu với kết quả Java ở phần tiếp theo.</p></section>;
  if(task==="jdk") return <section className="runtime-activity" aria-label="Java và Gradle trong tình huống học"><h3>Java / Gradle</h3><span className="runtime-tag">Tình huống dựa S01 → S04 · không kiểm tra live</span><Table rows={[["Project yêu cầu","Java toolchain 21 · build.gradle:48"],["java -version trong bài",`Java ${s.jdk}`],["Gradle Wrapper","8.14.3 · gradle-wrapper.properties:3"],["Launcher / Daemon JVM trong bài",`JDK ${s.jdk}`],["Đối chiếu",s.jdk===21?"Khớp yêu cầu trong tình huống":"Lệch: 17 chưa đáp ứng 21"]]}/><label className="runtime-field">JDK cho terminal/Gradle trong bài<select aria-label="JDK cho terminal/Gradle trong bài" value={s.jdk} onChange={event=>{const jdk=Number(event.target.value) as 17|21;update({jdk,notice:jdk===21?"jdk-ok":"jdk-wrong"},jdk===21?"jdk":undefined);}}><option value={17}>JDK 17</option><option value={21}>JDK 21</option></select></label><Result><p>{s.jdk===21?"java và Gradle dùng 21 trong mô hình; chưa xác nhận IDE.":"Có Java 17 và Gradle wrapper chưa có nghĩa đã đáp ứng toolchain 21."}</p></Result><details><summary>Cách kiểm tra lại trên máy thật</summary><pre>{"java -version\n.\\gradlew.bat --version"}</pre><p>Báo cáo ghi Temurin 21.0.13 sau chuyển đổi. Không giữ installer/lệnh cài lịch sử; dùng hướng dẫn được team xác nhận nếu chưa có JDK.</p></details></section>;
  if(task==="ide") return <IntelliJPractice sim={s} update={(patch,complete)=>update({...patch,...(patch.ideStep==="check"?{execution:{...s.execution,last:"sync",lastService:""}}:{})},complete?"ide":undefined)}/>;
  if(task==="connections") return <ConnectionPractice context={context} change={change} observe={observe} open={open}/>;
  if(task==="daemon") return <DockerPractice sim={s} update={(patch,complete)=>update(patch,complete?"daemon":undefined)}/>;
  if(task==="conflict") return <ConflictPractice sim={s} profile={context.profile} open={open} update={(patch,complete)=>update(patch,complete?"conflict":undefined)}/>;
  return null;
}
