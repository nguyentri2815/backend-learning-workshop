import { creationContext } from './create-model';
import type { SampleQuote } from './create-model';

export const practiceSteps = [
  {id:'quote',title:'Phát hành từ Quote',action:'Đọc Chi tiết báo giá, bấm Phát hành thành hợp đồng rồi lần request vào backend.'},
  {id:'validate',title:'Kiểm tra Quote',action:'Chạy từng câu lệnh có ý nghĩa; đối chiếu biến trước/sau và điểm rẽ kế tiếp.'},
  {id:'map',title:'Dựng dữ liệu Policy',action:'Chọn trường để theo dõi từ Quote qua dòng ánh xạ tới CreatePolicyCommand.'},
  {id:'save',title:'Ghi Policy',action:'Thực hiện bước ghi mô phỏng rồi đối chiếu Policy, đối tượng bảo hiểm và liên kết trên Quote.'},
  {id:'flow',title:'Cập nhật dữ liệu tra cứu',action:'Tìm bản ghi trước khi có view, rồi cho Flow xử lý event và so sánh hai checkpoint.'},
  {id:'result',title:'Xem kết quả',action:'Tìm Policy vừa tạo, mở chi tiết và đối chiếu cùng policyId; thử mở trực tiếp bằng ID.'},
] as const;

export function quoteInsurance(quote:SampleQuote) {
  return quote.missing?[]:[{id:`INS-${quote.id}`,entityId:quote.id,entityCode:quote.quoteCode,objectType:'QUOTE',deleted:false,name:'Đối tượng bảo hiểm mẫu'}];
}
export function policyInsurance(quote:SampleQuote,policy:ReturnType<typeof creationContext>['policy']) {
  return quoteInsurance(quote).map(object=>({id:`INS-${policy.id}`,objectType:'POLICY',entityId:policy.id,entityCode:policy.policyCode,entityStatus:policy.status,policyCode:policy.policyCode,quoteCode:quote.quoteCode,secondEntityId:quote.id,secondEntityCode:quote.quoteCode,secondInsuranceId:object.id}));
}

