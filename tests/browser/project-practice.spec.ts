import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";
import { readFile, stat } from "node:fs/promises";
import { createHash } from "node:crypto";
import { practiceSource, commandModule, commandPath, PRACTICE_KEY, swaggerModule } from "../../src/setup/project-practice-model";
import { SETUP_PROGRESS_KEY } from "../../src/setup/progress";
const lab=(page:Page)=>page.getByRole("region",{name:"Thực hành trên project tái dựng",exact:true});
const file=(page:Page,path:string)=>lab(page).getByRole("button",{name:`Mở file ${path}`,exact:true});
const folder=(page:Page,path:string,missing=false)=>lab(page).getByRole("button",{name:`Thư mục ${path}${missing?" (thiếu)":""}`,exact:true});
async function openFolder(page:Page,path:string) { const row=folder(page,path); if(await row.getAttribute("aria-expanded")!=="true") await row.click(); }
const resourcePath=`${commandPath}/src/main/resources`;
async function chooseProfile(page:Page,name:string) {
  const choice=lab(page).getByRole("radio",{name,exact:true});
  // Profile is a URL navigation; wait for the router to commit the controlled
  // input before reading history or reloading the page.
  await choice.click();
  await expect(choice).toBeChecked();
}

test("sanitized excerpts retain real lines, revisions and module → folder → clone mappings", {tag:"@source"},async()=>{
  expect(practiceSource.cloneTargets).toHaveLength(10);
  expect(practiceSource.modulePaths).toHaveLength(33);
  expect(commandModule.line).toBe(30); expect(commandModule.repoPath).toBe("workspaces/agent-service");
  expect(commandModule.cloneLine).toBe(10); expect(swaggerModule.cloneLine).toBeNull(); expect(swaggerModule.reportedAfter).toBe(false);
  for (const source of practiceSource.files) {
    const content=await readFile(`${source.sourceRoot}/${source.path}`,"utf8");
    expect(createHash("sha256").update(content).digest("hex")===source.sourceSha256).toBe(true);
    const lines=content.replace(/\r\n/g,"\n").split("\n");
    expect(source.revision).toMatch(/^[a-f0-9]{40}$/);
    for(const row of source.rows) {
      expect(row.line<=lines.length).toBe(true);
      if(!row.text.includes("đã che")) expect(row.text===lines[row.line-1]).toBe(true);
    }
  }
  for(const module of practiceSource.modulePaths.filter(module=>module.repoPath)) {
    const target=practiceSource.cloneTargets.find(target=>target.path===module.repoPath)!;
    expect(module.path.startsWith(target.path+"/")||module.path===target.path).toBe(true);
    expect(module.cloneLine).toBe(target.line);
  }
  for(const module of practiceSource.modulePaths) {
    const present=await stat(`${practiceSource.files[0].sourceRoot}/${module.path}`).then(value=>value.isDirectory(),()=>false);
    expect(present).toBe(module.presentNow);
    expect(present).toBe(module.reportedAfter);
  }
  const exported=JSON.stringify(practiceSource);
  expect(exported).not.toMatch(/https?:\/\/|jdbc:postgresql:\/\/|git@|glpat-|oauth2:/);
  expect(practiceSource.files.find(file=>file.id==="default")!.rows).toContainEqual({line:33,text:"    url: [đã che; PostgreSQL remote; chưa xác nhận cho local]"});
});

