import {LearningSteps} from '../components/LearningSteps';
import {LearningAssemblyLesson} from './LearningAssemblyLesson';
import {LearningTechnicalReference} from './LearningTechnicalReference';
import {LearningReadSource} from './LearningReadSource';
import {PolicyUpdateImplementation} from './PolicyUpdateImplementation';
import {updateSource,updateKey} from '../content/policy/update';
import type {UpdateFlow} from '../content/policy/update';
import {updateState,updateInput} from './update-model';
import {updateLesson,updatePatternModel,updateDecisionData} from './update-learning-data';
import type {LearningChanges,PatternWorkspaceAdapter} from './learning-contracts';
import './policy-assembly.css';
export function PolicyUpdateAssembly({flow,params,update}:{flow:UpdateFlow;params:URLSearchParams;update:(c:LearningChanges)=>void}){
 const s=updateState(params),step=s.step,stepId=`update-${flow.id}-${step.id}`,key=(k:string)=>updateKey(flow,k),sample=params.get(key('explore'))??'current',scenario=sample==='current'?s.scenario:sample,input=sample==='current'?s.input:updateInput(flow),lesson=updateLesson(flow,step,scenario,input);
 const adapter:PatternWorkspaceAdapter={...updatePatternModel,title:flow.title,implementation:props=><PolicyUpdateImplementation flow={flow} {...props}/>};
 const onStep=(id:string)=>{const point=flow.points.find(p=>`update-${flow.id}-${p.stage}`===id)!.id;update({node:point,point,[key('view')]:point});};
 const points=flow.points.filter(p=>p.stage===step.id),focus=points.find(p=>p.id===params.get(key('technicalPoint')))??points[0],prefix=`updateTechnical-${flow.id}`;
 return <article className="assembly update-assembly" aria-label={`Tư duy lắp ráp · ${flow.title}`} data-flow={flow.id} data-business-step={step.id}><LearningSteps label="Bước tư duy lắp ráp Cập nhật" className="assembly-step-strip" current={stepId} items={flow.steps.map(p=>({id:`update-${flow.id}-${p.id}`,title:p.title,complete:false,status:''}))} onSelect={onStep}/><LearningAssemblyLesson stepId={stepId} params={params} update={update} lesson={lesson} steps={flow.steps.map(p=>({id:`update-${flow.id}-${p.id}`,title:p.title}))} onStep={onStep} adapter={adapter} sample={{value:sample,options:[{id:'current',label:'Fixture của lượt đang thực hành'},...flow.scenarios.map(s=>({id:s.id,label:s.label}))],onChange:id=>update({[key('explore')]:id==='current'?null:id}),info:'Dữ liệu khám phá độc lập. Đổi mẫu không gửi request, không chạy event và không đổi điểm dừng mô phỏng.'}} dataForDecision={index=>updateDecisionData(flow,step,scenario,input,index)}/><LearningTechnicalReference><p>{step.situation}</p><nav className="update-checkpoints">{points.map(p=><button key={p.id} aria-pressed={focus.id===p.id} onClick={()=>update({[key('technicalPoint')]:p.id,[`${prefix}Ref`]:null,[`${prefix}Line`]:null})}>{p.title}</button>)}</nav><LearningReadSource sources={updateSource.sources} focus={focus} method={focus.method} params={params} update={update} prefix={prefix} files={[focus.ref,...focus.supports]}/></LearningTechnicalReference></article>;
}
