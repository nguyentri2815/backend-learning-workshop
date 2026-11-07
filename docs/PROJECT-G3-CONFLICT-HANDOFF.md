# Bàn giao G3 — từ lỗi Docker đến chạy lại

06/11/2026. Chỉ thiết kế lại G3 trong ứng dụng học. Giữ G1 khảo sát dependency, G2 tạo container lần đầu, A–E, IntelliJ, build/run và Policy/Claim. Không chạy Docker/Compose, Java, DB hoặc dịch vụ thật; không sửa repo gốc, thêm dependency, commit/push/deploy.

## URL và đường review

- [Mở thẳng tình huống trùng tên, trước lần thử](http://localhost:3182/journey/environment?experience=project&task=conflict&pprofile=dev&psim=%7B%22conflictCase%22%3A%22name%22%7D).
- [Tình huống host port PostgreSQL độc lập](http://localhost:3182/journey/environment?experience=project&task=conflict&pprofile=dev&psim=%7B%22conflictCase%22%3A%22port%22%7D).
- [Host port theo service Redis được chọn ở G2](http://localhost:3182/journey/environment?experience=project&task=conflict&pprofile=dev&psim=%7B%22conflictCase%22%3A%22port%22%2C%22composeService%22%3A%22redis%22%7D).

Review ngắn tình huống tên:

1. Đọc mục tiêu và service từ G2. Rebrow được thêm riêng để minh họa lỗi tên, có nhãn công cụ quan sát Redis **tùy chọn**.
2. Bấm **Thử tạo/chạy trong bài học**. Lỗi Docker minh họa highlight `rebrow`; bước Create thất bại, chưa có container mới. Trước hành động này không có lỗi, bảng điều tra hoặc phương án xử lý.
3. Bấm **Mở Docker Desktop mô phỏng**. Hai cột đặt container hiện hữu cạnh service của lần thử. Container `rebrow` thuộc analytics-training đang **stopped**, vẫn giữ tên; metrics-helper thuộc monitoring-lab là container khác. Bấm host port 5001 chưa đủ giải thích lỗi tên. Bấm tên `rebrow` để highlight hai giá trị trùng và mở nguyên nhân.
4. Đọc câu hỏi **Bạn có cần service này cho mục tiêu đang làm không?** Chọn instance riêng. Thử chỉ đổi host port sang 15001 → Apply → xem Before/After → chạy lại: vẫn lỗi tên, chưa tạo container mới.
5. Điều tra lại tên, đổi thành `rebrow-learning`, giữ hoặc chọn host port phù hợp. Apply chỉ sửa kế hoạch; chạy lại mới tạo/khởi động container trong G3. Container cũ vẫn stopped. Kết thúc có ba câu: lỗi ở đâu, đã thay đổi gì, còn cần kiểm tra gì.

Tình huống cổng: chọn tab host port → thử tạo/chạy → lỗi highlight 5432. Tên `pg-analytics` khác tên container dự kiến, nhưng nó đang running và giữ host port 5432. Container mới của bài đã **created**, chưa khởi động. Chỉ đổi tên rồi thử lại vẫn lỗi cổng; container created của lần trước vẫn hiển thị. Đổi host port 15432 → xem cấu hình Java cần đối chiếu → chạy lại mới thấy running. pg-analytics giữ nguyên running.

## Ba nhánh xử lý

| Lựa chọn | Thay đổi nhìn thấy | Kết quả khi chạy lại |
|---|---|---|
| Không cần | Service bị gạch khỏi yêu cầu tạo/chạy; lựa chọn G2 và container đã tồn tại vẫn giữ | Không tạo/chạy thêm service đó. Không tự kết luận mục tiêu Java đã đủ điều kiện. |
| Cần instance riêng | Nhập tên/host port, Apply, so Before/After và giá trị được highlight | Kiểm tra lại cả tên và cổng. Có thể vẫn gặp cùng lỗi hoặc phát sinh lỗi khác; chỉ thành công mới thấy running. |
| Kiểm tra instance hiện có | Mở project, trạng thái, cổng và những thông tin còn thiếu | **Chờ xác minh**, không tự cấp quyền, xác nhận tương thích hoặc Start container project khác. |

Điều kiện tái sử dụng gồm owner/quyền, version/cấu hình, credential/ACL và phạm vi dữ liệu tương ứng. Với Rebrow còn cần biết xác thực UI và Redis target; stopped không có nghĩa được phép bật container đó. Không có thao tác xóa container/volume.

Host port đổi cho PostgreSQL/Redis/RabbitMQ/Kafka có hướng dẫn mở cấu hình Java tương ứng. Tham chiếu Java mở trong cây hiện có; Back khôi phục kế hoạch G3. Base PostgreSQL remote không bị tự đổi thành local. Ba Redis keys được kiểm tra cùng nhau. Cổng AMQP RabbitMQ 5672 được chọn theo mapping client đã đối chiếu, dù Compose liệt kê cổng UI 15672 trước; không cho áp dụng một host port đã thuộc mapping khác của chính service. Zookeeper chưa có binding Java trực tiếp được xác minh nên chỉ nêu cần đối chiếu Kafka/Compose.

Đổi host port của **UI Rebrow** chỉ đổi cổng UI: các khóa Redis trong Command vẫn trỏ 6379 trong source đang đọc; không tự chỉnh chúng hoặc suy ra Redis target của Rebrow.

## Source và trạng thái

Source Compose dùng lại `practice-infrastructure-source.json`, đã che và giữ số dòng gốc: Rebrow 71–76, PostgreSQL write 77–86; các service khác lấy đúng đoạn trong cùng manifest. Project sale-platform theo bằng chứng build.gradle:102 của repo agent-system. Không dùng ảnh làm source kỹ thuật.

G3 là lab độc lập, Engine giả định ready và ghi rõ một lần. Nó dùng service gần nhất của G2 và mục tiêu G1 làm ngữ cảnh; không thay map container, readiness, Java process hoặc cấu hình repo của các phần đó. G2 có cảnh báo conflict trước khi tạo; G3 minh họa thêm lỗi bind host port ở bước Start sau Create. Hai thời điểm kiểm tra khác nhau không được gộp thành một trạng thái.

`conflictLab.name` và `.port` lưu riêng lần thử, lỗi, bước điều tra, lựa chọn, cấu hình đã Apply và các container do G3 tạo. Tên lỗi và cổng lỗi giữ theo lần thử tương ứng, không bị đổi nhãn theo form chưa chạy lại. Sửa form chưa Apply chỉ là nhập liệu; Apply mới ghi kế hoạch vào snapshot. Các container project khác luôn giữ nguyên; container tạo được nhưng chưa Start ở lần trước không tự biến mất khi đổi tên.

Mỗi tình huống giữ tối đa sáu container trong bộ nhớ bài học để snapshot URL có giới hạn. Nếu đạt mức này, bài chặn thêm tên mới và cho chọn tên container của bài đã có hoặc làm lại G3; không tự ẩn container cũ. Đây là giới hạn của bài mô phỏng, không phải giới hạn Docker.

Tiến độ v1 và deep link cũ giữ nguyên. Dữ liệu cũ được bổ sung state G3 mặc định, không dựng kết quả runtime từ cờ hoàn thành cũ. Back/Forward/reload giữ tình huống, lỗi, Before/After và kết quả; chuyển tình huống không mang lỗi của case này sang case kia. **Làm lại phần này** chỉ xóa bài G3, giữ G1/G2/JDK/build/run và tiến độ A–E/Policy/Claim. Summary có phần G3 riêng, không báo container G2 đã chạy nhờ thao tác trong lab G3.

Source chính: `src/setup/ConflictPractice.tsx`, `conflict-lab-model.ts`, `conflict-practice.css`; tích hợp qua `practice-runtime-model.ts`, `RuntimePractice.tsx`, re-export từ `DockerPractice.tsx`. G2 `DockerLifecycle.tsx` không bị thay đổi trong lượt này.

## Ảnh

- Mục tiêu trước lần thử (artifact cục bộ: `../.verification/g3-goal.png`).
- Lỗi tên và đối chiếu container (artifact cục bộ: `../.verification/g3-name-error.png`).
- Before/After cấu hình tên (artifact cục bộ: `../.verification/g3-name-before-after.png`).
- Sau xử lý tên: container cũ còn, container mới running (artifact cục bộ: `../.verification/g3-name-resolved.png`).
- Lỗi host port, container mới created (artifact cục bộ: `../.verification/g3-port-error.png`).
- Sau đổi port và mở cấu hình Java (artifact cục bộ: `../.verification/g3-port-resolved.png`).
- Mobile: bằng chứng xếp dọc (artifact cục bộ: `../.verification/g3-mobile-evidence.png`).

Chụp lại bằng `node scripts/capture-conflict-review.mjs` khi frontend ở cổng 3182. Ảnh là UI học tập, không là log/runtime thật.

## Kiểm tra

10 kiểm tra mới G3 đã đạt: source mapping; hai lỗi độc lập; đổi sai trường không giải quyết; lỗi mới sau sửa tên; nhánh bỏ service; hai nhánh tái sử dụng chờ xác minh; đổi service theo G2; Java reference/Back; Back/Forward/reload/reset/tiến độ cũ; mobile 390px; RabbitMQ AMQP/UI và mapping trùng trong cùng service.

- `npm.cmd run build`: **đạt**, gồm `tsc --noEmit`. Vite vẫn cảnh báo chunk chính trên 500 kB (khoảng 1,05 MB); không thêm dependency hoặc đổi chiến lược bundling ngoài phạm vi.
- `npm.cmd run test:browser`: **77/77 đạt** ở lượt cuối (4,6 phút), gồm 10 bài G3 và 67 regression. Đã kiểm tra cả G1/G2, IntelliJ, source/highlight, graph, A–E, build/run, Policy/Claim, Back/Forward/reload/reset và mobile. Hai test cũ được siết điều kiện chờ state đã lưu hoặc phạm vi đã hiển thị trước thao tác kế tiếp; không đổi hành vi sản phẩm ngoài phần tích hợp G3.
- Trường hợp thử nhiều tên giữ các container trước đó; giới hạn snapshot chặn tạo thêm thay vì tự bỏ bản ghi cũ. Những field form chưa Apply không được coi là cấu hình đã chạy.
- `npm.cmd run verify:originals`: Product **44 file**, Workshop **1.937 file**, **0 file thay đổi**, working-tree status giữ nguyên. Java root và 10 repo con cùng trạng thái sạch so với baseline.
- Script chụp ảnh không có page error; mobile không tràn ngang. URL review ở **3182** trả HTTP **200**.

Log: 77 browser tests (artifact cục bộ: `../.verification/g3-browser-final.log`), build/typecheck (artifact cục bộ: `../.verification/g3-build-final.log`), Quotation (artifact cục bộ: `../.verification/g3-originals-final.log`), Java (artifact cục bộ: `../.verification/g3-java-status.json`). Không chạy Docker/Compose hoặc dịch vụ thật.
