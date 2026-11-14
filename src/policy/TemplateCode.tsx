import {lazy,Suspense} from 'react';
import type {CodeAnnotation} from '../workshop/CodeBlock';
import {usePolicyCodeTheme} from '../workshop/code-preferences';

const CodeBlock=lazy(()=>import('../workshop/CodeBlock').then(m=>({default:m.CodeBlock})));
// Shared by Create and List; independent of either lesson's source snapshots.
export function TemplateCode({text,memory,tone}:{text:string;memory:string;tone?:CodeAnnotation['tone']}) {
 const [theme]=usePolicyCodeTheme();
 return <div className="assembly-frame" style={{height:Math.min(360,Math.max(150,text.split('\n').length*25+40))}}><Suspense fallback={<p>Đang mở khung code…</p>}>
  <CodeBlock rows={text.split('\n').map((text,i)=>({line:i+1,text}))} path="Frame.java" memoryKey={memory} theme={theme}
   annotations={tone?[{start:1,end:text.split('\n').length,label:'Khung rút gọn',tone}]:undefined}/>
 </Suspense></div>;
}
