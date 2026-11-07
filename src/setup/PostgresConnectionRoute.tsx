import {useEffect,useRef,useState} from "react";
import {ArrowLeft,ArrowRight} from "lucide-react";
import {StartupLogConsole} from "./StartupLogConsole";
import {realLogSource,postgresFailureSource} from "./real-log-practice-model";
import {postgresRouteSource,postgresRouteStorageKey,postgresDevRouteStorageKey,postgresTarget,readPostgresRoute} from "./postgres-route-model";
import type {PostgresRouteState} from "./postgres-route-model";
import "./redis-connection-route.css";
import "./postgres-connection-route.css";

type RefId=keyof typeof postgresRouteSource.refs;
const titles=["Command cần DB để làm gì?","Địa chỉ PostgreSQL được lấy từ đâu?","DB ở đâu và tôi cần kiểm tra chỗ nào?","Áp dụng vào phiên thật 07/11"];
const milestones:Record<number,string>={
 182:"HikariPool-1 - Starting... chỉ báo pool bắt đầu khởi tạo, chưa có kết nối PostgreSQL thành công.",
 377:"Đích đã thử là localhost:5432. Connection refused báo kết nối tới cổng bị từ chối trước xác thực, chưa có phiên DB để thực hiện truy vấn.",
 183:"Hikari đã thêm một PgConnection: đã mở được kết nối PostgreSQL. Dòng này không chứa hostname, cổng hay tên database.",
 184:"HikariDataSource báo Start completed: pool kết nối đã khởi tạo xong. Chưa chứng minh một thao tác nghiệp vụ cụ thể đã thành công.",
 280:"JPA EntityManagerFactory đã khởi tạo. Đây là mốc chuẩn bị persistence; cần bằng chứng riêng cho request, câu truy vấn và kết quả đọc/ghi cụ thể.",
};

