import {ReactFlow,Background,Controls,MarkerType,Position,BaseEdge,EdgeLabelRenderer,getSmoothStepPath} from '@xyflow/react';
import type {EdgeProps} from '@xyflow/react';
import {listStages,listEdges} from '../content/policy/list';
import type {ListJourneyStep} from '../content/policy/list-journey';
import '@xyflow/react/dist/style.css';

function ListHandoffEdge({sourceX,sourceY,targetX,targetY,sourcePosition,targetPosition,style,markerEnd,label,data}:EdgeProps){
 const [path]=getSmoothStepPath({sourceX,sourceY,targetX,targetY,sourcePosition,targetPosition});
 const horizontal=Math.abs(sourceY-targetY)<10;
 return <><BaseEdge path={path} markerEnd={markerEnd} style={style}/><EdgeLabelRenderer><button className="list-diagram-edge nodrag nopan" style={{transform:`translate(-50%, -50%) translate(${(sourceX+targetX)/2}px, ${horizontal?sourceY-95:(sourceY+targetY)/2}px)`}} onClick={data?.onChoose as ()=>void}>{label}</button></EdgeLabelRenderer></>;
}
const edgeTypes={handoff:ListHandoffEdge};

export function PolicyListDiagram({active,onNode,onEdge,group,full=false}:{active:string;onNode:(id:string)=>void;onEdge:(id:string)=>void;group?:ListJourneyStep;full?:boolean}) {
 const stages=group&&!full?listStages.filter(s=>group.points.some(p=>p===s.id)||group.id==='detail'&&s.id==='list-table'):listStages;
 const relations=listEdges.filter(e=>stages.some(s=>s.id===e.from)&&stages.some(s=>s.id===e.to));
 const nodes=stages.map((stage,i)=>({id:stage.id,position:{x:i<4?i*350:(7-i)*350,y:i<4?0:230},sourcePosition:i<3?Position.Right:i===3?Position.Bottom:Position.Left,targetPosition:i<4?Position.Left:i===4?Position.Top:Position.Right,
  data:{label:<><small>{i+1} · {stage.role}</small><strong>{stage.title}</strong><span>{stage.data}</span></>},
  style:{width:280,height:126,padding:15,borderRadius:8,opacity:group&&full&&!group.points.some(p=>p===stage.id)?.38:1,background:active===stage.id?'var(--selected)':'var(--surface)',color:'var(--text)',border:`${active===stage.id?2:1}px solid var(--accent-border)`}}));
 const edges=relations.map(edge=>({id:edge.id,source:edge.from,target:edge.to,type:'handoff',label:edge.label,data:{onChoose:()=>onEdge(edge.id)},markerEnd:{type:MarkerType.ArrowClosed,color:'var(--accent)'},style:{stroke:'var(--accent)',strokeWidth:active===edge.id?3:1.5},labelStyle:{fill:'var(--text)',fontSize:11},labelBgStyle:{fill:'var(--surface)'}}));
 return <div className="list-flow"><div className="list-flow-canvas" aria-label="Sơ đồ flow Danh sách"><ReactFlow key={`${group?.id??'all'}:${full}`} nodes={nodes} edges={edges} edgeTypes={edgeTypes} onNodeClick={(_,n)=>onNode(n.id)} onEdgeClick={(_,e)=>onEdge(e.id)} fitView fitViewOptions={{padding:.2,maxZoom:1}} minZoom={.2} maxZoom={1.5} nodesDraggable={false} nodesConnectable={false} zoomOnScroll={false}><Background/><Controls showInteractive={false}/></ReactFlow></div>
  <nav className="list-node-links" aria-label="Các node Danh sách">{stages.map(s=><button key={s.id} aria-pressed={active===s.id} onClick={()=>onNode(s.id)}>{listStages.indexOf(s)+1}. {s.title}</button>)}</nav>
  {relations.length>0&&<details><summary>Các cạnh và dữ liệu bàn giao</summary><nav className="list-edge-links" aria-label="Các cạnh Danh sách">{relations.map(e=><button key={e.id} aria-pressed={active===e.id} onClick={()=>onEdge(e.id)}>{listStages.find(s=>s.id===e.from)!.title} → {listStages.find(s=>s.id===e.to)!.title}<small>{e.label}</small></button>)}</nav></details>}
 </div>;
}
