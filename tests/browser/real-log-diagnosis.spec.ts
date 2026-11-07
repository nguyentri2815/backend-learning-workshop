import {test,expect} from "@playwright/test";
import type {Page} from "@playwright/test";
import {readingRows,errorBlockMatches} from "../../src/setup/real-log-practice-model";
import {normalizeSimulation} from "../../src/setup/practice-runtime-model";
import {practice} from "./runtime-helpers";

const reader=(page:Page)=>practice(page).getByRole("region",{name:"Bài tập đọc log thật",exact:true});
const lesson=(page:Page)=>reader(page).getByRole("region",{name:"Câu đang học",exact:true});
const inspector=(page:Page)=>reader(page).getByRole("region",{name:"Dòng đang xem",exact:true});
const diagnosis=(page:Page)=>reader(page).getByRole("region",{name:"Luồng chẩn đoán",exact:true});
const search=(page:Page)=>reader(page).getByRole("search",{name:"Tìm trong console",exact:true});
const line=(page:Page,n:number)=>reader(page).locator(`[data-startup-line="${n}"]`);
const button=(page:Page,name:string)=>reader(page).getByRole("button",{name,exact:true});
const stored=(page:Page)=>page.evaluate(()=>JSON.parse(localStorage.getItem("backend-learning-workshop.real-log-reading.v1")!));
const sim=(page:Page)=>normalizeSimulation(JSON.parse(new URL(page.url()).searchParams.get("psim")??"{}"));
async function atThree(page:Page){
 await page.goto(`/journey/environment?${new URLSearchParams({experience:"project",task:"startup",readlog:"1",psim:JSON.stringify({commandCase:{id:"redis-connect",branch:"address"}})})}`);
 for(const n of [3205,3499]){await line(page,n).click();await lesson(page).getByRole("button",{name:"Tiếp tục bài học",exact:true}).click();}
 await expect(lesson(page)).toContainText("Đang học · 3/14");
}
async function begin(page:Page){
 await line(page,3205).click();await button(page,"Lần nguyên nhân lỗi này").click();
 await expect(diagnosis(page)).toContainText("Xác nhận trạng thái");
 await expect(line(page,3205)).toHaveAttribute("data-log-evidence","true");await expect(line(page,3499)).toHaveAttribute("data-log-evidence","true");
 await button(page,"Tìm Caused by trong console").click();await expect(search(page).getByRole("textbox")).toBeFocused();
 await search(page).getByRole("textbox").fill("Caused by:");
 await expect(reader(page).locator(".startup-console>[data-log-current-match=true]")).toHaveCount(1);
}
async function match(page:Page,n:number){
 for(let i=0;i<10;i++){
  if(await reader(page).locator(".startup-console>[data-log-current-match=true]").getAttribute("data-startup-line")===String(n))return;
  await search(page).getByRole("button",{name:"Kết quả sau",exact:true}).click();
 }
 throw Error(`Did not reach match ${n}`);
}
async function findRedis(page:Page){
 await match(page,3432);await line(page,3432).click();await expect(inspector(page)).toContainText("127.0.0.1:6379");
 await match(page,3469);await line(page,3469).click();await expect(inspector(page).getByRole("heading")).toHaveText("Kết nối Redis bị từ chối");
 await expect(reader(page).getByRole("region",{name:"Kết luận từ log thật"})).toContainText("Command đã kết nối PostgreSQL và khởi tạo JPA. Startup dừng khi Redisson kết nối Redis. Process đã thoát.");
}
async function redisCheck(page:Page,branch:"stopped"|"port"){
 await diagnosis(page).getByRole("button",{name:"Kiểm tra Redis",exact:true}).click();
 const check=diagnosis(page).getByRole("region",{name:"Kiểm tra Redis",exact:true});
 await expect(check).toContainText("đúng máy đang chạy Command");await expect(check).toContainText("True: chỉ xác nhận TCP thông");
 await button(page,"Chọn kiểm tra TCP tới Redis").click();await button(page,branch==="stopped"?"Redis chưa chạy · Giả lập":"Redis chạy nhưng cổng host khác · Giả lập").click();
 await expect(check.getByRole("table")).toHaveCount(0);await button(page,"Chạy kiểm tra TCP · Giả lập").click();await expect(check.getByLabel("Kết quả TCP ban đầu")).toContainText("False");
 await button(page,"Xem Status / Ports · Giả lập").click();await expect(check.getByRole("table")).toContainText(branch==="stopped"?"Exited":"16379");
 if(branch==="stopped"){
  await button(page,"Khởi động container đã chọn · Giả lập").click();await expect(check.getByRole("status")).toContainText("Chọn đúng");
  await button(page,"command-redis-practice").click();await button(page,"Khởi động container đã chọn · Giả lập").click();
 }else{
  await expect(check).toContainText("Command hiện dùng 127.0.0.1:6379");await check.getByRole("textbox").fill("16379");await button(page,"Áp dụng cấu hình giả lập").click();
 }
 await button(page,`Kiểm tra lại cổng ${branch==="port"?16379:6379} · Giả lập`).click();await expect(check.getByLabel("Kết quả TCP sau xử lý")).toContainText("True");
 return check;
}

