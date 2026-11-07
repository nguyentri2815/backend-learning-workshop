import {test,expect} from "@playwright/test";
import type {Page} from "@playwright/test";
import {readFile} from "node:fs/promises";
import {createHash} from "node:crypto";
import {commandCases,emptyCommandCase} from "../../src/setup/command-cases";
import {normalizeSimulation} from "../../src/setup/practice-runtime-model";
import {advanceCommandSession,beginCommandSession,stopCommandSession} from "../../src/setup/command-session-model";
import {startupDataset} from "../../src/setup/startup-log-model";
import evidence from "../../src/content/setup/command-case-source.json" with {type:"json"};
import {practice} from "./runtime-helpers";
const containers={"postgres-write":"running",redis:"running",rabbitmq:"running",kafka:"running",zookeeper:"running"};
const ready={sdk:21,jdk:21,daemon:true,containers,readyEvidence:[],mainSelected:true,runSetup:{step:"saved",saved:true,applied:true,draftProfile:"dev"}};
const state=(page:Page)=>JSON.parse(new URL(page.url()).searchParams.get("psim")??"{}");
const button=(page:Page,name:string)=>practice(page).getByRole("button",{name,exact:true});
async function open(page:Page,task="startup",sim:object=ready){await page.goto(`/journey/environment?${new URLSearchParams({experience:"project",task,pprofile:"dev",psim:JSON.stringify(sim)})}`);await expect(practice(page).getByRole("heading",{name:"Chạy Command và đọc kết quả",exact:true})).toBeVisible();}
async function finish(page:Page){for(let i=0;i<35;i++){if(!state(page).commandSession?.playback?.playing)return;const before=state(page).commandSession.playback.frame;await page.clock.runFor(220);await expect.poll(()=>state(page).commandSession.playback.frame).toBeGreaterThan(before);}throw Error("Playback did not finish");}
async function choose(page:Page,id:string){const library=practice(page).locator(".command-case-library");if(!(await library.evaluate(e=>(e as HTMLDetailsElement).open)))await library.locator(":scope>summary").click();const item=library.locator(`[data-command-case="${id}"]`),parent=item.locator("xpath=../..");if(!(await parent.evaluate(e=>(e as HTMLDetailsElement).open)))await parent.locator(":scope>summary").click();await item.click();}

test("all case/branch models reach only justified stages, recover in the same session model, and preserve other progress",()=>{
 for(const item of commandCases)for(const branch of item.branches){
  let sim=normalizeSimulation({...ready,build:"module-success",commandCase:{...emptyCommandCase(),id:item.id,branch:branch.id}});const original={containers:sim.containers,sdk:sim.sdk,jdk:sim.jdk,runSetup:sim.runSetup,jar:sim.execution.jar};
  sim={...sim,...beginCommandSession(sim,"dev")};for(let n=0;n<40&&sim.commandSession.playback.playing;n++)sim={...sim,...advanceCommandSession(sim)};
  expect(sim.commandSession.playback.playing,item.id).toBe(false);expect(sim.process,item.id).toBe(item.started?"running":"error");expect(sim.commandSession.shown,item.id).toBe(item.started?3:item.category==="before"?0:1);
  const data=startupDataset(sim.commandSession.playback.reference,sim.launchProfile,sim.commandSession.playback);expect(data.simulated??false).toBe(item.origin!=="recorded");if(!item.started)expect(data.rows.some(row=>row.milestone==="started")).toBe(false);
  if(item.id==="jdk")expect(data.javaVersion).toBe(17);if(item.id==="compile")expect(data.preLaunch).toBe(true);if(item.id==="profile")expect(data.rows.findIndex(row=>row.milestone==="profile")).toBeLessThan(data.rows.findIndex(row=>row.milestone==="started"));
  const id=sim.commandSession.id;sim={...sim,commandCase:{...sim.commandCase,phase:"retry",checked:true,repaired:true,draft:branch.after}};
  if(item.category==="after")sim={...sim,commandSession:{...sim.commandSession,playback:{...sim.commandSession.playback,caseId:item.id,caseRepaired:true,caseBranch:branch.id,playing:true}}};
  else{if(sim.process==="running")sim={...sim,...stopCommandSession(sim)};sim={...sim,...beginCommandSession(sim,"dev")};}
  for(let n=0;n<40&&sim.commandSession.playback.playing;n++)sim={...sim,...advanceCommandSession(sim)};
  expect(sim.commandCase.phase,item.id).toBe("resolved");expect(sim.process,item.id).toBe("running");expect(sim.commandSession.id,item.id).toBe(item.category==="after"?id:id+1);expect(sim.containers).toEqual(original.containers);expect(sim.runSetup).toEqual(original.runSetup);expect(sim.sdk).toBe(original.sdk);expect(sim.jdk).toBe(original.jdk);expect(sim.execution.jar).toBe(original.jar);
  const retry=startupDataset(sim.commandSession.playback.reference,sim.launchProfile,sim.commandSession.playback);expect(retry.simulated).toBe(true);expect(retry.rows.some(row=>row.text===branch.proof)).toBe(true);
 }
});

