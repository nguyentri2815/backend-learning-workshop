# Thiết kế lại: làm từng bước để chạy dự án

> Hồ sơ phiên bản 04/11. UX hiện tại đã thay bằng [7 bước / 23 thao tác cho người mới, ngày 05/11](PROJECT-SETUP-BEGINNER-UX.md); sơ đồ mặc định thu gọn.

Ngày: 04/11/2026. Chỉ thay hành trình “Hiểu và chạy dự án”; Policy/Claim giữ nguyên. Tài liệu A/B trước đây trở thành hồ sơ tham chiếu, không còn là cấu trúc điều hướng chính.

## Thiết kế đã đưa vào source

Một đường hành động có 7 bước, tổng cộng 20 việc trong checklist:

1. Kiểm tra source workspace.
2. Chuẩn bị công cụ và IDE.
3. Kiểm tra cấu hình và kết nối.
4. Chạy dịch vụ phụ thuộc.
5. Build module cần làm.
6. Chạy và kiểm tra ứng dụng.
7. Sẵn sàng làm task.

Bên trái là graph tương tác bằng `@xyflow/react@12.12.0`; bên phải là hướng dẫn của bước đang chọn. Bảng hướng dẫn chỉ có mục tiêu một câu, checklist, cách làm của việc đang chọn, đạt khi và nếu chưa đạt. Chọn một việc trong checklist để xem lệnh/thao tác, nơi làm, thông tin cần đọc và hướng xử lý. Tick không tự nhảy sang việc khác làm mất vị trí đọc.

“Gặp repo khác thì tìm ở đâu?” là phần thu gọn, chỉ nêu cách tìm thông tin phục vụ bước đó. “Xem cách đã xử lý trong repo này” mở dialog lịch sử/file/bằng chứng; mã S chỉ xuất hiện tại đây hoặc trong liên kết cũ. Không có hai mode lịch sử A/B trên màn hình chính.

Trên màn hình rộng tối đa 1100px, dùng danh sách 7 bước có số và tên; chọn bước cuộn tới hướng dẫn, không phải kéo graph. Có Tiếp tục bước đang làm, Xem toàn cảnh, Về bước đang làm, Bước tiếp/Bước trước. Thứ tự là lộ trình đề xuất, không phải khẳng định dependency startup cứng; người học có thể đọc/build module khi còn chờ thông tin infra.

## Graph đã hoàn tất theo ngoại lệ dependency được duyệt

Người dùng đã cho phép bổ sung riêng `@xyflow/react` và dependency bắt buộc. Đã đọc cả `quotation-workshop/package.json` và `quotation-workshop/package-lock.json`: cùng khai báo chính xác `12.12.0`. Repo học dùng đúng bản này trong package.json, lockfile và bản cài đặt. Không import qua node_modules của repo gốc.

Chỉ package.json/lockfile của backend-learning-workshop được sửa. Đối chiếu mọi entry đã có trong lockfile trước và sau: 0 phiên bản cũ thay đổi, 0 entry cũ bị xóa. Lockfile thêm 20 entry cho React Flow và cây dependency bắt buộc của nó; không có thư viện layout mới. Hai file package/lockfile của quotation-workshop giữ nguyên hash.

Desktop dùng ReactFlowProvider/ReactFlow với 7 custom node và 6 cạnh smoothstep có mũi tên. Layout cố định hai cột: 1→2, 2↓3, 3←4, 4↓5, 5→6, 6↓7. Node không kéo đổi cấu trúc; có nút HTML để click hoặc chọn bằng bàn phím. Node hiển thị số/tên hành động, trạng thái checklist, số việc đã tick, nhãn Đang xem/Tiếp theo. Mũi tên ra từ bước đang chọn được tô rõ hơn. Không tự thêm dependency startup chưa có bằng chứng.

Footer nêu điều cần chuẩn bị của bước đang xem và bước tiếp theo. Source/JDK là điều kiện để build; cấu hình và tập service đúng theo task là điều kiện để chạy app. Thứ tự trình bày không khóa việc đọc/build khi thông tin runtime chưa đầy đủ. Toàn bộ 20 việc checklist trong `action-guide.ts` giữ nguyên hash so với trước phần tích hợp graph.

