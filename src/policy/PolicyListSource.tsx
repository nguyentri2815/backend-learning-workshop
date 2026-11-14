import {lazy,Suspense,useEffect,useRef} from 'react';
import {SourceTree} from '../JourneyWorkspace';
import {listSource} from '../content/policy/list';
import type {ListFocus,ListSourceId} from '../content/policy/list';
import type {CodeAnnotation} from '../workshop/CodeBlock';
import type {CodeRow} from '../workshop/source';
import {useCodeWrap,usePolicyCodeTheme} from '../workshop/code-preferences';
import {excerptById} from '../content/policy/lesson';
import {SourceEditorColumns} from './SourceEditorColumns';
import {PracticeTreePositions} from './PracticeTreePositions';

const CodeBlock=lazy(()=>import('../workshop/CodeBlock').then(m=>({default:m.CodeBlock})));
export type ListChanges=Record<string,string|null>;
export const listFiles=Object.values(listSource.sources).map(({id,path})=>({id,path}));
export function ListCode({focus,full=false,memory,tone='component',rows,annotations,marks}:{focus:ListFocus;full?:boolean;memory:string;tone?:CodeAnnotation['tone'];rows?:CodeRow[];annotations?:CodeAnnotation[];marks?:{executed:number[];upcoming:number[];viewing:number[];current?:number[]}}) {
 const source=listSource.sources[focus.ref],all=rows??source.rows;
 const selected=full?all:all.filter(r=>r.line!=null&&r.line>=focus.from-3&&r.line<=focus.to+3);
 const [theme]=usePolicyCodeTheme();
 return <div className="list-code" data-testid="list-code" data-source-ref={focus.ref} data-full={full}>
  <Suspense fallback={<p>Đang tô source…</p>}><CodeBlock key={`${memory}:${full}`} path={source.path} rows={selected} theme={theme}
   annotations={annotations??[{start:focus.from,end:focus.to,label:'Đang đối chiếu',tone}]} lineMarks={marks} scrollAnchor={focus.from} revealAncestors={full} memoryKey={`${memory}:${focus.ref}:${focus.from}:${full}`}/></Suspense>
 </div>;
}
type PracticeSource={files:string[];method:string;previousMethod?:string;previous?:ListFocus;onPrevious?:()=>void;marks:{executed:number[];upcoming:number[];viewing:number[];current?:number[]}};
export function PolicyListSource({focus,params,update,prefix='list',tone='component',tree=true,practice}:{focus:ListFocus;params:URLSearchParams;update:(changes:ListChanges)=>void;prefix?:string;tone?:CodeAnnotation['tone'];tree?:boolean;practice?:PracticeSource}) {
 const legacy=prefix==='list'?params.get('ref'):null;
 const legacyMap:Record<string,ListSourceId>={'q-api':'api','request':'request','q-scope':'search','q-filter':'search','q-source':'search','q-page':'repository','q-table':'entity','list-dto':'response','base-page':'basePage','wrap':'wrap'};
 const requested=params.get(`${prefix}Ref`)??(legacy?legacyMap[legacy]:null),ref=requested&&requested in listSource.sources?requested as ListSourceId:focus.ref;
 const source=listSource.sources[ref];
 const requestedLine=Number(params.get(`${prefix}Line`)??(legacy?excerptById[legacy]?.from:0)),requestedEnd=Number(params.get(`${prefix}To`));
 const target=ref===focus.ref?focus:{ref,from:source.from,to:source.to};
 const location=requestedLine>0&&requestedLine<=source.rows.length?{ref,from:requestedLine,to:requestedEnd>=requestedLine&&requestedEnd<=source.rows.length?requestedEnd:legacy?excerptById[legacy]?.to??requestedLine:requestedLine}:target;
 const full=params.get(`${prefix}Full`)==='1';
 const [wrap,setWrap]=useCodeWrap(),[,setTheme,preference]=usePolicyCodeTheme();
 const treeRoot=useRef<HTMLElement>(null);
 useEffect(()=>{
  const frame=requestAnimationFrame(()=>requestAnimationFrame(()=>{
   const panel=treeRoot.current,selected=panel?.querySelector<HTMLElement>('.tree-file.selected');
   if(panel&&selected)panel.scrollTop+=selected.getBoundingClientRect().top-panel.getBoundingClientRect().top-panel.clientHeight/2;
  }));
  return ()=>cancelAnimationFrame(frame);
 },[ref]);
 if(practice){
  const files=listFiles.filter(file=>practice.files.includes(file.id)||file.id===ref),previous=practice.previous;
  function current(){update({listRef:null,listLine:null,listTo:null});}
  return <div className="policy-explorer list-practice-source" aria-label="Workspace đọc source">
   <div className="policy-explorer-bar"><span>WORKSPACE · SOURCE THẬT</span><div className="practice-code-controls"><div className="practice-source-scope"><button type="button" className="practice-reader-tree-toggle" aria-label={tree?'Thu cây thư mục':'Mở cây thư mục'} aria-expanded={tree} onClick={()=>update({listTree:tree?'0':'1'})}>Cây file</button><div className="practice-reading-modes" role="group" aria-label="Phạm vi đọc code"><button aria-pressed={!full} onClick={()=>update({listFull:null})}>Đoạn liên quan</button><button aria-pressed={full} onClick={()=>update({listFull:'1'})}>Mở rộng ngữ cảnh</button></div></div><div className="practice-appearance-controls"><label><input type="checkbox" checked={wrap} onChange={e=>setWrap(e.target.checked)}/> Xuống dòng code</label><label className="workspace-theme-choice"><span>Code</span><select aria-label="Giao diện workspace code" value={preference} onChange={e=>setTheme(e.target.value as 'system'|'light'|'dark')}><option value="system">Theo giao diện</option><option value="light">Sáng</option><option value="dark">Tối</option></select></label></div></div></div>
   <div className="practice-code-legend"><span>✓ Đã chạy</span><span>◆ Đang dừng</span><span>▶ Sắp chạy</span><span>● Đang xem</span><small>Snapshot file Java đầy đủ</small></div>
   <SourceEditorColumns contextKey="list:practice" reading tree={<><p>EXPLORER <small>{files.length} file đã mở</small></p><PracticeTreePositions current={{path:source.path,method:ref===focus.ref?practice.method:source.symbol,line:location.from,onOpen:current}} previous={previous?{path:listSource.sources[previous.ref].path,method:practice.previousMethod??listSource.sources[previous.ref].symbol,line:previous.from,onOpen:practice.onPrevious??(()=>update({listRef:previous.ref,listLine:String(previous.from),listTo:String(previous.to)}))}:undefined}/><SourceTree compactFolders files={files} selected={ref} onSelect={id=>update({listRef:id,listLine:null,listTo:null,ref:null})} label="Cây module Policy đã khám phá" memoryKey="list:practice"/></>} code={<><div className="policy-source-location"><strong>{ref===focus.ref?practice.method:source.symbol}:L{location.from}</strong><code>{source.path}</code><span>Snapshot L1–{source.rows.length} · {source.commit.slice(0,12)}</span></div><div className="policy-code-frame" data-testid="policy-source" data-source-id={ref}><ListCode focus={location} full={full} tone={tone} marks={ref===focus.ref?practice.marks:undefined} memory={`list:practice:${ref}:${location.from}`}/></div></>}/>
   <div className="policy-call-links"><span>Lần tiếp từ đoạn code</span><button onClick={()=>update({listFull:full?null:'1'})}>{full?'Đoạn liên quan':'Mở toàn bộ file'}</button>{ref!==focus.ref&&<button onClick={current}>Về câu đang học</button>}</div>
  </div>;
 }
 return <section className={`list-source ${tree?'with-tree':''}`} aria-label="Workspace source Danh sách">
  {tree&&<aside ref={treeRoot} className="list-tree"><h4>Workspace rút gọn</h4><SourceTree compactFolders files={listFiles} selected={ref} onSelect={id=>update({[`${prefix}Ref`]:id,[`${prefix}Line`]:null,[`${prefix}To`]:null,...(prefix==='list'?{ref:null}:{})})} label="Cây source Danh sách" memoryKey={`list:${prefix}`}/></aside>}
  <div className="list-source-main"><header><strong>{source.symbol} · L{location.from}–{location.to}</strong><button type="button" onClick={()=>update({[`${prefix}Full`]:full?null:'1'})}>{full?'Đoạn liên quan':'Mở toàn bộ file'}</button></header>
   <p className="list-source-path"><code>{source.path}</code></p>
   <div className="list-source-options"><label><input type="checkbox" checked={wrap} onChange={e=>setWrap(e.target.checked)}/>Xuống dòng code</label><label>Code <select aria-label="Giao diện code Danh sách" value={preference} onChange={e=>setTheme(e.target.value as 'system'|'light'|'dark')}><option value="system">Theo giao diện</option><option value="light">Sáng</option><option value="dark">Tối</option></select></label>
    {requested&&<button onClick={()=>update({[`${prefix}Ref`]:null,[`${prefix}Line`]:null})}>Về source của điểm đang xem</button>}</div>
   <ListCode focus={location} full={full} tone={tone} memory={`${prefix}:${ref}:${location.from}`}/>
   <details className="list-source-proof"><summary>Phiên bản và bằng chứng source</summary><p>Đối chiếu {listSource.reviewedOn} · {source.modified?'Working tree có thay đổi':'File khớp commit'} · HEAD <code>{source.commit}</code></p><p>SHA256 bytes gốc: <code>{source.sha256}</code>. Số dòng giữ nguyên cả trong trích đoạn và toàn bộ file.</p></details>
  </div>
 </section>;
}
