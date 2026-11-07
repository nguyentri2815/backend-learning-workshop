import {test,expect} from "@playwright/test";
import type {Page} from "@playwright/test";
import {practice,prepareRunConfiguration,runConfigurationWalk,runCommandInLesson} from "./runtime-helpers";
import {commandMain,commandMainClass} from "../../src/setup/run-configuration-model";
import {executionSource} from "../../src/setup/execution-model";
const button=(page:Page,name:string)=>practice(page).getByRole("button",{name,exact:true});
const snapshot=(page:Page)=>JSON.parse(new URL(page.url()).searchParams.get("psim")??"{}");
async function open(page:Page,sim:object={},extra:Record<string,string>={}){await page.goto(`/journey/environment?${new URLSearchParams({experience:"project",task:"run-config",psim:JSON.stringify(sim),...extra})}`);await expect(practice(page).getByRole("heading",{name:"Thiết lập cách chạy Command",exact:true})).toBeVisible();}

test("opening main reveals its branch and highlights main and SpringApplication.run without configuring or running",async({page})=>{
 await open(page);await expect(button(page,"Tiếp theo: Chạy và dừng")).toBeDisabled();
 await button(page,"Mở main class Command").click();
 const row=button(page,`Mở file ${commandMain.path}`);await expect(row).toBeVisible();await expect(row).toHaveClass(/is-selected/);await expect(row).toHaveAttribute("title",commandMain.path);
 await expect(practice(page).locator('.run-main-code [data-line="26"]')).toHaveAttribute("data-highlight","related");
 await expect(practice(page).locator('.run-main-code [data-line="27"]')).toHaveAttribute("data-highlight","primary");
 await expect(practice(page).getByRole("navigation",{name:"Đường dẫn đầy đủ",exact:true})).toHaveText(`${commandMain.sourceRoot}/${commandMain.path}`);
 await button(page,"Chọn dòng 27").click();expect(snapshot(page).mainSelected??false).toBe(false);expect(snapshot(page).runSetup?.saved??false).toBe(false);
 expect(snapshot(page).process??"idle").toBe("idle");await expect(button(page,"Tiếp theo: Chạy và dừng")).toBeDisabled();
});

test("the IntelliJ dialog saves Command and dev only after Apply/OK; I2 starts separately",async({page})=>{
 await open(page,{jdk:21,daemon:true,containers:{"postgres-write":"running"},readyEvidence:["postgres-write"],build:"module-success"});
 await prepareRunConfiguration(page);await expect(practice(page).getByLabel("Main class",{exact:true})).toHaveValue(commandMainClass);
 await expect(practice(page).getByLabel("Use classpath of module",{exact:true})).toHaveValue("1-agent-command-service");
 await expect(button(page,"Apply")).toBeDisabled();await practice(page).getByLabel("Active profiles trong bài",{exact:true}).selectOption("dev");
 expect(new URL(page.url()).searchParams.get("pprofile")).toBe("base");await expect(button(page,"OK")).toBeDisabled();
 await button(page,"Apply").click();expect(snapshot(page).runSetup.saved).toBe(false);expect(snapshot(page).process??"idle").toBe("idle");
 await button(page,"OK").click();await expect(practice(page).locator(".run-setup-summary")).toContainText("Đã thiết lập, chưa chạy");
 expect(snapshot(page).mainSelected).toBe(true);expect(snapshot(page).execution.jar).toBe(true);expect(snapshot(page).containers).toEqual({"postgres-write":"running"});
 await button(page,"Tiếp theo: Chạy và dừng").click();await expect(page).toHaveURL(/task=startup/);expect(snapshot(page).process??"idle").toBe("idle");
 await runCommandInLesson(page);await expect(practice(page).locator(".command-process-status")).toContainText("đang chạy");
});

