# Kiểm chứng startup Command bằng source và log thật

Luồng hiện tại đã gộp Run và đọc kết quả; xem [bàn giao bước gộp và thư viện case](PROJECT-COMMAND-MERGED-CASES.md). Các kết quả kiểm chứng source/log bên dưới vẫn được giữ để đối chiếu.

Review: http://localhost:3182/journey/environment?experience=project&task=startup&step=run&pview=activity

Chọn **Console tham chiếu → Phiên lỗi thật · default · 06/11 23:24**, bấm tam giác cạnh main. Chọn nhóm để tạm dừng và xem bốn giải thích ngắn cùng dòng log/source. Tiếp tục đến **Kết quả & nguyên nhân**. Đổi sang **Phiên thành công thật · default · 04/11 12:43** để xem Redis, Tomcat, Started rồi Stop/Chạy lại. Chế độ theo I1 là kịch bản bài học dùng log lịch sử minh họa; không phải một lần chạy mới đã kiểm chứng.

## Quyết định trước khi Run

**Không khởi chạy Java mới.** Điều kiện người dùng yêu cầu dừng trước Run nếu chưa bảo đảm phạm vi tác động. Source hiện tại có những đường ghi tự động sau:

- `application.yml:41,44` và `application-dev.yml:41,44`: `ddl-auto: update`, `hibernate.hbm2ddl.create_namespaces: true`; Hibernate có thể đổi schema/namespace khi chuẩn bị persistence.
- `InitConfig.java:56–60`: `@PostConstruct` gọi `createOwner()` và `initGlobalConfig()` ngay khi bean được khởi tạo, không cần request nghiệp vụ.
- `InitConfig.java:69–70` → `CreateSaleUnitOwnerFunc.java:54` → `io/eventuate/sync/AggregateRepository.java:73–76`: khi thiếu owner, có đường tạo aggregate và lưu event. Đây không phải bằng chứng đã phát Kafka.
- `InitConfig.java:178,247–248`: lấy khóa Redis; khi thiếu key thì `configRepository.save(value)`. Không chỉ là thao tác đọc cấu hình.

Chưa xác minh được dữ liệu/schema cô lập để các tác động này nằm trong phạm vi cho phép. Không sửa cấu hình để vô hiệu hóa hook, không đổi sang default để né dev, không bật Docker/service, không gửi API hoặc tác động dữ liệu.

Kiểm tra process/port lúc **07/11/2026 00:41:20 +07:00**: không nhận diện Command đang chạy, không có listener 9901; có Gradle daemon PID 40108 dùng Java 21.0.13.9. Giữ nguyên daemon. Không tạo PID Java mới, không dừng PID nào. Đây là snapshot có thời điểm, không phải kiểm tra trạng thái máy liên tục.

Biên bản đã che: .verification/command-live-check/preflight.json (artifact cục bộ: `../.verification/command-live-check/preflight.json`). Đây là kết quả kiểm tra trước chạy, **không phải startup log mới**. Không có log của một lần khởi chạy mới để ghép vào lịch sử.

## Cấu hình và cách chạy đã đối chiếu

`.idea/workspace.xml` có Run Configuration tạm cho `com.alpaca.agent.AgentCommandServiceApplication`, module `agent-workspaces.workspaces.agent-service.1-agent-command-service.main`, Before launch **Make**; `.idea/misc.xml:4` chọn SDK **21**. Root `build.gradle:48` yêu cầu toolchain Java 21. Trong cấu hình Run này không thấy profile/VM arguments/program arguments được khai báo riêng. Không đọc được toàn bộ environment của IntelliJ: chỉ kết luận **nếu không có override khác thì default**, không suy profile từ tên cấu hình.

Phương án Terminal đã đối chiếu, **chưa thực hiện**, cwd `D:/ALPACA/agent-system`, JDK 21, profile dev đặt rõ:

