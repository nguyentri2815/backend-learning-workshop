import {test,expect} from "@playwright/test";
import type {Page} from "@playwright/test";
import {practice,runConfigurationWalk} from "./runtime-helpers";
import {commandMain} from "../../src/setup/run-configuration-model";
import {executionSource} from "../../src/setup/execution-model";
const snapshot=(page:Page)=>JSON.parse(new URL(page.url()).searchParams.get("psim")??"{}");
const button=(page:Page,name:string)=>practice(page).getByRole("button",{name,exact:true});
const ready={jdk:21,sdk:21,daemon:true,containers:{"postgres-write":"running"},readyEvidence:["postgres-write"]};
const configured={...ready,mainSelected:true,runSetup:{step:"saved",draftProfile:"dev",applied:true,saved:true}};
async function open(page:Page,task="startup",sim:object=configured,extra:Record<string,string>={}){await page.goto(`/journey/environment?${new URLSearchParams({experience:"project",task,pprofile:"dev",psim:JSON.stringify(sim),...extra})}`);await expect(practice(page).locator(".command-lesson")).toBeVisible();}
async function run(page:Page){await button(page,"Run Command").click();await expect(practice(page).locator(".command-process-status")).toContainText("Command đang chạy trong bài học");}
async function inspect(page:Page){for(const id of ["profile","port","started"])await practice(page).locator(`[data-command-log="${id}"]`).click();}

test("I1 to merged Run/results to J2 uses one session, preserves Stop and never claims HTTP or business evidence",async({page})=>{
 await page.goto(`/journey/environment?${new URLSearchParams({experience:"project",task:"run-config",psim:JSON.stringify(ready)})}`);await runConfigurationWalk(page);await button(page,"Tiếp theo: Chạy và dừng").click();
 await expect(practice(page).locator(".command-run-toolbar")).toContainText("Command / dev");
 await expect(practice(page).locator(".command-state-details")).not.toHaveAttribute("open","");await expect(practice(page).locator(".execution-state")).not.toBeVisible();
 await button(page,"Run Command").click();await expect(practice(page).locator('[data-command-log="profile"]')).toBeVisible();await expect(practice(page).locator('[data-command-log="port"]')).toBeVisible();await expect(practice(page).locator('[data-command-log="started"]')).toBeVisible();
 const id=snapshot(page).commandSession.id;await expect(practice(page).locator(".command-process-status")).toContainText("đang chạy");
 expect(snapshot(page).execution.jar).toBe(false);await button(page,"Stop Command").click();await expect(practice(page).locator(".command-process-status")).toContainText("đã dừng");
 await button(page,"Đọc kết quả của lần Run này").click();expect(snapshot(page).commandSession.id).toBe(id);await expect(practice(page).locator(".command-process-status")).toContainText("đã dừng");
 await inspect(page);await expect(practice(page).locator(".command-evidence-note")).toContainText("Process hiện đã dừng");await expect(practice(page).locator(".command-api-gap")).toHaveCount(0);
 await practice(page).locator(".command-port-check summary").click();await expect(practice(page).locator(".command-port-check")).toContainText("không chứng minh port hiện còn mở");
 await button(page,"Enter kiểm tra port trong bài").click();await expect(practice(page).locator(".command-http-contract")).toContainText("GET http://localhost:9901/actuator/health");expect(snapshot(page).process).toBe("stopped");
 await button(page,"Tiếp theo: chuẩn bị bắt đầu task").click();await expect(practice(page).locator(".task-start-card")).toBeVisible();await button(page,"Đã thực hành").click();await expect(practice(page).locator(".task-start-card")).toContainText("Đã lưu tiến độ");
});

