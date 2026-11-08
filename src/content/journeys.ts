import type { Journey } from "./model";
import { setupJourney } from "./setup";
import { policyJourney } from "./policy/lesson";

const claimFiles = [
  {
    id: "claim-questions",
    path: "demo/claims/open-questions.md",
    symbol: "Câu hỏi nghiệp vụ",
    role: "Giữ những điều chưa biết để tránh biến giả định thành yêu cầu triển khai.",
    input: "Yêu cầu Claim và ví dụ nghiệp vụ đang chờ xác định riêng; source Policy để tham khảo cấu trúc kỹ thuật.",
    output: "Danh sách quyết định được xác nhận trước khi lập kế hoạch thật.",
    before: "# Yêu cầu\nChưa có yêu cầu nghiệp vụ thật.",
    after:
      "# Câu hỏi cần xác nhận\n\n- Ai có thể tạo yêu cầu bồi thường?\n- Thông tin nào bắt buộc?\n- Yêu cầu liên hệ với Policy theo cách nào?\n- Có những trạng thái và quyền chuyển nào?\n- Cách xử lý trùng lặp và lỗi?\n\nKhông có câu trả lời nào được mặc định trong bản tổng thể.",
    range: [3, 7] as [number, number],
    links: [{ target: "claim-plan", label: "Xem khung kế hoạch thay đổi" }],
  },
  {
    id: "claim-plan",
    path: "demo/claims/change-plan.md",
    symbol: "Kế hoạch có điều kiện",
    role: "Đối chiếu với Policy sau khi hiểu source, rồi mới xác định file và symbol cần sửa.",
    input: "Các quyết định nghiệp vụ đã chốt và kết quả khảo sát.",
    output:
      "Kế hoạch file/symbol có nguồn, tiêu chí kiểm chứng và bước thực hành.",
    before: "# Kế hoạch\nChờ khảo sát.",
    after:
      "# Khung kế hoạch minh họa\n\n1. Xác nhận yêu cầu và tiêu chí chấp nhận.\n2. Đối chiếu flow Policy thật.\n3. Xác định các điểm cần thay đổi từ source.\n4. Thực hiện một thay đổi nhỏ có thể kiểm chứng.\n5. Chạy kiểm tra và lưu bằng chứng.\n\nFile Java / symbol / lệnh thật: đang chờ khảo sát.",
    range: [3, 7] as [number, number],
    links: [
      { target: "claim-draft", label: "Mở ví dụ Before / After" },
      { target: "claim-questions", label: "Quay về câu hỏi nghiệp vụ" },
    ],
  },
  {
    id: "claim-draft",
    path: "demo/claims/learning-draft.pseudo",
    symbol: "prepareLearningDraft",
    role: "Ví dụ thay đổi mã giả để học cách đọc Diff. Không phải thiết kế nghiệp vụ bồi thường.",
    input: "Một ghi chú học tập mẫu.",
    output: "Bản nháp học tập ghi rõ cần xác nhận nghiệp vụ.",
    before:
      "// Mã giả; không phải nghiệp vụ bồi thường\nfunction prepareLearningDraft(note) {\n  return { note };\n}",
    after:
      "// Mã giả; không phải nghiệp vụ bồi thường\nfunction prepareLearningDraft(note) {\n  return {\n    note,\n    needsBusinessReview: true\n  };\n}",
    range: [3, 6] as [number, number],
    links: [
      { target: "claim-plan", label: "Thay đổi này thuộc kế hoạch nào?" },
    ],
  },
];

