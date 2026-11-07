# Bàn giao “Hiểu và chạy dự án”

Ngày: 04/11/2026 (Asia/Bangkok). Triển khai theo [thiết kế đã duyệt](PROJECT-SETUP-REPLAY-DESIGN.md), với chế độ B phát hành dưới dạng hướng dẫn có điều kiện.

## Kết quả

- A — Agent đã làm gì: toàn cảnh 5 chặng, 16 bước setup; timeline đủ S00–S18, S14–S16 ghi “Khảo sát tiếp theo — ngoài setup”. Chi tiết có trạng thái trước/sau, vấn đề, actor, lý do, hành động, lệnh lịch sử nếu đủ, kết quả, tự kiểm tra, file, nguồn và giới hạn.
- B — Tôi tự chạy lại: 22 hướng dẫn thuộc 4 nhóm Setup lần đầu / Chạy hằng ngày / Build sau thay đổi / Chẩn đoán khi lỗi. Mọi instruction chưa được chạy lại; những command có thể copy là kiểm tra/build hoặc GET status có điều kiện. Các bước startup chưa rõ DB/profile/broker/Debezium chưa có lệnh sẵn sàng chạy.
- Mục “Chờ xác nhận” nêu thiếu gì, ảnh hưởng ID nào, cách kiểm tra và người phù hợp xác nhận. Không tự điền profile, connection string hoặc payload connector.
- Tách lịch sử [H], kiểm tra khi lập báo cáo [F], source đã đối chiếu khi thiết kế, suy luận và thiếu bằng chứng. Không chạy khảo sát runtime Java mới trong lượt triển khai UI.
- Bốn mức build, process/port, HTTP API và nghiệp vụ độc lập. Docker/Java dừng là snapshot S18 ngày 04/11/2026, không live.
- Source dùng excerpt đã chọn/che, giữ dòng gốc; không full config, không terminal output hoặc diff giả. File không có snapshot trước/sau thì không có Diff.
- URL, mode memory, file/evidence references, điểm quay lại, Back/Forward/reload, alias cũ và fallback liên kết sai hoạt động. Tiến độ setup tách khỏi demo; dấu tự khai không thay trạng thái kỹ thuật.

## URL và đường duyệt

Ứng dụng đang được phục vụ tại **http://localhost:3182/**.

