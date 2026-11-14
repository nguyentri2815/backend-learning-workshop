import {useEffect,useRef,useState} from 'react';
import {Link,useLocation} from 'react-router-dom';
import {BookOpen,ChevronDown,Menu,Moon,RotateCcw,Sun,X} from 'lucide-react';
import {useWorkshopTheme} from './appearance';

const entries=[['/','Tổng quan'],['environment','Hiểu và chạy dự án'],['policy','Khám phá Policy'],['claims','Yêu cầu bồi thường']] as const;
export function NotebookNavigation({journeyUrl,completed,total,onReset}:{journeyUrl:(id:string)=>string;completed:number;total:number;onReset:()=>void}){
 const location=useLocation();
 const [theme,setTheme]=useWorkshopTheme();
 const [open,setOpen]=useState(false);
 const header=useRef<HTMLElement>(null),references=useRef<HTMLDetailsElement>(null),menu=useRef<HTMLButtonElement>(null);
 useEffect(()=>{setOpen(false);if(references.current)references.current.open=false;},[location.pathname,location.search]);
 useEffect(()=>{
  const outside=(event:PointerEvent)=>{if(!header.current?.contains(event.target as Node)){setOpen(false);if(references.current)references.current.open=false;}};
  const escape=(event:KeyboardEvent)=>{if(event.key!=='Escape')return;if(references.current?.open){references.current.open=false;references.current.querySelector('summary')?.focus();}else if(open){setOpen(false);menu.current?.focus();}};
  document.addEventListener('pointerdown',outside);document.addEventListener('keydown',escape);
  return ()=>{document.removeEventListener('pointerdown',outside);document.removeEventListener('keydown',escape);};
 },[open]);
 return <header className="notebook-header" ref={header}>
  <Link to="/" className="notebook-brand" aria-label="Backend · Sổ tay thực hành"><BookOpen size={24} aria-hidden="true"/><span>Backend<small>SỔ TAY THỰC HÀNH</small></span></Link>
  <button ref={menu} type="button" className="notebook-menu-toggle" aria-label={open?'Đóng điều hướng':'Mở điều hướng'} aria-expanded={open} aria-controls="notebook-navigation" onClick={()=>{if(references.current)references.current.open=false;setOpen(!open);}}>{open?<X size={21}/>:<Menu size={21}/>}<span>Điều hướng</span></button>
  <nav id="notebook-navigation" aria-label="Điều hướng chính" data-open={open}>{entries.map(([id,label])=>{
   const active=id==='/'?location.pathname==='/':location.pathname===`/journey/${id}`;
   return <Link key={id} to={id==='/'?'/':journeyUrl(id)} aria-current={active?'page':undefined}>{label}</Link>;
  })}</nav>
  <div className="workshop-theme-toggle" role="group" aria-label="Giao diện Workshop"><button type="button" aria-label="Giao diện sáng" aria-pressed={theme==='light'} onClick={()=>setTheme('light')}><Sun size={15} aria-hidden="true"/><span>Sáng</span></button><button type="button" aria-label="Giao diện tối" aria-pressed={theme==='dark'} onClick={()=>setTheme('dark')}><Moon size={15} aria-hidden="true"/><span>Tối</span></button></div>
  <details className="notebook-references" ref={references}><summary onClick={()=>setOpen(false)}><BookOpen size={16} aria-hidden="true"/>Tham chiếu<ChevronDown size={14} aria-hidden="true"/></summary><div className="notebook-reference-content">
   <Link to="/sources">Nguồn & phạm vi <span aria-hidden="true">↗</span></Link>
   <div><small>REPO JAVA MỤC TIÊU</small><code>agent-service-workspaces</code><p>Setup đã khảo sát · 04/11/2026</p></div>
   <div className="notebook-progress"><span>Tiến độ học tự đánh dấu</span><strong>{completed}/{total}</strong><progress max={total} value={completed} aria-label="Tiến độ học tự đánh dấu"/></div>
   <button type="button" className="text-button" onClick={()=>{if(references.current)references.current.open=false;onReset();}}><RotateCcw size={14}/>Đặt lại tiến độ</button><small>Workshop · dữ liệu và thao tác mô phỏng</small>
  </div></details>
 </header>;
}
