# Rà soát khả năng chia sẻ và chạy độc lập

## Git và nơi nhận

- Đúng workspace: `backend-learning-workshop`; trước lượt này thư mục chưa có `.git` và không có lịch sử local để đưa lên.
- Đã khởi tạo repo tại chính thư mục workshop, nhánh `main`.
- `origin`: `https://github.com/nguyentri2815/backend-learning-workshop.git`.
- Khi kiểm tra, repo đích **public**, chưa có refs/commit. Không force push hoặc thay lịch sử.
- **Trạng thái chia sẻ: chờ xác nhận quyền công khai nội dung nguồn nội bộ.** Chưa commit/push; chưa có SHA được công bố.

Quyền thực hiện commit/push workshop đã được cấp. Điểm còn cần xác định là quyền công khai source/cấu hình/log/tài liệu và ảnh có nội dung từ `agent-system`, đúng điều kiện dừng ở mục 2 của yêu cầu xuất bản. Che credential không tự xác nhận quyền công khai source.

## Nội dung đã rà

- Giữ source workshop, cấu hình TypeScript/Vite/Playwright, `package.json`, `package-lock.json`, browser tests, dữ liệu mô phỏng, manifest fixture và tài liệu.
- `node_modules/`, `dist/`, `test-results/`, `playwright-report/`, `.verification/`, `.cache/`, `.env*`, `.npmrc`, private key và log `.log` bị loại khỏi Git.
- Ba `command-startup-*.txt` là các bản log học đã trích/che, không phải file `logs/app.log` gốc. Chúng vẫn chứa tên class/bean và mô tả nội bộ nên nằm trong phạm vi xác nhận quyền chia sẻ.
- Phạm vi nguồn cần xác nhận gồm `src/content/setup/` (đặc biệt `practice-*.json`, `dependency-survey.json`, `command-*-source.json`, ba log `.txt`), phần mô tả nguồn trong code/tài liệu, và bốn ảnh `docs/review/`.
- Chỉ bốn ảnh UI Run gộp được chọn, đã xem trực quan. Không đưa 118 ảnh/backup/trace cũ trong thư mục kiểm tra lên Git. Link artifact cục bộ trong tài liệu cũ chuyển thành đường dẫn văn bản; bốn ảnh chia sẻ có link tương đối chạy được trên GitHub.
- Quét heuristic theo file/line không in giá trị: chưa thấy token GitHub/GitLab/cloud/Slack, JWT literal, private key, URL chứa user/password, địa chỉ RFC1918 chưa che hoặc email ngoài miền ví dụ. Một candidate từ khóa password là regex kiểm tra âm tính trong test. Quét này bổ sung cho review, không là bảo đảm phát hiện mọi secret.

## Thay đổi để máy khác chạy được

- README có clone → Node → `npm ci` → `npm run dev`, cổng cố định `localhost:3182`, không cần `.env`, Java, Docker, DB hoặc repo bên cạnh.
- `.nvmrc` chọn Node 24; yêu cầu package giữ từ Node 22.12.0. Không thêm/nâng dependency. 126 bản ghi lockfile chỉ trỏ tới npm registry công khai; không có dependency `file:` hoặc symlink local.
- Test mặc định dùng Chromium do Playwright quản lý. Chrome cài sẵn chỉ là lựa chọn qua `WORKSHOP_BROWSER_CHANNEL`.
- Chín bài đọc source/report/artifact gốc được gắn `@source`, chỉ bật có chủ đích bằng `WORKSHOP_VERIFY_SOURCES=1`. Không chạy trong test mặc định; các công cụ `extract-*` và kiểm tra nguồn gốc cũng không nằm trong hook install/dev/build/test.
- Hai bài fixture portable cùng `verify:fixtures` kiểm tra 22 file snapshot đóng gói ngay trong repo, không đọc ổ D hoặc repo gốc. Manifest nói rõ đây là integrity của bản đóng gói, không phải xác nhận nguồn gốc hay backend thật.
- `.gitattributes` giữ text LF. Hash fixture chuẩn hóa CRLF/LF để checkout Windows/macOS/Linux cho cùng kết quả.
- Các đường dẫn máy tác giả trong dữ liệu học được giữ như metadata hiển thị. Browser không mở file thật ở các đường dẫn đó.

## Kiểm tra bản sạch

- Đã tạo bản kiểm tra riêng trong `.verification/portable-check/`, chỉ từ file dự kiến đưa vào repo.
- `npm ci` với cache mới: cài thành công 125 package từ lockfile. Vite và Playwright được resolve từ `node_modules` của chính bản kiểm tra, không mượn bản cài hiện có.
- Verify 22 fixture, typecheck và build: qua.
- Browser tests: **147/147 qua** trong một lượt bằng Chromium mới cài, hai worker, trên build riêng tại cổng 3183. Chín audit đọc nguồn gốc không thuộc lượt test này; các test tương tác vẫn chạy đầy đủ.
- Ba fixture log giữ delimiter `số dòng | ` cho dòng trống. Git chỉ bỏ cảnh báo trailing whitespace trên ba file đó; không trim/chỉnh nội dung log để làm đẹp diff.
- Không chạy Java/Docker/DB hoặc gửi API nghiệp vụ thật; không sửa repo Java/Quotation.

Khi được xác nhận quyền chia sẻ, cần rà lại đúng index sẽ commit, kiểm tra remote chưa đổi, commit bản đã kiểm tra, push `main` bình thường và so SHA local với refs/GitHub. Nếu quyền chưa rõ, giữ toàn bộ nội dung local và dừng trước push theo yêu cầu.
