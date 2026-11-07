# G2 → I2: điều kiện Run và tiến độ đọc log

I2: http://localhost:3182/journey/environment?experience=project&task=startup&step=run&pview=activity

`readyEvidence` ghi nhận thao tác đọc log G2. Đã bỏ cờ này khỏi điều kiện bắt đầu/tiếp diễn startup, hàm Run cũ và nút Tiếp tục G2. Không xóa tiến độ đã đọc hoặc tiến độ phần khác.

Các điều kiện kỹ thuật đang được mô hình hóa vẫn được kiểm tra: cấu hình Command/profile, Java 21 của đúng cách chạy (Project SDK hoặc JDK Terminal), Docker Engine và container postgres-write. I2 nêu đúng trạng thái thiếu, kèm nút xử lý: bật Engine trong bài, Start postgres-write đã tạo, hoặc mở đúng I1/F2/F3/G2 để chuẩn bị. Container chưa tạo hoặc bị xung đột port được đưa về đúng service ở G2; không tự tạo hoặc bật dịch vụ khác.

Kiểm tra trước Run chưa qua được ghi là **Chưa khởi động Command**; không giả làm lỗi Java startup. Lỗi khởi động minh họa do port bị chiếm vẫn có trạng thái riêng. Running không tự xác nhận readiness, credential/schema hay kết nối Java; các giả định của tình huống startup và giới hạn kiểm chứng máy thật vẫn được giữ.

Kiểm tra hồi quy mới trong `tests/browser/command-service-gate.spec.ts`: Start cả 5 container ở G2, không đọc log, chuyển I2 và Run bằng IntelliJ/Terminal; nút Tiếp tục G2; khôi phục link từng bị chặn; các nút xử lý điều kiện thiếu và bảo toàn service/JAR/tiến độ. Không chạy Java/Docker/DB/API thật. Bản trước sửa ở `.verification/run-gate-before/`.

Kết quả: lượt kiểm tra luồng Run 20/20 qua; sau thay đổi điều kiện Tiếp tục G2, lượt regression G2/Run/Build/IDE liên quan 37/37 qua. `npm.cmd run build` (gồm typecheck) qua; `verify:originals` xác nhận Quotation gốc không đổi, git status agent-system và agent-service vẫn sạch.
