import { readFile, writeFile, stat } from "node:fs/promises";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { resolve } from "node:path";

// Only reads Java files/artifact metadata; never invokes Gradle, setup or services.
const root="D:/ALPACA/agent-system";
const modulePath="workspaces/agent-service/1-agent-command-service";
const previous=JSON.parse(await readFile(new URL("../src/content/setup/practice-source.json",import.meta.url),"utf8"));
const sha=value=>createHash("sha256").update(value).digest("hex");
const revision=path=>execFileSync("git",["--no-optional-locks","rev-parse","HEAD"],{cwd:resolve(root,path),encoding:"utf8"}).trim();
const revisions={workspace:revision("."),command:revision("workspaces/agent-service")};
async function excerpt(id,path,select,redact=text=>text) {
  const raw=await readFile(resolve(root,path),"utf8");
  return {id,path,sourceRoot:root,sourceSha256:sha(raw),revision:path.startsWith("workspaces/agent-service/")?revisions.command:revisions.workspace,lastModified:(await stat(resolve(root,path))).mtime.toISOString(),rows:raw.split(/\r?\n/).flatMap((text,i)=>select(text,i+1)?[{line:i+1,text:redact(text,i+1)}]:[])};
}
const files=[];
for(const id of ["default","dev"]) {
  const path=`${modulePath}/src/main/resources/application${id==="dev"?"-dev":""}.yml`;
  const original=previous.files.find(file=>file.id===id);
  const selected=new Set([...original.rows.map(row=>row.line),8,9,10,11,12,51,52,53,54,55,79,80,81,82,83,84,85,86,87,88,89,90,91,92,93,117,118,119,120]);
  files.push(await excerpt(id,path,(_,line)=>selected.has(line),(text,line)=>{
    const existing=original.rows.find(row=>row.line===line);
    if(existing) return existing.text;
    const pair=text.match(/^(\s*[\w.-]+\s*:\s*)(.*)$/);
    if(!pair||!pair[2].trim()) return text.trim().startsWith("#")?"# [đã che]":text;
    const value=pair[2].trim();
    if(/^\s*port:/.test(text)&&/^\d+$/.test(value)) return text;
    if(/^\s*host:/.test(text)&&value==="localhost") return text;
    const description=/redis:\/\/localhost:6379/.test(value)?"[đã che; Redis localhost; cổng 6379]":/localhost/.test(value)?"[đã che; localhost]":/https?:/.test(value)?"[đã che; API ngoài]":"[đã che]";
    return pair[1]+description;
  }));
}
files.push(await excerpt("compose","docker-compose-env.yml",text=>/^\s{0,2}[\w-]+:\s*$|^\s+container_name:|^\s+ports:|^\s+-\s*["']?\d+:\d+/.test(text)));
files.push(await excerpt("main",`${modulePath}/src/main/java/com/alpaca/agent/AgentCommandServiceApplication.java`,(_,line)=>line>=15&&line<=29));
files.push(await excerpt("security",`${modulePath}/src/main/java/com/alpaca/agent/config/ResourceServerConfiguration.java`,(_,line)=>line>=10&&line<=31));
files.push(await excerpt("wrapper-properties","gradle/wrapper/gradle-wrapper.properties",(_,line)=>line===3,text=>text.replace(/=.*/,"=[đã che; Gradle 8.14.3]")));
files.push(await excerpt("ide-project",".idea/misc.xml",text=>/ProjectRootManager/.test(text)));
files.push(await excerpt("ide-gradle",".idea/gradle.xml",text=>/gradleJvm/.test(text)));
files.push(await excerpt("ide-compiler",".idea/compiler.xml",text=>/bytecodeTargetLevel target=/.test(text)));
const artifactPath=`${modulePath}/build/libs/1-agent-command-service-0.0.1-SNAPSHOT.jar`;
const artifactStat=await stat(resolve(root,artifactPath));
const rawConfigs=await Promise.all(["application.yml","application-dev.yml"].map(name=>readFile(resolve(root,`${modulePath}/src/main/resources/${name}`),"utf8")));
if(!rawConfigs[1].split(/\r?\n/)[32].includes("localhost")||!rawConfigs.every(raw=>/redis:\/\/localhost:6379/.test(raw))) throw Error("Connection assumptions changed; review before export.");
const data={extractedAt:new Date().toISOString(),revisions,report:previous.report,limits:"Source hiện tại chỉ đọc; mô hình F–J và log minh họa không kiểm chứng máy thật. Không giữ raw transcript targeted build/startup trong báo cáo.",files,
  artifact:{path:artifactPath,bytes:artifactStat.size,lastModified:artifactStat.mtime.toISOString(),revision:revisions.command,kind:"Metadata artifact đọc từ filesystem; không chạy JAR"},
  connections:[
    {id:"postgres",name:"PostgreSQL write",line:33,service:"postgres-write",composeLine:77,portLine:80,hostPort:5432,containerPort:5432,purpose:"Lưu dữ liệu ghi/event của Command",historical:"S07: port/container từng được ghi nhận; chưa xác nhận DB/schema/quyền phiên mới"},
    {id:"rabbit",name:"RabbitMQ",line:52,service:"rabbitmq",composeLine:3,portLine:8,hostPort:5672,containerPort:5672,purpose:"Thông điệp AMQP",historical:"S07: tái dùng service project khác; cần xác nhận owner/quyền"},
    {id:"redis",name:"Redis",line:119,service:"redis",composeLine:65,portLine:70,hostPort:6379,containerPort:6379,purpose:"Cache/session",historical:"S07: tái dùng service project khác; cần xác nhận owner/quyền"},
  ],
  endpoint:{state:"Cần xác nhận",reason:"Có Actuator dependency và rule permitAll /actuator/**; chưa xác nhận exposure/base path/override và response hiện tại. Không cấp endpoint hay gửi request từ bài học.",sources:["build.gradle:73",`${modulePath}/src/main/java/com/alpaca/agent/config/ResourceServerConfiguration.java:19`,`${modulePath}/src/main/resources/application-dev.yml:64`]},
};
if(/https?:\/\/|jdbc:postgresql:\/\/|redis:\/\/|git@|glpat-/.test(JSON.stringify(data))) throw Error("Unexpected endpoint in export.");
await writeFile(new URL("../src/content/setup/practice-runtime-source.json",import.meta.url),JSON.stringify(data,null,2)+"\n");
console.log(`Exported ${files.length} sanitized runtime excerpts and artifact metadata. Java repo read only.`);
