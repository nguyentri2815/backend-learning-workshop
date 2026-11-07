# Bước H — thực hành Build Command

URL: http://localhost:3182/journey/environment?experience=project&step=build&task=build-task&pview=activity

URL không ép snapshot mới: khi mở lại, bài giữ kết quả và cách thao tác đã lưu. Chọn **Thực hành từ đầu** hoặc **Làm lại bước build** để bắt đầu lại riêng H. Chỉ thay đổi trạng thái mô phỏng; không đọc/xóa output trên máy thật.

## Thao tác

- Mặc định **Trong IntelliJ**: Gradle → module Command → Tasks → build → menu chuột phải bootJar → Run. Có Chỉ vị trí, Quay lại và Thử lại; chọn nhầm Flow hoặc jar nhận phản hồi trước khi chạy. Chạm nút bootJar trong bài tương đương mở menu chuột phải, dùng được trên mobile.
- **Bằng lệnh Terminal**: mở tab Terminal, thấy root agent-system, xem/sao chép hoặc nhập lại lệnh điền sẵn, bấm Enter. Dùng chung task/kết quả với cách IDE; không cần hoàn thành cả hai.
- Trước task: Command có src và build.gradle, chưa có build. Thành công: build xuất hiện, được chọn và highlight ngắn; người học mở build → libs để thấy JAR. JAR không đồng nghĩa ứng dụng đã chạy. Mở JAR ở H chỉ hiện thông tin đóng gói ngắn, không có timeline/timestamp.
- Giữ ba dòng giải thích khi nào build có thể xuất hiện và ghi rõ bootJar là ví dụ đóng gói, không bắt buộc trước mọi lần Run local.

## Căn cứ

Đã đọc trực tiếp settings.gradle:30, root build.gradle:34–38, gradle.properties và build.gradle của Command tại `D:/ALPACA/agent-system`. Lệnh hướng dẫn:

```powershell
.\gradlew.bat :workspaces:agent-service:1-agent-command-service:bootJar
```

[JetBrains Gradle tasks](https://www.jetbrains.com/help/idea/work-with-gradle-tasks.html) xác nhận chạy task qua menu chuột phải/Run và xem kết quả trong Run tool window. [Spring Boot plugin 3.5.16, JavaPluginAction:146–175](https://github.com/spring-projects/spring-boot/blob/v3.5.16/spring-boot-project/spring-boot-tools/spring-boot-gradle-plugin/src/main/java/org/springframework/boot/gradle/plugin/JavaPluginAction.java#L146-L175) xác nhận bootJar thuộc nhóm build. Cây Gradle trong bài rút gọn các module liên quan, không mô phỏng toàn bộ IDE. Không dùng INSURTECH làm bằng chứng.

## Ảnh bàn giao

1. Source, chưa có build (artifact cục bộ: `../.verification/build-h-01-source.png`).
2. Đang chọn task trong IntelliJ (artifact cục bộ: `../.verification/build-h-02-intellij-task.png`).
3. Build xong, folder và JAR xuất hiện (artifact cục bộ: `../.verification/build-h-03-output.png`).

Chụp lại bằng `node scripts/capture-build-review.mjs` khi ứng dụng học ở cổng 3182. Ảnh dùng JDK 21 trong trạng thái mô phỏng; không kiểm tra JDK thật.

## Kiểm tra và phạm vi

`npm.cmd run build` bao gồm typecheck. Đã kiểm tra execution-practice, runtime-practice, project-practice và workshop: 33 test khác nhau đạt, gồm A–J, Policy/Claim, hai cách build, nhập/copy/Enter, chọn sai module/task, lỗi JDK, reset riêng H, reload, phiên đã lưu, deep link sang cửa sổ mới, Back/Forward và mobile.

Ứng dụng học không có `.git`; đã giữ bản trước sửa tại `.verification/build-intellij-before/` và hash các file để kiểm tra phạm vi. Không reset/revert thay đổi khác. Không sửa nội dung Java/IDE, Docker, dependency, run hoặc Policy/Claim. Không thêm dependency, không chạy Java/Docker/DB thật, không sửa repo gốc hoặc commit/push/deploy. Git status của agent-system và repo con agent-service sạch trước và sau khi sửa.
