import {useState} from 'react';
import {ReactFlow, Background, Controls, MarkerType, Position, BaseEdge, EdgeLabelRenderer} from '@xyflow/react';
import type {EdgeProps} from '@xyflow/react';
import {ArrowRight, Check, Info, Lightbulb, X} from 'lucide-react';
import type {LearningComponent as LearningNode,LearningHandoff as Handoff,LearningPattern as Pattern,LearningLesson,PatternWorkspaceAdapter,LearningChanges} from './learning-contracts';
import type {AssemblyDatum} from './assembly-question-data';
import {EvidenceViewer} from './AssemblySourceView';
import {LearningPatternWorkspace} from './LearningPatternWorkspace';
import {LearningSources} from './LearningSources';
import {patternSelection,selectPatternNode,selectPatternEdge} from './assembly-pattern-model';
export {evidenceRows} from './AssemblySourceView';

function HandoffEdge({sourceX,sourceY,targetX,targetY,markerEnd,style,label,data}:EdgeProps) {
  const detour=Number(data?.detour??0), routeX=sourceX+detour*200;
  const path=detour?`M ${sourceX} ${sourceY} V ${sourceY+18} H ${routeX} V ${targetY-18} H ${targetX} V ${targetY}`:`M ${sourceX} ${sourceY} L ${targetX} ${targetY}`;
  return <><BaseEdge path={path} markerEnd={markerEnd} style={style}/><EdgeLabelRenderer>
    <button className={`assembly-handoff-edge nodrag nopan ${detour?'is-side':''}`} onClick={data?.onSelect as ()=>void}
      style={{pointerEvents:'all',transform:`translate(-50%, -50%) translate(${detour?routeX:sourceX}px, ${(sourceY+targetY)/2}px)`}}>{label}</button>
  </EdgeLabelRenderer></>;
}
const learningEdgeTypes={handoff:HandoffEdge};

function LearningMap({nodes, edges, active, select, mapKey}: {nodes: LearningNode[]; edges: Handoff[]; active: string; select:(value:string)=>void; mapKey:string}) {
  const needsGutters=edges.some(e=>e.id==='apply'||nodes.findIndex(n=>n.id===e.to)-nodes.findIndex(n=>n.id===e.from)!==1);
  const graphNodes=nodes.map((n,i)=>({id:n.id,position:{x:0,y:i*160},sourcePosition:Position.Bottom,targetPosition:Position.Top,
    data:{label:<div className="assembly-discovery-node"><strong>{n.name}</strong><small>{n.role}</small></div>},
    style:{width:needsGutters?520:300,height:104,padding:needsGutters?'0 110px':'0',background:'transparent',color:'var(--text)',border:'none',borderRadius:0,boxShadow:'none'}}));
  const graphEdges=edges.map((e,i)=>({id:e.id,source:e.from,target:e.to,label:e.label,type:'handoff',
    data:{onSelect:()=>select(e.id),detour:e.id!=='apply'&&nodes.findIndex(n=>n.id===e.to)-nodes.findIndex(n=>n.id===e.from)===1?0:i%2===0?-1:1},
    markerEnd:{type:MarkerType.ArrowClosed,color:'var(--accent)'},
    style:{stroke:'var(--accent)',strokeWidth:active===e.id?3:1.5,strokeDasharray:e.id==='delivery'?'6 4':undefined},
    labelStyle:{fill:'var(--text)',fontSize:12},labelBgStyle:{fill:'var(--surface)'},labelBgPadding:[6,4] as [number,number]}));
  return <div className="assembly-discovery-map">
    <div className="assembly-learning-canvas" style={{height:Math.min(860,Math.max(300,nodes.length*160))}}>
      <ReactFlow key={mapKey} nodes={graphNodes} edges={graphEdges} edgeTypes={learningEdgeTypes} fitView fitViewOptions={{padding:.08,maxZoom:1}}
        nodesDraggable={false} nodesConnectable={false} onEdgeClick={(_,e)=>select(e.id)}
        onNodeClick={(_,n)=>{const e=edges.find(e=>e.from===n.id||e.to===n.id);if(e)select(e.id);}}
        minZoom={.3} maxZoom={1.5} preventScrolling={false}>
        <Background/><Controls showInteractive={false}/>
      </ReactFlow>
    </div>
    <nav aria-label="Chọn một lần bàn giao">{edges.map((e,i)=><button key={e.id} aria-pressed={active===e.id} onClick={()=>select(e.id)}>
      {i+1}. {e.label} <ArrowRight size={14}/></button>)}</nav>
  </div>;
}