1. [Toàn cảnh](http://localhost:3182/journey/environment) → chọn chặng Java/IDE → S04.
2. [S04 source dòng 48](http://localhost:3182/journey/environment?mode=history&step=S04&view=source&file=java-root-build&line=48) → mở bằng chứng của file → Quay lại ngữ cảnh; thử reload/Back/Forward.
3. [S09](http://localhost:3182/journey/environment?mode=history&step=S09) → S10 để so root failure với targeted build; mở metadata JAR.
4. [Chế độ B](http://localhost:3182/journey/environment?mode=rerun) → Chạy hằng ngày → [R-D4](http://localhost:3182/journey/environment?mode=rerun&step=R-D4) để thấy điều kiện chưa rõ, không có startup command.
5. [Build module R-B1](http://localhost:3182/journey/environment?mode=rerun&track=build&step=R-B1) → sao chép lệnh; đây là instruction chưa chạy lại, không phải exact command S10.
6. Mở Tự kiểm tra, ghi chú và đánh dấu đã học; quay lại toàn cảnh để thấy matrix kỹ thuật không thay đổi.
7. [Policy](http://localhost:3182/journey/policy) và [Claim Diff mẫu](http://localhost:3182/journey/claims?step=implement&view=source&file=claim-draft&side=diff) vẫn giữ nội dung minh họa.

## Cổng 3182

Kiểm tra trước triển khai: không có listener ở 3182; do đó hiện tượng connection refused là FE server chưa chạy tại cổng này, chưa có bằng chứng về nguyên nhân server trước đó dừng. Không có process khác ở 3182 cần can thiệp.

Đã mở Vite bằng Node với `--host localhost --port 3182 --strictPort`, cửa sổ nền ẩn. Khi bàn giao, listener IPv6 loopback `::1:3182`, PID 23432, là process Node của ứng dụng học vừa khởi động. Không dừng process khác. Log local ở `.verification/3182-vite.log` và `.verification/3182-vite-error.log`; PID là quan sát của phiên bàn giao, không là cấu hình ổn định.

## Kiểm tra

| Kiểm tra | Kết quả |
|---|---|
| `npm.cmd run typecheck` | Pass; cũng được chạy trong final build |
| `npm.cmd run build` | Pass, Vite build production thành công |
| `npm.cmd run test:browser` | **17/17 pass**, vòng cuối 43.9 giây, Chrome context riêng |
| Model/reference/provenance | Đủ 19 timeline IDs, 16 setup IDs; source references/excerpts hợp lệ; B không có startup command chưa xác minh |
| Toàn cảnh/timeline/ngoài setup | 5 chặng, 19 timeline items; S14–S16 không có nút đánh dấu setup |
| Selection/file/evidence/return | S04 đồng bộ source và inspector; dòng 48 highlight; reference/reload/return/Back/Forward/Escape đúng ngữ cảnh |
| Hai mode và bốn track | Đổi mode nhớ S09/R-D4; đủ 4 track; startup bị giữ ở Chờ xác nhận; copy build instruction không chạy command |
| Tiến độ/storage | Setup dùng namespace riêng; không migrate bài demo cũ; reload giữ note; reset setup giữ Policy/Claim và namespace ứng dụng gốc |
| Mobile | Viewport 390×844: overview/source/runbook không tràn ngang; chọn bước cập nhật đúng inspector |
| Policy/Claim regression | Validation/lỗi/thử lại/tạo/đọc Policy; Claim Before/After/Diff, reference/history, resize và mobile đều pass |
| Requests trong các luồng setup | Không có request ngoài origin FE; không gọi Java/DB/Docker từ UI |
| Kiểm tra trực tiếp bổ sung | Rời S04 source sang Policy rồi quay lại vẫn đúng URL/file/dòng; R-D4 không có command card; không có pageerror |
| Dependency | `package.json` và lockfile giữ nguyên SHA-256 so với đầu lượt |
| Quotation originals | Product: 44 file; Workshop: 1937 file; 0 file đổi, working-tree status giữ nguyên theo verifier có sẵn |
| Java | Root + 10 nested repo: `git --no-optional-locks status --short` trả exit 0, không có thay đổi. Không sửa Git config |
| Dữ liệu công bố | Không thấy literal credential/private network address/private Git URL trong nội dung setup; không có chuỗi lỗi mã hóa còn lại trong source setup |

Vòng browser đầu có một lỗi nhãn chọn bước mobile. Đã sửa label/control rõ ràng bằng UTF-8; kết quả ở bảng là vòng chạy cuối sau sửa. Các test FE không chứng minh Java build/boot/API mới.

Ảnh review local (không đóng gói thành bằng chứng runtime Java):

- `.verification/setup-overview-desktop.png`
- `.verification/setup-source-desktop.png`
- `.verification/setup-rerun-desktop.png`
- `.verification/setup-mobile-overview.png`
- `.verification/setup-mobile-source.png`

## Source và phạm vi thay đổi

Nội dung mới ở `src/content/setup/`: model, history, runbooks, evidence, gaps, file excerpts, validator và adapter cho shell. UI ở `src/setup/`: overview/detail, components, viewer, navigation, CSS, progress. Tái dùng app shell, SourceTree, CodeBlock, Shiki, source rows, wrap/scroll và react-resizable-panels đã có.

`src/content/journeys.ts` chỉ thay phần environment bằng adapter. Đối chiếu trực tiếp phần file mẫu và hai journey Policy/Claim với đầu lượt cho kết quả nội dung giữ nguyên. `JourneyWorkspace.tsx` bỏ renderer setup minh họa không còn dùng và cho SourceTree dùng chung; không thay flow/mock nghiệp vụ Policy/Claim. `state.ts` giữ legacy demo keys riêng, không đếm chúng vào setup thật. `App.tsx` tích hợp route/count/reset/source labels. Thêm test setup và điều chỉnh các test environment cũ; README phản ánh bản mới.

Không thêm/nâng thư viện, không sửa Java hoặc hai repo Quotation gốc, không chạy Docker/database/Java, không commit/push/deploy.

## Những điều còn Chờ xác nhận

| Nhóm | Thiếu gì và ảnh hưởng | Cách kiểm tra tiếp |
|---|---|---|
| Profile local Flow/Query | Default/dev đổi DB/schema/auth/broker; chặn startup instruction hoàn chỉnh | BE/Tech Lead chốt profile và override hiệu lực từng app; không đồng loạt thêm dev |
| DB/dependency hiện tại | Target DB local/volume/credential, external endpoints, tác dụng schema chưa được kiểm tra cho phiên chạy mới | BE/DB owner đối chiếu cấu hình hiệu lực, connection-init-sql/ddl-auto trước boot; không chia sẻ connection string |
| Docker topology | Owner/quyền tái dùng Redis/RabbitMQ, container names/ports/network/mount chưa xác nhận hiện tại | Đối chiếu owner/labels/mapping với môi trường được phép; không start/stop/remove từ app học |
| Debezium | JSON trên đĩa chưa xác nhận là payload S08, runtime instance 18086 chưa được tái lập | BE/infra đối chiếu payload/network/broker/topic gốc; GET status chỉ khi đúng instance đã chạy; không tự POST config |
| Replication và E2E | 5432→5433 và CDC→Flow→Query chưa có kiểm thử dữ liệu | DB/BE/QA xác nhận topology và kịch bản có input/expected/correlation trước kiểm thử riêng |
| HTTP/auth/API | Chưa có read/health request, exposure/permission và response được xác nhận | API owner cung cấp contract; sau đó kiểm thử riêng; không dùng port hoặc 401/403 làm business pass |
| Lịch sử/attribution | Thiếu raw outputs, exact clone/targeted commands, installer và actor mở Docker/đổi IDE; Swagger còn thiếu | Chỉ bổ sung khi có transcript/record hoặc maintainer xác nhận; không suy từ file hiện tại |

Các khoảng trống đã được hiển thị trong UI, không ngăn hoàn thành phạm vi triển khai FE đã chốt. Việc xác minh runtime thật là công việc khác, chưa thực hiện trong bàn giao này.
