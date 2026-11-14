import {creationContext} from './create-model';
import {samplePolicies} from './policy-model';
import type {SamplePolicy} from './policy-model';
import {listFilters,scalarFilters} from '../content/policy/list';

export type SearchRequest={keyword?:string|null;status?:number|null;pageNumber?:number|null;pageSize?:number|null;sort?:{key:string;asc?:boolean|null}[]|null;startCreatedDate?:string|null;endCreatedDate?:string|null;[key:string]:unknown};
export type ListPersona='seller'|'manager'|'owner'|'missing'|'local';
export type ViewRow=SamplePolicy&{quoteId:string;quoteCode:string;productId:string;productGroupCode:string;quoteStaffCode:string;createdBy:string;distributionChannelId:string;paymentStatus:number;viaUploaderStatus:number;createdDate:string;pathSaleUnitIds:string[];searchingKey:string};
// Same normalization as TextUtils.convertStringToSort for the Vietnamese fixtures.
export const normalizeKeyword=(value:string)=>value.normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/Đ/g,'D').replace(/đ/g,'d').trim().toLowerCase().replace(/-/g,' ').replace(/ {2,}/g,' ').replace(/ /g,'-');
function enrich(row:SamplePolicy,i:number):ViewRow {
 const quote=row as SamplePolicy&{quoteId?:string;quoteCode?:string};
 const fields={quoteId:quote.quoteId??`QUOTE-${row.id}`,quoteCode:quote.quoteCode??`Q-DEMO-00${i+1}`,productId:i===3?'PROD-HOME':'PROD-CAR',productGroupCode:i===3?'HOME':'CAR',quoteStaffCode:i===1?'NV-02':'NV-01',createdBy:i===1?'seller.b':'seller.a',distributionChannelId:i===1?'CHANNEL-02':'CHANNEL-01',paymentStatus:i===2?0:1,viaUploaderStatus:i===3?0:1,createdDate:`2026-11-0${i+1}T09:00:00+07:00`,pathSaleUnitIds:['ROOT',row.unit]};
 return {...row,...fields,searchingKey:[fields.quoteCode,row.customerName,row.policyCode,fields.createdBy,fields.quoteStaffCode].map(normalizeKeyword).join(',')};
}
export function listRows(params=new URLSearchParams()):ViewRow[] {
 const created=creationContext(params);
 return [...samplePolicies,...(created.viewReady?[created.policy]:[])].map(enrich);
}
export const defaultSearch:SearchRequest={keyword:'S-DEMO',status:100,pageNumber:0,pageSize:2,sort:[{key:'policyCode',asc:true}]};
export const listScenarios=[
 {id:'found',title:'Tìm thấy',request:defaultSearch,persona:'seller'},
 {id:'empty',title:'Kết quả rỗng',request:{...defaultSearch,keyword:'KHONG-CO'},persona:'seller'},
 {id:'page',title:'Đổi trang',request:{...defaultSearch,pageNumber:1},persona:'seller'},
 {id:'scope',title:'Phạm vi dữ liệu',request:{...defaultSearch,keyword:'S-DEMO-006'},persona:'seller'},
 {id:'normalize',title:'Đầu vào có dấu',request:{...defaultSearch,keyword:'  Khách  hàng mẫu An  '},persona:'seller'},
 {id:'dates',title:'Ngày thiếu một đầu',request:{...defaultSearch,startCreatedDate:'2026-12-01T00:00:00+07:00'},persona:'seller'},
 {id:'combine',title:'Filter đơn kết hợp list',request:{...defaultSearch,listStatus:['0']},persona:'seller'},
 {id:'error',title:'Lỗi bị trả rỗng',request:defaultSearch,persona:'missing'},
 {id:'defaults',title:'Bỏ trống và mặc định',request:{},persona:'seller'},
] as const;

