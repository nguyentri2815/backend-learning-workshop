import {lazy,Suspense,useEffect,useMemo,useRef,useState} from 'react';
import {ReactFlow,Background,Controls,MarkerType,Position} from '@xyflow/react';
import {Copy,Network,X} from 'lucide-react';
import {SourceTree} from '../JourneyWorkspace';
import type {LearningEvidence as Evidence,LearningPattern as Pattern,LearningFocus as SourceFocus,LearningPresentation as SourcePresentation,LearningDiagramRelation as DiagramRelation,LearningDiagram,PatternWorkspaceAdapter} from './learning-contracts';
type EvidenceKey=string;
import {LearningSources,useLearningSources} from './LearningSources';
import {FocusedEvidenceViewer,InlineExplanation,TemplateCode,frameExplanation} from './AssemblySourceView';
import type {SourceRequest} from './AssemblySourceView';
import {patternSelection,selectPatternEdge,selectPatternNode} from './assembly-pattern-model';
import './policy-pattern-workspace.css';

const CodeBlock=lazy(()=>import('../workshop/CodeBlock').then(m=>({default:m.CodeBlock})));
type Props={stepId:string;pattern:Pattern;params:URLSearchParams;update:(values:Record<string,string|null>)=>void;active:boolean;adapter:PatternWorkspaceAdapter};

