# I2, J1, J2 — thực hành chạy Command

> Phần I1–I2–J1 đã được cập nhật tiếp trong [bàn giao luồng Run](PROJECT-COMMAND-RUN-FLOW-HANDOFF.md), gồm Terminal thực hành, đối chiếu cấu hình và contract health có điều kiện. Mô tả thiếu endpoint bên dưới ghi nhận phiên bản trước.

## URL

- I2: http://localhost:3182/journey/environment?experience=project&task=startup&step=run&pview=activity
- J1: http://localhost:3182/journey/environment?experience=project&task=verify&step=ready&pview=activity
- J2: http://localhost:3182/journey/environment?experience=project&task=summary&step=ready&pview=activity

Các URL giữ phiên đã lưu, không ép snapshot/reset. Nếu mở thẳng I2 khi chưa chuẩn bị I1/G2, bài chỉ rõ điều kiện thiếu và liên kết về đúng bước. Có kịch bản thành công được gắn nhãn giả định; kịch bản không sửa SDK/JDK, Run Configuration, container hay readiness.

## Hành vi

- I2 dùng cấu hình Command/profile đã lưu ở I1. Run nằm trên thanh IDE; cửa sổ Run mở và lần lượt thêm/highlight profile, port, Started. Stop nằm trong cửa sổ Run, dừng cả giai đoạn khởi động, giữ source/JAR/container và log đã có. Không yêu cầu đóng gói JAR. Với IntelliJ, điều kiện Java của bài dùng Project SDK; Terminal dùng JDK Terminal.
- J1 đọc cùng phiên chạy, có số phiên và trạng thái process hiện tại. Sau Stop, log được giữ để đọc nhưng không báo process/port vẫn đang chạy. Người học chọn profile, port và Started; phần kiểm tra port là hướng dẫn mở thêm. Ví dụ lỗi kết nối được ghi rõ là ví dụ, không thay đổi trạng thái phiên thật của bài; liên kết về G1/G2. Chưa có endpoint/auth được xác minh nên dừng ở mục “Cần xác nhận để kiểm tra API”, không tạo request/response hoặc kết luận nghiệp vụ.
- J2 là thẻ ngắn: module, cách chạy/profile, nơi xem log, Stop/Run lại và điều kiện/API cần xác nhận. Nút mở đúng bước/source hoặc mục API trong J1. Có vòng mở cấu hình → Run → xem log → Stop và ghi nhận **Đã thực hành**. Nếu Command còn chạy, cần Stop trước khi mở lại cấu hình; không tự dừng ứng dụng. Không ghi máy thật sẵn sàng.
- Bảng trạng thái chuyển vào **Xem trạng thái hiện tại**, mặc định đóng. Nội dung phụ khảo sát/conflict đã lưu cũng nằm trong mục này, không chắn thao tác chính. I2/J1/J2 có chỉ dẫn hiện tại, Chỉ vị trí, Quay lại, Làm lại phần này; reset chỉ xóa tiến độ của phần đang làm, không reset Docker/build/I1 hoặc các phần khác.

## Cây dùng chung

Sửa trực tiếp PracticeTree/project-practice.css: mọi tên folder/file một dòng, ellipsis và tooltip đường dẫn; font 14px được giữ. Thụt lề tối đa 5 mức, panel hẹp cuộn ngang. Bỏ quy tắc riêng từng bước có thể làm JAR xuống dòng hoặc giảm chữ. I1/I2/J1/J2 tự mở đúng nhánh main khi đã chọn, cuộn nội bộ cây để nhìn thấy file; chỉ mở nhánh cần thiết. Layout resize hiện có được dùng cho các bước cuối. Source mở từ J2 hiện sau vùng thực hành.

## Căn cứ và ảnh

[JetBrains Run tool window](https://www.jetbrains.com/help/idea/run-tool-window.html) xác nhận cửa sổ output theo Run Configuration và Stop tại thanh công cụ của cửa sổ Run. Tên class, port 9901, profile và giới hạn endpoint giữ từ source đã trích của agent-system. Log mới là đầu ra của mô phỏng, không là stdout Java hay lịch sử được tái hiện nguyên văn.

1. I2 trước Run (artifact cục bộ: `../.verification/command-01-before-run.png`).
2. Command đang chạy, có log (artifact cục bộ: `../.verification/command-02-running.png`).
3. J1 kiểm tra kết quả (artifact cục bộ: `../.verification/command-03-verification.png`).
4. J2 thẻ bắt đầu task (artifact cục bộ: `../.verification/command-04-task-start.png`).

Chụp lại bằng `node scripts/capture-command-runtime.mjs` khi ứng dụng học ở cổng 3182. Snapshot ảnh chỉ chuẩn bị điều kiện bài học; không chạy Java/Docker/DB/API.

## Kiểm tra và phạm vi

`npm.cmd run build` gồm typecheck. Các kiểm tra bao gồm luồng I1 → I2 → J1 → J2, log theo tiến trình, Stop khi đang khởi động, thiếu điều kiện/kịch bản giả định, reset từng phần, vòng thực hành lại, trạng thái stopped, Back/Forward, deep link ở cửa sổ mới, phiên đã lưu, cây/JAR ở desktop/mobile và các phần đã duyệt. Toàn bộ bộ kiểm tra browser hiện có 101 test. Các selector của giao diện cũ được cập nhật theo luồng đã chốt; kiểm tra không chạy song song vào cùng thư mục trace.

Ứng dụng học không có `.git`; bản trước sửa giữ tại `.verification/runtime-final-before/`, kèm hash để kiểm tra phạm vi. Không reset/revert hàng loạt. Build và Run Configuration giữ luồng đã duyệt; chỉ cách hiển thị cây được dùng chung. Không thêm dependency, sửa repo gốc hoặc commit/push/deploy. Git status agent-system và repo con agent-service giữ nguyên.