test("missing conditions block Run, success scenario is explicit and leaves configuration and dependencies unchanged",async({page})=>{
 await open(page,"startup",{});await button(page,"Run Command").click();await expect(practice(page).locator(".command-missing")).toContainText("Chưa lưu cấu hình Command");await expect(button(page,"Thiết lập Command · I1")).toBeVisible();
 expect(snapshot(page).process).toBe("error");expect(snapshot(page).containers??{}).toEqual({});expect(snapshot(page).daemon??false).toBe(false);
 await button(page,"Xem kịch bản: giả định điều kiện đã đáp ứng").click();await expect(practice(page).locator(".command-process-status")).toContainText("đang chạy");await expect(practice(page).locator(".command-assumed")).toContainText("giả định điều kiện đã đáp ứng");
 expect(snapshot(page).daemon??false).toBe(false);expect(snapshot(page).containers??{}).toEqual({});expect(snapshot(page).runSetup?.saved??false).toBe(false);expect(snapshot(page).commandSession.assumed).toBe(true);
 await button(page,"Stop Command").click();await button(page,"Run Command").click();await expect(practice(page).locator(".command-process-status")).toContainText("Chưa khởi động");
});

test("run log timing, highlight and Stop preserve source, JAR and containers; no JAR is required",async({page})=>{
 await page.clock.install();await open(page,"startup",{...configured,build:"module-success"});await button(page,"Run Command").click();
 await expect(practice(page).locator("[data-command-log]")).toHaveCount(0);
 for(let i=0;i<25&&snapshot(page).commandSession.playback.playing;i++){const frame=snapshot(page).commandSession.playback.frame;await page.clock.runFor(220);await expect.poll(()=>snapshot(page).commandSession.playback.frame).toBeGreaterThan(frame);}
 await expect(practice(page).locator('[data-command-log="profile"]')).toBeVisible();await expect(practice(page).locator('[data-command-log="port"]')).toBeVisible();await expect(practice(page).locator('[data-command-log="started"]')).toHaveClass(/is-log-selected/);
 await button(page,"Stop Command").click();expect(snapshot(page).execution.jar).toBe(true);expect(snapshot(page).containers).toEqual(ready.containers);await expect(practice(page).locator("[data-command-log]")).toHaveCount(3);
 await button(page,"Run Command").click();await button(page,"Stop Command").click();await expect(practice(page).locator(".command-process-status")).toContainText("đã dừng");await page.clock.runFor(2500);expect(snapshot(page).process).toBe("stopped");expect(snapshot(page).commandSession.starting).toBe(false);
});

test("restarting each lesson resets only its own work and J2 supports the short rehearsal loop",async({page})=>{
 await open(page,"startup",{...configured,build:"module-success"});await run(page);await button(page,"Stop Command").click();await button(page,"Đọc kết quả của lần Run này").click();await inspect(page);
 const id=snapshot(page).commandSession.id;await button(page,"Làm lại phần này").click();expect(snapshot(page).commandReview?.checked??[]).toEqual([]);expect(snapshot(page).commandSession.id).toBe(id);expect(snapshot(page).process??"idle").toBe("idle");expect(snapshot(page).execution.jar).toBe(true);expect(snapshot(page).containers).toEqual(ready.containers);
 await button(page,"Tiếp theo: chuẩn bị bắt đầu task").click();await button(page,"Thực hành lại: cấu hình → Run → log → Stop").click();await expect(page).toHaveURL(/task=run-config/);await button(page,"Apply").click();await button(page,"OK").click();await button(page,"Tiếp theo: Chạy và dừng").click();await run(page);
 await practice(page).locator('[data-command-log="started"]').click();await button(page,"Stop Command").click();await button(page,"Tiếp theo: chuẩn bị bắt đầu task").click();await button(page,"Đã thực hành").click();
 expect(snapshot(page).taskPractice.practiced).toBe(true);await button(page,"Làm lại phần này").click();expect(snapshot(page).taskPractice?.practiced??false).toBe(false);expect(snapshot(page).process).toBe("stopped");expect(snapshot(page).execution.jar).toBe(true);
 const completed=await page.evaluate(()=>JSON.parse(localStorage.getItem('backend-learning-workshop.project-practice.v1')!).completed);expect(completed).toEqual(expect.arrayContaining(["run-config","startup"]));
 await practice(page).getByRole("button",{name:/^I2 /}).click();await button(page,"Làm lại phần này").click();await expect(practice(page).locator(".command-run-empty")).toBeVisible();expect(snapshot(page).execution.jar).toBe(true);expect(snapshot(page).containers).toEqual(ready.containers);expect(snapshot(page).runSetup.saved).toBe(true);
});

