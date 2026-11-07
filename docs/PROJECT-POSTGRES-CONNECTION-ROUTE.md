# I2 — Lần đường kết nối PostgreSQL

Review tại [I2 — Tập đọc log thật](http://localhost:3182/journey/environment?experience=project&task=startup&readlog=1).

## Đường thao tác

1. Chọn phiên lỗi 07/11. Nếu học từ đầu, trả lời bốn câu bằng L3205 → L3499 → L112 → L114, bấm **Tiếp tục bài học** sau mỗi câu.
2. Tại câu **5/14**, chọn **L183** → **Lần đường kết nối PostgreSQL** → **Ai dùng kết nối này?**. Có thể vào nhánh từ L184, L280 hoặc nhóm **Repository, JPA, DB**.
3. Xem controller → service nghiệp vụ `GlobalConfigFunc.getAllConfig()` → `ConfigRepository.findAll()` khi cache rỗng → đối tượng `ConfigAggregate` ánh xạ vào `config_aggregate`. Đây là đường xử lý request GET `/global-config/load-all`, chưa phải request được xác nhận trong log 07/11. Đối chiếu ba mốc L183, L184 và L280 bằng cách bấm từng dòng.
4. **Lần về cấu hình DB**: xem L114/default, hai YAML cạnh nhau và key URL tô sáng. Chọn hai trạng thái `DOCKER_HOST_IP`, mở vị trí trong Run Configuration, rồi **Mở L187 · Database JDBC URL**. Cả ví dụ và bảng bằng chứng đều giữ **Chưa biết địa chỉ hiệu lực** cho phiên thật.
5. **Phân biệt DB local với DB từ xa**: xem service `postgres-write`, đổi mapping `5432:5432` sang `15432:5432`, bấm các nút trên đường kết nối. Command trên Windows dùng `localhost:15432`. Chọn **Hostname PostgreSQL từ xa · Giả lập** để xem đường từ Windows tới `postgres.lab.example:5432`; cổng Docker trên máy mình không giải thích được đường này.
6. **Áp dụng vào phiên thật** → chọn **JDBC URL hiệu lực và môi trường chạy Command** → **Hoàn tất và quay lại câu đang học**. Câu vẫn là **5/14**, đáp án trước khi mở nhánh còn được giữ trong phiên hiện tại. Nút quay lại ở đầu nhánh dùng được tại mọi bước.

## Bằng chứng và giới hạn

- Log thật vẫn giữ hash gốc `671639be3f5a570032af0479fd8822ad499f977f1adab6dca579b48a627bada6`. Đã trích thêm đúng L187 từ cùng file gốc qua `scripts/extract-real-log-practice.mjs`; không dùng dòng của một phiên khác. L187 chỉ ghi `Connecting through datasource 'HikariDataSource (HikariPool-1)'`.
- L183 là `Added connection` tới `PgConnection`; L184 là pool `Start completed`; L280 là JPA `Initialized`. Chưa xác nhận truy vấn nghiệp vụ, kết quả đọc/ghi, hostname, cổng hoặc tên database thực sự của phiên 07/11.
- Snapshot `src/content/setup/postgres-route-source.json` giữ đường dẫn tương đối, số dòng gốc và SHA-256 của bảy file đã đối chiếu. Credential và host ngoài loopback trong YAML gốc được che. `application-dev.yml` khai báo URL không ghi port; PostgreSQL JDBC mặc định dùng 5432. Host/database của ví dụ từ xa dùng miền `.example`.
- `scripts/extract-postgres-route.mjs <source-root>` chỉ đọc các phạm vi source đã chỉ định, kiểm tra đường gọi, placeholder và mapping rồi ghi snapshot. Không chạy Java, Docker, DB hay request.
- Binding `spring.datasource.url` do Spring Boot cung cấp; repo không chứa source auto-configuration. YAML và nguồn override cần được đối chiếu với cấu hình hiệu lực của đúng process/lần Run.
- Trạng thái nhánh lưu riêng tại `backend-learning-workshop.postgres-route.v1`; con trỏ câu học và vị trí chẩn đoán vẫn thuộc `real-log-reading.v1`. Reload giữ bước nhánh, trạng thái biến, mapping, ví dụ từ xa và số câu. Đáp án chưa bấm tiếp của câu học theo cơ chế hiện có chỉ giữ trong bộ nhớ của phiên trang.

## Kiểm tra

`tests/browser/postgres-connection-route.spec.ts` kiểm tra source đã che, dòng L187 gốc, luồng câu 5/14 đầy đủ, cả bốn điểm vào, giữ vị trí chẩn đoán Redis, reload và viewport 390px. Chạy cùng các test bài đọc log/chẩn đoán/nhánh Redis để kiểm tra hồi quy. `npm run build` và `npm run verify:fixtures` kiểm tra TypeScript/build cùng snapshot đóng gói.
