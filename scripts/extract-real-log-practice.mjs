import fs from 'node:fs';
import crypto from 'node:crypto';

// Explicit, read-only import of the supplied console. Never launches the backend.
const input=process.argv[2];
if(!input)throw Error('Usage: node scripts/extract-real-log-practice.mjs <log-start-command.txt>');
const bytes=fs.readFileSync(input),lines=bytes.toString('utf8').split(/\r?\n/);
const expected={112:'Starting AgentCommandServiceApplication using Java 21',114:'default',183:'Added connection',184:'Start completed',187:"Database JDBC URL [Connecting through datasource 'HikariDataSource (HikariPool-1)']",280:'Initialized JPA',331:'Tomcat initialized',3205:'Application run failed',3432:'Unable to connect to Redis',3469:'Connection refused',3499:'exit code 1'};
for(const [line,text] of Object.entries(expected))if(!lines[Number(line)-1]?.includes(text))throw Error(`Source mismatch at L${line}`);
function redact(text){
 if(/password\s*[=:]|passwd|secret\s*[=:]|authorization|access.?token|refresh.?token|email\s*[=:]/i.test(text))return '[đã che dòng có thông tin nhạy cảm]';
 return text.replace(/[A-Z]:[\\/][^\s\]\)"']+/gi,'[đường dẫn đã che]').replace(/started by \S+/g,'started by [đã che]').replace(/with PID \d+/g,'with PID [đã che]').replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi,'[email đã che]');
}
const event=lines.findIndex(line=>/Bean 'com.eventsourcing.configuration.client.EventuateJavaClientDomainCrudConfiguration'/.test(line))+1;
if(!event)throw Error('Missing Eventuate observation');
const selected=new Set([112,113,114,115,116,183,184,187,280,event,331,336,346,347,348,349,350,...Array.from({length:275},(_,i)=>3205+i),3499]);
function group(line){if(line<=116)return 'jvm';if([183,184,187,280].includes(line))return 'data';if(line===event)return 'events';if([331,336].includes(line))return 'web';if(line===346||line>=3432&&line<=3479)return 'clients';if(line>=348&&line<=350||line===3499)return 'shutdown';return 'beans';}
const representative=new Set([112,114,183,184,280,event,331,346,350,3205,3206,3229,3245,3274,3317,3432,3469,3499]);
const rows=[...selected].sort((a,b)=>a-b).map(line=>({line,text:redact(lines[line-1]),group:line===3205?'outcome':group(line),level:lines[line-1].startsWith('Caused by:')?'CAUSE':lines[line-1].match(/\[(INFO|DEBUG|WARN|ERROR)\s*\]/)?.[1]??'TRACE',representative:representative.has(line)}));
const data={version:1,name:'Phiên lỗi thật · 07/11/2026 16:09 · default',file:'log-start-command.txt',sourceDate:'2026-11-07',sourceLines:3499,sourceSha256:crypto.createHash('sha256').update(bytes).digest('hex'),redaction:'Che đường dẫn máy, tên người dùng, PID và thông tin nhạy cảm; giữ loopback 127.0.0.1:6379 để học đối chiếu địa chỉ. Trích đoạn giữ nguyên số dòng gốc; khoảng trống là đoạn không trích.',eventLine:event,rows};
fs.writeFileSync('src/content/setup/real-log-practice-source.json',JSON.stringify(data,null,2)+'\n');
console.log(`Imported ${rows.length} redacted excerpt lines; ${representative.size} reading landmarks.`);
