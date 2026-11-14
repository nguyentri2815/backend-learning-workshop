import { expect, test } from "@playwright/test";
import { actionSteps, guideCheckIds, guideCommand, legacyActionMap } from "../../src/content/setup/action-guide";
import { parseActionSearch } from "../../src/setup/action-navigation";
import { SETUP_PROGRESS_KEY } from "../../src/setup/progress";

test("seven steps contain actionable instructions and no guessed startup command", () => {
  expect(actionSteps.map(s => s.id)).toEqual(["source", "tools", "config", "dependencies", "build", "run", "ready"]);
  expect(guideCheckIds.size).toBe(23);
  for (const step of actionSteps) for (const check of step.checks) {
    expect([check.action,check.where,check.effect,check.done,check.read].every(Boolean)).toBe(true);
    expect(check.how.length).toBeGreaterThan(1);
    expect(check.failure.length).toBeGreaterThan(0);
    expect(guideCommand(check,"command") ?? "").not.toMatch(/bootRun|docker\s+(run|start)|compose.*\bup\b|Invoke-RestMethod.*Post|git clone/i);
    if (check.missing) expect(Object.values(check.missing).every(Boolean)).toBe(true);
  }
  expect(parseActionSearch("?step=tools","source",["tools-java"]).checkId).toBe("tools-jdk");
});

test("default view prioritizes full width instructions with readable type and collapsed graph", async ({page}) => {
  await page.goto("/journey/environment?experience=guide");
  await expect(page.locator(".guide-step-nav li")).toHaveCount(7);
  await expect(page.locator(".guide-map-toggle")).toHaveAttribute("aria-expanded","false");
  await expect(page.getByTestId("setup-graph")).toHaveCount(0);
  await expect(page.locator(".guide-check-select[aria-expanded=true]")).toContainText("Mở PowerShell");
  const body=page.locator(".guide-action-body");
  expect(await body.getByRole("heading").allTextContents()).toEqual(["Bạn cần làm gì?","Làm ở đâu?","Làm như thế nào?","Kiểm tra kết quả","Nếu kết quả khác"]);
  await expect(page.locator(".guide-command")).toContainText("Lệnh hướng dẫn, chưa chạy tại đây");
  const sizes=await body.evaluate(element=>({font:getComputedStyle(element.querySelector("p")!).fontSize,line:getComputedStyle(element.querySelector("p")!).lineHeight,code:getComputedStyle(element.querySelector("pre")!).fontSize,width:element.getBoundingClientRect().width,container:document.querySelector(".action-guide")!.getBoundingClientRect().width}));
  expect(parseFloat(sizes.font)).toBeGreaterThanOrEqual(14); expect(parseFloat(sizes.font)).toBeLessThanOrEqual(15);
  expect(parseFloat(sizes.line)/parseFloat(sizes.font)).toBeGreaterThanOrEqual(1.5); expect(sizes.code).toBe("14px");
  expect(sizes.width/sizes.container).toBeGreaterThan(.85);
  await page.screenshot({path:".verification/ux-01-overview.png"});
  await page.locator(".guide-action.is-active").screenshot({path:".verification/ux-02-complete-action.png"});
});

test("whole action row expands and collapses; checkbox stays independent without scroll or navigation", async ({page}) => {
  await page.goto("/journey/environment?step=source&check=source-layout");
  const row=page.locator("#guide-action-source-children");
  await row.scrollIntoViewIfNeeded();
  const box=(await row.boundingBox())!;
  await page.mouse.click(box.x+box.width-12,box.y+box.height/2);
  await expect(row).toHaveAttribute("aria-expanded","true");
  await expect(page.locator("#guide-action-source-layout")).toHaveAttribute("aria-expanded","false");
  const checkbox=page.getByRole("checkbox",{name:/Tôi đã kiểm tra xong/});
  await checkbox.scrollIntoViewIfNeeded();
  const before=await page.evaluate(()=>({url:location.href,y:scrollY}));
  await checkbox.check();
  await expect(checkbox).toBeChecked();
  expect(await page.evaluate(()=>({url:location.href,y:scrollY}))).toEqual(before);
  await expect(row).toHaveAttribute("aria-expanded","true");
  await page.getByRole("button",{name:"Thao tác tiếp theo",exact:true}).click();
  await expect(page.locator("#guide-action-source-clone")).toHaveAttribute("aria-expanded","true");
  await expect(page.getByRole("checkbox")).not.toBeChecked();
  await page.locator("#guide-action-source-clone").click();
  await expect(page.locator(".guide-action-body")).toHaveCount(0);
  await expect(page).toHaveURL(/collapsed=1/);
  await page.reload();
  await expect(page.locator(".guide-action-body")).toHaveCount(0);
  await page.locator("#guide-action-source-clone").focus(); await page.keyboard.press("Enter");
  await expect(page.locator(".guide-action-body")).toHaveCount(1);
});