test("A–E: inspect root, map absent Command to clone script, see source appear and compare profiles",async({page})=>{
  const errors:string[]=[];page.on("pageerror",error=>errors.push(error.message));
  const external:string[]=[];page.on("request",request=>{if(!request.url().startsWith(`${new URL(process.env.PREVIEW_URL||"http://localhost:3182").origin}/`))external.push(request.url());});
  await page.goto("/journey/environment");
  await expect(lab(page)).toBeVisible();
  await expect(lab(page)).toContainText("Tái dựng theo báo cáo");
  await expect(folder(page,"workspaces/agent-service")).toHaveCount(0);
  await expect(lab(page).getByText("Chưa có source repo con",{exact:false})).toBeVisible();
  await file(page,"settings.gradle").click();
  await expect(lab(page).getByTestId("highlighted-code")).toContainText("rootProject.name = 'agent-workspaces'");
  await file(page,"build.gradle").click();
  await expect(lab(page).locator('[data-line="48"]')).toHaveAttribute("data-explained","true");
  await file(page,"gradlew.bat").click();
  await expect(lab(page).getByRole("status")).toContainText("điểm gọi Gradle trên Windows");
  await lab(page).getByRole("button",{name:"Tiếp tục",exact:true}).click();
  await lab(page).getByRole("button",{name:"Chọn dòng 30",exact:true}).click();
  await lab(page).getByRole("button",{name:"Đến thư mục trong cây",exact:true}).click();
  await expect(folder(page,commandPath,true)).toHaveClass(/is-selected/);
  await expect(lab(page).getByRole("status")).toContainText("chưa có source");
  await page.screenshot({path:".verification/project-before-source.png",fullPage:true});
  await lab(page).getByRole("button",{name:"Tìm cách lấy source",exact:true}).click();
  await expect(lab(page).getByTestId("highlighted-code")).toContainText("git clone [nguồn repo agent-system đã che] workspaces/agent-service");
  await lab(page).getByRole("button",{name:"Chọn dòng 1",exact:true}).click();
  await expect(lab(page).getByRole("status")).toContainText("cần repo");
  await lab(page).getByRole("button",{name:"Chọn dòng 10",exact:true}).click();
  await expect(lab(page).getByRole("status")).toContainText("Không có exact invocation");
  await lab(page).getByRole("button",{name:"Xem trạng thái sau khi lấy source",exact:true}).click();
  await expect(lab(page).locator(".practice-tree-row.is-fresh")).toHaveCount(10);
  await folder(page,commandPath).click();
  await expect(lab(page).locator(".practice-mapping")).toContainText("Có source");
  await expect(lab(page).locator(".practice-mapping")).toContainText("Thiếu source");
  await expect(lab(page).getByRole("status")).toContainText("Swagger vẫn thiếu");
  await page.screenshot({path:".verification/project-after-source.png",fullPage:true});
  await lab(page).getByRole("button",{name:"Đi vào module Command",exact:true}).click();
  for(const path of ["workspaces/agent-service",commandPath,`${commandPath}/src`,`${commandPath}/src/main`,resourcePath]) await openFolder(page,path);
  await file(page,`${resourcePath}/application.yml`).click();
  await expect(lab(page).getByRole("status")).toContainText("PostgreSQL remote");
  await file(page,`${resourcePath}/application-dev.yml`).click();
  await expect(lab(page).getByRole("status")).toContainText("chưa tự kích hoạt");
  await lab(page).getByRole("button",{name:"So sánh và chọn profile",exact:true}).click();
  await expect(lab(page).getByTestId("highlighted-code")).toHaveCount(2);
  await chooseProfile(page,"Chọn dev trong bài thực hành");
  await expect(lab(page).getByRole("status")).toContainText("dev ghi đè datasource sang localhost");
  await expect(lab(page).locator(".practice-effective")).toContainText("false (dev)");
  await expect(lab(page)).toContainText("Tiến độ kiểm tra máy thật không thay đổi");
  await page.screenshot({path:".verification/project-command-config.png",fullPage:true});
  const storage=await page.evaluate(([practice,real])=>({practice:JSON.parse(localStorage.getItem(practice)!),real:JSON.parse(localStorage.getItem(real)??"null")}),[PRACTICE_KEY,SETUP_PROGRESS_KEY]);
  expect(storage.practice.completed).toHaveLength(6);
  expect(storage.real?.checked??[]).toEqual([]);
  expect(errors).toEqual([]);expect(external).toEqual([]);
});

test("hints, other files and missing Swagger explain choices without inventing a clone command",async({page})=>{
  await page.goto("/journey/environment?experience=project&task=root");
  await lab(page).getByRole("button",{name:"Chỉ vị trí",exact:true}).click();
  await expect(file(page,"settings.gradle")).toBeFocused();
  await expect(lab(page).getByRole("status")).toContainText("Đã chỉ settings.gradle");
  await expect(lab(page).locator(".practice-root-seen .seen")).toHaveCount(0);
  await file(page,"init-shared.sh").click();
  await expect(lab(page).getByRole("status")).toContainText("nhận diện root");
  await page.goto("/journey/environment?experience=project&task=missing&pfile=settings&pline=27&pmodule=27&pstate=before");
  await lab(page).getByRole("button",{name:"Đến thư mục trong cây",exact:true}).click();
  await lab(page).getByRole("button",{name:"Tìm cách lấy source",exact:true}).click();
  await expect(lab(page).getByRole("status")).toContainText("không có target cho Swagger");
  await expect(page).toHaveURL(/task=missing/);
  await lab(page).getByRole("button",{name:"Chọn dòng 30",exact:true}).click();
  await lab(page).getByRole("button",{name:"Đến thư mục trong cây",exact:true}).click();
  await lab(page).getByRole("button",{name:"Tìm cách lấy source",exact:true}).click();
  await file(page,"init-shared.sh").click();
  await expect(lab(page).getByRole("status")).toContainText("sale-system");
  await expect(lab(page).getByRole("button",{name:"Xem trạng thái sau khi lấy source",exact:true})).toBeDisabled();
});

