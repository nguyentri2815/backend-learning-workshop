import fs from 'node:fs';
import {updateFlows,updateSource} from '../src/content/policy/update.ts';

const base='http://localhost:3182/journey/policy';
const link=(flow,mode='overview',point)=>base+'?'+new URLSearchParams({group:'update',flow:flow.id,mode,...point?{node:point}:{}});
const escape=s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('"','&quot;');
const groups={checkout:'Checkout, lịch sử theo phương thức, request/order/process ID, cờ đang xử lý, updatedDate',paid:'Checkout tx=done, cờ đang xử lý, paidTime, paymentPolicyStatus, paymentStatusFromSP, updatedDate',endorsement:'Ngày/kênh theo changes, customer có điều kiện, giá/phí, agency, status và paymentStatus từ Core',permission:'saleUnitPath, pathSaleUnitIds, saleUnitPathLevel, updatedDate; Quote được xử lý riêng trước Policy',migration:'pathSaleUnitIds và saleUnitPathLevel; giữ saleUnitPath và updatedDate; Quote có lượt ghi riêng',documents:'Append viaUploader, viaUploaderStatus=UPDATED (0), updatedDate',correct:'createdDate được map null → null; updatedDate giữ nguyên'};
const remaining={checkout:'Gateway, transaction và độ trễ view runtime chưa chạy. PAYED trên command không có trong UpdateCheckoutInfoEvent.',paid:'Gateway/checksum callback chưa chạy. Giữ riêng paymentStatus Core và status hợp đồng.',endorsement:'Response Core, địa chỉ/quốc tịch và quy tắc Core tạo status dùng fixture.',permission:'Queue và thời điểm xử lý quan hệ thực tế chưa chạy; HTTP path tên quoteId được Func dùng như saleUnitId.',migration:'API chỉ xác nhận phát queue; consumer và từng lần ghi là các mốc riêng.',documents:'Chưa upload byte file hoặc gọi Core thật. synced=true là metadata, không chứng minh Core đã nhận.',correct:'Caller nội bộ đã xác minh; chưa thấy nguồn ngày thay thế. Không kết luận sửa ngày thành công.'};
const observations=JSON.parse(fs.readFileSync('docs/review/policy-update-links.json','utf8')).observations;
const reference=JSON.parse(fs.readFileSync('docs/review/shared-reference-observations.json','utf8'));
const validationFile='docs/review/policy-update-validation.json';
const validation=fs.existsSync(validationFile)?JSON.parse(fs.readFileSync(validationFile,'utf8')):null;
const summary=validation?.summary??'Kết quả kiểm thử đang được hoàn tất; xem các link và bằng chứng source bên dưới.';

