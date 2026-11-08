# Khám phá Policy — hai tầng tab và bài Tạo mới

Phần **Tạo mới → Nhìn toàn cảnh** đã được bổ sung nguồn Quote, Flow chính và bốn đường phát hành. Xem [bản bàn giao toàn cảnh mới](POLICY-CREATION-OVERVIEW-HANDOFF.md) cho đường review và giới hạn phân tích hiện tại. Snapshot hiện có 142 excerpt; các con số 102/29 dưới đây ghi lại lượt kiểm tra của bản hai tầng tab trước đó.

Đối chiếu source ngày 08/11/2026 tại `D:\ALPACA\agent-system`. Thay đổi nằm trong Workshop; dữ liệu trên màn hình là mẫu. Không chạy Java/API/DB để suy ra kết quả runtime.

## Link và đường bấm review

- [Mở từ đầu: Tạo mới → Nhìn toàn cảnh](http://localhost:3182/journey/policy).
- [Review bản build local](http://localhost:3183/journey/policy).
- [Mở workspace tại bước đọc Quote](http://localhost:3182/journey/policy?group=create&mode=steps&node=validate).
- [Mở thẳng ánh xạ với Quote tương lai](http://localhost:3182/journey/policy?group=create&mode=steps&node=map&quote=QUOTE-LEARN-102&sim=checked&ref=create-customer).
- [Nhánh tạo trùng](http://localhost:3182/journey/policy?group=create&mode=steps&node=validate&quote=QUOTE-LEARN-103).
- [Bản đồ Cập nhật](http://localhost:3182/journey/policy?group=update).
- [Đổi status của Policy hiện có qua Core](http://localhost:3182/journey/policy?group=status&flow=core-status).

1. Vào **Tạo mới → Nhìn toàn cảnh → Bắt đầu lần code**. Chọn Quote Mai hoặc Nam, xem Quote và request `POST /policy/create/{quoteId}`, body trống.
2. Bấm **Gửi request mẫu → lần CreatePolicyFunc**. Có thể bấm trực tiếp `quoteRepository` trong code để mở repository, rồi `QuoteAggregate → quote_aggregate`. Bấm **Dùng Quote ở MappingUtils.mapObject** để thấy chỗ dữ liệu được dùng tiếp.
3. **Chạy kiểm tra Quote → Ánh xạ dữ liệu mẫu → mở chỗ tạo Policy**. Ví dụ `customerModel.name = Khách hàng mẫu Mai`, `type=PERSONAL(0)` đi qua `fillMissingValue` thành `Policy.customerName`. `quoteType` thành `policyType`, `Quote.id` thành `quoteId`.
4. **Tạo Policy mẫu → Theo dõi CreatePolicyEvent**. Command có `POL-FROM-QUOTE-LEARN-101`; view chưa được xử lý trong mô phỏng. Code áp dụng event và JPA save có thể mở riêng.
5. **Cho Flow xử lý event → ghi view**. `PolicyWorkflow.createPolicy → PolicySyncViewFunc → executor → InternalSPCommandApi → PolicyViewRepository.save`. Đây là mốc do người học chủ động chạy; không khẳng định độ trễ hoặc thứ tự tương đối với response ở hệ thống thật.
6. **Tìm Policy vừa tạo trong Danh sách → Chi tiết**. Giữ cùng ID, `S-DEMO-CREATED-101`, tên Mai, phí 1.800.000 VND. Query chỉ nhận Policy mẫu này sau mốc view; chi tiết đọc aggregate và một đối tượng POLICY mẫu. Mã/ID/version là quy ước fixture, không bắt chước thuật toán sinh mã thật.
7. Đổi qua **Nhìn toàn cảnh / Làm lại từng bước**, reload, Back/Forward, chuyển main tab hoặc chặng rồi trở lại. URL giữ Quote, phase, Policy ID, điểm đọc, tham chiếu và bộ lọc. Code viewer nhớ vị trí cuộn; cây nhớ thư mục đóng/mở và panel nhớ độ rộng trong phiên.
8. Chọn Quote có Policy RUNNING hoặc Quote không tồn tại, chạy kiểm tra và quan sát exception tại dòng 77/63. Không có save hay event tạo trong lượt thất bại. Mở thẳng bước sau khi chưa có dữ liệu sẽ có nút về thao tác cần hoàn tất. Kiểm tra lại Quote vừa tạo cũng bị chặn phát hành trùng.

## Kết quả rà Cập nhật và Đổi trạng thái

Các đường dẫn ngắn dưới đây thuộc `workspaces/agent-service/<module>/src/main/java/com/alpaca/agent/`. Command ở module `1-agent-command-service`; aggregate ở `4-agent-shared-domain`; Flow ở `2-agent-flow-service`. Giao diện có nút mở source gốc, module, số dòng và commit cho từng bằng chứng.

| Thao tác | Tác nhân kích hoạt | Dữ liệu/trạng thái thay đổi và điều kiện | File/method chứng minh nơi ghi |
| --- | --- | --- | --- |
| Đồng bộ điều chỉnh nghiệp vụ từ Core | `POST /policy/sync-endorsement` hoặc `/internal/policy/sync-endorsement` | Policy phải tồn tại theo mã tách từ `endorsementCode`, Core trả success + data; khóa Policy. `changes` điều khiển ngày hiệu lực/hết hạn, kênh phân phối; key `customer` điều khiển cập nhật khách hàng; còn có giá/phí, agency, `haveEndorsement`. | `function/policy/core/SyncEndorsementFromCoreFunc.java:56` (`exec`), `:150` (`runInternal`, update tại 177), `:244` (`fillChangeToCommand`); `domain/PolicyAggregate.java:363` (`process/apply(SyncEndorsementForPolicyEvent)`). |
| Cập nhật đường dẫn quyền dữ liệu | API `/sale-unit/update-permission-data-quote-and-policy/{quoteId}`; event tạo/xóa quan hệ đơn vị bán → queue | SaleUnit tồn tại; Policy liên kết có path và path khác path mới. Đổi `saleUnitPath`, `saleUnitPathLevel`, `pathSaleUnitIds`, `updatedDate`. Tên API `quoteId` lệch với function dùng đầu vào như `saleUnitId`. | `workflow/SaleUnitWorkflow.java:355`; `action/QueueHandler.java:453`; `function/quote/UpdatePermissionDataQuoteAndPolicyFunc.java:70` (`execInternal`, update tại 85); `PolicyAggregate.apply(UpdateDataPermissionPolicyEvent):516`. |
| Chuyển dữ liệu đường dẫn đơn vị bán | `GET /sync-to-view/migrate-data-quote-and-policy` → queue | Quote và SaleUnit tồn tại, `Quote.policyId != null`; khóa Policy. Đổi `pathSaleUnitIds`, `saleUnitPathLevel`. | `controller/SyncDataController.java:24`; `function/sync/MigrateDataQuoteAndPolicyFunc.java:29` (`exec`, update tại 57); `PolicyAggregate.apply(UpdateSaleUnitPathIdsPolicyEvent):507`. |
| Ghi checkout và ghi nhận thanh toán SP | `POST /payment/pay-for-policy`, `/payment/paid-for-policy` | Process phải tồn tại, phương thức online hợp lệ, qua kiểm tra flow trước ghi. Checkout: mã/ngày yêu cầu, orderNo, paymentProcessId, lịch sử/cờ xử lý. Sau paid: `paidTime`, `paymentStatusFromSP`, `updatedDate`. | `BasePaymentPolicyProcessor.updateCheckoutInfoPolicyList:90`; `OnlinePolicyPaymentFlow.afterPaid:71`; `PolicyAggregate.apply(UpdateCheckoutInfoEvent):450`, `apply(FinishPolicyEvent):474`. **Không đổi `Policy.status`.** |
| Bổ sung metadata tài liệu | `POST /policy/upload-multiple-document/{policyId}` | Policy tồn tại; qua nhánh sync Core nếu cần. Thêm `viaUploader`, đổi `viaUploaderStatus`, `updatedDate`. | `PolicyUploadMultipleDocumentFunc.runInternal:48`; `PolicyAggregate.apply(UploadDocumentEvent):388`. **Trạng thái tài liệu riêng.** |
| Tính lại status theo ngày cho Policy hiện có | `ScheduleService → RabbitMQ → QueueHandler` | Tối đa 10 ID, bỏ qua thiếu/TERMINATED/status không đổi. Gán 0 trước hiệu lực, -1 sau hết hạn, 100 còn lại; `updatedDate` đổi. | `PolicyAutoUpdateStatusFunc.runInternal/getPolicyStatus:47`; `PolicyAggregate.apply(UpdatePolicyStatusEvent):378`. |
| Nhận status từ điều chỉnh Core cho Policy hiện có | Hai API sync-endorsement ở trên | Cùng điều kiện tồn tại + Core success/data + lock. `command.status = endorsementInfoResponse.status` tại dòng 172, rồi update tại 177. Không thấy danh sách cặp chuyển trạng thái hợp lệ trong function. | `SyncEndorsementFromCoreFunc.runInternal:172`; `PolicyAggregate.apply(SyncEndorsementForPolicyEvent):368`; Flow `PolicyWorkflow.syncEndorsementFromCore:43`. |
| Gán status **ban đầu** khi tạo | API create; các nhánh duyệt thanh toán, đã trả online hoặc offline | Tạo mới `CreatePolicyCommand`, tính status theo ngày rồi **save**. Tách khỏi chuyển trạng thái Policy cũ. | `CreatePolicyFunc:87/115`; `ApprovePaymentFunc:166/194`; `ApprovePaymentNowFunc:200/228`; `CreatePolicyForPaymentOnlineFunc:98/170`; `CreatePolicyForCash:111/194`; `PolicyAggregate.apply(CreatePolicyEvent):333`. |

Các lệnh update có đường lưu thật qua `workspaces/1-shared/shared-event-sourcing/.../EventuateJdbcAccessImpl.updateWithoutTransaction`: `JpaRepository.save` tại dòng 246 ở nhánh có version; nhánh không truyền version cũng gọi JPA save. `PolicyAggregate.loadRepositoryClazz()` chọn `PolicyRepository`, ánh xạ `policy_aggregate`. Tạo mới có `saveWithoutTransaction` và JPA save tại dòng 126.

### Những phần chưa thể kết luận

- `/internal/policy/correct-created-date` đã lần tới lệnh ghi. `CorrectCreatedDatePolicyFunc` chọn hồ sơ `createdDate IS NULL`, nhưng command lại lấy chính `getCreatedDate()` đang null. Không có bằng chứng đường này sửa được ngày hợp lệ; giao diện ghi rõ cần xác nhận.
- `CreatePolicyWithoutLockAndTransactionFunc` có setStatus và save tạo mới, nhưng chưa thấy caller trong workspace Java đã rà. Không tự gắn vào API/event/job.
- `TERMINATED=-100` tồn tại trong `PolicyStatus`. Đường endorsement nhận status từ Core có thể nhận giá trị này nếu Core trả về; chưa xác minh Core quyết định chấm dứt thế nào, chưa thấy API người dùng chấm dứt Policy riêng. Không vẽ một đường 100 → -100 có quyền/điều kiện tự giả định.
- `/policy/get-policy-have-update-status` chỉ đếm ứng viên, không đổi status. `/policy/sync-policy-data` làm lại view, không phải API sửa trường nghiệp vụ aggregate.
- `SyncPolicyStatus`, `viaUploaderStatus`, `paymentStatus/paymentStatusFromSP`, trạng thái transaction và trạng thái payment process là các trục riêng. Các API sync Core/tài liệu/ghi nhận payment không được coi là đổi status hợp đồng khi không có gán và lưu `Policy.status`.
- Chưa thấy API sửa tổng quát các trường hợp đồng bởi người dùng. Các bài Cập nhật đặt tên theo đúng thao tác đã xác minh.

## Source và kiểm tra

- `source.json`: 102 excerpt nguyên văn, số dòng gốc, SHA-256 file/excerpt sau chuẩn LF. Agent commit `f0971ae41170c84bb883be92cd1ebd6632010302`; shared commit `4f500160a4935cb6e6575a436fb005306dd9fee0`. Repo và commit còn lại hiển thị trong phần provenance.
- `node scripts/verify-policy-source.mjs --root D:\ALPACA\agent-system` đối chiếu toàn bộ snapshot bằng thao tác đọc; không sửa upstream.
- `npm.cmd run build`; `npm.cmd run verify:fixtures`.
- Browser: Policy, Workshop dùng chung, G12 và bundled fixtures; bao gồm mở link trực tiếp, giữ ngữ cảnh hai tab con, Back/Forward/reload, đường tạo hoàn chỉnh, nhánh thất bại, phân trang/ID, reset riêng namespace và mobile 390px.
- Kết quả: **25/25 kiểm tra qua** trên bản build local; build/TypeScript, 29 fixture và toàn bộ 102 excerpt đối chiếu source đều qua. Ảnh review: [toàn cảnh](review/policy-overview.png), [workspace](review/policy-workspace.png).
- Lệnh chạy trên bản build: đặt `PREVIEW_URL=http://localhost:3183`, `WORKSHOP_BROWSER_CHANNEL=msedge`, rồi `npx.cmd playwright test tests/browser/policy-reading.spec.ts tests/browser/workshop.spec.ts tests/browser/g12-lifecycle.spec.ts tests/browser/bundled-fixtures.spec.ts --timeout=120000`. Timeout tổng cho mỗi test tăng để không lẫn thời gian tải trang khi máy đang build với lỗi chức năng; timeout assertion giữ nguyên.

Cuối bài giữ câu hỏi: **“Khi tạo yêu cầu bồi thường, dữ liệu đến từ đâu, điều kiện nào chặn tạo và lúc nào người dùng thấy bản ghi?”** Đây là câu hỏi cần xác nhận riêng khi thiết kế Claim.