test("search reads folded source rows only after the current failure block and isolates simulated failures",()=>{
 const rows=readingRows("failure","stopped");
 const matches=errorBlockMatches([{line:1,text:"Caused by: unrelated older error",group:"outcome",level:"CAUSE"},...rows],"Caused by:");
 expect(matches.map(row=>row.line)).toEqual([3229,3245,3274,3317,3373,3432,3453,3468,3469]);
 expect(errorBlockMatches(rows,"CAUSED BY:").map(row=>row.line)).toEqual(matches.map(row=>row.line));
 expect(()=>errorBlockMatches(rows,"[")).not.toThrow();expect(errorBlockMatches(rows,"")).toEqual([]);
 expect(errorBlockMatches(readingRows("retry","port","next-error"),"Caused by:").map(row=>row.line)).toEqual([3]);
});

test("question 3 → inspect failure → search folded causes → check Redis → retry → return to question 3",async({page})=>{
 test.setTimeout(90000);await atThree(page);const original=sim(page);
 await line(page,3205).click();await expect(inspector(page)).toContainText("Đang xem L3205 · Kết quả khởi động");await expect(inspector(page).getByRole("heading")).toHaveText("Command khởi động thất bại");
 await expect(lesson(page).getByRole("heading")).toContainText("Java");await expect(lesson(page)).toContainText("3/14");
 await expect(lesson(page)).toContainText("Đang khám phá L3205");await expect(lesson(page)).not.toContainText("Application run failed báo startup thất bại");
 await expect(line(page,3373)).toHaveCount(0);await begin(page);
 await expect(search(page).getByRole("status")).toContainText("1/9 · L3229");
 await match(page,3373);await expect(line(page,3373)).toBeVisible();await expect(line(page,3373).locator("mark")).toHaveText("Caused by:");
 await expect(reader(page).getByRole("checkbox",{name:"Mở rộng DEBUG và stack trace"})).not.toBeChecked();
 await search(page).getByRole("button",{name:"Kết quả trước",exact:true}).click();await expect(line(page,3317)).toHaveAttribute("data-log-current-match","true");
 await line(page,3206).click();await expect(inspector(page).getByRole("heading")).toContainText("queueHandler bị ảnh hưởng");await inspector(page).getByRole("button",{name:"Xem nguyên nhân bên dưới",exact:true}).click();await expect(line(page,3229)).toBeFocused();
 await line(page,3274).click();await expect(inspector(page)).toContainText("cacheManager bị ảnh hưởng");await inspector(page).getByRole("button",{name:"Xem nguyên nhân bên dưới",exact:true}).click();await expect(line(page,3317)).toBeFocused();
 await findRedis(page);
 for(const [name,n] of [["PostgreSQL đã kết nối · L183–184",183],["JPA đã khởi tạo · L280",280],["Process đã thoát · L3499",3499]] as const){await button(page,name).click();await expect(line(page,n)).toBeFocused();}
 await redisCheck(page,"stopped");await button(page,"Thử lại Command · Giả lập").click();await expect(reader(page).locator(".startup-provenance")).toContainText("Giả lập");
 for(const n of [1,2,3]){await line(page,n).click();await diagnosis(page).getByRole("button",{name:n===3?"Hoàn tất lần thử lại":"Tiếp tục đọc log mới",exact:true}).click();}
 await expect(diagnosis(page)).toContainText("Đã tìm đủ ba bằng chứng mới");
 await button(page,"Thử nhánh Redis còn lại").click();await button(page,"Redis chạy nhưng cổng host khác · Giả lập").click();await button(page,"Chạy kiểm tra TCP · Giả lập").click();await expect(reader(page).getByLabel("Kết quả TCP ban đầu")).toContainText("False");
 await button(page,"Quay lại câu đang học").click();await expect(diagnosis(page)).toHaveCount(0);await expect(lesson(page)).toContainText("Đang học · 3/14");await expect(lesson(page).getByRole("heading")).toContainText("Java");
 await expect(lesson(page).getByRole("button",{name:"Tiếp tục bài học",exact:true})).toBeDisabled();expect(sim(page)).toEqual(original);
 await line(page,112).click();await lesson(page).getByRole("button",{name:"Tiếp tục bài học",exact:true}).click();await expect(lesson(page)).toContainText("Đang học · 4/14");
});

