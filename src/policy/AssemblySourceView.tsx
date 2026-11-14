import {lazy,Suspense,useEffect,useId,useRef,useState} from 'react';
import {BookOpen,Info} from 'lucide-react';
import type {LearningEvidence as Evidence,LearningComponent as LearningNode,LearningHandoff as Handoff,LearningPattern as Pattern,LearningPresentation as SourcePresentation,SourceCatalog} from './learning-contracts';
import {creationSources,useLearningSources} from './LearningSources';

const CodeBlock = lazy(() => import('../workshop/CodeBlock').then(m => ({default:m.CodeBlock})));
export {TemplateCode} from './TemplateCode';

// Keep a whole method, including nested branches, rather than an arbitrary number of lines.
export function evidenceRows(evidence: Evidence, sources:SourceCatalog=creationSources.sources) {
  const source = sources[evidence.ref];
  if (evidence.from || evidence.to) return source.rows.slice((evidence.from ?? source.from)-1, evidence.to ?? source.rows.length);
  const start = source.line-1;
  if (/\b(class|interface)\b/.test(source.rows[start].text)) return source.rows.slice(source.from-1);
  let depth=0, entered=false, end=start;
  for (;end<source.rows.length;end++) {
    const text=source.rows[end].text.replace(/"(?:\\.|[^"\\])*"/g, '""').replace(/\/\/.*$/, '');
    for (const char of text) {
      if (char==='{') {depth++; entered=true;}
      if (char==='}') depth--;
    }
    if ((entered && depth===0) || (!entered && text.trimEnd().endsWith(';'))) break;
  }
  return source.rows.slice(source.from-1,end+1);
}

export function EvidenceViewer({items, memory}: {items: Evidence[]; memory: string}) {
  return <div className="assembly-learning-evidence">
    {items.map((item,i) => <EvidenceItem key={`${memory}:${item.ref}:${i}`} item={item} memory={`${memory}:${item.ref}:${i}`}/>)}
  </div>;
}

export function InlineExplanation({label,text}:{label:string;text:string}) {
  const [open,setOpen]=useState(false), id=useId(), trigger=useRef<HTMLButtonElement>(null);
  function close(event:React.KeyboardEvent) {
    if(event.key==='Escape') {setOpen(false);trigger.current?.focus();event.stopPropagation();}
  }
  return <><button ref={trigger} type="button" className="assembly-inline-info" aria-label={label} aria-expanded={open} aria-controls={id}
    onClick={()=>setOpen(!open)} onKeyDown={close}><Info size={17} aria-hidden="true"/></button>
    {open&&<p id={id} className="assembly-inline-explanation" role="note" onKeyDown={close}>{text}</p>}</>;
}

export type SourceRequest={ref:Evidence['ref'];stamp:number;full?:boolean};
export function FocusedEvidenceViewer({items,memory,presentations,request,onDiagram}:{items:Evidence[];memory:string;presentations:Partial<Record<Evidence['ref'],SourcePresentation>>;request?:SourceRequest;onDiagram?:(ref:Evidence['ref'])=>void}) {
  return <div className="assembly-learning-evidence">{items.map((item,i)=><EvidenceItem key={`${memory}:${item.ref}:${i}`} item={item} memory={`${memory}:${item.ref}:${i}`} presentation={presentations[item.ref]} request={request} onDiagram={onDiagram}/>)}</div>;
}

