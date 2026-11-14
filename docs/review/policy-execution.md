# Review luồng checkpoint sáu bước

- [Bước 2, dừng ở lời gọi runInternal L67](http://localhost:3182/journey/policy?group=create&mode=steps&node=validate&quote=QUOTE-LEARN-101&sentQuote=QUOTE-LEARN-101&backend=1&debugVersion=2&debug=4&debugMax=4)
- [Bước 3, dừng ở lời gọi fillMissingValue L102](http://localhost:3182/journey/policy?group=create&mode=steps&node=map&quote=QUOTE-LEARN-101&walk=quote-ui,quote-request,controller-call,quote-read,quote-guard,quote-get,internal-call,internal-enter,duplicate-read,objects-read,duplicate-guard,map-dates,map-command,status-call,status-enter,status-choice,status-return,map-effective,fill-call&stop=fill-call&at=fill-call&sim=checked)

`policy-execution.ts` định nghĩa checkpoint dùng chung cho editor, mô tả, điều khiển, biến và sơ đồ. Mỗi checkpoint có ID, method/source, ảnh chụp trước/sau, các trường thay đổi và kết quả điều kiện quan sát được. `walk` lưu các checkpoint đã chạy; `stop` là điểm dừng mô phỏng; `at` là điểm đang xem. Xem source hoặc chọn trường không thay đổi lịch sử chạy hay Policy ID. Nút Điểm đang dừng/Quay về dòng đang chạy đưa các vùng về cùng ID.

Sơ đồ có sáu nhóm mở rộng độc lập. Mặc định mở nhóm hiện tại, giữ node nối từ bước trước và điểm vào bước sau; khi xem lại nhóm khác, checkpoint hiện tại vẫn giữ nguyên. Node chính gộp các câu lệnh cùng mục đích nhưng có nút chọn từng checkpoint liên quan. Mũi tên phân biệt gọi method, Quote có/thiếu, Policy trùng, trả về nơi gọi và qua event. Trạng thái đã đi qua, đang dừng, đang xem lại, nhánh chưa chọn và chưa xác định có dấu riêng. UI/request ghi rõ mô phỏng; không gán dòng Java cho frontend chưa có source.

## Đoạn Bước 2 → 3

| Mốc | Hành vi |
| --- | --- |
| Controller L45 → exec L61 | Từ request sang lời gọi function; Quote thiếu dừng L63 |
| runInternal L74 → L75 → L76 | Đọc Policy, đọc đối tượng QUOTE, rồi kiểm tra trùng. Policy trùng dừng L77 |
| Sang Bước 3 | Mở L80 trong runInternal; chưa chạy dựng command |
| L80–82 → L83–86 | Đọc ngày rồi dựng command, gán policyType/quoteId/quoteCode |
| L87 → L195 → L197/199/201 → L87 | Vào getPolicyStatus, chọn nhánh theo ngày, trả giá trị về nơi gọi và gán status |
| L90–100 → L102 | Gán dữ liệu tiếp, dừng ở lời gọi fillMissingValue(quoteAggregate, command) |
| Vào fillMissingValue | Bấm nút mới chuyển L102 → L204, cùng CreatePolicyFunc.java |
| L205 → L206 | Gán customerId rồi chọn name/organizationName. Fixture hiện tại PERSONAL(0) chọn name; customerName chỉ xuất hiện sau L206 |
| L207–215 → trở về L103 | Bổ sung phần còn lại, trở về runInternal sau lời gọi; generatePolicyCode chưa chạy |
| L103 → L104–114 → Bước 4 L115 | Sinh mã mẫu, chuẩn bị ghi, rồi mở lời gọi save(command) |

Ngày hiệu lực, trạng thái ban đầu, khách hàng và mã hợp đồng có trong bộ chọn checkpoint ngay cạnh nút chạy. Bảng ánh xạ và Policy sắp ghi vẫn ở nội dung chính dưới editor, để đối chiếu giá trị đích từ fixture. Chọn các trường này chỉ đổi điểm đang xem.

## Các bước sau

Policy ID chỉ xuất hiện từ checkpoint gắn ID L122, sau đó JPA save L126. Source còn tạo đối tượng POLICY, liên kết Quote và trả kết quả Command L159. Event được tạo ở process L329; mũi tên sang Flow xuất phát từ event này. Bài chọn các mốc quan sát Command/Flow nhưng không khẳng định thứ tự HTTP response và xử lý event ở runtime.

Flow đi qua handler, executor, đọc Command, kiểm tra model, ghi view và queue thông báo. Bước 6 có request danh sách, Query trả kết quả, request chi tiết, Command trả kết quả và đối chiếu cùng ID. Có thể xem lại node cũ rồi quay về điểm đang dừng mà không tạo Policy mới.

## Ảnh review

| Ca | Desktop | Mobile |
| --- | --- | --- |
| Bước 2, sơ đồ mở với điểm nối Controller L45 → exec | [Sơ đồ](policy-execution-desktop-step2-graph.png) | [Sơ đồ](policy-execution-mobile-step2-graph.png) |
| L102 trước khi vào helper | [Điểm gọi](policy-execution-desktop-L102.png) | [Điểm gọi](policy-execution-mobile-L102.png) |

Tái tạo bằng `node scripts/capture-policy-execution.mjs` với Vite ở cổng 3182. [Link trạng thái được chụp từ lượt chạy thật trong UI](policy-execution-links.json).

## Kiểm chứng

- Production build và typecheck.
- 38 kiểm tra Policy: định danh/source, Bước 2 → 3 trên desktop/mobile, call/entry/return, nhánh Quote thiếu/Policy trùng, vùng biến, đọc source, panel, bàn phím, kết quả sáu bước và hồi quy tổng quan/bài đọc.
- Sau chỉnh nhãn UI/source, kiểm tra lại các ca execution và panel.
- 142 trích đoạn khớp source Java về nội dung, số dòng và SHA-256; chỉ đọc source.
- 30 fixture nguyên vẹn; `git diff --check` sạch.

Chỉ chỉnh Workshop. Không sửa repo Java, không commit/push.
