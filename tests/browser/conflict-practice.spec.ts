import {test,expect} from "@playwright/test";
import type {Page} from "@playwright/test";
import {conflictForeign,conflictService,emptyConflictCase,runConflict} from "../../src/setup/conflict-lab-model";
import {normalizeSimulation} from "../../src/setup/practice-runtime-model";
import {PRACTICE_KEY} from "../../src/setup/project-practice-model";
import {practice} from "./runtime-helpers";
const button=(page:Page,name:string)=>practice(page).getByRole("button",{name,exact:true});
const field=(page:Page,name:string)=>practice(page).getByLabel(name,{exact:true});
const state=(page:Page)=>JSON.parse(new URL(page.url()).searchParams.get("psim")!);
async function task(page:Page,sim:object={}){await page.goto(`/journey/environment?${new URLSearchParams({experience:"project",task:"conflict",pprofile:"dev",psim:JSON.stringify(sim)})}`);await expect(practice(page).locator(".conflict-practice")).toBeVisible();}
async function investigate(page:Page,kind:"name"|"port"){
 await button(page,"Thử tạo/chạy trong bài học").click();await button(page,"Mở Docker Desktop mô phỏng").click();
 await button(page,kind==="name"?"Đối chiếu tên hiện hữu rebrow":"Đối chiếu host port định dùng").click();
 await expect(practice(page).locator(".conflict-decision")).toBeVisible();
}
async function edit(page:Page,values:{name?:string;port?:string}){
 await button(page,"Cần · tạo instance riêng").click();
 if(values.name)await field(page,"Tên container trong bản mô phỏng").fill(values.name);
 if(values.port)await field(page,"Host port trong bản mô phỏng").fill(values.port);
 await button(page,"Áp dụng bản mô phỏng").click();
}

test("source plans use actual Compose ports and names; name failure precedes create while port failure preserves created container",()=>{
 const expected={"postgres-write":5432,redis:6379,rabbitmq:5672,kafka:9092,zookeeper:2181,rebrow:5001};
 for(const [id,port] of Object.entries(expected)){const plan=conflictService(id as keyof typeof expected);expect(plan.port).toBe(port);expect(plan.rows.some(row=>row.text.includes(`${port}:`))).toBe(true);}
 const name=runConflict("name",emptyConflictCase(),"postgres-write");expect(name.result).toBe("name-conflict");expect(name.created).toEqual([]);
 const port=runConflict("port",emptyConflictCase(),"postgres-write");expect(port.result).toBe("port-conflict");expect(port.created).toEqual([{name:"sale-platform-postgres-write-1",port:5432,state:"created"}]);
 const foreign=conflictForeign("name",conflictService("rebrow"));expect(foreign[0].state).toBe("stopped");
 const wrongName=runConflict("name",{...name,strategy:"separate",hostPort:15001},"postgres-write");expect(wrongName.result).toBe("name-conflict");
 const wrongPort=runConflict("port",{...port,strategy:"separate",name:"postgres-learning"},"postgres-write");expect(wrongPort.result).toBe("port-conflict");
 const anotherCause=runConflict("name",{...name,strategy:"separate",name:"rebrow-learning",hostPort:9090},"postgres-write");expect(anotherCause.result).toBe("port-conflict");expect(anotherCause.created[0].state).toBe("created");
 const fullLab={...anotherCause,name:"seventh-container",created:Array.from({length:6},(_,i)=>({name:`attempt-${i}`,port:15000+i,state:"created" as const}))};
 const bounded=runConflict("name",fullLab,"postgres-write");expect(bounded.stage).toBe("edit");expect(bounded.created).toEqual(fullLab.created);expect(bounded.created[0].name).toBe("attempt-0");
 const legacy=normalizeSimulation({conflict:"selective",conflictResolved:["name","port"],jdk:21,conflictLab:{port:{attempts:0,result:"running",name:"<injected>",hostPort:99999}}});
 expect(legacy.conflictResolved).toHaveLength(2);expect(legacy.conflictLab.port.result).toBe("none");expect(legacy.conflictLab.port.created).toEqual([]);expect(legacy.jdk).toBe(21);
});

