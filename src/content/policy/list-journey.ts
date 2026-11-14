import {listStages,listEdges} from './list';
import type {evaluateList} from '../../policy/list-model';

// One journey is shared by overview, replay and assembly. Checkpoints stay technical.
export const listJourney=[
 {id:'find',title:'Tìm hợp đồng',points:['list-api','list-input'],action:'Nhập tiêu chí và bấm Tìm',outcome:'Tiêu chí được gửi thành một yêu cầu tìm kiếm.',description:'Người bán nhập từ khóa, chọn trạng thái rồi gửi yêu cầu. Tiêu chí chưa gửi không làm đổi kết quả cũ.'},
 {id:'scope',title:'Xác định hợp đồng được hiển thị',points:['list-scope','list-filter'],action:'Quan sát phạm vi và điều kiện',outcome:'Tiêu chí người dùng giao với phạm vi backend áp dụng.',description:'Cùng tiêu chí tìm kiếm, người bán và quản lý có thể xem những tập hợp đồng khác nhau. Phạm vi lấy từ danh tính backend.'},
 {id:'results',title:'Xem kết quả và đổi trang',points:['list-page','list-result','list-table'],action:'Nhận kết quả rồi sang trang tiếp',outcome:'Thấy tổng số hợp đồng và các dòng của từng trang.',description:'Mỗi lần đổi trang gửi request mới, giữ nguyên tiêu chí và danh tính của lượt tìm đã gửi.'},
 {id:'detail',title:'Mở chi tiết hợp đồng',points:['list-handoff'],action:'Chọn một dòng và mở Chi tiết',outcome:'ID của dòng được bàn giao nguyên vẹn sang Chi tiết.',description:'Chọn đúng Policy ID của dòng đang hiển thị. Policy ID, quoteId và mã hợp đồng là các dữ liệu khác nhau.'},
] as const;
export type ListJourneyStep=typeof listJourney[number];
export function journeyForPoint(point:string|null){return listJourney.find(s=>s.points.some(p=>p===point));}
export function currentListStep(params:URLSearchParams){
 const point=params.get('node')??params.get('point');
 const legacy=point==='list-source'?'list-page':point==='list-response'?'list-result':point;
 const legacyPart=params.get('listPart');
 return journeyForPoint(legacy)??listJourney.find(s=>s.id===params.get('listJourney'))??journeyForPoint(listEdges.find(e=>e.id===legacyPart)?.from??legacyPart)??listJourney[0];
}
export function listStepChanges(step:ListJourneyStep){return {listJourney:step.id,node:step.points[0],point:step.points[0],ref:null,listRef:null,listLine:null,listTo:null,listPatternRef:null,listPatternLine:null,listPatternTo:null,listPatternFull:null,listPatternTone:null,listDiagram:null,listDiagramRef:null,listDiagramLine:null,listDiagramTo:null};}
export function pointsFor(step:ListJourneyStep){return listStages.filter(s=>step.points.some(p=>p===s.id));}

