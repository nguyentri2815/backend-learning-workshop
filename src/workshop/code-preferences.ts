import { useSyncExternalStore } from "react";
import {useWorkshopTheme} from '../appearance';

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

export type CodeTheme = 'light' | 'dark';
export type CodeThemePreference = 'system' | CodeTheme;
const themeKey = 'backend-learning-workshop.policy.code-theme.v1';
let themeFallback: CodeThemePreference = 'system';
let themeStorageFailed=false;
const readTheme = (): CodeThemePreference => {
  if(themeStorageFailed)return themeFallback;
  try { const stored=localStorage.getItem(themeKey); return stored==='dark'||stored==='light'?stored:'system'; }
  catch { return themeFallback; }
};
export function usePolicyCodeTheme() {
  const preference = useSyncExternalStore(subscribe, readTheme);
  const [workshopTheme]=useWorkshopTheme();
  return [preference==='system'?workshopTheme:preference, (value: CodeThemePreference) => {
    themeFallback = value;
    try { localStorage.setItem(themeKey, value); } catch { themeStorageFailed=true; }
    window.dispatchEvent(new Event(event));
  },preference] as const;
}