```powershell
.\gradlew.bat :workspaces:agent-service:1-agent-command-service:bootRun --args="--spring.profiles.active=dev"
```

Đây là cách tương đương ở mức main class/profile. Gradle dùng task/classpath/toolchain; IntelliJ dùng module/SDK và Make. Không khẳng định toàn bộ VM arguments, environment hay working directory giống nhau. Không bắt đóng gói JAR trước Run.

Với `application.yml` + `application-dev.yml` và môi trường shell tại lúc kiểm tra: port dự kiến 9901; PostgreSQL `postgresql://localhost/alpaca-event` (URL không ghi port riêng); Kafka `127.0.0.1:9092`; RabbitMQ `127.0.0.1:5672`; ba URL Redis đều `redis://localhost:6379`. Ba bean Redisson không chứng minh ba server/database riêng. Một số client SSO/query/command vẫn trỏ ra ngoài (host đã che); dev không đồng nghĩa mọi kết nối local. Danh sách key, dòng nguồn và override chưa xác định nằm trong biên bản. Không kiểm tra kết nối mạng tới các đích đó.

Đã quét source `src/main/java` trong 18 Gradle project dependency khai báo của Command: tìm thấy hook `@PostConstruct`; không thấy annotation scheduler đang bật hoặc runner trong phạm vi đó. Đây không là kiểm chứng mọi auto-configuration của thư viện ngoài, cũng không chứng minh không có thread/tác vụ nền.

## Chín nhóm sau kiểm chứng

Các nhóm giúp hiểu bản chất; hoạt động có thể đan xen. Nhãn **Quan sát trong phiên thật** luôn nói về phiên lịch sử đang chọn. Nhãn này không tự chứng minh cả nhóm đã hoàn tất. **Đối chiếu source** mô tả đường code; **Chưa quan sát** giữ nguyên khi không có log, không phát dòng thành công giả.

| Nhóm | Việc và lý do | Bằng chứng, kết quả và giới hạn |
| --- | --- | --- |
| JVM, Boot & cấu hình | Một process Java chạy main; Boot chuẩn bị logging và profile để nạp ứng dụng. | Main:26–27, Log4j2, SDK/Make hiện tại. Phiên lỗi L19076–19078 xác nhận Java 21 và default. Không có output Make hay toàn bộ lệnh JVM của phiên cũ. |
| Thành phần Spring / Feign | Spring tìm, tạo, ghép bean; Feign đăng ký proxy để code có thể gọi dịch vụ. | `@ComponentScan`, `@EnableFeignClients`; L19080 refresh, L19081 đăng ký Feign. Đăng ký chưa là gọi HTTP hoặc mọi bean thành công. |
| Repository, JPA, DB | Quét repository, Hibernate chuẩn bị persistence/schema và Hikari mở pool JDBC tới PostgreSQL ngoài JVM. | `@EntityScan`, `@EnableJpaRepositories`, cấu hình JPA; L19093 tìm 15 JPA repository, L19144 Hibernate, L19146 mở Hikari, L19148 kết nối lỗi. Repository tìm thấy chưa là đọc/ghi nghiệp vụ. |
| Bootstrap owner / config | Hook startup tự chuẩn bị dữ liệu owner/config, có thể ghi DB/event và lấy khóa Redis. | `InitConfig`, `CreateSaleUnitOwnerFunc`, `AggregateRepository`. **Đối chiếu source / Chưa quan sát** từng thao tác trong các phiên đã chọn. Đây là lý do không khởi chạy mới. |
| Cache / Redis | Bean Redisson và thread Netty trong JVM nối tới Redis ngoài; dùng cache/lock khi code gọi, kể cả bootstrap. | `SpringCacheConfig:17–58`. Phiên default thành công L16115–16116 có Redisson/pool connection. Phiên lỗi DB **chưa quan sát** nhóm này; không suy kết nối từ URL cấu hình. |
| Eventuate / sự kiện | Dựng hạ tầng event store/bean/executor; subscriber và handler cần đúng trigger. | Main import `LibraEventuateLocalConfiguration`, `EventuateJavaClientDomainEventsConfiguration`, postprocessor/subscription source. L19115 cảnh báo bean Eventuate, chuỗi lỗi phụ thuộc. **Chưa quan sát** consumer start/subscribed, phát hoặc xử lý event trong các đoạn Command đã chọn. Tạo executor không chứng minh task đã chạy. |
| Web server & Security | Tomcat và filter chain nằm trong process Command; nhận HTTP/auth khi có request. | `ResourceServerConfiguration`, module webmvc/OAuth2. Phiên default thành công L16101 initialized, L16108 filter mapping, L16134 Tomcat 9901. Phiên lỗi **chưa quan sát** web server started. Không chứng minh SSO kết nối hoặc API/nghiệp vụ đúng. |
| Kết quả & nguyên nhân | Đọc Started hoặc chuỗi lỗi để biết startup kết thúc tới đâu. | Phiên lỗi L19688 JPA fail, L22542 Application run failed, L23868 connect timeout; phiên default thành công L18989 Started. Main:27 là điểm gọi startup, không phải kết luận lỗi gốc. |
| Hủy khởi tạo / dừng | Hủy context/đóng tài nguyên trong JVM; vòng đời dịch vụ Docker ở ngoài độc lập. | Phiên lỗi L19689 cancelling refresh, **chưa quan sát** cleanup hoàn tất. Phiên default thành công có shutdown riêng L18992–19074. Stop trong bài giữ source/JAR và trạng thái container; không dừng dịch vụ thật. |

