import {test,expect} from "@playwright/test";
import type {Page} from "@playwright/test";
import {readFile} from "node:fs/promises";
import {createHash} from "node:crypto";
import preflight from "../../src/content/setup/command-preflight-source.json" with {type:"json"};
import {startupSource,startupDataset,normalizeStartupPlayback} from "../../src/setup/startup-log-model";
import {practice} from "./runtime-helpers";
const containers={"postgres-write":"running",redis:"running",rabbitmq:"running",kafka:"running",zookeeper:"running"};
const ready={sdk:21,jdk:21,mainSelected:true,daemon:true,containers,readyEvidence:[],runSetup:{step:"saved",saved:true,applied:true,draftProfile:"dev"}};
const snapshot=(page:Page)=>JSON.parse(new URL(page.url()).searchParams.get("psim")??"{}");
const button=(page:Page,name:string)=>practice(page).getByRole("button",{name,exact:true});
async function open(page:Page,sim:object=ready){await page.goto(`/journey/environment?${new URLSearchParams({experience:"project",task:"startup",pprofile:"dev",psim:JSON.stringify(sim)})}`);await expect(practice(page)).toBeVisible();}
async function finish(page:Page){for(let i=0;i<30;i++){if(!snapshot(page).commandSession.playback.playing)return;const before=snapshot(page).commandSession.playback.frame;await page.clock.runFor(220);await expect.poll(()=>snapshot(page).commandSession.playback.frame).toBeGreaterThan(before);}throw Error("Playback did not finish");}
async function run(page:Page,reference:string){await practice(page).getByLabel("Phiên log startup").selectOption(reference);await button(page,"Run cạnh main").click();await expect.poll(()=>snapshot(page).commandSession.playback.playing).toBe(true);}
const group=(page:Page,name:RegExp)=>practice(page).getByRole("navigation",{name:"Nhóm hoạt động startup"}).getByRole("button",{name});

test("preflight blocks a fresh JVM on verified startup writes and records the unexecuted dev alternative", {tag:"@source"},async()=>{
 expect(preflight.status).toBe("not-started");expect(preflight.candidate.executed).toBe(false);expect(preflight.createdPids).toEqual([]);expect(preflight.stoppedPids).toEqual([]);
 expect(preflight.processCheck.processCheck).toBe("checked");expect(preflight.processCheck.portCheck).toBe("checked");expect(preflight.processCheck.commandProcesses).toEqual([]);expect(preflight.processCheck.listeners).toEqual([]);
 expect(preflight.ide.mainClass).toBe("com.alpaca.agent.AgentCommandServiceApplication");expect(preflight.ide.sdk).toBe("21");expect(preflight.ide.makeBeforeLaunch).toBe(true);expect(preflight.ide.profileOptions.every(option=>!option.present)).toBe(true);
 expect(preflight.candidate.profile).toBe("dev");expect(preflight.candidate.command).toBe('.\\gradlew.bat :workspaces:agent-service:1-agent-command-service:bootRun --args="--spring.profiles.active=dev"');
 expect(preflight.risks.map(r=>r.id)).toEqual(["ddl","bootstrap","redis-lock"]);expect(preflight.risks[0].evidence).toEqual(expect.arrayContaining([expect.objectContaining({key:"spring.jpa.hibernate.ddl-auto",value:"update"}),expect.objectContaining({key:"spring.jpa.properties.hibernate.hbm2ddl.create_namespaces",value:"true"})]));
 expect(preflight.triggers).toEqual(expect.arrayContaining([expect.objectContaining({trigger:"PostConstruct",line:56})]));expect(preflight.triggers.some(t=>/Scheduled|EnableScheduling|ApplicationRunner|CommandLineRunner/.test(t.trigger))).toBe(false);
 for(const ref of preflight.files){const body=await readFile(`${preflight.sourceRoot}/${ref.path}`);expect(createHash("sha256").update(body).digest("hex")).toBe(ref.sha256);}
 expect(preflight.candidate.dependencies.find(item=>item.key==="spring.datasource.url")?.destination).toBe("postgresql://localhost/alpaca-event");expect(preflight.candidate.dependencies.filter(item=>/^cache.redis/.test(item.key)).map(item=>item.destination)).toEqual(["redis://localhost:6379","redis://localhost:6379","redis://localhost:6379"]);
});

test("groups distinguish source startup hooks and event infrastructure from observed connection or handling",()=>{
 expect(startupSource.groups.map(g=>g.id)).toEqual(["jvm","beans","data","init","clients","events","web","outcome","shutdown"]);
 for(const dataset of startupSource.datasets){expect(dataset.rows.some(row=>row.group==="init")).toBe(false);const events=dataset.rows.filter(row=>row.group==="events");expect(events.length).toBeGreaterThan(0);expect(events.every(row=>!/Starting consumer|Subscribed|event.*handled/i.test(row.text))).toBe(true);for(const row of dataset.rows)expect(startupSource.groups.some(g=>g.id===row.group)).toBe(true);}
 const failure=startupDataset("recorded-failure","dev");expect(failure.rows.some(row=>["clients","web"].includes(row.group))).toBe(false);
 const hook=startupSource.groups.find(g=>g.id==="init")!;expect(hook.when).toContain("@PostConstruct");expect(hook.sources).toContain("bootstrapWrite");
 const init=startupSource.sources.initializer.rows.map(row=>row.text).join("\n");expect(init).toContain("@PostConstruct");expect(init).toContain("createOwner()");expect(init).toContain("initGlobalConfig()");
 expect(normalizeStartupPlayback({group:"boot",frame:3,playing:true,paused:true},"idle","dev")).toEqual(expect.objectContaining({group:"jvm",frame:3,playing:true,paused:true}));
});

