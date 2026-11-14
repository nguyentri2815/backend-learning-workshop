import {LearningSteps} from '../components/LearningSteps';
import {listJourney,currentListStep,listStepChanges,pointsFor} from '../content/policy/list-journey';
import {listLearningState,listScenarios} from './list-model';
import {LearningAssemblyLesson} from './LearningAssemblyLesson';
import {LearningTechnicalReference} from './LearningTechnicalReference';
import {listLearningLesson,listDecisionData} from './list-learning-data.ts';
import {listPatternAdapter} from './list-pattern-adapter';
import {PolicyListDiagram} from './PolicyListDiagram';
import {PolicyListSource} from './PolicyListSource';
import type {ListChanges} from './PolicyListSource';
import './policy-assembly.css';

export function PolicyListAssembly({params,update}:{params:URLSearchParams;update:(changes:ListChanges)=>void}){
 const step=currentListStep(params),stepId=`list-${step.id}`,points=pointsFor(step);
 const sample=listScenarios.find(s=>s.id===params.get('listExplore'));
 const sampleParams=new URLSearchParams(params);
 if(sample){sampleParams.set('listRequest',JSON.stringify(sample.request));sampleParams.set('listSentPersona',sample.persona);sampleParams.set('listStop','6');sampleParams.delete('selected');}
 const session=listLearningState(sampleParams),lesson=listLearningLesson(step,session,sampleParams);
 const learningParams=new URLSearchParams(params);
 const legacyView=params.get(`listAssembly.${step.id}`)??params.get('listAssembly');
 if(!learningParams.has(`assemblyView.${stepId}`)&&legacyView)learningParams.set(`assemblyView.${stepId}`,legacyView);
 const legacyAnswers=params.get(`listAnswers.${step.id}`);
 if(!learningParams.has(`assemblyAnswers.${stepId}`)&&legacyAnswers)learningParams.set(`assemblyAnswers.${stepId}`,legacyAnswers);
 function selectStep(id:string){update(listStepChanges(listJourney.find(s=>`list-${s.id}`===id)!));}
 return <article className="assembly list-shared-assembly" aria-label="Tư duy lắp ráp Danh sách" data-business-step={step.id}>
  <LearningSteps label="Bốn bước tư duy lắp ráp Danh sách" current={stepId} className="assembly-step-strip" items={listJourney.map(s=>({id:`list-${s.id}`,title:s.title,complete:false,status:''}))} onSelect={selectStep}/>
  <LearningAssemblyLesson stepId={stepId} params={learningParams} update={update} lesson={lesson} steps={listJourney.map(s=>({id:`list-${s.id}`,title:s.title}))} adapter={listPatternAdapter} onStep={selectStep}
   sample={{value:sample?.id??'current',options:[{id:'current',label:'Tiêu chí của lượt đang thực hành'},...listScenarios.map(s=>({id:s.id,label:s.title}))],onChange:id=>update({listExplore:id==='current'?null:id}),info:'Dữ liệu Workshop. Bộ khám phá dùng tiêu chí hiện tại hoặc tình huống riêng; chọn bộ dữ liệu không chạy lại request và không đổi điểm dừng của bài thực hành.'}}
   dataForDecision={(index,explored)=>listDecisionData(step,session,sampleParams,index,explored)}/>
  <LearningTechnicalReference open={params.get('listTechnical')==='1'} onToggle={event=>{if(event.currentTarget.open!==(params.get('listTechnical')==='1'))update({listTechnical:event.currentTarget.open?'1':null});}}>
   <p>{step.description}</p><PolicyListDiagram group={step} active={params.get('listPart')??points[0].id} onNode={id=>update({listPart:id})} onEdge={id=>update({listPart:id})}/>
   <PolicyListSource focus={points.find(p=>p.id===params.get('listPart'))??points[0]} params={params} update={update} prefix="listTechnical"/>
  </LearningTechnicalReference>
 </article>;
}
