import {test,expect} from "@playwright/test";
import type {Page} from "@playwright/test";
import {practice,prepareRunConfiguration} from "./runtime-helpers";
const button=(page:Page,name:string)=>practice(page).getByRole("button",{name,exact:true});
const snapshot=(page:Page)=>JSON.parse(new URL(page.url()).searchParams.get("psim")??"{}");
const ready={jdk:21,sdk:21,daemon:true,containers:{"postgres-write":"running"},readyEvidence:["postgres-write"]};
const configured={...ready,mainSelected:true,runSetup:{step:"saved",draftProfile:"dev",saved:true,applied:true}};
async function open(page:Page,task="run-config",sim:object=ready){await page.goto(`/journey/environment?${new URLSearchParams({experience:"project",task,pprofile:"dev",psim:JSON.stringify(sim)})}`);await expect(practice(page)).toBeVisible();}
async function running(page:Page){await expect(practice(page).locator(".command-process-status")).toContainText("Command đang chạy trong bài học");}
async function local(page:Page){await button(page,"Đọc kết quả của lần Run này").click();for(const id of ["profile","port","started"])await practice(page).locator(`[data-command-log="${id}"]`).click();await practice(page).locator(".command-port-check summary").click();await button(page,"Enter kiểm tra port trong bài").click();}

test("IntelliJ gutter, actual config sources, startup, local checks, Stop and a new run share a session",async({page})=>{
 await open(page);await expect(button(page,"Bấm Run trong IntelliJ")).toHaveAttribute("aria-pressed","true");await button(page,"Mở main class Command").click();
 await button(page,"Tam giác Run cạnh main").click();await button(page,"Edit Configurations…").click();
 await practice(page).getByLabel("Active profiles trong bài",{exact:true}).selectOption("base");
 const compare=practice(page).getByRole("region",{name:"Đối chiếu cấu hình trước Run"});await expect(compare).toContainText("PostgreSQL remote");await expect(compare.locator(".run-effective-config")).toContainText("nếu không có profile/override khác");
 await practice(page).getByLabel("Active profiles trong bài",{exact:true}).selectOption("dev");await expect(compare.locator(".run-effective-config")).toContainText("${DOCKER_HOST_IP:localhost}");await expect(compare.locator(".run-effective-config")).toContainText("application-dev.yml ghi đè");
 await practice(page).getByLabel("Khóa cấu hình đang đối chiếu").selectOption("port");await expect(compare.locator(".run-effective-config")).toContainText("Hai file cùng đặt 9901");await expect(compare).toContainText("Environment");
 await button(page,"Apply").click();await button(page,"OK").click();expect(snapshot(page).process??"idle").toBe("idle");
 await button(page,"Tiếp theo: Chạy và dừng").click();await button(page,"Run cạnh main").click();await running(page);expect(snapshot(page).execution.jar).toBe(false);
 await expect(practice(page).locator('[data-command-log="profile"]')).toContainText('profile is active: "dev"');await expect(practice(page).locator('[data-command-log="port"]')).toContainText("9901");
 const id=snapshot(page).commandSession.id;await local(page);await expect(practice(page).locator(".command-port-result")).toContainText("Listen");
 const contract=practice(page).locator(".command-http-contract");await expect(contract).toContainText("GET http://localhost:9901/actuator/health");await expect(contract).toContainText("Suy luận từ source");
 await button(page,"Gửi request trong bài · giả định health UP").click();await expect(contract.locator(".command-http-result")).toContainText('"status":"UP"');
 await contract.getByText("Thử phản hồi khác",{exact:true}).click();for(const scenario of ["unauthorized","forbidden","missing"]){await contract.getByLabel("Tình huống HTTP").selectOption(scenario);await expect(contract.locator(".command-http-result")).toContainText(/không đồng nghĩa|chưa thể kết luận/);}
 await button(page,"Stop Command").click();await expect(button(page,"Stop Command")).toBeDisabled();await expect(practice(page).locator(".command-port-result")).toContainText("Không có process Command");await expect(contract.locator(".command-http-result")).toContainText("Kết quả HTTP cũ");await expect(practice(page).locator(".command-run-window>header")).toContainText("Lần chạy đã dừng");
 await button(page,"Run Command").click();await running(page);expect(snapshot(page).commandSession.id).toBe(id+1);expect(snapshot(page).commandReview?.httpSent??false).toBe(false);expect(snapshot(page).containers).toEqual(ready.containers);
});

