import type {ReactNode} from 'react';
export function CheckpointCodeWorkspace({checkpointId,collapsed,reader,variables}:{checkpointId:string;collapsed:boolean;reader:ReactNode;variables:ReactNode}){
 return <div className={`practice-code-and-data ${collapsed?'variables-collapsed':''}`}><div className="practice-reader-pane" data-testid="checkpoint-editor" data-checkpoint-id={checkpointId}>{reader}</div><div className="checkpoint-variable-wrapper" data-checkpoint-id={checkpointId}>{variables}</div></div>;
}
