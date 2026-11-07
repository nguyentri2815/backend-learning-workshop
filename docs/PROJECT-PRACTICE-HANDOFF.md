# Bàn giao thực hành trên project A–E

Ngày 05/11/2026, Asia/Bangkok. Bản local: [cổng 3182](http://localhost:3182/journey/environment?step=source&experience=project&task=root).

Bản A–E này đã được duyệt. Phần nối tiếp Java/IDE → dependency → build → chạy/dừng → kiểm tra được bàn giao ở [PROJECT-RUNTIME-HANDOFF.md](PROJECT-RUNTIME-HANDOFF.md); các số lượng và ảnh dưới đây ghi lại phạm vi A–E trước khi mở rộng.

## Trải nghiệm để review

Cây project, source viewer và nhiệm vụ đặt trong cùng vùng thực hành. Desktop giữ ba cột ở cả 1280px; mobile đặt nhiệm vụ trước cây/source, lựa chọn và kết quả sau source. Chọn file trên mobile đưa viewer vào vùng nhìn. Giữ thanh 7 bước, graph mặc định đóng, hướng dẫn Java/IDE, Docker, build và chạy ứng dụng vẫn truy cập được.

| Chặng | Thao tác | Kết quả trong bài |
|---|---|---|
| A | Mở `settings.gradle`, `build.gradle`, `gradlew.bat` | Tên project `agent-workspaces`, các module, Gradle 8.14.3 và toolchain Java 21; file Windows highlight dòng 20 |
| B | Chọn `settings.gradle:30` → Đến thư mục trong cây | Thấy vị trí `workspaces/agent-service/1-agent-command-service` còn thiếu; bảng khai báo → đường dẫn → trạng thái |
| C | Tìm cách lấy source → chọn `git-cmd.sh:10` | Nối Command với repo `workspaces/agent-service`; nguồn Git đã che, giữ namespace và đích clone |
| D | Xem trạng thái sau khi lấy source → chọn Command | 10 repo con được đánh dấu mới; các module có source theo báo cáo, riêng Swagger vẫn thiếu |
| E1 | Đi vào module Command → `src/main/resources` → mở hai file YAML | Nhìn thấy module nhận yêu cầu ghi dữ liệu và vị trí cấu hình gốc/dev |
| E2 | So sánh và chọn profile → chọn dev | Trong mô hình hai file, datasource đổi từ remote đã che sang localhost/`alpaca-event`; port 9901 và schema `platform_event` giữ nguyên; `alpaca.local` đổi true → false |

Không suy ra đúng repo chỉ từ tên thư mục. Phần IntelliJ của A hướng dẫn đối chiếu namespace/repo bằng Git → Manage Remotes với maintainer, tránh chia sẻ credential.

Thử chọn file/dòng khác để xem phản hồi và chọn lại. Chỉ vị trí chỉ mở nhánh/chỉ file hoặc dòng, không hoàn thành nhiệm vụ. Làm lại bước đặt lại quan sát của nhiệm vụ đó; làm lại D đưa cây về trước lấy source. Các nhiệm vụ đã xem có thể mở lại từ thanh A–E.

## Bằng chứng và dữ liệu

Đã đọc [báo cáo setup](D:/tmp/agent-service-workspaces-setup-evidence-report.md), đặc biệt S00, S02, S03, S17 và danh sách module; đối chiếu source tại `D:/ALPACA/agent-system`. Báo cáo ngày 04/11/2026 không giữ snapshot cây đầy đủ lúc clone: UI ghi **Tái dựng theo báo cáo**, không gọi là snapshot nguyên bản. File gốc hiển thị là đoạn trích source hiện tại; điều này cũng được ghi trong phần nguồn mở thêm.

`src/content/setup/practice-source.json` lưu 8 đoạn trích, 33 khai báo module, 10 đích clone; số dòng giữ theo file gốc. Thời điểm trích: `2026-11-05T05:12:44.394Z`. Revision workspace `af8d7f32fa5d3f5a380626679d30c4698960f33f`; revision repo chứa Command `f0971ae41170c84bb883be92cd1ebd6632010302`. Mỗi file có đường dẫn, source root, commit, mtime và SHA-256 nội dung nguồn. Browser test đối chiếu hash/số dòng và sự tồn tại của cả 33 đường dẫn với filesystem.

Nguồn clone và connection string được thay bằng mô tả đã che; username/password được che trước khi vào JSON frontend. Source của `init-shared.sh` cũng được trích/che để đối chiếu: chứa nhóm sale-system/nhóm khác, trong khi báo cáo S02 chọn `git-cmd.sh` của agent-system. Không dựng shell invocation như thể đã được chạy trong lịch sử.

`settings.gradle:27` khai báo `workspaces/2-infrastructure/swagger-service`; không có clone target tương ứng và thư mục vẫn thiếu. Chọn Swagger sẽ nhận giải thích cần maintainer xác nhận source/quyền; không sinh lệnh clone giả.

## Lựa chọn cấu hình có giới hạn

Kết quả E2 chỉ áp dụng cho mô hình `application.yml` + `application-dev.yml`. File có hậu tố dev chưa tự kích hoạt profile. Chưa kết luận cấu hình hiệu lực trên máy thật khi chưa kiểm tra Run Configuration, program arguments, JVM options/system properties, environment variables và cấu hình ngoài (`spring.config.location`, `additional-location`, `import`). Vị trí và cách kiểm tra nằm trong phần **Làm tương ứng trong IntelliJ thật**.

Source dev còn API ngoài và cấu hình khởi tạo/cập nhật schema; việc xác nhận DB/dependency trước khi Run vẫn thuộc hướng dẫn máy thật. Ứng dụng không đọc/điều khiển IntelliJ, clone repo, khởi động Java/Docker hoặc truy cập DB.

## Tiến độ và điều hướng

- Thực hành: `backend-learning-workshop.project-practice.v1`; lưu riêng ngữ cảnh từng nhiệm vụ: file, dòng, module, trước/sau, nhánh mở, thư mục chọn và profile.
- Checklist máy thật: giữ `backend-learning-workshop.setup-checklist.v1` cùng dữ liệu đã có. Hoàn thành cả 6 nhiệm vụ thực hành không tick checklist.
- URL: `step=source&experience=project` cùng `task`, `pfile`, `pline`, `pmodule`, `pstate`, `pfolder`, `popen`, `pprofile`; URL được ưu tiên hơn bộ nhớ. Link thiếu tham số được bổ sung từ ngữ cảnh đã lưu hoặc mặc định; link/storage lỗi có fallback.
- Quay lại nhiệm vụ, đổi hành trình, reload, Back/Forward giữ đúng ngữ cảnh. Profile lấy giá trị từ URL để kết quả và lựa chọn thống nhất khi duyệt lịch sử. Hint đợi điều hướng cập nhật cây rồi mới focus và hiện phản hồi.
- Reset từng nhiệm vụ không xóa tiến độ Policy/Claim, checklist hoặc namespace học cũ. Reset checklist máy thật giữ tiến độ thực hành và viewport graph.

## Kiểm tra

- `npm.cmd run build`: pass, gồm typecheck. Vite còn cảnh báo kích thước chunk chính trên 500 kB.
- `npm.cmd run test:browser`: 32 tests, gồm 8 test thực hành và regression hướng dẫn/graph/Policy/Claim. Kiểm tra ánh xạ source, chọn đúng/sai, hint, keyboard, trước/sau, làm lại D, deep link, Back/Forward/reload, lưu tiến độ, desktop 1280px và mobile 390px. Luồng A–E không gửi request ra ngoài origin frontend.
- `npm.cmd run verify:originals`: Product 44 file, Workshop 1937 file; 0 file đổi, working tree status giữ nguyên so với baseline.
- Git status chỉ đọc ở Java root + 10 repo con: sạch; không sửa cấu hình Git. Chi tiết local ở `.verification/practice-java-status.json`.
- Không thêm dependency, sửa Policy/Claim hoặc các repo gốc, chạy script clone/Java/Gradle/Docker/DB, commit/push/deploy.

Log kiểm tra cuối: `.verification/practice-browser-final.log`, `.verification/practice-build-final.log`. Server Vite nền ở cổng 3182; log `.verification/practice-vite.log`, `.verification/practice-vite-error.log`.

## Ảnh review

- Trước lấy source (artifact cục bộ: `../.verification/project-before-source.png`)
- Sau lấy source (artifact cục bộ: `../.verification/project-after-source.png`)
- So cấu hình Command (artifact cục bộ: `../.verification/project-command-config.png`)
- Mobile (artifact cục bộ: `../.verification/project-mobile.png`)

Ảnh là giao diện ứng dụng học, không phải bằng chứng clone hoặc chạy Java trên máy thật. Các tài liệu bàn giao setup/UX trước đây vẫn giữ để tra cứu.
