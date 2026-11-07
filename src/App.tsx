import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  ArrowDown,
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  Check,
  CheckCircle2,
  ChevronRight,
  Code2,
  Compass,
  Database,
  Eye,
  FileCode2,
  FlaskConical,
  GitBranch,
  Layers3,
  ListChecks,
  Map,
  PanelLeftClose,
  PanelLeftOpen,
  Play,
  RotateCcw,
  Server,
  ShieldCheck,
  SquareTerminal,
} from "lucide-react";
import { journeys, totalSteps, findJourney } from "./content/journeys";
import { Badge } from "./components/Badge";
import { JourneyWorkspace } from "./JourneyWorkspace";
import { useDemoPolicy, useProgress } from "./state";
import { SetupWorkspace } from "./setup/SetupWorkspace";
import { useSetupProgress } from "./setup/progress";

const journeyIcons = {
  environment: Server,
  policy: GitBranch,
  claims: ListChecks,
};

export function App() {
  const location = useLocation();
  const navigate = useNavigate();
  const journey = location.pathname.startsWith("/journey/")
    ? findJourney(location.pathname.split("/")[2])
    : undefined;
  const progress = useProgress();
  const setupProgress = useSetupProgress();
  const demoCount = progress.completed.filter(key => !key.startsWith("environment:")).length;
  const setupCount = setupProgress.completed.length;
  const completedCount = demoCount + setupCount;
  const countFor = (id: string) => id === "environment" ? setupCount : progress.completed.filter(key => key.startsWith(`${id}:`)).length;
  const demo = useDemoPolicy();
  const memory = useRef<Record<string, string>>({});
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mobile, setMobile] = useState(
    () => window.matchMedia("(max-width: 720px)").matches,
  );
  const [resetOpen, setResetOpen] = useState(false);
  const resetDialog = useRef<HTMLDialogElement>(null);
  const [copied, setCopied] = useState("");
  useEffect(() => {
    const media = window.matchMedia("(max-width: 720px)");
    const change = () => setMobile(media.matches);
    media.addEventListener("change", change);
    return () => media.removeEventListener("change", change);
  }, []);
  useEffect(() => {
    if (journey)
      memory.current[journey.id] = location.pathname + location.search;
    setSidebarOpen(false);
  }, [location.pathname, location.search, journey]);
  useEffect(() => {
    document.title = `${journey?.title ?? (location.pathname === "/sources" ? "Nguồn & phạm vi" : "Tổng quan hành trình")} · Backend Learning`;
  }, [journey, location.pathname]);
  useEffect(() => {
    if (resetOpen) resetDialog.current?.showModal();
    else resetDialog.current?.close();
  }, [resetOpen]);
  const journeyUrl = (id: string) => memory.current[id] ?? `/journey/${id}`;
  async function copy(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied("Đã sao chép liên kết hiện tại.");
    } catch {
      setCopied(
        "Trình duyệt chưa cho sao chép. Bạn có thể lấy liên kết trên thanh địa chỉ.",
      );
    }
    window.setTimeout(() => setCopied(""), 3500);
  }
  const nextJourney =
    journeys.find((j) =>
      j.steps.some((s) => j.id === "environment" ? !setupProgress.completed.some(id => id === s.id) : !progress.completed.includes(`${j.id}:${s.id}`)),
    ) ?? journeys[0];
  const nextStep =
    nextJourney.steps.find(
      (s) => nextJourney.id === "environment" ? !setupProgress.completed.some(id => id === s.id) : !progress.completed.includes(`${nextJourney.id}:${s.id}`),
    ) ?? nextJourney.steps[0];
  return (
    <div className="app-shell">
      <a className="skip-link" href="#main">
        Đến nội dung chính
      </a>
      <aside
        className={`sidebar ${sidebarOpen ? "is-open" : ""}`}
        aria-label="Điều hướng chính"
        inert={mobile && !sidebarOpen}
      >
        <button
          className="icon-button sidebar-close"
          aria-label="Đóng điều hướng"
          onClick={() => setSidebarOpen(false)}
        >
          <PanelLeftClose size={17} />
        </button>
        <Link className="brand" to="/">
          <span className="brand-mark">
            <Code2 size={25} />
          </span>
          <span>
            Backend<span className="brand-sub">LEARNING WORKSHOP</span>
          </span>
        </Link>
        <div className="sidebar-label">KHÔNG GIAN HỌC</div>
        <Link
          className={`nav-item ${location.pathname === "/" ? "active" : ""}`}
          to="/"
          aria-current={location.pathname === "/" ? "page" : undefined}
        >
          <Compass size={19} />
          Tổng quan hành trình
        </Link>
        <div className="sidebar-label journey-label">HÀNH TRÌNH CỦA BẠN</div>
        <nav>
          {journeys.map((j) => {
            const Icon = journeyIcons[j.id];
            const count = countFor(j.id);
            return (
              <Link
                key={j.id}
                className={`nav-item journey-nav ${journey?.id === j.id ? "active" : ""}`}
                aria-current={journey?.id === j.id ? "page" : undefined}
                to={journeyUrl(j.id)}
              >
                <Icon size={19} />
                <span>
                  {j.id === "claims" ? "Yêu cầu bồi thường" : j.title}
                  <small>
                    {j.number} · {count}/{j.steps.length} {j.id === "environment" ? "bước setup" : "bước mẫu"}
                  </small>
                </span>
                {journey?.id === j.id && <span className="nav-dot" />}
              </Link>
            );
          })}
        </nav>
        <div className="sidebar-label resource-label">THAM CHIẾU</div>
        <Link
          className={`nav-item ${location.pathname === "/sources" ? "active" : ""}`}
          to="/sources"
        >
          <Layers3 size={18} />
          Nguồn & phạm vi
        </Link>
        <div className="repo-context">
          <div>
            <span className="status-dot" />
            REPO JAVA MỤC TIÊU
          </div>
          <strong>agent-service-workspaces</strong>
          <span>Setup đã khảo sát · 04/11/2026</span>
        </div>
        <div className="sidebar-bottom">
          <div className="progress-label">
            <span>Tiến độ học tự đánh dấu</span>
            <strong>
              {completedCount}/{totalSteps}
            </strong>
          </div>
          <div className="progress-track">
            <i
              style={{
                width: `${(completedCount / totalSteps) * 100}%`,
              }}
            />
          </div>
          <button
            className="text-button reset-button"
            onClick={() => setResetOpen(true)}
          >
            <RotateCcw size={13} />
            Đặt lại tiến độ
          </button>
          <div className="local-note">
            <span className="status-dot blue" />
            Workspace local · v0.1
          </div>
        </div>
      </aside>
      <div className="workspace-shell">
        <header className="topbar">
          <div className="breadcrumb">
            <button
              className="icon-button mobile-menu"
              aria-label={sidebarOpen ? "Thu điều hướng" : "Mở điều hướng"}
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              {sidebarOpen ? (
                <PanelLeftClose size={20} />
              ) : (
                <PanelLeftOpen size={20} />
              )}
            </button>
            <Link to="/">Không gian học Backend</Link>
            <ChevronRight size={14} />
            <strong>
              {journey
                ? `Hành trình ${journey.number}`
                : location.pathname === "/sources"
                  ? "Nguồn & phạm vi"
                  : "Tổng quan"}
            </strong>
          </div>
          <div className="topbar-right">
            <Badge state="demo">Checklist setup · Policy/Claim minh họa</Badge>
            <span className="avatar">NT</span>
          </div>
        </header>
        <main
          id="main"
          className={`main-content ${journey ? "journey-main" : ""}`}
        >
          {progress.warning && <div className="notice">{progress.warning}</div>}
          {location.pathname === "/" ? (
            <>
              <div className="page-kicker">
                <span className="eyebrow">HỌC TỪ MỘT DỰ ÁN THẬT</span>
                <span className="caption">Dành cho FE React / TypeScript</span>
              </div>
              <section className="hero">
                <div className="hero-content">
                  <span className="hero-label">
                    <span className="status-dot blue" />
                    KHÔNG GIAN THỰC HÀNH BACKEND
                  </span>
                  <h1>
                    Từ kết quả trên UI
                    <br />
                    đến dòng code Backend<span>.</span>
                  </h1>
                  <p>
                    Hiểu toàn cảnh, lần theo flow, rồi tự tay thực hiện.
                    <br className="desktop-br" /> Mỗi bước đều có lý do và cách
                    kiểm chứng.
                  </p>
                  <div className="actions">
                    <Link
                      className="button primary"
                      to={nextJourney.id === "environment" ? journeyUrl("environment") : `/journey/${nextJourney.id}?step=${nextStep.id}`}
                    >
                      <Play size={16} />
                      {completedCount
                        ? "Tiếp tục hành trình"
                        : "Bắt đầu khám phá"}
                      <ArrowRight size={17} />
                    </Link>
                    <Link className="button hero-secondary" to="/sources">
                      Phạm vi bản tổng thể
                      <ArrowUpRight size={15} />
                    </Link>
                  </div>
                </div>
                <div
                  className="hero-diagram"
                  aria-label="Cách học: kết quả giao diện dẫn đến flow xử lý, rồi source và kiểm chứng"
                >
                  <div className="diagram-label">ĐI TỪ ĐIỀU BẠN ĐÃ QUEN</div>
                  <div className="diagram-card ui">
                    <span className="diagram-icon">
                      <Eye size={22} />
                    </span>
                    <div>
                      <strong>Kết quả trên UI</strong>
                      <small>Nhìn thấy & tương tác</small>
                    </div>
                    <CheckCircle2 size={17} />
                  </div>
                  <div className="diagram-connector">
                    <ArrowDown size={17} />
                    <span>Theo dấu dữ liệu</span>
                  </div>
                  <div className="diagram-card flow">
                    <span className="diagram-icon">
                      <GitBranch size={22} />
                    </span>
                    <div>
                      <strong>Flow xử lý</strong>
                      <small>Đầu vào → xử lý → đầu ra</small>
                    </div>
                  </div>
                  <div className="diagram-connector">
                    <ArrowDown size={17} />
                    <span>Hiểu & tự làm lại</span>
                  </div>
                  <div className="diagram-bottom">
                    <div>
                      <FileCode2 size={17} />
                      <span>Source</span>
                    </div>
                    <span>→</span>
                    <div>
                      <ShieldCheck size={17} />
                      <span>Kiểm chứng</span>
                    </div>
                  </div>
                </div>
              </section>
              <div className="section-title">
                <div>
                  <h2>Hành trình học của bạn</h2>
                  <p>
                    Ba chặng, một mạch xuyên suốt. Mở chặng bất kỳ để duyệt giao
                    diện.
                  </p>
                </div>
                <span className="chapter-count">03 HÀNH TRÌNH</span>
              </div>
              <div className="journey-cards">
                {journeys.map((j) => {
                  const Icon = journeyIcons[j.id];
                  const count = countFor(j.id);
                  return (
                    <article className={`journey-card ${j.id}`} key={j.id}>
                      <div className="journey-card-top">
                        <span className="journey-icon">
                          <Icon size={24} />
                        </span>
                        <span className="journey-number">{j.number}</span>
                      </div>
                      <Badge state={j.state}>
                        {j.id === "environment" ? "Hướng dẫn hành động · có căn cứ source" : j.id === "claims"
                          ? "Khung mẫu · chờ yêu cầu thật"
                          : "Có thể duyệt bản minh họa"}
                      </Badge>
                      <h3>{j.title}</h3>
                      <p>{j.summary}</p>
                      <div className="card-outcome">
                        <Check size={15} />
                        <span>{j.outcome}</span>
                      </div>
                      <div className="journey-card-footer">
                        <span>
                          {j.duration}
                          {count > 0 ? ` · đã học ${count}` : ""}
                        </span>
                        <Link
                          to={journeyUrl(j.id)}
                          aria-label={`Mở ${j.title}`}
                        >
                          Mở hành trình
                          <ArrowRight size={16} />
                        </Link>
                      </div>
                    </article>
                  );
                })}
              </div>
              <section className="learning-method">
                <div>
                  <BookOpen size={20} />
                  <strong>Một cách học quen thuộc với FE</strong>
                </div>
                <ol>
                  {[
                    { icon: Eye, label: "Xem kết quả" },
                    { icon: GitBranch, label: "Theo flow" },
                    { icon: FileCode2, label: "Mở source" },
                    { icon: Code2, label: "Tự thực hành" },
                    { icon: ShieldCheck, label: "Kiểm chứng" },
                  ].map(({ icon: Icon, label }, i) => (
                    <li key={label}>
                      <span>{String(i + 1).padStart(2, "0")}</span>
                      <Icon size={16} />
                      {label}
                      {i < 4 && (
                        <ChevronRight className="method-arrow" size={15} />
                      )}
                    </li>
                  ))}
                </ol>
              </section>
              <div className="overview-bottom">
                <section className="card scope-card">
                  <div className="section-heading">
                    <h3>
                      <Layers3 size={18} />
                      Bạn đang xem phiên bản nào?
                    </h3>
                    <Link to="/sources" aria-label="Xem nguồn và phạm vi">
                      <ArrowUpRight size={17} />
                    </Link>
                  </div>
                  <div className="scope-row">
                    <Badge state="demo" />
                    <span>
                      Policy/Claim và mã giả để duyệt tương tác.
                    </span>
                  </div>
                  <div className="scope-row">
                    <Badge state="verified" />
                    <span>
                      Nền FE và thành phần tái sử dụng từ hai repo local.
                    </span>
                  </div>
                  <div className="scope-row">
                    <Badge state="pending" />
                    <span>
                      HTTP/API, auth, luồng nghiệp vụ và các điều kiện local còn thiếu.
                    </span>
                  </div>
                </section>
                <section className="next-card">
                  <span className="eyebrow">ĐIỂM BẮT ĐẦU GỢI Ý</span>
                  <h3>{nextStep.title}</h3>
                  <p>{nextStep.goal}</p>
                  <Link to={nextJourney.id === "environment" ? journeyUrl("environment") : `/journey/${nextJourney.id}?step=${nextStep.id}`}>
                    Mở bước này
                    <ArrowRight size={17} />
                  </Link>
                </section>
              </div>
              <footer className="page-footer">
                <FlaskConical size={14} />
                Setup theo bằng chứng · ứng dụng học không kết nối Backend thật
                <span>Dữ liệu học được lưu riêng trên trình duyệt</span>
              </footer>
            </>
          ) : journey?.id === "environment" ? (
            <SetupWorkspace progress={setupProgress} copyLink={() => copy(window.location.href)} />
          ) : journey ? (
            <JourneyWorkspace
              journey={journey}
              progress={progress}
              demo={demo}
              copyLink={() => copy(window.location.href)}
            />
          ) : location.pathname === "/sources" ? (
            <Sources />
          ) : (
            <div className="empty">
              <Map size={40} />
              <h1>Không tìm thấy khu vực này</h1>
              <p>Liên kết chưa hợp lệ. Bạn có thể trở về bản đồ hành trình.</p>
              <Link className="button primary" to="/">
                Về tổng quan
                <ArrowRight size={16} />
              </Link>
            </div>
          )}
        </main>
      </div>
      {copied && (
        <div className="toast" role="status">
          <Check size={17} />
          {copied}
        </div>
      )}
      <dialog
        ref={resetDialog}
        onCancel={() => setResetOpen(false)}
        onClose={() => setResetOpen(false)}
        className="reset-dialog"
      >
        <h2>{journey?.id === "environment" ? "Đặt lại tiến độ setup?" : "Đặt lại phần học minh họa?"}</h2>
        <p>
          {journey?.id === "environment" ? "Chỉ xóa checklist, dấu cần bổ sung và module đã chọn của 7 bước. Giữ tiến độ Policy/Claim, dữ liệu học cũ và tùy chọn hiển thị." : "Chỉ xóa dấu hoàn thành và ghi chú của phần minh họa. Giữ checklist setup và tùy chọn hiển thị."}
        </p>
        <div className="actions">
          <button
            className="button secondary"
            onClick={() => setResetOpen(false)}
          >
            Giữ tiến độ
          </button>
          <button
            className="button primary"
            onClick={() => {
              if (journey?.id === "environment") setupProgress.reset();
              else progress.reset();
              setResetOpen(false);
              navigate("/");
            }}
          >
            Đặt lại
          </button>
        </div>
      </dialog>
    </div>
  );
}

