import {useState} from "react";
import {Copy,Play} from "lucide-react";
import type {Simulation} from "./practice-runtime-model";
import {runCommand} from "./practice-runtime-model";
import {executionSource} from "./execution-model";
import source from "../content/setup/command-run-source.json" with {type:"json"};
import "./command-run-controls.css";

export function RunMethodChoice({mode,disabled=false,onChange}:{mode:Simulation["runMode"];disabled?:boolean;onChange:(mode:Simulation["runMode"])=>void}){
 return <div className="run-method-choice"><div role="group" aria-label="Chọn cách chạy Command">{([["intellij","Bấm Run trong IntelliJ"],["powershell","Chạy bằng Terminal"]] as const).map(([value,label])=><button type="button" key={value} aria-pressed={mode===value} disabled={disabled} onClick={()=>onChange(value)}>{label}</button>)}</div><p>Hai cách đều khởi động Command; chúng có thể dùng cấu hình khác nhau nếu bạn không đặt cùng profile và tham số.</p></div>;
}

export function ConfigurationCompare({profile,configKey,onKeyChange}:{profile:"base"|"dev";configKey:"port"|"datasource";onKeyChange:(key:"port"|"datasource")=>void}){
 const key=configKey==="port"?"server.port":"spring.datasource.url";
 const line=configKey==="port"?3:33;
 const base=configKey==="port"?String(source.port):source.datasource.base;
 const dev=configKey==="port"?String(source.port):source.datasource.dev;
 return <section className="run-config-compare" aria-label="Đối chiếu cấu hình trước Run">
  <label>Khóa đang xem<select aria-label="Khóa cấu hình đang đối chiếu" value={configKey} onChange={e=>onKeyChange(e.target.value as "port"|"datasource")}><option value="datasource">spring.datasource.url</option><option value="port">server.port</option></select></label>
  <div className="run-config-files">{([ ["application.yml",base,true], ["application-dev.yml",dev,profile==="dev"] ] as const).map(([name,value,used])=><article key={name} className={used?"is-config-used":""} aria-label={name}><header title={`${source.module}/src/main/resources/${name}`}>{name}</header><small>{name==="application.yml"?"Cấu hình nền":used?"Bổ sung · dev đang được đặt":"Chưa chọn trong bài"}</small><code title={key}><span>{line}</span> {key}</code><mark>{value}</mark></article>)}</div>
  <p className="run-effective-config" role="status"><b>Dự kiến: </b>{profile==="dev"?dev:base}<br/><span>Nguồn: {profile==="dev"?"application-dev.yml ghi đè application.yml":"application.yml, nếu không có profile/override khác"}{configKey==="port"&&profile==="dev"?" · Hai file cùng đặt 9901.":""}</span></p>
  <p className="run-config-limit">Environment, VM/program arguments hoặc file ngoài có thể ghi đè. Không đặt dev chưa chứng minh không có profile khác; tên cấu hình không xác nhận profile active. Giá trị datasource đã che; dev vẫn có kết nối ngoài cần kiểm tra.</p>
 </section>;
}

export function RunTerminal({profile,disabled=false,open,onOpen,onRun}:{profile:"base"|"dev";disabled?:boolean;open:boolean;onOpen:()=>void;onRun?:()=>void}){
 const command=runCommand(profile),[copied,setCopied]=useState(false),[value,setValue]=useState(command),[error,setError]=useState("");
 // A different profile supplies a new command; the input is remounted by the caller.
 function execute(){if(value.trim()!==command){setError("Dùng lệnh module Command và profile đang chọn. Bấm Điền lại lệnh rồi Enter.");return;}setError("");onRun?.();}
 return <div className="command-terminal-launcher"><button type="button" data-run-action="terminal" className={!open?"ide-located":""} onClick={onOpen}>Terminal</button>{open&&<section aria-label="Terminal tại root workspace"><div className="command-terminal-root" title={executionSource.workspaceDirectory}>PS {executionSource.workspaceDirectory}&gt;</div><form onSubmit={e=>{e.preventDefault();execute();}}><label>Lệnh bootRun của Command<input aria-label="Lệnh Run trong Terminal" disabled={disabled||!onRun} value={onRun?value:command} onChange={e=>{setValue(e.target.value);setError("");}} spellCheck={false}/></label><div className="command-terminal-tools"><button type="button" onClick={async()=>{try{await navigator.clipboard.writeText(command);setCopied(true);}catch{setError("Chọn lệnh trong ô để sao chép.");}}}><Copy size={14}/>{copied?"Đã sao chép":"Sao chép lệnh"}</button>{onRun&&<><button type="button" disabled={disabled} onClick={()=>{setValue(command);setError("");}}>Điền lại lệnh</button><button type="submit" aria-label="Enter lệnh Run" disabled={disabled}><Play size={14}/>Enter</button></>}</div></form>{error&&<p role="alert">{error}</p>}<p>Lệnh hướng dẫn đã đối chiếu module; {onRun?"Enter chỉ chạy trong bài học.":"sang I2 để bấm Enter trong bài học."} Không cần tạo JAR trước Run.</p></section>}</div>;
}