test("case evidence hashes match only agent-system; generic HTTP examples do not claim a repo response", {tag:"@source"},async()=>{
 for(const ref of Object.values(evidence.refs)){const bytes=await readFile(`${evidence.sourceRoot}/${ref.path}`);expect(createHash("sha256").update(bytes).digest("hex")).toBe(ref.sha256);}
 for(const item of commandCases){expect(item.branches.length).toBeGreaterThan(0);for(const id of item.refs)expect(evidence.refs).toHaveProperty(id);expect(item.action).toBeTruthy();expect(item.reached).toBeTruthy();}
 expect(commandCases.filter(c=>c.origin==="recorded").map(c=>c.id)).toEqual(["pg-timeout-recorded"]);expect(commandCases.filter(c=>c.origin==="general").map(c=>c.id)).toEqual(["http-401","http-403","http-500"]);
});

for(const item of commandCases)test(`case ${item.id}: Run → investigate → check → edit → retry has evidence`,async({page})=>{
 await page.clock.install();await open(page);await choose(page,item.id);await expect(practice(page).locator(".command-case-investigation")).toContainText("Chưa Run tình huống này");await button(page,"Run cạnh main").click();await finish(page);
 const id=state(page).commandSession.id,investigation=practice(page).locator(".command-case-investigation");await expect(investigation).toContainText(item.signal);await button(page,"Tìm nguyên nhân").click();await expect(investigation.locator(".case-check-result")).toHaveCount(0);
 await button(page,"Thực hiện kiểm tra trong bài").click();await expect(investigation.locator(".case-check-result")).toContainText(item.branches[0].finding);const branch=item.branches[0];
 await button(page,branch.fix).click();await expect(investigation.getByRole("alert")).toBeVisible();await investigation.getByLabel("Giá trị sửa trong case").selectOption(branch.after);await button(page,branch.fix).click();await expect(investigation.locator(".case-resolved")).toHaveCount(0);
 if(item.started&&item.category!=="after")await button(page,"Stop để dùng cấu hình vừa sửa").click();
 await button(page,item.category==="after"?"Thử lại trong cùng phiên":"Run lại sau kiểm tra").click();await finish(page);await expect(investigation.locator(".case-resolved")).toContainText(branch.proof);expect(state(page).commandSession.id).toBe(item.category==="after"?id:id+1);expect(state(page).containers).toEqual(containers);expect(state(page).runSetup.saved).toBe(true);await expect(practice(page).locator(".startup-provenance")).not.toContainText("Phát lại log đã lưu");
 await button(page,"Stop Command").click();await expect(button(page,"Stop Command")).toBeDisabled();await expect(investigation.locator(".case-resolved")).toContainText("Kết quả đã lưu · lần Run đã dừng");
});

