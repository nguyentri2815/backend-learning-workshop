# Review giao diện thực hành tạo Policy

Lượt mới nhất: [luồng checkpoint sáu bước và Bước 2 → 3](policy-execution.md).

Lượt cập nhật mới nhất: [checkpoint trên code và dữ liệu cạnh editor](policy-checkpoints.md). Mô tả debug đã chuyển lên khối thao tác; biến nằm bên phải trên desktop, sau editor trên màn hình hẹp. Các phần nghiệp vụ lớn vẫn nằm trong nội dung chính bên dưới.

- [Review bước 3 · Khách hàng](http://localhost:3182/journey/policy?group=create&mode=steps&node=map&sim=checked&quote=QUOTE-LEARN-101&sentQuote=QUOTE-LEARN-101&backend=1&debugVersion=2&field=customer)
- [Bắt đầu từ bước 1](http://localhost:3182/journey/policy?group=create&mode=steps&node=quote)
- [Bước 2, chuẩn bị chạy L61](http://localhost:3182/journey/policy?group=create&mode=steps&node=validate&quote=QUOTE-LEARN-101&sentQuote=QUOTE-LEARN-101&backend=1&debugVersion=2)
- [Dừng L67, chuẩn bị vào L70](http://localhost:3182/journey/policy?group=create&mode=steps&node=validate&quote=QUOTE-LEARN-101&sentQuote=QUOTE-LEARN-101&backend=1&debugVersion=2&debug=4&debugMax=4)

Một stepper dùng chung cho sáu bước; nút về bước trước nằm ngay dưới. Vùng Dữ liệu bước nằm trong nội dung chính, cuộn tiếp bên dưới cây và editor. Đã đối chiếu Git diff với bản 32c790b để giữ nội dung riêng của từng bước: biến trước/sau, bộ chọn trường và đường ánh xạ, các bản ghi, checkpoint Flow và kết quả. Bỏ cơ chế tab Code/Dữ liệu và CSS ẩn editor; các phần này cùng hiện trong trang.

Network và Luồng thực thi nằm trong thanh icon dọc rộng 48px ở mép phải khu vực thực hành (40px trên mobile). Tên công cụ hiện khi hover/focus bằng bàn phím; chạm mở panel và đọc tên trong tiêu đề. Phím mũi tên đổi focus giữa các icon; Enter mở công cụ. Mỗi lần mở một panel.

Panel là dialog trượt phủ từ bên phải, rộng 680px trên desktop và toàn màn hình trên mobile, có nút Đóng và hỗ trợ Esc. Panel không tham gia bố cục của cây/editor. Giữ nguyên thanh cuộn của trang để editor không đổi chiều rộng; chặn cuộn nền và trả focus/vị trí cuộn khi đóng. Chọn node luôn đóng panel, mở đúng source/dòng và giữ checkpoint mô phỏng.

Bước 3 giữ đường Quote → dòng Java → CreatePolicyCommand và bản xem trước Policy sắp ghi. Bộ chọn trường cập nhật ánh xạ ngay trong vùng dữ liệu; liên kết Mở dòng Java đưa về đúng L206/L90 hoặc dòng của trường đang chọn. Xác nhận dữ liệu vẫn chuyển sang bước 4 với tiến độ đã giữ.

Toolbar nằm ngoài vùng cuộn của cây và editor. Bỏ dải Network, sơ đồ và thanh “Đang xem x/6” phía trên code; bỏ chiều cao cố định của code và giới hạn tối đa của workstation. Phạm vi đọc và Xuống dòng code cùng nằm trong header. Snapshot hiện chỉ có trích đoạn nên không có tùy chọn Toàn bộ file.

Sơ đồ phân biệt lời gọi method L67 → L70 với đường qua CreatePolicyEvent sang Flow. Trạng thái thực thi và source đang xem độc lập: xem L70 trước khi chạy vẫn giữ checkpoint L67; chỉ Vào runInternal mới đổi checkpoint. Điều kiện chưa chạy giữ trạng thái chưa xác định, nhánh đã chọn và nhánh dừng có dấu riêng. Thứ tự L74 → L75 → L76 → L77 đã đối chiếu với source.

## Ảnh review

| Bước 3 | Desktop 1512 × 1600 | Mobile 390 × 844 |
| --- | --- | --- |
| Đóng panel, code và dữ liệu cùng trong trang | [Đóng panel](policy-step3-desktop-closed.png) | [Đóng panel](policy-step3-mobile-closed.png) |
| Mở Luồng thực thi trên lớp riêng | [Mở sơ đồ](policy-step3-desktop-trace.png) | [Panel trên mobile](policy-step3-mobile-trace.png) |

Tái tạo hai trạng thái bằng `node scripts/capture-policy-step3.mjs` khi Vite chạy ở cổng 3182.

Các ảnh dưới là mốc review trước khi khôi phục dữ liệu vào nội dung chính:

| Trạng thái | Desktop 1512 × 1050 | Mobile 390 × 844 |
| --- | --- | --- |
| Đóng cả hai bảng, bắt đầu L61 | [Code](policy-workbench-desktop-closed.png) | [Code](policy-workbench-mobile-closed.png) |
| Mở sơ đồ, đường vào từ UI/HTTP/Controller | [Sơ đồ](policy-workbench-desktop-trace-entry.png) | [Sơ đồ](policy-workbench-mobile-trace-entry.png) |
| Dừng L67, đích L70 chưa chạy | [Sơ đồ và code](policy-workbench-desktop-trace-L67.png) | [Panel trượt](policy-workbench-mobile-trace-L67.png) |

Script `scripts/capture-policy-workbench.mjs` vẫn dùng để chụp lại ca bước 2 nếu cần.

## Kiểm chứng

- `npm.cmd run build`: typecheck và production build.
- 30 kiểm tra Policy: practice panels (desktop/bàn phím và mobile/chạm), practice, workbench, reading và issuance overview.
- Review bước 3: dữ liệu dưới editor, Khách hàng/Ngày hiệu lực, preview, liên kết L206/L90, thanh icon dọc, hover/focus, Enter/Esc, mở Network và xác nhận sang bước 4.
- So sánh chính xác chiều rộng/chiều cao editor, cuộn code/cây, vị trí trang, file/dòng và tiến độ trước/trong/sau khi mở panel. Cuộn trên nền modal không làm trôi trang.
- Ca chính: bước 1 → 2, L61, L67 → L70, xem source của node mà không chạy mô phỏng, Quote thiếu và Policy trùng.
- Cuộn sâu, đổi phạm vi đọc giữ dòng có trong chế độ mới, mở/đóng Network giữ vị trí, quay về checkpoint, cây cuộn độc lập, dialog mobile và Escape.
- Bước 5 → 4 → 5 giữ Policy ID và tiến độ; đi tiếp bước 6 và đối chiếu Query/Command cùng ID.
- `npm.cmd run verify:fixtures`: 30 fixture nguyên vẹn.
- `node scripts/verify-policy-source.mjs --root D:\ALPACA\agent-system`: 142 trích đoạn đúng nội dung, số dòng và SHA-256; chỉ đọc source.

Chỉ thay đổi Workshop; không sửa repo Java, không commit hoặc push. Dữ liệu thực hành và request vẫn là mô phỏng.
