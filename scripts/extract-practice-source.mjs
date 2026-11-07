import { readFile, writeFile, stat } from "node:fs/promises";
import { resolve } from "node:path";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";

// Read-only on the Java repo. Only selected, sanitized lines enter the frontend.
const root = "D:/ALPACA/agent-system";
const commandRoot = "workspaces/agent-service/1-agent-command-service";
const sha = value => createHash("sha256").update(value).digest("hex");
function revision(cwd) {
  try { return execFileSync("git", ["--no-optional-locks", "rev-parse", "HEAD"], {cwd, encoding:"utf8", stdio:["ignore","pipe","ignore"]}).trim(); }
  catch { return null; }
}
const revisions = { workspace: revision(root), command: revision(resolve(root,"workspaces/agent-service")) };
async function source(id, path, select, redact = text => text) {
  const content = await readFile(resolve(root,path),"utf8");
  const metadata = await stat(resolve(root,path));
  const all = content.replace(/\r\n/g,"\n").split("\n");
  const rows = all.flatMap((text,i) => select(text,i+1) ? [{line:i+1,text:redact(text,i+1)}] : []);
  return {id,path,sourceRoot:root,sourceSha256:sha(content),revision:path.startsWith("workspaces/agent-service/") ? revisions.command : revisions.workspace,lastModified:metadata.mtime.toISOString(),rows};
}
const settings = await source("settings","settings.gradle",()=>true);
const build = await source("build","build.gradle",(_,line)=>(line>=19 && line<=28)||(line>=33 && line<=50));
const wrapper = await source("wrapper","gradlew.bat",(_,line)=>line>=18 && line<=30);
const cloneTargets=[];
function maskClone(text,line,allowOther=false) {
  const match=text.match(/^\s*git\s+clone\s+(\S+)\s+(\S+)\s*$/);
  if (!match) throw Error(`Unexpected clone syntax at line ${line}; review before export.`);
  const group=match[1].includes("agent-system/") ? "agent-system" : match[1].includes("sale-system/") ? "sale-system" : "unknown";
  if (group==="unknown" && !allowOther) throw Error("Unrecognized repository group; refusing export.");
  if (group==="agent-system") cloneTargets.push({line,path:match[2],group});
  return `git clone [nguồn repo ${group === "unknown" ? "nhóm khác" : group} đã che] ${match[2]}`;
}
const clone = await source("clone","git-cmd.sh",text=>/^\s*git\s+clone\s/.test(text),maskClone);
const alternate = await source("alternate","init-shared.sh",text=>/^\s*git\s+clone\s/.test(text),(text,line)=>maskClone(text,line,true));
const modulePaths=settings.rows.flatMap(row=>{
  const match=row.text.match(/^include\s+'([^']+)'/);
  if (!match) return [];
  const path=match[1].replaceAll(":","/");
  const owner=cloneTargets.find(target=>path===target.path||path.startsWith(target.path+"/"));
  return [{line:row.line,declaration:match[1],path,cloneLine:owner?.line??null,repoPath:owner?.path??null,reportedAfter:!path.endsWith("/swagger-service")&&Boolean(owner),presentNow:false}];
});
for (const item of modulePaths) {
  try { item.presentNow=(await stat(resolve(root,item.path))).isDirectory(); } catch { /* Absent on disk. */ }
}
// Config export is allowlist based: all connection strings/identities are replaced.
async function config(id,name) {
  const path=`${commandRoot}/src/main/resources/${name}`;
  const raw=(await readFile(resolve(root,path),"utf8")).replace(/\r\n/g,"\n").split("\n");
  const selected = new Set();
  const important = /^\s*(server|spring|datasource|jpa|hibernate|hikari|default_schema|ddl-auto|connection-init-sql|alpaca|local|profiles|active|include|group|config|import):/;
  let inDatasource=false;
  for (let i=0;i<raw.length;i++) {
    const text=raw[i];
    if (/^\s{2}datasource:/.test(text)) inDatasource=true;
    else if (inDatasource && /^\s{0,2}\S/.test(text)) inDatasource=false;
    if (important.test(text)||inDatasource||(/^\s+port:/.test(text)&&i<6)) selected.add(i+1);
  }
  const file=await source(id,path,(_,line)=>selected.has(line),(text)=>{
    if (/^\s*(url|jdbc-url):/.test(text)) return text.replace(/:.*/,id==="dev" ? ": [đã che; localhost; DB alpaca-event; không ghi port]" : ": [đã che; PostgreSQL remote; chưa xác nhận cho local]");
    if (/^\s*(username|password|user|secret|token|driver-class-name):/.test(text) && !/driver-class-name/.test(text)) return text.replace(/:.*/,": [đã che]");
    if (/https?:\/\/|jdbc:|secret|password|token|credential/i.test(text)) throw Error("Unexpected sensitive line in config allowlist; refusing export.");
    return text;
  });
  file.profileActivationLines=raw.flatMap((text,i)=>/profiles:|spring\.profiles\.active/.test(text)?[i+1]:[]);
  return file;
}
const commandBuild=await source("command-build",`${commandRoot}/build.gradle`,text=>/^(dependencies|\})|implementation project|apply plugin/.test(text.trim()));
const files=[settings,build,wrapper,clone,alternate,commandBuild,await config("default","application.yml"),await config("dev","application-dev.yml")];
const report=await readFile("D:/tmp/agent-service-workspaces-setup-evidence-report.md","utf8");
const data={
  extractedAt:new Date().toISOString(),revisions,
  report:{path:"D:/tmp/agent-service-workspaces-setup-evidence-report.md",date:"2026-11-04",sha256:sha(report),sections:["S00","S02","S03","S17"]},
  limits:"Tái dựng theo báo cáo, không có snapshot nguyên bản đầy đủ. Source trích từ file hiện tại, có thể khác lịch sử; không phải cấu hình/runtime đã kiểm chứng.",
  redactions:["Che toàn bộ URL Git và connection string, giữ namespace/target cần học.","Che username/password và chỉ trích các khóa cấu hình thuộc allowlist; giữ số dòng gốc."],
  files,cloneTargets,modulePaths,
};
await writeFile(resolve(import.meta.dirname,"../src/content/setup/practice-source.json"),JSON.stringify(data,null,2)+"\n");
console.log(`Exported ${files.length} sanitized excerpts, ${modulePaths.length} declarations, ${cloneTargets.length} clone targets. No Java/scripts executed.`);
