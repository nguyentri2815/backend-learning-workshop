import type {LearningEvidence,LearningFocus,PatternWorkspaceAdapter,SourceCatalog,LearningDiagram} from './learning-contracts';
// Presentation of verified read models is independent of Policy/List/Quote data.
export function readPatternModel(sources:SourceCatalog,title:string,options:{supportNodes?:boolean;columns?:number}={}):Omit<PatternWorkspaceAdapter,'implementation'>{
 function focus(e:LearningEvidence,tone:'caller'|'receiver'|'component'|'support'='component'):LearningFocus{
  const s=sources[e.ref],start=e.from??s.from,end=e.to??s.to??start;
  return {ref:e.ref,symbol:s.symbol,annotations:[{start,end,tone,label:tone==='caller'?'A · Bên giao':tone==='receiver'?'B · Bên nhận':'Nhóm lệnh đang đối chiếu'}]};
 }
 const code=(f:LearningFocus)=>sources[f.ref].rows.filter(r=>r.line>=f.annotations[0].start&&r.line<=f.annotations[0].end).map(r=>r.text).join('\n');
 return {sources,title,guides:Object.fromEntries(Object.entries(sources).map(([id,s])=>[id,{role:s.symbol,explanation:`Source đã xác minh: ${s.symbol}. Giữ đúng kiểu ID và điều kiện của luồng đang học.`}])),componentFocus:e=>focus(e),nodeFocus:(n,ref)=>focus(n.evidence.find(e=>e.ref===ref)??{ref}),
  trace:(_pattern,e)=>{const a=focus(e.evidence[0],'caller'),b=focus(e.evidence[1],'receiver');return {kind:e.kind??'data',relation:e.label,caller:{id:'A',label:'Bên giao',focus:a,code:code(a)},receiver:{id:'B',label:'Bên nhận',focus:b,code:code(b)},note:e.limit};},
  diagram:pattern=>{
   const model:LearningDiagram={nodes:pattern.nodes.map((n,i)=>({id:n.id,title:sources[n.evidence[0].ref].path.split('/').at(-1)!.replace('.java',''),role:n.name,ref:n.evidence[0].ref,componentId:n.id,...options.columns?{position:{x:i%options.columns*430,y:Math.floor(i/options.columns)*170}}:{}})),relations:pattern.edges.map(e=>({id:e.id,from:e.from,to:e.to,kind:e.kind??'data',label:e.label,handoff:e})),files:[]};
   if(options.supportNodes!==false)for(const n of pattern.nodes)for(const e of n.evidence.slice(1)){
    const id=`support:${e.ref}`;if(!model.nodes.some(n=>n.id===id))model.nodes.push({id,title:sources[e.ref].path.split('/').at(-1)!.replace('.java',''),role:'Thành phần hỗ trợ',ref:e.ref});
    model.relations.push({id:`${n.id}:${e.ref}`,from:n.id,to:id,kind:'support',label:sources[e.ref].symbol,fromFocus:focus(n.evidence[0]),toFocus:focus(e,'support')});
   }
   model.files=[...new Set(pattern.nodes.flatMap(n=>n.evidence.map(e=>e.ref)))].map(ref=>({id:ref,path:sources[ref].path,nodeIds:model.nodes.filter(n=>n.ref===ref).map(n=>n.id)}));return model;
  }};
}
