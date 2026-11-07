import fs from 'node:fs';
import crypto from 'node:crypto';
const root='D:/ALPACA/agent-system',command='workspaces/agent-service/1-agent-command-service';
const specs={
 main:[`${command}/src/main/java/com/alpaca/agent/AgentCommandServiceApplication.java`,15,28],jdk:['build.gradle',44,50],ide:['.idea/workspace.xml',93,109],
 base:[`${command}/src/main/resources/application.yml`,30,46],dev:[`${command}/src/main/resources/application-dev.yml`,30,56],
 cache:['workspaces/1-shared/shared-cache/src/main/java/com/alpaca/config/SpringCacheConfig.java',22,56],
 bootstrap:[`${command}/src/main/java/com/alpaca/agent/config/InitConfig.java`,54,72],bootstrapLock:[`${command}/src/main/java/com/alpaca/agent/config/InitConfig.java`,173,184],
 rabbit:['workspaces/1-shared/shared-amqp/src/main/java/com/alpaca/amqp/config/RabbitMQConfig.java',28,42],
 listener:[`${command}/src/main/java/com/alpaca/agent/action/QueueScheduleHandler.java`,16,25],
 kafka:['workspaces/1-shared/shared-event-sourcing/src/main/java/com/eventsourcing/common/event/impl/EventuateKafkaAggregateSubscriptions.java',99,106],
 composeKafka:['docker-compose-env.yml',23,33],
 eventBeans:['workspaces/1-shared/shared-event-sourcing/src/main/java/com/eventsourcing/configuration/client/EventuateJavaClientDomainEventsConfiguration.java',16,29],
 security:[`${command}/src/main/java/com/alpaca/agent/config/ResourceServerConfiguration.java`,14,31],
 health:['workspaces/1-shared/shared-webmvc/src/main/java/com/alpaca/interceptor/LogApiInterceptor.java',44,50],
 external:[`${command}/src/main/resources/application-dev.yml`,72,83]
};
const redact=text=>/password|username|secret|token|phone|email/i.test(text)&&!text.includes('opaqueToken')?'[đã che dòng nhạy cảm]':text.replace(/(?:jdbc:)?[a-z][a-z0-9+.-]*:\/\/[^\s"'<>]+/gi,'[URL đã che]').replace(/\b(?:\d{1,3}\.){3}\d{1,3}\b/g,'[IP đã che]').replace(/ADVERTISED_HOST_NAME=.*/,'ADVERTISED_HOST_NAME=[hostname đã che]');
const refs=Object.fromEntries(Object.entries(specs).map(([id,[path,from,to]])=>{const bytes=fs.readFileSync(`${root}/${path}`);return [id,{path,from,to,sha256:crypto.createHash('sha256').update(bytes).digest('hex'),rows:bytes.toString('utf8').split(/\r?\n/).slice(from-1,to).map((text,i)=>({line:from+i,text:redact(text)}))}];}));
const history=JSON.parse(fs.readFileSync('src/content/setup/command-startup-source.json','utf8'));
refs.failure={path:history.log.path,from:19075,to:24260,sha256:history.log.sha256,rows:history.datasets.find(d=>d.id==='default-failure').rows.filter(row=>/Application run failed|SocketTimeoutException|PSQLException|entityManagerFactory/.test(row.text)).map(row=>({line:row.line,text:row.text}))};
fs.writeFileSync('src/content/setup/command-case-source.json',JSON.stringify({sourceRoot:root,refs,limits:'Chỉ đọc source và log lịch sử agent-system. Ngoài case timeout đã lưu, dấu hiệu/kiểm tra/sửa/kết quả trong thư viện là dữ kiện mô phỏng; không là lịch sử repo, không chạy Java/Docker/DB/API thật.'},null,2)+'\n');
console.log(`Captured ${Object.keys(refs).length} read-only case references, with redacted excerpts.`);
