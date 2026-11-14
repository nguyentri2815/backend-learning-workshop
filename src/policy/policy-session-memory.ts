export const directSessionId='direct-quote';
export const beginnerSessionId='quote-beginner';
export const selectedSession=(params:URLSearchParams)=>params.get('sessionId')===beginnerSessionId?beginnerSessionId:directSessionId;
const key=(id:string)=>`workshop:policy-session:${id}:v1`;
const isProgress=(name:string)=>name.startsWith('session')&&!['sessionId','sessionReturn','sessionOrigin'].includes(name);
export function savePolicySession(params:URLSearchParams){
 if(params.get('mode')!=='session'&&![...params.keys()].some(isProgress))return;
 try{const saved=new URLSearchParams();for(const [name,value] of params)if(isProgress(name))saved.set(name,value);localStorage.setItem(key(selectedSession(params)),saved.toString());}catch{/* URL remains a portable progress record. */}
}
export function storedPolicySession(id:string){try{return new URLSearchParams(localStorage.getItem(key(id))??'');}catch{return new URLSearchParams();}}
export function switchPolicySession(params:URLSearchParams,id:string):Record<string,string|null>{
 savePolicySession(params);
 const change:Record<string,string|null>={sessionId:id===beginnerSessionId?id:null};
 for(const name of params.keys())if(name.startsWith('session')&&name!=='sessionId')change[name]=null;
 for(const [name,value] of storedPolicySession(id))if(isProgress(name))change[name]=value;
 return change;
}
