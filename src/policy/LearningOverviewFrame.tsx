import type {ReactNode} from 'react';
export function LearningOverviewFrame({eyebrow,title,path,map,children,resume}:{eyebrow:string;title:string;path:ReactNode;map:ReactNode;children?:ReactNode;resume?:ReactNode}){
 return <div className="policy-creation-overview"><div className="policy-map-heading"><div><span className="eyebrow">{eyebrow}</span><h2>{title}</h2></div>{path}</div><div className={`policy-map-layout ${children?'has-detail':''}`}>{map}{children}</div>{resume}</div>;
}
