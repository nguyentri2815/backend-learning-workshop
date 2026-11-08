import { ArrowRight, CornerUpLeft, FileCode2, X } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { useCallback } from 'react';
import { approvalBranch, evidenceNodes, issuanceBranches, issuanceExtensions, postIssuance, quoteOrigin, referencePoints } from '../content/policy/issuance';
import type { IssuanceBranchId } from '../content/policy/issuance';
import { excerptById } from '../content/policy/lesson';
import type { LessonNode } from '../content/policy/flows';
import { creationContext, newQuoteAttempt, quotes } from './create-model';
import { PolicyIssuanceDiagram } from './PolicyIssuanceDiagram';
import type { IssuanceMapPoint } from './PolicyIssuanceDiagram';
import { PolicySourceExplorer } from './PolicySourceExplorer';
import './policy-overview.css';

type Changes=Record<string,string|null>;
const branchTitles:Record<IssuanceBranchId,string>={direct:'Phát hành trực tiếp',cash:'Thu hộ/tiền mặt',online:'Thanh toán online',approval:'Duyệt thanh toán'};
export function PolicyCreationOverview({update,openPractice,resume,practiceNode,openRead}: {
  update:(changes:Changes)=>void; openPractice:(step:string,failed?:boolean)=>void;
  resume:()=>void; practiceNode:LessonNode; openRead:(group:'list'|'detail')=>void;
}) {
  const [params]=useSearchParams();
  const branch=params.get('branch')==='approval'?approvalBranch(params.get('approval')==='now'):issuanceBranches.find(b=>b.id===params.get('branch'))??issuanceBranches[0];
  const created=creationContext(params);
  // Preserve earlier branch links while always displaying the same shared map.
  const inspect=params.get('inspect')??(params.get('overview')==='full'&&params.has('branch')?'branch':null);
  const extension=issuanceExtensions.find(e=>e.id===inspect);
  const path=inspect==='view'?postIssuance.view:inspect==='core'?postIssuance.core:undefined;
  const creatorRef={direct:'create-data',cash:'cash-save',online:'online-save',approval:params.get('approval')==='now'?'approve-now-initial':'approve-initial'}[branch.id];
  const points=inspect==='origin'?quoteOrigin:path?referencePoints(path.refs):extension?referencePoints(extension.refs):inspect==='published'?referencePoints(['create-after','quote-apply']):inspect==='save'?referencePoints([creatorRef,'create-apply','store-save','c-find']):branch.points;
  const evidence=params.get('evidence');
  const source=excerptById[evidence??'']??excerptById[points[0].ref];
  const active=points.find(p=>p.ref===source.id)??points[0];
  const sourceNodes=evidenceNodes(points).map(n=>({...n,links:n.id==='origin-return'?[{label:'EntityWithIdAndVersion.getEntityId()',ref:'origin-response'}]:n.id==='origin-apply'?[{label:'AggregateRepository.save(command)',ref:'origin-repository'}]:n.id==='origin-reuse'?[{label:'CreatePolicyFunc.exec → findById(quoteId)',ref:'create-check'}]:undefined}));
  const sent=params.get('sentQuote')===created.quote.id;
  const hasPractice=params.has('node')||params.has('ref');
  const learn=useCallback(()=>openPractice('quote'),[openPractice]);
  const select=useCallback((id:IssuanceMapPoint)=>update({group:'create',mode:'overview',overview:null,inspect:id in branchTitles?'branch':id,evidence:null,...(id in branchTitles?{branch:id}:{})}),[update]);
  function show(id:string,ref?:string){update({inspect:id,evidence:ref??(id==='origin'?'origin-api':id==='view'?'flow-create':id==='core'?'core-api':issuanceExtensions.find(e=>e.id===id)?.refs[0]??points[0].ref)});}
  function code(ref:string){update({evidence:ref});}
  const branchExtensions=issuanceExtensions.filter(e=>branch.extensions.includes(e.id)&&e.id!=='core-update');
  const panelTitle=inspect==='quote'?'1 · Quote đã có':inspect==='origin'?'Quote đến từ đâu?':inspect==='save'?'3 · Tạo Policy và đối tượng bảo hiểm':inspect==='published'?'4A · Quote chuyển PUBLISHED':inspect==='view'?'4B · Event → Flow → Policy View':inspect==='core'?'4C · Đồng bộ Core':extension?.title??branchTitles[branch.id];
  return <div className="policy-creation-overview">
    <div className="policy-map-heading"><div><span className="eyebrow">TỪ QUOTE ĐẾN POLICY</span><h2>Bốn đường phát hành, một điểm hội tụ</h2></div><p className="policy-learning-path">Đường học: <strong>{branchTitles[branch.id]}</strong></p></div>
    <div className={`policy-map-layout ${inspect?'has-detail':''}`}>
      <PolicyIssuanceDiagram branch={branch.id} inspected={inspect==='branch'?branch.id:inspect==='origin'?'quote':extension?(extension.id==='core-update'?'core':branch.id):inspect} onOpen={select} onPractice={learn}/>
      {inspect&&<aside className="policy-map-detail" aria-label="Chi tiết điểm trên sơ đồ" data-testid="issuance-map-detail">
        <header><div><span className="eyebrow">ĐANG XEM · {branchTitles[branch.id]}</span><h3>{panelTitle}</h3></div><button type="button" className="policy-map-close" aria-label="Đóng chi tiết" onClick={()=>update({inspect:null,evidence:null,overview:null})}><X size={17}/></button></header>
        <div className="policy-map-detail-body">
          {inspect==='quote'&&<>
            <p>Policy bắt đầu từ một Quote đã tồn tại. Bốn nhánh dùng cùng báo giá; mỗi nhánh có cửa vào và điều kiện riêng.</p>
            <button type="button" className="button secondary" onClick={()=>show('origin')}>Quote đến từ đâu? <FileCode2 size={15}/></button>
            <div className="policy-quote-handoff" aria-label="Giữ quoteId trước và sau request"><label>Quote mẫu đã có<select aria-label="Quote mẫu trong toàn cảnh" value={created.quote.id} onChange={e=>update(newQuoteAttempt(e.target.value))}>{quotes.map(q=><option key={q.id} value={q.id}>{q.label}</option>)}</select></label><div><small>quoteId trước khi gửi</small><code data-testid="quote-id-before">{created.quote.id}</code></div><button type="button" className="button small secondary" onClick={()=>update({sentQuote:created.quote.id})}>Xem request mẫu <ArrowRight size={14}/></button>{sent&&<div className="policy-quote-request" role="status"><code>POST /policy/create/{created.quote.id}</code><small>Body: null · quoteId sau khi gửi</small><code data-testid="quote-id-after">{created.quote.id}</code><p>Cùng một báo giá. Đây là request mẫu của đường phát hành trực tiếp; chưa gọi backend hay tạo Policy.</p></div>}</div>
          </>}
          {inspect==='origin'&&<><button type="button" className="text-button" onClick={()=>update({inspect:'quote',evidence:null})}>← Về Quote mẫu và request</button><p>Đã lần được ở backend: <strong>POST /quote/create → CreateQuoteCommand / event → sinh entityId → gắn ID và JPA save → trả EntityWithIdAndVersion</strong>.</p><p><strong>Chưa xác nhận thao tác trên màn hình nghiệp vụ tạo/chọn Quote.</strong> Workshop dùng Quote mẫu đã có <code>{created.quote.id}</code>; ID này được dùng lại trong <code>POST /policy/create/{created.quote.id}</code>.</p><p>CreateQuoteFunc còn gán hasReleasedPolicy=true; riêng cờ này chưa đủ xác nhận hành vi nút phát hành trên màn hình.</p></>}
          {inspect==='branch'&&<div data-testid="issuance-branch-detail">
            {branch.id==='approval'&&<label className="policy-approval-variant">Biến thể duyệt<select aria-label="Biến thể duyệt thanh toán" value={params.get('approval')==='now'?'now':'normal'} onChange={e=>update({approval:e.target.value,evidence:null})}><option value="normal">Duyệt thanh toán · ApprovePaymentFunc</option><option value="now">Duyệt ngay · ApprovePaymentNowFunc</option></select></label>}
            <h4>Việc gì kích hoạt?</h4><p>{branch.trigger}</p><h4>Kiểm tra gì trước khi tạo?</h4><ul>{branch.checks.map(text=><li key={text}>{text}</li>)}</ul>
            {branch.id==='direct'&&<div className="policy-branch-decision"><strong>Đủ điều kiện → bước 3</strong><p>Bị chặn → dừng trước save: QUOTE_NOT_EXIST hoặc QUOTE_CAN_NOT_RELEASE_POLICY.</p><button type="button" className="text-button" onClick={()=>openPractice('validate',true)}>Thử nhánh tạo thất bại ↗</button></div>}
            <h4>Thành phần nào tạo Policy?</h4><p>{branch.creator}</p><h4>Kết quả nào quan sát được?</h4><p>{branch.result}</p>
            {branch.id==='direct'&&<button type="button" className="button primary" onClick={learn}>Mở bài phát hành trực tiếp <ArrowRight size={14}/></button>}
            <h4>Dữ liệu và trạng thái thay đổi</h4><div className="policy-status-changes">{branch.changes.map((row,i)=><article key={i}><strong>{row.object}.<code>{row.field}</code></strong><p>{row.value}</p><button type="button" className="text-button" onClick={()=>code(row.ref)}>{excerptById[row.ref].symbol} ↗</button></article>)}</div>
            {branchExtensions.length>0&&<section className="policy-map-extensions"><h4>Mở thêm tại đúng mốc</h4>{branchExtensions.map(ext=><article key={ext.id} data-extension={ext.id}><small>{ext.anchor}</small><button type="button" className="text-button" onClick={()=>show(ext.id)}>{ext.title} ↗</button></article>)}</section>}
            <button type="button" className="button small secondary" onClick={()=>code(branch.points[0].ref)}><FileCode2 size={14}/>Lần source của nhánh</button>
            <details className="policy-verify-points"><summary>Điểm cần xác minh · {branchTitles[branch.id]}</summary><ul>{branch.verify.map(text=><li key={text}>{text}</li>)}</ul><p>Phân tích tĩnh xác nhận lời gọi và nơi ghi; chưa đo khóa, retry, rollback, thứ tự hoặc độ trễ bằng một lần chạy backend.</p></details>
          </div>}
          {inspect==='save'&&<><p>Bốn nhánh hội tụ về việc tạo <code>PolicyAggregate</code> và đối tượng bảo hiểm loại POLICY. <strong>Mỗi nhánh giữ creator và kết quả trả về riêng.</strong></p><h4>Creator của đường đang học</h4><p>{branch.creator}</p><p>{branch.result}</p><p><code>Policy.status</code> được gán ban đầu theo ngày; không phải trạng thái thanh toán, Quote hay đồng bộ Core.</p><h4>Chi tiết đọc trực tiếp bằng Policy ID</h4><p><code>GET /policy/{'{id}'}</code> → <code>policy_aggregate</code>, ghép đối tượng và thanh toán. Có thể mở bằng ID ngay; không phải đi qua Danh sách hoặc đợi Core.</p><div className="actions"><button type="button" className="button small secondary" onClick={()=>openRead('detail')}>Mở bài Chi tiết</button><button type="button" className="text-button" onClick={()=>code('c-find')}>FindPolicyByIdFunc.exec ↗</button></div><p className="policy-map-sample">{created.commandReady?`Bài trực tiếp đã mô phỏng tạo ${created.policy.id}.`:'Chưa tạo trong bài trực tiếp; bài Chi tiết dùng hồ sơ mẫu có sẵn.'}</p><div className="actions"><button type="button" className="button small secondary" onClick={()=>code(points[0].ref)}>Xem code ghi dữ liệu</button>{branch.id==='direct'&&<button type="button" className="button small primary" onClick={()=>openPractice('save')}>Thực hành bước tạo Policy</button>}</div></>}
          {inspect==='published'&&<><p>Sau khi tạo, đường phát hành gọi publishedQuote và ghi <strong>Quote.status=PUBLISHED(9)</strong>, gắn policyId/policyCode, canReleasePolicy=false, hasReleasedPolicy=true.</p><p>Đây là trạng thái của <strong>Quote</strong>. Policy.status, trạng thái thanh toán và syncStatus có ý nghĩa riêng.</p><p>Đường đang học: {branch.changes.find(c=>c.object==='Quote'&&c.field==='status')?.value}</p><button type="button" className="button small secondary" onClick={()=>code('quote-apply')}>Xem nơi ghi Quote.status</button></>}
          {path&&<><p>{path.relation}</p><h4>Điều kiện và nơi ghi</h4><p>{path.condition}</p><h4>Khi nào thấy kết quả?</h4><p>{path.visible}</p>
            {inspect==='view'?<><div className="policy-view-chain">CreatePolicyEvent → PolicyWorkflow → executor đọc Command → save policy_view_aggregate → thông báo sync-policy-view/{'{id}'}</div><p>Query đọc view qua <code>POST /policy/search</code>. Realtime báo việc đồng bộ view; không chứng minh Core đã đồng bộ. Chưa xác nhận thứ tự thông báo so với HTTP response.</p><button type="button" className="button small secondary" onClick={()=>openRead('list')}>Mở bài Danh sách</button><p className="policy-map-sample">{created.viewReady?'Mô phỏng đã ghi view cùng ID.':created.commandReady?'Command đã có Policy; mốc view chưa chạy trong mô phỏng.':'Bài Danh sách dùng dữ liệu mẫu sẵn có; chưa có Policy mới từ bài trực tiếp.'}</p><button type="button" className="button small primary" onClick={()=>openPractice('flow')}>Thực hành Flow cập nhật view</button></>:<><p>Chưa chạy mô phỏng/Core thật. <code>sim=view</code> không tự đổi Core thành SYNCED.</p><button type="button" className="text-button" onClick={()=>show('core-update')}>Mở thêm: Cập nhật từ Core ↗</button></>}
            <button type="button" className="button small secondary" onClick={()=>code(path.refs[0])}>Xem source {inspect==='view'?'event / Flow / Query':'API / lịch / kết quả Core'}</button><details className="policy-verify-points"><summary>Điểm cần xác minh · {path.title}</summary><ul>{path.verify.map(text=><li key={text}>{text}</li>)}</ul></details>
          </>}
          {extension&&<div data-extension={extension.id}><button type="button" className="text-button" onClick={()=>update({inspect:extension.id==='core-update'?'core':'branch',evidence:null})}>← Về {extension.id==='core-update'?'đường Core':'nhánh phát hành'}</button><small className="policy-extension-anchor">{extension.anchor}</small><h4>Kích hoạt</h4><p>{extension.trigger}</p><h4>Điều kiện</h4><p>{extension.condition}</p><h4>Dữ liệu thay đổi</h4><p>{extension.change}</p><h4>Khi nào thấy kết quả?</h4><p>{extension.visible}</p><details className="policy-verify-points"><summary>Điểm cần xác minh · {extension.title}</summary><ul>{extension.verify.map(text=><li key={text}>{text}</li>)}</ul></details></div>}
          {evidence&&<section className="policy-overview-inspector" aria-label="Bằng chứng source trong toàn cảnh" data-testid="overview-evidence">
            <h4>Bằng chứng trong code</h4><PolicySourceExplorer sourceId={source.id} contextKey={`overview:${inspect}`} nodes={sourceNodes} activeNode={active.id} onNode={id=>show(inspect!,points.find(p=>p.id===id)!.ref)} onSource={id=>show(inspect!,id)}/>
            {inspect==='origin'&&<button type="button" className="button small primary" onClick={learn}>Mở bài phát hành trực tiếp <ArrowRight size={14}/></button>}
          </section>}
        </div>
      </aside>}
    </div>
    {hasPractice&&<div className="policy-overview-resume"><span>Đang giữ bước {['quote','validate','map','save','flow','result'].indexOf(practiceNode.id)+1}: {practiceNode.title}</span><button type="button" className="text-button policy-resume" data-testid="policy-resume-practice" onClick={resume}><CornerUpLeft size={14}/>Quay về đúng bước đang học</button></div>}
  </div>;
}
