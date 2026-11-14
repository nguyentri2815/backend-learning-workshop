import { excerptById, policySource } from '../content/policy/lesson';
import type { CodeRow } from '../workshop/source';

export type ReadingMode='related'|'context'|'file';
export interface SourceLocation {ref:string;line:number;to?:number;label?:string}
export interface SourcePosition extends SourceLocation {method:string}
export function sourceMethod(ref:string,line:number) {
  const source=excerptById[ref];
  const signatures=policySource.excerpts.filter(e=>e.path===source.path).flatMap(e=>e.rows)
    .filter(r=>r.line!==undefined&&r.line<=line)
    .map(r=>({line:r.line!,name:r.text.match(/^\s*(?:public|private|protected)\s+(?:(?:static|final|synchronized)\s+)*(?:[\w<>,?\[\].]+\s+)?(\w+)\s*\(/)?.[1]}))
    .filter(r=>r.name).sort((a,b)=>b.line-a.line);
  return signatures[0]?`${source.path.split('/').at(-1)!.replace(/\.java$/,'')}.${signatures[0].name}`:undefined;
}
export function sourceTransition(from:SourcePosition,to:SourcePosition,via='') {
  const origin=excerptById[from.ref],destination=excerptById[to.ref];
  const short=(method:string)=>method.split('.').at(-1)!;
  const route=`${short(from.method)}:L${from.line} → ${short(to.method)}:L${to.line}`;
  if(origin.path!==destination.path)return {sameFile:false,title:`${via.startsWith('Qua event')?'Qua event · ':''}Chuyển file`,route:`${origin.path} · ${short(from.method)}:L${from.line} → ${destination.path} · ${short(to.method)}:L${to.line}`};
  const title=from.method===to.method?`Cùng file · ${destination.path.split('/').at(-1)} · ${short(to.method)} · L${from.line} → L${to.line}`
    :`Cùng file · ${via.startsWith('Trả về')?'Trả về nơi gọi · Tiếp tục': 'Gọi'} ${short(to.method)}`;
  return {sameFile:true,title,route};
}
export function snapshotContext(id:string,focus:number) {
  const source=excerptById[id];
  const snippets=policySource.excerpts.filter(e=>e.path===source.path);
  const known=new Map<number,string>();
  snippets.forEach(e=>e.rows.forEach(r=>known.set(r.line,r.text)));
  const all=[...known].sort((a,b)=>a[0]-b[0]);
  const method=all.filter(([line,text])=>line<=focus&&/\b(public|private|protected)\s+.*\(.*\).*\{/.test(text)).at(-1)?.[0];
  // Context means all available excerpts of this file, with explicit gaps.
  // It never asserts that the bundled snapshot is the complete source file.
  const selected=all;
  const rows:CodeRow[]=[];
  selected.forEach(([line,text],i)=>{
    const previous=selected[i-1]?.[0];
    if(previous&&line>previous+1)rows.push({text:`// … L${previous+1}–L${line-1}: không có trong snapshot; mở file thật trong IDE.`,kind:'hunk'});
    rows.push({line,text});
  });
  return {rows,ranges:snippets.map(e=>`L${e.from}–${e.to}`).filter((value,index,array)=>array.indexOf(value)===index),method};
}
