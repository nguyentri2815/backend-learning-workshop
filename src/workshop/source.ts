import { structuredPatch } from "diff";

export interface SymbolRange {
  name: string;
  qualified: string;
  start: number;
  end: number;
}
export interface CodeRow {
  text: string;
  line?: number;
  oldLine?: number;
  newLine?: number;
  kind?: "add" | "remove" | "context" | "hunk";
}
export function diffRows(
  path: string,
  before: string,
  after: string,
  full = true,
): CodeRow[] {
  return structuredPatch(path, path, before, after, "", "", {
    context: full ? Number.MAX_SAFE_INTEGER : 3,
  }).hunks.flatMap((hunk) => {
    let oldLine = hunk.oldStart;
    let newLine = hunk.newStart;
    const rows: CodeRow[] = [
      {
        kind: "hunk",
        text: `@@ −${hunk.oldStart},${hunk.oldLines} +${hunk.newStart},${hunk.newLines} @@`,
      },
    ];
    for (const line of hunk.lines) {
      if (line.startsWith("+"))
        rows.push({ text: line.slice(1), newLine: newLine++, kind: "add" });
      else if (line.startsWith("-"))
        rows.push({ text: line.slice(1), oldLine: oldLine++, kind: "remove" });
      else if (line.startsWith(" "))
        rows.push({
          text: line.slice(1),
          oldLine: oldLine++,
          newLine: newLine++,
          kind: "context",
        });
    }
    return rows;
  });
}
export function sourceRows(
  code: string,
  range?: SymbolRange,
  related = false,
): CodeRow[] {
  const lines = code.split(/\r?\n/);
  if (lines.at(-1) === "") lines.pop();
  const start = related && range ? range.start : 1;
  const end = related && range ? range.end : lines.length;
  return lines
    .slice(start - 1, end)
    .map((text, offset) => ({ text, line: start + offset }));
}
