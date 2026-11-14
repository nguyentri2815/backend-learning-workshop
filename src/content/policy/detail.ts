import snapshot from './detail-source.json' with {type:'json'};
export const detailSource=snapshot;
export type DetailSourceId=keyof typeof snapshot.sources;
export type DetailFocus={ref:DetailSourceId;from:number;to:number};
export const detailJourney=[
 {id:'open',title:'Mở hợp đồng',points:['detail-api'],description:'Chọn một dòng Danh sách hoặc nhập Policy ID. Cả hai đường cùng gửi GET /policy/{id}, không có JSON body.',input:'PolicyListResponse.id hoặc ID trên liên kết',action:'Giữ đúng ID và mở hợp đồng',output:'Controller nhận Policy ID trên path.'},
 {id:'find',title:'Tìm hồ sơ hợp đồng',points:['detail-find','detail-record'],description:'Đọc hồ sơ chính bằng ID từ Command. Không tìm thấy thì ném POLICY_NOT_EXIST và dừng trước lần đọc đối tượng.',input:'policyId từ Controller',action:'Quan sát hồ sơ chính và nhánh không tìm thấy',output:'PolicyAggregate hoặc ServiceException.'},
 {id:'related',title:'Lấy thông tin liên quan',points:['detail-objects','detail-objects-query','detail-map','detail-payment'],description:'Đọc đối tượng theo entityId, POLICY và deleted=false. Ghép thanh toán từ hồ sơ chính; không gọi thêm repository thanh toán.',input:'Hồ sơ chính đã tìm thấy',action:'Đối chiếu nguồn của đối tượng và thanh toán',output:'PolicyDetailResponse có insuredObjects và paymentInfoPolicyModel.'},
 {id:'display',title:'Hiển thị chi tiết',points:['detail-return','detail-response'],description:'Func trả DTO, Controller bọc WrapResponse.ok. Chọn từng vùng trên màn hình mô phỏng để lần về trường response và source.',input:'PolicyDetailResponse đã ghép',action:'Nhận response và khám phá từng nhóm thông tin',output:'Hợp đồng, đối tượng bảo hiểm và thông tin thanh toán.'},
] as const;
export type DetailStep=typeof detailJourney[number];
export const detailPoints:{id:string;title:string;method:string;ref:DetailSourceId;from:number;to:number;why:string;supports:DetailSourceId[]}[]=[
 {id:'detail-api',title:'Nhận Policy ID',method:'PolicyController.paymentMethod',ref:'api',from:48,to:50,why:'@RequestMapping("policy") kết hợp @GetMapping("/{id}"). Path ID được chuyển nguyên vẹn vào Func trong CompletableFuture.',supports:['listResponse','security']},
 {id:'detail-find',title:'Đọc hồ sơ chính',method:'FindPolicyByIdFunc.exec',ref:'find',from:31,to:32,why:'policyRepository.findById(policyId) đọc PolicyAggregate. Repository kế thừa JpaRepository<PolicyAggregate, String>.',supports:['repository','policy']},
 {id:'detail-record',title:'Kiểm tra hồ sơ tìm thấy',method:'FindPolicyByIdFunc.exec',ref:'find',from:32,to:32,why:'Optional rỗng ném ServiceException(POLICY_NOT_EXIST). Không tiếp tục đọc đối tượng, không ghép response thành công.',supports:['error','exception','handler']},
 {id:'detail-objects',title:'Gửi điều kiện đọc đối tượng',method:'FindPolicyByIdFunc.exec',ref:'find',from:33,to:33,why:'Sau khi có hồ sơ chính, luôn gọi đọc đối tượng bằng cùng policyId, loại POLICY=1, deleted=false.',supports:['objectType']},
 {id:'detail-objects-query',title:'Nhận các đối tượng còn hiệu lực dữ liệu',method:'InsuranceObjectRepository.findAllByEntityIdAndObjectTypeAndDeleted',ref:'objects',from:11,to:13,why:'Truy vấn entityId, objectType, deleted; ORDER BY id asc. Danh sách rỗng không gây lỗi tại Func này.',supports:['objectEntity']},
 {id:'detail-map',title:'Ánh xạ hồ sơ và đối tượng',method:'FindPolicyByIdFunc.exec',ref:'find',from:34,to:35,why:'Map hồ sơ sang PolicyDetailResponse, map danh sách đối tượng sang InsuranceDetailResponse rồi gán insuredObjects.',supports:['response','objectResponse','mapping']},
 {id:'detail-payment',title:'Ghép thông tin thanh toán',method:'FindPolicyByIdFunc.buildPaymentInfoPolicyModel',ref:'find',from:40,to:63,why:'Lấy trường từ PolicyAggregate. createdTime đi qua checkoutInfo.tx; paymentOrderNo dùng checkoutInfo với SmartPay/VNPay/PayMe, còn lại dùng checkoutInfoForPolicy. Thiếu checkout tương ứng trả null.',supports:['payment','checkout','tx','constants','policy']},
 {id:'detail-return',title:'Trả DTO đã ghép',method:'FindPolicyByIdFunc.exec',ref:'find',from:36,to:37,why:'Gán paymentInfoPolicyModel và trả PolicyDetailResponse sau các lần đọc/ánh xạ.',supports:['response','payment']},
 {id:'detail-response',title:'Nhận response và hiển thị',method:'PolicyController.paymentMethod',ref:'api',from:49,to:50,why:'WrapResponse.ok bọc data, success=true, statusCode="200". Các vùng UI là mô phỏng Workshop theo hợp đồng response đã xác minh.',supports:['wrap','response']},
];
export function detailStepFor(point:string|null){return detailJourney.find(s=>s.points.some(p=>p===point));}
export function currentDetailStep(params:URLSearchParams){return detailStepFor(params.get('node')??params.get('point'))??detailJourney.find(s=>s.id===params.get('detailJourney'))??detailJourney[0];}
export function detailStepChanges(step:DetailStep){return {detailJourney:step.id,node:step.points[0],point:step.points[0],ref:null,detailRef:null,detailLine:null,detailTo:null};}
export const detailGroups=[
 {id:'main',label:'Thông tin hợp đồng',field:'data.id / policyCode / customerName / status',point:'detail-map',ref:'find',from:34,to:34},
 {id:'insured',label:'Đối tượng bảo hiểm',field:'data.insuredObjects',point:'detail-map',ref:'find',from:35,to:35},
 {id:'payment',label:'Thông tin thanh toán',field:'data.paymentInfoPolicyModel',point:'detail-payment',ref:'find',from:40,to:63},
] as const;
