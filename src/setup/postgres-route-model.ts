import source from "../content/setup/postgres-route-source.json" with {type:"json"};

export const postgresRouteSource=source;
export const postgresRouteStorageKey="backend-learning-workshop.postgres-route.v1";
export const postgresDevRouteStorageKey="backend-learning-workshop.postgres-route.08-11.v1";
export type PostgresRouteState={step:1|2|3|4;sourceOpen:boolean;envSet:boolean;urlLogOpen:boolean;runOpen:boolean;portCheckOpen:boolean;dockerCheckOpen:boolean;mode:"docker"|"remote";hostPort:5432|15432;answer:""|"url"|"label"|"docker"};
export const emptyPostgresRoute=():PostgresRouteState=>({step:1,sourceOpen:false,envSet:false,urlLogOpen:false,runOpen:false,portCheckOpen:false,dockerCheckOpen:false,mode:"docker",hostPort:5432,answer:""});
export function readPostgresRoute(storageKey=postgresRouteStorageKey):PostgresRouteState{
 const state=emptyPostgresRoute();
 try{
  const raw=JSON.parse(localStorage.getItem(storageKey)??"null");
  if(raw?.version!==1)return state;
  if([1,2,3,4].includes(raw.step))state.step=raw.step;
  for(const key of ["sourceOpen","envSet","urlLogOpen","runOpen","portCheckOpen","dockerCheckOpen"] as const)state[key]=raw[key]===true;
  state.mode=raw.mode==="remote"?"remote":"docker";
  state.hostPort=raw.hostPort===15432?15432:5432;
  if(["url","label","docker"].includes(raw.answer))state.answer=raw.answer;
 }catch{/* The route also works without browser storage. */}
 return state;
}
export function postgresTarget(state:Pick<PostgresRouteState,"mode"|"hostPort">){
 return state.mode==="remote"?{host:"postgres.lab.example",port:5432,database:"workshop"}:{host:"localhost",port:state.hostPort,database:"alpaca-event"};
}
