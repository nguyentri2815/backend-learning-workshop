# Tạo mới → Nhìn toàn cảnh: sơ đồ chung từ Quote đến sau phát hành

## Review

- [Trạng thái vừa mở](http://localhost:3183/journey/policy?group=create&mode=overview).
- [Bằng chứng nguồn Quote](http://localhost:3183/journey/policy?group=create&mode=overview&inspect=origin&evidence=origin-api).
- [Chọn Online trên sơ đồ chung](http://localhost:3183/journey/policy?group=create&mode=overview&branch=online&inspect=branch).
- [Online → kiểm tra lại giao dịch, có bước thực hành để quay về](http://localhost:3183/journey/policy?group=create&mode=overview&branch=online&inspect=online-recheck&evidence=online-recheck&node=map&ref=create-customer&quote=QUOTE-LEARN-102&sim=checked).
- Dev server dùng cùng các đường dẫn tại cổng `3182`.

Ngay khi mở, một sơ đồ hiển thị đủ **1 Quote → 2A–2D bốn đường phát hành → 3 Tạo Policy và đối tượng bảo hiểm → 4A Quote PUBLISHED / 4B event–Flow–View–Query–realtime / 4C API hoặc lịch Core**. Đường trực tiếp được tô nổi mặc định. Core có cạnh nét đứt và chú thích điều kiện riêng. Request, điều kiện, code và kết quả mẫu chỉ hiện trong vùng chi tiết sau khi chọn nút; desktop đặt bên cạnh, mobile đặt bên dưới.

Đường review: **mở sơ đồ → chọn 1 Quote → Quote đến từ đâu? → Mở bài phát hành trực tiếp → chọn Quote, gửi request, kiểm tra để tới bước ánh xạ → Nhìn toàn cảnh → chọn 2C Thanh toán online → Kiểm tra lại giao dịch online → Quay về đúng bước đang học**. URL giữ `node=map`, `ref=create-customer`, Quote Nam và phase `checked`. Reload và Back quay lại đúng nhánh/source đang đọc. Nút **Làm lại từng bước** gắn cạnh 2A mở màn Chi tiết báo giá mô phỏng trước khi lần endpoint; xem [bài sáu bước hiện tại](POLICY-DIRECT-PRACTICE-HANDOFF.md). Nút quay về bên dưới sơ đồ giữ đúng bước đã học.

Có thể kéo từng nút, pan nền, zoom bằng cuộn hoặc controls; cạnh đi theo nút. Kéo không mở chi tiết. Vị trí nút giữ khi đổi nhánh và khi qua lại tab thực hành trong phiên trang. **Đặt lại bố cục** trả vị trí và khung nhìn về mặc định, vẫn giữ nhánh đang chọn. Reload không cam kết giữ tọa độ kéo; URL giữ ngữ cảnh bài/nhánh/source.

Phần thực hành vẫn ở tab **Làm lại từng bước**. Việc chọn bốn nhánh trong toàn cảnh là đọc bằng chứng source, không mô phỏng rằng cả bốn đã chạy. Các mốc Command/view mẫu thuộc bài **Phát hành trực tiếp**.

## Đã lần được nguồn Quote đến đâu?

Đường backend được đối chiếu trong `D:\ALPACA\agent-system`; các path ngắn dưới đây nằm ở `workspaces/agent-service/` hoặc `workspaces/1-shared/`. Giao diện mở đoạn Java nguyên văn, đường dẫn đầy đủ, dòng và commit.

| Chặng | File/method và bằng chứng |
| --- | --- |
| API tạo Quote | Command `controller/QuoteController.java:29–32`: `POST /quote/create`, `CreateQuoteRequest` được chuyển tới `CreateQuoteFunc.exec`, kết quả được bọc `WrapResponse.ok`. |
| Dựng command | `function/quote/CreateQuoteFunc.java:74–94`: validate, dựng `CreateQuoteCommand`, `Quote.status=EDITING(0)`. `quoteCode` là mã riêng, không phải ID aggregate. |
| Ghi Quote và chuyển ID cho đối tượng | `CreateQuoteFunc.java:151–165`: `quoteAggregateRepository.save(command)`; dùng `quoteAggregateEntity.getEntityId()` làm `entityId` của đối tượng QUOTE; trả `quoteAggregateEntity`. |
| Process/apply và chọn repository | Domain `domain/QuoteAggregate.java:266–289`: chọn `QuoteRepository`, `CreateQuoteCommand → CreateQuoteEvent → apply`. Aggregate ánh xạ bảng `quote_aggregate`. |
| Nối repository vào tầng lưu | Shared `io/eventuate/sync/AggregateRepository.java:56–85`: overload save không truyền ID, process/apply, gọi aggregate store và trả `EntityWithIdAndVersion`. |
| Sinh ID thật | Shared `com/eventsourcing/common/jdbc/impl/EventuateJdbcAccessImpl.java:87–110`: lấy ID từ save options hoặc `applicationIdGenerator.genIdAsString()`. Đường tạo Quote này không truyền ID riêng. |
| Gắn ID và JPA save | Cùng file, dòng 118–129: `aggregate.setId(entityId)`, set version, `repo.save(...)`; kết quả lưu trả cùng entityId. |
| ID trong response Java | Shared `io/eventuate/EntityWithIdAndVersion.java:23–37`: getter `getEntityId()` và `getAggregate()`. Đây là bằng chứng contract Java, chưa phải JSON HTTP runtime đã quan sát. |
| Dùng lại để tạo Policy | Command `controller/PolicyController.java:43–46`: nhận `quoteId` trên path; `CreatePolicyFunc.java:60–68` dùng `QuoteRepository.findById(quoteId)`. |

**Chưa xác nhận thao tác trên màn hình nghiệp vụ tạo/chọn Quote.** Workshop dùng Quote mẫu đã có. Nút **Xem request mẫu** hiện `quoteId` trước/sau giống nhau và path `POST /policy/create/{quoteId}`; không tạo Quote hay gửi request backend. Source cũng gán `hasReleasedPolicy=true` ngay khi dựng Quote; chưa suy hành vi nút nghiệp vụ từ riêng cờ này.

## Bốn nhánh giữ contract riêng

| Nhánh | Kích hoạt / trước khi tạo | Thành phần tạo Policy | Quote/thanh toán và kết quả |
| --- | --- | --- | --- |
| Phát hành trực tiếp | `POST /policy/create/{quoteId}`; Quote tồn tại, không có Policy cùng quoteCode ở 0/100. | `CreatePolicyFunc`, save `CreatePolicyCommand`. | Tạo đối tượng POLICY, phát hành Quote thành PUBLISHED(9), trả `EntityWithIdAndVersion<PolicyAggregate>`. |
| Thu hộ/tiền mặt | `POST /payment/pay-for-quote`, `COLLECTION_AGENT` chọn `CashQuoteProcessor` và `OfflineQuotePaymentFlow`; qua điều kiện thanh toán/TPA và kiểm tra trùng. | `OfflineQuotePaymentFlow.afterPay → CreatePolicyForCash`; có quy tắc thu hộ, đơn vị bán và releaseDate riêng. | Checkout có transaction; Quote PUBLISHED và gắn Policy ID. `PayForQuoteFunc` trả `CheckoutInfoModel.entityId=Policy ID`. Nộp phí về sau là một nhánh riêng. |
| Online | Lượt pay tạo/lấy giao dịch rồi Quote WAIT_PAYMENT_ONLINE(7); callback/API/queue xác nhận paid. Processor kiểm tra gateway PAYED, transaction DONE trước afterPaid; creator vẫn kiểm tra trùng. | `PaidForQuoteFunc → CreatePolicyForPaymentOnlineFunc`. | Lượt pay đầu trả checkout với Quote ID. Sau paid, Quote PAID(11) rồi PUBLISHED(9); `PaidForQuoteFunc` trả String Policy ID; callback có đường redirect. Chưa xác nhận FE hiển thị redirect. |
| Duyệt thanh toán | `/quote/approve-payment` dùng `validatePaymentQuote`: đúng người, Quote thuộc WAIT_PAYMENT_CASH/ONLINE. `/approve-payment-now` dùng `validatePaymentNowQuote`, không cùng điều kiện WAIT. | `ApprovePaymentFunc.afterPay` hoặc `ApprovePaymentNowFunc.afterPay`, tự dựng/save command. | Ghi Quote PAID và transaction DONE rồi phát hành. Bản thường trả Boolean, catch trả false. Bản now trả Policy ID; afterPay catch trả null, runInternal có đường ném lỗi. Policy command còn gán paymentStatus=UNPAID, khác Quote.status=PAID. |

Vùng chi tiết tách `Quote.status`, `Policy.status`, trường thanh toán và `Policy.syncStatus`. Không coi trạng thái giao dịch DONE là hợp đồng RUNNING hoặc Core SYNCED. Sơ đồ hội tụ ở thao tác tạo; không khẳng định cả bốn nhánh gọi cùng một creator hoặc trả cùng kiểu response.

## Ba mốc và đường đọc

1. **Command có Policy:** response theo nhánh trên. `GET /policy/{id}` đọc `policy_aggregate` và có thể mở trực tiếp bằng ID, không qua Danh sách và không chờ Core. Với mẫu `sim=command`, bài Chi tiết có hồ sơ vừa tạo nhưng Query tìm đúng mã vẫn rỗng.
2. **Flow đã cập nhật dữ liệu tra cứu:** `CreatePolicyEvent → PolicyWorkflow.createPolicy → PolicySyncViewFunc`, executor đọc Command rồi `PolicyViewRepository.save`. Query đọc `policy_view_aggregate`; view có bản ghi, bộ lọc và phạm vi phù hợp thì mới có thể thấy trong Danh sách.
3. **Core đã đồng bộ:** API `POST /policy/sync/{policyId}` hoặc lịch/queue gọi đường Core riêng. Chặn Policy đã sync, đọc Quote, gọi Core; sau success ghi `policyCoreSystemId`, `syncCoreSystem=true`, `syncStatus=SYNCED`. Tác vụ tự chọn `syncCoreSystem=false`, `createdDate<now`, `syncCoreSystemCount≤4`; tăng counter qua queue trong finally. Event Core có đường cập nhật view riêng. Không có cạnh bắt buộc “view xong rồi Core”; `sim=view` không đổi kết quả Core.

Phân tích tĩnh chưa xác nhận thời gian, thứ tự so với HTTP response, vận chuyển event hoặc retry xuyên dịch vụ. Sơ đồ gắn nhãn các quan hệ này, không biến chúng thành thời gian thực đã đo.

## Luồng mở thêm và điểm cần xác minh

- **Kiểm tra lại online**, cạnh Quote WAIT_PAYMENT_ONLINE: API `/schedule/scan-payment-in-process` hoặc listener đang hoạt động; chọn UNPAID, WAIT_PAYMENT_ONLINE, retryCheckPayment ≤ 3; thời điểm kiểm tra là refIdCreateTime + retry × 3 phút. Tăng retry rồi gọi `IPNFunc.handelForQuote`, không bảo đảm sẽ phát hành nếu giao dịch chưa paid.
- **Phát hành lại**, cạnh Quote PAID: API `/schedule/scan-payment-paid → ScanPaymentPaidFunc`; chọn PAID và retryReleasePolicy ≤ 3. Listener lịch tương ứng trong `QueueScheduleHandler` đang bị comment; không khẳng định tự chạy. Tăng đếm rồi gọi creator online, vẫn có điều kiện chống trùng.
- **Nộp phí sau phát hành**, cạnh kết quả Policy thu hộ: payment-policy-process/create hoặc create-and-pay rồi pay/paid-for-policy. Chỉ nhận Policy COLLECTION_AGENT và qua kiểm tra đợt đang xử lý; đổi dữ liệu thanh toán, không tạo lại Policy hay đổi Policy.status.
- **Cập nhật từ Core**, cạnh Policy đã tồn tại: sync-endorsement, nhận dữ liệu điều chỉnh và Policy.status từ Core; event cập nhật view riêng. Đây là đường vào từ Core, khác đường gửi Policy sang Core.

Mỗi nhánh có **Điểm cần xác minh**: đọc Quote trước khóa ở đường trực tiếp; proxy/REQUIRES_NEW khi Cash processor được new; các transaction tách ở PaidForQuoteFunc; khác tiền tố khóa ở IPN; catch false/null và rollback của duyệt; tăng counter/retry trước hoặc sau tác động ngoài; response Core success nhưng data trống. Đây là câu hỏi để test backend riêng, chưa kết luận lỗi hoặc bảo đảm rollback/idempotency từ source.

## Kiểm tra và ảnh

Snapshot hiện có 142 excerpt. `node scripts/verify-policy-source.mjs --root D:\ALPACA\agent-system` đối chiếu nội dung, dòng và SHA-256; không chạy/sửa backend. `fixtures.manifest.json` ghi lại 30 file nội dung.

Browser kiểm tra đủ chín nút trong viewport ban đầu ở 1512×1050 và 1366×768; chọn nhánh giữ cả bốn đường, kéo nút/cạnh, đổi nhánh giữ tọa độ, pan/zoom/reset, vào bài thực hành, nguồn Quote, hai biến thể duyệt, Code/URL/Quote/phase giữ nguyên khi quay về, Chi tiết trước view, Query rỗng trước view, Core riêng, mobile 390px và hồi quy bài Tạo mới.

Kết quả trên bản build tại cổng `3183`: **26/26 kiểm tra qua** (8 toàn cảnh, 10 bài Policy, 6 hồi quy Workshop, 2 fixture). Build/TypeScript qua; 30 fixture khớp manifest. Source đã được đối chiếu lại: **142 excerpt khớp source/số dòng/SHA-256** tại `D:\ALPACA\agent-system`. Không chạy Java, API backend hoặc DB.

Ảnh hiện tại: [trạng thái vừa mở, chưa chọn nút](review/policy-issuance-shared-initial.png), [vùng chi tiết Online](review/policy-issuance-shared-online.png).
