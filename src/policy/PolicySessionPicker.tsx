import {useEffect,useRef,useState} from 'react';
import {ChevronDown,GitBranch} from 'lucide-react';
import {beginnerSessionId,directSessionId,selectedSession,storedPolicySession,switchPolicySession} from './policy-session-memory';
import './policy-implementation-session.css';
const sessions=[
 {id:beginnerSessionId,title:'Xây Policy từ Quote · Dành cho người mới',start:'Bắt đầu với Quote và hạ tầng chung; xây dần module Policy.',rounds:25},
 {id:directSessionId,title:'Phát hành trực tiếp từ Quote',start:'Workspace đã có các thành phần Policy; nối phần xử lý còn thiếu.',rounds:11},
];
export function PolicySessionPicker({params,update}:{params:URLSearchParams;update:(changes:Record<string,string|null>)=>void}){
 const [open,setOpen]=useState(false);
 const root=useRef<HTMLDivElement>(null),trigger=useRef<HTMLButtonElement>(null);
 useEffect(()=>{
  if(!open)return;
  const outside=(event:PointerEvent)=>{if(!root.current?.contains(event.target as Node))setOpen(false);};
  document.addEventListener('pointerdown',outside);
  return ()=>document.removeEventListener('pointerdown',outside);
 },[open]);
 const items=()=>Array.from(root.current?.querySelectorAll<HTMLButtonElement>('[role=menuitemradio]')??[]);
 function choose(id:string){
  update({...switchPolicySession(new URLSearchParams(window.location.search),id),group:'create',mode:'session'});
  setOpen(false);trigger.current?.focus();
 }
 return <div className="policy-session-picker" ref={root} onBlur={event=>{if(!event.currentTarget.contains(event.relatedTarget))setOpen(false);}} onKeyDown={event=>{
  if(event.key==='Escape'){setOpen(false);trigger.current?.focus();event.preventDefault();}
  if(open&&['ArrowDown','ArrowUp','Home','End'].includes(event.key)){
   const buttons=items(),index=buttons.indexOf(document.activeElement as HTMLButtonElement);
   buttons[event.key==='Home'?0:event.key==='End'?buttons.length-1:(index+(event.key==='ArrowDown'?1:buttons.length-1))%buttons.length]?.focus();event.preventDefault();
  }
 }}>
  <button ref={trigger} className="policy-session-entry" aria-haspopup="menu" aria-expanded={open} aria-controls="policy-session-menu" onClick={()=>setOpen(!open)} onKeyDown={event=>{if(!open&&['ArrowDown','ArrowUp'].includes(event.key)){setOpen(true);requestAnimationFrame(()=>items()[event.key==='ArrowDown'?0:1]?.focus());event.preventDefault();}}}><GitBranch size={15}/>Mô phỏng cả phiên triển khai<ChevronDown size={14}/></button>
  {open&&<div id="policy-session-menu" className="policy-session-menu" role="menu" aria-label="Chọn phiên mô phỏng">{sessions.map(session=>{
   const saved=selectedSession(params)===session.id&&params.has('sessionAt')?params:storedPolicySession(session.id);
   const done=Math.max(0,Math.min(session.rounds,Number(saved.get('sessionDone')??-1)+1));
   return <button key={session.id} role="menuitemradio" aria-checked={params.get('mode')==='session'&&selectedSession(params)===session.id} onClick={()=>choose(session.id)}><strong>{session.title}</strong><span>{session.start}</span><small>{saved.size?`Tiếp tục vị trí đã lưu · Đã hoàn thành ${done}/${session.rounds} lượt`:'Chưa bắt đầu'}</small></button>;
  })}</div>}
 </div>;
}
