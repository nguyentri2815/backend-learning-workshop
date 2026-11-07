import {readFile,writeFile,stat} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
const root='D:/ALPACA/agent-system';
const command='workspaces/agent-service/1-agent-command-service';
// Read only. Values are denied by default, including comments and embedded credentials.
function sanitize(text){
  if(!text.trim())return text;
  if(text.trim().startsWith('#'))return '# [đã che]';
  const pair=text.match(/^(\s*[\w.-]+:\s*)(.*)$/);
  if(/^\s*- \.\/\.docker\/(postgresql-write|postgresql-read):\/var\/lib\/postgresql\/data\s*$/.test(text))return text;
  if(/^\s*- \.\/\.docker\/rabbitmq\/plugins:\/opt\/rabbitmq\/addon-plugins\s*$/.test(text))return text;
  if(!pair&&/^\s*-\s*(postgres-write|kafka|zookeeper)\s*$/.test(text))return text;
  if(!pair)return /^\s*-\s*["']?\d+:\d+["']?\s*$/.test(text)?text:'[đã che]';
  const key=pair[1].trim().replace(/:$/,'');const value=pair[2].trim();
  if(!value)return text;
  if(['port','debug','local','enabled','restart','image','container_name','hostname','build','driver-class-name','default_schema','schema','ddl-auto','generate-ddl','mode','connection-init-sql','BOOTSTRAP_SERVERS','ZOOKEEPER_SERVERS'].includes(key))return text;
  if(['host','servers','string'].includes(key)&&/^(127\.0\.0\.1|localhost)(:\d+)?$/.test(value))return text;
  if(key==='url'&&value.includes('jdbc:postgresql:')) { const url=new URL(value.slice(5).replace(/\$\{[^:}]+:([^}]+)\}/g,'$1'));return pair[1]+`[đã che; PostgreSQL ${['localhost','127.0.0.1'].includes(url.hostname)?(value.includes('${DOCKER_HOST_IP:')?'${DOCKER_HOST_IP:localhost}':url.hostname)+':'+(url.port||5432)+'; DB '+url.pathname.slice(1):'remote; đích không phải Compose local'}]`; }
  if(key.startsWith('redis')&&value.includes('redis:')) {const url=new URL(value);return pair[1]+`[đã che; Redis ${['localhost','127.0.0.1'].includes(url.hostname)?url.hostname+':'+(url.port||6379):'remote'}; DB ${url.pathname.slice(1)||'0'}]`;}
  return pair[1]+'[đã che]';
}
const files=[];
for(const [id,path] of [['default',command+'/src/main/resources/application.yml'],['dev',command+'/src/main/resources/application-dev.yml'],['compose','docker-compose-env.yml']]){
  const raw=await readFile(root+'/'+path,'utf8');const revision=execFileSync('git',['--no-optional-locks','rev-parse','HEAD'],{cwd:root+(id==='compose'?'':'/workspaces/agent-service'),encoding:'utf8'}).trim();
  files.push({id,path,sourceRoot:root,revision,sourceSha256:createHash('sha256').update(raw).digest('hex'),lastModified:(await stat(root+'/'+path)).mtime.toISOString(),rows:raw.split(/\r?\n/).map((text,i)=>({line:i+1,text:sanitize(text)}))});
}
const evidence=[];
for(const [id,path,ranges] of [
  ['command-dev',command+'/src/main/resources/application-dev.yml',[[7,13],[30,45],[51,55],[118,121]]],
  ['query-base','workspaces/agent-service/3-agent-query-service/src/main/resources/application.yml',[[21,24]]],
  ['query-dev','workspaces/agent-service/3-agent-query-service/src/main/resources/application-dev.yml',[[30,33]]],
  ['flow-base','workspaces/agent-service/2-agent-flow-service/src/main/resources/application.yml',[[64,65]]],
  ['cdc','workspaces/2-infrastructure/kafka-cdc-service/src/main/resources/application-dev.yml',[[1,4],[29,31]]],
]){
  const raw=await readFile(root+'/'+path,'utf8');
  evidence.push({id,path,sourceSha256:createHash('sha256').update(raw).digest('hex'),rows:raw.split(/\r?\n/).flatMap((text,i)=>ranges.some(([a,b])=>i+1>=a&&i+1<=b)?[{line:i+1,text:sanitize(text)}]:[])});
}
// These are public local destinations; all other api/host values remain redacted.
for(const item of evidence){const raw=(await readFile(root+'/'+item.path,'utf8')).split(/\r?\n/);for(const row of item.rows){const original=raw[row.line-1];if(/(bootstrap-servers|api):\s*(alpaca\.kafka\.event:9092|http:\/\/localhost:9901)\s*$/.test(original))row.text=original.replace('http://','[HTTP] ');}}
const data={extractedAt:new Date().toISOString(),files,evidence};
const projectRaw=await readFile(root+'/build.gradle','utf8');
const projectMatch=projectRaw.match(/projectName\s*=\s*"([a-z0-9-]+)"/);
if(projectMatch?.[1]!=='sale-platform'||!projectRaw.includes('useComposeFiles = ["docker-compose-env.yml"]'))throw Error('Compose project evidence changed');
const dockerfile=await readFile(root+'/docker/postgres/Dockerfile','utf8');
const legacyUp=await readFile(root+'/docker-up.sh','utf8');
if(!dockerfile.startsWith('FROM debezium/postgres:16-alpine')||!legacyUp.includes('docker-compose -f docker-compose-env.yml up -d'))throw Error('Compose build evidence changed');
data.composeSetup={repository:'agent-system',directory:root,projectName:projectMatch[1],composeFile:'docker-compose-env.yml',projectEvidence:{path:'build.gradle',sourceSha256:createHash('sha256').update(projectRaw).digest('hex'),rows:projectRaw.split(/\r?\n/).flatMap((text,i)=>/projectName =|useComposeFiles =/.test(text)?[{line:i+1,text}]:[])},dockerfile:{path:'docker/postgres/Dockerfile',sourceSha256:createHash('sha256').update(dockerfile).digest('hex'),rows:dockerfile.split(/\r?\n/).flatMap((text,i)=>/^(FROM|COPY)/.test(text)?[{line:i+1,text}]:[])},legacyScript:{path:'docker-up.sh',sourceSha256:createHash('sha256').update(legacyUp).digest('hex'),note:'Script cũ gọi docker-compose up toàn bộ file, không truyền -p; bài học giới hạn service và đặt -p tường minh.'}};
if(/https?:\/\/|jdbc:postgresql:\/\/|redis:\/\//.test(JSON.stringify(data))||files.some(file=>file.rows.some(row=>{const match=row.text.match(/(?:password|username|client-secret):\s*(.+)$/);return match&&!match[1].startsWith('[đã che]');})))throw Error('Unexpected unredacted value');
await writeFile(new URL('../src/content/setup/practice-infrastructure-source.json',import.meta.url),JSON.stringify(data,null,2)+'\n');
console.log('Exported complete sanitized configuration with original line numbers; no services invoked.');
