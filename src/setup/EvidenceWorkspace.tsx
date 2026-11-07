import { lazy, Suspense, useEffect, useState } from "react";
import { Group, Panel, Separator } from "react-resizable-panels";
import { ArrowLeft, FileCode2, Info } from "lucide-react";
import { SourceTree } from "../JourneyWorkspace";
import { evidence, evidenceById, fileById, setupFiles } from "../content/setup";
import { useCodeWrap } from "../workshop/code-preferences";
import type { CodeRow } from "../workshop/source";
import { OriginBadge, SourceButton } from "./components";
import type { OpenResource } from "./components";

const CodeBlock = lazy(() => import("../workshop/CodeBlock").then(m => ({ default: m.CodeBlock })));
const tree = [
  ...setupFiles.map(f => ({ id: `file:${f.id}`, path: `Source Java/${f.path}` })),
  ...evidence.map(e => ({ id: e.id, path: `${e.basis === "gap" ? "Khoảng trống" : "Bằng chứng"}/${e.id} — ${e.title}.md` })),
];
function loadLayout() {
  try { const value = JSON.parse(localStorage.getItem("backend-learning-workshop.setup-panels.v1") ?? "null"); if (value && Number.isFinite(value.source) && Number.isFinite(value.inspector) && value.source >= 35 && value.inspector >= 25 && Math.abs(value.source + value.inspector - 100) < .1) return value; } catch { /* Session defaults. */ }
  return { source: 62, inspector: 38 };
}
export function EvidenceWorkspace({ resource, context, line, open, goBack, memoryKey }: {
  resource: string; context: string; line?: number; open: OpenResource; goBack: () => void; memoryKey: string;
}) {
  const file = resource.startsWith("file:") ? fileById.get(resource.slice(5)) : undefined;
  const selectedLine = line ?? file?.excerpts[0]?.start;
  const excerptEvidence = file?.excerpts.find(part => selectedLine !== undefined && selectedLine >= part.start && selectedLine < part.start + part.lines.length)?.evidenceId;
  const item = evidenceById.get(excerptEvidence ?? file?.evidenceId ?? resource);
  const [wrap, setWrap] = useCodeWrap();
  const [small, setSmall] = useState(() => window.matchMedia("(max-width: 1250px)").matches);
  const [layout] = useState(loadLayout);
  const [layoutWarning, setLayoutWarning] = useState("");
  useEffect(() => { const media = window.matchMedia("(max-width: 1250px)"); const handler = () => setSmall(media.matches); media.addEventListener("change", handler); return () => media.removeEventListener("change", handler); }, []);
  if (!item) return <div className="notice">Nguồn chưa có dữ liệu. <button onClick={goBack}>Về bước đang học</button></div>;
  const rows: CodeRow[] = file?.excerpts.flatMap((part, i) => [
    ...(i ? [{ text: "⋯ (đoạn không trích)", kind: "hunk" as const }] : []),
    ...part.lines.map((text, offset) => ({ text, line: part.start + offset })),
  ]) ?? [];
  const start = line ?? file?.excerpts[0].start ?? 1;
  const range = { name: file?.symbol ?? file?.role ?? item.title, qualified: file?.id ?? item.id, start, end: start };
  return <section className="source-workspace setup-evidence" aria-label="File và bằng chứng setup">
    <div className="source-browser"><div className="source-browser-heading"><FileCode2 size={17} /><strong>Source & bằng chứng</strong><span>Đoạn đã biên tập, chỉ đọc</span></div>
      <SourceTree files={tree} selected={resource} onSelect={open} label="Cây file và bằng chứng setup" />
    </div>
    <div className="source-navigation"><span>{file?.path ?? item.title}</span><button className="text-button" onClick={goBack}><ArrowLeft size={15} />Quay lại ngữ cảnh</button></div>
    <div className="source-toolbar"><OriginBadge basis={item.basis} /><span>04/11/2026 · {file ? "Source đã đối chiếu" : item.presentation === "report-summary" ? "Tóm tắt theo báo cáo" : "Nguồn đã ghi nhận"}</span>
      {file && <label className="check-row"><input type="checkbox" checked={wrap} onChange={e => setWrap(e.target.checked)} />Xuống dòng</label>}
    </div>
    <Group style={{ height: small ? 900 : 510 }} orientation={small ? "vertical" : "horizontal"} defaultLayout={layout} className={`source-panels ${small ? "stacked" : ""}`}
      onLayoutChanged={(next, meta) => { if (meta.isUserInteraction && !small) try { localStorage.setItem("backend-learning-workshop.setup-panels.v1", JSON.stringify(next)); } catch { setLayoutWarning("Độ rộng panel chỉ được giữ trong phiên này."); } }}>
      <Panel id="source" minSize="35%" className="source-code-panel">
        {file ? <Suspense fallback={<p>Đang mở đoạn source…</p>}><CodeBlock key={`${memoryKey}:${resource}:${line ?? "default"}`} path={file.path} rows={rows} range={range} memoryKey={`${memoryKey}:${resource}`} targetKey={`${resource}:${line ?? "default"}`} /></Suspense>
          : <article className="setup-evidence-text" tabIndex={0} key={`${memoryKey}:${resource}`}><h3>{item.presentation === "report-summary" ? "Tóm tắt theo báo cáo" : item.title}</h3><p>{item.text}</p></article>}
      </Panel>
      <Separator className="resize-handle" aria-label="Điều chỉnh kích thước bằng chứng và inspector"><span>⋮</span></Separator>
      <Panel id="inspector" minSize="25%" className="inspector-panel"><div className="inspector-heading"><Info size={16} /><strong>Inspector</strong></div>
        <div className="inspector-body"><span className="symbol-label">{context}</span><p>Ngữ cảnh đang học được giữ khi mở tham chiếu.</p><div><h4>Nguồn và phạm vi</h4><p>{item.locator}</p><OriginBadge basis={item.basis} /><p>Nhãn gốc: {item.originalTags.length ? item.originalTags.map(t => `[${t}]`).join(" ") : "Đối chiếu mới khi thiết kế; không phải [F] cũ của báo cáo"}</p><p>{item.eventTime}</p></div>
          {file && <div><h4>{file.symbol ?? "Vai trò file"}</h4><p>{file.role}</p><p>Đoạn trích giữ số dòng gốc; nội dung nhạy cảm đã che, dấu ⋯ chỉ đoạn lược bỏ. Chưa có cặp snapshot để xem Diff.</p></div>}
          {file && <div><h4>Nhận định được hỗ trợ</h4><p>{item.text}</p></div>}
          <div><h4>Kết luận và giới hạn</h4><p>{item.limits}</p><p>Không phải kết quả Java/Docker được kiểm tra live từ giao diện.</p></div>
          <div className="inspector-relations"><h4>Quan hệ & tham chiếu</h4>{file && <SourceButton id={item.id} label="Đọc bằng chứng của file" open={open} />}{!file && item.fileId && <SourceButton id={`file:${item.fileId}`} label="Mở đoạn source liên quan" open={open} />}{item.relatedIds.filter(id => id !== resource).map(id => <SourceButton key={id} id={id} label={id.startsWith("file:") ? fileById.get(id.slice(5))?.path ?? id : evidenceById.get(id)?.title ?? id} open={open} />)}</div>
        </div>
      </Panel>
    </Group>
    {layoutWarning && <p role="status">{layoutWarning}</p>}
  </section>;
}
