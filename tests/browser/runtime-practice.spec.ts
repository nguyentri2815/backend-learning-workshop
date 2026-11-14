import { ideWalk, dockerWalk, conflictWalk,prepareBuild,executeBuild,prepareRunConfiguration,runConfigurationWalk,runCommandInLesson,readCommandLogInLesson } from "./runtime-helpers";
import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";
import { readFile, stat } from "node:fs/promises";
import { createHash } from "node:crypto";
import { commandPath, PRACTICE_KEY, runtimeSource } from "../../src/setup/project-practice-model";
import { emptySimulation, normalizeSimulation } from "../../src/setup/practice-runtime-model";
import { SETUP_PROGRESS_KEY } from "../../src/setup/progress";

const lab=(page:Page)=>page.getByRole("region",{name:"Thực hành trên project tái dựng",exact:true});
const button=(page:Page,name:string)=>lab(page).getByRole("button",{name,exact:true});
const file=(page:Page,path:string)=>button(page,`Mở file ${path}`);
const line=(page:Page,value:number)=>button(page,`Chọn dòng ${value}`);
const next=(page:Page)=>lab(page).getByRole("button",{name:/^(Tiếp tục|Tiếp theo: chạy Command|Tiếp theo: Chạy và dừng|Tiếp theo: kiểm tra Command|Tiếp theo: chuẩn bị bắt đầu task)$/}).click();
const resources=`${commandPath}/src/main/resources`;
async function task(page:Page,id:string,simulation:object={}) {
  const params=new URLSearchParams({experience:"project",task:id,psim:JSON.stringify(simulation)});
  await page.goto(`/journey/environment?${params}`);
  await expect(lab(page)).toBeVisible();
}
async function choose(page:Page,name:string,value:string) {
  const field=lab(page).getByLabel(name,{exact:true});
  await field.selectOption(value);await expect(field).toHaveValue(value);
  // The native select changes before the router commits the lesson snapshot.
  // Wait for saved state before sending another interaction to the same context.
  const key={"JDK cho terminal/Gradle trong bài":"jdk","Gradle task trong bài":"buildTarget","Nơi chạy trong tình huống":"runMode"}[name];
  if(name==="Active profiles trong bài")await expect.poll(()=>JSON.parse(new URL(page.url()).searchParams.get("psim")??"{}").runSetup?.draftProfile).toBe(value);
  else if(key)await expect.poll(()=>String(JSON.parse(new URL(page.url()).searchParams.get("psim")??"{}")[key]??({jdk:17,buildTarget:"root",runMode:"intellij"}[key as "jdk"|"buildTarget"|"runMode"]))).toBe(value);
}

test("F–J excerpts and dependency mappings match source; published data is sanitized", {tag:"@source"},async()=>{
  for(const file of runtimeSource.files) {
    const raw=await readFile(`${file.sourceRoot}/${file.path}`,"utf8");
    expect(createHash("sha256").update(raw).digest("hex")).toBe(file.sourceSha256);
    const lines=raw.split(/\r?\n/);
    for(const row of file.rows) if(!row.text.includes("đã che")) expect(row.text).toBe(lines[row.line-1]);
    expect(file.revision).toMatch(/^[a-f0-9]{40}$/);
  }
  const compose=runtimeSource.files.find(file=>file.id==="compose")!;
  for(const connection of runtimeSource.connections) {
    expect(compose.rows.find(row=>row.line===connection.composeLine)?.text.trim()).toBe(`${connection.service}:`);
    expect(compose.rows.find(row=>row.line===connection.portLine)?.text).toContain(`${connection.hostPort}:${connection.containerPort}`);
    for(const id of ["default","dev"]) expect(runtimeSource.files.find(file=>file.id===id)?.rows.some(row=>row.line===connection.line)).toBe(true);
  }
  const artifact=await stat(`D:/ALPACA/agent-system/${runtimeSource.artifact.path}`);
  expect(artifact.size).toBe(runtimeSource.artifact.bytes);
  expect(runtimeSource.endpoint.state).toBe("Cần xác nhận");
  expect(JSON.stringify(runtimeSource)).not.toMatch(/https?:\/\/|jdbc:postgresql:\/\/|redis:\/\/|git@|glpat-|oauth2:/);
  expect(normalizeSimulation({jdk:99,process:"live",notice:"injected",logSeen:["started","not-valid"]})).toEqual({...emptySimulation(),logSeen:["started"]});
});

