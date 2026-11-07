import failure from "../content/setup/real-log-practice-source.json" with {type:"json"};
import postgresFailure from "../content/setup/postgres-failure-log-source.json" with {type:"json"};
import {startupDataset} from "./startup-log-model";
import type {StartupGroup} from "./startup-log-model";
import type {ConsoleLogRow} from "./StartupLogConsole";

export const realLogSource=failure;
export const postgresFailureSource=postgresFailure;
export type ReadingSession="failure"|"postgres-failure"|"success"|"retry";
export type RedisBranch="stopped"|"port";
export type RetryOutcome="success"|"next-error";
export type ReadingStep={id:string;question:string;line?:number;answer:string;choices?:{id:string;label:string;correct?:boolean;feedback:string}[]};
export const failureSteps:ReadingStep[]=[
 {id:"result",question:"Dòng nào xác nhận startup thất bại?",line:3205,answer:"Application run failed xác nhận lần startup này thất bại. Đừng kết luận từ một dòng INFO đứng trước nó."},
 {id:"exit",question:"Dòng nào xác nhận process đã thoát?",line:3499,answer:"Exit code 1 xác nhận JVM đã thoát với mã lỗi trong phiên này; ứng dụng không còn phục vụ từ process này. Mã 1 tự nó chưa nói nguyên nhân."},
 {id:"java",question:"Dòng nào cho biết Java và ứng dụng đang được khởi động?",line:112,answer:"Java 21 chạy AgentCommandServiceApplication. Starting chỉ cho biết bắt đầu, khác với Started khi startup đã qua."},
 {id:"profile",question:"Dòng nào cho biết profile thực sự của phiên 07/11?",line:114,answer:'Spring dùng "default" vì không có active profile được đặt. Trong IntelliJ, đối chiếu Active profiles, Program arguments, VM options, Environment variables và spring.config.*; tên Run Configuration chưa đủ xác nhận cấu hình hiệu lực.'},
 {id:"postgres",question:"Dòng nào chứng minh Hikari đã lấy được kết nối PostgreSQL?",line:183,answer:"Added connection tới PgConnection xác nhận đã mở được một kết nối. L184 Start completed xác nhận pool khởi tạo xong; chưa chứng minh mọi truy vấn đúng."},
 {id:"jpa",question:"Dòng nào xác nhận JPA đã khởi tạo?",line:280,answer:"JPA EntityManagerFactory đã initialized. Nhóm DB/JPA đã đi qua mốc này rồi startup vẫn thất bại ở nhóm Redis; không coi mọi nhóm đều lỗi."},
 {id:"web",question:"Dòng nào mới báo Tomcat initialized ở cổng 9901?",line:331,answer:"Initialized là mốc chuẩn bị web server. Chưa có Tomcat started hoặc Started trong phiên lỗi; chưa kết luận cổng đang lắng nghe."},
 {id:"queue",question:"Sau Application run failed, dòng nào nêu bean đầu tiên bị ảnh hưởng?",line:3206,answer:"queueHandler là bean không tạo được do phụ thuộc. Tên bean đầu tiên cho biết thành phần bị ảnh hưởng; cần đọc các Caused by phía dưới để tìm vì sao."},
 {id:"shared",question:"Chọn Caused by kế tiếp dẫn tới sharedGlobalConfigService.",line:3229,answer:"queueHandler → sharedGlobalConfigService. Đây là lỗi phụ thuộc dây chuyền; tiếp tục xuống các bean cache."},
 {id:"platform",question:"Caused by nào đi tiếp tới platformCacheConfig?",line:3245,answer:"sharedGlobalConfigService → platformCacheConfig. Bean config chưa tạo được vì còn phụ thuộc cacheManager."},
 {id:"cache",question:"Caused by nào nêu cacheManager?",line:3274,answer:"platformCacheConfig → cacheManager. Đây chưa phải kiểu lỗi kết nối cụ thể."},
 {id:"redisson",question:"Caused by nào cho biết redissonClient không tạo được?",line:3317,answer:"cacheManager → redissonClient. Redisson là Redis client trong JVM; tiếp tục đọc lỗi kết nối thay vì sửa queueHandler hoặc main:27 theo tên đầu tiên."},
 {id:"address",question:"Dòng nào nói rõ dịch vụ Redis và địa chỉ đích?",line:3432,answer:"RedisConnectionException: Unable to connect to Redis server tại localhost/127.0.0.1:6379 cho biết dịch vụ và địa chỉ Command đã dùng trong phiên này."},
 {id:"kind",question:"Dòng nào nêu kiểu lỗi kết nối cụ thể ở cuối chuỗi?",line:3469,answer:"ConnectException: Connection refused là kiểu lỗi cụ thể. L3432 cho dịch vụ/địa chỉ; L3469 cho kiểu lỗi. Log chưa phân biệt được Redis chưa chạy hay cổng host khác; cần kiểm tra."},
];
export const postgresFailureSteps:ReadingStep[]=[
 {id:"dev-profile",question:"Lần Run đang dùng profile nào?",line:114,answer:'L114 xác nhận profile "dev" đang active. Lần về spring.datasource.url trong application-dev.yml rồi kiểm tra biến môi trường, tham số Run và file ngoài nếu muốn xác định nguồn ghi đè cuối cùng.'},
 {id:"db-connect",question:"PostgreSQL đã kết nối hay mới bắt đầu kết nối?",line:377,answer:"L182 chỉ báo HikariPool-1 bắt đầu khởi tạo. L377 xác nhận đích đã thử là localhost:5432 và kết nối bị từ chối trước khi xác thực. Chưa có kết nối PostgreSQL thành công; lỗi này không phải bằng chứng sai mật khẩu."},
 {id:"db-chain",question:"Vì sao log lại báo lỗi Eventuate và JPA?",line:3377,answer:"Eventuate và JPA là các thành phần bị ảnh hưởng trong chuỗi phụ thuộc. entityManagerFactory không tạo được vì Hibernate không mở được JDBC connection; PostgreSQL tại localhost:5432 từ chối kết nối. Chuỗi lỗi này dừng ở DB, chưa có bằng chứng lỗi logic Eventuate hoặc JPA."},
 {id:"dev-exit",question:"Lần chạy kết thúc thế nào?",line:4939,answer:"L4939: Java kết thúc với non-zero exit value 1. L112 chứng minh Java đã bắt đầu chạy; L4936–4938 là tác vụ chạy main() thất bại. Vì tác vụ này lỗi nên Gradle báo BUILD FAILED ở L4949; không có bằng chứng lỗi biên dịch từ dòng BUILD FAILED này."},
];
export const postgresCauseEvidence=[
 {id:"failure",label:"Mở khối Application run failed",lines:[3377]},
 {id:"beans",label:"Đọc thành phần Eventuate bị ảnh hưởng",lines:[3378,3399,3410,3417,3432,3452,3486,3501,3562,3565,3628,3641,3705,3732,3795,3837,3901,3955,4020]},
 {id:"entity",label:"Lần tới entityManagerFactory",lines:[4083,4147]},
 {id:"jdbc",label:"Đọc lỗi mở JDBC connection",lines:[4375,4439]},
 {id:"refused",label:"Đọc PostgreSQL refused trong cùng khối lỗi",lines:[4547,4611]},
];
export function postgresChainComplete(evidence:number[]){return postgresCauseEvidence.every(item=>item.lines.some(line=>evidence.includes(line)));}
export const successSteps:ReadingStep[]=[
 {id:"listening",question:"Trong phiên thành công đã lưu, dòng nào báo Tomcat started?",line:16134,answer:"Tomcat started on port 9901 xác nhận web server đã started và lắng nghe ở thời điểm log. L16101 chỉ initialized; cần kiểm tra process hiện tại nếu đọc lại log cũ."},
 {id:"started",question:"Dòng nào xác nhận startup Command đã đi qua mốc Started?",line:18989,answer:"Started AgentCommandServiceApplication xác nhận startup đã qua ở thời điểm đó. Không chứng minh từng API hoặc nghiệp vụ đúng, cũng không chứng minh process còn chạy về sau."},
 {id:"process",question:"Sau Started, bạn kiểm tra process hiện tại ở đâu trong IntelliJ?",answer:"Trong đúng tab Run của lần chạy, xem Stop còn bật/tiến trình còn hoạt động và đọc tiếp cuối console. Nếu có Process finished with exit code … thì process đã thoát; với Stop/disconnect, đối chiếu trạng thái process. Log Started cũ không xác nhận hiện tại.",choices:[{id:"run",label:"Xem trạng thái process và cuối console Run",correct:true,feedback:"Đúng. Đối chiếu đúng lần Run và đọc các dòng sau Started."},{id:"started",label:"Chỉ cần dòng Started đã lưu",feedback:"Started là bằng chứng tại một thời điểm. Process có thể thoát sau đó; hãy xem trạng thái hiện tại trong Run."}]},
 {id:"api",question:"Hai dòng Tomcat started và Started đã chứng minh API đúng chưa?",answer:"Tách ba mức: Started → startup đã qua; Tomcat started + process/port hiện tại → cổng lắng nghe; request thực tế + status/body mong đợi → API cụ thể đã được kiểm tra.",choices:[{id:"no",label:"Chưa; cần gửi request và kiểm tra status/body",correct:true,feedback:"Đúng. Phiên này chưa cung cấp bằng chứng cho từng API."},{id:"yes",label:"Mọi API đã đúng vì startup thành công",feedback:"Startup thành công chưa phải một lần kiểm tra API. Cần request và kết quả cụ thể."}]},
];
export function retrySteps(outcome:RetryOutcome="success"):ReadingStep[]{if(outcome==="next-error")return [
 {id:"redis",question:"Dòng mới nào xác nhận đã vượt qua kết nối Redis?",line:1,answer:"Giả lập: Redis đã có connection; điểm chặn cũ đã qua. Chưa thể kết luận cả startup thành công."},
 {id:"failed",question:"Dòng nào mở khối lỗi của lần chạy mới?",line:2,answer:"Giả lập: Application run failed mới xác nhận startup vẫn thất bại. Tìm Caused by ngay dưới khối lỗi mới, không đọc lại lỗi Redis của phiên 07/11."},
 {id:"new-cause",question:"Caused by mới cho biết điểm chặn đã chuyển tới đâu?",line:3,answer:"Giả lập: PortInUseException ở cổng 9901. Redis đã qua; cần kiểm tra process sở hữu cổng trên đúng máy chạy Command trước khi xử lý. Không dừng một PID chưa xác định."},
 {id:"exit",question:"Dòng nào xác nhận process của lần chạy mới đã thoát?",line:4,answer:"Giả lập: exit code 1 xác nhận process mới đã thoát. Chưa có Tomcat started hoặc Started; cần giải quyết điểm chặn mới rồi thử lại."},
 ];return [
 {id:"redis",question:"Trong lần thử lại giả lập, dòng nào cho thấy Redis đã có kết nối?",line:1,answer:"Giả lập: Redisson đã có connection tới địa chỉ vừa kiểm tra. Chưa xác nhận mọi thao tác cache/lock đúng."},
 {id:"tomcat",question:"Dòng nào là bằng chứng mới Tomcat đã started?",line:2,answer:"Giả lập: Tomcat started ở 9901 trong lần chạy lại, khác initialized của phiên lỗi."},
 {id:"command",question:"Dòng nào xác nhận startup Command của lần thử lại đã qua?",line:3,answer:"Giả lập: Command có Started, process tiếp tục chạy trong tình huống. Đây là bằng chứng mới của bài học, chưa kiểm tra API hoặc máy thật."},
];}
export function readingRows(session:ReadingSession,branch:RedisBranch,outcome:RetryOutcome="success"):ConsoleLogRow[]{
 if(session==="failure")return failure.rows;
 if(session==="postgres-failure")return postgresFailure.rows;
 if(session==="success")return startupDataset("recorded-success","base").rows;
 const port=branch==="port"?16379:6379;
 if(outcome==="next-error")return [
  {line:1,group:"clients",level:"INFO",text:`[Giả lập] Redisson - 1 connections initialized for 127.0.0.1:${port}`},
  {line:2,group:"outcome",level:"ERROR",text:"[Giả lập] SpringApplication - Application run failed"},
  {line:3,group:"web",level:"CAUSE",text:"[Giả lập] Caused by: org.springframework.boot.web.server.PortInUseException: Port 9901 is already in use"},
  {line:4,group:"shutdown",level:"INFO",text:"[Giả lập] Process finished with exit code 1"},
 ];
 return [{line:1,group:"clients",level:"INFO",text:`[Giả lập] Redisson - 1 connections initialized for 127.0.0.1:${port}`},{line:2,group:"web",level:"INFO",text:"[Giả lập] Tomcat started on port 9901 (http)"},{line:3,group:"outcome",level:"INFO",text:"[Giả lập] Started AgentCommandServiceApplication · process tiếp tục chạy"}];
}
export function groupReading(session:ReadingSession,group:StartupGroup,rows:ConsoleLogRow[]){
 const proof=rows.filter(row=>row.group===group&&row.level!=="DEBUG"&&row.level!=="TRACE").map(row=>`${session==="retry"?"SIM":"L"}${row.line}`).join(", ")||"Không có dòng xác nhận trong phiên này.";
 if(session==="postgres-failure"){
  const facts:Partial<Record<StartupGroup,[string,string]>>={
   jvm:["Java đã bắt đầu chạy Command; L114 xác nhận profile dev đang active.","Tên Run Configuration chưa xác nhận nguồn cấu hình. Cần đối chiếu YAML, biến môi trường, tham số và file ngoài của đúng lần Run."],
   data:["Hikari bắt đầu khởi tạo nhưng kết nối PostgreSQL tại localhost:5432 bị từ chối.","L182 Starting... chưa là kết nối thành công. L377 refused xảy ra trước xác thực; entityManagerFactory không tạo được vì không mở được JDBC connection."],
   beans:["Các bean Eventuate bị ảnh hưởng vì phụ thuộc vào transaction/JPA và DB.","Đi từ L3377 qua Caused by: tới entityManagerFactory → JDBCConnectionException → PostgreSQL refused. Tên bean không tự nói nguyên nhân vận hành."],
   outcome:["Spring kết luận startup thất bại ở DB.","L3377 mở khối lỗi; đọc các Caused by trong chính khối này. Không ghép lỗi Redis của phiên 07/11 vào phiên này."],
   shutdown:["Process Java kết thúc với mã 1; tác vụ Gradle chạy main() thất bại.","L4939 non-zero exit value 1, L4949 BUILD FAILED. Java đã bắt đầu chạy ở L112; BUILD FAILED này không tự chứng minh lỗi compile."],
  };
  const fact=facts[group];return {what:fact?.[0]??"Chưa quan sát nhóm này trong trích đoạn của phiên 08/11.",proof,limit:fact?.[1]??"Chưa có bằng chứng kết nối hoặc kết quả thành công của nhóm này trong các dòng được trích."};
 }
 const content:Record<StartupGroup,[string,string]>={
  jvm:["JVM chạy main của Command; Boot đọc profile.",'Java 21 và profile "default" là bằng chứng của phiên; kiểm tra override/env/file ngoài để biết đầy đủ cấu hình hiệu lực.'],
  beans:["Spring tạo và ghép các bean phụ thuộc.",session==="failure"?"queueHandler bị ảnh hưởng qua sharedGlobalConfigService → platformCacheConfig → cacheManager → redissonClient; đọc tiếp lỗi cụ thể, chưa kết luận lỗi logic của queueHandler.":"Đăng ký/khởi tạo bean chưa chứng minh endpoint ngoài phản hồi."],
  data:["Hikari mở kết nối PostgreSQL và JPA chuẩn bị persistence.","Đã có Added connection và Initialized JPA EntityManagerFactory trong phiên; chưa chứng minh mọi truy vấn, schema hay dữ liệu nghiệp vụ đúng."],
  clients:["Redisson trong JVM chuẩn bị kết nối Redis bên ngoài.",session==="failure"?"Redis 127.0.0.1:6379 bị Connection refused; chưa xác định nguyên nhân vận hành trên máy thật.":"Đã quan sát connection initialized; chưa chứng minh mọi thao tác cache/lock thành công."],
  events:["Log nêu cảnh báo lúc Spring xử lý bean/cấu hình Eventuate.","Chưa có bằng chứng consumer đã subscribed, Kafka đã kết nối, event đã phát hoặc handler xử lý thành công; WARN này tự nó chưa kết luận startup thất bại."],
  init:["Bootstrap owner/config là đường khởi tạo được mô tả từ source trong Workshop.","Phiên này không có dòng xác nhận tạo owner hoặc save global config; không suy dữ liệu đã được ghi đúng từ tên bean hay Started."],
  web:["Tomcat chuẩn bị web server ở cổng 9901.",session==="failure"?"L331 chỉ initialized; chưa có started, chưa xác nhận cổng lắng nghe.":"Có Tomcat started tại thời điểm log; cần đối chiếu process/port hiện tại, chưa kiểm tra API."],
  outcome:[session==="failure"?"Spring kết luận startup thất bại.":"Command đi qua mốc startup Started.",session==="failure"?"L3205 Application run failed; đọc chuỗi Caused by để biết vì sao.":"Startup đã qua ở thời điểm log; chưa kiểm chứng API hoặc process hiện tại."],
  shutdown:["Ứng dụng đóng tài nguyên khi hủy context hoặc kết thúc process.",session==="failure"?"L350 Shutdown completed chỉ nói Hikari đã dọn pool; L3499 exit code 1 xác nhận process thoát lỗi.":"Không dùng shutdown của phiên khác để kết luận phiên đang xem."],
 };
 if(session==="retry"&&rows.some(row=>row.text.includes("Application run failed"))){
  const facts:Partial<Record<StartupGroup,[string,string]>>={clients:["Redisson đã mở được kết nối Redis.","Điểm chặn Redis đã qua, chưa xác nhận các thao tác cache/lock."],outcome:["Spring báo startup thất bại trong lần chạy mới.","Đọc khối lỗi mới sau SIM2; không ghép nguyên nhân Redis của phiên thật vào lần này."],web:["Web server không sử dụng được cổng 9901 trong tình huống.","PortInUseException chỉ ra cổng bị chiếm; cần kiểm tra process sở hữu cổng. Chưa có Tomcat started."],shutdown:["Process của lần thử lại đã thoát.","Exit code 1; chưa có Started. Đây là kết quả giả lập, không phải log 07/11."]};
  const fact=facts[group];return {what:fact?`Giả lập: ${fact[0]}`:"Chưa quan sát nhóm này trong lần thử lại.",proof,limit:fact?fact[1]:"Không thêm kết luận cho nhóm chưa có log."};
 }
 if(session==="retry"&&!rows.some(row=>row.group===group))return {what:"Chưa quan sát nhóm này trong trích đoạn thử lại.",proof,limit:"Giả lập chỉ cung cấp các mốc đã ghi; không thêm kết luận cho nhóm chưa có log."};
 return {what:content[group][0],proof,limit:`${session==="retry"?"Giả lập: ":""}${content[group][1]}`};
}

