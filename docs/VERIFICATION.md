# Kết quả kiểm tra bản tổng thể — 04/11/2026

> Bản UX môi trường 05/11/2026: **24/24 browser tests đạt** (54,0 giây), gồm accordion/tick độc lập/Back-Forward/graph/mobile và hồi quy Policy/Claim. Build/typecheck đạt. Hai repo gốc: 44 + 1.937 file, 0 thay đổi. Xem [chi tiết và ảnh bàn giao](PROJECT-SETUP-BEGINNER-UX.md). Phần bên dưới lưu kết quả phiên bản cũ.

Ứng dụng local: **http://localhost:3182/**. Kiểm tra trên Windows, Node 24.5.0, npm 11.5.1, Chrome. Server được giữ chạy cho người dùng review.

| Kiểm tra | Kết quả |
| --- | --- |
| `npm.cmd run typecheck` | Đạt; cũng được chạy trong build cuối |
| `npm.cmd run build` | Đạt; bundle chính 388,18 kB (gzip 123,17 kB), CodeBlock/Shiki tải khi mở source |
| `npm.cmd run test:browser` | **8/8 đạt**, lượt cuối 41,3 giây |
| HTTP trang tổng quan | 200 |
| Dependency lockfile | 105 mục được giữ; 0 khác biệt phiên bản so với vị trí tương ứng trong lockfile Workshop |
| `npm.cmd run verify:originals` | Product: 44 file, 0 thay đổi; Workshop: 1.937 file, 0 thay đổi; working-tree status giữ nguyên |

Phạm vi hash đối chiếu loại trừ build/cache, node_modules, .git, .env* và artifact .verification; xem [REUSE.md](REUSE.md). Snapshot/checkpoint và practice ngoài các thư mục loại trừ được đối chiếu. Product vẫn sạch; các thay đổi local có sẵn trong Workshop vẫn được giữ.

8 ca Chrome kiểm tra:

1. Tổng quan có ba hành trình, trạng thái Java chưa khảo sát và provenance hai repo FE.
2. Form Policy: validation/focus, loading, lỗi giả lập/thử lại, tạo/đọc từ bộ nhớ, reload về trạng thái chưa có dữ liệu. Không phát sinh fetch/XHR nghiệp vụ trong hành trình.
3. URL mở sâu tới bước/file/Diff, highlight Shiki, Before/After, tham chiếu và quay lại sau reload, Back/Forward.
4. Giữ lựa chọn khi đổi chế độ/hành trình; chọn bước trên flow đồng bộ source và inspector; ghi chú đúng bước.
5. Tiến độ và ghi chú qua reload; reset chỉ xóa dữ liệu học của ứng dụng mới. Các khóa sentinel mang tên hai ứng dụng gốc trong origin kiểm thử không bị thay đổi.
6. Resize source/inspector bằng chuột và bàn phím; giữ URL, nội dung và độ rộng sau reload.
7. Mobile 390 × 844: mở điều hướng, chuyển hành trình, source viewer, trạng thái Before rỗng và chuyển After; không tràn ngang.
8. Liên kết bước/file chưa tồn tại, localStorage JSON lỗi và trang không tồn tại đều có fallback.

Đã xem ảnh tổng quan và source desktop; ảnh source mobile thể hiện bố cục dọc và code có thể đọc. Các ảnh được tạo lại bởi test nằm tại `test-results/overview-desktop.png`, `claims-source-desktop.png`, `overview-mobile.png`, `environment-mobile.png`.

Các kiểm tra này xác minh ứng dụng học FE và tương tác minh họa. Không có kiểm tra Java, endpoint, nghiệp vụ bảo hiểm hoặc database. Không commit/push/deploy. Dừng ở bản tổng thể để review.