test("continuous A–J: Java, dependencies, targeted artifact, run/stop and evidence summary stay simulated",async({page})=>{
  test.setTimeout(90_000);
  const errors:string[]=[];const external:string[]=[];
  page.on("pageerror",error=>errors.push(error.message));
  page.on("request",request=>{if(!request.url().startsWith(`${new URL(process.env.PREVIEW_URL||"http://localhost:3182").origin}/`))external.push(request.url());});
  await page.goto("/journey/environment?step=source&experience=project&task=root");
  for(const path of ["settings.gradle","build.gradle","gradlew.bat"]) await file(page,path).click();
  await next(page);await line(page,30).click();await button(page,"Đến thư mục trong cây").click();
  await button(page,"Tìm cách lấy source").click();await line(page,10).click();
  await button(page,"Xem trạng thái sau khi lấy source").click();
  await button(page,`Thư mục ${commandPath}`).click();await button(page,"Đi vào module Command").click();
  await button(page,"Chỉ vị trí").click();await file(page,`${resources}/application.yml`).click();
  await file(page,`${resources}/application-dev.yml`).click();await button(page,"So sánh và chọn profile").click();
  const dev=lab(page).getByRole("radio",{name:"Chọn dev trong bài thực hành",exact:true});await dev.click();await expect(dev).toBeChecked();
  await button(page,"Tiếp tục: Java và IDE").click();
  await file(page,"build.gradle").click();await line(page,21).click();await expect(button(page,"Tiếp tục")).toBeDisabled();
  await line(page,48).click();await next(page);
  await expect(lab(page).locator(".runtime-table")).toContainText("Java 17");
  await page.screenshot({path:".verification/runtime-f-before.png",fullPage:true});
  await choose(page,"JDK cho terminal/Gradle trong bài","21");
  await expect(lab(page).getByRole("status")).toContainText("terminal và Gradle chuyển sang JDK 21");
  await page.screenshot({path:".verification/runtime-f-java.png",fullPage:true});
  await next(page);await ideWalk(page);
  await page.screenshot({path:".verification/runtime-f-ide.png",fullPage:true});
  await next(page);
  await button(page,"Xem cấu hình PostgreSQL write").click();
  await lab(page).getByRole("article",{name:"Cấu hình Compose",exact:true}).getByRole("button",{name:"Chọn dòng 80",exact:true}).click();
  await expect(lab(page).getByRole("status")).toContainText("5432 → container 5432");
  await page.screenshot({path:".verification/runtime-g-connections.png",fullPage:true});
  await next(page);await dockerWalk(page);await next(page);await conflictWalk(page);
  await expect(lab(page)).toContainText("chưa xác nhận");
  await page.screenshot({path:".verification/runtime-g-conflict.png",fullPage:true});
  await next(page);await button(page,`Thư mục ${commandPath}`).click();
  await expect(file(page,runtimeSource.artifact.path)).toHaveCount(0);
  await prepareBuild(page);await executeBuild(page);await button(page,"Mở build/libs trong cây").click();
  await file(page,runtimeSource.artifact.path).click();await expect(lab(page).locator(".runtime-artifact")).toContainText("chưa có process");
  await page.screenshot({path:".verification/runtime-h-artifact.png",fullPage:true});
  await next(page);await prepareRunConfiguration(page);
  await choose(page,"Active profiles trong bài","base");
  await expect(button(page,"Tiếp theo: Chạy và dừng")).toBeDisabled();
  await choose(page,"Active profiles trong bài","dev");await button(page,"Apply").click();await button(page,"OK").click();await next(page);
  await runCommandInLesson(page);await readCommandLogInLesson(page);
  await expect(lab(page).locator(".command-process-status")).toContainText("đang chạy");
  await page.screenshot({path:".verification/runtime-i-running.png",fullPage:true});
  await button(page,"Stop Command").click();await expect(lab(page).locator(".command-process-status")).toContainText("đã dừng");
  await page.screenshot({path:".verification/runtime-i-stopped.png",fullPage:true});await button(page,"Đọc kết quả của lần Run này").click();await readCommandLogInLesson(page);
  await expect(lab(page).locator(".command-evidence-note")).toContainText("Process hiện đã dừng");
  await lab(page).locator(".command-port-check>summary").click();await button(page,"Enter kiểm tra port trong bài").click();
  await expect(lab(page).locator(".command-api-gap")).toContainText("GET http://localhost:9901/actuator/health");
  await page.screenshot({path:".verification/runtime-j-levels.png",fullPage:true});await next(page);await button(page,"Đã thực hành").click();
  await expect(lab(page).locator(".task-start-card")).toContainText("Đã lưu tiến độ");await expect(lab(page).locator(".task-start-card")).toContainText("từng dependency/API vẫn cần kiểm chứng");
  await page.screenshot({path:".verification/runtime-j-summary.png",fullPage:true});
  const data=await page.evaluate(([practice,real])=>({practice:JSON.parse(localStorage.getItem(practice)!),real:JSON.parse(localStorage.getItem(real)??"null")}),[PRACTICE_KEY,SETUP_PROGRESS_KEY]);
  expect(data.practice.completed).toHaveLength(16);expect(data.real?.checked??[]).toEqual([]);
  expect(errors).toEqual([]);expect(external).toEqual([]);
});

