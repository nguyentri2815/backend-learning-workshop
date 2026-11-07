# I2 — Tập đọc log thật

Điểm vào: ngay dưới tiêu đề **Chạy Command và đọc kết quả** trong I2. Nút luôn có dù I2 đã hoàn thành, đang xem kết quả hoặc đã chọn case khác. **Về Run / Stop** trả lại tình huống ban đầu.

Review local: <http://localhost:3182/journey/environment?experience=project&task=startup>.

Mở thẳng bài đọc trong I2: <http://localhost:3182/journey/environment?experience=project&task=startup&readlog=1>. Tham số `readlog=1` giữ trạng thái mở khi reload hoặc đổi bố cục cửa sổ.

## Dữ kiện và giới hạn

- Phiên lỗi chính: `log-start-command.txt`, 07/11/2026 16:09; 3499 dòng gốc. Snapshot `src/content/setup/real-log-practice-source.json` giữ số dòng và hash nguồn, che đường dẫn máy, tên người dùng và PID. Loopback `127.0.0.1:6379` được giữ để đối chiếu. Không sao chép nguyên console chưa che vào repo.
- Phiên đối chiếu: snapshot `default-success` đã có trong Workshop, 04/11 12:43; L16134 Tomcat started và L18989 Started. Không ghép dòng thành công vào phiên lỗi 07/11.
- Log thật xác nhận Redis Connection refused; không xác nhận nguyên nhân vận hành trên máy. Hai nhánh Docker/TCP, sửa cấu hình và lần thử lại đều ghi **Giả lập**. Tên container của bài là dữ kiện giả lập.
- Hikari/PostgreSQL và JPA đã qua mốc khởi tạo trước khi lỗi Redis. `Tomcat initialized`, `Shutdown completed`, tên bean đầu tiên và mã thoát không thay thế bằng chứng kết quả/nguyên nhân cụ thể.
- Eventuate chưa có bằng chứng consumer/event đã hoạt động; bootstrap owner/config không có dòng xác nhận ghi dữ liệu. Started chưa chứng minh mọi API hoặc process hiện tại.

## Luồng review

1. Vào I2 → **Tập đọc log thật**. Trả lời L3205 và L3499, mỗi câu bấm **Tiếp tục bài học**, để tới **Đang học · 3/14**.
2. Bấm L3205 ngoài câu Java đang học. Thẻ **Đang xem L3205 · Kết quả khởi động** đổi ngay sang **Command khởi động thất bại**. Thẻ **Đang học · 3/14** giữ riêng câu hỏi và tiến độ.
3. **Lần nguyên nhân lỗi này** mở luồng chẩn đoán bên cạnh console: xác nhận L3205 báo startup thất bại, L3499 xác nhận process thoát → **Tìm Caused by trong console** → nhập `Caused by:`. Có chín kết quả trong khối sau L3205; dùng **Kết quả trước / sau**. L3373 đang ẩn cũng được tìm và tự mở đoạn chứa nó, không cần mở toàn bộ DEBUG/stack trace.
4. Bấm queueHandler ở L3206 hoặc cacheManager ở L3274 → **Xem nguyên nhân bên dưới**. Đọc L3432 để xác nhận Redis/127.0.0.1:6379, rồi L3469 để xác nhận Connection refused. Tóm tắt cho phép bấm từng kết luận để nhảy tới bằng chứng PostgreSQL/JPA/Redis/process.
5. **Kiểm tra Redis** → chọn TCP → chọn nhánh → chạy kiểm tra giả lập từ đúng máy chạy Command → xem Docker Status / Ports trước khi xử lý. `False` chưa kết nối được; `True` mới xác nhận TCP thông. Nhánh stopped yêu cầu chọn đúng `command-redis-practice` rồi khởi động; nhánh port yêu cầu đổi cổng Command thành host port 16379.
6. Kiểm tra lại TCP trước khi **Thử lại Command · Giả lập**. Tìm bằng chứng mới Redis → Tomcat started → Started. Hoặc chọn **Redis đã qua nhưng dừng ở lỗi khác**: chỉ có Redis kết nối, Application run failed mới, Caused by báo cổng 9901 bị chiếm và process thoát. **Đọc khối lỗi mới** tìm riêng các dòng SIM sau SIM2, không ghép nguyên nhân Redis của phiên thật.
7. **Quay lại câu đang học** trở về đúng câu 3/14, kể cả sau kiểm tra/chạy lại. **Thử nhánh Redis còn lại** giữ vị trí câu đã lưu. Không cần Học lại từ đầu. Có thể chẩn đoán từ các câu khác hoặc quay lại một câu đã tìm được đáp án mà chưa bấm tiếp tục.
8. Luồng 14 câu đầy đủ vẫn dùng được. Đối chiếu **Phiên thành công · đã lưu** để phân biệt startup, trạng thái process hiện tại và kiểm tra API; chọn nhóm để xem ba câu giải thích và giới hạn bằng chứng.

