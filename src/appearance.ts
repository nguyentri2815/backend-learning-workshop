import {useSyncExternalStore} from 'react';

export type WorkshopTheme='light'|'dark';
export const appearanceKey='backend-learning-workshop.appearance.v1';
const event='backend-learning:appearance';
let fallback:WorkshopTheme='light';
let storageFailed=false;
function read():WorkshopTheme {
 if(storageFailed)return fallback;
 try {return localStorage.getItem(appearanceKey)==='dark'?'dark':'light';}
 catch {return fallback;}
}
function apply(theme:WorkshopTheme){document.documentElement.dataset.theme=theme;}
export function initializeWorkshopTheme(){apply(read());}
function subscribe(listener:()=>void){
 const update=()=>{apply(read());listener();};
 window.addEventListener(event,update);window.addEventListener('storage',update);
 return ()=>{window.removeEventListener(event,update);window.removeEventListener('storage',update);};
}
export function useWorkshopTheme(){
 const theme=useSyncExternalStore(subscribe,read);
 return [theme,(value:WorkshopTheme)=>{
  fallback=value;
  try{localStorage.setItem(appearanceKey,value);}catch{storageFailed=true;}
  apply(value);window.dispatchEvent(new Event(event));
 }] as const;
}
