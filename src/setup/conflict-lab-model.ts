import source from "../content/setup/practice-infrastructure-source.json" with {type:"json"};
import {serviceCatalog} from "./infrastructure-model";

export type ConflictKind="name"|"port";
export type ConflictService="rebrow"|"postgres-write"|"redis"|"rabbitmq"|"kafka"|"zookeeper";
export type ConflictResult="none"|"name-conflict"|"port-conflict"|"running"|"skipped"|"pending";
export type ConflictContainer={name:string;port:number;state:"created"|"running"};
export interface ConflictCaseState {
 service:""|ConflictService; stage:"plan"|"error"|"inspect"|"decision"|"edit"|"ready"|"done";
 attempts:number;result:ConflictResult;inspector:boolean;selected:""|"name"|"port"|"other";identified:boolean;
 strategy:""|"skip"|"separate"|"reuse";name:string;hostPort:number;lastName:string;lastPort:number;
 javaOpen:boolean;created:ConflictContainer[];
}
export type ConflictLab=Record<ConflictKind,ConflictCaseState>;
export const MAX_CONFLICT_CONTAINERS=6;
export const conflictCapacityReached=(state:ConflictCaseState,name:string)=>state.created.length>=MAX_CONFLICT_CONTAINERS&&!state.created.some(row=>row.name===name);
export const emptyConflictCase=():ConflictCaseState=>({service:"",stage:"plan",attempts:0,result:"none",inspector:false,selected:"",identified:false,strategy:"",name:"",hostPort:0,lastName:"",lastPort:0,javaOpen:false,created:[]});
export const emptyConflictLab=():ConflictLab=>({name:emptyConflictCase(),port:emptyConflictCase()});
const services:ConflictService[]=["rebrow","postgres-write","redis","rabbitmq","kafka","zookeeper"];
const safeName=(value:unknown)=>typeof value==="string"&&/^[a-zA-Z0-9][a-zA-Z0-9_.-]{0,47}$/.test(value)?value:"";
const safePort=(value:unknown)=>Number.isInteger(value)&&Number(value)>0&&Number(value)<=65535?Number(value):0;
export function normalizeConflictLab(value:unknown):ConflictLab {
 const lab=emptyConflictLab();if(!value||typeof value!=="object")return lab;
 for(const kind of ["name","port"] as const){
  const input=(value as Record<string,unknown>)[kind];if(!input||typeof input!=="object")continue;
  const raw=input as Record<string,unknown>,entry=lab[kind];
  if(services.includes(raw.service as ConflictService))entry.service=raw.service as ConflictService;
  for(const [key,values] of Object.entries({stage:["plan","error","inspect","decision","edit","ready","done"],result:["none","name-conflict","port-conflict","running","skipped","pending"],selected:["","name","port","other"],strategy:["","skip","separate","reuse"]}))if(values.includes(raw[key] as string))Object.assign(entry,{[key]:raw[key]});
  entry.attempts=Number.isInteger(raw.attempts)?Math.min(99,Math.max(0,Number(raw.attempts))):0;
  entry.inspector=raw.inspector===true;entry.identified=raw.identified===true;entry.javaOpen=raw.javaOpen===true;
  entry.name=safeName(raw.name);entry.lastName=safeName(raw.lastName);entry.hostPort=safePort(raw.hostPort);entry.lastPort=safePort(raw.lastPort);
  if(Array.isArray(raw.created))entry.created=raw.created.flatMap(item=>{if(!item||typeof item!=="object")return [];const name=safeName(item.name),port=safePort(item.port);return name&&port&&["created","running"].includes(item.state)?[{name,port,state:item.state as "created"|"running"}]:[];}).slice(-MAX_CONFLICT_CONTAINERS);
  if(!entry.attempts)Object.assign(entry,{stage:"plan",result:"none",inspector:false,selected:"",identified:false,strategy:"",created:[]});
 }
 return lab;
}
const compose=source.files.find(file=>file.id==="compose")!;
export function conflictService(id:ConflictService){
 const catalog=serviceCatalog.find(item=>item.id===id)!;
 const start=catalog.line,next=serviceCatalog.map(item=>item.line).filter(line=>line>start).sort((a,b)=>a-b)[0]??Infinity;
 const rows=compose.rows.filter(row=>row.line>=start&&row.line<next);
 const mappings=rows.flatMap(row=>{const match=row.text.match(/^\s*-\s*["']?(\d+):(\d+)/);return match?[{line:row.line,host:Number(match[1]),container:Number(match[2])}]:[];});
 const explicit=rows.find(row=>/^\s*container_name:/.test(row.text));
 // RabbitMQ lists the management mapping first in source. Use the catalog's verified client port.
 const primary=mappings.find(mapping=>mapping.host===Number(catalog.ports.match(/^\d+/)?.[0]))??mappings[0];
 return {id,name:catalog.name,explicitName:Boolean(explicit),line:start,rows,mappings:[primary,...mappings.filter(mapping=>mapping!==primary)],port:primary.host,containerPort:primary.container,image:rows.find(row=>/^\s*(image|build):/.test(row.text))?.text.trim()??"",purpose:catalog.role};
}
export function conflictPlan(kind:ConflictKind,state:ConflictCaseState,previous:ConflictService){
 const service=conflictService(kind==="name"?"rebrow":state.service||previous);
 return {...service,name:state.name||service.name,hostPort:state.hostPort||service.port};
}
export function conflictForeign(kind:ConflictKind,service:Pick<ReturnType<typeof conflictService>,"id"|"port"|"containerPort">){
 return [kind==="name"?{name:"rebrow",project:"analytics-training",state:"stopped" as const,port:5001,containerPort:5001}:{name:service.id==="postgres-write"?"pg-analytics":`${service.id}-analytics`,project:"analytics-training",state:"running" as const,port:service.port,containerPort:service.containerPort},
 {name:"metrics-helper",project:"monitoring-lab",state:"running" as const,port:9090,containerPort:9090}];
}
export function runConflict(kind:ConflictKind,current:ConflictCaseState,previous:ConflictService):ConflictCaseState {
 const plan=conflictPlan(kind,current,previous),foreign=conflictForeign(kind,plan);
 const next={...current,service:plan.id,attempts:Math.min(99,current.attempts+1),lastName:plan.name,lastPort:plan.hostPort,name:plan.name,hostPort:plan.hostPort,selected:"" as const,identified:false};
 if(current.strategy==="skip")return {...next,result:"skipped",stage:"done"};
 if(current.strategy==="reuse")return {...next,result:"pending",stage:"done",identified:true};
 if(foreign.some(row=>row.name===plan.name))return {...next,result:"name-conflict",stage:"error"};
 // Bound the teaching snapshot without silently discarding containers from earlier attempts.
 if(conflictCapacityReached(current,plan.name))return {...current,stage:"edit",strategy:"separate",identified:true};
 const blocked=foreign.some(row=>row.state==="running"&&row.port===plan.hostPort)||current.created.some(row=>row.name!==plan.name&&row.state==="running"&&row.port===plan.hostPort);
 const container:ConflictContainer={name:plan.name,port:plan.hostPort,state:blocked?"created":"running"};
 // Retain previous attempts under other names. Only the container owned by this lab is reconfigured.
 const created=[...current.created.filter(row=>row.name!==plan.name),container];
 return {...next,created,result:blocked?"port-conflict":"running",stage:blocked?"error":"done",inspector:current.inspector};
}
export const conflictFinished=(state:ConflictCaseState)=>state.stage==="done"&&["running","skipped"].includes(state.result);
export function conflictInstruction(kind:ConflictKind,state:ConflictCaseState){
 if(state.stage==="plan")return "Đọc service định chạy, rồi bấm Thử tạo/chạy trong bài học để quan sát kết quả.";
 if(state.stage==="error")return "Đọc lỗi của lần thử vừa rồi. Mở Docker Desktop mô phỏng để tìm container giữ tên hoặc host port đó.";
 if(state.stage==="inspect")return "Đối chiếu hai bên và bấm giá trị trùng. Container stopped giữ tên nhưng không giữ host port đang lắng nghe.";
 if(state.stage==="decision")return "Quyết định service có cần cho mục tiêu hiện tại không, rồi chọn cách chuẩn bị phù hợp.";
 if(state.stage==="edit")return "Sửa tên hoặc host port trong bản mô phỏng; áp dụng để thấy Before/After rồi chạy lại.";
 if(state.stage==="ready")return "Đọc kế hoạch mới rồi chạy lại trong bài. Chưa có container nào thay đổi chỉ vì bạn sửa kế hoạch.";
 return state.result==="pending"?"Tái sử dụng còn thiếu bằng chứng. Có thể quay lại chọn bỏ service hoặc chuẩn bị instance riêng.":`Đã thấy kết quả chạy lại. Đọc ba câu kết luận; ${kind==="name"?"có thể chuyển sang tình huống host port riêng.":"hai nguyên nhân cần được phân biệt."}`;
}
export const javaConflictConfig:Partial<Record<ConflictService,{line:number;keys:string;note:string}>>={
 "postgres-write":{line:33,keys:"spring.datasource.url",note:"Nếu Java trên host dùng instance local này, JDBC phải gọi host port mới; DB/schema/credential và DOCKER_HOST_IP vẫn cần đối chiếu. File gốc trỏ remote, không tự đổi thành local."},
 redis:{line:119,keys:"cache.redis · cache.redis-persistent · cache.redis-session",note:"Đối chiếu cả ba khóa và DB/namespace/quyền. Không chỉ sửa một khóa rồi coi các bean còn lại đã đổi."},
 rabbitmq:{line:54,keys:"spring.rabbitmq.port",note:"Đây là cổng AMQP. Cổng quản trị RabbitMQ là mapping riêng, không dùng làm cổng client Java."},
 kafka:{line:10,keys:"eventuatelocal.kafka.bootstrap.servers",note:"Kiểm tra bootstrap và advertised listener/network theo nơi chạy Java; đổi mapping chưa chứng minh consumer có thể truy cập broker."},
};
