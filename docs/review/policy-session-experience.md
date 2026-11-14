# Review trải nghiệm mô phỏng phiên Policy

[Mở trang Tạo mới và chọn một trong hai phiên](http://localhost:3182/journey/policy?group=create&mode=overview). Nút **Mô phỏng cả phiên triển khai** mở menu có tên, mốc đầu và tiến độ của từng phiên. Mỗi phiên tiếp tục vị trí, lựa chọn và phạm vi Explorer riêng; deep link cũ không cần `sessionId` vẫn mở phiên Phát hành trực tiếp.

| Mốc dựng sẵn để review | Kết quả cần thấy |
| --- | --- |
| [Khảo sát Quote](http://localhost:3182/journey/policy?group=create&mode=session&sessionId=quote-beginner&sessionAt=survey&sessionDone=0&sessionDecision.brief=0) | Ngữ cảnh nối về giao việc; mở/đóng “Xem lại suy luận trước” tại chỗ. Gợi ý không chọn hộ đáp án. Hai đường ghi/đọc có nhãn riêng và nút mở source đúng dòng. |
| [Khảo sát mẫu Controller](http://localhost:3182/journey/policy?group=create&mode=session&sessionId=quote-beginner&sessionAt=controller-pattern&sessionDone=4&sessionDecision.controller-pattern=0&sessionScope=round) | Lượt này: 0; Từ đầu phiên: 2 file duy nhất. |
| [Trước khi thêm PolicyController](http://localhost:3182/journey/policy?group=create&mode=session&sessionId=quote-beginner&sessionAt=controller&sessionDone=5&sessionDecision.controller=0&sessionScope=round) | Dự kiến thêm 1 file; cây snapshot và số đã áp dụng vẫn là 0 ở lượt này. Mở patch rồi áp dụng. |
| [Sau khi thêm PolicyController](http://localhost:3182/journey/policy?group=create&mode=session&sessionId=quote-beginner&sessionAt=controller&sessionDone=6&sessionDecision.controller=0&sessionScope=round) | Đã áp dụng; Lượt này: 1; Từ đầu phiên: 3. Tất cả file làm nổi PolicyController. |
| [Sửa Controller đã tạo trước đó](http://localhost:3182/journey/policy?group=create&mode=session&sessionId=quote-beginner&sessionAt=wire&sessionDone=8&sessionDecision.wire=0&sessionScope=round) | “Sửa 1 file”, M / “Sửa ở lượt này”; chuyển Từ đầu phiên vẫn là A / “Tạo mới trong phiên”. |
| [Xem lại mốc khảo sát sau khi đã đi xa hơn](http://localhost:3182/journey/policy?group=create&mode=session&sessionId=quote-beginner&sessionAt=controller-pattern&sessionDone=8&sessionDecision.controller-pattern=0&sessionScope=total) | Từ đầu phiên chỉ có 2 file theo mốc đang xem; chưa có PolicyController. Đổi Lượt này: 0; không có diff của lượt sau. Reload giữ đúng mốc. |
| [Phiên Phát hành trực tiếp](http://localhost:3182/journey/policy?group=create&mode=session) | Menu chung đổi phiên và khôi phục tiến độ độc lập. Explorer dùng cùng ba phạm vi. |

Các link trên dựng sẵn mốc để review giao diện. Kiểm thử nghiệm thu bắt đầu từ phiên trống, thao tác qua UI đến Review và chạy đủ nhánh dừng, thành công và đối chiếu ID của cả hai phiên.

Thẻ radio giữ viền lựa chọn độc lập với màu phản hồi: xanh nhạt + dấu kiểm giải thích phương án phù hợp; hổ phách + thông tin giải thích phương án chưa phù hợp. Có thể đổi lựa chọn bằng cả thẻ hoặc phím mũi tên. Nút Gợi ý hỗ trợ Enter/Space và chỉ mở manh mối. Phần suy luận trước hiện câu hỏi, các lựa chọn, lựa chọn thực sự đã lưu và kết luận đã xác nhận; không điều hướng khỏi lượt hiện tại.

Explorer tính thay đổi từ nội dung snapshot trước/sau lượt; tích lũy từ baseline tới snapshot đang xem, không cộng số patch. Dự kiến nằm riêng, không đưa vào cây snapshot hoặc số file đã áp dụng. Nút phạm vi và các tab diff đồng bộ; file đối chiếu hoặc file thay đổi ở lượt trước được ghi nhãn riêng. Lịch sử file ở mốc cũ chỉ chứa các lượt đã xuất hiện đến mốc đó.

Đã đối chiếu 31/31 source của phiên người mới với `D:/ALPACA/agent-system`. GET Quote tại `QuoteController.java:49–52` gọi `FindQuoteByIdFunc.exec(id)`; Func đọc tại `FindQuoteByIdFunc.java:35–36` gọi `QuoteRepository.findById`, kế thừa từ JpaRepository. Đường ghi riêng đi qua `CreateQuoteFunc.java:74–85` tới `quoteAggregateRepository.save(command)` tại L151. Sơ đồ không nối GET sang CreateQuoteFunc.

Kiểm tra: build/typecheck đạt; integrity 49 fixture đạt; 43 ca hồi quy liên quan đạt (hai phiên, Toàn cảnh, điều hướng checkpoint, cây/source của Chọn mẫu). 20/20 ca của hai phiên và trải nghiệm mới đạt trên bản build production bằng Vite preview cổng 3183, gồm bấm phần chữ của thẻ, đổi radio bằng phím mũi tên và mốc lịch sử. Chi tiết: [test nghiệm thu](../../tests/browser/policy-session-experience.spec.ts).

Giới hạn kiểm chứng: audit độc lập của phiên Phát hành trực tiếp phát hiện source `PlatformConfig.java` hiện tại khác hash của snapshot cũ; snapshot phiên cũ được giữ nguyên. Build vẫn có thông báo chunk lớn. Đây là bài học chạy fixture TypeScript, không chạy Java/backend.

Ảnh review:

- [Menu hai phiên](policy-session-experience-menu.png).
- [Ngữ cảnh, suy luận trước, thẻ lựa chọn và gợi ý](policy-session-experience-lesson.png).
- [Hai đường Quote và source đọc đúng dòng](policy-session-experience-quote-flow.png).
- [Dự kiến thêm Controller](policy-session-experience-planned.png).
- [Đã áp dụng và 3 file tích lũy](policy-session-experience-applied.png).
- [Mobile sáng](policy-session-experience-mobile-light.png) · [Mobile tối](policy-session-experience-mobile-dark.png).
