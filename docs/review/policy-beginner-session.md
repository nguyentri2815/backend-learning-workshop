# Xây Policy từ Quote · Dành cho người mới

[Review phiên mới](http://localhost:3182/journey/policy?group=create&mode=session&opened=create-api&sessionId=quote-beginner&sessionDecision.brief=0&sessionDone=24&sessionAt=review&sessionDecision.survey=0&sessionReads=survey%3Asource-quoteController%2Csurvey%3Asource-quoteFunc%2Csurvey%3Asource-quoteRead%2Csurvey%3Asource-quoteRepo%2Ccontroller-pattern%3Asource-quoteController%2Ccontroller-pattern%3Asource-controller%2Csurvey%3Asource-controller&sessionDecision.data=0&sessionDecision.marker=0&sessionMode=total&sessionScope=total&sessionPatches=marker%3Amarker%2Caggregate-model%3Aaggregate%2Ccontroller%3Acontroller%2Cfunc%3Afunc%2Cwire%3Acontroller%2Cquote-guard%3Afunc%2Crepository%3Arepo%2Cduplicate-guard%3Astatus%2Cduplicate-guard%3Afunc%2Ccommand-type%3Acommand%2Cmapping%3Afunc%2Ccreation-values%3AsyncStatus%2Ccreation-values%3Afunc%2Cpayment%3Afunc%2Cevent-base%3AeventBase%2Cevent-type%3Aevent%2Cprocess%3Aaggregate%2Capply%3Aaggregate%2Cregistration%3ArepositoryBean%2Cpersist%3Afunc&sessionDecision.aggregate-model=0&sessionDecision.controller-pattern=0&sessionDecision.controller=0&sessionDecision.func=0&sessionDecision.wire=0&sessionDecision.quote-guard=0&sessionDecision.quote-trial=0&sessionTrials=quote-valid%2Cquote-missing%2Cduplicate%2Csuccess%2Cread-id&sessionTrialAt.quote-valid=9&sessionTrialAt.quote-missing=9&sessionDecision.repository=0&sessionDecision.duplicate-guard=0&sessionDecision.duplicate-trial=0&sessionTrialAt.duplicate=12&sessionDecision.command-type=0&sessionDecision.mapping=0&sessionDecision.creation-values=0&sessionDecision.payment=0&sessionDecision.event-base=0&sessionDecision.event-type=0&sessionDecision.process=0&sessionDecision.apply=0&sessionDecision.registration=0&sessionDecision.persist=0&sessionDecision.verify=0&sessionTrialAt.success=23&sessionTrialAt.read-id=23&sessionFile=aggregate) · [Review phiên hiện tại](http://localhost:3182/journey/policy?group=create&mode=session&sessionAt=review&sessionDone=10&sessionFile=func&sessionMode=total&sessionTrials=entry-valid,entry-missing,entry-blocked,pending,success,read-id) · [Mở phiên mới](http://localhost:3182/journey/policy?group=create&mode=session&sessionId=quote-beginner)

Phiên mới có 25 lượt và một Review, tiến độ/khởi đầu/làm lại riêng. Deep link cũ không cần sessionId; phiên mới dùng sessionId=quote-beginner. Tiến độ theo URL và localStorage key workshop:policy-session:<id>:v1.

| Mốc | File A/M sau áp dụng | Kết quả và phạm vi kiểm tra |
| --- | --- | --- |
| Mốc đầu | 21 file Quote/hạ tầng; 0 file Policy | Không có tham chiếu Policy trong nội dung, import, bean hoặc hàng đợi; chưa có API đọc Policy. |
| 1. Giao việc bằng ngôn ngữ nghiệp vụ | Chỉ đọc / quyết định / chạy fixture | Chưa gửi HTTP hoặc thay đổi file. Prompt có thể sao chép để giao agent. |
| 2. Tìm đường đi của Quote đã lưu | Chỉ đọc / quyết định / chạy fixture | Danh sách thay đổi phải trống. Quote ID có sẵn từ lượt lưu Quote trước bài này. |
| 3. Phân loại dữ liệu trước khi mở Java | Chỉ đọc / quyết định / chạy fixture | Chưa thêm Java. Đây là dữ liệu fixture được chọn cho bài, không phải dữ liệu khách hàng thật. |
| 4. Khai báo họ lệnh của Policy | A IPolicyCommand.java L1–6 | Chỉ có file đánh dấu mới; chưa có API hoặc thao tác ghi. |
| 5. Tạo chỗ giữ trạng thái hợp đồng | A PolicyAggregate.java L1–16 | File xuất hiện trong cây sau khi áp dụng. Snapshot là trích đoạn cấu trúc, chưa chạy Java. |
| 6. Tìm mẫu điểm nhận yêu cầu | Chỉ đọc / quyết định / chạy fixture | Chỉ tìm mẫu Controller; danh sách thay đổi không tăng. |
| 7. Tạo vùng nhận yêu cầu Policy | A PolicyController.java L1–6 | Chỉ kiểm tra cấu trúc annotation. Chưa chạy thử endpoint. |
| 8. Tạo nơi xử lý nghiệp vụ | A CreatePolicyFunc.java L1–8 | Chỉ kiểm tra chữ ký và lớp nền; fixture chưa được phép báo thành công. |
| 9. Chuyển Quote ID từ URL sang Func | A PolicyController.java L6–9 | Đã nối đường truyền tham số. Chưa nối đọc Quote nên chưa thể tạo. |
| 10. Đọc Quote và dừng nếu thiếu | A CreatePolicyFunc.java L5–18 | Áp dụng xong mới mở lượt thử guard. Chưa có điều kiện tạo trùng. |
| 11. Thử báo giá có và không có | Chỉ đọc / quyết định / chạy fixture | Fixture xác nhận đường URL → Func → findById; 0 Command, 0 Event, 0 lần ghi. |
| 12. Tìm Policy để kiểm tra tạo trùng | A PolicyRepository.java L1–4 | Mới thêm hợp đồng truy vấn; Func chưa gọi nên chưa khẳng định chặn trùng. |
| 13. Nối điều kiện chặn tạo trùng | A PolicyStatus.java L1–28<br>A CreatePolicyFunc.java L6–23 | Guard được nối; lượt tiếp kiểm tra nhánh trùng bằng fixture riêng. |
| 14. Thử nhánh đã có Policy | Chỉ đọc / quyết định / chạy fixture | Dừng trước mapping, không sinh ID và không tăng số bản ghi. |
| 15. Tạo gói dữ liệu yêu cầu ghi | A CreatePolicyCommand.java L1–13 | Chỉ thêm kiểu dữ liệu; chưa có instance Command hoặc lần ghi. |
| 16. Chép thông tin và liên kết về Quote | A CreatePolicyFunc.java L24–28 | Command đã có dữ liệu từ Quote; chưa có mã/trạng thái quyết định lúc tạo. |
| 17. Quyết định giá trị lúc tạo | A SyncPolicyStatus.java L1–8<br>A CreatePolicyFunc.java L28–36 | Mã nghiệp vụ xuất hiện, Policy ID vẫn chưa được cấp. Helper/metadata là phần được lược trong snapshot cấu trúc. |
| 18. Chốt phạm vi dữ liệu thanh toán | A CreatePolicyFunc.java L36–38 | Đã đánh dấu phạm vi trước save. Thuật toán thanh toán đầy đủ là chặng cần triển khai thêm. |
| 19. Khai báo Event thuộc Policy | A BasePolicyEvent.java L1–9 | Đã có metadata Event; chưa có sự kiện tạo cụ thể. |
| 20. Mô tả dữ liệu sự kiện tạo | A CreatePolicyEvent.java L1–13 | Mới có kiểu Event, process chưa được nối. |
| 21. Xử lý Command thành Event | A PolicyAggregate.java L16–19 | Một method mới trong Aggregate đã có; chưa apply Event. |
| 22. Cập nhật trạng thái từ Event | A PolicyAggregate.java L20–27 | Đã có hai đầu xử lý Command/Event. Các field metadata/path được lược trong snapshot cấu trúc, xem source đầy đủ. |
| 23. Đăng ký chỗ ghi Policy | M PlatformConfig.java L4–19 | Cấu hình chuyển từ Quote-only sang Quote + Policy. Chưa có lời save trong Func. |
| 24. Nối ghi và trả kết quả tạo | A CreatePolicyFunc.java L7–40 | Đường ghi trong phạm vi bài đã nối. Snapshot là trích đoạn học, chạy thử bằng fixture TypeScript, không chạy Java. |
| 25. Kiểm tra kết quả từ góc nhìn người dùng | Chỉ đọc / quyết định / chạy fixture | Đối chiếu chính Policy ID trả về; nhập Quote ID sẽ không đạt. Đây là ghi trong bộ nhớ fixture của Workshop. |
| 26. Review toàn phiên | Chỉ đọc / quyết định / chạy fixture | Các fixture xác nhận luồng tạo tinh gọn. Chưa kiểm tra Java/HTTP/Kafka, payment đầy đủ, đối tượng bảo hiểm, PublishedQuote, email hoặc SMS của luồng production. |
| Kết quả cuối | 11 file duy nhất: 10 A / 1 M | QUOTE-BEGINNER-101 → POL-BEGINNER-101, version 1, một bản ghi fixture. Thiếu Quote và tạo trùng: 0 lần ghi mới. |

Source đối chiếu: D:/ALPACA/agent-system; [31 file với SHA-256 và commit](policy-beginner-source-audit.json). Các file Quote và Policy trong cây là trích đoạn cấu trúc được dựng cho bài, lược imports, helper và trường mở rộng; source đầy đủ mở từ từng bằng chứng. Snapshot Java không được biên dịch. Fixture TypeScript mô phỏng guard, mapping, Command → Event → Aggregate → store và đối chiếu ID.

Fixture dùng ngày 13/11/2026, khách hàng Nguyễn An, sản phẩm AUTO và paymentInfo rỗng. Chưa kiểm tra tính toán thanh toán, Java/HTTP/Kafka, đối tượng bảo hiểm, PublishedQuote hoặc email/SMS. Chặng tiếp nối phải bổ sung rõ API/Func/model đọc, Workflow/SyncView, view/repository và cấu hình; không dùng ngầm chúng trong phiên tạo mới.

Đã kiểm tra bằng trình duyệt: đi hết phiên thành công và hai nhánh dừng; ID sai rồi đúng; Review 11 file và lịch sử Aggregate; về lượt đầu file xuất hiện; tải lại mốc cũ; đổi hai phiên và reset độc lập; mobile sáng/tối không tràn ngang. [Kết quả fixture và bảng source theo lượt](policy-beginner-validation.json).