function Sources() {
  return (
    <>
      <div className="page-kicker">
        <span className="eyebrow">NGUỒN & PHẠM VI</span>
        <Badge state="verified" />
      </div>
      <h1 className="page-title">Biết rõ điều gì đã được xác minh.</h1>
      <p className="page-description">
        Bản tổng thể được xây từ working tree local ngày 04/11/2026. GitHub là
        nguồn tham chiếu; không dùng để thay thế thay đổi local.
      </p>
      <div className="source-origin-grid">
        <article className="card">
          <span className="origin-icon">
            <Code2 size={24} />
          </span>
          <h2>Quotation Product</h2>
          <p className="caption">
            ../quotation-product · working tree sạch khi khảo sát
          </p>
          <p>
            Tái sử dụng cấu hình React/TypeScript/Vite, design token xanh da
            trời, Field và CSS tương ứng; AsyncMessage được thêm nhãn loading
            phù hợp.
          </p>
          <code>src/pages/CreateQuotation.tsx</code>
          <code>src/components/AsyncMessage.tsx</code>
          <code>src/components/ui.module.css</code>
          <code>src/styles.css · tsconfig.json · vite.config.ts</code>
        </article>
        <article className="card">
          <span className="origin-icon">
            <GitBranch size={24} />
          </span>
          <h2>Quotation Workshop</h2>
          <p className="caption">
            ../quotation-workshop · có thay đổi local được giữ nguyên
          </p>
          <p>
            Tái sử dụng CodeBlock, bộ tạo dòng Before/After/Diff và tùy chọn
            xuống dòng. Điều chỉnh source viewer cho nội dung mẫu độc lập; áp
            dụng bố cục, cây file, inspector và ngữ cảnh URL.
          </p>
          <code>src/workshop/CodeBlock.tsx</code>
          <code>src/workshop/source.ts (phần tạo dòng)</code>
          <code>src/workshop/code-preferences.ts</code>
          <p className="caption">
            Cây thư mục, controller điều hướng và inspector được viết lại gọn
            theo nội dung mới, tham khảo source thực tế.
          </p>
        </article>
      </div>
      <section className="card dependency-card">
        <h2>Thư viện được chọn từ nền hiện có</h2>
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Nguồn</th>
                <th>Dependency</th>
                <th>Vai trò trong ứng dụng mới</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Dùng chung</td>
                <td>
                  react / react-dom 19.3.1
                  <br />
                  react-router-dom 7.18.5
                </td>
                <td>Giao diện, điều hướng, URL và Back/Forward</td>
              </tr>
              <tr>
                <td>Workshop</td>
                <td>shiki 4.5.0 · diff 9.0.0</td>
                <td>Highlight và so sánh thay đổi</td>
              </tr>
              <tr>
                <td>Workshop</td>
                <td>
                  react-resizable-panels 4.15.2
                  <br />
                  lucide-react 1.64.0
                </td>
                <td>Panel điều chỉnh kích thước và icon</td>
              </tr>
              <tr>
                <td>Dùng chung</td>
                <td>
                  TypeScript 5.9.3 · Vite 8.3.5
                  <br />
                  Playwright 1.64.1
                </td>
                <td>Typecheck, build và kiểm tra trình duyệt</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="caption">
          Giữ phiên bản đã có. Không mang MSW, React Flow, snapshot, practice,
          dữ liệu học, node_modules hay .git từ repo gốc. Lockfile mới được thu
          gọn từ lockfile Workshop.
        </p>
      </section>
      <div className="source-origin-grid">
        <section className="card">
          <Badge state="verified">Setup có nguồn và thời điểm</Badge>
          <h2>Setup Java đã được khảo sát</h2>
          <p>
            Lịch sử S00–S18 lấy từ báo cáo ngày 04/11/2026; source/build/config được đối chiếu khi thiết kế cùng ngày. Lượt triển khai UI không chạy Java/Docker/DB hoặc kiểm tra runtime lại. Policy và Claim giữ nội dung minh họa.
          </p>
          <div className="empty compact">
            <Database size={26} />
            <p>
              Đã có bằng chứng build module và process từng bind port. HTTP/API, auth, nghiệp vụ, profile local Flow/Query, DB replication và payload/runtime Debezium vẫn Chờ xác nhận.
            </p>
          </div>
        </section>
        <section className="card">
          <Badge state="demo" />
          <h2>Nội dung tách khỏi giao diện</h2>
          <p>
            Hành trình, bước, source mẫu, quan hệ và tiêu chí nằm trong{" "}
            <code>src/content/</code>. Có thể thay bằng nội dung khảo sát mà giữ
            cơ chế xem và điều hướng.
          </p>
          <p>
            Tiến độ và ghi chú chỉ thuộc namespace{" "}
            <code>backend-learning-workshop.*</code>. Ví dụ Policy chạy trong bộ
            nhớ và được xóa khi reload.
          </p>
          <Link className="button secondary" to="/journey/policy">
            Duyệt kịch bản mẫu
            <ArrowRight size={16} />
          </Link>
        </section>
      </div>
      <div className="notice">
        <SquareTerminal size={19} />
        <span>
          Các nút trong bài học chỉ sao chép lệnh hoặc mô phỏng trong UI. Không
          chạy lệnh máy, Docker hay truy cập database.
        </span>
      </div>
    </>
  );
}
