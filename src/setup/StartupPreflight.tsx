import report from "../content/setup/command-preflight-source.json" with {type:"json"};

export function StartupPreflight(){
 return <details className="startup-preflight"><summary>Lượt kiểm chứng mới: dừng trước Run vì có đường ghi dữ liệu</summary>
  <p>Không khởi chạy Java mới: Hibernate có <code>ddl-auto: update</code>/<code>create_namespaces</code>; <code>InitConfig.@PostConstruct</code> có thể tạo owner, lưu global config/event và lấy khóa Redis. Chưa có phạm vi dữ liệu cô lập để bảo đảm các tác động này.</p>
  <p>Kiểm tra lúc <time>{report.checkedAt}</time>: {report.processCheck.commandProcesses.length} process Command được nhận diện, {report.processCheck.listeners.length} listener 9901. Chỉ thấy Gradle daemon; không dừng process có sẵn. Không có startup log mới; console bài học dùng log lịch sử đã tách riêng.</p>
  <details><summary>Cấu hình đã đối chiếu và phương án chưa thực hiện</summary>
   <p>IDE hiện có main class <code>{report.ide.mainClass}</code>, module Command, SDK {report.ide.sdk}, Before launch Make. {report.ide.profileConclusion}</p>
   <p>Phương án Terminal tại <code>{report.candidate.directory}</code>, JDK 21, chỉ định dev rõ ràng — <b>chưa thực hiện</b>:</p><pre>{report.candidate.command}</pre><p>{report.candidate.differences}</p><p>{report.candidate.limits}</p>
   <ul>{report.candidate.dependencies.map(item=><li key={item.key}><code>{item.key}</code> → {item.destination} · {item.source}:{item.line}</li>)}</ul>
   <p>Quét source các project dependency không thấy annotation scheduler đang bật; chưa quan sát job lịch chạy, không suy từ class scheduler có trên classpath. {report.triggerLimit}</p>
   <ul>{report.risks.map(risk=><li key={risk.id}>{risk.summary}</li>)}</ul>
  </details>
 </details>;
}
