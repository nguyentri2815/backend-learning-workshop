import {test,expect} from '@playwright/test';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {defaultSearch,evaluateList,listRows,normalizeKeyword} from '../../src/policy/list-model';
import {implementationTasks,listSource,listStages} from '../../src/content/policy/list';


test('complete Java snapshots preserve bytes, lines and working-tree provenance @source',()=>{
 for(const source of Object.values(listSource.sources)){
  const bytes=readFileSync('D:/ALPACA/agent-system/'+source.path);
  expect(createHash('sha256').update(bytes).digest('hex'),source.path).toBe(source.sha256);
  expect(bytes.toString('utf8').replace(/\r\n/g,'\n').replace(/\n$/,'').split('\n')).toEqual(source.rows.map(r=>r.text));
 }
 expect(listSource.sources.search.modified).toBe(true);
});
test('fixtures cover all filters, intersections, scope, defaults, dates, normalization and repository pages',()=>{
 const base=evaluateList(defaultSearch);expect(base.page.totalElements).toBe(3);expect(base.page.content.map(r=>r.id)).toEqual(['POL-LEARN-001','POL-LEARN-002']);
 expect(evaluateList({...defaultSearch,pageNumber:1}).page.content.map(r=>r.id)).toEqual(['POL-LEARN-003']);
 expect(evaluateList({}).page).toMatchObject({number:0,size:10,totalElements:5});
 expect(evaluateList({...defaultSearch,status:0}).page.totalElements).toBe(1);
 expect(evaluateList({...defaultSearch,status:-1}).page.totalElements).toBe(1);
 expect(normalizeKeyword('  Nguyễn  Đăng - An ')).toBe('nguyen-dang-an');
 expect(evaluateList({...defaultSearch,keyword:'  Khách  hàng mẫu An '}).page.totalElements).toBe(1);
 expect(evaluateList({...defaultSearch,keyword:'%'}).page.totalElements).toBe(3);
 for(const [key,value] of Object.entries({productId:'PROD-CAR',quoteStaffCode:'NV-02',paymentStatus:0,viaUploaderStatus:1,createdBy:'seller.b',distributionChannelId:'CHANNEL-02',productGroupCode:'CAR',listProductId:['PROD-CAR'],listStatus:['100'],listPaymentStatus:['0'],listCreatedBy:['seller.b'],listDistributionChannelId:['CHANNEL-02'],listProductGroupCode:['CAR']})){
  const result=evaluateList({...defaultSearch,[key]:value});expect(result.conditions.some(c=>JSON.stringify(c.value)===JSON.stringify(value)),key).toBe(true);expect(result.page.totalElements,key).toBeGreaterThan(0);
 }
 const blank=evaluateList({keyword:'  ',productId:' ',quoteStaffCode:'',listStatus:[],status:null});expect(blank.conditions).toHaveLength(1);
 expect(evaluateList({createdBy:''}).conditions.find(c=>c.field==='createdBy')?.value).toBe('');
 expect(evaluateList({...defaultSearch,listStatus:['0']}).page.totalElements).toBe(0);
 expect(evaluateList({...defaultSearch,startCreatedDate:'2027-01-01'}).page.totalElements).toBe(3);
 expect(evaluateList({...defaultSearch,startCreatedDate:'2026-11-02T00:00:00+07:00',endCreatedDate:'2026-11-02T23:59:59+07:00'}).page.content[0].id).toBe('POL-LEARN-002');
 expect(evaluateList({...defaultSearch,keyword:'S-DEMO-006'}).page.totalElements).toBe(0);
 for(const persona of ['manager','owner'] as const)expect(evaluateList({...defaultSearch,keyword:'S-DEMO-006'},persona).page.content[0].id).toBe('POL-LEARN-006');
 expect(evaluateList(defaultSearch,'local').page).toEqual(base.page);
 expect(evaluateList(defaultSearch,'missing').wrapper).toMatchObject({success:true,data:{content:[],totalElements:0}});
 expect(evaluateList({...defaultSearch,pageNumber:-1}).error).toContain('PageRequest');
 expect(evaluateList({...defaultSearch,sort:[{key:'id'},{key:'status'}]}).error).toContain('thiếu dấu phẩy');
 expect(evaluateList({...defaultSearch,sort:[{key:'policyCode'}]}).page.content[0].id).toBe('POL-LEARN-001');
 expect(evaluateList({...defaultSearch,sort:[{key:'policyCode',asc:null}]}).page.content[0].id).toBe('POL-LEARN-003');
 const created=new URLSearchParams('quote=QUOTE-LEARN-101&sim=command');expect(listRows(created)).toHaveLength(6);created.set('sim','view');expect(listRows(created)).toHaveLength(7);
 expect(listRows(created).at(-1)?.quoteId).toBe('QUOTE-LEARN-101');
 for(const stage of listStages)expect(stage.to).toBeLessThanOrEqual(listSource.sources[stage.ref].rows.length);
 for(const task of implementationTasks)expect(task.to).toBeLessThanOrEqual(listSource.sources[task.ref].rows.length);
});
