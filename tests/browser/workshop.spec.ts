import { expect, test } from "@playwright/test";

test("overview explains all journeys and scope; local FE provenance is visible", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "đến dòng code Backend",
  );
  await expect(page.locator(".journey-card")).toHaveCount(3);
  await expect(
    page.getByText("Setup đã khảo sát · 04/11/2026", { exact: true }),
  ).toBeVisible();
  await page.screenshot({
    path: "test-results/overview-desktop.png",
    fullPage: true,
  });
  await page
    .getByRole("link", { name: "Nguồn & phạm vi", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Quotation Product", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Quotation Workshop", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("Không mang MSW", { exact: false }),
  ).toBeVisible();
  expect(errors).toEqual([]);
});

test("Policy validates, simulates failure/retry, creates and reads without API requests", async ({
  page,
}) => {
  const apiCalls: string[] = [];
  page.on("request", (request) => {
    if (["xhr", "fetch"].includes(request.resourceType()))
      apiCalls.push(request.url());
  });
  await page.goto("/journey/policy");
  const create = page
    .getByRole("button", { name: "Tạo Policy mẫu", exact: true })
    .last();
  await create.click();
  await expect(
    page.getByText("Nhập tên bên mua minh họa.", { exact: true }),
  ).toBeVisible();
  await expect(page.getByLabel("Tên bên mua minh họa")).toBeFocused();
  await page.getByRole("button", { name: "Điền mẫu", exact: true }).click();
  await page.getByLabel("Gây lỗi lần mô phỏng kế tiếp").check();
  await create.click();
  await expect(page.getByText("Đang xử lý mô phỏng…")).toBeVisible();
  await expect(page.getByRole("alert")).toContainText(
    "Lỗi phản hồi được mô phỏng",
  );
  await expect(page.getByLabel("Tên bên mua minh họa")).toHaveValue(
    "Khách hàng minh họa",
  );
  await page.getByRole("button", { name: "Thử lại", exact: true }).click();
  await expect(
    page.getByText("Đã tạo trong bộ nhớ minh họa", { exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Đọc Policy mẫu", exact: true })
    .first()
    .click();
  await page
    .getByRole("button", { name: "Đọc Policy mẫu", exact: true })
    .last()
    .click();
  await expect(
    page.getByText("Đã đọc từ bộ nhớ minh họa", { exact: true }),
  ).toBeVisible();
  await expect(page.locator(".request-grid")).toContainText("SIMULATED_READ");
  await expect(page.locator(".request-grid")).toContainText(
    "Khách hàng minh họa",
  );
  expect(apiCalls).toEqual([]);
  await page.reload();
  await page
    .getByRole("button", { name: "Đọc Policy mẫu", exact: true })
    .first()
    .click();
  await page
    .getByRole("button", { name: "Đọc Policy mẫu", exact: true })
    .last()
    .click();
  await expect(page.getByRole("alert")).toContainText("Chưa có Policy mẫu");
});

test("source deep links, diff, references and browser history preserve the learning step", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto(
    "/journey/claims?step=implement&view=source&file=claim-draft&side=diff",
  );
  await expect(
    page.getByRole("heading", { name: "Đọc một thay đổi mẫu", exact: true }),
  ).toBeVisible();
  await expect(page.getByTestId("highlighted-code")).toHaveAttribute(
    "data-ready",
    "true",
  );
  await expect(
    page.locator('[data-highlight="primary"], [data-explained="true"]').first(),
  ).toBeVisible();
  await expect(page.getByTestId("highlighted-code")).toContainText(
    "needsBusinessReview",
  );
  await page.getByRole("button", { name: "Before", exact: true }).click();
  await expect(page.getByTestId("highlighted-code")).not.toContainText(
    "needsBusinessReview",
  );
  await page.getByRole("button", { name: "After", exact: true }).click();
  await expect(page.getByTestId("highlighted-code")).toContainText(
    "needsBusinessReview",
  );
  const original = page.url();
  await page
    .getByRole("button", { name: "Thay đổi này thuộc kế hoạch nào?" })
    .click();
  await expect(page).toHaveURL(/file=claim-plan/);
  await expect(page.locator(".lesson-heading")).toContainText(
    "Đọc một thay đổi mẫu",
  );
  await expect(page.locator(".inspector-body")).toContainText(
    "Bước “Đọc một thay đổi mẫu” vẫn được giữ nguyên",
  );
  await page.reload();
  await page
    .getByRole("button", { name: "Quay lại tham chiếu", exact: true })
    .click();
  await expect(page).toHaveURL(original);
  await page.goBack();
  await expect(page).toHaveURL(/file=claim-plan/);
  await page.goForward();
  await expect(page).toHaveURL(original);
  await page.getByRole("button", { name: "Diff", exact: true }).click();
  await page.screenshot({
    path: "test-results/claims-source-desktop.png",
    fullPage: true,
  });
  expect(errors).toEqual([]);
});

test("selection survives switching view and journey, and flow selects matching source", async ({
  page,
}) => {
  await page.goto(
    "/journey/policy?step=validate&view=source&file=policy-input&side=before",
  );
  await page
    .getByRole("button", { name: "Thực hành & kiểm chứng", exact: true })
    .click();
  await page
    .getByLabel("Ghi chú và cách giải thích của bạn")
    .fill("Tên chỉ có khoảng trắng cần được kiểm tra.");
  await page
    .getByRole("button", { name: "Source & inspector", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Before", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("link", { name: /Yêu cầu bồi thường.*03/ }).click();
  await page.getByRole("link", { name: /Khám phá Policy.*02/ }).click();
  await expect(page).toHaveURL(/step=validate/);
  await expect(page).toHaveURL(/side=before/);
  await page
    .locator(".flow-card")
    .getByRole("button", { name: "04 Đọc lại" })
    .click();
  await expect(page).toHaveURL(/step=read/);
  await expect(page).toHaveURL(/file=policy-store/);
  await expect(page.locator(".lesson-heading")).toContainText(
    "Đọc lại & mở source",
  );
  await expect(page.locator(".inspector-body")).toContainText(
    "createPolicy / readPolicy",
  );
  await page
    .getByRole("button", { name: "Thực hành & kiểm chứng", exact: true })
    .click();
  await page
    .getByRole("button", { name: /02 Theo flow kiểm tra đầu vào/ })
    .click();
  await expect(
    page.getByLabel("Ghi chú và cách giải thích của bạn"),
  ).toHaveValue("Tên chỉ có khoảng trắng cần được kiểm tra.");
});

test("progress and notes persist; reset only clears the new learning namespace", async ({
  page,
}) => {
  await page.goto("/journey/claims?step=requirements&view=practice");
  await page.evaluate(() => {
    localStorage.setItem("quotation-product.demo.v1", "sentinel-product");
    localStorage.setItem(
      "quotation-workshop.behaviors.v2",
      "sentinel-workshop",
    );
  });
  await page
    .getByLabel("Ghi chú và cách giải thích của bạn")
    .fill("Cần đối chiếu Java version với repo.");
  await page
    .getByRole("button", { name: "Đánh dấu đã học bước mẫu", exact: true })
    .click();
  await page.reload();
  await expect(
    page.getByLabel("Ghi chú và cách giải thích của bạn"),
  ).toHaveValue("Cần đối chiếu Java version với repo.");
  await expect(
    page.getByRole("button", { name: "Đã học bước mẫu", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Đặt lại tiến độ", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.getByRole("button", { name: "Đặt lại", exact: true }).click();
  await expect(page).toHaveURL("/");
  const values = await page.evaluate(() => ({
    product: localStorage.getItem("quotation-product.demo.v1"),
    workshop: localStorage.getItem("quotation-workshop.behaviors.v2"),
    learning: JSON.parse(
      localStorage.getItem("backend-learning-workshop.learning.v1")!,
    ),
  }));
  expect(values).toEqual({
    product: "sentinel-product",
    workshop: "sentinel-workshop",
    learning: { completed: [], notes: {} },
  });
});

test("resizing with pointer and keyboard keeps source context and remembers layout", async ({
  page,
}) => {
  await page.goto("/journey/claims?step=implement&view=source&side=diff");
  const separator = page.getByRole("separator", {
    name: "Điều chỉnh kích thước source và inspector",
  });
  const box = (await separator.boundingBox())!;
  const initial = (await page.locator("#code").boundingBox())!.width;
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(box.x - 50, box.y + box.height / 2, { steps: 6 });
  await page.mouse.up();
  await expect
    .poll(async () => (await page.locator("#code").boundingBox())!.width)
    .toBeLessThan(initial - 20);
  await separator.focus();
  await page.keyboard.press("ArrowRight");
  const width = (await page.locator("#code").boundingBox())!.width;
  await expect(page).toHaveURL(/step=implement&view=source&side=diff/);
  await page.reload();
  await expect
    .poll(async () =>
      Math.abs((await page.locator("#code").boundingBox())!.width - width),
    )
    .toBeLessThan(3);
  await expect(page.getByTestId("highlighted-code")).toContainText(
    "needsBusinessReview",
  );
});

test("mobile navigation and unchanged Claim source viewer fit the viewport", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth),
  ).toBeLessThanOrEqual(390);
  await page.screenshot({
    path: "test-results/overview-mobile.png",
    fullPage: true,
  });
  await page
    .getByRole("button", { name: "Mở điều hướng", exact: true })
    .click();
  await page.getByRole("link", { name: /Yêu cầu bồi thường.*03/ }).click();
  await page
    .getByRole("button", { name: "Source & inspector", exact: true })
    .click();
  await page.getByRole("button", { name: "Before", exact: true }).click();
  await expect(page.getByTestId("highlighted-code")).toContainText("Chưa có yêu cầu nghiệp vụ thật");
  await page.getByRole("button", { name: "After", exact: true }).click();
  await expect(page.getByTestId("highlighted-code")).toContainText(
    "Câu hỏi cần xác nhận",
  );
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth),
  ).toBeLessThanOrEqual(390);
  await page.screenshot({
    path: "test-results/environment-mobile.png",
    fullPage: true,
  });
});

test("bad deep links and malformed storage have usable fallbacks", async ({
  page,
}) => {
  await page.goto("/");
  await page.evaluate(() => {
    localStorage.setItem("backend-learning-workshop.learning.v1", "{bad-json");
    localStorage.setItem(
      "backend-learning-workshop.panels.v1",
      '{"code":-4,"inspector":104}',
    );
  });
  await page.goto(
    "/journey/policy?step=missing&view=source&file=missing&side=before",
  );
  await expect(
    page.getByText("Liên kết có bước hoặc file chưa có dữ liệu.", {
      exact: false,
    }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Nhìn kết quả từ UI", exact: true }),
  ).toBeVisible();
  await expect(page.getByTestId("highlighted-code")).toContainText(
    "validateInput",
  );
  await page.goto("/unknown");
  await expect(
    page.getByRole("heading", { name: "Không tìm thấy khu vực này" }),
  ).toBeVisible();
});