export const journeys: Journey[] = [
  setupJourney,
  policyJourney,
  {
    id: "claims",
    number: "03",
    title: "Quản lý Yêu cầu bồi thường",
    subtitle: "Từng thay đổi, từng bằng chứng",
    duration: "5 bước mẫu",
    state: "pending",
    summary:
      "Khung làm việc từ yêu cầu đến kiểm chứng. Duyệt một thay đổi mã giả và bài tự thực hành.",
    outcome:
      "Theo dõi được mục tiêu, thay đổi, kiểm tra và cách tự thực hiện lại.",
    files: claimFiles,
    steps: [
      {
        id: "requirements",
        title: "Làm rõ yêu cầu nghiệp vụ",
        short: "Yêu cầu",
        goal: "Ghi câu hỏi và tiêu chí chấp nhận trước khi thiết kế.",
        why: "Chưa có yêu cầu thật, chưa thể chốt dữ liệu, trạng thái hoặc quyền.",
        expected: "Một danh sách câu hỏi được xác nhận bởi nguồn nghiệp vụ.",
        check: "Phân biệt rõ yêu cầu đã xác nhận, giả định và câu hỏi mở.",
        practice:
          "Chọn hai câu hỏi trong file mẫu và viết ví dụ đầu vào/đầu ra cần được xác nhận.",
        evidence: "Đang chờ yêu cầu Quản lý Yêu cầu bồi thường thực tế.",
        file: "claim-questions",
        explanation:
          "After chỉ bổ sung câu hỏi, không thêm quyết định nghiệp vụ.",
      },
      {
        id: "compare",
        title: "Đối chiếu với Policy",
        short: "Đối chiếu",
        goal: "Tham khảo cách tổ chức và kiểm thử của Policy, rồi đặt câu hỏi riêng cho Claim.",
        why: "Tính nhất quán cần dựa vào repo thật, không vào một kiến trúc BE tưởng tượng.",
        expected:
          "Bảng đối chiếu trách nhiệm, file/symbol và điều cần khác đi.",
        check:
          "Bài Policy đã có dẫn chứng source; cách áp dụng vào Claim chờ yêu cầu riêng.",
        practice:
          "Từ bài Danh sách → Chi tiết, liệt kê bộ lọc, quyền, nguồn dữ liệu và cách kiểm chứng cần xác nhận cho Claim.",
        evidence: "Source Policy đã được đọc; chưa xác định API, dữ liệu, quy tắc hoặc trạng thái Claim.",
        file: "claim-plan",
        range: [4, 5],
        explanation:
          "Bước này chưa chọn framework, layer, endpoint hoặc tên class.",
      },
      {
        id: "plan",
        title: "Lập kế hoạch thay đổi",
        short: "Kế hoạch",
        goal: "Chia thay đổi thành bước nhỏ, có kết quả quan sát được.",
        why: "Một bước có tiêu chí rõ sẽ dễ đọc diff và tự thực hiện lại.",
        expected:
          "Mỗi bước có file/symbol, lý do, kiểm tra và đường quay lại ngữ cảnh.",
        check: "Kế hoạch thật chỉ lập sau khi xác nhận yêu cầu và source.",
        practice:
          "Viết một bước theo mẫu mục tiêu → file → thay đổi → kiểm tra → bằng chứng.",
        evidence:
          "Kế hoạch hiện tại là khung minh họa, chưa thể dùng để sửa repo Java.",
        file: "claim-plan",
        explanation:
          "Danh sách được mở rộng từ “chờ khảo sát” thành khung làm việc có điều kiện.",
      },
      {
        id: "implement",
        title: "Đọc một thay đổi mẫu",
        short: "Triển khai mẫu",
        goal: "Dùng Before/After/Diff để hiểu thay đổi nhỏ trong mã giả.",
        why: "Học cách kiểm tra diff trước khi áp dụng cách đọc vào file Java thật.",
        expected:
          "Thấy thuộc tính needsBusinessReview được thêm vào bản nháp học tập.",
        check:
          "Mở Source → Diff → so với Before và After; nội dung thực hành giữ nguyên.",
        practice:
          "Tự viết lại ví dụ vào ghi chú, rồi giải thích từng dòng được thêm.",
        evidence: "Chỉ có mã giả minh họa; không có file Java nào được sửa.",
        file: "claim-draft",
        explanation:
          "needsBusinessReview chỉ là dấu nhắc trong bản nháp học tập, không phải trạng thái yêu cầu bồi thường.",
      },
      {
        id: "verify",
        title: "Kiểm chứng & tự làm lại",
        short: "Kiểm chứng",
        goal: "Tách bằng chứng kiểm tra khỏi việc đã đọc hoặc đã đánh dấu học.",
        why: "Hoàn thành bài minh họa không chứng minh nghiệp vụ BE hoạt động.",
        expected:
          "Có tiêu chí, cách chạy, kết quả và bằng chứng gắn với cùng một bước.",
        check:
          "Sau khi có source: ghi lệnh thật, input, expected/actual và log hoặc response.",
        practice:
          "Dùng checklist kiểm chứng để mô tả bạn sẽ chứng minh thay đổi thế nào.",
        evidence: "Chưa có kiểm thử nghiệp vụ hoặc bằng chứng chạy Java.",
        file: "claim-plan",
        range: [6, 7],
        explanation:
          "Tiến độ dưới đây do bạn tự đánh dấu, lưu riêng trên trình duyệt.",
      },
    ],
  },
];

export const totalSteps = journeys.reduce(
  (n, journey) => n + journey.steps.length,
  0,
);
export const findJourney = (id: string | undefined) =>
  journeys.find((journey) => journey.id === id);
