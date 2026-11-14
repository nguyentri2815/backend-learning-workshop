import type {Pattern} from '../content/policy/assembly-learning';
import {LearningPatternWorkspace} from './LearningPatternWorkspace';
import {createPatternAdapter} from './create-pattern-adapter';

export function PolicyPatternWorkspace(props:{stepId:string;pattern:Pattern;params:URLSearchParams;update:(values:Record<string,string|null>)=>void;active:boolean}){
 return <LearningPatternWorkspace {...props} adapter={createPatternAdapter}/>;
}