test("file, line, tree and profile survive Back/Forward, reload, task/journey changes; reset stays local",async({page})=>{
  await page.goto("/");
  await page.evaluate(([key,old])=>{
    localStorage.setItem(key,JSON.stringify({version:1,checked:["tools-java"],needsInfo:[],started:["tools"],selectedStep:"source",moduleId:null}));
    localStorage.setItem(old,"preserve-old-data");
  },[SETUP_PROGRESS_KEY,"backend-learning-workshop.setup-learning.v1"]);
  await page.goto("/journey/environment?experience=project&task=profile&pstate=after&pfile=dev&pline=33");
  await chooseProfile(page,"Chọn dev trong bài thực hành");
  const selected=page.url();
  await page.reload(); await expect(lab(page).getByRole("radio",{name:"Chọn dev trong bài thực hành",exact:true})).toBeChecked();
  await chooseProfile(page,"Không chỉ định profile");
  await page.goBack();await expect(page).toHaveURL(selected);
  await expect(lab(page).getByRole("radio",{name:"Chọn dev trong bài thực hành",exact:true})).toBeChecked();
  await page.goForward(); await expect(lab(page).getByRole("radio",{name:"Không chỉ định profile",exact:true})).toBeChecked();
  await lab(page).getByRole("button",{name:"E1 Module Command",exact:true}).click();
  for(const path of ["workspaces/agent-service",commandPath,`${commandPath}/src`,`${commandPath}/src/main`,resourcePath]) await openFolder(page,path);
  await file(page,`${resourcePath}/application-dev.yml`).click();
  await lab(page).getByRole("button",{name:"Chọn dòng 45",exact:true}).click();
  const command=page.url();
  await lab(page).getByRole("button",{name:"E2 Đối chiếu profile",exact:true}).click();
  await page.goBack();await expect(page).toHaveURL(command);
  await expect(folder(page,resourcePath)).toHaveAttribute("aria-expanded","true");
  await expect(lab(page).locator('[data-line="45"]')).toHaveAttribute("data-focus-line","true");
  await page.getByRole("link",{name:/Policy.*02/}).click();await page.getByRole("link",{name:/Hiểu và chạy dự án.*01/}).click();
  await expect(file(page,`${resourcePath}/application-dev.yml`)).toHaveAttribute("aria-pressed","true");
  await lab(page).getByRole("button",{name:"Làm lại bước",exact:true}).click();
  await expect(lab(page).getByTestId("highlighted-code")).toHaveCount(0);
  const old=await page.evaluate(([key,old])=>({real:JSON.parse(localStorage.getItem(key)!),old:localStorage.getItem(old)}),[SETUP_PROGRESS_KEY,"backend-learning-workshop.setup-learning.v1"]);
  expect(old.real.checked).toEqual(["tools-java"]);expect(old.old).toBe("preserve-old-data");
});

test("mobile tree, source, hint and before/after remain usable without page overflow",async({page})=>{
  await page.setViewportSize({width:390,height:844});
  await page.goto("/journey/environment?experience=project&task=missing&pfile=settings&pline=30&pmodule=30&pstate=before");
  await lab(page).getByRole("button",{name:"Đến thư mục trong cây",exact:true}).click();
  await expect(folder(page,commandPath,true)).toBeVisible();
  await lab(page).getByRole("button",{name:"Tìm cách lấy source",exact:true}).click();
  await lab(page).getByRole("button",{name:"Chỉ vị trí",exact:true}).click();
  await lab(page).getByRole("button",{name:"Chọn dòng 10",exact:true}).click();
  await lab(page).getByRole("button",{name:"Xem trạng thái sau khi lấy source",exact:true}).click();
  await expect(lab(page).locator(".practice-tree-row.is-fresh")).toHaveCount(10);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
  await lab(page).getByRole("button",{name:"E2 Đối chiếu profile",exact:true}).click();
  await chooseProfile(page,"Chọn dev trong bài thực hành");
  await expect(lab(page).getByTestId("highlighted-code")).toHaveCount(2);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
  await page.screenshot({path:".verification/project-mobile.png",fullPage:true});
});

