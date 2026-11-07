import {test,expect} from "@playwright/test";
import type {Page} from "@playwright/test";
import {readFile,stat} from "node:fs/promises";
import {createHash} from "node:crypto";
import source from "../../src/content/setup/execution-source.json" with {type:"json"};
import {advanceBuild,beginBuild,emptyExecution,executionCommands,hasJar,runCommandSimulation,stopCommandSimulation} from "../../src/setup/execution-model";
import {buildCommand,normalizeSimulation,resetSimulation} from "../../src/setup/practice-runtime-model";
import {practice,prepareBuild,executeBuild,createContainer,runConfigurationWalk,runCommandInLesson} from "./runtime-helpers";
const button=(page:Page,name:string)=>practice(page).getByRole("button",{name,exact:true});
const board=(page:Page)=>practice(page).locator(".execution-state");
const snapshot=(page:Page)=>JSON.parse(new URL(page.url()).searchParams.get("psim")??"{}");
async function task(page:Page,id="build-task",sim:object={jdk:21}){await page.goto(`/journey/environment?${new URLSearchParams({experience:"project",task:id,pprofile:"dev",psim:JSON.stringify(sim)})}`);await expect(practice(page)).toBeVisible();}
async function goRun(page:Page,mode:"intellij"|"powershell"="intellij"){
 await practice(page).getByRole("button",{name:/^I1 /}).click();await runConfigurationWalk(page,mode);
 await button(page,"Tiếp theo: Chạy và dừng").click();await expect(page).toHaveURL(/task=startup/);
}

test("build source, version, artifact metadata and redacted setup references match source; outputs remain independent", {tag:"@source"},async()=>{
 for(const file of source.files){const raw=await readFile(`${source.sourceRoot}/${file.path}`,"utf8");expect(createHash("sha256").update(raw).digest("hex")).toBe(file.sourceSha256);for(const row of file.rows)expect(row.text).toBe(raw.split(/\r?\n/)[row.line-1]);}
 const report=await readFile(source.report.path,"utf8");expect(createHash("sha256").update(report).digest("hex")).toBe(source.report.sourceSha256);
 for(const history of source.report.history)for(const row of history.rows)if(!row.text.includes("đã che"))expect(row.text).toBe(report.split(/\r?\n/)[row.line-1]);
 expect((await stat(`${source.sourceRoot}/${source.artifact.path}`)).size).toBe(source.artifact.bytes);expect(executionCommands.bootJar).toBe(buildCommand);
 expect(source.files.find(file=>file.id==="version")?.rows[0].text).toBe("version=0.0.1-SNAPSHOT");expect(JSON.stringify(source)).not.toMatch(/https?:\/\/|jdbc:|redis:\/\/|glpat-|sqp_/);
 let s=normalizeSimulation({jdk:21,moduleSelected:true,containers:{redis:"running"},execution:{flow:{terminal:true,checked:true,task:"compileJava"}}});
 s={...s,...beginBuild(s)};s={...s,...advanceBuild(s)};expect(s.execution.classes).toBe(true);expect(hasJar(s)).toBe(false);expect(s.process).toBe("idle");
 s.execution.flow={...s.execution.flow,task:"bootJar",stage:"idle"};s={...s,...beginBuild(s)};s={...s,...advanceBuild(s)};expect(hasJar(s)).toBe(false);s={...s,...advanceBuild(s)};
 expect(hasJar(s)).toBe(true);expect(s.containers).toEqual({redis:"running"});expect(s.process).toBe("idle");
 const failed={...s,...beginBuild({...s,jdk:17})};expect(failed.execution.jar).toBe(true);
 const ready=normalizeSimulation({jdk:21,mainSelected:true,daemon:true,containers:{"postgres-write":"running"},readyEvidence:["postgres-write"]});
 const running={...ready,...runCommandSimulation(ready,"dev")};expect(running.process).toBe("running");expect(running.execution.jar).toBe(false);expect(running.containers).toEqual(ready.containers);
 const stopped={...s,process:"running" as const,...stopCommandSimulation(s)};expect(stopped.execution.jar).toBe(true);expect(stopped.process).toBe("stopped");
 expect(normalizeSimulation({build:"module-success"}).execution.jarCause).toBe("legacy");expect(resetSimulation("daemon",s).execution.jar).toBe(true);
});