### Quy tắc viewport

- Lần mở đầu: chờ đủ kích thước node/handle, khôi phục viewport hợp lệ đã lưu; chưa có thì lấy bounds của 7 node để đặt vừa canvas một lần.
- Tick checklist, đổi bước, mở/đóng lịch sử hoặc file, Back/Forward và reset checklist không tự fit hoặc tự center.
- Kéo nền để pan; cuộn hoặc nút +/− để zoom. Zoom trong khoảng 45%–170%.
- “Xem toàn cảnh” tính lại viewport vừa 7 node theo kích thước canvas hiện tại; tỷ lệ tối đa 100%.
- “Về bước đang làm” đưa node đang chọn vào giữa, giữ zoom hiện tại. “Tiếp tục bước đang làm” vẫn chọn việc chưa xong theo tiến độ.
- Lưu viewport cuối sau thao tác trong bộ nhớ và sessionStorage `backend-learning-workshop.setup-flow-viewport.v1`. Rời hành trình, reload hoặc chuyển mobile rồi trở lại desktop khôi phục vị trí đã lưu. Storage hỏng hoặc zoom ngoài giới hạn dùng toàn cảnh ban đầu.
- Trên mobile, “Xem toàn cảnh” cuộn về danh sách; “Về bước đang làm” cuộn tới hướng dẫn. Không yêu cầu pan graph để đọc nội dung.

## Đối chiếu repo thật ở lượt thiết kế lại, trước phần graph

- Đọc lại root build.gradle/settings.gradle/wrapper: toolchain Java 21, Wrapper 8.14.3; root bootJar disabled, subprojects vẫn áp Spring Boot.
- Đọc lại config Command/Flow/Query: Command default datasource remote; dev local/platform_event. Flow default local 5432/sale_platform, dev platform_event. Query default 5433/sale_platform, dev 5432/platform_event.
- Đọc tên/container ports Compose: có tên cố định; Debezium trong Compose map 8086→8083, khác instance riêng lịch sử 18086→8083.
- Script git-cmd.sh vẫn trỏ agent-system, init-shared.sh trỏ sale-system; Swagger folder vẫn thiếu khi kiểm tra.
- Chưa thấy khai báo bootRun/composeUp/dependsOn trong các file Gradle root và nhóm app đã tìm. Đây là khảo sát source có giới hạn, không chứng minh mọi dependency runtime.
- Không chạy Java/Gradle/Docker/DB/migration hoặc HTTP API backend. Lệnh trong hướng dẫn là để người học tự thực hiện ngoài UI. Không nhập full config, private endpoint hoặc credential vào frontend.

## Cách giữ đúng thông tin còn thiếu

Tại từng việc liên quan, hiện 3 thông tin: thiếu gì, ảnh hưởng thao tác nào và nơi/cách xác minh. Không có startup command sẵn sàng chạy khi profile/DB/topology/CDC chưa chốt. Không tạo payload hoặc API expected giả.

Chưa có tập service tối thiểu cho mọi loại task: người học chọn một module; hướng dẫn build/port/Git dùng module đó, không mặc định chạy cả 5. Khi đổi module, các tick liên quan tới cấu hình/infra/build/run/task được bỏ để kiểm tra lại đúng phạm vi.

Tách tiêu chí build, process/port, HTTP và nghiệp vụ ngay trong việc kiểm tra app. Snapshot runtime báo cáo chỉ nằm trong chi tiết lịch sử có ngày/nguồn, không thành trạng thái live.

## Tiến độ và điều hướng

Key mới: `backend-learning-workshop.setup-checklist.v1`. Lưu các item đã tự kiểm tra, dấu cần bổ sung, bước đang làm và module chọn. Không migrate tick của bài minh họa hoặc UI A/B cũ sang checklist mới.

