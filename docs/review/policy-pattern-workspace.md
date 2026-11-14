# Review Khung thành phần / Khung phối hợp

Áp dụng cho chín lựa chọn mẫu đang có trong cả sáu bước. Backend chỉ đọc; ứng dụng dùng snapshot đã đóng gói, không gọi API nghiệp vụ.

## Mở review

- [Bước 1 · Khung phối hợp A/B](http://localhost:3182/journey/policy?group=create&mode=assembly&assemblyStep=quote&assemblyAnswers.quote=0,0&assemblyView.quote=pattern&assemblyPattern.quote=path&assemblyFrame.quote=cooperation&assemblyEdge.quote=receive).
- [Bước 1 · Mẫu Controller](http://localhost:3182/journey/policy?group=create&mode=assembly&assemblyStep=quote&assemblyAnswers.quote=0,0&assemblyView.quote=pattern&assemblyPattern.quote=path&assemblyFrame.quote=component&assemblyComponent.quote=controller).
- [Cây workspace và sơ đồ liên quan Controller](http://localhost:3182/journey/policy?group=create&mode=assembly&assemblyStep=quote&assemblyAnswers.quote=0,0&assemblyView.quote=pattern&assemblyPattern.quote=path&assemblyFrame.quote=component&assemblyComponent.quote=controller&assemblyDiagram.quote=1).
- [Bước 3 · Func → helper](http://localhost:3182/journey/policy?group=create&mode=assembly&assemblyStep=map&assemblyAnswers.map=0,0&assemblyView.map=pattern&assemblyPattern.map=map-helper&assemblyFrame.map=cooperation&assemblyEdge.map=calculate).

Hai tab đặt ngay trên code. Node chuyển sang Khung thành phần; cạnh chuyển sang Khung phối hợp. Mỗi tab nhớ node/cạnh riêng trong URL, giữ qua đổi chế độ và reload; không ghi vào tiến độ Làm lại từng bước.

Các thay đổi liên tiếp được gộp theo URL mới nhất để giữ lựa chọn khi bấm chuyển chế độ nhanh. Link cũ dùng assemblyInspect vẫn mở đúng ngữ cảnh và giữ node/cạnh khi chuyển sang hai tab mới.

## Đường nghiệm thu bước 1

1. Khung phối hợp: bấm A mở PolicyController, bấm B mở CreatePolicyFunc. A xanh dương, B tím ở khung rút gọn, source và toàn file; nhãn chữ A/B được giữ cùng màu.
2. A tô chính xác biểu thức `exec(quoteId)` tại L45, giữ code bọc response và ngữ cảnh. B tô `exec(String quoteId)` tại L60. Mở toàn file tự cuộn đến vị trí, giữ số dòng gốc.
3. Chọn Func, qua tab phối hợp rồi về tab thành phần: vẫn là Func và cạnh Bàn giao quoteId. Chọn lại Controller.
4. Sao chép mẫu: clipboard chỉ có code và xuống dòng; nút phản hồi Đã sao chép. Các khung có phần lược có ghi chú cạnh nút.
5. Mở sơ đồ liên quan từ mẫu hoặc source. Chọn BaseController trong cây: node tương ứng nổi lên, source tô đúng khai báo applicationContext L12 và executorService L14, không tô @Autowired L13. Chọn PolicyController trên sơ đồ: cây mở nhánh và chọn file đó.
6. Toàn file Controller từ thành phần tô cả method L43–46; từ cạnh tô điểm gọi L45. Cạnh Bàn giao quoteId hiện ID mẫu và hai nút đi đến A/B. Cạnh kế thừa mở khai báo extends BaseController tại Controller và các field hỗ trợ ở lớp nền; không biểu diễn lớp nền là file chạy tiếp.

## Source và phân loại quan hệ

Các vị trí dưới đây được neo bằng nội dung thật trong [snapshot](../../src/content/policy/assembly-source.json), có kiểm tra biểu thức tại dòng. Không suy ra lời gọi chỉ từ tên file. Cây chỉ liệt kê file thuộc mẫu đang chọn, gộp nhiều tham chiếu của cùng file. Quan hệ kế thừa chỉ xuất hiện khi snapshot có khai báo extends; các source đối chiếu khác mang nhãn hỗ trợ. Event/dữ liệu được phân biệt với lời gọi trực tiếp.

| Bước / lựa chọn | Cạnh / loại quan hệ | A · nguồn | B · đích |
|---|---|---|---|
| quote / path | Bàn giao quoteId · Lời gọi | `controller` L45 · PolicyController.createPolicy | `func` L60 · CreatePolicyFunc.exec |
| quote / body | Bàn giao request · Lời gọi | `quoteController` L31 · QuoteController.createQuote | `quoteFunc` L74 · CreateQuoteFunc.exec |
| validate / guard | Đọc Quote · Lời gọi | `func` L61 · CreatePolicyFunc.exec | `quoteRepo` L18 · QuoteRepository |
| validate / guard | Trả kết quả để quyết định · Bàn giao dữ liệu | `repo` L22 · PolicyRepository | `func` L76 · CreatePolicyFunc.runInternal |
| validate / or-throw | Đọc Policy theo ID · Lời gọi | `detail` L32 · FindPolicyByIdFunc.exec | `repo` L20 · PolicyRepository |
| validate / or-throw | Optional → giá trị hoặc lỗi · Bàn giao dữ liệu | `repo` L20 · PolicyRepository | `detail` L32 · FindPolicyByIdFunc.exec |
| map / map-helper | Chuyển dữ liệu nguồn · Lời gọi | `prepare` L83 · CreatePolicyFunc.runInternal | `mapping` L61 · MappingUtils.mapObject |
| map / map-helper | Bổ sung theo nghiệp vụ · Lời gọi | `prepare` L87 · CreatePolicyFunc.runInternal | `status` L195 · CreatePolicyFunc.getPolicyStatus |
| map / map-helper | Command sẵn sàng · Bàn giao dữ liệu | `prepare` L115 · CreatePolicyFunc.runInternal | `command` L27 · CreatePolicyCommand |
| save / event-save | Gửi yêu cầu ghi · Lời gọi | `saveCall` L115 · CreatePolicyFunc.runInternal | `save` L55 · AggregateRepository.save |
| save / event-save | Chọn process theo Command · Lời gọi | `save` L73 · AggregateRepository.save | `dispatch` L81 · ReflectiveMutableCommandProcessingAggregate.processCommand |
| save / event-save | Trả Event · Bàn giao dữ liệu | `aggregate` L329 · PolicyAggregate.process | `event` L26 · CreatePolicyEvent |
| save / event-save | Repository đưa Event vào apply · Lời gọi | `save` L74 · AggregateRepository.save | `applyLoop` L11 · Aggregates.applyEventsToMutableAggregate |
| save / event-save | Lưu trạng thái và Events · Lời gọi | `save` L76 · AggregateRepository.save | `storeDelegate` L47 · EventuateAggregateStoreImpl.save |
| flow / projection | Tiếp nhận Event · Thông báo Event | `aggregate` L329 · PolicyAggregate.process | `workflow` L24 · PolicyWorkflow.createPolicy |
| flow / projection | Bàn giao Policy ID · Lời gọi | `workflow` L27 · PolicyWorkflow.createPolicy | `sync` L38 · PolicySyncViewFunc.exec |
| flow / projection | Lưu bản tra cứu · Lời gọi | `sync` L56 · PolicySyncViewFunc.exec | `viewRepository` L15 · PolicyViewRepository |
| result / list | Bàn giao bộ lọc · Lời gọi | `queryController` L26 · PolicyController.search | `search` L112 · SearchPolicyFunc.exec |
| result / list | Query bản tra cứu · Lời gọi | `search` L109 · SearchPolicyFunc.doFilter | `queryRepository` L26 · QueryCustomRepository.executeCustomSqlQuery |
| result / detail | Bàn giao Policy ID · Lời gọi | `detailEndpoint` L50 · PolicyController.paymentMethod | `detail` L31 · FindPolicyByIdFunc.exec |
| result / detail | Đọc aggregate theo ID · Lời gọi | `detail` L32 · FindPolicyByIdFunc.exec | `repo` L20 · PolicyRepository |

Các khóa source ở bảng trỏ tới đường dẫn sau trong `D:/ALPACA/agent-system` (symbol và giới hạn đầy đủ ở [bảng khảo sát](policy-assembly-learning-evidence.md)):

| Khóa | File gốc |
|---|---|
| `controller` | `workspaces/agent-service/1-agent-command-service/src/main/java/com/alpaca/agent/controller/PolicyController.java` |
| `func` | `workspaces/agent-service/1-agent-command-service/src/main/java/com/alpaca/agent/function/policy/CreatePolicyFunc.java` |
| `quoteController` | `workspaces/agent-service/1-agent-command-service/src/main/java/com/alpaca/agent/controller/QuoteController.java` |
| `quoteFunc` | `workspaces/agent-service/1-agent-command-service/src/main/java/com/alpaca/agent/function/quote/CreateQuoteFunc.java` |
| `quoteRepo` | `workspaces/agent-service/4-agent-shared-domain/src/main/java/com/alpaca/agent/repository/QuoteRepository.java` |
| `repo` | `workspaces/agent-service/4-agent-shared-domain/src/main/java/com/alpaca/agent/repository/PolicyRepository.java` |
| `detail` | `workspaces/agent-service/1-agent-command-service/src/main/java/com/alpaca/agent/function/policy/FindPolicyByIdFunc.java` |
| `prepare` | `workspaces/agent-service/1-agent-command-service/src/main/java/com/alpaca/agent/function/policy/CreatePolicyFunc.java` |
| `mapping` | `workspaces/1-shared/shared-base/src/main/java/com/alpaca/util/MappingUtils.java` |
| `status` | `workspaces/agent-service/1-agent-command-service/src/main/java/com/alpaca/agent/function/policy/CreatePolicyFunc.java` |
| `command` | `workspaces/agent-service/4-agent-shared-domain/src/main/java/com/alpaca/agent/command/policy/CreatePolicyCommand.java` |
| `saveCall` | `workspaces/agent-service/1-agent-command-service/src/main/java/com/alpaca/agent/function/policy/CreatePolicyFunc.java` |
| `save` | `workspaces/1-shared/shared-event-sourcing/src/main/java/io/eventuate/sync/AggregateRepository.java` |
| `dispatch` | `workspaces/1-shared/shared-event-sourcing/src/main/java/com/eventsourcing/ReflectiveMutableCommandProcessingAggregate.java` |
| `aggregate` | `workspaces/agent-service/4-agent-shared-domain/src/main/java/com/alpaca/agent/domain/PolicyAggregate.java` |
| `event` | `workspaces/agent-service/agent-shared/src/main/java/com/alpaca/agent/event/policy/CreatePolicyEvent.java` |
| `applyLoop` | `workspaces/1-shared/shared-event-sourcing/src/main/java/com/eventsourcing/Aggregates.java` |
| `storeDelegate` | `workspaces/1-shared/shared-event-sourcing/src/main/java/com/eventsourcing/common/crud/sync/impl/EventuateAggregateStoreImpl.java` |
| `workflow` | `workspaces/agent-service/2-agent-flow-service/src/main/java/com/alpaca/agent/workflow/PolicyWorkflow.java` |
| `sync` | `workspaces/agent-service/2-agent-flow-service/src/main/java/com/alpaca/agent/function/PolicySyncViewFunc.java` |
| `viewRepository` | `workspaces/agent-service/5-agent-shared-entity/src/main/java/com/alpaca/agent/repository/PolicyViewRepository.java` |
| `queryController` | `workspaces/agent-service/3-agent-query-service/src/main/java/com/alpaca/agent/controller/PolicyController.java` |
| `search` | `workspaces/agent-service/3-agent-query-service/src/main/java/com/alpaca/agent/function/policy/SearchPolicyFunc.java` |
| `queryRepository` | `workspaces/agent-service/5-agent-shared-entity/src/main/java/com/alpaca/agent/repository/QueryCustomRepository.java` |
| `detailEndpoint` | `workspaces/agent-service/1-agent-command-service/src/main/java/com/alpaca/agent/controller/PolicyController.java` |

Lớp nền bổ sung: `baseController` → `workspaces/1-shared/shared-base/src/main/java/com/alpaca/base/controller/BaseController.java`, field L12/L14; `base` → `workspaces/1-shared/shared-webmvc/src/main/java/com/alpaca/base/BaseFunc.java`, helper execInTransactionAndLock L63–65 khi nơi gọi thực sự dùng helper. Với Func chỉ kế thừa BaseFunc, sơ đồ mở khai báo lớp L11.

Giới hạn vẫn hiển thị tại phần tương ứng: findById/save được kế thừa từ JpaRepository nên đầu nhận là hợp đồng, chưa có implementation Spring Data; dispatcher process/apply dùng reflection; đường events → Kafka chưa xác định transport; không suy ra thứ tự runtime từ sơ đồ. Các giới hạn của cạnh và của toàn mẫu đều được giữ. Các biến thể nhận form của Quote và orElseThrow là tham khảo, giữ nhãn phân biệt với mẫu đang dùng trong Policy.

## Ảnh

| Ngữ cảnh | Desktop sáng | Desktop tối | Mobile sáng | Mobile tối |
|---|---|---|---|---|
| A/B và source | [Ảnh](pattern-pair-desktop-light.png) | [Ảnh](pattern-pair-desktop-dark.png) | [Ảnh](pattern-pair-mobile-light.png) | [Ảnh](pattern-pair-mobile-dark.png) |
| Mẫu để làm theo | [Ảnh](pattern-component-desktop-light.png) | [Ảnh](pattern-component-desktop-dark.png) | [Ảnh](pattern-component-mobile-light.png) | [Ảnh](pattern-component-mobile-dark.png) |
| Sơ đồ / source đang chọn | [Ảnh](pattern-tree-desktop-light.png) | [Ảnh](pattern-tree-desktop-dark.png) | [Ảnh](pattern-tree-mobile-light.png) | [Ảnh](pattern-tree-mobile-dark.png) |

[Bước 3 · helper trong sơ đồ](pattern-step3-helper-diagram.png).

## Kiểm tra

- **8/8** kiểm tra Chọn mẫu ở lượt chạy cuối: cả hai đường bước 1 trên desktop 1440 × 900 và mobile 390 × 844, sáng/tối; clipboard chỉ chứa code; A/B mở toàn file và thấy đúng dấu tô; chọn cây/node/cạnh; thêm helper ở bước 3; mở cả hai loại khung trong cả chín lựa chọn mẫu; giữ hai cập nhật liên tiếp trước khi Router render.
- **15/15** kiểm tra trong nhóm ảnh hưởng chạy lại: Chọn mẫu, learning và layout. Bước 3 ở 1440 × 900, zoom 100% vẫn thấy câu hỏi và hai lựa chọn trước khi cuộn. Quay lại câu hỏi, đổi chế độ, mở lại tra cứu, tiến độ replay và dữ liệu nối tiếp qua sáu bước đều đạt.
- **29/29** kiểm tra còn lại trong lượt hồi quy: affordances, assembly kỹ thuật, reader preferences, Policy reading và Workshop. Tổng phạm vi **44 kiểm tra liên quan đã đạt** qua lượt hồi quy và chạy lại nhóm ảnh hưởng.
- `node scripts/assembly-sources.mjs --check`: **67/67** tham chiếu khớp backend hiện tại, số dòng và hash. Kiểm tra model xác nhận **21** cặp A/B và khai báo kế thừa thật; node cấu hình bean không thay cho implementation, node Event không bị coi là Aggregate.
- `npm.cmd run verify:fixtures`: **34/34** fixture hợp lệ.
- `npm.cmd run build`: typecheck và build đạt. Vite giữ cảnh báo chunk lớn hơn 500 kB như trước.
- `git diff --check`: đạt. Toàn bộ **13 ảnh review** đã được tạo và kiểm tra đường dẫn; đã xem ảnh desktop/mobile và hai theme. Backend không bị sửa hoặc chạy.
