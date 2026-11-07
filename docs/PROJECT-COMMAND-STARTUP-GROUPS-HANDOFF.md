# Chạy Command — xem bên trong đang làm gì

Bản kiểm chứng tiếp theo, gồm điều kiện dừng trước Run mới và chín nhóm đã điều chỉnh: [PROJECT-COMMAND-STARTUP-VERIFICATION.md](PROJECT-COMMAND-STARTUP-VERIFICATION.md). Nội dung dưới đây giữ kết quả bàn giao trước để đối chiếu.

URL: http://localhost:3182/journey/environment?experience=project&task=startup&step=run&pview=activity

Review ngắn: chọn **Console tham chiếu → Phiên lỗi thật · default · 06/11 23:24**, bấm tam giác cạnh main; Tạm dừng hoặc chọn nhóm, mở bằng chứng source khi cần. Sau khi kết thúc, chọn **Kết quả & nguyên nhân** và **Hủy khởi tạo / dừng**. Chọn phiên thành công default để so sánh, rồi Stop/Chạy lại. Chế độ **Theo I1** giữ điều kiện kỹ thuật và profile của bài; log thành công dev đã lưu được dùng làm tham chiếu, không là stdout của lần bấm IDE/bootRun hiện tại.

## Bằng chứng đã đọc

Repo Java chỉ đọc: `D:/ALPACA/agent-system`. Log: `logs/app.log`, SHA-256 `6e2727b941c1d09104a08085daa6285be1c51d9facb76944dae58d4bc6e648c7` tại lúc trích, 24.261 dòng. File có nhiều ứng dụng nên chỉ chọn cửa sổ khởi động đúng **AgentCommandServiceApplication**, không mượn Query/Flow hoặc INSURTECH. Pattern log không có PID ở mọi dòng; không gán tuyệt đối các dòng chen kẽ cho một process/thread khi thiếu bằng chứng.

| Đoạn Command | Dòng app.log | Bằng chứng |
| --- | --- | --- |
| 04/11 11:54 → 11:55 | 2953–6064 | Java 21, active dev, output JAR, Tomcat 9901, Started |
| 04/11 12:43 → 12:44 | 15881–18989 | Java 21, không active profile, default, output classes, Tomcat 9901, Started |
| 06/11 23:24 | 19075–24260 | Java 21, không active profile, default, output classes, JPA/JDBC thất bại; không có Started |

Shutdown 18992–19074 thuộc phiên **default thành công 04/11**. Nó được đặt riêng, chỉ mở sau Stop để đối chiếu, không ghép vào phiên lỗi 06/11.

## Nhóm và nguồn

| Nhóm | Nguồn/source và mức kết luận |
| --- | --- |
| IDE → JVM | `.idea/workspace.xml:93` có Main/module/Make, `.idea/misc.xml:4` có SDK 21; dòng Starting xác nhận Java của phiên. Không có output Make hoặc nguyên văn lệnh JVM của phiên cũ. |
| Boot/logging/profile | Main:15–28, `log4j2.yml:1–21`, dòng profile; log thật quyết định default/dev, không lấy tên Run Configuration làm bằng chứng. |
| Thành phần Spring | `@ComponentScan`, `@Import`, module shared-event-sourcing, `InitConfig.postConstruct`; log đăng ký/khởi tạo bean. Không suy mọi hàm init đã chạy trong phiên lỗi. |
| Repository/JPA/DB | `@EntityScan`, `@EnableJpaRepositories`, application.yml:30–46; 15 JPA repository, Hibernate/Hikari và EntityManagerFactory. Hibernate/Hikari nằm trong JVM; PostgreSQL là dịch vụ ngoài. |
| Client/cache/event | `@EnableFeignClients`, shared-cache `SpringCacheConfig:22–47`, shared-event-sourcing; Feign đăng ký chưa phải gọi API. Redisson và thread redisson-netty có ở phiên thành công; chưa có kết nối Redis/Rabbit/Kafka được xác nhận ở phiên lỗi. |
| Web/Security | Module webmvc/OAuth2, `ResourceServerConfiguration:10–31`; Tomcat/filter mapping ở phiên thành công. Phiên lỗi chưa có Tomcat started/port thành công. |
| Kết quả/nguyên nhân | Started hoặc Application run failed cùng chuỗi Caused by; không đánh dấu nghiệp vụ thành công. |
| Hủy/dừng | cancelling refresh ở phiên lỗi; thiếu log cleanup hoàn tất. Phiên thành công default có Tomcat/JPA/Hikari shutdown riêng. |

