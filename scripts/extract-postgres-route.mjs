import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

// Read-only comparison. Never starts Java, Docker, PostgreSQL or a request.
const root=process.argv[2];
if(!root)throw Error('Usage: node scripts/extract-postgres-route.mjs <agent-system-source-root>');
const command='workspaces/agent-service/1-agent-command-service';
const domain='workspaces/agent-service/4-agent-shared-domain/src/main/java/com/alpaca/agent';
const ranges=[
 ['controller',`${command}/src/main/java/com/alpaca/agent/controller/GlobalConfigController.java`,16,24],
 ['service',`${command}/src/main/java/com/alpaca/agent/function/global_config/GlobalConfigFunc.java`,25,60],
 ['repository',`${domain}/repository/ConfigRepository.java`,1,11],
 ['entity',`${domain}/domain/ConfigAggregate.java`,20,27],
 ['base',`${command}/src/main/resources/application.yml`,30,34],
 ['dev',`${command}/src/main/resources/application-dev.yml`,30,34],
 ['compose','docker-compose-env.yml',77,80],
];
const refs=Object.fromEntries(ranges.map(([id,file,from,to])=>{
 const bytes=fs.readFileSync(path.join(root,file)),lines=bytes.toString('utf8').split(/\r?\n/);
 const rows=lines.slice(from-1,to).map((original,index)=>{
  let text=original;
  if(/password|username|secret|token|email|phoneNumber/i.test(text))text='    # [đã che thông tin nhạy cảm]';
  if(id==='base'&&text.trim().startsWith('url:'))text=text.replace(/jdbc:postgresql:\/\/[^/]+/, 'jdbc:postgresql://[host đã che]');
  if(/\b[A-Z]:[\\/]|Bearer |\b(?:\d{1,3}\.){3}\d{1,3}\b/i.test(text))throw Error(`Review source at ${file}:${from+index}`);
  return {line:from+index,text};
 });
 return [id,{path:file,from,to,sha256:crypto.createHash('sha256').update(bytes).digest('hex'),rows}];
}));
for(const [id,expected] of [['controller','getAllConfig()'],['service','configRepository.findAll()'],['repository','extends JpaRepository<ConfigAggregate, String>'],['entity','@Table(name = "config_aggregate")'],['dev','jdbc:postgresql://${DOCKER_HOST_IP:localhost}/alpaca-event'],['compose','5432:5432']]){
 if(!refs[id].rows.some(row=>row.text.includes(expected)))throw Error(`Review changed ${id}: ${expected}`);
}
fs.writeFileSync('src/content/setup/postgres-route-source.json',JSON.stringify({version:1,checkedAt:new Date().toISOString(),scope:'Reviewed source excerpts only. Credentials and the non-loopback base host are redacted. Source snapshots do not establish the effective JDBC URL or execution of a business query in the 07/11 run.',refs},null,2)+'\n');
console.log(`Reviewed ${ranges.length} excerpts: request → GlobalConfigFunc → ConfigRepository → mapped entity; datasource YAML and Compose.`);
