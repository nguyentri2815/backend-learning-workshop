import {beginnerRounds,beginnerRows} from '../content/policy/beginner-session';

export const beginnerFixture={now:'2026-11-13T03:00:00Z',quote:{id:'QUOTE-BEGINNER-101',quoteCode:'Q-DEMO-101',quoteType:1,customerName:'Nguyễn An',productCode:'AUTO',effectiveDate:'2026-11-01',expirationDate:'2027-11-01',currencyStr:'VND',exchangeRate:1,paymentInfo:[]},policyId:'POL-BEGINNER-101'};
export type TrialPoint={id:string;label:string;status:'passed'|'stopped'|'unwired'|'skipped';detail?:string;source?:{ref:string;from:number;to:number}};
export type TrialLane={id:string;label:string;points:TrialPoint[]};
export type BeginnerTrial={id:string;at:string;through:number;input:string;output:string;trace:string[];lanes:TrialLane[];furthest?:string;commands:number;events:number;writes:number;error?:string;policyId?:string;quoteId?:string;record?:Record<string,unknown>};
const index=(id:string)=>beginnerRounds.findIndex(r=>r.id===id);
const trials:Record<string,{at:string;input:string}>={
 'quote-valid':{at:'quote-trial',input:beginnerFixture.quote.id},
 'quote-missing':{at:'quote-trial',input:'QUOTE-BEGINNER-404'},
 duplicate:{at:'duplicate-trial',input:'QUOTE-BEGINNER-103'},
 success:{at:'verify',input:beginnerFixture.quote.id},
 'read-id':{at:'verify',input:beginnerFixture.policyId},
};
// An isolated in-memory fixture, never an HTTP/Java execution. Each run starts from its declared inputs.
export function runBeginnerTrial(id:string,through:number):BeginnerTrial|null{
 const spec=trials[id];if(!spec||!Number.isInteger(through)||through<index(spec.at)-1)return null;
 through=Math.min(through,beginnerRounds.length-1);
 const quoteStore=new Map([[beginnerFixture.quote.id,{...beginnerFixture.quote}],['QUOTE-BEGINNER-103',{...beginnerFixture.quote,id:'QUOTE-BEGINNER-103',quoteCode:'Q-DEMO-103'}]]);
 const policyStore=new Map<string,Record<string,unknown>>();
 const result:BeginnerTrial={id,...spec,through,output:'',trace:[],lanes:[],commands:0,events:0,writes:0};
 const text=(ref:string)=>beginnerRows(ref,through).map(r=>r.text).join('\n');
 const func=text('func'),aggregateCode=text('aggregate');
 const has=(ref:string,needle:string)=>text(ref).includes(needle);
 function point(id:string,label:string,ref?:string,needle?:string,detail?:string):TrialPoint{
  const rows=ref?beginnerRows(ref,through):[];
  const row=needle?rows.findIndex(r=>r.text.includes(needle)):-1;
  return {id,label,detail,status:'skipped',source:ref&&row>=0?{ref,from:rows[row].line!,to:Math.min(rows.length,rows[row].line!+2)}:undefined};
 }
 const entry=[point('url','URL mang quoteId',undefined,undefined,`POST /policy/create/${id==='read-id'?beginnerFixture.quote.id:spec.input}`),point('controller','Controller nhận Quote ID','controller','createPolicy('),point('exec','CreatePolicyFunc.exec','func','exec(String quoteId)'),point('read','QuoteRepository.findById','func','quoteRepository.findById')];
 const missing=[point('empty','Optional.empty','func','optional.isEmpty()'),point('missing-error','Dừng trong exec','func','QUOTE_NOT_EXIST','QUOTE_NOT_EXIST')];
 const continuation=[point('found','Quote tồn tại','func','optional.get()'),point('lock','Qua cơ chế khóa Quote','base','return lockService.lock(key, timeLock', 'execInTransactionAndLock → transaction → callback'),point('internal','runInternal','func','runInternal(QuoteAggregate'),point('duplicate-guard','Kiểm tra Policy cùng báo giá','func','policyRepository.findAllByQuoteCodeAndStatusIn'),point('command','Dựng Command','func','CreatePolicyCommand command ='),point('save','Gọi ghi Policy','func','policyAggregateRepository.save(command)'),point('process','Xử lý Command','aggregate','process(CreatePolicyCommand'),point('event','Tạo CreatePolicyEvent','aggregate','CreatePolicyEvent.class'),point('apply','Cập nhật Aggregate từ Event','aggregate','apply(CreatePolicyEvent'),point('store','Lưu bản ghi Policy','jdbcWrite','repo.save(options.getAggregate().get())'),point('result','Trả Policy ID','func','return saved;')];
 const wired:Record<string,boolean>={url:true,controller:has('controller','getBean(CreatePolicyFunc.class).exec(quoteId)'),exec:func.includes('exec(String quoteId)'),read:func.includes('quoteRepository.findById'),empty:func.includes('optional.isEmpty()'),'missing-error':func.includes('QUOTE_NOT_EXIST'),found:func.includes('optional.get()'),lock:func.includes('execInTransactionAndLock(')&&has('base','supplier.get()'),internal:func.includes('runInternal(QuoteAggregate'),'duplicate-guard':func.includes('policyRepository.findAllByQuoteCodeAndStatusIn'),command:func.includes('CreatePolicyCommand command =')&&has('command','class CreatePolicyCommand'),save:func.includes('policyAggregateRepository.save(command)')&&has('repositoryBean','policyAggregateRepository('),process:aggregateCode.includes('process(CreatePolicyCommand'),event:aggregateCode.includes('CreatePolicyEvent.class')&&has('event','class CreatePolicyEvent'),apply:aggregateCode.includes('apply(CreatePolicyEvent'),store:func.includes('policyAggregateRepository.save(command)')&&has('repositoryBean','policyAggregateRepository('),result:func.includes('return saved;')};
 result.lanes=[{id:'entry',label:'Nhận yêu cầu và đọc Quote',points:entry},{id:'missing',label:'Nhánh không tìm thấy Quote',points:missing},{id:'found',label:'Nhánh Quote tồn tại → xử lý và ghi',points:continuation.filter(p=>(p.id!=='duplicate-guard'||wired[p.id])&&(wired.save||continuation.indexOf(p)<=continuation.findIndex(point=>point.id==='save')))}];
 for(const lane of result.lanes)for(const p of lane.points)if(!wired[p.id])p.status='unwired';
 const pass=(p:TrialPoint)=>{p.status='passed';result.furthest=p.id;result.trace.push(p.label);};
 function finish(){return result;}
 for(const p of entry){if(!wired[p.id]){result.output='Đường nhận yêu cầu chưa nối đủ tại snapshot này.';return finish();}pass(p);}
 const quote=quoteStore.get(id==='read-id'?beginnerFixture.quote.id:spec.input);
 if(!quote){
  pass(missing[0]);pass(missing[1]);missing[1].status='stopped';result.error='QUOTE_NOT_EXIST';result.output='QUOTE_NOT_EXIST · không sinh Policy ID; 0 Command, 0 Event, 0 lần ghi.';return finish();
 }
 result.quoteId=quote.id;
 if(id==='duplicate')policyStore.set('POL-EXISTING-103',{quoteCode:'Q-DEMO-103',status:'RUNNING'});
 // Traverse only statements connected in this applied snapshot. Class declarations alone do not execute.
 for(const p of continuation){
  if(p.id==='duplicate-guard'&&!wired[p.id])continue;
  if(!wired[p.id]){result.output=`Quote tồn tại; đã tới ${result.furthest==='internal'?'runInternal':result.trace.at(-1)}. Phần tiếp theo chưa nối tại mốc này; chưa ghi Policy, chưa sinh ID.`;return finish();}
  pass(p);
  if(p.id==='duplicate-guard'&&[...policyStore.values()].some(existing=>existing.quoteCode===quote.quoteCode&&['NOT_RUNNING','RUNNING'].includes(String(existing.status)))){
   p.status='stopped';p.detail='QUOTE_CAN_NOT_RELEASE_POLICY';result.error=p.detail;result.output='QUOTE_CAN_NOT_RELEASE_POLICY · giữ POL-EXISTING-103; 0 bản ghi mới, không sinh ID.';return finish();
  }
  if(p.id==='command')result.commands++;
  if(p.id==='event')result.events++;
 }
 const command={customerName:quote.customerName,productCode:quote.productCode,effectiveDate:quote.effectiveDate,expirationDate:quote.expirationDate,quoteId:quote.id,quoteCode:quote.quoteCode,policyType:quote.quoteType,policyCode:'S-AUTO-DEMO-001',status:beginnerFixture.now.slice(0,10)<quote.effectiveDate?'NOT_RUNNING':beginnerFixture.now.slice(0,10)>quote.expirationDate?'EXPIRED':'RUNNING',syncStatus:'NOT_SYNC',paymentInfo:[...quote.paymentInfo]};
 // process(command) -> event; apply(event) -> aggregate; store allocates the new ID.
 const event={...command,type:'CreatePolicyEvent',createdEventTime:beginnerFixture.now};
 const {type:_,...state}=event;
 const aggregate={...state,id:beginnerFixture.policyId,version:1};
 policyStore.set(aggregate.id,aggregate);
 const saved=policyStore.get(aggregate.id)!;
 result.policyId=aggregate.id;result.record=saved;result.writes=1;
 result.output=`save trả Policy ID ${aggregate.id}, version=1; 1 bản ghi mới trong bộ nhớ fixture, quoteId=${saved.quoteId}.`;
 if(id==='read-id'){
  result.commands=0;result.events=0;result.writes=0;result.trace=['Nạp snapshot fixture của tình huống success','So khớp Policy ID với record.id, quoteId và version'];
  result.lanes=[{id:'compare',label:'Đối chiếu kết quả, không gọi API đọc Policy',points:[{id:'load',label:result.trace[0],status:'passed'},{id:'compare',label:result.trace[1],status:'passed'}]}];result.furthest='compare';
  result.output=`${aggregate.id} khớp kết quả save và bản ghi fixture; quoteId=${saved.quoteId}, version=${saved.version}.`;
 }
 return finish();
}
export const beginnerTrialLabels:Record<string,string>={'quote-valid':'Thử Quote hợp lệ','quote-missing':'Thử Quote không tồn tại',duplicate:'Thử Quote đã có Policy',success:'Chạy tình huống thành công','read-id':'Đối chiếu Policy ID với bản ghi'};
