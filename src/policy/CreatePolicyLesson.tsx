import { ArrowRight, Check, CornerDownRight } from 'lucide-react';
import { useRef, useState } from 'react';
import { newQuoteAttempt, phases, quotes, SAMPLE_NOW } from './create-model';
import type { CreatePhase } from './create-model';
import { policyInsurance, practiceContext, practiceSteps, quoteInsurance } from './create-practice';
import { detailSample, makeSearchRequest, searchSamples, statusLabels } from './policy-model';
import { createNodes } from '../content/policy/flows';
import { excerptById } from '../content/policy/lesson';
import { PolicySourceExplorer } from './PolicySourceExplorer';
import { PolicyPracticeTrace } from './PolicyPracticeTrace';
import type { ReadingMode, SourceLocation } from './source-reading';
import './policy-practice.css';
import './policy-practice-workbench.css';

type Changes=Record<string,string|null>;
type Props={params:URLSearchParams;node:string;update:(changes:Changes)=>void;openNode:(id:string)=>void;toList:()=>void;openRead:(group:'list'|'detail')=>void};
export function Json({label,value}:{label:string;value:unknown}) {return <div className="policy-json"><strong>{label}</strong><pre>{JSON.stringify(value,null,2)}</pre></div>;}
const money=(amount:number)=>`${amount.toLocaleString('vi-VN')} VND`;

