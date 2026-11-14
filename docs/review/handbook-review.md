# Review sổ tay thực hành kỹ thuật

- [Hiểu và chạy dự án → Java và IDE → F1](http://localhost:3182/journey/environment?experience=project&step=tools&task=java&pfile=build&pline=48&pview=source).
- [Khám phá Policy → Tạo mới → Bước 4 · Ghi Policy → runInternal:L159](http://localhost:3182/journey/policy?group=create&mode=steps&node=save&sim=command&stop=save-return&at=save-return&reader=context&backend=1&sentQuote=QUOTE-LEARN-101&traceFrom=create-quote&traceLine=233&tracePoint=published-write).

Hai link dùng dev server local tại cổng **3182**. Link thứ hai mở checkpoint **Trả kết quả Command** đã chạy; **Bước sau** là thao tác tiếp tục sang bước 5. [Link đầy đủ đúng trạng thái ảnh](handbook-after-links.json) giữ cả log checkpoint và đường từ nơi gọi.

## Trước / sau cùng viewport

Ảnh trước được chụp từ workspace trước khi thay đổi ở lượt này. Desktop dùng **1512 × 1050**, mobile dùng **390 × 844**. Trạng thái F1 mở `build.gradle:48`; Policy dùng cùng Quote `QUOTE-LEARN-101`, đang xem và dừng tại `save-return` / `CreatePolicyFunc.runInternal:L159`, source ở chế độ mở rộng ngữ cảnh.

| Màn | Trước | Sau |
| --- | --- | --- |
| Java và IDE · F1 · desktop | [Trước](handbook-desktop-before-F1.png) | [Sau](handbook-desktop-after-F1.png) |
| Ghi Policy · L159 · desktop | [Trước](handbook-desktop-before-L159.png) | [Sau](handbook-desktop-after-L159.png) |
| Java và IDE · F1 · mobile | [Trước](handbook-mobile-before-F1.png) | [Sau](handbook-mobile-after-F1.png) |
| Ghi Policy · L159 · mobile | [Trước](handbook-mobile-before-L159.png) | [Sau](handbook-mobile-after-L159.png) |

Ảnh bổ sung: [đọc code F1 trên mobile](handbook-mobile-after-F1-code.png), [Luồng thực thi tại L159](handbook-desktop-trace-L159.png), [modal mobile](handbook-mobile-trace-L159.png), [editor tối desktop](handbook-desktop-dark-L159.png), [editor tối mobile](handbook-mobile-dark-L159.png).

## Bố cục và thao tác

Điều hướng bốn hành trình nằm trên đầu trang; màn hẹp dùng menu. **Tham chiếu** chứa Nguồn & phạm vi, repo, tiến độ và thao tác đặt lại. Chuyển hành trình giữ URL bài vừa xem. Menu hỗ trợ Escape và đóng khi chọn đường dẫn hoặc bấm ra ngoài.

Setup mở bằng tên bài, **Bước 2/7 · Java và IDE** và tiến độ tự kiểm tra. Bảy bước dùng thanh số/tên ngắn, hai chế độ học nằm ngay bên dưới. Bộ chọn **Nhiệm vụ trong bước** chỉ có F1/F2/F3 ở bước Java và IDE, kèm **Trước / Sau**. Ba vùng Project, nội dung thao tác và nhiệm vụ được tách bằng đường mảnh. F1 làm rõ file `build.gradle`, số dòng **48** cần bấm, nhiệm vụ cần làm và kết quả quan sát. Chuyển nhiệm vụ không tự hoàn thành bài.

Policy có đầu bài **Bước 4/6 · Ghi Policy**, checkpoint **Trả kết quả Command**, gợi ý sang bước 5 và nút **Bước sau** xanh rừng. Debug mở ở dạng gọn, luôn có vị trí đang xem và bốn nút; mở chi tiết tại chỗ để đọc giải thích và đường gọi. Khi xem lại, điểm dừng được hiển thị riêng. Mobile dùng bộ chọn bước gọn. Cây file, editor và biến dùng phần ngang đã thu hồi từ sidebar; dòng L159 và các dòng lân cận nằm dưới thanh ghim.

**Network / Luồng thực thi** giữ ở mép workspace. Sơ đồ mở tới checkpoint đang xem và vẫn mở khi chọn node. **Sáng / Tối** ở header editor; lựa chọn và vùng đọc được giữ khi thay đổi giao diện, qua reload. Chế độ tối chỉ áp dụng workspace code.

## Hệ thiết kế chung

Token ở `src/styles.css`: nền `#F7F6F2`, panel `#FFFFFF`, chữ `#20241F` / `#505950`, viền `#D9DED5`, xanh rừng `#245746`, hổ phách cho xem lại và đỏ cho lỗi. Trạng thái kèm nhãn hoặc dấu ✓ / ◆ / ●. Font UI dùng cho hướng dẫn; tiêu đề 26–28 px, nội dung 14–15 px. Code, biến và vị trí nguồn dùng monospace 13–14 px; metadata nhỏ hơn. `src/notebook.css` áp dụng bố cục, khoảng cách, phân cách và responsive cho toàn Workshop.

Thay đổi React chính nằm trong `NotebookNavigation`, `ActionWorkspace`, `ProjectPractice` và `CreatePolicyLesson`. Model, fixtures, source Java trích đoạn, trình tự checkpoint và các namespace tiến độ học được giữ nguyên. Các thay đổi có sẵn trong workspace được giữ lại.

## Kiểm tra

`npm.cmd run build` đã thành công, gồm typecheck và Vite build. Vite còn cảnh báo bundle lớn hơn 500 kB.

**70 ca browser liên quan đã qua** sau khi cập nhật bộ chọn nhiệm vụ và điều hướng: handbook, workshop, setup, project-practice, policy-reading, policy-reader-preferences, policy-trace-modal, policy-execution, policy-navigation, policy-practice-panels, policy-practice và runtime-practice. Có cả desktop và mobile; lỗi mô phỏng vẫn hiện nhãn đỏ khi thanh debug đang thu gọn, và có thể mở chi tiết để thử lại. `git diff --check` đã qua.

Các ca mới trong `tests/browser/handbook.spec.ts` kiểm tra bố cục ba vùng, F1/F2/F3, tiến độ sau thao tác thật trong bài, hai chế độ học, chuyển bước, deep link và reload, L159 không bị thanh ghim che, nút tiếp theo, modal giữ mở khi chọn node, theme được lưu và menu trên màn hẹp. Các kiểm tra cũ đã dùng bộ chọn nhiệm vụ và điều hướng đầu trang mới.

Tái chụp ảnh sau bằng `node scripts/capture-handbook-review.mjs after` khi dev server đang chạy. Không chạy lại chế độ `before` trên source mới để tránh ghi đè ảnh đối chiếu gốc.
