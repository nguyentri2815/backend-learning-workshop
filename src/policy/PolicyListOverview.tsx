import {CornerUpLeft,X} from 'lucide-react';
import {LearningOverviewFrame} from './LearningOverviewFrame';
import {LearningJourneyDiagram} from './LearningJourneyDiagram';
import type {JourneyMapNode} from './LearningJourneyDiagram';
import {listJourney,currentListStep,listStepChanges,pointsFor,journeyForPoint} from '../content/policy/list-journey';
import {listEdges} from '../content/policy/list';
import {listScenarios,evaluateList} from './list-model';
import type {SearchRequest} from './list-model';
import {PolicyListDiagram} from './PolicyListDiagram';
import {PolicyListSource} from './PolicyListSource';
import type {ListChanges} from './PolicyListSource';
import './policy-overview.css';

const layout:JourneyMapNode[]=[
 {id:'find',number:'1',title:'Tìm hợp đồng',note:'Nhập tiêu chí và bấm Tìm',position:{x:0,y:170}},
 {id:'scope',number:'2',title:'Xác định hợp đồng được hiển thị',note:'Tiêu chí giao với phạm vi được xem',position:{x:270,y:170}},
 {id:'results',number:'3',title:'Nhận kết quả tìm kiếm',note:'Một trang kết quả và tổng số dòng',position:{x:540,y:170}},
 {id:'found',number:'3A',title:'Có hợp đồng phù hợp',note:'Thấy các dòng và Policy ID',position:{x:820,y:0}},
 {id:'empty',number:'3B',title:'Không có hợp đồng phù hợp',note:'Đổi tiêu chí để thử lại',position:{x:820,y:170}},
 {id:'error',number:'3C',title:'Lỗi được trả thành trang rỗng',note:'Đối chiếu catch và log trong source',position:{x:820,y:340}},
 {id:'page',number:'3A.1',title:'Xem trang tiếp',note:'Giữ tiêu chí · tăng pageNumber',position:{x:1100,y:0}},
 {id:'detail',number:'4',title:'Mở chi tiết hợp đồng',note:'Dùng đúng ID của dòng đã chọn',position:{x:1100,y:170}},
];
const paths={found:{title:'Có kết quả và đổi trang',sample:'found'},empty:{title:'Kết quả rỗng',sample:'empty'},error:{title:'Rỗng do catch',sample:'error'}} as const;
function business(id:string){return listJourney.find(s=>s.id===id)??listJourney[2];}
export function PolicyListOverview({params,update}:{params:URLSearchParams;update:(changes:ListChanges)=>void}){
 const current=currentListStep(params),pathId=params.get('listPath')==='empty'?'empty':params.get('listPath')==='error'?'error':'found',path=paths[pathId],inspected=params.get('listInspect');
 const selected=layout.find(n=>n.id===inspected),step=business(selected?.id??'find'),points=pointsFor(step),focus=points.find(p=>p.id===(listEdges.find(e=>e.id===params.get('listOverview'))?.to??params.get('listOverview')))??points[0];
 const sample=listScenarios.find(s=>s.id===path.sample)!,sampleRequest:SearchRequest=sample.request,result=evaluateList(sampleRequest,sample.persona);
 const activeIds=['find','scope','results',pathId,...pathId==='found'?['page','detail']:[]];
 const connections=[{source:'find',target:'scope',active:true},{source:'scope',target:'results',active:true},...['found','empty','error'].map(id=>({source:'results',target:id,active:id===pathId,conditional:id==='error'})),{source:'found',target:'page',active:pathId==='found'&&result.page.totalPages>1},{source:'page',target:'detail',active:pathId==='found'},{source:'found',target:'detail',active:pathId==='found',conditional:true}];
 function inspect(id:string){update({listInspect:id,listOverview:null,listOverviewRef:null,listOverviewLine:null,...id in paths?{listPath:id}:{}});}
 function practice(){update({...listStepChanges(listJourney[0]),mode:'steps',listDraft:JSON.stringify(sample.request),listPersona:sample.persona});}
 return <LearningOverviewFrame eyebrow="TỪ TIÊU CHÍ ĐẾN CHI TIẾT HỢP ĐỒNG" title="Tìm hợp đồng trong phạm vi được xem" path={<p className="policy-learning-path">Đường học: <strong>{path.title}</strong></p>}
  map={<LearningJourneyDiagram layout={layout} connections={connections} activeIds={activeIds} inspected={inspected} onOpen={inspect} practice={{find:practice}} memoryKey="list" canvasLabel="Sơ đồ chung: tìm hợp đồng, phạm vi, kết quả và Chi tiết" testId="list-journey-map" legend={<><span><i/>Đường đang học</span><span><i className="conditional"/>Rỗng do catch / mở trực tiếp từ dòng</span><span>Đổi trang khi còn trang tiếp · giữ nguyên tiêu chí đã gửi</span></>}/>}
  resume={params.has('node')&&<div className="policy-overview-resume"><span>Đang giữ bước {listJourney.indexOf(current)+1}: {current.title}</span><button type="button" className="text-button policy-resume" data-testid="policy-resume-practice" onClick={()=>update({mode:'steps'})}><CornerUpLeft size={14}/>Quay về đúng bước đang học</button></div>}>
  {selected&&<aside className="policy-map-detail" aria-label="Chi tiết điểm trên sơ đồ" data-testid="list-map-detail"><header><div><span className="eyebrow">ĐANG XEM · {path.title}</span><h3>{selected.number} · {selected.title}</h3></div><button className="policy-map-close" aria-label="Đóng chi tiết" onClick={()=>update({listInspect:null})}><X size={17}/></button></header><div className="policy-map-detail-body">
   <p>{selected.note}</p><p>{step.description}</p><h4>Đầu vào</h4><p>keyword={String(sampleRequest.keyword??'')}; danh tính={sample.persona}; pageNumber={sampleRequest.pageNumber??0}.</p><h4>Kết quả quan sát</h4><p>{selected.id==='empty'?'Không có dòng khớp tiêu chí và phạm vi.':selected.id==='error'?'exec bắt lỗi và trả Page.empty(); success=true chưa phân biệt được nguyên nhân.':step.outcome}</p>
   <div className="actions"><button className="button primary" onClick={()=>update({...listStepChanges(step),mode:'steps'})}>Vào bước {listJourney.indexOf(step)+1} · {step.title}</button></div>
   <details className="policy-verify-points"><summary>Checkpoint kỹ thuật và source của bước này</summary><PolicyListDiagram full group={step} active={focus.id} onNode={id=>update({listOverview:id,listInspect:journeyForPoint(id)!.id,listOverviewRef:null,listOverviewLine:null})} onEdge={id=>update({listOverview:id,listInspect:journeyForPoint(listEdges.find(e=>e.id===id)!.to)!.id})}/><p>{focus.why}</p><button className="button secondary" onClick={()=>update({...listStepChanges(step),mode:'steps',node:focus.id,point:focus.id})}>Mở checkpoint · {focus.title}</button><PolicyListSource focus={focus} prefix="listOverview" params={params} update={update}/></details>
  </div></aside>}
 </LearningOverviewFrame>;
}
