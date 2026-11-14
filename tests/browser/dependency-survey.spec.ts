import {chooseTaskInStep} from "./runtime-helpers";
import {expect,test} from "@playwright/test";
import type {Page} from "@playwright/test";
import {readFile} from "node:fs/promises";
import {createHash} from "node:crypto";
import survey from "../../src/content/setup/dependency-survey.json" with {type:"json"};
import {emptySimulation,normalizeSimulation} from "../../src/setup/practice-runtime-model";
import {surveyRequirement} from "../../src/setup/dependency-survey-model";
import {practice,createContainer} from "./runtime-helpers";
const detail=(page:Page)=>practice(page).locator(".survey-detail");
const button=(page:Page,name:string)=>practice(page).getByRole("button",{name,exact:true});
async function task(page:Page,sim:object={},profile="dev"){
 await page.goto(`/journey/environment?${new URLSearchParams({experience:"project",task:"connections",pprofile:profile,psim:JSON.stringify(sim)})}`);await expect(practice(page).locator(".dependency-survey")).toBeVisible();
}
async function select(page:Page,id:string){const group=survey.groups.find(g=>g.id===id)!;await practice(page).locator(".survey-directory").getByRole("button",{name:["postgres","rabbit","redis"].includes(id)?`Xem cấu hình ${id==="postgres"?"PostgreSQL write":id==="rabbit"?"RabbitMQ":"Redis"}`:`Khảo sát ${group.label}`,exact:true}).click();}
async function conclude(page:Page){await button(page,"Ai sử dụng cấu hình này?").click();await button(page,"Lần đến nơi gọi / điều kiện").click();await button(page,"Xem kết luận và cần chuẩn bị gì").click();}
test("survey evidence matches original lines and hashes, redacts secrets and groups endpoint identities", {tag:"@source"},async()=>{
 for(const proof of [...survey.evidence,...survey.configs]){
  const raw=await readFile(`${survey.sourceRoot}/${proof.path}`,"utf8");expect(createHash("sha256").update(raw).digest("hex")).toBe(proof.sourceSha256);
  const lines=raw.split(/\r?\n/);for(const row of proof.rows){expect(row.line).toBeGreaterThan(0);if(!row.text.includes("đã che"))expect(row.text).toBe(lines[row.line-1]);}
 }
 expect(survey.groups.filter(g=>g.id==="redis")).toHaveLength(1);expect(survey.groups.find(g=>g.id==="redis")?.keys).toHaveLength(3);
 expect(survey.groups.find(g=>g.id==="platform-query")?.keys).toEqual(["system.platform-query.api","system.sp-query.api"]);
 expect(survey.evidence.find(p=>p.id==="query-client")?.rows.some(r=>r.text.includes("system.sp-query.api"))).toBe(true);
 expect(survey.business.method).toBe("POST");expect(survey.evidence.find(p=>p.id==="business-entry")?.rows.some(r=>r.text.includes("HttpStatus.FOUND"))).toBe(true);
 expect(survey.evidence.find(p=>p.id==="business-call")?.rows.some(r=>r.text.includes("saleUnitRepository.findById"))).toBe(true);
 expect(JSON.stringify(survey)).not.toMatch(/https?:\/\/|redis:\/\/|jdbc:postgresql:\/\/|sqp_|glpat-|[\w.+-]+@[\w.-]+\.[a-z]{2}/i);
 expect(survey.groups.find(g=>g.id==="zookeeper")?.binding).toEqual([]);
 const keys=survey.groups.filter(g=>g.id==="shared-clients").flatMap(g=>g.keys);expect(keys).not.toContain("system.sso-service.api");
 const legacy=normalizeSimulation({jdk:21,daemon:true,containers:{"postgres-write":"running"},surveyGoal:"invalid",surveyProviders:{injected:"docker",redis:"hacked"}});
 expect(legacy.surveyGoal).toBe("startup");expect(legacy.containers["postgres-write"]).toBe("running");expect(legacy.surveyProviders).toEqual({});expect(emptySimulation().surveyRead).toEqual([]);
});
test("goal plans are bounded by source: build has no runtime services, auth adds SSO, business does not require every client",async({page})=>{
 await task(page);const plan=practice(page).locator(".survey-plan");
 await expect(plan.locator('[data-bucket="prepare"]')).toContainText("PostgreSQL write");await expect(plan.locator('[data-bucket="prepare"]')).toContainText("Redis");
 await practice(page).getByLabel("Mục tiêu chạy",{exact:true}).selectOption("build");await expect(plan.locator('[data-bucket="prepare"]')).toContainText("0 nhóm");
 await expect(plan.locator('[data-bucket="prepare"]')).toContainText("không cần mở kết nối runtime");
 await practice(page).getByLabel("Mục tiêu chạy",{exact:true}).selectOption("auth");await expect(plan.locator('[data-bucket="prepare"]')).toContainText("SSO");
 await practice(page).getByLabel("Mục tiêu chạy",{exact:true}).selectOption("document");
 await expect(plan.locator('[data-bucket="conditional"]')).toContainText("Assets");expect(surveyRequirement("core-proxy","document","dev").bucket).toBe("outside");
 expect(surveyRequirement("rabbit","document","dev").bucket).toBe("conditional");expect(surveyRequirement("platform-command","document","dev").bucket).toBe("conditional");
 await expect(practice(page).locator(".survey-business")).toContainText("POST /sale-unit/download-document/{documentType}");await expect(practice(page).locator(".survey-business")).toContainText("không gọi InternalAssetsApi");
 await practice(page).getByLabel("Mục tiêu chạy",{exact:true}).selectOption("event");await expect(plan.locator('[data-bucket="unknown"]')).toContainText("CDC");
 expect(surveyRequirement("zookeeper","event","dev").bucket).toBe("conditional");
});
test("Redis configuration → binding → startup caller opens exact source and keeps breadcrumb/history without marking readiness",async({page})=>{
 await task(page);await select(page,"redis");await button(page,"Ai sử dụng cấu hình này?").click();
 const code=detail(page).locator(".survey-code");await expect(code.locator(".survey-file")).toContainText("SpringCacheConfig");
 await expect(code.getByTestId("highlighted-code")).toHaveAttribute("data-ready","true");await expect(code).toContainText("Redisson.create(config)");
 const binding=page.url();await button(page,"Lần đến nơi gọi / điều kiện").click();await expect(code).toContainText("rlock.lock");await expect(code).toContainText("InitConfig.java:173");
 await page.goBack();await expect(page).toHaveURL(binding);await expect(code).toContainText("SpringCacheConfig.java:22");
 await page.goForward();await page.reload();await expect(code).toContainText("InitConfig.java:173");
 await button(page,"Xem kết luận và cần chuẩn bị gì").click();await expect(detail(page).locator(".survey-conclusion")).toContainText("Cần chuẩn bị");
 const sim=JSON.parse(new URL(page.url()).searchParams.get("psim")!);expect(sim.readyEvidence??[]).toEqual([]);expect(sim.containers??{}).toEqual({});expect(sim.process??"idle").toBe("idle");expect(sim.surveyRead).toContain("redis");
});
test("gaps and non-server links remain explicit; Query client does not borrow platform-query config and no caller is invented",async({page})=>{
 await task(page);await select(page,"platform-query");await button(page,"Ai sử dụng cấu hình này?").click();
 await expect(detail(page).locator(".survey-code")).toContainText("system.sp-query.api");await expect(detail(page)).toContainText("Không tự coi hai khóa là một");
 await button(page,"Lần đến nơi gọi / điều kiện").click();await expect(detail(page).locator(".survey-gap")).toContainText("Chưa tìm thấy trong phạm vi khảo sát");
 await select(page,"zookeeper");await button(page,"Ai sử dụng cấu hình này?").click();await expect(detail(page).locator(".survey-gap")).toContainText("Chưa tìm thấy");
 await select(page,"assessment");await conclude(page);await expect(detail(page).locator(".survey-conclusion")).toContainText("Không nằm trong đường gọi");await expect(detail(page)).toContainText("không có HTTP call");
 await select(page,"navigation");await conclude(page);await expect(detail(page)).toContainText("Không đưa các link này vào số service BE");
});
test("provider choices are educational, remote access is distinct from local startup and candidate Java main has limits",async({page})=>{
 await task(page);await practice(page).getByLabel("Mục tiêu chạy",{exact:true}).selectOption("auth");await select(page,"sso");await conclude(page);await expect(detail(page).locator(".survey-preparation")).toContainText("Source đang khai báo đích từ xa");
 await expect(detail(page)).toContainText("không đồng nghĩa phải tạo container local");
 await detail(page).getByLabel("Nơi cung cấp dịch vụ",{exact:true}).selectOption("java");await button(page,"Xem main class ứng dụng ứng viên").click();
 await expect(detail(page).locator(".survey-code")).toContainText("SsoServerApplication");
 await select(page,"platform-query");await conclude(page);await detail(page).getByLabel("Nơi cung cấp dịch vụ",{exact:true}).selectOption("docker");
 await expect(detail(page).locator(".survey-preparation")).toContainText("chưa cấp lệnh khởi động");await expect(detail(page).getByRole("button",{name:/Chuẩn bị.*Docker/})).toHaveCount(0);
 await detail(page).getByLabel("Nơi cung cấp dịch vụ",{exact:true}).selectOption("java");await button(page,"Xem main class ứng dụng ứng viên").click();await expect(detail(page).locator(".survey-code")).toContainText("AgentQueryServiceApplication");
});
test("Docker preparation and return preserve goal, group, provider, source and simulated container state",async({page})=>{
 await task(page,{jdk:21,daemon:true,desktopOpen:true});await select(page,"postgres");await conclude(page);
 await detail(page).getByLabel("Nơi cung cấp dịch vụ",{exact:true}).selectOption("docker");const before=page.url();
 await button(page,"Chuẩn bị postgres-write trong Docker").click();await expect(page).toHaveURL(/task=daemon/);await expect(practice(page).getByLabel("Service trong Compose",{exact:true})).toHaveValue("postgres-write");
 await expect(practice(page).getByTestId("docker-empty")).toBeVisible();await createContainer(page);
 await button(page,"Quay lại khảo sát dependency").click();await expect(page).toHaveURL(/task=connections/);await expect(detail(page).getByLabel("Nơi cung cấp dịch vụ",{exact:true})).toHaveValue("docker");
 await expect(practice(page).getByLabel("Mục tiêu chạy",{exact:true})).toHaveValue("startup");
 const sim=JSON.parse(new URL(page.url()).searchParams.get("psim")!);expect(sim.containers["postgres-write"]).toBe("running");expect(sim.readyEvidence??[]).toEqual([]);
 await page.goto(before);await expect(detail(page).getByLabel("Nơi cung cấp dịch vụ",{exact:true})).toHaveValue("docker");expect(JSON.parse(new URL(page.url()).searchParams.get("psim")!).containers??{}).toEqual({});
});
test("Kafka links to its own Compose service, Zookeeper remains indirect and usage graph only draws evidenced calls",async({page})=>{
 await task(page,{daemon:true,desktopOpen:true});await practice(page).getByLabel("Mục tiêu chạy",{exact:true}).selectOption("event");await select(page,"kafka");await conclude(page);
 await detail(page).getByLabel("Nơi cung cấp dịch vụ",{exact:true}).selectOption("docker");await button(page,"Chuẩn bị kafka trong Docker").click();
 await expect(practice(page).getByLabel("Service trong Compose",{exact:true})).toHaveValue("kafka");await expect(practice(page).locator(".compose-source")).toContainText("Zookeeper");
 await button(page,"Quay lại khảo sát dependency").click();await select(page,"zookeeper");
 await detail(page).locator(".survey-graph-disclosure summary").click();const graph=detail(page).locator(".survey-usage-graph");await expect(graph.locator(".react-flow__edge")).toHaveCount(3);
 await expect(detail(page)).toContainText("Không có cạnh Java → Zookeeper trực tiếp");
 await graph.locator('.react-flow__node[data-id="2"]').click();await expect(detail(page).locator(".survey-code")).toContainText("docker-compose-env.yml");
 await select(page,"platform-query");await expect(detail(page).locator(".survey-usage-graph .react-flow__edge")).toHaveCount(0);
 await select(page,"kafka");await expect(detail(page).locator(".survey-usage-graph")).toContainText("có subscription");
 await detail(page).locator('.survey-usage-graph .react-flow__node[data-id="0"]').click();await expect(detail(page).locator(".survey-file")).toContainText("AgentCommandServiceApplication.java:14");
});
test("build/run/summary integrate without changing run profile or losing old progress",async({page})=>{
 await task(page,{jdk:21,sdk:21,language:21,gradleJvm:21,synced:true});
 await practice(page).getByLabel("Mục tiêu chạy",{exact:true}).selectOption("build");await button(page,"Mở bài build module Command").click();await expect(page).toHaveURL(/task=build-task/);
 await chooseTaskInStep(page,"G1");await select(page,"platform-command");await practice(page).getByLabel("Mục tiêu chạy",{exact:true}).selectOption("auth");await conclude(page);
 await detail(page).getByLabel("Nơi cung cấp dịch vụ",{exact:true}).selectOption("java");await button(page,"Xem Run Configuration Command hiện có").click();await expect(page).toHaveURL(/task=run-config/);
 await button(page,"Quay lại khảo sát dependency").click();await expect(detail(page)).toContainText("Base có thể gọi lại chính Command");
 await chooseTaskInStep(page,"J2");await expect(practice(page).locator(".survey-summary")).toContainText("Gọi API có xác thực");
});
test("mobile evidence is readable, original lines remain visible and unsupported module scope does not show Command data",async({page})=>{
 await page.setViewportSize({width:390,height:844});await task(page,{dependency:"redis"});await button(page,"Ai sử dụng cấu hình này?").click();
 const code=detail(page).locator(".survey-code");await expect(code.getByTestId("highlighted-code")).toHaveAttribute("data-ready","true");await expect(code.locator('[data-line="22"]')).toBeInViewport();
 expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
 await page.reload();await expect(detail(page).locator(".survey-file")).toContainText("SpringCacheConfig.java:22");
 await practice(page).getByLabel("Module khảo sát",{exact:true}).selectOption("flow");await expect(practice(page).locator(".connection-unverified")).toBeVisible();await expect(practice(page).locator(".dependency-survey")).toHaveCount(0);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
});

