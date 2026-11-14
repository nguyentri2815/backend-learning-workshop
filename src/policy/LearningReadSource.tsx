import {lazy,Suspense} from 'react';
import {SourceTree} from '../JourneyWorkspace';
import {SourceEditorColumns} from './SourceEditorColumns';
import {PracticeTreePositions} from './PracticeTreePositions';
import {useCodeWrap,usePolicyCodeTheme} from '../workshop/code-preferences';
import type {CodeAnnotation} from '../workshop/CodeBlock';
import type {CodeRow} from '../workshop/source';
import type {SourceCatalog,LearningChanges} from './learning-contracts';
const CodeBlock=lazy(()=>import('../workshop/CodeBlock').then(m=>({default:m.CodeBlock})));
export type ReadFocus={ref:string;from:number;to:number};
type Marks={executed:number[];upcoming:number[];viewing:number[];current?:number[]};
export function LearningReadCode({sources,focus,full=false,memory,rows,marks,annotations}:{sources:SourceCatalog;focus:ReadFocus;full?:boolean;memory:string;rows?:CodeRow[];marks?:Marks;annotations?:CodeAnnotation[]}){
 const s=sources[focus.ref],all=rows??s.rows,[theme]=usePolicyCodeTheme();
 return <div className="list-code" data-source-ref={focus.ref} data-full={full}><Suspense fallback={<p>Đang tô source…</p>}><CodeBlock path={s.path} rows={full?all:all.filter(r=>r.line!=null&&r.line>=focus.from-3&&r.line<=focus.to+3)} theme={theme} range={{start:focus.from,end:focus.to,name:s.symbol,qualified:s.symbol}} annotations={annotations??[{start:focus.from,end:focus.to,label:'Đang đối chiếu',tone:'component'}]} lineMarks={marks} scrollAnchor={focus.from} revealAncestors={full} memoryKey={`${memory}:${focus.ref}:${focus.from}:${full}`}/></Suspense></div>;
}
export function LearningReadSource({sources,focus,params,update,prefix,method,files,previous,marks}:{sources:SourceCatalog;focus:ReadFocus;params:URLSearchParams;update:(c:LearningChanges)=>void;prefix:string;method:string;files:string[];previous?:ReadFocus&{method:string;onOpen:()=>void};marks?:Marks}){
 const ref=params.get(`${prefix}Ref`),sourceRef=ref&&sources[ref]?ref:focus.ref,s=sources[sourceRef];
 const start=Number(params.get(`${prefix}Line`)),end=Number(params.get(`${prefix}To`));
 const location:ReadFocus=start>0&&start<=s.rows.length?{ref:sourceRef,from:start,to:end>=start&&end<=s.rows.length?end:start}:sourceRef===focus.ref?focus:{ref:sourceRef,from:s.from,to:s.to??s.from};
 const full=params.get(`${prefix}Full`)==='1',tree=params.get(`${prefix}Tree`)!=='0';
 const [wrap,setWrap]=useCodeWrap(),[,setTheme,preference]=usePolicyCodeTheme();
 const catalog=Object.entries(sources).filter(([id])=>files.includes(id)||id===sourceRef).map(([id,s])=>({id,path:s.path}));
 const current=()=>update({[`${prefix}Ref`]:null,[`${prefix}Line`]:null,[`${prefix}To`]:null});
 return <div className="policy-explorer list-practice-source" aria-label="Workspace đọc source">
  <div className="policy-explorer-bar"><span>WORKSPACE · SOURCE THẬT</span><div className="practice-code-controls"><div className="practice-source-scope"><button className="practice-reader-tree-toggle" aria-label={tree?'Thu cây thư mục':'Mở cây thư mục'} aria-expanded={tree} onClick={()=>update({[`${prefix}Tree`]:tree?'0':'1'})}>Cây file</button><div className="practice-reading-modes" role="group" aria-label="Phạm vi đọc code"><button aria-pressed={!full} onClick={()=>update({[`${prefix}Full`]:null})}>Đoạn liên quan</button><button aria-pressed={full} onClick={()=>update({[`${prefix}Full`]:'1'})}>Mở rộng ngữ cảnh</button></div></div><div className="practice-appearance-controls"><label><input type="checkbox" checked={wrap} onChange={e=>setWrap(e.target.checked)}/> Xuống dòng code</label><label className="workspace-theme-choice"><span>Code</span><select aria-label="Giao diện workspace code" value={preference} onChange={e=>setTheme(e.target.value as 'system'|'light'|'dark')}><option value="system">Theo giao diện</option><option value="light">Sáng</option><option value="dark">Tối</option></select></label></div></div></div>
  <div className="practice-code-legend"><span>✓ Đã chạy</span><span>◆ Đang dừng</span><span>▶ Sắp chạy</span><span>● Đang xem</span><small>Snapshot file Java đầy đủ</small></div>
  <SourceEditorColumns contextKey={`${prefix}:practice`} reading tree={<><p>EXPLORER <small>{catalog.length} file đã mở</small></p><PracticeTreePositions current={{path:s.path,method:sourceRef===focus.ref?method:s.symbol,line:location.from,onOpen:current}} previous={previous?{path:sources[previous.ref].path,method:previous.method,line:previous.from,onOpen:previous.onOpen}:undefined}/><SourceTree compactFolders files={catalog} selected={sourceRef} onSelect={id=>update({[`${prefix}Ref`]:id,[`${prefix}Line`]:null,[`${prefix}To`]:null})} label="Cây module Policy đã khám phá" memoryKey={`${prefix}:practice`}/></>} code={<><div className="policy-source-location"><strong>{sourceRef===focus.ref?method:s.symbol}:L{location.from}</strong><code>{s.path}</code><span>Snapshot L1–{s.rows.length} · {s.commit.slice(0,12)}</span></div><div className="policy-code-frame" data-testid="policy-source" data-source-id={sourceRef}><LearningReadCode sources={sources} focus={location} full={full} marks={sourceRef===focus.ref?marks:undefined} memory={`${prefix}:practice`}/></div></>}/>
  <div className="policy-call-links"><span>Lần tiếp từ đoạn code</span><button onClick={()=>update({[`${prefix}Full`]:full?null:'1'})}>{full?'Đoạn liên quan':'Mở toàn bộ file'}</button>{(sourceRef!==focus.ref||start>0)&&<button onClick={current}>Về câu đang học</button>}</div>
 </div>;
}