## Các phiên log lịch sử thực tế

Chỉ dùng `D:/ALPACA/agent-system/logs/app.log`, 24.261 dòng, SHA-256 `6e2727b941c1d09104a08085daa6285be1c51d9facb76944dae58d4bc6e648c7`:

- 04/11 11:54, L2953–6064: Java 21, **dev**, output JAR, Tomcat 9901, Started.
- 04/11 12:43, L15881–18989: Java 21, **default**, output classes, Tomcat 9901, Started. Shutdown cùng phiên lưu riêng; không ghép sang phiên lỗi.
- 06/11 23:24, L19075–24260: Java 21, **default**, output classes, lỗi startup; không Started/port thành công. Không gọi đây là lần chạy dev.

Chuỗi lỗi liên quan: `eventHandlerBeanPostProcessor` → Eventuate → `transactionManager` → `entityManagerFactory` → `JDBCConnectionException` → `PSQLException` → **`SocketTimeoutException: Connect timed out`**. JDBC không mở được kết nối cho Hibernate chuẩn bị persistence/DDL. Chưa đủ bằng chứng phân biệt mạng, firewall, DB tắt hay địa chỉ hiệu lực sai. Không tự sửa hạ tầng để ép thành công.

Log không có PID trên mọi dòng nên giới hạn attribution theo cửa sổ Starting/Started đúng Command, không khẳng định mọi dòng chen kẽ thuộc cùng thread/process. Source hiện tại không chứng minh toàn bộ cấu hình ở thời điểm phiên cũ. Muốn xác nhận shutdown phiên lỗi cần thêm console từ ERROR/exception đầu tiên đến hết shutdown/Process finished, gồm stdout/stderr; vẫn có thể học phần đã có bằng chứng.

## Những điểm mô phỏng đã sửa

