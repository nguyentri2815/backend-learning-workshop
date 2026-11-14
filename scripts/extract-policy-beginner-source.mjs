import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {execFileSync} from 'node:child_process';

const root=process.argv[process.argv.indexOf('--root')+1];
if(!process.argv.includes('--root')||!root)throw Error('Use --root <agent-system> [--verify]');
const catalogPath='src/content/policy/beginner-source.json';
const legacy={...JSON.parse(fs.readFileSync('src/content/policy/assembly-source.json','utf8')),...JSON.parse(fs.readFileSync('src/content/policy/session-source.json','utf8'))};
const agent='workspaces/agent-service/';
const java='src/main/java/com/alpaca/agent/';
const paths=Object.fromEntries(['controller','quoteFunc','func','quoteRepo','repo','command','event','base','baseController','repositoryBean','repositoryExtension','save','dispatch','applyLoop','jdbcWrite','aggregate','quoteAggregate'].map(key=>[key,legacy[key].path]));
Object.assign(paths,{
 quoteController:agent+'1-agent-command-service/'+java+'controller/QuoteController.java',
 quoteRequest:agent+'agent-shared/'+java+'request/quote/CreateQuoteRequest.java',
 quoteCommand:agent+'4-agent-shared-domain/'+java+'command/quote/CreateQuoteCommand.java',
 quoteEvent:agent+'agent-shared/'+java+'event/quote/CreateQuoteEvent.java',
 quoteRead:agent+'1-agent-command-service/'+java+'function/quote/FindQuoteByIdFunc.java',
 quoteMarker:agent+'4-agent-shared-domain/'+java+'command/IQuoteCommand.java',
 quoteEventBase:agent+'agent-shared/'+java+'event/base/BaseQuoteEvent.java',
 baseEvent:'workspaces/1-shared/shared-base/src/main/java/com/alpaca/base/BaseEvent.java',
 status:agent+'agent-shared/'+java+'constant/PolicyStatus.java',
 syncStatus:agent+'agent-shared/'+java+'constant/SyncPolicyStatus.java',
 marker:agent+'4-agent-shared-domain/'+java+'command/IPolicyCommand.java',
 eventBase:agent+'agent-shared/'+java+'event/base/BasePolicyEvent.java',
 libra:'workspaces/1-shared/shared-eventuate/src/main/java/com/eventuate/domain/LibraAggregate.java',
 rabbit:agent+'1-agent-command-service/'+java+'config/RabbitTemplateConfig.java',
});
const existing=process.argv.includes('--verify')?JSON.parse(fs.readFileSync(catalogPath,'utf8')):null;
const sources={};
for(const [ref,relative] of Object.entries(paths)){
 const buffer=fs.readFileSync(path.join(root,relative));
 const sha256=crypto.createHash('sha256').update(buffer).digest('hex');
 if(existing&&existing[ref]?.sha256!==sha256)throw Error('Source drift: '+relative);
 sources[ref]={path:relative,symbol:ref,line:1,from:1,rows:buffer.toString('utf8').replace(/\r\n/g,'\n').replace(/\n$/,'').split('\n').map((text,i)=>({line:i+1,text})),sha256,
 commit:execFileSync('git',['-C',path.dirname(path.join(root,relative)),'rev-parse','HEAD'],{encoding:'utf8'}).trim(),
 modified:execFileSync('git',['-C',path.dirname(path.join(root,relative)),'status','--porcelain','--',path.join(root,relative)],{encoding:'utf8'}).trim()!==''};
}
if(!existing){
 fs.writeFileSync(catalogPath,JSON.stringify(sources,null,2)+'\n');
}
fs.writeFileSync('docs/review/policy-beginner-source-audit.json',JSON.stringify({reviewedOn:'2026-11-13',root,files:Object.entries(sources).map(([ref,{path,sha256,commit,modified}])=>({ref,path,sha256,commit,modified}))},null,2)+'\n');
console.log(`${existing?'Verified':'Captured'} ${Object.keys(sources).length} beginner source references.`);
