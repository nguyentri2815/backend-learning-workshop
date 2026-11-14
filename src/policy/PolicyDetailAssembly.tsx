import {LearningSteps} from '../components/LearningSteps';
import {LearningAssemblyLesson} from './LearningAssemblyLesson';
import {LearningTechnicalReference} from './LearningTechnicalReference';
import {LearningReadSource} from './LearningReadSource';
import {PolicyDetailImplementation} from './PolicyDetailImplementation';
import {detailJourney,detailPoints,detailSource,currentDetailStep,detailStepChanges} from '../content/policy/detail';
import {detailState,detailSamples} from './detail-model';
import {detailLesson,detailDecisionData,detailPatternModel} from './detail-learning-data';
import type {LearningChanges,PatternWorkspaceAdapter} from './learning-contracts';
import './policy-assembly.css';
const adapter:PatternWorkspaceAdapter={...detailPatternModel,implementation:props=><PolicyDetailImplementation {...props}/>};
export function PolicyDetailAssembly({params,update}:{params:URLSearchParams;update:(c:LearningChanges)=>void}){
 const step=currentDetailStep(params),stepId=`detail-${step.id}`,sample=params.get('detailExplore')??'current',sampleParams=new URLSearchParams(params);
 if(sample!=='current'){sampleParams.set('detailSample',sample==='missing'?'standard':sample);sampleParams.set('detailId',sample==='missing'?'POL-NOT-FOUND':'POL-LEARN-001');}
 const s=detailState(sampleParams),lesson=detailLesson(step,s),points=detailPoints.filter(p=>step.points.some(id=>id===p.id));
 const focus=points.find(p=>p.id===params.get('detailTechnicalPoint'))??points[0];
 const onStep=(id:string)=>update(detailStepChanges(detailJourney.find(s=>`detail-${s.id}`===id)!));
 return <article className="assembly detail-assembly" aria-label="Tư duy lắp ráp Chi tiết" data-business-step={step.id}><LearningSteps label="Bốn bước tư duy lắp ráp Chi tiết" className="assembly-step-strip" current={stepId} items={detailJourney.map(s=>({id:`detail-${s.id}`,title:s.title,complete:false,status:''}))} onSelect={onStep}/>
  <LearningAssemblyLesson stepId={stepId} params={params} update={update} lesson={lesson} steps={detailJourney.map(s=>({id:`detail-${s.id}`,title:s.title}))} onStep={onStep} adapter={adapter} sample={{value:sample,options:[{id:'current',label:'ID và fixture của lượt đang thực hành'},...detailSamples,{id:'missing',label:'Không tìm thấy hồ sơ chính'}],onChange:id=>update({detailExplore:id==='current'?null:id}),info:'Dữ liệu khám phá độc lập. Chọn bộ dữ liệu không gửi request, không đổi Policy ID hoặc điểm dừng của bài thực hành.'}} dataForDecision={index=>detailDecisionData(step,s,index)}/>
  <LearningTechnicalReference><p>{step.description}</p><nav className="detail-checkpoints" aria-label="Checkpoint kỹ thuật Chi tiết">{points.map(p=><button key={p.id} aria-pressed={p.id===focus.id} onClick={()=>update({detailTechnicalPoint:p.id,detailTechnicalRef:null,detailTechnicalLine:null})}>{p.title} · {p.method}:L{p.from}</button>)}</nav><LearningReadSource sources={detailSource.sources} focus={focus} method={focus.method} params={params} update={update} prefix="detailTechnical" files={[focus.ref,...focus.supports]}/></LearningTechnicalReference>
 </article>;
}
