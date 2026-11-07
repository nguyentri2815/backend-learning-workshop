import source from "../content/setup/execution-source.json" with {type:"json"};
import type {Simulation} from "./practice-runtime-model";
export {source as executionSource};
export type OutputCause=""|"compileJava"|"bootJar"|"bootRun"|"main"|"legacy"|"unknown";
export type BuildStep="gradle-window"|"module"|"tasks"|"group"|"task"|"run"|"terminal"|"command"|"output";
export type BuildWalk={terminal:boolean;cwd:"workspace"|"module"|"other";checked:boolean;task:""|"bootJar"|"compileJava"|"root";stage:"idle"|"compile"|"package"|"success"|"failure";error:""|"cwd"|"jdk"|"root";launcher:"terminal"|"gradle";toolOpen:boolean;step:BuildStep;module:""|"command"|"flow";selectedTask:""|"bootJar"|"jar";feedback:""|"module"|"task"|"command"};
export type ExecutionState={buildDir:boolean;classes:boolean;jar:boolean;dirCause:OutputCause;classCause:OutputCause;jarCause:""|"bootJar"|"legacy";processVia:""|"main"|"bootRun";last:string;lastService:string;preview:"sync"|"compile"|"package"|"run";flow:BuildWalk};
export const emptyBuildWalk=():BuildWalk=>({terminal:false,cwd:"workspace",checked:false,task:"",stage:"idle",error:"",launcher:"gradle",toolOpen:false,step:"gradle-window",module:"",selectedTask:"",feedback:""});
export const emptyExecution=():ExecutionState=>({buildDir:false,classes:false,jar:false,dirCause:"",classCause:"",jarCause:"",processVia:"",last:"",lastService:"",preview:"sync",flow:emptyBuildWalk()});
export const moduleTask=(task:string)=>`.\\gradlew.bat ${source.gradlePath}:${task}`;
export const executionCommands={bootJar:moduleTask("bootJar"),compileJava:moduleTask("compileJava"),root:".\\gradlew.bat clean assemble"};
export const buildDirectory=source.modulePath+"/build",classesDirectory=buildDirectory+"/classes/java/main",libsDirectory=buildDirectory+"/libs";
export const hasJar=(s:Simulation)=>s.execution.jar;
const actions=["","terminal","cwd","task","sync","compile","package","build-failed","desktop","engine","image","compose-create","container-start","container-stop","run","run-blocked","stop","directory-example"];
export function normalizeExecution(value:unknown,legacyBuild:unknown):ExecutionState {
 const state=emptyExecution(),raw=value&&typeof value==="object"?value as Record<string,unknown>:{};
 state.jar=typeof raw.jar==="boolean"?raw.jar:legacyBuild==="module-success";
 state.jarCause=state.jar?(raw.jarCause==="bootJar"?"bootJar":"legacy"):"";
 state.classes=raw.classes===true;
 for(const key of ["dirCause","classCause"] as const)if(["","compileJava","bootJar","bootRun","main","legacy","unknown"].includes(raw[key] as string))state[key]=raw[key] as OutputCause;
 state.buildDir=raw.buildDir===true||state.jar||state.classes&&["compileJava","bootJar","bootRun"].includes(state.classCause);
 if(state.buildDir&&!state.dirCause)state.dirCause="unknown";
 if(!state.classes)state.classCause="";
 if(["main","bootRun"].includes(raw.processVia as string))state.processVia=raw.processVia as ExecutionState["processVia"];
 if(actions.includes(raw.last as string))state.last=raw.last as string;
 if(typeof raw.lastService==="string"&&/^[a-z-]{0,30}$/.test(raw.lastService))state.lastService=raw.lastService;
 if(["sync","compile","package","run"].includes(raw.preview as string))state.preview=raw.preview as ExecutionState["preview"];
 if(raw.flow&&typeof raw.flow==="object"){
  const flow=raw.flow as Record<string,unknown>;
  for(const key of ["terminal","checked","toolOpen"] as const)state.flow[key]=flow[key]===true;
  for(const [key,choices] of Object.entries({cwd:["workspace","module","other"],task:["","bootJar","compileJava","root"],stage:["idle","compile","package","success","failure"],error:["","cwd","jdk","root"],launcher:["terminal","gradle"]}))if(choices.includes(flow[key] as string))Object.assign(state.flow,{[key]:flow[key]});
  const steps=state.flow.launcher==="terminal"?["terminal","command","output"]:["gradle-window","module","tasks","group","task","run","output"];
  state.flow.step=steps.includes(flow.step as string)?flow.step as BuildStep:state.flow.stage!=="idle"?"output":state.flow.launcher==="terminal"?(state.flow.terminal?"command":"terminal"):"gradle-window";
  if(["command","flow"].includes(flow.module as string))state.flow.module=flow.module as BuildWalk["module"];
  if(["bootJar","jar"].includes(flow.selectedTask as string))state.flow.selectedTask=flow.selectedTask as BuildWalk["selectedTask"];
  if(["module","task","command"].includes(flow.feedback as string))state.flow.feedback=flow.feedback as BuildWalk["feedback"];
  if(state.flow.launcher==="gradle"&&state.flow.step!=="gradle-window")state.flow.toolOpen=true;
  if(["tasks","group","task","run"].includes(state.flow.step))state.flow.module="command";
  if(state.flow.step==="run")state.flow.selectedTask="bootJar";
  if(state.flow.launcher==="terminal"&&state.flow.step!=="terminal")state.flow.terminal=true;
 }
 return state;
}
export function resetBuildExecution(previous:ExecutionState):ExecutionState {
 return {...previous,jar:false,jarCause:"",classes:false,classCause:"",buildDir:false,dirCause:"",last:["compile","package","task","build-failed","directory-example"].includes(previous.last)?"":previous.last,flow:emptyBuildWalk()};
}
export function beginBuild(s:Simulation):Partial<Simulation>{
 const execution={...s.execution,last:"build-failed"},flow={...execution.flow};execution.flow=flow;
 if(!s.moduleSelected||!flow.task)return {};
 if(flow.launcher==="terminal"&&flow.cwd!=="workspace"){flow.stage="failure";flow.error="cwd";return {execution,notice:""};}
 if((flow.launcher==="gradle"?s.gradleJvm:s.jdk)!==21){flow.stage="failure";flow.error="jdk";return {execution,build:"jdk-error",notice:flow.launcher==="terminal"?"build-jdk":""};}
 if(flow.task==="root"){flow.stage="failure";flow.error="root";return {execution,rootTried:true,build:"root-error",notice:"root-error"};}
 flow.stage="compile";flow.error="";execution.last="task";
 return {execution,notice:""};
}
export function advanceBuild(s:Simulation):Partial<Simulation>{
 const execution={...s.execution,flow:{...s.execution.flow}},flow=execution.flow;
 if(flow.stage==="compile"){
  execution.buildDir=true;execution.classes=true;execution.dirCause=flow.task==="bootJar"?"bootJar":"compileJava";execution.classCause=execution.dirCause;execution.last="compile";
  flow.stage=flow.task==="bootJar"?"package":"success";
  return {execution,notice:""};
 }
 if(flow.stage==="package"){
  execution.jar=true;execution.jarCause="bootJar";execution.last="package";flow.stage="success";
  return {execution,build:"module-success",artifactSeen:false,notice:"build-ok"};
 }
 return {};
}
export function buildInstruction(s:Simulation){
 const flow=s.execution.flow;
 if(!s.moduleSelected)return "Chọn module 1-agent-command-service trong cây project. Source đã có; chọn module chưa chạy Gradle.";
 if(flow.launcher==="terminal"&&!flow.terminal)return "Mở Terminal IntelliJ trong mô phỏng để thực hiện Gradle task.";
 if(flow.launcher==="terminal"&&!flow.checked)return "Kiểm tra thư mục hiện tại của Terminal; lệnh Wrapper trong bài cần chạy tại root agent-system.";
 if(!flow.task)return "Chọn task Command:bootJar để học đóng gói. Compile chỉ tạo output biên dịch.";
 if(flow.stage==="compile")return "Hoàn tất bước compile trong mô phỏng; JAR chưa được tạo bởi lần chạy này.";
 if(flow.stage==="package")return "Thực hiện bước đóng gói bootJar; sau bước thành công JAR mới xuất hiện.";
 if(flow.stage==="failure")return flow.error==="cwd"?"Terminal chưa ở workspace root. Chuyển thư mục, kiểm tra lại rồi chạy task.":flow.error==="jdk"?`${flow.launcher==="gradle"?"Gradle JVM trong IDE":"JDK terminal"} chưa khớp yêu cầu 21. Đối chiếu F2/F3 rồi chạy lại; artifact có sẵn không tự biến mất.`:"Root task lỗi ở project cha; chọn task đầy đủ của Command. Không bắt buộc tái hiện lỗi này.";
 if(flow.stage==="success")return hasJar(s)?"Mở build/libs trong cây, chọn JAR để kiểm tra. Chưa có ứng dụng nào được khởi động thêm.":"Compile đã tạo class output; chọn bootJar nếu muốn đóng gói JAR, hoặc mở Run Configuration để chạy local.";
 return "Đọc đúng Gradle task rồi thực hiện trong mô phỏng.";
}
export function runCommandSimulation(s:Simulation,profile:"base"|"dev"):Partial<Simulation>{
 const good=(s.runMode==="intellij"?s.sdk:s.jdk)===21&&s.mainSelected&&profile==="dev"&&s.daemon&&s.containers["postgres-write"]==="running";
 const via=s.runMode==="intellij"?"main":"bootRun",execution={...s.execution,last:good?"run":"run-blocked",lastService:""};
 if(good){execution.processVia=via;if(!execution.classes){execution.classes=true;execution.classCause=via;}if(via==="bootRun"){execution.buildDir=true;execution.dirCause="bootRun";}}
 return {execution,process:good?"running":"error",launchMode:s.runMode,launchProfile:profile,logSeen:[],logLine:"",notice:good?"run-ok":"run-error"};
}
export function stopCommandSimulation(s:Simulation):Partial<Simulation>{return {process:"stopped",execution:{...s.execution,last:"stop",lastService:""},notice:"stopped"};}
export const operationLabels:Record<string,string>={terminal:"Mở Terminal: chưa thực hiện task",cwd:"Kiểm tra thư mục: chưa compile/package",task:"Chọn hoặc bắt đầu task: chưa có JAR mới",sync:"Gradle sync: IDE nhận model; không package/run",compile:"Compile: có output class; không tự đóng gói hoặc chạy",package:"bootJar: đã đóng gói; không khởi động Command/container", "build-failed":"Lần thử chưa thành công; không suy ra artifact cũ biến mất",desktop:"Mở Docker Desktop: chưa tạo container",engine:"Engine sẵn sàng: chưa tạo hoặc Start container",image:"Chuẩn bị image: chưa tạo container hoặc JAR Java", "compose-create":"Compose đã tạo container; chưa khởi động dịch vụ", "container-start":"Start container đã có; không tạo thêm container", "container-stop":"Stop giữ container; không xóa JAR",run:"Run tạo process trên host; không tạo container Docker", "run-blocked":"Kiểm tra trước Run chưa qua; chưa khởi động Command trong bài",stop:"Stop process Command; JAR và container giữ nguyên", "directory-example":"build/ đã có trong giả thiết; chưa chứng minh có JAR"};
