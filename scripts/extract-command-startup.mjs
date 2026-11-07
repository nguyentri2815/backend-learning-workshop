import fs from 'node:fs';
import crypto from 'node:crypto';
const root='D:/ALPACA/agent-system',module='workspaces/agent-service/1-agent-command-service';
const file='logs/app.log',raw=fs.readFileSync(`${root}/${file}`,'utf8'),lines=raw.split(/\r?\n/);
const hash=value=>crypto.createHash('sha256').update(value).digest('hex');
export function redact(text){
 if(/password|passwd|secret|authorization|access.?token|refresh.?token|phoneNumber|email|username\s*[=:]/i.test(text))return '[đã che dòng có credential hoặc dữ liệu nhạy cảm]';
 return text.replace(/(?:jdbc:)?[a-z][a-z0-9+.-]*:\/\/[^\s"'<>]+/gi,'[URL đã che]').replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi,'[email đã che]').replace(/\b(?:\d{1,3}\.){3}\d{1,3}\b/g,'[IP đã che]').replace(/[A-Z]:[\\/]Users[\\/][^\\/\s]+/gi,'[thư mục người dùng]').replace(/started by \S+/g,'started by [đã che]').replace(/\b\d{9,}\b/g,'[số đã che]');
}
const refs={};
function source(id,path,from,to){const body=fs.readFileSync(`${root}/${path}`,'utf8');refs[id]={path,from,to,sha256:hash(body),rows:body.split(/\r?\n/).slice(from-1,to).map((text,i)=>({line:from+i,text:redact(text)}))};return id;}
source('main',`${module}/src/main/java/com/alpaca/agent/AgentCommandServiceApplication.java`,15,28);
source('initializer',`${module}/src/main/java/com/alpaca/agent/config/InitConfig.java`,54,66);
source('dev',`${module}/src/main/resources/application-dev.yml`,30,46);
source('bootstrapGuard',`${module}/src/main/java/com/alpaca/agent/config/InitConfig.java`,66,72);
source('bootstrapLock',`${module}/src/main/java/com/alpaca/agent/config/InitConfig.java`,173,184);
source('bootstrapWrite',`${module}/src/main/java/com/alpaca/agent/config/InitConfig.java`,244,252);
source('ownerWrite',`${module}/src/main/java/com/alpaca/agent/function/sale_unit/CreateSaleUnitOwnerFunc.java`,46,55);
source('eventSave','workspaces/1-shared/shared-event-sourcing/src/main/java/io/eventuate/sync/AggregateRepository.java',66,77);
source('eventConfig','workspaces/1-shared/shared-eventuate/src/main/java/com/eventuate/config/LibraEventuateLocalConfiguration.java',1,12);
source('eventBeans','workspaces/1-shared/shared-event-sourcing/src/main/java/com/eventsourcing/configuration/client/EventuateJavaClientDomainEventsConfiguration.java',16,29);
source('eventSubscriber','workspaces/1-shared/shared-event-sourcing/src/main/java/com/eventsourcing/common/domain/EventHandlerBeanPostProcessor.java',23,35);
source('eventConsumer','workspaces/1-shared/shared-event-sourcing/src/main/java/com/eventsourcing/common/event/impl/EventuateKafkaAggregateSubscriptions.java',99,106);
source('base',`${module}/src/main/resources/application.yml`,30,46);
source('log4j',`${module}/src/main/resources/log4j2.yml`,1,21);
source('security',`${module}/src/main/java/com/alpaca/agent/config/ResourceServerConfiguration.java`,10,31);
source('cache','workspaces/1-shared/shared-cache/src/main/java/com/alpaca/config/SpringCacheConfig.java',17,58);
source('gradle',`${module}/build.gradle`,11,23);
source('ide','.idea/workspace.xml',93,109);source('jdk','.idea/misc.xml',4,4);
const groups=[
  {
    "id": "jvm",
    "title": "JVM, Boot & cấu hình",
    "kind": "Process Command/JVM · IDE/build tool chỉ là bên chuẩn bị",
    "when": "Bắt đầu JVM và startup; Make là cấu hình trước Run, chưa có output xác nhận lần Make thật.",
    "what": "JVM chạy main, Spring Boot bắt đầu logging và báo profile. Đây là một process Command, không phải từng app riêng cho mỗi thư viện.",
    "why": "Command cần môi trường Java và cấu hình hiệu lực trước khi ghép các thành phần.",
    "sources": [
      "ide",
      "jdk",
      "main",
      "log4j",
      "base"
    ],
    "result": "Java/profile được xác nhận bằng log của phiên; cấu hình IDE hiện tại chỉ là bằng chứng source."
  },
  {
    "id": "beans",
    "title": "Thành phần Spring / Feign",
    "kind": "Thành phần bên trong Command",
    "when": "Context và client được đăng ký lúc startup; method Feign chỉ tạo HTTP call khi code gọi nó.",
    "what": "Spring tìm, tạo và ghép bean; Feign đăng ký client proxy. Bean/client đã được khai báo không chứng minh endpoint ngoài đã phản hồi.",
    "why": "Các Controller/service/repository cần được nối đúng phụ thuộc để Command nhận công việc.",
    "sources": [
      "main",
      "gradle"
    ],
    "result": "Chỉ khẳng định những thao tác đăng ký/khởi tạo mà log nêu; WARN/DEBUG không tự là startup thất bại."
  },
  {
    "id": "data",
    "title": "Repository, JPA, DB",
    "kind": "Thành phần bên trong Command → PostgreSQL bên ngoài",
    "when": "Quét repository, mở pool và chuẩn bị persistence ở startup; query nghiệp vụ thường theo request/event.",
    "what": "Spring tìm repository; Hibernate/JPA và Hikari chuẩn bị persistence và mở JDBC tới PostgreSQL.",
    "why": "Command cần lưu aggregate và event. Hibernate là thư viện trong JVM; Java không tạo container PostgreSQL từ các dòng log này.",
    "sources": [
      "main",
      "base"
    ],
    "result": "Repository được tìm thấy chưa là query. ddl-auto update/create_namespaces có thể ghi schema nếu startup đi tiếp."
  },
  {
    "id": "init",
    "title": "Bootstrap owner / config",
    "kind": "Bean trong Command → dữ liệu DB/event và khóa Redis",
    "when": "@PostConstruct lúc startup; không cần request nghiệp vụ từ người dùng.",
    "what": "InitConfig gọi createOwner và initGlobalConfig. Theo điều kiện dữ liệu, code có thể save aggregate/event, lưu global config và lấy khóa Redis.",
    "why": "Repo tự chuẩn bị dữ liệu khởi đầu. Vì có tác động ghi, lần kiểm chứng này dừng trước Run khi chưa có phạm vi dữ liệu cô lập.",
    "sources": [
      "initializer",
      "bootstrapGuard",
      "bootstrapLock",
      "bootstrapWrite",
      "ownerWrite",
      "eventSave"
    ],
    "result": "Chưa quan sát từng thao tác bootstrap trong log phiên tham chiếu; không tạo log save thành công hoặc suy dữ liệu đã đúng từ Started."
  },
  {
    "id": "clients",
    "title": "Cache / Redis",
    "kind": "Client/thread bên trong Command → Redis bên ngoài",
    "when": "Client/pool có thể khởi tạo lúc startup; get/put/lock khi code gọi, kể cả hook bootstrap.",
    "what": "SpringCacheConfig dựng các RedissonClient. redisson-netty là thread trong JVM; Redis là dịch vụ ngoài. Ba bean client không phải ba container Redis mới.",
    "why": "Command dùng cache, khóa và dữ liệu tạm; có ba khóa URL cấu hình client, không tự suy đó là ba server hay ba database.",
    "sources": [
      "cache",
      "gradle"
    ],
    "result": "Phiên thành công có log connection pool Redisson. Phiên lỗi DB chưa có bằng chứng kết nối Redis; cấu hình không thay thế bằng chứng kết nối."
  },
  {
    "id": "events",
    "title": "Eventuate / sự kiện",
    "kind": "Bean/executor bên trong Command · Kafka là dịch vụ ngoài nếu được dùng",
    "when": "Hạ tầng được import ở startup; subscriber cần đăng ký, handler chỉ chạy khi có event phù hợp.",
    "what": "LibraEventuateLocalConfiguration import hạ tầng event store và các bean xử lý sự kiện. Tạo executor/client không chứng minh consumer đã chạy hoặc event đã được phát.",
    "why": "AggregateRepository có đường tạo/lưu event. Cần tách lưu event, đăng ký subscriber, start consumer và xử lý event thành các mức bằng chứng.",
    "sources": [
      "main",
      "eventConfig",
      "eventBeans",
      "eventSubscriber",
      "eventConsumer",
      "eventSave"
    ],
    "result": "Chỉ quan sát khởi tạo/phụ thuộc bean Eventuate. Chưa thấy Creating/Starting consumer/Subscribed hay event được xử lý trong các đoạn Command đã chọn."
  },
  {
    "id": "web",
    "title": "Web server & Security",
    "kind": "Tomcat/filter/thread bên trong Command",
    "when": "Server/filter được chuẩn bị lúc startup; Controller và kiểm tra auth hoạt động khi có HTTP request.",
    "what": "Tomcat nhúng, servlet và filter Security nhận HTTP trong JVM Command. Mapping Security không chứng minh SSO/token endpoint đã kết nối thành công.",
    "why": "Chúng là cửa vào của request và rule truy cập trước khi nghiệp vụ chạy.",
    "sources": [
      "main",
      "security",
      "gradle"
    ],
    "result": "Tomcat initialized khác started; Started/port không chứng minh response HTTP hoặc nghiệp vụ."
  },
  {
    "id": "outcome",
    "title": "Kết quả & nguyên nhân",
    "kind": "Process Command/JVM",
    "when": "Kết quả startup; không là kết quả nghiệp vụ.",
    "what": "Started ghi nhận startup thành công. Khi Application run failed, đọc chuỗi Caused by để tìm thành phần thất bại và nguyên nhân sâu nhất có bằng chứng.",
    "why": "Không lấy dòng main:27 trong stack trace làm lỗi gốc hoặc tô mọi WARN thành lỗi.",
    "sources": [
      "main",
      "base"
    ],
    "result": "Phiên lỗi default có PostgreSQL connect timeout; chưa đủ chứng cứ chọn riêng mạng, firewall, DB tắt hay đích URL sai."
  },
  {
    "id": "shutdown",
    "title": "Hủy khởi tạo / dừng",
    "kind": "Process và tài nguyên/thread bên trong Command; Docker nằm ngoài",
    "when": "Khi startup bị hủy hoặc người dùng Stop; không phải một startup thành công.",
    "what": "Context hủy khởi tạo hoặc đóng tài nguyên. Stop Command không dừng container PostgreSQL/Redis/Kafka/RabbitMQ bên Docker.",
    "why": "Cần phân biệt vòng đời JVM và dịch vụ ngoài; chỉ dừng đúng process của lần chạy được tạo.",
    "sources": [
      "main",
      "cache"
    ],
    "result": "Phiên lỗi chỉ có cancelling refresh, chưa xác nhận cleanup hoàn tất. Lần kiểm chứng này không tạo process Java nên không có process mới để dừng."
  }
];
const definitions=[
 {id:'dev-success',name:'Thành công · dev · 04/11 11:54',from:2953,to:6064,profile:'dev',outcome:'success',launch:'JAR',tail:[]},
 {id:'default-success',name:'Thành công · default · 04/11 12:43',from:15881,to:18989,profile:'default',outcome:'success',launch:'classes',tail:[18992,18993,19070,19071,19072,19073,19074]},
 {id:'default-failure',name:'Lỗi thật · default · 06/11 23:24',from:19075,to:24260,profile:'default',outcome:'failure',launch:'classes',tail:[]}
];
const datasets=definitions.map(def=>{
 const slice=lines.slice(def.from-1,def.to),selected=[];
 function pick(pattern,group,milestone='',fatal=false,required=true){const minimum=group==="outcome"&&pattern.source.startsWith("^Caused by:")?slice.findIndex(text=>text.includes("Application run failed")):0;const offset=slice.findIndex((text,i)=>i>=minimum&&pattern.test(text));if(offset<0){if(required)throw Error(`Missing ${def.id}: ${pattern}`);return;}const line=def.from+offset;if(selected.some(row=>row.line===line))return;const text=redact(lines[line-1]);selected.push({id:`L${line}`,line,text:text.length>300?text.slice(0,300)+' … [xem log đầy đủ]':text,group,milestone,fatal,level:lines[line-1].match(/^\[(\w+)/)?.[1]??(lines[line-1].startsWith('Caused by:')?'CAUSE':'TRACE')});}
 pick(/Starting AgentCommandServiceApplication/,'jvm');pick(/Running with Spring Boot/,'jvm');pick(/profile.*active:|No active profile set/,'jvm','profile');pick(/Refreshing org.springframework.boot.web/,'beans');
 pick(/Overriding bean definition.*FeignClientSpecification/,'beans');pick(/Found 15 JPA repository interfaces/,'data');pick(/Found 0 Redis repository interfaces/,'data');pick(/Bean 'eventHandlerBeanPostProcessor'|Bean 'libraEventuate|eventHandlerBeanPostProcessor.*ROLE_INFRASTRUCTURE/,'events','',false,false);
 pick(/HHH000412/,'data');pick(/HikariPool-1 - Starting/,'data');
 if(def.outcome==='success'){
  pick(/HikariPool-1 - Added connection/,'data');pick(/Initialized JPA EntityManagerFactory/,'data');pick(/Tomcat initialized with port/,'web');pick(/Mapping filters:.*springSecurityFilterChain/,'web');pick(/Version - Redisson/,'clients');pick(/redisson-netty.*connections initialized/,'clients');pick(/Tomcat started on port/,'web','port');pick(/Started AgentCommandServiceApplication/,'outcome','started');
 }else{
  pick(/SqlExceptionHelper - The connection attempt failed/,'data');pick(/Failed to initialize JPA EntityManagerFactory/,'outcome','',true);pick(/cancelling refresh attempt/,'shutdown');pick(/Application run failed/,'outcome');
  pick(/^org.springframework.beans.factory.UnsatisfiedDependencyException:.*eventHandlerBeanPostProcessor/,'outcome');pick(/^Caused by:.*BeanCreationException:.*'entityManagerFactory'/,'outcome');pick(/^Caused by: org.hibernate.exception.JDBCConnectionException/,'outcome');pick(/^Caused by: org.postgresql.util.PSQLException/,'outcome');pick(/^Caused by: java.net.SocketTimeoutException/,'outcome');pick(/AgentCommandServiceApplication.main\(AgentCommandServiceApplication.java:27\)/,'outcome');
 }
 selected.sort((a,b)=>a.line-b.line);
 const full=slice.map((text,i)=>`${def.from+i} | ${redact(text)}`).join('\n');fs.writeFileSync(`src/content/setup/command-startup-${def.id}.txt`,full+'\n');
 return {...def,logFile:file,logSha256:hash(raw),rows:selected,stopRows:def.tail.map(line=>({line,text:redact(lines[line-1])})),missing:def.outcome==='failure'?'Cần console từ ERROR/exception đầu tiên đến hết Process finished/shutdown, gồm stdout/stderr Log4j2. app.log hiện chỉ xác nhận hủy refresh, không xác nhận dọn tài nguyên hoàn tất.':'Không có toàn bộ JVM arguments/environment của phiên cũ. Không suy kết quả nghiệp vụ từ Started.'};
});
const result={sourceRoot:root,log:{path:file,sha256:hash(raw),lines:lines.length,bytes:Buffer.byteLength(raw)},groups,sources:refs,datasets,limits:'Phát lại đoạn Command đã tách theo mốc khởi động; không dùng Query/Flow/INSURTECH. Source/cấu hình IDE là bản hiện tại, chưa chứng minh nguyên văn cấu hình ở thời điểm phiên cũ. Log đã che dữ liệu nhạy cảm; không chạy repo thật. File log dùng chung, pattern không có PID từng dòng: cửa sổ được chọn theo mốc Starting/Started đúng Command; không gán mọi dòng chen kẽ cho một thread/process nếu thiếu bằng chứng.'};
fs.writeFileSync('src/content/setup/command-startup-source.json',JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify({datasets:datasets.map(d=>({id:d.id,lines:[d.from,d.to],representatives:d.rows.length,profile:d.profile,outcome:d.outcome})),sourceHashes:Object.keys(refs).length,logSha256:result.log.sha256}));