export function parseRequest(text:string|null,fallback:SearchRequest=defaultSearch):SearchRequest {
 try{const value=JSON.parse(text??'null');return value&&typeof value==='object'&&!Array.isArray(value)?value:fallback;}catch{return fallback;}
}
export function requestFromUrl(params:URLSearchParams):SearchRequest {
 if(params.has('listRequest'))return parseRequest(params.get('listRequest'));
 return {...defaultSearch,keyword:params.get('keyword')??'S-DEMO',...(params.get('status')==='all'?{status:undefined}:{status:Number(params.get('status')??100)}),pageNumber:Number(params.get('page')??0),pageSize:Number(params.get('size')??2)};
}
export function listLearningState(params:URLSearchParams){
 const hasRequest=params.has('listRequest')||params.get('searched')==='1';
 const request=requestFromUrl(params),draft=parseRequest(params.get('listDraft'),request);
 const identity=(value:string|null):ListPersona=>['seller','manager','owner','missing','local'].includes(value??'')?value as ListPersona:'seller';
 const persona=identity(params.get('listPersona')),sentPersona=identity(params.get('listSentPersona')??persona);
 const result=evaluateList(request,sentPersona,listRows(params));
 const raw=Number(params.get('listStop')??(hasRequest?'6':'-1'));
 const stop=hasRequest?Math.max(0,Math.min(7,Number.isFinite(raw)?raw:0)):-1;
 const selected=stop>=6&&result.page.content.some(row=>row.id===params.get('selected'))?params.get('selected'):null;
 return {hasRequest,request,draft,persona,sentPersona,result,stop,selected};
}
export function evaluateList(request:SearchRequest,persona:ListPersona='seller',rows=listRows()) {
 const conditions:{origin:'backend'|'search';field:string;operator:string;value:unknown;sql:string;test:(row:ViewRow)=>boolean}[]=[];
 const skipped:string[]=[];
 const add=(field:string,operator:string,value:unknown,test:(row:ViewRow)=>boolean,origin:'backend'|'search'='search',sql?:string)=>conditions.push({field,operator,value,test,origin,sql:sql??`a.${field.replace(/[A-Z]/g,c=>'_'+c.toLowerCase())} ${operator} ${JSON.stringify(value)}`});
 const pageNumber=request.pageNumber===undefined?0:request.pageNumber,pageSize=request.pageSize===undefined?10:request.pageSize;
 const invalidPagination=typeof pageNumber!=='number'||typeof pageSize!=='number'||!Number.isInteger(pageNumber)||!Number.isInteger(pageSize)||pageNumber<0||pageSize<1;
 const normalized=typeof request.keyword==='string'?normalizeKeyword(request.keyword):'';
 const scope=persona==='owner'?null:persona==='manager'?'ROOT':'DV-A';
 if(scope)add('pathSaleUnitIds','ANY',scope,row=>row.pathSaleUnitIds.includes(scope),'backend',`'${scope}' = ANY(path_sale_unit_ids)`);
 if(typeof request.keyword==='string'&&request.keyword.trim()) {
  // LIKE preserves PostgreSQL % and _ wildcards; literal apostrophes are handled as a query error below.
  const pattern=normalized.replace(/[.*+?^${}()|[\]\\]/g,'\\$&').replace(/%/g,'.*').replace(/_/g,'.');
  const matcher=new RegExp(pattern,'s');add('searchingKey','LIKE',`%${normalized}%`,row=>matcher.test(row.searchingKey));
 }else skipped.push('keyword blank/null: không thêm LIKE');
 const scalar=['status',...scalarFilters.map(([key])=>key)];
 for(const field of scalar){const value=request[field];const active=field==='createdBy'?value!==undefined&&value!==null:['status','paymentStatus','viaUploaderStatus'].includes(field)?value!==undefined&&value!==null:typeof value==='string'&&Boolean(value.trim());
  if(active)add(field,'=',value,row=>String(row[field as keyof ViewRow])===String(value));else skipped.push(`${field}: bỏ qua`);
 }
 if(request.startCreatedDate!=null&&request.endCreatedDate!=null)add('createdDate','BETWEEN',[request.startCreatedDate,request.endCreatedDate],row=>Date.parse(row.createdDate)>=Date.parse(request.startCreatedDate!)&&Date.parse(row.createdDate)<=Date.parse(request.endCreatedDate!));
 else skipped.push('Ngày: cần cả startCreatedDate và endCreatedDate mới thêm BETWEEN');
 for(const [key] of listFilters){const value=request[key];const field=key.slice(4,5).toLowerCase()+key.slice(5);if(Array.isArray(value)&&value.length)add(field,'IN',value,row=>value.map(String).includes(String(row[field as keyof ViewRow])));else skipped.push(`${key}: null/[] không thêm IN`);}
 const sort=Array.isArray(request.sort)?request.sort:[];
 const error=persona==='missing'?'USER_NOT_EXIST · SaleUnitViewRepository không có username mẫu':invalidPagination?'PageRequest không chấp nhận page/size này':sort.length>1?'QueryUtil.addSort nối nhiều cột thiếu dấu phẩy; fixture mô phỏng SQL lỗi':sort.some(s=>!['policyCode','createdDate','status','id'].includes(s.key))?'Cột sort ngoài phạm vi fixture':Object.values(request).some(v=>typeof v==='string'&&v.includes("'"))?'QueryUtil ghép chuỗi có dấu nháy; fixture mô phỏng SQL lỗi':null;
 const filtered=rows.filter(row=>conditions.every(c=>c.test(row)));
 const sorted=[...filtered];
 if(sort.length===1){const {key,asc}=sort[0];sorted.sort((a,b)=>{const x=a[key as keyof ViewRow],y=b[key as keyof ViewRow];return (typeof x==='number'&&typeof y==='number'?x-y:String(x).localeCompare(String(y)))*(asc===undefined||asc===true?1:-1);});}
 const number=typeof pageNumber==='number'?pageNumber:0,size=typeof pageSize==='number'?pageSize:10,offset=number*size;
 const page={content:error?[]:sorted.slice(offset,offset+size).map(({unit:_,...dto})=>dto),totalElements:error?0:filtered.length,number:error?0:number,size:error?0:size,totalPages:error?1:Math.ceil(filtered.length/size)};
 const reasons=rows.map(row=>{const failed=conditions.filter(c=>!c.test(row));return {id:row.id,policyCode:row.policyCode,reason:error?'Không trả dòng: exec bắt lỗi':failed.length?failed.map(c=>`${c.origin==='backend'?'Phạm vi backend':'Filter tìm kiếm'}: ${c.field} ${c.operator} ${JSON.stringify(c.value)}`).join('; '):page.content.some(r=>r.id===row.id)?'Hiển thị ở trang này':`Khớp điều kiện · nằm ở trang ${Math.floor(sorted.indexOf(row)/Math.max(1,size))+1}`};});
 const earlyError=persona==='missing'||invalidPagination;
 return {request,normalized,persona,scope:earlyError?null:scope,conditions:earlyError?[]:conditions.map(({test:_,...c})=>c),skipped:earlyError?['Không vào các nhánh filter do lỗi ở đầu doFilter']:skipped,page,offset,error,errorAt:error?(earlyError?2:4):null,reasons,filtered:sorted,sql:earlyError?'Chưa dựng SQL; exception chuyển thẳng tới catch trong exec.':`SELECT * FROM <schema>.policy_view_aggregate as a${conditions.length?' WHERE '+conditions.map(c=>c.sql).join(' AND '):''}${sort.length?' ORDER BY '+sort.map(s=>`a.${s.key.replace(/[A-Z]/g,c=>'_'+c.toLowerCase())} ${s.asc===undefined||s.asc===true?'asc':'desc'}`).join(' '):''}`,wrapper:{success:true,statusCode:'200',data:page}};
}

