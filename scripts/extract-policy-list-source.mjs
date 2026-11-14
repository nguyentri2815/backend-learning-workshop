// Read Java only; never starts the backend, calls an API, or connects to a DB.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {execFileSync} from 'node:child_process';
const argument=process.argv.indexOf('--root');
if(argument<0)throw Error('Pass --root <agent-system> explicitly.');
const root=path.resolve(process.argv[argument+1]);
const hash=text=>crypto.createHash('sha256').update(text).digest('hex');
const git=(directory,...args)=>execFileSync('git',['-C',path.join(root,directory),...args],{encoding:'utf8'}).trim();
const agent='workspaces/agent-service',shared='workspaces/1-shared',java='src/main/java/com/alpaca/';
const definitions=[
 ['api',agent,`3-agent-query-service/${java}agent/controller/PolicyController.java`,19,27,'PolicyController.search'],
 ['request',agent,`agent-shared/${java}agent/request/policy/SearchPolicyRequest.java`,14,34,'SearchPolicyRequest'],
 ['search',agent,`3-agent-query-service/${java}agent/function/policy/SearchPolicyFunc.java`,38,119,'SearchPolicyFunc.doFilter / exec'],
 ['query',agent,`agent-shared/${java}agent/util/QueryUtil.java`,58,147,'QueryUtil · AND, LIKE, ANY, BETWEEN, IN, sort'],
 ['repository',agent,`5-agent-shared-entity/${java}agent/repository/QueryCustomRepository.java`,26,39,'QueryCustomRepository.executeCustomSqlQuery'],
 ['entity',agent,`5-agent-shared-entity/${java}agent/entity/PolicyViewEntity.java`,21,35,'PolicyViewEntity'],
 ['response',agent,`agent-shared/${java}agent/response/policy/PolicyListResponse.java`,13,56,'PolicyListResponse'],
 ['saleUnit',agent,`5-agent-shared-entity/${java}agent/repository/SaleUnitViewRepository.java`,13,16,'SaleUnitViewRepository.findByUserName'],
 ['config',agent,`3-agent-query-service/${java}agent/helper/ConfigUtil.java`,7,17,'ConfigUtil · schema / local / localUsername'],
 ['security',agent,`3-agent-query-service/${java}agent/config/ResourceServerConfiguration.java`,13,32,'ResourceServerConfiguration.securityFilterChain'],
 ['flow',agent,`2-agent-flow-service/${java}agent/function/PolicySyncViewFunc.java`,37,76,'PolicySyncViewFunc.exec / collectSearchingKeys'],
 ['workflow',agent,`2-agent-flow-service/${java}agent/workflow/PolicyWorkflow.java`,20,28,'PolicyWorkflow.createPolicy'],
 ['detail',agent,`1-agent-command-service/${java}agent/controller/PolicyController.java`,43,51,'PolicyController.paymentMethod · GET /policy/{id}'],
 ['renewal',agent,`3-agent-query-service/${java}agent/function/policy/SearchRenewalPolicyFunc.java`,37,105,'SearchRenewalPolicyFunc · mẫu đọc tương tự'],
 ['basePage',shared,`shared-base/${java}base/service/request/BasePageRequest.java`,7,12,'BasePageRequest · defaults'],
 ['baseSort',shared,`shared-base/${java}base/service/request/BasePageAndSortRequest.java`,8,12,'BasePageAndSortRequest'],
 ['sortDto',shared,`shared-base/${java}base/service/request/BaseSort.java`,12,15,'BaseSort · asc=true'],
 ['controllerBase',shared,`shared-base/${java}base/controller/BaseController.java`,10,15,'BaseController · context / executor'],
 ['identity',shared,`shared-webmvc/${java}common/SessionUtils.java`,36,44,'SessionUtils.getUsername'],
 ['pageable',shared,`shared-database/${java}database/util/PageableUtils.java`,51,68,'PageableUtils.convertPageableAndSort'],
 ['text',shared,`shared-base/${java}util/TextUtils.java`,39,41,'TextUtils.convertStringToSort'],
 ['mapping',shared,`shared-base/${java}util/MappingUtils.java`,61,63,'MappingUtils.mapObject'],
 ['wrap',shared,`shared-base/${java}base/service/response/WrapResponse.java`,32,37,'WrapResponse.ok'],
];
const sources=Object.fromEntries(definitions.map(([id,directory,file,from,to,symbol])=>{
 const relative=`${directory}/${file}`,bytes=fs.readFileSync(path.join(root,relative));
 const lines=bytes.toString('utf8').replace(/\r\n/g,'\n').replace(/\n$/,'').split('\n');
 if(from<1||to>lines.length)throw Error(`Range outside ${relative}`);
 return [id,{id,path:relative,symbol,from,to,commit:git(directory,'rev-parse','HEAD'),modified:git(directory,'status','--porcelain','--',file)!=='',sha256:hash(bytes),rows:lines.map((text,i)=>({line:i+1,text}))}];
}));
const output=new URL('../src/content/policy/list-source.json',import.meta.url);
const document={reviewedOn:'2026-11-11',rootCommit:git('.','rev-parse','HEAD'),sources};
if(process.argv.includes('--check')){
 const existing=JSON.parse(fs.readFileSync(output,'utf8'));
 if(JSON.stringify(existing)!==JSON.stringify(document))throw Error('List source differs from reviewed snapshot. Review before re-extracting.');
 console.log(`Verified ${definitions.length} complete Java files against read-only source.`);
}else{fs.writeFileSync(output,JSON.stringify(document,null,2)+'\n');console.log(`Extracted ${definitions.length} complete Java files.`);}
