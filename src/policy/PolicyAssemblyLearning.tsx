import {creationContext,quotes,SAMPLE_NOW} from './create-model';
import {assemblySteps} from '../content/policy/assembly';
import {learningSteps} from '../content/policy/assembly-learning';
import {assemblyQuestionData} from './assembly-question-data';
import {LearningAssemblyLesson} from './LearningAssemblyLesson';
import {createPatternAdapter} from './create-pattern-adapter';
export {evidenceRows} from './AssemblySourceView';

export function PolicyAssemblyLearning({stepId,params,update}:{stepId:string;params:URLSearchParams;update:(values:Record<string,string|null>)=>void}){
 const sampleQuote=quotes.find(q=>q.id===params.get('assemblyQuote')&&!q.blocked&&!q.missing)??quotes[0];
 const sample=creationContext(new URLSearchParams({quote:sampleQuote.id}));
 return <LearningAssemblyLesson stepId={stepId} params={params} update={update} lesson={learningSteps(sample)[stepId]} steps={assemblySteps} adapter={createPatternAdapter}
  sample={{value:sample.quote.id,options:quotes.filter(q=>!q.blocked&&!q.missing),onChange:id=>update({assemblyQuote:id}),info:`Mốc ngày: ${SAMPLE_NOW.slice(0,10)}. Bộ dữ liệu và lựa chọn khám phá độc lập với tiến độ “Làm lại từng bước”.`}}
  dataForDecision={(index,explored)=>assemblyQuestionData(stepId,index,sample,explored)}
  canonicalIndex={answers=>stepId==='result'&&answers[0]===1?1:0}
  answerChanges={(index,value)=>stepId==='result'&&index===0?{[`assemblyPattern.${stepId}`]:value===1?'detail':'list',[`assemblyInspect.${stepId}`]:null}:{}}
  onStep={id=>update({assemblyStep:id,component:null,assemblyPane:null,assemblyRef:null,assemblyFull:null,assemblyTechnical:null})}/>;
}
