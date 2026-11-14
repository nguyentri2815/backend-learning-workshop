import type {StatusFlow} from '../content/policy/status';
import type {LearningChanges} from './learning-contracts';
export function statusModePosition(params:URLSearchParams,mode:string,nextMode:string):LearningChanges{
 const flow=params.get('flow')??'date',prefix=`s.${flow}.`,current=params.get('node')??params.get('point')??params.get(prefix+'view'),next=params.get(prefix+'position.'+nextMode)??current;
 return {[prefix+'position.'+mode]:current,[prefix+'mode']:nextMode,node:next,point:next,[prefix+'view']:next};
}
export function statusFlowPosition(params:URLSearchParams,currentFlow:string,next:StatusFlow,mode:string,currentPoint:string):LearningChanges{
 const prefix=`s.${next.id}.`,nextMode=params.get(prefix+'mode')??mode,id=params.get(prefix+'position.'+nextMode)??params.get(prefix+'view')??next.points[0].id;
 return {[`s.${currentFlow}.mode`]:mode,[`s.${currentFlow}.position.${mode}`]:currentPoint,flow:next.id,mode:nextMode,node:id,point:id,[prefix+'view']:id,ref:null};
}
