import captured from './beginner-source.json' with {type:'json'};
import type {SourceCatalog} from '../../policy/learning-contracts';
import type {CodeRow} from '../../workshop/source';
import {diffRows} from '../../workshop/source';
import type {SessionRound} from './implementation-session';

export const beginnerTitle='Xây Policy từ Quote · Dành cho người mới';
export type BeginnerRound=SessionRound&{question:string;options:string[];answer:number;hint:string;sample:string;check:string;terms:string;requiredTrials?:string[]};
const originals:SourceCatalog=captured;
const rows=(text:string):{line:number;text:string}[]=>text.trim().split('\n').map((text,i)=>({line:i+1,text}));
const code=(ref:string,from:number,to:number)=>originals[ref].rows.slice(from-1,to).map(r=>r.text).join('\n');
const documents:SourceCatalog={};
let workspace:Record<string,string>={};
const snapshots:Record<string,string>[]=[];
export const beginnerRounds:BeginnerRound[]=[];
function document(ref:string,sourceRef:string,text:string){documents[ref]={...originals[sourceRef],rows:rows(text)};workspace[ref]=text.trim();}
function evidence(ref:string,from:number,to:number,finding:string){return {ref:'source-'+ref,from,to:Math.min(to,originals[ref].rows.length),finding};}
type Input=Omit<BeginnerRound,'patches'|'action'|'lesson'> & {action?:string;changes?:Record<string,string>};
function round(input:Input){
 const {changes={},...rest}=input;
 const patches=Object.entries(changes).map(([ref,text])=>{
  const difference=diffRows(documents[ref].path,workspace[ref]??'',text.trim(),false);
  const added=difference.filter(r=>r.kind==='add').map(r=>r.newLine!);
  workspace[ref]=text.trim();documents[ref]={...documents[ref],rows:rows(text)};
  return {ref,from:Math.min(...added,rows(text).length),to:Math.max(...added,1)};
 });
 beginnerRounds.push({...rest,result:patches.length?'Đã áp dụng thay đổi của lượt này. '+input.check:rest.result,patches,lesson:'quote',action:input.action??(patches.length?'Áp dụng thay đổi':'Xác nhận lượt này')});
 snapshots.push({...workspace});
}
// Teaching workspace: deliberate, bounded excerpts. No Policy reference or registration exists here.
document('quoteController','quoteController',`package com.alpaca.agent.controller;
import com.alpaca.base.controller.BaseController;
import com.alpaca.agent.function.quote.*;
import com.alpaca.agent.request.quote.CreateQuoteRequest;
@RestController
@RequestMapping("quote")
public class QuoteController extends BaseController {
${code('quoteController',29,32)}
${code('quoteController',49,52)}
}`);
document('quoteFunc','quoteFunc',`package com.alpaca.agent.function.quote;
@Component
@AllArgsConstructor
public class CreateQuoteFunc extends BaseFunc {
    private final AggregateRepository<QuoteAggregate, IQuoteCommand> quoteAggregateRepository;
    public EntityWithIdAndVersion<QuoteAggregate> exec(CreateQuoteRequest request) {
        // Extrait pédagogique : validation métier et paiement omis.
        validateRequest(request);
        CreateQuoteCommand command = MappingUtils.mapObject(request, CreateQuoteCommand.class);
        command.setQuoteCode(generateQuoteCode("S-" + request.getProductPrefix()));
        return quoteAggregateRepository.save(command);
    }
}`.replace('Extrait pédagogique : validation métier et paiement omis.','Trích đoạn cho bài học: lược phần validation và thanh toán.'));
document('quoteRequest','quoteRequest',`package com.alpaca.agent.request.quote;
@Getter @Setter
public class CreateQuoteRequest {
    private String customerName;
    private String productCode;
    private Date effectiveDate;
    private Date expirationDate;
}`);
document('quoteCommand','quoteCommand',`package com.alpaca.agent.command.quote;
@Getter @Setter
public class CreateQuoteCommand implements IQuoteCommand {
    private String quoteCode;
    private String customerName;
    private String productCode;
}`);
document('quoteEvent','quoteEvent',`package com.alpaca.agent.event.quote;
@Getter @Setter
public class CreateQuoteEvent extends BaseQuoteEvent {
    private String quoteCode;
    private String customerName;
    private String productCode;
}`);
document('quoteAggregate','quoteAggregate',`package com.alpaca.agent.domain;
@Getter @Setter @Entity
@Table(name = "quote_aggregate")
public class QuoteAggregate extends LibraAggregate<QuoteAggregate, IQuoteCommand> {
    public static final String KEY_LOCK_AGGREGATE = "Platform-Quote-Aggregate-";
    private String quoteCode;
    private String customerName;
    private String productCode;
    private int quoteType;
    private Date effectiveDate;
    private Date expirationDate;
    public List<Event> process(CreateQuoteCommand cmd) {
        return EventUtil.events(MappingUtils.mapObject(cmd, CreateQuoteEvent.class));
    }
    public void apply(CreateQuoteEvent event) { MappingUtils.mapObject(event, this); }
}`);
document('quoteRepo','quoteRepo',`package com.alpaca.agent.repository;
public interface QuoteRepository extends JpaRepository<QuoteAggregate, String> {
    Optional<QuoteAggregate> findByQuoteCode(String quoteCode);
    // findById(String id) được kế thừa từ JpaRepository.
}`);
document('repositoryBean','repositoryBean',`package com.alpaca.agent.config;
import com.alpaca.agent.domain.QuoteAggregate;
import com.alpaca.agent.command.IQuoteCommand;
import com.alpaca.eventuate.sync.AggregateExtRepository;
import io.eventuate.sync.AggregateRepository;
import io.eventuate.sync.EventuateAggregateStore;
@Configuration
public class PlatformConfig {
${code('repositoryBean',19,22)}
}`);
document('rabbit','rabbit',`package com.alpaca.agent.config;
@Configuration
public class RabbitTemplateConfig {
    // Trích riêng các hàng đợi Quote; các chặng khác chưa có trong bài.
${code('rabbit',43,48)}
}`);
for(const ref of ['base','baseController','repositoryExtension','save','dispatch','applyLoop','jdbcWrite','libra','quoteMarker','quoteEventBase','baseEvent'])document(ref,ref,originals[ref].rows.map(r=>r.text).join('\n'));
document('quoteRead','quoteRead',`package com.alpaca.agent.function.quote;
@Component @AllArgsConstructor
public class FindQuoteByIdFunc extends BaseFunc {
    private final QuoteRepository quoteRepository;
    public QuoteAggregate exec(String id) {
        return quoteRepository.findById(id).orElseThrow(
                () -> new ServiceException(PlatformErrorCode.QUOTE_NOT_EXIST));
    }
}`);
export const beginnerBaseline={...workspace};
// New file metadata is known for review; its content is absent until its creation round.
for(const ref of ['marker','aggregate','controller','func','repo','command','eventBase','event','status','syncStatus'])documents[ref]={...originals[ref],rows:[]};
const common={phase:0,kind:'brief' as const,evidence:[],result:'Đã chốt quyết định; chưa thay đổi file.',terms:''};
round({...common,id:'brief',title:'Giao việc bằng ngôn ngữ nghiệp vụ',request:'Tạo một hợp đồng bảo hiểm từ báo giá khách hàng đã lưu.',proposal:'Chốt nguồn dữ liệu và kết quả nhận lại trước khi giao agent sửa code.',reason:'Giống FE/BA chốt contract: một ID vào, một Policy ID ra, có nhánh lỗi rõ ràng.',question:'Điều gì cần hỏi lại trước khi sửa?',options:['Một Quote được tạo mấy Policy đang hiệu lực, và tạo xong trả gì?','Agent thích đặt tên biến gì?'],answer:0,hint:'Hỏi quy tắc tạo trùng và kết quả nghiệp vụ trước. Source xác nhận guard theo quoteCode; bài chọn trả Policy ID từ save.',sample:'Đầu vào: Quote đã lưu QUOTE-BEGINNER-101\nKết quả: Policy ID mới, liên kết lại Quote\nKiểm tra: Quote có / thiếu; Policy trùng; cùng ID ở kết quả và bản ghi.',check:'Chưa gửi HTTP hoặc thay đổi file. Prompt có thể sao chép để giao agent.'});
round({...common,id:'survey',phase:1,kind:'survey',title:'Tìm đường đi của Quote đã lưu',request:'Biết báo giá đang được lưu ở đâu và lấy lại bằng cách nào.',proposal:'Đối chiếu hai đường: tạo Quote qua CreateQuoteFunc và quoteAggregateRepository.save(command); đọc Quote qua FindQuoteByIdFunc và QuoteRepository.findById.',reason:'Tái sử dụng cách chia trách nhiệm, không chép request form Quote sang Policy.',question:'Mẫu nào giúp hiểu nguồn dữ liệu đã có?',options:['Khảo sát riêng đường lưu Quote và đường đọc Quote theo ID','Tạo luôn một màn danh sách Policy'],answer:0,hint:'Mở các bằng chứng Quote bên dưới. Khảo sát chỉ đọc, chưa có file A/M.',sample:'GET /quote/QUOTE-BEGINNER-101\n→ FindQuoteByIdFunc.exec("QUOTE-BEGINNER-101")\n→ QuoteRepository.findById("QUOTE-BEGINNER-101")\n→ quote_aggregate: customerName="Nguyễn An", productCode="AUTO"',check:'Danh sách thay đổi phải trống. Quote ID có sẵn từ lượt lưu Quote trước bài này.',terms:'Repository giống lớp gọi nguồn dữ liệu; JpaRepository cung cấp sẵn findById.',evidence:[evidence('quoteController',29,32,'Controller tạo Quote chuyển request cho CreateQuoteFunc.'),evidence('quoteFunc',74,85,'Func map request sang Command.'),evidence('quoteFunc',149,153,'Điểm ghi Quote: quoteAggregateRepository.save(command) tại L151.'),evidence('quoteController',49,52,'GET theo ID gọi FindQuoteByIdFunc.'),evidence('quoteRead',30,36,'Func đọc gọi quoteRepository.findById(quoteId) tại L36.'),evidence('quoteRepo',18,19,'JpaRepository<QuoteAggregate, String> cung cấp findById.')]});
round({...common,id:'data',phase:2,title:'Phân loại dữ liệu trước khi mở Java',request:'Giữ đúng thông tin đã chốt trong Quote khi tạo hợp đồng.',proposal:'Chia ba nhóm: chép từ Quote, quyết định khi tạo và liên kết về Quote.',reason:'Giống mapping form FE: cùng tên chưa chắc cùng ý nghĩa; quoteType cần chuyển rõ sang policyType.',question:'Nhóm dữ liệu nào đúng?',options:['Khách hàng/sản phẩm/ngày từ Quote; mã/trạng thái lúc tạo; quoteId/quoteCode để liên kết','Dùng Quote ID làm Policy ID và nhập lại khách hàng'],answer:0,hint:'Policy ID được tầng ghi cấp sau này; quoteId chỉ trỏ về báo giá.',sample:'Từ Quote: customerName=Nguyễn An, productCode=AUTO, effectiveDate=2026-11-01, expirationDate=2027-11-01\nLúc tạo: policyCode=S-AUTO-DEMO-001, status=RUNNING tại 2026-11-13\nLiên kết: quoteId=QUOTE-BEGINNER-101, quoteCode=Q-DEMO-101',check:'Chưa thêm Java. Đây là dữ liệu fixture được chọn cho bài, không phải dữ liệu khách hàng thật.'});
round({...common,id:'marker',phase:2,kind:'patch',title:'Khai báo họ lệnh của Policy',request:'Cho cơ chế ghi nhận biết lệnh nào thuộc hợp đồng.',proposal:'Thêm IPolicyCommand theo mẫu IQuoteCommand trước khi Aggregate dùng kiểu này.',reason:'LibraAggregate có tham số kiểu Command; marker phải xuất hiện trước nơi tham chiếu.',question:'Kiểu này chứa dữ liệu khách hàng chưa?',options:['Chưa; chỉ đánh dấu họ lệnh Policy','Có toàn bộ dữ liệu form'],answer:0,hint:'Interface ở đây giống một nhãn type trong TypeScript.',sample:'IPolicyCommand extends Command\nChưa có CreatePolicyCommand cụ thể.',check:'Chỉ có file đánh dấu mới; chưa có API hoặc thao tác ghi.',terms:'Interface khai báo hợp đồng kiểu; chưa thực thi nghiệp vụ.',evidence:[evidence('marker',1,7,'Marker thật kế thừa io.eventuate.Command.')],changes:{marker:code('marker',1,7)}});
let aggregate=`package com.alpaca.agent.domain;
import com.alpaca.agent.command.IPolicyCommand;
import com.eventuate.domain.LibraAggregate;
@Getter @Setter @Entity
@Table(name = "policy_aggregate")
public class PolicyAggregate extends LibraAggregate<PolicyAggregate, IPolicyCommand> {
    private int policyType;
    private String policyCode;
    private String customerName;
    private String productCode;
    private String quoteId;
    private String quoteCode;
    private int status;
    private Date effectiveDate;
    private Date expirationDate;
}`;
round({...common,id:'aggregate-model',phase:2,kind:'patch',title:'Tạo chỗ giữ trạng thái hợp đồng',request:'Có một cấu trúc giữ thông tin Policy được chọn ở lượt trước.',proposal:'Thêm phần dữ liệu PolicyAggregate; chưa thêm process/apply.',reason:'Source dùng LibraAggregate để nối dữ liệu với cơ chế Command/Event; không cần tạo một PolicyModel song song trong bài tạo mới.',question:'Aggregate hiện làm được gì?',options:['Giữ trạng thái; chưa xử lý lệnh hoặc ghi','Đã phát hành được Policy'],answer:0,hint:'Có class dữ liệu chưa có nghĩa đường ghi đã nối.',sample:'PolicyAggregate {customerName, productCode, policyType, quoteId, quoteCode, status, ...}\nID được lớp nền quản lý; chưa có giá trị mới.',check:'File xuất hiện trong cây sau khi áp dụng. Snapshot là trích đoạn cấu trúc, chưa chạy Java.',terms:'Aggregate là đối tượng giữ trạng thái nghiệp vụ; LibraAggregate là lớp nền khai báo cơ chế chung.',evidence:[evidence('aggregate',55,69,'Entity Policy dùng LibraAggregate và bảng policy_aggregate.'),evidence('libra',1,30,'Lớp nền có sẵn trong hạ tầng dùng chung.')],changes:{aggregate}});
round({...common,id:'controller-pattern',phase:3,kind:'survey',title:'Tìm mẫu điểm nhận yêu cầu',request:'Chọn mẫu API phù hợp với một Quote ID đã có.',proposal:'Dùng @PathVariable như đường đọc Quote; giữ BaseController và WrapResponse.',reason:'Source tạo Policy nhận POST /policy/create/{quoteId}, không có @RequestBody riêng.',question:'FE gửi gì khi bấm tạo từ Quote?',options:['POST với quoteId trên URL, không gửi lại form Quote','Gửi lại toàn bộ form khách hàng'],answer:0,hint:'Request là lời gọi HTTP ở biên hệ thống. Bài này không cần class CreatePolicyRequest.',sample:'POST /policy/create/QUOTE-BEGINNER-101\nBody: không có',check:'Chỉ tìm mẫu Controller; danh sách thay đổi không tăng.',terms:'@PathVariable lấy một đoạn URL, giống route params phía FE.',evidence:[evidence('quoteController',48,51,'Mẫu lấy ID từ URL.'),evidence('controller',43,46,'Endpoint thật chuyển quoteId sang Func.')]});
let controller=`package com.alpaca.agent.controller;
import com.alpaca.base.controller.BaseController;
@RestController
@RequestMapping("policy")
public class PolicyController extends BaseController {
}`;
round({...common,id:'controller',phase:3,kind:'patch',title:'Tạo vùng nhận yêu cầu Policy',request:'Dành một điểm vào riêng cho nghiệp vụ hợp đồng.',proposal:'Thêm vỏ PolicyController với /policy; chưa thêm method gọi Func chưa có.',reason:'Tách bước tạo Controller khỏi nối Func để không giấu một phụ thuộc chưa triển khai.',question:'Vỏ Controller đã xử lý tạo Policy chưa?',options:['Chưa, cần Func và method chuyển quoteId','Đã tự lưu dữ liệu'],answer:0,hint:'Controller giống một route handler FE: nó cần nơi xử lý phía sau.',sample:'Đã dành /policy\nPOST /policy/create/{quoteId}: chưa nối.',check:'Chỉ kiểm tra cấu trúc annotation. Chưa chạy thử endpoint.',terms:'Controller nhận lời gọi HTTP; BaseController cung cấp context và executor dùng chung.',evidence:[evidence('controller',24,46,'Mẫu Controller thật và method tạo.'),evidence('baseController',1,35,'Lớp nền dùng chung, không thuộc module Policy.')],changes:{controller}});
let func=`package com.alpaca.agent.function.policy;
import com.alpaca.base.BaseFunc;
@Component @AllArgsConstructor
public class CreatePolicyFunc extends BaseFunc {
    public EntityWithIdAndVersion<PolicyAggregate> exec(String quoteId) {
        throw new UnsupportedOperationException("Chưa nối đọc Quote");
    }
}`;
round({...common,id:'func',phase:3,kind:'patch',title:'Tạo nơi xử lý nghiệp vụ',request:'Có một chỗ tiếp nhận Quote ID từ điểm vào.',proposal:'Thêm CreatePolicyFunc với exec(String quoteId), chưa đọc hoặc ghi.',reason:'Bóc vỏ Func thành lượt riêng. Điểm chưa triển khai được ghi rõ trong snapshot.',question:'Func khác Controller ở đâu?',options:['Func chứa nghiệp vụ; Controller chuyển đầu vào','Func là bảng trong database'],answer:0,hint:'Hãy nghĩ Func như service xử lý sau khi router nhận request.',sample:'exec("QUOTE-BEGINNER-101")\n→ Chưa nối đọc Quote',check:'Chỉ kiểm tra chữ ký và lớp nền; fixture chưa được phép báo thành công.',terms:'@Component đăng ký class để Spring tìm được; constructor nhận dependency khi cần.',evidence:[evidence('func',46,60,'Func thật là Component kế thừa BaseFunc.')],changes:{func}});
controller=controller.replace('\n}',`\n${code('controller',43,46)}\n}`);
round({...common,id:'wire',phase:3,kind:'patch',title:'Chuyển Quote ID từ URL sang Func',request:'Đảm bảo đúng báo giá được chuyển vào nơi xử lý.',proposal:'Thêm createPolicy(String quoteId) gọi CreatePolicyFunc.exec(quoteId).',reason:'Một thay đổi nhỏ ở Controller; không có logic đọc database trong Controller.',question:'quoteId đi tới đâu?',options:['@PathVariable → CreatePolicyFunc.exec(quoteId)','@RequestBody → PolicyRepository.save'],answer:0,hint:'Theo cùng tên quoteId từ chữ ký method đến lời gọi exec.',sample:'POST /policy/create/QUOTE-BEGINNER-101\n→ @PathVariable quoteId\n→ exec("QUOTE-BEGINNER-101")',check:'Đã nối đường truyền tham số. Chưa nối đọc Quote nên chưa thể tạo.',terms:'applicationContext.getBean tìm Component; supplyAsync chạy trên executor của lớp nền.',evidence:[evidence('controller',43,46,'Đúng chuỗi URL → exec từ source.')],changes:{controller}});
func=func.replace('    public Entity', '    private final QuoteRepository quoteRepository;\n    public Entity').replace('        throw new UnsupportedOperationException("Chưa nối đọc Quote");',`${code('func',61,65)}
        QuoteAggregate quoteAggregate = optional.get();
        return execInTransactionAndLock(QuoteAggregate.KEY_LOCK_AGGREGATE + quoteId,
                () -> runInternal(quoteAggregate));`).replace('\n}',`\n    private EntityWithIdAndVersion<PolicyAggregate> runInternal(QuoteAggregate quoteAggregate) {
        throw new UnsupportedOperationException("Chưa nối dựng và ghi Policy");
    }
}`);
round({...common,id:'quote-guard',phase:3,kind:'patch',title:'Đọc Quote và dừng nếu thiếu',request:'Không phát hành từ một báo giá không tồn tại.',proposal:'Thêm QuoteRepository, findById và lỗi QUOTE_NOT_EXIST; dùng transaction/lock theo Quote từ BaseFunc.',reason:'Đọc Quote trước khi dựng dữ liệu. Nhánh thiếu kết thúc trước Command và save.',question:'Thiếu Quote thì có được cấp Policy ID không?',options:['Không; dừng ở exec trước phần ghi','Có, rồi xóa sau'],answer:0,hint:'Optional.empty là kết quả tìm không thấy dữ liệu.',sample:'QUOTE-BEGINNER-404 → QUOTE_NOT_EXIST\nQUOTE-BEGINNER-101 → Quote tồn tại, chưa ghi',check:'Áp dụng xong mới mở lượt thử guard. Chưa có điều kiện tạo trùng.',terms:'Optional biểu diễn có hoặc không có bản ghi; transaction/lock gom và khóa xử lý theo Quote.',evidence:[evidence('func',60,68,'Đọc Quote, lỗi khi thiếu và khóa theo Quote ID.'),evidence('base',1,45,'BaseFunc cung cấp cơ chế transaction/lock, xem thêm source.')],changes:{func}});
round({...common,id:'quote-trial',phase:3,kind:'trial',title:'Thử báo giá có và không có',request:'Xác nhận nhánh dừng đã an toàn tới mốc đọc Quote.',proposal:'Chạy hai fixture đầu vào ở đúng mốc hiện tại.',reason:'Vượt guard chưa chứng minh đã tạo Policy; nhánh thiếu phải có 0 lần ghi.',question:'Quote hợp lệ ở mốc này có kết quả gì?',options:['Được đi tiếp, chưa ghi Policy','Đã trả Policy ID mới'],answer:0,hint:'Đường ghi vẫn chưa được lắp.',sample:'Input lần 1: QUOTE-BEGINNER-101\nInput lần 2: QUOTE-BEGINNER-404',check:'Fixture xác nhận đường URL → Func → findById; 0 Command, 0 Event, 0 lần ghi.',requiredTrials:['quote-valid','quote-missing']});
const repo=`package com.alpaca.agent.repository;
public interface PolicyRepository extends JpaRepository<PolicyAggregate, String> {
    List<PolicyAggregate> findAllByQuoteCodeAndStatusIn(String quoteCode, List<Integer> status);
}`;
round({...common,id:'repository',phase:3,kind:'patch',title:'Tìm Policy để kiểm tra tạo trùng',request:'Biết báo giá đã có hợp đồng đang hoặc sắp hiệu lực chưa.',proposal:'Thêm PolicyRepository với truy vấn theo quoteCode và status.',reason:'Đây là repository đọc dữ liệu để guard, khác AggregateRepository nhận Command để ghi.',question:'Repository này phục vụ việc gì lúc này?',options:['Đọc Policy theo quoteCode để kiểm tra tạo trùng','Ghi CreatePolicyCommand'],answer:0,hint:'JpaRepository đọc Entity; AggregateRepository xử lý Command.',sample:'findAllByQuoteCodeAndStatusIn("Q-DEMO-103", [NOT_RUNNING, RUNNING])',check:'Mới thêm hợp đồng truy vấn; Func chưa gọi nên chưa khẳng định chặn trùng.',terms:'JpaRepository là truy cập Entity; Spring triển khai truy vấn từ tên method.',evidence:[evidence('repo',22,24,'Method guard tồn tại trong source.')],changes:{repo}});
func=func.replace('    private final QuoteRepository quoteRepository;','    private final QuoteRepository quoteRepository;\n    private final PolicyRepository policyRepository;').replace('        throw new UnsupportedOperationException("Chưa nối dựng và ghi Policy");',`        List<Integer> status = List.of(PolicyStatus.NOT_RUNNING, PolicyStatus.RUNNING);
        List<PolicyAggregate> policies = policyRepository.findAllByQuoteCodeAndStatusIn(
                quoteAggregate.getQuoteCode(), status);
        if (!policies.isEmpty()) {
            throw new ServiceException(PlatformErrorCode.QUOTE_CAN_NOT_RELEASE_POLICY);
        }
        throw new UnsupportedOperationException("Chưa nối dựng và ghi Policy");`);
