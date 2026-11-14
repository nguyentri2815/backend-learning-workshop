import { useEffect, useId, useRef, useState } from 'react';
import { practiceSteps } from './create-practice';
import type { ExecutionSession } from './policy-execution';
import { arrowLabel, branchSelected, mainTraceNodes, traceNodeState } from './practice-trace-model';

const labels:Record<string,string>={pending:'Chưa đi qua',done:'Đã đi qua',current:'Đang dừng',reviewing:'Đang xem lại',blocked:'Dừng do lỗi',skipped:'Nhánh chưa chọn',unknown:'Chưa xác định'};
export function PolicyPracticeTrace({session:s,onInspect,onStop}:{session:ExecutionSession;onInspect:(id:string,line?:number)=>void;onStop:()=>void}){
 const [opened,setOpened]=useState(()=>new Set([s.stop.stage,s.view.stage]));
 const [focusStage,setFocusStage]=useState(s.view.stage);
 const [viewedNode,setViewedNode]=useState(()=>mainTraceNodes.find(n=>!n.branch&&n.ids.includes(s.view.id))!.id);
 const [revealTarget,setRevealTarget]=useState({id:s.view.id,request:0});
 const scroll=useRef<HTMLDivElement>(null),marker=useId().replaceAll(':','');
 // Keep neighbouring previews stable while inspecting: replacing them on every
 // selection would move nodes above the reader and change the diagram scroll.
 const active=practiceSteps.findIndex(x=>x.id===focusStage);
 useEffect(()=>{
   let frame=0,attempts=0;
   const reveal=()=>{
     const container=scroll.current;
     const node=mainTraceNodes.find(n=>!n.branch&&n.ids.includes(revealTarget.id))!;
     const target=container?.querySelector<HTMLElement>(`[data-testid="trace-node-${node.id}"]`);
     const checkpoint=target?.querySelector<HTMLElement>(`button[data-checkpoint-id="${revealTarget.id}"]`);
     // The child mounts before showModal() runs; wait for both the dialog and
     // expanded group to have a layout. Never scroll any ancestor of the diagram.
     if(!container?.clientHeight||!target?.offsetHeight||!checkpoint?.offsetHeight){if(attempts++<60)frame=requestAnimationFrame(reveal);return;}
     const bounds=container.getBoundingClientRect(),nodeBounds=target.getBoundingClientRect(),pointBounds=checkpoint.getBoundingClientRect();
     const area=nodeBounds.height<=container.clientHeight-32?nodeBounds:pointBounds;
     container.scrollTo({top:container.scrollTop+area.top-bounds.top-(container.clientHeight-area.height)/2,
       left:Math.max(0,container.scrollLeft+area.left-bounds.left-16),behavior:'instant'});
   };
   frame=requestAnimationFrame(reveal);
   return ()=>cancelAnimationFrame(frame);
 },[revealTarget]);
 function inspect(node:string,id:string,line?:number){setViewedNode(node);onInspect(id,line);}
 function returnToStop(){
   setOpened(old=>new Set([...old,s.stop.stage]));setFocusStage(s.stop.stage);
   setViewedNode(mainTraceNodes.find(n=>!n.branch&&n.ids.includes(s.stop.id))!.id);
   setRevealTarget(old=>({id:s.stop.id,request:old.request+1}));onStop();
 }
 return <section className="practice-execution-map" aria-label="Sơ đồ theo dõi thực thi"><header><strong>Đoạn đang xem · sáu nhóm checkpoint</strong><div><button type="button" onClick={()=>setOpened(opened.size===6?new Set([s.view.stage]):new Set(practiceSteps.map(x=>x.id)))}>{opened.size===6?'Thu gọn về bước đang xem':'Xem toàn tuyến'}</button><button type="button" onClick={returnToStop}>Điểm đang dừng</button></div></header>
 <p className="practice-trace-help">Mở nhóm để xem các node chính. Bấm node/checkpoint chỉ đổi điểm đang xem. Điểm đang dừng đưa sơ đồ, code và biến về cùng mốc.</p><div className="practice-trace-legend"><span>✓ Đã đi qua</span><span>◆ Đang dừng</span><span>● Đang xem lại</span><span>Nhánh chưa chọn / chưa xác định</span></div>
 <div className="practice-trace-scroll" ref={scroll} tabIndex={0} aria-label="Cuộn luồng thực thi">{practiceSteps.map((step,i)=>{
   const expanded=opened.has(step.id),group=mainTraceNodes.filter(n=>n.stage===step.id);
   const preview=group.filter(n=>!n.branch&&(i===active-1?n===group.filter(x=>!x.branch).at(-1):i===active+1?n===group[0]:false));
   const nodes=expanded?group:preview;
   let y=18;const positions=new Map<string,{x:number;y:number;w:number;h:number}>();
   // Reserve room for readable labels and wrapped checkpoint buttons.
   nodes.forEach(n=>{if(n.branch)return;const h=128+n.ids.length*50;positions.set(n.id,{x:14,y,w:278,h});y+=h+42;});
   nodes.filter(n=>n.branch).forEach(n=>{const parent=positions.get(n.parent!);if(parent){const offset=n.branch==='organization'||n.branch==='status-1'?186:n.branch==='status100'?330:42;positions.set(n.id,{x:334,y:parent.y+offset,w:222,h:132});}});
   const height=Math.max(0,...[...positions.values()].map(p=>p.y+p.h+30));
   const main=nodes.filter(n=>!n.branch);
   const pairs=[...main.slice(1).map((n,j)=>({from:main[j],to:n})),...nodes.filter(n=>n.branch).map(n=>({from:group.find(x=>x.id===n.parent)!,to:n}))];
   return <section key={step.id} className="trace-step-group" data-testid={`trace-group-${step.id}`}>
    <button type="button" className="trace-group-toggle" aria-expanded={expanded} onClick={()=>setOpened(old=>{const next=new Set(old);next.has(step.id)?next.delete(step.id):next.add(step.id);return next;})}><span>{expanded?'▾':'▸'} Bước {i+1} · {step.title}</span><small>{s.stop.stage===step.id?'Đang dừng tại đây':s.context.complete[i]?'Đã qua':'Mở để theo dõi'}</small></button>
    {i>0&&nodes.length>0&&<p className={`trace-group-boundary ${step.id==='flow'?'via-event':''}`}>{step.id==='validate'?'↓ Gọi method · Controller L45 → CreatePolicyFunc.exec L61':step.id==='map'?(s.done.has('duplicate-guard')?(s.context.quote.blocked?'Có Policy trùng · dừng L77':'↓ Không có Policy trùng · runInternal L76 → L80'):'↓ Chưa xác định · chỉ tới L80 nếu qua điều kiện L76'):step.id==='save'?'↓ Từ command → Gọi ghi ở L115':step.id==='flow'?'↓ Qua event · CreatePolicyEvent L329 → PolicyWorkflow L24 (không phải lời gọi sau HTTP response)':'↓ Người dùng thực hiện tra cứu · cùng Policy ID'}</p>}
    {nodes.length>0&&<div className="trace-group-canvas" style={{height}}><svg className="practice-trace-edges" width="580" height={height} aria-label={`Mũi tên trong bước ${i+1}`}><defs><marker id={`${marker}-${i}`} markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto"><path d="M0,0 L7,3.5 L0,7 Z" fill="var(--accent-border)"/></marker></defs>{pairs.map(({from,to})=>{
      const a=positions.get(from.id),b=positions.get(to.id);if(!a||!b)return null;
      const branch=Boolean(to.branch),selected=branch?branchSelected(to,s):s.done.has(to.ids[0])?true:undefined;
      const state=selected===undefined?'pending':selected?'chosen':'skipped';
      const path=branch?`M${a.x+a.w},${a.y+28} H318 V${b.y+28} H${b.x}`:`M${a.x+18},${a.y+a.h} V${b.y}`;
      return <g key={`${from.id}:${to.id}`} className={`trace-edge is-${state}`} data-testid={`trace-edge-${from.id}-${to.id}`} data-state={state}><path d={path} fill="none" markerEnd={`url(#${marker}-${i})`}/><text x={branch?338:a.x+28} y={branch?b.y-8:a.y+a.h+26}>{arrowLabel(from,to)}</text></g>;
    })}</svg>{nodes.map(n=>{
     const p=positions.get(n.id)!;const state=traceNodeState(n,s);
     const chosen=n.ids.find(id=>id===s.view.id)??n.ids.find(id=>id===s.stop.id)??n.ids.find(id=>s.done.has(id))??n.ids[0];
     const viewing=viewedNode===n.id;
     const c=s.byId.get(chosen)!;
     const sourceLine=n.branch==='missing'?63:n.branch==='duplicate'?77:n.branch==='view-null'?43:n.branch==='status0'?197:n.branch==='status-1'?199:n.branch==='status100'?201:c.line;
     return <article key={n.id} className={`practice-trace-node grouped-trace-node is-${state}`} style={{left:p.x,top:p.y,width:p.w,minHeight:p.h}} data-testid={`trace-node-${n.id}`} data-state={state} data-checkpoint-id={chosen} data-viewing={viewing}>
      <button type="button" className="trace-node-main" onClick={()=>inspect(n.id,chosen,c.sourceKind?undefined:sourceLine)}><b>{n.title}</b><span>{c.sourceKind==='ui'?'UI học tập · mô phỏng':c.sourceKind==='request'?'POST /policy/create/{quoteId}':`${c.method} · L${sourceLine}`}</span><em>{labels[state]}{viewing&&state!=='reviewing'?' · Đang xem':''}</em></button>
      {!n.branch&&<div className="trace-node-checkpoints">{n.ids.map(id=>{const cp=s.byId.get(id)!;return <button type="button" key={id} onClick={()=>inspect(n.id,id)} aria-label={`Xem ${cp.title}${cp.sourceKind?'':` L${cp.line}`}`} aria-current={viewing&&s.view.id===id?'location':undefined} data-checkpoint-id={id} data-current={s.stop.id===id} data-reviewing={viewing&&s.view.id===id&&s.view.id!==s.stop.id}>{s.stop.id===id?'◆ ':s.view.id===id?'● ':''}{cp.sourceKind?'':`L${cp.line} · `}{cp.title}</button>;})}</div>}
     </article>;
    })}</div>}
   </section>;
 })}</div><p className="practice-trace-help">Bước 4 → 5 qua event. Không suy diễn thứ tự HTTP response và xử lý event ở runtime. Mở rộng chỉ phục vụ xem, không chạy mô phỏng.</p></section>;
}
