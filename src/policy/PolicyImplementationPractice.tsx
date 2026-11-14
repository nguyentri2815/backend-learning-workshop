import {lazy,Suspense,useRef,useState} from 'react';
import {ArrowLeft,ArrowRight,Check,LocateFixed,RotateCcw} from 'lucide-react';
import {SourceTree} from '../JourneyWorkspace';
import sources from '../content/policy/assembly-source.json' with {type:'json'};
import type {EvidenceKey} from '../content/policy/assembly-learning';
import {implementationFiles,implementationLessons,implementationOrder,implementationRows} from '../content/policy/assembly-implementation';
import {creationContext,quotes,SAMPLE_NOW} from './create-model';
import type {CodeAnnotation} from '../workshop/CodeBlock';
import type {CodeRow} from '../workshop/source';
import './policy-implementation-practice.css';
import {implementationPosition} from './implementation-navigation';
import {sessionLessonRound} from '../content/policy/implementation-session';

const CodeBlock=lazy(()=>import('../workshop/CodeBlock').then(m=>({default:m.CodeBlock})));

function excerpt(rows:CodeRow[],ranges:{from:number;to:number}[]) {
  return rows.filter(row=>ranges.some(r=>(row.line??0)>=r.from-3&&(row.line??0)<=r.to+3));
}

