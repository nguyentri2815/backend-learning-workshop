import {test,expect} from "@playwright/test";
import type {Page} from "@playwright/test";
import {normalizeSimulation} from "../../src/setup/practice-runtime-model";
import {beginCommandSession,advanceCommandSession,missingCommandConditions} from "../../src/setup/command-session-model";
import {runCommandSimulation} from "../../src/setup/execution-model";
import {practice,runCommandInLesson,createContainer} from "./runtime-helpers";

const services=["postgres-write","redis","rabbitmq","kafka","zookeeper"];
const configured={mainSelected:true,runSetup:{step:"saved",draftProfile:"dev",applied:true,saved:true},sdk:21,jdk:21};
const button=(page:Page,name:string)=>practice(page).getByRole("button",{name,exact:true});
const snapshot=(page:Page)=>JSON.parse(new URL(page.url()).searchParams.get("psim")??"{}");
async function open(page:Page,task:string,sim:object){await page.goto(`/journey/environment?${new URLSearchParams({experience:"project",task,pprofile:"dev",psim:JSON.stringify(sim)})}`);await expect(practice(page)).toBeVisible();}
async function runStep(page:Page){await practice(page).getByRole("button",{name:/^I2 /}).click();await expect(practice(page).locator(".command-lesson")).toBeVisible();}

test("startup conditions ignore log-reading progress in both Run models and throughout startup",()=>{
 const base=normalizeSimulation({...configured,daemon:true,containers:Object.fromEntries(services.map(id=>[id,"running"])),readyEvidence:[]});
 expect(missingCommandConditions(base,"dev")).toEqual([]);
 expect(runCommandSimulation(base,"dev").process).toBe("running");
 let s={...base,...beginCommandSession(base,"dev")};expect(s.commandSession.starting).toBe(true);
 for(let i=0;i<50&&s.commandSession.playback.playing;i++)s={...s,...advanceCommandSession(s)};
 expect(s.process).toBe("running");expect(s.readyEvidence).toEqual([]);expect(s.commandSession.assumed).toBe(false);
 expect(missingCommandConditions({...base,readyEvidence:["postgres-write"]},"dev")).toEqual([]);
 expect(runCommandSimulation({...base,jdk:17,runMode:"intellij"},"dev").process).toBe("running");
 expect(runCommandSimulation({...base,jdk:17,runMode:"powershell"},"dev").process).toBe("error");
});

for(const mode of ["intellij","powershell"] as const)test(`G2 starts all five services without reading logs, then I2 runs via ${mode}`,async({page})=>{
 await open(page,"daemon",{...configured,runMode:mode,daemon:true,containers:Object.fromEntries(services.map(id=>[id,"stopped"]))});
 for(const id of services){await practice(page).getByRole("row",{name:`Chọn container ${id}`,exact:true}).click();await button(page,`Start ${id}`).click();await expect(practice(page).locator(".docker-inspector h4")).toContainText(`${id} · running`);}
 expect(snapshot(page).readyEvidence??[]).toEqual([]);expect(snapshot(page).containers).toEqual(Object.fromEntries(services.map(id=>[id,"running"])));await expect(button(page,"Tiếp tục")).toBeEnabled();
 await runStep(page);await expect(practice(page).locator(".command-missing")).toHaveCount(0);await runCommandInLesson(page);
 expect(snapshot(page).commandSession.assumed).toBe(false);expect(snapshot(page).readyEvidence??[]).toEqual([]);expect(snapshot(page).containers).toEqual(Object.fromEntries(services.map(id=>[id,"running"])));
 const progress=await page.evaluate(()=>JSON.parse(localStorage.getItem("backend-learning-workshop.project-practice.v1")!).completed);expect(progress).not.toContain("daemon");
 await button(page,"Stop Command").click();await page.reload();await runCommandInLesson(page);expect(snapshot(page).readyEvidence??[]).toEqual([]);
});

test("an old blocked link recovers with running services even when G2 reading was never completed",async({page})=>{
 await open(page,"startup",{...configured,daemon:true,containers:Object.fromEntries(services.map(id=>[id,"running"])),process:"error",commandSession:{id:1,shown:0,starting:false},readyEvidence:[]});
 await expect(practice(page).locator(".command-missing")).toHaveCount(0);await runCommandInLesson(page);expect(snapshot(page).commandSession.id).toBe(2);expect(snapshot(page).readyEvidence??[]).toEqual([]);
});

test("remaining Engine and stopped database conditions have explicit inline actions and never start unrelated services",async({page})=>{
 await open(page,"startup",{...configured,daemon:false,containers:{"postgres-write":"stopped",redis:"stopped"},build:"module-success"});
 await expect(practice(page).locator('[data-command-condition="database"]')).toContainText("stopped");await expect(button(page,"Khởi động postgres-write trong bài")).toBeDisabled();
 await button(page,"Run Command").click();await expect(practice(page).locator(".command-process-status")).toContainText("Chưa khởi động Command");await expect(practice(page).locator(".command-process-status")).not.toContainText("Khởi động thất bại");
 await button(page,"Bật Docker Engine trong bài").click();expect(snapshot(page).containers).toEqual({"postgres-write":"stopped",redis:"stopped"});
 await button(page,"Khởi động postgres-write trong bài").click();await expect(practice(page).locator(".command-missing")).toHaveCount(0);expect(snapshot(page).containers).toEqual({"postgres-write":"running",redis:"stopped"});expect(snapshot(page).readyEvidence??[]).toEqual([]);
 await runCommandInLesson(page);expect(snapshot(page).execution.jar).toBe(true);expect(snapshot(page).runSetup.saved).toBe(true);
});

test("a missing database opens the correct Compose service and can return to Run without reading its log",async({page})=>{
 await open(page,"startup",{...configured,daemon:true,containers:{redis:"running"},composeService:"redis"});
 await expect(practice(page).locator('[data-command-condition="database"]')).toContainText("chưa có container");await button(page,"Tạo postgres-write · G2").click();await expect(page).toHaveURL(/task=daemon/);await expect(practice(page).getByLabel("Service trong Compose",{exact:true})).toHaveValue("postgres-write");
 expect(snapshot(page).containers).toEqual({redis:"running"});await createContainer(page);expect(snapshot(page).readyEvidence??[]).toEqual([]);await runStep(page);await runCommandInLesson(page);expect(snapshot(page).containers.redis).toBe("running");
});

test("CLI, SDK and profile problems remain specific and link to their actual controls",async({page})=>{
 await open(page,"startup",{...configured,sdk:17,daemon:true,containers:{"postgres-write":"running"},dockerInstalled:false});
 await expect(practice(page).locator('[data-command-condition="jdk"]')).toContainText("Java 17");await expect(practice(page).locator('[data-command-condition="cli"]')).toContainText("Docker CLI");await expect(button(page,"Bật Docker Engine trong bài")).toHaveCount(0);
 await button(page,"Mở Project SDK · F3").click();await expect(page).toHaveURL(/task=ide/);expect(snapshot(page).sdk).toBe(17);expect(snapshot(page).ideStep).toBe("sdk");
 await open(page,"startup",{...configured,runMode:"powershell",jdk:17,daemon:true,containers:{"postgres-write":"running"}});await expect(practice(page).locator('[data-command-condition="jdk"]')).toContainText("JDK Terminal đang là Java 17");await button(page,"Chọn JDK Terminal · F2").click();await expect(page).toHaveURL(/task=jdk/);
});