test("H starts with source only and walks the IntelliJ task tree with hints, back and wrong-selection feedback",async({page})=>{
 await task(page);const build=practice(page).locator(".build-practice");
 await button(page,"Thực hành từ đầu").click();
 await expect(button(page,"Trong IntelliJ")).toHaveAttribute("aria-pressed","true");
 await expect(button(page,`Mở file ${source.modulePath}/build.gradle`)).toBeVisible();
 await expect(button(page,`Thư mục ${source.modulePath}/src`)).toBeVisible();
 await expect(button(page,`Thư mục ${source.modulePath}/build`)).toHaveCount(0);
 await expect(build).not.toContainText("Build thành công");await expect(board(page)).toHaveCount(0);
 await expect(practice(page).locator(".execution-extras")).toHaveCount(0);
 await button(page,"Thử lại").click();expect(snapshot(page).execution?.flow?.step??"gradle-window").toBe("gradle-window");
 await button(page,"Chỉ vị trí").click();await expect(build.locator('[data-build-action="gradle-window"]')).toBeFocused();
 await build.locator('[data-build-action="gradle-window"]').click();
 await button(page,"2-agent-flow-service").click();await expect(build.getByRole("alert")).toContainText("Đây là module Flow");
 expect(snapshot(page).execution?.buildDir??false).toBe(false);
 await build.locator('[data-build-action="module"]').click();
 await build.locator('[data-build-action="tasks"]').click();await button(page,"Quay lại").click();
 await expect(build.locator('[data-build-action="tasks"]')).toHaveClass(/ide-located/);
 await build.locator('[data-build-action="tasks"]').click();await build.locator('[data-build-action="group"]').click();
 await button(page,"jar").click();await expect(build.getByRole("alert")).toContainText("JAR thường");
 await build.locator('[data-build-action="task"]').click();await expect(build.locator('[data-build-action="run"]')).toBeVisible();
 await build.locator('[data-build-action="run"]').click();await expect(build.locator(".build-result")).toContainText("Đang build");
 await expect(button(page,`Thư mục ${source.modulePath}/build`)).toHaveCount(0);
 await expect(build.locator(".build-result")).toContainText("Build thành công");
 await expect(build.locator(".build-artifact-name")).toHaveText(source.artifact.path.split("/").at(-1)!);
 expect(snapshot(page).execution.jar).toBe(true);expect(snapshot(page).rootTried??false).toBe(false);expect(snapshot(page).process??"idle").toBe("idle");
 const treeBuild=button(page,`Thư mục ${source.modulePath}/build`);await expect(treeBuild).toBeVisible();await expect(treeBuild).toHaveClass(/is-selected/);
 expect(await treeBuild.locator("span").evaluate(element=>element.getBoundingClientRect().height)).toBeLessThan(30);
 await treeBuild.click();await button(page,`Thư mục ${source.modulePath}/build/libs`).click();
 await expect(button(page,`Mở file ${source.artifact.path}`)).toBeVisible();
 await button(page,`Mở file ${source.artifact.path}`).click();await expect(practice(page).locator(".runtime-artifact")).toBeVisible();
 await button(page,"Tiếp theo: chạy Command").click();await expect(page).toHaveURL(/task=run-config/);
});

test("Terminal opens at workspace root, prefills and copies the command, validates it and builds on Enter",async({page,context})=>{
 await context.grantPermissions(["clipboard-read","clipboard-write"]);await task(page);await prepareBuild(page,"terminal");
 const build=practice(page).locator(".build-practice"),input=build.getByLabel("Lệnh hướng dẫn",{exact:true});
 await expect(build.locator(".build-terminal-cwd")).toContainText(source.workspaceDirectory);await expect(input).toHaveValue(executionCommands.bootJar);
 await button(page,"Sao chép lệnh").click();expect(await page.evaluate(()=>navigator.clipboard.readText())).toBe(executionCommands.bootJar);
 await input.fill(executionCommands.compileJava);await input.press("Enter");await expect(build.getByRole("alert")).toContainText("Lệnh chưa được chạy");
 expect(snapshot(page).execution?.buildDir??false).toBe(false);await expect(build.locator(".build-result")).toHaveCount(0);
 await button(page,"Điền lại lệnh").click();await input.press("Enter");await expect(build.locator(".build-result")).toContainText("Đang build");
 await expect(build.locator(".build-result")).toContainText("Build thành công");expect(snapshot(page).execution.jar).toBe(true);
 expect(snapshot(page).execution.flow.launcher).toBe("terminal");expect(snapshot(page).execution.jarCause).toBe("bootJar");
 await button(page,"Trong IntelliJ").click();await expect(build.locator(".build-result")).toContainText("Build thành công");
});

test("H can continue to Run without packaging or a knowledge check",async({page})=>{
 await task(page);await button(page,"Tiếp theo: chạy Command").click();await expect(page).toHaveURL(/task=run-config/);
 expect(snapshot(page).execution?.jar??false).toBe(false);await runConfigurationWalk(page);
 await button(page,"Tiếp theo: Chạy và dừng").click();await expect(page).toHaveURL(/task=startup/);
});

