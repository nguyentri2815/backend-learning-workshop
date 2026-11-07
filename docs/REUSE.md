# Khảo sát và tái sử dụng local — 04/11/2026

Nguồn: `../quotation-product` và `../quotation-workshop`. Đã đọc README, package.json, package-lock.json, scripts, cấu hình TypeScript/Vite/Playwright và source thành phần liên quan. Không tìm thấy AGENTS.md áp dụng trong workspace/các repo hay các thư mục cha đã kiểm tra. Không lấy GitHub để ghi đè hoặc bổ sung giả định về working tree.

Khi bắt đầu: Product sạch; Workshop có 83 dòng thay đổi trong `git status --short` (bao gồm file mới local). Cổng 3180/3181 đang lắng nghe; thư mục đích chưa tồn tại và cổng 3182 còn trống. Các repo recovery không dùng làm nguồn. Không chạy scripts của hai repo gốc vì Workshop có predev/typecheck/checkpoint generation.

## Source được tái sử dụng

| Nguồn    | Source                                                                                              | Cách dùng ở dự án mới                                                                                                                                                                                            |
| -------- | --------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Product  | `tsconfig.json`, `vite.config.ts`                                                                   | Sao chép cấu hình strict TypeScript và plugin React. Port đặt trong scripts mới.                                                                                                                                 |
| Product  | `src/styles.css`                                                                                    | Giữ nền font Segoe UI/system và design token text/muted/canvas/accent/selected/line/error; bố cục mới viết riêng.                                                                                                |
| Product  | `src/pages/CreateQuotation.tsx`, hàm `Field`                                                        | Tách hàm thực tế thành `src/components/Field.tsx`; giữ label, hint, required và lỗi cạnh input. Input mô phỏng có aria-invalid/aria-describedby và focus khi lỗi.                                                |
| Product  | `src/components/AsyncMessage.tsx`                                                                   | Sao chép, thay thông báo loading bản chào bằng prop loadingText; giữ status, alert, spinner và thử lại.                                                                                                          |
| Product  | phần liên quan của `src/components/ui.module.css`                                                   | Chỉ trích CSS Field, loading, spinner, error; nút thử lại phù hợp token gốc.                                                                                                                                     |
| Workshop | `src/workshop/CodeBlock.tsx`                                                                        | Sao chép working tree hiện tại, giữ Shiki, số dòng, highlight, Diff, scroll memory; bổ sung grammar Markdown, dùng kiểu dữ liệu và stylesheet cục bộ mới.                                                        |
| Workshop | `src/workshop/source.ts`                                                                            | Trích `CodeRow`, `diffRows`, `sourceRows`; không mang index/snapshot loader hoặc checkpoint data.                                                                                                                |
| Workshop | `src/workshop/code-preferences.ts`                                                                  | Sao chép, đổi key/event sang namespace Backend Learning.                                                                                                                                                         |
| Workshop | `SourceTree.tsx`, `navigation.ts`, `useSplitLayout.ts`, `WorkshopFrame.tsx`, `StepDependencies.tsx` | Đọc source rồi áp dụng cách dựng cây, selection, quan hệ, return context, history và panel resize. Controller/cây/inspector mới được viết theo dữ liệu bài học mới; không gọi là sao chép nguyên các module này. |
| Workshop | `playwright.config.ts`                                                                              | Dùng cùng thư viện/Chrome, workers=1, screenshot/trace; cấu hình riêng cho port3182.                                                                                                                             |

Không tái sử dụng quy tắc tính phí, contract nghiệp vụ, mock API/storage hoặc dữ liệu khách hàng của Product cho Policy/Claim. Ví dụ form được viết mới quanh Field và AsyncMessage có sẵn. Flow minh họa dùng DOM tuần tự có lựa chọn, nên chưa cần React Flow.

## Dependency

| Nhóm                        | Giữ lại                                                                           | Lý do                          |
| --------------------------- | --------------------------------------------------------------------------------- | ------------------------------ |
| Product và Workshop cùng có | react 19.3.1, react-dom 19.3.1, react-router-dom 7.18.5                           | Nền FE và URL                  |
| Workshop                    | diff 9.0.0, shiki 4.5.0                                                           | Source viewer                  |
| Workshop                    | lucide-react 1.64.0, react-resizable-panels 4.15.2                                | Icon và panel resize           |
| Công cụ sẵn có              | TypeScript 5.9.3, Vite 8.3.5, @vitejs/plugin-react 6.1.2, @playwright/test 1.64.1 | Typecheck/build/browser checks |
| Typings từ Workshop         | @types/node 24.19.2, @types/react 19.3.0, @types/react-dom 19.3.0                 | Giữ bản đã có trong lockfile   |

Không chọn MSW (không gọi API), @xyflow/react (chưa cần graph tự do), Vitest (kiểm tra lượt này ở browser), Prettier hoặc PostCSS riêng (không cần cho cấu hình hiện tại).

Lockfile được thu gọn từ lockfile Workshop bằng `npm install --package-lock-only --ignore-scripts --offline --no-audit --no-fund`; cài độc lập bằng `npm ci --offline --no-audit --no-fund`. Không sao chép node_modules hoặc tạo symlink sang hai repo gốc. Không thêm bộ thư viện mới hay nâng phiên bản.

## Bảo toàn repo gốc

`scripts/verify-originals.mjs --capture` ghi hash SHA-256 và working-tree status trước khi triển khai; `npm run verify:originals` đối chiếu lại. Baseline máy hiện tại nằm ở `.verification/originals.json` (bỏ qua khi chia sẻ). Chỉ lưu hash/path/status, không sao chép nội dung source hoặc secrets vào baseline. Phạm vi đối chiếu bỏ qua `.git`, node_modules, dist, test-results, playwright-report, .vite, bộ artifact `.verification` và .env\*. Baseline ban đầu có cả hash của artifact `.verification` cũ; phần này được lọc khi so sánh để tập trung vào source và dữ liệu học gốc.

Snapshot, practice và các file học khác được tính hash để đối chiếu nhưng không sao chép hoặc sửa. Không chạy Java, Docker, dịch vụ backend hay truy cập database trong lượt này.
