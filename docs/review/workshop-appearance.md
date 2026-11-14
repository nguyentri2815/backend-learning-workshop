# Review giao diện Sáng / Tối và thanh bước

- [Hiểu và chạy dự án → Đối chiếu profile](http://localhost:3182/journey/environment?experience=project&step=config&task=profile&pfile=dev&pline=33&pview=source&pprofile=dev).
- [Khám phá Policy → Tạo mới → Làm lại từng bước → Ghi Policy · L159](http://localhost:3182/journey/policy?group=create&mode=steps&node=save&sim=command&stop=save-return&at=save-return&reader=context&backend=1&sentQuote=QUOTE-LEARN-101).

Dev server local ở cổng **3182**. [Deep link đầy đủ](appearance-links.json) giữ các tham số sau chuẩn hóa. Màn profile trong ảnh đã chọn dev qua thao tác thật trong bài; dữ liệu YAML được che như source gốc của Workshop. Màn Policy đang xem và dừng tại **Trả kết quả Command · CreatePolicyFunc.runInternal:L159**.

## Ảnh cùng trạng thái và viewport

| Màn | Sáng | Tối |
| --- | --- | --- |
| Đối chiếu profile · desktop 1512 × 1050 | [Sáng](appearance-desktop-profile-light.png) | [Tối](appearance-desktop-profile-dark.png) |
| Ghi Policy · desktop 1512 × 1050 | [Sáng](appearance-desktop-policy-light.png) | [Tối](appearance-desktop-policy-dark.png) |
| Đối chiếu profile · mobile 390 × 844 | [Sáng](appearance-mobile-profile-light.png) | [Tối](appearance-mobile-profile-dark.png) |
| Ghi Policy · mobile 390 × 844 | [Sáng](appearance-mobile-policy-light.png) | [Tối](appearance-mobile-policy-dark.png) |

Ảnh bổ sung: [thanh bước đang xem trên mobile](appearance-mobile-profile-dark-steps.png), [Workshop tối / editor sáng trên desktop](appearance-desktop-policy-editor-light.png), [editor sáng trên mobile](appearance-mobile-policy-editor-light.png), [Luồng thực thi tối](appearance-desktop-trace-dark.png), [modal tối trên mobile](appearance-mobile-trace-dark.png).

## Hành vi để review

1. **Sáng / Tối** nằm cạnh **Tham chiếu**, áp dụng cho toàn Workshop. Mặc định sáng trắng ấm / xanh rừng; tối dùng nền than, chữ trắng ngà và xanh lá nhạt. Các panel, form, modal, sơ đồ và bảng source dùng cùng token màu. Dòng xem lại dùng hổ phách và nhãn; lỗi có nhãn đỏ; nút tắt vẫn đọc được.
2. Bộ chọn **Code → Theo giao diện / Sáng / Tối** mặc định đi theo giao diện chung. Khi chọn riêng, cây file, editor và biến dùng lựa chọn đó; bài học, debug và modal vẫn theo giao diện Workshop. Chọn lại **Theo giao diện** để bỏ ghi đè. Lựa chọn riêng đã lưu từ phiên bản trước vẫn được tôn trọng.
3. Đổi màu tại chỗ giữ URL, dữ liệu mô phỏng, bước, checkpoint đang xem, điểm dừng, tiến độ và vị trí cuộn trang/code. Hai lựa chọn giao diện được lưu riêng, dùng khi chuyển trang và tải lại deep link.
4. Cả **7 bước chạy dự án** và **6 bước Tạo Policy** dùng `LearningSteps`: số + tên, dấu ✓ khi xong, nhãn đang xem/chưa mở và mũi tên trái → phải. Mũi tên sau bước hoàn thành dùng màu đường đã đi; phần còn lại dùng màu phụ. Thao tác bấm và điều kiện mở khóa được giữ nguyên.
5. Màn hẹp cuộn ngang riêng trong thanh bước và tự đưa bước đang xem vào tầm nhìn. Tab **Tạo mới / Danh sách / Chi tiết** vẫn là tab. **Luồng thực thi** tiếp tục hiển thị nhánh code, mở tới checkpoint đang xem và giữ mở khi bấm node.

## Thực hiện và kiểm tra

Palette chung ở `src/workshop-appearance.css`; `src/appearance.ts` lưu giao diện Workshop. Các màu cũ trong CSS dùng `light-dark()` với token ngữ nghĩa cho chế độ tối. Workspace và `CodeBlock` đặt phạm vi màu riêng; Shiki chọn bộ màu cú pháp tương ứng mà không remount viewer. `LearningSteps` cuộn đúng vùng danh sách, tránh cuộn cả trang khi thay bước.

Các ca mới ở `tests/browser/workshop-appearance.spec.ts` kiểm tra profile ở cả hai cột YAML, chuyển trang, override editor, reload, giữ tiến độ/điểm dừng/vị trí đọc, mũi tên và mở khóa, màn hẹp không tràn ngang, xem L61 / dừng L80, modal, Network, lỗi và diff source. Cú pháp trong hai cột YAML tối đạt tỷ lệ tương phản ít nhất **4.5:1**, gồm các dòng tô sáng.

`npm.cmd run build` đã qua, gồm typecheck. Vite vẫn báo cảnh báo bundle lớn hơn 500 kB như trước. Có thể tái chụp bộ ảnh bằng `node scripts/capture-workshop-appearance.mjs` khi dev server đang chạy.

**67 ca kiểm tra liên quan đã qua**: workshop-appearance, handbook, policy-reader-preferences, policy-practice, workshop, setup, setup-graph, project-practice, policy-reading, policy-navigation và policy-trace-modal. Kiểm tra tràn ngang cả ở **390 px** và **360 px**; `git diff --check` đã qua. Kiểm tra tiến độ trong sơ đồ chờ đúng checkbox của từng nhiệm vụ trước khi đánh dấu, tránh chọn nhầm nhiệm vụ cũ trong lúc chuyển nội dung.
