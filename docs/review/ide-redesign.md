# Review giao diện IDE sáng / navy

[Mở đúng checkpoint CreatePolicyFunc.runInternal:L70](http://localhost:3182/journey/policy?group=create&mode=steps&node=validate&walk=quote-ui%2Cquote-request%2Ccontroller-call%2Cquote-read%2Cquote-guard%2Cquote-get%2Cinternal-call%2Cinternal-enter&stop=internal-enter&at=internal-enter&sim=idle&sentQuote=QUOTE-LEARN-101&debug=5&debugMax=5&debugVersion=2&traceFrom=create-check&traceLine=67&tracePoint=internal-call&reader=related&backend=1).

Link dùng dev server tại `localhost:3182`. Đường bấm: Khám phá Policy → Tạo mới → Làm lại từng bước → Bước 2, vào runInternal L70. Dữ liệu và tiến trình vẫn là mô phỏng của Workshop.

## Ảnh đối chiếu

Ảnh trước được chụp từ workspace trước khi đổi giao diện. Cả hai ảnh desktop dùng **1512 × 1050**, cùng Quote `QUOTE-LEARN-101`, checkpoint `internal-enter`, điểm dừng **L70**, Bước 2; đều cuộn tới đầu workstation. Ảnh mobile dùng **390 × 844**.

| Màn | Trước | Sau |
| --- | --- | --- |
| Desktop L70 | [Trước](ide-desktop-before-L70.png) | [Sau](ide-desktop-after-L70.png) |
| Mobile L70 | [Trước](ide-mobile-before-L70.png) | [Sau](ide-mobile-after-L70.png) |

Trong ảnh desktop sau: số **2** nền xanh, tên **Kiểm tra Quote** đậm và viền xanh; **◆ Điểm đang dừng: CreatePolicyFunc.runInternal:L70**; nút **→ Điểm sau** xanh dương đang bật. Bước 1 có ✓; tên các bước chưa mở vẫn đọc được.

## Các trạng thái đã kiểm tra

- [Xem lại L67 trên desktop](ide-desktop-review-L67.png): dòng L67 có ● và nền hổ phách; điểm dừng L70 giữ ◆ và vạch xanh. [Mobile](ide-mobile-review-L67.png).
- [Luồng thực thi desktop](ide-desktop-trace-L70.png), [mobile](ide-mobile-trace-L70.png): mở tại checkpoint đang xem; bấm node/checkpoint giữ modal mở và giữ vị trí trang phía sau; nút Điểm đang dừng đưa sơ đồ/code/biến về cùng mốc. Kiểm tra khoảng cách node khi mở cả sáu nhóm.
- [Network desktop](ide-desktop-network.png), [mobile](ide-mobile-network.png): trạng thái đang xử lý màu xanh, thông tin request và kết quả dễ đọc.
- [Code L70 trên mobile](ide-mobile-after-code-L70.png): chữ code 13 px, có xuống dòng; bốn nút điều hướng cố định ở cạnh dưới. Giải thích checkpoint có thể mở thêm; khi chuyển điểm, mobile cuộn tới editor.
- [Biến vừa đổi tại L74](ide-mobile-changed-L74.png): chỉ dòng biến thay đổi có nền xanh lá nhẹ và nhãn Vừa cập nhật; hai panel Biến trước / Biến sau dùng nền trắng.
- [Tổng quan](ide-overview.png), [Hiểu và chạy dự án](ide-setup.png): dùng chung sidebar navy, nút xanh dương, chữ và trạng thái chọn.

## Phạm vi và kiểm tra

Token chung nằm trong `src/styles.css`: màu, surface, viền, focus, font UI/code, cỡ chữ và trạng thái. `src/workshop-theme.css` áp dụng cho shell, Tổng quan, Setup, Policy và các vùng source. Code dùng Shiki theme sáng đang có. Thay đổi React chỉ phục vụ dấu trạng thái, giải thích trên mobile, cuộn tới editor, khoảng cách node và ổn định nền khi modal mở.

Không thay đổi model nghiệp vụ, fixtures, thứ tự checkpoint hay dữ liệu mô phỏng trong lượt này. Các thay đổi có sẵn trong workspace được giữ lại.

`npm.cmd run build` đã thành công, gồm typecheck và build. **58 kiểm thử liên quan đã qua** trong các nhóm checkpoint, thực thi, điều hướng, panel, modal, đọc Policy, toàn cảnh phát hành, Setup và Workshop. Hai kiểm tra cỡ chữ Setup đã cập nhật theo yêu cầu 14–15 px; vòng kiểm tra checkbox chờ đúng nội dung thao tác mở xong trước khi tick. Vite còn cảnh báo bundle lớn hơn 500 kB.

Tái chụp ảnh sau bằng `node scripts/capture-ide-review.mjs after` khi dev server đang chạy. Script kiểm tra Bước 2, điểm dừng L70, nút Điểm sau, xem lại L67, modal giữ mở, node không đè nhau, dòng biến thay đổi và không tràn trang trên mobile. Không chạy lại chế độ `before` trên source mới để tránh ghi đè ảnh gốc. Link trạng thái đầy đủ lưu trong [ide-after-links.json](ide-after-links.json).