export function LearningPatternWorkspace({stepId,pattern,params,update,active,adapter}:Props) {
  const {sources,trace:cooperationTrace,diagram:diagramModel,componentFocus,nodeFocus}=adapter;
  const selection=patternSelection(pattern,params,stepId),{node,edge,kind}=selection;
  const model=useMemo(()=>diagramModel(pattern),[pattern]);
  const trace=cooperationTrace(pattern,edge);
  const [request,setRequest]=useState<SourceRequest>();
  const stamps=useRef(0);
  const primaryRef=model.nodes.find(n=>n.componentId===node.id)!.ref;
  const componentItems=[node.evidence.find(e=>e.ref===primaryRef)??{ref:primaryRef},...node.evidence.filter(e=>e.ref!==primaryRef)];
  for(const relation of model.relations.filter(r=>r.kind==='inheritance'&&r.from===node.id))if(relation.toFocus&&!componentItems.some(e=>e.ref===relation.toFocus!.ref))componentItems.push({ref:relation.toFocus.ref});
  const componentPresentations:Partial<Record<EvidenceKey,SourcePresentation>>={};
  for(const item of componentItems) {
    const inherited=model.relations.find(r=>r.kind==='inheritance'&&r.from===node.id&&r.toFocus?.ref===item.ref)?.toFocus;
    componentPresentations[item.ref]=presentationForFocus(inherited??(node.evidence.some(e=>e.ref===item.ref)?nodeFocus(node,item.ref):componentFocus(item)),item.ref===primaryRef?'Thành phần đang xem':'Thành phần hỗ trợ');
  }
  const pairItems:Evidence[]=[...new Set([trace.caller.focus.ref,trace.receiver.focus.ref,...edge.evidence.map(e=>e.ref)])].map(ref=>({ref}));
  const pairPresentations:Partial<Record<EvidenceKey,SourcePresentation>>={};
  for(const item of pairItems)pairPresentations[item.ref]=presentationForFocus(componentFocus(item),'Source bổ sung');
  pairPresentations[trace.caller.focus.ref]=presentationForFocus(trace.caller.focus,`A · ${trace.caller.label}`);
  pairPresentations[trace.receiver.focus.ref]=presentationForFocus(trace.receiver.focus,`B · ${trace.receiver.label}`);
  if(trace.caller.focus.ref===trace.receiver.focus.ref)pairPresentations[trace.caller.focus.ref]=presentationForFocus({...trace.caller.focus,annotations:[...trace.caller.focus.annotations,...trace.receiver.focus.annotations]},'A / B');
  function jump(ref:EvidenceKey) {setRequest({ref,stamp:++stamps.current});}
  function showDiagram(ref?:EvidenceKey,side?:'A'|'B') {
    update({[`assemblyDiagram.${stepId}`]:'1',[`assemblyDiagramRef.${stepId}`]:ref??null,[`assemblyDiagramSide.${stepId}`]:side??null,[`assemblyDiagramRelation.${stepId}`]:kind==='cooperation'&&!ref?edge.id:null});
  }
  return <LearningSources sources={sources} guides={adapter.guides}><section className="assembly-pattern-inspector assembly-pattern-workspace" aria-label="Khung triển khai đã chọn">
    <div role="tablist" className="assembly-frame-tabs" aria-label="Loại khung code">
      <button role="tab" aria-selected={kind==='component'} aria-controls={`component-frame-${stepId}`} onClick={()=>update({[`assemblyFrame.${stepId}`]:'component'})}>KHUNG THÀNH PHẦN</button>
      <button role="tab" aria-selected={kind==='cooperation'} aria-controls={`cooperation-frame-${stepId}`} onClick={()=>update({[`assemblyFrame.${stepId}`]:'cooperation'})}>KHUNG PHỐI HỢP</button>
    </div>
    <div className="assembly-frame-heading"><h4>{kind==='component'?`Mẫu ${node.name}`:edge.label}</h4>
      <InlineExplanation key={`${pattern.id}:${selection.inspect}`} label={`Giải thích khung ${kind==='component'?node.name:edge.label}`} text={frameExplanation(kind==='component'?node:undefined,kind==='cooperation'?edge:undefined,pattern)}/>
    </div>
    {kind==='component'?<div id={`component-frame-${stepId}`} role="tabpanel" aria-label="Khung thành phần">
      <p>{node.role}</p>
      <TemplateCard key={`${pattern.id}:${node.id}`} code={node.frame} omitted={node.id!=='controller'&&!(node.id==='func'&&node.evidence[0].ref==='func')} onDiagram={()=>showDiagram()} memory={`component:${stepId}:${pattern.id}:${node.id}`}/>
      <FocusedEvidenceViewer items={componentItems} memory={`component:${stepId}:${pattern.id}:${node.id}`} presentations={componentPresentations} request={request} onDiagram={ref=>showDiagram(ref)}/>
    </div>:<div id={`cooperation-frame-${stepId}`} role="tabpanel" aria-label="Khung phối hợp">
      <div className="assembly-pair-actions"><span>{trace.relation} · {edge.label}</span><button onClick={()=>showDiagram()}><Network size={15}/>Xem sơ đồ phối hợp</button></div>
      <div className="assembly-pair-frames">{[trace.caller,trace.receiver].map(side=><section key={side.id} className="assembly-pair-side" data-source-tone={side.id==='A'?'caller':'receiver'}>
        <button className="assembly-pair-jump" aria-label={`Mở source ${side.id} · ${side.focus.symbol}`} onClick={()=>jump(side.focus.ref)}><strong>{side.id} · {side.label}</strong><span>{side.focus.symbol}</span></button>
        <p className="assembly-caption">{side.id==='A'?'Dữ liệu đi ra từ điểm này.':'Đối chiếu đầu nhận trong snapshot.'}</p>
        <TemplateCode text={side.code} memory={`pair:${stepId}:${pattern.id}:${edge.id}:${side.id}`}/>
      </section>)}</div>
      {trace.note&&<p className="assembly-limit">{trace.note}</p>}
      <p className="assembly-caption">Bấm A/B để mở đúng source. Màu và nhãn giữ nguyên khi mở toàn file; số dòng là số dòng gốc.</p>
      <FocusedEvidenceViewer items={pairItems} memory={`pair:${stepId}:${pattern.id}:${edge.id}`} presentations={pairPresentations} request={request} onDiagram={ref=>showDiagram(ref,ref===trace.caller.focus.ref?'A':ref===trace.receiver.focus.ref?'B':undefined)}/>
    </div>}
    <PatternDiagram {...{stepId,pattern,params,update,active,model,adapter}}/>
  </section></LearningSources>;
}

