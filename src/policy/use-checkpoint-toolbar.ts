import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { RefObject } from 'react';

export function useCheckpointToolbar(root:RefObject<HTMLDivElement|null>) {
  const toolbar=useRef<HTMLDivElement>(null);
  const [pinned,setPinned]=useState(false);
  const [choice,setChoice]=useState<boolean|null>(null);
  const expanded=choice??false;

  // Measure in the same commit as a checkpoint/detail change. The code viewer
  // then reveals its line using the final available height, before paint.
  useLayoutEffect(()=>{
    if(toolbar.current)root.current?.style.setProperty('--checkpoint-toolbar-height',`${toolbar.current.getBoundingClientRect().height}px`);
  });

  useEffect(()=>{
    let frame=0;
    function measure(){
      frame=0;
      if(!root.current||!toolbar.current||document.querySelector('.practice-side-panel[open]'))return;
      const top=parseFloat(getComputedStyle(toolbar.current).top)||0;
      setPinned(root.current.getBoundingClientRect().top<=top+1);
    }
    function schedule(){if(!frame)frame=requestAnimationFrame(measure);}
    measure();
    window.addEventListener('scroll',schedule,{passive:true});
    window.addEventListener('resize',schedule);
    return ()=>{cancelAnimationFrame(frame);window.removeEventListener('scroll',schedule);window.removeEventListener('resize',schedule);};
  },[root]);

  useLayoutEffect(()=>{
    const element=toolbar.current;
    if(!element)return;
    const measure=()=>root.current?.style.setProperty('--checkpoint-toolbar-height',`${element.getBoundingClientRect().height}px`);
    const observer=new ResizeObserver(measure);
    observer.observe(element);measure();
    return ()=>observer.disconnect();
  },[root]);

  function toggle(){
    // The editor stays mounted, and its independent scroll offset stays intact.
    const viewport=root.current?.querySelector<HTMLElement>('[data-testid=code-scroll]');
    const position=viewport?{top:viewport.scrollTop,left:viewport.scrollLeft}:null;
    setChoice(!expanded);
    requestAnimationFrame(()=>{
      if(viewport&&position)viewport.scrollTo({...position,behavior:'instant'});
    });
  }
  return {toolbar,pinned,expanded,toggle};
}