round({...common,id:'duplicate-guard',phase:3,kind:'patch',title:'Nối điều kiện chặn tạo trùng',request:'Không phát hành thêm khi cùng mã báo giá đã có Policy phù hợp điều kiện chặn.',proposal:'Tiêm PolicyRepository, khai báo PolicyStatus và thêm guard trước mapping.',reason:'Source kiểm tra cùng quoteCode với NOT_RUNNING/RUNNING, không dùng cờ canReleasePolicy trên Quote làm điều kiện thay thế.',question:'Đã có Policy RUNNING cùng quoteCode thì dừng ở đâu?',options:['runInternal, trước Command và save','Sau khi ghi thêm một Policy'],answer:0,hint:'Không thêm điều kiện nghiệp vụ ngoài điều source xác nhận.',sample:'QUOTE-BEGINNER-103 / Q-DEMO-103\nĐã có POL-EXISTING-103, status=RUNNING\n→ QUOTE_CAN_NOT_RELEASE_POLICY',check:'Guard được nối; lượt tiếp kiểm tra nhánh trùng bằng fixture riêng.',terms:'Dependency là đối tượng Func cần dùng; PolicyStatus đặt tên cho mã trạng thái số.',evidence:[evidence('func',71,78,'Truy vấn và điều kiện chặn trước mapping.'),evidence('status',6,12,'Mã NOT_RUNNING=0, RUNNING=100.')],changes:{status:code('status',1,29),func}});
round({...common,id:'duplicate-trial',phase:3,kind:'trial',title:'Thử nhánh đã có Policy',request:'Giữ nguyên dữ liệu khi yêu cầu tạo trùng bị từ chối.',proposal:'Chạy fixture Quote 103 có Policy RUNNING cùng quoteCode.',reason:'Một Policy có sẵn trong fixture là dữ liệu đầu vào để thử guard, không phải file module có sẵn tại mốc đầu.',question:'Bằng chứng nhánh dừng an toàn là gì?',options:['Lỗi đúng và số bản ghi mới bằng 0','Chỉ cần hiện toast lỗi'],answer:0,hint:'Cần kiểm tra tác động ghi, không chỉ thông báo giao diện.',sample:'Input: QUOTE-BEGINNER-103\nExisting: POL-EXISTING-103 / Q-DEMO-103 / RUNNING',check:'Dừng trước mapping, không sinh ID và không tăng số bản ghi.',requiredTrials:['duplicate']});
const fields=`    private int policyType;
    private String policyCode;
    private String customerName;
    private String productCode;
    private String quoteId;
    private String quoteCode;
    private int status;
    private Date effectiveDate;
    private Date expirationDate;`;
