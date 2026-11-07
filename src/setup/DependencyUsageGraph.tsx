import {Background,Controls,MarkerType,Position,ReactFlow} from "@xyflow/react";
import type {Edge,Node} from "@xyflow/react";
import {dependencySurvey} from "./dependency-survey-model";
import type {SurveyGroup} from "./dependency-survey-model";
export function DependencyUsageGraph({group,show}:{group:SurveyGroup;show:(step:"binding"|"call",proof?:string)=>void}){
  const verified=group.status==="code"&&group.relation==="direct";
  const zk=group.id==="zookeeper";
  const binding=dependencySurvey.evidence.find(proof=>proof.id===(group.id==="kafka"?"kafka-binding":group.binding[0]));
  const labels=zk?["Command","EventuateKafkaProperties","Kafka Compose","Zookeeper"]:["Command",binding?.symbol.split(" · ")[0].split(".")[0]??"Chưa tìm binding Java",group.label];
  const nodes:Node[]=labels.map((label,index)=>({id:String(index),position:{x:index*290,y:0},data:{label},sourcePosition:Position.Right,targetPosition:Position.Left,style:{width:170,fontSize:13,background:index===0?"#edf6fb":"#f6fafb",border:"1px solid #a6c9d9",borderRadius:6,padding:14,color:"#2c5b72"}}));
  const edges:Edge[]=(zk?[0,1,2]:verified?[0,1]:[]).map(index=>({id:String(index),source:String(index),target:String(index+1),label:zk&&index===2?"Compose · gián tiếp":group.id==="kafka"&&index===1?"có subscription":"source đã lần",labelStyle:{fontSize:11},labelBgPadding:[3,3],type:"smoothstep",style:{stroke:"#3986a0",strokeDasharray:zk&&index===2||group.id==="kafka"&&index===1?"5 4":undefined},markerEnd:{type:MarkerType.ArrowClosed}}));
  return <><div className="survey-usage-graph"><ReactFlow nodes={nodes} edges={edges} fitView fitViewOptions={{padding:.05}} nodesDraggable={false} nodesConnectable={false} minZoom={.4} maxZoom={1.4} onNodeClick={(_,node)=>show(Number(node.id)<2?"binding":"call",node.id==="0"?"main":zk?(node.id==="1"?"kafka-binding":"zk-compose"):node.id==="1"?binding?.id:undefined)} onEdgeClick={(_,edge)=>show(edge.id==="0"?"binding":"call",edge.id==="0"?"main":zk?(edge.id==="2"?"zk-compose":"kafka-binding"):undefined)}><Background/><Controls showInteractive={false}/></ReactFlow></div><p>{verified?"Module → thành phần sử dụng → dịch vụ. Chọn node/cạnh để mở bằng chứng, không phải traffic đã kiểm chứng.":zk?"Không có cạnh Java → Zookeeper trực tiếp. Cạnh cuối là hạ tầng Kafka → Zookeeper từ Compose.":"Chưa có đủ bằng chứng cho chuỗi gọi trực tiếp; các node chỉ được liệt kê, không nối cạnh suy đoán."} {group.id==="kafka"&&"Nét đứt là nhánh có điều kiện: chưa tìm được subscriber Command cụ thể."}</p></>;
}
