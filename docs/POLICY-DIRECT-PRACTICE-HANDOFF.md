# Phát hành trực tiếp từ Quote · bài thực hành sáu bước

## Review

- [Bắt đầu ở Chi tiết báo giá mô phỏng](http://localhost:3183/journey/policy?group=create&mode=steps&node=quote).
- [Case Quote không tồn tại](http://localhost:3183/journey/policy?group=create&mode=steps&node=quote&quote=QUOTE-NOT-FOUND).
- [Case Policy trùng](http://localhost:3183/journey/policy?group=create&mode=steps&node=quote&quote=QUOTE-LEARN-103).
- [Mở trực tiếp debug sau lần đọc Quote](http://localhost:3183/journey/policy?group=create&mode=steps&node=validate&quote=QUOTE-LEARN-101&sentQuote=QUOTE-LEARN-101&backend=1&debugVersion=2&debug=1&debugMax=1).
- [Điểm dừng L67, trước khi vào runInternal](http://localhost:3183/journey/policy?group=create&mode=steps&node=validate&quote=QUOTE-LEARN-101&sentQuote=QUOTE-LEARN-101&backend=1&debugVersion=2&debug=4&debugMax=4).

Dev server có cùng đường dẫn ở cổng 3182. Tất cả UI, Network và debug là mô phỏng. Màn Chi tiết báo giá được dựng cho Workshop; chưa xác nhận frontend nghiệp vụ của agent-system.

Đường hợp lệ: **Phát hành thành hợp đồng → Network Đang xử lý → Lần vào backend → bấm lời gọi CreatePolicyFunc → chạy L61 → L62 → L66 → L67 → Vào runInternal (L70) → L74 → L75 → L76 → Sang bước 3 → chọn trường, xác nhận dữ liệu → Thực hiện bước ghi mô phỏng → Sang bước 5 → xem danh sách trước view → cho Flow ghi view → Sang bước 6 → tìm Policy, mở chi tiết từ kết quả hoặc mở trực tiếp theo ID**.

Đường bị chặn: chọn **Quote không tồn tại** hoặc **Policy trùng** trước khi phát hành; bước 2 dừng đúng dòng, Network nhận ServiceException. **Đổi sang Quote hợp lệ để thử lại** bắt đầu lượt mới, xóa tiến độ và kết quả của lượt cũ. Có thể tiếp tục đủ sáu bước với Quote mới.

## Sáu bước và ngữ cảnh được giữ

Thanh duy nhất ngay dưới tab Làm lại từng bước: **1. Phát hành từ Quote · 2. Kiểm tra Quote · 3. Dựng dữ liệu Policy · 4. Ghi Policy · 5. Cập nhật dữ liệu tra cứu · 6. Xem kết quả**. Bước hiện tại, đã hoàn thành, tiếp theo và chưa tới được phân biệt. Dãy sáu nút dưới code đã bỏ riêng ở bài tạo; các workspace khác giữ cách đọc cũ.

Cả sáu bước dùng chung một khung: điều hướng trước/sau có tên bước, sơ đồ theo dõi thực thi, dòng **Vừa đi từ đâu → Đang ở đâu**, thanh hành động và vùng code/dữ liệu. Bước chưa mở có lý do và thao tác cần hoàn tất. Thanh hành động chiếm một hàng riêng phía trên vùng cuộn code, không phủ lên dòng Java. Trên mobile có tab **Code / Dữ liệu bước N**, nút mở cây thư mục và tùy chọn thu sơ đồ để dành chỗ đọc.

Sơ đồ mặc định có sáu chặng; **Mở chi tiết chặng N** chỉ mở đường đang học, có mũi tên, nhánh đang đi/bị chặn. **Xem nơi gọi** mở đúng dòng gọi và giữ file gọi trong cây; **Quay về dòng đang chạy** đưa trở lại điểm debug đã đạt. Bấm số dòng hoặc mở source khác chỉ đổi phần đang xem.

- Bước 1 mở báo giá bằng UI nghiệp vụ mẫu, JSON nằm trong **Xem dữ liệu mẫu**. Chỉ khi phát hành mới có Network; chỉ khi bấm **Lần vào backend** mới có cây source, controller và dòng gọi function.
- Bước 2 có dòng hiện tại, biến trước/sau, điểm rẽ, tiến/lùi. **Về điểm dừng trước** chỉ xem lại; **Về bước trước** nằm riêng ở điều hướng. Tiến độ debug tối đa không giảm khi xem lại và không xóa kết quả request. Có tám checkpoint hợp lệ: L61, L62, L66, L67, L70, L74, L75, L76. Tại L67 phải bấm **Vào runInternal** mới chuyển sang L70 và thấy `quoteAggregate` truyền vào; lần chạy tiếp theo mới đọc Policy ở L74. Quote rỗng dừng L63, không có đường vào `runInternal`.
- Bước 3 chọn trường khách hàng, hiệu lực, Quote ID, loại, trạng thái ban đầu, mã mới hoặc syncStatus để nối Quote → dòng Java → CreatePolicyCommand. Preview chưa có Policy ID. Mã S-DEMO là quy ước; không chạy bộ sinh mã sản phẩm/counter thật.
- Bước 4 cho xem từng điểm ghi: Policy/event/JPA, đối tượng POLICY và Quote PUBLISHED kèm liên kết. Đối tượng mới có entityId=Policy ID, secondEntityId=Quote ID, secondInsuranceId=đối tượng QUOTE cũ. ID đối tượng khớp bài Chi tiết mẫu.
- Bước 5 giữ hai checkpoint: Command đã tạo nhưng Query chưa có dòng; Flow đã ghi view cùng ID thì Query trả dòng. Đây là checkpoint do người học điều khiển, không khẳng định HTTP response đến trước event trong runtime. Event/handler/executor/save view/realtime đều có source.
- Bước 6 tìm theo policyCode, giữ cùng policyId từ bước 4, đọc Chi tiết qua Command; nút **Mở chi tiết theo ID** không cần kết quả Query. Từ bước 4 cũng mở được bài Chi tiết ngay trước khi có view.

Quote, request ID, điểm debug đang xem và điểm đã đạt, trường đang theo dõi, checkpoint Command/view, nguồn đang đọc và kết quả nằm trong URL. Quay lại bước đã đi qua hoặc chuyển qua lại Nhìn toàn cảnh không chạy lại request và không mất Policy. Đặc biệt, bước 5 → bước 4 → bước 5 giữ cùng `policyId`, Network và dữ liệu view đã đạt. Link thiếu dữ liệu tiên quyết mở đúng bước kèm đường về thao tác cần hoàn tất. Chọn Quote khác bắt đầu một lượt mới.

## Đọc source và phạm vi snapshot

Ba chế độ dùng được ở cả sáu bước: **Đoạn liên quan**, **Mở rộng ngữ cảnh**, **Toàn bộ file**. Ngữ cảnh ghép các đoạn đã có của cùng file theo số dòng gốc, gồm đầu hàm nếu snapshot có; khoảng thiếu được ghi rõ, không tự điền Java. Với `CreatePolicyFunc.java`, các phạm vi hiện có là L60–78, L80–115, L142–159, L195–201, L204–215 và L224–261.

Workshop chưa đóng gói toàn bộ các file Java này. Chế độ **Toàn bộ file** giải thích giới hạn, liệt kê phạm vi và cung cấp đường dẫn/copy đường dẫn mở file thật trong IDE ở `D:\ALPACA\agent-system`. Dấu ✓ là checkpoint đã chạy mô phỏng, ▶ là dòng sắp chạy, ● là dòng đang xem. Tự cuộn và xem nơi gọi giữ nguyên vị trí debug; hành động chạy tiếp dùng điểm đã đạt, không chạy lại từ đoạn đang xem.

## Đối chiếu source

Source gốc chỉ đọc tại `D:\ALPACA\agent-system`. Các đoạn Java giữ nguyên nội dung, dòng và commit của snapshot đã đối chiếu. Các path ngắn dưới đây thuộc `workspaces/agent-service/` trừ tầng lưu thuộc `workspaces/1-shared/`.

| Điểm dừng | File / dòng | Dữ kiện dùng trong bài |
| --- | --- | --- |
| Endpoint | Command `controller/PolicyController.java:43–45` | `POST /policy/create/{quoteId}`; không có RequestBody; controller gọi `CreatePolicyFunc.exec(quoteId)`. |
| Đọc Quote | `function/policy/CreatePolicyFunc.java:61` | Tên biến `Optional<QuoteAggregate> optional`; đầu vào `quoteId`. |
| Chặn Quote thiếu | Cùng file, `62–63` | `optional.isEmpty()` → `PlatformErrorCode.QUOTE_NOT_EXIST`; chưa `optional.get()`, chưa đọc Policy. |
| Lấy Quote / khóa | Cùng file, `66–67` | `quoteAggregate = optional.get()`; `execInTransactionAndLock(..., () -> runInternal(quoteAggregate))`. Dừng riêng ở lời gọi; chưa kiểm chứng cạnh tranh hoặc tính nguyên tử runtime. |
| Vào hàm nội bộ | Cùng file, `70` | Nhận `QuoteAggregate quoteAggregate`, trước khi dựng `status` và truy vấn ở L74. |
| Đọc Policy trùng | Cùng file, `71–74` | `status=[NOT_RUNNING(0), RUNNING(100)]`; `policyAggregateList` theo `quoteAggregate.getQuoteCode()`. |
| Đọc đối tượng | Cùng file, `75` | `insuranceObjectList`: entityId=Quote ID, objectType QUOTE, deleted=false; diễn ra trước điều kiện ở 76. |
| Chặn Policy trùng | Cùng file, `76–77` | `policyAggregateList.size()!=0` → `QUOTE_CAN_NOT_RELEASE_POLICY`. |
| Giá trị mã lỗi | `agent-shared/.../PlatformErrorCode.java:118,129` | `AGENT.QUOTE_NOT_EXIST`, `AGENT.QUOTE_CAN_NOT_RELEASE_POLICY`. Đã đọc lại cả hai hằng; không tự gán HTTP status cho Network mẫu. |
| Dựng command | `CreatePolicyFunc.java:80–115,195–215` | Mapping, quoteType→policyType, quoteId/quoteCode, ngày, getPolicyStatus, fillMissingValue, sinh policyCode, NOT_SYNC; payment còn xử lý chia phí theo insuranceObjectList. |
| Ghi Policy | Cùng file, `115`; domain `PolicyAggregate.java:328–339` | save command → CreatePolicyEvent → apply; repository Policy. |
| Lưu aggregate | Shared `EventuateJdbcAccessImpl.java:122–126` | Gắn entityId/version, JPA save. ID POL-FROM-QUOTE của bài là mẫu, không phải chạy generator thật. |
| Đối tượng POLICY | `CreatePolicyFunc.java:147,236–257` | Copy đối tượng QUOTE; gán POLICY, entityId/secondEntityId/secondInsuranceId; save đối tượng mới. |
| Liên kết Quote | Cùng file, `158,224–233`; domain `QuoteAggregate.java:317–321` | PublishedQuoteCommand gắn Policy ID/code/ngày, status PUBLISHED; apply đặt canReleasePolicy=false, hasReleasedPolicy=true. |
| Event → Flow → View | Flow `PolicyWorkflow.java:24–27`; `PolicySyncViewFunc.java:39–60` | executor đọc Command theo ID ở 41, save view ở 56, queue thông báo sync-policy-view ở 58–60. |
| Query / Chi tiết | Query `SearchPolicyFunc.java:112–115`; Command `FindPolicyByIdFunc.java:32–37` | Search đọc view; detail đọc aggregate theo Policy ID rồi ghép đối tượng và payment. |

Không đồng nhất Quote.status, Policy.status, thanh toán hoặc syncStatus. Mô phỏng không gọi Java, API, DB, Core, email hay SMS. Không suy bảo đảm rollback, retry hoặc thứ tự liên dịch vụ từ các checkpoint UI.

## Kiểm tra

Các kiểm tra đi hết ca hợp lệ; đi tới hai dòng chặn, lùi/xem lại và bắt đầu lại bằng Quote hợp lệ rồi tiếp tục tới kết quả; giữ cùng ID qua các bước và bài Danh sách/Chi tiết; giữ cursor/source khi reload, Back và đổi tab; chặn ghi khi thiếu tiên quyết; kiểm tra mobile 390px. Khung mới được kiểm tra riêng ở cả sáu bước, L67 → L70 → L74, nơi gọi/quay lại, dấu dòng độc lập, ba chế độ đọc, cuộn sâu và bước 5 → 4 → 5. Nút hành động nằm trong viewport và phía trên code, không đè lên vùng đọc.

Đã chạy **34/34 kiểm tra qua** trên bản build cổng 3183: 11 thực hành/khung điều hướng, 8 toàn cảnh, 7 bài đọc/model Policy, 6 hồi quy Workshop, 2 fixture. Sau khi chỉnh khoảng nối và tách hai nhánh đọc ở sơ đồ bước 6, build lại và chạy lại **11/11 kiểm tra thực hành qua**, có kiểm tra riêng hai nhánh độc lập và dòng gọi Query L26. Build/TypeScript qua, 30 fixture khớp manifest; `git diff --check` qua. Đã đối chiếu lại 142 đoạn trích với source/số dòng/SHA-256; các hằng lỗi ở dòng 118 và 129 của PlatformErrorCode có bằng chứng trong bài. Không chạy backend thật.

Ảnh: [Chi tiết báo giá lúc bắt đầu](review/policy-practice-quote.png), [khung thực hành tại L67](review/policy-practice-debug.png), [đọc code trên mobile](review/policy-practice-mobile.png).