## Tích hợp và lưu trạng thái

`StartupLogConsole` và `StartupGroupNav` dùng chung cho startup replay hiện có và bài đọc. Bài đọc nằm trong cùng cửa sổ Command của I2, không tạo route hay bước học mới. Không sửa state Run/Stop, cấu hình I1, dịch vụ G2 hoặc state case; đánh dấu riêng `startup:real-log` khi hoàn tất bằng chứng thử lại, không tự hoàn tất Run thật.

Tiến độ bài đọc lưu riêng ở `backend-learning-workshop.real-log-reading.v1`, gồm từng phiên, nhánh và bước kiểm tra. Các trường mới tương thích dữ liệu cũ: focus lesson/diagnosis, giai đoạn chẩn đoán, bằng chứng đã đọc và con trỏ lần chạy giả lập. Chẩn đoán không sửa chỉ số câu đang học; đóng/mở lại hoặc reload vẫn giữ vị trí. **Học lại từ đầu** chỉ reset bài đọc. Lỗi localStorage không chặn thực hành.

`RedisLogCheck.tsx` dùng chung cho luồng 14 câu và lối chẩn đoán từ bất kỳ câu nào. `errorBlockMatches` tìm trên toàn bộ trích đoạn trong phiên đang hiển thị, trước khi lọc dòng thu gọn. Console đánh dấu chuỗi tìm thấy và mở đoạn quanh dòng ẩn; không thay số dòng hay sửa nội dung log thật. Kiểm tra/chạy lại giả lập không sửa snapshot nguồn.

## Kiểm tra

Chỉ chạy Workshop và kiểm tra local của nó. Không chạy Java, Docker, DB hoặc API backend thật. Với bài lần đường Redis, chỉ đọc các đoạn source liên quan để đối chiếu binding và phụ thuộc; không chạy kiểm thử backend. Dùng Chrome cài sẵn nếu máy chưa có Chromium phiên bản Playwright đang yêu cầu:

```powershell
npm.cmd run build
npm.cmd run verify:fixtures
$env:WORKSHOP_BROWSER_CHANNEL = 'chrome'
npx.cmd playwright test tests/browser/real-log-practice.spec.ts tests/browser/command-startup.spec.ts tests/browser/command-runtime.spec.ts tests/browser/command-merged-cases.spec.ts tests/browser/bundled-fixtures.spec.ts
```

Kiểm tra tập trung cho nâng cấp chẩn đoán:

```powershell
$env:WORKSHOP_BROWSER_CHANNEL = 'chrome'
npx.cmd playwright test tests/browser/real-log-practice.spec.ts tests/browser/real-log-diagnosis.spec.ts tests/browser/command-startup.spec.ts --grep 'real-log|full log keeps'
```

`@source` bị loại theo cấu hình Playwright mặc định. Script `scripts/extract-real-log-practice.mjs <file>` chỉ đọc file được chỉ rõ và ghi snapshot đã che; không launch backend. Khi chủ động cập nhật snapshot, chạy `npm.cmd run fixtures:update` sau khi review dữ kiện.

