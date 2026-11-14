import sources from '../content/policy/assembly-source.json' with {type:'json'};
import {assemblySourceGuides} from '../content/policy/assembly-source-guide';
import type {Pattern,LearningNode,Evidence,EvidenceKey,Handoff} from '../content/policy/assembly-learning';
import {cooperationTrace,componentFocus,diagramModel,nodeFocus} from './assembly-pattern-model';
import {PolicyImplementationPractice} from './PolicyImplementationPractice';
import type {PatternWorkspaceAdapter} from './learning-contracts';

// The adapter is the only boundary aware of Create's source keys and code pairs.
export const createPatternAdapter:PatternWorkspaceAdapter={
 sources,guides:assemblySourceGuides,title:'Tạo Policy từ Quote',
 diagram:pattern=>diagramModel(pattern as Pattern),
 trace:(pattern,edge)=>cooperationTrace(pattern as Pattern,edge as Handoff),
 componentFocus:evidence=>componentFocus(evidence as Evidence),
 nodeFocus:(node,ref)=>nodeFocus(node as LearningNode,ref as EvidenceKey),
 implementation:props=><PolicyImplementationPractice {...props}/>,
};
