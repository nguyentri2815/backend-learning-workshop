# Danh sách dùng cùng khung học với Tạo mới

[Review và bảy cặp ảnh](http://localhost:3182/docs/review/policy-list-shared.html) · [Bắt đầu Danh sách](http://localhost:3182/journey/policy?group=list&mode=overview).

Đã đối chiếu lịch sử Git từ `32c790b`, các tài liệu workbench/checkpoint/assembly/pattern/implementation trong `docs/review`, component, dữ liệu và test Tạo mới. Đã thao tác bản chạy tại localhost:3182 ở màn toàn cảnh, `CreatePolicyFunc.exec:L61`, bước 2/6 trong cả Suy luận/Phối hợp/Chọn mẫu và hai chế độ cửa sổ workspace. Script tái hiện: `scripts/review-policy-reference.mjs`; ghi nhận tại [shared-reference-observations.json](shared-reference-observations.json).

## Phần dùng chung

| Phần hiển thị / hành vi | Component dùng cho cả hai bài |
| --- | --- |
| Toàn cảnh, toolbar, kéo/reset, đường học và chú giải | `LearningOverviewFrame`, `LearningJourneyDiagram` |
| Thanh bước, mở/khóa bước, tiến/lùi và xem lại checkpoint | `LearningSteps`, `checkpointNavigation` |
| Bốn nút debug và Mở chi tiết | `CheckpointActionBar`, `useCheckpointToolbar` |
| Cây file, code, biến và vị trí hiện tại/trước | `CheckpointCodeWorkspace`, `SourceEditorColumns`, `PracticeTreePositions`, `CheckpointVariables` |
| Network và Luồng thực thi | `PracticeTools`, `PracticeSidePanel` |
| Tiêu đề/bộ dữ liệu, quyết định, gợi ý/phản hồi, bàn giao bên phải | `LearningAssemblyLesson`, `LearningTechnicalReference` |
| Khung mẫu, sao chép, source A/B, excerpt/full file, cây và cửa sổ sơ đồ | `LearningPatternWorkspace`, `LearningSources`, `AssemblySourceView` |
| Điều hướng lượt triển khai theo trạng thái URL mới nhất | `implementationPosition` |

Phần Tạo mới còn gắn dữ liệu đã được đưa qua `create-pattern-adapter`; Danh sách dùng `list-learning-data` và `list-pattern-adapter`. Cùng một phần hiển thị nhận catalog source, câu hỏi, giá trị bàn giao, cặp code và mô hình sơ đồ riêng. Giữ các cặp source Tạo mới đã xác minh và các bài triển khai riêng cho nghiệp vụ của từng bài.

## Hành trình và khác biệt có căn cứ

Giữ **bốn bước**, vì chúng có các ranh giới đầu vào/kết quả rõ trong source:

| Bước | Đầu vào → việc học → đầu ra |
| --- | --- |
| Tìm hợp đồng | Tiêu chí chưa gửi → nhập và bấm Tìm → Controller/DTO nhận request. Checkpoint `list-api`, `list-input`. |
| Xác định hợp đồng được hiển thị | Request + danh tính backend → quan sát phạm vi và ghép AND → SQL/điều kiện đưa xuống truy vấn. Checkpoint `list-scope`, `list-filter`. |
| Xem kết quả và đổi trang | SQL + Pageable → count/OFFSET/LIMIT, ánh xạ → bảng và request trang mới giữ tiêu chí/danh tính đã gửi. Checkpoint `list-page`, `list-result`, `list-table`. |
| Mở chi tiết | Dòng có thật trong trang → chọn dòng → ID nguyên vẹn sang GET `/policy/{id}`. Checkpoint `list-handoff`. |

Các node toàn cảnh mô tả hành động/kết quả. Có nhánh có kết quả, không khớp tiêu chí và lỗi được trả thành trang rỗng; đổi trang nằm sau nhánh có thể đổi trang. Nút **Làm lại từng bước** đặt tại đầu vào. Lớp checkpoint/source mở sâu theo bước; nút quay lại giữ đúng bước đang học.

Danh sách có JSON body và phạm vi backend; Tạo mới nhận quoteId trên path. Vì vậy vùng thao tác dùng form tìm hoặc bảng kết quả thay cho Quote mẫu. Cấu trúc toolbar/cây/code/biến giữ chung. Danh sách có đủ snapshot file Java nên cho mở toàn file; source thực hành Tạo mới vẫn ghi rõ giới hạn trích đoạn của nó. Workspace triển khai Danh sách chỉ bỏ đoạn của bước hiện tại, giữ các phần khác có sẵn để tập trung lắp lại; thứ tự lượt theo phụ thuộc được ghi tại từng bước.

Ở bước 2, trước/sau có tiêu chí và danh tính/phạm vi, sau đó là keyword chuẩn hóa và điều kiện có nguồn `backend`/`search`. Suy luận hỏi vì sao một dòng được hiện; bảng bên phải cho dữ liệu dòng, `pathSaleUnitIds`, trạng thái và tiêu chí. Phối hợp chỉ ra giá trị SQL/Pageable cụ thể. Khung source giữ màu A/B, kể cả khi hai phía cùng nằm trong `SearchPolicyFunc.java`. Quay lại thực hành giữ nguyên điểm dừng.

## Kiểm chứng

- Đã đi hết tìm → checkpoint phạm vi/filter → lắp ráp → cặp code → sơ đồ/full file → triển khai trước/sau → quay lại checkpoint → nhận trang → đổi trang → chọn dòng → Chi tiết. Script: `scripts/capture-shared-policy.mjs`.
- Bộ Danh sách kiểm tra thêm mobile 390×844, nhánh rỗng/catch, danh tính, các filter, default, deep link/alias, xem lại và quay lại Tạo mới. Có kiểm tra không gọi endpoint backend và không lỗi JavaScript trong lượt học.
- Bộ hồi quy Tạo mới kiểm tra toàn cảnh/drag/reset, L61 và biến trước/sau, mở/khóa bước, sáu bước lắp ráp, A/B/full source, workspace triển khai và đọc Policy. Ca kiểm tra vị trí cuộn chờ tab thực sự kích hoạt trước khi đọc tọa độ.
- Kiểm tra lặp phát hiện điều hướng lượt triển khai có thể dùng chỉ số render cũ khi bấm nhanh. Đã dùng chung hàm đọc vị trí từ URL mới nhất và gộp kết quả thử từ trạng thái mới nhất. Hai test bấm liên tiếp Trước/Tiếp theo trong cùng lượt JS xác nhận cả Tạo mới và Danh sách giữ đúng lượt sau reload.
- Build gồm TypeScript đã đạt; Vite còn cảnh báo chunk lớn. Fixture integrity: 38 file. Audit readonly khớp **23 file Java đầy đủ** trong `D:/ALPACA/agent-system`. `git diff --check` đạt.

**Kết quả:** 20/20 kiểm tra cuối đạt (3,1 phút), gồm 11 kiểm tra Danh sách/model, 7 kiểm tra workspace triển khai Tạo mới và 2 kiểm tra bấm nhanh cho cả hai bài. Kiểm tra bổ sung cạnh trong Luồng thực thi/deep link cũng đạt. Bộ hồi quy rộng đã chạy 53 ca; 46 ca ngoài phần triển khai đạt, và toàn bộ 7 ca triển khai đã chạy lại đạt sau khi sửa race. Tổng cộng 66 ca khác nhau được kiểm tra qua các lượt này. [Ghi nhận kết quả](shared-policy-validation.json).

Ảnh: bảy cặp tại 1440×1000, zoom 100%, cùng deviceScaleFactor=1; thêm cặp khung A/B khi cuộn đến code, ảnh full source và ảnh request đổi trang. Khác biệt chiều cao nội dung đến từ dữ liệu nghiệp vụ riêng, không dùng một layout lắp ráp khác.

```powershell
npm.cmd run build
npm.cmd run verify:fixtures
node scripts/extract-policy-list-source.mjs --root D:/ALPACA/agent-system --check
node scripts/review-policy-reference.mjs
node scripts/capture-shared-policy.mjs
node scripts/build-shared-policy-review.mjs
npx.cmd playwright test tests/browser/policy-implementation-navigation.spec.ts tests/browser/policy-implementation-practice.spec.ts tests/browser/policy-list.spec.ts tests/browser/policy-list-journey.spec.ts --output=.verification/shared-final
```

Chưa chạy Java/API/DB thật hoặc xác minh HTTP/JSON runtime, quyền endpoint Chi tiết, độ trễ ghi view và thứ tự kết quả khi không có sort. Dữ liệu Workshop là fixture; mẫu tái tục có quy tắc phạm vi khác nên chỉ dùng đối chiếu theo ghi chú trong bài.