round({...common,id:'command-type',phase:4,kind:'patch',title:'Tạo gói dữ liệu yêu cầu ghi',request:'Chuẩn bị một gói dữ liệu rõ ràng để bàn giao cho tầng ghi.',proposal:'Thêm CreatePolicyCommand implements IPolicyCommand.',reason:'Request là đầu vào HTTP; Command là ý định ghi bên trong. Bài dùng quoteId trên URL, không tạo request body chỉ để giống mẫu.',question:'Command đã là bản ghi trong database chưa?',options:['Chưa; đó là yêu cầu ghi','Rồi, có file là có dữ liệu'],answer:0,hint:'Giống một payload gửi service nhưng chưa được xử lý.',sample:'CreatePolicyCommand {policyType, customerName, productCode, quoteId, quoteCode, ...}',check:'Chỉ thêm kiểu dữ liệu; chưa có instance Command hoặc lần ghi.',terms:'Command mô tả điều hệ thống được yêu cầu làm; implements gắn class vào interface.',evidence:[evidence('command',26,45,'CreatePolicyCommand thật implements IPolicyCommand.')],changes:{command:`package com.alpaca.agent.command.policy;
@Getter @Setter
public class CreatePolicyCommand implements IPolicyCommand {
${fields}
}`}});
func=func.replace('        throw new UnsupportedOperationException("Chưa nối dựng và ghi Policy");',`        CreatePolicyCommand command = MappingUtils.mapObject(quoteAggregate, CreatePolicyCommand.class);
        command.setPolicyType(quoteAggregate.getQuoteType());
        command.setQuoteId(quoteAggregate.getId());
        command.setQuoteCode(quoteAggregate.getQuoteCode());
        throw new UnsupportedOperationException("Chưa nối quyết định lúc tạo");`);