test("progress persists, opens first unfinished action, tracks needs-info, and reset is scoped", async ({page}) => {
  await page.goto("/");
  await page.evaluate(()=>{
    localStorage.setItem("backend-learning-workshop.learning.v1",JSON.stringify({completed:["policy:input"],notes:{"policy:input":"keep"}}));
    localStorage.setItem("backend-learning-workshop.setup-learning.v1",JSON.stringify({contentVersion:1,completed:["history:S04"],notes:{}}));
    localStorage.setItem("quotation-product.demo.v1","sentinel");
  });
  await page.goto("/journey/environment?step=tools");
  for (const check of actionSteps[1].checks) {
    if (await page.locator(`#guide-action-${check.id}`).getAttribute("aria-expanded") !== "true") await page.locator(`#guide-action-${check.id}`).click();
    await expect(page.locator(`#guide-action-${check.id}`)).toHaveAttribute("aria-expanded","true");
    const checkbox=page.locator(`#guide-body-${check.id}`).getByRole("checkbox");
    await checkbox.check(); await expect(checkbox).toBeChecked();
  }
  await expect(page.locator(".guide-total")).toContainText("1 / 7");
  await page.reload();
  await expect(page.locator(".guide-state")).toHaveText("Đã tự kiểm tra");
  await page.getByRole("checkbox").uncheck();
  await page.goto("/journey/environment?step=tools");
  await expect(page.locator("#guide-action-tools-docker")).toHaveAttribute("aria-expanded","true");
  await page.locator(".guide-step-nav").getByRole("button",{name:/Bước 3:/}).click();
  await page.getByRole("button",{name:"Ghi nhận cần bổ sung thông tin",exact:true}).click();
  await expect(page.locator(".guide-state")).toHaveText("Cần bổ sung thông tin");
  await page.reload(); await expect(page.locator(".guide-state")).toHaveText("Cần bổ sung thông tin");
  await page.getByRole("button",{name:"Bỏ đánh dấu cần bổ sung",exact:true}).click();
  await expect(page.locator(".guide-state")).toHaveText("Đang làm");
  await page.locator(".guide-toolbar").getByRole("button",{name:"Đặt lại tiến độ",exact:true}).click();
  await page.getByRole("dialog",{name:"Đặt lại tiến độ chạy dự án?"}).getByRole("button",{name:"Đặt lại",exact:true}).click();
  await expect(page.locator(".guide-total")).toContainText("0 / 7");
  const data=await page.evaluate(key=>({now:JSON.parse(localStorage.getItem(key)!),old:JSON.parse(localStorage.getItem("backend-learning-workshop.setup-learning.v1")!),demo:JSON.parse(localStorage.getItem("backend-learning-workshop.learning.v1")!),other:localStorage.getItem("quotation-product.demo.v1")}),SETUP_PROGRESS_KEY);
  expect(data.now.checked).toEqual([]); expect(data.now.moduleId).toBeNull(); expect(data.now.needsInfo).toEqual([]);
  expect(data.old.completed).toEqual(["history:S04"]); expect(data.demo.completed).toEqual(["policy:input"]); expect(data.other).toBe("sentinel");
});

test("copy uses chosen module without execution and changing module clears scoped progress", async ({page}) => {
  const external:string[]=[];
  page.on("request",r=>{if(!r.url().startsWith(`${new URL(process.env.PREVIEW_URL||"http://localhost:3182").origin}/`)) external.push(r.url());});
  await page.addInitScript(()=>Object.defineProperty(navigator,"clipboard",{value:{writeText:async(text:string)=>{sessionStorage.setItem("test.clipboard",text);}}}));
  await page.goto("/journey/environment?step=build");
  await expect(page.locator(".guide-command")).toHaveCount(0);
  await page.getByLabel("Module của task",{exact:true}).selectOption("command");
  await page.getByRole("button",{name:"Sao chép lệnh",exact:true}).click();
  expect(await page.evaluate(()=>sessionStorage.getItem("test.clipboard"))).toBe(".\\gradlew.bat :workspaces:agent-service:1-agent-command-service:assemble");
  await page.getByRole("checkbox").check();
  await page.getByLabel("Module của task",{exact:true}).selectOption("query");
  await expect(page.getByRole("checkbox")).not.toBeChecked();
  await expect(page.locator(".guide-command")).toContainText(":3-agent-query-service:assemble");
  await page.locator(".guide-step-nav").getByRole("button",{name:/Bước 6:/}).click();
  await expect(page.locator(".guide-command")).toHaveCount(0);
  await expect(page.locator(".guide-missing")).toContainText("Thiếu:");
  await expect(page.locator(".guide-missing")).toContainText("Ảnh hưởng:");
  await expect(page.locator(".guide-missing")).toContainText("Tìm / xác minh:");
  expect(external).toEqual([]);
});