### Kết quả lượt triển khai đầu, 07/11/2026

- Build/typecheck và integrity của 23 fixture: qua.
- Năm kiểm thử bài đọc: qua, gồm hai nhánh Redis, chọn sai/gợi ý, nguồn/số dòng/che thông tin, đối chiếu thành công, giới hạn nhóm, reload/resize, I2 đã hoàn thành và giữ phiên Run/case đang hoạt động.
- Tám kiểm thử `command-runtime` và hai kiểm thử bundled fixtures: qua. Trong năm kiểm thử startup replay, một test chọn phiên/tạm dừng chập chờn ở lượt cả bộ; chạy lại riêng hai lần đều qua.
- Thư viện case: 24/27 qua lượt đầu. `rabbit-permission`, `kafka`, `bean` gặp lỗi thời điểm cập nhật URL/nhấn tiếp; chạy lại riêng hai lần mỗi case: 6/6 qua. Không coi lượt cả bộ ban đầu là xanh hoàn toàn.
- Đối chiếu bản HEAD trước thay đổi trong thư mục tạm: các case trên qua; test tạm dừng playback cũng tái hiện lỗi thời điểm ở một lần lặp. Không sửa logic case/Run/Stop cũ trong lượt triển khai này.
- Rà giao diện ở 1512px và 390px: không tràn ngang, hint focus đúng dòng; khi màn hình hẹp, câu hỏi/giải thích đứng ngay sau console, trước danh sách nhóm.

Workshop tiếp tục phục vụ ở cổng 3182. Server đối chiếu tạm đã dừng. Chưa commit/push; không chạy Java, Docker, DB hoặc API backend thật.

### Kết quả nâng cấp luồng chẩn đoán, 07/11/2026

- Build/typecheck, kiểm tra 23 fixture và `git diff --check`: qua. Snapshot log thật không đổi.
- 11/11 kiểm thử tập trung qua: năm test bài đọc hiện có, năm test chẩn đoán mới và test mở toàn bộ log của startup replay. Các tình huống bao gồm đúng đường câu 3/14 → L3205 → tìm Caused by trong phần thu gọn → kiểm tra Redis → chạy lại → quay lại câu 3/14; nhánh khác host port; khối lỗi mới sau Redis; reload, màn hình hẹp và quay về câu khác/đáp án chưa bấm tiếp tục.
- Sau khi làm rõ phần nhắc câu đang học trên giao diện, chạy lại ba test chịu ảnh hưởng: 3/3 qua.
- Rà ảnh desktop 1512px và màn hình 390px: tiêu đề dòng đang xem tách khỏi câu đang học, có nút chẩn đoán/nhảy nguyên nhân, đánh dấu chuỗi tìm thấy và không tràn ngang.
- Chỉ chạy Workshop và kiểm thử frontend của nó. Giữ nguyên tiến độ I2/Run/Stop/case; không chạy backend thật, không commit/push.

## Lần đường kết nối Redis

Tại phần **Đang xem L3432** hoặc **Đang xem L3469**, bấm **Lần đường kết nối Redis**. Nút địa chỉ ngay sau L3432 trong console cũng mở thẳng bước lần ngược cấu hình. Bài có bốn bước; mỗi màn hình chỉ có một câu hỏi chính và một nút tiếp theo. Các lệnh, chuỗi nguồn phụ và ví dụ từ xa nằm trong phần mở rộng.