test("different host port is inspected first; a new blocker is read in its own simulated block",async({page})=>{
 test.setTimeout(90000);await atThree(page);await begin(page);await findRedis(page);const check=await redisCheck(page,"port");
 await check.getByRole("radio",{name:"Redis đã qua nhưng dừng ở lỗi khác",exact:true}).check();await button(page,"Thử lại Command · Giả lập").click();
 await expect(line(page,1)).toContainText("127.0.0.1:16379");await expect(line(page,3432)).toHaveCount(0);
 await line(page,1).click();await diagnosis(page).getByRole("button",{name:"Tiếp tục đọc log mới",exact:true}).click();
 await line(page,2).click();await expect(inspector(page).getByRole("heading")).toHaveText("Command khởi động thất bại");await inspector(page).getByRole("button",{name:"Đọc khối lỗi mới",exact:true}).click();
 await expect(diagnosis(page)).toContainText("Điểm chặn đã thay đổi");await search(page).getByRole("textbox").fill("Caused by:");await expect(search(page).getByRole("status")).toContainText("1/1 · SIM3");
 await line(page,3).click();await expect(inspector(page)).toContainText("Redis đã qua; cổng 9901 đang bị chiếm");await expect(diagnosis(page)).toContainText("Kiểm tra process sở hữu cổng");await button(page,"SIM4 · Process mới đã thoát").click();await expect(line(page,4)).toBeFocused();
 expect(await reader(page).locator(".startup-console").textContent()).not.toMatch(/Tomcat started|Started AgentCommandServiceApplication/);
 await button(page,"Quay lại câu đang học").click();await expect(lesson(page)).toContainText("Đang học · 3/14");
});

test("diagnosis and the saved question survive reload; unmatched search and punctuation remain usable on mobile",async({page})=>{
 await page.setViewportSize({width:390,height:844});await atThree(page);await begin(page);
 await search(page).getByRole("textbox").fill("no-such-cause");await expect(search(page).getByRole("status")).toContainText("Không có kết quả");await expect(search(page).getByRole("button",{name:"Kết quả sau",exact:true})).toBeDisabled();
 await search(page).getByRole("textbox").fill("[");await search(page).getByRole("textbox").fill("Caused by:");await findRedis(page);await page.reload();
 await expect(diagnosis(page)).toBeVisible();await expect(reader(page).getByRole("region",{name:"Kết luận từ log thật"})).toBeVisible();await expect(lesson(page)).toContainText("3/14");
 expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
 await button(page,"Quay lại câu đang học").click();await expect(lesson(page).getByRole("heading")).toContainText("Java");expect((await stored(page)).failureStep).toBe(2);
});

test("diagnosis returns to any saved question without resetting course progress or a previously found answer",async({page})=>{
 await atThree(page);await line(page,112).click();
 // An already answered question remains answered when a different log line is inspected.
 await line(page,3205).click();await button(page,"Lần nguyên nhân lỗi này").click();await button(page,"Quay lại câu đang học").click();
 await expect(lesson(page).getByRole("button",{name:"Tiếp tục bài học",exact:true})).toBeEnabled();
 await page.evaluate(()=>{const key="backend-learning-workshop.real-log-reading.v1",value=JSON.parse(localStorage.getItem(key)!);localStorage.setItem(key,JSON.stringify({...value,failureStep:8,doneBranches:["stopped"]}));});await page.reload();
 await expect(lesson(page)).toContainText("9/14");await line(page,3205).click();await button(page,"Lần nguyên nhân lỗi này").click();await button(page,"Quay lại câu đang học").click();await expect(lesson(page)).toContainText("9/14");
 const progress=await stored(page);expect(progress.failureStep).toBe(8);expect(progress.doneBranches).toEqual(["stopped"]);
});
