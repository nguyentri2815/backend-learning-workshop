import {useState} from "react";
import type {PracticeContext} from "./project-practice-model";
import type {Simulation} from "./practice-runtime-model";
import {containerStatus,serviceCatalog} from "./infrastructure-model";
import {composeCommand,composeSetup} from "./docker-practice-model";
import {classesDirectory,executionSource,hasJar,operationLabels} from "./execution-model";
import "./execution-practice.css";

export function ExecutionState({context}:{context:PracticeContext}){
 const s=context.sim,e=s.execution;
 const related=[...new Set(["postgres-write",s.composeService,...Object.keys(s.containers)])];
 const rows=[
  ["source","Source module",context.phase==="after"?"Có source Command":"Chưa có source module",context.phase==="after"?"Sau lấy source; Sync chỉ đọc cấu trúc/dependency":"Clone/lấy repo con mới đưa source về"],
  ["jar","JAR",hasJar(s)?"Có JAR trong bài":"Chưa tạo JAR trong bài",hasJar(s)?e.jarCause==="bootJar"?"Từ thao tác đóng gói bootJar":"Tiến độ cũ ghi đã build; chưa lưu thao tác tạo chi tiết":e.classes?"Có output compile vẫn chưa chứng minh có JAR":"Chỉ bootJar thành công mới thêm artifact đóng gói"],
  ["containers","Container liên quan",related.map(id=>`${id}: ${containerStatus(s,id)}`).join(" · "),"Compose tạo; Stop giữ container; mở Engine hoặc Run Java không tự tạo"],
  ["process","Process Command",s.process==="running"?"Đang chạy trong bài":s.process==="stopped"?"Đã dừng trong bài":s.process==="error"?"Chưa chạy thành công":"Chưa chạy trong bài",s.process==="running"||s.process==="stopped"?`${s.launchMode==="intellij"?"Run main trong IntelliJ":"bootRun ở Terminal"} · profile ${s.launchProfile==="dev"?"dev":"mặc định"} · port ${executionSource.port}`:"Run mới tạo process; JAR tồn tại không có nghĩa đang chạy"],
  ["api","API / nghiệp vụ","Chưa kiểm chứng","Chưa có request/response hoặc kết quả nghiệp vụ trong bài này"],
 ];
 return <div className="execution-state" aria-label="Trạng thái mô phỏng hiện tại"><div className="execution-mode"><b>Bạn tự thực hiện lần đầu</b><span>Trạng thái bài học · không kiểm tra máy thật</span></div><table className="execution-state-table"><tbody>{rows.map(([id,label,value,cause])=><tr key={id} data-state={id}><th>{label}</th><td><b>{value}</b><small>{cause}</small></td></tr>)}</tbody></table>{operationLabels[e.last]&&<p className="execution-last" aria-live="polite">Vừa thao tác: {operationLabels[e.last]}{e.lastService?` · ${e.lastService}`:""}.</p>}</div>;
}

const actions={
 sync:{title:"Gradle sync",tool:"IDE hỏi Gradle và nhận project model",output:"Module/dependency được IDE nhận diện",where:"Project / Gradle tool window",note:"Source đã có sau lấy repo; sync không mặc định compile, đóng gói hay Run.",classes:false,jar:false,process:false},
 compile:{title:"Compile",tool:"Gradle compileJava biên dịch Java",output:"Class output; có thể có build/ mà chưa có build/libs/*.jar",where:classesDirectory,note:"Đây là vị trí mặc định của Gradle Java trong project này; cấu hình IDE khác có thể dùng nơi khác.",classes:true,jar:false,process:false},
 package:{title:"bootJar",tool:"Gradle biên dịch/chuẩn bị classes rồi đóng gói",output:executionSource.artifact.path,where:"Project → Command → build → libs",note:"Executable JAR chưa là process; không tạo container Docker.",classes:true,jar:true,process:false},
 run:{title:"bootRun / Run main",tool:"Khởi động JVM với classpath và cấu hình chạy",output:"Process Java / log; port chỉ có khi ứng dụng bind thành công",where:"Run/Services hoặc Terminal giữ bootRun",note:"Không bắt buộc bootJar trước mỗi lần chạy. Run main có Before launch/delegation tùy cấu hình IntelliJ; không khẳng định mọi máy biên dịch vào cùng thư mục.",classes:true,jar:false,process:true},
};
export function ActionOutcomes({sim:s,update,go}:{sim:Simulation;update:(patch:Partial<Simulation>)=>void;go:(task:"build-task"|"run-config")=>void}){
 const selected=actions[s.execution.preview];
 return <details className="execution-actions"><summary>Sync / Compile / Package / Run tạo ra gì?</summary><p>Chọn để xem tác động điển hình. Sơ đồ nhỏ này không thực thi task hoặc đổi output của bài đang làm.</p><div className="execution-action-tabs">{Object.entries(actions).map(([key,action])=><button key={key} aria-pressed={s.execution.preview===key} onClick={()=>update({execution:{...s.execution,preview:key as Simulation["execution"]["preview"]}})}>{action.title}</button>)}</div><div className="execution-impact"><b>{selected.tool}</b><div className="execution-output-slots"><span>Class output: {selected.classes?"có thể / theo task":"không tự tạo"}</span><span>JAR mới: {selected.jar?"có":"không yêu cầu / không tự tạo"}</span><span>Process Command: {selected.process?"khi Run thành công":"chưa Run"}</span><span>Container: không tự tạo</span></div><p><b>Xuất hiện:</b> {selected.output}</p><p><b>Kiểm tra ở:</b> <code>{selected.where}</code></p><p>{selected.note}</p><p>Gradle có thể chạy JVM/daemon riêng để làm việc; bảng chỉ theo dõi process ứng dụng Command.</p>{s.execution.preview==="run"?<button className="text-button" onClick={()=>go("run-config")}>Mở Run Configuration · không cần đóng gói JAR trước</button>:s.execution.preview==="compile"||s.execution.preview==="package"?<button className="text-button" onClick={()=>go("build-task")}>Đến bài Terminal / task Command</button>:null}</div></details>;
}

