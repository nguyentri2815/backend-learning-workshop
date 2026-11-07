# Bàn giao khảo sát dependency Command

06/11/2026. Mở rộng G1 trong ứng dụng học, dựa trên việc đọc repo `D:/ALPACA/agent-system`. Không chạy Java, Docker/Compose, DB, migration hoặc gọi API. Không sửa repo Java/Quotation, thêm dependency, commit, push hoặc deploy.

## Mở review

- [Danh mục Command · dev, trạng thái mới](http://localhost:3182/journey/environment?experience=project&task=connections&pprofile=dev&psim=%7B%7D).
- [Redis — cấu hình đến binding](http://localhost:3182/journey/environment?experience=project&task=connections&pprofile=dev&psim=%7B%22surveyGroup%22%3A%22redis%22%2C%22surveyStep%22%3A%22binding%22%7D).
- [Mục tiêu API có xác thực — SSO](http://localhost:3182/journey/environment?experience=project&task=connections&pprofile=dev&psim=%7B%22surveyGoal%22%3A%22auth%22%2C%22surveyGroup%22%3A%22sso%22%7D).
- [Nghiệp vụ đã lần source — tải tài liệu đại lý](http://localhost:3182/journey/environment?experience=project&task=connections&pprofile=dev&psim=%7B%22surveyGoal%22%3A%22document%22%2C%22surveyGroup%22%3A%22assets%22%7D).
- [Khoảng trống khóa Platform Query](http://localhost:3182/journey/environment?experience=project&task=connections&pprofile=dev&psim=%7B%22surveyGroup%22%3A%22platform-query%22%7D).

Đường review khoảng 5 phút:

1. Mở danh mục. Xem phạm vi Command/dev và đổi **Mục tiêu chạy**: build không cần kết nối runtime; khởi động có bằng chứng PG/Redis; request xác thực bổ sung SSO theo security rule. Các danh sách đếm **nhóm khảo sát**, không đếm service bắt buộc.
2. Chọn **Redis**. Hai đoạn Java/Compose vẫn cạnh nhau cùng container/trạng thái Java. Ba khóa cùng endpoint/DB được ghi thành một nhóm. Bấm **Ai sử dụng cấu hình này?** để tới `SpringCacheConfig.java:22` (`@Value`, Redisson beans), rồi **Lần đến nơi gọi / điều kiện** để tới `InitConfig.java:173` (lock khi khởi tạo).
3. Bấm **Xem kết luận và cần chuẩn bị gì**, chọn Docker local, rồi **Chuẩn bị redis trong Docker**. G2 mở đúng service, giữ mục tiêu/nhóm/lựa chọn nguồn. Đọc image/ports/volume, chuẩn bị lệnh, đi qua image → tạo → start. Container chỉ xuất hiện sau bước tạo. Nút **Quay lại khảo sát dependency** khôi phục bằng chứng; đọc source không đổi readiness hoặc xác nhận Java connected.
4. Đổi sang mục tiêu **Gọi API có xác thực**, chọn SSO. Xem `ResourceServerConfiguration.securityFilterChain`, `alpaca.local=false` ở dev và ngoại lệ permitAll. Đích dev từ xa được che; UI hướng dẫn kiểm tra network/auth thay vì yêu cầu container local.
5. Chọn mục tiêu **Nghiệp vụ: đọc tài liệu đại lý**. Mở từng symbol trong đường gọi POST controller → function → repository → 302. Assets có điều kiện khi client theo redirect, Core Proxy không được thêm vào đường gọi này. Cuối cùng mở Platform Query để thấy lệch khóa và caller chưa tìm thấy; không có lệnh startup được dựng cho target chưa rõ.

## Bảng bằng chứng và giới hạn

[Bảng khảo sát source](DEPENDENCY-SOURCE-AUDIT.md) ghi 16 nhóm, khóa cấu hình, file/symbol binding/client, caller/điều kiện và khoảng trống. Có 60 đoạn bằng chứng đã che, gồm 14 khai báo Feign từ shared-proxy. Đây là số nhóm/đoạn khai báo trong phạm vi khảo sát, không phải số instance hay service phải khởi động.

- Đã đọc `application.yml`, `application-dev.yml`, chỉ dấu import trong resources, main/build/dependency của Command, agent-shared và shared libraries liên quan. `application.yml` là nền, dev ghi đè cùng khóa; đích hiệu lực còn phụ thuộc args/VM/env/config ngoài chưa được khảo sát. Không biết các override runtime thực tế.
- PostgreSQL và Redis có đường khởi tạo trong `InitConfig`; RabbitMQ có listener/queue/publisher, nhưng auto-start/factory/override còn phải kiểm tra. Kafka có import → binding → subscription/consumer start; chưa tìm subscriber Command cụ thể để kết luận mọi startup/request cần broker.
- Chưa tìm Java binding của khóa Zookeeper. Chỉ vẽ Kafka Compose → Zookeeper gián tiếp; đã bỏ cạnh Command → Zookeeper trực tiếp khỏi sơ đồ workspace. CDC/connector/replication chưa được chứng minh hoạt động.
- Platform Query: YAML `system.platform-query.api`, Feign `system.sp-query.api` với default rỗng; không tự nối hai khóa. Platform Command có thể self-call ở base hoặc remote ở dev; không tính mặc định thành app thứ hai.
- Assets `.api` là Feign, `.url` còn dùng redirect. SMS có client nhưng chưa tìm caller. Assessment là URL trong payload SMS trên đường đã đọc. Notification/email qua AMQP; link navigation không được tự tính thành backend khác. Các type reference trong shared-proxy chưa được coi là method call.
- Phân biệt cấu hình, code, runtime lịch sử và runtime hiện tại trong phần mở thêm của mỗi nhóm. S07/S11/S17 chỉ là lịch sử setup/process; không chứng minh từng kết nối đã thành công. Không có runtime hiện tại nào được kiểm tra trong lượt này.

Kịch bản xác định được: `POST /sale-unit/download-document/{documentType}` → `SaleUnitController.downloadDocument` → `DownloadDocumentFunc.exec` → `SaleUnitRepository.findById` → `302 Location` từ `system.assets.url`. Cần user/rootId và dữ liệu phù hợp. Nhánh này không gọi `InternalAssetsApi`; client cần truy cập Assets nếu theo redirect. Không cung cấp nút gọi API thật hoặc dữ liệu thử chưa xác nhận.

## Tích hợp và dữ liệu

G1 giữ Module/Profile selector; Flow/Query/CDC và test chưa có bài riêng nên không dùng dữ liệu Command thay thế. Năm mục tiêu có ba danh sách chuẩn bị/có điều kiện/chưa đủ bằng chứng, cùng phần mở thêm cho nhóm ngoài đường gọi. Mỗi dependency trả lời mục đích, caller, thời điểm, nơi cung cấp và mức bằng chứng; breadcrumb giữ bốn bước cấu hình → binding → caller → kết luận.

Provider là kết quả cấu hình hoặc lựa chọn học tập có nhãn: Docker, Java IDE/terminal, remote, chưa xác định. Không sửa repo thật. PG/Rabbit/Redis/Kafka/Zookeeper có thể dẫn G2 đúng Compose service; Kafka nêu điều kiện Zookeeper riêng. Không tự chạy cả stack. Query/SSO/Assets có main ứng viên để mở bằng chứng, chưa tạo startup command khi profile/port/target chưa rõ. Platform Command dẫn Run Configuration đang có, không tạo thêm app. Build dẫn H và có đường quay lại.

Sơ đồ `@xyflow/react` mở thêm, chỉ nối chuỗi có bằng chứng; node/cạnh mở source. Không biểu diễn các client chưa tìm caller bằng cạnh gọi chắc chắn. Không dùng graph như bằng chứng traffic/runtime.

Giữ namespace tiến độ v1; các trường `survey*` bổ sung mặc định cho dữ liệu cũ và đi trong URL snapshot `psim`. Back/Forward/reload khôi phục mục tiêu, nhóm, bước, proof, provider. File/số dòng vẫn là số dòng gốc, không phải index của đoạn trích. Reset G2 giữ khảo sát và tiến độ khác; reset G1 chỉ đặt lại khảo sát/phạm vi G1, giữ JDK/build/run và tiến độ các phần khác. Tóm tắt đọc cùng state, kể cả phạm vi chưa khảo sát. Bài build/run hiện có giữ cơ chế mô phỏng process; không nâng kết quả đó thành kiểm chứng mọi dependency từ bảng khảo sát.

Các file chính: `DependencySurvey.tsx`, `dependency-survey-model.ts`, `SurveyPreparation.tsx`, `DependencyUsageGraph.tsx`, `ConnectionComparison.tsx`, `practice-runtime-model.ts`. Bộ trích chỉ đọc `scripts/extract-dependency-survey.mjs` dùng định nghĩa bằng chứng trong `scripts/dependency-survey-definition.mjs`; xuất các đoạn được chọn và che literals trước khi ghi JSON/frontend. Không đưa nguyên cấu hình có credential vào public assets hoặc bundle. Manifest giữ file/dòng/SHA-256/revision để đối chiếu lại khi source thay đổi.

## Ảnh review

- Toàn cảnh phạm vi, mục tiêu và danh mục (artifact cục bộ: `../.verification/dependency-survey-overview.png`).
- Đối chiếu Java/Compose/container của Redis (artifact cục bộ: `../.verification/dependency-survey-comparison.png`).
- Redis tới binding SpringCacheConfig (artifact cục bộ: `../.verification/dependency-survey-binding.png`).
- Nơi gọi InitConfig và dòng gốc 173 (artifact cục bộ: `../.verification/dependency-survey-caller.png`).
- Kết luận và chuyển chuẩn bị môi trường (artifact cục bộ: `../.verification/dependency-survey-preparation.png`).
- Sơ đồ mở thêm (artifact cục bộ: `../.verification/dependency-survey-graph.png`) · Mobile (artifact cục bộ: `../.verification/dependency-survey-mobile.png`).

## Kiểm tra

- `npm.cmd run build`: **đạt**, gồm `tsc --noEmit`. Vite vẫn cảnh báo main chunk trên 500 kB; không thêm thư viện hoặc thay đổi bundling ngoài phạm vi này.
- `npm.cmd run test:browser`: **67/67 đạt** (3,8 phút), gồm 10 bài khảo sát mới và 57 regression. Sau khi chốt lời dẫn G1/nhãn quan hệ có điều kiện, bộ 10 bài khảo sát chạy lại **10/10 đạt**; kiểm tra riêng Kafka/Compose/graph sau chỉnh bố cục cũng đạt.
- Bằng chứng: SHA-256/file/dòng trích khớp source gốc; không có URL/credential nhạy cảm trong manifest mới; Redis được gom một nhóm, Query lệch khóa rõ, Zookeeper không có binding Java bị tự thêm.
- Hành trình: đổi đủ năm mục tiêu; cấu hình → client → caller → kết luận; remote khác local; Docker và quay về giữ ngữ cảnh; build/run/summary; old URL snapshot, Back/Forward/reload; reset G1/G2 độc lập; mobile 390 px và source highlight nằm trong viewport.
- Regression: IntelliJ có/chưa có JDK; ba đối chiếu Java/Compose/container; Engine ready nhưng chưa có container; tạo rồi chạy/dừng; container đã có/stopped → Start; conflict tên/cổng; workspace graph; A–E/build/run và Policy/Claim.
- `npm.cmd run verify:originals`: Quotation Product **44 file**, Workshop **1.937 file**, **0 file thay đổi**; working-tree status giữ nguyên. Repo Java gốc và 10 repo con cùng trạng thái sạch như baseline.
- Chụp ảnh bằng `node scripts/capture-dependency-survey.mjs`: không có page error, mobile không tràn ngang. Frontend tại cổng **3182**, đường review trả HTTP **200**.

Log: build/typecheck (artifact cục bộ: `../.verification/survey-build-final.log`), 67 browser tests (artifact cục bộ: `../.verification/survey-browser-final.log`), 10 bài khảo sát sau chốt logic (artifact cục bộ: `../.verification/survey-tests-final-focused.log`), graph (artifact cục bộ: `../.verification/survey-graph-final.log`), Quotation (artifact cục bộ: `../.verification/survey-originals-final.log`), Java (artifact cục bộ: `../.verification/survey-java-status.json`).
