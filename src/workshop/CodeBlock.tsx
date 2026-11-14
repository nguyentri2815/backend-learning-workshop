import { useEffect, useRef, useState } from "react";
import { createHighlighterCore } from "shiki/core";
import { createJavaScriptRegexEngine } from "shiki/engine/javascript";
import type { CSSProperties } from "react";
import { useCodeWrap } from "./code-preferences";
import type { CodeTheme } from "./code-preferences";
import {useWorkshopTheme} from '../appearance';
import type { CodeRow, SymbolRange } from "./source";
import styles from "./workshop.module.css";

const languages = {
  java: () => import("shiki/langs/java.mjs").then((m) => m.default),
  groovy: () => import("shiki/langs/groovy.mjs").then((m) => m.default),
  yaml: () => import("shiki/langs/yaml.mjs").then((m) => m.default),
  json: () => import("shiki/langs/json.mjs").then((m) => m.default),
  powershell: () => import("shiki/langs/powershell.mjs").then((m) => m.default),
  shellscript: () => import("shiki/langs/shellscript.mjs").then((m) => m.default),
  tsx: () => import("shiki/langs/tsx.mjs").then((m) => m.default),
  typescript: () => import("shiki/langs/typescript.mjs").then((m) => m.default),
  css: () => import("shiki/langs/css.mjs").then((m) => m.default),
  html: () => import("shiki/langs/html.mjs").then((m) => m.default),
  markdown: () => import("shiki/langs/markdown.mjs").then((m) => m.default),
};
const highlighter = createHighlighterCore({
  themes: [
    import("shiki/themes/github-light.mjs").then((m) => m.default),
    import("shiki/themes/dark-plus.mjs").then(({default:theme}) => ({
      ...theme, name:'workshop-dark',
      colors:{...theme.colors,'editor.background':'#1E1F22','editor.foreground':'#BCBEC4'},
      tokenColors:[...(theme.tokenColors??[]),
        {scope:['keyword','storage.type','storage.modifier','constant.language'],settings:{foreground:'#CF8E6D'}},
        {scope:'comment',settings:{foreground:'#92989F'}},
        {scope:'string',settings:{foreground:'#8DBF8B'}},
        {scope:'constant.numeric',settings:{foreground:'#7AABDB'}},
      ],
    })),
  ],
  langs: [],
  engine: createJavaScriptRegexEngine(),
});
type Token = { content: string; color?: string; fontStyle?: number };
export type CodeAnnotation = {start:number;end:number;label:string;tone:'caller'|'receiver'|'component'|'support';expression?:string};
const readingPositions = new Map<string, { top: number; left: number }>();
const revealedRequests = new Map<string,string>();
export function CodeBlock({
  rows,
  path,
  range,
  oldRange,
  diff = false,
  jump = 0,
  targetKey = "",
  autoFollow = true,
  onUserExplore,
  highlights,
  memoryKey,
  onLineSelect,
  preferTarget = false,
  symbolLinks,
  lineMarks,
  revealRequest,
  scrollAnchor,
  theme: requestedTheme,
  annotations,
  revealAncestors = false,
}: {
  rows: CodeRow[];
  path: string;
  range?: SymbolRange;
  oldRange?: SymbolRange;
  diff?: boolean;
  jump?: number;
  targetKey?: string;
  autoFollow?: boolean;
  onUserExplore?: () => void;
  highlights?: Array<{
    range: SymbolRange;
    purpose: "primary" | "related";
    occurrence?: "definition" | "use";
  }>;
  memoryKey?: string;
  onLineSelect?: (line: number) => void;
  preferTarget?: boolean;
  symbolLinks?: Array<{text: string; label: string; onClick: () => void}>;
  lineMarks?: {executed:number[];upcoming:number[];viewing:number[];current?:number[]};
  revealRequest?:string;
  scrollAnchor?:number;
  theme?:CodeTheme;
  annotations?:CodeAnnotation[];
  revealAncestors?:boolean;
}) {
  const [workshopTheme]=useWorkshopTheme();
  const theme=requestedTheme??workshopTheme;
  const [wrap] = useCodeWrap();
  const [tokens, setTokens] = useState<Token[][]>([]);
  const [tokenTheme,setTokenTheme] = useState<CodeTheme|''>('');
  const [error, setError] = useState("");
  const scroll = useRef<HTMLDivElement>(null);
  const previousJump = useRef(jump);
  const positioned = useRef(false);
  const code = rows.map((row) => row.text).join("\n");
  const language = path.endsWith(".java") ? "java"
    : path.endsWith(".gradle") ? "groovy"
    : /\.ya?ml$/.test(path) ? "yaml"
    : path.endsWith(".json") ? "json"
    : path.endsWith(".ps1") ? "powershell"
    : path.endsWith(".sh") ? "shellscript"
    : path.endsWith(".tsx")
    ? "tsx"
    : path.endsWith(".md")
      ? "markdown"
      : path.endsWith(".css")
        ? "css"
        : path.endsWith(".html")
          ? "html"
          : "typescript";
  useEffect(() => {
    let active = true;
    setError("");
    async function render() {
      const engine = await highlighter;
      if (!engine.getLoadedLanguages().includes(language))
        await engine.loadLanguage(languages[language]());
      const result = engine.codeToTokens(code, {
        lang: language,
        theme: theme === 'dark' ? 'workshop-dark' : 'github-light',
      });
      if (active) { setTokens(result.tokens); setTokenTheme(theme); }
    }
    render().catch((reason: unknown) => {
      if (active)
        setError(
          reason instanceof Error
            ? reason.message
            : "Không nạp được màu cú pháp",
        );
    });
    return () => {
      active = false;
    };
  }, [code, language, theme]);
  useEffect(() => {
    const requested=Boolean(revealRequest&&memoryKey&&revealedRequests.get(memoryKey)!==revealRequest);
    const explicit = previousJump.current !== jump||requested;
    previousJump.current = jump;
    if (!autoFollow && !explicit && positioned.current) return;
    const container = scroll.current;
    if (!container) return;
    let pending = true;
    const reveal = () => {
      const target =
        (scrollAnchor?container.querySelector<HTMLElement>(`[data-line="${scrollAnchor}"]`):null) ??
        container.querySelector<HTMLElement>('[data-focus-line="true"]') ??
        container.querySelector<HTMLElement>('[data-explained="true"]');
      const saved =
        memoryKey && !explicit && !preferTarget ? readingPositions.get(memoryKey) : undefined;
      if (
        !pending ||
        !container.clientHeight ||
        (!saved && !target?.offsetHeight)
      )
        return;
      const expression=target?.querySelector<HTMLElement>('[data-expression-tone]');
      container.scrollTo({
        left: saved?.left ?? (expression?Math.max(0,container.scrollLeft+expression.getBoundingClientRect().left-container.getBoundingClientRect().left-container.clientWidth/3):0),
        top:
          saved?.top ??
          container.scrollTop +
            (target?.getBoundingClientRect().top ??
              container.getBoundingClientRect().top) -
            container.getBoundingClientRect().top -
            container.clientHeight / 3,
        behavior: "instant",
      });
      if (revealAncestors && !saved) (expression ?? target)?.scrollIntoView({block:'nearest',inline:'nearest',behavior:'instant'});
      positioned.current = true;
      if(revealRequest&&memoryKey)revealedRequests.set(memoryKey,revealRequest);
      pending = false;
    };
    reveal();
    if (pending) {
      const observer = new ResizeObserver(reveal);
      observer.observe(container);
      return () => observer.disconnect();
    }
  }, [
    jump,
    targetKey,
    path,
    range?.qualified,
    range?.start,
    range?.end,
    diff,
    autoFollow,
    memoryKey,
    preferTarget,
    tokens.length,
    code,
    revealRequest,
    scrollAnchor,
    revealAncestors,
  ]);
  return (
    <div
      className={`${styles.codeScroll} ${wrap ? styles.codeWrap : ""}`}
      data-wrap={wrap}
      data-code-theme={theme}
      ref={scroll}
      tabIndex={0}
      aria-label="Vùng code có thể cuộn"
      data-testid="code-scroll"
      onScroll={(event) => {
        if (memoryKey)
          readingPositions.set(memoryKey, {
            top: event.currentTarget.scrollTop,
            left: event.currentTarget.scrollLeft,
          });
      }}
      onWheel={onUserExplore}
      onTouchMove={onUserExplore}
      onPointerDown={(event) => {
        if (
          event.clientX >=
          event.currentTarget.getBoundingClientRect().right - 18
        )
          onUserExplore?.();
      }}
      onKeyDown={(event) => {
        if (
          [
            "PageUp",
            "PageDown",
            "Home",
            "End",
            "ArrowUp",
            "ArrowDown",
          ].includes(event.key)
        )
          onUserExplore?.();
      }}
    >
      {error && (
        <p role="alert" className={styles.codeWarning}>
          Màu cú pháp chưa sẵn sàng: {error}. Code nguyên văn bên dưới.
        </p>
      )}
      <div
        className={styles.codeLines}
        data-testid="highlighted-code"
        data-ready={tokens.length > 0}
        data-syntax-theme={tokenTheme}
      >
        {rows.map((row, i) => {
          const line = row.line ?? row.newLine;
          const annotationsHere=annotations?.filter(a=>line!==undefined&&line>=a.start&&line<=a.end)??[];
          const expressionRanges=annotationsHere.flatMap(a=>{
            const start=a.expression?row.text.indexOf(a.expression):-1;
            return start<0?[]:[{start,end:start+a.expression!.length,annotation:a}];
          });
          let tokenOffset=0;
          const highlight =
            highlights?.find(
              (h) =>
                h.purpose === "primary" &&
                line &&
                line >= h.range.start &&
                line <= h.range.end,
            ) ??
            highlights?.find(
              (h) => line && line >= h.range.start && line <= h.range.end,
            );
          const explained = highlights
            ? Boolean(highlight)
            : Boolean(
                range && line && line >= range.start && line <= range.end,
              ) ||
              Boolean(
                row.kind === "remove" &&
                  oldRange &&
                  row.oldLine &&
                  row.oldLine >= oldRange.start &&
                  row.oldLine <= oldRange.end,
              );
          return (
            <div
              key={i}
              className={`${styles.codeLine} ${diff ? styles.diffLine : ""} ${row.kind ? styles[row.kind] : ""} ${explained ? styles.explained : ""}`}
              data-line={row.line}
              data-old-line={row.oldLine}
              data-new-line={row.newLine}
              data-explained={explained}
              data-highlight={highlight?.purpose}
              data-occurrence={highlight?.occurrence}
              data-focus-line={Boolean(range && line === range.start)}
              data-executed={Boolean(line&&lineMarks?.executed.includes(line))}
              data-upcoming={Boolean(line&&lineMarks?.upcoming.includes(line))}
              data-viewing={Boolean(line&&lineMarks?.viewing.includes(line))}
              data-current={Boolean(line&&lineMarks?.current?.includes(line))}
              data-code-tone={annotationsHere[0]?.tone}
              onClick={onLineSelect && line ? () => onLineSelect(line) : undefined}
              title={
                annotationsHere[0]?.label ?? (explained
                  ? `Đang giải thích: ${range?.name ?? oldRange?.name}`
                  : undefined)
              }
            >
              {lineMarks&&<span className={styles.executionMark} title={[line&&lineMarks.executed.includes(line)?'Đã chạy':'',line&&lineMarks.current?.includes(line)?'Đang dừng':'',line&&lineMarks.upcoming.includes(line)?'Sắp chạy':'',line&&lineMarks.viewing.includes(line)?'Đang xem':''].filter(Boolean).join(' · ')}>{line&&lineMarks.current?.includes(line)?'◆':<>{line&&lineMarks.executed.includes(line)?'✓':''}{line&&lineMarks.upcoming.includes(line)?'▶':''}{line&&lineMarks.viewing.includes(line)?'●':''}</>}</span>}
              {diff ? (
                <>
                  <span className={styles.lineNumber} aria-hidden>
                    {row.oldLine ?? ""}
                  </span>
                  <span className={styles.lineNumber} aria-hidden>
                    {row.newLine ?? ""}
                  </span>
                  <span className={styles.diffSign} aria-hidden>
                    {row.kind === "add"
                      ? "+"
                      : row.kind === "remove"
                        ? "−"
                        : ""}
                  </span>
                </>
              ) : (
                onLineSelect && row.line ? <button className={`${styles.lineNumber} practice-line-button`} aria-label={`Chọn dòng ${row.line}`} aria-pressed={Boolean(range && row.line >= range.start && row.line <= range.end)}>{row.line}</button> : <span className={styles.lineNumber} aria-hidden>{row.line}</span>
              )}
              <code
                data-testid="source-line"
                style={
                  {
                    "--source-indent": `${Math.min(24, row.text.match(/^\s*/)?.[0].length ?? 0) + 2}ch`,
                  } as CSSProperties
                }
              >
                {tokens[i]
                  ? tokens[i].map((token, j) => {
                    const offset=tokenOffset;tokenOffset+=token.content.length;
                    const boundaries=[...new Set([0,token.content.length,...expressionRanges.flatMap(r=>[r.start-offset,r.end-offset]).filter(n=>n>0&&n<token.content.length)])].sort((a,b)=>a-b);
                    const marked=expressionRanges.length?boundaries.slice(0,-1).map((from,k)=>{
                      const value=token.content.slice(from,boundaries[k+1]);
                      const range=expressionRanges.find(r=>offset+from>=r.start&&offset+from<r.end);
                      return range?<mark key={k} className={styles.expressionMark} data-expression-tone={range.annotation.tone} title={range.annotation.label}>{value}</mark>:value;
                    }):undefined;
                    return (
                      <span
                        key={j}
                        style={{
                          color: token.color,
                          fontStyle:
                            token.fontStyle && token.fontStyle & 1
                              ? "italic"
                              : undefined,
                          fontWeight:
                            token.fontStyle && token.fontStyle & 2
                              ? 600
                              : undefined,
                        }}
                      >
                        {marked??(symbolLinks?.some(link => token.content.includes(link.text))
                          ? (() => {
                              const link = symbolLinks.find(item => token.content.includes(item.text))!;
                              const parts = token.content.split(link.text);
                              return parts.flatMap((part, index) => index === 0 ? [part] : [<button type="button" className="source-symbol-link" key={index} aria-label={link.label} onClick={event => {event.stopPropagation(); link.onClick();}}>{link.text}</button>, part]);
                            })()
                          : token.content)}
                      </span>
                    );})
                  : row.text}
              </code>
            </div>
          );
        })}
      </div>
    </div>
  );
}