test("J2 asks for Stop before rehearsal when Command is still running and never stops it implicitly",async({page})=>{
 await open(page);await run(page);await button(page,"Đọc kết quả của lần Run này").click();await inspect(page);await button(page,"Tiếp theo: chuẩn bị bắt đầu task").click();
 await expect(button(page,"Thực hành lại: cấu hình → Run → log → Stop")).toBeDisabled();await expect(practice(page).locator(".task-start-card")).toContainText("Dừng lần chạy tại Run/Stop");expect(snapshot(page).process).toBe("running");
 await button(page,"Mở Run / Stop").click();await button(page,"Stop Command").click();await practice(page).getByRole("button",{name:/^J2 /}).click();await expect(button(page,"Thực hành lại: cấu hình → Run → log → Stop")).toBeEnabled();
 await button(page,"Xem giới hạn kiểm tra API").click();await expect(practice(page).locator(".command-results")).toBeFocused();expect(snapshot(page).commandReview.focus).toBe("api");
});

test("session, stopped log and J1 selections survive deep links, Back/Forward and saved progress",async({page,browser})=>{
 await open(page);await run(page);const running=page.url();await button(page,"Stop Command").click();const stopped=page.url();await page.goBack();await expect(page).toHaveURL(running);await expect(practice(page).locator(".command-process-status")).toContainText("đang chạy");await page.goForward();await expect(page).toHaveURL(stopped);
 await button(page,"Đọc kết quả của lần Run này").click();await practice(page).locator('[data-command-log="profile"]').click();const linked=page.url();await page.reload();expect(snapshot(page).commandReview.checked).toEqual(["profile"]);
 const other=await browser.newPage();await other.goto(linked);await expect(practice(other).locator(".command-process-status")).toContainText("đã dừng");expect(snapshot(other).commandReview.checked).toEqual(["profile"]);await other.close();
 await page.goto('/journey/environment?experience=project&task=verify');await expect(practice(page).locator(".command-process-status")).toContainText("đã dừng");
});

for(const width of [1512,390])test(`shared tree keeps every name on one line across I1 I2 J1 J2 at width ${width}`,async({page})=>{
  await page.setViewportSize({width,height:1000});
  for(const task of ["run-config","startup","verify","summary"]){
   await page.goto(`/journey/environment?${new URLSearchParams({experience:"project",task,pprofile:"dev",pfile:"main",psim:JSON.stringify({...configured,build:"module-success"})})}`);
   const main=button(page,`Mở file ${commandMain.path}`);await expect(main).toBeVisible();await expect(main).toHaveAttribute("title",commandMain.path);expect(await main.evaluate(element=>parseFloat(getComputedStyle(element).paddingLeft))).toBeLessThanOrEqual(53);
   for(const name of await practice(page).locator(".practice-tree-row>span").all()){expect(await name.evaluate(element=>getComputedStyle(element).whiteSpace)).toBe("nowrap");expect(await name.evaluate(element=>parseFloat(getComputedStyle(element).fontSize))).toBeGreaterThanOrEqual(14);}
   const build=button(page,`Thư mục ${executionSource.modulePath}/build`),libs=button(page,`Thư mục ${executionSource.modulePath}/build/libs`);if(await build.getAttribute("aria-expanded")!=="true")await build.click();if(await libs.getAttribute("aria-expanded")!=="true")await libs.click();const jar=button(page,`Mở file ${executionSource.artifact.path}`);await expect(jar).toHaveAttribute("title",executionSource.artifact.path);expect(await jar.locator("span").evaluate(element=>getComputedStyle(element).whiteSpace)).toBe("nowrap");
   expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
  }
});
