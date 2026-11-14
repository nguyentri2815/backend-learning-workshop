import type {StatusFlow,StatusStep} from '../content/policy/status';
export function statusTrialScenarios(flow:StatusFlow,step:StatusStep){
 const ids=flow.id==='date'&&step.id==='calculate'?['success','before','after','boundary-selected','effective-boundary']:['success',flow.id==='date'?'effective-boundary':flow.scenarios.find(s=>['core-fail','duplicate','missing'].includes(s.id))?.id??flow.scenarios[1].id];
 return flow.scenarios.filter(s=>ids.includes(s.id));
}
export function statusBuildTasks(flow:StatusFlow,step:StatusStep){
 const entry=flow.points.find(p=>p.stage===step.id)!;
 return [{id:`${step.id}-locate`,kind:'locate',title:'Tìm dữ liệu và phần có sẵn',focus:entry,explanation:entry.why},{id:`${step.id}-connect`,kind:'connect',title:'Nối điều kiện hoặc kết quả vào đúng nơi dùng',focus:step.buildFocus,explanation:step.operation},{id:`${step.id}-trial`,kind:'trial',title:'Thử fixture đến checkpoint của bước',focus:step.buildFocus,explanation:step.output}];
}
