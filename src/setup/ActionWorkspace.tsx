import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft, ChevronDown, Expand, LocateFixed, Link2, Play, RotateCcw, X } from "lucide-react";
import { actionSteps } from "../content/setup/action-guide";
import type { ActionStepId } from "../content/setup/action-guide";
import { ActionFlow } from "./ActionFlow";
import { guidePrerequisites } from "./flow-layout";
import { GuideDetail } from "./GuideDetail";
import { ProjectPractice } from "./ProjectPractice";
import {LearningSteps} from '../components/LearningSteps';
import { GuideHistory } from "./GuideHistory";
import { EvidenceWorkspace } from "./EvidenceWorkspace";
import { parseActionSearch } from "./action-navigation";
import { firstPracticeTask, practiceStep } from "./practice-runtime-model";
import { practiceSearch, readPracticeProgress } from "./project-practice-model";
import { stepStatus, statusLabels } from "./progress";
import type { SetupProgress, StepStatus } from "./progress";
import "./setup.css";
import "./action-guide.css";

const path = "/journey/environment";
export function SetupWorkspace({ progress, copyLink }: { progress: SetupProgress; copyLink: () => void }) {
  const location = useLocation();
  const navigate = useNavigate();
  const selected = parseActionSearch(location.search, progress.selectedStep, progress.checked);
  const { step, stepId, corrected } = selected;
  const check = step.checks.find(value => value.id === selected.checkId) ?? step.checks[0];
  const [fitSignal, setFitSignal] = useState(0);
  const [focusSignal, setFocusSignal] = useState(0);
  const [resetOpen, setResetOpen] = useState(false);
  const [graphOpen, setGraphOpen] = useState(false);
  const detail = useRef<HTMLElement>(null);
  const map = useRef<HTMLElement>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const resetDialog = useRef<HTMLDialogElement>(null);
  const status = Object.fromEntries(actionSteps.map(value => [value.id, stepStatus(value.id, progress)])) as Record<ActionStepId, StepStatus>;
  const counts = Object.fromEntries(actionSteps.map(value => [value.id, value.checks.filter(item => progress.checked.includes(item.id)).length])) as Record<ActionStepId, number>;
  const index = actionSteps.indexOf(step);
  const nextStep = actionSteps[index+1]?.id ?? null;
  const notice = (location.state as { guideNotice?: string } | null)?.guideNotice ?? selected.messages.join(" ");
  useEffect(() => {
    if (corrected !== null) navigate({ pathname: path, search: corrected }, { replace: true, state: { guideNotice: selected.messages.join(" ") } });
  }, [corrected, navigate, selected.messages.join(" ")]);
  useEffect(() => { if (progress.selectedStep !== stepId) progress.select(stepId); }, [stepId]);
  useEffect(() => {
    if (selected.panel && !dialog.current?.open) dialog.current?.showModal();
    else if (!selected.panel && dialog.current?.open) dialog.current?.close();
  }, [selected.panel]);
  useEffect(() => { if (resetOpen) resetDialog.current?.showModal(); else resetDialog.current?.close(); }, [resetOpen]);
  useEffect(() => {
    if (selected.panel) return;
    const origin = (location.state as { restoreFocus?: string } | null)?.restoreFocus;
    if (origin) requestAnimationFrame(() => document.getElementById(origin)?.focus({ preventScroll: true }));
  }, [location.key, selected.panel]);
  function update(patch: Record<string, string | null>, state: object = {}) {
    const params = new URLSearchParams(location.search);
    for (const [key, value] of Object.entries(patch)) if (value === null) params.delete(key); else params.set(key, value);
    navigate({ pathname: path, search: params.toString() }, { state });
  }
  function chooseStep(id: ActionStepId) {
    const next = actionSteps.find(value => value.id === id)!;
    const nextCheck = next.checks.find(value => !progress.checked.includes(value.id)) ?? next.checks[0];
    progress.select(id);
    const memory=selected.experience==="project"?readPracticeProgress():null;
    const remembered=Object.keys(memory?.contexts??{}).reverse().find(task=>practiceStep(task,id)===id);
    update({ step: id, check: nextCheck.id, experience: selected.experience, ...(selected.experience==="project"?{task:remembered??firstPracticeTask[id],pfile:null,pline:null,pmodule:null,pstate:null,pfolder:null,popen:null,pview:null}:{}), collapsed: null, panel: null, file: null, evidence: null, line: null, history: null, return: null });
    requestAnimationFrame(() => { detail.current?.scrollIntoView({ block: "start" }); document.getElementById(`guide-action-${nextCheck.id}`)?.focus({ preventScroll: true }); });
  }
  function resume() {
    if(selected.experience==="project") {
      const memory=readPracticeProgress();
      const saved=memory.contexts[memory.current];
      if(saved) {navigate({pathname:path,search:practiceSearch(location.search,saved)});return;}
    }
    const current = status[progress.selectedStep] === "checked" ? actionSteps.find(value => status[value.id] !== "checked")?.id ?? progress.selectedStep : progress.selectedStep;
    chooseStep(current);
  }
  function overview() { setFitSignal(value => value+1); }
  function focusCurrent() {
    setFocusSignal(value => value+1);
    if (window.matchMedia("(max-width: 1100px)").matches) detail.current?.scrollIntoView({ block: "start" });
  }
  function closePanel() {
    update({ panel: null, file: null, evidence: null, line: null, history: null, return: null }, { restoreFocus: "guide-open-history" });
  }
  function openResource(id: string) {
    update({ panel: "source", file: id.startsWith("file:") ? id.slice(5) : null, evidence: id.startsWith("file:") ? null : id, line: null, return: path + location.search }, { focusOrigin: document.activeElement?.id });
  }
  function backFromSource() {
    if (selected.returnTo) navigate(selected.returnTo, { state: { restoreFocus: (location.state as { focusOrigin?: string } | null)?.focusOrigin } });
    else closePanel();
  }
  const sourceResource = selected.resource ?? (step.fileIds[0] ? `file:${step.fileIds[0]}` : step.evidenceIds[0]);
  const sourceLine = selected.line ?? (stepId === "tools" && sourceResource === "file:java-root-build" ? 48 : stepId === "build" && sourceResource === "file:java-root-build" ? 37 : undefined);
  return <div className={`action-guide ${selected.experience === "project" ? "is-project-practice" : ""}`}>
    <div className="page-kicker"><Link className="back-link" to="/"><ArrowLeft size={14} />Các hành trình</Link><button className="text-button" onClick={copyLink}><Link2 size={14} />Sao chép liên kết</button></div>
    <header className="guide-page-heading"><div><span className="eyebrow">SỔ TAY / CHUẨN BỊ MÔI TRƯỜNG</span><h1>Hiểu và chạy dự án</h1><p><strong>Bước {index+1}/7 · {step.shortTitle}</strong><span> · {selected.experience === "project" ? "Thực hành trên project tái dựng" : "Hướng dẫn trên máy thật"}</span></p></div><div className="guide-total"><strong>{progress.completed.length}<span> / 7</span></strong><small>bước tự kiểm tra máy thật</small></div></header>
    {notice && <p className="guide-notice" role="status">{notice}</p>}
    {progress.warning && <p className="guide-notice" role="status">{progress.warning}</p>}
    <LearningSteps className="guide-step-nav" label="Điều hướng 7 bước" current={stepId} items={actionSteps.map((value,i)=>({id:value.id,title:value.shortTitle,complete:status[value.id]==='checked',label:`Bước ${i+1}: ${value.title}`,hint:`${counts[value.id]}/${value.checks.length} đã kiểm tra · ${statusLabels[status[value.id]]}`}))} onSelect={id=>chooseStep(id as ActionStepId)}/>
    <div className="guide-toolbar"><p>Đang xem bước {index+1} / 7 · Tiến độ lưu trên trình duyệt này</p><div><button className="text-button" onClick={resume}><Play size={15} />Tiếp tục bước đang làm</button><button className="text-button" onClick={() => setResetOpen(true)}><RotateCcw size={15} />Đặt lại tiến độ</button></div></div>
    <div className="notebook-learning-controls"><section className="guide-map" ref={map} aria-label="Sơ đồ lộ trình"><button className="guide-map-toggle" aria-expanded={graphOpen} aria-controls="guide-map-content" onClick={() => setGraphOpen(value => !value)}><span>Xem sơ đồ lộ trình<small>{graphOpen ? "Kéo và zoom để xem toàn cảnh; đóng lại để tiếp tục hướng dẫn." : "Tùy chọn · 7 bước từ source đến task đầu tiên"}</small></span><ChevronDown size={20} /></button>
      {graphOpen && <div id="guide-map-content"><div className="guide-graph-actions"><button className="button secondary" onClick={overview}><Expand size={16} />Xem toàn cảnh</button><button className="button secondary" onClick={focusCurrent}><LocateFixed size={16} />Về bước đang làm</button></div><ActionFlow selected={stepId} next={nextStep} statuses={status} counts={counts} onSelect={chooseStep} fitSignal={fitSignal} focusSignal={focusSignal} />
        <div className="guide-map-footer"><p><b>Đang xem:</b> {step.title}</p><p><b>Chuẩn bị:</b> {guidePrerequisites[stepId]}</p><small>Mũi tên gợi ý thứ tự thao tác; không phải thứ tự startup bắt buộc của các app.</small></div><div className="guide-legend" aria-label="Trạng thái tiến độ">{(Object.keys(statusLabels) as StepStatus[]).map(value => <span key={value} className={value}><i />{statusLabels[value]}</span>)}</div></div>}
    </section>
    <div className="practice-experience-switch" aria-label="Chọn trải nghiệm"><button aria-pressed={selected.experience === "project"} onClick={() => {const task=new URLSearchParams(location.search).get("task");update({ experience: "project",...(task&&practiceStep(task,stepId)===stepId?{}:{task:firstPracticeTask[stepId],pfile:null,pline:null,pfolder:null,popen:null,pview:null}) });}}>Thực hành trên project</button><button aria-pressed={selected.experience === "guide"} onClick={() => update({ experience: "guide" })}>Hướng dẫn trên máy thật</button></div>
    </div><article className={`guide-detail ${selected.experience === "project" ? "practice-detail" : ""}`} ref={detail} aria-label="Hướng dẫn bước đang chọn">{selected.experience === "project" ? <ProjectPractice navigationReady={corrected===null} openMachineGuide={target=>update({ experience: "guide", step: target??"config", check: target?null:"config-profile", collapsed: null })}/> : <GuideDetail step={step} check={check} collapsed={selected.collapsed} progress={progress} onCheckSelect={(id, collapse = false, focus = false) => { update({ check: id, collapsed: collapse ? "1" : null }); if (focus) requestAnimationFrame(() => { const element = document.getElementById(`guide-action-${id}`); element?.scrollIntoView({ block: "start" }); element?.focus({ preventScroll: true }); }); }} onStepSelect={chooseStep} openHistory={() => update({ panel: "history", return: path + location.search }, { focusOrigin: "guide-open-history" })} />}</article>
    <dialog className="guide-source-dialog" ref={dialog} onCancel={event => { event.preventDefault(); if (selected.panel === "source") backFromSource(); else closePanel(); }} aria-labelledby="guide-source-title"><div className="guide-dialog-heading"><div><span>CHI TIẾT CỦA BƯỚC {index+1}</span><h2 id="guide-source-title">{selected.panel === "source" ? "File và bằng chứng" : "Cách đã xử lý trong repo này"}</h2></div><button className="button small secondary" onClick={closePanel}><X size={15} />Về checklist</button></div><div className="guide-dialog-body">{selected.panel === "source" ? <div className="setup-workspace"><EvidenceWorkspace resource={sourceResource} context={`Bước ${index+1} — ${step.title}`} line={sourceLine} open={openResource} goBack={backFromSource} memoryKey={`action:${stepId}:${check.id}`} /></div> : selected.panel === "history" ? <GuideHistory step={step} selectedHistory={selected.historyId} open={openResource} /> : null}</div></dialog>
    <dialog className="reset-dialog" ref={resetDialog} onCancel={() => setResetOpen(false)} aria-labelledby="guide-reset-title"><h2 id="guide-reset-title">Đặt lại tiến độ chạy dự án?</h2><p>Bỏ các tick, dấu cần bổ sung và module đã chọn của 7 bước. Giữ tiến độ Policy/Claim, dữ liệu học cũ và viewport của sơ đồ.</p><div className="actions"><button className="button secondary" onClick={() => setResetOpen(false)}>Giữ tiến độ</button><button className="button primary" onClick={() => { progress.reset(); setResetOpen(false); update({ step: "source", check: actionSteps[0].checks[0].id, collapsed: null, panel: null, file: null, evidence: null, history: null, return: null }); }}>Đặt lại</button></div></dialog>
  </div>;
}