export function AgentExecutionHistory({kind}:{kind:"build"|"run"|"docker"}){
 const ids=kind==="docker"?["S05","S06","S07","S08"]:kind==="run"?["S11","S10"]:["S09","S10","S11"];
 const [selected,setSelected]=useState(kind==="docker"?"S07":kind==="run"?"S11":"S10");
 const section=executionSource.report.history.find(item=>item.id===selected)!;
 return <details className="execution-history"><summary>Lần trước agent đã làm gì?</summary><p>Lịch sử tham khảo, tách khỏi thao tác của bạn và trạng thái mô phỏng phía trên.</p><div className="execution-history-tabs">{ids.map(id=><button key={id} aria-pressed={id===selected} onClick={()=>setSelected(id)}>{id} · {executionSource.report.history.find(item=>item.id===id)?.title}</button>)}</div><p>{section.note}</p><p className="execution-actors">{kind==="docker"?"Agent: xử lý chọn lọc infrastructure/Debezium theo S07–S08. Người mở Desktop/cài đặt chưa rõ; container project khác có sẵn không được tự gán là agent tạo.":"Agent: thử root build, build module và smoke-test theo S09–S11. Người dùng: đã lấy source theo S03. Tác nhân tạo mọi file/đổi IDE không được suy ra chỉ từ trạng thái hiện tại."}</p><details><summary>Đọc phần báo cáo liên quan · giữ số dòng gốc</summary><small>{executionSource.report.path} · {section.id}</small><pre>{section.rows.map(row=>`${row.line}  ${row.text}`).join("\n")}</pre><small>SHA-256 báo cáo: {executionSource.report.sourceSha256}</small></details><p>Không dựng stdout lịch sử bị thiếu. Lệnh/thông báo ở vùng thực hành là hướng dẫn hoặc mô phỏng có nhãn riêng.</p></details>;
}

export function ContainerOrigin({sim:s,id}:{sim:Simulation;id:string}){
 const service=serviceCatalog.find(item=>item.id===id);if(!service)return null;
 const origin=s.containerOrigins[id]??"unknown";
 return <div className="container-origin" data-testid="container-origin"><h4>Tại sao {service.name} có mặt?</h4>{origin==="compose-user"?<><p><b>Bạn tạo trong bài:</b> bấm Tạo tài nguyên và container sau khi chuẩn bị image. Thao tác đó thêm container; mở Docker Desktop/Engine không tạo nó.</p><dl><dt>Service / nguồn</dt><dd>{id} · {composeSetup.composeFile}:{service.line}</dd><dt>Tên project / container</dt><dd>{composeSetup.projectName} · {service.name}</dd><dt>Thao tác tương ứng</dt><dd><code>{composeCommand(id)}</code><small>Lệnh hướng dẫn đã giới hạn service; bài mô phỏng tách Create và Start để quan sát.</small></dd></dl><p>{service.name.startsWith("sale-platform-")?"Tên tự sinh minh họa: project + service + index theo Compose v2. Tên thật phụ thuộc cách gọi Compose.":"Tên tường minh từ container_name trong Compose; -p không tự thay tên đó."}</p></>:<><p><b>{origin==="existing"?"Container được cho sẵn ở điểm bắt đầu đã tạo trước.":"Container có sẵn trong snapshot/tiến độ cũ."}</b> Chưa ghi thao tác tạo hoặc tác nhân. Start chỉ chạy lại nó; không được suy ra do agent hay repo này tạo.</p><p>Đối chiếu khả dĩ: service {id} tại {composeSetup.composeFile}:{service.line}, tên {service.name}. Trùng tên/cổng chưa đủ xác nhận nguồn tạo hoặc quyền dùng dữ liệu.</p></>}<p>Nguồn cấu hình: {composeSetup.projectEvidence.path}:102; Compose:{service.line}. Lịch sử S07 có tên agent-system-postgres-… và thiếu exact flags; không đồng nhất với tên minh họa của lệnh -p sale-platform trong bài. Readiness và kết nối Java vẫn cần bằng chứng riêng.</p></div>;
}
