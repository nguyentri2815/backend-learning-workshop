import { evidenceById, fileById, instructionById, stepById } from "../content/setup";
import type { TrackId } from "../content/setup/model";
export type Mode = "history" | "rerun";
export type SetupView = "result" | "source" | "practice";
const path = "/journey/environment";
export const aliases: Record<string, string | null> = { map: null, prerequisites: "S04", start: "S07", check: "S11", diagnose: "S12" };
export function safeReturn(value: string | null): string | null {
  if (!value || value.length > 16000 || !value.startsWith(path + "?") && value !== path) return null;
  try { const url = new URL(value, "http://local.invalid"); return url.origin === "http://local.invalid" && url.pathname === path ? value : null; } catch { return null; }
}
export function parseSetup(search: string) {
  const params = new URLSearchParams(search);
  const notices: string[] = [];
  let changed = false;
  const set = (key: string, value: string | null) => { if (params.get(key) !== value) { changed = true; if (value === null) params.delete(key); else params.set(key, value); } };
  const mode: Mode = params.get("mode") === "rerun" ? "rerun" : "history";
  if (params.has("mode") && !["history", "rerun"].includes(params.get("mode")!)) { set("mode", "history"); notices.push("Chế độ không hợp lệ; đang mở lịch sử."); }
  let id = params.get("step");
  if (id && Object.hasOwn(aliases, id)) { const alias = aliases[id]; set("step", alias); set("section", alias ? "detail" : "overview"); set("file", null); set("side", null); set("evidence", null); id = alias; notices.push("Liên kết bài minh họa cũ đã chuyển sang nội dung có bằng chứng; tiến độ cũ không được chuyển theo."); }
  const historyStep = mode === "history" && id ? stepById.get(id) : undefined;
  const instruction = mode === "rerun" && id ? instructionById.get(id) : undefined;
  if (id && !historyStep && !instruction) { set("step", null); set("section", "overview"); set("file", null); set("evidence", null); set("return", null); notices.push("Bước chưa có dữ liệu. Đang mở toàn cảnh."); }
  const track: TrackId = instruction?.track ?? (["first", "daily", "build", "diagnose"].includes(params.get("track") ?? "") ? params.get("track") as TrackId : "daily");
  if (mode === "rerun" && params.has("track") && params.get("track") !== track) set("track", track);
  if (historyStep?.stage && params.has("stage") && params.get("stage") !== historyStep.stage) set("stage", historyStep.stage);
  let view: SetupView = ["source", "practice"].includes(params.get("view") ?? "") ? params.get("view") as SetupView : "result";
  let resource = params.has("file") ? `file:${params.get("file")}` : params.get("evidence");
  if (resource && !(resource.startsWith("file:") ? fileById.has(resource.slice(5)) : evidenceById.has(resource))) {
    set("file", null); set("evidence", null); set("line", null); set("return", null); resource = null; notices.push("File hoặc bằng chứng chưa có dữ liệu. Ngữ cảnh bước được giữ lại.");
  }
  if (params.has("side")) { if (params.get("side") !== "after") notices.push("Nguồn setup chỉ có đoạn đã đối chiếu, chưa có hai snapshot để xem Diff/Before."); set("side", null); }
  if (params.has("return") && !safeReturn(params.get("return"))) { set("return", null); notices.push("Đã bỏ điểm quay lại không hợp lệ."); }
  if (params.has("line")) {
    const n = Number(params.get("line"));
    const f = resource?.startsWith("file:") ? fileById.get(resource.slice(5)) : undefined;
    if (!Number.isInteger(n) || !f?.excerpts.some(x => n >= x.start && n < x.start + x.lines.length)) { set("line", null); notices.push("Dòng không nằm trong đoạn trích đã công bố."); }
  }
  if (!historyStep && !instruction && view === "practice") { view = "result"; set("view", "result"); }
  return { mode, historyStep, instruction, track, view, resource, order: params.get("order") === "timeline" ? "timeline" : "stages", line: params.has("line") ? Number(params.get("line")) : undefined, returnTo: safeReturn(params.get("return")), notices, corrected: changed ? params.toString() : null };
}
