import {PracticeTools} from './PracticeTools';
import {CheckpointActionBar} from './CheckpointActionBar';
import {CheckpointCodeWorkspace} from './CheckpointCodeWorkspace';
import { ArrowRight, Check,  CornerDownRight } from 'lucide-react';
import { useRef, useState } from 'react';
import { newQuoteAttempt, quotes, SAMPLE_NOW } from './create-model';
import { policyInsurance, practiceSteps, quoteInsurance } from './create-practice';
import { detailSample, makeSearchRequest, searchSamples, statusLabels } from './policy-model';
import { createNodes } from '../content/policy/flows';
import { excerptById } from '../content/policy/lesson';
import { PolicySourceExplorer } from './PolicySourceExplorer';
import { PolicyPracticeTrace } from './PolicyPracticeTrace';
import { PracticeSidePanel } from './PracticeSidePanel';
import { CheckpointVariables } from './CheckpointVariables';
import { executionSession, fieldCheckpoint, writeCheckpoint, flowCheckpoint } from './policy-execution';
import type { practiceContext } from './create-practice';
import type { ReadingMode, SourceLocation } from './source-reading';
import { sourceMethod, sourceTransition } from './source-reading';
import { usePolicyCodeTheme } from '../workshop/code-preferences';
import {LearningSteps} from '../components/LearningSteps';
import { useCheckpointToolbar } from './use-checkpoint-toolbar';
import './policy-practice.css';
import './policy-practice-workbench.css';

type Changes=Record<string,string|null>;
type Props={params:URLSearchParams;node:string;update:(changes:Changes)=>void;openNode:(id:string)=>void;toList:()=>void;openRead:(group:'list'|'detail')=>void};
export function Json({label,value}:{label:string;value:unknown}) {return <div className="policy-json"><strong>{label}</strong><pre>{JSON.stringify(value,null,2)}</pre></div>;}
const money=(amount:number)=>`${amount.toLocaleString('vi-VN')} VND`;