1. **Ai trong Command đang cần Redis?** Bấm các bean trong chuỗi thật queueHandler → sharedGlobalConfigService → platformCacheConfig → cacheManager → redissonClient. **Mở nơi tạo Redis client** hiện đúng SpringCacheConfig L33–40 và L57–61; tô sáng setAddress, Redisson.create và @Qualifier. Phân biệt client trong Java với server bên ngoài. Constructor/getMap/getSet/createCache là bằng chứng source về phụ thuộc và vai trò cache; không suy diễn session, khóa hay xử lý message đã thành công.
2. **Địa chỉ đã dùng được cấp từ đâu?** Bấm **127.0.0.1:6379** → binding @Value L26 → redisUrl → setAddress L38 → bean redissonClient. Key đang lỗi là **cache.redis**, hai key persistent/session cấp cho các bean khác. L114 xác nhận profile default. application.yml và application-dev.yml cùng được trích L118–121, tô sáng L119: cả hai đều là redis://localhost:6379. **Xem cấu hình lần Run** chỉ vị trí kiểm tra profile, environment, VM options, arguments và file ngoài trong IntelliJ. Bảng riêng phân biệt giá trị file, địa chỉ thực tế trong log và nguồn cuối cùng **chưa xác nhận**.
3. **Tôi sẽ kiểm tra ở đâu?** Bấm từng điểm trong sơ đồ Command/Windows/Docker/Redis. Chọn **6379:6379** hoặc **6380:6379**; cổng Windows là số bên trái, cổng container là số bên phải. Số mới là giả lập, không thay log thật 6379. Chỉ cho tiếp khi chọn nơi kiểm tra đúng. Nhánh mở rộng **redis.lab.example:6380** chuyển phép thử sang đúng hostname từ Windows, không đưa Docker Desktop cục bộ vào nhánh từ xa.
4. **Kiểm tra và thử lại.** Nhánh Docker local mở Engine → Status → Ports trước khi xử lý. Nếu Exited, đọc Logs rồi Start đúng command-redis-practice. Nếu Running nhưng host port 6380, nhập cổng mới và chỉ áp dụng cấu hình mô phỏng. Sau đó thử TCP từ Windows, phân biệt PONG trong container với kết nối qua cổng host, Run lại và bấm ba bằng chứng mới Redis → Tomcat started → Started. `docker ps -a`, `Test-NetConnection` và `docker exec … redis-cli PING` nằm trong phần mở rộng, kèm mục đích và giới hạn kết luận.

**Quay lại bài đọc log** trả về đúng câu hoặc giai đoạn chẩn đoán trước đó. State bốn bước lưu riêng ở `backend-learning-workshop.redis-route.v1`; focus mới trong state bài đọc tương thích dữ liệu cũ. Reload/đổi kích thước giữ bước hiện tại. Không sửa tiến độ I2, case, Run/Stop hoặc cấu hình backend thật.

Snapshot `src/content/setup/redis-route-source.json` gồm sáu trích đoạn đã đối chiếu trong repo agent-system trên máy: factory/binding, hai YAML và ba constructor liên quan. Giữ đường dẫn tương đối, số dòng gốc và SHA-256; không đưa credential hoặc đường dẫn cá nhân vào fixture. Script `scripts/extract-redis-route.mjs <source-root>` chỉ đọc những phạm vi chỉ định, kiểm tra binding/giá trị loopback rồi ghi snapshot Workshop. Hash SpringCacheConfig khớp nguồn cache đã có của startup replay. Snapshot source phản ánh source đã đối chiếu, không tự chứng minh source hoặc nguồn override cuối cùng của JVM trong phiên 07/11.

Kiểm tra tập trung cho nâng cấp này:

```powershell
$env:WORKSHOP_BROWSER_CHANNEL = 'chrome'
npx.cmd playwright test tests/browser/redis-connection-route.spec.ts tests/browser/real-log-practice.spec.ts tests/browser/real-log-diagnosis.spec.ts
npm.cmd run build
npm.cmd run verify:fixtures
```

15/15 test tập trung qua: năm test mới kiểm tra binding/source, profile/nguồn chưa xác nhận, cổng 6379 và 6380, dữ kiện Docker trước xử lý, hostname từ xa, mobile/reload, quay lại câu 3/14 và giữ luồng chẩn đoán; mười test bài đọc/chẩn đoán hiện có qua. Không thực thi bất kỳ lệnh Java, Docker, Redis hay API backend nào trong lượt triển khai.
