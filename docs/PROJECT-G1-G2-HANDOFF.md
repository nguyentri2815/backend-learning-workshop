# Bàn giao G1/G2: phạm vi ví dụ và tạo container lần đầu

G1 đã được mở rộng tiếp: [khảo sát dependency theo source và mục tiêu chạy](PROJECT-DEPENDENCY-SURVEY-HANDOFF.md). Nội dung dưới đây giữ lại bằng chứng và hành trình G1/G2 của lượt trước.

06/11/2026. Chỉ sửa ứng dụng học. A–E, IntelliJ, G3/conflict, sơ đồ, build/run, Policy/Claim giữ nội dung đã duyệt; cập nhật model trạng thái dùng chung để G1/G2 và tóm tắt đọc cùng dữ liệu.

## URL review

- [Lần đầu chạy repo — Engine ready, chưa có container của repo](http://localhost:3182/journey/environment?experience=project&task=daemon&pprofile=dev&psim=%7B%22dockerEntry%22%3A%22first%22%2C%22daemon%22%3Atrue%2C%22desktopOpen%22%3Atrue%7D).
- [Lần đầu — CLI có nhưng Engine chưa sẵn sàng](http://localhost:3182/journey/environment?experience=project&task=daemon&pprofile=dev&psim=%7B%7D).
- [Container đã tạo, đang dừng — chạy lại](http://localhost:3182/journey/environment?experience=project&task=daemon&pprofile=dev&psim=%7B%22dockerEntry%22%3A%22existing%22%2C%22daemon%22%3Atrue%2C%22desktopOpen%22%3Atrue%7D).
- [G1 — học phương pháp qua Command dev](http://localhost:3182/journey/environment?experience=project&task=connections&pprofile=dev&psim=%7B%7D).

## Hai hành trình ngắn

Lần đầu: Engine ready → thấy **0 container đã tạo** ở nhóm repo và vẫn thấy monitoring-lab ở nhóm riêng → chọn postgres-write trong Compose → đọc build/ports/volume → Chuẩn bị lệnh Compose → Bắt đầu Compose trong mô phỏng → Hoàn tất chuẩn bị image → Tạo tài nguyên và container. Lúc này container mới xuất hiện, **stopped**; viewer đưa nhóm container vào viewport. Bấm Khởi động container vừa tạo → chọn dòng postgres-write → đọc tên/project/port/log → chọn log nhận kết nối → Stop. Container vẫn còn trong danh sách; Start chạy lại cùng container.

Đã tạo trước: chọn điểm bắt đầu thứ hai hoặc mở deep link tương ứng → chỉ có postgres-write đã tồn tại, stopped → chọn dòng → Start → running. Không qua bước image/tạo mới; số container vẫn là 1. Running chưa xác nhận readiness. Chọn log PostgreSQL chỉ ghi nhận DB nhận kết nối trong mô hình, chưa xác nhận auth/schema hoặc Java.

CLI chưa tìm thấy: dùng bộ chọn dấu hiệu công cụ. UI hiển thị command not found/not recognized và nêu có thể thiếu cài đặt hoặc PATH. Hướng dẫn cài đặt ở phần mở riêng, dẫn đến tài liệu chính thức; không có nút cài thành công. Chọn tình huống CLI có sẵn chỉ đổi giả thiết của bài. Engine chưa sẵn sàng vẫn cần mở Desktop và kiểm tra lại Client/Server.

## G1 và phạm vi đã xác minh

Khối nổi bật nêu mục tiêu học cách tìm dịch vụ một module cần; chuỗi thao tác là Chọn module → xác định profile → đọc cấu hình hiệu lực → đối chiếu dịch vụ.

Bộ chọn Module/Profile là phạm vi đang đọc, không kích hoạt Run Configuration của Java. Command với dev hoặc file gốc có đối chiếu đã xác minh. Flow/Query/Kafka CDC Java và profile test hiện chưa có bài G1, nên chỉ hiện thông báo; không hiển thị cấu hình Command thay cho các phạm vi đó. Source/topology đã khảo sát ở các phần khác vẫn giữ nguyên. Ba kết nối PostgreSQL/RabbitMQ/Redis là phạm vi thực hành phương pháp, chưa là toàn bộ dependency của Command hoặc workspace.

## Vì sao có tên sale-platform?

`D:/ALPACA/agent-system/build.gradle:102` khai báo `projectName = "sale-platform"` trong cấu hình plugin dockerCompose; dòng 103 chọn `docker-compose-env.yml`. Vì vậy tên này có căn cứ từ chính repo, không được đổi thành project khác trong tình huống conflict.

CLI không tự đọc tên project của plugin Gradle. Bài học truyền tên tường minh để dùng cùng quy ước:

```text
Thư mục: D:/ALPACA/agent-system
docker compose -p sale-platform -f docker-compose-env.yml up -d --no-deps postgres-write
```

UI giải thích từng phần ngay dưới lệnh. Service cuối lệnh được lấy từ bộ chọn, không mặc định toàn stack. `docker-up.sh` hiện có gọi docker-compose up cho cả file và không truyền -p; phần bằng chứng ghi rõ khác biệt này, không dùng script đó để chạy toàn bộ stack trong bài.

Tên `sale-platform-postgres-write-1` là tên mô phỏng phù hợp với lệnh CLI v2 minh họa; container_name được khai báo tường minh như redis/rabbitmq giữ tên trong Compose. `-p` không tự thay container_name hoặc đường dẫn bind mount. Nhóm repo và các nhóm project khác có nhãn riêng, không gộp container vào một project. Các owner monitoring-lab/analytics-training là dữ liệu tình huống, không là kết quả đọc Docker thật.

`docker/postgres/Dockerfile` dùng `debezium/postgres:16-alpine` và COPY cấu hình/init scripts; Compose dùng build context `docker/postgres`. Mount PostgreSQL là `./.docker/postgresql-write:/var/lib/postgresql/data`, không phải tự tạo named volume. Redis không có volume khai báo trong Compose; RabbitMQ mount thư mục addon plugins. Các dòng này được xuất từ source đã che secrets, giữ số dòng và SHA-256; không dùng ảnh làm bằng chứng kỹ thuật.

[Docker Compose up](https://docs.docker.com/reference/cli/docker/compose/up/) mô tả build/tạo/start và giới hạn service bằng --no-deps. [Project name](https://docs.docker.com/reference/cli/docker/compose/) mô tả -p/-f. [Stop](https://docs.docker.com/reference/cli/docker/compose/stop/) giữ container và [Start](https://docs.docker.com/reference/cli/docker/compose/start/) dùng container hiện hữu. Đây là căn cứ ngữ nghĩa của mô phỏng, không là xác nhận lệnh đã chạy.

## Trạng thái, reset và điều hướng

Container không có trong map trạng thái là **chưa được tạo**; không hiển thị stopped thay cho trường hợp này. Sau bước tạo mới thêm container với stopped, sau bước khởi động mới chuyển running. Stop giữ container, Start không tăng số lượng, readiness được bỏ khi dừng/chạy lại.

Điểm bắt đầu, dấu hiệu CLI, service, lệnh đã chuẩn bị, giai đoạn Compose, container đã chọn và trạng thái từng container nằm trong snapshot URL/namespace tiến độ v1 hiện có. Back/Forward/reload khôi phục từng giai đoạn, kể cả quay trước/sau lúc tạo container. Quay sang G1/build/run/tóm tắt dùng cùng map trạng thái. Bộ chọn phạm vi G1 được nhớ riêng, không sửa profile chạy Java ở I1.

Đổi điểm bắt đầu hoặc Làm lại riêng Docker đặt lại tình huống của repo; giữ tiến độ A–E/IDE/build, trạng thái JDK/artifact và dữ liệu các project khác. Case conflict tên redis hoặc cổng PostgreSQL hiển thị owner hiện hữu ở nhóm riêng và chặn tạo container; không xóa, tự nhận quyền tái sử dụng hoặc gộp nhóm để vượt conflict. G3 giữ nguyên bài phát hiện nguyên nhân đã duyệt.

## Ảnh và kiểm tra

- Trước tạo: Engine ready, repo chưa có container (artifact cục bộ: `../.verification/g12-docker-before-create.png`).
- Sau tạo: container xuất hiện, stopped (artifact cục bộ: `../.verification/g12-docker-created.png`).
- Sau khởi động: running, kết nối Java chưa xác nhận (artifact cục bộ: `../.verification/g12-docker-running.png`).
- Stop giữ container (artifact cục bộ: `../.verification/g12-docker-stopped.png`) · Start lại container hiện hữu (artifact cục bộ: `../.verification/g12-docker-restarted.png`).
- Phạm vi G1 (artifact cục bộ: `../.verification/g12-method-scope.png`) · Lệnh Compose (artifact cục bộ: `../.verification/g12-compose-command.png`) · Giai đoạn image (artifact cục bộ: `../.verification/g12-compose-image.png`) · Mobile (artifact cục bộ: `../.verification/g12-mobile-first-run.png`).

Ảnh là giao diện ứng dụng học. Chụp lại bằng `node scripts/capture-g12-review.mjs` khi server frontend đang ở 3182; script chỉ thao tác UI mô phỏng.

Kiểm tra: typecheck/build và toàn bộ 57 bài trình duyệt gồm 8 bài G1/G2 mới, A–E, IntelliJ, mapping/highlight/source, conflict, graph, build/run và Policy/Claim. Sau chỉnh reset để giữ dữ liệu project khác, chạy lại 8 bài G1/G2 và build. Log: build (artifact cục bộ: `../.verification/g12-build-final.log`), 57 bài hồi quy (artifact cục bộ: `../.verification/g12-browser-final.log`), 8 bài G1/G2 cuối (artifact cục bộ: `../.verification/g12-scope-final.log`).

`verify:originals` đối chiếu Product 44 file và Workshop 1937 file, nội dung/git status giữ nguyên: log (artifact cục bộ: `../.verification/g12-originals-final.log`). Không chạy Docker/Compose/Java/DB hoặc dịch vụ thật, không cài/clone, sửa repo Java/Quotation, thêm dependency, commit/push/deploy.

Source chính: `ConnectionPractice.tsx`, `DockerLifecycle.tsx`, `docker-practice-model.ts`, `g12-practice.css`; giữ nguyên thân `ConflictPractice`. Model tiến độ và `containerStatus` được cập nhật để trạng thái chưa tạo/đã tạo nhất quán ở G1/G2/build/run/tóm tắt. `extract-infrastructure-source.mjs` chỉ đọc repo tham chiếu, xuất thêm bằng chứng tên project/Dockerfile và mount an toàn.
