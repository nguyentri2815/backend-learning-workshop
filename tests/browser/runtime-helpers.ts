import {expect} from "@playwright/test";
import type {Page} from "@playwright/test";
import {visiblePracticeTasks} from '../../src/setup/project-practice-model';
import {practiceStep} from '../../src/setup/practice-runtime-model';
const stepNames=['source','tools','config','dependencies','build','run','ready'];
export async function chooseTaskInStep(page:Page,letterOrId:string){
 const target=visiblePracticeTasks.find(task=>task.letter===letterOrId||task.id===letterOrId);
 if(!target)throw Error(`Unknown task: ${letterOrId}`);
 const select=page.getByRole('combobox',{name:'Nhiệm vụ trong bước',exact:true});
 if(!await select.locator(`option[value="${target.id}"]`).count()){
  const step=practiceStep(target.id),index=stepNames.indexOf(step);
  await page.getByRole('navigation',{name:'Điều hướng 7 bước'}).getByRole('button').nth(index).click();
 }
 await select.selectOption(target.id);await expect.poll(()=>new URL(page.url()).searchParams.get('task')).toBe(target.id);await expect(select).toHaveValue(target.id);
}
export const practice=(page:Page)=>page.getByRole("region",{name:"Thực hành trên project tái dựng",exact:true});
export async function runCommandInLesson(page:Page){const mode=JSON.parse(new URL(page.url()).searchParams.get("psim")??"{}").runMode;if(mode==="powershell"){await practice(page).getByRole("button",{name:"Terminal",exact:true}).click();await practice(page).getByLabel("Lệnh Run trong Terminal").press("Enter");}else await practice(page).getByRole("button",{name:"Run Command",exact:true}).click();await expect(practice(page).locator(".command-process-status")).toContainText("Command đang chạy trong bài học");}
export async function readCommandLogInLesson(page:Page){for(const id of ["profile","port","started"])await practice(page).locator(`[data-command-log="${id}"]`).click();}
export async function prepareRunConfiguration(page:Page){
 const snapshot=()=>JSON.parse(new URL(page.url()).searchParams.get("psim")??"{}").runSetup;
 const button=(name:string)=>practice(page).getByRole("button",{name,exact:true});
 if(snapshot()?.step==="saved"){await button("Mở lại Run Configuration").click();return;}
 if((snapshot()?.step??"main")==="main")await button("Mở main class Command").click();
 if(snapshot()?.step==="inspect")await practice(page).locator('[data-run-action="inspect"]').click();
 if(snapshot()?.step==="menu")await practice(page).locator('[data-run-action="menu"]').click();
 await expect(practice(page).getByRole("group",{name:"Run/Debug Configurations",exact:true})).toBeVisible();
}
export async function runConfigurationWalk(page:Page,mode:"intellij"|"powershell"="intellij"){
 await prepareRunConfiguration(page);
 await practice(page).getByLabel("Active profiles trong bài",{exact:true}).selectOption("dev");
 await practice(page).getByRole("button",{name:"Apply",exact:true}).click();await practice(page).getByRole("button",{name:"OK",exact:true}).click();
 await expect(practice(page).locator(".run-setup-summary")).toContainText("dev");
 if(mode!=="intellij"){
  await practice(page).getByRole("button",{name:"Chạy bằng Terminal",exact:true}).click();
 }
}
export async function prepareBuild(page:Page,mode:"gradle"|"terminal"="gradle"){
 const flow=()=>JSON.parse(new URL(page.url()).searchParams.get("psim")??"{}").execution?.flow;
 if((flow()?.launcher??"gradle")!==mode)await practice(page).getByRole("button",{name:mode==="gradle"?"Trong IntelliJ":"Bằng lệnh Terminal",exact:true}).click();
 if(flow()?.step==="output")await practice(page).getByRole("button",{name:"Thử lại",exact:true}).click();
 for(const step of mode==="gradle"?["gradle-window","module","tasks","group","task"]:["terminal"]){
  if((flow()?.step??"gradle-window")!==step)continue;
  await practice(page).locator(`[data-build-action="${step}"]`).click();
  await expect.poll(()=>flow()?.step).not.toBe(step);
 }
}
export async function executeBuild(page:Page,mode:"gradle"|"terminal"="gradle"){
 await prepareBuild(page,mode);
 if(mode==="gradle")await practice(page).locator('[data-build-action="run"]').click();
 else await practice(page).getByLabel("Lệnh hướng dẫn",{exact:true}).press("Enter");
 await expect(practice(page).locator(".build-result")).toContainText("Build thành công");
}
export async function ideWalk(page:Page,branch:"existing"|"disk"|"download"="existing"){
  const action=async(key:string)=>{const before=page.url();const element=practice(page).locator(`[data-ide-action="${key}"]`);await element.click();await expect(page).not.toHaveURL(before);};
  for(const key of ["file","structure","project","sdk"])await action(key);
  if(branch==="existing")await action("sdk-choice");else{
    await practice(page).getByRole("button",{name:"Nhánh: chưa có JDK 21 trong danh sách",exact:true}).click();
    await action("add");
    if(branch==="disk"){await action("disk");await action("jdk-folder");}
    else {await practice(page).getByRole("button",{name:"Download JDK…",exact:true}).click();await action("download-choice");}
  }
  for(const key of ["language","language-choice","project-apply","project-ok","settings-file","settings","build-settings","gradle-settings","gradle-jvm","gradle-choice","settings-apply","settings-ok","gradle-window","reload","check"])await action(key);
  await expect(practice(page).locator(".ide-feedback")).toContainText("Terminal cần kiểm tra riêng");
}
export async function dockerWalk(page:Page){
  const button=(name:string)=>practice(page).getByRole("button",{name,exact:true});
  await button("Mở Docker Desktop trong mô phỏng").click();
  await button("Chờ Engine và kiểm tra lại docker version").click();
  await createContainer(page);
  await expect(practice(page).locator(".docker-evidence")).toContainText("Chưa xác nhận");
  await button("database system is ready to accept connections").click();
}
export async function createContainer(page:Page,service="postgres-write"){
  const button=(name:string)=>practice(page).getByRole("button",{name,exact:true});
  await practice(page).getByLabel("Service trong Compose",{exact:true}).selectOption(service);
  await button("Chuẩn bị lệnh Compose").click();await button("Bắt đầu Compose trong mô phỏng").click();
  await expect(practice(page).getByRole("row",{name:`Chọn container ${service}`,exact:true})).toHaveCount(0);
  await button("Hoàn tất chuẩn bị image").click();await button("Tạo tài nguyên và container").click();
  const row=practice(page).getByRole("row",{name:`Chọn container ${service}`,exact:true});await expect(row).toContainText("stopped");
  await button("Khởi động container vừa tạo").click();await row.click();await expect(practice(page).locator(".docker-inspector h4")).toContainText("running");
}
export async function conflictWalk(page:Page){
  const button=(name:string)=>practice(page).getByRole("button",{name,exact:true});
  await button("Thử tạo/chạy trong bài học").click();await button("Mở Docker Desktop mô phỏng").click();
  await button("Đối chiếu tên hiện hữu rebrow").click();await button("Cần · tạo instance riêng").click();
  await practice(page).getByLabel("Tên container trong bản mô phỏng",{exact:true}).fill("rebrow-learning");
  await button("Áp dụng bản mô phỏng").click();await button("Chạy lại kế hoạch trong bài").click();
  await button("Tình huống 2 · host port").click();await button("Thử tạo/chạy trong bài học").click();
  await button("Mở Docker Desktop mô phỏng").click();await button("Đối chiếu host port định dùng").click();
  await button("Cần · tạo instance riêng").click();await practice(page).getByLabel("Host port trong bản mô phỏng",{exact:true}).fill("15432");
  await button("Áp dụng bản mô phỏng").click();await button("Chạy lại kế hoạch trong bài").click();
}
