import {lazy,Suspense,useEffect,useRef} from 'react';
import {ArrowRight,Check,Clipboard,Info,Lightbulb} from 'lucide-react';
import type {BeginnerRound} from '../content/policy/beginner-session';
import {beginnerSources,beginnerPrompt,beginnerRounds} from '../content/policy/beginner-session';
import {beginnerFlows,beginnerGuidance} from './beginner-session-guidance';
import type {SessionFlowLane} from './beginner-session-guidance';
import type {SessionState} from './policy-session-state';
import {beginnerFixture,beginnerTrialLabels} from './beginner-fixture';
import {BeginnerTrialCard} from './BeginnerTrialCard';
const CodeBlock=lazy(()=>import('../workshop/CodeBlock').then(m=>({default:m.CodeBlock})));
type Changes=Record<string,string|null>;
export function BeginnerSessionLesson({round,state,params,update,inspect,inspectPatch,complete,canAct,trial,policyId,setPolicyId,copied,copy,feedback,next}:{
 round:BeginnerRound;state:SessionState;params:URLSearchParams;update:(changes:Changes)=>void;inspect:(ref:string,from?:number,to?:number)=>void;inspectPatch:(ref:string)=>void;complete:()=>void;canAct:boolean;trial:(id:string)=>void;policyId:string;setPolicyId:(value:string)=>void;copied:boolean;copy:()=>void;feedback:string;next:()=>void;
}){
 const applied=state.done>=state.view;
 const decision=params.get('sessionDecision.'+round.id);
 const revealed=applied||round.options.some((_,i)=>decision===String(i));
 const guidance=beginnerGuidance[round.id];
 const previous=beginnerRounds.find(r=>r.id===guidance?.previous);
 const previousDecision=previous?params.get('sessionDecision.'+previous.id):null;
 const previousApplied=previous?state.done>=beginnerRounds.indexOf(previous):false;
 const lanes:SessionFlowLane[]=beginnerFlows[round.id]??[{label:'Quyết định của lượt này',nodes:[{label:'Tình huống đã biết'},{label:'Chốt hướng triển khai',via:'xác định điều còn thiếu'}],note:round.proposal}];
 const source=[...round.evidence,...lanes.flatMap(lane=>lane.nodes)].find(e=>e.ref===params.get('sessionSource')&&(!params.has('sessionSourceFrom')||e.from===Number(params.get('sessionSourceFrom'))));
 const original=useRef<HTMLDetailsElement>(null);
 useEffect(()=>{if(source){original.current?.scrollIntoView({block:'nearest',behavior:'instant'});original.current?.querySelector('summary')?.focus({preventScroll:true});}},[source?.ref,source?.from,round.id]);
 return <div className="beginner-lesson" aria-label="Bài học từng lượt">
  <section className="beginner-question"><small>1 · Đang giải quyết việc gì?</small><h3>{round.request}</h3><p className="beginner-context">{guidance?.context}</p>
   <details className="beginner-reasoning" key={round.id}><summary role="button">{previous?'Xem lại suy luận trước':'Vì sao cần bước này?'}</summary>{previous?<div><small>Lượt {beginnerRounds.indexOf(previous)+1} · {previous.title}</small><p><b>Câu hỏi:</b> {previous.question}</p><ul>{previous.options.map((option,i)=><li key={option} data-selected={previousDecision===String(i)}>{option}{previousDecision===String(i)&&<strong> · Lựa chọn đã lưu</strong>}</li>)}</ul>{!previous.options.some((_,i)=>previousDecision===String(i))&&<p>Chưa lưu lựa chọn cho câu hỏi này.</p>}<p><b>{previousApplied?'Kết luận đã xác nhận':'Kết luận đề xuất'}:</b> {previous.proposal}</p><p>{previous.reason}</p></div>:<p>{round.reason}</p>}</details>
   <pre className="beginner-data">{round.sample}</pre>
   {round.id==='brief'&&<details className="session-prompt" open><summary>Prompt giao agent</summary><button onClick={copy}><Clipboard size={13}/>{copied?'Đã sao chép':'Sao chép prompt'}</button><pre>{beginnerPrompt}</pre></details>}
  </section>
  <section className="beginner-predict"><small>2 · Bạn sẽ làm gì tiếp?</small><p id={`question-${round.id}`}>{round.question}</p><div role="radiogroup" aria-labelledby={`question-${round.id}`} className="beginner-options">{round.options.map((option,i)=><label className="beginner-option" key={option} data-selected={decision===String(i)} data-evaluation={decision!==null&&decision!=='hint'?(i===round.answer?'fit':'unfit'):undefined}><input type="radio" name={`decision-${round.id}`} value={i} aria-label={option} checked={decision===String(i)} onChange={()=>update({['sessionDecision.'+round.id]:String(i)})} aria-describedby={decision!==null&&decision!=='hint'?`feedback-${round.id}-${i}`:undefined}/><span>{option}{decision!==null&&decision!=='hint'&&<small id={`feedback-${round.id}-${i}`}>{i===round.answer?<Check size={15}/>:<Info size={15}/>}<span>{i===round.answer?guidance.fit:guidance.unfit}</span></small>}</span></label>)}</div>
   <button className="beginner-hint" aria-expanded={params.has('sessionHint.'+round.id)||decision==='hint'} aria-controls={`hint-${round.id}`} onClick={()=>update({['sessionHint.'+round.id]:params.has('sessionHint.'+round.id)?null:'1'})}><Lightbulb size={15}/>Gợi ý</button>
   {(params.has('sessionHint.'+round.id)||decision==='hint')&&<p id={`hint-${round.id}`} className="beginner-clue">{guidance.clue}</p>}
  </section>
  <section className="beginner-proposal"><small>3 · Agent đề xuất gì và vì sao?</small>{revealed?<><p>{round.proposal}</p><p className="session-reason">{round.reason}</p>{round.terms&&<p className="beginner-term">{round.terms}</p>}
   <div className="beginner-flow" aria-label="Sơ đồ đề xuất">{lanes.map(lane=><section key={lane.label} aria-label={lane.label}><h4>{lane.label}</h4><div className="beginner-flow-lane">{lane.nodes.map((node,i)=><div className="beginner-flow-step" key={`${node.ref}:${node.from}:${i}`}>{i>0&&<div className="beginner-flow-edge"><span>{node.via}</span><ArrowRight size={22}/></div>}<button className="beginner-flow-node" onClick={()=>node.ref?inspect(node.ref,node.from,node.to):document.querySelector('.beginner-data')?.scrollIntoView({block:'nearest'})} aria-label={`${node.label}${node.ref?' · '+beginnerSources[node.ref].path.split('/').at(-1)+' · L'+node.from+'–'+node.to:''}`}><strong>{node.label}</strong>{node.ref&&<small>{beginnerSources[node.ref].path.split('/').at(-1)}<br/>L{node.from}–{node.to}</small>}</button></div>)}</div>{lane.note&&<p>{lane.note}</p>}</section>)}</div>
   {round.evidence.map(e=><button className="session-evidence" key={`${e.ref}:${e.from}`} onClick={()=>inspect(e.ref,e.from,e.to)}><span>{beginnerSources[e.ref].path.split('/').at(-1)} · L{e.from}–{e.to}{state.reads.includes(`${round.id}:${e.ref}`)&&<Check size={13}/>}</span><small>{e.finding}</small></button>)}
   {source?.ref&&<details ref={original} className="beginner-original" key={`${source.ref}:${source.from}`} open><summary tabIndex={-1}>File đối chiếu · {beginnerSources[source.ref].path} · L{source.from}–{source.to}</summary><p>Source hiện tại có module Policy hoàn chỉnh. Đây là tài liệu đối chiếu; cây bài học chỉ gồm file đã xuất hiện tại mốc đang xem. Commit {beginnerSources[source.ref].commit.slice(0,12)} · SHA-256 {beginnerSources[source.ref].sha256.slice(0,16)}.</p><Suspense fallback={<p>Đang mở source…</p>}><CodeBlock rows={beginnerSources[source.ref].rows} path={beginnerSources[source.ref].path} range={{name:source.ref,qualified:source.ref,start:source.from!,end:source.to!}} memoryKey={`beginner-original:${round.id}:${source.ref}`} targetKey={`${source.from}`} preferTarget/></Suspense></details>}
   </>:<p>Chọn một phương án để đọc đề xuất và Java. Gợi ý giúp bạn tìm manh mối trước khi chọn.</p>}
  </section>
  <section className="beginner-apply"><small>4 · {round.patches.length?'Áp dụng thay đổi':'Xác nhận lượt này'}</small>
   {round.patches.length?<><p>Patch nhỏ theo lượt; mở từng file trong IDE bên dưới trước khi áp dụng.</p>{round.patches.map(p=><button className="session-patch-button" key={p.ref} disabled={!revealed||state.view>state.done+1} onClick={()=>inspectPatch(p.ref)}>Xem patch · {beginnerSources[p.ref].path.split('/').at(-1)} · L{p.from}–{p.to}{state.patches.includes(`${round.id}:${p.ref}`)&&<Check size={13}/>}</button>)}</>:<p>Lượt này không sửa file.</p>}
   <button className="button primary" disabled={!canAct} onClick={complete}>{applied?(round.patches.length?'Đã áp dụng':round.kind==='survey'?'Đã xác nhận khảo sát':'Đã xác nhận lượt này'):round.kind==='survey'?'Xác nhận đã khảo sát':round.action}</button>
   {!applied&&!canAct&&<p className="beginner-gate">{state.view>state.done+1?'Hoàn thành các lượt trước ở mốc hiện tại.':'Chọn phương án phù hợp; đọc mẫu, xem patch hoặc chạy các fixture được yêu cầu trước khi xác nhận.'}</p>}
  </section>
  <section className="beginner-check"><small>5 · Kiểm tra kết quả</small><p>{round.check}</p>
   {applied&&<p className="session-result">{round.patches.length?'Đã áp dụng: ':round.kind==='survey'?'Đã xác nhận khảo sát: ':'Đã xác nhận: '}{round.patches.length?round.result:round.proposal}{!round.patches.length&&' Không có file thay đổi.'}</p>}
   {(round.requiredTrials??[]).map(id=>{const through=Math.min(state.view,state.done),saved=Number(params.get('sessionTrialAt.'+id)??through);return <div key={id}>{id==='read-id'&&<label>Policy ID để đối chiếu<input value={policyId} onChange={event=>setPolicyId(event.target.value)} placeholder={beginnerFixture.policyId}/></label>}<button disabled={state.done<state.view-1||!revealed||id==='read-id'&&!state.trials.includes('success')} onClick={()=>trial(id)}>{beginnerTrialLabels[id]}</button>{state.trials.includes(id)&&saved<=through&&<BeginnerTrialResult id={id} through={saved}/>}</div>;})}
   {feedback&&<p role="status">{feedback}</p>}
   {applied&&<button onClick={next}>Tiếp tục lượt sau →</button>}
  </section>
 </div>;
}
export function BeginnerTrialResult({id,through}:{id:string;through:number}){
 return <BeginnerTrialCard id={id} through={through}/>;
}
