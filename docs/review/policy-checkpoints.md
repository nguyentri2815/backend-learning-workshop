# Review checkpoint và dữ liệu cạnh editor

Lượt mới nhất: [định danh checkpoint chung, nhóm sơ đồ và lời gọi/trả về ở Bước 3](policy-execution.md).

- [Trước khi chạy L61](http://localhost:3182/journey/policy?group=create&mode=steps&node=validate&quote=QUOTE-LEARN-101&sentQuote=QUOTE-LEARN-101&backend=1&debugVersion=2)
- [Xem lại điểm 1/8 ở L61, đã đạt điểm 8 ở L76](http://localhost:3182/journey/policy?group=create&mode=steps&node=validate&quote=QUOTE-LEARN-101&sentQuote=QUOTE-LEARN-101&backend=1&debugVersion=2&sim=checked&debug=1&debugMax=8)
- [Điểm đã đạt L76](http://localhost:3182/journey/policy?group=create&mode=steps&node=validate&quote=QUOTE-LEARN-101&sentQuote=QUOTE-LEARN-101&backend=1&debugVersion=2&sim=checked&debug=8&debugMax=8)

Mô tả checkpoint nằm trong khối thao tác ngay trên code: bước hiện tại, Debug mô phỏng, tên/ý nghĩa checkpoint, điểm đang xem, tiến độ đã đạt, file/dòng, trạng thái và điểm rẽ tiếp theo. Không còn bản debug trùng dưới editor.

Desktop: cây file bên trái, editor ở giữa, Biến trước/Biến sau xếp dọc bên phải. Có thể thu vùng biến để mở rộng editor; object và mảng mở từng cấp. Thanh icon Network/Luồng thực thi nằm ngoài cùng bên phải, panel mở phủ riêng như trước.

Màn hình hẹp: biến nằm ngay sau editor; không ép thành ba cột. Trên mobile, các nút chạy/chuyển điểm nằm ở cuối màn hình để tiếp tục dùng được khi đang xem biến. Mô tả checkpoint cuộn cùng nội dung để dành diện tích đọc.

## Trạng thái và ảnh chụp

`debug` chọn ảnh chụp của điểm đang xem, `debugMax` giữ điểm mô phỏng đã đạt. Chọn một checkpoint đã chạy từ bộ chọn, dòng code hoặc node sơ đồ sẽ đổi mô tả, code và biến cùng lúc. Quay về dòng đang chạy đưa cả ba về điểm đã đạt. Xem source chưa chạy vẫn giữ checkpoint, có nhãn nói rõ source đang đọc khác điểm mô tả/biến.

Trước L61, `quoteId` có giá trị, `optional` chưa gán và Biến sau báo Chưa chạy dòng này. Sau L61, optional mới có kết quả fixture. Chỉ biến được gán/cập nhật tại checkpoint được tô nổi bật. L62/L76 chỉ đọc biến để kiểm tra điều kiện; kết quả nằm trong nhóm Kết quả điều kiện · quan sát, không giả thành một phép gán biến. Vào L70 đổi phạm vi sang tham số `quoteAggregate`; `optional` và `quoteId` vẫn thuộc `exec`.

| Bước | Dữ liệu theo checkpoint |
| --- | --- |
| 1 | quoteId trên URL, request đã gửi và tham số backend |
| 2 | Ảnh chụp trước/sau từng checkpoint; optional, Quote, danh sách Policy, đối tượng QUOTE và kết quả điều kiện đúng lúc |
| 3 | Giá trị nguồn và trường command đang xem; ghi rõ bản xem trước/chưa xác nhận. Bảng ánh xạ và Policy sắp ghi vẫn ở nội dung chính bên dưới |
| 4 | Đầu vào ghi và kết quả ghi đã quan sát của từng điểm. Policy ID chỉ xuất hiện sau bước ghi mô phỏng |
| 5 | Event đầu vào và bản ghi Policy View. Chỉ hiện bản ghi sau khi Flow xử lý event |
| 6 | ID/bộ lọc tra cứu và dữ liệu trả về của thao tác Query/Chi tiết đang xem |

## Ảnh review

| Trạng thái | Desktop | Mobile |
| --- | --- | --- |
| Trước L61 | [Ảnh](policy-checkpoint-desktop-before-L61.png) | [Ảnh](policy-checkpoint-mobile-before-L61.png) |
| Sau L61, mở optional để xem id/quoteCode | [Ảnh](policy-checkpoint-desktop-after-L61.png) | [Ảnh vùng biến](policy-checkpoint-mobile-after-L61.png) |
| Xem L61 sau khi đã đạt L76 | [Ảnh](policy-checkpoint-desktop-review-L61.png) | [Ảnh](policy-checkpoint-mobile-review-L61.png) |
| Quay về L76 | [Ảnh](policy-checkpoint-desktop-reached-L76.png) | [Ảnh](policy-checkpoint-mobile-reached-L76.png) |

Tái tạo bằng `node scripts/capture-policy-checkpoints.mjs` khi Vite chạy ở cổng 3182. Viewport desktop 1512 × 1050, mobile 390 × 844.

## Kiểm chứng

- `npm.cmd run build`: typecheck và production build.
- 36 kiểm tra Policy: checkpoints, practice panels, practice workbench, practice, reading, issuance overview.
- Quote hợp lệ/thiếu tại L61 → L62; trạng thái chưa chạy, object Optional và đánh dấu thay đổi.
- L76 → xem lại L61 → quay về L76, với cả hai chế độ xuống dòng; tiến độ vẫn ở 8/8. Kiểm tra bằng bộ chọn và node sơ đồ.
- Đi đủ sáu bước trên desktop/mobile; không có Policy ID trước khi ghi, không có Policy View trước xử lý event, kết quả tra cứu chỉ xuất hiện sau thao tác tương ứng.
- Thu gọn biến mở rộng editor, dữ liệu dưới editor trên mobile; không tràn ngang. Các kiểm tra panel, bàn phím, tiến độ 5 → 4 → 5 và source vẫn chạy.

Chỉ chỉnh Workshop. Không sửa repo Java, không commit/push.
