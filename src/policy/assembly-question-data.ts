import type {creationContext} from './create-model';
import {SAMPLE_NOW} from './create-model';

export type AssemblyDatum = {label:string;value:string};
const day=(value:string)=>value.slice(0,10).split('-').reverse().join('/');

// Only inputs available before this decision. Outcomes belong to the answer/reveal.
export function assemblyQuestionData(step:string, decision:number, sample:ReturnType<typeof creationContext>, previousExplored=true):AssemblyDatum[] {
  const {quote:q,policy:p}=sample;
  const source=[['quoteId',q.id],['quoteCode',q.quoteCode]];
  const dates=[['effectiveDate',day(q.effectiveDate)],['expirationDate',day(q.expirationDate)]];
  const prepared=[['quoteId',q.id],['quoteCode',q.quoteCode],['customerName',p.customerName],['status',String(p.status)],['syncStatus','0']];
  let rows:string[][];
  switch(step) {
    case 'quote': rows=decision===0?[['Màn hình','Chi tiết báo giá'],...source,['Hồ sơ nguồn','Đã lưu trong backend']]:[['Request',`POST /policy/create/${q.id}`],['quoteId',q.id],['Việc tiếp theo','Đọc, kiểm tra rồi phát hành từ Quote']];break;
    case 'validate': rows=decision===0?[['Từ bước 1',`quoteId = ${q.id}`],['Cần xác nhận','Báo giá tồn tại; không có Policy đang chặn phát hành']]:[...source,['Quote đọc được','Có hồ sơ'],['Policy cùng mã, status 0/100','[] · không có bản ghi'],['Đối tượng bảo hiểm','QUOTE, chưa xóa']];break;
    case 'map': rows=decision===0?[...source,['quoteType',String(q.quoteType)],['customerModel.name',q.customerModel.name],...dates]:[['Ngày hiện tại',day(SAMPLE_NOW)],...dates,['customerModel.name',q.customerModel.name],['customerModel.type','0 · cá nhân'],['Command đã có',`quoteId = ${q.id}`]];break;
    case 'save': rows=[['Từ bước 3','CreatePolicyCommand đã chuẩn bị'],...prepared];break;
    case 'flow': rows=decision===0?[['Từ bước 4','CreatePolicyEvent'],['entityId',p.id],['Màn hình cần','Mã, khách hàng, trạng thái, tìm kiếm và phạm vi']]:[['entityId',p.id],['Nguồn đọc lại','Command API theo Policy ID'],['Mã Policy',p.policyCode],['Khách hàng',p.customerName],['Trạng thái',String(p.status)]];break;
    default: rows=decision===0?[['Policy ID từ bước ghi',p.id],['Mã Policy',p.policyCode],['View từ bước 5','Có bản dữ liệu tra cứu trong tình huống mẫu']]:[['ID trên dòng danh sách',p.id],['quoteId nguồn',q.id],['Mã hiển thị',p.policyCode]];
  }
  if(!previousExplored&&decision>0) {
    if(step==='validate')rows=[['quoteId',q.id],['Kết quả đọc','Chưa khám phá ở quyết định 1']];
    if(step==='map')rows=rows.filter(([label])=>label!=='Command đã có');
  }
  return rows.map(([label,value])=>({label,value}));
}
