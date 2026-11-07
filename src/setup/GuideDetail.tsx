import { useState } from "react";
import { AlertCircle, ArrowRight, Check, ChevronDown, Copy, FileText, Search } from "lucide-react";
import { actionSteps, guideCommand, guideModules } from "../content/setup/action-guide";
import type { ActionGuideStep, ActionStepId, GuideCheck, ModuleId } from "../content/setup/action-guide";
import type { SetupProgress } from "./progress";
import { statusLabels, stepStatus } from "./progress";

export function ModuleChoice({ progress }: { progress: SetupProgress }) {
  return <div className="guide-module-choice"><label htmlFor="guide-module">Module của task</label><select id="guide-module" value={progress.moduleId ?? ""} onChange={event => progress.chooseModule(event.target.value ? event.target.value as ModuleId : null)}><option value="">Chưa chọn — xác nhận theo task</option>{guideModules.map(module => <option key={module.id} value={module.id}>{module.name}</option>)}</select><small>Chọn theo task; không mặc định chạy cả 5 app.</small>
    {progress.notice && <div className="guide-inline-notice" role="status">{progress.notice}<button className="text-button" onClick={progress.clearNotice}>Đã hiểu</button></div>}
  </div>;
}
export function GuideCommand({ text, shell = "PowerShell" }: { text: string; shell?: "PowerShell" | "Git Bash" }) {
  const [message, setMessage] = useState("");
  async function copy() {
    try { await navigator.clipboard.writeText(text); setMessage("Đã sao chép."); }
    catch { setMessage("Chưa sao chép được; hãy chọn phần lệnh bên dưới để copy."); }
  }
  return <div className="guide-command"><div><span>{shell} · Lệnh hướng dẫn, chưa chạy tại đây</span><button className="text-button" onClick={copy} aria-label="Sao chép lệnh"><Copy size={16} />Sao chép</button></div><pre><code>{text}</code></pre>{message && <span role="status">{message}</span>}</div>;
}
export function GuideDetail({ step, check, collapsed, progress, onCheckSelect, onStepSelect, openHistory }: {
  step: ActionGuideStep; check: GuideCheck; collapsed: boolean; progress: SetupProgress;
  onCheckSelect: (id: string, collapse?: boolean, focus?: boolean) => void; onStepSelect: (id: ActionStepId) => void; openHistory: () => void;
}) {
  const index = actionSteps.indexOf(step);
  const count = step.checks.filter(item => progress.checked.includes(item.id)).length;
  const module = guideModules.find(value => value.id === progress.moduleId);
  const needsInfo = progress.needsInfo.includes(step.id);
  return <>
    <header className="guide-detail-heading"><div><span>BƯỚC {index+1} / 7</span><h2>{step.title}</h2><p>{step.goal}</p></div><span className={`guide-state ${stepStatus(step.id, progress)}`}>{statusLabels[stepStatus(step.id, progress)]}</span></header>
    <section className="guide-checklist" aria-label={`Các thao tác: ${step.title}`}>
      <div className="guide-section-heading"><h3>Thực hiện từng thao tác</h3><span>{count}/{step.checks.length} đã kiểm tra</span></div>
      <ol className="guide-actions">{step.checks.map((item, itemIndex) => {
        const open = check.id === item.id && !collapsed;
        const checked = progress.checked.includes(item.id);
        const command = guideCommand(item, progress.moduleId);
        const next = step.checks[itemIndex+1];
        return <li key={item.id} className={`guide-action ${open ? "is-active" : ""}`}>
          <h3 className="guide-action-heading"><button id={`guide-action-${item.id}`} className="guide-check-select" aria-expanded={open} aria-controls={`guide-body-${item.id}`} onClick={() => onCheckSelect(item.id, open)}>
            <span className="guide-action-number">{itemIndex+1}</span><span className="guide-action-title">{item.title}<small>{checked ? <><Check size={14} />Đã kiểm tra</> : open ? "Đang mở hướng dẫn" : "Mở hướng dẫn"}</small></span><ChevronDown className="guide-action-chevron" size={22} />
          </button></h3>
          {open && <div id={`guide-body-${item.id}`} className="guide-action-body" role="region" aria-labelledby={`guide-action-${item.id}`}>
            <section className="guide-intent"><h4>Bạn cần làm gì?</h4><p>{item.action}</p>{item.why && <p className="guide-why"><b>Vì sao cần làm?</b> {item.why}</p>}</section>
            <section className="guide-place"><h4>Làm ở đâu?</h4><p>{item.where}</p></section>
            <section className="guide-how"><h4>Làm như thế nào?</h4>
              {(["config", "build", "run", "ready"].includes(step.id) || item.dynamicCommand) && <ModuleChoice progress={progress} />}
              {module && ["config", "run"].includes(step.id) && <div className="guide-module-config"><b>{module.name} · cổng theo source: {module.port}</b><p>{item.id === "run-config" ? `Main class: ${module.mainClass}` : module.config}</p><small>File: workspaces/{module.module}/src/main/resources/application*.yml · Cổng hiệu lực có thể bị override.</small></div>}
              <ol className="guide-instructions">{item.how.map((instruction, n) => <li key={n}><p>{instruction.text}</p>{instruction.command && (command ? <GuideCommand key={`${item.id}:${progress.moduleId ?? ""}`} text={command} shell={item.shell} /> : <p className="guide-choice-hint">Chọn module của task phía trên để xem đúng lệnh.</p>)}{instruction.output && <div className="guide-output"><b>Output minh họa — không phải kết quả đã chạy</b><pre>{instruction.output}</pre></div>}</li>)}</ol>
              <p className="guide-effect"><b>Tác động:</b> {item.effect}</p>
            </section>
            <section className="guide-done"><h4>Kiểm tra kết quả</h4><p>{item.done}</p></section>
            <section className="guide-failure"><h4>Nếu kết quả khác</h4><ul>{item.failure.map(value => <li key={value}>{value}</li>)}</ul>
              {item.nextCheckStep && <button className="text-button" onClick={() => onStepSelect(item.nextCheckStep!)}>Mở bước: {actionSteps.find(value => value.id === item.nextCheckStep)?.title}<ArrowRight size={16} /></button>}
              {item.missing && <div className="guide-missing"><h4><AlertCircle size={18} />Thông tin cần bổ sung</h4><p><b>Thiếu:</b> {item.missing.what}</p><p><b>Ảnh hưởng:</b> {item.missing.affects}</p><p><b>Tìm / xác minh:</b> {item.missing.find}</p><button className="text-button" aria-pressed={needsInfo} onClick={() => progress.toggleNeedsInfo(step.id)}>{needsInfo ? "Bỏ đánh dấu cần bổ sung" : "Ghi nhận cần bổ sung thông tin"}</button></div>}
            </section>
            <details className="guide-technical"><summary>Đọc thêm về kỹ thuật và căn cứ</summary><p>{item.read}</p></details>
            <div className="guide-action-complete"><label><input type="checkbox" checked={checked} onChange={() => progress.toggleCheck(item.id)} />Tôi đã kiểm tra xong<span className="sr-only">: {item.title}</span></label><small>Tự đánh dấu sau khi đọc kết quả; không tự kiểm chứng máy thật.</small>
              <button className="button primary" onClick={() => next ? onCheckSelect(next.id, false, true) : index < actionSteps.length-1 ? onStepSelect(actionSteps[index+1].id) : onCheckSelect(item.id, true)}>{next ? "Thao tác tiếp theo" : index < actionSteps.length-1 ? "Sang bước tiếp theo" : "Thu gọn thao tác"}<ArrowRight size={17} /></button>
              {next && <span className="guide-next-label">Tiếp: {next.title}</span>}
            </div>
          </div>}
        </li>;
      })}</ol>
    </section>
    <div className="guide-deeper"><details><summary><Search size={17} />Gặp repo khác thì tìm ở đâu?<ChevronDown size={17} /></summary><ul>{step.elsewhere.map(text => <li key={text}>{text}</li>)}</ul></details><button id="guide-open-history" className="guide-history-button" onClick={openHistory}><FileText size={17} />Xem cách đã xử lý trong repo này<ArrowRight size={17} /></button></div>
    <footer className="guide-step-footer"><span>Tiến độ do bạn tự đánh dấu. Chuyển thao tác/bước không tự tick.</span><div>{index > 0 && <button className="button secondary" onClick={() => onStepSelect(actionSteps[index-1].id)}>Bước trước</button>}{index < actionSteps.length-1 && <button className="button primary" onClick={() => onStepSelect(actionSteps[index+1].id)}>Bước tiếp<ArrowRight size={17} /></button>}</div></footer>
  </>;
}
