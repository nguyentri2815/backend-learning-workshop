import type { ExecutionSession } from './policy-execution';

export interface MainTraceNode {id:string;stage:string;title:string;ids:string[];branch?:string;parent?:string}
export const mainTraceNodes:MainTraceNode[]=[
 {id:'ui',stage:'quote',title:'Phát hành từ Quote',ids:['quote-ui']},
 {id:'request',stage:'quote',title:'Gửi request',ids:['quote-request']},
 {id:'controller',stage:'quote',title:'Controller nhận quoteId và gọi exec',ids:['controller-call']},
 {id:'read',stage:'validate',title:'Vào exec · Tìm Quote',ids:['quote-read']},
 {id:'optional',stage:'validate',title:'Kiểm tra Quote tồn tại',ids:['quote-guard']},
 {id:'missing',stage:'validate',title:'QUOTE_NOT_EXIST · dừng L63',ids:['quote-guard'],branch:'missing',parent:'optional'},
 {id:'call',stage:'validate',title:'Lấy Quote · lời gọi runInternal',ids:['quote-get','internal-call']},
 {id:'enter',stage:'validate',title:'Vào runInternal',ids:['internal-enter']},
 {id:'duplicate-data',stage:'validate',title:'Đọc dữ liệu kiểm tra trùng · L74 → L75',ids:['duplicate-read','objects-read']},
 {id:'guard',stage:'validate',title:'Quyết định tại L76',ids:['duplicate-guard']},
 {id:'duplicate',stage:'validate',title:'QUOTE_CAN_NOT_RELEASE_POLICY · dừng L77',ids:['duplicate-guard'],branch:'duplicate',parent:'guard'},
 {id:'dates',stage:'map',title:'Đọc ngày từ Quote',ids:['map-dates']},
 {id:'mapping',stage:'map',title:'Dựng CreatePolicyCommand',ids:['map-command']},
 {id:'status-call',stage:'map',title:'Gọi getPolicyStatus',ids:['status-call']},
 {id:'status',stage:'map',title:'Vào method · chọn trạng thái theo ngày',ids:['status-enter','status-choice']},
 {id:'status-zero',stage:'map',title:'Trước hiệu lực → NOT_RUNNING(0)',ids:['status-choice'],branch:'status0',parent:'status'},
 {id:'status-expired',stage:'map',title:'Đã hết hạn → EXPIRED(-1)',ids:['status-choice'],branch:'status-1',parent:'status'},
 {id:'status-running',stage:'map',title:'Còn hiệu lực → RUNNING(100)',ids:['status-choice'],branch:'status100',parent:'status'},
 {id:'status-return',stage:'map',title:'Trả về nơi gọi · gán status',ids:['status-return']},
 {id:'date-fields',stage:'map',title:'Gán ngày và dữ liệu liên quan',ids:['map-effective']},
 {id:'fill-call',stage:'map',title:'Dừng ở lời gọi fillMissingValue',ids:['fill-call']},
 {id:'fill-body',stage:'map',title:'Vào fillMissingValue · bổ sung command',ids:['fill-enter','fill-id','fill-name','fill-rest']},
 {id:'personal',stage:'map',title:'PERSONAL(0) → name',ids:['fill-name'],branch:'personal',parent:'fill-body'},
 {id:'organization',stage:'map',title:'Khác PERSONAL → organizationName',ids:['fill-name'],branch:'organization',parent:'fill-body'},
 {id:'fill-return',stage:'map',title:'Trả về runInternal sau L102',ids:['fill-return']},
 {id:'code',stage:'map',title:'Sinh mã · chuẩn bị ghi',ids:['map-code','map-sync']},
 {id:'save',stage:'save',title:'Gọi ghi từ command đã dựng',ids:['save-call']},
 {id:'event',stage:'save',title:'process tạo CreatePolicyEvent',ids:['save-event']},
 {id:'apply',stage:'save',title:'apply event lên aggregate',ids:['save-apply']},
 {id:'jpa',stage:'save',title:'Gắn ID → ghi aggregate',ids:['save-id','save-jpa']},
 {id:'insurance',stage:'save',title:'Trả về · tạo đối tượng POLICY',ids:['insurance-call','insurance-save']},
 {id:'published',stage:'save',title:'Trả về · cập nhật liên kết Quote',ids:['published-call','published-write']},
 {id:'return',stage:'save',title:'Trả kết quả về nơi gọi',ids:['save-return']},
 {id:'handler',stage:'flow',title:'Qua event → Flow nhận xử lý',ids:['flow-event']},
 {id:'executor',stage:'flow',title:'Gọi method · chạy trong executor',ids:['flow-executor']},
 {id:'command',stage:'flow',title:'Đọc Command theo ID',ids:['flow-read']},
 {id:'view-guard',stage:'flow',title:'Kiểm tra policyModel',ids:['flow-guard']},
 {id:'absent',stage:'flow',title:'policyModel null → return L43',ids:['flow-guard'],branch:'view-null',parent:'view-guard'},
 {id:'view',stage:'flow',title:'Ghi bản ghi tra cứu',ids:['flow-write']},
 {id:'realtime',stage:'flow',title:'Queue thông báo',ids:['flow-realtime']},
 {id:'query-ui',stage:'result',title:'Người dùng tra cứu · request danh sách',ids:['result-request']},
 {id:'query',stage:'result',title:'Query trả danh sách',ids:['result-query']},
 {id:'detail-ui',stage:'result',title:'Người dùng mở ID · request chi tiết',ids:['detail-request']},
 {id:'detail',stage:'result',title:'Command trả chi tiết',ids:['detail-read']},
 {id:'compare',stage:'result',title:'Đối chiếu cùng Policy ID',ids:['result-compare']},
];
export function branchSelected(n:MainTraceNode,s:ExecutionSession):boolean|undefined {
 if(!n.branch||!s.done.has(n.ids[0]))return undefined;
 if(n.branch==='missing')return s.context.quote.missing;
 if(n.branch==='duplicate')return s.context.quote.blocked;
 if(n.branch==='view-null')return false;
 if(n.branch.startsWith('status'))return s.context.policy.status===Number(n.branch.slice(6));
 return n.branch==='personal'?Number(s.context.quote.customerModel.type)===0:Number(s.context.quote.customerModel.type)!==0;
}
export function traceNodeState(n:MainTraceNode,s:ExecutionSession){
 const selected=branchSelected(n,s);
 if(n.branch){if(selected===undefined)return 'unknown';if(!selected)return 'skipped';if((n.branch==='missing'||n.branch==='duplicate')&&s.stop.id===n.ids[0])return 'blocked';return 'done';}
 if(n.ids.includes(s.stop.id)&&!(s.stop.error&&s.done.has(s.stop.id)))return 'current';
 if(n.ids.includes(s.view.id)&&s.view.id!==s.stop.id)return 'reviewing';
 return n.ids.every(id=>s.done.has(id))?'done':'pending';
}
export function arrowLabel(from:MainTraceNode,to:MainTraceNode){
 if(to.id==='request')return 'Gửi request';if(to.id==='controller')return 'HTTP → Controller';
 if(from.id==='duplicate-data')return 'L74 → L75 → kiểm tra L76';
 if(to.branch==='missing')return 'Quote thiếu';if(to.branch==='duplicate')return 'Có Policy trùng';
 if(to.branch==='personal')return 'Cá nhân';if(to.branch==='organization')return 'Tổ chức';if(to.branch==='view-null')return 'null · dừng';
 if(to.branch==='status0')return 'now trước effectiveDate';if(to.branch==='status-1')return 'expirationDate trước now';if(to.branch==='status100')return 'Còn lại';
 if(from.id==='optional')return 'Có Quote';if(from.id==='view-guard')return 'Có dữ liệu';
 if(['enter','status','fill-body','event','apply','executor','query','detail'].includes(to.id))return 'Gọi method';
 if(['status-return','fill-return','insurance','published','return'].includes(to.id))return 'Trả về nơi gọi';
 if(to.id==='detail-ui')return 'Thao tác người dùng · đọc độc lập';return 'Tiếp tục';
}
