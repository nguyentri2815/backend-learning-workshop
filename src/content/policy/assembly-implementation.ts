import sources from './assembly-source.json' with {type:'json'};
import type {EvidenceKey} from './assembly-learning';

// Ranges refer to the reviewed agent-system snapshot, never to generated Java.
// A checkpoint supplies preceding steps so any of the six lessons can be opened directly.
export type ImplementationPatch = {ref:EvidenceKey;from:number;to:number};
export type ImplementationTask = {
  id:string; title:string; why:string; ref:EvidenceKey; from:number; to:number;
  action:string; kind:'inspect'|'connect'|'quote-trials'|'view'|'read-check';
  status:'Có sẵn để dùng'|'Cần sửa'|'Cần tạo';
  target:string; choices?:string[]; answer?:string; correction?:string;
  patches?:ImplementationPatch[]; result:string; enables:string;
};
export type ImplementationLesson = {baseline:string;reuse:EvidenceKey[];tasks:ImplementationTask[]};
const patch=(ref:EvidenceKey,from:number,to=from):ImplementationPatch=>({ref,from,to});

export const implementationLessons:Record<string,ImplementationLesson>={
  quote:{
    baseline:'Workspace đã có Spring, BaseController, BaseFunc và các mẫu Controller. Riêng API tạo Policy và exec của CreatePolicyFunc được bỏ khỏi bản mô phỏng để bạn lắp lại. Các phần của bước 2–6 chưa được lắp.',
    reuse:['baseController','base','endpoint'],
    tasks:[
      {id:'api',title:'Xác định đầu vào và tìm mẫu Controller',why:'Chốt API nhận gì trước khi tạo đầu nhận. Mẫu sync có cùng cách nhận ID trên URL và dùng lớp nền.',ref:'endpoint',from:sources.endpoint.line-1,to:sources.endpoint.line+2,
        kind:'inspect',status:'Có sẵn để dùng',target:'Mẫu endpoint nhận ID · BaseController cung cấp context/executor',action:'Chọn đầu vào API',choices:['quoteId trên URL · String','CreateQuoteRequest trong body'],answer:'quoteId trên URL · String',correction:'API cần phát hành từ Quote đã lưu: POST /policy/create/{quoteId}. Mẫu CreateQuoteRequest dành cho tạo Quote.',
        result:'Hợp đồng mới: POST /policy/create/{quoteId}, đầu vào String quoteId. BaseController cung cấp applicationContext và executorService.',enables:'Tạo điểm nhận cùng kiểu dữ liệu ở Func.'},
      {id:'receiver',title:'Chuẩn bị điểm nhận ở Func',why:'Controller cần một method khớp kiểu trước khi nối lời gọi.',ref:'func',from:60,to:68,kind:'connect',status:'Cần tạo',target:'CreatePolicyFunc.exec(String quoteId) · method mới trong file sẵn có',
        action:'Tạo điểm nhận',choices:['exec(String quoteId)','exec(CreateQuoteRequest request)'],answer:'exec(String quoteId)',patches:[patch('func',60,68)],
        result:'Đã tạo khung exec(String quoteId), trả EntityWithIdAndVersion<PolicyAggregate>. Nội dung đọc và kiểm tra sẽ lắp ở bước 2.',enables:'Controller có điểm nhận để giao quoteId.'},
      {id:'endpoint',title:'Nối Controller với Func',why:'Đầu vào HTTP và điểm nhận đã khớp. Bây giờ thêm lời gọi theo mẫu lớp nền.',ref:'controller',from:43,to:46,kind:'connect',status:'Cần tạo',target:'PolicyController.createPolicy · endpoint mới trong file sẵn có',
        action:'Nối lời gọi API',choices:['CreatePolicyFunc · exec(quoteId)','FindPolicyByIdFunc · exec(quoteId)'],answer:'CreatePolicyFunc · exec(quoteId)',patches:[patch('controller',43,46)],
        result:'Controller lấy CreatePolicyFunc từ context, gọi exec(quoteId) trong supplyAsync và bọc WrapResponse.ok.',enables:'Bước 2 có quoteId để đọc Quote. Đây mới là điểm nối, chưa tạo Policy.'},
    ],
  },
  validate:{
    baseline:'Điểm nhận Controller → CreatePolicyFunc.exec(String quoteId) của bước 1 đã có. QuoteRepository, PolicyRepository và helper khóa/transaction có sẵn. Các lời đọc, điều kiện chặn trong Func được bỏ để bạn bổ sung; chưa có Command để ghi.',
    reuse:['quoteRepo','repo','base','lock'],
    tasks:[
      {id:'repository',title:'Tự tìm nơi đọc Quote',why:'Cần biết repository trả kiểu gì và ID nào trước khi gọi từ Func. Tìm QuoteRepository trong module 4-agent-shared-domain ở cây bên trái.',ref:'quoteRepo',from:18,to:21,
        kind:'inspect',status:'Có sẵn để dùng',target:'QuoteRepository extends JpaRepository<QuoteAggregate, String>',action:'Mở repository',
        result:'QuoteRepository đã có. findById(String) được kế thừa từ JpaRepository và trả Optional<QuoteAggregate>; không tạo repository mới.',enables:'Nối lời đọc trong CreatePolicyFunc bằng quoteId.'},
      {id:'read',title:'Nối lời gọi đọc trong Func',why:'Đã có hợp đồng đọc. Thêm lời gọi và bàn giao Quote cho callback nghiệp vụ; điều kiện chặn sẽ lắp ở lượt sau.',ref:'func',from:60,to:68,
        kind:'connect',status:'Cần sửa',target:'CreatePolicyFunc.exec · thêm lời đọc và callback vào method có từ bước 1',action:'Thêm lời gọi',choices:['quoteRepository.findById(quoteId)','policyRepository.findById(quoteId)'],answer:'quoteRepository.findById(quoteId)',
        correction:'quoteId xác định Quote. PolicyRepository cần Policy ID và không trả QuoteAggregate.',patches:[patch('func',61),patch('func',65,67)],
        result:'Đã nối Optional<QuoteAggregate> vào exec; Quote được giao cho runInternal qua execInTransactionAndLock.',enables:'Bổ sung guard trước optional.get() và trước phần dựng Command.'},
      {id:'guards',title:'Bổ sung điều kiện chặn',why:'Không lấy giá trị từ Optional rỗng và không phát hành lại khi đã có Policy NOT_RUNNING hoặc RUNNING cùng quoteCode.',ref:'func',from:61,to:78,
        kind:'connect',status:'Cần sửa',target:'exec L62–64 và runInternal L71–78 · hai nhánh kiểm tra',action:'Thêm điều kiện chặn',choices:['Chặn Quote thiếu + Policy đang tồn tại','Chỉ kiểm tra quoteId khác null'],answer:'Chặn Quote thiếu + Policy đang tồn tại',patches:[patch('func',62,64),patch('prepare',71,78)],
        result:'Thiếu Quote → QUOTE_NOT_EXIST. Có Policy cùng quoteCode ở hai trạng thái đã nêu → QUOTE_CAN_NOT_RELEASE_POLICY. Đọc đối tượng bảo hiểm QUOTE chưa xóa theo source.',enables:'Thử nhánh thiếu dữ liệu và nhánh hợp lệ mà chưa đi tới save.'},
      {id:'trials',title:'Thử hai tình huống trước khi dựng Command',why:'Kiểm tra guard có dừng đúng chỗ và nhánh hợp lệ có Quote để bước 3 sử dụng.',ref:'func',from:60,to:78,
        kind:'quote-trials',status:'Có sẵn để dùng',target:'Fixture Quote không tồn tại và Quote hợp lệ',action:'Thử hai nhánh',
        result:'Hai nhánh bắt buộc đã được thử trong mô phỏng. Có thể thử thêm fixture Quote đã có Policy RUNNING.',enables:'Nhánh hợp lệ cung cấp QuoteAggregate cho bước 3; nhánh lỗi không tạo Command hay Policy.'},
    ],
  },
  map:{
    baseline:'Controller, Func, lời đọc Quote và các guard của bước 1–2 đã có. CreatePolicyCommand, MappingUtils, getPolicyStatus và fillMissingValue là phần có sẵn để đối chiếu. Các lời map, gán riêng và gọi helper trong runInternal chưa được lắp.',
    reuse:['command','mapping','status','fill'],
    tasks:[
      {id:'contract',title:'Đọc dữ liệu Command cần nhận',why:'Xác định hợp đồng của tầng ghi để không coi Quote và Command là cùng một đối tượng.',ref:'command',from:27,to:45,kind:'inspect',status:'Có sẵn để dùng',target:'CreatePolicyCommand · policyType, quoteId, quoteCode, status',action:'Chọn dữ liệu bàn giao',choices:['CreatePolicyCommand','QuoteAggregate'],answer:'CreatePolicyCommand',
        result:'Command là đầu vào ghi, có quoteId/quoteCode, policyType và status. Tái sử dụng lớp đã có; không tạo thêm file Command.',enables:'Map các trường tương ứng từ Quote vào Command.'},
      {id:'mapping',title:'Nối trường tương ứng từ Quote',why:'Dùng MappingUtils sẵn có cho các trường cùng cấu trúc trước khi bổ sung quy tắc riêng.',ref:'prepare',from:80,to:91,kind:'connect',status:'Cần sửa',target:'CreatePolicyFunc.runInternal · lời map Quote → Command',action:'Nối ánh xạ',choices:['QuoteAggregate → CreatePolicyCommand','QuoteAggregate → PolicyViewEntity'],answer:'QuoteAggregate → CreatePolicyCommand',patches:[patch('prepare',83)],
        result:'MappingUtils.mapObject(quoteAggregate, CreatePolicyCommand.class) tạo Command từ Quote.',enables:'Gán những trường có tên hoặc ý nghĩa khác mà mapping không tự quyết định.'},
      {id:'rules',title:'Gán riêng và gọi helper tính trạng thái',why:'policyType lấy từ quoteType; status phụ thuộc mốc ngày. Những quyết định này cần chỉ ra ngay tại caller.',ref:'prepare',from:80,to:104,kind:'connect',status:'Cần sửa',target:'runInternal · gán riêng, getPolicyStatus và fillMissingValue',action:'Gán trường và tính trạng thái',choices:['quoteType → policyType · getPolicyStatus(now, effectiveDate, expirationDate)','Giữ nguyên mọi trường do mapper trả về'],answer:'quoteType → policyType · getPolicyStatus(now, effectiveDate, expirationDate)',patches:[patch('prepare',80,82),patch('prepare',84,100),patch('prepare',102,104)],
        result:'Command có loại Policy, ID/mã Quote, trạng thái theo ngày, người tạo, ngày và dữ liệu bổ sung. Các helper đã có được gọi lại; source giữ các phần thanh toán riêng.',enables:'Command sẵn sàng bàn giao cho cơ chế ghi ở bước 4.'},
    ],
  },
  save:{
    baseline:'Command của bước 3 đã được chuẩn bị. Lớp PolicyAggregate, Command/Event và cấu hình AggregateExtRepository đều có sẵn. Hai method process/apply cho CreatePolicy và lời save(command) trong Func chưa được lắp.',
    reuse:['command','event','repositoryBean','repositoryExtension','save','dispatch','applyLoop','jdbcWrite'],
    tasks:[
      {id:'event-contract',title:'Đối chiếu Command và Event',why:'Dispatcher tìm method bằng đúng kiểu tham số. Cần chọn Event tương ứng trước khi tạo hai method.',ref:'event',from:26,to:45,kind:'inspect',status:'Có sẵn để dùng',target:'CreatePolicyEvent · hợp đồng dữ liệu thay đổi',action:'Chọn Event',choices:['CreatePolicyEvent','CreateQuoteEvent'],answer:'CreatePolicyEvent',
        result:'CreatePolicyCommand tương ứng process(CreatePolicyCommand); Event trả về là CreatePolicyEvent và đầu nhận là apply(CreatePolicyEvent).',enables:'Chuẩn bị nội dung nghiệp vụ cho hai method trong Aggregate.'},
      {id:'aggregate',title:'Chuẩn bị process và apply trong Aggregate',why:'Repository sẽ tìm hai method qua lớp nền. process tạo Event; vòng áp dụng của khung mới gọi apply để đổi trạng thái.',ref:'aggregate',from:328,to:340,kind:'connect',status:'Cần tạo',target:'PolicyAggregate · hai method CreatePolicy trong file đã có',action:'Tạo xử lý Command và Event',choices:['process tạo Event · apply cập nhật this','process tự gọi apply rồi ghi JPA'],answer:'process tạo Event · apply cập nhật this',patches:[patch('aggregate',328,340)],
        result:'process map Command thành CreatePolicyEvent và trả EventUtil.events. apply map Event vào this, gán path đơn vị, người tạo/cập nhật và thời gian Event.',enables:'Cơ chế Aggregate Repository có đủ hai đầu xử lý đúng kiểu.'},
      {id:'save',title:'Nối thao tác ghi qua cơ chế đã xác minh',why:'Bean PlatformConfig là AggregateExtRepository kế thừa save. Không dùng save của JPA thay thế đường ghi này.',ref:'saveCall',from:112,to:115,kind:'connect',status:'Cần sửa',target:'CreatePolicyFunc.runInternal · policyAggregateRepository.save(command)',action:'Nối thao tác ghi',choices:['policyAggregateRepository.save(command)','policyRepository.save(command)'],answer:'policyAggregateRepository.save(command)',patches:[patch('saveCall',115)],
        result:'Đường ghi: save → processCommand → process → vòng applyEvent/apply → store → JDBC/JPA. Kết quả là Aggregate kèm Policy ID/version.',enables:'Dùng Policy ID để đồng bộ view ở bước 5. Source phía ghi có publish rỗng; chưa chứng minh đường chuyển bảng events lên Kafka.'},
    ],
  },
  flow:{
    baseline:'Bước 4 đã cung cấp Policy ID và trạng thái ghi. PolicyViewEntity, ViewRepository, InternalSPCommandApi và hạ tầng đăng ký handler đã có. Handler CreatePolicy và nhóm đọc/map/save view được bỏ khỏi mô phỏng. View fixture ban đầu chưa có dòng Policy này.',
    reuse:['viewEntity','viewRepository','internalApi','eventRegistration','eventInvoke'],
    tasks:[
      {id:'view-data',title:'Xác định dữ liệu phục vụ tra cứu',why:'Danh sách cần projection có mã Policy, khách hàng, trạng thái và searchingKey; cần Policy ID để lấy model nguồn.',ref:'viewEntity',from:23,to:46,kind:'inspect',status:'Có sẵn để dùng',target:'PolicyViewEntity · bảng policy_view_aggregate',action:'Chọn khóa dựng view',choices:['Policy ID · entityId của Event','Quote ID'],answer:'Policy ID · entityId của Event',
        result:'View dùng Policy ID làm id. SyncView đọc PolicyModel từ InternalSPCommandApi; ViewRepository lưu PolicyViewEntity.',enables:'Giữ entityId khi nối Workflow với SyncView.'},
      {id:'handler',title:'Nối xử lý Event',why:'Phía nhận đã đăng ký handler theo kiểu Event. Lắp method bàn giao đúng Policy ID cho SyncView.',ref:'workflow',from:23,to:32,kind:'connect',status:'Cần tạo',target:'PolicyWorkflow.createPolicy(DispatchedEvent<CreatePolicyEvent>)',action:'Nối điểm nhận Event',choices:['PolicySyncViewFunc.exec(de.getEntityId())','PolicySyncViewFunc.exec(quoteId)'],answer:'PolicySyncViewFunc.exec(de.getEntityId())',patches:[patch('workflow',23,32)],
        result:'Handler CreatePolicyEvent lấy entityId, gọi PolicySyncViewFunc và phần reload product/channel như source.',enables:'Có thể giao Event fixture cho phía nhận. Bài mô phỏng không giả định transport từ bảng events tới Kafka đã hoạt động.'},
      {id:'projection',title:'Dựng view và kiểm tra trước/sau',why:'Có đầu nhận nhưng danh sách chỉ có dữ liệu khi đọc model, tạo searchingKey, bổ sung thanh toán và save view.',ref:'sync',from:38,to:67,kind:'view',status:'Cần sửa',target:'PolicySyncViewFunc.exec · nhóm đọc, map và save trong callback',action:'Dựng view từ Event',choices:['Đọc theo Policy ID → map → searchingKey → mapPayment → save','Lưu nguyên CreatePolicyEvent vào view'],answer:'Đọc theo Policy ID → map → searchingKey → mapPayment → save',patches:[patch('sync',41,56)],
        result:'Event fixture đã vào callback SyncView; view chuyển từ chưa có sang một dòng cùng Policy ID. Kết quả giả định Command API fixture trả model hợp lệ.',enables:'Bước 6 có thể tìm danh sách và mở chi tiết bằng cùng Policy ID. Callback bất đồng bộ có thể khiến view chưa xuất hiện ngay trên backend.'},
    ],
  },
  result:{
    baseline:'Các bước 1–5 đã cung cấp Policy ID, dữ liệu ghi và một dòng view hợp lệ trong fixture. SearchPolicyFunc và FindPolicyByIdFunc có sẵn. Hai endpoint danh sách/chi tiết được bỏ khỏi bản mô phỏng để nối lại; dữ liệu và phạm vi xem mẫu đã phù hợp.',
    reuse:['search','queryRepository','detail','repo','viewEntity'],
    tasks:[
      {id:'list',title:'Nối danh sách với nguồn view',why:'Màn danh sách cần bộ lọc và phân trang trên projection, qua module Query.',ref:'queryController',from:24,to:27,kind:'connect',status:'Cần tạo',target:'Query PolicyController.search · POST /policy/search',action:'Nối danh sách',choices:['SearchPolicyRequest → SearchPolicyFunc.exec(request)','quoteId → CreatePolicyFunc.exec(quoteId)'],answer:'SearchPolicyRequest → SearchPolicyFunc.exec(request)',patches:[patch('queryController',24,27)],
        result:'Endpoint danh sách giao request cho SearchPolicyFunc, query policy_view_aggregate, rồi map Page<PolicyListResponse>.',enables:'Có dòng danh sách mang Policy ID để mở chi tiết. Page.empty cũng có thể đến từ nhánh bắt lỗi.'},
      {id:'detail',title:'Nối chi tiết theo Policy ID',why:'Chi tiết đọc nguồn ghi theo ID và ghép dữ liệu, khác đường query view của danh sách.',ref:'detailEndpoint',from:48,to:51,kind:'connect',status:'Cần tạo',target:'Command PolicyController · GET /policy/{id}',action:'Nối chi tiết',choices:['FindPolicyByIdFunc.exec(id)','FindQuoteByIdFunc.exec(id)'],answer:'FindPolicyByIdFunc.exec(id)',patches:[patch('detailEndpoint',48,51)],
        result:'GET /policy/{id} giao Policy ID cho FindPolicyByIdFunc. Tên method Controller trong source là paymentMethod; route và Func xác định trách nhiệm.',enables:'Đối chiếu cùng Policy ID ở danh sách và chi tiết.'},
      {id:'verify-id',title:'Dùng Policy ID kiểm tra hai đầu',why:'Xác nhận dòng view và chi tiết nguồn ghi cùng chỉ một Policy; không nhầm với quoteId ban đầu.',ref:'detail',from:31,to:37,kind:'read-check',status:'Có sẵn để dùng',target:'Fixture danh sách Query và chi tiết Command',action:'Kiểm tra hai đầu',
        result:'Hai đầu đã trả cùng Policy ID trong fixture. Danh sách lấy view; chi tiết lấy PolicyRepository và ghép insured objects/thanh toán.',enables:'Hoàn tất sáu bài thực hành. Có thể quay lại từng lượt để xem kết quả hoặc làm lại bài hiện tại.'},
    ],
  },
};