round({...common,id:'mapping',phase:4,kind:'patch',title:'Chép thông tin và liên kết về Quote',request:'Dùng lại khách hàng, sản phẩm và thời hạn của báo giá đã lưu.',proposal:'Map Quote sang Command; gán rõ policyType, quoteId và quoteCode.',reason:'Mapper chép các trường cùng tên. quoteType → policyType là khác tên nên cần chỉ rõ.',question:'Trường nào liên kết về báo giá?',options:['quoteId và quoteCode, giữ riêng với Policy ID','policyCode chính là quoteId'],answer:0,hint:'Liên kết nguồn và định danh đối tượng mới là hai vai trò khác nhau.',sample:'customerName=Nguyễn An, productCode=AUTO\nquoteType=1 → policyType=1\nquoteId=QUOTE-BEGINNER-101; quoteCode=Q-DEMO-101',check:'Command đã có dữ liệu từ Quote; chưa có mã/trạng thái quyết định lúc tạo.',terms:'MappingUtils.mapObject giống thao tác map object trong TypeScript.',evidence:[evidence('func',80,88,'Map và gán ba trường có ý nghĩa riêng.')],changes:{func}});
func=func.replace('        throw new UnsupportedOperationException("Chưa nối quyết định lúc tạo");',`        Date now = new Date();
        command.setStatus(getPolicyStatus(now, quoteAggregate.getEffectiveDate(), quoteAggregate.getExpirationDate()));
        command.setCreatedDate(now);
        command.setUpdatedDate(now);
        command.setCreatedBy(quoteAggregate.getCreatedBy());
        fillMissingValue(quoteAggregate, command);
        command.setPolicyCode(generatePolicyCode(quoteAggregate));
        command.setSyncStatus(SyncPolicyStatus.NOT_SYNC);
        throw new UnsupportedOperationException("Chưa nối thanh toán và ghi");`);
