import type {LearningChanges} from './learning-contracts';

// Keep each learning mode's reading position separate from the replay cursor.
// This module stays independent of the Java snapshots so navigation can stay eager.
export function updateModePosition(params:URLSearchParams,currentMode:string,nextMode:string):LearningChanges {
 const flow=params.get('flow')??'checkout',prefix=`u.${flow}.`,current=params.get('node')??params.get('point')??params.get(prefix+'view');
 const next=params.get(prefix+'position.'+nextMode)??current;
 return {[prefix+'position.'+currentMode]:current,[prefix+'mode']:nextMode,node:next,point:next,[prefix+'view']:next};
}

export function updateFlowPosition(params:URLSearchParams,currentFlow:string,nextFlow:string,mode:string,currentPoint:string,firstPoint:string):LearningChanges {
 const prefix=`u.${nextFlow}.`,nextMode=params.get(prefix+'mode')??mode,next=params.get(prefix+'position.'+nextMode)??params.get(prefix+'view')??firstPoint;
 return {[`u.${currentFlow}.mode`]:mode,[`u.${currentFlow}.position.${mode}`]:currentPoint,flow:nextFlow,mode:nextMode,node:next,point:next,[prefix+'view']:next,ref:null};
}