function HandoffCard({handoff, pattern}: {handoff:Handoff; pattern:Pattern}) {
  const from=pattern.nodes.find(n=>n.id===handoff.from)!, to=pattern.nodes.find(n=>n.id===handoff.to)!;
  return <div className="assembly-handoff" aria-live="polite">
    <span className="eyebrow">MỘT LẦN BÀN GIAO</span><h4>{handoff.label}</h4>
    <dl><dt>Bên gửi</dt><dd>{from.name}</dd><dt>Bên nhận</dt><dd>{to.name}</dd>
      <dt>Dữ liệu bàn giao</dt><dd className="assembly-sample-value">{handoff.data}</dd>
    </dl><details className="assembly-output-data"><summary>Xem kết quả lần bàn giao</summary><p>{handoff.result}</p></details>
    {handoff.limit&&<p className="assembly-limit">{handoff.limit}</p>}
  </div>;
}

function InputData({rows}:{rows:AssemblyDatum[]}) {
  return <dl className="assembly-input-data">{rows.map(row=><div key={row.label}><dt>{row.label}</dt><dd>{row.value}</dd></div>)}</dl>;
}

const learningViews=[{id:'reason',label:'Suy luận'},{id:'cooperate',label:'Phối hợp'},{id:'pattern',label:'Chọn mẫu'}] as const;