test("tree names remain one line at normal font size, JAR has a tooltip, and width resizes with keyboard and pointer",async({page})=>{
 await open(page,{build:"module-success"});await button(page,"Mở main class Command").click();
 const row=button(page,`Mở file ${commandMain.path}`),name=row.locator("span");
 expect(await name.evaluate(element=>getComputedStyle(element).whiteSpace)).toBe("nowrap");
 expect(await name.evaluate(element=>parseFloat(getComputedStyle(element).fontSize))).toBeGreaterThanOrEqual(14);
 expect(await name.evaluate(element=>element.getBoundingClientRect().height)).toBeLessThan(30);
 const tree=practice(page).locator(".run-tree-panel"),resize=practice(page).getByRole("separator",{name:"Điều chỉnh độ rộng cây project",exact:true});
 const before=(await tree.boundingBox())!.width;await resize.focus();await page.keyboard.press("ArrowRight");await expect.poll(async()=>(await tree.boundingBox())!.width).toBeGreaterThan(before);
 const afterKey=(await tree.boundingBox())!.width;expect((await resize.boundingBox())!.height).toBeGreaterThan(400);
 const box=(await resize.boundingBox())!;await page.mouse.move(box.x+box.width/2,box.y+100);await page.mouse.down();await page.mouse.move(box.x+box.width/2+65,box.y+100);await page.mouse.up();
 const width=(await tree.boundingBox())!.width;expect(width).toBeGreaterThan(afterKey+30);await page.reload();await expect.poll(async()=>Math.abs((await tree.boundingBox())!.width-width)).toBeLessThan(3);
 await button(page,`Thư mục ${executionSource.modulePath}/build`).click();await button(page,`Thư mục ${executionSource.modulePath}/build/libs`).click();
 const jar=button(page,`Mở file ${executionSource.artifact.path}`);await expect(jar).toHaveAttribute("title",executionSource.artifact.path);
 expect(await jar.locator("span").evaluate(element=>getComputedStyle(element).whiteSpace)).toBe("nowrap");
 expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(1512);
});

test("main deep links, draft profile, Apply and saved settings survive Back/Forward, reload and a fresh context",async({page,browser})=>{
 await open(page,{mainSelected:true},{pfile:"main",pline:"27",popen:"workspaces"});
 await expect(button(page,`Mở file ${commandMain.path}`)).toBeVisible();await expect(button(page,"Tiếp theo: Chạy và dừng")).toBeDisabled();
 await prepareRunConfiguration(page);await practice(page).getByLabel("Active profiles trong bài",{exact:true}).selectOption("dev");const draft=page.url();
 await button(page,"Apply").click();const applied=page.url();await page.goBack();await expect(page).toHaveURL(draft);await expect(button(page,"OK")).toBeDisabled();
 await page.goForward();await expect(page).toHaveURL(applied);await page.reload();await expect(button(page,"OK")).toBeEnabled();await button(page,"OK").click();const saved=page.url();
 const linked=await browser.newPage();await linked.goto(saved);await expect(practice(linked).locator(".run-setup-summary")).toContainText("Đã thiết lập, chưa chạy");await linked.close();
 await page.goto('/journey/environment?experience=project&task=run-config');await expect(practice(page).locator(".run-setup-summary")).toContainText("dev");
 await button(page,"Mở lại Run Configuration").click();await practice(page).getByLabel("Active profiles trong bài",{exact:true}).selectOption("base");await button(page,"Cancel").click();await expect(practice(page).locator(".run-setup-summary")).toContainText("dev");
});

test("mobile reads main and JAR names, configures dev in the dialog and continues without page overflow",async({page})=>{
 await page.setViewportSize({width:390,height:844});await open(page,{build:"module-success"});await button(page,"Mở main class Command").click();
 expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
 const main=button(page,`Mở file ${commandMain.path}`);expect(await main.locator("span").evaluate(element=>element.getBoundingClientRect().height)).toBeLessThan(30);
 await button(page,`Thư mục ${executionSource.modulePath}/build`).click();await button(page,`Thư mục ${executionSource.modulePath}/build/libs`).click();await expect(button(page,`Mở file ${executionSource.artifact.path}`)).toBeVisible();
 await runConfigurationWalk(page);expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
 await button(page,"Tiếp theo: Chạy và dừng").click();await expect(page).toHaveURL(/task=startup/);
});

for(const width of [1512,390])test(`Run gutter follows main row through source scrolling and resizing at ${width}px`,async({page})=>{
 await page.setViewportSize({width,height:1000});await open(page);await button(page,"Mở main class Command").click();
 const gutter=button(page,"Tam giác Run cạnh main"),line=practice(page).locator('.run-main-code [data-line="26"]');
 const distance=async()=>{const a=await gutter.boundingBox(),b=await line.boundingBox();return !a||!b?1000:Math.abs(a.y+a.height/2-b.y-b.height/2);};
 await expect.poll(distance).toBeLessThan(3);
 await practice(page).locator('.run-main-code [data-testid="code-scroll"]').evaluate(element=>element.scrollTop+=35);await expect.poll(distance).toBeLessThan(3);
 await page.setViewportSize({width:width===1512?1100:430,height:1000});await expect.poll(distance).toBeLessThan(3);
 await button(page,"Chỉ vị trí").click();await expect(gutter).toBeFocused();
});
