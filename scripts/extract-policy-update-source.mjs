// Snapshot verified Java only. No API, database or backend execution.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {execFileSync} from 'node:child_process';
const arg=process.argv.indexOf('--root');if(arg<0)throw Error('Pass --root <agent-system>.');
const root=path.resolve(process.argv[arg+1]),agent='workspaces/agent-service',shared='workspaces/1-shared',j='src/main/java/com/alpaca/';
const git=(dir,...args)=>execFileSync('git',['-C',path.join(root,dir),...args],{encoding:'utf8'}).trim();
const files={
 paymentApi:`1-agent-command-service/${j}agent/controller/PaymentController.java`,
 pay:`1-agent-command-service/${j}agent/function/payment/PayForPolicyFunc.java`,
 paid:`1-agent-command-service/${j}agent/function/payment/PaidForPolicyFunc.java`,
 processor:`1-agent-command-service/${j}agent/function/payment/processor/GateWayPaymentPolicyProcessor.java`,
 synchronized:`1-agent-command-service/${j}agent/function/payment/base/SynchronizedPaymentPolicyProcessor.java`,
 online:`1-agent-command-service/${j}agent/function/payment/base/OnlinePolicyPaymentFlow.java`,
 baseProcessor:`1-agent-command-service/${j}agent/function/payment/base/BasePaymentPolicyProcessor.java`,
 policy:`4-agent-shared-domain/${j}agent/domain/PolicyAggregate.java`,
 process:`4-agent-shared-domain/${j}agent/domain/PaymentPolicyProcessingAggregate.java`,
 processCheckoutCommand:`4-agent-shared-domain/${j}agent/command/payment_policy/UpdatePolicyCheckoutInfoCommand.java`,
 processCheckoutEvent:`agent-shared/${j}agent/event/payment_policy/UpdatePolicyCheckoutInfoEvent.java`,
 processStateEvent:`agent-shared/${j}agent/event/payment_policy/UpdatePolicyProcessStatusEvent.java`,
 policyRepository:`4-agent-shared-domain/${j}agent/repository/PolicyRepository.java`,
 processRepository:`4-agent-shared-domain/${j}agent/repository/PaymentPolicyProcessingRepository.java`,
 quoteRepository:`4-agent-shared-domain/${j}agent/repository/QuoteRepository.java`,
 saleRepository:`4-agent-shared-domain/${j}agent/repository/SaleUnitRepository.java`,
 request:`agent-shared/${j}agent/request/payment/PaymentRequest.java`,
 constants:`agent-shared/${j}agent/common/ConstantPayment.java`,
 processStatus:`agent-shared/${j}agent/common/PaymentPolicyProcessStatus.java`,
 checkout:`agent-shared/${j}agent/model/payment/CheckoutInfoModel.java`,
 tx:`agent-shared/${j}agent/model/payment/TxInfoModel.java`,
 context:`4-agent-shared-domain/${j}agent/domain/PolicyPaymentContext.java`,
 checkoutCommand:`4-agent-shared-domain/${j}agent/command/policy/payment/UpdateCheckoutInfoCommand.java`,
 checkoutEvent:`agent-shared/${j}agent/event/policy/payment/UpdateCheckoutInfoEvent.java`,
 finishCommand:`4-agent-shared-domain/${j}agent/command/policy/payment/FinishPolicyCommand.java`,
 finishEvent:`agent-shared/${j}agent/event/policy/payment/FinishPolicyEvent.java`,
 basePolicyEvent:`agent-shared/${j}agent/event/base/BasePolicyEvent.java`,
 policyApi:`1-agent-command-service/${j}agent/controller/PolicyController.java`,
 internalPolicy:`1-agent-command-service/${j}agent/controller/internal/InternalPolicyController.java`,
 adapterApi:`1-agent-command-service/${j}agent/controller/AdapterController.java`,
 endorsement:`1-agent-command-service/${j}agent/function/policy/core/SyncEndorsementFromCoreFunc.java`,
 endorsementRequest:`agent-shared/${j}agent/request/policy/SyncEndorsementRequest.java`,
 endorsementCommand:`4-agent-shared-domain/${j}agent/command/policy/SyncEndorsementForPolicyCommand.java`,
 endorsementEvent:`agent-shared/${j}agent/event/policy/SyncEndorsementForPolicyEvent.java`,
 permission:`1-agent-command-service/${j}agent/function/quote/UpdatePermissionDataQuoteAndPolicyFunc.java`,
 saleApi:`1-agent-command-service/${j}agent/controller/SaleUnitController.java`,
 saleWorkflow:`2-agent-flow-service/${j}agent/workflow/SaleUnitWorkflow.java`,
 queue:`1-agent-command-service/${j}agent/action/QueueHandler.java`,
 migration:`1-agent-command-service/${j}agent/function/sync/MigrateDataQuoteAndPolicyFunc.java`,
 syncApi:`1-agent-command-service/${j}agent/controller/SyncDataController.java`,
 correct:`1-agent-command-service/${j}agent/function/policy/CorrectCreatedDatePolicyFunc.java`,
 documents:`1-agent-command-service/${j}agent/function/policy/PolicyUploadMultipleDocumentFunc.java`,
 uploadRequest:`agent-shared/${j}agent/request/document/UploadMultipleDocumentRequest.java`,
 uploadSingle:`agent-shared/${j}agent/request/document/UploadDocumentSingleRequest.java`,
 uploadEvent:`agent-shared/${j}agent/event/policy/UploadDocumentEvent.java`,
 permissionCommand:`4-agent-shared-domain/${j}agent/command/policy/UpdateDataPermissionPolicyCommand.java`,
 permissionEvent:`agent-shared/${j}agent/event/policy/UpdateDataPermissionPolicyEvent.java`,
 migrationCommand:`4-agent-shared-domain/${j}agent/command/policy/UpdateSaleUnitPathIdsPolicyCommand.java`,
 migrationEvent:`agent-shared/${j}agent/event/policy/UpdateSaleUnitPathIdsPolicyEvent.java`,
 correctCommand:`4-agent-shared-domain/${j}agent/command/policy/CorrectCreatedDatePolicyCommand.java`,
 correctEvent:`agent-shared/${j}agent/event/policy/CorrectCreatedDatePolicyEvent.java`,
 saleUtil:`agent-shared/${j}agent/util/SaleUnitUtil.java`,
 workflow:`2-agent-flow-service/${j}agent/workflow/PolicyWorkflow.java`,
 syncView:`2-agent-flow-service/${j}agent/function/PolicySyncViewFunc.java`,
 internalApi:`agent-shared/${j}agent/api/InternalSPCommandApi.java`,
 findPolicy:`1-agent-command-service/${j}agent/function/policy/FindPolicyByIdFunc.java`,
 viewRepository:`5-agent-shared-entity/${j}agent/repository/PolicyViewRepository.java`,
 viewEntity:`5-agent-shared-entity/${j}agent/entity/PolicyViewEntity.java`,
 proxy:`agent-shared/${j}agent/api/InternalProxyApi.java`,
 ipn:`1-agent-command-service/${j}agent/function/payment/IPNFunc.java`,
 ipnApi:`1-agent-command-service/${j}agent/controller/pub/payment/IPNController.java`,
 createAndPay:`1-agent-command-service/${j}agent/function/payment_policy/CreatePaymentPolicyProcessAndPayFunc.java`,
 processApi:`1-agent-command-service/${j}agent/controller/PaymentPolicyProcessController.java`,
 errors:`agent-shared/${j}agent/common/PlatformErrorCode.java`,
 uploaderStatus:`agent-shared/${j}agent/common/ViaUploaderStatus.java`,
 folderKind:`agent-shared/${j}agent/constant/FolderUploadConstant.java`,
 policyField:`agent-shared/${j}agent/constant/PolicyFieldChange.java`,
 productGroup:`agent-shared/${j}agent/common/ProductGroupCode.java`,
 documentTarget:`agent-shared/${j}agent/common/DocumentTargetObjectType.java`,
};
const helpers={paymentStatus:`shared-proxy/${j}proxy/common/PaymentPolicyStatus.java`,corePaymentStatus:`shared-proxy/${j}proxy/common/PaymentStatus.java`,staticFolder:`shared-proxy/${j}proxy/common/StaticFolder.java`,baseEvent:`shared-base/${j}base/BaseEvent.java`,mapping:`shared-base/${j}util/MappingUtils.java`,wrap:`shared-base/${j}base/service/response/WrapResponse.java`,store:`shared-event-sourcing/src/main/java/com/eventsourcing/common/jdbc/impl/EventuateJdbcAccessImpl.java`,aggregateRepository:'shared-event-sourcing/src/main/java/io/eventuate/sync/AggregateRepository.java'};
const sources=Object.fromEntries([...Object.entries(files).map(([id,file])=>[id,agent,file]),...Object.entries(helpers).map(([id,file])=>[id,shared,file])].map(([id,dir,file])=>{
 const bytes=fs.readFileSync(path.join(root,dir,file)),rows=bytes.toString('utf8').replace(/\r\n/g,'\n').replace(/\n$/,'').split('\n').map((text,i)=>({line:i+1,text}));
 return [id,{id,path:`${dir}/${file}`,symbol:file.split('/').at(-1).replace('.java',''),line:1,from:1,to:rows.length,rows,commit:git(dir,'rev-parse','HEAD'),modified:git(dir,'status','--porcelain','--',file)!=='',sha256:crypto.createHash('sha256').update(bytes).digest('hex')}];
}));
const result={reviewedOn:'2026-11-11',rootCommit:git('.','rev-parse','HEAD'),sources},output=new URL('../src/content/policy/update-source.json',import.meta.url);
if(process.argv.includes('--check')){if(JSON.stringify(JSON.parse(fs.readFileSync(output,'utf8')))!==JSON.stringify(result))throw Error('Update source differs from reviewed snapshot.');console.log(`Verified ${Object.keys(sources).length} complete Java files.`);}else{fs.writeFileSync(output,JSON.stringify(result,null,2)+'\n');console.log(`Extracted ${Object.keys(sources).length} complete Java files.`);}
