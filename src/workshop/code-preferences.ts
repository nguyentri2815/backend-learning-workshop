import { useSyncExternalStore } from "react";

const key = "backend-learning-workshop.code.wrap.v1";
const event = "backend-learning:code-preference";
let fallback = true;
const read = () => {
  try {
    const stored = localStorage.getItem(key);
    return stored === null ? fallback : stored !== "false";
  } catch {
    return fallback;
  }
};
function subscribe(listener: () => void) {
  window.addEventListener(event, listener);
  window.addEventListener("storage", listener);
  return () => {
    window.removeEventListener(event, listener);
    window.removeEventListener("storage", listener);
  };
}
export function useCodeWrap() {
  const wrap = useSyncExternalStore(subscribe, read);
  return [
    wrap,
    (value: boolean) => {
      fallback = value;
      try {
        localStorage.setItem(key, String(value));
      } catch {
        /* Viewer remains usable without storage. */
      }
      window.dispatchEvent(new Event(event));
    },
  ] as const;
}
