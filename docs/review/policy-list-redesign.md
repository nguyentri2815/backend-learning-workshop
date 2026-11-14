# Danh sách theo hành trình nghiệp vụ

Review trên bản đang chạy: [ảnh đối chiếu và link tương tác](http://localhost:3182/docs/review/policy-list-redesign.html).

| Cách học | Danh sách | Tạo mới làm chuẩn |
| --- | --- | --- |
| Nhìn toàn cảnh | [Mở bài](http://localhost:3182/journey/policy?group=list&mode=overview) · [ảnh](list-redesign-list-overview.png) | [ảnh](list-redesign-create-overview.png) |
| Làm lại từng bước | [Bắt đầu tìm](http://localhost:3182/journey/policy?group=list&mode=steps) · [ảnh](list-redesign-list-steps.png) | [ảnh](list-redesign-create-steps.png) |
| Tư duy lắp ráp | [Bước 2](http://localhost:3182/journey/policy?group=list&mode=assembly&node=list-scope) · [ảnh](list-redesign-list-assembly.png) | [ảnh](list-redesign-create-assembly.png) |

Ảnh cùng viewport 1440×1000, zoom 100%, deviceScaleFactor=1. [Metadata](list-redesign-links.json) ghi thêm các cặp ở 390×844, giao diện sáng và tối. Có 24 ảnh đối chiếu, [ảnh khung A/B](list-redesign-pattern.png) và [ảnh triển khai](list-redesign-implementation.png).

## Căn cứ từ Tạo mới và source

Đã đi qua ba mode tại localhost:3182 bằng Playwright: chọn bước, dùng Điểm sau/Bước sau để mở checkpoint, xem source đã tô sáng, trả lời hai quyết định của bước 1, chuyển Suy luận → Phối hợp → Chọn mẫu, mở Khung thành phần, mở sơ đồ rồi Từng bước triển khai. Script tái hiện: `scripts/review-list-baseline.mjs`; [ghi nhận trực tiếp](list-redesign-baseline.json).

Đã đọc `PolicyWorkspace`, `CreatePolicyLesson`, `PolicyCreationOverview`, `PolicyAssembly`, `PolicyAssemblyLearning`, `PolicyPatternWorkspace`, `PolicyImplementationPractice`, `LearningSteps`, `CheckpointVariables`, cùng các component/source hiện có của Danh sách.

Dùng lại `LearningSteps`, `CheckpointVariables`, `SourceTree`, `TemplateCode`/`CodeBlock` và cách trình bày thanh debug, thanh quyết định, Suy luận/Phối hợp/Chọn mẫu của Tạo mới. CSS bố cục đầu trang được mở rộng sang Danh sách. Giữ source reader/implementation workspace riêng của Danh sách để dùng đúng snapshot Java đã xác minh, không trộn source của hai tính năng.

Giữ nguyên bốn bước đề xuất. Căn cứ là ranh giới đầu vào, tập dữ liệu được phép xem, trang kết quả và ID sang endpoint kế tiếp trong source:

| Bước dùng chung ở cả ba mode | Checkpoint kỹ thuật | Bằng chứng |
| --- | --- | --- |
| Tìm hợp đồng | `list-api`, `list-input` | Query `PolicyController.search` L21–26; `SearchPolicyRequest` L14–33; `BasePageRequest` mặc định trang 0, cỡ 10 |
| Xác định hợp đồng được hiển thị | `list-scope`, `list-filter` | `SearchPolicyFunc.doFilter` L38–53 xác định phạm vi; L54–107 ghép tiêu chí bằng AND qua QueryUtil |
| Xem kết quả và đổi trang | `list-page`, `list-result`, `list-table` | `QueryCustomRepository` L26–39 count/OFFSET/LIMIT; `SearchPolicyFunc.exec` L112–119 map/catch; `PolicyListResponse` có ID và dữ liệu dòng |
| Mở chi tiết hợp đồng | `list-handoff` | Command `PolicyController.paymentMethod` L48–51, GET `/policy/{id}` |

`src/content/policy/list-journey.ts` là nguồn chung của thanh bước, node toàn cảnh, nhóm checkpoint và câu hỏi theo bước. Tám checkpoint là các điểm quan sát bên trong bốn bước, không phải tám bước nghiệp vụ ngang hàng.

## Hành vi đã đổi

- Toàn cảnh mở bằng bốn node thể hiện thao tác/kết quả. Node có nút vào đúng bước. Tám checkpoint và source nằm trong mở rộng; nhóm của node đang mở được làm nổi. Mobile dùng bốn thẻ nối dọc để đọc và bấm được.
- Thực hành bắt đầu bằng từ khóa, trạng thái và nút Tìm. Toàn bộ filter, danh tính, sort, pageSize và tình huống mẫu nằm trong phần mở rộng. Mỗi bước có vùng thao tác/kết quả riêng.
- Có Bước trước / Điểm trước / Điểm sau / Bước sau; chọn bước hoặc checkpoint để đọc không tự tiến mô phỏng. Thanh debug phân biệt ● Đang xem và ◆ Đang dừng; source và biến trước/sau đi theo checkpoint.
- Request đã gửi, draft và danh tính đã gửi có trạng thái riêng. Đổi trang giữ tiêu chí/sort/danh tính đã gửi, thay pageNumber, hiện request trước/sau. Draft chưa gửi được giữ để quay lại chỉnh.
- Bấm dòng vào bước 4; nút bàn giao giữ đúng ID của dòng thực sự có trong trang. Vào bước 4 chưa tự đánh dấu checkpoint đã thực hiện khi chưa chọn dòng. Reload và quay lại từ Chi tiết giữ trạng thái.
- Mỗi bước có hai quyết định, tiến trình ở trên và dữ liệu theo lượt tìm. Bước 2 phân biệt tiêu chí người dùng, phạm vi backend và điều kiện truy vấn. Phối hợp chỉ hiện thành phần của bước; Chọn mẫu mở bằng khung, sơ đồ nằm trong cửa sổ workspace.
- Khung thành phần, Khung phối hợp, sao chép mẫu, source gốc và full file giữ màu A/B. Phân biệt đúng A/B ngay cả khi hai đoạn nằm trong cùng `SearchPolicyFunc.java`. Cửa sổ sơ đồ có cây workspace và tab Từng bước triển khai; thực hành tìm file, chọn cách nối, xem code trước/sau và thử năm nhánh fixture.
- Tạo mới → Mở bài Danh sách đi thẳng vào bước kết quả của request đã có. Trạng thái nguồn và vị trí của hai bài được giữ khi chuyển qua lại.

## Nghiệm thu

Chuỗi đã kiểm tra trên desktop và mobile: Nhìn toàn cảnh → vào Tìm hợp đồng → nhập tiêu chí → xem phạm vi/điều kiện → nhận bảng → đổi trang → bấm dòng → bàn giao ID → Chi tiết → quay lại Danh sách → reload.

Ở bước 2 đã chuyển sang lắp ráp, trả lời phương án khác rồi phương án phù hợp, xem Phối hợp, khung A/B, sao chép, mở full source hai phía, mở cây workspace và Từng bước triển khai, rồi quay lại đúng checkpoint với điểm dừng giữ nguyên. Đã kiểm tra tính độc lập của quyết định/mode giữa cả bốn bước.

Nhánh bổ sung: kết quả rỗng, lỗi catch trả Page.empty(), phạm vi, ngày thiếu một đầu, filter đơn giao list, chuẩn hóa tiếng Việt, default, deep link/alias, mở source chưa chạy, Command có ID nhưng view chưa có dòng, Tạo mới đã có view, quay lại Tạo mới, khôi phục nguồn sau reload. Assertion kiểm tra không gọi endpoint backend thật và không có lỗi JavaScript trong luồng học.

Lệnh kiểm tra:

```powershell
npm.cmd run build
npm.cmd run verify:fixtures
node scripts/extract-policy-list-source.mjs --root D:/ALPACA/agent-system --check
npx.cmd playwright test tests/browser/policy-list.spec.ts tests/browser/policy-list-journey.spec.ts tests/browser/policy-navigation.spec.ts tests/browser/policy-issuance-overview.spec.ts tests/browser/policy-assembly-layout.spec.ts tests/browser/policy-pattern-workspace.spec.ts tests/browser/policy-practice-workbench.spec.ts tests/browser/policy-implementation-practice.spec.ts tests/browser/policy-reading.spec.ts --output=.verification/list-redesign-final
node scripts/capture-policy-list-journey.mjs
git diff --check
```

Build (bao gồm TypeScript) đạt. Vite vẫn cảnh báo chunk lớn hơn 500 kB. Fixture integrity: 38 file; audit source: khớp 23 file Java đầy đủ, giữ bytes/hash/số dòng. Script ảnh kiểm tra 24 tổ hợp Tạo mới/Danh sách × ba mode × hai kích thước × hai giao diện, không có lỗi trang hoặc tràn ngang.

**Kết quả browser tích hợp: 54/54 test đạt (5,6 phút)**. Bao gồm 10 kiểm tra Danh sách/model và 44 kiểm tra điều hướng, toàn cảnh, lắp ráp, khung source, workspace triển khai, workbench và đọc Policy. Sau khi thêm nhãn bước trong cửa sổ triển khai và so sánh request cho deep link cũ, nhóm Danh sách được chạy lại: **10/10 đạt (52,7 giây)**. Build cuối và bộ 24 ảnh đối chiếu cũng đã chạy lại thành công.

## Giới hạn

Đây là mô phỏng từ source đã đối chiếu, chưa chạy Java/backend/DB hoặc xác minh HTTP/JSON runtime, quyền endpoint Chi tiết, độ trễ ghi view hay thứ tự mặc định khi bỏ sort. Mẫu tái tục vẫn là bằng chứng so sánh có phạm vi khác, không được sao chép nguyên quyền sang Danh sách. Giữ các thay đổi sẵn có trong workspace.
