import { useState } from "react";
import { journeys } from "./content/journeys";

export const PROGRESS_KEY = "backend-learning-workshop.learning.v1";
const validKeys = new Set(
  [
    ...journeys.filter(j => j.id !== "environment").flatMap((j) => j.steps.map((s) => `${j.id}:${s.id}`)),
    // Preserve legacy demo notes; never count/migrate them as real setup progress.
    ...["map", "prerequisites", "start", "check", "diagnose"].map(id => `environment:${id}`),
    // Keep old Policy demo notes; never migrate them into the sourced reading lesson.
    ...["input", "validate", "save", "read"].map(id => `policy:${id}`),
  ],
);
type Progress = { completed: string[]; notes: Record<string, string> };
function load(): Progress {
  try {
    const value: unknown = JSON.parse(
      localStorage.getItem(PROGRESS_KEY) ?? "null",
    );
    if (
      value &&
      typeof value === "object" &&
      "completed" in value &&
      Array.isArray(value.completed)
    ) {
      const notes: Record<string, string> = {};
      if ("notes" in value && value.notes && typeof value.notes === "object") {
        for (const [key, note] of Object.entries(value.notes))
          if (validKeys.has(key) && typeof note === "string") notes[key] = note;
      }
      return {
        completed: [
          ...new Set(
            value.completed.filter(
              (key): key is string =>
                typeof key === "string" && validKeys.has(key),
            ),
          ),
        ],
        notes,
      };
    }
  } catch {
    /* A malformed or unavailable store must not prevent learning. */
  }
  return { completed: [], notes: {} };
}
export function useProgress() {
  const [progress, setProgress] = useState(load);
  const [warning, setWarning] = useState("");
  function save(next: Progress) {
    setProgress(next);
    try {
      localStorage.setItem(PROGRESS_KEY, JSON.stringify(next));
      setWarning("");
    } catch {
      setWarning(
        "Trình duyệt chưa lưu được tiến độ. Bạn vẫn có thể học trong phiên này.",
      );
    }
  }
  return {
    ...progress,
    warning,
    toggle: (key: string) =>
      save({
        ...progress,
        completed: progress.completed.includes(key)
          ? progress.completed.filter((k) => k !== key)
          : [...progress.completed, key],
      }),
    note: (key: string, value: string) =>
      save({ ...progress, notes: { ...progress.notes, [key]: value } }),
    reset: () => save({ completed: [], notes: {} }),
  };
}
export type LearningProgress = ReturnType<typeof useProgress>;

export function useDemoPolicy() {
  const [name, setName] = useState("");
  const [operation, setOperation] = useState<"create" | "read">("create");
  const [record, setRecord] = useState<{
    id: string;
    holderName: string;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [fieldError, setFieldError] = useState("");
  const [error, setError] = useState("");
  const [failNext, setFailNext] = useState(false);
  const [exchange, setExchange] = useState<{
    request: object;
    response: object | null;
    operation: string;
  } | null>(null);
  const [result, setResult] = useState<typeof record>(null);
  function run() {
    if (loading) return;
    if (operation === "create" && !name.trim()) {
      setFieldError("Nhập tên bên mua minh họa.");
      document.getElementById("holderName")?.focus();
      return;
    }
    setFieldError("");
    setError("");
    setLoading(true);
    setResult(null);
    const op = operation === "create" ? "CREATE_POLICY" : "READ_POLICY";
    const request =
      operation === "create"
        ? { operation: op, body: { holderName: name.trim() } }
        : { operation: op, id: "POL-DEMO-001" };
    setExchange({ request, response: null, operation: op });
    const shouldFail = failNext;
    setFailNext(false);
    window.setTimeout(() => {
      setLoading(false);
      if (shouldFail) {
        setError(
          "Lỗi phản hồi được mô phỏng. Dữ liệu nhập vẫn được giữ; bạn có thể thử lại.",
        );
        setExchange({
          request,
          response: {
            status: "SIMULATED_ERROR",
            message: "Lỗi được chủ động tạo trong UI",
          },
          operation: op,
        });
        return;
      }
      const next =
        operation === "create"
          ? { id: "POL-DEMO-001", holderName: name.trim() }
          : record;
      if (!next) {
        setError(
          "Chưa có Policy mẫu. Chuyển sang Tạo Policy mẫu để tạo dữ liệu trước.",
        );
        setExchange({
          request,
          response: { status: "SIMULATED_NOT_FOUND" },
          operation: op,
        });
        return;
      }
      if (operation === "create") setRecord(next);
      setResult(next);
      setExchange({
        request,
        response: {
          status:
            operation === "create" ? "SIMULATED_CREATED" : "SIMULATED_READ",
          data: next,
        },
        operation: op,
      });
    }, 650);
  }
  return {
    name,
    setName,
    operation,
    setOperation,
    record,
    loading,
    fieldError,
    error,
    failNext,
    setFailNext,
    exchange,
    result,
    run,
  };
}
export type DemoPolicy = ReturnType<typeof useDemoPolicy>;
