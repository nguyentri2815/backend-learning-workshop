import source from "../content/setup/command-startup-source.json" with {type:"json"};
import {findCommandCase} from "./command-cases";
export const startupSource=source;
export type StartupGroup="jvm"|"beans"|"data"|"clients"|"events"|"init"|"web"|"outcome"|"shutdown";
export type StartupReference="configured"|"recorded-failure"|"recorded-success";
export type StartupPlayback={reference:StartupReference;frame:number;playing:boolean;paused:boolean;group:StartupGroup;full:boolean;caseId:string;caseRepaired:boolean;caseBranch:string};
export const emptyStartupPlayback=():StartupPlayback=>({reference:"configured",frame:0,playing:false,paused:false,group:"jvm",full:false,caseId:"",caseRepaired:false,caseBranch:""});
type Dataset=typeof source.datasets[number]&{simulated?:boolean;caseId?:string;javaVersion?:number;preLaunch?:boolean};
export function startupDataset(reference:StartupReference,profile:"base"|"dev",scenario?:Pick<StartupPlayback,"caseId"|"caseRepaired"|"caseBranch">):Dataset{
 const item=findCommandCase(scenario?.caseId??"");
 if(item&&(item.origin!=="recorded"||scenario?.caseRepaired)){
  const repaired=scenario?.caseRepaired===true,started=item.started||repaired,branch=item.branches.find(b=>b.id===scenario?.caseBranch)??item.branches[0];
  type Row=Dataset["rows"][number];const rows:Row[]=[];
  const push=(text:string,group:string,level="INFO",milestone="",fatal=false)=>rows.push({id:`SIM${rows.length+1}`,line:rows.length+1,text,group,level,milestone,fatal});
  const actualProfile=item.profile&&!repaired?"default":"dev";
  if(item.category!=="before"||started||repaired){push("Java 21 → AgentCommandServiceApplication.main → Spring Boot · tình huống giả lập","jvm");push(item.id==="profile"&&!repaired?item.log:`Profile trong case: ${actualProfile}`,"jvm","INFO","profile");push("Spring chuẩn bị context/bean trong case","beans");}
  if(!started){if(item.group==="data")push("Hikari/JPA: đang thử chuẩn bị persistence trong case","data");push(item.log,item.group,"ERROR","",true);push("Lần thử dừng tại dấu hiệu trên; nhóm chưa tới không được phát thành công","outcome","ERROR");}
  else{
   if(repaired&&item.category!=="after")push(branch.proof,item.group,"INFO");
   const port=item.id==="override"&&!repaired?9902:9901;
   push(`Tomcat started on port ${port} · chỉ là kết quả mô phỏng`,`web`,"INFO","port");push("Started AgentCommandServiceApplication · startup giả lập, chưa chứng minh nghiệp vụ","outcome","INFO","started");
   if(item.started&&item.category!=="before"&&(!repaired||item.category==="after")){push(item.log,item.group,"WARN");if(repaired&&item.category==="after")push(branch.proof,item.group,"INFO");}
  }
  return {...source.datasets[0],id:`case:${item.id}:${repaired?"retry":"fault"}`,name:repaired&&item.origin==="recorded"?"Thử lại giả lập sau phân tích timeout":item.title,profile:actualProfile,outcome:started?"success":"failure",launch:"mô phỏng main/Run",from:1,to:rows.length,tail:[],logFile:"Console mô phỏng",logSha256:"Không có hash log thật: các dòng SIM là dữ kiện bài học.",rows,stopRows:[],missing:"Chỉ mô phỏng vòng đời Command; không có bằng chứng shutdown máy thật.",simulated:true,caseId:item.id,javaVersion:item.id==="jdk"&&!repaired?17:21,preLaunch:item.id==="compile"&&!repaired};
 }
 const id=reference==="recorded-failure"?"default-failure":reference==="recorded-success"?"default-success":profile==="dev"?"dev-success":"default-success";
 return source.datasets.find(data=>data.id===id)!;
}
export function normalizeStartupPlayback(value:unknown,process:unknown,profile:"base"|"dev"):StartupPlayback{
 const state=emptyStartupPlayback();
 if(!value||typeof value!=="object")return ["running","stopped"].includes(process as string)?{...state,frame:startupDataset(state.reference,profile).rows.length}:state;
 const raw=value as Record<string,unknown>;
 if(["recorded-failure","recorded-success"].includes(raw.reference as string))state.reference=raw.reference as StartupReference;
 const item=findCommandCase(String(raw.caseId));if(item){state.caseId=item.id;state.caseRepaired=raw.caseRepaired===true;state.caseBranch=item.branches.some(b=>b.id===raw.caseBranch)?String(raw.caseBranch):item.branches[0].id;}
 const size=startupDataset(state.reference,profile,state).rows.length;
 state.frame=Number.isInteger(raw.frame)?Math.max(0,Math.min(size,Number(raw.frame))):0;
 state.playing=raw.playing===true&&process!=="stopped"&&state.frame<size;
 state.paused=state.playing&&raw.paused===true;
 if(source.groups.some(group=>group.id===raw.group))state.group=raw.group as StartupGroup;
 if(raw.group==="boot")state.group="jvm";
 state.full=raw.full===true&&!startupDataset(state.reference,profile,state).simulated;
 return state;
}