test("runtime URL, source position, shared choices and old progress survive navigation, retry and reset",async({page})=>{
  await page.goto("/");await page.evaluate(([practice,real])=>{
    localStorage.setItem(practice,JSON.stringify({version:1,current:"profile",contexts:{},seen:["root:settings"],completed:["root","profile"]}));
    localStorage.setItem(real,JSON.stringify({version:1,checked:["tools-java"],needsInfo:[],started:["tools"],selectedStep:"source",moduleId:null}));
  },[PRACTICE_KEY,SETUP_PROGRESS_KEY]);
  await task(page,"jdk");await choose(page,"JDK cho terminal/Gradle trong bài","21");
  const jdk=page.url();await page.reload();await expect(lab(page).getByLabel("JDK cho terminal/Gradle trong bài",{exact:true})).toHaveValue("21");
  await choose(page,"JDK cho terminal/Gradle trong bài","17");await page.goBack();await expect(page).toHaveURL(jdk);
  await expect(lab(page).getByLabel("JDK cho terminal/Gradle trong bài",{exact:true})).toHaveValue("21");
  await page.goForward();await expect(lab(page).getByLabel("JDK cho terminal/Gradle trong bài",{exact:true})).toHaveValue("17");
  await button(page,"Thử lại").click();await choose(page,"JDK cho terminal/Gradle trong bài","21");await next(page);
  await ideWalk(page);
  await button(page,"Làm lại phần này").click();await expect(lab(page).locator(".ide-mission")).toContainText("Mở menu File");
  await expect(button(page,"Tiếp tục")).toBeDisabled();
  await lab(page).locator(".runtime-view-tabs").getByRole("button",{name:/Source đang mở/}).click();
  await file(page,"build.gradle").click();await line(page,37).click();const source=page.url();
  await page.getByRole("link",{name:'Khám phá Policy',exact:true}).click();await page.getByRole("link",{name:'Hiểu và chạy dự án',exact:true}).click();
  await expect(page).toHaveURL(source);await expect(lab(page).locator('[data-line="37"]')).toHaveAttribute("data-focus-line","true");
  await button(page,"Mở hướng dẫn trên máy thật").click();await expect(page).toHaveURL(/experience=guide/);
  await expect(page.locator(".guide-check-select[aria-expanded=true]")).toBeVisible();
  await page.getByRole("button",{name:"Thực hành trên project",exact:true}).click();
  await expect(lab(page)).toBeVisible();
  const data=await page.evaluate(([practice,real])=>({practice:JSON.parse(localStorage.getItem(practice)!),real:JSON.parse(localStorage.getItem(real)!)}),[PRACTICE_KEY,SETUP_PROGRESS_KEY]);
  expect(data.practice.completed).toEqual(expect.arrayContaining(["root","profile"]));expect(data.real.checked).toEqual(["tools-java"]);
});

test("mobile supports IDE, dependency conflict, artifact, startup/error and verification without overflow",async({page})=>{
  await page.setViewportSize({width:390,height:844});
  const prepared={daemon:true,containers:{"postgres-write":"running"},readyEvidence:["postgres-write"],jdk:21,sdk:21,language:21,gradleJvm:21,synced:true,mainSelected:true,build:"module-success",rootTried:true,moduleSelected:true};
  await task(page,"ide",prepared);await button(page,"Chỉ vị trí").click();
  await expect(lab(page).locator("[data-ide-action=file]")).toHaveClass(/ide-located/);
  await ideWalk(page);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
  await task(page,"conflict",prepared);await conflictWalk(page);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
  await task(page,"build-task",prepared);await button(page,"Mở build/libs trong cây").click();await file(page,runtimeSource.artifact.path).click();await expect(lab(page).locator(".runtime-artifact")).toBeVisible();
  await task(page,"startup",prepared);await button(page,"Run Command").click();await expect(lab(page).locator(".command-missing")).toContainText("Chưa lưu cấu hình Command");
  await button(page,"Làm lại phần này").click();await expect(lab(page).locator(".command-run-empty")).toBeVisible();
  await task(page,"run-config",prepared);await runConfigurationWalk(page);await next(page);await runCommandInLesson(page);await readCommandLogInLesson(page);
  await page.screenshot({path:".verification/runtime-mobile.png",fullPage:true});expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
  await button(page,"Stop Command").click();await button(page,"Đọc kết quả của lần Run này").click();await readCommandLogInLesson(page);await next(page);await expect(lab(page).locator(".task-start-card")).toBeVisible();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
});

