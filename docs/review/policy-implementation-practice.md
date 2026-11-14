# Từng bước triển khai · Tạo Policy từ Quote

Vào **Khám phá Policy → Tạo mới → Tư duy lắp ráp**. Khám phá các quyết định, chọn mẫu, mở **Xem sơ đồ phối hợp** hoặc **Xem sơ đồ liên quan**, rồi chọn **Từng bước triển khai** ở đầu cửa sổ.

Nút sang bước nghiệp vụ kế tiếp nằm cùng thanh với **Quyết định tiếp theo**. Chỉ còn một nút sang bước đó; cuối nội dung không có nút lặp.

## Mốc đầu và mô phỏng

Có 19 lượt thực hành trong sáu bài. Mỗi bài có checkpoint riêng, cung cấp phần của các bước trước để có thể mở trực tiếp bất kỳ bước nào. Phần có sẵn được đọc lại từ fixture; các đoạn cần lắp được thay bằng chú thích trong bản mô phỏng. Đây là thứ tự hướng dẫn thực hành, không phải lịch sử viết code hoặc thứ tự backend thực thi.

Mỗi lượt có việc cần làm/lý do, vị trí và **Chỉ vị trí**, thao tác cụ thể, kết quả và việc được phép làm tiếp. Người học tìm file trong cây, chọn đầu nối/dữ liệu rồi thực hiện. Lựa chọn chưa khớp có phản hồi và chưa thay đổi mô phỏng. Code mới chỉ hiện sau thao tác. Trạng thái **Có sẵn để dùng / Cần sửa / Cần tạo / Đã thực hiện** gắn với method hoặc nhóm lệnh đang học; không đánh dấu cả file cũ là cần tạo.

Khi có thay đổi, code trước/sau giữ đúng mốc của lượt đang xem lại. **Mở toàn bộ file** hiển thị bản mô phỏng hiện tại, giữ các kết quả đã làm và tô riêng vùng của lượt đó theo số dòng snapshot. Các đoạn của bước sau vẫn chưa được lắp.

**Trước / Tiếp theo** và **Làm lại phần này** nằm ở trên. Xem lại giữ kết quả. Làm lại xóa tiến độ, lựa chọn file và kết quả thử của bài ở bước hiện tại; các bài khác giữ nguyên. Tiến độ, file và trạng thái mở toàn file nằm trong nhóm URL `assemblyPractice.<step>.*`, độc lập với trạng thái chạy lại Policy và lựa chọn sơ đồ. Hai chế độ giữ cây, vị trí cuộn và code viewer riêng khi chuyển qua lại.

## Đối chiếu source agent-system

Đã so SHA256 của cả 67 entry trong `assembly-source.json` với file tại `D:/ALPACA/agent-system`: tất cả khớp. Snapshot source không bị sửa. Các đoạn cần lắp được xác định bởi range trong `assembly-implementation.ts`.

| Bước | Phần dùng lại ở mốc đầu | Phần thực hành bổ sung | Phụ thuộc / kết quả |
| --- | --- | --- | --- |
| 1 · Phát hành từ Quote | Mẫu endpoint sync, BaseController, BaseFunc | `CreatePolicyFunc.exec` L60–68; `PolicyController.createPolicy` L43–46 | Hợp đồng POST `/policy/create/{quoteId}`, String → Func; phần đọc/guard chưa lắp |
| 2 · Kiểm tra Quote | Điểm nhận bước 1, QuoteRepository, PolicyRepository, helper khóa/transaction | Func L61, L65–67; guard L62–64 và L71–78 | `findById` kế thừa JpaRepository; thiếu Quote hoặc Policy trùng chặn phát hành; Quote hợp lệ cho bước 3 |
| 3 · Dựng dữ liệu Policy | Guard bước 2, CreatePolicyCommand, MappingUtils, helper status/fill | runInternal L80–104: map, gán riêng và gọi helper | Command mang quoteId, policyType từ quoteType, status theo ngày và dữ liệu bổ sung |
| 4 · Ghi Policy | Command bước 3, Event, bean repository, dispatcher/store | PolicyAggregate L328–340; Func L115 | `save → processCommand/process → applyEvent/apply → store/JDBC`; trả Policy ID/version |
| 5 · Cập nhật dữ liệu tra cứu | ID bước 4, ViewEntity/ViewRepository, API nội bộ, đăng ký handler | PolicyWorkflow L23–32; PolicySyncViewFunc L41–56 | entityId → đọc PolicyModel → map, searchingKey, mapPayment → save view; kiểm tra fixture trước/sau |
| 6 · Xem kết quả | View bước 5, SearchPolicyFunc, FindPolicyByIdFunc | Query Controller L24–27; Command Controller L48–51 | Nhập Policy ID để kiểm tra danh sách Query/view và chi tiết Command/repository cùng một Policy |