test("bootRun without bootJar creates a host process and compile output, keeps containers and never packages a JAR",async({page})=>{
 await task(page,"run-config",{jdk:21,daemon:true,containers:{"postgres-write":"running"},readyEvidence:["postgres-write"]});await goRun(page,"powershell");
 await expect(board(page).locator('[data-state="jar"]')).toContainText("Chưa tạo JAR");await runCommandInLesson(page);
 await expect(practice(page).locator(".command-run-window>header")).toContainText("bootRun");await expect(practice(page).locator(".command-run-window")).toContainText('profile is active: "dev"');
 expect(snapshot(page).execution.classes).toBe(true);expect(snapshot(page).execution.classCause).toBe("bootRun");expect(snapshot(page).execution.jar).toBe(false);expect(snapshot(page).containers).toEqual({"postgres-write":"running"});
 await button(page,"Stop Command").click();await expect(board(page).locator('[data-state="process"]')).toContainText("Đã dừng");expect(snapshot(page).execution.jar).toBe(false);
});

test("package then Compose then Run: Engine alone creates nothing, Docker creation has provenance, Stop retains artifact and container",async({page})=>{
 await task(page);await prepareBuild(page);await executeBuild(page);expect(snapshot(page).execution.jar).toBe(true);
 await practice(page).getByRole("button",{name:/^G2 /}).click();await button(page,"Mở Docker Desktop trong mô phỏng").click();expect(snapshot(page).containers??{}).toEqual({});
 await button(page,"Chờ Engine và kiểm tra lại docker version").click();await expect(practice(page).getByTestId("docker-empty")).toBeVisible();expect(snapshot(page).execution.jar).toBe(true);
 await createContainer(page);await button(page,"Tại sao container này có mặt?").click();await expect(practice(page).getByTestId("container-origin")).toContainText("Bạn tạo trong bài");expect(snapshot(page).containerOrigins["postgres-write"]).toBe("compose-user");
 expect(snapshot(page).process??"idle").toBe("idle");await button(page,"database system is ready to accept connections").click();
 await practice(page).getByRole("button",{name:/^H /}).click();expect(snapshot(page).containers).toEqual({"postgres-write":"running"});await expect(practice(page).locator(".build-result")).toContainText("Build thành công");
 await goRun(page);await runCommandInLesson(page);await expect(board(page).locator('[data-state="process"]')).toContainText("Đang chạy");
 await expect(practice(page).locator(".command-context-note")).toContainText("không tự trở thành container Docker");expect(snapshot(page).containers).toEqual({"postgres-write":"running"});expect(snapshot(page).execution.jar).toBe(true);
 await button(page,"Stop Command").click();expect(snapshot(page).execution.jar).toBe(true);expect(snapshot(page).containers).toEqual({"postgres-write":"running"});
});

test("existing and legacy containers retain unknown creator; reading history never changes runtime or grants compatibility",async({page})=>{
 await task(page,"daemon",{dockerEntry:"existing",daemon:true,desktopOpen:true});await button(page,"Tại sao container này có mặt?").click();
 await expect(practice(page).getByTestId("container-origin")).toContainText("Chưa ghi thao tác tạo hoặc tác nhân");await expect(practice(page).getByTestId("container-origin")).not.toContainText("Bạn tạo trong bài:");
 await task(page,"daemon",{daemon:true,desktopOpen:true,containers:{redis:"running"}});await practice(page).getByRole("row",{name:"Chọn container redis",exact:true}).click();await button(page,"Tại sao container này có mặt?").click();
 await expect(practice(page).getByTestId("container-origin")).toContainText("snapshot/tiến độ cũ");await practice(page).locator(".execution-history>summary").click();await expect(practice(page).locator(".execution-history")).toContainText("Người mở Desktop/cài đặt chưa rõ");
 await expect(practice(page).locator(".execution-history")).toContainText("không còn raw command");expect(snapshot(page).readyEvidence??[]).toEqual([]);expect(snapshot(page).process??"idle").toBe("idle");expect(snapshot(page).containerOrigins??{}).toEqual({});
});

