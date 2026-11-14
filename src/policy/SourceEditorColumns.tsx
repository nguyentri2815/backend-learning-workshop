import type {ReactNode} from 'react';
import {Group,Panel,Separator} from 'react-resizable-panels';
import type {Layout} from 'react-resizable-panels';
const layouts=new Map<string,Layout>();
export function SourceEditorColumns({contextKey,reading=false,tree,code}:{contextKey:string;reading?:boolean;tree:ReactNode;code:ReactNode}){
 return <Group orientation="horizontal" defaultLayout={layouts.get(contextKey)} onLayoutChanged={layout=>layouts.set(contextKey,layout)} className="policy-editor-group" id={`policy-editor-${contextKey}`}><Panel id="tree" defaultSize={reading?'22%':'26%'} minSize="15%" className="policy-file-panel">{tree}</Panel><Separator className="policy-resize" aria-label="Đổi độ rộng cây thư mục"/><Panel id="code" minSize="35%" className="policy-editor-panel">{code}</Panel></Group>;
}
