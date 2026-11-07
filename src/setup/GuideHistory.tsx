import { fileById, stepById } from "../content/setup";
import type { ActionGuideStep } from "../content/setup/action-guide";
import { OriginBadge, SourceButton } from "./components";
import type { OpenResource } from "./components";

export function GuideHistory({ step, selectedHistory, open }: { step: ActionGuideStep; selectedHistory: string | null; open: OpenResource }) {
  const historyIds = selectedHistory && stepById.has(selectedHistory) ? [...new Set([selectedHistory, ...step.historyIds])] : step.historyIds;
  return <div className="guide-history-content">
    <p>Những tình huống dưới đây giúp bạn hiểu vì sao có hướng dẫn này. Bạn không cần lặp lại các lần thử sai.</p>
    <details className="guide-audit"><summary>Source nào đã được đối chiếu lại?</summary><p>Lượt thiết kế lại ngày 04/11/2026 đã đọc root build/settings/wrapper, cấu hình Command/Flow/Query và các tên/cổng Compose. Toolchain vẫn là Java 21, wrapper 8.14.3; Command dev dùng datasource local, Flow/Query có DB/schema khác nhau theo profile.</p><p>Không chạy Gradle/Java/Docker/DB hoặc kiểm tra API mới. Những đoạn source trong inspector giữ ngày và phạm vi khảo sát riêng của chúng.</p></details>
    {historyIds.map(id => { const record = stepById.get(id); if (!record) return null; return <details className="guide-case" key={id} open={selectedHistory === id}><summary>{record.title}</summary><small>Tham chiếu nội bộ {id}{record.stage === null ? " · khảo sát tiếp theo, ngoài setup" : ""}</small><h4>Đã vướng gì?</h4><p>{record.problem.text}</p><h4>Đã xử lý ra sao?</h4><ul>{record.actions.map((action, index) => <li key={index}><b>{action.actor}:</b> {action.text}</li>)}</ul><h4>Vì sao và kết quả</h4><p>{record.decision.text}</p><OriginBadge basis={record.decision.basis} /><p>{record.result.text}</p><OriginBadge basis={record.result.basis} />{record.commandNote && <p className="caption">{record.commandNote}</p>}<SourceButton id={`E-${id}`} label="Mở bằng chứng báo cáo và giới hạn" open={open} /></details>; })}
    <section className="guide-history-files"><h3>File/config liên quan</h3>{step.fileIds.map(id => <SourceButton key={id} id={`file:${id}`} label={fileById.get(id)?.path ?? id} open={open} />)}{step.evidenceIds.map(id => <SourceButton key={id} id={id} label="Mở căn cứ đối chiếu" open={open} />)}</section>
    <p className="guide-history-footnote">Lịch sử lấy từ báo cáo 04/11/2026; [F] là kiểm tra ở lúc lập báo cáo. Docker/Java dừng tại thời điểm đó không phải trạng thái hiện tại. Thiếu raw output thì chỉ có tóm tắt theo báo cáo; source không có hai snapshot thì không tạo Diff.</p>
  </div>;
}