export const implementationOrder=['quote','validate','map','save','flow','result'];
export const implementationChanges=implementationOrder.flatMap((stepId,stepIndex)=>implementationLessons[stepId].tasks.flatMap(task=>(task.patches??[]).map(p=>({...p,stepId,stepIndex,taskId:task.id,title:task.title}))));

// Preserve snapshot line anchors even in the simulation, where omitted regions
// become placeholders. Any overlapping future patch still hides its own code.
export function implementationRows(ref:EvidenceKey,stepId:string,done:string[],omitTask?:string) {
  const stepIndex=implementationOrder.indexOf(stepId),source=sources[ref];
  const pending=implementationChanges.filter(p=>sources[p.ref].path===source.path&&(p.stepIndex>stepIndex||(p.stepId===stepId&&(!done.includes(p.taskId)||p.taskId===omitTask))));
  return source.rows.flatMap(row=>{
    const covering=pending.filter(p=>row.line>=p.from&&row.line<=p.to);
    if(!covering.length)return [row];
    const first=covering.find(p=>p.from===row.line);
    return first?[{line:row.line,text:`        // Chưa lắp: ${first.title}`}]:[];
  });
}

export function implementationFiles(stepId:string) {
  const index=implementationOrder.indexOf(stepId),lesson=implementationLessons[stepId];
  const refs=[...lesson.tasks.map(t=>t.ref),...lesson.reuse,...implementationOrder.slice(index+1).flatMap(id=>implementationLessons[id].tasks.map(t=>t.ref))];
  const files=new Map<string,{id:EvidenceKey;path:string}>();
  for(const ref of refs)if(!files.has(sources[ref].path))files.set(sources[ref].path,{id:ref,path:sources[ref].path});
  return [...files.values()];
}