const md=[
 '# Cập nhật Policy · review và danh mục source',
 '',
 `[Mở Checkout mặc định](${link(updateFlows[0])}) · [So sánh ảnh với Tạo mới](policy-update.html) · [Trạng thái ảnh đã chụp](policy-update-links.json) · [Kết quả kiểm chứng](policy-update-validation.json)`,
 '',summary,'',
 `Đối chiếu ${updateSource.reviewedOn}: ${Object.keys(updateSource.sources).length} file Java đầy đủ có commit/SHA256. Backend D:\\ALPACA\\agent-system chỉ được đọc. Fixture xuyên suốt: POL-LEARN-001; hai flow thanh toán giữ PROCESS-LEARN-001, paymentId=PAYREQ-001 khác reqPaymentId=GW-REQ-001.`,
 '',
 '| Flow | Điểm vào / xác định Policy | Nhóm dữ liệu đổi | Ba chế độ học | Bài Từng bước triển khai | Phần còn cần xác minh |',
 '| --- | --- | --- | --- | --- | --- |',
 ...updateFlows.map(f=>`| [${f.title}](${link(f)}) | ${f.entry}<br>${f.identity} | ${groups[f.id]} | [Toàn cảnh](${link(f)}) · [Từng bước](${link(f,'steps')}) · [Lắp ráp](${link(f,'assembly')}) | 4 bước × tìm file / nối code / thử fixture; chạy đến checkpoint của chính bước | ${remaining[f.id]} |`),
 '',
 'Bộ chọn flow nằm trên cùng Cập nhật. URL giữ riêng mode, bước đang xem, cursor mô phỏng, source và câu trả lời theo flow; mỗi mode giữ vị trí đọc riêng. Đọc lại source, đổi mode hoặc thử dữ liệu khám phá không chạy tiếp mô phỏng. Deep link không có lượt chạy chỉ mở source tại điểm được chỉ định.',
 '',
 'Checkout: source chọn OnlinePolicyPaymentFlow rồi processor trước canPay/beforePay. Nhánh URL mới ghi Policy trong saveOrderPayment rồi ghi lần nữa trong pay. Command có paymentPolicyStatus=PAYED nhưng event không có trường này; status, paymentStatus, paymentStatusFromSP, paymentPolicyStatus và paidTime giữ nguyên. Payment process kết thúc ở OPEN / IN_PROCESS. Nhánh process đã PAYED dừng trước ghi với PAYMENT_POLICY_HAS_BEEN_PAID.',
 '',
 'Cập nhật quyền: nhánh Policy đã có path mới vẫn có thể đã cập nhật Quote trước đó. Chuyển dữ liệu: HTTP trả true sau phát queue, consumer xử lý từng Quote và Policy sau đó. createdDate: GET nội bộ đã có caller, nhưng hồ sơ được chọn có ngày null và command truyền lại null.',
 '',
 'Dùng chung LearningOverviewFrame, LearningJourneyDiagram, LearningSteps, CheckpointActionBar, CheckpointCodeWorkspace, CheckpointVariables, LearningReadSource, LearningAssemblyLesson, LearningPatternWorkspace và bộ xem source A/B. Bảy cặp ảnh với Tạo mới ở 1440×1000, zoom 100%, deviceScaleFactor=1; mobile kiểm tra 390×844.',
 '',
 ...updateFlows.flatMap(f=>[
  `## ${f.title}`,'',f.actor,'',
  `Kết quả/event: ${f.eventName}; PolicyWorkflow → PolicySyncViewFunc đọc Command, map các trường có trên PolicyViewEntity, save và gửi thông báo. Lượt view được quan sát riêng trong mô phỏng; không khẳng định thứ tự hoặc độ trễ runtime.`,
  '',`Nhánh dừng/bỏ qua: ${f.scenarios.filter(s=>s.stopAt).map(s=>`${s.label}: ${s.message} (${s.stopAt})`).join('; ')}.`,
  '',...f.limits.map(l=>`- ${l}`),'',
  '| Bước | Checkpoint và source đã xác minh | Thao tác |','| --- | --- | --- |',
  ...f.steps.map(step=>`| ${step.title} | ${f.points.filter(p=>p.stage===step.id).map(p=>`[${p.method}:L${p.from}–${p.to}](${link(f,'steps',p.id)}) · ${updateSource.sources[p.ref].path.split('/').at(-1)}`).join('<br>')} | ${step.input} → ${step.output}; [mở bài lắp ráp và triển khai](${link(f,'assembly',f.points.find(p=>p.stage===step.id).id)}) |`),''
 ]),
 '## Chạy lại kiểm tra','',
 '```powershell',
 'npm.cmd run build',
 'npx.cmd playwright test tests/browser/policy-update-checkout.spec.ts tests/browser/policy-update.spec.ts',
 'node scripts/verify-fixtures.mjs',
 'node scripts/extract-policy-update-source.mjs --root D:/ALPACA/agent-system --check',
 'node scripts/review-policy-reference.mjs',
 'node scripts/review-policy-update.mjs',
 'node scripts/build-policy-update-review.mjs',
 '```','',
 'Workshop chỉ mô phỏng theo source đã đọc; không gọi API/DB/queue/gateway hoặc chạy Java thật. Không chỉnh backend nghiệp vụ.',
 ];
fs.writeFileSync('docs/review/policy-update.md',md.join('\n')+'\n');

