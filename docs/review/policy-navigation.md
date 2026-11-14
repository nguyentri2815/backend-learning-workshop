# Review điều hướng Policy — 08/11/2026

Áp dụng cho sáu bước. Bốn nút giữ icon, nhãn và thứ tự: **⇤ Bước trước · ← Điểm trước · → Điểm sau · ⇥ Bước sau**. Desktop giữ nhóm trong thanh debug; mobile ghim nhóm 2 × 2 ở đáy màn hình. Tên hành động cụ thể và lý do chưa được đi tiếp nằm ở dòng **Thao tác tiếp theo**.

- [Review bước 2: xem L75, mô phỏng đã chạy L76](http://localhost:3182/journey/policy?group=create&mode=steps&node=validate&walk=quote-ui%2Cquote-request%2Ccontroller-call%2Cquote-read%2Cquote-guard%2Cquote-get%2Cinternal-call%2Cinternal-enter%2Cduplicate-read%2Cobjects-read%2Cduplicate-guard&stop=duplicate-guard&at=objects-read&sim=checked&sentQuote=QUOTE-LEARN-101&debug=7&debugMax=8&debugVersion=2&traceFrom=create-check&traceLine=76&tracePoint=duplicate-guard&reader=related&backend=1)
- [Review bước 3: vừa vào L80, chưa chạy dòng này](http://localhost:3182/journey/policy?group=create&mode=steps&node=map&walk=quote-ui%2Cquote-request%2Ccontroller-call%2Cquote-read%2Cquote-guard%2Cquote-get%2Cinternal-call%2Cinternal-enter%2Cduplicate-read%2Cobjects-read%2Cduplicate-guard&stop=map-dates&at=map-dates&sim=checked&sentQuote=QUOTE-LEARN-101&debug=0&debugMax=8&debugVersion=2&traceFrom=create-check&traceLine=76&tracePoint=duplicate-guard&reader=context&backend=1&traceVia=%C4%90%E1%BB%A7+%C4%91i%E1%BB%81u+ki%E1%BB%87n+%C2%B7+runInternal%3AL76+%E2%86%92+L80)
- [Trạng thái URL đầy đủ](./policy-navigation-links.json)

**Điều hướng**

- Điểm trước chỉ xem lại trong cùng bước. Bước trước chỉ xem lại, giữ checkpoint mô phỏng và dữ liệu.
- Điểm sau khi xem lại chỉ mở checkpoint kế đã chạy; khi tại checkpoint mô phỏng thì thực thi mốc hợp lệ tiếp theo, kể cả mốc cuối chưa chạy.
- L76 hợp lệ đã chạy: Điểm sau tắt, Bước sau bật. Quote thiếu / Policy trùng: Bước sau và các bước tương ứng trên stepper vẫn tắt.
- Bước sau mở đúng điểm đầu của bước kế. Quay lại bước đã mở giữ tiến độ và Policy ID.

**Source và Explorer**

- Nhận diện cùng file bằng toàn bộ đường dẫn, dù snapshot có ref khác nhau. L76 → L80 giữ CreatePolicyFunc.java trên cây và mở ngữ cảnh đã có; L79 được đánh dấu thiếu trong snapshot.
- L102 → L204 hiển thị cùng file, gọi fillMissingValue; khi trở về hiển thị runInternal:L103. Controller L45 → exec L61 hiển thị chuyển file. UI / request và ranh giới event có nhãn riêng.
- Hai nút Explorer **Mở vị trí đang xem** / **Xem vị trí trước** có icon, viền, hover/focus và tên file, method, dòng. Mở vị trí đang xem giữ liên kết vị trí trước. Quay về dòng đang chạy đồng bộ checkpoint, editor và biến.
- Đổi chế độ đọc giữ vị trí đọc bằng anchor riêng, không thay checkpoint hay biến.

**Ảnh đã kiểm tra trực tiếp**

| Thiết bị | Bước 2 · xem lại L75 | Bước 3 · L76 → L80 |
|---|---|---|
| Desktop 1512 × 1050 | [Ảnh](./policy-navigation-desktop-step2.png) | [Ảnh](./policy-navigation-desktop-L80.png) |
| Mobile 390 × 844 | [Ảnh](./policy-navigation-mobile-step2.png) | [Ảnh](./policy-navigation-mobile-L80.png) |

Tạo lại ảnh: `node scripts/capture-policy-navigation.mjs`.

**Kiểm tra**

- 45 ca browser Policy đã qua, gồm điều hướng mới, checkpoint/biến, cả sáu bước, Optional và Policy trùng, mapping, panel, bàn phím, desktop/mobile, overview và bài đọc hiện có.
- Đã chạy lại 25 ca liên quan sau khi làm mới CSS preview; 7 ca điều hướng chốt kiểm tra thêm vị trí bốn nút khi bật/tắt và liên kết Explorer.
- `npm.cmd run build`: đạt. Vite vẫn báo kích thước chunk lớn.
- `npm.cmd run verify:fixtures`: 30 fixture đúng checksum.
- `node scripts/verify-policy-source.mjs --root D:\ALPACA\agent-system`: 142 trích đoạn đúng source, số dòng và SHA-256; chỉ đọc.
- `git diff --check`: đạt.

Chỉ sửa Workshop. Không sửa repo Java; không commit hoặc push.