export function PostgresConnectionRoute({onClose,session="failure"}:{onClose:()=>void;session?:"failure"|"postgres-failure"}){
 const devDb=session==="postgres-failure",storageKey=devDb?postgresDevRouteStorageKey:postgresRouteStorageKey,logSource=devDb?postgresFailureSource:realLogSource;
 const [state,setState]=useState(()=>readPostgresRoute(storageKey));
 const [proof,setProof]=useState(devDb?377:183),[node,setNode]=useState("windows"),[storageWarning,setStorageWarning]=useState(false);
 const root=useRef<HTMLElement>(null),heading=useRef<HTMLHeadingElement>(null);
 const target=postgresTarget(state),local=state.mode==="docker";
 useEffect(()=>{
  try{localStorage.setItem(storageKey,JSON.stringify({version:1,...state}));setStorageWarning(false);}
  catch{setStorageWarning(true);}
 },[state,storageKey]);
 useEffect(()=>{root.current?.scrollIntoView({block:"start"});},[]);
 useEffect(()=>{heading.current?.focus({preventScroll:true});},[state.step]);
 function change(patch:Partial<PostgresRouteState>){setState(previous=>({...previous,...patch}));}
 const profile=logSource.rows.find(row=>row.line===114)!;
 const jdbcLog=logSource.rows.find(row=>row.line===(devDb?377:187));
 const finalAnswers=devDb?[
  ["label","Connection refused đủ chứng minh Docker đang tắt"],
  ["url","Kiểm tra cổng trên máy chạy Command; đối chiếu Docker nếu DB của bài chạy bằng Docker"],
  ["docker","Đổi mật khẩu PostgreSQL ngay"],
 ] as const:[
  ["label","Chỉ cần nhãn Database JDBC URL ở L187"],
  ["url","JDBC URL hiệu lực và môi trường chạy Command"],
  ["docker","Chỉ xem cổng Docker Desktop trên máy mình"],
 ] as const;

 return <section ref={root} className="redis-route postgres-route" aria-label="Lần đường kết nối PostgreSQL">
  <header className="redis-route-header"><div><span>Lần đường kết nối PostgreSQL · {devDb?"08/11 · dev":"07/11 · default"} · {state.step}/4</span><h3 ref={heading} tabIndex={-1}>{state.step===4&&devDb?"Áp dụng vào phiên thật 08/11":titles[state.step-1]}</h3></div><button type="button" onClick={onClose}>Quay lại bài đọc log</button></header>
  <ol className="redis-route-progress" aria-label="Bốn bước lần kết nối PostgreSQL">{["Ai dùng kết nối","Nguồn cấu hình DB","Local hay từ xa","Áp dụng phiên thật"].map((title,index)=><li key={title} aria-current={state.step===index+1?"step":undefined}>{index+1}. {title}</li>)}</ol>
  {storageWarning&&<p role="status">Chưa lưu được nhánh này; bạn vẫn có thể tiếp tục trong phiên hiện tại.</p>}
  <p className="redis-route-origin">{devDb?"Log thật đã lưu · 08/11 · L114: dev active; L182: Hikari bắt đầu khởi tạo; L377: PostgreSQL tại localhost:5432 từ chối kết nối.":"Log thật đã lưu · 07/11 · L183–184: Hikari đã mở kết nối PostgreSQL; L280: JPA đã khởi tạo."} Source là trích đoạn đã đối chiếu. Ví dụ biến môi trường và đường kết nối có nhãn <b>Giả lập</b>.</p>
  <p className="postgres-effective-status">{devDb?<><b>Đích đã được log xác nhận: localhost:5432</b>. Kết nối bị từ chối trước xác thực. Chưa xác nhận đầy đủ JDBC URL, tên database và nguồn override cuối cùng.</>:<><b>Phiên thật 07/11: Chưa biết địa chỉ hiệu lực</b>. Các thao tác Giả lập bên dưới không bổ sung bằng chứng về địa chỉ trong lần Run này.</>}</p>
  {devDb&&<p className="redis-route-observation"><b>Bối cảnh do người chạy cung cấp:</b> đã chủ động tắt Docker khi thử. Connection refused tự nó chỉ xác nhận kết nối tới cổng bị từ chối; chưa xác nhận dịch vụ phía sau cổng nằm trong Docker hoặc Docker đang tắt.</p>}

  {state.step===1?<>
   <p>Command dùng DB để đọc hoặc lưu dữ liệu. Cùng xem một luồng ngắn từ điểm nhận request đến repository và bảng được ánh xạ trong PostgreSQL.</p>
   <button type="button" className="redis-route-next" aria-expanded={state.sourceOpen} onClick={()=>change({sourceOpen:!state.sourceOpen})}>Ai dùng kết nối này?</button>
   {state.sourceOpen&&<>
    <ol className="redis-binding-path" aria-label="Luồng đọc cấu hình đã đối chiếu"><li>Request GET <code>/global-config/load-all</code> → controller</li><li>Service nghiệp vụ <code>GlobalConfigFunc.getAllConfig()</code></li><li>Cache rỗng → <code>ConfigRepository.findAll()</code></li><li>JPA/Hibernate → Hikari → PostgreSQL · bảng <code>config_aggregate</code></li></ol>
    <p><b>Luồng này xảy ra khi xử lý request.</b> Trong source, lớp xử lý nghiệp vụ là <code>GlobalConfigFunc</code>, được khai báo <code>@Component</code>. Khi cache rỗng, nó gọi repository để đọc DB; nếu cache đã có dữ liệu thì dùng cache. Đây là đường gọi đã đối chiếu trong source, chưa phải request đã được quan sát ở phiên đang xem.</p>
    <div className="redis-source-grid"><SourceExcerpt id="controller" highlights={[18,21,23]} title="Điểm nhận request trong Command"/><SourceExcerpt id="service" from={45} highlights={[45,48,49]} title="Service nghiệp vụ gọi repository khi cache rỗng"/></div>
    <details><summary>Khai báo lớp xử lý nghiệp vụ và repository được inject</summary><SourceExcerpt id="service" to={30} highlights={[25,27,29]} title="GlobalConfigFunc là Component trong Command"/></details>
    <div className="redis-source-grid"><SourceExcerpt id="repository" highlights={[4,8]} title="Repository đọc dữ liệu bằng JpaRepository"/><SourceExcerpt id="entity" highlights={[20,21,22,24,26]} title="Đối tượng Java ánh xạ vào bảng PostgreSQL"/></div>
    <dl className="postgres-roles"><dt>Repository</dt><dd>Nơi code gọi để đọc hoặc lưu dữ liệu. Ở đây <code>findAll()</code> là phương thức kế thừa từ <code>JpaRepository</code>.</dd><dt>JPA / Hibernate</dt><dd>Ánh xạ đối tượng Java với dữ liệu trong DB: <code>ConfigAggregate</code> ↔ bảng <code>config_aggregate</code>. JPA là API; Hibernate là phần triển khai trong phiên log này.</dd><dt>Hikari</dt><dd>Quản lý pool kết nối để code truy cập DB có thể mượn và trả kết nối.</dd><dt>PostgreSQL</dt><dd>Dịch vụ lưu dữ liệu bên ngoài tiến trình Java của Command.</dd></dl>
   </>}
   <h4>Đối chiếu với phiên thật đã đi tới đâu</h4>
   <StartupLogConsole rows={logSource.rows.filter(row=>(devDb?[182,377]:[183,184,280]).includes(row.line))} label={devDb?"Bắt đầu và kết quả kết nối PostgreSQL":"Ba mốc PostgreSQL trong phiên thật"} selectedLine={proof} onSelect={row=>setProof(row.line)}/>
   <p className="redis-node-explanation" aria-live="polite">L{proof} · {milestones[proof]}</p>
   <p><b>Một thao tác nghiệp vụ cụ thể cần bằng chứng riêng:</b> request hoặc tác vụ nào đã chạy, truy vấn/thao tác nào được thực hiện và kết quả tương ứng. {devDb?"Phiên này chưa mở được kết nối PostgreSQL, nên không thể lấy các dòng lỗi làm bằng chứng đọc/ghi DB thành công.":<>Ba mốc startup này chưa xác nhận <code>findAll()</code> hoặc một lần ghi dữ liệu đã thành công.</>}</p>
   <Next onClick={()=>change({step:2})}>Lần về cấu hình DB</Next>
  </>:state.step===2?<>
   <ol className="redis-binding-path" aria-label="Lần về nguồn cấu hình datasource"><li><b>Hikari datasource</b> · {devDb?"L182 → L377":"L183–184"}</li><li>Spring Boot cấp cấu hình qua <code>spring.datasource.url</code></li><li><code>application.yml</code> và file theo profile</li><li>Đối chiếu biến môi trường, tham số Run và file ngoài</li></ol>
   <p>Repo không chứa source auto-configuration của Spring Boot. Không suy ra URL từ tên <code>HikariPool-1</code>; lần về key datasource rồi kiểm tra các nguồn cấu hình của đúng lần Run.</p>
   <div className="redis-route-log-proof"><b>L114 · Profile của phiên thật</b><pre>{profile.text}</pre>{devDb?<p>Log xác nhận profile <b>dev</b> đang active. Lần theo <code>spring.datasource.url</code> trong <code>application-dev.yml</code>; cần kiểm tra nguồn ghi đè trước khi kết luận URL cuối cùng đến từ file này.</p>:<p>Spring dùng profile <b>default</b>. Có <code>application-dev.yml</code> trong repo chưa chứng minh phiên này dùng dev.</p>}</div>
   <div className="redis-source-grid" aria-label="Hai file cấu hình DB cạnh nhau"><SourceExcerpt id="base" highlights={[30,33]} title="application.yml · giá trị trong YAML đã che host"/><SourceExcerpt id="dev" highlights={[30,33]} title="application-dev.yml · ví dụ dev trong repo"/></div>
   <section className="redis-run-config" aria-label="Thử biến DOCKER_HOST_IP">
    <h4>Giả lập · Nếu chạy profile dev</h4>
    <p><code>{'jdbc:postgresql://${DOCKER_HOST_IP:localhost}/alpaca-event'}</code>: Spring lấy biến <code>DOCKER_HOST_IP</code>; phần sau dấu <code>:</code> là giá trị dự phòng khi chưa đặt biến.</p>
    <fieldset className="redis-route-options"><legend>Hai trạng thái biến môi trường · Giả lập</legend><label><input type="radio" name="postgres-env" checked={!state.envSet} onChange={()=>change({envSet:false})}/>Chưa đặt DOCKER_HOST_IP</label><label><input type="radio" name="postgres-env" checked={state.envSet} onChange={()=>change({envSet:true})}/>Đã đặt DOCKER_HOST_IP=postgres.lab.example</label></fieldset>
    <p className="postgres-resolved-url" aria-live="polite"><b>URL của ví dụ dev · Giả lập:</b> <code>jdbc:postgresql://{state.envSet?"postgres.lab.example":"localhost"}/alpaca-event</code></p>
    <table aria-label="Các phần của JDBC URL dev"><thead><tr><th>Phần</th><th>Giá trị · Giả lập</th><th>Ý nghĩa</th></tr></thead><tbody><tr><th>Host</th><td>{state.envSet?"postgres.lab.example":"localhost"}</td><td>Máy mà app gọi tới; dùng giá trị biến nếu đã đặt, nếu chưa thì localhost.</td></tr><tr><th>Port</th><td>5432 · mặc định</td><td>URL dev này không ghi :port; driver PostgreSQL dùng cổng mặc định 5432. Khi cần cổng khác, ghi :port sau host.</td></tr><tr><th>Tên database</th><td>alpaca-event</td><td>Database bên trong dịch vụ PostgreSQL; phần sau dấu /, khác hostname và schema.</td></tr></tbody></table>
    <p>Tên biến <code>DOCKER_HOST_IP</code> không tự chứng minh DB nằm trong Docker. {devDb?"Hai trạng thái chỉ giải thích placeholder; L377 vẫn xác nhận đích đã thử là localhost:5432. Chưa xác nhận giá trị biến hay nguồn override của lần Run.":"Hai trạng thái này chỉ giải thích placeholder của ví dụ dev; không đổi profile default hay địa chỉ chưa biết của phiên thật."}</p>
   </section>
   <button type="button" className="redis-route-next" aria-expanded={state.runOpen} onClick={()=>change({runOpen:!state.runOpen})}>Xem vị trí trong Run Configuration</button>
   {state.runOpen&&<RunConfiguration devDb={devDb}/>}
   <button type="button" className="redis-route-next" aria-expanded={state.urlLogOpen} onClick={()=>change({urlLogOpen:!state.urlLogOpen})}>{devDb?"Mở L377 · Đích PostgreSQL đã thử":"Mở L187 · Database JDBC URL"}</button>
   {state.urlLogOpen&&<div className="redis-route-log-proof" aria-label={devDb?"L377 xác nhận đích DB":"L187 chưa cho địa chỉ DB"}>
    {jdbcLog&&<StartupLogConsole rows={[jdbcLog]} label={devDb?"Dòng địa chỉ PostgreSQL trong phiên thật":"Dòng JDBC URL trong phiên thật"} selectedLine={jdbcLog.line} onSelect={()=>change({urlLogOpen:true})}/>}
    {devDb?<p>L377 cho biết <b>đích đã thử localhost:5432</b> và kết quả refused, trước bước xác thực. Dòng này không cho đầy đủ JDBC URL hoặc tên database; cũng chưa chứng minh URL đến từ YAML hay nguồn ghi đè nào.</p>:<p>Nhãn <code>Database JDBC URL</code> ở L187 chỉ báo <code>Connecting through datasource 'HikariDataSource (HikariPool-1)'</code>. Đây là tên datasource/pool, không phải chuỗi <code>jdbc:postgresql://host:port/database</code>. Vì vậy dòng này vẫn chưa cho hostname, cổng hoặc tên database của lần Run.</p>}
   </div>}
   <AddressFacts devDb={devDb}/>
   <Next onClick={()=>change({step:3})}>Phân biệt DB local với DB từ xa</Next>
  </>:state.step===3?<>
   {devDb&&<section className="redis-run-config" aria-label="Kiểm tra đích đã được log xác nhận"><h4>Đích thật đã thử: localhost:5432 · L377</h4><p><code>localhost</code> trỏ về môi trường đang chạy Command. Kiểm tra cổng tại chính máy/môi trường đó trước; chưa suy ra Docker chỉ từ địa chỉ loopback.</p><button type="button" className="redis-route-next" aria-expanded={state.portCheckOpen} onClick={()=>change({portCheckOpen:!state.portCheckOpen})}>Xem cách kiểm tra cổng trên máy chạy Command</button>{state.portCheckOpen&&<><p>Hướng dẫn tự kiểm tra trên Windows chạy Command · chưa chạy lệnh ở đây:</p><pre>{"Test-NetConnection localhost -Port 5432\nGet-NetTCPConnection -LocalPort 5432 -State Listen"}</pre><p><code>TcpTestSucceeded: False</code>: chưa tới được cổng ở thời điểm kiểm tra. <code>True</code>: TCP thông; vẫn cần xác thực và kiểm tra DB riêng. Nếu có listener, xác định đúng dịch vụ/process sở hữu cổng; kết quả kiểm tra mới không thay cho log cũ.</p><button type="button" className="redis-route-next" aria-expanded={state.dockerCheckOpen} onClick={()=>change({dockerCheckOpen:!state.dockerCheckOpen})}>Nếu PostgreSQL của bài chạy bằng Docker</button>{state.dockerCheckOpen&&<p>Đối chiếu Docker Desktop trên đúng máy: Engine → service <code>postgres-write</code> trong Compose → container Status / Logs / Ports. Xác nhận cổng host công bố khớp <b>5432</b> mà Command đã thử. Bối cảnh được cung cấp là đã tắt Docker khi thử; tình trạng sau khi bật lại cần kiểm tra riêng rồi Run lại và đọc log mới.</p>}</>}</section>}
   {(!devDb||state.portCheckOpen&&state.dockerCheckOpen)&&<>
   <p className="redis-simulation-label">Giả lập · Command chạy bằng IntelliJ trên Windows. Hai ví dụ giúp chọn nơi kiểm tra; chưa xác nhận topology của phiên thật {devDb?"08/11. Đích trong L377 vẫn là localhost:5432":"07/11"}.</p>
   <fieldset className="redis-route-options"><legend>Chọn đích PostgreSQL · Giả lập</legend><label><input type="radio" name="postgres-mode" checked={local} onChange={()=>{change({mode:"docker"});setNode("windows");}}/>localhost · PostgreSQL do Docker Desktop cung cấp · Giả lập</label><label><input type="radio" name="postgres-mode" checked={!local} onChange={()=>{change({mode:"remote"});setNode("windows");}}/>Hostname PostgreSQL từ xa · Giả lập</label></fieldset>
   {local&&<>
    <SourceExcerpt id="compose" highlights={[77,79,80]} title="Compose trong repo · service postgres-write"/>
    <fieldset className="redis-route-options"><legend>Đổi mapping Docker · Giả lập · host:container</legend>{([5432,15432] as const).map(port=><label key={port}><input type="radio" name="postgres-port" checked={state.hostPort===port} onChange={()=>change({hostPort:port})}/>{port}:5432</label>)}</fieldset>
    <div className="redis-docker-window" aria-label="Docker Desktop PostgreSQL giả lập"><b>Docker Desktop → Containers → postgres-write → Ports · Giả lập</b><p>Compose gốc khai báo 5432:5432. Mapping của ví dụ đang chọn: <b>{state.hostPort}:5432</b>.</p><pre>{`# Giả lập mapping đang chọn\npostgres-write:\n  ports:\n    - "${state.hostPort}:5432"`}</pre></div>
   </>}
   <div className="redis-path-diagram" role="group" aria-label={local?"Command Windows tới PostgreSQL trong Docker":"Command Windows tới PostgreSQL từ xa"}>
    <PathNode selected={node==="command"} onClick={()=>setNode("command")} title="Command" detail="JVM · IntelliJ · Windows"/>
    <span className="redis-path-arrow" aria-hidden="true">→</span><PathNode selected={node==="windows"} onClick={()=>setNode("windows")} title={`${target.host}:${target.port}`} detail={local?"Cổng trên máy Windows":"Hostname và cổng từ xa"}/>
    <span className="redis-path-arrow" aria-hidden="true">→</span>{local?<><PathNode selected={node==="docker"} onClick={()=>setNode("docker")} title={`${state.hostPort}:5432`} detail="Cổng host : cổng container"/><span className="redis-path-arrow" aria-hidden="true">→</span><PathNode selected={node==="db"} onClick={()=>setNode("db")} title="postgres-write" detail="PostgreSQL trong container · 5432"/></>:<PathNode selected={node==="db"} onClick={()=>setNode("db")} title="PostgreSQL từ xa" detail="Dịch vụ trên máy đích"/>}
   </div>
   <p className="redis-node-explanation" aria-live="polite">{node==="command"?"Command chạy trên Windows, nên cần kiểm tra cấu hình và đường mạng từ chính Windows này.":node==="docker"?`Mapping ${state.hostPort}:5432 công bố cổng Windows ${state.hostPort}; số bên phải 5432 là cổng trong container. Command trên Windows dùng cổng ${state.hostPort}.`:node==="db"?(local?"PostgreSQL là dịch vụ trong container postgres-write của ví dụ này. Tên database alpaca-event chọn dữ liệu bên trong dịch vụ; nó không phải tên container.":"Kiểm tra dịch vụ PostgreSQL ở máy đích và đường mạng từ máy chạy Command. Cổng Docker công bố trên máy Windows của mình chưa giải thích được đường kết nối tới hostname từ xa."):(local?"localhost chỉ cho biết app gọi về máy đang chạy nó. Cần xem dịch vụ sở hữu cổng, Compose và Ports Docker để biết dịch vụ phía sau cổng có nằm trong Docker hay không.":"Kiểm tra đúng postgres.lab.example:5432 từ Windows đang chạy Command: DNS trỏ tới đâu, cổng có truy cập được không và môi trường này có cần mạng/VPN tương ứng không.")}</p>
   <p className="postgres-simulated-target"><b>JDBC URL của ví dụ · Giả lập:</b> <code>jdbc:postgresql://{target.host}:{target.port}/{target.database}</code></p>
   {local?<p>Command trên Windows dùng <b>cổng phía Windows {state.hostPort}</b>. Khi mapping đổi thành <code>15432:5432</code>, URL cần <code>localhost:15432</code>; cổng trong container vẫn là 5432. Thay đổi ví dụ không sửa Compose hoặc cấu hình backend thật.</p>:<p><b>Cấu hình cổng Docker trên máy mình không giải thích được đường kết nối này.</b> Đích là hostname từ xa; kiểm tra đúng hostname và cổng từ máy chạy Command, rồi đối chiếu môi trường/máy đích.</p>}
   <section className="redis-run-config" aria-label="Nơi kiểm tra đường PostgreSQL"><h4>Nơi kiểm tra · Giả lập</h4><p>{local?"Xem service postgres-write trong docker-compose-env.yml, đối chiếu Ports Docker Desktop và cổng Windows công bố với JDBC URL của Command.":"Từ Windows chạy Command, kiểm tra phân giải hostname postgres.lab.example và cổng 5432; sau đó xem cấu hình dịch vụ ở máy đích."}</p><code>Test-NetConnection {target.host} -Port {target.port}</code><p>Lệnh trên là gợi ý tự kiểm tra, chưa được chạy ở đây. TCP thông chỉ xác nhận tới được cổng; auth, database, schema và kết quả truy vấn cần bằng chứng riêng.</p></section>
   </>}
   <Next onClick={()=>change({step:4})}>Áp dụng vào phiên thật</Next>
  </>:<>
   <h4>{devDb?"Kết nối localhost:5432 bị từ chối. Bạn kiểm tra gì tiếp theo?":"Hikari đã mở kết nối. Muốn biết DB nằm ở đâu, bạn sẽ xem thêm bằng chứng nào?"}</h4>
   <fieldset className="redis-route-options postgres-answer-options"><legend>Chọn bằng chứng cần bổ sung cho phiên thật</legend>{finalAnswers.map(([id,label])=><label key={id}><input type="radio" name="postgres-answer" checked={state.answer===id} onChange={()=>change({answer:id})}/>{label}</label>)}</fieldset>
   <p role="status">{devDb?(state.answer==="url"?"Đúng. Kiểm tra localhost:5432 từ chính môi trường chạy Command. Nếu DB của bài do Docker cung cấp, đối chiếu Engine, postgres-write, Status / Logs / Ports. Sau xử lý cần Run lại và đọc bằng chứng mới.":state.answer==="label"?"Thông tin Docker đã tắt do người chạy cung cấp riêng. Connection refused tự nó chỉ cho biết cổng bị từ chối; cần kiểm tra đúng cổng và môi trường.":state.answer==="docker"?"Lỗi xảy ra trước xác thực PostgreSQL. Chưa có bằng chứng sai mật khẩu; kiểm tra đường kết nối tới cổng trước.":"L377 đã cho đích; chọn nơi kiểm tra phù hợp với môi trường chạy Command."):(state.answer==="url"?"Đúng. Lấy JDBC URL hiệu lực của đúng lần Run để biết host, port và database; đối chiếu Command chạy trên Windows, container hay máy nào để hiểu localhost và đường mạng. Sau đó mới chọn nơi kiểm tra dịch vụ.":state.answer==="label"?"L187 chỉ nêu HikariDataSource (HikariPool-1), chưa có địa chỉ JDBC. Cần URL hiệu lực và môi trường chạy Command.":state.answer==="docker"?"Cổng Docker cục bộ chỉ giải thích đường local khi đã đối chiếu URL và môi trường của Command. Chưa biết đích thì chưa thể kết luận DB ở Docker trên máy mình.":"L183–184 và L280 xác nhận kết nối/JPA; chọn bằng chứng giúp xác định địa chỉ và hiểu đường kết nối.")}</p>
   <AddressFacts devDb={devDb}/>
   <Next disabled={state.answer!=="url"} onClick={onClose}>Hoàn tất và quay lại câu đang học</Next>
  </>}
  <footer className="redis-route-footer">{state.step>1&&<button type="button" onClick={()=>change({step:state.step-1 as PostgresRouteState["step"]})}><ArrowLeft size={14}/>Quay lại bước trước</button>}<details><summary>Nguồn và giới hạn</summary><p>Log thật: {devDb?"log-2.txt · 08/11 · L114, L182, L377":"log-start-command.txt · 07/11 · L114, L183–184, L187, L280"}. Source: GlobalConfigController, GlobalConfigFunc, ConfigRepository, ConfigAggregate, hai YAML và docker-compose-env.yml. Source framework binding không có trong repo.</p><p>Snapshot source: {postgresRouteSource.checkedAt}; từng trích đoạn giữ số dòng và SHA-256. Đã che credential và host ngoài loopback. {devDb?"Host/port đã thử được xác nhận là localhost:5432; đầy đủ JDBC URL, tên database và nguồn override cuối cùng chưa được xác nhận.":"Môi trường Run, JDBC URL hiệu lực và thao tác nghiệp vụ của phiên thật chưa được xác nhận từ các mốc log này."}</p></details></footer>
 </section>;
}

function Next({children,onClick,disabled=false}:{children:React.ReactNode;onClick:()=>void;disabled?:boolean}){
 return <button type="button" className="redis-route-next" disabled={disabled} onClick={onClick}>{children}<ArrowRight size={15}/></button>;
}
function PathNode({selected,onClick,title,detail}:{selected:boolean;onClick:()=>void;title:string;detail:string}){
 return <button type="button" className="redis-path-node" aria-pressed={selected} onClick={onClick}><b>{title}</b><small>{detail}</small></button>;
}
function SourceExcerpt({id,from,to,highlights=[],title}:{id:RefId;from?:number;to?:number;highlights?:number[];title:string}){
 const ref=postgresRouteSource.refs[id],rows=ref.rows.filter(row=>row.line>=(from??ref.from)&&row.line<=(to??ref.to));
 return <figure className="redis-source" aria-label={title}><figcaption><b>{title}</b><code>{ref.path}:{rows[0]?.line}</code></figcaption><pre>{rows.map(row=><span key={row.line} data-source-line={row.line} data-source-highlight={highlights.includes(row.line)||undefined}><small>{row.line}</small><code>{row.text||" "}</code></span>)}</pre><details><summary>Đối chiếu file nguồn</summary><p>SHA-256 {ref.sha256}. Giữ số dòng gốc; thông tin nhạy cảm được che trong snapshot.</p></details></figure>;
}
function AddressFacts({devDb=false}:{devDb?:boolean}){
 if(devDb)return <table className="redis-address-facts" aria-label="YAML, lần Run và phần chưa xác nhận"><caption>Ba mức bằng chứng · phiên thật 08/11</caption><thead><tr><th>Mức</th><th>Biết được tới đâu?</th></tr></thead><tbody><tr><th>Giá trị trong YAML</th><td><code>spring.datasource.url</code> trong application-dev.yml: <code>{'jdbc:postgresql://${DOCKER_HOST_IP:localhost}/alpaca-event'}</code>. Đây là giá trị file, chưa chứng minh nguồn URL cuối cùng.</td></tr><tr><th>Đích lần Run đã thử</th><td><b>localhost:5432 · L377</b>. L114 xác nhận dev active; L182 chỉ báo bắt đầu pool. Kết nối bị từ chối trước xác thực.</td></tr><tr><th>Phần chưa xác nhận</th><td>Đầy đủ JDBC URL, tên database và nguồn override cuối cùng. Kiểm tra SPRING_DATASOURCE_URL, DOCKER_HOST_IP, Program arguments, VM options và file cấu hình ngoài của đúng lần Run. Đích khớp fallback localhost chưa chứng minh không có ghi đè.</td></tr></tbody></table>;
 return <table className="redis-address-facts" aria-label="YAML, lần Run và phần chưa xác nhận"><caption>Ba mức bằng chứng · phiên thật 07/11</caption><thead><tr><th>Mức</th><th>Biết được tới đâu?</th></tr></thead><tbody><tr><th>Giá trị trong YAML</th><td>application.yml: <code>jdbc:postgresql://[host đã che]/rnd</code>. application-dev.yml: <code>{'jdbc:postgresql://${DOCKER_HOST_IP:localhost}/alpaca-event'}</code>. Đây là snapshot file, chưa phải cấu hình hiệu lực.</td></tr><tr><th>Giá trị lần Run thực sự dùng</th><td><b>Chưa biết địa chỉ hiệu lực.</b> L114 xác nhận default; L183–184 xác nhận Hikari mở kết nối; L280 xác nhận JPA khởi tạo. L187 chỉ nêu datasource, không cung cấp URL có địa chỉ.</td></tr><tr><th>Phần chưa xác nhận</th><td>Host, port, tên database thực sự; nguồn override cuối cùng và môi trường chạy Command. Cần đối chiếu JDBC URL hiệu lực của đúng lần Run với profile, biến môi trường, tham số và file cấu hình ngoài. Các ví dụ Giả lập không điền vào phần còn thiếu này.</td></tr></tbody></table>;
}
function RunConfiguration({devDb=false}:{devDb?:boolean}){
 return <section className="redis-run-config" aria-label="Cấu hình lần Run PostgreSQL"><h4>Run → Edit Configurations → AgentCommandServiceApplication</h4><p>Vị trí kiểm tra trong IntelliJ; chưa có bản cấu hình đầy đủ của lần Run {devDb?"08/11":"07/11"}.</p><dl><dt>Active profiles</dt><dd>Đối chiếu profile tại đây với log L114: phiên thật dùng {devDb?"dev":"default"}.</dd><dt>Environment variables</dt><dd><code>SPRING_DATASOURCE_URL</code>, <code>DOCKER_HOST_IP</code>, <code>SPRING_PROFILES_ACTIVE</code>, <code>SPRING_APPLICATION_JSON</code>. Giá trị thật chưa xác nhận.</dd><dt>Program arguments</dt><dd><code>--spring.datasource.url=…</code>, <code>--spring.profiles.active=…</code>, <code>--spring.config.location=…</code></dd><dt>VM options</dt><dd><code>-Dspring.datasource.url=…</code>, <code>-Dspring.profiles.active=…</code></dd><dt>Working directory / file ngoài</dt><dd>Kiểm tra <code>spring.config.location</code>, <code>spring.config.additional-location</code>, <code>spring.config.import</code> và file ngoài được nạp.</dd></dl><p>Ghi nhận JDBC URL hiệu lực từ datasource của đúng process/lần Run, che credential trước khi chia sẻ. Tên Run Configuration và giá trị YAML riêng lẻ chưa xác nhận URL cuối cùng.</p></section>;
}
