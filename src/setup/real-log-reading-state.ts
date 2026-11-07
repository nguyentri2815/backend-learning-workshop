import {failureSteps,successSteps,postgresFailureSteps,postgresCauseEvidence} from "./real-log-practice-model";
import type {ReadingSession,RedisBranch,RetryOutcome} from "./real-log-practice-model";

export const readingStorageKey="backend-learning-workshop.real-log-reading.v1";
export type DiagnosisPhase="status"|"search"|"check"|"retry"|"retry-error"|"done";
export type ReadingState={
 session:ReadingSession;failureStep:number;successStep:number;retryStep:number;postgresStep:number;postgresEvidence:number[];
 checkStep:number;branch:RedisBranch;doneBranches:RedisBranch[];retryOutcome:RetryOutcome;
 focus:"lesson"|"diagnosis"|"redis-route"|"postgres-route";routeReturnFocus:"lesson"|"diagnosis";routeAddressEntry:boolean;diagnosisPhase:DiagnosisPhase;diagnosisEvidence:number[];diagnosisRetryStep:number;newFailureRead:boolean;
};
export const emptyReadingState=():ReadingState=>({session:"failure",failureStep:0,successStep:0,retryStep:0,postgresStep:0,postgresEvidence:[],checkStep:0,branch:"stopped",doneBranches:[],retryOutcome:"success",focus:"lesson",routeReturnFocus:"lesson",routeAddressEntry:false,diagnosisPhase:"status",diagnosisEvidence:[],diagnosisRetryStep:0,newFailureRead:false});
export function readReadingState():ReadingState{
 try{
  const raw=JSON.parse(localStorage.getItem(readingStorageKey)??"null");if(!raw||raw.version!==1)return emptyReadingState();
  const state=emptyReadingState();
  for(const [key,max] of [["failureStep",failureSteps.length],["successStep",successSteps.length],["retryStep",4],["checkStep",6],["diagnosisRetryStep",4],["postgresStep",postgresFailureSteps.length]] as const)state[key]=Number.isInteger(raw[key])?Math.max(0,Math.min(max,raw[key])):0;
  state.branch=raw.branch==="port"?"port":"stopped";
  state.doneBranches=Array.isArray(raw.doneBranches)?[...new Set<RedisBranch>(raw.doneBranches.filter((value:unknown)=>value==="port"||value==="stopped"))]:[];
  state.session=raw.session==="postgres-failure"?"postgres-failure":raw.session==="success"?"success":raw.session==="retry"&&state.checkStep===6?"retry":"failure";
  state.retryOutcome=raw.retryOutcome==="next-error"?"next-error":"success";
  state.focus=raw.focus==="postgres-route"?"postgres-route":raw.focus==="redis-route"?"redis-route":raw.focus==="diagnosis"?"diagnosis":"lesson";
  state.routeReturnFocus=raw.routeReturnFocus==="diagnosis"?"diagnosis":"lesson";
  state.routeAddressEntry=raw.routeAddressEntry===true;
  state.postgresEvidence=Array.isArray(raw.postgresEvidence)?[...new Set<number>(raw.postgresEvidence.filter((line:unknown)=>postgresCauseEvidence.some(item=>item.lines.includes(line as number))))]:[];
  if(state.session==="postgres-failure"){
   if(state.focus==="diagnosis"||state.focus==="redis-route")state.focus="lesson";
   state.routeReturnFocus="lesson";
  }
  if(["status","search","check","retry","retry-error","done"].includes(raw.diagnosisPhase))state.diagnosisPhase=raw.diagnosisPhase;
  state.diagnosisEvidence=Array.isArray(raw.diagnosisEvidence)?[...new Set<number>(raw.diagnosisEvidence.filter((line:unknown)=>line===3432||line===3469))]:[];
  state.newFailureRead=raw.newFailureRead===true;
  if(state.checkStep<6&&["retry","retry-error","done"].includes(state.diagnosisPhase))state.diagnosisPhase="search";
  return state;
 }catch{return emptyReadingState();}
}
