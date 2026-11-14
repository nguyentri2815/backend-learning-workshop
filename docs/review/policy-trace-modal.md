# Review modal Luồng thực thi — 09/11/2026

Áp dụng cùng hành vi cho cả sáu bước. Chọn node hoặc dòng checkpoint giữ modal mở và vị trí cuộn trong sơ đồ. Chỉ đổi điểm đang xem, code và biến; không thực thi, đổi `stop`, thay dữ liệu hoặc thêm checkpoint vào `walk`. Modal đóng bằng nút Đóng hoặc `Esc`.

Khi mở, tự mở nhóm chứa checkpoint đang xem và chờ node có layout rồi cuộn riêng vùng sơ đồ tới cả node và dòng checkpoint. File tham chiếu dùng checkpoint đang xem gần nhất trong bài. Bấm **Điểm đang dừng** mở nhóm và cuộn về checkpoint mô phỏng, đồng bộ editor/biến, vẫn giữ modal mở. Những node lân cận và các nhóm đã mở không bị dựng lại theo mỗi lần chọn.

- [Ca chính: mô phỏng dừng L61, đang xem Bước 3 · điểm 6/15 · L87](http://localhost:3182/journey/policy?group=create&mode=steps&node=map&walk=quote-ui%2Cquote-request%2Ccontroller-call%2Cquote-read&stop=quote-read&at=status-return)
- [Ca Bước 6: mô phỏng vẫn dừng L61, đang xem Command trả chi tiết](http://localhost:3182/journey/policy?group=create&mode=steps&node=result&walk=quote-ui%2Cquote-request%2Ccontroller-call%2Cquote-read&stop=quote-read&at=detail-read)

Mở **Luồng thực thi** bằng icon bên phải. Ở ca chính, modal phải mở tại **Trả về nơi gọi · gán status**, tô sáng checkpoint L87. Chọn node hoặc checkpoint bên cạnh để xem, rồi bấm **Điểm đang dừng** để trở về L61. Checkpoint tương lai chỉ có dữ liệu khi mô phỏng thực sự chạy tới đó; xem source không sinh kết quả tương lai.

| Thiết bị | Bước 3 · L87 | Trở về L61 | Bước 6 |
|---|---|---|---|
| Desktop 1512 × 1050 | [Ảnh](./policy-trace-modal-desktop-step3-L87.png) | [Ảnh](./policy-trace-modal-desktop-stop-L61.png) | [Ảnh](./policy-trace-modal-desktop-step6.png) |
| Mobile 390 × 844 | [Ảnh](./policy-trace-modal-mobile-step3-L87.png) | [Ảnh](./policy-trace-modal-mobile-stop-L61.png) | [Ảnh](./policy-trace-modal-mobile-step6.png) |

Tạo lại ảnh: `node scripts/capture-policy-trace-modal.mjs`. URL đầy đủ lưu trong [policy-trace-modal-links.json](./policy-trace-modal-links.json).

Kiểm tra browser gồm 6 ca mới: tự mở tại L87 / Bước 6 trên desktop và mobile; chọn node/checkpoint giữ modal và cả hai tọa độ cuộn; trở về L61 nhiều lần; đóng/mở lại; `Esc`/Đóng; file tham chiếu; duyệt node UI, request và source của cả sáu bước với cùng điểm dừng. Kiểm tra hồi quy luồng, panel và workbench cũng được cập nhật theo hành vi modal mới.

Build và `git diff --check` đạt. Vite vẫn có cảnh báo kích thước chunk lớn. Không sửa Java, không commit hoặc push.
