import {test,expect} from "@playwright/test";
import type {Page} from "@playwright/test";
import source from "../../src/content/setup/real-log-practice-source.json" with {type:"json"};
import {normalizeSimulation} from "../../src/setup/practice-runtime-model";
import {practice} from "./runtime-helpers";

const lesson=(page:Page)=>practice(page).getByRole("region",{name:"Bài tập đọc log thật",exact:true});
const guide=(page:Page)=>lesson(page).getByRole("complementary",{name:"Hướng dẫn cạnh console"});
const button=(page:Page,name:string)=>lesson(page).getByRole("button",{name,exact:true});
const line=(page:Page,n:number)=>lesson(page).locator(`[data-startup-line="${n}"]`);
async function open(page:Page,sim:object={}){
 await page.goto(`/journey/environment?${new URLSearchParams({experience:"project",task:"startup",psim:JSON.stringify(sim)})}`);
 await practice(page).getByRole("button",{name:"Tập đọc log thật",exact:true}).click();
 await expect(lesson(page)).toBeVisible();
}
async function answer(page:Page,n:number,last="Tiếp tục bài học"){
 await line(page,n).click();await expect(guide(page).locator(".reading-feedback[data-answer=correct]")).toBeVisible();await button(page,last).click();
}
async function solveFailure(page:Page){
 for(const n of [3205,3499,112,114,183,280,331,3206,3229,3245,3274,3317,3432])await answer(page,n);
 // The address line alone does not answer the question about the error type.
 await line(page,3432).click();await expect(guide(page).getByRole("status")).toContainText("dịch vụ Redis và địa chỉ");
 await answer(page,3469,"Kiểm tra Redis");
}
async function retryEvidence(page:Page){for(const n of [1,2])await answer(page,n);await answer(page,3,"Hoàn tất lần thử lại");await expect(guide(page)).toContainText("Đã tìm đủ ba bằng chứng mới");}

test("07/11 excerpts preserve real milestones, cause chain, privacy and original line numbers",()=>{
 const at=(n:number)=>source.rows.find(row=>row.line===n)!.text;
 expect(source.sourceLines).toBe(3499);expect(source.sourceSha256).toMatch(/^[a-f0-9]{64}$/);
 for(const [n,pattern] of [[112,/Java 21/],[114,/default/],[183,/PgConnection/],[280,/Initialized JPA/],[331,/Tomcat initialized/],[3205,/Application run failed/],[3206,/queueHandler/],[3229,/sharedGlobalConfigService/],[3245,/platformCacheConfig/],[3274,/cacheManager/],[3317,/redissonClient/],[3432,/Redis server: localhost\/127.0.0.1:6379/],[3469,/ConnectException: Connection refused/],[3499,/exit code 1/]] as const)expect(at(n)).toMatch(pattern);
 expect(JSON.stringify(source)).not.toMatch(/nguye|[CD]:\\|password\s*[=:]|Bearer /i);
 expect(source.rows.some(row=>/Tomcat started|Started AgentCommandServiceApplication/.test(row.text))).toBe(false);
});

test("wrong result → hint → exact Redis cause → stopped container → retry and host-port branch",async({page})=>{
 test.setTimeout(120000);await open(page);const original=new URL(page.url()).searchParams.get("psim");
 await expect(lesson(page).locator(".startup-provenance")).toContainText("07/11/2026");
 await expect(lesson(page).locator("[data-level=DEBUG]")).toHaveCount(0);
 await line(page,331).click();await expect(lesson(page).getByRole("region",{name:"Dòng đang xem"})).toContainText("giai đoạn chuẩn bị");
 await line(page,350).click();await expect(lesson(page).getByRole("region",{name:"Dòng đang xem"})).toContainText("dọn pool");
 await button(page,"Gợi ý tìm dòng").click();await expect(line(page,3205)).toBeFocused();await expect(line(page,3205)).toHaveAttribute("data-log-hint","true");await expect(button(page,"Tiếp tục bài học")).toBeDisabled();
 await solveFailure(page);
 await button(page,"Chỉ kiểm tra lại PostgreSQL").click();await expect(guide(page).getByRole("status")).toContainText("đúng địa chỉ Redis");
 await button(page,"Chọn kiểm tra TCP tới Redis").click();await button(page,"Redis chưa chạy · Giả lập").click();await button(page,"Chạy kiểm tra TCP · Giả lập").click();
 await expect(lesson(page).getByLabel("Kết quả TCP ban đầu")).toContainText("False");await button(page,"Xem Status / Ports · Giả lập").click();
 await expect(lesson(page).getByRole("table")).toContainText("Exited");await button(page,"redis-other").click();await button(page,"Khởi động container đã chọn · Giả lập").click();await expect(guide(page).getByRole("status")).toContainText("Chọn đúng");
 await button(page,"command-redis-practice").click();await button(page,"Khởi động container đã chọn · Giả lập").click();await button(page,"Kiểm tra lại cổng 6379 · Giả lập").click();await expect(lesson(page).getByLabel("Kết quả TCP sau xử lý")).toContainText("True");
 await button(page,"Thử lại Command · Giả lập").click();await expect(lesson(page).locator(".startup-provenance")).toContainText("Giả lập");await retryEvidence(page);
 await button(page,"Thử nhánh Redis còn lại").click();await button(page,"Redis chạy nhưng cổng host khác · Giả lập").click();await button(page,"Chạy kiểm tra TCP · Giả lập").click();await button(page,"Xem Status / Ports · Giả lập").click();
 await expect(lesson(page).getByRole("table")).toContainText("16379");await button(page,"Áp dụng cấu hình giả lập").click();await expect(guide(page).getByRole("status")).toContainText("host port 16379");
 await lesson(page).getByLabel("Cổng Redis cấu hình giả lập").fill("16379");await button(page,"Áp dụng cấu hình giả lập").click();await button(page,"Kiểm tra lại cổng 16379 · Giả lập").click();await button(page,"Thử lại Command · Giả lập").click();await expect(line(page,1)).toContainText("127.0.0.1:16379");await retryEvidence(page);
 await expect(lesson(page).locator(".reading-footer")).toContainText("2/2 nhánh");expect(new URL(page.url()).searchParams.get("psim")).toBe(original);
 await button(page,"Về Run / Stop").click();await expect(practice(page).getByLabel("Phiên log startup")).toBeVisible();
});