test("UI separates the blocked new inspection, archived default failure, and unobserved bootstrap or Redis",async({page})=>{
 await page.clock.install();await open(page);const notice=practice(page).locator(".startup-preflight");await notice.locator(":scope>summary").click();await expect(notice).toContainText("Không khởi chạy Java mới");await expect(notice).toContainText("ddl-auto: update");await expect(notice).toContainText("InitConfig.@PostConstruct");await notice.locator("details>summary").click();await expect(notice).toContainText("chưa thực hiện");await expect(notice).toContainText("--spring.profiles.active=dev");
 await run(page,"recorded-failure");await finish(page);await expect(practice(page).locator(".startup-provenance")).toContainText("profile default");await expect(practice(page).locator(".startup-provenance")).toContainText("không có JVM mới");
 for(const name of [/Bootstrap owner/,/Cache \/ Redis/,/Web server/]){await group(page,name).click();await expect(practice(page).locator(".startup-evidence-label")).toHaveAttribute("data-evidence","unobserved");await expect(practice(page).locator(".startup-evidence-label")).toContainText("Chưa quan sát");await expect(practice(page).locator(".startup-evidence-label")).toContainText("Đối chiếu source");}
 await group(page,/Bootstrap owner/).click();await expect(practice(page).locator(".startup-explanation")).toContainText("không cần request nghiệp vụ");await practice(page).locator(".startup-explanation details>summary").click();await expect(practice(page).locator(".startup-explanation details")).toContainText("configRepository.save(value)");
 await group(page,/Eventuate \/ sự kiện/).click();await expect(practice(page).locator(".startup-evidence-label")).toHaveAttribute("data-evidence","observed");await expect(practice(page).locator(".startup-explanation")).toContainText("Chưa quan sát Creating/Starting consumer");expect(snapshot(page).containers).toEqual(containers);expect(snapshot(page).readyEvidence??[]).toEqual([]);
});

test("cause is not revealed ahead of its log and success/Stop preserve all outside services",async({page})=>{
 await page.clock.install();await open(page);await run(page,"recorded-failure");const failure=startupDataset("recorded-failure","dev"),fatalFrame=failure.rows.findIndex(row=>row.fatal)+1;
 while(snapshot(page).commandSession.playback.frame<fatalFrame){const before=snapshot(page).commandSession.playback.frame;await page.clock.runFor(200);await expect.poll(()=>snapshot(page).commandSession.playback.frame).toBeGreaterThan(before);}
 await button(page,"Tạm dừng").click();await group(page,/Kết quả & nguyên nhân/).click();await expect(practice(page).locator(".startup-root-cause")).toHaveCount(0);await expect(practice(page).locator(".startup-cause-pending")).toContainText("Tiếp tục log");await button(page,"Tiếp tục").click();await finish(page);await group(page,/Kết quả & nguyên nhân/).click();await expect(practice(page).locator(".startup-root-cause")).toContainText("SocketTimeoutException: Connect timed out");await expect(practice(page).locator(".startup-log-proof")).toContainText("logs/app.log:23868");
 const consoleBox=await practice(page).locator(".startup-console").boundingBox(),causeBox=await practice(page).locator('[data-startup-line="23868"]').boundingBox();expect(consoleBox).toBeTruthy();expect(causeBox).toBeTruthy();expect(causeBox!.y).toBeGreaterThanOrEqual(consoleBox!.y);expect(causeBox!.y).toBeLessThan(consoleBox!.y+consoleBox!.height);
 await run(page,"recorded-success");await finish(page);await group(page,/Cache \/ Redis/).click();await expect(practice(page).locator(".startup-explanation")).toContainText("pool Redisson có connection");await expect(practice(page).locator(".startup-explanation")).toContainText("Redis ngoài");await expect(practice(page).locator(".startup-evidence-label")).toHaveAttribute("data-evidence","observed");
 await button(page,"Stop Command").click();await expect(practice(page).locator(".startup-explanation")).toContainText("container Docker giữ nguyên");await expect(practice(page).locator(".startup-ui-stop")).toContainText("các container Docker vẫn giữ trạng thái");expect(snapshot(page).containers).toEqual(containers);await expect(button(page,"Stop Command")).toBeDisabled();await expect(button(page,"Run cạnh main")).toBeEnabled();
});

test("previous boot-group links migrate without resetting the paused run, and expanded evidence fits mobile",async({page,browser})=>{
 await open(page,{...ready,commandSession:{id:7,shown:1,starting:true,playback:{reference:"recorded-failure",frame:3,playing:true,paused:true,group:"boot"}}});await expect(practice(page).locator(".startup-explanation")).toHaveAttribute("data-startup-explanation","jvm");await expect(button(page,"Tiếp tục")).toBeVisible();
 await group(page,/Bootstrap owner/).click();const link=page.url();expect(snapshot(page).commandSession.id).toBe(7);expect(snapshot(page).commandSession.playback.frame).toBe(3);
 const mobile=await browser.newPage({viewport:{width:390,height:844}});await mobile.goto(link);await practice(mobile).locator(".startup-preflight>summary").click();await practice(mobile).locator(".startup-preflight details>summary").click();await practice(mobile).locator(".startup-explanation details>summary").click();expect(await mobile.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);await expect(practice(mobile).locator(".startup-explanation")).toHaveAttribute("data-startup-explanation","init");await mobile.reload();await expect(practice(mobile).getByRole("button",{name:"Tiếp tục",exact:true})).toBeVisible();await mobile.close();
});
