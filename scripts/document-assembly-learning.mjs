// Node 22: node --experimental-strip-types scripts/document-assembly-learning.mjs
// Read bundled, reviewed content only; never writes to the backend workspace.
import fs from 'node:fs';
import {learningSteps} from '../src/content/policy/assembly-learning.ts';
import {creationContext} from '../src/policy/create-model.ts';
const sources=JSON.parse(fs.readFileSync('src/content/policy/assembly-source.json','utf8'));
const lessons=learningSteps(creationContext(new URLSearchParams()));
const names=['Phát hành từ Quote','Kiểm tra Quote','Dựng dữ liệu Policy','Ghi Policy','Cập nhật dữ liệu tra cứu','Xem kết quả'];
const clean=s=>s.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('|','\\|').replaceAll('\n','<br>');
const refs=new Set();
const lines=['# Bằng chứng mẫu lắp ráp Policy','',
  'Đối chiếu trực tiếp `D:/ALPACA/agent-system`, ngày 10/11/2026. Backend chỉ đọc. Snapshot trong `src/content/policy/assembly-source.json` giữ toàn file, số dòng gốc, SHA256, commit và trạng thái file. Không chạy Java, API, DB hoặc broker.', '',
  'Tái tạo bảng từ nội dung đã review: `node --experimental-strip-types scripts/document-assembly-learning.mjs`. Đối chiếu lại backend bằng `node scripts/assembly-sources.mjs --check`.', '',
  '## Bảng mẫu phối hợp đã xác minh','',
  '| Bước | Mẫu / phạm vi | Căn cứ gom nhóm | Khác biệt khi chọn |','|---|---|---|---|'];
for(const [i,[,lesson]] of Object.entries(lessons).entries()) for(const p of lesson.patterns) {
  for(const e of [...p.nodes.flatMap(n=>n.evidence),...p.edges.flatMap(e=>e.evidence),...p.examples]) refs.add(e.ref);
  lines.push(`| ${i+1}. ${names[i]} | **${p.title}**<br>${p.badge} | ${clean(p.grouping)} | ${clean(p.difference)} |`);
}
lines.push('','## Quan hệ thật và đoạn code ở hai đầu','',
  'Mỗi dòng là một lần bàn giao ở phần B/C. Các khóa source dẫn tới bảng đường dẫn và symbol bên dưới; UI mở source nguyên gốc với đủ thân method. Khung có chú thích là khung rút gọn, không phải bản sao đầy đủ.', '',
  '| Bước / mẫu | Điểm nối | Dữ liệu / kết quả | Khung phối hợp rút gọn | Bằng chứng cả hai đầu |','|---|---|---|---|---|');
for(const [i,[,lesson]] of Object.entries(lessons).entries()) for(const p of lesson.patterns) for(const e of p.edges) {
  lines.push(`| ${i+1} / ${p.id} | ${p.nodes.find(n=>n.id===e.from).name} → ${p.nodes.find(n=>n.id===e.to).name}<br>${e.label} | ${clean(e.data)}<br>${clean(e.result)}${e.limit?'<br>Giới hạn: '+clean(e.limit):''} | ${clean(e.frame)} | ${e.evidence.map(v=>'`'+v.ref+'`').join(', ')} |`);
}
lines.push('','## Khung code theo trách nhiệm','',
  '| Bước / mẫu | Thành phần | Hợp đồng | Chỗ cần đổi / giới hạn | Source |','|---|---|---|---|---|');
