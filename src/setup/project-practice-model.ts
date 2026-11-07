import {hasJar} from "./execution-model";
import infrastructureSource from "../content/setup/practice-infrastructure-source.json" with { type: "json" };
import source from "../content/setup/practice-source.json" with { type: "json" };
import runtimeSource from "../content/setup/practice-runtime-source.json" with { type: "json" };
import { emptySimulation, isRuntimeTask, normalizeSimulation, practiceStep, runtimeTasks } from "./practice-runtime-model";
import type { Simulation } from "./practice-runtime-model";
export { source as practiceSource };
export { runtimeSource };
export function practiceFiles(task:string) {
  return isRuntimeTask(task)?[...source.files.filter(file=>!runtimeSource.files.some(item=>item.id===file.id)),...runtimeSource.files.map(file=>infrastructureSource.files.find(item=>item.id===file.id)??file)]:source.files;
}
export const PRACTICE_KEY = "backend-learning-workshop.project-practice.v1";
export type PracticeFile = typeof source.files[number]["id"];
export const commandPath = "workspaces/agent-service/1-agent-command-service";
export const commandModule = source.modulePaths.find(item => item.path === commandPath)!;
export const swaggerModule = source.modulePaths.find(item => item.path.endsWith("/swagger-service"))!;
export const practiceTasks = [
  {id:"root",label:"Workspace gốc",letter:"A",title:"Chọn 3 file nhận diện workspace",instruction:"Trong cây bên trái, lần lượt mở settings.gradle, build.gradle và gradlew.bat. Đọc đoạn được tô sáng sau mỗi lần mở.",real:"IntelliJ → File → Open → chọn thư mục có cả settings.gradle, build.gradle và gradlew.bat. So tên project và các module; tên thư mục chưa đủ xác nhận repo. Nếu cần, mở Git → Manage Remotes, đối chiếu namespace/repo với maintainer; không chia sẻ URL chứa credential."},
  {id:"missing",label:"Source thiếu",letter:"B",title:"Từ khai báo đến thư mục còn thiếu",instruction:"Mở settings.gradle, chọn một dòng include, rồi bấm “Đến thư mục trong cây”. Bắt đầu với module Command ở dòng 30.",real:"Trong IntelliJ, mở settings.gradle, tìm include của module và đổi dấu : thành từng cấp thư mục. Mở Project (Alt+1), đi tới đường dẫn đó. Nếu thiếu folder/source, chưa thể coi clone repo cha là đủ."},
  {id:"script",label:"Cách lấy source",letter:"C",title:"Tìm dòng clone đúng repo con",instruction:"Trong git-cmd.sh, chọn dòng có thư mục đích khớp repo đang thiếu. Bạn đang đọc source đã che; không chạy script.",real:"IntelliJ → mở git-cmd.sh, so namespace và target folder với module thiếu. Xin remote/quyền và hướng dẫn lấy đúng repo con từ maintainer; không chạy lại vào target đã có. Lịch sử không giữ exact invocation của người dùng."},
  {id:"after",label:"Sau lấy source",letter:"D",title:"Quan sát repo con vừa xuất hiện",instruction:"Chọn 1-agent-command-service vừa xuất hiện dưới workspaces → agent-service. So trạng thái Command với Swagger ở bảng đối chiếu.",real:"Sau khi bạn tự lấy source đúng hướng dẫn team: IntelliJ → Project → Reload from Disk/Synchronize (tùy phiên bản). Mở lại workspaces và so các folder thực tế với include. Bài học này không lấy source trên máy bạn."},
  {id:"command",label:"Module Command",letter:"E1",title:"Mở hai file cấu hình của Command",instruction:"Command là ứng dụng nhận yêu cầu ghi dữ liệu. Mở 1-agent-command-service → src → main → resources, rồi chọn application.yml và application-dev.yml để đối chiếu.",real:"IntelliJ → Project → workspaces/agent-service/1-agent-command-service/src/main/resources. Mở application.yml và application-dev.yml; tìm server.port, datasource.url và default_schema. Chưa bấm Run."},
  {id:"profile",label:"Đối chiếu profile",letter:"E2",title:"Chọn profile cho tình huống local trong bài",instruction:"Đối chiếu datasource trong hai file. Chọn profile phù hợp với database local, rồi xem những giá trị thay đổi trong bài.",real:"Run → Edit Configurations → đúng AgentCommandServiceApplication. Xem Active profiles, Program arguments, VM options và Environment variables. dev có thể đặt ở Active profiles hoặc --spring.profiles.active=dev. Kiểm tra SPRING_PROFILES_ACTIVE, -Dspring.profiles.active, spring.config.location/additional-location/import và file ngoài trước khi kết luận cấu hình hiệu lực; cần BE xác nhận DB/dependency trước Run."},
  ...runtimeTasks,
] as const;
export const visiblePracticeTasks=practiceTasks.filter(task=>task.id!=="verify");
export type PracticeTask = typeof practiceTasks[number]["id"];
export interface PracticeContext {
  task: PracticeTask; file: string; line: number; moduleLine: number;
  phase: "before"|"after"; folder: string; expanded: string[]; profile: "base"|"dev";
  sim: Simulation;
  view:"source"|"activity"; runSection:"run"|"results";
}
export interface PracticeProgress {
  version: 1; current: PracticeTask; contexts: Partial<Record<PracticeTask,PracticeContext>>; seen: string[]; completed: PracticeTask[];
}
export function defaultContext(task: PracticeTask): PracticeContext {
  return {task,runSection:task==="verify"?"results":"run",file: task === "missing" || task === "after" ? "settings" : task === "script" ? "clone" : task === "profile" ? "dev" : "",line:0,moduleLine:commandModule.line,phase:isRuntimeTask(task)||["after","command","profile"].includes(task)?"after":"before",folder:"",expanded:task==="profile"?[...parents(`${commandPath}/src/main/resources/application-dev.yml`)]:task==="build-task"?[...parents(commandPath),commandPath]:isRuntimeTask(task)||["after","command"].includes(task)?["workspaces","workspaces/agent-service"]:["workspaces"],profile:task==="connections"?"dev":"base",sim:emptySimulation(),view:isRuntimeTask(task)&&task!=="java"?"activity":"source"};
}
export function emptyPractice(): PracticeProgress { return {version:1,current:"root",contexts:{},seen:[],completed:[]}; }
export function readPracticeProgress(): PracticeProgress {
  try {
    const value=JSON.parse(localStorage.getItem(PRACTICE_KEY)??"null");
    if (value?.version!==1) return emptyPractice();
    const tasks=new Set<string>(practiceTasks.map(task=>task.id));
    const contexts: PracticeProgress["contexts"]={};
    for (const task of practiceTasks) {
      const saved=value.contexts?.[task.id];
      if (saved && typeof saved==="object") contexts[task.id]=normalizeContext({...saved,task:task.id});
    }
    if(contexts.verify&&(!contexts.startup||value.current==="verify"))contexts.startup={...contexts.verify,task:"startup",runSection:"results"};
    const completed=Array.isArray(value.completed)?value.completed.filter((id:unknown)=>typeof id==="string"&&tasks.has(id)):[];
    if(completed.includes("verify")&&!completed.includes("startup"))completed.push("startup");
    return {version:1,current:value.current==="verify"?"startup":tasks.has(value.current)?value.current:"root",contexts,seen:Array.isArray(value.seen)?value.seen.filter((x:unknown):x is string=>typeof x==="string"&&x.length<220):[],completed};
  } catch { return emptyPractice(); }
}
const knownFolders=new Set([...source.modulePaths.map(item=>item.path),...source.cloneTargets.map(item=>item.path),...source.files.map(file=>file.path),...runtimeSource.files.map(file=>file.path),runtimeSource.artifact.path].flatMap(path=>[path,...parents(path)]));
function safePath(value: unknown): string { return typeof value==="string"&&knownFolders.has(value)?value:""; }
export function normalizeContext(value: Partial<PracticeContext>): PracticeContext {
  const requested=practiceTasks.find(task=>task.id===value.task)?.id??"root";
  const task=requested==="verify"?"startup":requested;
  const defaults=defaultContext(task);
  const phase=isRuntimeTask(task)||["command","profile"].includes(task)||value.phase==="after"?"after":"before";
  const sim=normalizeSimulation(value.sim);
  const selectedFile=["startup","verify","summary"].includes(task)&&!value.file&&(sim.runSetup.saved||sim.commandSession.playback.reference!=="configured")?"main":value.file;
  const file=practiceFiles(task).find(file=>file.id===selectedFile && (phase==="after"||!file.path.startsWith("workspaces/")));
  const line=file?.rows.some(row=>row.line===Number(value.line))?Number(value.line):0;
  if(task==="run-config"&&file?.id==="main"&&sim.runSetup.step==="main")sim.runSetup={...sim.runSetup,step:"inspect"};
  return {...defaults,runSection:requested==="verify"||value.runSection==="results"?"results":"run",phase,file:file?.id??(isRuntimeTask(task)&&value.file==="artifact"&&hasJar(sim)?"artifact":""),line,moduleLine:!isRuntimeTask(task)&&!["command","profile"].includes(task)&&source.modulePaths.some(item=>item.line===Number(value.moduleLine))?Number(value.moduleLine):commandModule.line,folder:safePath(value.folder),expanded:["run-config","startup","verify","summary"].includes(task)&&file?.id==="main"?[...new Set([...(Array.isArray(value.expanded)?value.expanded.map(safePath).filter(Boolean):defaults.expanded),...parents(file.path)])]:Array.isArray(value.expanded)?[...new Set(value.expanded.map(safePath).filter(Boolean))]:defaults.expanded,profile:value.profile==="dev"?"dev":"base",sim,view:value.view==="activity"?"activity":value.view==="source"?"source":defaults.view};
}
export function parsePractice(search: string, progress: PracticeProgress): PracticeContext {
  const params=new URLSearchParams(search);
  const task=practiceTasks.find(task=>task.id===params.get("task"))?.id??progress.current;
  const saved=(task==="verify"?progress.contexts.startup??progress.contexts.verify:progress.contexts[task])??defaultContext(task);
  const live=progress.contexts[progress.current];
  const carryLive=["startup","verify","summary"].includes(task)&&live&&isRuntimeTask(live.task);
  let sim=carryLive?live.sim:saved.sim;
  if(params.has("psim")) { try { sim=normalizeSimulation(JSON.parse(params.get("psim")!.slice(0,16000))); } catch { sim=emptySimulation(); } }
  return normalizeContext({...saved,task,runSection:task==="verify"||params.get("prun")==="results"?"results":params.get("prun")==="run"?"run":saved.runSection,
    sim,
    view:params.get("pview")==="activity"?"activity":params.get("pview")==="source"?"source":saved.view,
    file:params.get("pfile")??saved.file,line:params.has("pline")?Number(params.get("pline")):saved.line,
    moduleLine:params.has("pmodule")?Number(params.get("pmodule")):saved.moduleLine,
    phase:params.has("pstate")?(params.get("pstate")==="after"?"after":"before"):saved.phase,
    folder:params.get("pfolder")??saved.folder,expanded:params.has("popen")?params.get("popen")!.split(","):saved.expanded,
    profile:params.has("pprofile")?(params.get("pprofile")==="dev"?"dev":"base"):carryLive?live.profile:saved.profile,
  });
}
export function practiceSearch(search: string, context: PracticeContext): string {
  const params=new URLSearchParams(search);
  params.set("experience","project");
  if(context.task==="startup")params.set("prun",context.runSection);else params.delete("prun");
  params.set("step",practiceStep(context.task,params.get("step")));
  if(isRuntimeTask(context.task)) params.set("pview",context.view); else params.delete("pview");
  const initial=emptySimulation();
  const simulation=Object.fromEntries(Object.entries(context.sim).filter(([key,value])=>JSON.stringify(value)!==JSON.stringify(initial[key as keyof Simulation])));
  // An explicit empty snapshot must override an older saved simulation after Reset.
  params.set("psim",JSON.stringify(simulation));
  for (const [key,value] of Object.entries({task:context.task,pfile:context.file,pline:String(context.line),pmodule:String(context.moduleLine),pstate:context.phase,pfolder:context.folder,popen:context.expanded.join(","),pprofile:context.profile})) {
    params.set(key,value);
  }
  return params.toString();
}
export function parents(path: string): string[] { const parts=path.split("/"); return parts.slice(0,-1).map((_,i)=>parts.slice(0,i+1).join("/")); }
export function sourceRows(id: string, task="root") {
  const file=practiceFiles(task).find(file=>file.id===id);
  return file?.rows.flatMap((row,i)=>[...(i&&row.line>file.rows[i-1].line+1?[{text:"⋯ (đoạn không trích)",kind:"hunk" as const}]:[]),{text:row.text,line:row.line}])??[];
}
