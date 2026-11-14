// Read-only snapshot; this script does not run Java, a queue, a database or an API.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {execFileSync} from 'node:child_process';
const arg=process.argv.indexOf('--root');
if(arg<0||!process.argv[arg+1])throw Error('Pass --root <agent-system>.');
const root=path.resolve(process.argv[arg+1]),a='workspaces/agent-service',shared='workspaces/1-shared',schedule='workspaces/2-infrastructure/schedule-service',j='src/main/java/com/alpaca/';
const definitions={
 schedulerApp:[schedule,`${j}schedule/ScheduleServiceApplication.java`],
 scheduler:[schedule,`${j}schedule/service/ScheduleService.java`],
 queueNames:[shared,`shared-notification/${j}notification/common/RabbitMQQueue.java`],
 queue:[a,`1-agent-command-service/${j}agent/action/QueueHandler.java`],
 queueConfig:[a,`1-agent-command-service/${j}agent/config/RabbitTemplateConfig.java`],
 auto:[a,`1-agent-command-service/${j}agent/function/policy/PolicyAutoUpdateStatusFunc.java`],
 statuses:[a,`agent-shared/${j}agent/constant/PolicyStatus.java`],
 dto:[a,`agent-shared/${j}agent/model/dto/PolicyDTOModel.java`],
 policyRepository:[a,`4-agent-shared-domain/${j}agent/repository/PolicyRepository.java`],
 policy:[a,`4-agent-shared-domain/${j}agent/domain/PolicyAggregate.java`],
 statusCommand:[a,`4-agent-shared-domain/${j}agent/command/policy/UpdatePolicyStatusCommand.java`],
 statusEvent:[a,`agent-shared/${j}agent/event/policy/UpdatePolicyStatusEvent.java`],
 policyApi:[a,`1-agent-command-service/${j}agent/controller/PolicyController.java`],
 internalPolicy:[a,`1-agent-command-service/${j}agent/controller/internal/InternalPolicyController.java`],
 findPolicy:[a,`1-agent-command-service/${j}agent/function/policy/FindPolicyByIdFunc.java`],
 adapterApi:[a,`1-agent-command-service/${j}agent/controller/AdapterController.java`],
 endorsement:[a,`1-agent-command-service/${j}agent/function/policy/core/SyncEndorsementFromCoreFunc.java`],
 endorsementCommand:[a,`4-agent-shared-domain/${j}agent/command/policy/SyncEndorsementForPolicyCommand.java`],
 endorsementEvent:[a,`agent-shared/${j}agent/event/policy/SyncEndorsementForPolicyEvent.java`],
 endorsementRequest:[a,`agent-shared/${j}agent/request/policy/SyncEndorsementRequest.java`],
 create:[a,`1-agent-command-service/${j}agent/function/policy/CreatePolicyFunc.java`],
 approve:[a,`1-agent-command-service/${j}agent/function/quote/ApprovePaymentFunc.java`],
 approveNow:[a,`1-agent-command-service/${j}agent/function/quote/ApprovePaymentNowFunc.java`],
 onlineCreate:[a,`1-agent-command-service/${j}agent/function/policy/core/CreatePolicyForPaymentOnlineFunc.java`],
 cashCreate:[a,`1-agent-command-service/${j}agent/function/policy/core/CreatePolicyForCash.java`],
 untraced:[a,`1-agent-command-service/${j}agent/function/policy/core/CreatePolicyWithoutLockAndTransactionFunc.java`],
 quoteApi:[a,`1-agent-command-service/${j}agent/controller/QuoteController.java`],
 quoteRepository:[a,`4-agent-shared-domain/${j}agent/repository/QuoteRepository.java`],
 quoteUtil:[a,`1-agent-command-service/${j}agent/helper/QuoteUtil.java`],
 approvalRequest:[a,`agent-shared/${j}agent/request/quote/ApprovePaymentRequest.java`],
 paymentApi:[a,`1-agent-command-service/${j}agent/controller/PaymentController.java`],
 payQuote:[a,`1-agent-command-service/${j}agent/function/payment/PayForQuoteFunc.java`],
 paidQuote:[a,`1-agent-command-service/${j}agent/function/payment/PaidForQuoteFunc.java`],
 scanPaid:[a,`1-agent-command-service/${j}agent/function/payment/ScanPaymentPaidFunc.java`],
 scanApi:[a,`1-agent-command-service/${j}agent/controller/ScheduleController.java`],
 quoteProcessor:[a,`1-agent-command-service/${j}agent/function/payment/processor/GateWayPaymentQuoteProcessor.java`],
 cashProcessor:[a,`1-agent-command-service/${j}agent/function/payment/processor/CashQuoteProcessor.java`],
 quote:[a,`4-agent-shared-domain/${j}agent/domain/QuoteAggregate.java`],
 paymentRequest:[a,`agent-shared/${j}agent/request/payment/PaymentRequest.java`],
 quotePaidEvent:[shared,`shared-proxy/${j}proxy/model/payment/QuotePaidEvent.java`],
 offline:[a,`1-agent-command-service/${j}agent/function/payment/base/OfflineQuotePaymentFlow.java`],
 online:[a,`1-agent-command-service/${j}agent/function/payment/base/OnlineQuotePaymentFlow.java`],
 createCommand:[a,`4-agent-shared-domain/${j}agent/command/policy/CreatePolicyCommand.java`],
 createEvent:[a,`agent-shared/${j}agent/event/policy/CreatePolicyEvent.java`],
 workflow:[a,`2-agent-flow-service/${j}agent/workflow/PolicyWorkflow.java`],
 syncView:[a,`2-agent-flow-service/${j}agent/function/PolicySyncViewFunc.java`],
 viewEntity:[a,`5-agent-shared-entity/${j}agent/entity/PolicyViewEntity.java`],
 viewRepository:[a,`5-agent-shared-entity/${j}agent/repository/PolicyViewRepository.java`],
 internalApi:[a,`agent-shared/${j}agent/api/InternalSPCommandApi.java`],
 syncStatuses:[a,`agent-shared/${j}agent/constant/SyncPolicyStatus.java`],
 uploaderStatuses:[a,`agent-shared/${j}agent/common/ViaUploaderStatus.java`],
 corePaymentStatuses:[shared,`shared-proxy/${j}proxy/common/PaymentStatus.java`],
 commandPaymentStatuses:[a,`agent-shared/${j}agent/common/PaymentStatus.java`],
 quoteStatuses:[a,`agent-shared/${j}agent/constant/QuoteStatus.java`],
 paymentConstants:[a,`agent-shared/${j}agent/common/ConstantPayment.java`],
 mapping:[shared,`shared-base/${j}util/MappingUtils.java`],
 dateUtils:[shared,`shared-base/${j}util/DateTimesUtils.java`],
 baseEvent:[shared,`shared-base/${j}base/BaseEvent.java`],
 basePolicyEvent:[a,`agent-shared/${j}agent/event/base/BasePolicyEvent.java`],
 aggregateRepository:[shared,'shared-event-sourcing/src/main/java/io/eventuate/sync/AggregateRepository.java'],
 store:[shared,'shared-event-sourcing/src/main/java/com/eventsourcing/common/jdbc/impl/EventuateJdbcAccessImpl.java'],
};
const git=(dir,...args)=>execFileSync('git',['-C',path.join(root,dir),...args],{encoding:'utf8'}).trim();
const sources=Object.fromEntries(Object.entries(definitions).map(([id,[dir,file]])=>{
 const bytes=fs.readFileSync(path.join(root,dir,file)),rows=bytes.toString('utf8').replace(/\r\n/g,'\n').replace(/\n$/,'').split('\n').map((text,i)=>({line:i+1,text}));
 return [id,{path:`${dir}/${file}`,symbol:path.basename(file,'.java'),line:1,from:1,to:rows.length,rows,commit:git(dir,'rev-parse','HEAD'),modified:git(dir,'status','--porcelain','--',file)!=='',sha256:crypto.createHash('sha256').update(bytes).digest('hex')}];
}));
const scheduleConfiguration=['application.yml','application-dev.yml','application-test.yml','application-prod.yml'].map(file=>{const relative=`${schedule}/src/main/resources/${file}`,bytes=fs.readFileSync(path.join(root,relative)),rows=bytes.toString('utf8').split(/\r?\n/);return {path:relative,sha256:crypto.createHash('sha256').update(bytes).digest('hex'),excerptOnly:true,rows:[15,19].map(line=>({line,text:rows[line-1]}))};});
const result={scheduleConfiguration,reviewedOn:'2026-11-11',rootCommit:git('.','rev-parse','HEAD'),callerAudit:{symbol:'CreatePolicyWithoutLockAndTransactionFunc',scope:'workspaces; Java/XML/YML/YAML/properties searched case-insensitively including ignored files',matches:'Only its class declaration; caller not verified.'},sources},output=new URL('../src/content/policy/status-source.json',import.meta.url);
if(process.argv.includes('--check')){if(JSON.stringify(JSON.parse(fs.readFileSync(output,'utf8')))!==JSON.stringify(result))throw Error('Status source differs from the reviewed snapshot.');console.log(`Verified ${Object.keys(sources).length} complete Java files.`);}
else{fs.writeFileSync(output,JSON.stringify(result,null,2)+'\n');console.log(`Extracted ${Object.keys(sources).length} complete Java files.`);}
