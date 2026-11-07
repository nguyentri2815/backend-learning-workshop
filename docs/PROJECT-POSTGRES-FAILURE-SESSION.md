# I2 — Phiên 08/11 · dev · PostgreSQL từ chối kết nối

[Mở I2 — Tập đọc log thật](http://localhost:3182/journey/environment?experience=project&task=startup&readlog=1), rồi chọn **08/11 · dev · PostgreSQL từ chối kết nối**.

## Đường review

1. Câu 1/4: nhập `L114` vào tìm kiếm hoặc dùng **Gợi ý tìm dòng**, rồi bấm dòng L114 để xác nhận `dev` active. Bấm **Tiếp tục bài học**.
2. Câu 2/4: chọn L182 để xem vì sao `Starting...` chưa chứng minh kết nối thành công. Tìm/chọn L377 để xác nhận đích `localhost:5432` và kết nối bị từ chối trước xác thực.
3. Câu 3/4: chọn L3377; tìm `Caused by:`. Dùng **Kết quả sau** để đọc một bean Eventuate (ví dụ L3399), `entityManagerFactory` (L4083), lỗi JDBC (L4375), PostgreSQL refused (L4547). Các dòng trùng lặp trong cùng log vẫn giữ số dòng gốc. Gợi ý dẫn tới nhóm bằng chứng còn thiếu; tìm kiếm/gợi ý chỉ mở dòng, cần bấm dòng để ghi nhận.
4. Mở **Lần đường kết nối PostgreSQL** cạnh L377 hoặc trong giải thích L377/L4547. Xem đích thật `localhost:5432`, **Lần về cấu hình DB**, key URL trong `application-dev.yml`, vị trí kiểm tra nguồn ghi đè ở Run Configuration. **Phân biệt DB local với DB từ xa** → kiểm tra cổng trên máy chạy Command → nếu DB của bài chạy bằng Docker, đối chiếu service `postgres-write` và Ports. Các ví dụ đổi mapping/hostname có nhãn **Giả lập**, không thay đổi đích đã ghi ở L377.
5. Quay lại bằng nút đầu nhánh hoặc hoàn tất câu áp dụng: vẫn ở câu 3/4, giữ bằng chứng đã chọn và nội dung tìm kiếm trong phiên trang. Tiếp tục câu 4/4, chọn L4939 rồi **Đối chiếu hai phiên**.

## Bằng chứng

Nguồn là `log-2.txt`, phiên 08/11/2026 00:04. Snapshot `src/content/setup/postgres-failure-log-source.json` trích 101 dòng trong 4950 dòng gốc. SHA-256 file gốc: `2ce3bad902def90a90319d003c45c3660c7f39714bbabf59ea17bee92bf3a961`. Đã che đường dẫn, tên người dùng, PID, email và địa chỉ ngoài phạm vi; giữ `localhost:5432` để học đối chiếu.

| Dòng | Kết luận được hỗ trợ |
|---|---|
| L112 | Java đã bắt đầu chạy Command. |
| L114 | Profile `dev` active. |
| L182 | Hikari bắt đầu khởi tạo; chưa xác nhận đã mở kết nối. |
| L377 | Đích đã thử `localhost:5432`, kết nối tới cổng bị từ chối trước xác thực. |
| L3377 trở xuống | Bean Eventuate → transaction/JPA → `entityManagerFactory` → lỗi mở JDBC connection → PostgreSQL refused → ConnectException. |
| L4936–4939, L4949 | Tác vụ Gradle chạy `main()` thất bại khi Java thoát mã 1; Gradle báo BUILD FAILED. Dòng này không tự chứng minh lỗi biên dịch. |

**Bối cảnh do người chạy cung cấp:** đã chủ động tắt Docker khi thử. Ghi chú này nằm riêng ngoài các dòng log. `Connection refused` tự nó chỉ xác nhận cổng bị từ chối; không tự chứng minh Docker đang tắt hoặc dịch vụ nằm trong Docker.

Log xác nhận host/port đã thử nhưng chưa cho đầy đủ JDBC URL, tên database hay nguồn override cuối cùng. Đích khớp fallback trong YAML chưa chứng minh URL cuối cùng đến từ file. Cần đối chiếu `SPRING_DATASOURCE_URL`, `DOCKER_HOST_IP`, profile, Program arguments, VM options và cấu hình ngoài của đúng lần Run.

Cuối bài đối chiếu 07/11/default (PostgreSQL đã kết nối, chưa biết host/port từ log, dừng ở Redis) với 08/11/dev (PostgreSQL `localhost:5432` refused, dừng ở DB).

## Trạng thái và kiểm tra

Phiên mới có con trỏ `postgresStep` và bằng chứng `postgresEvidence` riêng trong `real-log-reading.v1`; trạng thái nhánh PostgreSQL của 08/11 lưu tại `postgres-route.08-11.v1`, tách với nhánh 07/11. Đọc lại phiên cũ giữ số câu; reload giữ số câu/bằng chứng và bước nhánh. Ô tìm kiếm giữ focus khi gõ, không tự ghi nhận đáp án.

`tests/browser/postgres-failure-session.spec.ts` kiểm tra bằng chứng và che dữ liệu, phạm vi tìm kiếm, đủ bốn câu, nhánh PostgreSQL rồi quay lại đúng câu, so sánh hai phiên, viewport 390px và reload/tách tiến độ phiên cũ. Chạy cùng các test bài đọc log, chẩn đoán, Redis và PostgreSQL để kiểm tra hồi quy.

`scripts/extract-postgres-failure-log.mjs <log-2.txt>` chỉ đọc file được chỉ định, kiểm tra các mốc, che dữ liệu và ghi snapshot Workshop. Không chạy backend, Gradle, Docker, DB hoặc lệnh kiểm tra cổng. Hướng dẫn kiểm tra trong nhánh chưa được thực thi; các tình huống thay mapping/hostname được gắn nhãn Giả lập.
