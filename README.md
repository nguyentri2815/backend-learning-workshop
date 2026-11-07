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

- [Bước Run gộp, danh sách 24 case, bằng chứng và đường review](docs/PROJECT-COMMAND-MERGED-CASES.md).
- [Kiểm chứng nhóm startup và giới hạn phiên log thật](docs/PROJECT-COMMAND-STARTUP-VERIFICATION.md).
- [Hướng dẫn thực hành Run Configuration](docs/PROJECT-RUN-CONFIGURATION-HANDOFF.md).
- [Build Command](docs/PROJECT-BUILD-H-HANDOFF.md).
- [Nguồn UI đã tái sử dụng](docs/REUSE.md).

Các tài liệu bàn giao cũ có thể dẫn tới `.verification/`: đó là artifact máy tác giả, không phải dependency runtime. Những ảnh được chọn và rà để bàn giao sẽ nằm trong `docs/review/`; không đưa toàn bộ backup, trace hoặc ảnh kiểm tra cũ vào repo.

Các vùng code chính:

- `src/setup/`: hành trình mô phỏng, điều hướng và trạng thái.
- `src/setup/RuntimeCommandLesson.tsx`, `CommandRunWindow.tsx`, `StartupReplay.tsx`: Run và đọc kết quả trong một phiên.
- `src/setup/command-cases.ts`, `CommandCases.tsx`: dữ liệu case và thao tác tìm nguyên nhân/sửa/thử lại.
- `src/content/`: dữ liệu bài học đóng gói; `tests/browser/`: tương tác và hồi quy.
- `scripts/verify-fixtures.mjs`: kiểm tra snapshot cục bộ, không truy cập repo ngoài.

## Công cụ đối chiếu nguồn gốc — chỉ dùng khi có source riêng

Chín test gắn `@source` đọc repo Java, report hoặc artifact gốc và được loại khỏi lượt test mặc định. Chỉ bật `WORKSHOP_VERIFY_SOURCES=1` trên máy có đúng các nguồn để đối chiếu; đây là kiểm tra nguồn lịch sử riêng, không phải yêu cầu cài đặt workshop.

Các script `extract-*`, `inspect-command-startup-preflight.mjs`, `verify-command-cases.mjs` và `verify:originals` cũng thuộc nhóm công cụ nguồn gốc. Chúng có thể dùng đường dẫn máy tác giả và baseline trong `.verification/`, cần review/cấu hình trước khi chủ động chạy. Không có script này trong hook `install`, `dev`, `typecheck`, `build` hoặc test mặc định. Không tự chạy chúng để khắc phục lỗi cài đặt frontend.

Không công bố lại credential, log gốc hoặc nội dung ngoài phạm vi được phép khi cập nhật snapshot.
