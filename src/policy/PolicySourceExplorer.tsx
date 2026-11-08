import { lazy, Suspense, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Group, Panel, Separator } from 'react-resizable-panels';
import type { Layout } from 'react-resizable-panels';
import { SourceTree } from '../JourneyWorkspace';
import { useCodeWrap } from '../workshop/code-preferences';
import { excerptById, policySource } from '../content/policy/lesson';
import type { LessonNode } from '../content/policy/flows';
import { snapshotContext } from './source-reading';
import type { ReadingMode, SourceLocation } from './source-reading';

const CodeBlock=lazy(()=>import('../workshop/CodeBlock').then(m=>({default:m.CodeBlock})));
const editorLayouts=new Map<string,Layout>();
export function PolicySourceExplorer({sourceId,fallbackId,contextKey,nodes,activeNode,onNode,onSource,showGuide=false,showSteps=true,focus,reading}: {
 sourceId:string; fallbackId?:string; contextKey:string; nodes:LessonNode[]; activeNode:string; onNode:(id:string)=>void; onSource:(ref:string)=>void; showGuide?:boolean; showSteps?:boolean; focus?:{from:number;to?:number};
 reading?:{mode:ReadingMode;onMode:(mode:ReadingMode)=>void;caller?:SourceLocation;onCaller:()=>void;onLine:(line:number)=>void;marks:{executed:number[];upcoming:number[];viewing:number[]};revealRequest?:string;treeOpen?:boolean;onTree?:()=>void};
}) {
 const [params]=useSearchParams();
 const [wrap,setWrap]=useCodeWrap();
 const explorer=useRef<HTMLDivElement>(null);
 const source=excerptById[sourceId] ?? excerptById[fallbackId ?? nodes[0].ref];
 const node=nodes.find(n=>n.id===activeNode) ?? nodes[0];
 const visited=[...new Set([...(params.get('opened')??'').split(','),reading?.caller?.ref??'',source.id])].filter(id=>excerptById[id]);
 const files=visited.map(id=>excerptById[id]).filter((f,i,all)=>all.findIndex(x=>x.path===f.path)===i || f.path===source.path && f.id===source.id)
   .filter(f=>f.path!==source.path || f.id===source.id);
 function open(ref:string,step?:string) {
  if(step) onNode(step); else onSource(ref);
 }
 const symbolTargets:Record<string,string>={'create-check':'CreatePolicyFunc','quote-read':'quoteRepository','quote-table':'QuoteAggregate','create-data':'MappingUtils','create-customer':'fillMissingValue','create-status':'getPolicyStatus','create-apply':'policyAggregateRepository','create-quote':'createContractCode','create-after':'publishedQuote','flow-create':'PolicyWorkflow','flow-view':'PolicySyncViewFunc','internal-api':'spCommandApi','c-find':'FindPolicyByIdFunc','q-source':'SearchPolicyFunc'};
 const context=reading?snapshotContext(source.id,focus?.from??source.from):undefined;
 const rows=reading?.mode==='context'?context!.rows:source.rows;
 const idePath=`D:\\ALPACA\\agent-system\\${source.path.replaceAll('/','\\')}`;
 useEffect(()=>{
   if(!reading)return;
   const frame=requestAnimationFrame(()=>requestAnimationFrame(()=>{
     const panel=explorer.current?.querySelector<HTMLElement>('.policy-file-panel');
     const selected=panel?.querySelector<HTMLElement>('.tree-file.selected');
     if(panel&&selected)panel.scrollTop+=selected.getBoundingClientRect().top-panel.getBoundingClientRect().top-panel.clientHeight/2;
   }));
   return ()=>cancelAnimationFrame(frame);
 },[source.id,reading?.treeOpen]);
 return <div ref={explorer} className="policy-explorer" aria-label="Workspace đọc source">
   {reading&&<><div className="practice-reading-modes" role="group" aria-label="Phạm vi đọc code">{(['related','context','file'] as const).map((mode,i)=><button type="button" key={mode} aria-pressed={reading.mode===mode} onClick={()=>reading.onMode(mode)}>{['Đoạn liên quan','Mở rộng ngữ cảnh','Toàn bộ file'][i]}</button>)}</div><div className="practice-code-legend"><span>✓ Đã chạy</span><span>▶ Sắp chạy</span><span>● Đang xem</span><small>Dấu thực thi là checkpoint mô phỏng.</small></div></>}
   <div className="policy-explorer-bar"><span>WORKSPACE · SOURCE THẬT</span>{reading&&<button type="button" className="practice-reader-tree-toggle" onClick={reading.onTree}>{reading.treeOpen?'Thu cây thư mục':'Mở cây thư mục'}</button>}<label><input type="checkbox" checked={wrap} onChange={e=>setWrap(e.target.checked)}/> Xuống dòng code</label></div>
   <Group orientation="horizontal" defaultLayout={editorLayouts.get(contextKey)} onLayoutChanged={layout=>editorLayouts.set(contextKey,layout)} className="policy-editor-group" id={`policy-editor-${contextKey}`}>
    <Panel id="tree" defaultSize="26%" minSize="15%" className="policy-file-panel"><p>EXPLORER <small>{files.length} file đã mở</small></p>{reading&&<div className="practice-tree-handoff"><strong>Vừa mở: {source.path.split('/').at(-1)}</strong>{reading.caller&&<button type="button" onClick={reading.onCaller}>Từ {excerptById[reading.caller.ref].path.split('/').at(-1)} · L{reading.caller.line}</button>}</div>}<SourceTree compactFolders files={files} selected={source.id} onSelect={id=>open(id)} label="Cây module Policy đã khám phá" memoryKey={`policy:${contextKey}`}/></Panel>
    <Separator className="policy-resize" aria-label="Đổi độ rộng cây thư mục"/>
    <Panel id="code" minSize="35%" className="policy-editor-panel">
     <div className="policy-source-location"><strong>{source.symbol}</strong><code>{source.path}</code><span>{reading?.mode==='context'?`Ngữ cảnh từ các đoạn đã có · ${context!.method?`đầu hàm L${context!.method} · `:''}có đánh dấu phần khuyết`:`Snapshot L${source.from}–${source.to}`} · {policySource.repositories[source.repository as keyof typeof policySource.repositories].commit.slice(0,12)}</span></div>
     {reading?.mode==='file'?<div className="practice-file-unavailable" data-testid="practice-file-unavailable"><h3>Workshop chưa có bản đầy đủ của file</h3><p>Chỉ có snapshot trích đoạn: {context!.ranges.join(', ')}. Không ghép các đoạn này thành “toàn bộ file”.</p><p>Mở file thật trong IDE tại:</p><code>{idePath}</code><button type="button" className="button secondary" onClick={async event=>{const button=event.currentTarget;try{await navigator.clipboard.writeText(idePath);button.textContent='Đã sao chép đường dẫn';}catch{button.textContent='Chọn và sao chép đường dẫn ở trên';}}}>Sao chép đường dẫn IDE</button><button type="button" className="text-button" onClick={()=>reading.onMode('related')}>Về đoạn liên quan</button></div>:<div className="policy-code-frame" data-testid="policy-source" data-source-id={source.id} data-reading-mode={reading?.mode??'related'}><Suspense fallback={<p>Đang tô sáng Java…</p>}><CodeBlock key={`${contextKey}:${source.id}:${reading?.mode??''}`} rows={rows} path={source.path} memoryKey={`policy:${contextKey}:${source.id}${focus?`:L${focus.from}`:''}${reading?`:${reading.mode}`:''}`} jump={focus?.from??0} autoFollow={!reading} revealRequest={reading?.revealRequest} lineMarks={reading?.marks} onLineSelect={reading?.onLine} range={{name:source.symbol,qualified:source.id,start:focus?.from??(source.id==='c-find'?32:source.from),end:focus?.to??focus?.from??(source.id==='c-find'?32:source.to)}} symbolLinks={node.links?.map(link=>({text:symbolTargets[link.ref]??excerptById[link.ref].symbol.split('.')[0],label:`Mở lời gọi ${link.label}`,onClick:()=>open(link.ref,link.step)}))}/></Suspense></div>}
    </Panel>
   </Group>
   <div className="policy-call-links"><span>Lần tiếp từ đoạn code</span>{node.links?.map(link=><button key={link.ref} type="button" onClick={()=>open(link.ref,link.step)}>{link.label} ↗</button>)}{source.id!==node.ref&&<button type="button" onClick={()=>onSource(node.ref)}>Về câu đang học</button>}</div>
   {showSteps&&<div className="policy-reading-points" aria-label="Các điểm đọc của flow">{nodes.map((n,i)=><button key={n.id} type="button" aria-pressed={n.id===activeNode} onClick={()=>onNode(n.id)}>{i+1}. {n.title}</button>)}</div>}
   {showGuide&&<div className="policy-observation"><strong>Tôi cần làm gì?</strong><p>{node.action}</p><strong>Vì sao cần file này?</strong><p>{node.why}</p><strong>Nó nhận gì, gọi ai hoặc trả gì?</strong><p>{node.contract}</p><strong>Kiểm tra trước khi đi tiếp</strong><p>{node.check}</p></div>}
 </div>;
}