- Gộp JVM/Boot, tách Feign khỏi Redis; tách bootstrap có tác động ghi và hạ tầng Eventuate. Không giữ tám nhóm cũ chỉ vì đã triển khai.
- Mỗi nhóm ghi loại thành phần, trigger startup/request/event, bằng chứng và giới hạn. Dòng log và source được trích riêng, source dev xuất hiện khi phiên tham chiếu là dev.
- Không biến bean/client thành kết nối thành công, không coi Hibernate là process riêng hoặc Java vừa bật container. Bootstrap không có log đại diện giả.
- Nguyên nhân sâu nhất chỉ hiện sau khi dòng Caused by tương ứng được phát; không tiết lộ kết luận sớm hơn log.
- Thêm mục thu gọn kết quả kiểm tra trước Run: vì sao không chạy mới, cấu hình IDE, phương án dev chưa thực hiện và đích dependency đã che. Kịch bản theo I1 ghi rõ dùng log lịch sử minh họa.
- Stop ghi rõ container giữ nguyên. Link cũ chọn nhóm `boot` tự chuyển sang `jvm`, giữ frame/phiên/tạm dừng. I1/G2/build và tiến độ khác giữ nguyên; chưa đọc log PostgreSQL vẫn không chặn Run.

## Kiểm tra

- `npm.cmd run build`: qua, gồm typecheck. Vite vẫn báo kích thước chunk lớn; không chặn build. Log đầy đủ được tải khi mở thêm.
- Kiểm tra startup mới + có sẵn: 11/11 qua; sau chỉnh định vị nguyên nhân trong console đã chạy lại toàn bộ 11 bài, cùng hai bài vị trí tam giác Run desktop/mobile: **13/13 qua**.
- Hồi quy I1/I2/J1/J2, Terminal, G2 → I2, Build và runtime: lượt 44 bài có **43 qua**, một bài dừng trước bước tương tác vì `src/main.tsx` bị `ERR_CONNECTION_REFUSED` (trang trắng). Trace đã lưu tại `.verification/startup-validation-transient-test/`; bài đó đã qua trong lượt 13/13 sau khi server ổn định. Không sửa chức năng I1 hoặc tăng timeout để che lỗi.
- Tổng cộng 55 bài kiểm tra riêng biệt đã có kết quả qua trong các lượt trên; không ghi đây là một lượt 55/55 duy nhất.
- Bao gồm đồng bộ nhóm/log/source, nguyên nhân chỉ hiện khi có dòng log, nhãn chưa quan sát, source bootstrap, Pause/Continue/Next/Replay/Stop, giữ Docker/build/I1, không chặn vì chưa đọc log G2, tree/JAR, deep link, Back/Forward và mobile.
- Audit: **35 hash file nguồn/log không đổi**, sáu component đã duyệt giữ nguyên; không tìm thấy bốn literal nhạy cảm đã kiểm tra trong artifact xuất bản. Source/log trích đã che credential, URL/IP và dữ liệu nhạy cảm theo bộ lọc; không công bố giá trị dùng để audit.
- `verify:originals`: quotation-product 44 file, quotation-workshop 1.937 file không đổi và working tree giữ nguyên. Git status `agent-system` và repo con `agent-service` sạch tại lúc kiểm tra.

Test chỉ chạy ứng dụng học; không khởi động Java/Docker/DB/API thật, thêm dependency hoặc commit/push/deploy.

Ảnh UI toàn trang (không phải ảnh một lần chạy Java mới): Đang chuẩn bị JPA/Hikari (artifact cục bộ: `../.verification/startup-verification-initializing.png`), Chuỗi nguyên nhân startup thất bại (artifact cục bộ: `../.verification/startup-verification-failure.png`). Deep link đúng trạng thái hai ảnh lưu trong .verification/startup-verification-review.json (artifact cục bộ: `../.verification/startup-verification-review.json`).

Nguồn trích đã che nằm trong `src/content/setup/command-startup-source.json` và ba file log `.txt` tách phiên. `command-preflight-source.json` là biên bản trước chạy. Scripts `inspect-command-startup-preflight.mjs`, `extract-command-startup.mjs` chỉ đọc repo Java và ghi vào ứng dụng học. Bản ứng dụng trước chỉnh lượt này lưu tại `.verification/startup-validation-before/`.
