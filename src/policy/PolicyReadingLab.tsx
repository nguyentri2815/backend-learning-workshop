import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ArrowRight, Check, Code2, FileSearch, GitBranch, Search } from 'lucide-react';
import { excerptById, operations, readingPoints, readingSteps } from '../content/policy/lesson';
import type { ReadingStep } from '../content/policy/lesson';
import { detailSample, makeSearchRequest, MISSING_POLICY_ID, readPolicyContext, sampleResponse, searchSamples, statusLabels } from './policy-model';
import type { PolicyLearningProgress } from './policy-model';
import './policy.css';
import { creationContext } from './create-model';
import { PolicySourceExplorer } from './PolicySourceExplorer';


const firstPoint = (step: ReadingStep) => step === 'search' || step === 'trace' ? 'list-api' : step === 'missing' ? 'missing-branch' : 'detail-api';
function Json({label, value}: {label: string; value: unknown}) {
  return <div className="policy-json"><strong>{label}</strong><pre>{JSON.stringify(value, null, 2)}</pre></div>;
}

export function PolicyReadingLab({progress}: {progress: PolicyLearningProgress}) {
  const [params, setParams] = useSearchParams();
  const context = readPolicyContext(params);
  const {step, selected, hasSearch, input} = context;
  const [keyword, setKeyword] = useState(input.keyword);
  const [status, setStatus] = useState(input.status);
  const [size, setSize] = useState(input.pageSize);
  const point = readingPoints.find(item => item.id === (params.get('point') ?? params.get('node')));
  const sourceId = params.get('ref') ?? point?.ref;
  const source = sourceId ? excerptById[sourceId] : undefined;
  const created = creationContext(params);
  const page = searchSamples(input, created.viewReady ? [created.policy] : []);
  const detail = selected ? detailSample(selected, created.commandReady ? [created.policy] : []) : null;
  const current = readingSteps.find(item => item.id === step)!;
  const ready = step === 'search' ? hasSearch : Boolean(detail);
  const visiblePoints = readingPoints.filter(item => step === 'trace' ? item.group !== 'missing' : item.group === (step === 'search' ? 'list' : step === 'missing' ? 'missing' : 'detail'));
  const invalidSource = Boolean((params.has('ref') && !source) || (params.has('point') && !point));

  useEffect(() => { setKeyword(input.keyword); setStatus(input.status); setSize(input.pageSize); }, [input.keyword, input.status, input.pageSize]);

  function update(changes: Record<string, string | null>) {
    setParams(previous => {
      const next = new URLSearchParams(previous);
      const opened = [...new Set([...(previous.get('opened') ?? '').split(','), source?.id ?? '', changes.ref ?? ''])].filter(id => excerptById[id]);
      if (opened.length) next.set('opened', opened.join(','));
      for (const [key, value] of Object.entries(changes)) value === null ? next.delete(key) : next.set(key, value);
      if (changes.point) next.set('node',changes.point);
      else if ('step' in changes) next.delete('node');
      return next;
    });
  }
  function openPoint(id: string) { const target=readingPoints.find(p=>p.id===id)!; update({point: id, node:id, ref: null, group:target.group==='list'?'list':'detail'}); }
  function goStep(next: ReadingStep) { update({step: next, node:null, point: null, ref: null}); }
  const claimQuestion = step === 'search' ? operations[0].questions : step === 'detail' || step === 'missing' ? operations[1].questions : 'Claim nên chia trách nhiệm giữa API, xử lý và nguồn dữ liệu như thế nào? Có cần tách dữ liệu đọc/ghi không? Quyết định này chờ yêu cầu riêng.';

  return <div className="policy-workspace">
    {(context.invalid || invalidSource) && <p role="status" className="notice">Link có bước, ID hoặc tham chiếu không hợp lệ. Chọn lại điểm đọc phù hợp.</p>}
    {step !== 'search' && <nav className="policy-step-nav" aria-label="Bài đọc Chi tiết">{readingSteps.filter(item=>item.id!=='search').map((item,i)=><button key={item.id} disabled={!selected} aria-current={step===item.id?'step':undefined} onClick={()=>goStep(item.id)}>{i+1}. {item.short}</button>)}</nav>}
    {selected && <p className="policy-id-trail" data-testid="policy-id-trail"><GitBranch size={17}/><span>ID lấy từ danh sách <strong>{selected}</strong> → GET /policy/<strong>{selected}</strong>{step === 'missing' && <small>Đang thử ID khác: {MISSING_POLICY_ID}. ID đã chọn vẫn được giữ để quay lại.</small>}</span></p>}

    <div className="policy-reading-grid">
      <section className="card policy-lab" aria-labelledby="policy-lesson-title">
        <span className="eyebrow">BƯỚC {readingSteps.findIndex(item => item.id === step) + 1} / 4 · DỮ LIỆU MẪU</span><h2 id="policy-lesson-title">{current.title}</h2><p>{current.goal}</p>
        {step === 'search' ? <>
          <form onSubmit={event => { event.preventDefault(); update({step: 'search', keyword: keyword.trim(), status, size: String(size), page: '0', searched: '1', selected: null, point: null, ref: null}); }} className="policy-search-form">
            <label>Từ khóa mẫu<input aria-label="Từ khóa mẫu" aria-describedby="policy-keyword-hint" value={keyword} onChange={event => setKeyword(event.target.value)} placeholder="S-DEMO" maxLength={100}/><small id="policy-keyword-hint">Dùng mã ASCII như S-DEMO hoặc S-DEMO-003. Bộ mô phỏng chỉ tái hiện một phần tìm kiếm.</small></label>
            <div className="policy-form-row"><label>Trạng thái<select aria-label="Trạng thái" value={status} onChange={event => setStatus(event.target.value)}><option value="100">Đang có hiệu lực · 100</option><option value="0">Chưa tới hiệu lực · 0</option><option value="-1">Hết hiệu lực · -1</option><option value="all">Tất cả trạng thái</option></select></label><label>Số dòng / trang<select aria-label="Số dòng / trang" value={size} onChange={event => setSize(Number(event.target.value))}><option value="2">2</option><option value="3">3</option></select></label></div>
            <div className="actions"><button type="submit" className="button primary"><Search size={15}/>Tìm hợp đồng mẫu</button><button type="button" className="button secondary" onClick={() => {setKeyword('S-DEMO'); setStatus('100'); setSize(2);}}>Điền tiêu chí mẫu</button></div>
          </form>
          <p className="policy-scenario">Tình huống mẫu: người bán thường thuộc <strong>DV-A</strong>, có 5 hồ sơ trong phạm vi; 1 hồ sơ DV-B nằm ngoài phạm vi. Lọc trạng thái 100 còn 3 hồ sơ. Đây không phải phiên đăng nhập.</p>
          {hasSearch ? <>
            <Json label="REQUEST MẪU · Query · POST /policy/search" value={makeSearchRequest(input)}/>
            <p className="policy-caption">Request trên là tiêu chí đã gửi mô phỏng. Thay ô nhập rồi bấm Tìm để tạo lượt mới.</p>
            <div className="policy-result-summary" role="status"><strong>{page.totalElements} hợp đồng mẫu phù hợp</strong><span>pageNumber={page.number} · pageSize={page.size}</span></div>
            <div className="policy-table-scroll"><table className="policy-result-table"><caption>Dữ liệu mẫu · kết quả tìm kiếm</caption><thead><tr><th>Hợp đồng / ID</th><th>Trạng thái</th><th>Mở</th></tr></thead><tbody>{page.content.map(item => <tr key={item.id}><td><strong>{item.policyCode}</strong><small>{item.id}</small><small>{item.customerName}</small></td><td>{statusLabels[item.status]}</td><td><button type="button" className="button small secondary" aria-label={`Mở chi tiết ${item.id}`} onClick={() => update({step: 'detail', selected: item.id, point: null, ref: null, group: 'detail', mode: 'steps', node: 'detail-api'})}>Chi tiết <ArrowRight size={14}/></button></td></tr>)}</tbody></table></div>
            {page.content.length === 0 && <p className="policy-empty">Không có dòng trên trang mẫu này. Đổi bộ lọc hoặc về trang đầu. Source thật còn có catch lỗi trả trang rỗng.</p>}
            <div className="policy-pagination"><button type="button" className="button small secondary" disabled={input.pageNumber === 0} onClick={() => update({page: String(input.pageNumber - 1)})}>Trang trước</button><span>Trang {page.totalPages ? page.number + 1 : 0} / {page.totalPages}</span><button type="button" className="button small secondary" disabled={page.number + 1 >= page.totalPages} onClick={() => update({page: String(input.pageNumber + 1)})}>Trang tiếp</button></div>
            {page.number > 0 && page.content.length === 0 && <button type="button" className="text-button" onClick={() => update({page: '0'})}>Về trang đầu</button>}
            <details className="policy-response"><summary>Response danh sách mẫu · rút gọn</summary><p>Minh họa WrapResponse và Page; không phải JSON đã ghi nhận từ API chạy thật.</p><Json label="RESPONSE MẪU" value={sampleResponse(page)}/></details>
            <button type="button" className="button secondary policy-open-code" onClick={() => openPoint('list-api')}><Code2 size={16}/>Mở code Query</button>
          </> : <div className="policy-empty"><FileSearch size={27}/><p>Bấm Tìm hợp đồng mẫu để xem request và kết quả đầu tiên.</p></div>}
        </> : !detail ? <div className="policy-empty"><p>Chọn một dòng từ danh sách để giữ ID xuyên suốt bài.</p><button type="button" className="button primary" onClick={() => goStep('search')}>Về tìm hợp đồng</button></div> : step === 'detail' ? <>
          <Json label="REQUEST MẪU · Command" value={{method: 'GET', path: `/policy/${selected}`, body: null}}/>
          <div className="policy-detail-card" data-testid="policy-detail"><span className="policy-sample-label">Dữ liệu mẫu</span><h3>{detail.policyCode}</h3><p>{detail.customerName}</p><code>{detail.id}</code><p>{statusLabels[detail.status]}</p><dl><dt>Đối tượng bảo hiểm</dt><dd>{detail.insuredObjects.length} đối tượng mẫu</dd><dt>Tổng phí mẫu</dt><dd>{detail.paymentInfoPolicyModel.totalInsuranceAmount.toLocaleString('vi-VN')} VND</dd></dl></div>
          <p className="policy-caption">Mỗi phần này đến từ đâu? Bấm để mở đoạn xử lý tương ứng.</p><div className="policy-field-buttons"><button type="button" onClick={() => openPoint('detail-find')}>policyCode / customerName → PolicyAggregate</button><button type="button" onClick={() => openPoint('detail-objects')}>insuredObjects → InsuranceObjectRepository</button><button type="button" onClick={() => openPoint('detail-payment')}>paymentInfoPolicyModel → buildPaymentInfoPolicyModel</button></div>
          <details className="policy-response"><summary>Response chi tiết mẫu · rút gọn</summary><Json label="RESPONSE MẪU" value={sampleResponse(detail)}/></details>
          <div className="actions"><button type="button" className="button secondary" onClick={() => openPoint('detail-api')}><Code2 size={16}/>Mở code Command</button><button type="button" className="button primary" onClick={() => goStep('trace')}>Nối hai đường đọc <ArrowRight size={16}/></button></div>
        </> : step === 'trace' ? <>
          <div className="policy-trace-lane"><span className="policy-module">3-agent-query-service · Query</span><h3>POST /policy/search</h3><p>PolicyController.search → SearchPolicyFunc → QueryCustomRepository → policy_view_aggregate</p><button type="button" className="button secondary" onClick={() => openPoint('list-api')}>Lần đường danh sách</button></div>
          <p className="policy-trace-id">Dòng được chọn mang <strong>{selected}</strong> ↓</p>
          <div className="policy-trace-lane command"><span className="policy-module">1-agent-command-service · Command</span><h3>GET /policy/{selected}</h3><p>PolicyController.paymentMethod → FindPolicyByIdFunc → PolicyRepository → policy_aggregate; ghép đối tượng và thông tin thanh toán.</p><button type="button" className="button secondary" onClick={() => openPoint('detail-api')}>Lần đường chi tiết</button></div>
          <p className="policy-limit">Hai PolicyController cùng tên nhưng khác module. Hai luồng đang đọc hai mô hình dữ liệu khác nhau; sự đồng bộ giữa chúng là phần cần học khi tạo/cập nhật.</p>
          <button type="button" className="button primary" onClick={() => {update({step: 'missing', point: 'missing-branch', ref: null});}}>Thử ID không tồn tại <ArrowRight size={16}/></button>
        </> : <>
          <Json label="REQUEST MẪU · Command · thử ID khác" value={{method: 'GET', path: `/policy/${MISSING_POLICY_ID}`, body: null}}/>
          <div className="policy-branch-result" role="status"><span className="policy-sample-label">Mô phỏng theo nhánh source</span><h3>findById → Optional.empty()</h3><p><strong>ServiceException</strong> · <code>AGENT.POLICY_NOT_EXIST</code></p><p>Dừng tại FindPolicyByIdFunc.exec, dòng 32. Không đọc đối tượng bảo hiểm và không ghép response thành công.</p></div>
          <p className="policy-limit"><strong>HTTP chưa kiểm chứng.</strong> Source có handler BaseException trả 422, nhưng chưa xác nhận lỗi đi qua CompletableFuture và handler ra sao khi chạy. Màn này thể hiện exception tại function; không khẳng định mã HTTP hoặc toàn bộ JSON lỗi của endpoint.</p>
          <div className="actions"><button type="button" className="button secondary" onClick={() => openPoint('missing-branch')}>Mở điểm rẽ dòng 32</button><button type="button" className="button secondary" onClick={() => {update({step: 'detail', group: 'detail', point: 'detail-find', ref: null});}}>Trở lại ID đã chọn</button></div>
        </>}
        <div className="policy-claim-question"><strong>Khi làm Claim, tôi sẽ hỏi gì?</strong><p>{claimQuestion}</p><small>Câu hỏi mở. API, dữ liệu, quyền và trạng thái Claim sẽ xác định riêng.</small></div>
        <button type="button" className="button secondary policy-complete" disabled={!ready} aria-pressed={progress.completed.includes(step)} onClick={() => progress.toggle(step)}><Check size={15}/>{progress.completed.includes(step) ? 'Đã đọc và tự giải thích bước này' : 'Đánh dấu đã đọc và tự giải thích'}</button><p className="policy-caption">Tiến độ tự đánh dấu, không phải bằng chứng backend đã chạy.</p>
      </section>

      <section className="policy-source-panel">
        <PolicySourceExplorer showGuide sourceId={source?.id ?? firstPoint(step)} fallbackId={step==='search'?'q-api':'c-api'} contextKey={`reading:${step}`} nodes={visiblePoints.map(item=>({id:item.id,title:item.label,ref:item.ref,action:item.question,why:'Mở file này để xác định trách nhiệm của bước '+item.label.toLowerCase()+'.',contract:item.observation,check:'Đối chiếu request, ID và kết quả mẫu ở vùng thực hành.',result:item.observation,links:item.related?.map(ref=>({label:excerptById[ref].symbol,ref}))}))} activeNode={point?.id ?? firstPoint(step)} onNode={openPoint} onSource={id=>update({ref:id})}/>
      </section>
    </div>
  </div>;
}
