import {expect,test} from "@playwright/test";
import type {Page,Locator} from "@playwright/test";
import {readFile} from "node:fs/promises";
import {createHash} from "node:crypto";
import source from "../../src/content/setup/practice-infrastructure-source.json" with {type:"json"};
import {infraEdges,serviceCatalog} from "../../src/setup/infrastructure-model";
import {practice,ideWalk,dockerWalk,conflictWalk,createContainer} from "./runtime-helpers";
const button=(page:Page,name:string)=>practice(page).getByRole("button",{name,exact:true});
async function task(page:Page,id:string,sim:object={}){
  await page.goto(`/journey/environment?${new URLSearchParams({experience:"project",task:id,pprofile:"dev",psim:JSON.stringify(sim)})}`);
  await expect(practice(page)).toBeVisible();
}
async function rowVisible(panel:Locator,line:number){
  const row=panel.locator(`[data-line="${line}"]`).first();
  await expect(row).toHaveAttribute("data-focus-line","true");
  await expect.poll(()=>row.evaluate(element=>{const scroller=element.closest('[data-testid="code-scroll"]')!;const a=element.getBoundingClientRect(),b=scroller.getBoundingClientRect();return a.top>=b.top-1&&a.bottom<=b.bottom+1;})).toBe(true);
}
test("full sanitized configuration retains original lines, edge evidence and service mappings", {tag:"@source"},async()=>{
  for(const file of [...source.files,...source.evidence]){
    const raw=await readFile(`D:/ALPACA/agent-system/${file.path}`,"utf8");
    expect(createHash("sha256").update(raw).digest("hex")).toBe(file.sourceSha256);
    for(const row of file.rows)if(!row.text.includes("đã che")&&!row.text.includes("[HTTP]"))expect(row.text).toBe(raw.split(/\r?\n/)[row.line-1]);
  }
  const compose=source.files.find(f=>f.id==="compose")!;
  for(const service of serviceCatalog)expect(compose.rows.find(r=>r.line===service.line)?.text.trim()).toBe(`${service.id}:`);
  for(const edge of infraEdges){const file=edge.proof==="compose"?compose:source.evidence.find(e=>e.id===edge.proof)!;for(const line of edge.lines)expect(file.rows.some(r=>r.line===line)).toBe(true);}
  expect(infraEdges.map(e=>`${e.source}:${e.target}`)).not.toContain("postgres-write:postgres-read");
  expect(JSON.stringify(source)).not.toMatch(/jdbc:postgresql:\/\/|redis:\/\/|https?:\/\/|Alpaca#|glpat-|sqp_/);
  for(const f of source.files)for(const r of f.rows){if(/(?:password|username|client-secret):\s*\S/.test(r.text))expect(r.text).toContain("[đã che]");}
});
test("IntelliJ existing JDK route separates dialogs and preserves terminal, history and hints",async({page})=>{
  await task(page,"ide",{jdk:17});
  await expect(practice(page).locator(".ide-reference")).toContainText("2026.3");
  await expect(practice(page).locator(".ide-shell .ide-located")).toHaveCount(0);
  await button(page,"Chỉ vị trí").click();
  await expect(practice(page).locator('[data-ide-action="file"]')).toHaveClass(/ide-located/);
  await expect(button(page,"Tiếp tục")).toBeDisabled();
  await ideWalk(page);
  await expect(practice(page).locator(".ide-practice")).toContainText("terminal JDK 17");
  const finished=page.url();await page.goBack();await expect(practice(page).locator(".ide-mission")).toContainText("Xem kết quả");
  await page.goForward();await expect(page).toHaveURL(finished);await page.reload();
  await expect(practice(page).locator(".ide-practice .runtime-result")).toContainText("Gradle JVM 21");
});
for(const branch of ["disk","download"] as const)test(`IntelliJ missing JDK branch: ${branch}, no installation`,async({page})=>{
  await task(page,"ide",{jdk:21});await ideWalk(page,branch);
  await expect(button(page,"Tiếp tục")).toBeEnabled();
  await expect(practice(page).locator(".ide-practice .runtime-result")).toContainText("Chưa build/chạy Java");
});
test("each connection synchronizes Java, Compose and container; original highlighted line is visible after references",async({page})=>{
  await page.setViewportSize({width:1280,height:1000});
  await task(page,"connections",{daemon:true,containers:{"postgres-write":"running"}});
  for(const [name,id,line,port] of [["PostgreSQL write","postgres",33,80],["Redis","redis",119,70],["RabbitMQ","rabbit",52,8]] as const){
    await button(page,`Xem cấu hình ${name}`).click();
    await expect(practice(page).locator(".connection-status")).toContainText("Chưa xác nhận kết nối Java");
    const java=practice(page).getByRole("article",{name:"Cấu hình Java",exact:true});
    const compose=practice(page).getByRole("article",{name:"Cấu hình Compose",exact:true});
    await rowVisible(java,line);await rowVisible(compose,port);
    await compose.getByRole("button",{name:`Chọn dòng ${port}`,exact:true}).click();
    await button(page,"Mở tham chiếu Java trong cây").click();
    const viewer=practice(page).locator(".practice-viewer");await rowVisible(viewer,line);
    await expect(viewer.locator(`[data-line="${line}"]`)).toBeInViewport({ratio:1});
    await viewer.getByTestId("code-scroll").evaluate(e=>e.scrollTop=e.scrollHeight);
    await button(page,"Mở tham chiếu Compose trong cây").click();await rowVisible(viewer,port);
    await page.goBack();await rowVisible(viewer,line);
    await practice(page).locator(".runtime-view-tabs").getByRole("button",{name:"Thao tác và kết quả",exact:true}).click();
    await expect(button(page,`Xem cấu hình ${name}`)).toHaveAttribute("aria-pressed","true");
    expect(new URL(page.url()).searchParams.get("psim")).toContain(id);
  }
  await button(page,"Xem cấu hình PostgreSQL write").click();
  await expect(practice(page).getByRole("article",{name:"Cấu hình Java",exact:true})).toContainText("DOCKER_HOST_IP");
  await practice(page).getByText("Cấu hình hiệu lực, kế thừa và override",{exact:true}).click();
  await expect(practice(page).locator(".connection-overrides")).toContainText("SPRING_DATASOURCE_URL");
  await page.screenshot({path:".verification/labs-connections-desktop.png",fullPage:true});
  await page.goto('/journey/environment?experience=project&task=connections&pprofile=base&psim={"dependency":"postgres"}');
  await expect(practice(page).locator(".connection-practice")).toContainText("không khớp đích đó");
});
test("Java startup waits for saved configuration and Docker state and never infers a verified connection",async({page})=>{
 const config={step:"saved",draftProfile:"dev",applied:true,saved:true};
 await task(page,"startup",{jdk:21,mainSelected:true,runSetup:config,daemon:true});await button(page,"Run Command").click();
 await expect(practice(page).locator(".command-process-status")).toContainText("Chưa khởi động");await expect(practice(page).locator(".command-missing")).toContainText("PostgreSQL write");
 await task(page,"startup",{jdk:21,mainSelected:true,runSetup:config,daemon:true,containers:{"postgres-write":"running"},readyEvidence:["postgres-write"]});await button(page,"Run Command").click();
 await expect(practice(page).locator(".command-process-status")).toContainText("đang chạy");await practice(page).locator(".command-state-details>summary").click();await expect(practice(page).locator(".command-state-details")).toContainText("từng dependency hoặc API");
});

test("Docker Engine, container process, readiness and Java connection remain distinct across tasks and summary",async({page})=>{
  await task(page,"daemon");await expect(practice(page).locator(".docker-version")).toContainText("không truy cập được");
  await practice(page).locator(".docker-practice").screenshot({path:".verification/labs-docker-before.png"});
  await button(page,"Mở Docker Desktop trong mô phỏng").click();
  await expect(practice(page).locator(".docker-desktop")).toContainText("Engine: Starting");
  await button(page,"Chờ Engine và kiểm tra lại docker version").click();
  const engine=page.url();await expect(practice(page).locator(".docker-version")).toContainText("Server: Docker Engine");
  await expect(practice(page).locator(".docker-table .container-running")).toHaveCount(0);
  await expect(button(page,"Tiếp tục")).toBeDisabled();
  await practice(page).locator(".docker-practice").screenshot({path:".verification/labs-docker-engine-ready.png"});
  await createContainer(page);
  await expect(practice(page).locator(".docker-evidence")).toContainText("Chưa xác nhận");
  await expect(practice(page).locator(".docker-inspector")).toContainText("Java: chưa xác nhận kết nối");
  await button(page,"database system is ready to accept connections").click();await expect(button(page,"Tiếp tục")).toBeEnabled();
  await practice(page).locator(".docker-practice").screenshot({path:".verification/labs-docker-container-running.png"});
  await createContainer(page,"redis");await expect(practice(page).locator(".docker-evidence")).toContainText("Chưa xác nhận");
  await page.reload();await expect(practice(page).locator(".docker-table .container-running")).toHaveCount(2);
  await practice(page).getByRole("button",{name:/^J2 /}).click();
  await practice(page).locator(".command-state-details>summary").click();await expect(practice(page).locator(".execution-state")).toContainText("running");await expect(practice(page).locator(".command-state-details")).toContainText("từng dependency hoặc API");
  await page.goto(engine);await expect(practice(page).locator(".docker-table .container-running")).toHaveCount(0);
  await button(page,"Làm lại phần này").click();await expect(practice(page).locator(".docker-version")).toContainText("không truy cập được");
});
test("conflict discovery distinguishes names from host ports before offering an evidence-based plan",async({page})=>{
  await task(page,"conflict");await expect(practice(page).locator(".conflict-decision")).toHaveCount(0);
  await button(page,"Thử tạo/chạy trong bài học").click();await button(page,"Mở Docker Desktop mô phỏng").click();
  await button(page,"Đối chiếu tên hiện hữu metrics-helper").click();await expect(practice(page).getByRole("note")).toContainText("chưa giải thích lỗi");
  await button(page,"Đối chiếu tên hiện hữu rebrow").click();await expect(practice(page).getByRole("note")).toContainText("Container dừng vẫn giữ tên");
  await button(page,"Cần · kiểm tra instance hiện có").click();await button(page,"Chạy lại kế hoạch trong bài").click();await expect(button(page,"Tiếp tục")).toBeDisabled();
  await expect(practice(page).locator(".conflict-reuse")).toContainText("phạm vi dữ liệu");
  await button(page,"Làm lại phần này").click();await conflictWalk(page);
  await expect(button(page,"Tiếp tục")).toBeEnabled();
  await expect(practice(page).locator(".conflict-outcome")).toContainText("Readiness");
});
test("workspace infrastructure opens on demand, distinguishes evidence and restores scope via history",async({page})=>{
  await task(page,"connections");const panel=practice(page).locator(".infrastructure-panel");
  await expect(panel.locator(".react-flow")).toHaveCount(0);
  await panel.locator("summary").click();await expect(panel.locator(".react-flow")).toBeVisible();
  await panel.getByRole("button",{name:"Toàn workspace",exact:true}).click();const all=page.url();
  await panel.locator(".infrastructure-relations button").filter({hasText:"query → postgres-read"}).click();
  await expect(panel.locator(".infrastructure-proof")).toContainText("application-dev.yml:33");
  await panel.getByRole("button",{name:"Command",exact:true}).click();await expect(panel.locator(".infra-dim")).not.toHaveCount(0);
  await page.goBack();await expect(panel.getByRole("button",{name:"Toàn workspace",exact:true})).toHaveAttribute("aria-pressed","true");
  await page.goto(all);await expect(panel.getByRole("button",{name:"Toàn workspace",exact:true})).toHaveAttribute("aria-pressed","true");
  await panel.screenshot({path:".verification/labs-workspace-infrastructure.png"});
  await panel.locator("summary").click();await panel.locator("summary").click();
  await expect(panel.getByRole("button",{name:"Toàn workspace",exact:true})).toHaveAttribute("aria-pressed","true");
});
test("visiting approved A–E tasks preserves shared container state and returning connection context",async({page})=>{
  await task(page,"connections",{daemon:true,containers:{redis:"running"},dependency:"redis"});
  await practice(page).locator(".practice-task-nav button").first().click();
  await expect(page).toHaveURL(/task=root/);
  expect(JSON.parse(new URL(page.url()).searchParams.get("psim")!).containers.redis).toBe("running");
  const root=page.url();await practice(page).getByRole("button",{name:/^G1 /}).click();
  await expect(button(page,"Xem cấu hình Redis")).toHaveAttribute("aria-pressed","true");
  await expect(practice(page).locator(".connection-status")).toContainText("running");
  const connection=page.url();await page.goBack();await expect(page).toHaveURL(root);
  await page.goForward();await expect(page).toHaveURL(connection);await page.reload();
  await expect(practice(page).locator(".connection-status")).toContainText("running");
  await practice(page).getByRole("button",{name:/^G2 /}).click();
  await expect(practice(page).getByRole("row",{name:"Chọn container redis",exact:true})).toContainText("running");
});
test("mobile 390px supports the complete IDE route and stacked connection comparison without overflow",async({page})=>{
  test.setTimeout(60000);await page.setViewportSize({width:390,height:844});await task(page,"ide",{jdk:21});await ideWalk(page,"disk");
  expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
  await task(page,"connections",{dependency:"redis",daemon:true});
  const pair=practice(page).getByTestId("connection-pair");const articles=pair.locator(":scope > article");
  const a=await articles.nth(0).boundingBox(),b=await articles.nth(1).boundingBox();expect(b!.y).toBeGreaterThan(a!.y+a!.height-1);
  await rowVisible(articles.first(),119);await rowVisible(articles.nth(1),70);
  await expect.poll(()=>articles.first().getByRole("button",{name:"Chọn dòng 119",exact:true}).evaluate(element=>{const range=document.createRange();range.selectNodeContents(element);return range.getClientRects().length;})).toBe(1);
  await page.screenshot({path:".verification/labs-mobile-comparison.png",fullPage:true});
  await practice(page).locator(".infrastructure-panel>summary").click();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
  await task(page,"daemon");await dockerWalk(page);expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
});
