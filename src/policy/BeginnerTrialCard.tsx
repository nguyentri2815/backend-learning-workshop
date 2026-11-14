import {lazy,Suspense,useEffect,useRef,useState} from 'react';
import {ArrowDown,ArrowRight,Check,Info,TriangleAlert} from 'lucide-react';
import {beginnerRounds,beginnerRows,beginnerSources} from '../content/policy/beginner-session';
import {beginnerFixture,runBeginnerTrial} from './beginner-fixture';
import type {TrialPoint} from './beginner-fixture';

const CodeBlock=lazy(()=>import('../workshop/CodeBlock').then(m=>({default:m.CodeBlock})));
const stateLabels={passed:'Đã đi qua',stopped:'Dừng do điều kiện',unwired:'Chưa nối tại mốc này',skipped:'Không chạy ở lần thử này'};

export function BeginnerTrialCard({id,through}:{id:string;through:number}){
 const result=runBeginnerTrial(id,through);
 const [selected,setSelected]=useState<string|null>(null);
 const panel=useRef<HTMLDetailsElement>(null);
 const source=result?.lanes.flatMap(lane=>lane.points).find(point=>point.id===selected)?.source;
 useEffect(()=>{if(source){panel.current?.scrollIntoView({block:'nearest'});panel.current?.querySelector('summary')?.focus({preventScroll:true});}},[source?.ref,source?.from,through]);
 if(!result)return null;
 function content(point:TrialPoint){return <>
  <span className="trial-point-title">{point.status==='passed'?<Check size={15}/>:point.status==='stopped'?<TriangleAlert size={15}/>:<Info size={14}/>}<strong>{point.label}</strong></span>
  {point.detail&&<small className="trial-point-detail">{point.detail}</small>}
  <span className="trial-point-state">{stateLabels[point.status]}</span>
  {result?.furthest===point.id&&<b className="trial-furthest">Đã tới đây</b>}
  {point.source&&<small className="trial-source-link">{beginnerSources[point.source.ref].path.split('/').at(-1)} · L{point.source.from}–{point.source.to}</small>}
 </>;}
 return <article className="beginner-trial" data-trial={id} data-snapshot={through}>
  <small>FIXTURE · SNAPSHOT MỐC {through+1} · {beginnerRounds[through].title} · {beginnerFixture.now.slice(0,10)}</small>
  <p><b>Đầu vào:</b> {result.input}</p><p>{result.output}</p>
  <div className="trial-flow" aria-label={`Đường chạy fixture ${id}`}>{result.lanes.map((lane,laneIndex)=><section key={lane.id} className="trial-flow-lane" aria-label={lane.label}><h4>{laneIndex>0&&<ArrowDown size={13}/>} {lane.label}</h4><ol>{lane.points.map((point,index)=><li key={point.id} data-point={point.id} data-state={point.status} data-furthest={point.id===result.furthest||undefined}>
   {index>0&&<ArrowRight className="trial-flow-arrow" size={17} aria-hidden="true"/>}
   {point.source?<button className="trial-point-card" onClick={()=>setSelected(point.id)} aria-expanded={selected===point.id} aria-label={`${point.label} · ${beginnerSources[point.source.ref].path.split('/').at(-1)} · ${stateLabels[point.status]}`}>{content(point)}</button>:<div className="trial-point-card">{content(point)}</div>}
  </li>)}</ol></section>)}</div>
  <div className="trial-counts" aria-label="Tác động của lần thử"><span>{result.commands} Command</span><span>{result.events} Event</span><span>{result.writes} lần ghi mới</span><span>{result.policyId?`Policy ID: ${result.policyId}`:'Chưa có Policy ID'}</span></div>
  {source&&<details className="beginner-trial-source" ref={panel} key={`${id}:${through}:${source.ref}:${source.from}`} open><summary tabIndex={-1}>Source tại mốc {through+1} · {beginnerSources[source.ref].path.split('/').at(-1)} · L{source.from}–{source.to}</summary><p>{beginnerSources[source.ref].path}</p><Suspense fallback={<p>Đang mở source…</p>}><CodeBlock rows={beginnerRows(source.ref,through)} path={beginnerSources[source.ref].path} range={{name:source.ref,qualified:source.ref,start:source.from,end:source.to}} memoryKey={`trial:${id}:${through}:${source.ref}`} targetKey={`${source.from}`} preferTarget/></Suspense></details>}
  {result.record&&<details open><summary>Bản ghi mô phỏng · {result.policyId}</summary><pre>{JSON.stringify(result.record,null,2)}</pre></details>}
 </article>;
}
