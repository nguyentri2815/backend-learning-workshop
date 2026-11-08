import { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowRight, RotateCcw } from 'lucide-react';
import { Background, Controls, Handle, MarkerType, Position, ReactFlow, useNodesState } from '@xyflow/react';
import type { Edge, Node, NodeProps, ReactFlowInstance, XYPosition } from '@xyflow/react';
import type { IssuanceBranchId } from '../content/policy/issuance';

type MapNodeData = { number:string; title:string; note:string; active:boolean; inspected:boolean; onOpen:()=>void; practice?:()=>void };
type MapNode = Node<MapNodeData, 'issuance'>;
export type IssuanceMapPoint = 'quote' | IssuanceBranchId | 'save' | 'published' | 'view' | 'core';

const layout: { id:IssuanceMapPoint; number:string; title:string; note:string; position:XYPosition }[] = [
  {id:'quote',number:'1',title:'Quote đã có',note:'Một quoteId cho bốn đường vào',position:{x:0,y:204}},
  {id:'direct',number:'2A',title:'Phát hành trực tiếp',note:'Kiểm tra Quote và Policy trùng',position:{x:310,y:0}},
  {id:'cash',number:'2B',title:'Thu hộ/tiền mặt',note:'Kiểm tra trả phí, terms / OTP',position:{x:310,y:136}},
  {id:'online',number:'2C',title:'Thanh toán online',note:'Chờ gateway xác nhận đã trả tiền',position:{x:310,y:272}},
  {id:'approval',number:'2D',title:'Duyệt thanh toán',note:'Kiểm tra quyền và biến thể duyệt',position:{x:310,y:408}},
  {id:'save',number:'3',title:'Tạo Policy và đối tượng bảo hiểm',note:'Command ghi · trả theo từng nhánh',position:{x:660,y:204}},
  {id:'published',number:'4A',title:'Quote chuyển PUBLISHED',note:'Quote.status = 9 · gắn Policy ID',position:{x:1040,y:42}},
  {id:'view',number:'4B',title:'Event → Flow → Policy View',note:'Query đọc view / thông báo realtime',position:{x:1040,y:204}},
  {id:'core',number:'4C',title:'API / lịch đồng bộ Core',note:'Cập nhật mã Core và syncStatus',position:{x:1040,y:366}},
];
// Remember only positions across Overview / Steps; URLs continue to own learning context.
let rememberedPositions:Record<string,XYPosition> = {};
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
const branches:IssuanceBranchId[]=['direct','cash','online','approval'];

export function PolicyIssuanceDiagram({branch,inspected,onOpen,onPractice}: {
  branch:IssuanceBranchId; inspected:string|null; onOpen:(id:IssuanceMapPoint)=>void; onPractice:()=>void;
}) {
  const makeNodes=useCallback(()=>layout.map(item=>({id:item.id,type:'issuance' as const,position:rememberedPositions[item.id]??{...item.position},width:244,
    data:{...item,active:!branches.includes(item.id as IssuanceBranchId)||item.id===branch,inspected:inspected===item.id,onOpen:()=>onOpen(item.id),practice:item.id==='direct'?onPractice:undefined},
  })),[branch,inspected,onOpen,onPractice]);
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
  const connections=[...branches.flatMap(id=>[{source:'quote',target:id,active:id===branch},{source:id,target:'save',active:id===branch}]),...['published','view','core'].map(id=>({source:'save',target:id,active:true}))];
  const edges:Edge[]=connections.sort((a,b)=>Number(a.active)-Number(b.active)).map(c=>({id:`${c.source}-${c.target}`,source:c.source,target:c.target,type:'smoothstep',
    style:{stroke:c.target==='core'?'#b28d46':c.active?'#258b88':'#b5c5cf',strokeWidth:c.active?2.3:1.3,strokeDasharray:c.target==='core'?'7 5':undefined},
    markerEnd:{type:MarkerType.ArrowClosed,width:19,height:19,color:c.target==='core'?'#b28d46':c.active?'#258b88':'#b5c5cf'},
    pathOptions:{borderRadius:14,offset:38},
  }));
  function reset(){rememberedPositions={};setNodes(previous=>previous.map(n=>({...n,position:{...layout.find(item=>item.id===n.id)!.position}})));setResetCount(n=>n+1);}
  return <div className="policy-shared-map">
    <div className="policy-map-tools"><span>Bấm để xem · kéo nút để sắp xếp · kéo nền / cuộn để pan, zoom</span><button type="button" className="button small secondary" onClick={reset}><RotateCcw size={13}/>Đặt lại bố cục</button></div>
    <div ref={canvas} className="policy-shared-canvas" aria-label="Sơ đồ chung: Quote, bốn đường phát hành và ba đường sau phát hành" data-testid="issuance-map">
      <ReactFlow<MapNode> nodes={nodes} edges={edges} nodeTypes={nodeTypes} onNodesChange={changes=>{
        for(const change of changes)if(change.type==='position'&&change.position)rememberedPositions[change.id]={...change.position};
        onNodesChange(changes);
      }} onInit={instance=>{flow.current=instance;}} onNodeClick={(_,node)=>{if(node.id!==lastDrag.current.id||Date.now()-lastDrag.current.at>220)onOpen(node.id as IssuanceMapPoint);}}
        onNodeDragStop={(_,node)=>{lastDrag.current={id:node.id,at:Date.now()};}} nodeDragThreshold={6} nodesDraggable nodesConnectable={false} edgesFocusable={false} fitView fitViewOptions={{padding:.06}} minZoom={.16} maxZoom={1.8} proOptions={{hideAttribution:true}}>
        <Background gap={22} size={1} color="#cfdee4"/><Controls showInteractive={false}/>
      </ReactFlow>
    </div>
    <div className="policy-map-legend"><span><i/>Đường đang học</span><span><i className="conditional"/>Core: có tác nhân và điều kiện riêng</span><span>2A–2D: kiểm tra không đạt → dừng trước khi tạo</span></div>
  </div>;
}
