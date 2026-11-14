import {LearningSteps} from '../components/LearningSteps';
import {LearningAssemblyLesson} from './LearningAssemblyLesson';
import {LearningTechnicalReference} from './LearningTechnicalReference';
import {LearningReadSource} from './LearningReadSource';
import {PolicyStatusImplementation} from './PolicyStatusImplementation';
import {statusSource,statusKey,statusVariant} from '../content/policy/status';
import type {StatusFlow} from '../content/policy/status';
import {defaultStatusInput,statusState} from './status-model';
import {statusLesson,statusPatternModel,statusDecisionData} from './status-learning-data';
import type {LearningChanges,PatternWorkspaceAdapter} from './learning-contracts';
import './policy-assembly.css';
export function PolicyStatusAssembly({flow,params,update}:{flow:StatusFlow;params:URLSearchParams;update:(c:LearningChanges)=>void}){
 const s=statusState(params),step=s.step,stepId=`status-${flow.id}-${step.id}`,key=(k:string)=>statusKey(flow,k),sample=params.get(key('explore'))??'current',scenario=sample==='current'?s.scenario:sample,input=sample==='current'?s.input:defaultStatusInput(flow,scenario),lesson=statusLesson(flow,step,input,scenario);
 const active=statusVariant(flow,input.entry),adapter:PatternWorkspaceAdapter={...statusPatternModel,title:flow.title,implementation:props=><PolicyStatusImplementation flow={active} {...props}/>};
 const onStep=(id:string)=>{const point=flow.points.find(p=>`status-${flow.id}-${p.stage}`===id)!.id;update({node:point,point,[key('view')]:point});};
 const points=active.points.filter(p=>p.stage===step.id),focus=points.find(p=>p.id===params.get(key('technicalPoint')))??points[0],prefix=`statusTechnical-${flow.id}`;
 return <article className="assembly status-assembly" data-business-step={step.id}><LearningSteps label="Bước tư duy lắp ráp Đổi trạng thái" className="assembly-step-strip" current={stepId} items={flow.steps.map(p=>({id:`status-${flow.id}-${p.id}`,title:p.title,complete:false,status:''}))} onSelect={onStep}/><LearningAssemblyLesson stepId={stepId} params={params} update={update} lesson={lesson} steps={flow.steps.map(p=>({id:`status-${flow.id}-${p.id}`,title:p.title}))} onStep={onStep} adapter={adapter} sample={{value:sample,options:[{id:'current',label:'Fixture của lượt đang thực hành'},...flow.scenarios.map(s=>({id:s.id,label:s.label}))],onChange:id=>update({[key('explore')]:id==='current'?null:id}),info:'Đối chiếu dữ liệu riêng, không chạy checkpoint, không ghi Policy và không đổi điểm dừng mô phỏng.'}} dataForDecision={()=>statusDecisionData(flow,step,input,scenario)}/><LearningTechnicalReference><p>{step.situation}</p><nav className="status-checkpoints">{points.map(p=><button key={p.id} aria-pressed={focus.id===p.id} onClick={()=>update({[key('technicalPoint')]:p.id,[`${prefix}Ref`]:null,[`${prefix}Line`]:null})}>{p.title}</button>)}</nav><LearningReadSource sources={statusSource.sources} focus={focus} method={focus.method} params={params} update={update} prefix={prefix} files={[focus.ref,...focus.supports]}/></LearningTechnicalReference></article>;
}
