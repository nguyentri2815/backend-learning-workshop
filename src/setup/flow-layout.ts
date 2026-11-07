import type { ActionStepId } from "../content/setup/action-guide";

// Proposed reading order, not a hard startup dependency graph.
export const guidePositions: Record<ActionStepId, { x: number; y: number }> = {
  source: { x: 20, y: 25 },
  tools: { x: 285, y: 25 },
  config: { x: 285, y: 160 },
  dependencies: { x: 20, y: 160 },
  build: { x: 20, y: 295 },
  run: { x: 285, y: 295 },
  ready: { x: 285, y: 430 },
};
export const guideConnections: { from: ActionStepId; to: ActionStepId; fromSide: "right" | "bottom" | "left"; toSide: "left" | "top" | "right" }[] = [
  { from: "source", to: "tools", fromSide: "right", toSide: "left" },
  { from: "tools", to: "config", fromSide: "bottom", toSide: "top" },
  { from: "config", to: "dependencies", fromSide: "left", toSide: "right" },
  { from: "dependencies", to: "build", fromSide: "bottom", toSide: "top" },
  { from: "build", to: "run", fromSide: "right", toSide: "left" },
  { from: "run", to: "ready", fromSide: "bottom", toSide: "top" },
];
export const guidePrerequisites: Record<ActionStepId, string> = {
  source: "Đối chiếu module định làm với source đã clone.",
  tools: "Đọc yêu cầu toolchain/wrapper của source trước khi chọn JDK.",
  config: "Chọn module theo task rồi đối chiếu profile và mục tiêu kết nối.",
  dependencies: "Cần Engine, owner/tên/cổng và topology đã xác nhận trước khi start.",
  build: "Đủ source module và JDK phù hợp; infra được chuẩn bị cho bước chạy app.",
  run: "Cần cấu hình, package và tập dependency phù hợp với task; chưa rõ thì xác minh trước.",
  ready: "Chốt phạm vi task và mức kiểm tra cần đạt, không chỉ dựa vào build/port.",
};