export function listSnapshots(result:ReturnType<typeof evaluateList>,selected:string|null) {
 const {request,normalized,persona,scope,conditions,page,offset,error,wrapper}=result;
 return [
  {request:{method:'POST',path:'/policy/search',body:request}},
  {dto:{...request,pageNumber:request.pageNumber===undefined?0:request.pageNumber,pageSize:request.pageSize===undefined?10:request.pageSize}},
  {criteria:request,backend:{identitySource:persona==='local'?'ConfigUtil.localUsername':'SessionUtils.getUsername()',role:persona==='owner'?'OWNER':persona==='manager'?'AGENT_ADMIN':'AGENT_STAFF',scope,lookupError:persona==='missing'?'USER_NOT_EXIST':null}},
  result.errorAt===2?{skipped:'Không dựng điều kiện; lỗi xảy ra trước nhánh filter'}:{normalizedKeyword:normalized,conditions,ignored:result.skipped},
  result.errorAt===2?{skipped:'Không gọi repository; chuyển tới catch'}:{readFrom:'<schema>.policy_view_aggregate',count:error?null:page.totalElements,offset,limit:request.pageSize??10,entityPage:error?null:page},
  {response:wrapper,...error?{caughtError:error,returned:'Page.empty()'}:{}},
  {table:page.content.map(({id,policyCode,customerName,status})=>({id,policyCode,customerName,status})),totalElements:page.totalElements},
  {handoff:selected?{id:selected,method:'GET',path:`/policy/${selected}`,destination:'Command · PolicyController.paymentMethod'}:null},
 ];
}