for(const [i,[,lesson]] of Object.entries(lessons).entries()) for(const p of lesson.patterns) for(const n of p.nodes) {
  lines.push(`| ${i+1} / ${p.id} | ${n.name} | ${clean(n.input)} → ${clean(n.output)} | ${clean(n.change)}${n.limit?'<br>Giới hạn: '+clean(n.limit):''} | ${n.evidence.map(e=>'`'+e.ref+'`').join(', ')} |`);
}
lines.push('','## Đường dẫn, symbol và đoạn source','',
  'Đường dẫn tương đối với `D:/ALPACA/agent-system`. Dòng neo là khai báo symbol; source viewer giữ số dòng gốc, đọc hết method/nhánh lồng và có quyền mở toàn file. Với lớp/interface, hiển thị khai báo cùng đầy đủ các trường/method phía dưới; mở toàn file để đọc cả imports.', '',
  '| Khóa source | Đường dẫn | Symbol / dòng neo |','|---|---|---|');
for(const ref of [...refs].sort()) {
  const s=sources[ref]; lines.push(`| \`${ref}\` | \`${s.path}\` | ${clean(s.symbol)} · **L${s.line}** |`);
}
lines.push('','## Caller và giới hạn cần giữ khi đọc bản đồ','',
  '- Mapping/helper → Command là luồng dữ liệu. Caller thật là `runInternal`: map → gán riêng → `getPolicyStatus` trả giá trị cho `setStatus` → `fillMissingValue` sửa cùng Command → bổ sung mã/thanh toán → `save`. MappingUtils không gọi helper.',
  '- `PlatformConfig` tạo `AggregateExtRepository`; lớp này kế thừa `save`. Repository gọi `processCommand`, vòng `applyEvents`, rồi store. Lớp nền phản chiếu tới `process(CreatePolicyCommand)` và `apply(CreatePolicyEvent)`. **process không tự gọi apply**; apply chỉ đổi trạng thái trong bộ nhớ.',
  '- Store/JDBC ghi events/entities, gán ID/version và gọi JpaRepository.save. `AbstractJdbcAggregateCrud.publish` rỗng, lớp Local không override. Chưa xác định thành phần chuyển bảng events lên Kafka. Phía nhận đã lần Kafka → store giải mã → dispatcher → adapter phản chiếu tới handler. Chưa chứng minh transport/runtime, thời điểm commit, bảo đảm giao event hoặc thứ tự với HTTP.',
  '- Workflow dùng `de.getEntityId()` gọi `PolicySyncViewFunc.exec(id)`; executor callback gọi Feign `InternalSPCommandApi.findPolicyById(id)` → `InternalPolicyController` → `FindPolicyByIdFunc.exec(policyId)`. Đã đọc hai đầu và hợp đồng HTTP; chưa xác minh runtime HTTP/Feign. Callback bắt lỗi bên trong nên annotation Retryable không chứng minh callback được retry.',
  '- Query module phụ thuộc trực tiếp `5-agent-shared-entity` trong build.gradle; đây là căn cứ chọn QueryCustomRepository module 5 dù module 4 có lớp cùng tên. Query gọi JdbcTemplate; chưa lần source thư viện Spring JDBC hay chạy SQL.',
  '- GET `/policy/{id}` có method thực tế tên `paymentMethod`, gọi FindPolicyByIdFunc và đọc PolicyRepository. Dùng Policy ID từ bước ghi/dòng danh sách; quoteId và policyCode có vai trò khác.',
  '- Spring MVC/Data JPA, ModelMapper, Redisson, TransactionTemplate, JdbcTemplate và Feign: đã đọc lời gọi/cấu hình tại các mục liên quan, chưa lần toàn bộ source thư viện hoặc xác nhận runtime. Không suy ra email/SMS và tác dụng phụ ngoài cùng rollback.',
  '- Danh sách phụ thuộc view, filter và phạm vi; Page.empty cũng có thể do bắt lỗi. Chi tiết đọc aggregate theo Policy ID. Dữ liệu trong bài là fixture, không phải kết quả một lần phát hành thật.', '');
fs.writeFileSync('docs/review/policy-assembly-learning-evidence.md',lines.join('\n'));
console.log(`Documented ${Object.values(lessons).reduce((n,l)=>n+l.patterns.length,0)} coordination patterns/variants and ${refs.size} source references.`);