test("malformed practice link/storage is normalized and guide remains reachable",async({page})=>{
  await page.goto("/");await page.evaluate(key=>localStorage.setItem(key,"{bad"),PRACTICE_KEY);
  await page.goto("/journey/environment?experience=project&task=wrong&pfile=missing&pline=-1&pmodule=999&pstate=before&pfolder=../../private");
  await expect(lab(page)).toBeVisible();await expect(page).toHaveURL(/task=root/);
  await expect(page).not.toHaveURL(/pfile=missing|pline=-1|pmodule=999|private/);
  await page.getByRole("button",{name:"Hướng dẫn trên máy thật",exact:true}).click();
  await expect(page.locator("#guide-action-source-layout")).toHaveAttribute("aria-expanded","true");
  await page.locator(".guide-step-nav").getByRole("button",{name:/Bước 2:/}).click();
  await expect(page.locator("#guide-action-tools-java")).toBeVisible();
  await expect(page.locator(".guide-map-toggle")).toHaveAttribute("aria-expanded","false");
});

test("reset D restores the missing tree and can replay the source change without completing machine checks",async({page})=>{
  await page.goto("/journey/environment?step=source&experience=project&task=after");
  await folder(page,commandPath).click();
  await expect(lab(page).getByRole("button",{name:"Đi vào module Command",exact:true})).toBeEnabled();
  await lab(page).getByRole("button",{name:"Làm lại bước",exact:true}).click();
  await expect(lab(page).locator(".practice-pane-title")).toContainText("Trước lấy source");
  await expect(lab(page).locator(".practice-tree-row.is-fresh")).toHaveCount(0);
  await expect(lab(page).getByRole("button",{name:"Đi vào module Command",exact:true})).toBeDisabled();
  await lab(page).getByRole("button",{name:"Xem trạng thái sau khi lấy source",exact:true}).click();
  await expect(lab(page).locator(".practice-tree-row.is-fresh")).toHaveCount(10);
  await expect(folder(page,swaggerModule.path,true)).toBeVisible();
  await expect(lab(page).getByRole("button",{name:"Đi vào module Command",exact:true})).toBeDisabled();
  await folder(page,commandPath).click();
  await expect(lab(page).getByRole("button",{name:"Đi vào module Command",exact:true})).toBeEnabled();
  expect(await page.evaluate(key=>JSON.parse(localStorage.getItem(key)??"{}").checked??[],SETUP_PROGRESS_KEY)).toEqual([]);
});

test("another module maps to its own clone target; keyboard line selection and narrow desktop keep task beside source",async({page})=>{
  await page.setViewportSize({width:1280,height:900});
  const other=practiceSource.modulePaths.find(module=>module.path.endsWith("/kafka-cdc-service"))!;
  await page.goto(`/journey/environment?step=source&experience=project&task=missing&pfile=settings&pline=${other.line}&pmodule=${other.line}`);
  await lab(page).getByRole("button",{name:"Đến thư mục trong cây",exact:true}).click();
  await expect(folder(page,other.path,true)).toBeVisible();
  await lab(page).getByRole("button",{name:"Tìm cách lấy source",exact:true}).click();
  const line=lab(page).getByRole("button",{name:`Chọn dòng ${other.cloneLine}`,exact:true});
  await line.focus();await page.keyboard.press("Enter");
  await expect(lab(page).getByRole("status")).toContainText(other.repoPath!);
  await expect(lab(page).getByRole("button",{name:"Xem trạng thái sau khi lấy source",exact:true})).toBeEnabled();
  const tree=await lab(page).locator(".practice-project").boundingBox();
  const task=await lab(page).getByRole("complementary",{name:"Nhiệm vụ hiện tại",exact:true}).boundingBox();
  expect(Math.abs(tree!.y-task!.y)).toBeLessThan(2);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(1280);
  await lab(page).getByRole("button",{name:"E1 Module Command",exact:true}).click();
  await expect(folder(page,commandPath)).toBeVisible();
  await expect(page).toHaveURL(/pmodule=30/);
});
