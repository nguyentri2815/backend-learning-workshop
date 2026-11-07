import { actionStepById, legacyActionMap } from "../content/setup/action-guide";
import type { ActionStepId } from "../content/setup/action-guide";
import { evidenceById, fileById } from "../content/setup";
import { safeReturn } from "./navigation";
import { firstPracticeTask, isRuntimeTask, practiceStep } from "./practice-runtime-model";
import {readPracticeProgress} from "./project-practice-model";

export function parseActionSearch(search: string, fallback: ActionStepId, checked: string[] = []) {
  const params = new URLSearchParams(search);
  let changed = false;
  const messages: string[] = [];
  const set = (key: string, value: string | null) => {
    if (params.get(key) === value) return;
    changed = true;
    if (value === null) params.delete(key); else params.set(key, value);
  };
  const raw = params.get("step");
  let stepId = raw && actionStepById.has(raw as ActionStepId) ? raw as ActionStepId : raw && legacyActionMap[raw] ? legacyActionMap[raw] : raw ? "source" : fallback;
  if(params.get("experience")==="project") {
    const task=params.get("task");
    if(task&&(isRuntimeTask(task)||["root","missing","script","after","command","profile"].includes(task))) stepId=practiceStep(task,raw) as ActionStepId;
    else if(!task){
      const progress=raw?undefined:readPracticeProgress(),saved=progress?.contexts[progress.current];
      if(saved){set("task",progress!.current);stepId=practiceStep(progress!.current) as ActionStepId;if(saved.runSection==="results")set("prun","results");}
      else set("task",firstPracticeTask[stepId]);
    }
  }
  set("step", stepId);
  if (raw && legacyActionMap[raw]) {
    if (/^S\d\d$/.test(raw)) { set("panel", params.get("view") === "source" ? "source" : "history"); set("history", raw); }
    messages.push("Đã mở bước hành động tương ứng từ liên kết cũ.");
  } else if (raw && !actionStepById.has(raw as ActionStepId)) messages.push("Bước trong liên kết chưa có dữ liệu; đang mở bước đầu tiên.");
  const step = actionStepById.get(stepId)!;
  const experience=params.get("experience")==="project"?"project":params.get("experience")==="guide"?"guide":stepId==="source"&&!params.has("check")&&!params.has("panel")&&raw!=="S00"?"project":"guide";
  set("experience",experience);
  if (params.has("check") && !step.checks.some(check => check.id === params.get("check"))) { set("check", null); messages.push("Mục checklist không thuộc bước này; đang mở mục phù hợp."); }
  if (!params.has("check")) set("check", (step.checks.find(check => !checked.includes(check.id)) ?? step.checks[0]).id);
  if (params.has("collapsed") && params.get("collapsed") !== "1") set("collapsed", null);
  let resource = params.has("file") ? `file:${params.get("file")}` : params.get("evidence");
  if (resource && !(resource.startsWith("file:") ? fileById.has(resource.slice(5)) : evidenceById.has(resource))) {
    set("file", null); set("evidence", null); resource = null; messages.push("File hoặc bằng chứng chưa có dữ liệu.");
  }
  if (resource) set("panel", "source");
  if (params.get("view") === "source") set("panel", "source");
  if (params.has("panel") && !["source", "history"].includes(params.get("panel")!)) set("panel", null);
  if (params.has("return") && !safeReturn(params.get("return"))) set("return", null);
  if (params.has("line")) {
    const line = Number(params.get("line"));
    const file = resource?.startsWith("file:") ? fileById.get(resource.slice(5)) : undefined;
    if (!Number.isInteger(line) || !file?.excerpts.some(part => line >= part.start && line < part.start + part.lines.length)) set("line", null);
  }
  for (const key of ["mode", "track", "view", "order", "stage", "section", "side"]) set(key, null);
  return { stepId, step, experience, checkId: params.get("check"), collapsed: params.get("collapsed") === "1", panel: params.get("panel"), historyId: params.get("history"), resource,
    line: params.has("line") ? Number(params.get("line")) : undefined, returnTo: safeReturn(params.get("return")), messages,
    corrected: changed ? params.toString() : null };
}