export function TemplateCard({code,omitted,onDiagram,memory}:{code:string;omitted:boolean;onDiagram:()=>void;memory:string}) {
  const [copied,setCopied]=useState(false),[error,setError]=useState(false);
  async function copy() {
    try {await navigator.clipboard.writeText(code);setCopied(true);setError(false);}
    catch {setError(true);setCopied(false);}
  }
  return <section className="assembly-template-card" aria-label="Mẫu để làm theo">
    <header><strong>Mẫu để làm theo</strong><div><button onClick={copy}><Copy size={14}/>{copied?'Đã sao chép':'Sao chép mẫu'}</button>{omitted&&<span className="assembly-template-omitted">Có phần lược · đối chiếu source đầy đủ.</span>}<button onClick={onDiagram}><Network size={14}/>Xem sơ đồ liên quan</button></div></header>
    <TemplateCode text={code} memory={memory}/>
    {copied&&<span role="status" className="assembly-copy-status">Đã sao chép nội dung code, giữ nguyên xuống dòng.</span>}
    {error&&<p role="status">Chưa sao chép được. Có thể chọn nội dung trong vùng code để sao chép.</p>}
  </section>;
}

function PatternDiagram({stepId,pattern,params,update,active,model,adapter}:Props&{model:LearningDiagram}) {
  const {sources,trace:cooperationTrace,componentFocus,nodeFocus}=adapter;
  const dialog=useRef<HTMLDialogElement>(null),tree=useRef<HTMLElement>(null),{node,edge,kind}=patternSelection(pattern,params,stepId);
  const [treeOpen,setTreeOpen]=useState(()=>window.matchMedia('(min-width:761px)').matches);
  const open=params.get(`assemblyDiagram.${stepId}`)==='1'&&active;
  const mode=params.get(`assemblyDiagramMode.${stepId}`)==='practice'?'practice':'related';
  const requestedRef=params.get(`assemblyDiagramRef.${stepId}`) as EvidenceKey|null;
  const ref=requestedRef&&model.files.some(f=>f.path===sources[requestedRef]?.path)?requestedRef:undefined;
  const relation=model.relations.find(r=>r.id===params.get(`assemblyDiagramRelation.${stepId}`));
  const trace=cooperationTrace(pattern,relation?.handoff??edge);
  const side=params.get(`assemblyDiagramSide.${stepId}`);
  const primary=ref??(!relation&&kind==='component'?model.nodes.find(n=>n.componentId===node.id)!.ref:undefined);
  const file=model.files.find(f=>f.path===(primary?sources[primary].path:''));
  const graphSelected=model.nodes.filter(n=>file?sources[n.ref].path===file.path:n.id===node.id).map(n=>n.id);
  let focus:SourceFocus|undefined;
  if(primary) {
    const special=relation?.fromFocus&&relation.toFocus?(side==='A'?relation.fromFocus:relation.toFocus):undefined;
    const inherited=model.relations.find(r=>r.kind==='inheritance'&&r.from===node.id&&r.toFocus?.ref===primary)?.toFocus??model.relations.find(r=>r.kind==='inheritance'&&r.toFocus?.ref===primary)?.toFocus;
    focus=special??(kind==='cooperation'&&side==='A'?trace.caller.focus:kind==='cooperation'&&side==='B'?trace.receiver.focus:
      inherited??(node.evidence.some(e=>e.ref===primary)?nodeFocus(node,primary):componentFocus({ref:primary})));
  }
  const presentation=focus?presentationForFocus(focus,focus.annotations[0].tone==='caller'?'A · Bên gọi':focus.annotations[0].tone==='receiver'?'B · Bên nhận':focus.annotations[0].tone==='support'?'Lớp nền hỗ trợ':'Thành phần đang xem'):undefined;
  useEffect(()=>{
    const element=dialog.current;if(!element)return;
    if(open&&!element.open)element.showModal();else if(!open&&element.open)element.close();
  },[open]);
  useEffect(()=>{
    const handle=requestAnimationFrame(()=>{const selected=tree.current?.querySelector<HTMLElement>('.tree-file.selected');if(tree.current&&selected)tree.current.scrollTop+=selected.getBoundingClientRect().top-tree.current.getBoundingClientRect().top-tree.current.clientHeight/2;});
    return ()=>cancelAnimationFrame(handle);
  },[file?.id,treeOpen,open]);
  function close(){update({[`assemblyDiagram.${stepId}`]:null});}
  function chooseNode(id:string) {
    const target=model.nodes.find(n=>n.id===id)!;
    update({...selectPatternNode(stepId,target.componentId??node.id,edge.id),[`assemblyDiagramRef.${stepId}`]:target.ref,[`assemblyDiagramRelation.${stepId}`]:null,[`assemblyDiagramSide.${stepId}`]:null});
  }
  function chooseFile(id:string) {
    const target=model.files.find(f=>f.id===id)!;
    const own=model.nodes.find(n=>n.componentId===node.id&&sources[n.ref].path===target.path)??model.nodes.find(n=>sources[n.ref].path===target.path);
    if(own)chooseNode(own.id);else update({[`assemblyDiagramRef.${stepId}`]:id,[`assemblyDiagramRelation.${stepId}`]:null,[`assemblyDiagramSide.${stepId}`]:null});
  }
  function chooseRelation(selected:DiagramRelation) {
    update({...selected.handoff?selectPatternEdge(stepId,selected.handoff.id,node.id):{},[`assemblyDiagramRelation.${stepId}`]:selected.id,[`assemblyDiagramRef.${stepId}`]:null,[`assemblyDiagramSide.${stepId}`]:null});
  }
  function gotoSide(value:'A'|'B') {
    const selected=relation?.fromFocus&&relation.toFocus?(value==='A'?relation.fromFocus:relation.toFocus):(value==='A'?trace.caller.focus:trace.receiver.focus);
    update({[`assemblyDiagramRef.${stepId}`]:selected.ref,[`assemblyDiagramSide.${stepId}`]:value});
  }
  const main=model.nodes.filter(n=>n.componentId),support=model.nodes.filter(n=>!n.componentId);
  const graphNodes=model.nodes.map(n=>({id:n.id,position:n.position??(n.componentId?{x:0,y:main.indexOf(n)*150}:{x:430,y:support.indexOf(n)*140}),
    sourcePosition:n.position?Position.Right:Position.Bottom,targetPosition:n.position?Position.Left:Position.Top,data:{label:<><strong>{n.title}</strong><small>{n.role}</small></>},
    style:{width:280,height:90,padding:12,background:graphSelected.includes(n.id)?'var(--selected)':'var(--surface)',color:'var(--text)',border:`${graphSelected.includes(n.id)?2:1}px ${n.componentId?'solid':'dashed'} var(--accent-border)`,borderRadius:6}}));
  const graphEdges=model.relations.map(r=>({id:r.id,source:r.from,target:r.to,type:'smoothstep',label:r.kind==='inheritance'?'Kế thừa · hỗ trợ':`${r.kind==='call'?'Gọi · ':r.kind==='event'?'Event · ':''}${r.label}`,
    markerEnd:{type:MarkerType.ArrowClosed,color:r.kind==='inheritance'?'var(--muted)':'var(--accent)'},style:{stroke:r.kind==='inheritance'?'var(--muted)':'var(--accent)',strokeWidth:relation?.id===r.id?3:1.5,strokeDasharray:r.kind==='call'?undefined:r.kind==='inheritance'?'4 4':'7 5'},labelStyle:{fill:'var(--text)',fontSize:12},labelBgStyle:{fill:'var(--surface)'}}));
  return <dialog ref={dialog} className="assembly-pattern-dialog assembly-pattern-workspace" aria-label="Sơ đồ phối hợp và cây workspace" onCancel={event=>{event.preventDefault();close();}}>
    <header><div><h3>{mode==='related'?`Sơ đồ phối hợp · ${pattern.title}`:`Từng bước triển khai · ${adapter.title}`}</h3><small>{mode==='related'?'Chọn node/file để đối chiếu. Lớp nền hỗ trợ mẫu được phân biệt với lời gọi chạy tiếp.':'Tìm file trong cây, thực hiện thao tác rồi xem code và kết quả của từng lượt.'}</small></div><button onClick={close} autoFocus aria-label="Đóng sơ đồ phối hợp"><X size={18}/></button></header>
    {open&&<><div role="tablist" className="assembly-dialog-tabs" aria-label="Chế độ cửa sổ workspace" onKeyDown={event=>{
      if(event.key!=='ArrowLeft'&&event.key!=='ArrowRight')return;
      event.preventDefault();const next=mode==='related'?'practice':'related';
      update({[`assemblyDiagramMode.${stepId}`]:next});
      event.currentTarget.querySelectorAll<HTMLButtonElement>('[role=tab]')[next==='related'?0:1].focus();
    }}>
      <button id={`assembly-related-tab-${stepId}`} role="tab" aria-selected={mode==='related'} aria-controls={`assembly-related-panel-${stepId}`} tabIndex={mode==='related'?0:-1} onClick={()=>update({[`assemblyDiagramMode.${stepId}`]:'related'})}>Sơ đồ liên quan</button>
      <button id={`assembly-implementation-tab-${stepId}`} role="tab" aria-selected={mode==='practice'} aria-controls={`assembly-implementation-panel-${stepId}`} tabIndex={mode==='practice'?0:-1} onClick={()=>update({[`assemblyDiagramMode.${stepId}`]:'practice'})}>Từng bước triển khai</button>
    </div>
    <div id={`assembly-related-panel-${stepId}`} role="tabpanel" aria-labelledby={`assembly-related-tab-${stepId}`} className="assembly-diagram-panel" hidden={mode!=='related'}>
    <div className="assembly-diagram-controls"><button aria-expanded={treeOpen} onClick={()=>setTreeOpen(!treeOpen)}>Cây workspace · {model.files.length} file liên quan</button><span>→ Lời gọi / dữ liệu · nét đứt: kế thừa, hỗ trợ hoặc Event (xem nhãn cạnh)</span></div>
    <div className={`assembly-diagram-layout ${treeOpen?'':'is-tree-closed'}`}>
      {treeOpen&&<aside ref={tree} className="assembly-diagram-tree"><h4>Workspace rút gọn</h4><SourceTree compactFolders files={model.files} selected={file?.id??''} onSelect={chooseFile} label="Cây file của mẫu đang chọn" memoryKey={`pattern:${stepId}:${pattern.id}`}/></aside>}
      <main className="assembly-diagram-main">
        <div className="assembly-diagram-canvas"><ReactFlow key={`${stepId}:${pattern.id}`} nodes={graphNodes} edges={graphEdges} fitView fitViewOptions={{padding:.12,maxZoom:1}}
          nodesDraggable={false} nodesConnectable={false} minZoom={.2} maxZoom={1.5} onNodeClick={(_,n)=>chooseNode(n.id)} onEdgeClick={(_,e)=>chooseRelation(model.relations.find(r=>r.id===e.id)!)}><Background/><Controls showInteractive={false}/></ReactFlow></div>
        <nav className="assembly-diagram-node-links" aria-label="Chọn node liên quan">{model.nodes.map(n=><button key={n.id} aria-pressed={graphSelected.includes(n.id)} onClick={()=>chooseNode(n.id)}>{n.title}</button>)}</nav>
        <nav className="assembly-diagram-edge-links" aria-label="Chọn quan hệ của mẫu">{model.relations.map(r=><button key={r.id} aria-pressed={relation?.id===r.id} onClick={()=>chooseRelation(r)}>{r.kind==='inheritance'?'Kế thừa · ':r.kind==='support'?'Hỗ trợ · ':''}{r.label}</button>)}</nav>
        {!focus?<section className="assembly-diagram-handoff"><h4>{relation?.label??edge.label}</h4>
          {relation?.kind==='inheritance'?<p>Khai báo kế thừa trong snapshot nối lớp triển khai với lớp nền. Đây là nơi cung cấp thành phần hỗ trợ; không biểu thị file chạy tiếp.</p>:relation?.kind==='support'?<p>Source này hỗ trợ đối chiếu khung đang xem. Nhãn này không khẳng định một lời gọi trực tiếp; mở hai phía để đọc nhóm lệnh và hợp đồng liên quan.</p>:<><p><strong>Dữ liệu bàn giao:</strong> {(relation?.handoff??edge).data}</p><p>{(relation?.handoff??edge).result}</p>{cooperationTrace(pattern,relation?.handoff??edge).note&&<p className="assembly-limit">{cooperationTrace(pattern,relation?.handoff??edge).note}</p>}</>}
          <div><button onClick={()=>gotoSide('A')}>{relation?.kind==='inheritance'?'Mở khai báo kế thừa':relation?.kind==='support'?'Mở thành phần':'A · Đi tới bên gọi / nơi cung cấp'}</button><button onClick={()=>gotoSide('B')}>{relation?.kind==='inheritance'?'Mở lớp nền':relation?.kind==='support'?'Mở source hỗ trợ':'B · Đi tới bên nhận'}</button></div>
        </section>:<DiagramSource key={`${focus.ref}:${presentation!.label}:${focus.annotations.map(a=>a.start).join(',')}`} focus={focus} presentation={presentation!} memory={`diagram:${stepId}:${pattern.id}:${kind}:${focus.ref}:${focus.annotations[0].start}`}/>}
      </main>
    </div></div>
    <div id={`assembly-implementation-panel-${stepId}`} role="tabpanel" aria-labelledby={`assembly-implementation-tab-${stepId}`} className="assembly-implementation-panel" hidden={mode!=='practice'}>
      {adapter.implementation({stepId,params,update})}
    </div></>}
  </dialog>;
}

