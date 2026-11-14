# Tư duy lắp ráp · học bằng tự suy luận

Review tại [Tạo mới → Tư duy lắp ráp](http://localhost:3182/journey/policy?group=create&mode=assembly&assemblyStep=quote). Thực hiện trên repo `backend-learning-workshop`; dùng dev server sẵn có của repo tại localhost:3182. Backend `D:/ALPACA/agent-system` chỉ đọc.

## Nhãn phương án, giải thích source và thanh quyết định

Trước khi chọn, hai phương án trung tính, kể cả khi mở gợi ý. Sau khi chọn, quyết định “Gửi gì?” hiện xanh + ✓ “Phù hợp với API hiện tại” cho ID, hổ phách + ⓘ “Cần API nhận dữ liệu form” cho form. Radio và viền riêng đánh dấu lựa chọn hiện tại. Chọn form vẫn mở giải thích, ghi nhận đã khám phá và cho đổi lựa chọn. Các quyết định khác có nhãn theo trách nhiệm; hai cách đọc danh sách/chi tiết ở bước 6 đều là cách phù hợp với nhu cầu tương ứng.

Thanh quyết định nằm ngay dưới ba chế độ: **1. Gửi gì? → 2. Giao cho ai?**. Mỗi mục cho mở lại; chữ và icon phân biệt đang xem, đã khám phá và chưa khám phá. Việc xem câu hỏi chưa trả lời không tăng tiến độ. Bên phải là **Quyết định tiếp theo**, **Xem phối hợp →** hoặc **Xem mẫu thiết kế →**; các nút này đã bỏ khỏi cuối khối câu hỏi. Mobile cho thanh xuống hàng.

Trong Chọn mẫu, nút ⓘ cạnh tên khung và từng mục Source thật mở giải thích tại chỗ. Tiêu đề source là nút mở code riêng; giải thích và code độc lập. Ví dụ Controller có khung method, endpoint Policy thật và BaseController cung cấp applicationContext/executorService. Vai trò của cả 67 tham chiếu được mô tả tại `src/content/policy/assembly-source-guide.ts`; phần học hiện dùng 51 tham chiếu. Nút có tên truy cập, hỗ trợ Enter/Space, Escape để đóng giải thích, và chạm mobile.

Ảnh phương án sau khi thử form: [desktop sáng](assembly-options-desktop-light.png) · [desktop tối](assembly-options-desktop-dark.png) · [mobile sáng](assembly-options-mobile-light.png) · [mobile tối](assembly-options-mobile-dark.png).

Ảnh giải thích độc lập với code: [desktop sáng](assembly-explanations-desktop-light.png) · [desktop tối](assembly-explanations-desktop-dark.png) · [mobile sáng](assembly-explanations-mobile-light.png) · [mobile tối](assembly-explanations-mobile-dark.png).

Phần Chọn mẫu đã có hai tab Khung thành phần / Khung phối hợp, source A/B và cây workspace: xem [review cập nhật và nghiệm thu](policy-pattern-workspace.md). Các ảnh Chọn mẫu bên dưới ghi lại bố cục trước lần chỉnh này.

## Bố cục làm việc hiện tại

Review trực tiếp [bước 3 ở chế độ Suy luận](http://localhost:3182/journey/policy?group=create&mode=assembly&assemblyStep=map). Ba chế độ **Suy luận / Phối hợp / Chọn mẫu** dùng cùng vùng làm việc; bước mới mặc định mở Suy luận. Desktop dùng cột nội dung chính và cột dữ liệu liên quan, cuộn theo trang. Tiêu đề và bộ chọn dữ liệu nằm cùng hàng, tình huống ngắn ở ngay dưới; thông tin mô phỏng/mốc ngày nằm trong nút thông tin.

Mỗi lần mở một quyết định. Sau khi chọn, đọc hệ quả rồi bấm “Quyết định tiếp theo” trên thanh phía trên; dùng từng mục trên thanh để mở lại. Dữ liệu bên cạnh đổi theo quyết định đang xem; đầu ra chi tiết không xuất hiện trước thao tác tương ứng. Trên mobile, dữ liệu nguồn nằm trong cùng khung, giữa câu hỏi và lựa chọn; thanh sáu bước cuộn ngang, tự đưa bước hiện tại vào khung nhìn. Số, tên và mũi tên được giữ; bỏ dòng “Có thể xem” lặp lại.

Kiểm tra **1440 × 900, zoom 100%, scrollY=0**: câu hỏi bước 3 và cả hai lựa chọn xuất hiện trước khi cuộn. Tất cả sáu bước đều đạt cùng điều kiện. Kiểm tra tiếp mở lại câu đã trả lời, đổi lựa chọn, đổi chế độ, giữ node/mẫu/source đang xem và mở lại tra cứu.

Ảnh: [bước 3 sáng, đúng viewport](assembly-workspace-step3-1440-light.png) · [tối, mở lại câu đã trả lời](assembly-workspace-step3-1440-dark.png) · [mobile](assembly-workspace-step3-mobile.png) · [Phối hợp](assembly-workspace-step3-cooperate.png) · [Chọn mẫu](assembly-workspace-step3-pattern.png).

## Đường review bước 1

1. Mở link trên. “Tra cứu kỹ thuật” mặc định thu gọn. Suy luận mở ngay câu hỏi đầu tiên; tình huống ở dưới tiêu đề, ID nguồn nằm bên cạnh.
2. Chọn “Gửi ID của báo giá đang mở”, hoặc mở gợi ý. Đọc hệ quả với `QUOTE-LEARN-101`, rồi mới thấy tên Controller. Có thể chọn phương án còn lại và sửa lại lựa chọn; không có điểm/chấm thuộc thuật ngữ.
3. Bấm “Quyết định tiếp theo” phía trên, chọn “Giao cho một nơi tổ chức việc phát hành”. Thử mục “1. Gửi gì?” để quay lại, sửa lựa chọn rồi mở lại “2. Giao cho ai?”. Bấm “Xem phối hợp →”; bản đồ thêm Func. Chọn mũi tên “Bàn giao quoteId” để xem URL → PathVariable → `exec(quoteId)`, cùng bên gửi, bên nhận và đúng giá trị ID.
4. Bấm “Xem mẫu thiết kế →” ở cùng vị trí phía trên để sang Chọn mẫu, mặc định “Nhận ID trên URL → giao Func”, nhãn “Mẫu đang dùng trong Policy”. Khung phối hợp mở trước. Thử biến thể nhận biểu mẫu: dữ liệu đổi thành CreateQuoteRequest, nguồn và nhãn chỉ rõ tham khảo tạo Quote. Chọn lại mẫu Policy.
5. Chọn node **Controller** trong bản đồ mẫu để mở khung, đầu vào/đầu ra, chỗ cần đổi và source `PolicyController.createPolicy` L43–46.
6. Thử ⓘ ở tên khung và ở PolicyController/BaseController: giải thích mở độc lập với code. Chọn node **Func** để mở `CreatePolicyFunc.exec` L60–68 và helper nền. Bằng chứng có đủ thân method, giữ số dòng gốc và quyền mở toàn file.

Có thể mở thẳng [bàn giao quoteId đã khám phá](http://localhost:3182/journey/policy?group=create&mode=assembly&assemblyStep=quote&assemblyAnswers.quote=0,0&assemblyView.quote=cooperate), [khung Controller](http://localhost:3182/journey/policy?group=create&mode=assembly&assemblyStep=quote&assemblyAnswers.quote=0,0&assemblyView.quote=pattern&assemblyInspect.quote=node:controller), hoặc [khung Func](http://localhost:3182/journey/policy?group=create&mode=assembly&assemblyStep=quote&assemblyAnswers.quote=0,0&assemblyView.quote=pattern&assemblyInspect.quote=node:func).

## Đi tiếp qua năm bước

| Bước | Review / dữ liệu nối tiếp | Mẫu được xác minh |
|---|---|---|
| [2. Kiểm tra Quote](http://localhost:3182/journey/policy?group=create&mode=assembly&assemblyStep=validate) | ID từ bước 1 → Optional Quote → Policy cùng quoteCode/status [0,100] → Func đi tiếp hoặc dừng | Func → repository → guard; tham khảo orElseThrow từ FindPolicyByIdFunc chỉ cho trách nhiệm đọc/chặn thiếu |
| [3. Dựng dữ liệu Policy](http://localhost:3182/journey/policy?group=create&mode=assembly&assemblyStep=map) | Quote đã kiểm tra → trường chuyển nguyên/gán riêng → status tính theo ngày → Command | runInternal → MappingUtils → gán riêng → helper trả giá trị/sửa Command; CreateQuoteFunc là ví dụ cùng nhóm map rồi bổ sung |
| [4. Ghi Policy](http://localhost:3182/journey/policy?group=create&mode=assembly&assemblyStep=save) | Command bước 3 → Event → trạng thái → lưu → Policy ID | Func gọi AggregateRepository.save; repository/lớp nền điều phối process/apply; PolicyAggregate và QuoteAggregate cùng khung |
| [5. Cập nhật dữ liệu tra cứu](http://localhost:3182/journey/policy?group=create&mode=assembly&assemblyStep=flow) | Event/Policy ID bước 4 → handler → SyncView đọc lại model → view cùng ID | Workflow → SyncView → Command API → map/searchingKey/payment → view repository; QuoteWorkflow/QuoteSyncViewFunc cùng trách nhiệm |
| [6. Xem kết quả](http://localhost:3182/journey/policy?group=create&mode=assembly&assemblyStep=result) | View/Policy ID bước 5 → chọn danh sách hoặc chi tiết → đối chiếu đúng ID | Controller/Func/query view cho danh sách; Controller/FindPolicyByIdFunc/PolicyRepository cho chi tiết |

Mỗi bước giữ cách học suy luận → phối hợp → chọn mẫu trong ba chế độ cùng vùng làm việc. Câu hỏi dùng việc người dùng cần làm, dữ liệu và hệ quả trước tên kỹ thuật. Chọn từng lần bàn giao trong Phối hợp, từng cạnh/node trong Chọn mẫu. “Tra cứu kỹ thuật” giữ giải thích chi tiết, sơ đồ cũ, source, compare/diff, tìm IDE và xem checkpoint. Deep link kỹ thuật cũ vẫn mở đúng phần tương ứng.

## Bằng chứng và trạng thái

[Bảng đầy đủ các mẫu, quan hệ gọi thật, khung code, đường dẫn, symbol và dòng source](policy-assembly-learning-evidence.md) ghi 9 lựa chọn triển khai trong sáu bước, gồm hai biến thể tham khảo; không coi chín lựa chọn là chín kiến trúc độc lập. Các ví dụ chỉ khác tên/route/field được gom theo cách phối hợp và mục đích.

Đã đọc và đối chiếu 67 tham chiếu trong snapshot; phần học mới dùng 51 tham chiếu. GitNexus hiện không index agent-system nên lượt này lần source trực tiếp, gồm cả hai đầu lời gọi và cấu hình chọn implementation. Module Query phụ thuộc module 5 trong build.gradle; đã phân biệt QueryCustomRepository module 5 với class cùng tên ở module 4.

Phần khám phá dùng namespace URL `assemblyAnswers.*`, `assemblyPattern.*`, `assemblyInspect.*`, `assemblyHandoff.*`, `assemblyView.*`, `assemblyDecision.*`, `assemblyQuote`; giữ qua reload, đổi chế độ và đổi bước. Source đang mở trong Chọn mẫu giữ nguyên khi đổi chế độ. Không ghi vào quote/sim/walk/stop/at hay tiến độ mô phỏng. Bộ Quote khám phá riêng dùng lại fixture có sẵn; chọn Quote tương lai cho status 0 ở bước 3 rồi giữ status/ID đó đến bước 6.

Giới hạn hiển thị ngay tại node/cạnh/mẫu: Spring Data/ModelMapper và thư viện nền chưa được lần toàn bộ hoặc chạy runtime; chưa xác định transport từ bảng events lên Kafka; publish rỗng không chứng minh gửi broker; không khẳng định retry trong callback hay thứ tự với HTTP. Backend không được sửa hoặc chạy.

## Ảnh review

| | Sáng | Tối |
|---|---|---|
| Desktop | [Suy luận bước 1](assembly-discovery-desktop-light.png) | [Suy luận bước 1](assembly-discovery-desktop-dark.png) |
| Mobile 390 px | [Suy luận bước 1](assembly-discovery-mobile-light.png) | [Suy luận bước 1](assembly-discovery-mobile-dark.png) |

[Bàn giao quoteId, ảnh trước khi gom bố cục](assembly-discovery-handoff.png) · [Controller và source thật, ảnh trước khi gom bố cục](assembly-discovery-controller.png).

Bản đồ trước khi gom bố cục: [dựng dữ liệu](assembly-discovery-map-map.png) · [ghi và apply](assembly-discovery-save-map.png) · [cập nhật view](assembly-discovery-flow-map.png) · [query kết quả](assembly-discovery-result-map.png). Ảnh bố cục hiện tại ở phần đầu tài liệu.

## Kiểm tra

- `node scripts/assembly-sources.mjs --check`: 67 tham chiếu khớp backend hiện tại, số dòng và hash.
- `npm.cmd run verify:fixtures`: 34 fixture hợp lệ, gồm nhãn quyết định và mô tả vai trò source; không cần đọc backend khi sử dụng ứng dụng.
- `npm.cmd run build`: typecheck và build đạt; Vite vẫn cảnh báo chunk lớn hơn 500 kB, tab Assembly được lazy load.
- Playwright giao diện hiện tại: **20/20 kiểm tra đã đạt** trong `policy-assembly-affordances`, `policy-assembly-layout`, `policy-assembly-learning`, `policy-assembly`. Bao gồm hai phương án ở bước Phát hành, quay lại câu 1, nút chuyển chế độ phía trên, ⓘ độc lập bằng bàn phím/chạm ở sáng/tối và desktop/mobile; tiếp tục giữ kiểm tra 1440 × 900, mở lại tra cứu, sáu bước, tiến độ replay, theme, reload và không tràn ngang.
- Lượt xác minh source trước đó: 31/31 hồi quy và 4/4 chạy lại sau chỉnh cạnh process/apply/lưu đạt. Bản đồ/khung query bước 6 đọc view qua QueryCustomRepository; phần ghi view ở bước 5. Lượt gom bố cục giữ nguyên snapshot và nội dung mẫu đã xác minh.
