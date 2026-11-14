import type {ReactNode} from 'react';
import type {CodeAnnotation} from '../workshop/CodeBlock';

export type LearningEvidence<K extends string=string>={ref:K;from?:number;to?:number};
export type LearningComponent<K extends string=string>={id:string;name:string;role:string;input:string;output:string;frame:string;change:string;evidence:LearningEvidence<K>[];limit?:string};
export type LearningHandoff<K extends string=string>={id:string;from:string;to:string;label:string;data:string;result:string;frame:string;evidence:LearningEvidence<K>[];limit?:string;kind?:'call'|'data'|'event'};
export type LearningPattern<K extends string=string>={id:string;title:string;badge:string;fit:string;input:string;output:string;grouping:string;difference:string;nodes:LearningComponent<K>[];edges:LearningHandoff<K>[];examples:LearningEvidence<K>[];limit?:string};
export type LearningDecision={id:string;shortTitle:string;question:string;hint:string;options:{label:string;consequence:string;fit:'current'|'alternative';fitLabel:string}[];reveal:string[]};
export type LearningLesson={situation:string;input:string;output:string;decisions:LearningDecision[];patterns:LearningPattern[]};
export type SourceDocument={path:string;symbol:string;line:number;from:number;to?:number;rows:{line:number;text:string}[];commit:string;sha256:string;modified:boolean};
export type SourceCatalog=Record<string,SourceDocument>;
export type SourceGuide={role:string;explanation:string};
export type LearningFocus<K extends string=string>={ref:K;annotations:CodeAnnotation[];symbol:string};
export type LearningPresentation={label:string;tone:CodeAnnotation['tone'];focus:LearningFocus;caption?:string};
export type LearningTrace={kind:'call'|'data'|'event';relation:string;caller:{id:'A'|'B';label:string;focus:LearningFocus;code:string};receiver:{id:'A'|'B';label:string;focus:LearningFocus;code:string};note?:string};
export type LearningDiagramRelation={id:string;from:string;to:string;kind:'call'|'data'|'event'|'inheritance'|'support';label:string;handoff?:LearningHandoff;fromFocus?:LearningFocus;toFocus?:LearningFocus};
export type LearningDiagram={files:{id:string;path:string;nodeIds:string[]}[];nodes:{id:string;title:string;role:string;ref:string;componentId?:string;position?:{x:number;y:number}}[];relations:LearningDiagramRelation[]};
export type LearningChanges=Record<string,string|null>;
export type PatternWorkspaceAdapter={
 sources:SourceCatalog;guides:Record<string,SourceGuide>;title:string;
 diagram:(pattern:LearningPattern)=>LearningDiagram;
 trace:(pattern:LearningPattern,edge:LearningHandoff)=>LearningTrace;
 componentFocus:(evidence:LearningEvidence)=>LearningFocus;
 nodeFocus:(node:LearningComponent,ref:string)=>LearningFocus;
 implementation:(props:{stepId:string;params:URLSearchParams;update:(changes:LearningChanges)=>void})=>ReactNode;
};
