import {test,expect} from "@playwright/test";
import type {Page} from "@playwright/test";
import {readFile} from "node:fs/promises";
import {createHash} from "node:crypto";
import {startupSource,startupDataset} from "../../src/setup/startup-log-model";
import {practice} from "./runtime-helpers";
const configured={mainSelected:true,runSetup:{step:"saved",draftProfile:"dev",applied:true,saved:true},sdk:21,jdk:21,daemon:true,containers:{"postgres-write":"running",redis:"running",rabbitmq:"running",kafka:"running",zookeeper:"running"}};
const button=(page:Page,name:string)=>practice(page).getByRole("button",{name,exact:true});
const snapshot=(page:Page)=>JSON.parse(new URL(page.url()).searchParams.get("psim")??"{}");
async function open(page:Page,sim:object=configured){await page.goto(`/journey/environment?${new URLSearchParams({experience:"project",task:"startup",pprofile:"dev",psim:JSON.stringify(sim)})}`);await expect(practice(page).getByRole("heading",{name:"Chạy Command và đọc kết quả",exact:true})).toBeVisible();}
async function finish(page:Page){for(let i=0;i<30;i++){const p=snapshot(page).commandSession?.playback;if(!p?.playing)return;const before=p.frame;await page.clock.runFor(220);await expect.poll(()=>snapshot(page).commandSession.playback.frame).toBeGreaterThan(before);}throw Error("Playback did not finish");}
async function run(page:Page,reference="recorded-failure"){await practice(page).getByLabel("Phiên log startup").selectOption(reference);await button(page,"Run cạnh main").click();await expect.poll(()=>snapshot(page).commandSession.playback.playing).toBe(true);}

