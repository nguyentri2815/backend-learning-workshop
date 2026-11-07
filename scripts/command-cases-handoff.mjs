import fs from 'node:fs';
import {commandCases,caseOriginLabel} from '../src/setup/command-cases.ts';
const evidence=JSON.parse(fs.readFileSync('src/content/setup/command-case-source.json','utf8'));
const base='http://localhost:3182/journey/environment';
const review=item=>`${base}?${new URLSearchParams({experience:'project',task:'startup',step:'run',prun:'run',pfile:'main',pprofile:'dev',psim:JSON.stringify({commandCase:{id:item.id},commandSession:{playback:{reference:item.origin==='recorded'?'recorded-failure':'configured',caseId:item.id}}})})}`;
const text=`# Chạy Command và đọc kết quả

URL chính: ${base}?experience=project&task=startup&step=run&prun=run

Đã gộp I2/J1 thành một bước hiển thị. Dùng chung commandSession, ID lần Run, launchProfile, playback, log và process. Tiếp theo đi thẳng J2 “Chuẩn bị bắt đầu task”. Không yêu cầu hoàn thành thư viện lỗi.

## Review ngắn

1. Chọn một phiên tham chiếu hoặc mở **Thử tình huống khác** → chọn case. Bấm tam giác cạnh main (hoặc Enter lệnh Terminal).
2. Quan sát nhóm và console. Có thể Pause/Continue, chọn nhóm/dòng quan trọng; không cần đọc/tick mọi dòng. Dòng SIM có nhãn riêng, toàn bộ log chỉ dành cho phiên lưu thật.
3. Tại **Kết quả lần Run**, bấm **Tìm nguyên nhân** → mở đúng cửa sổ IDE/config/Build/Terminal/Docker/log/HTTP mẫu → **Thực hiện kiểm tra trong bài**.
4. Dựa vào kết quả kiểm tra, đổi trường trong case, áp dụng rồi thử lại. Chọn nguyên giá trị sai sẽ chưa được coi là sửa xong. Chỉ hiển thị bằng chứng khắc phục sau khi thử lại hoàn tất.
5. Case cần cấu hình startup mới: Stop nếu còn chạy, rồi Run tạo ID mới. Case request sau Started: thử lại cùng process, không tăng ID Run. Stop giữ source/JAR và dịch vụ Docker.
6. Thành công: kiểm tra đúng process/port trước; sau thao tác này mới mở HTTP health theo contract có điều kiện. Started, port mở, health phản hồi và nghiệp vụ đúng là những mức khác nhau.

## Tình huống và bằng chứng

${commandCases.length} case: ${commandCases.filter(c=>c.origin==='recorded').length} lấy dấu hiệu từ phiên thật đã lưu, ${commandCases.filter(c=>c.origin==='source').length} giả lập dựa trên source, ${commandCases.filter(c=>c.origin==='general').length} ví dụ kỹ thuật chung. Các phép kiểm tra/sửa/kết quả thử lại đều là mô phỏng, kể cả nhánh của phiên timeout thật. Chỉ đọc agent-system, không dùng INSURTECH.

| Case / mở bước review | Loại bằng chứng | Điều học được / điểm dừng | Nguồn đã đọc |
| --- | --- | --- | --- |
${commandCases.map(item=>`| [${item.title}](${base}?experience=project&task=startup&step=run&prun=run) | ${caseOriginLabel(item.origin)} | ${item.reached} | ${item.refs.map(id=>{const ref=evidence.refs[id];return ref?`${ref.path}:${ref.from}`:id;}).join('<br/>')} |`).join('\n')}

Link trong bảng mở bước chung để giữ tiến độ; chọn case cùng tên trong “Thử tình huống khác”. Các URL snapshot riêng tại .verification/command-case-review-links.json dành cho browser review độc lập.

Nguồn được trích có dòng/SHA-256 ở src/content/setup/command-case-source.json; script extract-command-cases.mjs chỉ đọc repo gốc và ghi vào ứng dụng học. Chi tiết các nhánh/fixture nằm trong src/setup/command-cases.ts.

## Giới hạn kết luận

- Phiên thật duy nhất trong thư viện lỗi: app.log L19075–24260, Command Java 21, không active profile, dùng default. Chuỗi lỗi tới entityManagerFactory → JDBCConnectionException → PSQLException → SocketTimeoutException: Connect timed out (L23868). main:27 là callsite, không phải kết luận lỗi gốc.
- Chưa xác định lỗi mạng, firewall, DB tắt hoặc override/đích sai của phiên thật. Hai nhánh điều tra timeout là bộ dữ kiện giả lập riêng; không sửa lịch sử. Chạy lại sau sửa là dữ kiện SIM, không ghép với log thật.
- Connection refused và timeout có hướng kiểm tra riêng; running chưa chứng minh ready. Các lỗi DB auth/database/schema có fixture riêng, không suy từ refused/timeout.
- Profile khác dự định và port bị override có thể vẫn Started. Không mặc định thiếu dev luôn lỗi hoặc thiếu dev chắc chắn là default; case này chỉ kết luận khi đã xác định các nguồn cấu hình trong fixture.
- Rabbit listener case giả định web vẫn Started và listener retry; nhận message chỉ xảy ra khi có message. Kafka case giả định có subscriber kích hoạt: bootstrap và broker advertised address là hai mức; không khẳng định Command luôn start consumer.
- 401/403/500 là ví dụ kỹ thuật chung: không gán một endpoint nghiệp vụ/response chưa xác minh cho repo. Health /actuator/health là contract suy từ starter, permitAll và mặc định Boot, với context path/exposure/port/override được ghi rõ; chưa gọi HTTP thật. Sai method còn có thể là 405, không luôn 404.
- Bootstrap @PostConstruct có thể ghi DB/event/khóa Redis; case lỗi không chứng minh mọi tác động trước đó đã rollback. Không khởi chạy hook thật để học.

## Điều hướng và tiến độ

- task=verify cũ được chuẩn hóa bằng replace sang task=startup&prun=results; mở/focus kết quả, không tạo Run mới. prun=run/results hỗ trợ Back/Forward.
- Giữ completed/seen và context verify cũ; thêm alias hoàn thành startup để không mất tiến độ. Nav chỉ hiện một bước và đếm theo 16 nhiệm vụ. Snapshot có psim giữ lịch sử rõ; link không có snapshot dùng phiên chung hiện tại thay vì khôi phục phiên J1 cũ đã lỗi thời.
- Làm lại bước gộp chỉ reset Run/log/review/case; không reset I1, Docker, Build hoặc các phần khác. Chọn case chỉ đổi dữ kiện case, không tự bật dịch vụ G2 hoặc sửa SDK/I1.
- Bản ứng dụng trước sửa được giữ ở .verification/run-results-before/. Không sửa Java/Quotation, không chạy Java/Docker/DB/API thật, không thêm dependency hoặc commit/push/deploy.

## Kiểm tra

Kết quả cuối và ảnh review được cập nhật sau khi hoàn tất hồi quy. Bộ kiểm tra mới duyệt mọi case và nhánh ở model; mỗi case có đường UI Run → kiểm tra → sửa → thử lại, cùng migration/deep link/history/mobile và thứ tự process/port → HTTP.
`;
fs.mkdirSync('.verification',{recursive:true});
fs.writeFileSync('docs/PROJECT-COMMAND-MERGED-CASES.md',text);
fs.writeFileSync('.verification/command-case-review-links.json',JSON.stringify(commandCases.map(item=>({id:item.id,title:item.title,origin:caseOriginLabel(item.origin),url:review(item)})),null,2)+'\n');
console.log(`Wrote ${commandCases.length} case handoff entries and direct review links.`);
