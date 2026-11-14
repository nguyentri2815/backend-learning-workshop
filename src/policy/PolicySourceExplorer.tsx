import { lazy, Suspense, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import {SourceEditorColumns} from './SourceEditorColumns';
import {PracticeTreePositions} from './PracticeTreePositions';
import { SourceTree } from '../JourneyWorkspace';
import { useCodeWrap, usePolicyCodeTheme } from '../workshop/code-preferences';
import { excerptById, policySource } from '../content/policy/lesson';
import type { LessonNode } from '../content/policy/flows';
import { snapshotContext } from './source-reading';
import type { ReadingMode, SourceLocation } from './source-reading';

const CodeBlock=lazy(()=>import('../workshop/CodeBlock').then(m=>({default:m.CodeBlock})));
export function PolicySourceExplorer({sourceId,fallbackId,contextKey,nodes,activeNode,onNode,onSource,showGuide=false,showSteps=true,focus,reading}: {
 sourceId:string; fallbackId?:string; contextKey:string; nodes:LessonNode[]; activeNode:string; onNode:(id:string)=>void; onSource:(ref:string)=>void; showGuide?:boolean; showSteps?:boolean; focus?:{from:number;to?:number};
 reading?:{mode:ReadingMode;onMode:(mode:ReadingMode,line:number)=>void;anchor?:number;caller?:SourceLocation;callerMethod?:string;currentMethod?:string;onCurrent:()=>void;onCaller:()=>void;onLine:(line:number)=>void;marks:{executed:number[];upcoming:number[];viewing:number[];current?:number[]};revealRequest?:string;treeOpen?:boolean;onTree?:()=>void};
}) {
 const [params]=useSearchParams();
 const [wrap,setWrap]=useCodeWrap();
 const [codeTheme,setCodeTheme,codePreference]=usePolicyCodeTheme();
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
 function changeReadingMode(mode:ReadingMode) {
  const viewport=explorer.current?.querySelector<HTMLElement>('[data-testid=code-scroll]');
  const bounds=viewport?.getBoundingClientRect();
  const visible=viewport&&bounds?[...viewport.querySelectorAll<HTMLElement>('[data-line]')].filter(row=>{const r=row.getBoundingClientRect();return r.bottom>bounds.top+8&&r.top<bounds.bottom;}):[];
  const available=mode==='context'?context!.rows:source.rows;
  const hasLine=(line:number)=>available.some(row=>row.line===line);
  const selected=visible.find(row=>row.dataset.viewing==='true'&&hasLine(Number(row.dataset.line)))??visible.find(row=>hasLine(Number(row.dataset.line)));
  const line=selected?Number(selected.dataset.line):hasLine(focus?.from??0)?focus!.from:source.from;
  reading?.onMode(mode,line);
 }
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
   <div className="policy-explorer-bar"><span>WORKSPACE · SOURCE THẬT</span>
    <div className="practice-code-controls">
     {reading&&<div className="practice-source-scope">
      <button type="button" className="practice-reader-tree-toggle" aria-label={reading.treeOpen?'Thu cây thư mục':'Mở cây thư mục'} aria-expanded={reading.treeOpen} onClick={reading.onTree}>Cây file</button>
      <div className="practice-reading-modes" role="group" aria-label="Phạm vi đọc code">{(['related','context'] as const).map((mode,i)=><button type="button" key={mode} aria-pressed={reading.mode===mode} onClick={()=>changeReadingMode(mode)}>{['Đoạn liên quan','Mở rộng ngữ cảnh'][i]}</button>)}</div>
     </div>}
     <div className="practice-appearance-controls"><label><input type="checkbox" checked={wrap} onChange={e=>setWrap(e.target.checked)}/> Xuống dòng code</label>
      {reading&&<label className="workspace-theme-choice"><span>Code</span><select aria-label="Giao diện workspace code" value={codePreference} onChange={event=>setCodeTheme(event.target.value as 'system'|'light'|'dark')}><option value="system">Theo giao diện</option><option value="light">Sáng</option><option value="dark">Tối</option></select></label>}
     </div>
    </div>
   </div>
   {reading&&<div className="practice-code-legend"><span>✓ Đã chạy</span><span>◆ Đang dừng</span><span>▶ Sắp chạy</span><span>● Đang xem</span><small>Snapshot trích đoạn · chưa có bản đầy đủ</small></div>}
   <SourceEditorColumns contextKey={contextKey} reading={Boolean(reading)} tree={<><p>EXPLORER <small>{files.length} file đã mở</small></p>{reading&&<PracticeTreePositions current={{path:source.path,method:reading.currentMethod,line:focus?.from??source.from,onOpen:reading.onCurrent}} previous={reading.caller?{path:excerptById[reading.caller.ref].path,method:reading.callerMethod,line:reading.caller.line,onOpen:reading.onCaller}:undefined}/>} <SourceTree compactFolders files={files} selected={source.id} onSelect={id=>open(id)} label="Cây module Policy đã khám phá" memoryKey={`policy:${contextKey}`}/></>} code={<>     <div className="policy-source-location"><strong>{reading?.currentMethod?`${reading.currentMethod}:L${focus?.from??source.from}`:source.symbol}</strong><code>{source.path}</code><span>{reading?.mode==='context'?`Ngữ cảnh từ các đoạn đã có · ${context!.method?`đầu hàm L${context!.method} · `:''}có đánh dấu phần khuyết`:`Snapshot L${source.from}–${source.to}`} · {policySource.repositories[source.repository as keyof typeof policySource.repositories].commit.slice(0,12)}</span></div>
     <div className="policy-code-frame" data-testid="policy-source" data-source-id={source.id} data-reading-mode={reading?.mode??'related'}><Suspense fallback={<p>Đang tô sáng Java…</p>}><CodeBlock key={`${contextKey}:${source.id}:${reading?.mode??''}`} theme={reading?codeTheme:undefined} rows={rows} path={source.path} memoryKey={`policy:${contextKey}:${source.id}${focus?`:L${focus.from}`:''}${reading?`:${reading.mode}`:''}`} jump={reading?.anchor??focus?.from??0} autoFollow={!reading} revealRequest={reading?.revealRequest} scrollAnchor={reading?.anchor} lineMarks={reading?.marks} onLineSelect={reading?.onLine} range={{name:source.symbol,qualified:source.id,start:focus?.from??(source.id==='c-find'?32:source.from),end:focus?.to??focus?.from??(source.id==='c-find'?32:source.to)}} symbolLinks={node.links?.map(link=>({text:symbolTargets[link.ref]??excerptById[link.ref].symbol.split('.')[0],label:`Mở lời gọi ${link.label}`,onClick:()=>open(link.ref,link.step)}))}/></Suspense></div>
</>}/>
   <div className="policy-call-links"><span>Lần tiếp từ đoạn code</span>{node.links?.map(link=><button key={link.ref} type="button" onClick={()=>open(link.ref,link.step)}>{link.label} ↗</button>)}{source.id!==node.ref&&<button type="button" onClick={()=>onSource(node.ref)}>Về câu đang học</button>}</div>
   {showSteps&&<div className="policy-reading-points" aria-label="Các điểm đọc của flow">{nodes.map((n,i)=><button key={n.id} type="button" aria-pressed={n.id===activeNode} onClick={()=>onNode(n.id)}>{i+1}. {n.title}</button>)}</div>}
   {showGuide&&<div className="policy-observation"><strong>Tôi cần làm gì?</strong><p>{node.action}</p><strong>Vì sao cần file này?</strong><p>{node.why}</p><strong>Nó nhận gì, gọi ai hoặc trả gì?</strong><p>{node.contract}</p><strong>Kiểm tra trước khi đi tiếp</strong><p>{node.check}</p></div>}
 </div>;
}
