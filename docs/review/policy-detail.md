# Chi tiết Policy · bàn giao

[Review ảnh đối chiếu](http://localhost:3182/docs/review/policy-detail.html) · [Preview](http://localhost:3182/journey/policy?group=detail&mode=overview) · [Mở bằng ID](http://localhost:3182/journey/policy?group=detail&mode=steps&detailId=POL-LEARN-003) · [ID không tìm thấy](http://localhost:3182/journey/policy?group=detail&mode=steps&detailId=POL-NOT-FOUND).

## Hành trình chung

Giữ bốn bước đã đề xuất. Đây là ranh giới dữ liệu/quan sát của bài học; không biến từng lớp Java thành một bước nghiệp vụ.

| Bước | Đầu vào → thao tác/quan sát → đầu ra | Checkpoint |
| --- | --- | --- |
| Mở hợp đồng | `PolicyListResponse.id` hoặc ID trực tiếp → mở hợp đồng → path ID được Controller nhận, không có JSON body | `detail-api` |
| Tìm hồ sơ hợp đồng | Policy ID → lần `findById`, kiểm tra Optional → PolicyAggregate hoặc ServiceException | `detail-find`, `detail-record` |
| Lấy thông tin liên quan | Hồ sơ chính → đọc đối tượng, map DTO, ghép thanh toán → các nhóm của PolicyDetailResponse | `detail-objects`, `detail-objects-query`, `detail-map`, `detail-payment` |
| Hiển thị chi tiết | DTO → Controller bọc `WrapResponse.ok` → từng vùng UI mô phỏng, bấm vùng để mở field/source | `detail-return`, `detail-response` |

Hai đường vào hội tụ ở cùng endpoint. Sơ đồ có nhánh không tìm thấy và nhánh có hồ sơ nhưng thiếu đối tượng/checkout. Mỗi điểm vào có nút thực hành; nút quay lại giữ đúng bước đang học. Lớp checkpoint nằm trong phần mở rộng theo node.

ID được giữ qua dòng Danh sách → request → `findById` → `response.data.id`. Bàn giao lưu vị trí Danh sách trước khi rời màn. Quay lại giữ `listRequest`, draft chưa gửi, danh tính đã gửi, trang, sort, dòng và vị trí source. Không gửi filter hoặc page sang GET Chi tiết. Nhập ID mới rồi bấm Mở bắt đầu lượt mới; chọn bộ dữ liệu khám phá trong lắp ráp không đổi lượt thực hành.

`detailStop` ghi checkpoint cuối đã chạy; `detailCursor` là nơi đang dừng, có thể ở đầu bước mới chưa chạy; `node/point` là nơi đang xem. Xem lại source, bấm nhóm thông tin hoặc chuyển chế độ không thực thi checkpoint. Quy tắc mở bước/tiến/lùi dùng chung `checkpointNavigation` với Tạo mới và Danh sách.

## Component dùng chung và khác biệt nghiệp vụ

Đã mở lại Tạo mới ở toàn cảnh, debug `CreatePolicyFunc.exec:L61`, bước 2 ở Suy luận/Phối hợp/Chọn mẫu, source A/B và hai tab cửa sổ workspace. Đã đọc lịch sử commit `32c790b`, tài liệu `POLICY-DIRECT-PRACTICE-HANDOFF.md`, `POLICY-CREATION-OVERVIEW-HANDOFF.md`, các component và test tương ứng.

| Vùng | Component dùng chung |
| --- | --- |
| Toàn cảnh / công cụ / chú giải / đường học | `LearningOverviewFrame`, `LearningJourneyDiagram` |
| Thanh bước và điều khiển checkpoint | `LearningSteps`, `CheckpointActionBar`, `checkpointNavigation`, `useCheckpointToolbar` |
| Cây file / code / vị trí trước / biến | `CheckpointCodeWorkspace`, `SourceEditorColumns`, `PracticeTreePositions`, `CodeBlock`, `CheckpointVariables`, `PracticeTools`, `PracticeSidePanel` |
| Suy luận / tiến trình quyết định / dữ liệu / Phối hợp | `LearningAssemblyLesson`, `LearningTechnicalReference` |
| Hai khung mẫu / sao chép / A/B / full file / sơ đồ | `LearningPatternWorkspace`, `AssemblySourceView`, `LearningSources` |
| Điều hướng triển khai | `implementationPosition`; bài tập và fixture của Chi tiết độc lập |

Chi tiết thêm adapter dữ liệu `detail-learning-data` và `read-pattern-model`, không thêm một bộ hiển thị lắp ráp riêng. `LearningReadSource` nhận catalog, focus, prefix URL và dấu thực thi; bên trong dùng đúng các cột source/điểm trước/code của bài chuẩn. Form ID và các nhóm response thay Quote/form tìm kiếm vì đầu vào và kết quả nghiệp vụ khác. Sơ đồ Chi tiết dùng vị trí node dạng hai cột, tập trung các lần bàn giao hiện tại; toàn bộ file hỗ trợ vẫn nằm trong cây workspace để mở đúng source. Đây là dữ liệu bố trí của cùng renderer, tránh thu nhỏ sơ đồ vì một cột dài các helper. Bài triển khai bỏ các đoạn thuộc bước đang học, giữ các phần khác sẵn có theo snapshot. Mẫu tham khảo là Chi tiết Quote đã xác minh, có cảnh báo cụ thể về loại đối tượng, lỗi và nhánh thanh toán khác.

## Source đã xác minh

Root: `D:/ALPACA/agent-system`. Các đường dưới đây tương đối với `workspaces/agent-service`, trừ helper Shared. Snapshot có **23 file Java đầy đủ**, giữ số dòng, commit từng repository, trạng thái modified và SHA256 bytes gốc trong `src/content/policy/detail-source.json`. Script `scripts/extract-policy-detail-source.mjs` chỉ đọc source.

| Bàn giao / điều kiện | File, method, dòng |
| --- | --- |
| Route service đầy đủ `GET /policy/{id}` | `1-agent-command-service/.../controller/PolicyController.java:L27` (`@RequestMapping("policy")`), L48–51 `paymentMethod`, L50 gọi `FindPolicyByIdFunc.exec(id)` trong `CompletableFuture.supplyAsync`, rồi `WrapResponse.ok`. Tên method là `paymentMethod` dù đây là route Chi tiết. |
| Nhận ID / đọc chính bắt buộc | `1-agent-command-service/.../function/policy/FindPolicyByIdFunc.java:L31–32`, `exec(String policyId)` → `policyRepository.findById(policyId)`; `4-agent-shared-domain/.../repository/PolicyRepository.java:L20` kế thừa `JpaRepository<PolicyAggregate,String>`; `.../domain/PolicyAggregate.java:L60–62` ánh xạ `policy_aggregate`. |
| Không tìm thấy | `FindPolicyByIdFunc.java:L32`: `orElseThrow(new ServiceException(POLICY_NOT_EXIST))`; `agent-shared/.../common/PlatformErrorCode.java:L134` = `AGENT.POLICY_NOT_EXIST`; Shared `shared-base/.../exception/ServiceException.java:L3–6`. Dừng trước L33, không đọc đối tượng hoặc tạo response thành công. |
| Đọc đối tượng bắt buộc khi đã có hồ sơ | `FindPolicyByIdFunc.java:L33` → `4-agent-shared-domain/.../repository/InsuranceObjectRepository.java:L11–13`, lọc `entityId=policyId`, `objectType=POLICY`, `deleted=false`, `ORDER BY id asc`. `agent-shared/.../constant/InsuredObjectType.java:L5`: POLICY=1. `InsuranceObjectAggregate.java:L35–43,L51,L66` → `insurance_object_aggregate`. |
| Ánh xạ chính và đối tượng | `FindPolicyByIdFunc.java:L34–35`; Shared `shared-base/.../util/MappingUtils.java:L16–17` dùng STRICT, L22–27 `mapList`, L61–63 `mapObject`. Danh sách truy vấn rỗng được map thành `[]`, không có guard ném lỗi vì rỗng tại Func. |
| Thanh toán luôn ghép khi có hồ sơ | `FindPolicyByIdFunc.java:L36,L40–54`, `buildPaymentInfoPolicyModel`. Chỉ lấy trường từ PolicyAggregate; không gọi repository/API thanh toán. Tổng phí từ `insuranceTotalAmount`, trạng thái từ `paymentStatus/paymentStatusFromSP`, thời điểm từ `paidTimeFromCore/paidTime`. |
| Các nhánh đọc trường có điều kiện | `FindPolicyByIdFunc.java:L43–46`: `checkoutInfo → tx → createdAt`, thiếu một mắt xích trả null. L57–63 `getPaymentOrderNo`: SmartPay/VNPay/PayMe dùng `checkoutInfo.reqPaymentId`, còn lại dùng `checkoutInfoForPolicy.reqPaymentId`; thiếu checkout tương ứng trả null. Tập online tại `agent-shared/.../common/ConstantPayment.java:L36–39`. Không coi thiếu checkout là không tìm thấy Policy. |
| DTO và wrapper | `agent-shared/.../response/policy/PolicyDetailResponse.java:L28` id, L85 customerName, L93 status, L97 policyCode, L119 insuredObjects, L170 paymentInfoPolicyModel. `.../response/insruance/InsuranceDetailResponse.java:L20–29` và `.../model/payment/PaymentInfoPolicyModel.java:L13–21`. Shared `shared-base/.../base/service/response/WrapResponse.java:L32–37` đặt `success=true,statusCode="200",data`. |
| Danh sách dùng cùng ID, khác nguồn đọc | `agent-shared/.../response/policy/PolicyListResponse.java:L15` id. Query `3-agent-query-service/.../function/policy/SearchPolicyFunc.java:L104–109,L112–119` đọc `policy_view_aggregate`, map sang Page<PolicyListResponse>; `5-agent-shared-entity/.../repository/QueryCustomRepository.java:L26–39`. Chi tiết đọc Command, không đọc lại view. |
| Kiểm tra phạm vi | `PolicyController.paymentMethod` và `FindPolicyByIdFunc.exec` không có điều kiện SaleUnit hay so sánh danh tính với hợp đồng. `1-agent-command-service/.../config/ResourceServerConfiguration.java:L17–31`: local=true permitAll, local=false authenticated, opaque token. Không suy ra bảo đảm quyền theo từng hồ sơ từ phạm vi tìm kiếm. |
| Lỗi HTTP | Shared `shared-webmvc/.../common/GlobalWebExceptionHandle.java:L27–38` có handler BaseException trả 422 và wrapper lỗi. Workshop chỉ khẳng định exception tại Func; chưa chạy để xác nhận đường exception qua CompletableFuture và HTTP thực tế. |
| Mẫu tham khảo | `1-agent-command-service/.../function/quote/FindQuoteByIdFunc.java:L35–45`: đọc Quote, đối tượng loại QUOTE, chỉ đọc Policy theo policyCode khi quote.policyCode != null. L48–63 ghép thanh toán có fallback mã khác Chi tiết Policy. Không sao chép quy tắc này vào bài Policy. |

Module là `1-agent-command-service`; cấu hình `src/main/resources/application.yml:L2–3` khai báo cổng 9901. Không có context-path trong bốn application YAML đã đọc; route ở mức service là `/policy/{id}`. Chưa xác nhận prefix qua gateway/deployment.

FE tìm được tại `D:/ALPACA/core-insurance-portal/services/policy.js:L15–19`: `findPolicyById` gọi **`core-query/policy/find-policy-by-id/{id}`**, khác endpoint đang khảo sát. Không dùng source FE này làm bằng chứng consumer của GET Command. Các vùng Chi tiết trong Workshop được xây theo DTO và ghi rõ là mô phỏng.

## Nghiệm thu

Script `scripts/review-policy-detail.mjs` đi thực tế từ tìm → nhận kết quả → trang 2 → chọn `POL-LEARN-003` → request Chi tiết → hồ sơ → liên quan → chuyển lắp ráp → trả đúng checkpoint → response → về đúng trang Danh sách. Kiểm tra thêm ID không tìm thấy. Có ảnh A/B, full source, trước/sau triển khai và các nhánh thử; liên kết từng ảnh lưu trong `policy-detail-links.json`.

Ảnh cặp Tạo mới/Chi tiết dùng viewport **1440×1000**, deviceScaleFactor=1, zoom 100%. Kết quả build, test, integrity và audit cuối được ghi trong trang review và `policy-detail-validation.json`.

**Kết quả cuối:** build gồm TypeScript đạt; bộ hồi quy rộng **48/48** đạt; bộ Chi tiết sau chỉnh sửa cuối **9/9** đạt (tổng 49 ca khác nhau qua hai bộ). Bộ cuối kiểm tra thêm A/B cùng file tại lời gọi helper thực tế **L36 → L40–63**, và hồ sơ chính còn trong scope trước mapping/ghép thanh toán. Integrity **40 fixture**, audit **23 file Java Chi tiết** và `git diff --check` đạt. Script nghiệm thu chạy hết, không ghi nhận lỗi JavaScript. Có bảy cặp ảnh và bảy ảnh bổ sung về ID, kết quả, quay lại, nhánh thiếu và source.

```powershell
node scripts/review-policy-reference.mjs
node scripts/review-policy-detail.mjs
node scripts/build-policy-detail-review.mjs
npm.cmd run build
npm.cmd run verify:fixtures
node scripts/extract-policy-detail-source.mjs --root D:/ALPACA/agent-system --check
npx.cmd playwright test tests/browser/policy-detail.spec.ts tests/browser/policy-list-journey.spec.ts tests/browser/policy-reading.spec.ts --output=.verification/detail-integration
npx.cmd playwright test tests/browser/policy-detail.spec.ts --output=.verification/detail-acceptance
```

Giới hạn: fixture mô phỏng, chưa chạy backend thật; chưa xác minh HTTP lỗi, cấu hình gateway và consumer FE của chính endpoint. Build vẫn có cảnh báo chunk lớn của ứng dụng.

Audit bổ sung của bài Danh sách cũ phát hiện snapshot trước khác backend hiện tại: `ConfigUtil.java` hiện không còn `localUsername`; `SearchPolicyFunc.java:L39` dùng `"owner"` khi local=true. Script audit Danh sách cũ dừng vì vùng L7–17 không còn đủ dòng. Không thay snapshot/nghiệp vụ Danh sách trong lần triển khai Chi tiết này. Đường bàn giao `PolicyListResponse.id`, repository Query và bảng view đã được kiểm tra lại từ source hiện tại trong snapshot Chi tiết; audit **23 file của Chi tiết đạt**. Đây là sai khác của audit bài cũ, không phải kết quả build/test Workshop.