test("recorded success distinguishes initialized, started, current process and API; reading resumes",async({page})=>{
 await open(page);await button(page,"Phiên thành công · đã lưu").click();await expect(lesson(page).locator(".startup-provenance")).toContainText("04/11/2026");
 await expect(lesson(page).locator(".startup-provenance")).not.toContainText("từ chối");
 await line(page,16101).click();await expect(lesson(page).getByRole("region",{name:"Dòng đang xem"})).toContainText("Tomcat started");await answer(page,16134);await answer(page,18989);
 await button(page,"Chỉ cần dòng Started đã lưu").click();await expect(guide(page).getByRole("status")).toContainText("thoát sau đó");await button(page,"Xem trạng thái process và cuối console Run").click();await button(page,"Tiếp tục bài học").click();
 await button(page,"Mọi API đã đúng vì startup thành công").click();await expect(guide(page).getByRole("status")).toContainText("request");await button(page,"Chưa; cần gửi request và kiểm tra status/body").click();await button(page,"Hoàn tất đối chiếu").click();
 await button(page,"Về Run / Stop").click();await page.reload();await practice(page).getByRole("button",{name:"Tập đọc log thật",exact:true}).click();await expect(guide(page)).toContainText("Đã đối chiếu phiên thành công");
 await page.reload();await expect(guide(page)).toContainText("Đã đối chiếu phiên thành công");await expect(page).toHaveURL(/readlog=1/);
 await button(page,"Phiên lỗi · 07/11").click();await expect(guide(page)).toContainText("Dòng nào xác nhận startup thất bại?");
});

test("group limits, expanded original trace, narrow viewport and entry after completed I2 retain the previous case",async({page})=>{
 await page.addInitScript(()=>localStorage.setItem("backend-learning-workshop.project-practice.v1",JSON.stringify({version:1,current:"startup",contexts:{},seen:["daemon:ready"],completed:["daemon","startup"]})));
 await page.setViewportSize({width:390,height:844});await open(page,{commandCase:{id:"redis-connect",branch:"address"}});const before=new URL(page.url()).searchParams.get("psim");
 const nav=lesson(page).getByRole("navigation",{name:"Nhóm hoạt động startup"});
 await nav.getByRole("button",{name:/Eventuate/}).click();await expect(lesson(page).getByLabel("Ba câu đọc nhóm log")).toContainText("Chưa có bằng chứng consumer");
 await nav.getByRole("button",{name:/Bootstrap owner/}).click();await expect(lesson(page).getByLabel("Ba câu đọc nhóm log")).toContainText("không có dòng xác nhận");
 await lesson(page).getByLabel("Mở rộng DEBUG và stack trace").check();await expect(line(page,113)).toContainText("Spring Boot");await expect(line(page,3207)).toContainText("ConstructorResolver");await expect(line(page,3206)).toContainText("redissonClient");
 await lesson(page).getByLabel("Mở rộng DEBUG và stack trace").uncheck();await button(page,"Gợi ý tìm dòng").click();await expect(line(page,3205)).toBeFocused();expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
 await answer(page,3205);await button(page,"Về Run / Stop").click();expect(new URL(page.url()).searchParams.get("psim")).toBe(before);
 await practice(page).getByRole("button",{name:"Tập đọc log thật",exact:true}).click();await expect(guide(page)).toContainText("Dòng nào xác nhận process đã thoát?");
 const guideBox=await guide(page).boundingBox(),navBox=await nav.boundingBox();expect(guideBox!.y).toBeLessThan(navBox!.y);
 await page.setViewportSize({width:1512,height:1050});await expect(guide(page)).toContainText("Dòng nào xác nhận process đã thoát?");
 const progress=await page.evaluate(()=>JSON.parse(localStorage.getItem("backend-learning-workshop.project-practice.v1")!));expect(progress.completed).toEqual(expect.arrayContaining(["daemon","startup"]));
});

test("opening the reader during a running session preserves Run / Stop and the selected case",async({page})=>{
 await page.goto(`/journey/environment?${new URLSearchParams({experience:"project",task:"startup",psim:JSON.stringify({commandCase:{id:"redis-connect",branch:"address",phase:"resolved",checked:true,repaired:true},process:"running",commandSession:{id:9,shown:3,playback:{reference:"configured",frame:4,caseId:"redis-connect",caseRepaired:true,caseBranch:"address"}}})})}`);
 await expect(practice(page).getByRole("button",{name:"Stop Command",exact:true})).toBeEnabled();
 const original=normalizeSimulation(JSON.parse(new URL(page.url()).searchParams.get("psim")??"{}"));
 await practice(page).getByRole("button",{name:"Tập đọc log thật",exact:true}).click();await expect(lesson(page)).toBeVisible();await button(page,"Về Run / Stop").click();
 expect(normalizeSimulation(JSON.parse(new URL(page.url()).searchParams.get("psim")??"{}"))).toEqual(original);
 await practice(page).getByRole("button",{name:"Stop Command",exact:true}).click();await expect(practice(page).getByRole("button",{name:"Stop Command",exact:true})).toBeDisabled();
});