export function CreatePolicyLesson({params,node,update:changeParams,toList,openRead}:Props) {
  const session=executionSession(params,node);
  const ctx=session.context;
  const {quote,policy,level,hasRequest,backendOpen,commandReady,viewReady,failed}=ctx;
  const index=practiceSteps.findIndex(step=>step.id===node),step=practiceSteps[index];
  const sourceRoot=useRef<HTMLDivElement>(null);
  const toolbar=useCheckpointToolbar(sourceRoot);
  const [codeTheme]=usePolicyCodeTheme();
  const [hint,setHint]=useState('');
  const [sidePanel,setSidePanel]=useState<'network'|'trace'|null>(null);
  const [variablesCollapsed,setVariablesCollapsed]=useState(false);
  const lesson=createNodes.find(n=>n.id===node)!;
  const allowed=(id:string)=>session.navigation.openStages[practiceSteps.findIndex(s=>s.id===id)];
  function reveal(){requestAnimationFrame(()=>requestAnimationFrame(()=>{
    const root=sourceRoot.current;
    if(root&&toolbar.pinned){
      const top=parseFloat(getComputedStyle(root.querySelector('.practice-workbench-toolbar')!).top)||0;
      window.scrollTo({top:window.scrollY+root.getBoundingClientRect().top-top+1,behavior:'instant'});
      return;
    }
    const target=window.matchMedia('(max-width:720px)').matches?root?.querySelector('.practice-reader-pane'):root;
    target?.scrollIntoView({block:'start',behavior:'instant'});
  }));}
  function move(id:string,execute:string[]=[],enter=false,extra:Changes={}, {keepPanelOpen=false}:{keepPanelOpen?:boolean}={}) {
    const target=session.byId.get(id);if(!target)return;
    const nextParams=new URLSearchParams(params);
    nextParams.set('walk',[...new Set([...session.done,...execute])].join(','));
    nextParams.set('stop',execute.length||enter?id:session.stop.id);nextParams.set('at',id);nextParams.set('node',target.stage);
    for(const [key,value] of Object.entries(extra))value===null?nextParams.delete(key):nextParams.set(key,value);
    const next=executionSession(nextParams,target.stage);
    const origin=(execute.length||enter)&&target.caller?target.caller:{ref:params.get('ref')??session.view.ref,line:Number(params.get('viewLine')??session.view.line)};
    const originPoint=session.all.find(c=>c.ref===origin.ref&&c.line===origin.line)??session.view;
    const sameFile=excerptById[origin.ref]?.path===excerptById[target.ref].path;
    const bridge=sameFile&&target.stage!==session.view.stage;
    changeParams({...next.persist(),node:target.stage,ref:null,viewLine:null,readAnchor:null,traceFrom:origin.ref,traceLine:String(origin.line),tracePoint:originPoint.id,traceVia:target.via??null,caller:null,reader:bridge?'context':readMode,follow:crypto.randomUUID(),...extra});
    setHint('');
    if(!keepPanelOpen){setSidePanel(null);reveal();}
  }
  function goto(id:string){
    if(!allowed(id)){setHint(`Cần hoàn tất bước trước: ${practiceSteps.find(s=>s.id===id)?.title}`);return;}
    const entry=session.all.find(c=>c.stage===id)!;
    const isNext=session.next?.id===entry.id&&session.stop.stage!==id;
    move(entry.id,[],isNext);
  }
  function runRead(kind:'query'|'detail'){
    if(!ctx.complete[4])return;
    const id=kind==='query'?'result-request':'detail-request';move(id,session.next?.id===id?[id]:[],false,{readSource:kind});
  }
  function update(changes:Changes){
    if(changes.field&&fieldCheckpoint[changes.field]){move(fieldCheckpoint[changes.field],[],false,{field:changes.field});return;}
    if(changes.writePoint&&writeCheckpoint[changes.writePoint]){move(writeCheckpoint[changes.writePoint]);return;}
    if(changes.flowPoint&&flowCheckpoint[changes.flowPoint]){move(flowCheckpoint[changes.flowPoint]);return;}
    if(changes.resultDetail){runRead('detail');return;}
    changeParams(changes);
  }
  function chooseQuote(id:string){changeParams({...newQuoteAttempt(id),walk:null,stop:null,at:null});setSidePanel(null);}
  const command={quoteId:quote.id,quoteCode:quote.quoteCode,policyType:quote.quoteType,customerName:quote.customerModel.name,effectiveDate:quote.effectiveDate,expirationDate:quote.expirationDate,insuranceTotalAmount:quote.insuranceTotalAmount,status:policy.status,policyCode:policy.policyCode,syncStatus:0,createdDate:SAMPLE_NOW};
  const fields=[
    {id:'customer',label:'Khách hàng',from:'Quote.customerModel.name',value:quote.customerModel.name,to:'command.customerName',ref:'create-customer',line:206,kind:'Lấy từ Quote',why:'customerModel.type=PERSONAL(0): fillMissingValue lấy name. Với tổ chức, source lấy organizationName.'},
    {id:'effective',label:'Ngày hiệu lực',from:'Quote.effectiveDate',value:quote.effectiveDate,to:'command.effectiveDate',ref:'create-data',line:90,kind:'Lấy từ Quote',why:'Đọc effectiveDate ở dòng 80, rồi gán vào command ở dòng 90.'},
    {id:'quoteId',label:'Quote ID',from:'Quote.id',value:quote.id,to:'command.quoteId',ref:'create-data',line:85,kind:'Lấy từ Quote',why:'Giữ liên kết tới báo giá đang phát hành; đây chưa phải Policy ID mới.'},
    {id:'type',label:'Loại Policy',from:'Quote.quoteType',value:quote.quoteType,to:'command.policyType',ref:'create-data',line:84,kind:'Lấy từ Quote',why:'Đổi tên trường khi gán; không lấy một policyType từ body request.'},
    {id:'status',label:'Trạng thái ban đầu',from:'now + effectiveDate + expirationDate',value:`${policy.status} · ${statusLabels[policy.status]}`,to:'command.status',ref:'create-status',line:195,kind:'Tính theo ngày',why:`getPolicyStatus dùng mốc cố định của bài ${SAMPLE_NOW}. Trạng thái ban đầu của Policy tách khỏi Quote.status và syncStatus.`},
    {id:'policyCode',label:'Mã hợp đồng',from:'generatePolicyCode(quoteAggregate)',value:policy.policyCode,to:'command.policyCode',ref:'create-data',line:103,kind:'Sinh mới',why:'Source sinh mã theo sản phẩm/năm/đơn vị/counter. S-DEMO là mã quy ước của Workshop, không chạy bộ sinh mã thật.'},
    {id:'sync',label:'Trạng thái Core',from:'SyncPolicyStatus.NOT_SYNC',value:'0 · NOT_SYNC',to:'command.syncStatus',ref:'create-data',line:104,kind:'Gán giá trị ban đầu',why:'Chưa đồng bộ Core. Ghi view trong bước 5 không tự đổi trường này thành SYNCED.'},
  ];
  const field=fields.find(f=>fieldCheckpoint[f.id]===session.view.id&&(session.view.id!=='map-command'||f.id===(params.get('field')??'quoteId')))??fields.find(f=>f.id===params.get('field'))??fields[0];
  const writes=[
    {id:'policy',label:'Lời gọi ghi Policy',ref:'create-data',line:115,to:115},
    {id:'apply',label:'Command → event → aggregate',ref:'create-apply',line:328,to:339},
    {id:'store',label:'Gắn ID và JPA save',ref:'store-save',line:122,to:126},
    {id:'insurance',label:'Ghi đối tượng POLICY',ref:'create-quote',line:240,to:256},
    {id:'quote',label:'Ghi liên kết trên Quote',ref:'create-quote',line:224,to:233},
    {id:'quote-apply',label:'Áp dụng Quote PUBLISHED',ref:'quote-apply',line:317,to:321},
  ];
  const write=writes.find(w=>w.id===params.get('writePoint'))??writes[0];
  const flowPoints=[{id:'event',label:'Event được tạo',ref:'create-apply',line:328,to:330},{id:'receive',label:'Flow nhận event',ref:'flow-create',line:24,to:27},{id:'view',label:'Đọc Command, ghi Policy View',ref:'flow-view',line:41,to:60}];
  const flowPoint=flowPoints.find(p=>p.id===params.get('flowPoint'))??flowPoints[0];

  const expected=session.view;
  const sourceId=params.get('ref')&&excerptById[params.get('ref')!]?params.get('ref')!:expected.ref;
  const displayed=excerptById[sourceId];
  const viewLine=params.has('viewLine')?Number(params.get('viewLine')):sourceId===expected.ref?expected.line:displayed.from;
  const hasSource=node!=='quote'||expected.id==='controller-call'||Boolean(params.get('ref'));
  const priorRef=params.get('traceFrom');
  const caller=priorRef&&excerptById[priorRef]?{ref:priorRef,line:Number(params.get('traceLine'))}:expected.caller;
  const priorPoint=session.byId.get(params.get('tracePoint')??'')??(caller?session.all.find(c=>c.ref===caller.ref&&c.line===caller.line):undefined);
  const currentMethod=sourceId===expected.ref&&viewLine>=expected.line&&viewLine<=(expected.to??expected.line)?expected.method:sourceMethod(sourceId,viewLine)??`${displayed.symbol} (snapshot chưa có đầu method)`;
  const callerMethod=caller?(priorPoint&&excerptById[priorPoint.ref].path===excerptById[caller.ref].path&&caller.line>=priorPoint.line&&caller.line<=(priorPoint.to??priorPoint.line)?priorPoint.method:sourceMethod(caller.ref,caller.line)??excerptById[caller.ref].symbol):undefined;
  const transition=expected.sourceKind?undefined:priorPoint?.sourceKind?{title:'Request → Controller',route:`POST /policy/create/{quoteId} → ${currentMethod}:L${viewLine}`}:
    caller?sourceTransition({...caller,method:callerMethod!},{ref:sourceId,line:viewLine,method:currentMethod},params.get('traceVia')??expected.via):undefined;
  const checkpoint=session.checkpoint;
  const searchInput={keyword:policy.policyCode,status:'all',pageNumber:0,pageSize:2};
  const search=searchSamples(searchInput,viewReady?[policy]:[]);
  const detail=detailSample(policy.id,commandReady?[policy]:[]);
  function revealSource(location:SourceLocation){inspect(location);}
  const readMode:ReadingMode=params.get('reader')==='context'||params.get('reader')==='file'?'context':'related';
  function inspect(location:SourceLocation){
    const candidates=session.all.filter(c=>excerptById[c.ref].path===excerptById[location.ref].path&&location.line>=c.line&&location.line<=(c.to??c.line));
    const target=candidates.find(c=>c.id===session.view.id)??candidates.find(c=>session.done.has(c.id))??candidates[0];
    if(target){move(target.id);if(location.line!==target.line)requestAnimationFrame(()=>changeParams({viewLine:String(location.line)}));}
    else{changeParams({...session.persist(),ref:location.ref,viewLine:String(location.line),readAnchor:null,follow:crypto.randomUUID()});setSidePanel(null);reveal();}
  }
  function returnToExecution(){move(session.stop.id);}
  function inspectTrace(id:string,line?:number){move(id,[],false,line?{viewLine:String(line)}:{},{keepPanelOpen:true});}
  function showCurrentSource(){changeParams({readAnchor:null,follow:crypto.randomUUID()});reveal();}
  function showCaller(){if(caller)inspect(caller);else setSidePanel('network');}
  function marks(){
    const same=(ref:string)=>excerptById[ref].path===displayed.path;
    return {executed:session.all.filter(c=>!c.sourceKind&&session.done.has(c.id)&&same(c.ref)).flatMap(c=>Array.from({length:(c.to??c.line)-c.line+1},(_,i)=>c.line+i)),
      current:!session.stop.sourceKind&&same(session.stop.ref)?[session.stop.error?session.stop.to??session.stop.line:session.stop.line]:[],
      upcoming:session.next&&!session.next.sourceKind&&same(session.next.ref)?[session.next.line]:[],viewing:[viewLine]};
  }
  const guidedNodes=createNodes.map(n=>({...n,links:n.links?.filter(link=>!link.step||allowed(link.step))}));
  function source(){return <PolicySourceExplorer sourceId={sourceId} contextKey="create:practice" nodes={guidedNodes} activeNode={node} onNode={goto} onSource={id=>inspect({ref:id,line:excerptById[id].from})} showSteps={false} focus={{from:viewLine,to:params.has('viewLine')?viewLine:expected.to??viewLine}} reading={{mode:readMode,onMode:(mode,line)=>inspectReading(mode,line),anchor:params.has('readAnchor')?Number(params.get('readAnchor')):undefined,caller,callerMethod,currentMethod,onCurrent:showCurrentSource,onCaller:showCaller,onLine:line=>inspect({ref:sourceId,line}),marks:marks(),revealRequest:params.get('follow')??undefined,treeOpen:params.get('tree')==='1',onTree:()=>changeParams({tree:params.get('tree')==='1'?null:'1'})}}/>;}
  function inspectReading(mode:ReadingMode,line:number){
    // Keep the logical checkpoint (and its variables) aligned with the viewed code.
    // The scroll anchor is separate from the selected checkpoint line.
    changeParams({reader:mode,follow:crypto.randomUUID(),readAnchor:String(line)});
  }
  function pointAfter(){
    const nav=session.navigation;if(!nav.nextPoint)return;
    if(!nav.executeNext){move(nav.nextPoint);return;}
    if(nav.nextPoint==='quote-ui'){move('quote-request',['quote-ui','quote-request']);return;}
    move(nav.nextPoint,[nav.nextPoint]);
  }
  function nextAction(){
    const nav=session.navigation,target=nav.nextPoint?session.byId.get(nav.nextPoint):undefined;
    if(target)return nav.executeNext?`${target.action??target.title}${target.sourceKind?'':` tại L${target.line}`}`:`Xem lại ${target.title} · ${target.method}:L${target.line}`;
    if(nav.nextStage){const entry=session.all.find(c=>c.stage===nav.nextStage)!;return `Sang bước ${index+2} · ${entry.title} tại L${entry.line}`;}
    return failed?ctx.error:nav.stageReason;
  }
  function station(){
    const nav=session.navigation;
    const stoppedLine=session.stop.error?session.stop.to??session.stop.line:session.stop.line;
    const reviewing=expected.id!==session.stop.id||viewLine!==stoppedLine;
    return <div ref={sourceRoot} className={`policy-practice-station ${hasSource?'has-code':'no-code'}`} data-testid="practice-workstation" data-tree={params.get('tree')==='1'?'open':'closed'} data-checkpoint-id={expected.id} data-reviewing={reviewing} data-code-theme={codeTheme}>
      <div ref={toolbar.toolbar} className="practice-workbench-toolbar" data-pinned={toolbar.pinned} data-expanded={toolbar.expanded} data-error={failed}><section className="practice-checkpoint-heading" aria-label={`Checkpoint bước ${index+1}`} data-testid="policy-debug" data-checkpoint-id={expected.id} data-cursor={node==='validate'?ctx.cursor:undefined}>
        <CheckpointActionBar title={<>{failed&&"Lỗi · "}{checkpoint.title}</>} titleHint={checkpoint.title} viewingTitle={checkpoint.viewing} reviewing={reviewing}
          viewing={<><span className="checkpoint-method">{expected.sourceKind?expected.method:currentMethod+':'}</span>{!expected.sourceKind&&`L${viewLine}`}</>}
          stoppedTitle={checkpoint.achieved} stopped={<><span className="checkpoint-method">{session.stop.sourceKind?session.stop.method:session.stop.method+':'}</span>{!session.stop.sourceKind&&`L${stoppedLine}`}</>}
          previousStep={nav.previousStage?()=>move(session.all.find(c=>c.stage===nav.previousStage)!.id):undefined} previousPoint={nav.previousPoint?()=>move(nav.previousPoint!):undefined}
          nextPoint={nav.nextPoint?pointAfter:undefined} nextStep={nav.nextStage?()=>goto(nav.nextStage!):undefined} nextStepPrimary={!nav.nextPoint&&Boolean(nav.nextStage)} expanded={toolbar.expanded} onToggle={toolbar.toggle}/>
        <div id="checkpoint-details" className="checkpoint-details" data-testid="checkpoint-details" hidden={!toolbar.expanded}>
        <div className="checkpoint-kicker">Dữ liệu bước {index+1} · {step.title}<span>Debug mô phỏng</span></div><p className="checkpoint-description">{checkpoint.purpose}</p>
        <div className="checkpoint-progress" data-testid="checkpoint-progress"><strong className="checkpoint-stop"><span aria-hidden="true">◆</span> Điểm đang dừng: <code>{checkpoint.achieved}</code></strong><label>Điểm đang xem<select aria-label="Điểm đang xem" value={expected.id} onChange={e=>move(e.target.value)}>{session.stage.map((c,i)=><option key={c.id} value={c.id}>{i+1}/{session.stage.length} · {c.sourceKind?c.method:`${c.method}:L${c.line}`} · {c.title}{session.done.has(c.id)?' ✓':''}</option>)}</select></label><span>{session.done.size}/{session.all.length} checkpoint đã qua · {checkpoint.status}</span></div>
        <div className="practice-source-handoff" data-testid="source-handoff"><div><p><strong>{transition?.title??(expected.sourceKind?checkpoint.viewing:`${expected.method}:L${viewLine}`)}</strong></p>{transition&&<p>{transition.route}</p>}<small>{reviewing?'Đang xem lại / đọc source · giữ nguyên điểm dừng mô phỏng.':session.stopReached?'Checkpoint này đã chạy.':'Dừng trước khi chạy checkpoint này.'}</small></div>{reviewing&&<div className="practice-source-return"><button type="button" onClick={returnToExecution}>Quay về dòng đang chạy</button></div>}</div>
        <div className={`checkpoint-branch ${failed?'is-blocked':''}`} data-testid="debug-branch"><CornerDownRight size={15}/><div><p><strong>Thao tác tiếp theo</strong> · {nextAction()}</p><p className="practice-disabled-reasons">{!nav.nextPoint&&<span id="point-next-reason">Điểm sau: {nav.pointReason}.</span>}{!nav.nextStage&&<span id="stage-next-reason">Bước sau: {nav.stageReason}.</span>}</p></div></div>
        {expected.error&&session.done.has(expected.id)&&<div className="policy-branch-result" data-testid="create-failure"><strong>ServiceException · {expected.error}</strong><span> Dừng ở L{expected.to??expected.line}. Chưa tạo Policy.</span><button type="button" className="button secondary" onClick={()=>chooseQuote(quotes[0].id)}>Đổi sang Quote hợp lệ để thử lại</button></div>}
        </div>
      </section></div>
      <PracticeTools current={sidePanel} onSelect={setSidePanel}/>
      <div className="practice-workspace-split">{hint&&<p className="practice-navigation-hint" role="status">{hint}</p>}<div className="practice-main-pane"><div className="practice-station-body"><CheckpointCodeWorkspace checkpointId={expected.id} collapsed={variablesCollapsed} reader={hasSource?source():<div className="checkpoint-ui-input">Quote đang mở: <strong>{quote.id}</strong><p>UI → POST /policy/create/{'{quoteId}'} → Controller L45.</p></div>} variables={<CheckpointVariables view={checkpoint} collapsed={variablesCollapsed} onToggle={()=>setVariablesCollapsed(!variablesCollapsed)} checkpointKey={`${expected.id}:${session.done.has(expected.id)}`}/>}/>{node!=='validate'&&<section className="practice-context-pane" aria-label={`Nội dung bước ${index+1}`} data-testid="practice-step-data">{panel()}</section>}</div></div></div>
      <PracticeSidePanel kind={sidePanel} onClose={()=>setSidePanel(null)}><div className="practice-network-panel" hidden={sidePanel!=='network'}>{hasRequest?<SimulatedNetwork params={session.effective} context={ctx} expanded/>:<p>Chưa gửi request.</p>}</div>{sidePanel==='trace'&&<PolicyPracticeTrace session={session} onInspect={inspectTrace} onStop={()=>inspectTrace(session.stop.id)}/>}</PracticeSidePanel>
    </div>;
  }
  function prerequisite(id:string){return <div className="policy-prerequisite" role="status"><strong>Cần hoàn tất thao tác trước</strong><p>Link giữ đúng bước đang xem. Hoàn tất {practiceSteps.find(s=>s.id===id)?.title} để có dữ liệu nhất quán; chưa thực hiện bước ghi nào.</p><></></div>;}
  function panel(){return <>
    <section className="policy-create-lab" aria-label="Thực hành tạo Policy">
      {node==='quote'&&<>
        <article className="policy-quote-screen" aria-label="Chi tiết báo giá mô phỏng" data-testid="quote-detail-screen"><header><div><small>MÀN MÔ PHỎNG · CHI TIẾT BÁO GIÁ</small><h3>{quote.quoteCode||'Báo giá không còn ở backend mẫu'}</h3></div><span className="policy-sample-label">Quote có trước request</span></header>
          {quote.missing&&<p className="policy-stale-quote">Màn mô phỏng còn giữ ID cũ <code>{quote.id}</code>. Backend mẫu không còn Quote này; các trường chưa biết để trống. Dùng case này để quan sát QUOTE_NOT_EXIST.</p>}
          <dl><div><dt>Khách hàng</dt><dd>{quote.customerModel.name||'—'}</dd></div><div><dt>Phí bảo hiểm</dt><dd>{quote.missing?'—':money(quote.insuranceTotalAmount)}</dd></div><div><dt>Hiệu lực</dt><dd>{quote.effectiveDate||'—'}</dd></div><div><dt>Hết hạn</dt><dd>{quote.expirationDate||'—'}</dd></div><div><dt>quoteId đang mở</dt><dd data-testid="practice-quote-id">{quote.id}</dd></div><div><dt>Dữ liệu liên quan</dt><dd>{quote.missing?'Chưa có dữ liệu':`Loại báo giá ${quote.quoteType} · ${quoteInsurance(quote).length} đối tượng QUOTE mẫu`}</dd></div></dl>
          <details><summary>Xem dữ liệu mẫu</summary><Json label="QUOTE · dữ liệu mẫu có trước request" value={quote.missing?null:{id:quote.id,quoteCode:quote.quoteCode,quoteType:quote.quoteType,customerModel:quote.customerModel,effectiveDate:quote.effectiveDate,expirationDate:quote.expirationDate,insuranceTotalAmount:quote.insuranceTotalAmount}}/><Json label="ĐỐI TƯỢNG QUOTE MẪU" value={quoteInsurance(quote)}/></details>
          <div className="actions"><></>{hasRequest&&!backendOpen&&<></>}{backendOpen&&<></>}</div>
          <p className="policy-caption">Màn chi tiết và nút phát hành là UI học tập; chưa xác nhận frontend nghiệp vụ của agent-system. Chỉ mô phỏng đường API backend đã đối chiếu.</p>
        </article>
        {backendOpen&&<><p className="policy-source-intro">Request tới <strong>PolicyController.createPolicy</strong>. Dòng 45 gọi <code>CreatePolicyFunc.exec(quoteId)</code>; bấm lời gọi để sang bước 2.</p></>}
      </>}
      {node==='map'&&(level<1?prerequisite(hasRequest?'validate':'quote'):<>
        <div className="policy-field-picker" role="group" aria-label="Chọn trường theo dõi">{fields.map(item=><button type="button" key={item.id} aria-pressed={field.id===item.id} onClick={()=>update({field:item.id,ref:item.ref})}>{item.label}</button>)}</div>
        <div className="policy-mapping-trace" data-testid="mapping-trace"><div><small>{field.kind}</small><code>{field.from}</code><strong>{field.value}</strong></div><ArrowRight size={22}/><div><small>DÒNG ÁNH XẠ · {excerptById[field.ref].symbol}:{field.line}</small><code>{excerptById[field.ref].rows.find(r=>r.line===field.line)?.text.trim()}</code><button type="button" className="policy-mapping-source-link" onClick={()=>revealSource({ref:field.ref,line:field.line})}>Mở dòng Java L{field.line} ↗</button></div><ArrowRight size={22}/><div><small>CREATEPOLICYCOMMAND</small><code>{field.to}</code><strong>{field.value}</strong></div></div><p className="policy-caption">{field.why}</p>
        <div className="policy-command-preview" data-testid="quote-policy-mapping"><h3>Policy sắp ghi · bản xem trước từ command</h3><p>{quote.customerModel.name} · {quote.effectiveDate} · {money(policy.insuranceTotalAmount)}</p><p><code>{policy.status}</code> · {statusLabels[policy.status]} · quoteId: <code>{quote.id}</code></p><p>Policy ID sẽ được sinh khi ghi, khác quoteId. Mã S-DEMO là quy ước mẫu; không chạy bộ sinh mã thật.</p><details><summary>Xem CreatePolicyCommand mẫu</summary><Json label="CREATEPOLICYCOMMAND · rút gọn, chưa có Policy ID" value={command}/></details><></></div>
      </>)}
      {node==='save'&&(level<2?prerequisite(level<1?'validate':'map'):<>
        <div className="policy-write-intro"><p><code>save(CreatePolicyCommand)</code> tạo Policy trước; sau đó tạo đối tượng POLICY, có lời gọi gửi chứng nhận, rồi cập nhật liên kết trên Quote. Bài mô phỏng các điểm ghi, không chạy email/SMS.</p><></>{commandReady&&<strong className="policy-command-done"><Check size={17}/>Command đã hoàn tất · {policy.id}</strong>}</div>
        <div className="policy-source-stops" role="group" aria-label="Các điểm ghi đã đối chiếu">{writes.map(item=><button type="button" key={item.id} aria-pressed={write.id===item.id} onClick={()=>update({writePoint:item.id,ref:item.ref})}>{item.label}</button>)}</div>
        {commandReady&&<><div className="policy-written-records" data-testid="command-written"><article><small>POLICY_AGGREGATE</small><h3>Policy mới</h3><code>{policy.id}</code><p>{policy.policyCode} · {policy.customerName}</p><p>quoteId: <code>{quote.id}</code></p><p>Policy.status={policy.status} · syncStatus=0</p></article><article><small>INSURANCE_OBJECT_AGGREGATE</small><h3>Đối tượng bảo hiểm mới</h3><code>INS-{policy.id}</code><p>objectType=POLICY</p><p>entityId=<code>{policy.id}</code></p><p>secondEntityId=<code>{quote.id}</code></p><p>secondInsuranceId=<code>INS-{quote.id}</code></p></article><article><small>QUOTE_AGGREGATE · CẬP NHẬT</small><h3>Liên kết lại báo giá</h3><code>{quote.id}</code><p>Quote.status=PUBLISHED(9)</p><p>policyId=<code>{policy.id}</code></p><p>policyCode={policy.policyCode}</p><p>canReleasePolicy=false · hasReleasedPolicy=true</p></article></div><details><summary>Xem dữ liệu đã ghi mô phỏng</summary><Json label="POLICY · COMMAND" value={policy}/><Json label="ĐỐI TƯỢNG POLICY" value={policyInsurance(quote,policy)}/></details><div className="actions"><></><button type="button" className="button secondary" onClick={()=>openRead('detail')}>Mở Chi tiết ngay bằng Policy ID</button></div></>}
      </>)}
      {node==='flow'&&(!commandReady?prerequisite('save'):<>
        <p className="policy-checkpoint-note">Hai checkpoint của bài mô phỏng, không khẳng định HTTP response tới trước hay sau event ở runtime. Command có Policy ID; Query chỉ tìm thấy khi view đã được ghi và thỏa bộ lọc/phạm vi.</p>
        <div className="policy-view-checkpoints" aria-label="Trước và sau khi ghi view"><article><small>CHECKPOINT 1 · COMMAND VỪA TẠO</small><h3>Command có ID, danh sách chưa có dòng</h3><code>{policy.id}</code><p>Query view chưa được xử lý trong mô phỏng tại checkpoint này.</p><button type="button" className="button secondary" onClick={()=>update({flowSearched:'1'})}>Xem danh sách trước khi Flow ghi view</button>{params.get('flowSearched')==='1'&&<div data-testid="query-before-view"><code>POST /policy/search</code><p>keyword={policy.policyCode} · status=all · DV-A</p><strong>0 hợp đồng · view chưa có bản ghi này</strong></div>}</article><article><small>CHECKPOINT 2 · FLOW GHI VIEW</small><h3>{viewReady?'Đã có Policy View cùng ID':'Chờ xử lý event trong bài'}</h3><p>Event → Flow → đọc lại Command → ghi view → queue thông báo realtime.</p><></>{viewReady&&<div data-testid="query-after-view"><code>{policy.id}</code><p>{policy.policyCode} · {policy.customerName}</p><strong>{search.totalElements} hợp đồng · cùng policyId</strong></div>}</article></div>
        <div className="policy-source-stops" role="group" aria-label="Event và Flow"><span>CreatePolicyEvent →</span>{flowPoints.map(item=><button type="button" key={item.id} aria-pressed={flowPoint.id===item.id} onClick={()=>update({flowPoint:item.id,ref:item.ref})}>{item.label}</button>)}</div><p className="policy-caption">PolicyWorkflow.createPolicy nhận entityId; PolicySyncViewFunc đưa việc vào executor, đọc Command ở dòng 41, save view ở dòng 56 rồi gửi thông báo /topic/sync-policy-view/{'{id}'}. Core vẫn là đường riêng, chưa mô phỏng đồng bộ.</p>{viewReady&&<></>}
      </>)}
      {node==='result'&&(!commandReady?prerequisite('save'):<>
        <div className="policy-result-success" data-testid="created-policy-result"><Check size={21}/><div><strong>{policy.id}</strong><p>{policy.policyCode} · {policy.customerName} · {statusLabels[policy.status]}</p></div></div>
        <div className="policy-result-readers"><article><small>QUERY · ĐỌC POLICY VIEW</small><h3>Tìm Policy vừa tạo</h3><p><code>POST /policy/search</code></p><p>Tìm theo mã <code>{policy.policyCode}</code>, status=all, phạm vi mẫu DV-A.</p><></>{params.get('resultSearch')==='1'&&<div data-testid="created-search"><p>{search.totalElements} hợp đồng</p>{search.content.map(item=><div key={item.id} className="policy-result-row"><code>{item.id}</code><span>{item.policyCode} · {item.customerName}</span><button type="button" className="button secondary" onClick={()=>update({resultDetail:'list',readSource:'detail',ref:null})}>Mở chi tiết từ kết quả</button></div>)}{!viewReady&&<p>Command đã có Policy, view chưa ghi. Quay lại bước 5 hoặc mở Chi tiết bằng ID.</p>}<details><summary>Xem request Query mẫu</summary><Json label="POST /policy/search · request mẫu" value={makeSearchRequest(searchInput)}/></details></div>}</article>
        <article><small>COMMAND · ĐỌC AGGREGATE THEO ID</small><h3>Mở trực tiếp bằng policyId</h3><p><code>GET /policy/{policy.id}</code></p><p>Không cần qua Danh sách. FindPolicyByIdFunc đọc Policy và ghép đối tượng, thanh toán từ Command.</p><button type="button" className="button secondary" onClick={()=>update({resultDetail:'id',readSource:'detail',ref:null})}>Mở chi tiết theo ID</button>{params.has('resultDetail')&&detail&&<div className="policy-created-detail" data-testid="created-direct-detail"><small>{params.get('resultDetail')==='id'?'Mở trực tiếp theo ID':'ID lấy từ kết quả Query'}</small><code>{detail.id}</code><h4>{detail.policyCode} · {detail.customerName}</h4><p>{money(policy.insuranceTotalAmount)} · {detail.insuredObjects.length} đối tượng POLICY mẫu</p><strong>Cùng policyId đã ghi ở bước 4</strong></div>}</article></div>
        <div className="actions"><button type="button" className="button secondary" disabled={!viewReady} onClick={toList}>Mở bài Danh sách với Policy vừa tạo</button><button type="button" className="button secondary" onClick={()=>openRead('detail')}>Mở bài Chi tiết với ID này</button>{params.get('resultSearch')==='1'&&params.has('resultDetail')&&viewReady&&<></>}</div>
      </>)}
    </section>
  </>;}
  return <div className="policy-practice" data-testid="policy-practice">
    <div className="policy-practice-title"><div><span className="eyebrow">THỰC HÀNH / TẠO POLICY</span><h2>Bước {index+1}/6 · {step.title}</h2><p>{checkpoint.title}</p></div><div className="notebook-practice-intent"><small>THAO TÁC TIẾP THEO</small><p>{nextAction()}</p></div></div>
    <div className="practice-stepper-shell">
    <LearningSteps className="policy-practice-steps" label="Sáu bước phát hành trực tiếp" current={node} items={practiceSteps.map((item,i)=>({id:item.id,title:item.title,complete:ctx.complete[i],disabled:!allowed(item.id),hint:!allowed(item.id)?'Cần hoàn tất các checkpoint bắt buộc của bước trước':undefined}))} onSelect={goto}/>
    <nav className="practice-previous-step" aria-label="Điều hướng bước đang thao tác">{index>0?<button type="button" onClick={()=>goto(practiceSteps[index-1].id)} disabled={!allowed(practiceSteps[index-1].id)}>← Bước {index} · {practiceSteps[index-1].title}</button>:<span>Điểm bắt đầu · Quote đã có</span>}</nav>
    </div>
    <div className="policy-practice-context"><label>Quote mẫu<select aria-label="Quote mẫu" value={quote.id} onChange={e=>chooseQuote(e.target.value)}>{quotes.map(q=><option key={q.id} value={q.id}>{q.missing?'Quote không tồn tại · ID cũ':q.blocked?'Policy trùng · Quote đã có Policy RUNNING':q.label}</option>)}</select></label><p><strong>Phát hành trực tiếp</strong><span>Workshop · UI / Network / debug mô phỏng</span></p><small>Mốc ngày cố định<br/><code>{SAMPLE_NOW}</code></small></div>
    {station()}

    {(backendOpen||node!=='quote')&&<details className="policy-practice-guide"><summary>Hướng dẫn đọc file và kiểm tra trước khi đi tiếp</summary><dl><dt>Tôi cần làm gì?</dt><dd>{step.action}</dd><dt>Vì sao cần file này?</dt><dd>{lesson.why}</dd><dt>Nó nhận gì, gọi ai hoặc trả gì?</dt><dd>{lesson.contract}</dd><dt>Kiểm tra gì trước khi sang bước sau?</dt><dd>{lesson.check}</dd></dl></details>}
    <p className="policy-practice-boundary">Dữ liệu, request và kết quả đều mô phỏng. Không gọi backend; không mô phỏng email/SMS, cơ chế khóa, rollback hoặc bảo đảm giao event. Policy ID, mã và version là giá trị mẫu.</p>
  </div>;
}

