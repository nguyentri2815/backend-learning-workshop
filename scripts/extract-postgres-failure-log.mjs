import fs from 'node:fs';
import crypto from 'node:crypto';

// Read-only import of the supplied console; never runs Gradle, Java, Docker or DB probes.
const input=process.argv[2];
if(!input)throw Error('Usage: node scripts/extract-postgres-failure-log.mjs <log-2.txt>');
const bytes=fs.readFileSync(input),lines=bytes.toString('utf8').split(/\r?\n/);
const expected={112:'Starting AgentCommandServiceApplication using Java 21',114:'profile is active: "dev"',182:'HikariPool-1 - Starting...',377:'Connection to localhost:5432 refused',3377:'Application run failed',4083:"bean with name 'entityManagerFactory'",4375:'Unable to open JDBC Connection',4547:'Connection to localhost:5432 refused',4939:'non-zero exit value 1',4949:'BUILD FAILED'};
for(const [line,text] of Object.entries(expected))if(!lines[Number(line)-1]?.includes(text))throw Error(`Source mismatch at L${line}`);
function redact(text){
 if(/password\s*[=:]|passwd|secret\s*[=:]|authorization|access.?token|refresh.?token|email\s*[=:]/i.test(text))return '[đã che dòng có thông tin nhạy cảm]';
 return text.replace(/[A-Z]:[\\/][^\s\]\)"']+/gi,'[đường dẫn đã che]')
  .replace(/started by \S+/g,'started by [đã che]').replace(/with PID \d+/g,'with PID [đã che]')
  .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi,'[email đã che]')
  .replace(/(?:jdbc:)?[a-z][a-z0-9+.-]*:\/\/[^\s"'<>]+/gi,'[URL đã che]')
  .replace(/\b(?:\d{1,3}\.){3}\d{1,3}\b/g,'[IP đã che]');
}
const selected=new Set([112,113,114,115,116,182,183,377,378,4936,4938,4939,4949]);
// Keep every Caused by in the final failure block, plus a little stack context.
for(let i=3376;i<4935;i++)if(i===3376||i===3377||lines[i].startsWith('Caused by:'))for(let offset=0;offset<=2;offset++)selected.add(i+1+offset);
const representative=new Set([112,114,182,377,3377,3378,4939,4949]);
const rows=[...selected].sort((a,b)=>a-b).map(line=>{
 const text=lines[line-1];
 const group=line<=116?'jvm':line===3377?'outcome':line>=4936?'shutdown':line<3377||line>=4083?'data':'beans';
 return {line,text:redact(text),group,level:text.startsWith('Caused by:')?'CAUSE':text.match(/\[(INFO|DEBUG|WARN|ERROR)\s*\]/)?.[1]??'TRACE',representative:representative.has(line)};
});
const data={version:1,name:'08/11 · dev · PostgreSQL từ chối kết nối',file:'log-2.txt',sourceDate:'2026-11-08',sourceLines:lines.length-(lines.at(-1)===''?1:0),sourceSha256:crypto.createHash('sha256').update(bytes).digest('hex'),redaction:'Che đường dẫn máy, tên người dùng, PID, email, URL ngoài phạm vi và IP. Giữ localhost:5432 để đối chiếu đích PostgreSQL đã thử. Số dòng là số dòng gốc; khoảng trống là phần không trích.',contextNote:'Bối cảnh do người chạy cung cấp: đã chủ động tắt Docker khi thử. Đây là thông tin riêng, không phải kết luận suy ra từ Connection refused.',rows};
fs.writeFileSync('src/content/setup/postgres-failure-log-source.json',JSON.stringify(data,null,2)+'\n');
console.log(`Imported ${rows.length} redacted excerpt lines; ${data.sourceLines} original lines, ${representative.size} landmarks.`);
