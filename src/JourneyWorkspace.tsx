import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Circle,
  CircleDashed,
  Copy,
  FileCode2,
  Folder,
  FolderOpen,
  GitBranch,
  Info,
  Link2,
  ListChecks,
  Play,
  ShieldCheck,
  SquareTerminal,
} from "lucide-react";
import { Group, Panel, Separator } from "react-resizable-panels";
import type { Layout } from "react-resizable-panels";
import type {
  Journey,
  LearningStep,
  Side,
  SourceFile,
  View,
} from "./content/model";
import type { DemoPolicy, LearningProgress } from "./state";
import { Badge } from "./components/Badge";
import { PolicyPreview } from "./components/PolicyPreview";
import { diffRows, sourceRows } from "./workshop/source";
import { useCodeWrap } from "./workshop/code-preferences";

const CodeBlock = lazy(() =>
  import("./workshop/CodeBlock").then((module) => ({
    default: module.CodeBlock,
  })),
);

type Update = (values: Record<string, string | null>) => void;
export function JourneyWorkspace({
  journey,
  progress,
  demo,
  copyLink,
}: {
  journey: Journey;
  progress: LearningProgress;
  demo: DemoPolicy;
  copyLink: () => void;
}) {
  const location = useLocation();
  const navigate = useNavigate();
  const params = new URLSearchParams(location.search);
  const requestedStep = params.get("step");
  const step =
    journey.steps.find((s) => s.id === requestedStep) ?? journey.steps[0];
  const index = journey.steps.indexOf(step);
  const view: View = ["source", "practice"].includes(params.get("view") ?? "")
    ? (params.get("view") as View)
    : "result";
  const file =
    journey.files.find((f) => f.id === params.get("file")) ??
    journey.files.find((f) => f.id === step.file)!;
  const side: Side = ["before", "diff"].includes(params.get("side") ?? "")
    ? (params.get("side") as Side)
    : "after";
  const key = `${journey.id}:${step.id}`;
  const complete = progress.completed.includes(key);
  const count = journey.steps.filter((s) =>
    progress.completed.includes(`${journey.id}:${s.id}`),
  ).length;
  const [copyNotice, setCopyNotice] = useState("");
  const invalidLink = Boolean(
    (requestedStep && !journey.steps.some((s) => s.id === requestedStep)) ||
      (params.get("file") &&
        !journey.files.some((f) => f.id === params.get("file"))),
  );
  function update(values: Record<string, string | null>) {
    const next = new URLSearchParams(location.search);
    for (const [key, value] of Object.entries(values))
      value === null ? next.delete(key) : next.set(key, value);
    navigate({ pathname: location.pathname, search: next.toString() });
  }
  function chooseStep(next: LearningStep) {
    update({ step: next.id, file: next.file, return: null });
  }
  function reference(target: string) {
    update({ file: target, return: location.pathname + location.search });
  }
  async function copyCommand(command: string) {
    try {
      await navigator.clipboard.writeText(command);
      setCopyNotice("Đã sao chép lệnh minh họa.");
    } catch {
      setCopyNotice(
        "Chưa sao chép được. Hãy chọn và sao chép phần lệnh bên dưới.",
      );
    }
  }
  return (
    <>
      <div className="page-kicker">
        <Link to="/" className="back-link">
          <ArrowLeft size={14} />
          Tổng quan hành trình
        </Link>
        <button className="button small secondary" onClick={copyLink}>
          <Link2 size={14} />
          Sao chép liên kết
        </button>
      </div>
      <div className="journey-page-heading">
        <div>
          <span className="eyebrow">HÀNH TRÌNH {journey.number} / 03</span>
          <h1 className="page-title">{journey.title}</h1>
          <p className="page-description">
            {journey.subtitle} · {journey.duration}
          </p>
        </div>
        <Badge state={journey.state}>
          {journey.id === "claims"
            ? "Khung minh họa · chờ yêu cầu thật"
            : "Nội dung minh họa"}
        </Badge>
      </div>
      <div className="notice slim">
        <Info size={16} />
        <span>
          {journey.id === "environment"
            ? "Chưa có dữ liệu môi trường hay thay đổi agent từ repo Java. Các bước dưới đây chỉ minh họa cách học."
            : journey.id === "policy"
              ? "Kịch bản và mã giả phục vụ duyệt giao diện. Chưa xác minh nghiệp vụ, endpoint hoặc cấu trúc Policy của repo Java."
              : "Chưa có yêu cầu thật. Các bước này minh họa trải nghiệm học, chưa phải kế hoạch triển khai nghiệp vụ."}
        </span>
      </div>
      {invalidLink && (
        <p className="notice">
          Liên kết có bước hoặc file chưa có dữ liệu. Đang hiển thị lựa chọn phù
          hợp trong hành trình này.
        </p>
      )}
      <div className="journey-workspace">
        <aside className="step-sidebar" aria-label="Các bước học">
          <div className="step-sidebar-head">
            <span>CÁC BƯỚC HỌC</span>
            <small>
              {count}/{journey.steps.length}
            </small>
          </div>
          <ol>
            {journey.steps.map((s, i) => (
              <li key={s.id}>
                <button
                  className={s.id === step.id ? "selected" : ""}
                  aria-current={s.id === step.id ? "step" : undefined}
                  onClick={() => chooseStep(s)}
                >
                  <span
                    className={`step-index ${progress.completed.includes(`${journey.id}:${s.id}`) ? "done" : ""}`}
                  >
                    {progress.completed.includes(`${journey.id}:${s.id}`) ? (
                      <Check size={13} />
                    ) : (
                      String(i + 1).padStart(2, "0")
                    )}
                  </span>
                  <span>
                    {s.title}
                    <small>{s.short}</small>
                  </span>
                </button>
              </li>
            ))}
          </ol>
          <div className="step-help">
            <CircleDashed size={17} />
            <p>
              Chọn bước để đồng bộ flow, source và inspector. Xem nội dung không
              tự đánh dấu hoàn thành.
            </p>
          </div>
        </aside>
        <div className="lesson-content">
          <div className="lesson-heading">
            <span>BƯỚC {String(index + 1).padStart(2, "0")}</span>
            <h2>{step.title}</h2>
          </div>
          <div className="view-tabs" aria-label="Chế độ xem bước học">
            {(
              [
                { id: "result", label: "Kết quả & flow", icon: Play },
                { id: "source", label: "Source & inspector", icon: FileCode2 },
                {
                  id: "practice",
                  label: "Thực hành & kiểm chứng",
                  icon: ShieldCheck,
                },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                aria-pressed={view === tab.id}
                onClick={() => update({ view: tab.id })}
              >
                <tab.icon size={16} />
                {tab.label}
              </button>
            ))}
          </div>
          {view === "result" && (
            <div className="view-body">
              <div className="step-purpose">
                <h3>Mục tiêu của bước</h3>
                <p>{step.goal}</p>
                <details>
                  <summary>Vì sao cần bước này?</summary>
                  <p>{step.why}</p>
                </details>
              </div>
              {journey.id === "policy" ? (
                <PolicyPreview demo={demo} />
              ) : (
                <ClaimsResult
                  step={step}
                  openSource={() =>
                    update({
                      view: "source",
                      file: step.file,
                      side: step.id === "implement" ? "diff" : "after",
                    })
                  }
                />
              )}
              {step.command && (
                <section className="command-card">
                  <div>
                    <SquareTerminal size={17} />
                    <strong>Lệnh tham khảo · chỉ sao chép</strong>
                    <button
                      className="text-button"
                      onClick={() => copyCommand(step.command!)}
                    >
                      <Copy size={14} />
                      Sao chép
                    </button>
                  </div>
                  <pre>{step.command}</pre>
                  <p className="caption">
                    Lệnh kiểm tra phổ biến, chưa được chạy hoặc đối chiếu với
                    yêu cầu của repo Java.
                  </p>
                  {copyNotice && (
                    <p role="status" className="caption">
                      {copyNotice}
                    </p>
                  )}
                </section>
              )}
              <Flow journey={journey} step={step} onSelect={chooseStep} />
              <section className="card expected-card">
                <h3>
                  <CheckCircle2 size={18} />
                  Kết quả mong đợi
                </h3>
                <p>{step.expected}</p>
                <button
                  className="text-button"
                  onClick={() => update({ view: "source", file: step.file })}
                >
                  Lần theo source minh họa
                  <ArrowRight size={15} />
                </button>
              </section>
            </div>
          )}
          {view === "source" && (
            <div className="view-body">
              <SourceWorkspace
                journey={journey}
                step={step}
                file={file}
                side={side}
                update={update}
                reference={reference}
                returnTo={params.get("return")}
                onReturn={(target) =>
                  navigate(
                    target.startsWith(`/journey/${journey.id}`)
                      ? target
                      : `/journey/${journey.id}`,
                  )
                }
              />
              <Flow
                journey={journey}
                step={step}
                onSelect={chooseStep}
                compact
              />
            </div>
          )}
          {view === "practice" && (
            <div className="view-body practice-view">
              <section className="card">
                <span className="eyebrow">BẠN TỰ THỰC HIỆN</span>
                <h3>{step.goal}</h3>
                <p>{step.practice}</p>
                <label htmlFor="learning-note" className="note-label">
                  Ghi chú và cách giải thích của bạn
                </label>
                <textarea
                  id="learning-note"
                  key={key}
                  value={progress.notes[key] ?? ""}
                  onChange={(e) => progress.note(key, e.target.value)}
                  rows={5}
                  placeholder="Viết điều bạn hiểu, câu hỏi còn lại hoặc các bước sẽ tự làm…"
                />
                <p className="caption">
                  Tự lưu trong phần học minh họa của ứng dụng này.
                </p>
              </section>
              <section className="card">
                <h3>
                  <ListChecks size={18} />
                  Cách kiểm tra
                </h3>
                <p>{step.check}</p>
                <div className="expected-box">
                  <strong>Kết quả mong đợi</strong>
                  <p>{step.expected}</p>
                </div>
                <details>
                  <summary>Checklist cho bằng chứng thật sau này</summary>
                  <ul className="plain-list">
                    <li>Nguồn và phiên bản source được kiểm tra.</li>
                    <li>Lệnh hoặc request có đầu vào rõ ràng.</li>
                    <li>Expected / actual và log hoặc response.</li>
                    <li>Thời điểm kiểm tra và kết luận đúng phạm vi.</li>
                  </ul>
                </details>
              </section>
              <section className="evidence-empty">
                <CircleDashed size={26} />
                <div>
                  <h3>Chưa có bằng chứng từ repo Java</h3>
                  <p>{step.evidence}</p>
                  <span>Đánh dấu đã học chỉ ghi nhận tiến độ của bạn.</span>
                </div>
              </section>
            </div>
          )}
          <div className="lesson-footer">
            <button
              className={`button ${complete ? "completed" : "secondary"}`}
              onClick={() => progress.toggle(key)}
            >
              {complete ? <CheckCircle2 size={16} /> : <Circle size={16} />}
              {complete ? "Đã học bước mẫu" : "Đánh dấu đã học bước mẫu"}
            </button>
            <div>
              <button
                className="icon-button"
                aria-label="Bước trước"
                disabled={index === 0}
                onClick={() => chooseStep(journey.steps[index - 1])}
              >
                <ArrowLeft size={17} />
              </button>
              <span>
                {index + 1}/{journey.steps.length}
              </span>
              <button
                className="button small secondary"
                disabled={index === journey.steps.length - 1}
                onClick={() => chooseStep(journey.steps[index + 1])}
              >
                Bước tiếp
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function Flow({
  journey,
  step,
  onSelect,
  compact = false,
}: {
  journey: Journey;
  step: LearningStep;
  onSelect: (step: LearningStep) => void;
  compact?: boolean;
}) {
  return (
    <section className={`flow-card ${compact ? "compact-flow" : ""}`}>
      <div className="section-heading">
        <h3>
          <GitBranch size={17} />
          {journey.id === "policy" ? "Theo dấu dữ liệu" : "Bản đồ các bước"}
        </h3>
        <span className="caption">Flow minh họa · chọn để xem</span>
      </div>
      <ol>
        {journey.steps.map((s, i) => (
          <li key={s.id}>
            <button aria-pressed={s.id === step.id} onClick={() => onSelect(s)}>
              <span>{String(i + 1).padStart(2, "0")}</span>
              {s.short}
            </button>
            {i < journey.steps.length - 1 && (
              <ArrowRight size={14} aria-hidden />
            )}
          </li>
        ))}
      </ol>
      {journey.id === "policy" && !compact && (
        <p className="caption">
          Tên rỗng → thông báo lỗi · lỗi mô phỏng → giữ dữ liệu, thử lại · đọc
          khi chưa tạo → chưa có bản ghi.
        </p>
      )}
    </section>
  );
}

function ClaimsResult({
  step,
  openSource,
}: {
  step: LearningStep;
  openSource: () => void;
}) {
  return (
    <section className="card claim-result">
      <div className="section-heading">
        <h3>
          <ListChecks size={18} />
          {step.id === "implement"
            ? "Một thay đổi nhỏ để tập đọc Diff"
            : "Khung công việc có thể kiểm chứng"}
        </h3>
        <Badge state="pending">Chờ dữ liệu thật</Badge>
      </div>
      {step.id === "implement" ? (
        <>
          <div className="mini-diff">
            <span>demo/claims/learning-draft.pseudo</span>
            <pre>
              <i> return {"{"}</i>
              <i> note,</i>
              <b>+ needsBusinessReview: true</b>
              <i> {"};"}</i>
            </pre>
          </div>
          <p>
            Ví dụ thêm dấu nhắc cần xác nhận nghiệp vụ vào bản nháp học tập.
            Chưa sửa source Java.
          </p>
        </>
      ) : (
        <div className="claim-brief">
          <div>
            <span>ĐẦU VÀO</span>
            <p>
              {step.id === "requirements"
                ? "Yêu cầu nghiệp vụ thật chưa được cung cấp."
                : "Kết quả khảo sát và quyết định đã được xác nhận."}
            </p>
          </div>
          <ArrowRight size={21} />
          <div>
            <span>ĐẦU RA CẦN CÓ</span>
            <p>{step.expected}</p>
          </div>
        </div>
      )}
      <button className="button secondary" onClick={openSource}>
        <FileCode2 size={16} />
        {step.id === "implement"
          ? "Mở Before / After / Diff"
          : "Mở tài liệu mẫu"}
        <ArrowRight size={15} />
      </button>
    </section>
  );
}

function loadLayout(): Layout {
  try {
    const value = JSON.parse(
      localStorage.getItem("backend-learning-workshop.panels.v1") ?? "null",
    );
    if (
      value &&
      Number.isFinite(value.code) &&
      Number.isFinite(value.inspector) &&
      value.code >= 35 &&
      value.code <= 75 &&
      Math.abs(value.code + value.inspector - 100) < 0.1
    )
      return value;
  } catch {
    /* Use default layout. */
  }
  return { code: 62, inspector: 38 };
}
function SourceWorkspace({
  journey,
  step,
  file,
  side,
  update,
  reference,
  returnTo,
  onReturn,
}: {
  journey: Journey;
  step: LearningStep;
  file: SourceFile;
  side: Side;
  update: Update;
  reference: (target: string) => void;
  returnTo: string | null;
  onReturn: (target: string) => void;
}) {
  const [wrap, setWrap] = useCodeWrap();
  const [layout] = useState(loadLayout);
  const [layoutWarning, setLayoutWarning] = useState("");
  const range = file.id === step.file && step.range ? step.range : file.range;
  const symbol = {
    name: file.symbol,
    qualified: file.symbol,
    start: range[0],
    end: range[1],
  };
  const code = side === "before" ? file.before : file.after;
  const rows =
    side === "diff"
      ? diffRows(file.path, file.before, file.after)
      : sourceRows(code);
  const [small, setSmall] = useState(
    () => window.matchMedia("(max-width: 1250px)").matches,
  );
  useEffect(() => {
    const media = window.matchMedia("(max-width: 1250px)");
    const change = () => setSmall(media.matches);
    media.addEventListener("change", change);
    return () => media.removeEventListener("change", change);
  }, []);
  return (
    <section className="source-workspace">
      <div className="source-browser">
        <div className="source-browser-heading">
          <FolderOpen size={17} />
          <strong>Source minh họa</strong>
          <span>{journey.files.length} file · không phải repo Java</span>
        </div>
        <SourceTree
          files={journey.files}
          selected={file.id}
          onSelect={(id) => update({ file: id, return: null })}
        />
      </div>
      <div className="source-navigation">
        <span>
          <FileCode2 size={15} />
          {file.path}
        </span>
        {returnTo ? (
          <button className="text-button" onClick={() => onReturn(returnTo)}>
            <ArrowLeft size={14} />
            Quay lại tham chiếu
          </button>
        ) : file.id !== step.file ? (
          <button
            className="text-button"
            onClick={() => update({ file: step.file })}
          >
            Về file của bước
            <ArrowLeft size={14} />
          </button>
        ) : (
          <span className="caption">File của bước hiện tại</span>
        )}
      </div>
      <div className="source-toolbar">
        <div className="segmented small-segment" aria-label="Phiên bản source">
          {(
            [
              { id: "before", label: "Before" },
              { id: "after", label: "After" },
              { id: "diff", label: "Diff" },
            ] as const
          ).map((item) => (
            <button
              key={item.id}
              aria-pressed={side === item.id}
              onClick={() => update({ side: item.id })}
            >
              {item.label}
            </button>
          ))}
        </div>
        <label className="check-row">
          <input
            type="checkbox"
            checked={wrap}
            onChange={(e) => setWrap(e.target.checked)}
          />
          Xuống dòng
        </label>
      </div>
      <Group
        style={{ height: small ? 810 : 460 }}
        orientation={small ? "vertical" : "horizontal"}
        defaultLayout={layout}
        className={`source-panels ${small ? "stacked" : ""}`}
        onLayoutChanged={(next, meta) => {
          if (meta.isUserInteraction && !small) {
            try {
              localStorage.setItem(
                "backend-learning-workshop.panels.v1",
                JSON.stringify(next),
              );
            } catch {
              setLayoutWarning("Độ rộng chỉ được giữ trong phiên hiện tại.");
            }
          }
        }}
      >
        <Panel id="code" minSize="35%" className="source-code-panel">
          {!code && side === "before" ? (
            <div className="empty compact">
              <FileCode2 size={28} />
              <h3>Chưa có nội dung ở Before</h3>
              <p>Tài liệu mẫu này bắt đầu ở After.</p>
              <button
                className="button secondary"
                onClick={() => update({ side: "after" })}
              >
                Xem After
                <ArrowRight size={15} />
              </button>
            </div>
          ) : (
            <Suspense
              fallback={
                <div className="empty compact">Đang mở source viewer…</div>
              }
            >
              <CodeBlock
                key={`${journey.id}:${step.id}:${file.id}:${side}`}
                rows={rows}
                path={file.path}
                range={symbol}
                oldRange={symbol}
                diff={side === "diff"}
                memoryKey={`${journey.id}:${step.id}:${file.id}:${side}`}
                targetKey={`${step.id}:${file.id}`}
              />
            </Suspense>
          )}
        </Panel>
        <Separator
          className="resize-handle"
          aria-label="Điều chỉnh kích thước source và inspector"
        >
          <span>⋮</span>
        </Separator>
        <Panel id="inspector" minSize="25%" className="inspector-panel">
          <div className="inspector-heading">
            <Info size={16} />
            <strong>Inspector</strong>
            <span>Mã giả / tài liệu</span>
          </div>
          <div className="inspector-body">
            <span className="symbol-label">{file.symbol}</span>
            <div>
              <h4>Vai trò</h4>
              <p>{file.role}</p>
            </div>
            <div>
              <h4>Đầu vào</h4>
              <p>{file.input}</p>
            </div>
            <div>
              <h4>Đầu ra</h4>
              <p>{file.output}</p>
            </div>
            <div>
              <h4>
                {file.id === step.file
                  ? "Giải thích thay đổi"
                  : "Ngữ cảnh đang giữ"}
              </h4>
              <p>
                {file.id === step.file
                  ? step.explanation
                  : `Bạn đang xem tham chiếu. Bước “${step.title}” vẫn được giữ nguyên.`}
              </p>
            </div>
            <div className="inspector-relations">
              <h4>Quan hệ & tham chiếu</h4>
              {file.links.map((link) => (
                <button
                  key={link.target}
                  onClick={() => reference(link.target)}
                >
                  <Link2 size={14} />
                  <span>{link.label}</span>
                  <ArrowRight size={14} />
                </button>
              ))}
            </div>
          </div>
        </Panel>
      </Group>
      <div className="source-legend">
        <span>
          <i />
          Dòng đang giải thích
        </span>
        {side === "diff" && (
          <>
            <span>
              <i className="added" />
              Thêm
            </span>
            <span>
              <i className="removed" />
              Bỏ
            </span>
          </>
        )}
        <small>Diff của ví dụ học tập, không phải Git diff repo Java.</small>
      </div>
      {layoutWarning && <p className="caption">{layoutWarning}</p>}
    </section>
  );
}

export function SourceTree({
  files,
  selected,
  onSelect,
  label = "Cây thư mục minh họa",
}: {
  files: Pick<SourceFile, "id" | "path">[];
  selected: string;
  onSelect: (id: string) => void;
  label?: string;
}) {
  const [collapsed, setCollapsed] = useState<string[]>([]);
  const container = useRef<HTMLDivElement>(null);
  const selectedPath = files.find((f) => f.id === selected)?.path ?? "";
  useEffect(() => {
    setCollapsed((previous) =>
      previous.filter((folder) => !selectedPath.startsWith(folder + "/")),
    );
  }, [selectedPath]);
  function branch(prefix = ""): React.ReactNode {
    const children = [
      ...new Set(
        files
          .filter((file) => file.path.startsWith(prefix))
          .map((file) => file.path.slice(prefix.length).split("/")[0]),
      ),
    ];
    return (
      <ul>
        {children.map((name) => {
          const path = prefix + name;
          const file = files.find((f) => f.path === path);
          const closed = collapsed.includes(path);
          return (
            <li key={path}>
              {file ? (
                <button
                  className={`tree-file ${selected === file.id ? "selected" : ""}`}
                  aria-pressed={selected === file.id}
                  onClick={() => onSelect(file.id)}
                >
                  <FileCode2 size={15} />
                  <span>{name}</span>
                  {selected === file.id && (
                    <span className="tree-selected">Đang xem</span>
                  )}
                </button>
              ) : (
                <>
                  <button
                    className="tree-folder"
                    aria-expanded={!closed}
                    onClick={() =>
                      setCollapsed(
                        closed
                          ? collapsed.filter((p) => p !== path)
                          : [...collapsed, path],
                      )
                    }
                  >
                    {closed ? (
                      <ChevronRight size={13} />
                    ) : (
                      <ChevronDown size={13} />
                    )}
                    {closed ? <Folder size={15} /> : <FolderOpen size={15} />}
                    {name}
                  </button>
                  {!closed && branch(path + "/")}
                </>
              )}
            </li>
          );
        })}
      </ul>
    );
  }
  return (
    <div
      className="file-tree"
      ref={container}
      aria-label={label}
    >
      {branch()}
    </div>
  );
}