function SimulatedNetwork({params,context,expanded}:{params:URLSearchParams;context:ReturnType<typeof practiceContext>;expanded:boolean}) {
  const {quote,policy,commandReady,failed,error}=context;
  const state=failed?'blocked':commandReady?'complete':'pending';
  return <details key={params.get('node')??'quote'} className="policy-simulated-network" open={expanded} data-testid="create-network" data-state={state}>
    <summary><span>NETWORK MÔ PHỎNG</span><code>POST /policy/create/{quote.id}</code><strong>{failed?'Bị chặn · ServiceException':commandReady?'Command hoàn tất':'Đang xử lý'}</strong></summary>
    <div className="policy-network-body"><div><h4>Request</h4><code>POST /policy/create/{quote.id}</code><p>quoteId lấy từ báo giá đang mở: <strong data-testid="network-quote-id">{quote.id}</strong></p><p>Request body: <strong>Trống · 0 byte, không có JSON body</strong></p></div><div role="status"><h4>Kết quả nhánh Command</h4>{failed?<><strong>{error}</strong><p>Dừng ở bước 2, CreatePolicyFunc.java:{quote.missing?63:77}. Chưa tạo Policy.</p><p>Đây là mã lỗi function đã xác nhận; không gán HTTP status chưa đo ở runtime.</p></>:commandReady?<><strong>Policy ID: {policy.id}</strong><p>Policy và đối tượng POLICY đã tạo; Quote liên kết về cùng ID. View và Core có mốc riêng.</p><details><summary>Xem kết quả trả về mẫu</summary><Json label="WrapResponse.ok · EntityWithIdAndVersion rút gọn" value={{success:true,data:{entityId:policy.id,aggregate:policy,version:'demo-event-version'}}}/></details></>:<><strong>Đang xử lý</strong><p>Chưa tới điểm trả kết quả Command trong bài; tiếp tục lần code. Không có thời gian chờ backend thật.</p></>}</div></div>
  </details>;
}
