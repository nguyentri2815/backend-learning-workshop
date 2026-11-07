import {findCommandCase} from "./command-cases";
import type {Simulation} from "./practice-runtime-model";
import source from "../content/setup/command-run-source.json" with {type:"json"};
import {emptyStartupPlayback,normalizeStartupPlayback,startupDataset} from "./startup-log-model";
import type {StartupPlayback} from "./startup-log-model";
export const logIds=["profile","port","started"] as const;
export type LogId=typeof logIds[number];
export type CommandSession={id:number;shown:number;starting:boolean;assumed:boolean;selected:""|LogId;scenario:"success"|"port-busy";port:number;playback:StartupPlayback};
export type CommandReview={checked:LogId[];errorOpen:boolean;errorRead:boolean;portOpen:boolean;focus:""|"api";portChecked:boolean;http:""|"up"|"down"|"unauthorized"|"forbidden"|"missing";httpSent:boolean};
export type TaskPractice={phase:"idle"|"configuration"|"log"|"stop"|"done";practiced:boolean};
export const emptyCommandSession=():CommandSession=>({id:0,shown:0,starting:false,assumed:false,selected:"",scenario:"success",port:source.port,playback:emptyStartupPlayback()});
export const emptyCommandReview=():CommandReview=>({checked:[],errorOpen:false,errorRead:false,portOpen:false,focus:"",portChecked:false,http:"",httpSent:false});
export const emptyTaskPractice=():TaskPractice=>({phase:"idle",practiced:false});
export function normalizeCommandSession(value:unknown,process:unknown,profile:"base"|"dev"="dev"):CommandSession{
 const state=emptyCommandSession();
 if(!value||typeof value!=="object")return ["running","stopped"].includes(process as string)?{...state,id:1,shown:3,playback:normalizeStartupPlayback(undefined,process,profile)}:state;
 const raw=value as Record<string,unknown>;
 state.id=Number.isInteger(raw.id)?Math.max(0,Math.min(1000000,Number(raw.id))):0;
 state.shown=Number.isInteger(raw.shown)?Math.max(0,Math.min(3,Number(raw.shown))):0;
 state.starting=raw.starting===true&&!["running","stopped","error"].includes(process as string)&&state.shown<3;
 state.assumed=raw.assumed===true;
 state.scenario=raw.scenario==="port-busy"?"port-busy":"success";
 // This lesson models the source-verified two-file configuration, without an external port override.
 state.port=source.port;
 state.playback=normalizeStartupPlayback(raw.playback,process,profile);
 if(state.playback.caseId==="override"&&!state.playback.caseRepaired)state.port=9902;
 if(raw.playback===undefined&&state.starting)state.playback.playing=true;
 if(logIds.includes(raw.selected as LogId))state.selected=raw.selected as LogId;
 return state;
}
export function normalizeCommandReview(value:unknown):CommandReview{
 const state=emptyCommandReview();if(!value||typeof value!=="object")return state;
 const raw=value as Record<string,unknown>;
 state.checked=Array.isArray(raw.checked)?[...new Set(raw.checked.filter((id):id is LogId=>logIds.includes(id as LogId)))]:[];
 for(const key of ["errorOpen","errorRead","portOpen","portChecked","httpSent"] as const)state[key]=raw[key]===true;
 if(["up","down","unauthorized","forbidden","missing"].includes(raw.http as string))state.http=raw.http as CommandReview["http"];
 if(raw.focus==="api")state.focus="api";
 return state;
}
export function normalizeTaskPractice(value:unknown):TaskPractice{
 const state=emptyTaskPractice();if(!value||typeof value!=="object")return state;
 const raw=value as Record<string,unknown>;
 if(["idle","configuration","log","stop","done"].includes(raw.phase as string))state.phase=raw.phase as TaskPractice["phase"];
 state.practiced=raw.practiced===true;return state;
}
export function missingCommandConditions(s:Simulation,profile:"base"|"dev"){
 const missing:{id:string;text:string;task:"run-config"|"jdk"|"ide"|"daemon";action:string}[]=[];
 if(!s.runSetup.saved||!s.mainSelected)missing.push({id:"configuration",text:"Chưa lưu cấu hình Command ở I1.",task:"run-config",action:"Thiết lập Command · I1"});
 if(profile!=="dev")missing.push({id:"profile",text:"Chưa đặt dev: mô hình hai file đang dùng datasource remote đã che. Đặt dev ở I1 để thử local; profile/override ngoài chưa xác định.",task:"run-config",action:"Chọn profile dev · I1"});
 if((s.runMode==="intellij"?s.sdk:s.jdk)!==21)missing.push({id:"jdk",text:s.runMode==="intellij"?`Project SDK đang là Java ${s.sdk}; cấu hình Command cần Java 21.`:`JDK Terminal đang là Java ${s.jdk}; bootRun cần Java 21.`,task:s.runMode==="intellij"?"ide":"jdk",action:s.runMode==="intellij"?"Mở Project SDK · F3":"Chọn JDK Terminal · F2"});
 if(!s.dockerInstalled)missing.push({id:"cli",text:"Tình huống hiện tại chưa tìm thấy Docker CLI; chưa thể chuẩn bị Engine.",task:"daemon",action:"Xem hướng dẫn Docker · G2"});
 else if(!s.daemon)missing.push({id:"engine",text:"Docker Engine trong bài chưa sẵn sàng.",task:"daemon",action:"Bật Docker Engine trong bài"});
 if(s.containers["postgres-write"]!=="running"){
  const exists=Boolean(s.containers["postgres-write"]),conflict=exists&&s.dockerPortConflict;
  missing.push({id:"database",text:!exists?"PostgreSQL write (postgres-write) chưa có container trong bài.":conflict?"PostgreSQL write (postgres-write) đang stopped; host port 5432 bị chiếm trong tình huống Docker.":"PostgreSQL write (postgres-write) đang stopped trong bài.",task:"daemon",action:!exists?"Tạo postgres-write · G2":conflict?"Xử lý port postgres-write · G2":"Khởi động postgres-write trong bài"});
 }
 // readyEvidence records reading the optional G2 log, not a service state.
 // Running permits this startup scenario; readiness/auth/schema remain unverified.
 return missing;
}
export function beginCommandSession(s:Simulation,profile:"base"|"dev",assumed=false,scenario:CommandSession["scenario"]="success"):Partial<Simulation>{
 const reference=s.commandSession.playback.reference,historical=reference!=="configured";
 const item=findCommandCase(s.commandCase.id);
 const blocked=!item&&!historical&&!assumed&&missingCommandConditions(s,profile).length>0;
 const launchProfile=item?(item.profile&&!s.commandCase.repaired?"base":"dev"):historical?"base":assumed?"dev":profile;
 return {commandCase:item?{...s.commandCase,phase:s.commandCase.repaired?"retry":"idle"}:s.commandCase,process:blocked?"error":"idle",notice:"",launchMode:s.runMode,launchProfile,logSeen:[],logLine:"",commandReview:emptyCommandReview(),commandSession:{...emptyCommandSession(),id:s.commandSession.id+1,starting:!blocked,assumed:!item&&!historical&&assumed,scenario,port:item?.id==="override"&&!s.commandCase.repaired?9902:source.port,playback:{...emptyStartupPlayback(),reference:item?.origin==="recorded"&&!s.commandCase.repaired?"recorded-failure":reference,playing:!blocked,caseId:item?.id??"",caseRepaired:s.commandCase.repaired,caseBranch:s.commandCase.branch}},taskPractice:{...s.taskPractice,phase:s.taskPractice.phase==="configuration"&&!blocked?"log":s.taskPractice.phase},execution:{...s.execution,last:blocked?"run-blocked":"run",lastService:""}};
}
export function advanceCommandSession(s:Simulation,nextGroup=false):Partial<Simulation>{
 const session=s.commandSession,p=session.playback;
 if(!p.playing||p.paused&&!nextGroup)return {};
 if(!p.caseId&&p.reference==="configured"&&!session.assumed&&missingCommandConditions(s,s.launchProfile).length)return {process:"error",commandSession:{...session,starting:false,playback:{...p,playing:false}},notice:""};
 if(session.scenario==="port-busy"){
  const failed=session.shown===1;
  return {process:failed?"error":"idle",logSeen:["profile"],commandSession:{...session,shown:1,starting:!failed,selected:"profile",playback:{...p,playing:!failed,group:failed?"outcome":"jvm"}}};
 }
 const data=startupDataset(p.reference,s.launchProfile,p);
 let frame=Math.min(data.rows.length,p.frame+1);
 if(nextGroup)while(frame<data.rows.length&&data.rows[frame].group===data.rows[frame-1].group)frame++;
 const visible=data.rows.slice(0,frame),last=visible.at(-1);
 const seen=logIds.filter(id=>visible.some(row=>row.milestone===id)),shown=seen.includes("started")?3:seen.includes("port")?2:seen.includes("profile")?1:0;
 const failed=visible.some(row=>row.fatal),done=frame===data.rows.length;
 const via=s.launchMode==="intellij"?"main":"bootRun";
 return {commandCase:done&&p.caseId&&p.caseRepaired?{...s.commandCase,phase:"resolved"}:s.commandCase,process:failed?"error":shown===3?"running":"idle",commandSession:{...session,shown,starting:!failed&&!done,selected:logIds.includes(last?.milestone as LogId)?last!.milestone as LogId:session.selected,playback:{...p,frame,playing:!done,paused:!done&&nextGroup,group:(last?.group??p.group) as StartupPlayback["group"]}},logSeen:seen,execution:done&&!failed&&!p.caseId&&p.reference==="configured"?{...s.execution,processVia:via,classes:true,classCause:s.execution.classes?s.execution.classCause:via,...(via==="bootRun"?{buildDir:true,dirCause:"bootRun" as const}:{}),last:"run"}:s.execution};
}
export function stopCommandSession(s:Simulation):Partial<Simulation>{
 return {process:"stopped",notice:"",commandSession:{...s.commandSession,starting:false,playback:{...s.commandSession.playback,playing:false,paused:false,group:"shutdown"}},execution:{...s.execution,last:"stop",lastService:""},taskPractice:{...s.taskPractice,phase:s.taskPractice.phase==="stop"?"done":s.taskPractice.phase}};
}
export function readCommandLog(s:Simulation,id:LogId,verify:boolean):Partial<Simulation>{
 if(logIds.indexOf(id)>=s.commandSession.shown)return {};
 return {commandSession:{...s.commandSession,selected:id,playback:{...s.commandSession.playback,paused:s.commandSession.playback.playing,group:(startupDataset(s.commandSession.playback.reference,s.launchProfile,s.commandSession.playback).rows.find(row=>row.milestone===id)?.group??s.commandSession.playback.group) as StartupPlayback["group"]}},logLine:id,commandReview:verify?{...s.commandReview,focus:"",checked:[...new Set([...s.commandReview.checked,id])]}:s.commandReview,taskPractice:{...s.taskPractice,phase:id==="started"&&s.taskPractice.phase==="log"?(s.process==="stopped"?"done":"stop"):s.taskPractice.phase},notice:""};
}