const pairs=[['overview','Nhìn toàn cảnh'],['checkpoint','Làm lại từng bước · code / cây file / biến'],['reason','Tư duy lắp ráp · Suy luận'],['cooperate','Tư duy lắp ráp · Phối hợp'],['pattern','Tư duy lắp ráp · Chọn mẫu'],['diagram','Cửa sổ · Sơ đồ liên quan'],['implementation','Cửa sổ · Từng bước triển khai']];
function figure(id,create=false){const item=create?reference.find(i=>i.name===id):observations.find(i=>i.flow==='checkout'&&i.name===id),src=create?`shared-reference-${id}.png`:`update-checkout-${id}.png`;return `<figure><figcaption>${create?'Tạo mới · bản chuẩn':'Checkout · Cập nhật'} · <a href="${escape(item?.url??base)}">Mở đúng trạng thái</a></figcaption><a href="${src}"><img src="${src}" width="1440" height="1000" loading="lazy" alt="${create?'Tạo mới':'Checkout'} · ${id}"></a></figure>`;}
const html=`<!doctype html><html lang="vi"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Review Cập nhật Policy</title><style>*{box-sizing:border-box}body{margin:0;background:#f6f6f1;color:#193f34;font:15px/1.6 system-ui,sans-serif}main{max-width:1800px;margin:auto;padding:28px}a{color:#1e6753}nav{display:flex;gap:14px;flex-wrap:wrap}.pair{display:grid;grid-template-columns:1fr 1fr;gap:16px}figure{margin:0;background:white;border:1px solid #ced8d0;min-width:0}figcaption{padding:12px;font-weight:600}img{display:block;width:100%;height:auto}section{margin-top:32px}table{width:100%;border-collapse:collapse;background:white}th,td{text-align:left;vertical-align:top;border:1px solid #ced8d0;padding:10px}td{overflow-wrap:anywhere}.table-scroll{overflow:auto}.status{padding:14px;background:#e8f1e6;border:1px solid #b4cbb8}h1{font-size:30px}.extras{display:grid;grid-template-columns:repeat(3,1fr);gap:16px}@media(max-width:760px){main{padding:14px}.pair,.extras{grid-template-columns:1fr}}</style><main>
<h1>Khám phá Policy → Cập nhật · 7 flow</h1><nav><a href="${link(updateFlows[0])}">Mở Checkout mặc định</a><a href="policy-update.md">Danh mục source / bước / nhánh dừng</a><a href="policy-update-validation.json">Kết quả kiểm chứng</a><a href="policy-update-links.json">Link từng trạng thái đã chụp</a></nav><p class="status">${escape(summary)}</p>
<p>Fixture Policy POL-LEARN-001; payment process PROCESS-LEARN-001. Checkout giữ riêng trạng thái hợp đồng, Core, SP và process. createdDate có caller nội bộ đã xác minh; nguồn ngày thay thế còn cần xác nhận.</p>
<div class="table-scroll"><table><thead><tr><th>Flow / điểm vào</th><th>Nhóm dữ liệu đổi</th><th>Ba chế độ / bài triển khai</th><th>Phần còn cần xác minh</th></tr></thead><tbody>${updateFlows.map(f=>`<tr><td><a href="${link(f)}"><strong>${escape(f.title)}</strong></a><br>${escape(f.entry)}<br>${escape(f.identity)}</td><td>${escape(groups[f.id])}</td><td><a href="${link(f)}">Toàn cảnh</a> · <a href="${link(f,'steps')}">Từng bước</a> · <a href="${link(f,'assembly')}">Lắp ráp</a><br>4 bước × tìm file / nối code / thử fixture</td><td>${escape(remaining[f.id])}</td></tr>`).join('')}</tbody></table></div>
<h2>Đối chiếu Checkout với Tạo mới</h2><p>Cùng Chromium, viewport 1440×1000, zoom 100%, deviceScaleFactor=1. Bấm ảnh để xem kích thước gốc; link phía trên ảnh khôi phục đúng trạng thái. Component và tương tác dùng chung, dữ liệu từng flow độc lập.</p><nav>${pairs.map(([id,title])=>`<a href="#${id}">${title}</a>`).join('')}</nav>
${pairs.map(([id,title])=>`<section id="${id}"><h2>${title}</h2><div class="pair">${figure(id,true)}${figure(id)}</div></section>`).join('')}
<section><h2>Đường thành công, toàn file và nhánh dừng</h2><div class="extras">${['overview-map','result','full-source','stopped'].map(id=>figure(id)).join('')}</div></section>
<section><h2>Các flow còn lại</h2>${updateFlows.slice(1).map(f=>`<h3><a href="${link(f)}">${escape(f.title)}</a></h3><div class="extras">${['overview','checkpoint','implementation','result'].map(id=>`<figure><figcaption>${id}</figcaption><a href="update-${f.id}-${id}.png"><img loading="lazy" src="update-${f.id}-${id}.png" alt="${escape(f.title)} · ${id}"></a></figure>`).join('')}</div>`).join('')}</section>
<p>${Object.keys(updateSource.sources).length} file Java đầy đủ có commit/SHA256; mỗi checkpoint giữ số dòng gốc. Chỉ mô phỏng theo source, chưa chạy Java/API/DB/queue/gateway thật.</p></main></html>`;
fs.writeFileSync('docs/review/policy-update.html',html);
console.log('Built seven-flow source inventory and seven paired Checkout/Create comparisons.');
