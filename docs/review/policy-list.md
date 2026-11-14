# Danh sách Policy — nghiệm thu ngày 11/11/2026

Review local: [Nhìn toàn cảnh](http://localhost:3183/journey/policy?group=list&mode=overview), [Làm lại từng bước](http://localhost:3183/journey/policy?group=list&mode=steps), [Tư duy lắp ráp](http://localhost:3183/journey/policy?group=list&mode=assembly), [Từng bước triển khai](http://localhost:3183/journey/policy?group=list&mode=assembly&listAssembly=pattern&listDiagram=1&listDiagramMode=practice).

Các link review dùng bản build tại cổng 3183. Để mở lại: `npm.cmd run build`, rồi `node node_modules/vite/bin/vite.js preview --host localhost --port 3183 --strictPort`. Chế độ dev vẫn dùng cổng 3182. Không gọi API/DB agent-system.

## Đối chiếu “Tạo mới” trước khi triển khai

Chuẩn là **working tree hiện hành**, đã có nhiều thay đổi chưa commit khi bắt đầu công việc. Các thay đổi đó được giữ lại. Không lấy HEAD cũ thay cho nội dung đang có.

| Trải nghiệm | Có trong Tạo mới hiện hành | Danh sách đã triển khai / tái sử dụng |
|---|---|---|
| Nhìn toàn cảnh | `PolicyCreationOverview`, sơ đồ phát hành, chọn node mở giải thích/source và bài thực hành | Sơ đồ 7 điểm tới bảng + bàn giao thứ 8, nhãn dữ liệu trên cạnh, node/cạnh mở trách nhiệm/source/checkpoint |
| Làm lại từng bước | `CreatePolicyLesson`, `executionSession`, fixture Quote; vị trí xem độc lập với stop/walk; biến trước/sau và nhánh lỗi | Fixture Policy; request/draft riêng; DTO, danh tính, điều kiện, page, DTO response, bảng và ID; xem lại không chạy thêm; lỗi đầu Func bỏ qua các bước query |
| Cây code / source | `SourceTree`, `PolicySourceExplorer`, `CodeBlock`, dấu dòng và theme/code wrap | Dùng lại `SourceTree`, `CodeBlock`, `CheckpointVariables`, tùy chọn code; thêm viewer cho 23 file Java **đầy đủ** có commit/hash/range |
| Suy luận | Có dữ liệu, lựa chọn và phản hồi; tên thành phần xuất hiện sau chọn | 4 câu hỏi về request, điều kiện, phân trang và trang rỗng; hiển thị dữ liệu trước tên source |
| Phối hợp | Node, cạnh, hợp đồng bàn giao | Chọn cả node và cạnh, xem bên giao/nhận, dữ liệu và tác động; đây là điểm học, không giả định mỗi node là một lớp |
| Chọn mẫu | Khung thành phần / khung phối hợp, sao chép, màu A/B, source và sơ đồ liên quan | Node mở Khung thành phần, cạnh mở Khung phối hợp; `TemplateCode` được bổ sung **prop tone tùy chọn**, giữ nguyên các caller cũ; cùng tone ở khung, đoạn trích và file đầy đủ |
| Từng bước triển khai | **Đã có** `PolicyImplementationPractice`, `assembly-implementation.ts`, switch trong dialog | Bài độc lập 7 lượt; mốc đầu, phần dùng lại, chọn file/đoạn, thao tác, phản hồi sai, code trước/sau, kết quả để đi tiếp, thử 5 nhánh, xem lại/reset |
| URL / vị trí | query params, Back/Forward, node/ref, lưu vị trí đọc và trạng thái từng nhóm | Giữ hành vi router; namespace `list*` riêng; hỗ trợ deep link cũ `point/ref=q-*`; CodeBlock giữ scroll khi đổi nhóm; reload giữ request, kết quả và bài triển khai |
| Điều hướng / theme / mobile | `LearningSteps`, theme Workshop, code theme/wrap, bố cục mobile | Dùng lại các thành phần và tùy chọn; kiểm tra 1440×1000 và 390×844 ở cả hai theme; cây file/code cuộn trong vùng riêng |

Các đường đã đọc để lập chuẩn: `PolicyWorkspace`, `CreatePolicyLesson`, `PolicyCreationOverview`, `PolicyIssuanceDiagram`, `PolicyAssembly`, `PolicyAssemblyLearning`, `PolicyPatternWorkspace`, `PolicyImplementationPractice`, `AssemblySourceView`, `PolicySourceExplorer`, `PolicyPracticeTrace`, `PracticeSidePanel`, `CheckpointVariables`; cấu hình `flows`, `issuance`, `assembly`, `assembly-learning`, `assembly-implementation`, `assembly-source-guide`, `assembly-pattern-model`; state/fixture `create-model`, `create-practice`, `policy-execution`, `practice-checkpoint`, `source-reading`, `policy-model`; snapshot `source.json`, `assembly-source.json`; các bộ test `policy-*`. Preview Tạo mới được thao tác qua Playwright ở cả ba mode trước khi thêm Danh sách; 17 kiểm tra baseline đã pass.

## Flow có bằng chứng

Nguồn backend chỉ đọc: `D:/ALPACA/agent-system`. Workspace HEAD `af8d7f32fa5d3f5a380626679d30c4698960f33f`.

- Agent service HEAD: `f0971ae41170c84bb883be92cd1ebd6632010302`. `SearchPolicyFunc.java` và `ConfigUtil.java` có thay đổi local; bản học chụp **nội dung working tree**. Các file khác có cờ `modified` riêng.
- Shared HEAD: `4f500160a4935cb6e6575a436fb005306dd9fee0`.
- Snapshot: `src/content/policy/list-source.json`, đủ toàn file, số dòng gốc, `sha256` bytes và commit từng file. Có thể kiểm tra lại bằng `node scripts/extract-policy-list-source.mjs --root D:/ALPACA/agent-system --check`.

Đường rút gọn trong bảng dưới nằm dưới `workspaces/agent-service/`; đường Java mặc định là `src/main/java/com/alpaca/agent/`.

| Điểm | File / method / khoảng dòng | Điều xác nhận |
|---|---|---|
| Route | `3-agent-query-service/.../controller/PolicyController.java`, `search`, L19–27 | Class `/policy` + POST `/search`; `@Valid @RequestBody SearchPolicyRequest`; `supplyAsync` với executor; `WrapResponse.ok(exec(request))` |
| DTO | `agent-shared/.../request/policy/SearchPolicyRequest.java`, L14–34 | Tất cả scalar/list filters; extends BasePageAndSortRequest |
| Mặc định | `workspaces/1-shared/shared-base/src/main/java/com/alpaca/base/service/request/BasePageRequest.java`, L7–12; `BasePageAndSortRequest.java`, L8–12; `BaseSort.java`, L12–15 | Bỏ trường → pageNumber=0/pageSize=10; sort không khởi tạo; mỗi BaseSort mặc định asc=true. Explicit null khác bỏ trường |
| Lớp Controller | `workspaces/1-shared/shared-base/src/main/java/com/alpaca/base/controller/BaseController.java`, L10–15 | applicationContext và executorService được inject |
| Danh tính và Pageable | `3-agent-query-service/.../function/policy/SearchPolicyFunc.java`, `doFilter`, L38–41; `.../helper/ConfigUtil.java`, L7–17 | localUsername nếu local=true, còn lại SessionUtils; tìm SaleUnitView hoặc USER_NOT_EXIST; chuyển page/sort bằng PageableUtils |
| Session | `workspaces/1-shared/shared-webmvc/src/main/java/com/alpaca/common/SessionUtils.java`, `getThreadUserSession/getUsername`, L36–44 | Lấy session của thread; không có session thì username `guest`. Chưa xác minh propagation của executor đang cấu hình ở runtime |
| Phạm vi backend | `SearchPolicyFunc.doFilter`, L47–53; `5-agent-shared-entity/.../repository/SaleUnitViewRepository.java`, L13–16 | OWNER/IT_ADMIN không thêm phạm vi, quản lý dùng rootId, còn lại id; ANY trên pathSaleUnitIds; vẫn phải lookup SaleUnitView trước |
| Keyword/scalar/ngày | `SearchPolicyFunc.doFilter`, L54–83; `agent-shared/.../util/QueryUtil.java`, L58–90, L109–122 | isNotBlank cho keyword/productId/quoteStaffCode/kênh/nhóm; non-null cho status/viaUploader/payment/createdBy; cả hai ngày mới BETWEEN; mọi nhánh nối AND |
| Chuẩn hóa | `workspaces/1-shared/shared-base/src/main/java/com/alpaca/util/TextUtils.java`, L39–41 và `unAccent`, L59–63 | Bỏ dấu, trim, lowercase, gạch ngang ↔ khoảng trắng, gộp nhiều dấu cách rồi đổi cách thành `-`; QueryUtil dùng LIKE chứa `%keyword%`, không escape wildcard |
| List filters | `SearchPolicyFunc.doFilter`, L84–102; `QueryUtil.addQueryIn`, L131–147 | List nhóm/sản phẩm/status/payment/người tạo/kênh → IN nếu nonempty; giao AND với filter đơn cùng trường |
| Nguồn đọc / sort | `SearchPolicyFunc.doFilter`, L44–46, L104–109; `QueryUtil.addSort`, L116–122 | SQL đọc `<configUtil.schema>.policy_view_aggregate`; chỉ thêm WHERE nếu có điều kiện; chỉ ORDER BY khi request có sort; nhiều cột bị ghép thiếu dấu phẩy trong source hiện hành |
| Pagination | `5-agent-shared-entity/.../repository/QueryCustomRepository.java`, `executeCustomSqlQuery`, L26–39, `removeOrderBy`, L82–89 | Count dùng cùng WHERE, bỏ ORDER BY; đọc OFFSET=page×size LIMIT=size; total đưa vào PageImpl |
| Ánh xạ JDBC | `QueryCustomRepository.convertToObjectList`, L49–79 | Map tên snake_case sang camelCase, reflection, PGobject qua ObjectMapper; bắt lỗi từng field/row. Không khẳng định mapping mọi kiểu JDBC đã đúng khi chưa chạy DB |
| Entity / DTO | `5-agent-shared-entity/.../entity/PolicyViewEntity.java`, L21–35; `agent-shared/.../response/policy/PolicyListResponse.java`, L13–56 | Entity map đúng bảng view; DTO khai báo id, quoteId, policyCode và dữ liệu bảng |
| Response / rỗng | `SearchPolicyFunc.exec`, L112–119; `MappingUtils.java`, L17–18, L61–63; `WrapResponse.java`, L32–37 trong shared-base | Page.map → ModelMapper STRICT; catch mọi Exception rồi Page.empty; wrapper đặt success=true/statusCode="200" ở mức object |
| Chi tiết | `1-agent-command-service/.../controller/PolicyController.java`, `paymentMethod`, L48–51 | GET `/policy/{id}` → FindPolicyByIdFunc.exec(id). ID bàn giao là id của DTO, khác quoteId/policyCode |
| Nối Tạo mới | `2-agent-flow-service/.../workflow/PolicyWorkflow.java`, `createPolicy`, L23–31; `.../function/PolicySyncViewFunc.java`, `exec`, L37–65 và `collectSearchingKeys`, L67–113 | Event.entityId → đọc Command API L41 → map view, searchingKey L49, mapPayment L55 → save view L56; cùng ID để Query đọc lại |
| Mẫu tương tự | `SearchRenewalPolicyFunc.doFilter/exec`, L37–119 | Cùng DTO/view/repository/Page.map. Chỉ áp dụng filter đơn, chưa xử lý các list filters dù chung DTO. Khác phạm vi prefix saleUnitPath; thêm duration >3 tháng và khoảng hết hạn -7 đến +30 ngày. Không sao chép quy tắc đó sang Danh sách |

Không thêm điều kiện `deleted=false` cho Policy: SearchPolicyFunc hiện hành không có điều kiện này. Không gộp `status`, `paymentStatus` và `viaUploaderStatus` thành một trục.

## Kết quả tìm FE và chỗ dừng xác minh

Không tìm thấy frontend gọi `/policy/search` trong workspace agent-system. Repo FE kế cận `D:/ALPACA/core-insurance-portal`, HEAD `7082df0bf4fd05c09d65a4bada7bb69517a86ecf`, có màn Policy nhưng **khác hợp đồng**:

- `apps/policies/policyList/policyList.js` L395–409 gọi `PolicyApi.getAllPolicies(params)`, lấy `content/totalElements`; L200–208 chuyển `row.original.id` sang màn detail.
- `services/policy.js` L7–13 gọi `POST core-query/policy/get-all-policies`; L15–19 gọi `core-query/policy/find-policy-by-id/{id}`. Không coi đây là consumer của agent Query. Các file này không bị sửa.
- GitNexus chỉ có index core-insurance-portal, thiếu FTS và không trả flow phù hợp. Dùng đọc source trực tiếp cho bằng chứng; không reindex hay ghi vào backend.

Route đầy đủ **trong Query controller** là POST `/policy/search`. Gateway/public base URL, context path triển khai, auth thật, serialization HTTP/JSON, runtime Page.empty, thư viện Spring Data/JDBC/ModelMapper, broker/transport event, transaction/replication và thứ tự Flow so với response chưa chạy kiểm chứng. Source wrapper không được dùng làm bằng chứng HTTP status thực tế. Phạm vi Chi tiết chưa được chứng minh bởi phạm vi Danh sách.

## Cách nghiệm thu

1. Từ tab Danh sách mở đủ ba mode. Toàn cảnh chọn node/cạnh → source → checkpoint. Mở nơi ghi view và đường về Tạo mới.
2. Tìm mẫu → lần Điểm sau hoặc Chạy đến bảng: 3 hợp đồng, trang đầu 2; Trang tiếp có POL-LEARN-003. Sửa draft không đổi bảng trước khi gửi. Theo dõi ID → GET đúng ID → bài Chi tiết. Quay lại Danh sách vẫn giữ request/trang.
3. Thử rỗng, ngoài phạm vi, quản lý/OWNER, keyword có dấu, ngày một đầu, scalar+list giao nhau, lỗi USER_NOT_EXIST và request `{}` mặc định 0/10. Xem lý do từng dòng và nguồn của từng điều kiện.
4. Trong lắp ráp, chọn cả hai đáp án để đọc phản hồi; node/cạnh mở hai khung. Mở toàn file tại vùng A/B tô đúng màu. Cây file chuyển đúng source. Dialog giữ sơ đồ/source khi chuyển qua bài triển khai; chạy đủ 7 lượt, 5 fixture; reload/xem lại/reset.
5. Backend giữ chỉ đọc; kiểm tra mạng không có request `/policy/*`. Các hình `list-{overview,table,pattern,implementation}-{desktop,mobile}-{light,dark}.png` và `policy-list-links.json` lưu trong thư mục này.

## Ảnh review

| Màn | Desktop sáng | Desktop tối | Mobile sáng | Mobile tối |
|---|---|---|---|---|
| Toàn cảnh | [Ảnh](list-overview-desktop-light.png) | [Ảnh](list-overview-desktop-dark.png) | [Ảnh](list-overview-mobile-light.png) | [Ảnh](list-overview-mobile-dark.png) |
| Bảng kết quả | [Ảnh](list-table-desktop-light.png) | [Ảnh](list-table-desktop-dark.png) | [Ảnh](list-table-mobile-light.png) | [Ảnh](list-table-mobile-dark.png) |
| Khung phối hợp | [Ảnh](list-pattern-desktop-light.png) | [Ảnh](list-pattern-desktop-dark.png) | [Ảnh](list-pattern-mobile-light.png) | [Ảnh](list-pattern-mobile-dark.png) |
| Triển khai | [Ảnh](list-implementation-desktop-light.png) | [Ảnh](list-implementation-desktop-dark.png) | [Ảnh](list-implementation-mobile-light.png) | [Ảnh](list-implementation-mobile-dark.png) |

## Kết quả kiểm tra cuối

| Kiểm tra | Kết quả |
|---|---|
| `npm.cmd run typecheck` | Đạt; cũng được chạy trong build cuối |
| `npm.cmd run build` | Đạt. Vite còn cảnh báo kích thước chunk >500 kB; không phải lỗi build |
| `npm.cmd run verify:fixtures` | 37 file fixture khớp manifest |
| `node scripts/extract-policy-list-source.mjs --root D:/ALPACA/agent-system --check` | 23 file Java đầy đủ khớp bytes/hash và phiên bản đã chụp |
| Test `@source` riêng của Danh sách | 1/1 đạt, đọc file local; không chạy Java/API/DB |
| Baseline Tạo mới trước triển khai | 17/17 đạt |
| Hồi quy Policy + appearance + bundled fixtures trên build cổng 3183 | 105/106 đạt ở lượt tổng. Một assertion đọc expression highlight trước khi Shiki hoàn tất; đổi sang `expect.poll`, giữ nguyên nội dung cần đối chiếu |
| Chạy lại toàn bộ `policy-list.spec.ts` + `policy-pattern-workspace.spec.ts` sau sửa thời điểm chờ | 19/19 đạt, gồm ca highlight vừa nêu và mọi khung A/B cũ |
| Nghiệm thu cuối `policy-list.spec.ts` + `policy-reading.spec.ts` sau bổ sung kiểm tra giữ trạng thái giữa hai bài | **19/19 đạt**, gồm 12 ca Danh sách và 7 ca đọc/điều hướng cũ |
| `git diff --check` | Đạt |
| Chụp preview build | 16 ảnh desktop/mobile × sáng/tối; đã mở kiểm tra bố cục, source và màu tô |

Hai ca Danh sách bổ sung ở cuối kiểm tra: (1) Command có ID nhưng Query chưa có dòng thì không bàn giao như kết quả Danh sách; (2) đổi mode/nhóm giữ nguyên file List và bước lắp ráp Create, đồng thời không mang nút quay lại của Create sang List. `listLegacyRef` giữ con trỏ trích đoạn cũ, tách khỏi `listRef` của viewer toàn file.

Các lệnh browser dùng `$env:PREVIEW_URL='http://localhost:3183'`. Artifact kiểm tra local nằm trong `.verification/policy-list-final`, `.verification/policy-list-acceptance`, `.verification/policy-list-navigation`; không phải dependency của ứng dụng. Bộ `policy-list.spec.ts` kiểm tra không phát sinh request tới `/policy/*`, kết quả bảng khớp request, đổi trang, rỗng, phạm vi, lỗi catch, source đúng dòng, deep link/reload, hai theme, mobile và hoàn tất bài triển khai.
