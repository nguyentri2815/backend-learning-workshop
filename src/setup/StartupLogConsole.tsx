import {Fragment} from "react";
import type {ReactNode,Ref} from "react";
import {startupSource} from "./startup-log-model";
import type {StartupGroup} from "./startup-log-model";

export type ConsoleLogRow={line:number;text:string;group:string;level:string;milestone?:string};
type Props={rows:ConsoleLogRow[];consoleRef?:Ref<HTMLDivElement>;label?:string;selectedGroup?:string;selectedLine?:number;selectedMilestone?:string;hintLine?:number;simulated?:boolean;file?:string;gaps?:boolean;compact?:boolean;searchQuery?:string;matchLines?:number[];currentMatch?:number;evidenceLines?:number[];expandedLines?:number[];onAddressClick?:()=>void;onPostgresClick?:()=>void;onSelect:(row:ConsoleLogRow)=>void;children?:ReactNode};
/** Shared by Run playback and the guided reading exercise; source line numbers stay intact. */
export function StartupLogConsole({rows,consoleRef,label="Console startup có nguồn",selectedGroup,selectedLine,selectedMilestone,hintLine,simulated,file,gaps,compact,searchQuery="",matchLines=[],currentMatch,evidenceLines=[],expandedLines=[],onAddressClick,onPostgresClick,onSelect,children}:Props){
 return <div ref={consoleRef} className="startup-console" aria-label={label} tabIndex={0}>
  {rows.map((row,index)=><Fragment key={row.line}>
   {gaps&&index>0&&row.line>rows[index-1].line+1&&<p className="startup-log-gap">⋯ L{rows[index-1].line+1}–L{row.line-1}: đoạn không trích ở chế độ này</p>}
   <button type="button" data-startup-line={row.line} data-startup-group={row.group} data-command-log={row.milestone||undefined} data-command-action={row.milestone||undefined} data-level={row.level} data-log-hint={hintLine===row.line||undefined} data-log-match={matchLines.includes(row.line)||undefined} data-log-current-match={currentMatch===row.line||undefined} data-log-evidence={evidenceLines.includes(row.line)||undefined} aria-pressed={selectedLine!==undefined?selectedLine===row.line:row.group===selectedGroup} title={`${file??"Console"}:${row.line}`} className={`${row.group===selectedGroup||row.line===selectedLine?"is-startup-selected":""} ${selectedMilestone&&selectedMilestone===row.milestone?"is-log-selected":""}`} onClick={()=>onSelect(row)}><small>{simulated?"SIM":"L"}{row.line} · {row.level}</small><code>{highlight(compact&&!expandedLines.includes(row.line)&&row.text.length>330?`${row.text.slice(0,330)} … [mở phần mở rộng để đọc đủ]`:row.text,matchLines.includes(row.line)?searchQuery:"")}</code></button>
   {onAddressClick&&row.line===3432&&<div className="startup-address-action">Địa chỉ đã dùng · L3432: <button type="button" aria-label="Lần ngược địa chỉ 127.0.0.1:6379 trong log" onClick={onAddressClick}>127.0.0.1:6379</button></div>}
   {onPostgresClick&&row.line===377&&<div className="startup-address-action">Đích đã thử · L377 · localhost:5432: <button type="button" aria-label="Lần đường kết nối PostgreSQL từ L377" onClick={onPostgresClick}>Lần đường kết nối PostgreSQL</button></div>}
  </Fragment>)}
  {children}
 </div>;
}
function highlight(text:string,query:string):ReactNode{
 const needle=query.trim().toLocaleLowerCase();if(!needle)return text;
 const chunks:ReactNode[]=[];let start=0,index=text.toLocaleLowerCase().indexOf(needle);
 while(index>=0){chunks.push(text.slice(start,index),<mark key={index}>{text.slice(index,index+needle.length)}</mark>);start=index+needle.length;index=text.toLocaleLowerCase().indexOf(needle,start);}
 chunks.push(text.slice(start));return chunks;
}
export function StartupGroupNav({selected,observed,onSelect,rabbit=false,simulated=false,live}:{selected:string;observed:string[];onSelect:(group:StartupGroup)=>void;rabbit?:boolean;simulated?:boolean;live?:string}){
 return <nav className="startup-groups" aria-label="Nhóm hoạt động startup">{startupSource.groups.map(item=><button type="button" key={item.id} aria-pressed={selected===item.id} className={`${live===item.id?"is-live-group":""} ${observed.includes(item.id)?"has-startup-log":""}`} onClick={()=>onSelect(item.id as StartupGroup)}><span>{rabbit&&item.id==="events"?"Messaging / RabbitMQ":item.title}</span><small>{observed.includes(item.id)?simulated?"Dữ kiện giả lập":"Quan sát trong phiên thật":"Chưa quan sát"}</small></button>)}<p>Nhóm có thể đan xen; dòng log giữ thứ tự của phiên.</p></nav>;
}
