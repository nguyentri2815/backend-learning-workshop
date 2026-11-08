export const SAMPLE_NOW = '2026-11-08T09:00:00+07:00';
export const quotes = [
 {id:'QUOTE-LEARN-101',quoteCode:'Q-DEMO-101',quoteType:1,customerModel:{id:'CUS-DEMO-101',name:'Khách hàng mẫu Mai',type:0},effectiveDate:'2026-11-01T00:00:00+07:00',expirationDate:'2027-10-31T23:59:00+07:00',insuranceTotalAmount:1800000,blocked:false,missing:false,label:'Quote hợp lệ · Mai'},
 {id:'QUOTE-LEARN-102',quoteCode:'Q-DEMO-102',quoteType:1,customerModel:{id:'CUS-DEMO-102',name:'Khách hàng mẫu Nam',type:0},effectiveDate:'2026-12-01T00:00:00+07:00',expirationDate:'2027-11-30T23:59:00+07:00',insuranceTotalAmount:2400000,blocked:false,missing:false,label:'Quote hiệu lực tương lai · Nam'},
 {id:'QUOTE-LEARN-103',quoteCode:'Q-DEMO-103',quoteType:1,customerModel:{id:'CUS-DEMO-103',name:'Khách hàng mẫu An',type:0},effectiveDate:'2026-11-01T00:00:00+07:00',expirationDate:'2027-10-31T23:59:00+07:00',insuranceTotalAmount:1200000,blocked:true,missing:false,label:'Quote đã có Policy RUNNING · nhánh thất bại'},
 {id:'QUOTE-NOT-FOUND',quoteCode:'',quoteType:1,customerModel:{id:'',name:'',type:0},effectiveDate:'',expirationDate:'',insuranceTotalAmount:0,blocked:false,missing:true,label:'ID Quote không tồn tại · nhánh thất bại'},
] as const;
export type SampleQuote = typeof quotes[number];
export const phases = ['idle','checked','mapped','command','view'] as const;
export type CreatePhase = typeof phases[number];
export function newQuoteAttempt(id:string):Record<string,string|null> {
 return {quote:id,node:'quote',sim:null,attempt:null,selected:null,ref:null,opened:null,sentQuote:null,backend:null,debug:null,debugMax:null,debugVersion:null,field:null,writePoint:null,flowPoint:null,flowSearched:null,resultSearch:null,resultDetail:null,resultViewed:null,readSource:null,reader:null,viewLine:null,traceFrom:null,traceLine:null,traceVia:null,caller:null,follow:null,traceMode:null,pane:null};
}
export function creationContext(params:URLSearchParams) {
 const quote = quotes.find(q=>q.id===params.get('quote')) ?? quotes[0];
 const requested=params.get('sim') ?? 'idle';
 // Failed fixtures never produce a Policy, even through a hand-edited link.
 const phase:CreatePhase = quote.blocked||quote.missing ? 'idle' : phases.includes(requested as CreatePhase)? requested as CreatePhase:'idle';
 const level=phases.indexOf(phase);
 const status=quote.missing?0:new Date(SAMPLE_NOW)<new Date(quote.effectiveDate)?0:new Date(quote.expirationDate)<new Date(SAMPLE_NOW)?-1:100;
 const policy={id:`POL-FROM-${quote.id}`,policyCode:quote.id==='QUOTE-LEARN-102'?'S-DEMO-CREATED-102':'S-DEMO-CREATED-101',quoteId:quote.id,quoteCode:quote.quoteCode,policyType:quote.quoteType,customerName:quote.customerModel.name,effectiveDate:quote.effectiveDate,expirationDate:quote.expirationDate,status,unit:'DV-A',insuranceTotalAmount:quote.insuranceTotalAmount,syncStatus:0};
 return {quote,phase,level,policy,commandReady:level>=3,viewReady:level>=4};
}
