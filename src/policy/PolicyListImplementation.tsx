import {useState} from 'react';
import {SourceTree} from '../JourneyWorkspace';
import {implementationTasks as allTasks,listSource} from '../content/policy/list';
import type {ListSourceId} from '../content/policy/list';
import {ListCode,listFiles} from './PolicyListSource';
import type {ListChanges} from './PolicyListSource';
import {evaluateList,listScenarios} from './list-model';
import type {ListPersona} from './list-model';
import {implementationPosition} from './implementation-navigation';

export function PolicyListImplementation({params,update,stepId}:{params:URLSearchParams;update:(changes:ListChanges)=>void;stepId?:string}) {
 const groups:Record<string,string[]>={'list-find':['pattern','dto','endpoint'],'list-scope':['conditions'],'list-results':['read','map'],'list-detail':['trial']};
 const tasks=stepId&&groups[stepId]?allTasks.filter(t=>groups[stepId].includes(t.id)):allTasks;
 const allDone=(params.get('listBuildDone')??'').split(',').filter(id=>allTasks.some(t=>t.id===id));
 const {done,firstPending,index}=implementationPosition(tasks,params,'listBuildDone','listBuildTask'),task=tasks[index];
 const selected=params.get('listBuildFile') as ListSourceId|null,source=selected&&listSource.sources[selected];
 const full=params.get('listBuildFull')==='1';
 const [choice,setChoice]=useState(''),[feedback,setFeedback]=useState('');
 const tested=(params.get('listBuildTested')??'').split(',').filter(Boolean);
 const complete=done.includes(task.id),isTarget=source&&selected===task.ref;
 function finish(){const latest=(new URLSearchParams(window.location.search).get('listBuildDone')??'').split(',').filter(Boolean);update({listBuildDone:[...new Set([...latest,task.id])].join(','),listBuildTask:task.id});setFeedback('');}
 function act(){if(new URLSearchParams(window.location.search).get('listBuildFile')!==task.ref){setFeedback('Chọn đúng file mục tiêu trong cây trước.');return;}if(Number(choice)!==task.answer||choice===''){setFeedback('Chưa khớp hợp đồng source. Đối chiếu kiểu dữ liệu ở hai đầu và lý do cần làm ở lượt này.');return;}finish();}
 function move(next:number){update({listBuildTask:tasks[next].id});setChoice('');setFeedback('');}
 function stepTask(delta:number){const latest=implementationPosition(tasks,new URLSearchParams(window.location.search),'listBuildDone','listBuildTask'),next=latest.index+delta;if(next<0||next>=tasks.length||delta>0&&!latest.done.includes(tasks[latest.index].id))return;move(next);}
 const patches=tasks.filter(t=>!['pattern','trial'].includes(t.id)&&t.ref===selected);
 function rows(excluded?:string){return source?source.rows.map(row=>{const pending=patches.find(t=>row.line>=t.from&&row.line<=t.to&&(!done.includes(t.id)||t.id===excluded));return pending?{...row,text:row.line===pending.from?`// Chưa lắp: ${pending.title} · bản mô phỏng`:''}:row;}):[];}
 function trial(id:string){const current=(new URLSearchParams(window.location.search).get('listBuildTested')??'').split(',').filter(Boolean);const next=[...new Set([...current,id])];update({listBuildTested:next.join(','),listBuildTask:task.id,...(next.length>=5?{listBuildDone:[...new Set([...allDone,task.id])].join(',')}: {})});}
 return <section className="list-implementation" aria-label="Từng bước triển khai Danh sách">
  <nav className="list-build-toolbar"><button disabled={index===0} onClick={()=>stepTask(-1)}>Trước</button><span>Lượt {index+1}/{tasks.length} · {done.length} đã thực hiện</span><button disabled={!complete||index===tasks.length-1} onClick={()=>stepTask(1)}>Tiếp theo</button><button onClick={()=>{update({listBuildTask:null,listBuildDone:allDone.filter(id=>!tasks.some(t=>t.id===id)).join(',')||null,listBuildFile:null,listBuildFull:null,listBuildTested:null});setChoice('');setFeedback('');}}>Làm lại phần triển khai</button></nav>
  <div className="list-build-baseline"><h4>Mốc khởi đầu · {stepId==='list-find'?'Bước 1 · Tìm hợp đồng':stepId==='list-scope'?'Bước 2 · Xác định hợp đồng được hiển thị':stepId==='list-results'?'Bước 3 · Xem kết quả và đổi trang':stepId==='list-detail'?'Bước 4 · Mở chi tiết':'Danh sách'}</h4><p>Module Query, Spring, lớp nền và các helper đã có. Các phần của bước khác được giữ như snapshot để tập trung vào bước hiện tại. Chỉ bỏ những đoạn cần bổ sung trong lượt này; thao tác không sửa backend thật.</p><p><strong>Việc cần lắp ở bước này:</strong> {tasks.map(t=>t.title).join(' → ')}. <strong>Thứ tự request:</strong> endpoint → DTO/Func → phạm vi và tiêu chí → repository → ánh xạ → bảng → ID sang Chi tiết.</p></div>
  <div className="list-build-layout"><aside className="list-tree"><h4>Workspace thực hành</h4><SourceTree compactFolders files={listFiles} selected={selected??''} onSelect={id=>update({listBuildFile:id,listBuildFull:null})} label="Cây triển khai Danh sách" memoryKey="list-build"/></aside>
   <main><nav className="list-build-tasks" aria-label="Lượt triển khai">{tasks.map((t,i)=><button key={t.id} disabled={firstPending>=0&&i>firstPending} aria-current={i===index?'step':undefined} onClick={()=>move(i)}>{done.includes(t.id)?'✓ ':''}{i+1}. {t.title}</button>)}</nav>
    <article className="list-build-task" data-task={task.id}><span className="eyebrow">{complete?'ĐÃ THỰC HIỆN':task.id==='pattern'?'CÓ SẴN ĐỂ DÙNG':'CẦN THÊM / NỐI TRONG MÔ PHỎNG'}</span><h3>{task.title}</h3><p><strong>Phần đã có:</strong> {task.available}</p><p>{task.why}</p><p className="list-source-path"><strong>Vị trí:</strong> <code>{listSource.sources[task.ref].path}:L{task.from}–{task.to}</code></p><button onClick={()=>update({listBuildFile:task.ref,listBuildFull:null})}>Chỉ vị trí</button>
     {task.id==='trial'?<><p>Thử đủ năm nhánh để hoàn tất. Mỗi nút chạy bộ lọc fixture vừa lắp.</p><div className="list-scenarios">{['found','empty','page','scope','error'].map(id=><button key={id} disabled={!isTarget} onClick={()=>trial(id)}>{tested.includes(id)?'✓ ':''}Thử {listScenarios.find(s=>s.id===id)!.title}</button>)}</div><ul>{tested.map(id=>{const sample=listScenarios.find(s=>s.id===id)!;const result=evaluateList(sample.request,sample.persona as ListPersona);return <li key={id} data-trial={id}>{sample.title}: total={result.page.totalElements}; content=[{result.page.content.map(r=>r.id).join(', ')}]{result.error?` · catch: ${result.error}`:''}</li>;})}</ul></>:<><label>Cách triển khai<select aria-label="Thao tác triển khai" value={choice} onChange={e=>setChoice(e.target.value)}><option value="">Chọn cách nối…</option>{task.choices.map((c,i)=><option key={c} value={i}>{c}</option>)}</select></label><button disabled={complete||!source} onClick={act}>{task.action}</button></>}
     {feedback&&<p role="status">{feedback}</p>}{complete&&<p className="list-build-result"><strong>Kết quả / việc có thể làm tiếp:</strong> {task.result}</p>}
    </article>
    {!source?<p className="list-pending">Tìm file trong cây hoặc bấm Chỉ vị trí để bắt đầu. Chưa thực hiện thay đổi nào.</p>:<section className="list-build-code"><header><h4>{source.path.split('/').at(-1)} · {isTarget?'Đúng file mục tiêu':'Source có sẵn để tra cứu'}</h4><button onClick={()=>update({listBuildFull:full?null:'1'})}>{full?'Đoạn liên quan':'Mở toàn bộ file'}</button></header><p>Code trước/sau là bản lắp ráp fixture từ snapshot, không phải lịch sử Git hay source có thể chạy khi còn thiếu bước.</p>
     {complete&&isTarget&&!['pattern','trial'].includes(task.id)&&!full?<div className="list-build-diff"><section><h5>Trước lượt này</h5><ListCode focus={task} rows={rows(task.id)} memory={`list-build:before:${task.id}`} tone="support"/></section><section><h5>Sau lượt này</h5><ListCode focus={task} rows={rows()} memory={`list-build:after:${task.id}`} tone="component"/></section></div>:<ListCode focus={isTarget?task:{ref:selected!,from:source.from,to:source.to}} full={full} rows={rows()} memory={`list-build:${task.id}:${done.join(',')}`} tone="component"/>}
    </section>}
   </main>
  </div>
 </section>;
}
