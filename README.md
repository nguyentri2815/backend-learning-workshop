# Backend Learning Workshop

Ứng dụng React/TypeScript bằng tiếng Việt cho người mới học Java Backend. Thực hành trong giao diện mô phỏng IntelliJ, Gradle, Docker và console; không chạy Java, Docker, database hoặc gửi API nghiệp vụ thật.

Hành trình gồm 16 nhiệm vụ A–J. Hai phần Run/kiểm tra cũ đã gộp thành **Chạy Command và đọc kết quả**, dùng chung phiên Run, profile, log và trạng thái. Link J1 cũ, tiến độ trình duyệt và Back/Forward vẫn được giữ. Thư viện có 24 tình huống tùy chọn, phân biệt phiên thật đã lưu, giả lập dựa trên source và ví dụ kỹ thuật chung.

## Clone và chạy

Cần Git và Node.js **24.x** (đã kiểm tra bằng 24.5.0; package yêu cầu từ 22.12.0). Không cần repo Java hoặc hai repo Quotation bên cạnh. Không cần `.env` hay credential.

PowerShell trên Windows:

```powershell
git clone https://github.com/nguyentri2815/backend-learning-workshop.git
cd backend-learning-workshop
npm.cmd ci
npm.cmd run dev
```

`npm ci` cài đúng `package-lock.json`, cần truy cập npm registry. Không sao chép `node_modules` từ máy khác. Trên macOS/Linux, dùng `npm`/`npx` thay cho `npm.cmd`/`npx.cmd`.

