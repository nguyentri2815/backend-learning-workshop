# Bàn giao Java/IntelliJ và dịch vụ phụ thuộc

G3 đã được thiết kế lại tiếp: [thử tạo/chạy → lỗi → bằng chứng → chỉnh kế hoạch → chạy lại](PROJECT-G3-CONFLICT-HANDOFF.md). Phần G3 bên dưới ghi lại phiên bản trước.

G1/G2 được chỉnh tiếp theo yêu cầu riêng: [phạm vi ví dụ và tạo container lần đầu](PROJECT-G1-G2-HANDOFF.md), với URL/ảnh và kiểm tra mới. Các phần IntelliJ, G3, sơ đồ và build/run của bản này vẫn giữ nội dung đã duyệt.

06/11/2026 · chỉ thay đổi `backend-learning-workshop`. Bản này tiếp nối [bàn giao A–J](PROJECT-RUNTIME-HANDOFF.md); giữ nguyên nội dung/source A–E và các bài build, artifact, run/stop, Policy/Claim.

## Review tại cổng 3182

1. [Thực hành IntelliJ](http://localhost:3182/journey/environment?experience=project&task=ide&pprofile=dev&psim=%7B%22jdk%22%3A21%7D): File → Project Structure → Project → SDK → 21 → Language level → 21 → Apply → OK. Tiếp tục File → Settings → Build, Execution, Deployment → Gradle → Gradle JVM → 21 → Apply → OK → Gradle tool window → Reload All Gradle Projects → Xem kết quả kiểm tra. Thử Chỉ vị trí trước khi chọn; làm lại để thử nhánh chưa có JDK, Add JDK from disk hoặc Download JDK.
2. [Đối chiếu kết nối](http://localhost:3182/journey/environment?experience=project&task=connections&pprofile=dev&psim=%7B%7D): lần lượt Xem cấu hình PostgreSQL write/RabbitMQ/Redis. Hai đoạn source cạnh nhau; chọn dòng Compose 80/8/70 để ghi nhận mapping. Mở nguồn kế thừa, override và source đầy đủ nếu cần. Mở tham chiếu Java/Compose trong cây, quay lại bằng trình duyệt hoặc tab Thao tác và kết quả.
3. [Docker](http://localhost:3182/journey/environment?experience=project&task=daemon&pprofile=dev&psim=%7B%7D): CLI chỉ có Client → mở Desktop → chờ Engine và kiểm tra lại → cả Client/Server có phản hồi nhưng mọi container vẫn stopped → Start postgres-write → running nhưng chưa có readiness → chọn dòng log DB nhận kết nối. Redis/RabbitMQ vẫn giữ trạng thái riêng; Java chưa xác nhận kết nối. Có thể Start/Stop từng service để so sánh.
4. [Conflict](http://localhost:3182/journey/environment?experience=project&task=conflict&pprofile=dev&psim=%7B%7D): chọn dòng rebrow trong tình huống tên, đọc vì sao container dừng vẫn giữ tên; chọn kế hoạch dùng tên riêng. Chuyển host port, chọn pg-analytics đang chiếm 5432, đọc vì sao đổi tên không giải quyết cổng, chọn kế hoạch đổi host port và cập nhật Java. Tái sử dụng chỉ là đề nghị chờ xác minh; chưa cấp quyền hoặc xác nhận tương thích.
5. [Hạ tầng workspace](http://localhost:3182/journey/environment?experience=project&task=connections&pprofile=dev&psim=%7B%22infraOpen%22%3Atrue%2C%22infraScope%22%3A%22workspace%22%7D): chọn Command/Toàn workspace; chọn một cạnh hoặc dòng quan hệ để xem source, dòng và SHA-256. Sơ đồ đóng mặc định và chỉ mở theo nhu cầu.

Tiếp tục H/I/J từ luồng tuần tự để review build/run. Deep link startup chưa có trạng thái PostgreSQL phù hợp sẽ báo thiếu điều kiện và chỉ về G2; build module vẫn độc lập với việc khởi động dependency. Các ví dụ startup còn giả định credential/schema phù hợp, không nâng thành kết quả kết nối/API/nghiệp vụ đã kiểm chứng.

## Ảnh giao diện

Ảnh được chụp từ ứng dụng học; không dùng làm bằng chứng cấu hình/runtime Java thật.

| Nội dung | Ảnh |
|---|---|
| IntelliJ Project Structure | SDK / language level (artifact cục bộ: `../.verification/labs-intellij-project.png`) |
| IntelliJ Settings | Gradle JVM (artifact cục bộ: `../.verification/labs-intellij-gradle.png`) · Kết quả sau Reload (artifact cục bộ: `../.verification/labs-intellij-result.png`) |
| Java / Compose / container | Đối chiếu cạnh nhau (artifact cục bộ: `../.verification/labs-connections-review.png`) · Mobile (artifact cục bộ: `../.verification/labs-mobile-comparison.png`) |
| Docker trước/sau | Engine chưa sẵn sàng (artifact cục bộ: `../.verification/labs-docker-before.png`) · Engine ready, container stopped (artifact cục bộ: `../.verification/labs-docker-engine-ready.png`) · Container running, log readiness (artifact cục bộ: `../.verification/labs-docker-container-running.png`) |
| Hạ tầng workspace | Ba nhóm và quan hệ có căn cứ (artifact cục bộ: `../.verification/labs-workspace-infrastructure.png`) |

Chụp lại bằng `node scripts/capture-runtime-labs.mjs` khi server frontend ở 3182 đã chạy. Script chỉ thao tác UI học tập.

## Khảo sát và cách diễn giải bằng chứng

Đã đọc source, hai tài liệu bàn giao trước, báo cáo `D:/tmp/agent-service-workspaces-setup-evidence-report.md` và các file `.idea`. GitNexus đang kết nối không có index của workspace này, nên lỗi định vị được lần trực tiếp qua `ProjectPractice`, URL/context và `CodeBlock`; không tạo index hoặc sửa repo tham chiếu.

Chưa có bằng chứng phiên bản/layout IntelliJ trên máy người dùng. `.idea/misc.xml:4`, `.idea/gradle.xml:8` chỉ xác nhận giá trị cấu hình 21 trong source hiện tại. Bố cục mô phỏng ghi rõ tham chiếu **IntelliJ IDEA 2026.3 Help, Windows / New UI**, tra ngày 06/11/2026; không khẳng định trùng tuyệt đối máy người dùng. [JetBrains SDKs](https://www.jetbrains.com/help/idea/sdk.html) mô tả Project Structure/Project và nhánh thêm JDK. [Gradle settings](https://www.jetbrains.com/help/idea/gradle-settings.html) tham chiếu Gradle dưới Build, Execution, Deployment; [Gradle](https://www.jetbrains.com/help/idea/gradle.html) cũng đề cập layout có Build Tools và thao tác reload. UI nêu khác biệt phiên bản ngay trong phần nguồn tham chiếu.

Project SDK phục vụ IDE/module; Language level là cú pháp IDE hiểu; Gradle JVM chạy Gradle trong IDE; compiler toolchain 21 lấy từ `build.gradle:48`. Apply/OK và Reload là các thao tác riêng, không có nút Đồng bộ tổng hợp. Terminal/JAVA_HOME ngoài IDE không đổi theo lựa chọn SDK. F2 vẫn là tình huống terminal/Gradle riêng.

Các kết nối được đối chiếu theo mô hình hai YAML, không tuyên bố cấu hình runtime thật:

| Kết nối | Cấu hình Java | Compose / diễn giải |
|---|---|---|
| PostgreSQL write | dev:33, `${DOCKER_HOST_IP:localhost}`, cổng mặc định 5432, DB alpaca-event; schema platform_event ở :45. File gốc có đích remote đã che. | postgres-write :77–86, host 5432 → container 5432. Biến DOCKER_HOST_IP có thể thay đổi đích; trùng cổng chưa kiểm tra auth/schema. |
| RabbitMQ | cả file gốc/dev :51–55, host 127.0.0.1, port 5672; dev ghi đè cùng giá trị. | rabbitmq :3–16; 5672 là AMQP, 15672 là management UI. Credential đã che. |
| Redis | cả file gốc/dev :118–121; ba khóa cache.redis, cache.redis-persistent, cache.redis-session cùng localhost:6379, DB 0. shared-cache/SpringCacheConfig.java:26–31 đọc các khóa. | redis :65–70; 6379 → 6379. Chưa xác nhận namespace dữ liệu/quyền, không coi là spring.data.redis. |

Khi mở override, UI chỉ rõ arguments, JVM properties, env và config location/additional-location/import; không mặc định dev là local hoàn toàn. Java trên host dùng host port; localhost trong container là chính container đó, cần network/DNS riêng.

Sơ đồ phân biệt app Java, dịch vụ hỗ trợ và công cụ quan sát. Mọi cạnh trong `infraEdges` có file/dòng cụ thể và nội dung đối chiếu hiển thị được. Command còn có cấu hình Kafka/Zookeeper ngoài ba kết nối G1. Query file gốc dùng localhost:5433; Query dev dùng localhost:5432. Flow → Command chỉ minh họa file gốc có HTTP localhost:9901, không gán cho mọi profile. Kafka CDC Java khác với Debezium Connect. `depends_on` và cấu hình broker không chứng minh readiness/traffic; Kafka UI còn cần đối chiếu broker/network. Không vẽ cạnh Redis cho Rebrow vì chưa xác minh target; không vẽ replication PostgreSQL write → read. Nhóm Java khác được liệt kê từ main class, chưa có cạnh suy đoán.

## Source, số dòng và trạng thái

`scripts/extract-infrastructure-source.mjs` chỉ đọc file Java/config và git revision; xuất ba file cấu hình đầy đủ đã che cùng các đoạn bằng chứng topology sang `practice-infrastructure-source.json`. Có SHA-256 file gốc, đường dẫn, thời điểm trích và số dòng gốc. Giá trị bị che theo nguyên tắc mặc định, chỉ giữ trường an toàn cần học; không đưa ảnh/mockup làm nguồn kỹ thuật. Đoạn trích A–E giữ nguyên.

Lỗi nhãn :33 nhưng viewport ở :86–120 xuất phát từ ưu tiên readingPositions cũ hơn target mới. Viewer của bài học dùng `preferTarget` để luôn định vị theo `row.line` của file gốc, kể cả khi file/tab vừa mở lại hoặc token cú pháp tải xong. Các viewer Policy/Claim giữ hành vi mặc định. Mở tham chiếu đưa viewer vào viewport; trở lại khôi phục connection/profile/dòng theo URL. Không tính số dòng bằng index của excerpt.

Namespace tiến độ v1 giữ nguyên; dữ liệu cũ được bổ sung mặc định cho trường mới. Snapshot `psim={}` được ghi rõ để Reset không bị state cũ trong localStorage ghi đè. Quay lại A–E giữ state runtime dùng chung cùng file/dòng riêng của từng nhiệm vụ. URL giữ bước IntelliJ, nhánh thiếu JDK, Engine, trạng thái từng container, log readiness đã đọc, conflict đã phát hiện/kế hoạch, phạm vi/quan hệ sơ đồ. Back/Forward/reload dùng snapshot tương ứng; hoàn thành mô phỏng không tick checklist máy thật hoặc xóa Policy/Claim.

Engine ready không đổi container. Start chỉ đổi container được chọn; Stop bỏ bằng chứng readiness của service đó. Compose không có healthcheck nên không tự gắn healthy. Chọn log PostgreSQL chỉ ghi nhận DB nhận kết nối trong ví dụ, chưa kiểm tra auth/schema hoặc Java. Tóm tắt đọc cùng state; kế hoạch conflict không tự khởi động container. Hai tình huống conflict có project sở hữu minh họa và được ghi rõ là độc lập, không giả làm Docker hiện tại.

## Kiểm tra và giới hạn

- `npm.cmd run build`: gồm typecheck; log labs-build-final.log (artifact cục bộ: `../.verification/labs-build-final.log`). Vite vẫn có cảnh báo chunk chính trên 500 kB.
- Browser regression **49/49 pass** (2,7 phút), gồm A–E, F–J/build/run/Policy/Claim, graph/checklist cũ và các bài mới: ba nhánh IntelliJ; hint và highlight sau lựa chọn; từng connection và override; tọa độ dòng highlight; tham chiếu/Back/Forward/reload; Engine ready/container stopped; running chưa readiness; readiness chưa xác nhận Java; startup thiếu dependency; hai loại conflict; Command/workspace; quay lại A–E vẫn giữ trạng thái runtime; mobile 390px và desktop 1280px. Cột số dòng ba chữ số trên mobile cũng được kiểm tra không xuống dòng. Log labs-browser-final.log (artifact cục bộ: `../.verification/labs-browser-final.log`). Sau khi bổ sung nhắc PostgreSQL trong thông báo startup bị chặn, kiểm tra riêng bài startup và build lại: labs-startup-final.log (artifact cục bộ: `../.verification/labs-startup-final.log`).
- `verify:originals`: Product 44 file, Workshop 1937 file, không file đổi và git status giữ nguyên so baseline. Java root + 10 repo con có status sạch, khớp bàn giao trước: labs-java-status.json (artifact cục bộ: `../.verification/labs-java-status.json`).
- Không thêm/nâng dependency; không cài/clone/chạy Java, Gradle, Docker, DB, migration hoặc gọi dịch vụ thật; không chỉnh IDE hoặc repo tham chiếu/Quotation; không commit/push/deploy.

Source triển khai chính: `IntelliJPractice.tsx`, `ConnectionPractice.tsx`, `DockerPractice.tsx`, `InfrastructurePanel.tsx`, `infrastructure-model.ts`, `runtime-labs.css`; tích hợp qua `RuntimePractice`, `ProjectPractice`, hai model tiến độ và tùy chọn định vị trong `CodeBlock`. UI vẫn chạy bằng server frontend ở cổng 3182.
