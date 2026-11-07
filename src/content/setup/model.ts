export type Basis = "history" | "report-check" | "source" | "inference" | "gap";
export type TrackId = "first" | "daily" | "build" | "diagnose";
export type Operation = "Đọc file" | "Clone" | "Đổi môi trường" | "Build" | "Chạy" | "Kiểm tra" | "Hướng dẫn";
export interface Statement {
  text: string;
  basis: Basis;
  evidenceIds: string[];
}
export interface Action {
  text: string;
  kind: Operation;
  actor: "Agent" | "Người dùng" | "Chưa xác định";
  certainty: "explicit" | "unknown";
  evidenceIds: string[];
}
export interface Command {
  id: string;
  role: "historical" | "rerun";
  execution: "recorded" | "recommendation-or-recording-ambiguous" | "not-rerun";
  text: string;
  fidelity: "exact" | "proposed";
  shell: "PowerShell" | "Git Bash";
  cwd: string;
  condition: string;
  effect: string;
  evidenceIds: string[];
}
export interface Evidence {
  id: string;
  title: string;
  basis: Basis;
  locator: string;
  originalTags: string[];
  recordedOn: "2026-11-04";
  eventTime: string;
  presentation: "report-summary" | "source-excerpt" | "metadata" | "explanation";
  text: string;
  limits: string;
  fileId?: string;
  relatedIds: string[];
}
export interface SetupFile {
  id: string;
  path: string;
  role: string;
  symbol?: string;
  evidenceId: string;
  excerpts: { start: number; lines: string[]; evidenceId?: string }[];
}
export interface Gap {
  id: string;
  title: string;
  missing: string;
  affects: string[];
  check: string;
  owner: string;
}
export interface SetupStep {
  id: string;
  title: string;
  stage: string | null;
  intent: ("Setup" | "Xử lý lỗi" | "Kiểm chứng")[];
  before: Statement;
  problem: Statement;
  actions: Action[];
  decision: Statement;
  result: Statement;
  after: string;
  selfCheck: string;
  expected: string;
  onError: string;
  fileIds: string[];
  evidenceIds: string[];
  gapIds: string[];
  command?: Command;
  commandNote?: string;
  renderer: "tree" | "versions" | "docker" | "build" | "runtime" | "explanation";
  runbookId?: string;
  related: string[];
}
export interface Stage {
  id: string;
  title: string;
  question: string;
  outcome: string;
  steps: string[];
}
export interface Instruction {
  id: string;
  track: TrackId;
  title: string;
  place: string;
  action: string;
  why: string;
  expected: string;
  onError: string;
  effect: string;
  readiness: "source-checked" | "conditional" | "missing-input";
  conditions: string[];
  commands: Command[];
  historyIds: string[];
  fileIds: string[];
  gapIds: string[];
}
export const basisLabels: Record<Basis, string> = {
  history: "Lịch sử theo báo cáo [H]",
  "report-check": "Đối chiếu khi lập báo cáo [F]",
  source: "Source đối chiếu khi thiết kế",
  inference: "Suy luận",
  gap: "Chưa đủ bằng chứng",
};
export const JAVA_ROOT = "D:\\ALPACA\\agent-system";
export const REPORT_NAME = "agent-service-workspaces-setup-evidence-report.md";