Bốn trạng thái: Chưa làm / Đang làm / Đã tự kiểm tra / Cần bổ sung thông tin. Người học ghi nhận dấu cần bổ sung; checkbox không mở khóa startup command hoặc tự xác minh máy thật. Chỉ nhắc quy tắc tự khai một lần trên màn hình chính.

Reset 7 bước giữ Policy/Claim, dữ liệu học cũ và tùy chọn hiển thị. URL có step/check/panel/file/evidence và điểm quay lại; các link S/R cũ được chuyển sang bước hành động tương ứng. Main vẫn được giữ khi mở dialog nên lựa chọn không bị mất.

## Kiểm tra hoàn tất sau tích hợp graph

- `npm.cmd run build`: pass, bao gồm `tsc --noEmit`. Vite còn cảnh báo chunk >500 kB; build hoàn tất.
- `npm.cmd run test:browser`: lượt cuối **21/21 pass** trên Chrome (42.9 giây). Log: `.verification/graph-browser-final.log`.
- **5 bài graph mới** trong `tests/browser/setup-graph.spec.ts`: đo transform thực của React Flow, kiểm tra 7 node/6 cạnh hiển thị và không chồng/cắt node, click/bàn phím đồng bộ URL/checklist/tiến độ; zoom bằng nút/cuộn và drag pan; overview/focus; giữ viewport qua tick, file/lịch sử, chọn node, Back/Forward, reload, rời hành trình; chuyển desktop/mobile rồi trở lại; viewport lưu hỏng và reset.
- 16 bài checklist/regression: 4 trạng thái, storage/reset, module-scoped command/copy, khoảng trống, file/return/deep link, Policy mô phỏng, Claim source/diff, điều hướng và mobile. Không dùng các bài cũ làm bằng chứng thay cho 5 bài graph mới.
- Một lượt trước có 20/21 pass: trang tổng quan trắng do request module App.tsx bị `net::ERR_CONNECTION_REFUSED` theo trace. Kiểm tra lại trang trong context mới không có lỗi; chạy lại trọn bộ đạt 21/21. Không đổi assertion hoặc tăng timeout để bỏ qua.
- Chụp/đọc ảnh desktop 1512px và mobile 390px; kiểm tra thêm canvas ở 1366/1280/1101px không tràn ngang, đủ 7 node sau Xem toàn cảnh. Context chụp ảnh mới không có pageerror hoặc console warning/error.
- `npm.cmd run verify:originals` sau phần graph: Product 44 file, Workshop 1937 file, 0 file đổi và trạng thái Git giữ nguyên. Root Java cùng 10 nested repo đã được kiểm tra ở lượt thiết kế lại; phần graph không thao tác repo Java.
- Hash `action-guide.ts`, dữ liệu journey, PolicyPreview, JourneyWorkspace và package/lockfile quotation-workshop giữ nguyên so với trước tích hợp graph. Nội dung 20 việc checklist và hai hành trình còn lại không đổi.

## Review hiện tại

URL: http://localhost:3182/journey/environment

Đường ngắn: mở toàn cảnh → click node 2 và chọn việc Java → thử zoom/pan → tick một việc → mở lịch sử/file rồi Về checklist → Về bước đang làm → Xem toàn cảnh → node 5 chọn module/build → node 6 xem điều kiện thiếu. Dùng Back/Forward để kiểm tra chọn bước, không mất viewport. Trên mobile chọn bước từ danh sách để tới hướng dẫn.

Ảnh sau tích hợp React Flow: toàn cảnh (artifact cục bộ: `../.verification/setup-graph-overview.png`), bước Java/IDE (artifact cục bộ: `../.verification/setup-graph-tools.png`), mobile (artifact cục bộ: `../.verification/setup-graph-mobile.png`).

Các phần còn cần xác nhận là thông tin vận hành Java/profile/DB/topology/CDC/auth/API đã nêu ở từng checklist, không phải tính năng graph đang chờ triển khai. Lượt này chỉ chạy FE và browser; không chạy Docker/database/migration/Java services, không commit/push/deploy.
