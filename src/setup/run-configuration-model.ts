import source from "../content/setup/practice-runtime-source.json" with {type:"json"};
import execution from "../content/setup/execution-source.json" with {type:"json"};

export const commandMain=source.files.find(file=>file.id==="main")!;
export const commandMainClass=execution.mainClass;
export const commandMainName=commandMainClass.split(".").at(-1)!;
export type RunSetupStep="main"|"inspect"|"menu"|"configuration"|"apply"|"ok"|"saved";
export type RunSetup={step:RunSetupStep;draftProfile:"base"|"dev";applied:boolean;saved:boolean;configKey:"port"|"datasource";terminalOpen:boolean};
export const emptyRunSetup=():RunSetup=>({step:"main",draftProfile:"base",applied:false,saved:false,configKey:"datasource",terminalOpen:false});
export function normalizeRunSetup(value:unknown):RunSetup{
 const state=emptyRunSetup();
 if(!value||typeof value!=="object")return state;
 const raw=value as Record<string,unknown>;
 if(["main","inspect","menu","configuration","apply","ok","saved"].includes(raw.step as string))state.step=raw.step as RunSetupStep;
 state.draftProfile=raw.draftProfile==="dev"?"dev":"base";
 state.applied=raw.applied===true;
 state.saved=raw.saved===true;
 state.configKey=raw.configKey==="port"?"port":"datasource";
 state.terminalOpen=raw.terminalOpen===true;
 if(state.step==="ok"&&!state.applied)state.step="configuration";
 if(state.step==="saved"&&!state.saved)state.step="main";
 return state;
}