test("name conflict starts with an action; changing only port fails again, changing name produces a visible running container",async({page})=>{
 await task(page);await expect(practice(page).locator(".conflict-practice")).toContainText("không phải dependency bắt buộc");
 await expect(practice(page).locator(".conflict-error,.conflict-evidence,.conflict-decision")).toHaveCount(0);
 await button(page,"Thử tạo/chạy trong bài học").click();await expect(practice(page).locator(".conflict-error mark")).toHaveText("rebrow");
 await expect(practice(page).locator(".conflict-error")).toContainText("chưa được tạo");
 await button(page,"Mở Docker Desktop mô phỏng").click();await button(page,"Đối chiếu host port hiện hữu 5001").click();
 await expect(practice(page).locator(".conflict-decision")).toHaveCount(0);
 await button(page,"Đối chiếu tên hiện hữu rebrow").click();await expect(practice(page).locator(".conflict-match")).toHaveCount(2);
 await edit(page,{port:"15001"});await expect(practice(page).getByTestId("conflict-after")).toContainText("15001");
 await expect(practice(page).locator(".conflict-java-note")).toContainText("cổng UI Rebrow");await button(page,"Chạy lại kế hoạch trong bài").click();
 await expect(practice(page).locator(".conflict-error")).toContainText("Lần thử 2");expect(state(page).conflictLab.name.created).toEqual([]);
 await button(page,"Mở Docker Desktop mô phỏng").click();await button(page,"Đối chiếu tên hiện hữu rebrow").click();
 await edit(page,{name:"rebrow-learning"});await expect(practice(page).getByTestId("conflict-after").locator(".conflict-changed")).toHaveCount(2);
 await button(page,"Chạy lại kế hoạch trong bài").click();await expect(practice(page).locator(".conflict-outcome")).toContainText("lỗi đã hết");
 await expect(practice(page).getByTestId("existing-rebrow")).toContainText("stopped");await expect(practice(page).getByTestId("created-rebrow-learning")).toContainText("running");
 await expect(practice(page).locator(".conflict-outcome")).toContainText("kết nối Java với Redis vẫn cần kiểm tra riêng");
});

test("port conflict creates but cannot start; renaming fails, port correction and Java reference survive Back then retry",async({page})=>{
 await task(page,{conflictCase:"port",daemon:true,containers:{"postgres-write":"stopped"},jdk:21,surveyGroup:"postgres"});
 await investigate(page,"port");await expect(practice(page).getByTestId("existing-pg-analytics")).toContainText("running");
 await expect(practice(page).getByTestId("created-sale-platform-postgres-write-1")).toContainText("created");
 await edit(page,{name:"postgres-learning"});await button(page,"Chạy lại kế hoạch trong bài").click();
 await expect(practice(page).locator(".conflict-error mark")).toHaveText("5432");expect(state(page).conflictLab.port.created).toHaveLength(2);
 await button(page,"Mở Docker Desktop mô phỏng").click();await button(page,"Đối chiếu host port hiện hữu 5432").click();await edit(page,{port:"15432"});
 await button(page,"Xem cấu hình Java cần đối chiếu").click();await expect(practice(page).locator(".conflict-java-source")).toContainText("application-dev.yml:33");
 const prepared=page.url();await button(page,"Mở tham chiếu Java trong cây").click();await expect(page).toHaveURL(/pview=source/);
 await page.goBack();await expect(page).toHaveURL(prepared);await expect(practice(page).getByTestId("conflict-after")).toContainText("15432");
 await button(page,"Chạy lại kế hoạch trong bài").click();await expect(practice(page).getByTestId("created-postgres-learning")).toContainText("running");
 await expect(practice(page).getByTestId("existing-pg-analytics")).toContainText("running");
 expect(state(page).containers).toEqual({"postgres-write":"stopped"});expect(state(page).readyEvidence??[]).toEqual([]);expect(state(page).process??"idle").toBe("idle");
 await practice(page).getByRole("button",{name:/^J2 /}).click();await expect(practice(page).locator(".conflict-summary")).toContainText("postgres-learning running · 15432 (G3)");
});

test("skipping optional service changes plan before retry and leaves existing containers plus other lessons intact",async({page})=>{
 await task(page,{composeService:"redis",containers:{redis:"running"},daemon:true,build:"module-success",jdk:21,surveyGoal:"auth"});
 await investigate(page,"name");await button(page,"Không cần · bỏ khỏi danh sách chạy").click();
 await expect(practice(page).locator(".conflict-revised")).toContainText("đã bỏ khỏi danh sách");expect(state(page).conflictResolved??[]).toEqual([]);
 await button(page,"Chạy lại kế hoạch trong bài").click();await expect(practice(page).locator(".conflict-outcome")).toContainText("Không tạo/chạy thêm");
 expect(state(page).conflictLab.name.created).toEqual([]);expect(state(page).containers).toEqual({redis:"running"});expect(state(page).build).toBe("module-success");expect(state(page).surveyGoal).toBe("auth");
 await expect(practice(page).getByTestId("existing-rebrow")).toContainText("stopped");
});

for(const kind of ["name","port"] as const)test(`reuse ${kind} shows missing evidence and retry stays pending without starting someone else's container`,async({page})=>{
 await task(page,{conflictCase:kind});await investigate(page,kind);await button(page,"Cần · kiểm tra instance hiện có").click();
 await expect(practice(page).locator(".conflict-reuse")).toContainText("chưa xác nhận tương thích");await expect(practice(page).locator(".conflict-reuse")).toContainText("phạm vi dữ liệu");
 await button(page,"Chạy lại kế hoạch trong bài").click();await expect(practice(page).locator(".conflict-outcome")).toContainText("chờ kiểm tra");
 expect(state(page).conflictLab[kind].result).toBe("pending");expect(state(page).conflictResolved??[]).toEqual([]);expect(state(page).containers??{}).toEqual({});
 await expect(button(page,"Tiếp tục")).toBeDisabled();
});

