import { excerptById, policySource } from '../content/policy/lesson';
import type { CodeRow } from '../workshop/source';

export type ReadingMode='related'|'context'|'file';
export interface SourceLocation {ref:string;line:number;to?:number;label?:string}
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