round({...common,id:'creation-values',phase:4,kind:'patch',title:'Quyết định giá trị lúc tạo',request:'Cấp mã hợp đồng và tính trạng thái theo thời hạn bảo hiểm.',proposal:'Gán thời gian/người tạo, policyCode, trạng thái theo ngày, syncStatus; dùng helper từ source.',reason:'Bài minh họa trích đoạn lời gọi. Helper và các trường mở rộng được xem trong source, không giả định mapper tự tính được.',question:'Ngày 13/11/2026 trong thời hạn mẫu thì trạng thái nào?',options:['RUNNING','Lấy nguyên status EDITING của Quote'],answer:0,hint:'Trạng thái Quote và Policy có ý nghĩa khác nhau.',sample:'now=2026-11-13; thời hạn 2026-11-01 → 2027-11-01\npolicyCode=S-AUTO-DEMO-001; status=RUNNING; syncStatus=NOT_SYNC',check:'Mã nghiệp vụ xuất hiện, Policy ID vẫn chưa được cấp. Helper/metadata là phần được lược trong snapshot cấu trúc.',terms:'Helper là method hỗ trợ trong Func; policyCode là mã nghiệp vụ, khác ID tầng lưu.',evidence:[evidence('func',88,104,'Gán giá trị lúc tạo.'),evidence('func',162,216,'Vị trí helper sinh mã và tính trạng thái trong source.'),evidence('syncStatus',1,8,'Kiểu trạng thái đồng bộ chỉ thêm khi cần gán NOT_SYNC.')],changes:{syncStatus:code('syncStatus',1,8),func}});
func=func.replace('        throw new UnsupportedOperationException("Chưa nối thanh toán và ghi");',`        // Fixture bài học: paymentInfo rỗng; không có kỳ phí cần chuẩn hóa.
        // Khi có kỳ phí: cần bổ sung PaymentUtils và dữ liệu đối tượng bảo hiểm như source L105-114.
        throw new UnsupportedOperationException("Chưa nối ghi");`);
