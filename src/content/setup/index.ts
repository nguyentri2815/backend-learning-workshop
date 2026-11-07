import type { Journey } from "../model";
import { historySteps, setupSteps, stages } from "./history";
import { evidence, gaps } from "./evidence";
import { setupFiles } from "./files";
import { instructions } from "./runbooks";
import { actionSteps } from "./action-guide";
export { historySteps, setupSteps, stages, evidence, gaps, setupFiles, instructions };
export const stepById = new Map(historySteps.map(s => [s.id, s]));
export const instructionById = new Map(instructions.map(s => [s.id, s]));
export const fileById = new Map(setupFiles.map(f => [f.id, f]));
export const evidenceById = new Map(evidence.map(e => [e.id, e]));
export const gapById = new Map(gaps.map(g => [g.id, g]));

// Adapter only for the existing shell/cards. Setup has its own rich model/view.
export const setupJourney: Journey = {
  id: "environment", number: "01", title: "Hiểu và chạy dự án", subtitle: "Làm từng bước, biết cách tự kiểm tra",
  duration: "7 bước · 23 thao tác", state: "verified",
  summary: "Từ source đã có đến task đầu tiên: mở từng thao tác, làm theo và kiểm tra kết quả.",
  outcome: "Biết bắt đầu ở đâu, làm gì tiếp và tìm đúng nơi kiểm tra khi lỗi.", files: [],
  steps: actionSteps.map(step => ({ id: step.id, title: step.title, short: step.shortTitle, goal: step.goal, why: step.goal, expected: step.checks[0].done, check: step.checks[0].how.map(item => item.text).join(" "), practice: step.goal, evidence: "Lịch sử và source nằm trong phần chi tiết của bước.", file: "", explanation: step.goal })),
};

export function validateSetupData(): string[] {
  const errors: string[] = [];
  const check = (condition: boolean, description: string) => { if (!condition) errors.push(description); };
  for (const [name, items] of [["step", historySteps], ["instruction", instructions], ["file", setupFiles], ["evidence", evidence], ["gap", gaps]] as const)
    check(new Set(items.map(x => x.id)).size === items.length, `Duplicate ${name} ID`);
  check(historySteps.length === 19 && historySteps.every((s,i) => s.id === `S${String(i).padStart(2,"0")}`), "Timeline must preserve S00–S18");
  check(stages.flatMap(s => s.steps).length === 16 && new Set(stages.flatMap(s => s.steps)).size === 16, "Stage coverage");
  for (const step of historySteps) {
    check((step.stage === null) === ["S14", "S15", "S16"].includes(step.id), `Outside setup: ${step.id}`);
    for (const id of step.fileIds) check(fileById.has(id), `Missing file ${id}`);
    for (const id of [...step.evidenceIds, ...[step.before, step.problem, step.decision, step.result].flatMap(x => x.evidenceIds), ...step.actions.flatMap(x => x.evidenceIds)]) check(evidenceById.has(id), `Missing evidence ${id}`);
    for (const id of step.gapIds) check(gapById.has(id), `Missing gap ${id}`);
    if (step.runbookId) check(instructionById.has(step.runbookId), `Missing runbook ${step.runbookId}`);
    for (const id of step.related) check(stepById.has(id), `Missing related step ${id}`);
    for (const action of step.actions) check((action.actor === "Chưa xác định") === (action.certainty === "unknown"), `Actor certainty ${step.id}`);
  }
  for (const instruction of instructions) {
    for (const id of instruction.fileIds) check(fileById.has(id), `Instruction file ${id}`);
    for (const id of instruction.historyIds) check(stepById.has(id), `Instruction history ${id}`);
    for (const id of instruction.gapIds) check(gapById.has(id), `Instruction gap ${id}`);
    check(Boolean(instruction.place && instruction.expected && instruction.onError), `Instruction fields ${instruction.id}`);
    for (const command of instruction.commands) {
      check(command.role === "rerun" && command.fidelity === "proposed" && Boolean(command.cwd), `Command provenance ${command.id}`);
      check(!/bootRun|docker\s+(?:run|start)|\bup\s+-d|Invoke-RestMethod.*-Method\s+Post/i.test(command.text), `Unconfirmed startup command ${command.id}`);
      for (const id of command.evidenceIds) check(evidenceById.has(id), `Command evidence ${id}`);
    }
    if (instruction.readiness === "missing-input") check(instruction.commands.every(c => /^(docker ps|Get-)/.test(c.text)), `Blocked startup ${instruction.id}`);
  }
  for (const file of setupFiles) {
    check(evidenceById.has(file.evidenceId), `File evidence ${file.id}`);
    check(file.excerpts.length > 0 && file.excerpts.every(x => x.start > 0), `Excerpt lines ${file.id}`);
    for (const excerpt of file.excerpts) if (excerpt.evidenceId) check(evidenceById.has(excerpt.evidenceId), `Excerpt evidence ${file.id}`);
  }
  for (const item of evidence) {
    if (item.fileId) check(fileById.has(item.fileId), `Evidence file ${item.id}`);
    for (const id of item.relatedIds) check(id.startsWith("file:") ? fileById.has(id.slice(5)) : evidenceById.has(id), `Evidence relation ${id}`);
  }
  return errors;
}
