# Mốc Workshop — Hiểu và chạy dự án

Điểm dừng: lưu phiên bản **Hiểu và chạy dự án** hiện tại trước khi chuyển sang **Khám phá Policy** ở lượt tiếp theo. Chưa bắt đầu phát triển tính năng mới trong lượt tạo mốc này.

Repo: `https://github.com/nguyentri2815/backend-learning-workshop.git`, nhánh `main`. Message của commit mốc: `Complete project setup and startup log workshop`.

## Nội dung trong mốc

- Hành trình thực hành dự án hiện có: source, cấu hình, phụ thuộc, Docker, build, Run/Stop và đọc kết quả.
- **I2 — Tập đọc log thật**: console dùng chung, tìm kiếm trong dòng thu gọn, gợi ý, giải thích giới hạn bằng chứng, vị trí câu học và luồng chẩn đoán được giữ riêng.
- **Lần đường kết nối Redis**: chuỗi bean → client/binding → YAML/Run Configuration → đường local hoặc từ xa → kiểm tra và chạy lại có nhãn Giả lập → quay lại câu đang học.
- **Lần đường kết nối PostgreSQL**: ví dụ repository/JPA/Hikari/PostgreSQL đã đối chiếu, nguồn cấu hình, placeholder môi trường, cổng host/container, đích local/từ xa và quay lại đúng câu.
- **Phiên 07/11/default**: PostgreSQL đã mở kết nối, JPA khởi tạo; chưa biết host/port DB từ log. Startup dừng ở Redis.
- **Phiên 08/11/dev — PostgreSQL từ chối kết nối**: bốn câu đọc L114, L182/L377, chuỗi Caused by từ L3377, và L4939. Đích đã thử là localhost:5432; startup dừng ở DB. Bối cảnh người chạy đã chủ động tắt Docker được ghi riêng ngoài bằng chứng từ log.
- Bảng đối chiếu hai phiên, test cho các nhánh đọc log và tài liệu hướng dẫn review đã được đưa vào repo. Không thiếu nhánh Redis/PostgreSQL hoặc phiên dev 08/11 trong mốc này.

## Nguồn và giới hạn

Các snapshot mới dùng trong bài là `real-log-practice-source.json`, `redis-route-source.json`, `postgres-route-source.json` và `postgres-failure-log-source.json` trong `src/content/setup/`. Trích đoạn giữ số dòng/hash nguồn và đã che thông tin nhạy cảm. File log thô, credential, output build, trace và artifact kiểm tra cục bộ không thuộc commit.

Các công cụ `extract-*` chỉ phục vụ nhập snapshot khi được chỉ định nguồn. Lượt tạo mốc không chạy chúng, không đọc/ghi repo Java `agent-system`, không chạy Java, Gradle, Docker, PostgreSQL, Redis hay API backend. Test mặc định loại các test `@source` cần repo ngoài.

Ví dụ kiểm tra hoặc chạy lại giả lập không xác nhận trạng thái máy thật. Địa chỉ đầy đủ, nguồn override cuối cùng và kết quả nghiệp vụ cần bằng chứng riêng theo từng phiên; không lấy kết quả của phiên này thay cho phiên khác.

## Review và kiểm tra

[Mở I2 — Tập đọc log thật](http://localhost:3182/journey/environment?experience=project&task=startup&readlog=1).

- 07/11: câu 5/14 → L183 → nhánh PostgreSQL → cấu hình và đường kết nối → quay lại 5/14. L3432/L3469 mở nhánh Redis.
- 08/11: chọn **08/11 · dev · PostgreSQL từ chối kết nối** → L114 → L182/L377 → L3377 và tìm Caused by → mở nhánh PostgreSQL → quay lại đúng câu → L4939 → đối chiếu hai phiên.

Các lệnh kiểm tra mốc:

```powershell
npm.cmd run verify:fixtures
npm.cmd run build
$env:WORKSHOP_VERIFY_SOURCES = '0'
$env:WORKSHOP_BROWSER_CHANNEL = 'chrome'
npm.cmd run test:browser
git diff --check
```

Tài liệu các lượt triển khai trước giữ kết quả lịch sử riêng; trạng thái của mốc này được ghi trong phần bàn giao commit/push. Các báo cáo máy tác giả dưới `.verification/` không phải dependency hoặc nội dung được đưa vào Git.

## Kết quả kiểm chứng mốc

- Fixture: 26/26 snapshot đạt; TypeScript và build production đạt; `git diff --cached --check` đạt.
- Lượt mặc định trên dev server: 162/170 test đạt ngay, tám ca cũ không đạt ở Run/Retry, G1, đối chiếu source, A–E và mobile. Không coi lượt này là xanh hoàn toàn.
- Chạy lại đúng tám ca với giới hạn 60 giây/ca: bảy ca đạt. Ca đối chiếu source trong viewport vẫn lỗi trên dev server, sau đó đạt hai lần liên tiếp trên bản build production; không sửa mã chức năng để bỏ qua lỗi.
- Xuất riêng snapshot Git index bên trong repo để tránh ảnh hưởng từ các thay đổi local đang tiếp diễn. Snapshot đạt fixture/build; toàn bộ 22 file build trùng byte với bản production đã đối chiếu. Trên snapshot này, 24/24 test liên quan trực tiếp (bài đọc log, chẩn đoán, Redis, PostgreSQL, phiên dev 08/11 và ca viewport) đạt, không retry và không flaky.
- Rà 34 file đưa vào commit: không phát hiện credential, địa chỉ nội bộ hoặc email thật cần loại bỏ; không có log thô, output build, trace hoặc artifact kiểm tra trong Git index.

Trong lúc kiểm chứng, working tree xuất hiện thêm bản nháp Policy ngoài danh sách đã chốt. Các thay đổi đó được giữ nguyên, không đưa vào commit mốc này. Vì vậy trạng thái working tree khi bàn giao có thể còn thay đổi Policy; đây không phải phần đã phát triển hoặc công bố trong mốc **Hiểu và chạy dự án**.
