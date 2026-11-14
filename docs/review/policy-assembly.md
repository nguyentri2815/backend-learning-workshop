# Tư duy lắp ráp — bàn giao 10/11/2026

[Mở tab mới](http://localhost:3182/journey/policy?group=create&mode=assembly&assemblyStep=quote&component=controller) · [Ghi Policy / Aggregate](http://localhost:3182/journey/policy?group=create&mode=assembly&assemblyStep=save&component=aggregate) · [Đối chiếu hai Aggregate](http://localhost:3182/journey/policy?group=create&mode=assembly&assemblyStep=save&component=aggregate&assemblyPane=compare).

Link dùng server Workshop tại localhost:3182. Không triển khai hosting bên ngoài. Chạy `npm.cmd run dev` nếu server đã dừng.

## Phạm vi

Tab thứ ba chỉ xuất hiện trong **Khám phá Policy → Tạo mới**. Sáu bước được xem tự do, không cập nhật danh sách checkpoint đã chạy, không mở khóa bước mô phỏng. Mỗi bước có mục tiêu, lý do thiết kế, bản đồ trách nhiệm, vai trò theo ngữ cảnh và bài tập chuyển giao tư duy. Mỗi component phân biệt **Dùng lại / Theo khung / Theo nghiệp vụ** ở mức quyết định; không gắn cả file là phần để copy.

Desktop dùng React Flow và hai panel điều chỉnh chiều rộng. Mobile dùng bộ chọn component và một cột giải thích. Source, hướng dẫn IDE và so sánh chỉ mở theo nhu cầu, ở vùng rộng bên dưới. Diff là phần phụ, sau lời giải thích giống/khác. Màu và syntax dùng theme Workshop.

Mục **Cơ chế này đến từ đâu?** phân biệt cú pháp Java, Spring/thư viện, hợp đồng interface/lớp cha, quy ước workspace và nghiệp vụ Policy. Mỗi nhận định có nút mở đúng bằng chứng. Mở toàn bộ file cuộn tới anchor hiện tại, rồi ghi nhớ vị trí người học tự đọc.

`assemblyStep`, `component`, `assemblyPane`, `assemblyRef`, `assemblyFull` lưu ngữ cảnh đọc riêng với `node`, `at`, `stop`, `walk` của mô phỏng. **Xem khi chạy** chỉ chọn checkpoint liên quan; nút **Trở về Tư duy lắp ráp** phục hồi vùng giải thích/source và vị trí đọc. CodeBlock tái sử dụng bộ nhớ cuộn hiện có.

Nếu người học chủ động chạy tiếp hoặc chọn Quote khác trong thực hành, đường quay về giữ lần chạy mới đó; chỉ phục hồi ngữ cảnh đọc, không khôi phục dữ liệu mô phỏng cũ.

## Sáu bước và mẫu thật

Số dòng dưới đây lấy từ source đang có tại `D:/ALPACA/agent-system`, không lấy từ ảnh. Các file cùng tên Controller được phân biệt module Command/Query ngay trong đường dẫn ở viewer.

| Bước | Trách nhiệm | Mẫu nguồn | Đối chiếu và ý nghĩa |
|---|---|---|---|
| 1. Phát hành từ Quote | Nhận HTTP, lấy quoteId, giao Func, bọc response trong executor | Command `PolicyController.createPolicy` L44 | POST `syncPolicyToCoreByPolicyIdFunc` L34, cùng Controller: cùng vỏ endpoint; khác ý định tạo mới/đồng bộ |
| 2. Kiểm tra Quote | Đọc dữ liệu, quyết định tiếp tục, truyền callback cho helper | `CreatePolicyFunc.exec` L60, `runInternal` L70; `BaseFunc` L63; `LockService.lock` L33 | `CreateQuoteFunc.exec` L74 cho thao tác tạo; `RefreshCounterPolicySyncCoreByIdFunc.exec` L21 cho chính helper kế thừa và callback; khóa/điều kiện nghiệp vụ khác |
| 3. Dựng dữ liệu Policy | Map nguồn → Command, gán riêng, gọi helper | `runInternal` L70, `getPolicyStatus` L195, `fillMissingValue` L204 | `CreateQuoteFunc.exec` L74 / `fillMissingValue` L255: cùng cách tổ chức, khác request/Quote và trường cần tính |
| 4. Ghi Policy | Repository điều phối → reflection → process/apply → store/JDBC/JPA | Lời gọi `save(command)` L115; `AggregateRepository.save` L66; dispatcher L81/L62; `PolicyAggregate.process` L328 / apply L333; JDBC L87 | `QuoteAggregate.process` L276 và `CreateQuoteFunc` gọi save L151: chung khung, khác kiểu dữ liệu và cách áp trường |
| 5. Cập nhật dữ liệu tra cứu | Nhận CreatePolicyEvent, đọc Command theo ID, dựng view | `PolicyWorkflow.createPolicy` L24; đăng ký handler L50; dispatch L32; adapter gọi reflection L33; `PolicySyncViewFunc.exec` L38 | `QuoteWorkflow.createQuoteEvent` L22 và `QuoteSyncViewFunc.exec` L35: cùng khung handler/callback/view và kiểm tra đổi status; Policy thêm mapPayment, Quote thêm productNameSort |
| 6. Xem kết quả | Danh sách đọc view; chi tiết đọc aggregate theo Policy ID | Query `PolicyController.search` L25; `SearchPolicyFunc.doFilter` L38; `FindPolicyByIdFunc.exec` L31 | `SearchQuoteFunc.doFilter` L36 và `FindQuoteByIdFunc.exec` L35: cùng loại thao tác/module; khác nguồn view, objectType, filter và dữ liệu response |

Với lớp nền độc nhất như dispatcher/store, giao diện ghi rõ đó là đối chiếu **tầng điều phối với điểm sử dụng**, không giả làm hai implementation thay thế.

## Bằng chứng và giới hạn

- Đóng gói 60 tham chiếu với file nguyên văn, dòng anchor, HEAD, SHA256 và cờ working tree thay đổi. `SearchPolicyFunc.java` có thay đổi cục bộ sẵn có; viewer nói rõ **Bản làm việc có thay đổi**, không gán nội dung đó cho commit. HEAD agent-service: `f0971ae41170`; shared: `4f500160a493`.
- `exec/runInternal` là cách tổ chức trong workspace. Java không bắt buộc hai method này. Lambda là cú pháp Java; callback do helper gọi. Spring định tuyến/injection và Spring Data cung cấp repository theo hợp đồng interface.
- `PlatformConfig.policyAggregateRepository` tạo `com.alpaca.eventuate.sync.AggregateExtRepository`, kế thừa `io.eventuate.sync.AggregateRepository` và không override save. Repository đồng bộ gọi `processCommand`, rồi `Aggregates.applyEventsToMutableAggregate`. Lớp cha reflection chọn `process(Command)` và `apply(Event)`. **process không tự gọi apply**. Đã đóng gói cả bean, lớp mở rộng, `transformSaveOptions`, store delegate và cấu hình CRUD để kiểm tra chuỗi kết nối.
- Đã truy store → CRUD → `EventuateJdbcAccessImpl.saveWithoutTransaction`: gọi ghi events/entities, gán ID/version và `JpaRepository.save(aggregate)`; `loadRepositoryClazz`/Spring bean nối tới repository cụ thể.
- **`AbstractJdbcAggregateCrud.publish` là hàm rỗng; `EventuateLocalAggregateCrud` không override.** Không dùng lời gọi này để nói event đã gửi broker. Phía nhận đã truy: Flow application → cấu hình Eventuate → bean Workflow / BeanPostProcessor → đăng ký subscription → Kafka lọc/đổi bản tin sang SerializedEvent → store giải mã thành DispatchedEvent → dispatcher → reflection tới handler. Chưa xác định thành phần chuyển bảng events lên Kafka; chưa xác minh broker/configuration runtime, thời điểm commit hay bảo đảm giao event. Có thể mở nguồn tại [phía ghi](http://localhost:3182/journey/policy?group=create&mode=assembly&assemblyStep=save&component=store&assemblyPane=source&assemblyRef=jdbc) và [điểm nhận Kafka](http://localhost:3182/journey/policy?group=create&mode=assembly&assemblyStep=flow&component=workflow&assemblyPane=source&assemblyRef=kafkaSubscribe).
- BaseFunc gọi `TransactionTemplate.execute` bên trong `LockService.lock`; thấy lease mặc định 30 giây và `unlockAsync` trong finally. Chưa kiểm chứng triển khai thư viện Redisson/Spring, transaction manager thực tế hoặc rollback của email/SMS/tác dụng phụ bên ngoài.
- SyncView dùng executor callback và bắt lỗi bên trong. `@Retryable` không chứng minh lỗi trong callback được retry. Không khẳng định HTTP response luôn trước/sau xử lý event. Query còn phụ thuộc bản view, filter và phạm vi; Page.empty cũng có thể là đường bắt lỗi.
- Không sửa backend; không chạy Java, Docker, API nghiệp vụ hoặc DB. Đã đọc README và kiểm tra trạng thái Git trước khi làm, giữ các thay đổi có sẵn; không commit/push.

## File của lượt triển khai

- `src/policy/PolicyAssembly.tsx`: màn giải thích, bản đồ, evidence, compare/diff và hướng dẫn IDE.
- `src/policy/policy-assembly.css`: bố cục responsive và token theme.
- `src/content/policy/assembly.ts`: bước, component, quan hệ, mẫu so sánh, giới hạn, checkpoint và vai trò theo bước.
- `src/content/policy/assembly-source.json`: bằng chứng từ backend hiện tại.
- `scripts/assembly-sources.mjs`: tạo/kiểm tra tham chiếu, dòng và hash từ source chỉ đọc.
- `src/policy/PolicyWorkspace.tsx`: tab thứ ba, điều hướng giữ mô phỏng và đường quay về.
- `src/components/LearningSteps.tsx`: nhãn trạng thái tùy chọn để góc nhìn giải thích dùng “Có thể xem”; giữ mặc định cho bài mô phỏng.
- `fixtures.manifest.json`: hai file nội dung mới đã review.
- `tests/browser/policy-assembly.spec.ts`: kiểm tra nội dung, deep link, trạng thái, source, compare, resize và responsive.
- `README.md` và `docs/review/README.md`: đường tới tab mới và bàn giao.
- Tài liệu này và ảnh `assembly-*.png`. Những file khác đang dirty từ trước không thuộc phạm vi bàn giao này.

## Ảnh review

| | Sáng | Tối |
|---|---|---|
| Desktop 1512 × 1050, ảnh toàn trang | [Sáng](assembly-desktop-light.png) | [Tối](assembly-desktop-dark.png) |
| Mobile 390 × 844, ảnh toàn trang | [Sáng](assembly-mobile-light.png) | [Tối](assembly-mobile-dark.png) |

## Kiểm tra

Kết quả chạy thực tế ngày 10/11/2026 trên frontend tại localhost:3182:

| Kiểm tra | Kết quả |
|---|---|
| `node scripts/assembly-sources.mjs --check` | 60/60 tham chiếu khớp source backend hiện tại, gồm nội dung, hash, commit, trạng thái file và dòng |
| `npm.cmd run verify:fixtures` | 32/32 file nội dung đóng gói hợp lệ |
| `npm.cmd run typecheck` | Đạt |
| `npm.cmd run build` | Đạt; Vite vẫn báo một số chunk trên 500 kB, gồm tab Assembly được lazy load |
| Playwright, chín bộ liên quan | **53/53 đạt**, 4,2 phút |

Chín bộ đã chạy: `policy-assembly`, `policy-execution`, `policy-navigation`, `policy-reading`, `policy-issuance-overview`, `workshop-appearance`, `policy-reader-preferences`, `policy-trace-modal`, `policy-practice-panels`.

Riêng tám test Assembly kiểm tra: toàn bộ liên kết nội dung/checkpoint; deep link cả sáu bước với hai mẫu thật; cấu hình implementation và anchor khi mở toàn bộ file; giữ Quote mới chủ động chọn; desktop/mobile giữ dữ liệu, điểm dừng, tiến độ và vị trí cuộn code qua theme, reload và đường quay về; xem checkpoint chưa mở khóa; IDE, kết nối source, resize và diff; giữ tiến độ người học chủ động chạy tiếp. Node và thao tác xem không thêm checkpoint đã chạy. Bốn ảnh review phía trên lấy từ Playwright.