/** Search the source excerpt, including folded rows, within the current error block. */
export function errorBlockMatches(rows:ConsoleLogRow[],query:string,scope:"error"|"all"="error"){
 const start=rows.find(row=>row.text.includes("Application run failed"))?.line;
 const needle=query.trim().toLocaleLowerCase();
 const lineNumber=/^l(\d+)$/.exec(needle)?.[1];
 return !needle||scope==="error"&&start===undefined?[]:rows.filter(row=>(scope==="all"||row.line>start!)&&(lineNumber?row.line===Number(lineNumber):row.text.toLocaleLowerCase().includes(needle)));
}

export function inspectLogLine(session:ReadingSession,row:ConsoleLogRow[],line:number){
 const entry=row.find(item=>item.line===line);if(!entry)return null;
 const base={category:"Chi tiết dòng log",title:"Đang quan sát một dòng của phiên",meaning:groupReading(session,entry.group as StartupGroup,row).what,limit:groupReading(session,entry.group as StartupGroup,row).limit};
 if(session==="postgres-failure"){
  const nextCause=row.find(item=>item.line>line&&item.text.startsWith("Caused by:"))?.line;
  if(line===114)return {...base,category:"Profile hiệu lực",title:'Profile "dev" đang active',meaning:'L114 xác nhận JVM đang dùng profile "dev".',limit:"Đối chiếu spring.datasource.url trong application-dev.yml, các biến môi trường, Program arguments, VM options và file cấu hình ngoài để xác định nguồn URL cuối cùng."};
  if(line===182)return {...base,category:"Bắt đầu pool",title:"Hikari mới bắt đầu khởi tạo",meaning:"HikariPool-1 - Starting... chỉ báo bắt đầu chuẩn bị pool. Chưa có Added connection hoặc Start completed.",limit:"Đọc L377: kết nối tới localhost:5432 bị từ chối. Không dùng Starting... làm bằng chứng đã kết nối DB."};
  if([377,4547,4611].includes(line))return {...base,category:"Đích và lỗi kết nối PostgreSQL",title:"PostgreSQL tại localhost:5432 từ chối kết nối",meaning:"Đích đã được log xác nhận: localhost:5432. Kết nối tới cổng bị từ chối trước khi xác thực PostgreSQL.",limit:"Connection refused tự nó chỉ xác nhận kết nối tới cổng bị từ chối. Người chạy cung cấp riêng bối cảnh đã chủ động tắt Docker khi thử; log này không tự chứng minh Docker đang tắt.",...(line>3377?{nextCause}:{})};
  if(line===3377)return {...base,category:"Kết quả khởi động",title:"Startup dừng ở DB",meaning:"Application run failed mở khối lỗi của phiên 08/11. Tìm Caused by: bên dưới dòng này để lần chuỗi phụ thuộc.",limit:"Các bean Eventuate/JPA bị ảnh hưởng; cần tới lỗi JDBC và PostgreSQL refused để biết nguyên nhân kết nối.",nextCause};
  if([4936,4938,4939,4949].includes(line))return {...base,category:"Kết thúc tác vụ Run",title:"Java đã chạy rồi thoát lỗi; Gradle báo BUILD FAILED",meaning:"L4939 ghi non-zero exit value 1; tác vụ chạy AgentCommandServiceApplication.main() thất bại nên Gradle báo BUILD FAILED.",limit:"L112 xác nhận Java đã bắt đầu chạy. Cần đọc lỗi runtime của cùng phiên; BUILD FAILED ở đây không tự chứng minh lỗi biên dịch."};
  if(entry.text.includes("JDBCConnectionException")&&!entry.text.includes("bean with name")&&!entry.text.includes("PersistenceException"))return {...base,category:"Không mở được JDBC connection",title:"Hibernate không mở được kết nối để thực hiện DDL",meaning:"JDBCConnectionException báo Unable to open JDBC Connection for DDL execution. Kết nối DB không mở được, nên JPA không tạo được SessionFactory.",limit:"Đi tiếp tới PSQLException refused để thấy đích localhost:5432; không có bằng chứng DDL đã chạy hay schema đã được tạo.",nextCause};
  if(entry.text.includes("bean with name 'entityManagerFactory'" )&&[4083,4147].includes(line))return {...base,category:"JPA bị ảnh hưởng",title:"entityManagerFactory không tạo được",meaning:"JPA/Hibernate không tạo được SessionFactory vì không mở được JDBC connection.",limit:"Đây là thành phần bị ảnh hưởng; lần tiếp tới JDBCConnectionException rồi PostgreSQL refused.",nextCause};
  const bean=entry.text.match(/bean with name '([^']+)'/)?.[1];
  if(bean)return {...base,category:"Thành phần bị ảnh hưởng",title:`${bean} không tạo được do phụ thuộc`,meaning:`Spring chưa tạo được ${bean}. Chuỗi Eventuate phụ thuộc vào transaction manager và JPA, rồi tới kết nối PostgreSQL.`,limit:"Tên Eventuate hoặc tên bean chưa chứng minh lỗi logic ở thành phần đó. Tìm tiếp Caused by: trong cùng khối lỗi.",nextCause};
  if(entry.text.startsWith("Caused by:"))return {...base,category:"Nguyên nhân bên dưới",title:"Tiếp tục lần lỗi kết nối DB",nextCause};
  return base;
 }
 if(entry.text.includes("Application run failed"))return {...base,category:"Kết quả khởi động",title:"Command khởi động thất bại",meaning:"Application run failed báo startup thất bại. Cần lần các Caused by bên dưới trong cùng khối lỗi.",limit:session==="failure"?"L3499 xác nhận process đã thoát với exit code 1. Tên bean đầu tiên chưa cho biết nguyên nhân cụ thể.":"Giả lập: đây là khối lỗi mới sau khi Redis đã có kết nối; chưa có Started."};
 if(entry.text.includes("Process finished"))return {...base,category:"Trạng thái process",title:"Process Command đã thoát",meaning:"Process finished with exit code 1 xác nhận process đã kết thúc với mã lỗi.",limit:"Mã thoát không tự nói nguyên nhân. Đọc Application run failed và Caused by của chính lần chạy này."};
 if(session==="failure"&&line===3432)return {...base,category:"Dịch vụ và địa chỉ",title:"Redisson không kết nối được Redis",meaning:"Dịch vụ: Redis. Địa chỉ Command đang dùng: 127.0.0.1:6379 (localhost).",limit:"Đọc L3469 để phân biệt kiểu lỗi kết nối. Tình trạng container và cổng máy thật vẫn cần kiểm tra."};
 if(session==="failure"&&line===3469)return {...base,category:"Kiểu lỗi kết nối",title:"Kết nối Redis bị từ chối",meaning:"Connection refused là kiểu lỗi kết nối cụ thể, khác với tên bean bị ảnh hưởng.",limit:"L3432 cho Redis và địa chỉ 127.0.0.1:6379. Log chưa phân biệt Redis dừng với cổng host khác."};
 const bean=entry.text.match(/bean with name '([^']+)'/)?.[1];
 if(bean)return {...base,category:"Lỗi phụ thuộc dây chuyền",title:`${bean} bị ảnh hưởng bởi lỗi phụ thuộc`,meaning:`Spring chưa tạo được ${bean}. Đây là thành phần bị ảnh hưởng; các nguyên nhân phía dưới giải thích vì sao.`,limit:"Chưa kết luận lỗi logic của bean này hoặc của main:27. Đi tiếp xuống Caused by.",nextCause:row.find(item=>item.line>line&&item.text.includes("Caused by:"))?.line};
 if(entry.text.includes("PortInUseException"))return {...base,category:"Điểm chặn mới · Giả lập",title:"Redis đã qua; cổng 9901 đang bị chiếm",meaning:"Caused by mới báo PortInUseException. Điểm chặn đã chuyển từ Redis sang cổng web server.",limit:"Kiểm tra process sở hữu cổng 9901 trên đúng máy chạy Command; chỉ xử lý process đã xác định thuộc phạm vi của mình. Chưa có Tomcat started hoặc Started."};
 if(entry.text.includes("Tomcat initialized"))return {...base,category:"Chuẩn bị web server",title:"Tomcat mới initialized",meaning:"Tomcat initialized chỉ là giai đoạn chuẩn bị web server, chưa phải kết quả startup.",limit:"Trong phiên lỗi tìm Application run failed; trong phiên thành công tìm Tomcat started rồi Started."};
 if(entry.text.includes("Shutdown completed"))return {...base,category:"Dọn tài nguyên",title:"Hikari đã dọn pool",meaning:"Shutdown completed nói Hikari đã dọn pool khi hủy context. Đây không phải Command chạy thành công.",limit:"Tìm Application run failed và Process finished with exit code 1 để xác nhận kết quả của phiên."};
 if(entry.text.includes("Starting AgentCommand"))return {...base,category:"Khởi động JVM",title:"Java đang bắt đầu chạy Command"};
 if(entry.text.includes("No active profile"))return {...base,category:"Profile hiệu lực",title:'Spring đang dùng profile "default"'};
 if(entry.text.includes("Added connection"))return {...base,category:"PostgreSQL",title:"Hikari đã lấy được kết nối PostgreSQL"};
 if(session==="failure"&&line===187)return {...base,category:"Cấu hình datasource",title:"Nhãn JDBC URL chưa cung cấp địa chỉ",meaning:"Database JDBC URL chỉ nêu Connecting through datasource 'HikariDataSource (HikariPool-1)'. Đây là datasource/pool, chưa phải URL chứa host, port và database.",limit:"Chưa biết địa chỉ hiệu lực của phiên 07/11. Cần JDBC URL hiệu lực và môi trường chạy Command; đối chiếu spring.datasource.url cùng các nguồn override của đúng lần Run."};
 if(entry.text.includes("Initialized JPA"))return {...base,category:"JPA",title:"JPA đã khởi tạo"};
 if(entry.text.includes("connections initialized"))return {...base,category:"Kết nối Redis",title:"Redisson đã có kết nối Redis"};
 if(entry.text.includes("Tomcat started"))return {...base,category:"Web server",title:"Tomcat đã started"};
 if(entry.text.includes("Started AgentCommand"))return {...base,category:"Kết quả khởi động",title:"Command đã đi qua mốc Started"};
 if(entry.text.includes("Caused by:"))return {...base,category:"Nguyên nhân bên dưới",title:"Đang lần nguyên nhân cụ thể",nextCause:row.find(item=>item.line>line&&item.text.includes("Caused by:"))?.line};
 return base;
}
