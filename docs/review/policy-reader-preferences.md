# Workspace Policy: Sáng / Tối và checkpoint gọn / chi tiết

[Review local — xem L61, dừng L80](http://localhost:3182/journey/policy?group=create&mode=steps&node=validate&walk=quote-ui%2Cquote-request%2Ccontroller-call%2Cquote-read%2Cquote-guard%2Cquote-get%2Cinternal-call%2Cinternal-enter%2Cduplicate-read%2Cobjects-read%2Cduplicate-guard&stop=map-dates&at=quote-read&sim=checked&sentQuote=QUOTE-LEARN-101&debug=1&debugMax=8&debugVersion=2&traceFrom=create-data&traceLine=80&tracePoint=map-dates&reader=context&backend=1).

Đường bấm: **Khám phá Policy → Tạo mới → Làm lại từng bước**. Mở link, cuộn xuống workspace để thanh checkpoint ghim và tự chuyển sang dạng gọn. Cả sáu bước dùng cùng thanh checkpoint và lựa chọn màu.

## Ảnh so sánh cùng checkpoint

Tất cả ảnh dưới đây cùng Quote `QUOTE-LEARN-101`, đang xem `quote-read` / **CreatePolicyFunc.exec:L61**, mô phỏng dừng tại `map-dates` / **CreatePolicyFunc.runInternal:L80**. Điểm L80 chưa chạy. Hai ảnh của mỗi hàng dùng cùng viewport và cùng vị trí cuộn trong code.

| Viewport / chế độ | Thanh gọn | Mở chi tiết |
| --- | --- | --- |
| Desktop 1512 × 1050 · sáng | [Ảnh gọn](reader-desktop-compact-light-L61-stop-L80.png) | [Ảnh mở](reader-desktop-expanded-light-L61-stop-L80.png) |
| Desktop 1512 × 1050 · tối | [Ảnh gọn](reader-desktop-compact-dark-L61-stop-L80.png) | [Ảnh mở](reader-desktop-expanded-dark-L61-stop-L80.png) |
| Mobile 390 × 844 · sáng | [Ảnh gọn](reader-mobile-compact-light-L61-stop-L80.png) | [Ảnh mở](reader-mobile-expanded-light-L61-stop-L80.png) |
| Mobile 390 × 844 · tối | [Ảnh gọn](reader-mobile-compact-dark-L61-stop-L80.png) | [Ảnh mở](reader-mobile-expanded-dark-L61-stop-L80.png) |

## Hành vi

- **Sáng / Tối** nằm cạnh **Xuống dòng code** trên header workspace. Mặc định sáng; lựa chọn lưu ở `backend-learning-workshop.policy.code-theme.v1`. Editor tối dùng `#1E1F22`; cây file và biến dùng nền `#2B2D30`. Java được tô lại cú pháp, không remount viewer. File, dòng, cuộn ngang/dọc và tiến trình mô phỏng giữ nguyên khi đổi màu.
- **● Xem L61** dùng hổ phách; **◆ Dừng L80** dùng xanh dương. Hai dấu có nền/vạch lề riêng trên code và nhãn vị trí trên thanh gọn. Trên desktop hiện tên method; trên mobile rút gọn nhãn vị trí để giữ thanh trong hai hàng.
- Khi thanh ghim, tự thu gọn nếu người học chưa chọn cách hiển thị. **Mở chi tiết / Thu gọn** với chevron giữ lựa chọn trong lúc cuộn và điều hướng qua các checkpoint. Bốn nút điều hướng luôn nằm trên thanh. Bấm **Điểm sau** khi xem lại chỉ chuyển điểm đang xem; không chạy L80 hoặc thêm checkpoint vào log.
- Phần chi tiết có mô tả, bộ chọn checkpoint, đường gọi, nút quay về dòng đang chạy khi xem lại và thao tác tiếp theo. Trên màn hẹp, phần này cuộn riêng; các link source ở chân editor cuộn ngang trong một hàng. Code nhận phần chiều cao còn lại dưới thanh; chọn checkpoint đưa dòng đang xem vào vùng đọc.
- Đóng/mở chi tiết không đổi checkpoint hoặc remount code. Modal Luồng thực thi/Network giữ hành vi mở và giữ vị trí đọc; điều hướng bằng bàn phím trong thanh công cụ dùng focus không cuộn trang.

## Kiểm tra và tái tạo

Script `node scripts/capture-policy-reader-preferences.mjs` tái tạo trạng thái bằng điều hướng thật, chụp đủ tám ảnh, đổi tối rồi reload để xác nhận lưu lựa chọn. Cần dev server đang chạy tại `http://localhost:3182`.

Các kiểm tra mới trong `tests/browser/policy-reader-preferences.spec.ts` xác nhận mặc định sáng, tự thu khi ghim, hai vị trí L61/L80, nút tiếp theo khả dụng, hai hàng trên mobile, không đổi file/URL/cuộn khi mở chi tiết hoặc đổi màu, nhãn/dấu checkpoint khác nhau, lựa chọn tồn tại sau reload, và áp dụng cả sáu bước. Kiểm tra cũ đã mở chi tiết rõ ràng trước khi dùng bộ chọn hoặc nút quay về đang được thu gọn.

**Đã chạy thành công `npm.cmd run build` và 40 kiểm thử trình duyệt** thuộc các nhóm reader preferences, checkpoint, execution, navigation, practice workbench, panels, trace modal và Workshop. `git diff --check` cũng đạt. Cảnh báo bundle >500 kB của Vite vẫn còn.

## Source chính

- `src/workshop/code-preferences.ts`: lựa chọn màu có lưu trên trình duyệt.
- `src/workshop/CodeBlock.tsx`: theme cú pháp sáng/tối, giữ cùng viewer và scroll state.
- `src/policy/PolicySourceExplorer.tsx`: nút màu cạnh xuống dòng code.
- `src/policy/use-checkpoint-toolbar.ts`: ghim, tự gọn và lựa chọn mở/thu chủ động; đo chiều cao thanh trước khi viewer đặt dòng.
- `src/policy/CreatePolicyLesson.tsx`: thanh gọn, hai vị trí, bốn nút và phần chi tiết dùng chung sáu bước.
- `src/policy/policy-reader-preferences.css`: màu tối, bố cục hai hàng, chiều cao editor và dấu checkpoint.

Không đổi model nghiệp vụ, fixtures hay thứ tự mô phỏng trong lượt này. Các thay đổi đã có trong workspace được giữ lại. [Link trạng thái đầy đủ](reader-preferences-links.json).
