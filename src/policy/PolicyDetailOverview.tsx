import {CornerUpLeft,X} from 'lucide-react';
import {LearningOverviewFrame} from './LearningOverviewFrame';
import {LearningJourneyDiagram} from './LearningJourneyDiagram';
import type {JourneyMapNode} from './LearningJourneyDiagram';
import {detailJourney,detailPoints,detailSource,currentDetailStep,detailStepChanges} from '../content/policy/detail';
import type {LearningChanges} from './learning-contracts';
import {LearningReadSource} from './LearningReadSource';
import './policy-overview.css';
const layout:JourneyMapNode[]=[
 {id:'list',number:'1A',title:'Chọn hợp đồng từ Danh sách',note:'Giữ nguyên ID của dòng đã chọn',position:{x:0,y:0}},
 {id:'direct',number:'1B',title:'Mở trực tiếp bằng Policy ID',note:'ID trên liên kết → cùng endpoint',position:{x:0,y:230}},
 {id:'find',number:'2',title:'Tìm hồ sơ hợp đồng',note:'Đọc hồ sơ chính trong Command',position:{x:290,y:120}},
 {id:'missing',number:'2B',title:'Không tìm thấy hồ sơ',note:'POLICY_NOT_EXIST · dừng luồng',position:{x:580,y:330}},
 {id:'related',number:'3',title:'Lấy thông tin liên quan',note:'Đối tượng và thanh toán từ đâu?',position:{x:580,y:0}},
 {id:'lean',number:'3B',title:'Thiếu thông tin liên quan',note:'Đối tượng [] · checkout có thể null',position:{x:870,y:230}},
 {id:'display',number:'4',title:'Hiển thị chi tiết',note:'Ghép response vào từng vùng thông tin',position:{x:1160,y:0}},
];
export function PolicyDetailOverview({params,update}:{params:URLSearchParams;update:(c:LearningChanges)=>void}){
 const path=params.get('detailPath')??'list',missing=params.get('detailBranch')==='missing',lean=params.get('detailBranch')==='lean',inspected=params.get('detailInspect');
 const selected=layout.find(n=>n.id===inspected),step=detailJourney.find(s=>s.id===selected?.id)??detailJourney[selected?.id==='missing'?1:selected?.id==='lean'?2:0],current=currentDetailStep(params);
 const points=detailPoints.filter(p=>step.points.some(id=>id===p.id)),focus=points.find(p=>p.id===params.get('detailOverviewPoint'))??points[0];
 const active=[path,'find',...missing?['missing']:['related',...lean?['lean']:[],'display']];
 function practice(entry:string){update({...detailStepChanges(detailJourney[0]),mode:'steps',detailEntry:entry,detailId:missing?'POL-NOT-FOUND':params.get('detailId')??params.get('selected')??'POL-LEARN-001',detailSample:lean?'lean':params.get('detailSample')??'standard'});}
 return <LearningOverviewFrame eyebrow="DUYỆT TỪNG NHÓM DỮ LIỆU CỦA HỢP ĐỒNG" title="Hai cách mở, một hồ sơ hợp đồng" path={<p className="policy-learning-path">Đường học: <strong>{path==='list'?'Từ dòng Danh sách':'Liên kết trực tiếp'} · {missing?'không tìm thấy':lean?'thiếu thông tin liên quan':'có hồ sơ'}</strong></p>}
 map={<LearningJourneyDiagram layout={layout} connections={[{source:'list',target:'find',active:path==='list'},{source:'direct',target:'find',active:path==='direct'},{source:'find',target:'missing',active:missing,conditional:true},{source:'find',target:'related',active:!missing},{source:'related',target:'display',active:!missing&&!lean},{source:'related',target:'lean',active:!missing&&lean,conditional:true},{source:'lean',target:'display',active:!missing&&lean}]} activeIds={active} inspected={inspected} onOpen={id=>update({detailInspect:id,...id==='list'||id==='direct'?{detailPath:id}:id==='missing'?{detailBranch:'missing'}:id==='lean'?{detailBranch:'lean'}:id==='display'?{detailBranch:'found'}:{},detailOverviewPoint:null})} practice={{list:()=>practice('list'),direct:()=>practice('direct')}} memoryKey="detail" canvasLabel="Sơ đồ Chi tiết từ Danh sách hoặc liên kết trực tiếp" testId="detail-journey-map" legend={<><span><i/>Đường đang học</span><span><i className="conditional"/>Không tìm thấy / thiếu dữ liệu liên quan</span><span>Đối tượng rỗng không chặn response</span></>}/>}
 resume={params.has('node')&&<div className="policy-overview-resume"><span>Đang giữ bước {detailJourney.indexOf(current)+1}: {current.title}</span><button className="text-button policy-resume" onClick={()=>update({mode:'steps'})}><CornerUpLeft size={14}/>Quay về đúng bước đang học</button></div>}>
 {selected&&<aside className="policy-map-detail" aria-label="Chi tiết điểm trên sơ đồ"><header><div><span className="eyebrow">ĐƯỜNG ĐỌC ĐÃ XÁC MINH</span><h3>{selected.number} · {selected.title}</h3></div><button className="policy-map-close" aria-label="Đóng chi tiết" onClick={()=>update({detailInspect:null})}><X size={17}/></button></header><div className="policy-map-detail-body"><p>{selected.note}</p><p>{step.description}</p><h4>Đầu vào</h4><p>{step.input}</p><h4>Kết quả quan sát</h4><p>{selected.id==='missing'?'Không đọc đối tượng, không trả response thành công.':selected.id==='lean'?'insuredObjects=[]; createdTime hoặc paymentOrderNo có thể null.':step.output}</p><button className="button primary" onClick={()=>update({...detailStepChanges(step),mode:'steps'})}>Vào bước {detailJourney.indexOf(step)+1} · {step.title}</button><details className="policy-verify-points"><summary>Checkpoint kỹ thuật và source của bước này</summary><nav className="detail-checkpoints" aria-label="Checkpoint trong bước">{points.map(p=><button key={p.id} aria-pressed={focus.id===p.id} onClick={()=>update({detailOverviewPoint:p.id,detailOverviewRef:null,detailOverviewLine:null})}>{p.title}</button>)}</nav><p>{focus.why}</p><LearningReadSource sources={detailSource.sources} focus={focus} method={focus.method} params={params} update={update} prefix="detailOverview" files={[focus.ref,...focus.supports]}/></details></div></aside>}
 </LearningOverviewFrame>;
}