type Decision={title:string;question:string;options:[string,string];feedback:[string,string];point:string};
export function listDecisions(step:ListJourneyStep,r:ReturnType<typeof evaluateList>,selected:string|null):Decision[]{
 switch(step.id){
  case 'find':return [
   {title:'Gửi dữ liệu gì?',question:`Tìm “${r.request.keyword??''}”, trạng thái ${r.request.status??'tất cả'}. Màn hình cần gửi gì?`,options:['Gửi tiêu chí trong SearchPolicyRequest','Gửi SQL và tự chọn pathSaleUnitIds'],feedback:['Controller nhận JSON body; quyền xem không thuộc tiêu chí do người học nhập.','Body không quyết định phạm vi. SearchPolicyFunc lấy danh tính từ backend.'],point:'list-api'},
   {title:'Trang bắt đầu ở đâu?',question:`Request ${r.request.pageNumber===undefined?'bỏ pageNumber':`có pageNumber=${r.request.pageNumber}`}. Trang đầu và mặc định được xác định ở đâu?`,options:['Trang đầu là 0; lớp cha mặc định 0/10 nếu bỏ trường','Trang đầu là 1; màn hình luôn phải gửi toàn bộ trường'],feedback:['SearchPolicyRequest kế thừa BasePageAndSortRequest → BasePageRequest; pageNumber=0, pageSize=10.','Số trang hiển thị bắt đầu từ 1, tham số request bắt đầu từ 0.'],point:'list-input'},
  ];
  case 'scope':return [
   {title:'Ai xác định phạm vi?',question:`Danh tính đang xem: ${r.persona}; keyword “${r.request.keyword??''}”. Ai quyết định phạm vi ${r.scope??'không giới hạn / chưa xác định'}?`,options:['Backend đọc SaleUnitView từ username rồi áp dụng phạm vi','Người dùng thêm đơn vị bán tùy ý vào body'],feedback:['SearchPolicyFunc dùng SessionUtils hoặc localUsername; người bán dùng id, quản lý dùng rootId; OWNER/IT_ADMIN bỏ điều kiện phạm vi.','Tiêu chí tìm kiếm không cấp quyền. Username vẫn cần có SaleUnitView, kể cả nhánh bỏ điều kiện phạm vi.'],point:'list-scope'},
   {title:'Ghép tiêu chí thế nào?',question:`Keyword được chuẩn hóa thành “${r.normalized}”. Các điều kiện tìm kiếm kết hợp với phạm vi thế nào?`,options:['QueryUtil nối AND; filter đơn và list giao nhau','Filter mới ghi đè phạm vi và filter cũ'],feedback:['ANY(pathSaleUnitIds) của backend AND các điều kiện LIKE, =, IN, BETWEEN. Số 0 vẫn là giá trị filter.','Các nhánh if độc lập đều thêm AND. status=100 và listStatus=["0"] cho giao rỗng.'],point:'list-filter'},
  ];
  case 'results':return [
   {title:'Đổi trang giữ gì?',question:`Có ${r.page.totalElements} dòng phù hợp, đang gửi pageNumber=${r.request.pageNumber??0}, pageSize=${r.request.pageSize??10}. Sang trang sau thay đổi gì?`,options:['Giữ tiêu chí và danh tính đã gửi; tăng pageNumber','Lấy tiêu chí chưa gửi và tải tất cả dòng để chia ở màn hình'],feedback:['Repository count cùng WHERE rồi OFFSET/LIMIT. Request mới chỉ thay pageNumber; draft chưa gửi không làm đổi tập kết quả.','Đổi trang dựa vào request đã gửi. Page.content chỉ chứa một trang do repository trả về.'],point:'list-page'},
   {title:'Trang rỗng nghĩa là gì?',question:`Kết quả hiện có ${r.page.content.length} dòng; wrapper success=true. Có đủ để kết luận không có hợp đồng?`,options:['Phân biệt không khớp tiêu chí và catch trả Page.empty()','success=true luôn chứng minh không có dữ liệu'],feedback:['SearchPolicyFunc.exec bắt Exception và trả Page.empty(); cần đối chiếu nhánh lỗi. page.map giữ metadata và ID của kết quả hợp lệ.','WrapResponse.ok vẫn bọc success=true khi exec trả Page.empty(). Thử kết quả rỗng và lỗi trong phần mở rộng.'],point:'list-result'},
  ];
  case 'detail':return [
   {title:'Bàn giao dữ liệu nào?',question:`Dòng đang chọn: ${selected??'(chưa chọn dòng)'}. Một dòng có Policy ID, quoteId và policyCode. Dùng trường nào để mở Chi tiết?`,options:['PolicyListResponse.id → GET /policy/{id}','Dùng quoteId hoặc mã hợp đồng thay ID'],feedback:['Giữ nguyên ID của dòng thực sự có trong trang. Đích là PolicyController.paymentMethod ở Command.','quoteId chỉ ra báo giá nguồn; policyCode là mã hiển thị. API Chi tiết nhận Policy ID.'],point:'list-handoff'},
   {title:'Đã biết quyền Chi tiết?',question:'Một dòng xuất hiện trong Danh sách có đủ chứng minh quyền truy cập endpoint Chi tiết?',options:['Cần xác minh quyền Chi tiết riêng từ backend','Mọi dòng xem được trong Danh sách đều bỏ qua kiểm tra Chi tiết'],feedback:['Source xác nhận đích GET và ID bàn giao. Bài học chưa xác minh quyền truy cập Chi tiết ở runtime.','Không suy ra quyền endpoint Chi tiết từ bộ lọc Danh sách.'],point:'list-handoff'},
  ];
 }
}
