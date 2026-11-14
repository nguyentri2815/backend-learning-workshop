import {sessionRounds} from '../content/policy/implementation-session';

export type SessionState={done:number;view:number;reads:string[];patches:string[];trials:string[]};
const unique=(value:string|null)=>[...new Set((value??'').split(',').filter(Boolean))];
export function policySessionState(params:URLSearchParams,rounds=sessionRounds):SessionState {
 const raw=Number(params.get('sessionDone')??-1);
 const done=Number.isInteger(raw)?Math.max(-1,Math.min(rounds.length-2,raw)):-1;
 const requested=rounds.findIndex(r=>r.id===params.get('sessionAt'));
 return {done,view:requested>=0?requested:Math.min(done+1,rounds.length-1),reads:unique(params.get('sessionReads')),patches:unique(params.get('sessionPatches')),trials:unique(params.get('sessionTrials'))};
}
export function sessionReady(state:SessionState) {
 const round=sessionRounds[state.view];
 if(state.view!==state.done+1)return false;
 if(round.kind==='survey')return round.evidence.every(e=>state.reads.includes(`survey:${e.ref}`));
 if(round.kind==='patch')return [...new Set(round.patches.map(p=>p.ref))].every(ref=>state.patches.includes(`${round.id}:${ref}`));
 if(round.kind==='trial')return ['entry-valid','entry-missing'].every(t=>state.trials.includes(t));
 if(round.kind==='verify')return ['success','pending','read-id'].every(t=>state.trials.includes(t));
 return round.kind==='brief';
}
export const sessionReset={sessionDone:null,sessionAt:'brief',sessionReads:null,sessionPatches:null,sessionTrials:null,sessionFile:null,sessionMode:null,sessionFilter:null,sessionFocus:null,sessionOrigin:null,sessionReturn:null};