Source/cấu hình IDE trích là bản hiện tại; không chứng minh nguyên văn toàn bộ cấu hình tại thời điểm phiên cũ. Bằng chứng với dòng/SHA-256 ở `src/content/setup/command-startup-source.json`; ba file `.txt` là bản đã che của từng cửa sổ log. Script `node scripts/extract-command-startup.mjs` chỉ đọc repo Java và ghi dữ liệu vào ứng dụng học.

## Nguyên nhân phiên lỗi

`SqlExceptionHelper` báo kết nối thất bại tại 19148, lặp lại ở 19687. `entityManagerFactory` thất bại tại 19688 khi Hibernate mở JDBC cho persistence/DDL. Context hủy refresh tại 19689; Spring báo **Application run failed** tại 22542.

Chuỗi liên quan: `eventHandlerBeanPostProcessor` → các bean Eventuate → `transactionManager` → `entityManagerFactory` → `JDBCConnectionException` → `PSQLException` → **`SocketTimeoutException: Connect timed out`** (23868). Dòng main:27 là điểm gọi `SpringApplication.run`, không là bằng chứng lỗi gốc nằm tại main.

Cần đối chiếu datasource hiệu lực (file nền, profile, env/arguments/file ngoài) và khả năng tới PostgreSQL. Chưa đủ chứng cứ chọn riêng nguyên nhân mạng, firewall, DB tắt hay đích kết nối sai; cũng không kết luận đổi sang dev chắc chắn sửa lỗi. Phiên default 04/11 đã Started nên default không tự đồng nghĩa thất bại.

## Phần chưa biết và phần chỉ thuộc bài học

- Phiên lỗi có **cancelling refresh attempt**, chưa có dòng xác nhận shutdown/giải phóng tài nguyên hoàn tất. Nếu cần đối chiếu hết ảnh console, cần bổ sung từ ERROR/exception đầu tiên đến hết Process finished/shutdown, gồm stdout/stderr Log4j2. Không cần chạy lại Java để dùng bài hiện tại.
- Không có toàn bộ arguments/environment hoặc output compile của phiên cũ. Không suy actor nào đã bấm Stop ở phiên thành công.
- Run/Stop, tốc độ phát, Pause/Resume và process/port trong bài là tương tác học. Không chạy JVM, gọi Command HTTP, bật Docker hoặc thay dependency thật. Ví dụ lỗi port và HTTP health ở các nhánh cũ vẫn có nhãn minh họa, tách khỏi log lịch sử.
- Secrets, URL/IP, email, số nhạy cảm, thông tin người dùng và dòng chứa credential đã che. Không đưa source `InitConfig.createOwner` chứa thông tin nhạy cảm vào bài; chỉ trích phần hook init.

## Ảnh

1. Nhóm đang khởi tạo (artifact cục bộ: `../.verification/startup-groups-initializing.png`)
2. Điểm startup lỗi và nguyên nhân (artifact cục bộ: `../.verification/startup-groups-failure.png`)

Ảnh toàn trang, chụp UI bằng `node scripts/capture-startup-groups.mjs`; không phải ảnh/log của một lần chạy Java mới.

## Kiểm tra và phạm vi

Kiểm tra mới bao gồm hash/mốc phiên/profile, nhóm–log–source, nguyên nhân và giới hạn shutdown, Pause/Resume/Next group, toàn bộ log/quay lại nhóm, Stop/replay, deep link/history/mobile và việc không đổi I1/G2 khi xem lịch sử. Tiến độ đọc log G2 tiếp tục độc lập với điều kiện Run.

Không thêm dependency, sửa repo Java, commit/push/deploy. Bản ứng dụng trước sửa giữ tại `.verification/startup-groups-before/`. Cây/style đã duyệt, Java/IDE, Docker, dependency, Build, Policy/Claim được giữ; component chứa cây chỉ điều chỉnh định vị main và giữ focus ổn định khi phát log.

Kết quả kiểm tra: build/typecheck qua. Lượt toàn bộ 121 bài có 119 qua; hai bài cũ chọn nhầm header của panel giải thích mới. Đã sửa selector trỏ đúng header cửa sổ Run và chạy lại các suite liên quan: **23/23 qua**, gồm cả hai bài đó. Không còn lỗi được ghi nhận chưa xử lý. Audit xác nhận 10 hash log/source giữ nguyên, sáu component đã duyệt giữ nguyên và không có literal nhạy cảm được tìm thấy trong các artifact xuất bản. `verify:originals` xác nhận 44 file quotation-product và 1.937 file quotation-workshop không đổi; git status agent-system và repo con agent-service sạch.
