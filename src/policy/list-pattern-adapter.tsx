import {listPatternModel} from './list-learning-data.ts';
import {PolicyListImplementation} from './PolicyListImplementation';
import type {PatternWorkspaceAdapter} from './learning-contracts';
export const listPatternAdapter:PatternWorkspaceAdapter={...listPatternModel,implementation:props=><PolicyListImplementation {...props}/>};
