import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {execFileSync} from 'node:child_process';
const root='D:/ALPACA/agent-system';
const files=execFileSync('rg',['--files','-uu',root,'-g','*.java','-g','*.gradle'],{encoding:'utf8'}).trim().split(/\r?\n/).map(p=>p.replaceAll('\\','/'));
const specs={
 controller:['1-agent-command-service','PolicyController.java','public CompletableFuture<WrapResponse<Object>> createPolicy'],
 quoteController:['1-agent-command-service','QuoteController.java','public CompletableFuture<WrapResponse<Object>> createQuote'],
 detailEndpoint:['1-agent-command-service','PolicyController.java','public CompletableFuture<WrapResponse<Object>> paymentMethod'],
 baseController:['shared-base','BaseController.java','public class BaseController'],
 endpoint:['1-agent-command-service','PolicyController.java','public CompletableFuture<WrapResponse<Object>> syncPolicyToCoreByPolicyIdFunc'],
 func:['1-agent-command-service','CreatePolicyFunc.java','public EntityWithIdAndVersion<PolicyAggregate> exec'],
 prepare:['1-agent-command-service','CreatePolicyFunc.java','private EntityWithIdAndVersion<PolicyAggregate> runInternal'],
 saveCall:['1-agent-command-service','CreatePolicyFunc.java','policyAggregateRepository.save(command)'],
 status:['1-agent-command-service','CreatePolicyFunc.java','public Integer getPolicyStatus'],
 fill:['1-agent-command-service','CreatePolicyFunc.java','private void fillMissingValue'],
 quoteFunc:['1-agent-command-service','CreateQuoteFunc.java','public EntityWithIdAndVersion<QuoteAggregate> exec'],
 quoteFill:['1-agent-command-service','CreateQuoteFunc.java','public void fillMissingValue'],
 quoteSave:['1-agent-command-service','CreateQuoteFunc.java','quoteAggregateRepository.save(command)'],
 policyLockExample:['1-agent-command-service','RefreshCounterPolicySyncCoreByIdFunc.java','public PolicyAggregate exec'],
 base:['shared-webmvc','BaseFunc.java','protected <T> T execInTransactionAndLock(String key, long'],
 lock:['shared-cache','LockService.java','public <T> T lock(String key, long'],
 repo:['4-agent-shared-domain','PolicyRepository.java','public interface'],
 quoteRepo:['4-agent-shared-domain','QuoteRepository.java','public interface'],
 command:['4-agent-shared-domain','CreatePolicyCommand.java','public class'],
 event:['agent-shared/','CreatePolicyEvent.java','public class'],
 mapping:['shared-base','MappingUtils.java','public static <D> D mapObject(Object source, Class<D> targetClass)'],
 save:['io/eventuate/sync/','AggregateRepository.java','public EntityWithIdAndVersion<T> save(CT cmd, Optional'],
 repositoryBean:['1-agent-command-service','PlatformConfig.java','public AggregateRepository<PolicyAggregate, IPolicyCommand> policyAggregateRepository'],
 repositoryExtension:['eventuate/sync/','AggregateExtRepository.java','public class AggregateExtRepository'],
 saveOptions:['shared-event-sourcing','CommonAggregateRepository.java','protected Optional<SaveOptions> transformSaveOptions'],
 storeBean:['shared-event-sourcing','EventuateCommonConfiguration.java','public io.eventuate.sync.EventuateAggregateStore syncAggregateEventStore'],
 storeDelegate:['crud/sync/impl/','EventuateAggregateStoreImpl.java','public <T extends Aggregate<T>> EntityIdAndVersion save(Class<T> clasz, List<Event> events, Optional'],
 crudBean:['shared-event-sourcing','EventuateCommonCrudConfiguration.java','public EventuateAggregateStoreCrud syncEventuateAggregateStoreCrud'],
 dispatch:['shared-event-sourcing','ReflectiveMutableCommandProcessingAggregate.java','public List<Event> processCommand'],
 applyDispatch:['shared-event-sourcing','ReflectiveMutableCommandProcessingAggregate.java','public T applyEvent'],
 aggregateBase:['shared-event-sourcing','BaseAggregate.java','public abstract class'],
 applyLoop:['shared-event-sourcing','Aggregates.java','public static <T extends Aggregate<T>> T applyEventsToMutableAggregate'],
 store:['crud/sync/impl/','EventuateAggregateStoreCrudImpl.java','public <T extends Aggregate<T>> EntityIdAndVersion save(Class<T> clasz, List<Event> events, Optional'],
 jdbc:['crud/sync/impl/','AbstractJdbcAggregateCrud.java','public EntityIdVersionAndEventIds save'],
 jdbcWrite:['shared-event-sourcing','EventuateJdbcAccessImpl.java','private SaveUpdateResult saveWithoutTransaction'],
 jdbcRepository:['shared-event-sourcing','EventuateJdbcAccessImpl.java','private JpaRepository loadRepository'],
 localCrud:['shared-event-sourcing','EventuateLocalAggregateCrud.java','public class'],
 crudConfiguration:['shared-event-sourcing','EventuateLocalCrudConfiguration.java','public EventuateLocalAggregateCrud eventuateLocalAggregateCrud'],
 aggregate:['4-agent-shared-domain','PolicyAggregate.java','public List<Event> process(CreatePolicyCommand'],
 quoteAggregate:['4-agent-shared-domain','QuoteAggregate.java','public List<Event> process(CreateQuoteCommand'],
 workflow:['2-agent-flow-service','PolicyWorkflow.java','public void createPolicy'],
 flowApplication:['2-agent-flow-service','AgentFlowServiceApplication.java','public class AgentFlowServiceApplication'],
 flowBean:['2-agent-flow-service','PlatformFlowConfig.java','public PolicyWorkflow policyWorkflow'],
 eventConfiguration:['shared-eventuate','LibraEventuateLocalConfiguration.java','public class LibraEventuateLocalConfiguration'],
 localConfiguration:['shared-event-sourcing','EventuateLocalConfiguration.java','public class EventuateLocalConfiguration'],
 eventBean:['shared-event-sourcing','EventHandlerBeanPostProcessor.java','public Object postProcessAfterInitialization'],
 eventStore:['common/event/impl/','EventuateAggregateStoreEventsImpl.java','public CompletableFuture<?> subscribe'],
 eventStoreBean:['shared-event-sourcing','EventuateCommonEventsConfiguration.java','public com.eventsourcing.common.event.EventuateAggregateStoreEvents eventuateAggregateStoreEvents'],
 kafkaBean:['shared-event-sourcing','EventuateLocalEventsConfiguration.java','public EventuateKafkaAggregateSubscriptions aggregateEvents'],
 kafkaSubscribe:['shared-event-sourcing','EventuateKafkaAggregateSubscriptions.java','public CompletableFuture<?> subscribe'],
 quoteWorkflow:['2-agent-flow-service','QuoteWorkflow.java','public void'],
 eventDispatch:['shared-event-sourcing','EventDispatcher.java','public CompletableFuture<?> dispatch'],
 eventRegistration:['shared-event-sourcing','EventDispatcherInitializer.java','public void registerEventHandler'],
 eventInvoke:['shared-event-sourcing','EventHandlerDispatchedEventReturningVoid.java','public CompletableFuture<?> dispatch'],
 sync:['2-agent-flow-service','PolicySyncViewFunc.java','public void exec'],
 quoteSync:['2-agent-flow-service','QuoteSyncViewFunc.java','public void exec'],
 search:['3-agent-query-service','SearchPolicyFunc.java','public Page<PolicyViewEntity> doFilter'],
 quoteSearch:['3-agent-query-service','SearchQuoteFunc.java','public Page<QuoteViewEntity> doFilter'],
 queryController:['3-agent-query-service','PolicyController.java','public CompletableFuture'],
 queryRepository:['5-agent-shared-entity','QueryCustomRepository.java','public Page<T> executeCustomSqlQuery'],
 queryDependencies:['3-agent-query-service/','build.gradle',"implementation project(path: ':workspaces:agent-service:5-agent-shared-entity'"],
 viewRepository:['5-agent-shared-entity','PolicyViewRepository.java','public interface'],
 viewEntity:['5-agent-shared-entity','PolicyViewEntity.java','public class PolicyViewEntity'],
 internalApi:['agent-shared/','InternalSPCommandApi.java','WrapResponse<PolicyModel> findPolicyById'],
 internalController:['1-agent-command-service','InternalPolicyController.java','public CompletableFuture<WrapResponse<Object>> findSaleUnitById'],
 detail:['1-agent-command-service','FindPolicyByIdFunc.java','public PolicyDetailResponse exec'],
 quoteDetail:['1-agent-command-service','FindQuoteByIdFunc.java','public QuoteDetailResponse exec'],
};
const out={};
for(const [id,[scope,name,anchor]] of Object.entries(specs)){
 const candidates=files.filter(p=>p.includes(scope)&&p.endsWith('/'+name));if(candidates.length!==1)throw Error(id+': '+candidates);
 const file=candidates[0],raw=fs.readFileSync(file,'utf8'),lines=raw.replace(/\r/g,'').split('\n');
 const start=lines.findIndex(line=>line.includes(anchor));if(start<0)throw Error(id+' anchor missing');
 const repo=execFileSync('git',['-C',path.dirname(file),'rev-parse','--show-toplevel'],{encoding:'utf8'}).trim();
 const commit=execFileSync('git',['-C',repo,'rev-parse','HEAD'],{encoding:'utf8'}).trim();
 const modified=Boolean(execFileSync('git',['-C',repo,'status','--porcelain','--',file],{encoding:'utf8'}).trim());
 out[id]={path:path.relative(root,file).replaceAll('\\','/'),symbol:name.replace('.java','')+' · '+anchor,line:start+1,from:Math.max(1,start-2),commit,modified,sha256:crypto.createHash('sha256').update(raw).digest('hex'),rows:lines.map((text,i)=>({line:i+1,text}))};
}
const target='src/content/policy/assembly-source.json';
if(process.argv.includes('--check')){if(JSON.stringify(JSON.parse(fs.readFileSync(target,'utf8')))!==JSON.stringify(out))throw Error('Assembly sources differ from backend');console.log(Object.keys(out).length+' references match current backend, lines and hashes');}
else fs.writeFileSync(target,JSON.stringify(out,null,2)+'\n');
