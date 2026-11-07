# I1 — Thiết lập cách chạy Command

URL: http://localhost:3182/journey/environment?experience=project&step=run&task=run-config&pview=activity

URL giữ phiên đã lưu, không ép reset bằng snapshot. I1 chỉ chuẩn bị cách chạy; I2 giữ thao tác Run/Stop như trước.

## Luồng thực hành

Mở AgentCommandServiceApplication → đọc main() và SpringApplication.run(...) được highlight → Run → Edit Configurations… → kiểm tra main class/module Command → chọn dev → Apply → OK → Chạy và dừng. Mở source hoặc chọn dòng không hoàn thành cấu hình và không khởi động process. Bản nháp profile được giữ riêng; chỉ OK sau Apply mới ghi nhận thiết lập và đánh dấu I1 hoàn tất.

Main class và Run Configuration có hai nhãn giải thích riêng. Sau khi lưu, tóm tắt ứng dụng Command, main class, profile dev và “Đã thiết lập, chưa chạy”. Khi quay lại từ I2, trạng thái phản ánh process đang chạy/đã dừng, không báo sai là chưa chạy. Các trường phụ và giới hạn cấu hình nằm trong mục mở thêm; không khẳng định dev làm mọi kết nối local.

## Cây project

Chỉ I1 dùng layout resize từ thư viện react-resizable-panels đã có. Kéo thanh giữa hoặc dùng bàn phím; chiều rộng lưu trên trình duyệt. Tên folder/file giữ một dòng, ellipsis và tooltip đầy đủ, không giảm font; thụt lề nhỏ hơn và cuộn ngang khi panel hẹp. Main class tự mở nhánh, cuộn nội bộ cây và highlight. Breadcrumb giữ đầy đủ đường dẫn và có cuộn ngang. Tên JAR trong build/libs dùng cùng quy tắc.

## Căn cứ

Giữ source main class đã trích từ agent-system, dòng 26–28, cùng cấu hình application.yml/application-dev.yml và giới hạn override hiện có. [JetBrains: Spring Boot Run Configuration](https://www.jetbrains.com/help/idea/run-debug-configuration-spring-boot.html) xác nhận Run → Edit Configurations…, Main class và Active profiles. [JetBrains: Run/debug configurations](https://www.jetbrains.com/help/idea/run-debug-configuration.html) phân biệt lưu bằng OK với chạy bằng Run. Cửa sổ là bản mô phỏng có giá trị điền sẵn trong bài, không xác nhận Run Configuration thật đã tồn tại trên máy người học.

## Ảnh

- Cây project và main class (artifact cục bộ: `../.verification/run-config-01-tree-main.png`).
- Cửa sổ thiết lập chạy (artifact cục bộ: `../.verification/run-config-02-configuration.png`).
- Tóm tắt sau khi lưu (artifact cục bộ: `../.verification/run-config-03-saved.png`).

Chụp lại: `node scripts/capture-run-configuration.mjs`, ứng dụng học tại cổng 3182. Snapshot ảnh có JAR mô phỏng để kiểm tra cây; không build Java.

## Kiểm tra và phạm vi

`npm.cmd run build` bao gồm typecheck. Các bộ kiểm tra liên quan: run-configuration, execution-practice, runtime-practice, project-practice và workshop (38 test), gồm cây/main/JAR, resize chuột/bàn phím, draft/Apply/OK, Back/Forward, deep link ở cửa sổ mới, reload, mobile, I1 → I2 và Policy/Claim. Một lần chạy trùng thư mục trace đã gặp ENOENT ở bước dọn dẹp; kiểm tra cuối được chạy tuần tự.

Ứng dụng học không có `.git`; bản trước sửa lưu tại `.verification/run-config-before/`, kèm hash để đối chiếu phạm vi. Chỉ sửa ứng dụng học và kiểm tra/capture liên quan. Không thêm dependency, chạy Java/Docker/DB, sửa repo Java/Quotation gốc hoặc commit/push/deploy. Git status agent-system và repo con agent-service không đổi.