Mở [workshop](http://localhost:3182/journey/environment) hoặc đi thẳng [Chạy Command và đọc kết quả](http://localhost:3182/journey/environment?experience=project&task=startup&step=run&prun=run).

[Khám phá Policy — Quote → Policy](http://localhost:3182/journey/policy): năm tab chính; Tạo mới có ba cách học **Nhìn toàn cảnh**, **Làm lại từng bước** và **Tư duy lắp ráp**. Tab lắp ráp giải thích cách chọn thành phần qua sáu bước, có source thật, đối chiếu mẫu và liên kết checkpoint ở chế độ xem. Xem [bàn giao Tư duy lắp ráp](docs/review/policy-assembly.md). Bài Tạo mới có chọn Quote, nhánh chặn tạo, ghi Command, mô phỏng Flow ghi view và theo cùng Policy ID sang Danh sách/Chi tiết. Workspace tái sử dụng cây thư mục, Shiki và panel chỉnh độ rộng; sơ đồ dùng React Flow. Xem [đường review và bảng rà Cập nhật/Đổi trạng thái](docs/POLICY-EXPLORATION-HANDOFF.md).

**Tư duy lắp ráp** có ba chế độ **Suy luận / Phối hợp / Chọn mẫu** trong cùng vùng làm việc cho cả sáu bước. Mỗi lần mở một quyết định; desktop đặt dữ liệu nguồn bên cạnh, mobile đặt ngay trong câu hỏi. Phần cũ nằm trong “Tra cứu kỹ thuật” thu gọn. Lựa chọn khám phá tách khỏi tiến độ mô phỏng. Xem [review bố cục bước 3 tại 1440 × 900](docs/review/policy-assembly-discovery.md) và [bảng mẫu/source](docs/review/policy-assembly-learning-evidence.md).

Trong Chọn mẫu, **Khung thành phần / Khung phối hợp** giữ node và cạnh riêng. Source A/B đồng bộ màu, tô đúng biểu thức và vị trí trong toàn file. Mẫu có nút sao chép code; cây workspace và sơ đồ liên kết chọn file/node, phân biệt lời gọi với kế thừa. Xem [link review, source đã đối chiếu và nghiệm thu](docs/review/policy-pattern-workspace.md).

[Mô phỏng cả phiên triển khai](http://localhost:3182/journey/policy?group=create&mode=session) tại Tạo mới tổ chức 12 lượt từ giao yêu cầu, khảo sát, xem/áp dụng patch đến chạy fixture và review cả phiên. Cây workspace đánh dấu A/M theo baseline; code có diff theo lượt, tích lũy và snapshot tại mốc đang xem. Tiến độ đã áp dụng tách khỏi vị trí xem lại. Bài Từng bước triển khai mở được ở mốc tương ứng và quay về phiên. Xem [bảng file, căn cứ source, ảnh IDE/Review và nghiệm thu](docs/review/policy-session.md).

Nút “Mô phỏng cả phiên triển khai” mở menu hai phiên, có mô tả mốc đầu và tiến độ riêng. Phiên [Xây Policy từ Quote · Dành cho người mới](http://localhost:3182/journey/policy?group=create&mode=session&sessionId=quote-beginner) có 25 lượt và Review, bắt đầu bằng 21 file Quote/hạ tầng, không có tham chiếu hoặc đăng ký Policy. File Policy xuất hiện sau từng lượt áp dụng; kết thúc với 10 A / 1 M và Policy ID khớp bản ghi fixture. Hai phiên lưu URL và localStorage riêng, reset riêng; deep link cũ vẫn hoạt động. Snapshot Java là trích đoạn cấu trúc, chạy thử bằng fixture TypeScript; API đọc/Workflow/view và tác động phát hành đầy đủ là chặng tiếp nối. Xem [bảng mốc của hai phiên](docs/review/policy-beginner-session.md) và [review trải nghiệm mới: suy luận tại chỗ, radio, flow Quote và Explorer theo snapshot](docs/review/policy-session-experience.md). Kiểm tra source bằng `node scripts/extract-policy-beginner-source.mjs --root D:\ALPACA\agent-system --verify`; kiểm thử phiên mới tại `tests/browser/policy-beginner-session.spec.ts` và `tests/browser/policy-session-experience.spec.ts`.

Thanh quyết định và nút chuyển chế độ nằm ngay trên câu hỏi. Sau lựa chọn, nhãn xanh/hổ phách giải thích mức phù hợp với cách Policy đang triển khai; radio giữ lựa chọn riêng. Nút ⓘ ở khung code và từng source giải thích vai trò, mở độc lập với code.

Bài [Phát hành trực tiếp từ Quote · sáu bước](docs/POLICY-DIRECT-PRACTICE-HANDOFF.md) bắt đầu bằng màn Chi tiết báo giá, Network Đang xử lý, debug từng lần đọc và điều kiện chặn; sau đó dựng/ghi Policy, ghi view và mở cùng Policy ID bằng hai đường đọc. Cả sáu bước có điều hướng trước/sau, sơ đồ thực thi, nơi gọi/quay lại và thanh hành động riêng trên vùng cuộn code; ngữ cảnh snapshot giữ số dòng gốc và chỉ rõ phần file chưa có.

[Cập nhật Policy](http://localhost:3182/journey/policy?group=update) mở mặc định flow Checkout. Cả bảy flow có Nhìn toàn cảnh / Làm lại từng bước / Tư duy lắp ráp, mỗi flow bốn bước với source, biến trước/sau, nhánh dừng và bài Từng bước triển khai riêng. URL giữ vị trí đọc theo flow và chế độ, tách khỏi điểm dừng mô phỏng. Flow quyền bắt đầu từ event/queue; migration bắt đầu từ tác vụ phát queue. `createdDate` đã xác minh caller nội bộ nhưng source vẫn truyền lại `null`, được đánh dấu ngay trên sơ đồ. Xem [bảng nghiệm thu và source từng flow](docs/review/policy-update.md), [bảy cặp ảnh Checkout với Tạo mới](docs/review/policy-update.html).

[Đổi trạng thái Policy](http://localhost:3182/journey/policy?group=status) mở mặc định Tính lại trạng thái theo ngày. Tám flow được nhóm thành đổi Policy đã có và khởi tạo Policy mới, đủ ba chế độ học và 40 bài triển khai theo bước. Mốc chọn ID, tính status, apply, lưu và ghi view được tách rõ; ngày so sánh có thể sửa và thử đúng ngày biên. Online giữ riêng đường HTTP, queue và API quét; nhánh chưa rõ caller bắt đầu tại method đã xác minh và đánh dấu ngay trên sơ đồ. Xem [bảng tác nhân, checkpoint và source](docs/review/policy-status.md), [ảnh đối chiếu với Tạo mới](docs/review/policy-status.html), [kết quả nghiệm thu](docs/review/policy-status-validation.json).

Server chỉ lắng nghe `localhost:3182`, dùng strictPort. Nếu cổng đang được dùng, xác định đúng server/process trước khi tái dùng hoặc dừng; script không tự dừng process khác.

## Kiểm tra và build

```powershell
npm.cmd run verify:fixtures
npm.cmd run typecheck
npm.cmd run build
```

Build ghi `dist/` trong repo hiện tại. Có thể xem bản build bằng `npm.cmd run preview` tại cổng 3182 sau khi dừng dev server. `dist/` không đưa vào Git.

Giữ dev server ở terminal thứ nhất. Mở terminal thứ hai tại repo để chạy browser tests:

```powershell
npx.cmd playwright install chromium
npm.cmd run test:browser
```

Browser mặc định là Chromium do Playwright quản lý, không yêu cầu Chrome đã cài sẵn. Nếu cần dùng Chrome có sẵn trên máy, đặt `WORKSHOP_BROWSER_CHANNEL=chrome`. `PREVIEW_URL` cho phép kiểm tra một server workshop khác, ví dụ `http://localhost:3183`.

Bộ test mặc định chỉ dùng source/fixture đóng gói trong repo, không đọc ổ `D:` hoặc kết nối backend. `fixtures.manifest.json` kiểm tra tính toàn vẹn của snapshot được đóng gói, chuẩn hóa CRLF/LF; nó không khẳng định môi trường hoặc repo Java hiện tại đã được kiểm chứng.

Khi chủ động sửa dữ liệu bài học, review nội dung rồi cập nhật manifest:

```powershell
npm.cmd run fixtures:update
npm.cmd run verify:fixtures
```

## Dữ liệu học và giới hạn

- Source, cấu hình và log tham chiếu đã được trích/che, lưu tại `src/content/`. Giao diện dùng các bản đóng gói này; các đường dẫn máy tác giả, commit, hash và mốc log là metadata nguồn, không phải đường dẫn ứng dụng phải mở trên máy người học.
- Run, Stop, sửa cấu hình, kiểm tra port và HTTP trong bài chỉ đổi trạng thái mô phỏng. Không cấp quyền hoặc xác nhận máy thật sẵn sàng từ kết quả bài học.
- Log lịch sử tách riêng từng phiên; dòng `SIM` và kết quả khắc phục có nhãn giả lập. Started, process/port, HTTP và nghiệp vụ là các mức bằng chứng khác nhau.
- Tiến độ lưu trong localStorage theo namespace `backend-learning-workshop.*`; độc lập với checklist kiểm tra máy thật, Policy và Claim. Reset từng phần giữ các phần khác.
- Không dùng credential thật, token hoặc dữ liệu khách hàng khi thử bài. `.env`, output, cache, log thô và artifact kiểm tra cục bộ không đưa vào Git.

## Tài liệu và source

- [Khám phá Policy — hai tầng tab, bài Tạo mới và bảng bằng chứng](docs/POLICY-EXPLORATION-HANDOFF.md).
- [Tạo mới → Nhìn toàn cảnh — nguồn Quote, Flow chính và bốn đường phát hành](docs/POLICY-CREATION-OVERVIEW-HANDOFF.md).
- [Mốc dừng Hiểu và chạy dự án, trước khi chuyển sang Khám phá Policy](docs/PROJECT-SETUP-CHECKPOINT.md).
- [I2 — Tập đọc log thật và lần đường kết nối Redis](docs/PROJECT-REAL-LOG-PRACTICE.md).
- [I2 — Lần đường kết nối PostgreSQL](docs/PROJECT-POSTGRES-CONNECTION-ROUTE.md).
- [I2 — Phiên dev 08/11: PostgreSQL từ chối kết nối](docs/PROJECT-POSTGRES-FAILURE-SESSION.md).
- [Bước Run gộp, danh sách 24 case, bằng chứng và đường review](docs/PROJECT-COMMAND-MERGED-CASES.md).
- [Kiểm chứng nhóm startup và giới hạn phiên log thật](docs/PROJECT-COMMAND-STARTUP-VERIFICATION.md).
- [Hướng dẫn thực hành Run Configuration](docs/PROJECT-RUN-CONFIGURATION-HANDOFF.md).
- [Build Command](docs/PROJECT-BUILD-H-HANDOFF.md).
- [Nguồn UI đã tái sử dụng](docs/REUSE.md).

Các tài liệu bàn giao cũ có thể dẫn tới `.verification/`: đó là artifact máy tác giả, không phải dependency runtime. Những ảnh được chọn và rà để bàn giao sẽ nằm trong `docs/review/`; không đưa toàn bộ backup, trace hoặc ảnh kiểm tra cũ vào repo.

Các vùng code chính:

- [Danh sách Policy: link review, ba chế độ học, bài triển khai và đối chiếu source](docs/review/policy-list.md).

- `src/setup/`: hành trình mô phỏng, điều hướng và trạng thái.
- `src/policy/`, `src/content/policy/`: bài đọc Policy, dữ liệu mẫu và snapshot Java. Tiến độ đọc dùng namespace riêng, không chuyển dấu demo cũ thành hoàn thành bài mới.
- `src/setup/RuntimeCommandLesson.tsx`, `CommandRunWindow.tsx`, `StartupReplay.tsx`: Run và đọc kết quả trong một phiên.
- `src/setup/command-cases.ts`, `CommandCases.tsx`: dữ liệu case và thao tác tìm nguyên nhân/sửa/thử lại.
- `src/content/`: dữ liệu bài học đóng gói; `tests/browser/`: tương tác và hồi quy.
- `scripts/verify-fixtures.mjs`: kiểm tra snapshot cục bộ, không truy cập repo ngoài.

## Công cụ đối chiếu nguồn gốc — chỉ dùng khi có source riêng

Chín test gắn `@source` đọc repo Java, report hoặc artifact gốc và được loại khỏi lượt test mặc định. Chỉ bật `WORKSHOP_VERIFY_SOURCES=1` trên máy có đúng các nguồn để đối chiếu; đây là kiểm tra nguồn lịch sử riêng, không phải yêu cầu cài đặt workshop.

Các script `extract-*`, `inspect-command-startup-preflight.mjs`, `verify-command-cases.mjs` và `verify:originals` cũng thuộc nhóm công cụ nguồn gốc. Chúng có thể dùng đường dẫn máy tác giả và baseline trong `.verification/`, cần review/cấu hình trước khi chủ động chạy. Không có script này trong hook `install`, `dev`, `typecheck`, `build` hoặc test mặc định. Không tự chạy chúng để khắc phục lỗi cài đặt frontend.

Không công bố lại credential, log gốc hoặc nội dung ngoài phạm vi được phép khi cập nhật snapshot.
