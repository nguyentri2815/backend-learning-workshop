# Bàn giao hành trình thực hành A–J

Phần Java/IDE, đối chiếu dependency, Docker và conflict đã được cập nhật ngày 06/11/2026: xem [bàn giao mới và ảnh review](PROJECT-INFRASTRUCTURE-HANDOFF.md). Nội dung dưới đây lưu lại phiên bản A–J trước cập nhật.

Ngày 05/11/2026 · Asia/Bangkok. Chỉ triển khai trong `backend-learning-workshop`.

- [Mở đầu A: workspace mới clone](http://localhost:3182/journey/environment?step=source&experience=project&task=root).
- [Tiếp tục F: Java/IDE](http://localhost:3182/journey/environment?experience=project&task=java&pprofile=dev).
- A–E đã duyệt giữ nội dung, cây và đoạn trích cũ; E2 thêm nút **Tiếp tục: Java và IDE**. Tổng cộng 17 nhiệm vụ thực hành, tách khỏi 7 bước tự kiểm tra máy thật.

## Đường review ngắn

1. F1: mở `build.gradle`, chọn dòng 48; thử dòng khác để thấy phản hồi. F2: bảng đối chiếu Java 17 / toolchain 21 → chọn JDK 21.
2. F3: đồng bộ khi language còn 17 để thấy chỗ lệch → đổi language 21 → Đồng bộ trong bài. Nhánh mở thêm **IDE đỏ nhưng Gradle build được** tái hiện chênh lệch 17/21, giữ lịch sử build và file IDE hiện tại là hai loại bằng chứng riêng.
3. G1: mở kết nối PostgreSQL write → chọn dòng 33 → Đến service trong Compose → chọn dòng 80. Có thể đối chiếu thêm RabbitMQ dòng 52 → Compose dòng 8; Redis dòng 119 → Compose dòng 70.
4. G2: thử “Cài lại Docker CLI”, rồi chọn “Mở daemon trong bài”. G3: thử cách xử lý conflict khác, rồi chọn service cần thiết và đối chiếu quyền tái dùng. Redis/RabbitMQ vẫn chờ owner; Debezium vẫn Cần xác nhận.
5. H: chọn Command trong cây → Build root `clean assemble` trong bài → thấy `:workspaces:bootJar` lỗi → đổi task Command `bootJar` → build mô phỏng → chọn JAR xuất hiện trong `build/libs`.
6. I1: mở main class, chọn dòng 27 → thử không chỉ định profile để thấy datasource remote → chọn dev. Có thể chọn IntelliJ hoặc PowerShell làm nơi chạy của tình huống.
7. I2: Chạy thử trong bài học → chọn dòng profile và Started → Dừng mô phỏng. Log còn để đọc, trạng thái port chuyển sang không lắng nghe trong mô hình.
8. J1: chọn nơi xem log phù hợp → chọn nguyên nhân `Caused by` trong ví dụ lỗi → port 9901 → phân biệt build/process/HTTP/nghiệp vụ. Chọn “Hệ thống hoạt động đầy đủ” để thấy vì sao chưa đủ bằng chứng.
9. J2: xem tóm tắt lấy từ trạng thái học, mở lệnh đối chiếu máy thật rồi ghi nhận tóm tắt. Không có kết luận máy thật sẵn sàng.

Mỗi nhiệm vụ có Chỉ vị trí, Thử lại/Làm lại phần này, Quay lại, hướng dẫn tương ứng trên máy thật và bằng chứng mở thêm. Các thao tác sai có phản hồi ngắn, không có điểm thi. Graph vẫn mặc định đóng. Tab Source giữ file/dòng khi chuyển sang bảng cấu hình/kết quả.

## Đã đối chiếu những gì

Đọc lại source hiện tại, [bàn giao A–E](PROJECT-PRACTICE-HANDOFF.md) và báo cáo `D:/tmp/agent-service-workspaces-setup-evidence-report.md` ngày 04/11/2026. Bằng chứng lịch sử chính: S01/S04 (Java), S05–S08 (Docker), S09/S10 (build), S11/S13/S17 (run/log), S12 (IDE), §8/§13 (giới hạn kiểm tra).

| Nguồn hiện tại | Dữ liệu dùng trong bài |
|---|---|
| `build.gradle:37,48` và wrapper properties dòng 3 | Spring Boot áp cho subprojects; toolchain 21; Gradle 8.14.3 |
| `.idea/misc.xml:4`, `.idea/gradle.xml:8`, compiler bytecode target | File IDE hiện tại là 21; bảng 17/21 là tình huống theo S12, không là IDE đang đọc live |
| `application.yml` / `application-dev.yml:3,33,51–55,119` | Command port 9901; dev datasource localhost/`alpaca-event`; file gốc remote; RabbitMQ/Redis local trong source, vẫn có API ngoài |
| `docker-compose-env.yml:3–8,45–55,65–80` | Tên service/container và host:container port; Debezium Compose 8086→8083 khác instance riêng lịch sử 18086→8083 |
| `AgentCommandServiceApplication.java:25–27` | Main class và lời gọi `SpringApplication.run` |
| `ResourceServerConfiguration.java:19–24`, root build dòng 73 | Có Actuator dependency, rule `/actuator/**` permitAll; chưa đủ xác nhận endpoint/exposure/base path/override/runtime |
| Metadata boot JAR trong Command/build/libs | Artifact có sẵn trên disk, kích thước/mtime/revision; không mở/chạy JAR |

Dữ liệu bổ sung ở `src/content/setup/practice-runtime-source.json`: 9 đoạn trích có source root, path, SHA-256, revision, mtime và thời điểm trích `2026-11-05T13:19:36.631Z`. Workspace revision `af8d7f32fa5d3f5a380626679d30c4698960f33f`; repo Command `f0971ae41170c84bb883be92cd1ebd6632010302`.

Hai cấu hình được trích rộng hơn chỉ khi vào F–J, không thay đoạn trích A–E. URL/connection string/identities được che trước khi ghi JSON frontend; danh sách khóa/dòng được chọn có giới hạn. Tests đối chiếu hash và dòng nguyên văn không bị che với file thật, cùng ánh xạ connection → service → port.

## Mô phỏng và giới hạn

- Bảng Java/IDE, Docker daemon, kế hoạch dependency, build result, artifact xuất hiện, process/port và log đều là trạng thái học tập. UI ghi nhãn mô phỏng/tình huống; không đọc hoặc điều khiển máy/IDE/Docker.
- Root build failure dùng tóm tắt S09. Targeted build/boot logs không có raw transcript đầy đủ: chỉ hiển thị tóm tắt hoặc ví dụ log, không dựng timestamp/PID/stack trace lịch sử.
- Lệnh `Command:bootJar` là hướng dẫn được đối chiếu plugin và module, không là exact invocation S10. Lệnh `bootRun --args="--spring.profiles.active=dev"` đối chiếu S11/S17; chỉ hướng dẫn thực hiện sau khi xác nhận môi trường được phép.
- Run Configuration và lựa chọn profile trong bài chưa đủ kết luận cấu hình hiệu lực máy thật. Hướng dẫn mở thêm nêu Program arguments, VM options/system properties, environment variables, `spring.config.location/additional-location/import` và file cấu hình ngoài.
- Startup mô phỏng thành công giả định dependency đáp ứng trong tình huống; không biến container có sẵn hoặc port mở thành dependency đã được kiểm chứng. Khi process đang chạy trong bài, dừng trước khi sửa Run Configuration.
- Debezium: payload/instance/network/broker/slot/topic/owner cần xác nhận. Chỉ nêu vị trí Compose và `docker/cdc-config/connector_request.json`; không sinh payload, lệnh tạo instance hoặc xóa container/volume.
- Chưa cung cấp endpoint để gọi: có rule auth trong source nhưng thiếu xác nhận exposure/base path/override và response. UI cho xem source auth, giữ HTTP là Cần xác nhận, không gửi request Java.
- Nghiệp vụ cần input/expected result và phép kiểm thử riêng. Không mở rộng phân tích Policy hoặc triển khai Claim.

## Ngữ cảnh và tiến độ

Giữ namespace `backend-learning-workshop.project-practice.v1`, version 1. Đọc dữ liệu cũ với mặc định cho các trường mới; không xóa các nhiệm vụ A–E đã hoàn thành. `setup-checklist.v1` và tiến độ Policy/Claim vẫn độc lập.

URL giữ task/file/dòng/module/profile/nhánh mở, tab `pview` và snapshot mô phỏng `psim` (chỉ serialize phần khác mặc định). URL được ưu tiên hơn bộ nhớ; link sai được chuẩn hóa. Back/Forward khôi phục snapshot tương ứng, không lấy trạng thái ở tương lai. Mỗi nhiệm vụ nhớ vị trí riêng; khi tiếp tục sang nhiệm vụ mới, mang theo lựa chọn và trạng thái học đang có.

Thanh 7 bước và graph giữ chế độ project/guide đang dùng. Trong project, quay lại một phần nhớ nhiệm vụ đã xem; Tiếp tục bước đang làm mở ngữ cảnh thực hành hiện tại. Hướng dẫn trên máy thật vẫn mở được ở mọi phần. Làm lại H bỏ JAR mô phỏng khỏi cây; làm lại I bỏ process/log quan sát trong bài; không sửa file thật hoặc checklist. Thử lại giữ các lựa chọn cần để sửa tình huống.

## Kiểm tra bàn giao

- `npm.cmd run build`: pass, gồm `tsc --noEmit`. Vite còn cảnh báo chunk chính trên 500 kB; không thêm/nâng dependency.
- `npm.cmd run test:browser`: vòng cuối **38/38 pass, 1.5 phút**, gồm regression 8 test A–E, 6 test A–J/F–J và toàn bộ hướng dẫn/graph/Policy/Claim. Log UTF-8: `.verification/runtime-browser-final.log`; tổng hợp: `.verification/runtime-validation.json`.
- Luồng A→J được kiểm tra từ workspace ban đầu tới 17/17 nhiệm vụ thực hành; checklist máy thật vẫn không tự tick. Chọn sai/đúng, IDE diagnosis, PowerShell/IntelliJ, root/module build, artifact reset, run/stop, bốn mức bằng chứng, retry/reset, storage cũ, deep link, Back/Forward/reload và mobile 390px đều được kiểm tra.
- Luồng đầy đủ bắt page errors và request ra ngoài origin frontend: không có. Đây là kiểm tra UI, không chứng minh BE đã build/chạy.
- `npm.cmd run verify:originals`: Product 44 file, Workshop 1937 file; 0 file đổi, working-tree status giữ nguyên.
- Java root + 10 repo con: git status chỉ đọc đều sạch; chi tiết `.verification/runtime-java-status.json`. Không chỉnh Git config, JDK, IDE, chạy setup/Gradle/Java/Docker/DB/migration, commit/push/deploy.
- Cổng 3182 tiếp tục phục vụ ứng dụng học; HTTP frontend trả 200 khi bàn giao.

Một vòng trước có 1 lần trang trắng khi tải bài hướng dẫn build cũ; chưa đủ dữ liệu quy nguyên nhân. Kiểm tra riêng sau đó và toàn bộ vòng cuối đều pass; không thay assertion hoặc bật retry để bỏ qua lỗi này.

## Ảnh trạng thái

- Java trước/sau: 17 lệch yêu cầu (artifact cục bộ: `../.verification/runtime-f-before.png`), JDK 21 (artifact cục bộ: `../.verification/runtime-f-java.png`), IDE đã đồng bộ trong bài (artifact cục bộ: `../.verification/runtime-f-ide.png`).
- Dependency: kết nối → Compose (artifact cục bộ: `../.verification/runtime-g-connections.png`), kế hoạch sau conflict (artifact cục bộ: `../.verification/runtime-g-conflict.png`).
- Build: root lỗi (artifact cục bộ: `../.verification/runtime-h-root-error.png`), boot JAR trong cây (artifact cục bộ: `../.verification/runtime-h-artifact.png`).
- Run: đang chạy trong bài (artifact cục bộ: `../.verification/runtime-i-running.png`), đã dừng trong bài (artifact cục bộ: `../.verification/runtime-i-stopped.png`).
- Kiểm tra: bốn mức bằng chứng (artifact cục bộ: `../.verification/runtime-j-levels.png`), tóm tắt (artifact cục bộ: `../.verification/runtime-j-summary.png`), mobile (artifact cục bộ: `../.verification/runtime-mobile.png`).

Ảnh là UI học tập, không là ảnh xác nhận môi trường hoặc runtime Java thật.
