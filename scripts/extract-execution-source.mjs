import {readFile,writeFile,stat} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
const root='D:/ALPACA/agent-system',modulePath='workspaces/agent-service/1-agent-command-service';
const hash=text=>createHash('sha256').update(text).digest('hex');
const runtime=JSON.parse(await readFile(new URL('../src/content/setup/practice-runtime-source.json',import.meta.url),'utf8'));
const revisions={workspace:execFileSync('git',['--no-optional-locks','rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim(),command:execFileSync('git',['--no-optional-locks','rev-parse','HEAD'],{cwd:root+'/workspaces/agent-service',encoding:'utf8'}).trim()};
const definitions=[['root-build','build.gradle',[26,27,28,34,35,36,37,38,45,46,47,48,49,50,51,52,53]],['version','gradle.properties',[1]],['module-path','settings.gradle',[1,30]],['distribution',modulePath+'/build.gradle',[26,27,28,29,30,31,32,33,34,35,36,37,38,39,40]]];
const files=[];
for(const [id,path,numbers] of definitions){const raw=await readFile(root+'/'+path,'utf8');const rows=raw.split(/\r?\n/).flatMap((text,i)=>numbers.includes(i+1)?[{line:i+1,text}]:[]);files.push({id,path,rows,sourceSha256:hash(raw),revision:path.startsWith('workspaces/')?revisions.command:revisions.workspace});}
const artifactPath=modulePath+'/build/libs/1-agent-command-service-0.0.1-SNAPSHOT.jar';
const artifactStat=await stat(root+'/'+artifactPath);
if(!files.find(file=>file.id==='version').rows[0].text.includes('version=0.0.1-SNAPSHOT'))throw Error('Artifact version changed; reassess name.');
const reportPath='D:/tmp/agent-service-workspaces-setup-evidence-report.md',reportRaw=await readFile(reportPath,'utf8'),reportLines=reportRaw.split(/\r?\n/);
const historyDefinitions=[
 ['S09','Root build', [242,244,245,248,249,252,253,254,255,257], 'Agent thử root clean assemble; lỗi virtual parent workspaces:bootJar. Không phải bước bắt buộc mỗi lần chạy.'],
 ['S10','Đóng gói theo module',[259,261,262,263,268,269,272,273], 'Agent build các module đích thành công. Thiếu exact task/lệnh kết hợp và raw stdout; bootJar trong bài là lệnh hướng dẫn từ source.'],
 ['S11','Smoke test process/port',[275,277,278,281,283,289,291,292,294,299,301,302], 'Báo cáo ghi Command dev tại port 9901 rồi các process được dừng. Không có raw startup stdout hay bằng chứng API/nghiệp vụ.'],
 ['S05','Docker Engine',[187,189,190,191,192,193,194,195], 'Không đủ bằng chứng gán thao tác mở Docker Desktop hoặc cài đặt cho agent. Engine sẵn sàng không đồng nghĩa container đã được tạo.'],
 ['S06','Conflict infrastructure',[197,200,201,202,203,204,207], 'Có lịch sử thử toàn stack và gặp conflict; thiếu nguyên văn option file/project. Không lặp toàn stack trong bài.'],
 ['S07','Infrastructure chọn lọc',[209,211,212,213,218,219,220,221,222,223,224,225,227,230], 'Agent từng khởi động chọn lọc; Redis/RabbitMQ/Rebrow đã có từ project khác. Không suy ra agent tạo mọi container hoặc được phép tái dùng hiện tại.'],
 ['S08','Debezium riêng',[232,234,235,236,237,240], 'Lịch sử ghi agent-system-debezium và connector từng RUNNING; thiếu docker run/POST nguyên văn. Không tạo lại lệnh lịch sử bị thiếu.'],
];
const history=historyDefinitions.map(([id,title,numbers,note])=>({id,title,note,rows:numbers.map(line=>({line,text:reportLines[line-1]})).map(row=>({...row,text:/(?:https?:\/\/|jdbc:|redis:\/\/|password|secret|credential|client-secret)/i.test(row.text)?'[đã che giá trị nhạy cảm]':row.text}))}));
const observed=[];
for(const path of [modulePath+'/build',modulePath+'/build/classes/java/main',modulePath+'/build/libs']){const metadata=await stat(root+'/'+path);observed.push({path,directory:metadata.isDirectory(),lastModified:metadata.mtime.toISOString()});}
const data={extractedAt:new Date().toISOString(),sourceRoot:root,modulePath,gradlePath:':'+modulePath.replaceAll('/',':'),workspaceDirectory:root,mainClass:'com.alpaca.agent.AgentCommandServiceApplication',port:9901,revisions,files,artifact:{...runtime.artifact,path:artifactPath,bytes:artifactStat.size,lastModified:artifactStat.mtime.toISOString()},observed,report:{path:reportPath,sourceSha256:hash(reportRaw),history},limits:'Các metadata/source được đọc, không chạy Gradle/Java/Docker. Trạng thái xuất hiện trong bài là thao tác mô phỏng của người học, tách khỏi file/artifact hiện có và lịch sử agent.'};
const output=JSON.stringify(data,null,2)+'\n';
if(/https?:\/\/|jdbc:|redis:\/\/|glpat-|sqp_|[\w.+-]+@[\w.-]+\.[a-z]{2}/i.test(output))throw Error('Unexpected sensitive literal in export');
await writeFile(new URL('../src/content/setup/execution-source.json',import.meta.url),output);
console.log('Exported build source, artifact metadata and selected redacted setup references; Java/report read only.');
