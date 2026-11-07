import {useEffect,useRef} from "react";
import {Play} from "lucide-react";

// Anchor to the actual source row so scrolling, code wrapping and panel resizing
// keep the Run triangle beside main. Do not guess a pixel offset in the viewer.
export function MainRunGutter({disabled,onOpen}:{disabled:boolean;onOpen:()=>void}){
 const button=useRef<HTMLButtonElement>(null);
 useEffect(()=>{
  const control=button.current,region=control?.parentElement;
  if(!control||!region)return;
  function align(){
   if(!control||!region)return;
   const row=region.querySelector<HTMLElement>('[data-line="26"]');
   control.style.visibility=row?"visible":"hidden";
   if(row){const bounds=row.getBoundingClientRect();control.style.top=`${bounds.top-region.getBoundingClientRect().top+(bounds.height-control.offsetHeight)/2}px`;}
  }
  const resize=new ResizeObserver(align),content=new MutationObserver(align);
  resize.observe(region);content.observe(region,{childList:true,subtree:true});region.addEventListener("scroll",align,true);align();
  return()=>{resize.disconnect();content.disconnect();region.removeEventListener("scroll",align,true);};
 },[]);
 return <button ref={button} type="button" className="run-main-gutter ide-located" aria-label="Tam giác Run cạnh main" title="Mở lựa chọn chạy main" disabled={disabled} onClick={onOpen}><Play size={17}/></button>;
}