test("startup excerpts have original Command session boundaries, hashes, real default failure and separate successes", {tag:"@source"},async()=>{
 const body=await readFile(`${startupSource.sourceRoot}/${startupSource.log.path}`),raw=body.toString("utf8").split(/\r?\n/);
 expect(createHash("sha256").update(body).digest("hex")).toBe(startupSource.log.sha256);
 for(const data of startupSource.datasets){expect(raw.slice(data.from-1,data.to).filter(row=>/Starting Agent.*Application/.test(row))).toHaveLength(1);for(const row of data.rows){expect(row.line).toBeGreaterThanOrEqual(data.from);expect(row.line).toBeLessThanOrEqual(data.to);expect(raw[row.line-1]).toBeTruthy();}expect(data.rows.map(row=>row.text).join("\n")).not.toMatch(/AgentQueryServiceApplication|AgentFlowServiceApplication|INSURTECH/);}
 const failure=startupDataset("recorded-failure","dev");expect(failure.profile).toBe("default");expect(failure.rows.some(row=>row.milestone==="started")).toBe(false);expect(failure.rows.find(row=>row.text.includes("SocketTimeoutException"))!.line).toBeGreaterThan(failure.rows.find(row=>row.text.includes("Application run failed"))!.line);expect(failure.rows.some(row=>row.group==="shutdown"&&row.text.includes("cancelling refresh attempt"))).toBe(true);expect(failure.missing).toContain("không xác nhận");
 for(const ref of Object.values(startupSource.sources)){const bytes=await readFile(`${startupSource.sourceRoot}/${ref.path}`);expect(createHash("sha256").update(bytes).digest("hex")).toBe(ref.sha256);}
 const base=startupSource.sources.base.rows.map(row=>row.text).join("\n");expect(base).not.toMatch(/password:|jdbc:postgresql:\/\//i);
});

test("real default failure replays groups, pauses and exposes the full cause chain without changing I1 or services",async({page})=>{
 await page.clock.install();await open(page);await run(page);
 await page.clock.runFor(220);await button(page,"Tạm dừng").click();await expect.poll(()=>snapshot(page).commandSession.playback.paused).toBe(true);const frame=snapshot(page).commandSession.playback.frame;await page.clock.runFor(2000);expect(snapshot(page).commandSession.playback.frame).toBe(frame);
 await practice(page).getByRole("navigation",{name:"Nhóm hoạt động startup"}).getByRole("button",{name:/Repository, JPA, DB/}).click();await expect(practice(page).locator(".startup-explanation")).toContainText("Chưa có dòng");
 await button(page,"Nhóm tiếp theo").click();expect(snapshot(page).commandSession.playback.paused).toBe(true);await button(page,"Tiếp tục").click();await finish(page);
 await expect(practice(page).locator(".command-process-status")).toContainText("Khởi động thất bại");expect(snapshot(page).launchProfile??"base").toBe("base");expect(new URL(page.url()).searchParams.get("pprofile")).toBe("dev");expect(snapshot(page).containers).toEqual(configured.containers);expect(snapshot(page).runSetup.saved).toBe(true);await expect(practice(page).locator('[data-command-log="started"]')).toHaveCount(0);await expect(button(page,"Stop Command")).toBeDisabled();
 await practice(page).getByRole("navigation",{name:"Nhóm hoạt động startup"}).getByRole("button",{name:/Kết quả & nguyên nhân/}).click();await expect(practice(page).locator(".startup-root-cause")).toContainText("SocketTimeoutException: Connect timed out");await expect(practice(page).locator(".startup-root-cause")).toContainText("không phải bằng chứng dòng 27");
 await practice(page).getByRole("navigation",{name:"Nhóm hoạt động startup"}).getByRole("button",{name:/Hủy khởi tạo/}).click();await expect(practice(page).locator(".startup-evidence-gap")).toContainText("không xác nhận");
});

test("full log keeps the selected group, source and real log lines; DEBUG/WARN are not all failures",async({page})=>{
 await page.clock.install();await open(page);await run(page);await finish(page);
 await practice(page).getByRole("navigation",{name:"Nhóm hoạt động startup"}).getByRole("button",{name:/Repository, JPA, DB/}).click();await expect(practice(page).locator(".startup-explanation")).toHaveAttribute("data-startup-explanation","data");await practice(page).getByLabel("Xem toàn bộ log",{exact:true}).click();await expect(practice(page).getByLabel("Xem toàn bộ log",{exact:true})).toBeChecked();await expect(practice(page).locator(".startup-console>button")).toHaveCount(startupDataset("recorded-failure","base").to-startupDataset("recorded-failure","base").from+1,{timeout:15000});
 await expect(practice(page).locator('.startup-console [data-startup-line="19093"]')).toContainText("15 JPA repository");await expect(practice(page).locator('.startup-console [data-startup-line="19093"]')).toHaveClass(/is-startup-selected/);await expect(practice(page).locator('.startup-console [data-level="WARN"]').first()).not.toHaveClass(/error/);
 await practice(page).getByLabel("Xem toàn bộ log",{exact:true}).click();await expect(practice(page).getByLabel("Xem toàn bộ log",{exact:true})).not.toBeChecked();await expect(practice(page).locator(".startup-console>button")).toHaveCount(startupDataset("recorded-failure","base").rows.length);await practice(page).locator(".startup-explanation details summary").click();await expect(practice(page).locator(".startup-explanation details")).toContainText("EnableJpaRepositories");await expect(practice(page).locator(".startup-explanation details")).toContainText("application.yml");await expect(practice(page).locator(".startup-explanation")).toContainText("EntityManagerFactory không khởi tạo được");
});

test("a recorded default success reaches actual Tomcat/Started, Stop retains output and replay gets a new id",async({page})=>{
 await page.clock.install();await open(page);await run(page,"recorded-success");await finish(page);await expect(practice(page).locator(".command-process-status")).toContainText("Command đang chạy trong bài học");await expect(practice(page).locator('[data-command-log="profile"]')).toContainText('"default"');await expect(practice(page).locator('[data-command-log="port"]')).toContainText("9901");
 const id=snapshot(page).commandSession.id;await button(page,"Stop Command").click();await expect(practice(page).locator(".startup-ui-stop")).toContainText("Source/JAR giữ nguyên");await expect(practice(page).locator(".startup-stop-reference")).toBeVisible();expect(snapshot(page).containers).toEqual(configured.containers);await button(page,"Chạy lại").click();await page.clock.runFor(250);expect(snapshot(page).commandSession.id).toBe(id+1);await button(page,"Stop Command").click();await page.clock.runFor(10000);expect(snapshot(page).process).toBe("stopped");await expect(practice(page).locator('[data-command-log="started"]')).toHaveCount(0);
});

test("historical failure can be read with no prepared services, while configured Run retains technical gates",async({page})=>{
 await page.clock.install();await open(page,{});await button(page,"Run Command").click();await expect(practice(page).locator(".command-missing")).toBeVisible();await run(page);await finish(page);await expect(practice(page).locator(".command-process-status")).toContainText("Khởi động thất bại");expect(snapshot(page).daemon??false).toBe(false);expect(snapshot(page).containers??{}).toEqual({});expect(snapshot(page).runSetup?.saved??false).toBe(false);await expect(practice(page).locator(".command-missing")).toHaveCount(0);
});

test("paused frame, group and reference survive deep link and history; mobile has no page overflow",async({page,browser})=>{
 await page.clock.install();await open(page);await run(page);await page.clock.runFor(450);await button(page,"Tạm dừng").click();const paused=page.url();await practice(page).getByRole("navigation",{name:"Nhóm hoạt động startup"}).getByRole("button",{name:/Thành phần Spring/}).click();const selected=page.url();await page.goBack();await expect(page).toHaveURL(paused);await page.goForward();await expect(page).toHaveURL(selected);
 const mobile=await browser.newPage({viewport:{width:390,height:844}});await mobile.goto(selected);await expect(practice(mobile).getByRole("button",{name:"Tiếp tục",exact:true})).toBeVisible();expect(snapshot(mobile).commandSession.playback.group).toBe("beans");expect(await mobile.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);await mobile.reload();expect(snapshot(mobile).commandSession.playback.paused).toBe(true);await mobile.close();
});