test("two cases keep independent snapshots, Back/Forward and reload; reset clears only G3 and retains older progress",async({page})=>{
 await page.addInitScript(key=>localStorage.setItem(key,JSON.stringify({version:1,current:"conflict",contexts:{},seen:["root:settings"],completed:["root","ide","build-task"]})),PRACTICE_KEY);
 await task(page,{jdk:21,build:"module-success",containers:{redis:"running"},surveyGroup:"redis",surveyRead:["redis"],surveyGoal:"event"});
 await investigate(page,"name");await edit(page,{name:"rebrow-learning"});const ready=page.url();await button(page,"Chạy lại kế hoạch trong bài").click();const running=page.url();
 await page.goBack();await expect(page).toHaveURL(ready);await expect(practice(page).getByTestId("created-rebrow-learning")).toHaveCount(0);
 await page.goForward();await expect(page).toHaveURL(running);await page.reload();await expect(practice(page).getByTestId("created-rebrow-learning")).toContainText("running");
 await button(page,"Tình huống 2 · host port").click();await expect(practice(page).locator(".conflict-error")).toHaveCount(0);await investigate(page,"port");
 await button(page,"Không cần · bỏ khỏi danh sách chạy").click();await button(page,"Chạy lại kế hoạch trong bài").click();await expect(button(page,"Tiếp tục")).toBeEnabled();
 await practice(page).getByRole("button",{name:/^Tình huống 1/}).click();await expect(practice(page).getByTestId("created-rebrow-learning")).toContainText("running");
 expect(new URL(page.url()).searchParams.get("psim")!.length).toBeLessThan(6000);
 await button(page,"Làm lại phần này").click();await expect(button(page,"Thử tạo/chạy trong bài học")).toBeVisible();
 expect(state(page).conflictLab).toBeUndefined();expect(state(page).jdk).toBe(21);expect(state(page).surveyRead).toEqual(["redis"]);expect(state(page).containers).toEqual({redis:"running"});
 const progress=await page.evaluate(key=>JSON.parse(localStorage.getItem(key)!),PRACTICE_KEY);expect(progress.completed).toEqual(expect.arrayContaining(["root","ide","build-task"]));expect(progress.completed).not.toContain("conflict");
});

test("port example follows the previous Compose service and Redis Java check covers all three configuration keys",async({page})=>{
 await task(page,{composeService:"redis",conflictCase:"port"});await expect(practice(page).locator(".conflict-initial-plan")).toContainText("redis");
 await investigate(page,"port");await expect(practice(page).locator(".conflict-error mark")).toHaveText("6379");
 await edit(page,{port:"16379"});await button(page,"Xem cấu hình Java cần đối chiếu").click();
 await expect(practice(page).locator(".conflict-java-source")).toContainText("cache.redis-persistent");await expect(practice(page).locator(".conflict-java-source")).toContainText("cache.redis-session");
 await button(page,"Chạy lại kế hoạch trong bài").click();await expect(practice(page).getByTestId("created-redis")).toContainText("16379");
});

test("mobile keeps evidence, configuration edits and retry visible without horizontal overflow",async({page})=>{
 await page.setViewportSize({width:390,height:844});await task(page);await investigate(page,"name");
 await expect(practice(page).locator(".conflict-decision h4")).toBeInViewport();
 const columns=practice(page).locator(".conflict-evidence-columns>article");const old=await columns.nth(0).boundingBox(),planned=await columns.nth(1).boundingBox();expect(planned!.y).toBeGreaterThan(old!.y+old!.height);
 await edit(page,{name:"rebrow-learning"});await button(page,"Chạy lại kế hoạch trong bài").click();await expect(practice(page).locator(".conflict-outcome h4")).toBeInViewport();
 expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
 await button(page,"Tình huống 2 · host port").click();await investigate(page,"port");await edit(page,{port:"15432"});await button(page,"Chạy lại kế hoạch trong bài").click();
 expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
});

test("RabbitMQ investigates AMQP rather than UI port and rejects duplicate mappings inside the service",async({page})=>{
 await task(page,{composeService:"rabbitmq",conflictCase:"port"});await investigate(page,"port");
 await expect(practice(page).locator(".conflict-error mark")).toHaveText("5672");await button(page,"Cần · tạo instance riêng").click();
 await field(page,"Host port trong bản mô phỏng").fill("15672");await button(page,"Áp dụng bản mô phỏng").click();
 await expect(field(page,"Host port trong bản mô phỏng")).toHaveJSProperty("validationMessage","Host port này đã thuộc mapping khác của chính service. Chọn cổng khác.");
 await field(page,"Host port trong bản mô phỏng").fill("15673");await button(page,"Áp dụng bản mô phỏng").click();
 await expect(practice(page).getByTestId("conflict-after")).toContainText("15672:15672");await button(page,"Xem cấu hình Java cần đối chiếu").click();
 await expect(practice(page).locator(".conflict-java-source")).toContainText("spring.rabbitmq.port");await expect(practice(page).locator(".conflict-java-note")).toContainText("AMQP");
 await button(page,"Chạy lại kế hoạch trong bài").click();await expect(practice(page).getByTestId("created-rabbitmq")).toContainText("running");
});