round({...common,id:'payment',phase:4,kind:'patch',title:'Chốt phạm vi dữ liệu thanh toán',request:'Giữ dữ liệu thanh toán nhất quán trước khi ghi hợp đồng.',proposal:'Ghi rõ paymentInfo rỗng trong fixture. Nếu triển khai kỳ phí, cần thêm PaymentUtils và dữ liệu đối tượng bảo hiểm theo source trước khi nối vòng chuẩn hóa.',reason:'Fixture dùng VND và danh sách paymentInfo rỗng để tập trung luồng tạo. Không đưa các dependency thanh toán chưa được triển khai vào code giả định.',question:'Có thể coi fixture này đã kiểm tra chia phí chưa?',options:['Chưa; không có kỳ phí trong dữ liệu thử','Có, vì đã có save'],answer:0,hint:'Trường hợp danh sách rỗng không kiểm tra thuật toán chia phí.',sample:'currencyStr=VND, exchangeRate=1, paymentInfo=[]\nFixture không có kỳ phí; source đầy đủ xử lý từng paymentInfo.',check:'Đã đánh dấu phạm vi trước save. Thuật toán thanh toán đầy đủ là chặng cần triển khai thêm.',terms:'forEach trong source đầy đủ thực hiện xử lý cho mỗi phần tử danh sách.',evidence:[evidence('func',105,114,'Vòng thanh toán ngay trước save.')],changes:{func}});
round({...common,id:'event-base',phase:4,kind:'patch',title:'Khai báo Event thuộc Policy',request:'Cho hệ thống biết sự kiện mới thuộc loại hợp đồng nào.',proposal:'Thêm BasePolicyEvent với @EventEntity trỏ về PolicyAggregate.',reason:'CreatePolicyEvent sẽ kế thừa lớp này; điểm đăng ký Event chỉ xuất hiện sau khi Aggregate đã có.',question:'@EventEntity nối về đâu?',options:['PolicyAggregate đã thêm trước đó','Một API Danh sách chưa triển khai'],answer:0,hint:'Đây là metadata cho cơ chế Event, không phải lời gọi HTTP.',sample:'EventEntity entity="com.alpaca.agent.domain.PolicyAggregate"',check:'Đã có metadata Event; chưa có sự kiện tạo cụ thể.',terms:'Event là điều đã xảy ra sau khi lệnh được chấp nhận; BaseEvent là lớp nền metadata.',evidence:[evidence('eventBase',1,10,'Điểm khai báo kiểu Aggregate của Event.')],changes:{eventBase:code('eventBase',1,10)}});
round({...common,id:'event-type',phase:4,kind:'patch',title:'Mô tả dữ liệu sự kiện tạo',request:'Ghi lại dữ liệu của việc tạo hợp đồng đã được chấp nhận.',proposal:'Thêm CreatePolicyEvent extends BasePolicyEvent với các trường minh họa.',reason:'Command là yêu cầu; Event là kết quả xử lý được dùng để cập nhật trạng thái. Hai vai trò xuất hiện ở hai lượt.',question:'Event có tự gọi repository.save không?',options:['Không, nó chứa dữ liệu sự kiện','Có, cứ new Event là ghi'],answer:0,hint:'Dữ liệu và cơ chế thực thi là hai phần riêng.',sample:'CreatePolicyEvent {customerName=Nguyễn An, quoteId=QUOTE-BEGINNER-101, ...}',check:'Mới có kiểu Event, process chưa được nối.',terms:'extends kế thừa lớp nền, tương tự class extends trong TypeScript.',evidence:[evidence('event',21,45,'CreatePolicyEvent thật kế thừa BasePolicyEvent.')],changes:{event:`package com.alpaca.agent.event.policy;
@Getter @Setter
public class CreatePolicyEvent extends BasePolicyEvent {
${fields}
}`}});
aggregate=aggregate.replace('\n}',`\n${code('aggregate',328,331)}\n}`);
round({...common,id:'process',phase:4,kind:'patch',title:'Xử lý Command thành Event',request:'Chấp nhận yêu cầu tạo và sinh sự kiện tương ứng.',proposal:'Thêm process(CreatePolicyCommand) vào PolicyAggregate.',reason:'Cơ chế dispatch tìm method theo kiểu Command. process trả Event; không tự gọi apply hay save.',question:'Kết quả trực tiếp của process là gì?',options:['Danh sách Event','Policy ID đã lưu'],answer:0,hint:'Theo return EventUtil.events(event).',sample:'CreatePolicyCommand → process → [CreatePolicyEvent]',check:'Một method mới trong Aggregate đã có; chưa apply Event.',terms:'Dispatch chọn method xử lý dựa trên kiểu tham số.',evidence:[evidence('aggregate',328,331,'Method process thật.'),evidence('dispatch',81,91,'Vị trí khung tìm method xử lý Command.')],changes:{aggregate}});
aggregate=aggregate.replace('\n}',`\n${code('aggregate',333,340)}\n}`);
round({...common,id:'apply',phase:4,kind:'patch',title:'Cập nhật trạng thái từ Event',request:'Đưa dữ liệu sự kiện vào hợp đồng sẽ được lưu.',proposal:'Thêm apply(CreatePolicyEvent), gồm map trạng thái và metadata.',reason:'Khung lặp apply Event trước khi chuyển store. Aggregate được sửa lần nữa, Review vẫn đếm một file.',question:'Đã có process và apply thì đã ghi database chưa?',options:['Chưa, Func còn chưa gọi save','Rồi, có apply là tự lưu'],answer:0,hint:'Lần theo phần gọi, không suy ra từ việc method tồn tại.',sample:'Event → apply → Aggregate có dữ liệu\nSố lần ghi fixture: 0',check:'Đã có hai đầu xử lý Command/Event. Các field metadata/path được lược trong snapshot cấu trúc, xem source đầy đủ.',terms:'this là chính Aggregate đang được cập nhật.',evidence:[evidence('aggregate',333,340,'apply và metadata từ Event.'),evidence('applyLoop',11,30,'Vị trí lớp nền gọi apply.')],changes:{aggregate}});
const config=workspace.repositoryBean.replace('import com.alpaca.agent.command.IQuoteCommand;','import com.alpaca.agent.command.IQuoteCommand;\nimport com.alpaca.agent.domain.PolicyAggregate;\nimport com.alpaca.agent.command.IPolicyCommand;').replace('\n}',`\n${code('repositoryBean',28,32)}\n}`);
round({...common,id:'registration',phase:4,kind:'patch',title:'Đăng ký chỗ ghi Policy',request:'Cho Func một nơi ghi hợp đồng theo cơ chế của workspace.',proposal:'Bổ sung bean policyAggregateRepository vào PlatformConfig, tái sử dụng AggregateExtRepository.',reason:'Mốc đầu chỉ có bean Quote. Chỉ đăng ký Policy sau khi kiểu Command và Aggregate đã có; không thêm bean Policy ẩn trước lượt này.',question:'Bean nhận Command để ghi là loại nào?',options:['AggregateRepository<PolicyAggregate, IPolicyCommand>','PolicyRepository JpaRepository'],answer:0,hint:'Tìm vị trí khai báo tại PlatformConfig và vị trí gọi ở lượt sau.',sample:'PlatformConfig.policyAggregateRepository(eventStore)\n→ new AggregateExtRepository<>(PolicyAggregate.class, eventStore)',check:'Cấu hình chuyển từ Quote-only sang Quote + Policy. Chưa có lời save trong Func.',terms:'Bean là đối tượng Spring đăng ký để tiêm vào nơi dùng.',evidence:[evidence('repositoryBean',28,32,'Điểm đăng ký bean Policy.'),evidence('repositoryExtension',1,40,'Lớp mở rộng dùng lại cơ chế ghi.')],changes:{repositoryBean:config}});
func=func.replace('    private final PolicyRepository policyRepository;','    private final PolicyRepository policyRepository;\n    private final AggregateRepository<PolicyAggregate, IPolicyCommand> policyAggregateRepository;').replace('        throw new UnsupportedOperationException("Chưa nối ghi");',`        EntityWithIdAndVersion<PolicyAggregate> saved = policyAggregateRepository.save(command);
        return saved;`);
