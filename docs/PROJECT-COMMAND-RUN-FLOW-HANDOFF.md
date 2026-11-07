# I1–I2–J1: từ cấu hình đến kiểm tra local

URL đầu luồng: http://localhost:3182/journey/environment?experience=project&task=run-config&step=run&pview=activity

URL dùng phiên đã lưu, không ép reset. Bản trước sửa được lưu trong `.verification/run-end-to-end-before/`, kèm hash; không reset/revert thay đổi cũ.

## Review trong vài phút

1. I1: chọn **Bấm Run trong IntelliJ**, mở main class và tam giác cạnh `main`. Mở Run Configuration; kiểm tra Main/module/Java 21. Thử không đặt dev rồi dev; xem `spring.datasource.url` hoặc `server.port` trong hai file đặt cạnh nhau. Apply → OK chỉ lưu thiết lập.
2. I2: bấm tam giác cạnh main hoặc Run trên thanh công cụ. Nếu còn thiếu điều kiện, bài chỉ đúng I1/F2/F3/G2; không tự bật dịch vụ. Có thể chọn kịch bản giả định được ghi rõ. Quan sát profile → port 9901 → Started. Không cần đóng gói JAR.
3. J1: đọc ba dòng của cùng lần chạy, mở Terminal kiểm tra process/port rồi bấm Enter trong bài. Thử request health mô phỏng; Stop cập nhật port và giữ nhãn log/HTTP cũ. Run lại tăng số lần chạy và xóa kết quả kiểm tra của lần cũ.
4. Đường Terminal: quay I1, chọn **Chạy bằng Terminal**, mở tab Terminal tại root. Chọn dev, xem/sao chép lệnh rồi **Dùng lệnh này**. Sang I2, Enter trong terminal mô phỏng. Không cần hoàn thành nhánh IntelliJ.
5. Nhánh lỗi: ở I2 mở **Thử tình huống khởi động lỗi**, chạy với port bị chiếm. Dòng lỗi nêu port/nguyên nhân; **Sửa trong bài học và chạy lại** giải phóng port của tình huống minh họa và tạo lần chạy mới. Không đổi dependency. J1 còn giữ ví dụ lỗi PostgreSQL dẫn về G1/G2.

Lệnh đã đối chiếu module/plugin Gradle; đây là lệnh hướng dẫn, không phải khẳng định về lịch sử agent:

```powershell
.\gradlew.bat :workspaces:agent-service:1-agent-command-service:bootRun --args="--spring.profiles.active=dev"
```

## Cấu hình và HTTP

`application.yml:3` và `application-dev.yml:3` cùng đặt port 9901. Datasource nền trỏ remote đã che; dev dùng `${DOCKER_HOST_IP:localhost}` với DB `alpaca-event` (địa chỉ đầy đủ/secrets không đưa vào bài). dev không làm mọi kết nối thành local. Nguồn cấu hình dự kiến chỉ xét hai file; env, VM/program arguments và file ngoài có thể ghi đè. Không đặt dev không chứng minh không có profile khác. Tên Run Configuration không xác nhận profile active; log của lần chạy cung cấp dấu hiệu này trong tình huống học.

Đã khảo sát Controller, Security, resources Command và shared-webmvc/shared-auth. `InternalGlobalConfigController.findByKey` là GET nhưng cần key/dữ liệu DB, không dùng làm probe. Health được chọn vì dependency Actuator ở root `build.gradle:73`, Security `securityFilterChain:19` permit `/actuator/**`, và shared `LogApiInterceptor.isHealthCheckRequest:46` nhận diện health. Không tìm thấy khai báo đổi context path, management port/base path/exposure trong phạm vi source đã khảo sát.

**Suy luận có điều kiện:** kết hợp source với mặc định Spring Boot 3.5, request là `GET http://localhost:9901/actuator/health`, header `Accept: application/json`, không token/query/body khi giữ rule mặc định. [Exposure](https://docs.spring.io/spring-boot/3.5/reference/actuator/endpoints.html), [path/port](https://docs.spring.io/spring-boot/3.5/reference/actuator/monitoring.html), [health contract](https://docs.spring.io/spring-boot/3.5/api/rest/actuator/health.html) được đối chiếu theo phiên bản 3.5.16. Không xác nhận override hoặc HTTP trên máy thật.

Người học chủ động chọn tình huống health UP mới thấy `200 {"status":"UP"}` mô phỏng. Không suy health UP từ Started, không đánh dấu mọi dependency/API/nghiệp vụ thành công. Có thể xem 503/DOWN, hoặc 401/403/404 trong tình huống cấu hình auth/path khác; giải thích rằng các mã đó không đồng nghĩa ứng dụng chưa chạy.

Bằng chứng có SHA-256 ở `src/content/setup/command-run-source.json`; script `node scripts/extract-command-run.mjs` chỉ đọc repo Java và tạo dữ liệu đã che trong ứng dụng học. Không dùng phân tích INSURTECH để suy ra agent-system.

## Ảnh

Ảnh toàn trang, chụp thao tác thật trên ứng dụng học:

1. Chọn cách Run (artifact cục bộ: `../.verification/run-flow-01-method.png`)
2. Đối chiếu cấu hình (artifact cục bộ: `../.verification/run-flow-02-configuration.png`)
3. Startup thành công (artifact cục bộ: `../.verification/run-flow-03-started.png`)
4. Kiểm tra local (artifact cục bộ: `../.verification/run-flow-04-local.png`)

Chụp lại bằng `node scripts/capture-command-run.mjs`. Snapshot trong script chỉ chuẩn bị trạng thái mô phỏng; không chạy Java/Docker/DB/API.

## Phạm vi và kiểm tra

Giữ cây dùng chung (nowrap, ellipsis, tooltip, giới hạn thụt lề, resize), deep link, Back/Forward và tiến độ cũ. Không đổi giao diện Java/IDE, Docker, dependency, Build hay Policy/Claim. Reset I1 chỉ thiết lập; reset I2 chỉ lần chạy; reset J1 chỉ thao tác kiểm tra. Source/JAR/container và tiến độ phần khác được giữ.

Kiểm tra: `npm.cmd run build` gồm typecheck; `npx.cmd playwright test` gồm các đường mới và regression; `npm.cmd run verify:originals` đối chiếu Quotation gốc. Git status agent-system và repo con agent-service giữ nguyên. Không thêm dependency, chạy dịch vụ thật, sửa repo Java/Quotation, commit/push/deploy.

Kết quả: lượt toàn bộ 106 bài có 102 qua; ba bài cần cập nhật nội dung/selector theo luồng mới, một bài mobile gặp trang trắng tạm thời. Sau điều chỉnh, chạy lại năm suite liên quan: **37/37 qua**, bao gồm cả bốn bài đó và hai bài mới kiểm tra tam giác bám dòng main khi cuộn/resize ở desktop/mobile. Các suite ngoài phạm vi đã qua ở lượt toàn bộ; không sửa giao diện của các phần đó. Tổng bộ kiểm tra hiện có 108 bài. `verify:originals` xác nhận 44 file quotation-product và 1.937 file quotation-workshop không đổi.
