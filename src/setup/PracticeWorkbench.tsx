import {Children,useEffect,useState} from "react";
import type {ReactNode} from "react";
import {Group,Panel,Separator} from "react-resizable-panels";
const key="backend-learning-workshop.run-config-panels.v1";
function readLayout(){
 try{const value=JSON.parse(localStorage.getItem(key)??"null");if(value&&Number.isFinite(value.tree)&&value.tree>=20&&value.tree<=50&&Number.isFinite(value.editor)&&Math.abs(value.tree+value.editor-100)<.1)return value;}catch{/* Keep session defaults. */}
 return {tree:30,editor:70};
}
export function PracticeWorkbench({resizable,className,children}:{resizable:boolean;className:string;children:ReactNode}){
 const [small,setSmall]=useState(()=>window.matchMedia("(max-width: 900px)").matches),[layout,setLayout]=useState(readLayout);
 useEffect(()=>{const media=window.matchMedia("(max-width: 900px)");const handler=()=>setSmall(media.matches);media.addEventListener("change",handler);return()=>media.removeEventListener("change",handler);},[]);
 if(!resizable||small)return <div className={className}>{children}</div>;
 const panes=Children.toArray(children);
 return <Group orientation="horizontal" className={`${className} run-resizable-workbench`} defaultLayout={layout} onLayoutChanged={(next,meta)=>{if(meta.isUserInteraction){setLayout(next);try{localStorage.setItem(key,JSON.stringify(next));}catch{/* Resizing still works in this session. */}}}}>
  <Panel id="tree" minSize="220px" maxSize="50%" className="run-tree-panel">{panes[0]}</Panel>
  <Separator className="resize-handle run-tree-resize" aria-label="Điều chỉnh độ rộng cây project"><span>⋮</span></Separator>
  <Panel id="editor" minSize="45%" className="run-editor-panel">{panes[1]}</Panel>
 </Group>;
}