type Props={stepId:string;params:URLSearchParams;update:(values:LearningChanges)=>void;lesson:LearningLesson;steps:{id:string;title:string}[];sample:{value:string;options:{id:string;label:string}[];onChange:(id:string)=>void;info:string};dataForDecision:(index:number,previousExplored:boolean)=>AssemblyDatum[];onStep:(id:string)=>void;adapter:PatternWorkspaceAdapter;canonicalIndex?:(answers:(number|undefined)[])=>number;answerChanges?:(index:number,value:number)=>LearningChanges};
export function LearningAssemblyLesson({stepId,params,update,lesson,steps,sample,dataForDecision,onStep,adapter,canonicalIndex,answerChanges}:Props){
  const answersKey=`assemblyAnswers.${stepId}`, patternKey=`assemblyPattern.${stepId}`, inspectKey=`assemblyInspect.${stepId}`;
  const viewKey=`assemblyView.${stepId}`, decisionKey=`assemblyDecision.${stepId}`;
  const [infoOpen,setInfoOpen]=useState(false);
  const raw=(params.get(answersKey)??'').split(',');
  const answers=lesson.decisions.map((_,i)=>raw[i]==='0'||raw[i]==='1'?Number(raw[i]):undefined);
  // Exploring an alternative still counts. Merely opening a decision does not.
  const firstMissing=answers.findIndex(a=>a===undefined), count=firstMissing<0?answers.length:firstMissing;
  const explored=answers.filter(a=>a!==undefined).length;
  const complete=explored===lesson.decisions.length;
  const fromSession=adapter.title==='Tạo Policy từ Quote'&&params.has('sessionReturn');
  const requestedDecision=lesson.decisions.findIndex(d=>d.id===params.get(decisionKey));
  const activeIndex=requestedDecision>=0?requestedDecision:Math.min(count,lesson.decisions.length-1);
  const decision=lesson.decisions[activeIndex];
  const inputData=dataForDecision(activeIndex,answers.slice(0,activeIndex).every(a=>a!==undefined));
  const view=learningViews.find(v=>v.id===params.get(viewKey))?.id??(complete&&params.has(inspectKey)?'pattern':'reason');
  const canonical=lesson.patterns[canonicalIndex?.(answers)??0];
  const pattern=lesson.patterns.find(p=>p.id===params.get(patternKey))??canonical??lesson.patterns[0];
  const revealed=new Set(lesson.decisions.filter((_,i)=>answers[i]!==undefined).flatMap(d=>d.reveal));
  const visibleNodes=canonical.nodes.filter(n=>revealed.has(n.id));
  const visibleEdges=canonical.edges.filter(e=>revealed.has(e.from)&&revealed.has(e.to));
  const handoff=visibleEdges.find(e=>e.id===params.get(`assemblyHandoff.${stepId}`))??visibleEdges[0];
  const selection=patternSelection(pattern,params,stepId),inspect=selection.inspect;
  const selectedNode=selection.kind==='component'?selection.node:undefined;
  const selectedEdge=selection.kind==='cooperation'?selection.edge:undefined;
  const limits=[...new Set([selectedNode?.limit,selectedEdge?.limit,pattern.limit].filter(Boolean))];
  const index=steps.findIndex(s=>s.id===stepId);
  function answer(i:number,value:number) {
    const next=answers.map((a,j)=>j===i?value:a).map(a=>a===undefined?'':String(a)).join(',');
    update({[answersKey]:next,[decisionKey]:lesson.decisions[i].id,...answerChanges?.(i,value)});
  }
  function selectPattern(value:string) {update({[patternKey]:value,[inspectKey]:null});}

  return <LearningSources sources={adapter.sources} guides={adapter.guides}><div className="assembly-learning">
    <header className="assembly-step-heading">
      <h2>{index+1}/{steps.length} · {steps[index].title}</h2>
      <div className="assembly-step-controls"><label>Bộ dữ liệu khám phá <select value={sample.value} onChange={e=>sample.onChange(e.target.value)}>
          {sample.options.map(q=><option key={q.id} value={q.id}>{q.label}</option>)}
        </select></label>
        <div className="assembly-info" onKeyDown={e=>{if(e.key==='Escape')setInfoOpen(false);}}>
          <button aria-label="Thông tin dữ liệu mô phỏng" aria-expanded={infoOpen} aria-controls="assembly-sample-info" onClick={()=>setInfoOpen(!infoOpen)}><Info size={18}/></button>
          {infoOpen&&<div id="assembly-sample-info" className="assembly-info-popover" role="note"><button aria-label="Đóng thông tin" onClick={()=>setInfoOpen(false)}><X size={14}/></button>
            <strong>Dữ liệu mô phỏng</strong><p>{sample.info}</p></div>}
        </div>
      </div>
    </header>
    <p className="assembly-situation">{lesson.situation}</p>
    <div className="assembly-view-tabs" role="tablist" aria-label="Chế độ tư duy lắp ráp" onKeyDown={event=>{
      if(event.key!=='ArrowLeft'&&event.key!=='ArrowRight')return;
      event.preventDefault();const next=(learningViews.findIndex(v=>v.id===view)+(event.key==='ArrowRight'?1:2))%3;
      update({[viewKey]:learningViews[next].id});event.currentTarget.querySelectorAll<HTMLButtonElement>('[role=tab]')[next].focus();
    }}>{learningViews.map(v=><button key={v.id} id={`assembly-tab-${v.id}`} role="tab" aria-selected={view===v.id} aria-controls={`assembly-panel-${v.id}`} tabIndex={view===v.id?0:-1}
      onClick={()=>update({[viewKey]:v.id})}>{v.label}</button>)}</div>

    <div className="assembly-decision-toolbar">
      <nav aria-label="Tiến trình quyết định"><ol>{lesson.decisions.map((d,i)=>{
        const current=view==='reason'&&i===activeIndex, done=answers[i]!==undefined;
        const status=current?'Đang xem':done?'Đã khám phá':'Chưa khám phá';
        return <li key={d.id}><button type="button" aria-current={current?'step':undefined} data-state={current?'current':done?'explored':'unseen'} data-explored={done}
          title={`${d.question} · ${status}`} onClick={()=>update({[decisionKey]:d.id,[viewKey]:'reason'})}>
          <span className="assembly-decision-title">{i+1}. {d.shortTitle}</span><small>{done&&<Check size={12} aria-hidden="true"/>}{status}</small>
        </button>{i<lesson.decisions.length-1&&<ArrowRight className="assembly-decision-arrow" size={17} aria-hidden="true"/>}</li>;
      })}</ol></nav>
      <span className="sr-only">{explored}/{lesson.decisions.length} quyết định đã khám phá</span>
      {view==='reason'&&<button className="assembly-decision-action" onClick={()=>activeIndex<lesson.decisions.length-1?
        update({[decisionKey]:lesson.decisions[activeIndex+1].id}):update({[viewKey]:'cooperate'})}>
        {activeIndex<lesson.decisions.length-1?'Quyết định tiếp theo':'Xem phối hợp'}<ArrowRight size={15} aria-hidden="true"/></button>}
      {view==='cooperate'&&<button className="assembly-decision-action" onClick={()=>update({[viewKey]:'pattern'})}>Xem mẫu thiết kế<ArrowRight size={15} aria-hidden="true"/></button>}
      {index<steps.length-1&&<button className="assembly-business-next" title="Chuyển sang bước nghiệp vụ kế tiếp" onClick={()=>onStep(steps[index+1].id)}>
        Bước {index+2} · {steps[index+1].title}<ArrowRight size={16} aria-hidden="true"/></button>}
    </div>

    <div className="assembly-workspace-grid" data-view={view}>
      <div className="assembly-workspace-main">
      <section id="assembly-panel-reason" className="assembly-working-panel" role="tabpanel" aria-labelledby="assembly-tab-reason" hidden={view!=='reason'}>
        <fieldset key={`${stepId}:${decision.id}`} className="assembly-question" data-decision={decision.id}>
          <legend>{decision.question}</legend>
          <div className="assembly-mobile-data"><strong>Dữ liệu để suy luận</strong><InputData rows={inputData}/></div>
          <div className="assembly-choice-options">{decision.options.map((o,j)=><label key={o.label} className={answers[activeIndex]===j?'is-selected':''} data-fit={answers[activeIndex]===undefined?'neutral':o.fit}>
            <input type="radio" name={`${stepId}-${decision.id}`} checked={answers[activeIndex]===j} onChange={()=>answer(activeIndex,j)}/><span className="assembly-option-copy"><span>{o.label}</span>
              {answers[activeIndex]!==undefined&&<span className="assembly-option-fit">{o.fit==='current'?<Check size={15} aria-hidden="true"/>:<Info size={15} aria-hidden="true"/>}{o.fitLabel}</span>}
            </span></label>)}</div>
          <details className="assembly-hint"><summary><Lightbulb size={15}/>Mở gợi ý</summary><p>{decision.hint}</p></details>
          {answers[activeIndex]!==undefined&&<div className="assembly-consequence" data-fit={decision.options[answers[activeIndex]!].fit} role="status"><p>{decision.options[answers[activeIndex]!].consequence}</p>
            <p className="assembly-reveal"><strong>Tên trong source sau quyết định này:</strong> {canonical.nodes.filter(n=>decision.reveal.includes(n.id)).map(n=>n.name).join(' · ')}</p>
          </div>}
        </fieldset>
      </section>

      <section id="assembly-panel-cooperate" className="assembly-working-panel" role="tabpanel" aria-labelledby="assembly-tab-cooperate" hidden={view!=='cooperate'}>
      {visibleNodes.length===0?<div className="assembly-empty"><p>Trả lời quyết định đầu tiên để thêm thành phần vào bản đồ.</p><button onClick={()=>update({[viewKey]:'reason'})}>Tiếp tục suy luận</button></div>:<>
        <p className="assembly-mode-guide">Chọn một mũi tên để xem bên gửi, bên nhận và dữ liệu bàn giao.</p>
        {view==='cooperate'&&
        <LearningMap nodes={visibleNodes} edges={visibleEdges} active={handoff?.id??''} mapKey={`${stepId}:${visibleNodes.map(n=>n.id).join(',')}:${canonical.id}`}
          select={value=>update({[`assemblyHandoff.${stepId}`]:value,...selectPatternEdge(stepId,value,selection.node.id)})}/>}
      </>}
      {visibleEdges.length>0&&<p className="assembly-caption">Mỗi điểm dừng là một lần bàn giao. Quan hệ Event có giới hạn transport ngay tại điểm nối.</p>}
      </section>

      <section id="assembly-panel-pattern" className="assembly-working-panel" role="tabpanel" aria-labelledby="assembly-tab-pattern" hidden={view!=='pattern'}>
      {!complete&&!fromSession?<div className="assembly-empty"><p>Khám phá đủ {lesson.decisions.length} quyết định để chọn mẫu theo trách nhiệm đã xác định.</p><button onClick={()=>update({[viewKey]:'reason'})}>Tiếp tục suy luận</button></div>:<>
        {fromSession&&!complete&&<p className="assembly-caption">Mở trực tiếp bài thực hành từ phiên triển khai. Tiến độ các quyết định suy luận được giữ nguyên.</p>}
        <fieldset className="assembly-pattern-picker"><legend>Chọn mẫu phối hợp</legend>{lesson.patterns.map(p=><label key={p.id} className={pattern.id===p.id?'is-selected':''}>
          <input type="radio" name={`pattern-${stepId}`} checked={pattern.id===p.id} onChange={()=>selectPattern(p.id)}/><span><strong>{p.title}</strong><small>{p.badge}</small></span></label>)}</fieldset>
        <div className="assembly-pattern-map" aria-label="Bản đồ mẫu triển khai">
          <p className="assembly-caption">Node mở khung thành phần · mũi tên mở khung phối hợp.</p>
          <nav aria-label="Mở khung thành phần">{pattern.nodes.map(n=><button key={n.id} aria-pressed={selectedNode?.id===n.id}
            onClick={()=>update(selectPatternNode(stepId,n.id,selection.edge.id))}>{n.name}</button>)}</nav>
          <nav aria-label="Mở khung phối hợp">{pattern.edges.map(e=><button key={e.id} aria-pressed={selectedEdge?.id===e.id}
            onClick={()=>update(selectPatternEdge(stepId,e.id,selection.node.id))}>{pattern.nodes.find(n=>n.id===e.from)!.name} <ArrowRight size={15}/>{pattern.nodes.find(n=>n.id===e.to)!.name}<small>{e.label}</small></button>)}</nav>
        </div>
        <LearningPatternWorkspace adapter={adapter} key={`${stepId}:${pattern.id}`} stepId={stepId} pattern={pattern} params={params} update={update} active={view==='pattern'}/>
        {pattern.examples.length>0&&<details className="assembly-same-pattern"><summary>Ví dụ đã đọc để đối chiếu cùng nhóm mẫu</summary>
          <p>{pattern.grouping}</p><EvidenceViewer items={pattern.examples} memory={`learning:examples:${stepId}:${pattern.id}`}/></details>}
      </>}
      </section>
      </div>

      <aside className="assembly-context-panel" aria-label="Dữ liệu liên quan" data-view={view}>
        {view==='reason'?<><header><span className="eyebrow">DỮ LIỆU NGUỒN</span><h3>Để suy luận quyết định {activeIndex+1}</h3></header><InputData rows={inputData}/>
          <p className="assembly-caption">{activeIndex===0?`Đầu vào ${index===0?'của thao tác':`từ bước ${index}`}.`:'Dữ liệu sau quyết định trước.'}</p>
          {complete&&<details className="assembly-output-data"><summary>Xem đầu ra của bước {index+1}</summary><p>{lesson.output}</p></details>}
        </>:view==='cooperate'?<>{handoff?<HandoffCard key={`${stepId}:${handoff.id}`} handoff={handoff} pattern={canonical}/>:<><h3>{visibleNodes[0]?.name??'Dữ liệu đang có'}</h3><p>{visibleNodes[0]?.role??lesson.input}</p><p className="assembly-caption">Quyết định tiếp theo sẽ thêm nơi phối hợp và dữ liệu bàn giao.</p></>}</>:
          complete?<div className="assembly-pattern-description"><span className="assembly-pattern-badge">{pattern.badge}</span><h3>{selectedNode?.name??selectedEdge!.label}</h3>
            <p className="assembly-pattern-fit">{pattern.fit}</p>
            <dl><dt>{selectedNode?'Đầu vào':'Dữ liệu bàn giao'}</dt><dd className="assembly-sample-value">{selectedNode?.input??selectedEdge!.data}</dd></dl>
            <details key={`${stepId}:${pattern.id}:${inspect}`} className="assembly-output-data"><summary>Xem kết quả / đầu ra</summary><p>{selectedNode?.output??selectedEdge!.result}</p></details>
            <p><strong>Chỗ cần đổi / đối chiếu:</strong> {selectedNode?.change??pattern.difference}</p>
            <details className="assembly-pattern-contract"><summary>Đầu vào / đầu ra của toàn mẫu</summary><dl><dt>Đầu vào</dt><dd>{pattern.input}</dd><dt>Đầu ra</dt><dd>{pattern.output}</dd></dl></details>
            <details className="assembly-pattern-grouping"><summary>Căn cứ gom nhóm mẫu</summary><p>{pattern.grouping}</p><p className="assembly-pattern-difference">{pattern.difference}</p></details>
            {limits.length>0&&<p className="assembly-limit">{limits.join(' ')}</p>}
          </div>:<><h3>Đầu vào của bước</h3><p>{lesson.input}</p><p className="assembly-caption">Hoàn thành các quyết định để đối chiếu mẫu phù hợp.</p></>}
      </aside>
    </div>
  </div></LearningSources>;
}
