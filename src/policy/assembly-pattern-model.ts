import sources from '../content/policy/assembly-source.json' with {type:'json'};
import type {Evidence,EvidenceKey,Handoff,LearningNode,Pattern} from '../content/policy/assembly-learning';
import type {CodeAnnotation} from '../workshop/CodeBlock';
import type {LearningPattern} from './learning-contracts';

export type SourceFocus={ref:EvidenceKey;annotations:CodeAnnotation[];symbol:string};
export type TraceSide={id:'A'|'B';label:string;focus:SourceFocus;code:string};
export type CooperationTrace={kind:'call'|'data'|'event';relation:string;caller:TraceSide;receiver:TraceSide;note?:string};
export type SourcePresentation={label:string;tone:CodeAnnotation['tone'];focus:SourceFocus;caption?:string};

export function methodEnd(ref:EvidenceKey,start:number) {
  let depth=0,entered=false;
  for(const row of sources[ref].rows.slice(start-1)) {
    const text=row.text.replace(/"(?:\\.|[^"\\])*"/g,'""').replace(/\/\/.*$/,'');
    for(const c of text){if(c==='{'){entered=true;depth++;}else if(c==='}')depth--;}
    if(entered&&depth===0||!entered&&text.trimEnd().endsWith(';'))return row.line;
  }
  return start;
}
function at(ref:EvidenceKey,text:string) {
  const row=sources[ref].rows.find(row=>row.text.includes(text));
  if(!row)throw Error(`Missing verified focus: ${ref}: ${text}`);
  return row.line;
}
function owner(ref:EvidenceKey,line:number) {
  const name=sources[ref].path.split('/').at(-1)!.replace(/\.(java|gradle)$/,'');
  const method=sources[ref].rows.slice(0,line).reverse().find(r=>/^\s*(public|private|protected)\s+(?!class|interface|abstract class).+\b\w+\s*\([^;]*\)\s*\{/.test(r.text));
  const match=method?.text.match(/\b(\w+)\s*\(/);
  return match?`${name}.${match[1]}`:name;
}
function point(ref:EvidenceKey,needle:string,expression?:string):SourceFocus {
  const start=at(ref,needle);
  if(expression&&!sources[ref].rows[start-1].text.includes(expression))throw Error(`Missing expression ${ref}:${start}: ${expression}`);
  return {ref,symbol:owner(ref,start),annotations:[{start,end:start,tone:'component',expression,label:expression??needle.trim()}]};
}
function declaration(ref:EvidenceKey,needle?:string):SourceFocus {
  return point(ref,needle??sources[ref].rows[sources[ref].line-1].text.trim());
}
function excerpt(focus:SourceFocus) {
  return focus.annotations.map(a=>a.expression??sources[focus.ref].rows.slice(a.start-1,a.end).map(r=>r.text.trim()).join('\n')).join('\n');
}
function pair(a:SourceFocus,b:SourceFocus,kind:CooperationTrace['kind']='call',note?:string):CooperationTrace {
  const caller={...a,annotations:a.annotations.map(x=>({...x,tone:'caller' as const}))};
  const receiver={...b,annotations:b.annotations.map(x=>({...x,tone:'receiver' as const}))};
  return {kind,relation:kind==='call'?'Lời gọi':kind==='event'?'Thông báo Event':'Bàn giao dữ liệu',
    caller:{id:'A',label:kind==='call'?'Bên gọi':kind==='event'?'Nơi tạo Event':'Nơi cung cấp',focus:caller,code:excerpt(caller)},
    receiver:{id:'B',label:kind==='call'?'Bên nhận':kind==='event'?'Handler nhận Event':'Nơi tiếp nhận',focus:receiver,code:excerpt(receiver)},note};
}

// Each pair is pinned to source text from the reviewed snapshot, never inferred from a route/name alone.
export function cooperationTrace(pattern:Pattern,edge:Handoff):CooperationTrace {
  const p=point,d=declaration;
  switch(`${pattern.id}:${edge.id}`) {
    case 'path:receive':{
      const trace=pair(p('controller','getBean(CreatePolicyFunc.class).exec(quoteId)','exec(quoteId)'),p('func','public EntityWithIdAndVersion<PolicyAggregate> exec(String quoteId)','exec(String quoteId)'));
      trace.caller.code='applicationContext.getBean(CreatePolicyFunc.class).exec(quoteId);';
      trace.receiver.code='public EntityWithIdAndVersion<PolicyAggregate> exec(String quoteId)';return trace;
    }
    case 'body:receive':{
      const trace=pair(p('quoteController','getBean(CreateQuoteFunc.class).exec(request)','exec(request)'),p('quoteFunc','public EntityWithIdAndVersion<QuoteAggregate> exec(CreateQuoteRequest request)','exec(CreateQuoteRequest request)'));
      trace.caller.code='applicationContext.getBean(CreateQuoteFunc.class).exec(request);';
      trace.receiver.code='public EntityWithIdAndVersion<QuoteAggregate> exec(CreateQuoteRequest request)';return trace;
    }
    case 'guard:read-quote':return pair(p('func','quoteRepository.findById(quoteId)','quoteRepository.findById(quoteId)'),d('quoteRepo'), 'call','findById được kế thừa từ JpaRepository. B là hợp đồng repository; chưa có source implementation do Spring Data cung cấp.');
    case 'guard:return-read':return pair(p('repo','List<PolicyAggregate> findAllByQuoteCodeAndStatusIn'),p('func','if (policyAggregateList.size() != 0)','policyAggregateList.size() != 0'),'data','Repository trả danh sách; guard nằm trong CreatePolicyFunc.runInternal.');
    case 'or-throw:read-quote':return pair(p('detail','policyRepository.findById(policyId)','policyRepository.findById(policyId)'),d('repo'),'call','findById dùng hợp đồng JpaRepository kế thừa; đây là mẫu đọc chi tiết tham khảo.');
    case 'or-throw:return-read':return pair(d('repo'),p('detail','policyRepository.findById(policyId)','orElseThrow(() -> new ServiceException(PlatformErrorCode.POLICY_NOT_EXIST))'),'data');
    case 'map-helper:map-source':return pair(p('prepare','CreatePolicyCommand command = MappingUtils.mapObject','MappingUtils.mapObject(quoteAggregate, CreatePolicyCommand.class)'),d('mapping'));
    case 'map-helper:calculate':return pair(p('prepare','command.setStatus(getPolicyStatus','getPolicyStatus(now, effectiveDate, expirationDate)'),d('status'),'call','Cạnh này còn có fillMissingValue ở L102 → L204: helper đó sửa cùng Command và trả void. Xem source bổ sung bên dưới.');
    case 'map-helper:command-ready':return pair(p('prepare','policyAggregateRepository.save(command)','command'),d('command'),'data','runInternal đã bổ sung dữ liệu rồi dùng cùng Command làm đầu vào save. Command là hợp đồng dữ liệu, không tự thực thi ghi.');
    case 'event-save:save-call':return pair(p('saveCall','policyAggregateRepository.save(command)','policyAggregateRepository.save(command)'),p('save','public EntityWithIdAndVersion<T> save(CT cmd)'),'call','Overload save(cmd) chuyển tiếp tới save(cmd, Optional.empty()). Bean Policy được xác minh ở PlatformConfig.');
    case 'event-save:process':return pair(p('save','aggregate.processCommand(cmd)','aggregate.processCommand(cmd)'),d('dispatch'),'call','processCommand dùng reflection để chọn process(CreatePolicyCommand) tại PolicyAggregate. Xem thêm dispatcher và Aggregate, không coi đây là lời gọi trực tiếp tới process từ Func.');
    case 'event-save:event-created':return pair(p('aggregate','CreatePolicyEvent event = MappingUtils.mapObject','MappingUtils.mapObject(cmd, CreatePolicyEvent.class)'),d('event'),'data','process tạo payload Event rồi trả List<Event>; Event là dữ liệu thay đổi.');
    case 'event-save:apply':return pair(p('save','Aggregates.applyEventsToMutableAggregate','Aggregates.applyEventsToMutableAggregate(aggregate, events, missingApplyEventMethodStrategy)'),d('applyLoop'),'call','Vòng lặp gọi applyEvent, dispatcher phản chiếu tới apply(CreatePolicyEvent). process không tự gọi apply.');
    case 'event-save:persist':return pair(p('save','aggregateStore.save(clasz','aggregateStore.save(clasz, events, transformSaveOptions(saveOptions, Optional.of(cmd), (BaseAggregate) aggregate))'),d('storeDelegate'),'call',edge.limit);
    case 'projection:delivery':return pair(p('aggregate','CreatePolicyEvent event = MappingUtils.mapObject'),d('workflow'),'event',edge.limit);
    case 'projection:sync-id':return pair(p('workflow','getBean(PolicySyncViewFunc.class).exec(de.getEntityId())','exec(de.getEntityId())'),p('sync','public void exec(String id)','exec(String id)'));
    case 'projection:write-view':return pair(p('sync','policyViewRepository.save(policyView)','policyViewRepository.save(policyView)'),d('viewRepository'),'call','B là interface JpaRepository của view; implementation ghi do Spring Data cung cấp. SyncView đọc lại model và bổ sung searchingKey/mapPayment trước khi gọi save.');
    case 'list:query-request':return pair(p('queryController','getBean(SearchPolicyFunc.class).exec(request)','exec(request)'),p('search','public Page<PolicyListResponse> exec(SearchPolicyRequest request)','exec(SearchPolicyRequest request)'));
    case 'list:query-view':return pair(p('search','queryCustomRepository.executeCustomSqlQuery(query','queryCustomRepository.executeCustomSqlQuery(query, PolicyViewEntity.class, pageable)'),d('queryRepository'));
    case 'detail:query-request':return pair(p('detailEndpoint','getBean(FindPolicyByIdFunc.class).exec(id)','exec(id)'),p('detail','public PolicyDetailResponse exec(String policyId)','exec(String policyId)'));
    case 'detail:query-view':return pair(p('detail','policyRepository.findById(policyId)','policyRepository.findById(policyId)'),d('repo'),'call','findById được kế thừa từ JpaRepository. Func dùng Policy ID và ghép dữ liệu chi tiết.');
    default:throw Error(`Unreviewed cooperation pair ${pattern.id}:${edge.id}`);
  }
}

export function componentFocus(evidence:Evidence):SourceFocus {
  const {ref}=evidence,source=sources[ref];
  if(ref==='baseController')return {ref,symbol:'BaseController · thành phần dùng chung',annotations:[
    {start:12,end:12,expression:'protected ApplicationContext applicationContext;',tone:'support',label:'Khai báo applicationContext'},
    {start:14,end:14,expression:'protected ExecutorService executorService;',tone:'support',label:'Khai báo executorService'},
  ]};
  const classLike=/\b(class|interface)\b/.test(source.rows[source.line-1].text);
  let start=evidence.from??source.line,end=evidence.to??(classLike?start:methodEnd(ref,start));
  if(!evidence.from&&!classLike)while(start>1&&/^\s*@/.test(source.rows[start-2].text))start--;
  if(ref==='aggregate'){start=328;end=340;}
  if(ref==='quoteAggregate'){start=276;end=289;}
  if(ref==='search'){start=38;end=120;}
  return {ref,symbol:owner(ref,source.line),annotations:[{start,end,tone:'component',label:classLike?'Khai báo thành phần liên quan':'Toàn nhóm lệnh tương ứng với mẫu'}]};
}
export function presentationForFocus(focus:SourceFocus,label:string):SourcePresentation {
  return {focus,label,tone:focus.annotations[0].tone,caption:focus.annotations.map(a=>`L${a.start}${a.end!==a.start?`–${a.end}`:''} · ${a.label}`).join(' · ')};
}

export function patternSelection<K extends string>(pattern:LearningPattern<K>,params:URLSearchParams,step:string) {
  const requested=params.get(`assemblyInspect.${step}`)??'';
  const node=pattern.nodes.find(n=>n.id===params.get(`assemblyComponent.${step}`))??pattern.nodes.find(n=>requested===`node:${n.id}`)??pattern.nodes[0];
  const edge=pattern.edges.find(e=>e.id===params.get(`assemblyEdge.${step}`))??pattern.edges.find(e=>requested===`edge:${e.id}`)??pattern.edges[0];
  const raw=params.get(`assemblyFrame.${step}`);
  const kind=raw==='component'||raw==='cooperation'?raw:requested.startsWith('node:')?'component':'cooperation';
  return {kind,node,edge,inspect:kind==='component'?`node:${node.id}`:`edge:${edge.id}`} as const;
}
export function selectPatternNode(step:string,id:string,keepEdge?:string) {return {...keepEdge?{[`assemblyEdge.${step}`]:keepEdge}:{},[`assemblyComponent.${step}`]:id,[`assemblyFrame.${step}`]:'component',[`assemblyInspect.${step}`]:`node:${id}`};}
export function selectPatternEdge(step:string,id:string,keepNode?:string) {return {...keepNode?{[`assemblyComponent.${step}`]:keepNode}:{},[`assemblyEdge.${step}`]:id,[`assemblyFrame.${step}`]:'cooperation',[`assemblyInspect.${step}`]:`edge:${id}`};}

export type DiagramFile={id:EvidenceKey;path:string;nodeIds:string[]};
export type DiagramNode={id:string;title:string;role:string;ref:EvidenceKey;componentId?:string};
export type DiagramRelation={id:string;from:string;to:string;kind:'call'|'data'|'event'|'inheritance'|'support';label:string;handoff?:Handoff;fromFocus?:SourceFocus;toFocus?:SourceFocus};
export function diagramModel(pattern:Pattern) {
  // Configuration proves the binding, but the node must open the implementation.
  // Likewise an Event node opens its payload type, not the Aggregate that creates it.
  const preferred:Partial<Record<string,EvidenceKey>>={mapping:'mapping',save:'save',event:'event',store:'storeDelegate'};
  const nodes:DiagramNode[]=pattern.nodes.map(n=>{
    const candidate=preferred[n.id];
    const ref=candidate&&(n.evidence.some(e=>e.ref===candidate)||pattern.edges.some(e=>cooperationTrace(pattern,e).receiver.focus.ref===candidate))?candidate:n.evidence[0].ref;
    return {id:n.id,title:sources[ref].path.split('/').at(-1)!.replace('.java',''),role:n.name,ref,componentId:n.id};
  });
  for(const node of nodes)if(nodes.some(n=>n.id!==node.id&&sources[n.ref].path===sources[node.ref].path))node.title+=` · ${node.role}`;
  const fileMap=new Map<string,DiagramFile>();
  const addFile=(ref:EvidenceKey,nodeId?:string)=>{
    const path=sources[ref].path,previous=fileMap.get(path);
    if(previous){if(nodeId&&!previous.nodeIds.includes(nodeId))previous.nodeIds.push(nodeId);return previous;}
    const item={id:ref,path,nodeIds:nodeId?[nodeId]:[]};fileMap.set(path,item);return item;
  };
  for(const n of pattern.nodes)for(const e of n.evidence)addFile(e.ref,n.id);
  for(const e of pattern.edges)for(const v of e.evidence)addFile(v.ref);
  for(const edge of pattern.edges){const trace=cooperationTrace(pattern,edge);addFile(trace.caller.focus.ref);addFile(trace.receiver.focus.ref);}
  const relations:DiagramRelation[]=pattern.edges.map(e=>({id:e.id,from:e.from,to:e.to,kind:cooperationTrace(pattern,e).kind,label:e.label,handoff:e}));
  // Only draw inheritance when the class declaration in this snapshot establishes it.
  const bases=[['BaseController','baseController'],['BaseFunc','base'],['BaseAggregate','aggregateBase']] as const;
  const inheritedClasses=new Set<string>();
  for(const node of [...nodes]) {
    const source=sources[node.ref];
    for(const [base,ref] of bases) {
      const line=source.rows.find(r=>new RegExp(`\\bextends\\s+${base}\\b`).test(r.text));if(!line)continue;
      const declarationKey=`${source.path}:${base}`;if(inheritedClasses.has(declarationKey))continue;inheritedClasses.add(declarationKey);
      const id=`support:${ref}`;if(!nodes.some(n=>n.id===id))nodes.push({id,title:base,role:'Lớp nền · hỗ trợ mẫu',ref});
      addFile(ref,id);
      const inherited=ref==='base'&&!source.rows.some(r=>r.text.includes('execInTransactionAndLock('))?point(ref,'public class BaseFunc'):componentFocus({ref});
      const toFocus:SourceFocus={...inherited,annotations:inherited.annotations.map(a=>({...a,tone:'support'}))};
      relations.push({id:`inherit:${node.id}:${ref}`,from:node.id,to:id,kind:'inheritance',label:base==='BaseController'?'Cấp applicationContext / executorService':`${base} · hỗ trợ mẫu`,
        fromFocus:{ref:node.ref,symbol:node.title,annotations:[{start:line.line,end:line.line,tone:'support',expression:`extends ${base}`,label:`Khai báo extends ${base}`}]},toFocus});
    }
  }
  for(const file of fileMap.values())if(!nodes.some(n=>sources[n.ref].path===file.path)) {
    const id=`source:${file.id}`;nodes.push({id,title:file.path.split('/').at(-1)!,role:'Source hỗ trợ · đối chiếu',ref:file.id});file.nodeIds.push(id);
    const related=pattern.nodes.find(n=>n.evidence.some(e=>sources[e.ref].path===file.path));
    if(related)relations.push({id:`support:${file.id}`,from:related.id,to:id,kind:'support',label:'Bằng chứng hỗ trợ mẫu',fromFocus:componentFocus(related.evidence[0]),toFocus:componentFocus({ref:file.id})});
  }
  return {nodes,relations,files:[...fileMap.values()]};
}

export function nodeFocus(node:LearningNode,ref?:EvidenceKey) {
  return componentFocus(node.evidence.find(e=>e.ref===ref)??node.evidence[0]);
}
