import { readdir, readFile, writeFile, mkdir } from "node:fs/promises";
import { resolve, relative } from "node:path";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";

const project = resolve(import.meta.dirname, "..");
const parent = resolve(project, "..");
const baseline = resolve(project, ".verification/originals.json");
const excluded = new Set([
  ".git",
  "node_modules",
  "dist",
  "test-results",
  "playwright-report",
  ".vite",
  ".verification",
]);
async function snapshot(root) {
  const directories = [root];
  const paths = [];
  const files = {};
  while (directories.length) {
    const batch = directories.splice(0, 32);
    await Promise.all(batch.map(async dir => {
      for (const entry of await readdir(dir, { withFileTypes: true })) {
        if (excluded.has(entry.name) || entry.name.startsWith(".env")) continue;
        const path = resolve(dir, entry.name);
        if (entry.isDirectory()) directories.push(path);
        else if (entry.isFile()) paths.push(path);
      }
    }));
  }
  for (let offset = 0; offset < paths.length; offset += 64) {
    await Promise.all(paths.slice(offset, offset + 64).map(async path => {
      files[relative(root, path)] = createHash("sha256").update(await readFile(path)).digest("hex");
    }));
  }
  return files;
}
const current = {};
for (const name of ["quotation-product", "quotation-workshop"]) {
  const root = resolve(parent, name);
  current[name] = {
    status: execFileSync(
      "git",
      ["status", "--porcelain=v1", "--untracked-files=all"],
      { cwd: root, encoding: "utf8" },
    ),
    files: await snapshot(root),
  };
}
if (process.argv.includes("--capture")) {
  await mkdir(resolve(project, ".verification"), { recursive: true });
  await writeFile(baseline, JSON.stringify(current, null, 2));
  console.log(
    "Captured original status and content hashes:",
    Object.values(current).map((x) => Object.keys(x.files).length),
  );
} else {
  const previous = JSON.parse(await readFile(baseline, "utf8"));
  let changed = false;
  for (const name of Object.keys(current)) {
    const previousFiles = Object.keys(previous[name].files).filter(path => !path.split(/[\\/]/).some(segment => excluded.has(segment) || segment.startsWith(".env")));
    const keys = new Set([
      ...Object.keys(current[name].files),
      ...previousFiles,
    ]);
    const differences = [...keys].filter(
      (key) => current[name].files[key] !== previous[name].files[key],
    );
    const sameStatus = current[name].status === previous[name].status;
    console.log(
      `${name}: ${keys.size} files checked; ${differences.length} changed files; working-tree status ${sameStatus ? "unchanged" : "changed"}`,
    );
    if (differences.length || !sameStatus) changed = true;
  }
  if (changed) process.exitCode = 1;
}
