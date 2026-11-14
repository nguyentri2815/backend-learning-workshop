// Read-only source audit. No Java/API/DB execution.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {execFileSync} from 'node:child_process';
const arg=process.argv.indexOf('--root');
if(arg<0)throw Error('Pass --root <agent-system> explicitly.');
const root=path.resolve(process.argv[arg+1]);
const git=(dir,...args)=>execFileSync('git',['-C',path.join(root,dir),...args],{encoding:'utf8'}).trim();
const agent='workspaces/agent-service',shared='workspaces/1-shared',java='src/main/java/com/alpaca/';
const definitions=[
 ['api',agent,`1-agent-command-service/${java}agent/controller/PolicyController.java`,48,51,'PolicyController.paymentMethod'],
 ['find',agent,`1-agent-command-service/${java}agent/function/policy/FindPolicyByIdFunc.java`,31,63,'FindPolicyByIdFunc.exec / buildPaymentInfoPolicyModel / getPaymentOrderNo'],
 ['repository',agent,`4-agent-shared-domain/${java}agent/repository/PolicyRepository.java`,20,20,'PolicyRepository extends JpaRepository<PolicyAggregate, String>'],
 ['policy',agent,`4-agent-shared-domain/${java}agent/domain/PolicyAggregate.java`,60,62,'PolicyAggregate · policy_aggregate'],
 ['objects',agent,`4-agent-shared-domain/${java}agent/repository/InsuranceObjectRepository.java`,11,13,'InsuranceObjectRepository.findAllByEntityIdAndObjectTypeAndDeleted'],
 ['objectEntity',agent,`4-agent-shared-domain/${java}agent/domain/InsuranceObjectAggregate.java`,35,66,'InsuranceObjectAggregate · insurance_object_aggregate'],
 ['objectType',agent,`agent-shared/${java}agent/constant/InsuredObjectType.java`,3,6,'InsuredObjectType.POLICY = 1'],
 ['response',agent,`agent-shared/${java}agent/response/policy/PolicyDetailResponse.java`,26,33,'PolicyDetailResponse'],
 ['objectResponse',agent,`agent-shared/${java}agent/response/insruance/InsuranceDetailResponse.java`,18,29,'InsuranceDetailResponse'],
 ['payment',agent,`agent-shared/${java}agent/model/payment/PaymentInfoPolicyModel.java`,13,21,'PaymentInfoPolicyModel'],
 ['checkout',agent,`agent-shared/${java}agent/model/payment/CheckoutInfoModel.java`,1,1,'CheckoutInfoModel'],
 ['tx',agent,`agent-shared/${java}agent/model/payment/TxInfoModel.java`,1,1,'TxInfoModel'],
 ['constants',agent,`agent-shared/${java}agent/common/ConstantPayment.java`,36,39,'ConstantPayment.PAYMENT_ONLINE'],
 ['error',agent,`agent-shared/${java}agent/common/PlatformErrorCode.java`,134,134,'PlatformErrorCode.POLICY_NOT_EXIST'],
 ['security',agent,`1-agent-command-service/${java}agent/config/ResourceServerConfiguration.java`,17,31,'Command ResourceServerConfiguration.securityFilterChain'],
 ['listResponse',agent,`agent-shared/${java}agent/response/policy/PolicyListResponse.java`,13,34,'PolicyListResponse.id'],
 ['listSearch',agent,`3-agent-query-service/${java}agent/function/policy/SearchPolicyFunc.java`,104,119,'SearchPolicyFunc · policy_view_aggregate'],
 ['listRepository',agent,`5-agent-shared-entity/${java}agent/repository/QueryCustomRepository.java`,26,39,'QueryCustomRepository.executeCustomSqlQuery'],
 ['mapping',shared,`shared-base/${java}util/MappingUtils.java`,22,27,'MappingUtils.mapList / mapObject'],
 ['wrap',shared,`shared-base/${java}base/service/response/WrapResponse.java`,32,37,'WrapResponse.ok'],
 ['exception',shared,`shared-base/${java}base/exception/ServiceException.java`,3,6,'ServiceException extends BaseException'],
 ['handler',shared,`shared-webmvc/${java}common/GlobalWebExceptionHandle.java`,27,38,'GlobalWebExceptionHandle · BaseException handler'],
 ['quoteReference',agent,`1-agent-command-service/${java}agent/function/quote/FindQuoteByIdFunc.java`,35,45,'FindQuoteByIdFunc · mẫu tham khảo đã xác minh'],
];
const sources=Object.fromEntries(definitions.map(([id,dir,file,from,to,symbol])=>{
 const bytes=fs.readFileSync(path.join(root,dir,file));
 const rows=bytes.toString('utf8').replace(/\r\n/g,'\n').replace(/\n$/,'').split('\n').map((text,i)=>({line:i+1,text}));
 if(to>rows.length)throw Error(`Range outside ${file}`);
 return [id,{id,path:`${dir}/${file}`,symbol,from,to,line:from,rows,commit:git(dir,'rev-parse','HEAD'),modified:git(dir,'status','--porcelain','--',file)!=='',sha256:crypto.createHash('sha256').update(bytes).digest('hex')}];
}));
const document={reviewedOn:'2026-11-11',rootCommit:git('.','rev-parse','HEAD'),sources};
const output=new URL('../src/content/policy/detail-source.json',import.meta.url);
if(process.argv.includes('--check')){
 if(JSON.stringify(JSON.parse(fs.readFileSync(output,'utf8')))!==JSON.stringify(document))throw Error('Detail source differs from reviewed snapshot.');
 console.log(`Verified ${definitions.length} complete Java files against read-only source.`);
}else{fs.writeFileSync(output,JSON.stringify(document,null,2)+'\n');console.log(`Extracted ${definitions.length} complete Java files.`);}