test("history/source dialog, deep link, reload and Back/Forward preserve action context", async ({page}) => {
  const errors:string[]=[]; page.on("pageerror",e=>errors.push(e.message));
  await page.goto("/journey/environment?step=tools&check=tools-java");
  await expect(page).toHaveURL(/experience=guide/);
  const base=page.url();
  await page.getByRole("button",{name:"Xem cách đã xử lý trong repo này",exact:true}).click();
  await expect(page.getByRole("dialog",{name:"Cách đã xử lý trong repo này"})).toBeVisible();
  await page.locator(".guide-history-files").getByRole("button",{name:"build.gradle",exact:true}).click();
  await expect(page.getByTestId("highlighted-code")).toContainText("JavaLanguageVersion.of(21)");
  const source=page.url(); await page.reload();
  await expect(page.getByTestId("highlighted-code")).toContainText("JavaLanguageVersion.of(21)");
  await page.getByRole("button",{name:"Quay lại ngữ cảnh",exact:true}).click();
  await expect(page.getByRole("dialog",{name:"Cách đã xử lý trong repo này"})).toBeVisible();
  await page.goBack(); await expect(page).toHaveURL(source); await page.goForward();
  await page.getByRole("button",{name:"Về checklist",exact:true}).click(); await expect(page).toHaveURL(base);
  await expect(page.locator("#guide-action-tools-java")).toHaveAttribute("aria-expanded","true");
  await page.goBack(); await expect(page.getByRole("dialog")).toBeVisible();
  await page.keyboard.press("Escape"); await expect(page.getByRole("dialog")).not.toBeVisible();
  expect(errors).toEqual([]);
});

test("action and step navigation honor Back/Forward without automatically marking completion", async ({page}) => {
  await page.goto("/journey/environment?step=build&check=build-target");
  await page.getByRole("button",{name:"Thao tác tiếp theo",exact:true}).click();
  await expect(page.locator("#guide-action-build-artifact")).toBeFocused();
  const artifact=page.url();
  await page.getByRole("button",{name:"Bước tiếp",exact:true}).click(); await expect(page).toHaveURL(/step=run/);
  await page.goBack(); await expect(page).toHaveURL(artifact);
  await expect(page.locator("#guide-action-build-artifact")).toHaveAttribute("aria-expanded","true");
  await page.goForward(); await expect(page.locator(".guide-detail-heading")).toContainText("Chạy và kiểm tra ứng dụng");
  await page.getByRole("button",{name:"Tiếp tục bước đang làm",exact:true}).click();
  await page.getByRole("link",{name:'Khám phá Policy',exact:true}).click(); await page.getByRole("link",{name:'Hiểu và chạy dự án',exact:true}).click();
  await expect(page.locator(".guide-detail-heading")).toContainText("Chạy và kiểm tra ứng dụng");
  await expect(page.locator(".guide-total")).toContainText("0 / 7");
});

test("legacy links and invalid storage/parameters fall back to useful instructions", async ({page}) => {
  for (const [old,id] of Object.entries(legacyActionMap).filter(([old])=>["S04","S09","S14","R-D4"].includes(old))) {
    await page.goto(`/journey/environment?step=${old}`); await expect(page).toHaveURL(new RegExp(`step=${id}`));
    await expect(page.locator(".guide-step-nav li")).toHaveCount(7);
  }
  await page.evaluate(key=>localStorage.setItem(key,"{broken"),SETUP_PROGRESS_KEY);
  await page.goto("/journey/environment?step=invalid&check=wrong&panel=source&file=missing&line=-2&return=https://example.com");
  await expect(page.locator(".guide-detail-heading")).toContainText("Kiểm tra source workspace");
  await expect(page).not.toHaveURL(/file=missing|line=|return=|check=wrong/);
  await page.getByRole("button",{name:"Về checklist",exact:true}).click();
  await expect(page.locator(".guide-action-body")).toHaveCount(1);
});

test("mobile retains readable instructions, independent checks and all seven accessible steps", async ({page}) => {
  await page.setViewportSize({width:390,height:844});
  await page.goto("/journey/environment?experience=guide");
  await expect(page.locator(".guide-step-nav li")).toHaveCount(7);
  await page.locator(".guide-step-nav").getByRole("button",{name:/Bước 2:/}).click();
  await expect(page.locator(".guide-detail-heading")).toBeInViewport();
  await page.getByRole("checkbox").check();
  await expect(page.locator("#guide-action-tools-java")).toHaveAttribute("aria-expanded","true");
  await page.locator("#guide-action-tools-ide").click();
  await expect(page.locator(".guide-how")).toContainText("Project bytecode version = 21");
  await page.getByText("Gặp repo khác thì tìm ở đâu?",{exact:true}).click();
  const font=await page.locator(".guide-action-body p").first().evaluate(e=>parseFloat(getComputedStyle(e).fontSize));
  expect(font).toBeGreaterThanOrEqual(14); expect(font).toBeLessThanOrEqual(15);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
  await page.screenshot({path:".verification/ux-mobile.png",fullPage:true});
});

test("Java and IDE content explains navigation, verification and conditional environment changes", async ({page}) => {
  await page.goto("/journey/environment?step=tools&check=tools-ide");
  await expect(page.locator(".guide-how")).toContainText("File → Project Structure");
  await expect(page.locator(".guide-how")).toContainText("Gradle JVM = JDK 21");
  await expect(page.locator(".guide-done")).toContainText("Reload kết thúc không lỗi");
  await page.screenshot({path:".verification/ux-03-java-ide.png",fullPage:true});
});
