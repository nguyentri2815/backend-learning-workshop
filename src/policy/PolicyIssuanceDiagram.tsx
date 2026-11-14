import {LearningJourneyDiagram} from './LearningJourneyDiagram';
import type {JourneyMapNode} from './LearningJourneyDiagram';
import type {IssuanceBranchId} from '../content/policy/issuance';
export type IssuanceMapPoint='quote'|IssuanceBranchId|'save'|'published'|'view'|'core';
const layout:JourneyMapNode[]= [
  {id:'quote',number:'1',title:'Quote đã có',note:'Một quoteId cho bốn đường vào',position:{x:0,y:204}},
  {id:'direct',number:'2A',title:'Phát hành trực tiếp',note:'Kiểm tra Quote và Policy trùng',position:{x:310,y:0}},
  {id:'cash',number:'2B',title:'Thu hộ/tiền mặt',note:'Kiểm tra trả phí, terms / OTP',position:{x:310,y:136}},
  {id:'online',number:'2C',title:'Thanh toán online',note:'Chờ gateway xác nhận đã trả tiền',position:{x:310,y:272}},
  {id:'approval',number:'2D',title:'Duyệt thanh toán',note:'Kiểm tra quyền và biến thể duyệt',position:{x:310,y:408}},
  {id:'save',number:'3',title:'Tạo Policy và đối tượng bảo hiểm',note:'Command ghi · trả theo từng nhánh',position:{x:660,y:204}},
  {id:'published',number:'4A',title:'Quote chuyển PUBLISHED',note:'Quote.status = 9 · gắn Policy ID',position:{x:1040,y:42}},
  {id:'view',number:'4B',title:'Event → Flow → Policy View',note:'Query đọc view / thông báo realtime',position:{x:1040,y:204}},
  {id:'core',number:'4C',title:'API / lịch đồng bộ Core',note:'Cập nhật mã Core và syncStatus',position:{x:1040,y:366}},
];
export function PolicyIssuanceDiagram({branch,inspected,onOpen,onPractice}:{branch:IssuanceBranchId;inspected:string|null;onOpen:(id:IssuanceMapPoint)=>void;onPractice:()=>void}){
 const branches:IssuanceBranchId[]=['direct','cash','online','approval'];
 const connections=[...branches.flatMap(id=>[{source:'quote',target:id,active:id===branch},{source:id,target:'save',active:id===branch}]),...['published','view','core'].map(id=>({source:'save',target:id,active:true,conditional:id==='core'}))];
 return <LearningJourneyDiagram layout={layout} connections={connections} activeIds={layout.filter(n=>!branches.includes(n.id as IssuanceBranchId)||n.id===branch).map(n=>n.id)} inspected={inspected} onOpen={id=>onOpen(id as IssuanceMapPoint)} practice={{direct:onPractice}} memoryKey="create" canvasLabel="Sơ đồ chung: Quote, bốn đường phát hành và ba đường sau phát hành" testId="issuance-map" legend={<><span><i/>Đường đang học</span><span><i className="conditional"/>Core: có tác nhân và điều kiện riêng</span><span>2A–2D: kiểm tra không đạt → dừng trước khi tạo</span></>}/>;
}
