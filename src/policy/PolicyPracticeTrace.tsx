import { Background, MarkerType, Position, ReactFlow } from '@xyflow/react';
import type { Edge } from '@xyflow/react';
import { practiceSteps } from './create-practice';
import type { practiceContext } from './create-practice';
import type { SourceLocation } from './source-reading';
import '@xyflow/react/dist/style.css';

type Point={id:string;label:string;note:string;location?:SourceLocation;done?:boolean;blocked?:boolean;next?:boolean;via?:string};
export function PolicyPracticeTrace({node,context,mode,onMode,onStep,onInspect,expected}:{
 node:string;context:ReturnType<typeof practiceContext>;mode:'compact'|'deep'|'hidden';onMode:(mode:'compact'|'deep'|'hidden')=>void;
 onStep:(id:string)=>void;onInspect:(location:SourceLocation,available:boolean)=>void;expected:SourceLocation;
}) {
 const ctx=context;const index=practiceSteps.findIndex(s=>s.id===node);
 let points:Point[]=[];
 if(node==='quote')points=[
  {id:'screen',label:'Chi tiết Quote',note:ctx.quote.id,done:true},
  {id:'request',label:'POST /policy/create/{quoteId}',note:'Network mô phỏng · body trống',done:ctx.hasRequest},
  {id:'controller',label:'Controller nhận quoteId',note:'PolicyController.createPolicy · L45',location:{ref:'create-api',line:45},done:ctx.backendOpen},
  {id:'exec',label:'Gọi CreatePolicyFunc.exec',note:'Chuyển từ controller sang function',location:{ref:'create-check',line:61},done:ctx.reached>0||ctx.level>0},
 ];
 if(node==='validate'){
  points=ctx.quote.missing&&ctx.reached>0?[
   {id:'read',label:'findById · L61',note:'Đọc Quote theo ID',location:{ref:'create-check',line:61},done:true},
   {id:'empty',label:'Quote rỗng',note:'optional.isEmpty() · L62',location:{ref:'create-check',line:62},done:ctx.reached>=2},
   {id:'stop',label:'Dừng · L63',note:'Không tới runInternal',location:{ref:'create-check',line:63},blocked:ctx.failed,done:ctx.failed},
  ]:[
   {id:'read',label:'findById · L61',note:'Đọc Quote theo ID',location:{ref:'create-check',line:61},done:ctx.reached>=1},
   {id:'optional',label:ctx.reached>=1?'Có Quote':'optional chưa gán',note:'Kiểm tra rỗng · L62',location:{ref:'create-check',line:62},done:ctx.reached>=2},
   {id:'get',label:'optional.get() · L66',note:'Lấy quoteAggregate',location:{ref:'create-check',line:66},done:ctx.reached>=3},
   {id:'call',label:'Lời gọi · L67',note:'() → runInternal(quoteAggregate)',location:{ref:'create-check',line:67},done:ctx.reached>=4},
   {id:'enter',label:'Vào runInternal · L70',note:'Truyền Quote trong cùng file',location:{ref:'create-check',line:70},done:ctx.reached>=5,via:'Gọi hàm trong cùng file'},
   {id:'duplicate',label:'Tìm Policy trùng · L74',note:'Cùng quoteCode, status 0/100',location:{ref:'create-check',line:74},done:ctx.reached>=6},
   {id:'objects',label:'Đọc đối tượng · L75',note:'QUOTE · deleted=false',location:{ref:'create-check',line:75},done:ctx.reached>=7},
   {id:'guard',label:ctx.failed?'Dừng · L77':'Kiểm tra trùng · L76',note:ctx.failed?'Đã có Policy 0/100':ctx.level>=1?'Đủ điều kiện → dựng command':'Rẽ nhánh tiếp tục / dừng',location:{ref:'create-check',line:ctx.failed?77:76},done:ctx.reached>=8,blocked:ctx.failed},
  ];
 }
 if(node==='map')points=[
  {id:'quote',label:'Giá trị trên Quote',note:ctx.quote.quoteCode,done:ctx.level>=1},
  {id:'mapping',label:'Ánh xạ / tính / sinh',note:`${expected.ref} · L${expected.line}`,location:expected,done:ctx.level>=2},
  {id:'command',label:'CreatePolicyCommand',note:'Giá trị sắp ghi · chưa có Policy ID',done:ctx.level>=2},
 ];
 if(node==='save')points=[
  {id:'call',label:'save(command) · L115',note:'CreatePolicyFunc',location:{ref:'create-data',line:115},done:ctx.commandReady},
  {id:'apply',label:'process → event → apply',note:'PolicyAggregate · L328–339',location:{ref:'create-apply',line:329},done:ctx.commandReady},
  {id:'jpa',label:'Gắn ID, JPA save',note:'EventuateJdbcAccessImpl · L126',location:{ref:'store-save',line:126},done:ctx.commandReady},
  {id:'objects',label:'Tạo đối tượng POLICY',note:'createContractCode · L256',location:{ref:'create-quote',line:256},done:ctx.commandReady},
  {id:'quote',label:'Liên kết Policy trên Quote',note:'PublishedQuoteCommand · L233',location:{ref:'create-quote',line:233},done:ctx.commandReady},
  {id:'result',label:'Policy ID vừa tạo',note:ctx.commandReady?ctx.policy.id:'Chưa ghi mô phỏng',done:ctx.commandReady},
 ];
 if(node==='flow')points=[
  {id:'event',label:'CreatePolicyEvent',note:'Đã tạo ở Command',location:{ref:'create-apply',line:329},done:ctx.commandReady},
  {id:'handler',label:'Flow nhận event',note:'PolicyWorkflow · L27',location:{ref:'flow-create',line:27},done:ctx.viewReady,via:'Qua event'},
  {id:'read',label:'Executor đọc Command',note:'PolicySyncViewFunc · L41',location:{ref:'flow-view',line:41},done:ctx.viewReady},
  {id:'write',label:'Ghi Policy View',note:'policyViewRepository.save · L56',location:{ref:'flow-view',line:56},done:ctx.viewReady},
  {id:'realtime',label:'Queue thông báo realtime',note:'/topic/sync-policy-view/{id}',location:{ref:'flow-view',line:58},done:ctx.viewReady},
  {id:'query',label:'Query đọc view',note:'Danh sách trước / sau checkpoint',location:{ref:'q-source',line:114},done:ctx.viewReady},
 ];
 if(node==='result')points=[
  {id:'ui',label:'Tìm / mở theo ID',note:'Hai đường đọc độc lập',done:true},
  {id:'query',label:'POST /policy/search',note:'Query → Policy View',location:{ref:'q-source',line:114},done:ctx.viewReady},
  {id:'detail',label:'GET /policy/{id}',note:'Command → aggregate / đối tượng',location:{ref:'c-find',line:32},done:ctx.commandReady},
  {id:'id',label:'Đối chiếu cùng policyId',note:ctx.commandReady?ctx.policy.id:'Chưa tạo',done:ctx.commandReady},
 ];
 const compact=mode!=='deep';
 const graph=compact?practiceSteps.map((s,i)=>({id:s.id,position:{x:i*188,y:0},sourcePosition:Position.Right,targetPosition:Position.Left,className:`practice-trace-node ${node===s.id?'is-current':''} ${ctx.complete[i]?'is-done':''}`,style:{width:170},data:{label:<><b>{i+1}. {s.title}</b><small>{ctx.complete[i]?'Đã qua':node===s.id?'Đang xem':'Chưa tới'}</small></>}})):
 points.map((p,i)=>({id:p.id,position:node==='result'?{x:i===0?0:i===3?680:340,y:i===1?0:i===2?110:55}:{x:(i<4?i:7-i)*260,y:i<4?0:118},sourcePosition:node==='result'?Position.Right:i===3?Position.Bottom:i<3?Position.Right:Position.Left,targetPosition:node==='result'?Position.Left:i===4?Position.Top:i<4?Position.Left:Position.Right,className:`practice-trace-node ${p.done?'is-done':''} ${p.blocked?'is-blocked':''} ${p.location?.ref===expected.ref&&p.location.line===expected.line?'is-current':''}`,style:{width:196},data:{label:<><b>{p.label}</b><small>{p.note}</small></>}}));
 const pairs=compact?practiceSteps.slice(1).map((s,i)=>({source:practiceSteps[i].id,target:s.id,label:undefined as string|undefined,done:ctx.complete[i],blocked:false})):node==='result'?[{source:'ui',target:'query',label:'Danh sách',done:ctx.viewReady},{source:'ui',target:'detail',label:'Trực tiếp theo ID',done:ctx.commandReady},{source:'query',target:'id',done:ctx.viewReady},{source:'detail',target:'id',done:ctx.commandReady}]:points.slice(1).map((p,i)=>({source:points[i].id,target:p.id,label:p.via??(p.blocked?'Bị chặn':p.done?'Đang đi':undefined),done:p.done,blocked:p.blocked}));
 const edges:Edge[]=pairs.map((p,i)=>({id:String(i),...p,type:'smoothstep',markerEnd:{type:MarkerType.ArrowClosed},style:{stroke:'blocked'in p&&p.blocked?'#bd7864':p.done?'#318b81':'#afc6d0',strokeDasharray:p.done?undefined:'5 4'},labelStyle:{fontSize:10},labelBgPadding:[4,3]}));
 return <section className={`practice-execution-map is-${mode}`} aria-label="Sơ đồ theo dõi thực thi"><header><span>{mode==='hidden'?'Sơ đồ đang thu':mode==='deep'?`Đường đi trong bước ${index+1}`:'Theo dõi sáu chặng'}</span><div><button type="button" onClick={()=>onMode(mode==='deep'?'compact':'deep')}>{mode==='deep'?'Thu về sáu chặng':`Mở chi tiết chặng ${index+1}`}</button><button type="button" onClick={()=>onMode(mode==='hidden'?'compact':'hidden')}>{mode==='hidden'?'Hiện sơ đồ':'Thu sơ đồ để đọc code'}</button></div></header>{mode!=='hidden'&&<div className="practice-trace-canvas"><ReactFlow key={`${mode}:${node}:${ctx.quote.missing&&ctx.reached>0}`} nodes={graph} edges={edges} onNodeClick={(_,n)=>{if(compact)onStep(n.id);else{const p=points.find(p=>p.id===n.id)!;if(p.location)onInspect(p.location,Boolean(p.done));}}} fitView fitViewOptions={{padding:.06}} minZoom={.3} maxZoom={1.4} nodesDraggable={false} nodesConnectable={false} zoomOnScroll={false} panOnDrag proOptions={{hideAttribution:true}}><Background gap={20} size={1}/></ReactFlow></div>}</section>;
}