export function PolicyImplementationPractice({stepId,params,update}:{stepId:string;params:URLSearchParams;update:(values:Record<string,string|null>)=>void}) {
  const lesson=implementationLessons[stepId],prefix=`assemblyPractice.${stepId}.`;
  const {done,firstPending,index}=implementationPosition(lesson.tasks,params,prefix+'done',prefix+'task');
  const task=lesson.tasks[index],completed=done.includes(task.id),files=implementationFiles(stepId);
  const selected=files.find(f=>f.id===params.get(prefix+'file'));
  const ref=selected?.id as EvidenceKey|undefined,source=ref?sources[ref]:undefined;
  const isTarget=source?.path===sources[task.ref].path;
  const full=params.get(prefix+'full')==='1';
  const [choice,setChoice]=useState(''),[message,setMessage]=useState(''),[hint,setHint]=useState(''),[policyInput,setPolicyInput]=useState('');
  const tree=useRef<HTMLElement>(null),root=useRef<HTMLElement>(null);
  const savedQuote=params.get(prefix+'quote')??params.get('assemblyQuote');
  const quote=quotes.find(q=>q.id===savedQuote&&!q.blocked&&!q.missing)??quotes[0];
  const sample=creationContext(new URLSearchParams({quote:quote.id}));
  const tested=(params.get(prefix+'tested')??'').split(',').filter(Boolean);
  const revision=params.get(prefix+'revision')??'0';
  function change(values:Record<string,string|null>) {
    update(Object.fromEntries(Object.entries(values).map(([key,value])=>[prefix+key,value])));
  }
  function complete(extra:Record<string,string|null>={}) {
    const latest=implementationPosition(lesson.tasks,new URLSearchParams(window.location.search),prefix+'done',prefix+'task');
    change({done:[...new Set([...latest.done,task.id])].join(','),task:task.id,quote:quote.id,...extra});setMessage('');
  }
  function selectFile(id:string) {change({file:id,full:null});setHint('');setMessage('');}
  function locate() {
    const file=files.find(f=>f.path===sources[task.ref].path)!;
    change({file:file.id});setHint(file.path);setMessage('Đã chỉ vị trí trong cây. Đọc hợp đồng rồi thực hiện thao tác bên phải.');
    requestAnimationFrame(()=>{
      const target=tree.current?.querySelector<HTMLElement>('.tree-file.selected');
      target?.scrollIntoView({block:'nearest',inline:'nearest'});target?.focus({preventScroll:true});
    });
  }
  function navigateTask(next:number) {change({task:lesson.tasks[next].id});setChoice('');setMessage('');setHint('');setPolicyInput('');}
  function stepTask(delta:number){const latest=implementationPosition(lesson.tasks,new URLSearchParams(window.location.search),prefix+'done',prefix+'task'),next=latest.index+delta;if(next<0||next>=lesson.tasks.length||delta>0&&!latest.done.includes(lesson.tasks[latest.index].id))return;navigateTask(next);}
  function act() {
    if(!isTarget){setMessage('Mở đúng file trong cây workspace trước khi thực hiện. Có thể dùng “Chỉ vị trí”.');return;}
    if(task.answer&&choice!==task.answer){setMessage(task.correction??'Đối chiếu đầu vào và kiểu dữ liệu ở hai đầu. Lựa chọn này chưa khớp hợp đồng của source.');return;}
    if(task.kind==='read-check'&&policyInput.trim()!==sample.policy.id) {
      setMessage('Hai đầu chưa khớp Policy ID của fixture. Dùng ID ghi trả về, được hiển thị ngay trên ô nhập; quoteId không phải Policy ID.');return;
    }
    complete();
  }
  function trial(id:string) {
    const latest=(new URLSearchParams(window.location.search).get(prefix+'tested')??'').split(',').filter(Boolean),next=[...new Set([...latest,id])];
    const both=next.includes('missing')&&next.includes('valid');
    change({tested:next.join(','),quote:quote.id,task:task.id,...(both?{done:[...new Set([...done,task.id])].join(',')}: {})});
  }
  function reset() {
    change({done:null,tested:null,task:lesson.tasks[0].id,file:null,full:null,quote:null,revision:String(Number(revision)+1)});
    setChoice('');setMessage('Bài hiện tại đã về mốc đầu.');setHint('');setPolicyInput('');
    root.current?.closest('.assembly-implementation-panel')?.scrollTo({top:0});
  }
  const annotations:CodeAnnotation[]=isTarget?(task.patches?.filter(p=>sources[p.ref].path===source!.path).map(p=>({start:p.from,end:p.to,label:completed?'Đã thực hiện':task.status,tone:'component' as const}))??[{start:task.from,end:task.to,label:completed?'Đã thực hiện':task.status,tone:'support' as const}]):[];
  const ranges=isTarget?(task.patches?.filter(p=>sources[p.ref].path===source!.path)??[{from:task.from,to:task.to}]):source?[{from:source.line,to:source.line+14}]:[];
  const afterRows=ref?implementationRows(ref,stepId,done):[];
  const doneAtTask=done.filter(id=>lesson.tasks.findIndex(t=>t.id===id)<=index);
  const beforeRows=ref?implementationRows(ref,stepId,doneAtTask,task.id):[];
  const afterTaskRows=ref?implementationRows(ref,stepId,doneAtTask):[];
  const hasChange=Boolean(task.patches?.length)&&isTarget&&completed;
  const memory=`implementation:${stepId}:${task.id}:${ref}:${revision}`;
  const anchor=annotations[0]?.start??source?.line;
  const futureFiles=files.filter(f=>!lesson.reuse.some(r=>sources[r].path===f.path)&&!lesson.tasks.some(t=>sources[t.ref].path===f.path));
  return <section ref={root} className="implementation-practice" aria-label={`Bài thực hành bước ${implementationOrder.indexOf(stepId)+1}`} data-practice-step={stepId}>
    <nav className="implementation-toolbar" aria-label="Điều hướng bài thực hành">
      {params.has('sessionReturn')&&<button onClick={()=>{const saved=new URLSearchParams(params.get('sessionReturn')!);update({...Object.fromEntries(saved),sessionReturn:null,[`assemblyDiagram.${stepId}`]:null});}}>Trở về phiên triển khai</button>}
      <button className="implementation-session-link" onClick={()=>{const current=new URLSearchParams(window.location.search);update({mode:'session',sessionAt:sessionLessonRound(stepId),sessionFile:null,sessionOrigin:params.get('sessionReturn')?params.get('sessionOrigin'):current.toString(),sessionReturn:null});}}>Mở phiên tổng thể tại mốc này</button>
      <button onClick={()=>stepTask(-1)} disabled={index===0}><ArrowLeft size={15}/>Trước</button>
      <span>Lượt {index+1}/{lesson.tasks.length} · {done.length}/{lesson.tasks.length} đã thực hiện</span>
      <button onClick={()=>stepTask(1)} disabled={index===lesson.tasks.length-1||!completed}>Tiếp theo<ArrowRight size={15}/></button>
      <button className="implementation-reset" title={`Đưa bài bước ${implementationOrder.indexOf(stepId)+1} về mốc đầu`} onClick={reset}><RotateCcw size={14}/>Làm lại phần này</button>
    </nav>
    <div className="implementation-baseline"><strong>Mốc khởi đầu · Bước {implementationOrder.indexOf(stepId)+1}</strong><p>{lesson.baseline}</p>
      <small>Thứ tự thực hành để lắp lại tính năng theo source; không mô tả lịch sử viết code hay thứ tự chạy backend. Thao tác chỉ đổi bản mô phỏng của chế độ này.</small>
    </div>
    <div className="implementation-layout">
      <aside ref={tree} className="assembly-diagram-tree implementation-tree" aria-label="Workspace thực hành">
        <h4>Workspace · agent-system</h4>
        <SourceTree compactFolders files={files} selected={selected?.id??''} onSelect={selectFile} label="Cây file thực hành" memoryKey={`implementation:${stepId}`}/>
        {hint&&<p className="implementation-location-hint" role="status">Chỉ vị trí: <code>{hint}</code></p>}
        <p className="assembly-caption">File có sẵn có thể chỉ cần thêm method hoặc một nhánh. Trạng thái bên phải gắn với đúng đoạn cần làm.</p>
        <details className="implementation-reuse"><summary>Phần có sẵn để dùng · {lesson.reuse.length}</summary>{lesson.reuse.map(r=><button key={r} onClick={()=>selectFile(files.find(f=>f.path===sources[r].path)!.id)}>{sources[r].path.split('/').at(-1)}<small>Có sẵn để dùng</small></button>)}</details>
        {futureFiles.length>0&&<details className="implementation-future"><summary>Sẽ dùng ở các bước sau · {futureFiles.length} file</summary>{futureFiles.map(f=><p key={f.id}>{f.path.split('/').at(-1)}</p>)}</details>}
      </aside>
      <main className="implementation-main">
        <nav className="implementation-task-list" aria-label="Các lượt thực hành">{lesson.tasks.map((t,i)=><button key={t.id} disabled={firstPending>=0&&i>firstPending} aria-current={i===index?'step':undefined} data-future={firstPending>=0&&i>firstPending} onClick={()=>navigateTask(i)}>
          {done.includes(t.id)?<Check size={13}/>:<span>{i+1}.</span>}{t.title}</button>)}</nav>
        <article className="implementation-task" data-task={task.id}>
          <header><small>1 · VIỆC CẦN LÀM</small><span className="implementation-status" data-done={completed}>{completed?'Đã thực hiện':task.status}</span></header>
          <h4>{task.title}</h4><p>{task.why}</p>
          <div className="implementation-location"><div><small>2 · VỊ TRÍ TRONG WORKSPACE</small><p>{task.target}</p><code>{sources[task.ref].path}</code></div><button onClick={locate}><LocateFixed size={14}/>Chỉ vị trí</button></div>
          <div className="implementation-action"><small>3 · THAO TÁC TRONG MÔ PHỎNG</small>
            {task.choices&&!completed&&<label>Chọn cách nối / dữ liệu<select aria-label="Chọn thao tác" value={choice} onChange={e=>{setChoice(e.target.value);setMessage('');}}><option value="">Chọn để thực hiện…</option>{task.choices.map(c=><option key={c} value={c}>{c}</option>)}</select></label>}
            {task.kind==='quote-trials'?<><p>Mỗi nút chạy một fixture qua các guard vừa lắp. Hãy thử ít nhất nhánh thiếu và nhánh hợp lệ.</p><div className="implementation-trials">
              <button onClick={()=>trial('missing')}>Thử nhánh thiếu dữ liệu{tested.includes('missing')&&<Check size={13}/>}</button>
              <button onClick={()=>trial('valid')}>Thử nhánh hợp lệ{tested.includes('valid')&&<Check size={13}/>}</button>
              <button onClick={()=>trial('blocked')}>Thử thêm: đã có Policy{tested.includes('blocked')&&<Check size={13}/>}</button>
            </div></>:<>
              {task.kind==='read-check'&&!completed&&<label>Policy ID ghi trả về: <code>{sample.policy.id}</code><input aria-label="Policy ID để kiểm tra" value={policyInput} onChange={e=>setPolicyInput(e.target.value)} placeholder="Nhập Policy ID từ kết quả ghi"/></label>}
              <button onClick={act} disabled={completed||!isTarget||Boolean(task.answer&&!choice)}>{completed?<><Check size={14}/>Đã thực hiện · {task.action}</>:task.action}</button>
              {!isTarget&&!completed&&<p className="assembly-caption">Mở file mục tiêu trong cây để thao tác. Bạn có thể tự tìm hoặc chọn “Chỉ vị trí”.</p>}
            </>}
            {message&&<p role="status" className="implementation-feedback">{message}</p>}
          </div>
          <div className="implementation-result" aria-live="polite"><small>4 · KẾT QUẢ VÀ VIỆC LÀM TIẾP</small>
            {completed?<><p>{task.result}</p><p><strong>Cho phép làm tiếp:</strong> {task.enables}</p></>:<p>Thực hiện thao tác để tạo kết quả và xem phần có thể làm tiếp.</p>}
            {task.kind==='quote-trials'&&tested.length>0&&<ul className="implementation-trial-results">{tested.map(id=>{
              const fixture=id==='missing'?quotes[3]:id==='blocked'?quotes[2]:quote;
              return <li key={id} data-trial={id}><strong>{fixture.id}</strong> → {fixture.missing?'QUOTE_NOT_EXIST · dừng ở exec L62–64; không dựng Command.':fixture.blocked?'QUOTE_CAN_NOT_RELEASE_POLICY · dừng ở runInternal L76–78; không gọi save.':`Đã đọc ${fixture.quoteCode} · không có Policy chặn trong fixture → được phép dựng Command ở bước 3; chưa gọi save.`}</li>;
            })}</ul>}
            {completed&&stepId==='map'&&task.id==='rules'&&<dl className="implementation-values"><dt>quoteId → command.quoteId</dt><dd>{quote.id}</dd><dt>policyType ← quoteType</dt><dd>{quote.quoteType}</dd><dt>status tại {SAMPLE_NOW.slice(0,10)}</dt><dd>{sample.policy.status===0?'NOT_RUNNING':sample.policy.status===-1?'EXPIRED':'RUNNING'} ({sample.policy.status})</dd></dl>}
            {completed&&stepId==='save'&&task.id==='save'&&<p>Policy ID fixture: <code>{sample.policy.id}</code> · version mô phỏng: 1</p>}
            {completed&&task.kind==='view'&&<table className="implementation-view-result"><caption>policy_view_aggregate · fixture trước/sau</caption><thead><tr><th>Mốc</th><th>Policy ID</th><th>Dữ liệu</th></tr></thead><tbody><tr><td>Trước</td><td>{sample.policy.id}</td><td>Chưa có dòng</td></tr><tr><td>Sau</td><td>{sample.policy.id}</td><td>{sample.policy.policyCode} · {sample.policy.customerName} · searchingKey đã dựng · thanh toán đã map</td></tr></tbody></table>}
            {completed&&task.kind==='read-check'&&<table className="implementation-read-result"><caption>Đối chiếu hai đầu bằng Policy ID</caption><thead><tr><th>Đầu đọc</th><th>Policy ID</th><th>Kết quả fixture</th></tr></thead><tbody><tr><td>Danh sách · Query / view</td><td>{sample.policy.id}</td><td>{sample.policy.policyCode} · {sample.policy.customerName}</td></tr><tr><td>Chi tiết · Command / repository</td><td>{sample.policy.id}</td><td>{sample.policy.policyCode} · quoteId: {quote.id}</td></tr></tbody></table>}
          </div>
        </article>
        {!source?<div className="implementation-empty">Chọn một file trong cây workspace để đọc source. Đoạn cần thêm sẽ hiện sau thao tác mô phỏng.</div>:<section className="implementation-code" aria-label="Code của bản mô phỏng" data-source-ref={ref} data-full-file={full}>
          <header><div><strong>{source.path.split('/').at(-1)}</strong><span>{isTarget?(completed?'Đã thực hiện':task.status):'Đối chiếu trong workspace'}</span></div><button onClick={()=>change({full:full?null:'1'})}>{full?'Xem đoạn liên quan':'Mở toàn bộ file'}</button></header>
          <p className="assembly-source-path"><code>{source.path}</code></p>
          <p className="assembly-caption">Bản mô phỏng từ source · {source.modified?'Bản làm việc có thay đổi':'Khớp commit'} · HEAD {source.commit.slice(0,12)} · SHA256 {source.sha256.slice(0,12)}. Giữ số dòng snapshot để đối chiếu; vùng chưa lắp được thay bằng chú thích.</p>
          {hasChange&&!full?<div className="implementation-diff">{[{label:'Trước',rows:beforeRows,after:false},{label:'Sau · đoạn vừa thêm / sửa',rows:afterTaskRows,after:true}].map(part=><section key={part.label}><h5>{part.label}</h5><div className="implementation-code-scroll"><Suspense fallback={<p>Đang mở code…</p>}><CodeBlock key={`${memory}:${part.after}`} rows={excerpt(part.rows,ranges)} path={source.path} annotations={part.after?annotations:undefined} memoryKey={`${memory}:${part.after}`} scrollAnchor={anchor} preferTarget/></Suspense></div></section>)}</div>:<>
            {full&&<p className="implementation-focus-label">Toàn bộ file mô phỏng · {isTarget?`${completed?'Đã thực hiện':task.status}: ${task.target}`:'các phần chưa tới vẫn được giữ ở mốc đầu'}</p>}
            <div className="implementation-code-scroll" data-practice-full={full?ref:undefined}><Suspense fallback={<p>Đang mở code…</p>}><CodeBlock key={`${memory}:${full}:${completed}`} rows={full?afterRows:excerpt(afterRows,ranges)} path={source.path} annotations={isTarget?annotations:undefined} scrollAnchor={anchor} preferTarget revealAncestors memoryKey={`${memory}:${full}:${completed}`}/></Suspense></div>
          </>}
        </section>}
        <p className="assembly-caption">Fixture đang dùng: {quote.id} · ngày mẫu {SAMPLE_NOW.slice(0,10)}. Mỗi bài có mốc đầu riêng; xem lại giữ kết quả, “Làm lại phần này” đặt lại toàn bộ bài ở bước hiện tại.</p>
      </main>
    </div>
  </section>;
}