test("business proof links open the requested symbol; Docker reset preserves survey while survey reset preserves other lessons",async({page})=>{
 await task(page,{surveyGoal:"document",jdk:21,build:"module-success",containers:{redis:"running"},surveyRead:["redis"],surveyProviders:{redis:"docker"}});
 await practice(page).locator(".survey-business-links").getByRole("button",{name:"SaleUnitController · class request mapping",exact:true}).click();
 await expect(detail(page).locator(".survey-file")).toContainText("SaleUnitController.java:33");
 await expect(detail(page).locator('[data-line="33"]')).toBeInViewport();
 await chooseTaskInStep(page,"G2");await button(page,"Làm lại phần này").click();
 let sim=JSON.parse(new URL(page.url()).searchParams.get("psim")!);expect(sim.surveyGoal).toBe("document");expect(sim.surveyRead).toEqual(["redis"]);expect(sim.build).toBe("module-success");expect(sim.containers).toBeUndefined();
 await chooseTaskInStep(page,"G1");await button(page,"Làm lại phần này").click();
 sim=JSON.parse(new URL(page.url()).searchParams.get("psim")!);expect(sim.surveyGoal).toBeUndefined();expect(sim.surveyRead).toBeUndefined();expect(sim.jdk).toBe(21);expect(sim.build).toBe("module-success");
 await practice(page).getByLabel("Module khảo sát",{exact:true}).selectOption("query");await expect(practice(page).locator(".connection-unverified")).toContainText("Query");await chooseTaskInStep(page,"J2");
 await expect(practice(page).locator(".survey-summary")).toContainText("Query • profile dev");await expect(practice(page).locator(".survey-summary")).toContainText("Chưa có bài khảo sát cho phạm vi này");
});
