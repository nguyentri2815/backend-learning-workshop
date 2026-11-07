import { ChevronDown, ChevronRight, FileCode2, Folder, FolderOpen } from "lucide-react";
import { commandPath, parents, practiceFiles, practiceSource, runtimeSource } from "./project-practice-model";
import {buildDirectory,classesDirectory,hasJar} from "./execution-model";
import { isRuntimeTask } from "./practice-runtime-model";
import type { PracticeContext } from "./project-practice-model";

interface Entry { path: string; file?: string; missing?: boolean; fresh?: boolean; generated?:boolean }
export function practiceEntries(context: PracticeContext): Entry[] {
  const entries=new Map<string,Entry>();
  function add(entry: Entry) {
    for (const path of parents(entry.path)) if (!entries.has(path)) entries.set(path,{path,missing:context.phase==="before"&&path.startsWith("workspaces/")});
    entries.set(entry.path,{...entries.get(entry.path),...entry});
  }
  const files=practiceFiles(context.task);
  if(["build-task","run-config","startup","verify","summary"].includes(context.task)){
    for(const file of files.filter(file=>["settings","build"].includes(file.id)||file.path.startsWith(commandPath+"/")))add({path:file.path,file:file.id});
    if(context.sim.execution.buildDir)add({path:buildDirectory,generated:true});
    if(hasJar(context.sim))add({path:runtimeSource.artifact.path,file:"artifact",generated:true});
    return [...entries.values()];
  }
  for (const file of files.filter(file=>!file.path.startsWith("workspaces/"))) add({path:file.path,file:file.id});
  add({path:"workspaces"});
  if (context.phase==="after") {
    for (const repo of practiceSource.cloneTargets) add({path:repo.path,fresh:true});
    for (const module of practiceSource.modulePaths) add({path:module.path,missing:!module.reportedAfter});
    for (const file of files.filter(file=>file.path.startsWith(commandPath+"/"))) add({path:file.path,file:file.id});
    if(isRuntimeTask(context.task)&&context.sim.execution.buildDir)add({path:buildDirectory,generated:true});
    if(isRuntimeTask(context.task)&&context.sim.execution.classes&&["compileJava","bootJar","bootRun"].includes(context.sim.execution.classCause))add({path:classesDirectory,generated:true});
    if(isRuntimeTask(context.task)&&hasJar(context.sim)) add({path:runtimeSource.artifact.path,file:"artifact",generated:true});
  } else if (context.task!=="root" && ((context.file==="settings"&&practiceSource.modulePaths.some(module=>module.line===context.line))||context.task==="script"||practiceSource.modulePaths.some(module=>context.expanded.includes(module.path)))) {
    const module=practiceSource.modulePaths.find(module=>module.line===context.moduleLine)!;
    add({path:module.path,missing:true});
  }
  return [...entries.values()];
}

// Adapted from the existing SourceTree: same folder/file controls, with selectable
// directory targets and explicit missing/new states needed for this reconstruction.
export function PracticeTree({context,hintPath,onFile,onFolder}: {
  context: PracticeContext; hintPath: string; onFile:(id:string)=>void;
  onFolder:(path:string)=>void;
}) {
  const entries=practiceEntries(context);
  const activeFile=context.file==="artifact"?runtimeSource.artifact.path:practiceFiles(context.task).find(file=>file.id===context.file)?.path;
  function branch(prefix=""): React.ReactNode {
    return <ul>{entries.filter(entry=>parents(entry.path).at(-1)===prefix || (!prefix&&!entry.path.includes("/"))).map(entry=>{
      const name=entry.path.split("/").at(-1);
      const open=context.expanded.includes(entry.path);
      const active=context.folder?context.folder===entry.path:activeFile===entry.path;
      return <li key={entry.path}>
        <button className={`practice-tree-row ${active?"is-selected":""} ${entry.missing?"is-missing":""} ${entry.fresh?"is-fresh":""} ${hintPath===entry.path?"is-hint":""}`}
          style={{paddingLeft:8+Math.min(parents(entry.path).length,5)*9}}
          data-run-main-selected={entry.file==="main"&&active?true:undefined} data-build-output={context.task==="build-task"&&entry.path===buildDirectory?"directory":undefined} data-practice-path={entry.path} title={entry.path} aria-label={`${entry.file?"Mở file":"Thư mục"} ${entry.path}${entry.missing?" (thiếu)":""}`}
          aria-expanded={entry.file?undefined:open} aria-pressed={entry.file?active:undefined}
          onClick={()=>entry.file?onFile(entry.file):onFolder(entry.path)}>
          {entry.file?<FileCode2 size={16}/>:<>{open?<ChevronDown size={14}/>:<ChevronRight size={14}/ >}{open?<FolderOpen size={17}/>:<Folder size={17}/>}</>}
          <span>{name}</span>{entry.missing&&<small>thiếu</small>}{entry.fresh&&<small>mới</small>}{entry.generated&&<small>trong bài</small>}
        </button>
        {!entry.file&&open&&branch(entry.path)}
        {entry.path==="workspaces"&&open&&context.phase==="before"&&!entries.some(item=>item.path.startsWith("workspaces/"))&&<p className="practice-empty-folder">Chưa có source repo con<br/><small>Tái dựng theo S00</small></p>}
      </li>;
    })}</ul>;
  }
  return <div className="practice-tree" aria-label="Cây project thực hành"><div className="practice-tree-root"><FolderOpen size={18}/><b>agent-workspaces</b></div>{branch()}</div>;
}
