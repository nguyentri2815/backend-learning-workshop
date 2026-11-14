import { ReactFlow, Background, Controls, MarkerType, Position } from '@xyflow/react';
import type { LessonNode, PolicyGroup } from '../content/policy/flows';
import { excerptById } from '../content/policy/lesson';
import '@xyflow/react/dist/style.css';

export function PolicyDiagram({nodes,onOpen,group}:{nodes:LessonNode[];onOpen:(id:string)=>void;group:PolicyGroup}) {
 const visible=nodes.length>6?[nodes[0],nodes[1],nodes[Math.floor(nodes.length/2)],...nodes.slice(-2)]:nodes;
 const graph=visible.map((n,i)=>({id:n.id,position:{x:(i<3?i:5-i)*300,y:Math.floor(i/3)*165},sourcePosition:i<2?Position.Right:i===2?Position.Bottom:Position.Left,targetPosition:i<3?Position.Left:i===3?Position.Top:Position.Right,data:{label:<><span className="policy-node-index">{String(i+1).padStart(2,'0')}</span><strong>{n.title}</strong><small>{group==='create'?['Request · Command','READ · Quote + kiểm tra','Dựng dữ liệu','WRITE · policy_aggregate','WRITE · policy_view_aggregate','READ · người dùng thấy kết quả'][i]:excerptById[n.ref].module}</small></>},style:{width:260},className:`policy-flow-node ${n.id==='save'?'command':n.id==='flow'?'query':''}`}));
 const edges=visible.slice(1).map((n,i)=>({id:`${visible[i].id}-${n.id}`,source:visible[i].id,target:n.id,markerEnd:{type:MarkerType.ArrowClosed},style:{stroke:'var(--accent-border)',strokeWidth:1.5},type:'smoothstep'}));
 return <div className="policy-diagram" aria-label="Sơ đồ xử lý; bấm một điểm để mở đúng bước"><ReactFlow key={`${group}:${nodes[0].id}`} nodes={graph} edges={edges} onNodeClick={(_,node)=>onOpen(node.id)} fitView fitViewOptions={{padding:.12}} nodesDraggable={false} nodesConnectable={false} zoomOnScroll={false} panOnScroll={false} minZoom={.2} maxZoom={1.3} proOptions={{hideAttribution:true}}><Background gap={22} size={1}/><Controls showInteractive={false}/></ReactFlow></div>;
}

