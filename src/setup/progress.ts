import { useEffect, useRef, useState } from "react";
import { actionSteps, actionStepById, guideCheckIds, guideModules } from "../content/setup/action-guide";
import type { ActionStepId, ModuleId } from "../content/setup/action-guide";

export const SETUP_PROGRESS_KEY = "backend-learning-workshop.setup-checklist.v1";
export type StepStatus = "todo" | "doing" | "checked" | "needs-info";
export const statusLabels: Record<StepStatus, string> = {
  todo: "Chưa làm", doing: "Đang làm", checked: "Đã tự kiểm tra", "needs-info": "Cần bổ sung thông tin",
};
type Progress = {
  version: 1;
  checked: string[];
  needsInfo: ActionStepId[];
  started: ActionStepId[];
  selectedStep: ActionStepId;
  moduleId: ModuleId | null;
};
const empty = (): Progress => ({ version: 1, checked: [], needsInfo: [], started: [], selectedStep: "source", moduleId: null });
function load(): Progress {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(SETUP_PROGRESS_KEY) ?? "null");
    if (!value || typeof value !== "object" || !("version" in value) || value.version !== 1) return empty();
    const data = value as Partial<Progress>;
    const ids = (items: unknown): ActionStepId[] => Array.isArray(items) ? [...new Set(items.filter((id): id is ActionStepId => typeof id === "string" && actionStepById.has(id as ActionStepId)))] : [];
    return {
      version: 1,
      checked: Array.isArray(data.checked) ? [...new Set(data.checked.filter((id): id is string => typeof id === "string" && guideCheckIds.has(id)))] : [],
      needsInfo: ids(data.needsInfo), started: ids(data.started),
      selectedStep: data.selectedStep && actionStepById.has(data.selectedStep) ? data.selectedStep : "source",
      moduleId: guideModules.some(module => module.id === data.moduleId) ? data.moduleId! : null,
    };
  } catch { return empty(); }
}
export function stepStatus(stepId: ActionStepId, progress: Pick<Progress, "checked" | "needsInfo" | "started">): StepStatus {
  if (progress.needsInfo.includes(stepId)) return "needs-info";
  const step = actionStepById.get(stepId)!;
  if (step.checks.every(check => progress.checked.includes(check.id))) return "checked";
  if (progress.started.includes(stepId) || step.checks.some(check => progress.checked.includes(check.id))) return "doing";
  return "todo";
}
export function useSetupProgress() {
  const [progress, setProgress] = useState(load);
  const [warning, setWarning] = useState("");
  const [notice, setNotice] = useState("");
  const dirty = useRef(false);
  useEffect(() => {
    if (!dirty.current) return;
    try { localStorage.setItem(SETUP_PROGRESS_KEY, JSON.stringify(progress)); setWarning(""); }
    catch { setWarning("Trình duyệt chưa lưu được checklist; bạn vẫn có thể làm trong phiên này."); }
  }, [progress]);
  function change(update: (previous: Progress) => Progress) {
    dirty.current = true;
    setProgress(update);
  }
  return {
    ...progress, warning, notice,
    completed: actionSteps.filter(step => stepStatus(step.id, progress) === "checked").map(step => step.id),
    select(id: ActionStepId) { change(p => ({ ...p, selectedStep: id, started: [...new Set([...p.started, id])] })); },
    toggleCheck(id: string) {
      const step = actionSteps.find(value => value.checks.some(check => check.id === id));
      if (!step) return;
      change(p => ({ ...p, checked: p.checked.includes(id) ? p.checked.filter(key => key !== id) : [...p.checked, id], started: [...new Set([...p.started, step.id])] }));
    },
    toggleNeedsInfo(id: ActionStepId) { change(p => ({ ...p, needsInfo: p.needsInfo.includes(id) ? p.needsInfo.filter(key => key !== id) : [...p.needsInfo, id], started: [...new Set([...p.started, id])] })); },
    chooseModule(id: ModuleId | null) {
      if (id === progress.moduleId) return;
      const scoped = new Set(actionSteps.slice(2).flatMap(step => step.checks.map(check => check.id)));
      change(p => ({ ...p, moduleId: id, checked: p.checked.filter(key => !scoped.has(key)) }));
      setNotice("Đổi module: đã bỏ tick ở các việc cấu hình, infra, build, run và task để bạn kiểm tra lại đúng phạm vi.");
    },
    reset() { change(() => empty()); setNotice(""); },
    clearNotice() { setNotice(""); },
  };
}
export type SetupProgress = ReturnType<typeof useSetupProgress>;
