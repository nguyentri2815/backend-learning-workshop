import {emptyCommandSession,emptyCommandReview,emptyTaskPractice,normalizeCommandSession,normalizeCommandReview,normalizeTaskPractice} from "./command-session-model";
import type {CommandSession,CommandReview,TaskPractice} from "./command-session-model";
import surveySource from "../content/setup/dependency-survey.json" with {type:"json"};
import {emptyConflictLab,normalizeConflictLab} from "./conflict-lab-model";
import type {ConflictLab} from "./conflict-lab-model";
import {emptyExecution,normalizeExecution,resetBuildExecution} from "./execution-model";
import type {ExecutionState} from "./execution-model";
import {emptyRunSetup,normalizeRunSetup} from "./run-configuration-model";
import type {RunSetup} from "./run-configuration-model";
import {emptyCommandCase,normalizeCommandCase} from "./command-cases";
import type {CommandCaseState} from "./command-cases";
export const runtimeTasks = [
  {id:"java",letter:"F1",label:"Java yêu cầu",title:"Tìm Java project yêu cầu",instruction:"Mở build.gradle và chọn dòng khai báo Java toolchain.",real:"IntelliJ → Project → build.gradle → java.toolchain.languageVersion. Sau đó mở Terminal ở workspace và tự chạy java -version, .\\gradlew.bat --version; đối chiếu cả Launcher/Daemon JVM. Bài học không chạy các lệnh này."},
  {id:"jdk",letter:"F2",label:"JDK cho Gradle",title:"Đổi JDK trong tình huống học",instruction:"Đối chiếu kết quả Java/Gradle bên cạnh, rồi chọn JDK đáp ứng yêu cầu 21.",real:"Nếu chưa có JDK 21, dùng hướng dẫn cài được team xác nhận; báo cáo không giữ installer/lệnh cài nên bài học không dựng lại. Chọn JDK đã cài cho terminal/JAVA_HOME, mở terminal mới rồi kiểm tra java -version và .\\gradlew.bat --version."},
  {id:"ide",letter:"F3",label:"Thực hành IntelliJ",title:"Đi đến cấu hình trong IntelliJ",instruction:"Mỗi lần thực hiện một thao tác theo chỉ dẫn trong cửa sổ mô phỏng.",real:"IntelliJ → File → Project Structure: Project SDK 21, language level 21/SDK default, module SDK = Project SDK; Settings → Build Tools → Gradle: Wrapper và Gradle JVM 21. Kiểm tra bytecode target, Lombok/annotation processing rồi Reload All Gradle Projects. Chỉ dùng Invalidate Caches sau khi đã đối chiếu các mục trên."},
  {id:"connections",letter:"G1",label:"Khảo sát dependency",title:"Tìm dịch vụ cần cho mục tiêu của bạn",instruction:"Chọn mục tiêu và một nhóm trong danh mục. Mở cấu hình → binding/client → nơi gọi/điều kiện, rồi xem cần chuẩn bị gì.",real:"IntelliJ → Command/src/main/resources → đọc file nền và profile đang xét. Tìm khóa bằng Find in Files, lần @Value/Feign/bean tới nơi gọi và điều kiện kích hoạt. Đối chiếu Compose nếu có service local; xác nhận args, VM properties, env và file ngoài. URL chưa chứng minh service bắt buộc hoặc đã kết nối."},
  {id:"daemon",letter:"G2",label:"Docker daemon",title:"CLI có nhưng daemon chưa chạy",instruction:"Mở Docker Desktop trong bài, kiểm tra lại Engine, chọn postgres-write và Start; đọc log sẵn sàng riêng.",real:"Tự chạy docker version trong PowerShell. Nếu chỉ có Client và lỗi pipe, mở Docker Desktop/Engine đã được cài, chờ engine sẵn sàng rồi kiểm tra lại. UI này không mở Docker Desktop hoặc đọc daemon máy bạn."},
  {id:"conflict",letter:"G3",label:"Xử lý conflict",title:"Từ lần thử lỗi đến kế hoạch chạy lại",instruction:"Thử tạo/chạy service, đọc lỗi, mở container hiện hữu để tìm nguyên nhân rồi thay đổi kế hoạch và chạy lại.",real:"Đối chiếu lỗi tạo/chạy với docker ps -a hoặc Docker Desktop và container_name/ports trong Compose. Container stopped vẫn giữ tên; host port đang dùng là nguyên nhân khác. Chọn service theo mục tiêu, kiểm tra tên/cổng mới và đích Java nếu cần; tái sử dụng phải xác nhận owner, cấu hình, quyền và phạm vi dữ liệu."},
  {id:"build-task",letter:"H",label:"Build Command",title:"Build Command để kiểm tra source",instruction:"Mở Gradle trong IntelliJ, tìm module Command → Tasks → build → bootJar, rồi Run; hoặc dùng Terminal.",real:"Trong IntelliJ, mở Gradle → module Command → Tasks → build, chuột phải bootJar → Run. Hoặc Terminal tại root agent-system: .\\gradlew.bat :workspaces:agent-service:1-agent-command-service:bootJar. Không cần tạo JAR trước mỗi lần Run local."},
  {id:"run-config",letter:"I1",label:"Thiết lập cách chạy Command",title:"Thiết lập cách chạy Command",instruction:"Mở main class, xem main() rồi mở Run → Edit Configurations để chọn profile dev và Apply/OK.",real:"IntelliJ → AgentCommandServiceApplication.java → Run → Edit Configurations: đúng main class, module classpath và Active profiles dev. Apply/OK chỉ lưu thiết lập; bấm Run mới khởi động. Đối chiếu arguments, env và file ngoài; dev không làm mọi kết nối thành local."},
  {id:"startup",letter:"I2",label:"Chạy Command và đọc kết quả",title:"Chạy Command và đọc kết quả",instruction:"Bấm Run trên thanh IntelliJ; xem log xuất hiện rồi Stop trong cửa sổ Run.",real:"Chỉ khi đã xác nhận JDK, DB/schema, dependency và override được phép: chạy Run Configuration IntelliJ hoặc lệnh PowerShell được hiển thị. Xem IntelliJ Run/Services hoặc chính terminal bootRun. Dừng bằng Stop trong IntelliJ hoặc Ctrl+C ở terminal giữ process; kiểm tra lại port của đúng process."},
  {id:"verify",letter:"J1",label:"Kiểm tra Command đã chạy đến đâu",title:"Kiểm tra Command đã chạy đến đâu",instruction:"Tìm profile, port và Started ngay trong cửa sổ Run của lần chạy vừa rồi.",real:"Xem Run/Services nếu chạy IntelliJ; xem terminal đang giữ bootRun nếu dùng PowerShell. Tìm lỗi đầu tiên có nguyên nhân cụ thể/Caused by, đối chiếu Get-NetTCPConnection -State Listen với process sở hữu port. HTTP cần endpoint/exposure/auth được xác nhận; nghiệp vụ cần kịch bản input/expected riêng. Bài học không gửi request hoặc ghi DB."},
  {id:"summary",letter:"J2",label:"Chuẩn bị bắt đầu task",title:"Chuẩn bị bắt đầu task",instruction:"Mở lại cấu hình, Run, xem log rồi Stop; ghi nhận Đã thực hành.",real:"Dùng bản tóm tắt để tự kiểm tra trên máy thật và trao đổi với BE/Tech Lead: module, profile/override, DB/schema, dependency, lệnh và log. Chốt endpoint/auth và kịch bản nghiệp vụ được phép trước khi gọi là sẵn sàng làm task. Bài học không xác nhận máy thật đã sẵn sàng."},
] as const;
export type RuntimeTask = typeof runtimeTasks[number]["id"];
export const isRuntimeTask=(id:string):id is RuntimeTask=>runtimeTasks.some(task=>task.id===id);
export function practiceStep(task:string,requested?:string|null) {
  if(["java","jdk","ide"].includes(task)) return "tools";
  if(["connections","daemon","conflict"].includes(task)) return "dependencies";
  if(task==="build-task") return "build";
  if(["run-config","startup","verify"].includes(task)) return "run";
  if(task==="summary") return "ready";
  return task==="profile"&&requested==="config"?"config":"source";
}
export const firstPracticeTask:Record<string,string>={source:"root",tools:"java",config:"profile",dependencies:"connections",build:"build-task",run:"run-config",ready:"summary"};
export const buildCommand=".\\gradlew.bat :workspaces:agent-service:1-agent-command-service:bootJar";
export const runCommand=(profile:"base"|"dev")=>`.\\gradlew.bat :workspaces:agent-service:1-agent-command-service:bootRun${profile==="dev"?' --args="--spring.profiles.active=dev"':""}`;
export interface Simulation {
  commandSession:CommandSession;commandReview:CommandReview;taskPractice:TaskPractice;commandCase:CommandCaseState;
  runSetup:RunSetup;
  execution:ExecutionState;containerOrigins:Record<string,"compose-user"|"existing"|"unknown">;containerWhy:string;
  surveyGroup:string; surveyGoal:"build"|"startup"|"auth"|"document"|"event"; surveyStep:"config"|"binding"|"call"|"conclusion"; surveyProof:string; surveyRead:string[]; surveyGraph:boolean; surveyOrigin:boolean;
  surveyProviders:Record<string,"evidence"|"docker"|"java"|"remote"|"unknown">;
  connectionModule:"command"|"flow"|"query"|"cdc"; connectionProfile:"inherit"|"base"|"dev"|"test";
  dockerEntry:"first"|"existing"; dockerInstalled:boolean; dockerInspected:boolean;
  composeService:"postgres-write"|"redis"|"rabbitmq"|"kafka"|"zookeeper"; composePrepared:boolean; composeStage:"idle"|"image"|"create"|"start"|"done"|"conflict";
  dockerPortConflict:boolean; dockerNameConflict:boolean;
  desktopOpen:boolean; ideStep:string; ideLast:string; ideHint:boolean; ideMissing:boolean;
  containers:Record<string,"stopped"|"running">; containerSelected:string; readyEvidence:string[];
  conflictLab:ConflictLab;
  conflictCase:"name"|"port"; conflictRow:string; conflictFound:string[]; conflictResolved:string[];
  infraOpen:boolean; infraScope:"command"|"workspace"; infraSelected:string;
  jdk:17|21; sdk:17|21; language:17|21; gradleJvm:17|21; synced:boolean; diagnosis:boolean;
  dependency:""|"postgres"|"rabbit"|"redis"; daemon:boolean; conflict:"none"|"delete"|"all"|"selective";
  moduleSelected:boolean; buildTarget:"root"|"module"; build:"none"|"root-error"|"jdk-error"|"module-success"; rootTried:boolean; artifactSeen:boolean;
  mainSelected:boolean; runMode:"intellij"|"powershell"; launchMode:"intellij"|"powershell"; process:"idle"|"running"|"stopped"|"error"; launchProfile:"base"|"dev";
  logSeen:string[]; logLine:string; review:"window"|"error"|"port"|"levels"|"done"; levelChoice:""|"none"|"build"|"process"|"full";
  notice:""|"jdk-wrong"|"jdk-ok"|"ide-wrong"|"ide-ok"|"daemon-wrong"|"daemon-ok"|"conflict-wrong"|"conflict-ok"|"root-error"|"build-ok"|"build-jdk"|"run-error"|"run-ok"|"stopped"|"wrong-log"|"right-log"|"wrong-error"|"right-error"|"wrong-port"|"right-port"|"wrong-level"|"right-level"|"summary";
}
export function emptySimulation():Simulation {
  return {commandCase:emptyCommandCase(),commandSession:emptyCommandSession(),commandReview:emptyCommandReview(),taskPractice:emptyTaskPractice(),runSetup:emptyRunSetup(),execution:emptyExecution(),containerOrigins:{},containerWhy:"",conflictLab:emptyConflictLab(),surveyGroup:"",surveyGoal:"startup",surveyStep:"config",surveyProof:"",surveyRead:[],surveyGraph:false,surveyOrigin:false,surveyProviders:{},connectionModule:"command",connectionProfile:"inherit",dockerEntry:"first",dockerInstalled:true,dockerInspected:false,composeService:"postgres-write",composePrepared:false,composeStage:"idle",dockerPortConflict:false,dockerNameConflict:false,desktopOpen:false,ideStep:"file",ideLast:"",ideHint:false,ideMissing:false,containers:{},containerSelected:"postgres-write",readyEvidence:[],conflictCase:"name",conflictRow:"",conflictFound:[],conflictResolved:[],infraOpen:false,infraScope:"command",infraSelected:"",jdk:17,sdk:21,language:17,gradleJvm:21,synced:false,diagnosis:false,dependency:"",daemon:false,conflict:"none",moduleSelected:false,buildTarget:"root",build:"none",rootTried:false,artifactSeen:false,mainSelected:false,runMode:"intellij",launchMode:"intellij",process:"idle",launchProfile:"base",logSeen:[],logLine:"",review:"window",levelChoice:"",notice:""};
}
export function normalizeSimulation(value:unknown):Simulation {
  const base=emptySimulation();
  if(!value||typeof value!=="object") return base;
  const data=value as Record<string,unknown>;
  const choices={dependency:["","postgres","rabbit","redis"],conflict:["none","delete","all","selective"],buildTarget:["root","module"],build:["none","root-error","jdk-error","module-success"],runMode:["intellij","powershell"],process:["idle","running","stopped","error"],launchProfile:["base","dev"],review:["window","error","port","levels","done"],levelChoice:["","none","build","process","full"],logLine:["","profile","port","started","wrapper","cause","failed"],notice:["","jdk-wrong","jdk-ok","ide-wrong","ide-ok","daemon-wrong","daemon-ok","conflict-wrong","conflict-ok","root-error","build-ok","build-jdk","run-error","run-ok","stopped","wrong-log","right-log","wrong-error","right-error","wrong-port","right-port","wrong-level","right-level","summary"]};
  const result:Record<string,unknown>={...base};
  result.conflictLab=normalizeConflictLab(data.conflictLab);
  result.execution=normalizeExecution(data.execution,data.build);
  result.runSetup=normalizeRunSetup(data.runSetup);
  result.commandSession=normalizeCommandSession(data.commandSession,data.process,data.launchProfile==="dev"?"dev":"base");
  result.commandReview=normalizeCommandReview(data.commandReview);
  result.commandCase=normalizeCommandCase(data.commandCase);
  result.taskPractice=normalizeTaskPractice(data.taskPractice);
  const groupIds=surveySource.groups.map(group=>group.id);
  if(typeof data.surveyGroup==="string"&&groupIds.includes(data.surveyGroup))result.surveyGroup=data.surveyGroup;
  if(["build","startup","auth","document","event"].includes(data.surveyGoal as string))result.surveyGoal=data.surveyGoal;
  if(["config","binding","call","conclusion"].includes(data.surveyStep as string))result.surveyStep=data.surveyStep;
  if(typeof data.surveyProof==="string"&&surveySource.evidence.some(proof=>proof.id===data.surveyProof))result.surveyProof=data.surveyProof;
  result.surveyRead=Array.isArray(data.surveyRead)?[...new Set(data.surveyRead.filter(item=>groupIds.includes(item)))]:[];
  result.surveyGraph=data.surveyGraph===true;result.surveyOrigin=data.surveyOrigin===true;
  if(data.surveyProviders&&typeof data.surveyProviders==="object")result.surveyProviders=Object.fromEntries(Object.entries(data.surveyProviders).filter(([key,value])=>groupIds.includes(key)&&["evidence","docker","java","remote","unknown"].includes(value as string)));
  if(["command","flow","query","cdc"].includes(data.connectionModule as string))result.connectionModule=data.connectionModule;
  if(["base","dev","test"].includes(data.connectionProfile as string))result.connectionProfile=data.connectionProfile;
  if(data.dockerEntry==="existing")result.dockerEntry="existing";
  result.dockerInstalled=data.dockerInstalled!==false;
  result.dockerInspected=data.dockerInspected===true;
  result.dockerPortConflict=data.dockerPortConflict===true;
  result.dockerNameConflict=data.dockerNameConflict===true;
  result.composePrepared=data.composePrepared===true;
  if(["postgres-write","redis","rabbitmq","kafka","zookeeper"].includes(data.composeService as string))result.composeService=data.composeService;
  if(["idle","image","create","start","done","conflict"].includes(data.composeStage as string))result.composeStage=data.composeStage;
  for(const key of ["jdk","sdk","language","gradleJvm"]) result[key]=data[key]===21?21:data[key]===17?17:result[key];
  for(const key of ["synced","diagnosis","daemon","moduleSelected","rootTried","artifactSeen","mainSelected"]) result[key]=data[key]===true;
  for(const [key,allowed] of Object.entries(choices)) if(typeof data[key]==="string"&&allowed.includes(data[key])) result[key]=data[key];
  result.launchMode=data.launchMode==="powershell"?"powershell":"intellij";
  result.logSeen=Array.isArray(data.logSeen)?[...new Set(data.logSeen.filter(item=>["profile","port","started"].includes(item)))]:[];
  const ideSteps=["file","structure","project","sdk","sdk-choice","add","disk","download","jdk-folder","download-choice","language","language-choice","project-apply","project-ok","settings-file","settings","build-settings","gradle-settings","gradle-jvm","gradle-choice","settings-apply","settings-ok","gradle-window","reload","check","done"];
  for(const key of ["ideStep","ideLast"]) if(typeof data[key]==="string"&&ideSteps.includes(data[key])) result[key]=data[key];
  for(const key of ["desktopOpen","ideHint","ideMissing","infraOpen"]) result[key]=data[key]===true;
  if(data.infraScope==="workspace") result.infraScope="workspace";
  if(typeof data.infraSelected==="string"&&/^[a-z-]{0,80}$/.test(data.infraSelected)) result.infraSelected=data.infraSelected;
  const services=["postgres-write","postgres-read","rabbitmq","redis","kafka","zookeeper","debezium","kafka-ui","rebrow"];
  if(typeof data.containers==="object"&&data.containers) result.containers=Object.fromEntries(Object.entries(data.containers).filter(([key,value])=>services.includes(key)&&["stopped","running"].includes(value as string)));
  if(typeof data.containerSelected==="string"&&services.includes(data.containerSelected)) result.containerSelected=data.containerSelected;
  if(data.dockerEntry==="existing"&&data.containers===undefined)result.containers={"postgres-write":"stopped"};
  if(!result.dockerInstalled){result.daemon=false;result.desktopOpen=false;}
  result.readyEvidence=Array.isArray(data.readyEvidence)&&data.daemon===true&&((result.containers as Record<string,string>)["postgres-write"]==="running")?data.readyEvidence.filter(item=>item==="postgres-write"):[];
  if(data.containerOrigins&&typeof data.containerOrigins==="object")result.containerOrigins=Object.fromEntries(Object.entries(data.containerOrigins).filter(([key,value])=>services.includes(key)&&Boolean((result.containers as Record<string,string>)[key])&&["compose-user","existing","unknown"].includes(value as string)&&(!(value==="compose-user")||["postgres-write","redis","rabbitmq","kafka","zookeeper"].includes(key))));
  if(data.dockerEntry==="existing"&&data.containers===undefined)result.containerOrigins={"postgres-write":"existing",...(result.containerOrigins as Record<string,string>)};
  if(typeof data.containerWhy==="string"&&services.includes(data.containerWhy))result.containerWhy=data.containerWhy;
  if(data.conflictCase==="port") result.conflictCase="port";
  if(typeof data.conflictRow==="string"&&["","rebrow","port-owner","unrelated"].includes(data.conflictRow)) result.conflictRow=data.conflictRow;
  for(const key of ["conflictFound","conflictResolved"]) result[key]=Array.isArray(data[key])?[...new Set(data[key].filter(item=>["name","port"].includes(item)))]:[];
  return result as unknown as Simulation;
}
export function resetSimulation(task:string,value:Simulation):Simulation {
  const initial=emptySimulation();
  const fields:Record<string,(keyof Simulation)[]>={jdk:["jdk"],ide:["sdk","language","gradleJvm","synced","diagnosis","ideStep","ideLast","ideHint","ideMissing"],connections:["dependency","connectionModule","connectionProfile","surveyGroup","surveyGoal","surveyStep","surveyProof","surveyRead","surveyGraph","surveyOrigin","surveyProviders"],daemon:["daemon","desktopOpen","containers","containerSelected","readyEvidence","dockerEntry","dockerInstalled","dockerInspected","composeService","composePrepared","composeStage"],conflict:["conflictLab","conflict","conflictCase","conflictRow","conflictFound","conflictResolved"],"build-task":["moduleSelected","buildTarget","build","rootTried","artifactSeen"],"run-config":["mainSelected","runMode"],startup:["process","logSeen","logLine"],verify:["review","levelChoice","logLine"]};
  const next={...value,notice:""} as Simulation;
  for(const key of fields[task]??[]) Object.assign(next,{[key]:initial[key]});
  if(task==="build-task")next.execution=resetBuildExecution(value.execution);
  if(task==="run-config")next.runSetup=emptyRunSetup();
  if(task==="startup"){next.commandSession={...emptyCommandSession(),id:value.commandSession.id};next.commandReview=emptyCommandReview();next.commandCase=emptyCommandCase();}
  if(task==="verify")next.commandReview=emptyCommandReview();
  if(task==="summary")next.taskPractice=emptyTaskPractice();
  if(task==="daemon"){next.containerOrigins={};next.containerWhy="";if(["desktop","engine","image","compose-create","container-start","container-stop"].includes(value.execution.last))next.execution={...value.execution,last:"",lastService:""};}
  if(["run-config","startup"].includes(task)&&["run","run-blocked","stop"].includes(value.execution.last))next.execution={...value.execution,last:"",lastService:""};
  if(task==="ide"&&value.execution.last==="sync")next.execution={...value.execution,last:""};
  return next;
}
export function runtimeFeedback(sim:Simulation):string {
  if(sim.notice==="run-error") return sim.jdk!==21?"JDK trong bài đang là 17, chưa khớp yêu cầu 21. Quay lại F2 chọn JDK phù hợp rồi thử lại.":!sim.mainSelected?"Chưa chọn dòng chạy main class Command. Quay lại Run Configuration, mở main class và chọn SpringApplication.run.":sim.launchProfile!=="dev"?"Chưa chọn profile dev cho tình huống local; file gốc trỏ datasource remote đã che. Đối chiếu Run Configuration và thử lại, không có kết nối thật.":"Kiểm tra Docker Engine và trạng thái postgres-write trong bài; nếu chưa có container thì chuẩn bị ở G2, nếu stopped thì Start. Việc đọc log G2 không chặn Run và chưa xác nhận auth/schema hay kết nối Java.";
  const messages:Record<Simulation["notice"],string>={
    "":"Chọn trong vùng thực hành để xem kết quả. Các giá trị và kết quả ở đây là tình huống học, không đọc máy bạn.",
    "jdk-wrong":"Java 17 chưa khớp toolchain 21. Chọn JDK 21 rồi kiểm tra lại cả Java và Gradle trên máy thật.",
    "jdk-ok":"Trong bài, terminal và Gradle chuyển sang JDK 21; yêu cầu toolchain đã khớp. IDE còn các lựa chọn riêng cần đối chiếu.",
    "ide-wrong":"Còn giá trị lệch 21 hoặc JDK terminal chưa khớp. Chỉnh mục được đánh dấu rồi đồng bộ lại trong bài.",
    "ide-ok":"SDK, language level và Gradle JVM đều khớp 21 trong bài. Reload Gradle là bước tương ứng trên IDE thật, chưa được ứng dụng này kiểm chứng.",
    "daemon-wrong":"Cài lại CLI hoặc chạy Compose lúc daemon tắt chưa giải quyết lỗi kết nối Engine. Cần mở daemon rồi kiểm tra lại phần Server.",
    "daemon-ok":"Kết quả dự kiến trong bài đã có cả Client và Server. Điều này chỉ mô phỏng daemon sẵn sàng, chưa xác nhận dependency hoặc máy thật.",
    "conflict-wrong":"Cách này có thể ảnh hưởng project khác hoặc lặp lại conflict. Đối chiếu owner/quyền và chọn service cần cho task, giữ nguyên container/volume đang có.",
    "conflict-ok":"Kế hoạch trong bài chọn service không xung đột; Redis/RabbitMQ chờ owner xác nhận quyền tái dùng. Debezium vẫn Cần xác nhận, chưa có dependency nào được kiểm tra live.",
    "root-error":"Root task dừng ở :workspaces:bootJar của project cha không có main class. Chưa đủ kết luận Command compile lỗi; chọn task module để đối chiếu.",
    "build-jdk":"Tình huống build đang dùng JDK 17, chưa đáp ứng 21. Quay lại F2 chọn JDK đúng rồi thử lại; không có Gradle thật nào chạy.",
    "build-ok":"Trong bài, task module tạo boot JAR ở build/libs. Đóng gói không khởi động thêm process Command hoặc container; process/container đã có được giữ, HTTP vẫn chưa xác nhận.",
    "run-error":"Tình huống chưa đủ JDK 21/main class/profile dev, nên chưa mô phỏng startup local thành công. Đối chiếu cấu hình và thử lại; không có kết nối thật.",
    "run-ok":"Đây là log startup mô phỏng với giả định dependency đáp ứng trong tình huống. Chọn dòng profile và Started; chưa xác nhận HTTP API hoặc nghiệp vụ.",
    "stopped":"Process mô phỏng đã dừng; port 9901 trong bài không còn lắng nghe. Máy thật: Stop ở IntelliJ hoặc Ctrl+C ở terminal giữ bootRun, rồi kiểm tra lại đúng process.",
    "wrong-log":"Đó là nơi xem container hoặc build, chưa phải log process Java đang chạy theo cách đã chọn. Chọn Run/Services hoặc terminal bootRun tương ứng.",
    "right-log":"Đã tìm đúng nơi giữ log process Java trong tình huống. Tiếp theo tìm nguyên nhân cụ thể thay vì chỉ đọc thông báo lỗi bao ngoài.",
    "wrong-error":"Dòng này là thông báo bao ngoài hoặc thông tin khởi động. Tìm dòng Caused by có nguyên nhân kết nối cụ thể trong log mô phỏng.",
    "right-error":"Connection refused tới PostgreSQL là nguyên nhân cụ thể trong ví dụ. Máy thật cần xác nhận target/profile, DB và network trước khi chạy lại.",
    "wrong-port":"Port này không thuộc Command theo cấu hình đang học. Đối chiếu server.port 9901; cổng mở vẫn chưa chứng minh API hoạt động.",
    "right-port":"9901 thuộc Command trong cấu hình đã đọc. Cần xác định thêm process sở hữu cổng trên máy thật; port không thay cho kiểm tra HTTP.",
    "wrong-level":"Chưa có bằng chứng cho kết luận này trong trạng thái bài học. HTTP và nghiệp vụ luôn cần kiểm tra riêng; không cộng port mở thành hệ thống hoạt động đầy đủ.",
    "right-level":"Đã chọn đúng mức tối đa trạng thái bài học hỗ trợ. HTTP API, auth và nghiệp vụ vẫn Cần xác nhận trên máy thật.",
    "summary":"Đã ghi nhận bản tóm tắt học tập. Checklist máy thật và tiến độ Policy/Claim giữ nguyên.",
  };
  return messages[sim.notice];
}
