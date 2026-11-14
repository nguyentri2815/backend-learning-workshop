# Review đường chạy fixture và lượt tạo file

[Mở quote-trial để thử hai fixture](http://localhost:3182/journey/policy?group=create&mode=session&sessionId=quote-beginner&sessionAt=quote-trial&sessionDone=9&sessionDecision.quote-trial=0) · [Controller tại lượt tạo 7](http://localhost:3182/journey/policy?group=create&mode=session&sessionId=quote-beginner&sessionAt=controller&sessionDone=6&sessionDecision.controller=0&sessionScope=total&sessionFile=controller) · [File theo lượt tạo](http://localhost:3182/journey/policy?group=create&mode=session&sessionId=quote-beginner&sessionAt=controller&sessionDone=6&sessionDecision.controller=0&sessionScope=total&sessionFileOrder=created) · [Controller sau lượt sửa 9](http://localhost:3182/journey/policy?group=create&mode=session&sessionId=quote-beginner&sessionAt=wire&sessionDone=8&sessionDecision.wire=0&sessionScope=total&sessionFile=controller).

Các link dựng sẵn mốc để review giao diện. Tại quote-trial (lượt 11), snapshot đã áp dụng mới nhất là lượt 10: **Đọc Quote và dừng nếu thiếu**. Mỗi lần thử lưu `sessionTrialAt.<fixture>` cùng tiến độ, nên Review giữ đúng đường chạy và số đếm của lần thử đó, kể cả khi các lượt sau đã nối ghi.

Quote hợp lệ đi qua URL mang quoteId → Controller → CreatePolicyFunc.exec → QuoteRepository.findById → Quote tồn tại → cơ chế khóa Quote → runInternal. Điểm cuối là runInternal; phần dựng Command và gọi ghi chưa nối. Snapshot còn câu lệnh đánh dấu phần chưa triển khai trong runInternal. Kết quả: 0 Command, 0 Event, 0 lần ghi mới, chưa có Policy ID.

Quote thiếu đi qua phần nhận yêu cầu và đọc, nhận Optional.empty rồi dừng ở QUOTE_NOT_EXIST trong exec. Khóa Quote và runInternal có trong snapshot nhưng không chạy với đầu vào này. Phần dựng Command và ghi vẫn chưa nối. Nhánh không chạy có màu trung tính; phần thiếu có viền nét đứt; điểm dừng có cảnh báo, mã lỗi, viền đậm và nhãn Đã tới đây.

Mỗi điểm đã chạy có màu xanh và dấu kiểm. Điểm có source là nút mở đúng file và dòng trong snapshot của lần thử, ngay trong thẻ kết quả; không đổi lượt hoặc lựa chọn của phiên. Mobile xếp các điểm theo chiều dọc. Các fixture tạo trùng, thành công và đối chiếu ID cũng có sơ đồ; đối chiếu ID không chạy lại đường ghi.

Đã đối chiếu 31 source của phiên người mới. Quan hệ khóa/callback được xác minh tại CreatePolicyFunc.java L67 và BaseFunc.java L63–65: khóa → transaction → supplier.get(). Điểm lỗi nguồn ở CreatePolicyFunc.java L61–64; điểm nhận callback là runInternal L70. Các nút mở số dòng tại snapshot bài học, có thể khác số dòng source đầy đủ vì snapshot đã lược phần chưa lắp. Đây là thực thi fixture TypeScript trong Workshop.

Explorer mặc định giữ cây thư mục. Trong Từ đầu phiên, nhãn của file mới lấy từ lần đầu snapshot chuyển từ chưa có file sang có file: IPolicyCommand ở lượt 4, PolicyAggregate ở lượt 5 và PolicyController ở lượt 7. Chỉ nhãn của Controller có “Lượt này” khi đang xem lượt 7. Sửa Controller ở lượt 9 giữ nhãn tạo 7 trong tích lũy; chuyển Lượt này thì hiện Sửa ở lượt 9. Lịch sử file ghi riêng lượt tạo và các lượt sửa. File có sẵn như PlatformConfig được nhận diện bằng lượt sửa, không có lượt tạo trong phiên.

Tùy chọn Theo lượt tạo gom các file mới theo số lượt và tên công việc, sắp từ sớm đến muộn; file cùng lượt dùng chung tiêu đề. Các file có sẵn được sửa nằm trong nhóm riêng. Nút nhãn dưới mỗi file mở lại lượt tạo/sửa với đúng file được chọn. Cả cây và danh sách theo thời gian chỉ dùng lịch sử đã áp dụng đến snapshot đang xem; file tạo ở mốc sau chưa xuất hiện. Trường hợp hai file tạo cùng lượt được kiểm tra bằng dữ liệu mô hình, không thêm file giả vào kịch bản học.

Ảnh review: [Quote hợp lệ](policy-fixture-valid.png) · [Quote thiếu](policy-fixture-missing.png) · [Nhãn trên cây](policy-file-birth-tree.png) · [Nhóm theo lượt](policy-file-birth-timeline.png) · [Mobile sáng](policy-fixture-mobile-light.png) · [Mobile tối](policy-fixture-mobile-dark.png).

Kiểm thử nghiệm thu và mô hình: [policy-fixture-flow.spec.ts](../../tests/browser/policy-fixture-flow.spec.ts). Kết quả build và hồi quy cuối cùng: [validation](policy-fixture-flow-validation.json).

Build/typecheck đạt; 34/34 ca trên bản build production preview đạt, gồm hai phiên, cây/source dùng chung, hai fixture, nhãn lịch sử và mobile sáng/tối. Integrity 49 fixture và đối chiếu 31 source đạt. Build vẫn có thông báo chunk lớn.
