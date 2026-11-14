import {Background,Controls,MarkerType,Position,ReactFlow} from "@xyflow/react";
import type {Edge,Node} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import {infraEdges,infraNodes} from "./infrastructure-model";
import source from "../content/setup/practice-infrastructure-source.json" with { type: "json" };
import type {Simulation} from "./practice-runtime-model";
export function InfrastructurePanel({sim:s,update}:{sim:Simulation;update:(patch:Partial<Simulation>)=>void}){
  const command=s.infraScope==="command";
  const groups=[{id:"java",title:"Ứng dụng Java",x:20},{id:"support",title:"Dịch vụ hỗ trợ",x:350},{id:"tools",title:"Công cụ quan sát",x:700}];
  const active=infraEdges.filter(e=>!command||e.command);
  const emphasized=new Set(["command",...active.flatMap(e=>[e.source,e.target])]);
  const nodes:Node[]=[...groups.map(g=>({id:`group-${g.id}`,position:{x:g.x,y:0},data:{label:g.title},selectable:false,draggable:false,style:{width:235,background:"var(--canvas)",border:"none",fontWeight:700,color:"var(--text)"}})),...infraNodes.map(item=>{
    const group=groups.find(g=>g.id===item.group)!;const index=infraNodes.filter(n=>n.group===item.group).findIndex(n=>n.id===item.id);
    return {id:item.id,position:{x:group.x,y:65+index*85},data:{label:<><b>{item.label}</b><small>{item.note}</small></>},sourcePosition:Position.Right,targetPosition:Position.Left,style:{width:235,opacity:command&&!emphasized.has(item.id)?.38:1,border:item.id==="command"&&command?"2px solid var(--accent)":"1px solid var(--line)",background:item.group==="java"?"var(--surface)":item.group==="tools"?"var(--review-bg)":"var(--surface)",borderRadius:7,fontSize:13,color:"var(--text)"}};
  })];
  const edges:Edge[]=infraEdges.map(item=>({id:item.id,source:item.source,target:item.target,label:item.label,type:"smoothstep",markerEnd:{type:MarkerType.ArrowClosed,color:"var(--accent-border)"},style:{stroke:s.infraSelected===item.id?"var(--review)":"var(--accent-border)",strokeWidth:s.infraSelected===item.id?3:1.4,strokeDasharray:item.direct?undefined:"6 4",opacity:command&&!item.command?.16:1},labelStyle:{fontSize:10,fill:"var(--text)"},labelBgPadding:[4,3],labelBgBorderRadius:3}));
  const selected=infraEdges.find(e=>e.id===s.infraSelected);
  const proof=selected?.proof==="compose"?source.files.find(f=>f.id==="compose"):source.evidence.find(e=>e.id===selected?.proof);
  return <details className="infrastructure-panel" open={s.infraOpen}><summary onClick={event=>{event.preventDefault();update({infraOpen:!s.infraOpen});}}>Xem hạ tầng toàn workspace <span>{s.infraOpen?"Thu gọn":"Mở sơ đồ"}</span></summary>{s.infraOpen&&<div className="infrastructure-content">
    <div className="runtime-choices" aria-label="Phạm vi hạ tầng"><button className="button secondary" aria-pressed={command} onClick={()=>update({infraScope:"command",infraSelected:""})}>Command</button><button className="button secondary" aria-pressed={!command} onClick={()=>update({infraScope:"workspace",infraSelected:""})}>Toàn workspace</button></div>
    <p>{command?"Làm nổi bật các quan hệ cấu hình đã xác minh của Command; thành phần còn lại vẫn hiện mờ.":"Các app và dịch vụ đã khảo sát trong workspace. App nhóm khác chỉ liệt kê; chưa xác minh quan hệ thì không vẽ cạnh."}</p>
    <div className="infrastructure-graph" aria-label="Sơ đồ hạ tầng workspace"><ReactFlow nodes={nodes} edges={edges} fitView fitViewOptions={{padding:.1}} minZoom={.3} maxZoom={1.4} nodesDraggable={false} nodesConnectable={false} onEdgeClick={(_,edge)=>update({infraSelected:edge.id})} onNodeClick={(_,node)=>{if(node.id==="command")update({infraScope:"command",infraSelected:""});}} proOptions={{hideAttribution:true}}><Background gap={20}/><Controls showInteractive={false}/></ReactFlow></div>
    <p className="infrastructure-legend">Nét liền: app khai báo đích trực tiếp trong cấu hình. Nét đứt: quan hệ hạ tầng/depends_on; gián tiếp với app. Cạnh mô tả cấu hình, không xác nhận traffic/runtime.</p>
    <p>Nhóm app Java khác: SSO, Assets, Notification, Schedule, Stomp, Integration và Camunda có main class trong source. Quan hệ của nhóm này chưa khảo sát; không có cạnh suy đoán.</p>
    <div className="infrastructure-relations" aria-label="Quan hệ và bằng chứng">{infraEdges.map(edge=><button key={edge.id} className={command&&!edge.command?"infra-dim":""} aria-pressed={s.infraSelected===edge.id} onClick={()=>update({infraSelected:edge.id})}>{edge.source} → {edge.target} <small>{edge.label}</small></button>)}</div>
    {selected&&proof&&<div className="infrastructure-proof" role="note"><b>{selected.source} → {selected.target}</b><p>{selected.explanation}</p><code>{proof.path}</code><pre>{proof.rows.filter(r=>(selected.lines as readonly number[]).includes(r.line)).map(r=>`${r.line}  ${r.text}`).join("\n")}</pre><p>Đối chiếu source lúc {source.extractedAt}. SHA-256: {proof.sourceSha256}</p></div>}
    <ul><li>Docker có nhiều container hơn ba kết nối đang khảo sát vì còn broker event, Zookeeper, Debezium và công cụ quan sát.</li><li>Command/Flow/Query hoặc Kafka CDC Java chạy từ IntelliJ/terminal là process trên host; chúng không xuất hiện trong Docker Desktop nếu không được đóng gói/chạy bằng container.</li><li>postgres-read là một service riêng. Không có cạnh replication write → read: Compose chưa chứng minh replication đã cấu hình hoặc đang hoạt động.</li><li>Rebrow có image phục vụ xem Redis, nhưng target/network chưa được khai báo rõ trong Compose; chưa vẽ cạnh chắc chắn đến Redis.</li><li>Kafka UI có depends_on Kafka; cấu hình broker/network cần xác nhận thêm. Chỉ chạy các service phù hợp với task, không mặc định toàn stack.</li></ul>
  </div>}</details>;
}
