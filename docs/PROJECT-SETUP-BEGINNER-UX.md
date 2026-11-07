# UX thao tác cho người mới — 05/11/2026

## Phạm vi

Chỉ hành trình môi trường: một cột, thanh 7 bước có tiến độ, React Flow trong phần mặc định đóng và 23 thao tác mở/thu ngay tại hàng. Checkbox riêng và nút tiếp theo không tự tick. Giữ dependencies/lockfile, Policy/Claim và repo gốc.

Mỗi thao tác: Bạn cần làm gì → Làm ở đâu → Làm như thế nào (đánh số/copy lệnh) → Kiểm tra kết quả (dấu hiệu/ý nghĩa/điều kiện tiếp) → Nếu kết quả khác. Kỹ thuật/lịch sử/cách tìm ở repo khác là phần mở thêm. Nội dung 16px/1.55; tên thao tác 19px (mobile 18px), tên bước 24px, code 14px, chữ phụ từ 13px.

Các thao tác bổ sung: mở PowerShell đúng root; java/javac trước khi đổi JDK; chọn/cài JDK có điều kiện; Wrapper riêng; mở project và menu SDK/language/bytecode/Gradle JVM/Reload; tạo Application Run Configuration mà chưa chạy; đọc tab log/profile/Started/port/PID; dừng đúng app.

## Source và báo cáo đã đối chiếu

- Báo cáo `D:\tmp\agent-service-workspaces-setup-evidence-report.md` ngày 04/11/2026, tài liệu `PROJECT-SETUP-REPLAY-DESIGN.md` và `PROJECT-SETUP-ACTION-REDESIGN.md`. Snapshot runtime báo cáo không là trạng thái hiện tại.
- `D:\ALPACA\agent-system\settings.gradle`, `build.gradle`, `gradle/wrapper/gradle-wrapper.properties`: module include, toolchain 21, Wrapper 8.14.3, Boot plugin ở subprojects, Lombok/annotationProcessor.
- Command `build.gradle` và main source của 5 app: AgentCommandServiceApplication, AgentFlowServiceApplication, AgentQueryServiceApplication, AgentIntegrationServiceApplication, KafkaCDCServiceApplication.
- `application*.yml` trong resource folder 5 app: cổng 9901/82/9902/9903/8911, schema và connection-init-sql/ddl-auto khác nhau. Phân biệt cổng/schema/tên DB; bảng UI chỉ là source, không chứng minh cấu hình hiệu lực.
- `docker-compose-env.yml`: container_name cố định, Debezium 8086:8083, PostgreSQL 5432:5432 và 5433:5432. Không đồng nhất Debezium riêng 18086:8083 trong lịch sử.

Lượt này chỉ đọc file, không chạy Gradle/Java/Docker/Java API/SQL, không đổi IDE hay môi trường máy. Không đưa credential/private endpoint vào bài học.

## Khoảng trống còn giữ rõ trong hướng dẫn

| Thiếu | Tìm ở đâu / ai xác nhận | Ảnh hưởng |
| --- | --- | --- |
| Tập service tối thiểu theo task | BE, build.gradle, application*.yml, API/consumer | Chọn nhóm infra/app bước 4/6 |
| Profile local Flow/Query | BE/Tech Lead, application.yml/application-dev.yml, override Run Configuration | DB/schema/auth/startup |
| DB/override/quyền/đồng bộ 5432 → 5433 | BE/DB owner, cấu hình app/Compose/local | Startup có thể đổi schema; dữ liệu Query/E2E |
| Debezium instance/payload/network/topic | Infra, payload gốc đã che, connector_request.json, mapping/status instance | Task cần CDC; không tự POST connector |
| HTTP/auth/expected/dữ liệu E2E | API owner/BE/QA/DB owner | Không kết luận API/nghiệp vụ từ port mở |

Không cung cấp lệnh up/bootRun hoàn chỉnh cho điều kiện chưa chốt; tick không tự mở khóa startup. Chỉ cài/chọn lại công cụ khi kiểm tra cho thấy cần. Không clone lại repo hoặc mặc định chạy 5 app.

## Ngữ cảnh

URL giữ bước/thao tác/trạng thái thu gọn/panel/file/evidence/line/return context. Không có check: mở việc đầu chưa hoàn thành; có check hợp lệ: ưu tiên deep link. Tick không đổi URL/selection/scroll. Back/Forward phục hồi thao tác mở/thu.

Graph chỉ mount khi mở, lưu x/y/zoom ở session, không tự fit khi mở lại/đổi nội dung/tick. Nút Xem toàn cảnh/Về bước đang làm mới thay viewport. Mobile dùng danh sách, quay desktop khôi phục viewport. Reset chỉ tác động tiến độ môi trường, giữ Policy/Claim/dữ liệu học cũ/viewport. Đổi module bỏ tick từ cấu hình trở đi.

## Kiểm tra và ảnh

Chạy `npm.cmd run build` (gồm typecheck), `npm.cmd run test:browser`, `npm.cmd run verify:originals`.

Kết quả: build/typecheck đạt; **24/24 browser tests đạt** (54,0 giây). Đối chiếu repo gốc: quotation-product 44 file, quotation-workshop 1.937 file, 0 thay đổi và working-tree status giữ nguyên.

24 browser tests: hàng mở/thu bằng vùng trống và keyboard; tick không đóng/đổi URL/cuộn; tiếp theo không tự tick; mở việc chưa hoàn thành; lưu/reset/module scope; copy đúng module không thực thi/request ngoài; deep link/Back/Forward/reload/history/file/return; storage/link lỗi; graph pan/zoom/fit/focus/đóng-mở/selection/mobile-desktop/reset; cỡ chữ/không tràn ngang; hồi quy Policy/Claim.

Desktop 1512×1050, mobile 390×844, zoom 100%:

1. Toàn màn hình, graph thu gọn (artifact cục bộ: `../.verification/ux-01-overview.png`)
2. Thao tác hoàn chỉnh (artifact cục bộ: `../.verification/ux-02-complete-action.png`)
3. Java/IDE (artifact cục bộ: `../.verification/ux-03-java-ide.png`)
4. Mobile (artifact cục bộ: `../.verification/ux-mobile.png`)

Build có cảnh báo bundle vượt 500kB nhưng hoàn tất; giữ cấu hình đóng gói trong phạm vi hiện tại.