round({...common,id:'persist',phase:4,kind:'patch',title:'Nối ghi và trả kết quả tạo',request:'Lưu hợp đồng đã dựng và trả định danh để người dùng tiếp tục.',proposal:'Tiêm bean vừa đăng ký; gọi save(command) và giữ EntityWithIdAndVersion.',reason:'save điều phối process → Event → apply → store/JDBC. Policy ID được store cấp khi tạo mới và có trong kết quả save; không lấy Quote ID làm ID mới.',question:'Bằng chứng tạo xong cần có gì?',options:['Policy ID trả về khớp Aggregate và bản ghi fixture','Chỉ có method save trong file'],answer:0,hint:'Kiểm tra tác động ghi và định danh ở lượt chạy thành công.',sample:'save(command) → {entityId: POL-BEGINNER-101, version: 1, aggregate: {...}}\nquoteId trong Aggregate vẫn là QUOTE-BEGINNER-101',check:'Đường ghi trong phạm vi bài đã nối. Snapshot là trích đoạn học, chạy thử bằng fixture TypeScript, không chạy Java.',terms:'EntityWithIdAndVersion gói đối tượng cùng ID và version của lần ghi.',evidence:[evidence('func',115,115,'Vị trí gọi save trong source.'),evidence('save',66,87,'Khung xử lý Command/Event trước store.'),evidence('jdbcWrite',87,119,'Điểm JDBC ghi Aggregate/Event.')],changes:{func}});
round({...common,id:'verify',phase:5,kind:'verify',title:'Kiểm tra kết quả từ góc nhìn người dùng',request:'Nhận Policy ID và chứng minh đúng hợp đồng đã được ghi từ đúng báo giá.',proposal:'Chạy fixture thành công, xem kết quả tạo và đối chiếu ID với bản ghi mô phỏng.',reason:'Mục tiêu Tạo mới hoàn tất bằng kết quả save. Chưa có API Danh sách/Chi tiết, Workflow hoặc view Policy trong phiên này.',question:'Tra cứu Danh sách/Chi tiết lúc này bằng gì?',options:['Chưa có; dùng kết quả tạo và bản ghi fixture để nghiệm thu','Tự dùng API đọc Policy có sẵn'],answer:0,hint:'Đầu bài chưa có module Policy; không thể dùng ngầm một API đọc chưa triển khai.',sample:'Input: POST /policy/create/QUOTE-BEGINNER-101\nExpected: POL-BEGINNER-101, quoteId=QUOTE-BEGINNER-101, version=1',check:'Đối chiếu chính Policy ID trả về; nhập Quote ID sẽ không đạt. Đây là ghi trong bộ nhớ fixture của Workshop.',requiredTrials:['success','read-id']});
round({...common,id:'review',phase:6,kind:'review',title:'Review toàn phiên',request:'Truy lại từng file, lý do thêm, nơi nối và tình huống đã kiểm tra.',proposal:'Đếm file theo trạng thái cuối, mở diff từ mốc Quote-only và lịch sử theo lượt.',reason:'Một file có thể sửa nhiều lần nhưng chỉ có một trạng thái A/M cuối. Chọn file để về lượt đầu tiên nó xuất hiện.',question:'',options:[],answer:0,hint:'',sample:'Tạo mới đã đủ trong phạm vi mô phỏng.\nChặng tiếp nối: thêm API đọc + Func đọc + model trả về; nếu làm Danh sách cần Workflow/SyncView/view/repository và config tương ứng.',check:'Các fixture xác nhận luồng tạo tinh gọn. Chưa kiểm tra Java/HTTP/Kafka, payment đầy đủ, đối tượng bảo hiểm, PublishedQuote, email hoặc SMS của luồng production.'});

