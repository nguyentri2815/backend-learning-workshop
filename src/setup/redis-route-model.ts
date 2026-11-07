import source from "../content/setup/redis-route-source.json" with {type:"json"};
import {realLogSource} from "./real-log-practice-model";

export const redisRouteSource=source;
export const redisRouteStorageKey="backend-learning-workshop.redis-route.v1";
export type RouteMode="docker"|"remote";
export type RouteCheck="engine"|"status"|"ports"|"logs"|"fix"|"verify"|"ready"|"result";
export type RedisRouteState={step:1|2|3|4;clientOpen:boolean;addressOpen:boolean;runOpen:boolean;mode:RouteMode;hostPort:6379|6380;node:"command"|"windows"|"docker"|"redis";place:""|"local"|"remote";check:RouteCheck;configuredPort:number;resultStep:number};
export const emptyRedisRoute=():RedisRouteState=>({step:1,clientOpen:false,addressOpen:false,runOpen:false,mode:"docker",hostPort:6379,node:"windows",place:"",check:"engine",configuredPort:6379,resultStep:0});
export function readRedisRoute(addressEntry=false):RedisRouteState{
 let state=emptyRedisRoute();
 try{
  const raw=JSON.parse(localStorage.getItem(redisRouteStorageKey)??"null");
  if(raw?.version===1){
   state={...state,step:[1,2,3,4].includes(raw.step)?raw.step:1,clientOpen:raw.clientOpen===true,addressOpen:raw.addressOpen===true,runOpen:raw.runOpen===true,mode:raw.mode==="remote"?"remote":"docker",hostPort:raw.hostPort===6380?6380:6379};
   if(["command","windows","docker","redis"].includes(raw.node))state.node=raw.node;
   if(["local","remote"].includes(raw.place))state.place=raw.place;
   if(["engine","status","ports","logs","fix","verify","ready","result"].includes(raw.check))state.check=raw.check;
   state.configuredPort=raw.configuredPort===6380?6380:6379;
   state.resultStep=Number.isInteger(raw.resultStep)?Math.max(0,Math.min(3,raw.resultStep)):0;
  }
 }catch{/* Keep the lesson usable when storage is unavailable. */}
 if(addressEntry)state={...state,step:2,addressOpen:true};
 if(state.step===4&&!correctInspectionPlace(state))state.step=3;
 return state;
}
export function routeTarget(state:Pick<RedisRouteState,"mode"|"hostPort">){return state.mode==="remote"?{host:"redis.lab.example",port:6380}:{host:"127.0.0.1",port:state.hostPort};}
export function correctInspectionPlace(state:Pick<RedisRouteState,"mode"|"place">){return state.place===(state.mode==="docker"?"local":"remote");}
export const redisBeanChain=[
 {bean:"queueHandler",line:3206,source:"queue",why:"Bean đầu tiên bị ảnh hưởng cần SharedGlobalConfigService; log không chứng minh handler đã xử lý message."},
 {bean:"sharedGlobalConfigService",line:3229,source:"shared",why:"Service này nhận PlatformCacheConfig qua constructor; Spring chưa tạo xong các phụ thuộc."},
 {bean:"platformCacheConfig",line:3245,source:"platform",why:"Constructor cần cache manager và các Redis client; source có getMap/getSet cho dữ liệu cache."},
 {bean:"cacheManager",line:3274,source:"client",why:'Method cacheManager nhận đúng client qua @Qualifier("redissonClient").'},
 {bean:"redissonClient",line:3317,source:"client",why:"Bean này không tạo được vì Redisson không kết nối được Redis; tiếp tục tới L3432 và L3469."},
] as const;
export const redisLog=(line:number)=>realLogSource.rows.find(row=>row.line===line)!;
export function routeRunRows(state:Pick<RedisRouteState,"mode"|"hostPort">){
 const {host,port}=routeTarget(state);
 return [
  {line:1,group:"clients",level:"INFO",text:`[Giả lập] Redisson - 1 connections initialized for ${host}:${port}`},
  {line:2,group:"web",level:"INFO",text:"[Giả lập] Tomcat started on port 9901 (http)"},
  {line:3,group:"outcome",level:"INFO",text:"[Giả lập] Started AgentCommandServiceApplication"},
 ];
}
