import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

// Reads only; never starts Java, Docker, Redis or a backend request.
const root=process.argv[2];
if(!root)throw Error('Usage: node scripts/extract-redis-route.mjs <agent-system-source-root>');
const command='workspaces/agent-service/1-agent-command-service',shared='workspaces/agent-service/agent-shared';
const ranges=[
 ['client','workspaces/1-shared/shared-cache/src/main/java/com/alpaca/config/SpringCacheConfig.java',22,61],
 ['base',`${command}/src/main/resources/application.yml`,118,121],
 ['dev',`${command}/src/main/resources/application-dev.yml`,118,121],
 ['queue',`${command}/src/main/java/com/alpaca/agent/action/QueueHandler.java`,65,73],
 ['shared',`${shared}/src/main/java/com/alpaca/agent/service/SharedGlobalConfigService.java`,51,56],
 ['platform',`${shared}/src/main/java/com/alpaca/agent/config/PlatformCacheConfig.java`,32,39],
];
const refs=Object.fromEntries(ranges.map(([id,file,from,to])=>{
 const bytes=fs.readFileSync(path.join(root,file)),lines=bytes.toString('utf8').split(/\r?\n/);
 const rows=lines.slice(from-1,to).map((text,index)=>({line:from+index,text}));
 for(const row of rows){
  if(/(?:password|secret|token)\s*[:=]|\b[A-Z]:[\\/]|redis:\/\/(?!localhost:6379)/i.test(row.text))throw Error(`Review sensitive or changed source at ${file}:${row.line}`);
 }
 return [id,{path:file,from,to,sha256:crypto.createHash('sha256').update(bytes).digest('hex'),rows}];
}));
const client=refs.client.rows.map(row=>row.text).join('\n');
for(const expected of ['${cache.redis:redis://localhost:6379}','.setAddress(redisUrl)','Redisson.create(config)','@Qualifier("redissonClient")'])if(!client.includes(expected))throw Error(`Binding changed: ${expected}`);
for(const id of ['base','dev'])if(!refs[id].rows.some(row=>row.line===119&&row.text.trim()==='redis: redis://localhost:6379'))throw Error(`Review cache.redis in ${id}`);
fs.writeFileSync('src/content/setup/redis-route-source.json',JSON.stringify({version:1,checkedAt:new Date().toISOString(),scope:'Selected source excerpts, read-only comparison. Loopback Redis URLs are retained for address tracing; no credentials or personal paths are included. Runtime override provenance on 07/11 remains unconfirmed.',refs},null,2)+'\n');
console.log(`Reviewed ${ranges.length} source excerpts; cache.redis → redisUrl → redissonClient → cacheManager.`);
