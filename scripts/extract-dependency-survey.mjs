import {readFile,writeFile,readdir,stat} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {groups,proofs,paths} from './dependency-survey-definition.mjs';
const root='D:/ALPACA/agent-system';
const hash=raw=>createHash('sha256').update(raw).digest('hex');
const infrastructure=JSON.parse(await readFile(new URL('../src/content/setup/practice-infrastructure-source.json',import.meta.url),'utf8'));
const history=JSON.parse(await readFile(new URL('../src/content/setup/practice-runtime-source.json',import.meta.url),'utf8'));
const revisions={workspace:execFileSync('git',['--no-optional-locks','rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim(),command:execFileSync('git',['--no-optional-locks','rev-parse','HEAD'],{cwd:root+'/workspaces/agent-service',encoding:'utf8'}).trim()};
for(const [name,path] of [['shared','workspaces/1-shared'],['assets','workspaces/2-infrastructure/assets-service'],['sso','workspaces/2-infrastructure/sso-server']])revisions[name]=execFileSync('git',['--no-optional-locks','rev-parse','HEAD'],{cwd:root+'/'+path,encoding:'utf8'}).trim();
const revisionFor=path=>path.startsWith('workspaces/agent-service/')?revisions.command:path.startsWith('workspaces/1-shared/')?revisions.shared:path.startsWith('workspaces/2-infrastructure/assets-service/')?revisions.assets:path.startsWith('workspaces/2-infrastructure/sso-server/')?revisions.sso:revisions.workspace;
function redactJava(text){
 if(text.trim().startsWith('//')||text.trim().startsWith('*'))return '// [đã che chú thích]';
 return text.replace(/"([^"\\]*(?:\\.[^"\\]*)*)"/g,(_,literal)=>{
   if(literal.startsWith('${')){const key=literal.match(/^\$\{([\w.-]+)/)?.[1];return key?'"${'+key+(literal.includes(':')?':[đã che]':'')+'}"':'"[đã che]"';}
   if(/^\/[\w/{}*.-]*$/.test(literal)||['sale-unit','internal','redissonClient','redissonSessionClient','redissonPersistentClient','com.alpaca'].includes(literal))return '"'+literal+'"';
   return '"[đã che]"';
 });
}
const evidence=[];
async function excerpt(id,path,start,end,symbol){
 const raw=await readFile(root+'/'+path,'utf8');const lines=raw.split(/\r?\n/);
 if(start>lines.length)throw Error('Range outside source: '+id);
 const compose=path==='docker-compose-env.yml'?infrastructure.files.find(file=>file.id==='compose'):null;
 const rows=lines.flatMap((text,i)=>i+1>=start&&i+1<=end?[{line:i+1,text:compose?compose.rows.find(row=>row.line===i+1).text:redactJava(text)}]:[]);
 evidence.push({id,path,symbol,start,end:Math.min(end,lines.length),sourceSha256:hash(raw),revision:revisionFor(path),lastModified:(await stat(root+'/'+path)).mtime.toISOString(),rows});
}
for(const args of proofs)await excerpt(...args);
const scanned=[];
async function scan(directory){for(const item of await readdir(root+'/'+directory,{withFileTypes:true})){if(['.git','build','.gradle'].includes(item.name))continue;const path=directory+'/'+item.name;if(item.isDirectory())await scan(path);else if(/\.java$|\.gradle$|\.ya?ml$|\.properties$/.test(item.name))scanned.push({path,raw:await readFile(root+'/'+path,'utf8')});}}
for(const dir of [paths.command+'/src/main',paths.agent+'/src/main',paths.shared])await scan(dir);
const commandCode=scanned.filter(file=>file.path.startsWith(paths.command+'/src/main/java/')||file.path.startsWith(paths.agent+'/src/main/java/'));
const otherClients=[];
for(const file of scanned.filter(file=>file.path.startsWith(paths.shared+'/shared-proxy/src/main/java/')&&file.raw.includes('@FeignClient'))){
 const symbol=file.raw.match(/interface\s+(\w+)/)?.[1];if(!symbol)continue;
 const keys=[...file.raw.matchAll(/\$\{([\w.-]+)/g)].map(match=>match[1]);
 const line=file.raw.split(/\r?\n/).findIndex(text=>text.includes('@FeignClient'))+1;
 const id='shared-'+symbol.toLowerCase();await excerpt(id,file.path,line,line+14,symbol+' · Feign declaration');
 const callers=commandCode.filter(candidate=>candidate.path!==file.path&&new RegExp('\\b'+symbol+'\\b').test(candidate.raw)).map(candidate=>candidate.path);
 const owner=groups.find(group=>group.id!=='shared-clients'&&group.keys.some(key=>keys.includes(key)));
 if(owner)owner.binding.push(id);
 otherClients.push({symbol,keys,groupId:owner?.id||'shared-clients',proof:id,callers,note:callers.length?'Có tham chiếu kiểu; cần kiểm tra method gọi và điều kiện.':'Chưa tìm thấy trong phạm vi Command/agent-shared đã khảo sát.'});
}
groups.find(group=>group.id==='shared-clients').binding.unshift(...otherClients.filter(client=>client.groupId==='shared-clients').map(client=>client.proof));
const configs=infrastructure.files.filter(file=>['default','dev'].includes(file.id)).map(file=>({...file,rows:file.rows.filter(row=>new Set(groups.flatMap(group=>group.lines)).has(row.line))}));
const rawConfigs=await Promise.all(['application.yml','application-dev.yml'].map(name=>readFile(root+'/'+paths.command+'/src/main/resources/'+name,'utf8')));
for(let index=0;index<rawConfigs.length;index++){
 const raw=rawConfigs[index],lines=raw.split(/\r?\n/);
 if(raw.includes('sp-query:'))throw Error('Query key gap changed; reassess alias/override.');
 const redisLines=[118,119,120].map(offset=>lines[offset].trim().replace(/^[\w-]+:\s*/,''));
 if(new Set(redisLines).size!==1)throw Error('Redis targets diverged; reassess endpoint grouping.');
 const introspection=lines[18];if(!/^\s*introspection-uri:\s*\$\{system\.sso-service\.api\}\/oauth\/check_token\s*$/.test(introspection))throw Error('SSO introspection expression changed');
 configs[index].rows.find(row=>row.line===19).text=introspection;
}
function location(raw,line){
 if(!line)return {kind:'unknown',description:'Chưa xác định đích hiệu lực; kiểm tra annotation default / override.'};
 const text=raw.split(/\r?\n/)[line-1];
 const variable=text.match(/\$\{([\w.-]+):localhost\}/)?.[1];
 if(variable)return {kind:'loopback',description:variable+' nếu được đặt sẽ thay đích; mặc định localhost trên host chạy Java.'};
 if(/localhost|127\.0\.0\.1/.test(text))return {kind:'loopback',description:'Loopback của host chạy Java; chưa chứng minh dịch vụ do Docker hay process host cung cấp.'};
 if(/https?:/.test(text))return {kind:'remote',description:'URL ngoài loopback trong source, đã che đích; cần kiểm tra truy cập/auth và override.'};
 return {kind:'unknown',description:'Chưa xác định nơi cung cấp chỉ từ khóa này.'};
}
for(const group of groups){
 group.targets={base:location(rawConfigs[0],group.targetLine),dev:location(rawConfigs[1],group.targetLine)};
 group.history=history.connections.find(connection=>connection.id===group.id)?.historical||'Chưa có bằng chứng runtime riêng cho kết nối này trong tài liệu bàn giao đã đối chiếu.';
 group.runtime='Chưa kiểm chứng runtime hiện tại. Đọc source không mở kết nối.';
 if(group.id==='shared-clients')group.keys=otherClients.filter(client=>client.groupId===group.id).flatMap(client=>client.keys);
 if(group.id==='sms')group.targets={base:{kind:'remote',description:'Default endpoint từ xa ở SmsApi; chưa thấy override trong hai YAML.'},dev:{kind:'remote',description:'Default endpoint từ xa ở SmsApi; chưa thấy override trong hai YAML.'}};
}
const resourceFiles=scanned.filter(file=>/src\/main\/resources\/.*\.(ya?ml|properties)$/.test(file.path));
const imports=resourceFiles.flatMap(file=>file.raw.split(/\r?\n/).flatMap((line,i)=>/spring\.config\.(import|location|additional-location)|^\s*(import|include|on-profile):/.test(line)?[{path:file.path,line:i+1,note:'Cần kiểm tra import/profile này; không tự tải cấu hình ngoài.'}]:[]));
const data={extractedAt:new Date().toISOString(),sourceRoot:root,revisions,scope:{module:'Command',profiles:['base','dev'],javaFiles:scanned.filter(file=>file.path.endsWith('.java')).length,resourceFiles:resourceFiles.length,knownImports:imports,overrideLimit:'Đã đọc base/dev và kiểm tra chỉ dấu import trong resources đã khảo sát. Run Configuration, args, VM properties, environment và file ngoài chưa được đọc; không kết luận cấu hình runtime thật.',negativeSearchLimit:'Không tìm thấy nghĩa là chưa tìm thấy trong Command, agent-shared và shared libraries đã đọc; không chứng minh cấu hình/client không dùng.',historyLimit:'S07/S11/S17 là lịch sử setup/process, không chứng minh từng client đã gọi thành công.'},configs,evidence,groups,otherClients,business:{id:'document-redirect',label:'Đọc tài liệu đại lý và trả redirect',method:'POST',path:'/sale-unit/download-document/{documentType}',chain:['business-root','business-entry','business-call','repository','transaction','session','self-call'],result:'Đọc SaleUnitRepository, lấy mã tài liệu rồi trả HTTP 302 Location dùng system.assets.url. Command không gọi InternalAssetsApi trong nhánh này; client cần Assets nếu theo redirect.',limits:'Cần user/rootId và dữ liệu document hợp lệ. Context path/gateway, token và dữ liệu thử chưa xác nhận; không cấp nút gọi API thật.'}};
const serialized=JSON.stringify(data,null,2)+'\n';
if(/https?:\/\/|redis:\/\/|jdbc:postgresql:\/\/|Alpaca#|sqp_|glpat-|[\w.+-]+@[\w.-]+\.[a-z]{2}/i.test(serialized))throw Error('Unexpected sensitive literal in export');
await writeFile(new URL('../src/content/setup/dependency-survey.json',import.meta.url),serialized);
const rows=groups.map(group=>`| ${group.label} | ${group.keys.join('<br>')||'Hạ tầng / cấu hình shared'}${group.lines.length?'<br>Base/dev, dòng '+group.lines.join(', '):'<br>Không có khóa trong base/dev; xem annotation/Compose'} | ${group.binding.map(id=>{const p=evidence.find(item=>item.id===id);return p?'`'+p.path+':'+p.start+'` ('+p.symbol+')':id;}).join('<br>')||'Chưa tìm thấy binding Java'} | ${group.call.map(id=>{const p=evidence.find(item=>item.id===id);return '`'+p.path+':'+p.start+'` ('+p.symbol+')';}).join('<br>')||'Chưa tìm thấy trong phạm vi khảo sát'} | ${group.when} ${group.condition} ${group.limit} |`);
const report=[
 '# Bảng khảo sát dependency Command',
 `Tạo từ source chỉ đọc lúc ${data.extractedAt}. Đếm ${groups.length} nhóm khảo sát (gồm cả URL điều hướng và client chưa tìm caller), không phải số service bắt buộc.`,
 data.scope.overrideLimit,
 `Base/dev trong bảng lần lượt là \`${paths.command}/src/main/resources/application.yml\` và \`${paths.command}/src/main/resources/application-dev.yml\`. Số dòng là dòng file gốc, trước khi che. Khóa không có trong hai file được chỉ về annotation hoặc Compose riêng.`,
 data.scope.negativeSearchLimit,
 '| Nhóm | Khóa và nguồn | Binding / client và bằng chứng | Nơi gọi / điều kiện | Thời điểm và khoảng trống |\n|---|---|---|---|---|\n'+rows.join('\n'),
 '## Nhánh nghiệp vụ đã lần',
 `${data.business.method} \`${data.business.path}\` → SaleUnitController.downloadDocument → DownloadDocumentFunc.exec → SaleUnitRepository.findById → response 302 Location. ${data.business.result} ${data.business.limits}`,
 '## Phạm vi và bằng chứng',
 `${data.scope.javaFiles} Java files và ${data.scope.resourceFiles} resource files đã quét; shared root có cả source test trong lượt quét chung, caller/type reference của các Feign bổ sung chỉ tìm trong Command/agent-shared src/main. Chỉ xuất đoạn được chọn, đã che literals. knownImports: ${imports.length}; không có nghĩa file cấu hình bên ngoài không tồn tại. ${data.scope.historyLimit}`,
 'Custom InvalidTokenAwareOpaqueTokenIntrospector có trong shared-auth và được Flow đăng ký; Command chỉ cấu hình opaqueToken trong ResourceServerConfiguration, nên không dùng class đó làm bằng chứng binding của Command.',
 'Quét thêm HTTP client: HistoryUtil khai báo RestTemplate nhưng chưa tìm method call trên field đó; LoadbalancerConfig tạo bean không tự chứng minh một endpoint mới. RestDeployment/Camunda nằm ở shared-camunda, chưa thấy dependency Gradle từ các module Command/shared đã lần, nên không đưa vào danh sách service Command phải chạy.',
 'Bằng chứng file/dòng/SHA-256 và revision nằm trong `src/content/setup/dependency-survey.json`. Không chạy Java/Docker/DB hoặc gọi API.',
];
await writeFile(new URL('../docs/DEPENDENCY-SOURCE-AUDIT.md',import.meta.url),report.join('\n\n')+'\n');
console.log(`Exported ${groups.length} survey groups, ${evidence.length} redacted excerpts, ${otherClients.length} shared Feign declarations.`);
