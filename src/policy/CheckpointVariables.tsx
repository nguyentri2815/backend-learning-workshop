import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { CheckpointValues, CheckpointView } from './practice-checkpoint';

function scalar(value:unknown){return value===null?'null':typeof value==='string'?value:JSON.stringify(value);}
function summary(value:object){
  if('present' in value)return value.present?'Optional có giá trị':'Optional rỗng';
  return Array.isArray(value)?`${value.length===0?'[] · ':''}${value.length} phần tử`:`Object · ${Object.keys(value).length} trường`;
}
function Value({name,value,changed=false}:{name:string;value:unknown;changed?:boolean}) {
  const object=value!==null&&typeof value==='object';
  return <div className={`checkpoint-value ${changed?'is-changed':''}`} data-variable={name} data-changed={changed}>
    {object?<details><summary><code>{name}</code><span>{summary(value)}</span>{changed&&<em>Vừa cập nhật</em>}</summary><div className="checkpoint-object">{Object.entries(value).map(([key,child])=><Value key={key} name={key} value={child}/>)}</div></details>:<div className="checkpoint-scalar"><code>{name}</code><span>=</span><code>{scalar(value)}</code>{changed&&<em>Vừa cập nhật</em>}</div>}
  </div>;
}
function Values({block,after}:{block:CheckpointValues;after?:boolean}){
  const priority=(name:string)=>name==='quoteAggregate'?0:name==='command'?1:2;
  const entries=Object.entries(block.values??{}).sort(([a],[b])=>priority(a)-priority(b));
  return <section className={`checkpoint-values ${after?'is-after':''}`} data-testid={after?'debug-after':'debug-before'}><h4>{block.label}</h4>{block.empty?<p className="checkpoint-empty">{block.empty}</p>:entries.map(([name,value])=><Value key={name} name={name} value={value} changed={block.changed?.includes(name)}/>)}{block.observed&&<div className="checkpoint-observed"><h5>Kết quả điều kiện · quan sát</h5>{Object.entries(block.observed).map(([name,value])=><Value key={name} name={name} value={value}/>)}</div>}{block.note&&<p className="checkpoint-value-note">{block.note}</p>}</section>;
}
export function CheckpointVariables({view,collapsed,onToggle,checkpointKey}:{view:CheckpointView;collapsed:boolean;onToggle:()=>void;checkpointKey:string}){
  return <aside className={`checkpoint-variables ${collapsed?'is-collapsed':''}`} aria-label="Biến trước / Biến sau" data-testid="checkpoint-variables"><header><div><strong>Biến trước / Biến sau</strong><small>Debug mô phỏng · {view.viewing}</small></div><button type="button" aria-label={collapsed?'Mở vùng biến':'Thu gọn vùng biến'} aria-expanded={!collapsed} onClick={onToggle}>{collapsed?<ChevronLeft size={16}/>:<ChevronRight size={16}/>}</button></header><div className="checkpoint-variables-body" hidden={collapsed} key={checkpointKey}><Values block={view.before}/><Values block={view.after} after/></div></aside>;
}