type Variables=Record<string,unknown>;
export interface DebugInstruction {
  title:string; line:number; end?:number; before:Variables; after:Variables; changed?:string[]; observed?:Variables; purpose:string; branch:string; error?:string; passed?:boolean; enter?:boolean;
}
export function debugInstructions(quote:SampleQuote):DebugInstruction[] {
  const optional=quote.missing?{present:false,value:null}:{present:true,value:{id:quote.id,quoteCode:quote.quoteCode}};
  const base={quoteId:quote.id,optional};
  const found={...base,quoteAggregate:{id:quote.id,quoteCode:quote.quoteCode}};
  const internal={quoteAggregate:found.quoteAggregate};
  const policies=quote.blocked?[{id:'POL-EXISTING-103',quoteCode:quote.quoteCode,status:100}]:[];
  const status={...internal,status:[0,100]};
  const filtered={...status,policyAggregateList:policies};
  const objects={...filtered,insuranceObjectList:quoteInsurance(quote)};
  const read:DebugInstruction={title:'Đọc Quote bằng ID',line:61,before:{quoteId:quote.id,optional:'Chưa gán'},after:base,changed:['optional'],purpose:'Lần đọc 1: quoteRepository.findById(quoteId) đọc quote_aggregate, chưa tìm Policy.',branch:'Tiếp theo: optional.isEmpty() ở dòng 62.'};
  const guard:DebugInstruction={title:'Rẽ nhánh khi không có Quote',line:62,end:quote.missing?63:62,before:base,after:base,observed:{'optional.isEmpty()':quote.missing},purpose:'Quote phải tồn tại trước khi optional.get() và trước khi dùng quoteCode.',branch:quote.missing?'DỪNG ở dòng 63. Không chạy truy vấn Policy, không dựng command.':'Có Quote → tiếp tục optional.get(), rồi vào runInternal trong khóa Quote.',error:quote.missing?'AGENT.QUOTE_NOT_EXIST':undefined};
  if(quote.missing)return [read,guard];
  return [read,guard,
    {title:'Lấy Quote từ optional',line:66,before:base,after:found,changed:['quoteAggregate'],purpose:'optional.get() cung cấp quoteAggregate; quoteCode này dùng ở lần đọc Policy tiếp theo.',branch:'Tiếp theo: dừng ở lời gọi execInTransactionAndLock tại L67.'},
    {title:'Dừng ở lời gọi runInternal',line:67,before:found,after:found,purpose:'execInTransactionAndLock nhận khóa Quote và lambda () -> runInternal(quoteAggregate). Chưa bước vào thân runInternal.',branch:'Bấm “Vào runInternal” để tới đầu hàm L70, truyền nguyên quoteAggregate đang có.'},
    {title:'Vào runInternal với Quote đã đọc',line:70,before:internal,after:internal,purpose:'Chuyển trong cùng CreatePolicyFunc.java từ L67 tới L70. Phạm vi mới chỉ có tham số quoteAggregate; optional và quoteId thuộc exec.',branch:'Tiếp theo: status=[NOT_RUNNING(0), RUNNING(100)] và truy vấn Policy cùng quoteCode tại L74.',enter:true},
    {title:'Đọc Policy cùng quoteCode',line:74,before:{...status,policyAggregateList:'Chưa đọc'},after:filtered,changed:['policyAggregateList'],purpose:'L71–73 chuẩn bị status=[0,100]. L74 tìm Policy cùng quoteCode, khác lần đọc Quote theo ID.',branch:`Trả ${policies.length} Policy. Source còn đọc đối tượng QUOTE ở dòng 75 trước khi rẽ tại dòng 76.`},
    {title:'Đọc đối tượng bảo hiểm của Quote',line:75,before:{...filtered,insuranceObjectList:'Chưa đọc'},after:objects,changed:['insuranceObjectList'],purpose:'Đọc đối tượng QUOTE, deleted=false; dữ liệu này dùng để chia phí và tạo đối tượng POLICY sau đó.',branch:'Tiếp theo: policyAggregateList.size() != 0 ở dòng 76.'},
    {title:'Quyết định có được tạo Policy',line:76,end:quote.blocked?77:76,before:objects,after:objects,observed:{'policyAggregateList.size()':policies.length,'policyAggregateList.size() != 0':quote.blocked},purpose:'Chặn khi đã có Policy cùng quoteCode ở 0 hoặc 100; các trạng thái khác không nằm trong truy vấn này.',branch:quote.blocked?'DỪNG ở dòng 77. Chưa gọi save(CreatePolicyCommand).':'Danh sách rỗng → tiếp tục bước 3 để dựng CreatePolicyCommand.',error:quote.blocked?'AGENT.QUOTE_CAN_NOT_RELEASE_POLICY':undefined,passed:!quote.blocked},
  ];
}

export function practiceContext(params:URLSearchParams) {
  const created=creationContext(params);
  const instructions=debugInstructions(created.quote);
  const convert=(raw:number)=>params.get('debugVersion')==='2'||created.quote.missing?raw:([0,1,2,4,6,7,8][raw]??raw);
  const raw=convert(Number(params.get('debug')??(created.level>=1||params.get('attempt')==='failed'?instructions.length:0)));
  const cursor=Number.isInteger(raw)?Math.max(0,Math.min(raw,instructions.length)):0;
  const rawMax=params.has('debugMax')?Number(params.get('debugMax')):cursor;
  const reached=Math.min(instructions.length,Math.max(cursor,Number.isInteger(rawMax)?rawMax:0,created.level>=1||params.get('attempt')==='failed'?instructions.length:0));
  const instruction=instructions[Math.max(0,cursor-1)];
  const hasRequest=params.get('sentQuote')===created.quote.id||created.level>0;
  const backendOpen=hasRequest&&(params.get('backend')==='1'||created.level>0||Boolean(params.get('node')&&params.get('node')!=='quote'));
  const failed=(params.get('attempt')==='failed'||cursor>0&&Boolean(instruction.error))&&(created.quote.missing||created.quote.blocked);
  const error=created.quote.missing?'AGENT.QUOTE_NOT_EXIST':'AGENT.QUOTE_CAN_NOT_RELEASE_POLICY';
  const complete=[backendOpen,created.level>=1,created.level>=2,created.commandReady,created.viewReady,created.viewReady&&params.get('resultViewed')==='1'];
  const execution=instructions[Math.max(0,reached-1)];
  return {...created,instructions,cursor,reached,instruction,execution,hasRequest,backendOpen,failed,error,complete,resultSearched:params.get('resultSearch')==='1',resultDetail:params.has('resultDetail')};
}