test("legacy J1 deep links merge into results, keep the same run, and next goes directly to J2",async({page})=>{
 await page.clock.install();await open(page);await practice(page).getByLabel("Phiên log startup").selectOption("recorded-success");await button(page,"Run cạnh main").click();await finish(page);const id=state(page).commandSession.id,sim=state(page);
 await open(page,"verify",sim);await expect.poll(()=>new URL(page.url()).searchParams.get("task")).toBe("startup");await expect(page).toHaveURL(/prun=results/);await expect(practice(page).locator(".command-results")).toBeFocused();expect(state(page).commandSession.id).toBe(id);await expect(practice(page).getByRole("button",{name:/^J1 /})).toHaveCount(0);
 await button(page,"Quay lại").click();const run=page.url();await expect(page).toHaveURL(/prun=run/);await button(page,"Đọc kết quả của lần Run này").click();const result=page.url();await page.goBack();await expect(page).toHaveURL(run);await page.goForward();await expect(page).toHaveURL(result);expect(state(page).commandSession.id).toBe(id);
 await button(page,"Tiếp theo: chuẩn bị bắt đầu task").click();await expect(page).toHaveURL(/task=summary/);await button(page,`Xem log lần chạy #${id}`).click();await expect(page).toHaveURL(/task=startup/);expect(state(page).commandSession.id).toBe(id);
});

test("legacy stored progress, multiple cause branches, local-check order and mobile retain scope",async({page,browser})=>{
 await page.addInitScript(()=>localStorage.setItem("backend-learning-workshop.project-practice.v1",JSON.stringify({version:1,current:"verify",contexts:{verify:{task:"verify",profile:"dev",sim:{process:"stopped",commandSession:{id:9,shown:3},commandReview:{checked:["profile","port","started"]},build:"module-success"}}},seen:["verify:logs","daemon:ready"],completed:["daemon","build-task","verify"]})));
 await page.goto("/journey/environment?experience=project");await expect(practice(page).getByRole("heading",{name:"Chạy Command và đọc kết quả",exact:true})).toBeVisible();expect(state(page).commandSession.id).toBe(9);expect(state(page).execution.jar).toBe(true);
 const progress=await page.evaluate(()=>JSON.parse(localStorage.getItem("backend-learning-workshop.project-practice.v1")!));expect(progress.completed).toEqual(expect.arrayContaining(["daemon","build-task","verify","startup"]));
 await page.clock.install();await choose(page,"pg-refused");await button(page,"Run cạnh main").click();await finish(page);await button(page,"Tìm nguyên nhân").click();await practice(page).getByText("Thử nhánh nguyên nhân khác",{exact:true}).click();await button(page,"Listener chưa sẵn sàng").click();await button(page,"Thực hiện kiểm tra trong bài").click();await expect(practice(page).locator(".case-check-result")).toContainText("container running nhưng log chưa báo ready");
 const link=page.url(),mobile=await browser.newPage({viewport:{width:390,height:844}});await mobile.goto(link);await expect(practice(mobile).locator(".case-check-result")).toContainText("chưa báo ready");expect(await mobile.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);await mobile.reload();expect(JSON.parse(new URL(mobile.url()).searchParams.get("psim")!).commandCase.branch).toBe("listener");await mobile.close();
 await open(page);await button(page,"Run cạnh main").click();await finish(page);await expect(practice(page).locator(".command-http-contract")).toHaveCount(0);await practice(page).locator(".command-port-check>summary").click();await button(page,"Enter kiểm tra port trong bài").click();await expect(practice(page).locator(".command-http-contract")).toContainText("GET http://localhost:9901/actuator/health");await button(page,"Stop Command").click();await expect(practice(page).locator(".command-port-result")).toContainText("Không có process");await expect(button(page,"Gửi request trong bài · giả định health UP")).toBeDisabled();
});