Các đoạn không liên tiếp của bước 3 được chia thành từng range riêng. Bước 4 không gọi trực tiếp process/apply từ Func. Source phía ghi có `publish` rỗng; chưa xác định thành phần chuyển bảng events lên Kafka. Bước 5 đưa Event fixture vào phía nhận và giả định API nội bộ fixture trả model hợp lệ, không khẳng định transport/runtime đang hoạt động. Danh sách có thể chưa thấy view ngay; `Page.empty` cũng có thể là nhánh bắt lỗi. Ở bước 6, tên method Controller trong source là `paymentMethod`, còn route và Func xác định hành vi đọc chi tiết Policy.

## Đường nghiệm thu bước 2

1. Mở sơ đồ ở **Kiểm tra Quote**. Mặc định là **Sơ đồ liên quan**. Chọn Func, mở toàn file và ghi nhận cây/vùng tô.
2. Đổi sang **Từng bước triển khai**. Tự tìm `QuoteRepository.java` trong module `4-agent-shared-domain`, bấm file và **Mở repository**.
3. **Tiếp theo**, mở `CreatePolicyFunc.java`, chọn `quoteRepository.findById(quoteId)` và **Thêm lời gọi**. Đối chiếu trước/sau. Chọn PolicyRepository sẽ nhận giải thích và chưa thêm code.
4. **Tiếp theo**, thêm guard thiếu Quote và Policy chặn phát hành. Mở toàn file: L62–64 và L71–78 được tô; lời đọc L61 không mang màu đoạn vừa sửa.
5. Đổi lại **Sơ đồ liên quan**: file, cây, toàn file, vùng tô, viewport sơ đồ được giữ. Đổi lại thực hành: toàn file và vị trí cuộn được giữ.
6. Thử **nhánh thiếu dữ liệu** và **nhánh hợp lệ**. Có thể thử thêm Quote đã có Policy RUNNING. Hai nhánh lỗi dừng trước khi dựng Command/save. Xem lại giữ kết quả; tải lại trang cũng giữ kết quả trong URL.
7. **Làm lại phần này** đưa riêng bài bước 2 về lượt tìm repository, chưa chọn file và chưa thử nhánh.

## Kiểm tra và hình ảnh

Kiểm thử mới: `tests/browser/policy-implementation-practice.spec.ts`, bao phủ cả sáu checkpoint, các thao tác riêng, lựa chọn sai, trước/sau, tô toàn file, xem lại/làm lại, nhập Policy ID và tính độc lập với trạng thái chạy lại Policy. Nghiệm thu bước 2 chạy ở desktop/mobile và sáng/tối.

Kết quả: **27/27 kiểm thử đạt**, gồm bộ mới và hồi quy `policy-pattern-workspace`, `policy-assembly-layout`, `policy-assembly-learning`, `policy-assembly-affordances`. `npm.cmd run build` thành công; `npm.cmd run verify:fixtures` xác minh đủ 35 fixture; `git diff --check` không báo lỗi. Build vẫn có cảnh báo kích thước chunk trên 500 kB.

Ảnh: [mốc đầu bước 2](implementation-step2-start.png), [desktop sáng](implementation-step2-desktop-light.png), [desktop tối](implementation-step2-desktop-dark.png), [mobile sáng](implementation-step2-mobile-light.png), [mobile tối](implementation-step2-mobile-dark.png).

Ảnh và kết quả là từ mô phỏng học tập trong trình duyệt. Các thao tác không ghi vào source Java, database hoặc backend thật.
