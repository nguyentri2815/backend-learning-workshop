import { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowRight, RotateCcw } from 'lucide-react';
import { Background, Controls, Handle, MarkerType, Position, ReactFlow, useNodesState } from '@xyflow/react';
import type { Edge, Node, NodeProps, ReactFlowInstance, XYPosition } from '@xyflow/react';
import type {ReactNode} from 'react';

type MapNodeData = { number:string; title:string; note:string; active:boolean; inspected:boolean; onOpen:()=>void; practice?:()=>void };
type MapNode = Node<MapNodeData, 'issuance'>;
export type JourneyMapNode={id:string;number:string;title:string;note:string;position:XYPosition};
export type JourneyMapConnection={source:string;target:string;active:boolean;conditional?:boolean};
const positionsByJourney=new Map<string,Record<string,XYPosition>>();
// Remember only positions across Overview / Steps; URLs continue to own learning context.

function IssuanceNode({data}:NodeProps<MapNode>) {
  return <div className={`policy-map-node ${data.active?'is-active':''} ${data.inspected?'is-inspected':''}`}>
    <Handle type="target" position={Position.Left}/>
    <div className="policy-map-node-content" role="button" tabIndex={0} aria-label={`${data.number} ${data.title}`} aria-pressed={data.active} onKeyDown={event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();event.stopPropagation();data.onOpen();}}}>
      <span className="policy-map-number">{data.number}</span><strong>{data.title}</strong><small>{data.note}</small>
    </div>
    <Handle type="source" position={Position.Right}/>
    {data.practice&&<button type="button" className="policy-map-practice nodrag nopan" onClick={event=>{event.stopPropagation();data.practice!();}}>Làm lại từng bước <ArrowRight size={13}/></button>}
  </div>;
}
const nodeTypes={issuance:IssuanceNode};

export function LearningJourneyDiagram({layout,connections,activeIds,inspected,onOpen,practice,memoryKey,canvasLabel,testId,legend}:{layout:JourneyMapNode[];connections:JourneyMapConnection[];activeIds:string[];inspected:string|null;onOpen:(id:string)=>void;practice:Record<string,()=>void>;memoryKey:string;canvasLabel:string;testId:string;legend:ReactNode}){
  const rememberedPositions=positionsByJourney.get(memoryKey)??{};
  positionsByJourney.set(memoryKey,rememberedPositions);
  const makeNodes=useCallback(()=>layout.map(item=>({id:item.id,type:'issuance' as const,position:rememberedPositions[item.id]??{...item.position},width:244,
    data:{...item,active:activeIds.includes(item.id),inspected:inspected===item.id,onOpen:()=>onOpen(item.id),practice:practice[item.id]},
  })),[layout,activeIds,inspected,onOpen,practice]);
  const [nodes,setNodes,onNodesChange]=useNodesState<MapNode>(makeNodes());
  const flow=useRef<ReactFlowInstance<MapNode>>(null);
  const canvas=useRef<HTMLDivElement>(null);
  const lastDrag=useRef({id:'',at:0});
  const [resetCount,setResetCount]=useState(0);
  // Updating the selected branch must never replace a position or remount React Flow.
  useEffect(()=>{const fresh=makeNodes();setNodes(previous=>previous.map(n=>({...n,data:fresh.find(f=>f.id===n.id)!.data})));},[makeNodes,setNodes]);
  useEffect(()=>{if(resetCount)requestAnimationFrame(()=>void flow.current?.fitView({padding:.06,duration:200}));},[resetCount]);
  useEffect(()=>{
    const observer=new ResizeObserver(()=>{void flow.current?.fitView({padding:.06});});
    if(canvas.current)observer.observe(canvas.current);
    return ()=>observer.disconnect();
  },[]);
  const edges:Edge[]=connections.sort((a,b)=>Number(a.active)-Number(b.active)).map(c=>({id:`${c.source}-${c.target}`,source:c.source,target:c.target,type:'smoothstep',
    style:{stroke:c.conditional?'var(--review-border)':c.active?'var(--accent)':'var(--line)',strokeWidth:c.active?2.3:1.3,strokeDasharray:c.conditional?'7 5':undefined},
    markerEnd:{type:MarkerType.ArrowClosed,width:19,height:19,color:c.conditional?'var(--review-border)':c.active?'var(--accent)':'var(--line)'},
    pathOptions:{borderRadius:14,offset:38},
  }));
  function reset(){positionsByJourney.set(memoryKey,{});setNodes(previous=>previous.map(n=>({...n,position:{...layout.find(item=>item.id===n.id)!.position}})));setResetCount(n=>n+1);}
  return <div className="policy-shared-map">
    <div className="policy-map-tools"><span>Bấm để xem · kéo nút để sắp xếp · kéo nền / cuộn để pan, zoom</span><button type="button" className="button small secondary" onClick={reset}><RotateCcw size={13}/>Đặt lại bố cục</button></div>
    <div ref={canvas} className="policy-shared-canvas" aria-label={canvasLabel} data-testid={testId}>
      <ReactFlow<MapNode> nodes={nodes} edges={edges} nodeTypes={nodeTypes} onNodesChange={changes=>{
        for(const change of changes)if(change.type==='position'&&change.position)rememberedPositions[change.id]={...change.position};
        onNodesChange(changes);
      }} onInit={instance=>{flow.current=instance;}} onNodeClick={(_,node)=>{if(node.id!==lastDrag.current.id||Date.now()-lastDrag.current.at>220)onOpen(node.id);}}
        onNodeDragStop={(_,node)=>{lastDrag.current={id:node.id,at:Date.now()};}} nodeDragThreshold={6} nodesDraggable nodesConnectable={false} edgesFocusable={false} fitView fitViewOptions={{padding:.06}} minZoom={.16} maxZoom={1.8} proOptions={{hideAttribution:true}}>
        <Background gap={22} size={1} color="var(--line)"/><Controls showInteractive={false}/>
      </ReactFlow>
    </div>
    <div className="policy-map-legend">{legend}</div>
  </div>;
}
