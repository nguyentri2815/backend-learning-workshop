import {useLayoutEffect,useRef} from 'react';
import {ArrowRight,Check,LockKeyhole} from 'lucide-react';

export type LearningStep={id:string;title:string;complete:boolean;disabled?:boolean;label?:string;hint?:string;status?:string};
export function LearningSteps({items,current,onSelect,label,className=''}:{items:LearningStep[];current:string;onSelect:(id:string)=>void;label:string;className?:string}){
 const list=useRef<HTMLOListElement>(null);
 useLayoutEffect(()=>{
  const reveal=()=>{
   const container=list.current,active=container?.querySelector<HTMLElement>('[aria-current=step]');
   if(!container||!active)return;
   const bounds=container.getBoundingClientRect(),target=active.getBoundingClientRect();
   if(target.left<bounds.left||target.right>bounds.right)container.scrollLeft+=target.left-bounds.left-(bounds.width-target.width)/2;
  };
  reveal();const resize=new ResizeObserver(reveal);if(list.current)resize.observe(list.current);
  return ()=>resize.disconnect();
 },[current]);
 return <nav className={`learning-steps ${className}`} aria-label={label}><ol ref={list}>
  {items.map((step,index)=>{
   const active=step.id===current,state=active?'current':step.complete?'complete':step.disabled?'locked':'upcoming';
   const status=step.status??(active?`Đang xem${step.complete?' · đã hoàn thành':''}`:step.complete?'Đã hoàn thành':step.disabled?'Chưa mở':'Chưa hoàn thành');
   return <li key={step.id} data-step={step.id} data-state={state}>
    <button type="button" aria-current={active?'step':undefined} aria-label={step.label} data-state={state} disabled={step.disabled} title={step.hint??`${index+1}. ${step.title}${status?` · ${status}`:''}`} onClick={()=>onSelect(step.id)}>
     <span className="learning-step-number">{index+1}</span><span className="learning-step-copy"><strong>{step.title}</strong>{status&&<small>{status}</small>}</span>
     {step.complete?<Check className="learning-step-status" size={15} aria-label="Đã hoàn thành"/>:step.disabled?<LockKeyhole className="learning-step-status" size={13} aria-label="Chưa mở"/>:null}
    </button>
    {index<items.length-1&&<span className="learning-step-arrow" data-traversed={step.complete} aria-hidden="true"><ArrowRight size={22}/></span>}
   </li>;
  })}
 </ol></nav>;
}