function DiagramSource({focus,presentation,memory}:{focus:SourceFocus;presentation:SourcePresentation;memory:string}) {
  const {sources}=useLearningSources();
  const [full,setFull]=useState(false),root=useRef<HTMLElement>(null),source=sources[focus.ref];
  const start=Math.min(...focus.annotations.map(a=>a.start)),end=Math.max(...focus.annotations.map(a=>a.end));
  const rows=full?source.rows:source.rows.slice(Math.max(0,start-5),Math.min(source.rows.length,end+4));
  useEffect(()=>{if(window.matchMedia('(max-width:760px)').matches)root.current?.scrollIntoView({block:'start',behavior:'instant'});},[]);
  return <section ref={root} className="assembly-diagram-source" aria-label="Source đang đối chiếu" data-source-ref={focus.ref} data-source-tone={presentation.tone}>
    <header><strong>{presentation.label} · {focus.symbol}</strong><button onClick={()=>setFull(!full)}>{full?'Đoạn liên quan':'Mở toàn bộ file'}</button></header>
    <p className="assembly-source-path"><code>{source.path}</code></p><p className="assembly-focus-caption">{presentation.caption}</p>
    <div className="assembly-code" data-full-source={full?focus.ref:undefined}><Suspense fallback={<p>Đang mở source…</p>}><CodeBlock key={`${memory}:${full}`} rows={rows} path={source.path} annotations={focus.annotations} scrollAnchor={start} preferTarget revealAncestors memoryKey={`${memory}:${full}`}/></Suspense></div>
  </section>;
}

function presentationForFocus(focus:SourceFocus,label:string):SourcePresentation{return {focus,label,tone:focus.annotations[0].tone,caption:focus.annotations.map(a=>`L${a.start}${a.end!==a.start?`-${a.end}`:''} ${a.label}`).join(' / ') };}