test("Terminal path needs no IntelliJ exercise, uses root targeted bootRun and Enter with explicit dev",async({page})=>{
 await open(page);await button(page,"Chạy bằng Terminal").click();await button(page,"Terminal").click();await expect(practice(page).locator(".command-terminal-root")).toContainText("agent-system");
 await expect(practice(page).getByLabel("Lệnh Run trong Terminal")).toHaveValue('.\\gradlew.bat :workspaces:agent-service:1-agent-command-service:bootRun --args="--spring.profiles.active=dev"');
 await button(page,"Dùng lệnh này").click();await button(page,"Tiếp theo: Chạy và dừng").click();await practice(page).getByLabel("Lệnh Run trong Terminal").fill(".\\gradlew.bat bootRun");await practice(page).getByLabel("Lệnh Run trong Terminal").press("Enter");await expect(practice(page).getByRole("alert")).toContainText("Dùng lệnh module Command");expect(snapshot(page).commandSession?.id??0).toBe(0);
 await button(page,"Điền lại lệnh").click();await practice(page).getByLabel("Lệnh Run trong Terminal").press("Enter");await running(page);expect(snapshot(page).launchMode).toBe("powershell");expect(snapshot(page).launchProfile).toBe("dev");expect(snapshot(page).execution.processVia).toBe("bootRun");expect(snapshot(page).execution.jar).toBe(false);await local(page);await expect(practice(page).locator(".command-port-result")).toContainText("Listen");
});

test("port collision is a labelled failure with cause, repair and rerun; missing dependencies never turn on implicitly",async({page})=>{
 await open(page,"startup",configured);await practice(page).locator(".command-case-library>summary").click();await practice(page).getByText("Khi khởi tạo và kết nối",{exact:true}).click();await practice(page).locator('[data-command-case="port"]').click();await button(page,"Run cạnh main").click();await expect(practice(page).locator(".command-process-status")).toContainText("startup thất bại");await expect(practice(page).locator(".startup-console")).toContainText("Port 9901 was already in use");await expect(practice(page).locator('[data-command-log="started"]')).toHaveCount(0);
 const id=snapshot(page).commandSession.id;await button(page,"Tìm nguyên nhân").click();await button(page,"Thực hiện kiểm tra trong bài").click();await expect(practice(page).locator(".case-check-result")).toContainText("không phải lần Command hiện tại");await practice(page).getByLabel("Giá trị sửa trong case").selectOption("đã dừng trong bài");await button(page,"Dừng process thử nghiệm trong bài").click();await button(page,"Run lại sau kiểm tra").click();await running(page);expect(snapshot(page).commandSession.id).toBe(id+1);expect(snapshot(page).containers).toEqual(ready.containers);
 await open(page,"startup",{});await button(page,"Run Command").click();await expect(practice(page).locator(".command-missing")).toContainText("PostgreSQL write");await expect(button(page,"Tạo postgres-write · G2")).toBeVisible();await button(page,"Xem kịch bản: giả định điều kiện đã đáp ứng").click();await running(page);expect(snapshot(page).daemon??false).toBe(false);expect(snapshot(page).containers??{}).toEqual({});await expect(practice(page).locator(".command-assumed")).toContainText("không bật dịch vụ");
});

test("saving no explicit dev reports the exact configuration limitation and never invents a default active profile",async({page})=>{
 await open(page);await prepareRunConfiguration(page);await practice(page).getByLabel("Active profiles trong bài",{exact:true}).selectOption("base");await button(page,"Apply").click();await button(page,"OK").click();await button(page,"Tiếp theo: Chạy và dừng").click();await button(page,"Run Command").click();await expect(practice(page).locator(".command-missing")).toContainText("profile/override ngoài chưa xác định");await expect(practice(page).locator('[data-command-log="profile"]')).toHaveCount(0);expect(snapshot(page).launchProfile??"base").toBe("base");
});

test("local evidence and profile persist in deep links, history and mobile without resetting build",async({page,browser})=>{
 await open(page,"startup",{...configured,build:"module-success"});await button(page,"Run Command").click();await running(page);await local(page);await button(page,"Gửi request trong bài · giả định health UP").click();const checked=page.url();
 await button(page,"Stop Command").click();const stopped=page.url();await page.goBack();await expect(page).toHaveURL(checked);await expect(practice(page).locator(".command-port-result")).toContainText("Listen");await page.goForward();await expect(page).toHaveURL(stopped);await expect(practice(page).locator(".command-port-result")).toContainText("Không có process");
 const mobile=await browser.newPage({viewport:{width:390,height:844}});await mobile.goto(stopped);await expect(practice(mobile).locator(".command-process-status")).toContainText("đã dừng");await expect(practice(mobile).locator(".command-http-result")).toContainText("Kết quả HTTP cũ");expect(await mobile.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);await mobile.close();
 await button(page,"Làm lại phần này").click();expect(snapshot(page).execution.jar).toBe(true);expect(snapshot(page).runSetup.saved).toBe(true);expect(snapshot(page).process??"idle").toBe("idle");expect(snapshot(page).commandReview?.httpSent??false).toBe(false);
});