export function CreatePolicyLesson({params,node,update:changeParams,openNode,toList,openRead}:Props) {
  function update(changes:Changes){changeParams(['field','writePoint','flowPoint','readSource'].some(key=>key in changes)?{viewLine:null,traceFrom:null,traceLine:null,traceVia:null,caller:null,follow:crypto.randomUUID(),...changes}:changes);}
  const ctx=practiceContext(params);
  const {quote,policy,level,instructions,instruction,cursor,reached,execution,hasRequest,backendOpen,commandReady,viewReady,failed}=ctx;
  const index=practiceSteps.findIndex(step=>step.id===node);
  const step=practiceSteps[index];
  const sourceRoot=useRef<HTMLDivElement>(null);
  const [hint,setHint]=useState('');
  const allowed=(id:string)=>{const i=practiceSteps.findIndex(s=>s.id===id);return i===0||ctx.complete[i-1];};
  const goto=(id:string)=>{if(allowed(id)){setHint('');openNode(id);}else setHint(`Chưa mở ${practiceSteps.find(s=>s.id===id)?.title}: ${missing(id)}`);};
  const lesson=createNodes.find(n=>n.id===node)!;
  const guidedNodes=createNodes.map(n=>({...n,links:n.links?.filter(link=>!link.step||allowed(link.step))}));
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
  const field=fields.find(f=>f.id===params.get('field'))??fields[0];
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
  const expected=node==='quote'?{ref:'create-api',line:45,to:45}:node==='validate'?{ref:'create-check',line:instruction.line,to:instruction.end??instruction.line}:node==='map'?{...field,to:field.id==='status'?201:field.line}:node==='save'?write:node==='flow'?flowPoint:params.get('readSource')==='detail'?{ref:'c-find',line:32,to:37}:{ref:'q-source',line:112,to:115};
  const sourceId=params.get('ref')??expected.ref;
  const displayed=excerptById[sourceId]??excerptById[expected.ref];
  const viewLine=params.has('viewLine')?Number(params.get('viewLine')):sourceId===expected.ref?expected.line:displayed.from;
  const caller:SourceLocation|undefined=params.get('traceFrom')&&excerptById[params.get('traceFrom')!]?{ref:params.get('traceFrom')!,line:Number(params.get('traceLine')??excerptById[params.get('traceFrom')!].from)}:
    node==='quote'?undefined:node==='validate'?{ref:cursor>=5?'create-check':'create-api',line:cursor>=5?67:45}:
    node==='map'?{ref:'create-data',line:field.id==='customer'?102:field.id==='status'?87:83}:
    node==='save'?{ref:write.id==='insurance'?'create-after':write.id==='quote'?'create-after':write.id==='quote-apply'?'create-quote':'create-data',line:write.id==='insurance'?147:write.id==='quote'?158:write.id==='quote-apply'?233:115}:
    node==='flow'?{ref:flowPoint.id==='event'?'create-data':flowPoint.id==='receive'?'create-apply':'flow-create',line:flowPoint.id==='event'?115:flowPoint.id==='receive'?329:27}:
    {ref:params.get('readSource')==='detail'?'c-api':'q-api',line:params.get('readSource')==='detail'?50:26};
  const via=params.get('traceVia')??(node==='validate'?(cursor>=5?'Gọi hàm trong cùng file · runInternal(quoteAggregate)':'Lời gọi CreatePolicyFunc.exec(quoteId)'):node==='flow'?(flowPoint.id==='receive'?'Qua event CreatePolicyEvent':flowPoint.id==='view'?'PolicySyncViewFunc · qua executor':'Command tạo event'):node==='map'?'Ánh xạ / tính dữ liệu command':node==='save'?'Theo chuỗi gọi ghi → repository / event apply':node==='result'?(params.get('readSource')==='detail'?'GET /policy/{id} → Command':'POST /policy/search → Query'):'POST /policy/create/{quoteId}');
  const hasSource=node==='quote'?backendOpen:node==='validate'?hasRequest:node==='map'?level>=1:node==='save'?level>=2:commandReady;
  const readMode:ReadingMode=params.get('reader')==='context'?'context':params.get('reader')==='file'?'file':'related';
  const traceMode=params.get('traceMode')==='deep'?'deep':params.get('traceMode')==='hidden'?'hidden':'compact';
  const searchInput={keyword:policy.policyCode,status:'all',pageNumber:0,pageSize:2};
  const search=searchSamples(searchInput,viewReady?[policy]:[]);
  const detail=detailSample(policy.id,commandReady?[policy]:[]);
  function focus(changes:Changes){update({...changes,follow:crypto.randomUUID()});}
  function advance(sim:CreatePhase,next?:string,changes:Changes={}) {focus({sim:phases.indexOf(sim)>level?sim:ctx.phase,...(next?{node:next,traceFrom:null,traceLine:null,traceVia:null,viewLine:null}:{}),ref:null,...changes});if(next)requestAnimationFrame(()=>sourceRoot.current?.scrollIntoView({block:'start',behavior:'instant'}));}
  function chooseQuote(id:string){update(newQuoteAttempt(id));}
  function nextLine(){
    if(!hasRequest||reached===instructions.length)return;
    const executed=instructions[reached];
    focus({debug:String(reached+1),debugMax:String(reached+1),debugVersion:'2',ref:null,viewLine:null,caller:null,reader:'related',traceFrom:executed.enter?'create-check':null,traceLine:executed.enter?'67':null,traceVia:executed.enter?'Vào runInternal · cùng file, truyền quoteAggregate':null,...(executed.error?{attempt:'failed'}:{}),...(executed.passed&&level<1?{sim:'checked'}:{})});
  }
  function inspect(location:SourceLocation){focus({ref:location.ref,viewLine:String(location.line),traceFrom:sourceId,traceLine:String(viewLine),traceVia:'Mở lời gọi / điểm dữ liệu từ đoạn đang đọc',caller:null,reader:'related',pane:'code'});}
  function returnToExecution(){focus({ref:null,viewLine:null,caller:null,traceFrom:null,traceLine:null,traceVia:null,reader:'related',pane:'code',...(node==='validate'?{debug:String(reached),debugMax:String(reached),debugVersion:'2'}:{})});}
  function missing(id:string){return ({quote:'Mở Chi tiết báo giá.',validate:'Bấm Phát hành thành hợp đồng, rồi Lần vào backend ở bước 1.',map:failed?'Request bị chặn ở bước 2; đổi Quote để thử lại.':'Hoàn tất kiểm tra Quote và điều kiện trùng ở bước 2.',save:'Xác nhận dữ liệu ở bước 3.',flow:'Thực hiện bước ghi mô phỏng ở bước 4.',result:'Cho Flow xử lý event và ghi view ở bước 5.'} as Record<string,string>)[id];}
  function marks(){
    const path=displayed.path;const same=(ref:string)=>excerptById[ref].path===path;let executed:number[]=[];let upcoming:number[]=[];
    if(same('create-check'))executed.push(...instructions.slice(0,reached).flatMap(i=>i.end?[i.line,i.end]:[i.line]));
    if(same('create-api')&&hasRequest&&(node!=='quote'||level>0))executed.push(45);
    if(level>=2){if(same('create-data'))executed.push(83,84,85,86,87,90,91,102,103,104);if(same('create-customer'))executed.push(205,206);}
    if(commandReady){if(same('create-data'))executed.push(115,147,158);if(same('create-apply'))executed.push(329,334);if(same('store-save'))executed.push(122,126);if(same('create-quote'))executed.push(233,240,246,256);if(same('quote-apply'))executed.push(318,319,320);}
    if(viewReady){if(same('flow-create'))executed.push(27);if(same('flow-view'))executed.push(41,56,58);}
    if(params.get('resultSearch')==='1'&&same('q-source'))executed.push(114);
    if(params.has('resultDetail')&&same('c-find'))executed.push(32,33,37);
    if(node==='validate'){if(hasRequest&&reached<instructions.length&&same('create-check'))upcoming=[instructions[reached].line];}
    else if(node==='flow'){if(!viewReady&&same('flow-create'))upcoming=[27];}
    else if(node==='result'){
      if(params.get('resultSearch')!=='1'&&same('q-source'))upcoming=[114];
      else if(params.get('resultSearch')==='1'&&!params.has('resultDetail')&&same('c-find'))upcoming=[32];
    }
    else if(!ctx.complete[index]&&same(expected.ref))upcoming=[expected.line];
    return {executed:[...new Set(executed)],upcoming,viewing:[viewLine]};
  }
  function source(){return <PolicySourceExplorer sourceId={sourceId} contextKey={`create:${node}`} nodes={guidedNodes} activeNode={node} onNode={goto} onSource={id=>inspect({ref:id,line:excerptById[id].from})} showSteps={false} focus={{from:viewLine,to:params.has('viewLine')?viewLine:sourceId===expected.ref?expected.to:viewLine}} reading={{mode:readMode,onMode:mode=>focus({reader:mode,viewLine:null}),caller,onCaller:showCaller,onLine:line=>update({viewLine:String(line)}),marks:marks(),revealRequest:params.get('follow')??undefined,treeOpen:params.get('tree')==='1',onTree:()=>update({tree:params.get('tree')==='1'?null:'1'})}}/>;}
  function showCaller(){if(caller)focus({ref:caller.ref,viewLine:String(caller.line),caller:'1',reader:'related',pane:'code'});else document.querySelector('[data-testid=create-network]')?.scrollIntoView({block:'center',behavior:'instant'});}
  function action():{label:string;description:string;run:()=>void} {
    const prior=node==='validate'?'quote':node==='map'?(hasRequest?'validate':'quote'):node==='save'?(level<1?'validate':'map'):'save';
    if(!hasSource&&node!=='quote')return {label:'Về thao tác cần làm trước',description:missing(node),run:()=>goto(prior)};
    if(node==='quote'){
      if(!hasRequest)return {label:'Phát hành thành hợp đồng',description:`Gửi request mô phỏng với quoteId=${quote.id}; body trống.`,run:()=>focus({sentQuote:quote.id,attempt:null})};
      if(!backendOpen)return {label:'Lần vào backend',description:'Mở PolicyController.createPolicy tại L45 để thấy nơi gọi CreatePolicyFunc.',run:()=>{focus({backend:'1',ref:null,pane:'code'});requestAnimationFrame(()=>sourceRoot.current?.scrollIntoView({block:'start',behavior:'instant'}));}};
      return {label:'Vào bước 2: Kiểm tra Quote',description:'Theo lời gọi CreatePolicyFunc.exec(quoteId), bắt đầu ở L61.',run:()=>goto('validate')};
    }
    if(node==='validate'){
      if(reached<instructions.length){const next=instructions[reached];return {label:next.enter?'Vào runInternal':'Chạy đến dòng tiếp theo',description:`${next.enter?'Vào':'Chạy dòng'} ${next.line} · ${next.title}${cursor<reached?' · tiếp tục từ vị trí debug, giữ nguyên phần đang xem lại.':''}`,run:nextLine};}
      return failed?{label:'Đổi sang Quote hợp lệ để thử lại',description:`Dừng L${quote.missing?63:77}: ${ctx.error}. Chọn Quote mới sẽ bắt đầu lượt thực hành mới.`,run:()=>chooseQuote(quotes[0].id)}:{label:'Sang bước 3: Dựng dữ liệu Policy',description:'Quote tồn tại và chưa có Policy trùng 0/100; chuẩn bị CreatePolicyCommand.',run:()=>goto('map')};
    }
    if(node==='map')return {label:'Xác nhận dữ liệu → bước 4',description:`Giữ giá trị ${field.to} trong bản preview, rồi mở lời gọi ghi Policy L115.`,run:()=>advance('mapped','save')};
    if(node==='save')return commandReady?{label:'Sang bước 5: Cập nhật dữ liệu tra cứu',description:`Giữ Policy ${policy.id}; theo CreatePolicyEvent sang Flow, không gọi lại API tạo.`,run:()=>goto('flow')}:{label:'Thực hiện bước ghi mô phỏng',description:'Ghi Policy, đối tượng POLICY và liên kết trên Quote; Network nhận kết quả Command.',run:()=>advance('command',undefined,{writePoint:'store',ref:'store-save',viewLine:null,traceFrom:null})};
    if(node==='flow')return viewReady?{label:'Sang bước 6: Xem kết quả',description:`View đã có ${policy.id}; mở hai đường đọc danh sách và chi tiết.`,run:()=>goto('result')}:{label:'Cho Flow xử lý event → ghi view',description:'Qua event: Flow đọc Command cùng ID, ghi Policy View rồi gửi thông báo realtime.',run:()=>advance('view',undefined,{flowPoint:'view',ref:'flow-view',viewLine:null,traceFrom:null})};
    if(params.get('resultSearch')!=='1')return {label:'Tìm Policy vừa tạo',description:`POST /policy/search · Query đọc Policy View theo mã ${policy.policyCode}.`,run:()=>focus({resultSearch:'1',readSource:'query',ref:null,viewLine:null,traceFrom:null})};
    if(!params.has('resultDetail'))return {label:'Đọc Chi tiết từ ID vừa tìm',description:`GET /policy/${policy.id} · Command đọc aggregate, đối tượng và thanh toán.`,run:()=>focus({resultDetail:'list',readSource:'detail',ref:null,viewLine:null,traceFrom:null})};
    if(params.get('resultViewed')!=='1'&&viewReady)return {label:'Xác nhận đã đối chiếu cùng ID',description:'Đánh dấu bước 6 hoàn thành; giữ nguyên dữ liệu và kết quả để xem lại.',run:()=>update({resultViewed:'1'})};
    return {label:'Mở bài Danh sách',description:`Mở bài đọc với đúng Policy ${policy.id}, không tạo dữ liệu mới.`,run:toList};
  }
  function station(){
    const next=practiceSteps[index+1];const previous=practiceSteps[index-1];const primary=action();
    return <div ref={sourceRoot} className={`policy-practice-station ${hasSource?'has-code':'no-code'}`} data-testid="practice-workstation" data-pane={params.get('pane')==='data'?'data':'code'} data-tree={params.get('tree')==='1'?'open':'closed'}>
      <nav className="practice-operation-nav" aria-label="Điều hướng bước đang thao tác"><div>{previous?<button type="button" onClick={()=>goto(previous.id)} disabled={!allowed(previous.id)}>← Bước {index}: {previous.title}</button>:<span>Điểm bắt đầu · Quote đã có</span>}<strong>Đang xem {index+1}/6</strong>{next?<button type="button" onClick={()=>goto(next.id)} disabled={!allowed(next.id)} title={!allowed(next.id)?missing(next.id):undefined}>Bước {index+2}: {next.title} →</button>:<span>Bước cuối · đối chiếu cùng ID</span>}</div>{next&&!allowed(next.id)&&<small>{missing(next.id)}</small>}</nav>
      <PolicyPracticeTrace node={node} context={ctx} mode={traceMode} onMode={mode=>update({traceMode:mode})} onStep={goto} expected={expected} onInspect={(location,available)=>available?inspect(location):setHint(`Điểm L${location.line} chưa chạy. ${node==='validate'&&location.line===70?'Bấm Vào runInternal tại L67.':'Dùng hành động tiếp theo để tới điểm này.'}`)}/>
      <div className="practice-source-handoff" data-testid="source-handoff"><div><small>VỪA ĐI TỪ ĐÂU → ĐANG Ở ĐÂU</small><p><strong>{caller?`${excerptById[caller.ref].symbol} · L${caller.line}`:'Chi tiết báo giá · nút Phát hành'}</strong><span> → {via} → </span><strong>{hasSource?`${displayed.path.split('/').at(-1)} · ${node==='validate'&&sourceId==='create-check'?(viewLine>=70?'runInternal':'exec'):displayed.symbol} · L${viewLine}`:hasRequest?'Network · Đang xử lý':'Quote đang mở'}</strong></p></div>{hasSource&&<div className="practice-source-return"><button type="button" onClick={showCaller}>Xem nơi gọi</button><button type="button" onClick={returnToExecution}>Quay về dòng đang chạy</button></div>}</div>
      <div className="practice-action-dock" data-testid="practice-action-dock"><div><strong>{primary.description}</strong><small>{node==='validate'&&hasRequest?`Debug đang dừng ở L${reached?execution.line:61} · đang xem L${viewLine}${cursor<reached?' (xem lại, tiến độ được giữ)':''}`:`Bước ${index+1} · ${step.title}`}</small></div><div className="practice-dock-buttons">{node==='validate'&&hasRequest&&<><button type="button" className="button secondary" disabled={cursor===0} onClick={()=>focus({debug:String(cursor-1),debugMax:String(reached),debugVersion:'2',ref:null,viewLine:null,traceFrom:null,caller:null})}>Về điểm dừng trước</button>{cursor<reached&&<button type="button" className="button secondary" onClick={()=>focus({debug:String(cursor+1),debugMax:String(reached),debugVersion:'2',ref:null,viewLine:null,traceFrom:null})}>Điểm dừng sau</button>}</>}<button type="button" className="button primary" onClick={primary.run}>{primary.label} <ArrowRight size={14}/></button></div></div>
      {hint&&<p className="practice-navigation-hint" role="status">{hint}</p>}
      <div className="practice-pane-tabs"><div>{hasSource&&<><button type="button" aria-pressed={params.get('pane')!=='data'} onClick={()=>update({pane:'code'})}>Code</button><button type="button" aria-pressed={params.get('pane')==='data'} onClick={()=>update({pane:'data'})}>Dữ liệu bước {index+1}{node==='validate'?' · biến trước/sau':''}</button></>}</div>{hasRequest&&<button type="button" onClick={()=>document.querySelector('[data-testid=create-network]')?.scrollIntoView({block:'center',behavior:'instant'})}>Network · {failed?'Bị chặn':commandReady?'Command hoàn tất':'Đang xử lý'}</button>}</div>
      <div className="practice-station-body">{hasSource&&<div className="practice-reader-pane">{source()}</div>}<div className="practice-context-pane">{panel()}</div></div>
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
      {node==='validate'&&(!hasRequest?prerequisite('quote'):<section className="policy-debug-frame" aria-label="Debug mô phỏng" data-testid="policy-debug" data-cursor={cursor}>
        <header><div><span className="eyebrow">DEBUG MÔ PHỎNG · XEM ĐIỂM {cursor}/{instructions.length} · ĐÃ ĐẠT {reached}</span><h3>{instruction.title}</h3><p>{instruction.purpose}</p></div></header>
        <div className="policy-debug-current"><code> CreatePolicyFunc.java:{instruction.line}{instruction.end?`–${instruction.end}`:''}</code><span>{cursor===0?'Sắp chạy':'Đã chạy'} · {excerptById['create-check'].rows.find(r=>r.line===instruction.line)?.text.trim()}</span>{sourceId!=='create-check'&&<button type="button" className="text-button" onClick={()=>update({ref:null})}>Về dòng debug</button>}</div>
        <div className={`policy-debug-branch ${cursor>0&&instruction.error?'is-blocked':''}`} role="status" data-testid="debug-branch"><CornerDownRight size={19}/><div><strong>Điểm rẽ kế tiếp</strong><p>{cursor===0?'Chạy findById trước để biết optional có Quote hay rỗng.':instruction.branch}</p></div></div>
        {cursor>0&&instruction.error&&<div className="policy-branch-result" role="status" data-testid="create-failure"><strong>ServiceException · {instruction.error}</strong><p>Dừng ở bước 2, dòng {quote.missing?63:77}. Không gọi save(CreatePolicyCommand), không tạo Policy hoặc đối tượng POLICY trong lượt này.</p><p>Network mô phỏng đã nhận kết quả bị chặn. Chọn lại Quote ở đầu bài để thử một lượt mới.</p><></></div>}
        {cursor===instructions.length&&instruction.passed&&<div className="policy-debug-passed"><Check size={17}/><span>Quote tồn tại; không có Policy trùng ở 0/100. Có thể dựng dữ liệu.</span><></></div>}
        <div className="policy-debug-workspace"><aside className="policy-debug-variables"><Variables label="Biến trước" values={instruction.before}/><Variables label="Biến sau" values={cursor===0?{optional:'Chưa chạy dòng 61'}:instruction.after} after/>
          {cursor>=3&&!quote.missing&&<p className="policy-debug-used"><strong>quoteCode vừa lấy: <mark>{quote.quoteCode}</mark></strong><span>Được dùng ở truy vấn Policy dòng 74. Đối tượng QUOTE ở dòng 75 dùng tiếp cho chia phí và bước tạo đối tượng POLICY.</span></p>}
        </aside></div>
      </section>)}
      {node==='map'&&(level<1?prerequisite(hasRequest?'validate':'quote'):<>
        <div className="policy-field-picker" role="group" aria-label="Chọn trường theo dõi">{fields.map(item=><button type="button" key={item.id} aria-pressed={field.id===item.id} onClick={()=>update({field:item.id,ref:item.ref})}>{item.label}</button>)}</div>
        <div className="policy-mapping-trace" data-testid="mapping-trace"><div><small>{field.kind}</small><code>{field.from}</code><strong>{field.value}</strong></div><ArrowRight size={22}/><div><small>DÒNG ÁNH XẠ · {excerptById[field.ref].symbol}:{field.line}</small><code>{excerptById[field.ref].rows.find(r=>r.line===field.line)?.text.trim()}</code></div><ArrowRight size={22}/><div><small>CREATEPOLICYCOMMAND</small><code>{field.to}</code><strong>{field.value}</strong></div></div><p className="policy-caption">{field.why}</p>
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
    <nav className="policy-practice-steps" aria-label="Sáu bước phát hành trực tiếp"><ol>{practiceSteps.map((item,i)=>{
      const current=node===item.id;const complete=ctx.complete[i];const next=!complete&&ctx.complete.slice(0,i).every(Boolean)&&!current;
      return <li key={item.id}><button type="button" aria-current={current?'step':undefined} data-state={current?'current':complete?'complete':next?'next':'pending'} disabled={!allowed(item.id)} onClick={()=>goto(item.id)}><span className="practice-step-number">{complete?<Check size={14}/>:i+1}</span><span><strong>{i+1}. {item.title}</strong><small>{current?`Đang xem${complete?' · đã hoàn thành':''}`:complete?'Đã hoàn thành':next||i===index+1?'Tiếp theo':'Chưa tới'}</small></span></button></li>;
    })}</ol></nav>
    <div className="policy-practice-context"><label>Quote mẫu<select aria-label="Quote mẫu" value={quote.id} onChange={e=>chooseQuote(e.target.value)}>{quotes.map(q=><option key={q.id} value={q.id}>{q.missing?'Quote không tồn tại · ID cũ':q.blocked?'Policy trùng · Quote đã có Policy RUNNING':q.label}</option>)}</select></label><p><strong>Phát hành trực tiếp</strong><span>Workshop · UI / Network / debug mô phỏng</span></p><small>Mốc ngày cố định<br/><code>{SAMPLE_NOW}</code></small></div>
    <div className="policy-practice-title"><span className="eyebrow">BƯỚC {index+1} / 6</span><h2>{step.title}</h2><p>{step.action}</p></div>
    {hasRequest&&<SimulatedNetwork params={params} context={ctx} expanded={node==='quote'||failed}/>}
    {station()}

    {(backendOpen||node!=='quote')&&<details className="policy-practice-guide"><summary>Hướng dẫn đọc file và kiểm tra trước khi đi tiếp</summary><dl><dt>Tôi cần làm gì?</dt><dd>{step.action}</dd><dt>Vì sao cần file này?</dt><dd>{lesson.why}</dd><dt>Nó nhận gì, gọi ai hoặc trả gì?</dt><dd>{lesson.contract}</dd><dt>Kiểm tra gì trước khi sang bước sau?</dt><dd>{lesson.check}</dd></dl></details>}
    <p className="policy-practice-boundary">Dữ liệu, request và kết quả đều mô phỏng. Không gọi backend; không mô phỏng email/SMS, cơ chế khóa, rollback hoặc bảo đảm giao event. Policy ID, mã và version là giá trị mẫu.</p>
  </div>;
}

function Variables({label,values,after=false}:{label:string;values:Record<string,unknown>;after?:boolean}) {
  return <section className={`policy-variable-list ${after?'after':''}`} data-testid={after?'debug-after':'debug-before'}><h4>{label}</h4><dl>{Object.entries(values).map(([name,value])=><div key={name}><dt>{name}</dt><dd><code>{typeof value==='string'?value:JSON.stringify(value,null,2)}</code></dd></div>)}</dl></section>;
}
function SimulatedNetwork({params,context,expanded}:{params:URLSearchParams;context:ReturnType<typeof practiceContext>;expanded:boolean}) {
  const {quote,policy,commandReady,failed,error}=context;
  const state=failed?'blocked':commandReady?'complete':'pending';
  return <details key={params.get('node')??'quote'} className="policy-simulated-network" open={expanded} data-testid="create-network" data-state={state}>
    <summary><span>NETWORK MÔ PHỎNG</span><code>POST /policy/create/{quote.id}</code><strong>{failed?'Bị chặn · ServiceException':commandReady?'Command hoàn tất':'Đang xử lý'}</strong></summary>
    <div className="policy-network-body"><div><h4>Request</h4><code>POST /policy/create/{quote.id}</code><p>quoteId lấy từ báo giá đang mở: <strong data-testid="network-quote-id">{quote.id}</strong></p><p>Request body: <strong>Trống · 0 byte, không có JSON body</strong></p></div><div role="status"><h4>Kết quả nhánh Command</h4>{failed?<><strong>{error}</strong><p>Dừng ở bước 2, CreatePolicyFunc.java:{quote.missing?63:77}. Chưa tạo Policy.</p><p>Đây là mã lỗi function đã xác nhận; không gán HTTP status chưa đo ở runtime.</p></>:commandReady?<><strong>Policy ID: {policy.id}</strong><p>Policy và đối tượng POLICY đã tạo; Quote liên kết về cùng ID. View và Core có mốc riêng.</p><details><summary>Xem kết quả trả về mẫu</summary><Json label="WrapResponse.ok · EntityWithIdAndVersion rút gọn" value={{success:true,data:{entityId:policy.id,aggregate:policy,version:'demo-event-version'}}}/></details></>:<><strong>Đang xử lý</strong><p>Chưa tới điểm trả kết quả Command trong bài; tiếp tục lần code. Không có thời gian chờ backend thật.</p></>}</div></div>
  </details>;
}
