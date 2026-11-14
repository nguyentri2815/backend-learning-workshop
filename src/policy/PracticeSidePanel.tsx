import { useEffect, useRef } from 'react';
import type { ReactNode } from 'react';

export function PracticeSidePanel({kind,onClose,children}:{kind:'network'|'trace'|null;onClose:()=>void;children:ReactNode}) {
  const dialog=useRef<HTMLDialogElement>(null);
  const opener=useRef<HTMLElement|null>(null);
  useEffect(()=>{
    const element=dialog.current!;
    if(!kind)return;
    opener.current=document.activeElement as HTMLElement;
    const position={x:window.scrollX,y:window.scrollY};
    const body=document.body;
    const previous={minHeight:body.style.minHeight,overflowAnchor:body.style.overflowAnchor};
    // Browsing a shorter stage must not clamp or anchor-scroll the page behind
    // the modal. Preserve its scroll extent until the modal closes.
    body.style.minHeight=`${document.documentElement.scrollHeight}px`;
    body.style.overflowAnchor='none';
    element.showModal();
    // The modal has its own scroll region; leave the document scrollbar in place
    // so the editor retains exactly the same width and reading position.
    const preventOutsideScroll=(event:Event)=>{
      const scroller=event.target instanceof Element?event.target.closest('.practice-trace-scroll,.practice-network-panel'):null;
      if(!scroller||!element.contains(scroller))event.preventDefault();
    };
    document.addEventListener('wheel',preventOutsideScroll,{passive:false});
    document.addEventListener('touchmove',preventOutsideScroll,{passive:false});
    return ()=>{
      document.removeEventListener('wheel',preventOutsideScroll);
      document.removeEventListener('touchmove',preventOutsideScroll);
      element.close();
      body.style.minHeight=previous.minHeight;
      body.style.overflowAnchor=previous.overflowAnchor;
      opener.current?.focus({preventScroll:true});
      window.scrollTo({left:position.x,top:position.y,behavior:'instant'});
    };
  },[kind]);
  function close(){onClose();}
  return <dialog ref={dialog} id="practice-side-panel" className="practice-side-panel" aria-label={kind==='network'?'Network':'Luồng thực thi'} onCancel={event=>{event.preventDefault();close();}} onClick={event=>{if(kind!=='trace'&&event.target===event.currentTarget){const r=event.currentTarget.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)close();}}}>
    <header><strong>{kind==='network'?'Network':'Luồng thực thi'}</strong><button type="button" onClick={close} aria-label="Đóng bảng phụ">Đóng ×</button></header>
    {children}
  </dialog>;
}