test("inconsistent runtime links normalize safely and never claim HTTP or business verification",async({page})=>{
 await page.goto('/journey/environment?experience=project&task=startup&step=source&psim=%7Bbad&pfile=artifact&pstate=before&pview=wrong');
 await expect(lab(page)).toBeVisible();await expect(page).toHaveURL(/step=run/);await expect(page).not.toHaveURL(/pfile=artifact|pstate=before|pview=wrong/);
 await button(page,"Run Command").click();await expect(lab(page).locator(".command-process-status")).toContainText("Chưa khởi động");
 await task(page,"verify");await expect(page).toHaveURL(/task=startup/);await expect(lab(page).locator(".command-api-gap")).toHaveCount(0);await expect(lab(page).locator(".command-results")).toContainText("Chưa có lần Run");
 expect(new URL(page.url()).searchParams.get("psim")).not.toContain('"process":"running"');await next(page);await expect(button(page,"Đã thực hành")).toBeDisabled();
});

test("IDE diagnosis, artifact reset and PowerShell launch keep their evidence and restore the current task",async({page})=>{
  await task(page,"ide",{jdk:21,language:21,synced:true});
  await lab(page).getByText("Nhánh: IDE đỏ nhưng Gradle build được",{exact:true}).click();
  await button(page,"Xem tình huống IDE lệch 17/21").click();
  await expect(lab(page).locator(".ide-mission")).toContainText("Mở menu File");
  await expect(lab(page)).toContainText("file .idea hiện tại đã là 21");
  await ideWalk(page);
  await page.locator(".guide-toolbar").getByRole("button",{name:"Tiếp tục bước đang làm",exact:true}).click();
  await expect(page).toHaveURL(/task=ide/);
  await page.locator(".guide-step-nav").getByRole("button",{name:/Bước 5:/}).click();
  await expect(page).toHaveURL(/experience=project/);await expect(page).toHaveURL(/task=build-task/);
  await page.locator(".guide-step-nav").getByRole("button",{name:/Bước 2:/}).click();
  await expect(page).toHaveURL(/task=ide/);await expect(lab(page).locator(".ide-practice .runtime-result")).toContainText("Language level 21");
  await task(page,"build-task",{jdk:21,moduleSelected:true,rootTried:true,buildTarget:"module"});
  await prepareBuild(page);await executeBuild(page);await button(page,"Mở build/libs trong cây").click();await file(page,runtimeSource.artifact.path).click();
  await expect(lab(page).locator(".runtime-artifact")).toBeVisible();
  await button(page,"Làm lại bước build").click();await expect(file(page,runtimeSource.artifact.path)).toHaveCount(0);
  await expect(button(page,"Tiếp theo: chạy Command")).toBeEnabled();
  await task(page,"run-config",{jdk:21,daemon:true,containers:{"postgres-write":"running"},readyEvidence:["postgres-write"]});await runConfigurationWalk(page,"powershell");
  await next(page);await runCommandInLesson(page);await readCommandLogInLesson(page);
  await button(page,"Quay lại").click();await expect(lab(page).locator(".run-setup-summary")).toContainText("Command đang chạy");await expect(button(page,"Mở lại Run Configuration")).toBeDisabled();
  await next(page);await button(page,"Stop Command").click();await button(page,"Đọc kết quả của lần Run này").click();await readCommandLogInLesson(page);await expect(lab(page).locator(".command-run-window>header")).toContainText("Terminal · bootRun");await next(page);
  await expect(lab(page).locator(".task-start-card")).toContainText("Terminal giữ bootRun");await expect(lab(page).locator(".task-start-card")).toContainText("từng dependency/API vẫn cần kiểm chứng");
});