function EvidenceItem({item,memory,presentation,request,onDiagram}:{item:Evidence;memory:string;presentation?:SourcePresentation;request?:SourceRequest;onDiagram?:(ref:Evidence['ref'])=>void}) {
  const {sources,guides}=useLearningSources();
  const [open,setOpen]=useState(false), [full,setFull]=useState(false);
  const root=useRef<HTMLDivElement>(null),id=useId(), source=sources[item.ref], guide=guides[item.ref]??{role:source.symbol,explanation:source.symbol}, file=source.path.split('/').at(-1)!;
  const annotations=presentation?.focus.annotations;
  const anchor=annotations?.[0]?.start??item.from??source.line;
  const rows=annotations?source.rows.slice(Math.max(0,Math.min(...annotations.map(a=>a.start))-5),Math.min(source.rows.length,Math.max(...annotations.map(a=>a.end))+4)):evidenceRows(item,sources);
  const contextKey=`${memory}:${presentation?.label??'reference'}:${annotations?.map(a=>`${a.start}-${a.end}:${a.expression??''}`).join(',')??''}`;
  useEffect(()=>{
    if(request?.ref!==item.ref)return;
    setOpen(true);if(request.full!==undefined)setFull(request.full);
    const frame=requestAnimationFrame(()=>{root.current?.scrollIntoView({block:'start',behavior:'instant'});root.current?.focus({preventScroll:true});});
    return ()=>cancelAnimationFrame(frame);
  },[request?.stamp,request?.ref,request?.full,item.ref]);
  return <div ref={root} tabIndex={-1} className="assembly-source-entry" data-source-ref={item.ref} data-source-tone={presentation?.tone}>
      <div className="assembly-source-heading">
        <button type="button" className="assembly-source-toggle" aria-expanded={open} aria-controls={id} onClick={()=>setOpen(!open)}>
          <BookOpen size={15} aria-hidden="true"/><span><small>{presentation?`${presentation.label} · `:''}Source thật · {guide.role}</small>{file} · L{rows[0].line}–{rows.at(-1)!.line}</span>
        </button>
        <InlineExplanation label={`Giải thích source ${file} · ${guide.role}`} text={guide.explanation}/>
        {onDiagram&&<button className="assembly-source-diagram" onClick={()=>onDiagram(item.ref)}>Xem sơ đồ liên quan</button>}
      </div>
      <div id={id} className="assembly-source-content" hidden={!open}>
        <p className="assembly-source-meta"><code>{source.path}</code><br/>{source.symbol}<br/>
          HEAD {source.commit.slice(0,12)} · SHA256 {source.sha256.slice(0,12)} · {source.modified?'Bản làm việc có thay đổi':'Khớp commit'}</p>
        <p className="assembly-caption">Đoạn source giữ số dòng gốc. Có thể mở toàn file bên dưới.</p>
        {presentation&&<p className="assembly-focus-caption">{presentation.caption}</p>}
        <div className="assembly-code">{open&&<Suspense fallback={<p>Đang mở source…</p>}><CodeBlock rows={rows} path={source.path}
          annotations={annotations} scrollAnchor={anchor} preferTarget memoryKey={contextKey} revealRequest={request?.ref===item.ref?String(request.stamp):undefined}/></Suspense>}</div>
        <details open={full} onToggle={e=>setFull(e.currentTarget.open)}><summary>Mở toàn bộ file</summary><div className="assembly-code" data-full-source={item.ref}>{open&&full&&<Suspense fallback={<p>Đang mở file…</p>}>
          <CodeBlock rows={source.rows} path={source.path} annotations={annotations} scrollAnchor={anchor} preferTarget revealAncestors={Boolean(presentation)} memoryKey={`${contextKey}:full`} revealRequest={request?.ref===item.ref?String(request.stamp):undefined}/>
        </Suspense>}</div></details>
      </div>
    </div>;
}

export function frameExplanation(node:LearningNode|undefined,edge:Handoff|undefined,pattern:Pattern) {
  if(node?.id==='controller')return 'Đây là khung method để làm theo. Khi áp dụng, đổi route, đầu vào và Func theo yêu cầu mới.';
  if(node?.id==='func')return 'Đây là khung tổ chức tính năng để làm theo. Đối chiếu thứ tự đọc, kiểm tra và giao xử lý; đổi dữ liệu nguồn, điều kiện và nội dung nghiệp vụ cho yêu cầu mới.';
  if(node)return `Đây là khung ${node.name} để đối chiếu cách làm. ${node.role} Khi áp dụng: ${node.change}`;
  return `Đây là khung phối hợp ${pattern.nodes.find(n=>n.id===edge!.from)!.name} → ${pattern.nodes.find(n=>n.id===edge!.to)!.name}. Đối chiếu lời gọi, kiểu đầu vào và dữ liệu bàn giao ở cả hai đầu; source thật bên dưới cho thấy các nhóm lệnh đầy đủ.`;
}