export const beginnerPrompt=`Tạo một Policy từ Quote đã lưu trong workspace giả định hiện chỉ có Quote và hạ tầng dùng chung.
Đầu vào: Quote ID trên URL; không yêu cầu người dùng nhập lại thông tin Quote. Kết quả: Policy ID mới và bằng chứng ghi, giữ liên kết về Quote.
Trước khi sửa, hỏi rõ: quy tắc một Quote được phát hành bao nhiêu lần, kết quả trả về cần gì, và tác động sau ghi nào thuộc phạm vi. Với bài này, dùng điều kiện source xác nhận: chặn cùng quoteCode khi có Policy NOT_RUNNING/RUNNING.
Khảo sát đường tạo/đọc Quote và đề xuất thay đổi từng phần nhỏ. Tạo dần Controller, Func, kiểu Command/Event/Aggregate, repository và đăng ký bean đúng lúc cần. Giải thích dữ liệu mẫu trước code, nguồn đầu vào và đầu ra của từng phần.
Kiểm tra Quote hợp lệ, thiếu Quote, đã có Policy và Policy ID khớp bản ghi. Chạy bằng fixture Workshop, phân biệt rõ với chạy Java/backend thật.
Phạm vi bài là đường tạo tinh gọn và kết quả ghi. API Danh sách/Chi tiết, Workflow/view, thanh toán đầy đủ, đối tượng bảo hiểm và tác động phát hành sau ghi là chặng tiếp nối cần triển khai riêng. Ghi rõ mọi trích đoạn và helper được lược; không gọi snapshot này là bản production chạy được.`;
export const beginnerPhases=['Giao việc','Khảo sát Quote','Dữ liệu Policy','Điểm vào và guard','Dựng và ghi','Kết quả tạo','Review'];
export const beginnerSources:SourceCatalog={...Object.fromEntries(Object.entries(originals).map(([ref,doc])=>['source-'+ref,doc])),...documents};
export const beginnerFiles=Object.entries(documents).map(([id,doc])=>({id,path:doc.path}));
export function beginnerRows(ref:string,through:number):CodeRow[]{const text=(through<0?beginnerBaseline:snapshots[Math.min(through,snapshots.length-1)])[ref];return text===undefined?[]:rows(text);}
export function beginnerHistory(ref:string,through:number){return beginnerRounds.flatMap((round,index)=>index<=through&&round.patches.some(p=>p.ref===ref)?[{round,index}]:[]);}
export function beginnerFileStatus(ref:string,through:number):'A'|'M'|undefined{return beginnerHistory(ref,through).length?(ref in beginnerBaseline?'M':'A'):undefined;}
export function beginnerChangedFiles(through:number){return beginnerFiles.filter(f=>beginnerFileStatus(f.id,through));}
export const beginnerConnections:Record<string,string>={
 marker:'Aggregate dùng tại aggregate-model; Command triển khai tại command-type.',aggregate:'Repository đọc tại repository; bean khai báo tại registration; Func ghi tại persist.',
 controller:'Nối CreatePolicyFunc tại wire.',func:'Controller gọi tại wire; Quote đọc tại quote-guard; guard trùng tại duplicate-guard; ghi tại persist.',
 repo:'Tiêm và gọi trong Func tại duplicate-guard.',command:'Func dựng tại mapping; Aggregate xử lý tại process.',eventBase:'CreatePolicyEvent kế thừa tại event-type.',
 event:'process tạo tại process; apply cập nhật trạng thái tại apply.',repositoryBean:'Func tiêm và gọi save tại persist.',status:'Guard dùng tại duplicate-guard; tính trạng thái lúc tạo tại creation-values.',syncStatus:'Func gán NOT_SYNC tại creation-values.',
};
export function beginnerFileTrials(ref:string,trials:string[]){
 const relevant=ref==='controller'||ref==='func'?['quote-valid','quote-missing','duplicate','success','read-id']:ref==='repo'||ref==='status'?['duplicate','success','read-id']:['success','read-id'];
 return trials.filter(id=>relevant.includes(id));
}
export function beginnerReady(state:{view:number;done:number;reads:string[];patches:string[];trials:string[]},params:URLSearchParams){
 const r=beginnerRounds[state.view];
 if(state.view!==state.done+1||r.kind==='review')return false;
 const decision=params.get('sessionDecision.'+r.id);
 if(decision!==String(r.answer))return false;
 if(r.kind==='survey'&&!r.evidence.every(e=>state.reads.includes(`${r.id}:${e.ref}`)))return false;
 if(r.kind==='patch'&&!r.patches.every(p=>state.patches.includes(`${r.id}:${p.ref}`)))return false;
 return (r.requiredTrials??[]).every(id=>state.trials.includes(id));
}
