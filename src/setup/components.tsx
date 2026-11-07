import { useId, useState } from "react";
import { Copy, FileCode2, Info, Link2, ShieldCheck } from "lucide-react";
import { apps } from "../content/setup/runbooks";
import { gapById } from "../content/setup";
import { basisLabels } from "../content/setup/model";
import type { Basis, Command, SetupStep, Statement } from "../content/setup/model";

export type OpenResource = (id: string) => void;
export function OriginBadge({ basis }: { basis: Basis }) {
  return <span className={`setup-origin ${basis}`}><Info size={12} aria-hidden />{basisLabels[basis]}</span>;
}
export function SourceButton({ id, label, open }: { id: string; label: string; open: OpenResource }) {
  const domId = useId();
  return <button id={`setup-source-${domId}`} className="text-button setup-source-link" onClick={() => open(id)}><Link2 size={14} />{label}</button>;
}
export function FactCard({ title, fact, open }: { title: string; fact: Statement; open: OpenResource }) {
  return <section className="card setup-fact"><h3>{title}</h3><p>{fact.text}</p><div className="setup-fact-source"><OriginBadge basis={fact.basis} />{fact.evidenceIds.map(id => <SourceButton key={id} id={id} label={`Nguồn ${id.replace("E-", "")}`} open={open} />)}</div></section>;
}
export function CommandCard({ command }: { command: Command }) {
  const [notice, setNotice] = useState("");
  async function copy() {
    try { await navigator.clipboard.writeText(command.text); setNotice("Đã sao chép lệnh. UI không thực thi lệnh."); }
    catch { setNotice("Chưa sao chép được. Bạn có thể chọn và sao chép phần lệnh bên dưới."); }
  }
  return <section className="command-card setup-command" data-command-role={command.role}>
    <div><strong>{command.role === "historical" ? command.execution === "recorded" ? "Lệnh lịch sử được báo cáo đã thực thi" : "Lệnh ghi/khuyến nghị trong lịch sử · exact invocation chưa rõ" : "Hướng dẫn · chưa chạy lại"}</strong><button className="text-button" onClick={copy} aria-label={`Sao chép lệnh ${command.id}`}><Copy size={14} />Sao chép</button></div>
    <p><b>{command.shell}</b> · Thư mục: <code>{command.cwd}</code></p>
    <p className="setup-condition"><b>Điều kiện/ngữ cảnh:</b> {command.condition}</p>
    <pre>{command.text}</pre><p className="caption"><b>Tác dụng:</b> {command.effect}</p>
    {notice && <p role="status">{notice}</p>}
  </section>;
}
export function GapCards({ ids, open }: { ids: string[]; open: OpenResource }) {
  if (!ids.length) return null;
  return <section className="setup-gaps" aria-label="Các mục chờ xác nhận"><h3>Chờ xác nhận</h3><p className="caption">Khoảng trống chưa phải một kiểm thử đã thất bại. Không tự điền cấu hình hoặc payload.</p>
    {ids.map(id => { const gap = gapById.get(id); return gap && <article className="setup-gap" key={id}>
      <h4>{gap.title}</h4><p><b>Thiếu:</b> {gap.missing}</p><p><b>Ảnh hưởng:</b> {gap.affects.join(" · ")}</p>
      <details><summary>Cần kiểm tra thế nào?</summary><p>{gap.check}</p><p><b>Người phù hợp:</b> {gap.owner}</p><SourceButton id={`E-${id}`} label="Mở nguồn khoảng trống" open={open} /></details>
    </article>; })}
  </section>;
}
export function Snapshot() {
  return <div className="notice setup-snapshot"><Info size={18} /><span><b>Snapshot theo S18, lúc lập báo cáo 04/11/2026 (Asia/Bangkok):</b> Docker daemon và Java services đã dừng; artifact/volume còn. Không có giờ chính xác. Runtime chưa được kiểm tra lại trong lượt triển khai UI; đây không phải trạng thái live.</span></div>;
}
export function VerificationMatrix({ open, compact = false }: { open: OpenResource; compact?: boolean }) {
  return <section className="card setup-verification" aria-label="Bốn mức kiểm chứng kỹ thuật">
    <div className="section-heading"><h3><ShieldCheck size={19} />Bằng chứng đã tới đâu?</h3><span className="caption">Theo báo cáo 04/11/2026</span></div>
    <div className="setup-levels">
      <button onClick={() => open("E-S10")}><b>Build / package</b><strong>5 module từng thành công</strong><small>Lịch sử S10 · JAR đối chiếu khi thiết kế</small></button>
      <button onClick={() => open("E-S11")}><b>Process / port</b><strong>5 app từng boot/bind</strong><small>Lịch sử S11 · sau đó process dừng</small></button>
      <button onClick={() => open("E-G-HTTP")}><b>HTTP API</b><strong>Chưa có bằng chứng</strong><small>Chưa có request/response được xác nhận</small></button>
      <button onClick={() => open("E-G-BUSINESS")}><b>Nghiệp vụ end-to-end</b><strong>Chưa có bằng chứng</strong><small>Chưa kiểm thử toàn luồng dữ liệu</small></button>
    </div>
    {!compact && <div className="table-scroll"><table><caption>Phạm vi app/profile trong smoke test lịch sử; không là dashboard live.</caption><thead><tr><th>App / profile / port</th><th>Build</th><th>Process/port</th><th>HTTP API</th><th>Nghiệp vụ</th></tr></thead><tbody>
      <tr><th>Root aggregate</th><td><button className="setup-cell fail" onClick={() => open("E-S09")}>Thất bại lịch sử S09</button></td><td colSpan={3}>Không áp dụng</td></tr>
      {apps.map(app => <tr key={app.name}><th>{app.name}<small>{app.profile} · :{app.port}</small></th><td><button className="setup-cell" onClick={() => open("E-S10")}>Thành công theo báo cáo</button></td><td><button className="setup-cell" onClick={() => open("E-S11")}>Từng bind :{app.port}</button></td><td><button className="setup-cell unknown" onClick={() => open("E-G-HTTP")}>Chưa có bằng chứng</button></td><td><button className="setup-cell unknown" onClick={() => open("E-G-BUSINESS")}>Chưa có bằng chứng</button></td></tr>)}
    </tbody></table></div>}
    <p className="caption">JAR không chứng minh process đang chạy. Port không chứng minh HTTP/API đúng. HTTP 401/403 chưa chứng minh quyền nghiệp vụ. Tiến độ bạn tự đánh dấu không thay đổi bảng này.</p>
  </section>;
}
export function ProfileTable({ open }: { open: OpenResource }) {
  return <section className="card"><h3>Cấu hình nào sẽ được dùng?</h3><p>Đối chiếu source khi thiết kế ngày 04/11/2026. Cấu hình hiệu lực còn phụ thuộc environment, arguments và file ngoài. Chưa được chạy lại.</p><div className="table-scroll"><table><thead><tr><th>App</th><th>Đã đọc từ cấu hình</th></tr></thead><tbody>{apps.map(app => <tr key={app.name}><th>{app.name}<small>:{app.port}</small></th><td>{app.config}</td></tr>)}</tbody></table></div><SourceButton id="E-profiles" label="Mở bằng chứng profile và datasource" open={open} /></section>;
}
export function StepVisual({ step, open }: { step: SetupStep; open: OpenResource }) {
  if (step.renderer === "tree") return <section className="card"><h3>Thư mục thay đổi thế nào?</h3><div className="setup-compare"><div><OriginBadge basis="history" /><h4>Trước clone repo con</h4><ul><li>Repo cha + wrapper</li><li>workspaces: chưa có đủ repo con</li></ul></div><div><OriginBadge basis="source" /><h4>Sau — khảo sát thiết kế 04/11/2026</h4><ul><li>workspaces/1-shared</li><li>workspaces/2-infrastructure: 7 repo con</li><li>workspaces/agent-service</li><li>workspaces/agent-integration-service</li><li>swagger-service: còn thiếu</li></ul></div></div><p className="caption">Cây rút gọn theo bằng chứng; không phải Git diff hoặc danh sách file đầy đủ lúc trước.</p><SourceButton id="E-workspace" label="Xem nguồn cây workspace" open={open} /></section>;
  if (step.renderer === "versions") return <section className="card"><h3>Phiên bản và cấu hình trước / sau</h3><div className="setup-compare"><div><OriginBadge basis="history" /><h4>Trước — theo báo cáo</h4><p>Java 17.0.18 ban đầu.</p><p>IDE lúc chẩn đoán: SDK/Gradle JVM 21, language/bytecode 17.</p></div><div><OriginBadge basis={step.id === "S04" ? "history" : "source"} /><h4>Sau — nguồn có phạm vi riêng</h4><p>Gradle từng xác nhận JVM Temurin 21.0.13 (S04).</p><p>File .idea là 21/21 khi thiết kế. Không rõ ai thay đổi; chưa xác nhận IDE đã hết đỏ.</p></div></div><SourceButton id="E-toolchain" label="Yêu cầu Java và wrapper" open={open} /><SourceButton id="E-ide" label="Bằng chứng cấu hình IDE" open={open} /></section>;
  if (step.renderer === "build") return <section className="card"><h3>Task parent và module ứng dụng</h3><div className="setup-build-failure"><b>Root clean assemble → :workspaces:bootJar</b><p>Tóm tắt theo báo cáo S09: không tìm main class ở virtual parent. Root build chưa có bằng chứng được sửa.</p></div><div className="table-scroll"><table><thead><tr><th>Module app</th><th>Build theo báo cáo S10</th><th>Artifact đối chiếu khi thiết kế</th></tr></thead><tbody>{apps.map(app => <tr key={app.name}><th>{app.name}<small>{app.task}</small></th><td>Thành công</td><td>JAR còn; không phải compile mới</td></tr>)}</tbody></table></div><SourceButton id="E-artifacts" label="Metadata JAR có thời điểm" open={open} /><SourceButton id="file:java-root-build" label="Đọc cấu hình subprojects" open={open} /></section>;
  if (step.renderer === "docker") return <section className="card"><h3>Từ blocker Docker đến lựa chọn xử lý</h3><div className="setup-compare"><div><h4>Vấn đề lịch sử</h4><p>CLI có, daemon ban đầu tắt. Sau khi Engine chạy, full Compose conflict /rebrow; redis/rabbitmq/rebrow/debezium của project khác đã có.</p></div><div><h4>Lựa chọn và kết quả theo báo cáo</h4><p>Agent chạy infra chọn lọc, tái dùng dependency có sẵn và tạo agent-system-debezium riêng; không xóa/dừng project khác.</p></div></div><div className="table-scroll"><table><thead><tr><th>Thành phần</th><th>Host port / ý nghĩa</th><th>Nguồn</th></tr></thead><tbody><tr><th>PostgreSQL write / read</th><td>5432 / 5433 · replication chưa xác minh</td><td>File Compose</td></tr><tr><th>Kafka / Zookeeper / Kafka UI</th><td>9092 / 2181 / 8080</td><td>File Compose</td></tr><tr><th>Debezium trong Compose</th><td>8086 → 8083</td><td>Source đối chiếu</td></tr><tr><th>Debezium riêng lịch sử</th><td>18086 → 8083; connector/task từng RUNNING</td><td>S08 theo báo cáo</td></tr></tbody></table></div><p className="caption">Tên container cố định khác port. File connector tìm thấy không tự là payload lịch sử. Chưa có runtime mới.</p><SourceButton id="E-compose" label="Bằng chứng Compose và mapping" open={open} /><SourceButton id="E-connector" label="Giới hạn cấu hình Debezium" open={open} /></section>;
  if (step.renderer === "runtime") return <><VerificationMatrix open={open} /><Snapshot /></>;
  return null;
}
export function Glossary() {
  return <details className="card setup-glossary"><summary>Giải thích nhanh cho người quen FE</summary><dl>
    <dt>Gradle Wrapper</dt><dd>Script của repo chọn đúng Gradle distribution, gần với dùng phiên bản package manager của project.</dd>
    <dt>Toolchain</dt><dd>Chọn JDK để compile. Phân biệt với JVM chạy Gradle và JDK/language level trong IDE.</dd>
    <dt>Profile</dt><dd>Lớp cấu hình theo môi trường; đổi profile có thể đổi DB, schema, broker và auth.</dd>
    <dt>Container / Engine</dt><dd>Container chạy dịch vụ trong môi trường Docker; CLI cần Engine hoạt động mới điều khiển được container.</dd>
    <dt>Port / smoke test</dt><dd>Port lắng nghe chỉ chứng minh process bind được cổng. Smoke test ở lịch sử này dừng tại boot/port, chưa có HTTP hoặc business E2E.</dd>
  </dl><span className="caption"><FileCode2 size={13} /> Các so sánh FE giúp học, không thay thế mô tả kỹ thuật của source.</span></details>;
}
export function ConceptNote({ id }: { id: string }) {
  const text = ["S04", "S12", "R-F3", "R-X0", "R-X2"].includes(id)
    ? "Toolchain chọn JDK để compile; JVM chạy Gradle và SDK/language level của IDE là những lựa chọn riêng cần đối chiếu. Wrapper là script chọn Gradle của repo."
    : ["S05", "S06", "S07", "S08", "R-F4", "R-D1", "R-D2", "R-X1"].includes(id)
      ? "Docker CLI là lệnh điều khiển; Engine mới là runtime chạy container. Host port là cổng trên máy bạn, khác cổng bên trong container; tên container cố định cũng có thể bị conflict."
      : ["S17", "R-D3", "R-D4", "R-F6"].includes(id)
        ? "Profile là lớp cấu hình môi trường, có thể đổi DB, schema, broker và auth. dev không tự đồng nghĩa mọi dependency đều local."
        : ["S11", "S18", "R-D5", "R-X4"].includes(id)
          ? "Smoke test lịch sử chỉ xác nhận process boot/bind port. Port lắng nghe chưa chứng minh HTTP API hoặc nghiệp vụ end-to-end hoạt động."
          : ["S00", "S02", "S03", "R-F2"].includes(id)
            ? "Repo cha giống workspace shell ở FE: có cấu hình và wrapper nhưng code các package/module còn phải được lấy về từ repo con."
            : ["S09", "S10", "R-B0", "R-B1", "R-B2"].includes(id)
              ? "assemble tạo package, bootJar đóng gói ứng dụng Spring Boot. Task ở parent workspace khác task ở module app; package thành công không mặc định đồng nghĩa test hoặc runtime đã đạt."
              : null;
  return text ? <p className="notice setup-concept"><Info size={17} /><span>{text}</span></p> : null;
}