test("H restores intermediate steps, output and method with deep links, Back/Forward, reload and saved progress",async({page,browser})=>{
 await task(page);await prepareBuild(page);const selected=page.url();await page.reload();await expect(practice(page).locator('[data-build-action="run"]')).toBeVisible();
 await executeBuild(page);const built=page.url();await page.goBack();await expect(page).toHaveURL(selected);
 expect(snapshot(page).execution?.jar??false).toBe(false);await page.goForward();await expect(page).toHaveURL(built);
 await expect(practice(page).locator(".build-result")).toContainText("Build thành công");
 const linked=await browser.newPage();await linked.goto(built);await expect(practice(linked).locator(".build-result")).toContainText("Build thành công");await linked.close();
 await button(page,"Tiếp theo: chạy Command").click();await expect(page).toHaveURL(/task=run-config/);
 await practice(page).getByRole("button",{name:/^H /}).click();await expect(practice(page).locator(".build-result")).toContainText("Build thành công");
 await page.goto('/journey/environment?experience=project&task=build-task');await expect(practice(page).locator(".build-result")).toContainText("Build thành công");
 await prepareBuild(page,"terminal");const terminal=page.url();await page.reload();await expect(practice(page).getByLabel("Lệnh hướng dẫn",{exact:true})).toBeVisible();
 expect(new URL(terminal).searchParams.get("psim")).toContain('"launcher":"terminal"');
});

test("starting over resets only build outputs and progress, including output from a previous Run",async({page})=>{
 await page.goto('/');await page.evaluate(()=>localStorage.setItem('backend-learning-workshop.project-practice.v1',JSON.stringify({version:1,current:'build-task',contexts:{},seen:['ide:action','build-task:build'],completed:['ide','daemon','build-task']})));
 await task(page,"build-task",{jdk:21,daemon:true,containers:{redis:"running"},surveyGoal:"event",mainSelected:true,process:"running",execution:{buildDir:true,classes:true,classCause:"bootRun",dirCause:"bootRun",processVia:"bootRun"}});
 await button(page,"Làm lại bước build").click();
 expect(snapshot(page).execution?.buildDir??false).toBe(false);expect(snapshot(page).execution?.jar??false).toBe(false);
 expect(snapshot(page).containers).toEqual({redis:"running"});expect(snapshot(page).surveyGoal).toBe("event");expect(snapshot(page).jdk).toBe(21);expect(snapshot(page).process).toBe("running");expect(snapshot(page).mainSelected).toBe(true);
 await expect(button(page,`Thư mục ${source.modulePath}/build`)).toHaveCount(0);await expect(practice(page).locator(".build-result")).toHaveCount(0);
 const completed=await page.evaluate(()=>JSON.parse(localStorage.getItem('backend-learning-workshop.project-practice.v1')!).completed);
 expect(completed).toEqual(['ide','daemon']);await expect(button(page,"Trong IntelliJ")).toHaveAttribute("aria-pressed","true");
 await executeBuild(page);await button(page,"Làm lại bước build").click();await expect(button(page,`Thư mục ${source.modulePath}/build`)).toHaveCount(0);
});

test("build failures identify the right output and JVM; retry recovers legacy root-task state",async({page})=>{
 await task(page,"build-task",{jdk:17});await prepareBuild(page,"terminal");await button(page,"Enter").click();
 await expect(practice(page).locator(".build-result")).toContainText("Build lỗi");await expect(practice(page).locator(".build-result")).toContainText("F2");
 await button(page,"Thử lại").click();await expect(practice(page).getByLabel("Lệnh hướng dẫn",{exact:true})).toBeVisible();
 await task(page,"build-task",{gradleJvm:17});await prepareBuild(page);await practice(page).locator('[data-build-action="run"]').click();
 await expect(practice(page).locator(".build-result")).toContainText("F3");
 await task(page,"build-task",{gradleJvm:21,execution:{flow:{task:"root",stage:"failure",error:"root",cwd:"other",launcher:"gradle"}}});
 await expect(practice(page).locator(".build-result")).toContainText(":workspaces:bootJar");await executeBuild(page);
 expect(snapshot(page).execution.flow.task).toBe("bootJar");expect(snapshot(page).execution.flow.cwd).toBe("workspace");
});

test("mobile supports both build methods, tree outputs and Run without horizontal overflow",async({page})=>{
 await page.setViewportSize({width:390,height:844});
 for(const mode of ["gradle","terminal"] as const){
  await task(page,"build-task",{jdk:21,daemon:true,containers:{"postgres-write":"running"},readyEvidence:["postgres-write"]});
  await prepareBuild(page,mode);expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
  await executeBuild(page,mode);await button(page,"Mở build/libs trong cây").click();await expect(button(page,`Mở file ${source.artifact.path}`)).toBeVisible();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
 }
 await goRun(page);await runCommandInLesson(page);await expect(practice(page).locator(".command-run-window")).toBeVisible();
 expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);await button(page,"Stop Command").click();expect(snapshot(page).execution.jar).toBe(true);expect(snapshot(page).execution).not.toEqual(emptyExecution());
});
