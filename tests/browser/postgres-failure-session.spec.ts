import {test,expect} from "@playwright/test";
import type {Page} from "@playwright/test";
import source from "../../src/content/setup/postgres-failure-log-source.json" with {type:"json"};
import {errorBlockMatches,inspectLogLine,postgresChainComplete,readingRows} from "../../src/setup/real-log-practice-model";
import {practice} from "./runtime-helpers";

const sessionName="08/11 · dev · PostgreSQL từ chối kết nối";
const reader=(page:Page)=>practice(page).getByRole("region",{name:"Bài tập đọc log thật",exact:true});
const lesson=(page:Page)=>reader(page).getByRole("region",{name:"Câu đang học",exact:true});
const inspector=(page:Page)=>reader(page).getByRole("region",{name:"Dòng đang xem",exact:true});
const route=(page:Page)=>reader(page).getByRole("region",{name:"Lần đường kết nối PostgreSQL",exact:true});
const line=(page:Page,n:number)=>reader(page).locator(`[data-startup-line="${n}"]`);
const search=(page:Page)=>reader(page).getByRole("search",{name:"Tìm trong console",exact:true});
const button=(page:Page,name:string)=>reader(page).getByRole("button",{name,exact:true});
const next=(page:Page)=>lesson(page).getByRole("button",{name:"Tiếp tục bài học",exact:true});
async function open(page:Page){
 await page.goto(`/journey/environment?${new URLSearchParams({experience:"project",task:"startup",readlog:"1",psim:JSON.stringify({commandCase:{id:"redis-connect",branch:"address"}})})}`);
 await button(page,sessionName).click();await expect(lesson(page)).toBeVisible();
}
async function match(page:Page,n:number){
 for(let i=0;i<40;i++){
  if(await reader(page).locator('.startup-console>[data-log-current-match="true"]').getAttribute("data-startup-line")===String(n))return;
  await search(page).getByRole("button",{name:"Kết quả sau",exact:true}).click();
 }
 throw Error(`Did not reach Caused by at L${n}`);
}

test("08/11 source preserves original evidence, redaction and the boundary between early refusal and final cause chain",()=>{
 expect(source.sourceLines).toBe(4950);
 expect(source.sourceSha256).toBe("2ce3bad902def90a90319d003c45c3660c7f39714bbabf59ea17bee92bf3a961");
 const at=(n:number)=>source.rows.find(row=>row.line===n)!.text;
 for(const [n,text] of [[114,'profile is active: "dev"'],[182,"HikariPool-1 - Starting..."],[377,"Connection to localhost:5432 refused"],[3377,"Application run failed"],[4083,"bean with name 'entityManagerFactory'"],[4375,"Unable to open JDBC Connection"],[4547,"Connection to localhost:5432 refused"],[4939,"non-zero exit value 1"],[4949,"BUILD FAILED"]] as const)expect(at(n)).toContain(text);
 expect(JSON.stringify(source.rows)).not.toMatch(/nguye|\b[CD]:[\\/]|password\s*[=:]|Bearer |[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);
 expect(source.rows.some(row=>/Added connection|Initialized JPA|Tomcat started|Started AgentCommand/.test(row.text))).toBe(false);
 expect(source.contextNote).toContain("do người chạy cung cấp");
 const rows=readingRows("postgres-failure","stopped");
 expect(errorBlockMatches(rows,"L114","all").map(row=>row.line)).toEqual([114]);
 expect(errorBlockMatches(rows,"L377","all").map(row=>row.line)).toEqual([377]);
 const causes=errorBlockMatches(rows,"Caused by:");expect(causes[0].line).toBe(3399);
 expect(causes.every(row=>row.line>3377)).toBe(true);
 expect(causes.map(row=>row.line)).toEqual(expect.arrayContaining([4083,4375,4547]));
 expect(postgresChainComplete([3377,3399,4083,4375,377])).toBe(false);
 expect(postgresChainComplete([3377,3399,4083,4375,4547])).toBe(true);
 expect(inspectLogLine("postgres-failure",rows,182)?.meaning).toMatch(/chưa có Added connection/i);
 expect(inspectLogLine("postgres-failure",rows,377)?.meaning).toContain("trước khi xác thực");
});

test("08/11 selector → L114/L377 → Caused by → PostgreSQL route → same question → Gradle exit and comparison",async({page})=>{
 test.setTimeout(120000);await open(page);const original=new URL(page.url()).searchParams.get("psim");
 await expect(reader(page).locator(".startup-provenance")).toContainText("log-2.txt");
 await expect(reader(page).locator(".reading-context-note")).toContainText("đã chủ động tắt Docker");
 await search(page).getByRole("textbox").pressSequentially("L114");await expect(search(page).getByRole("textbox")).toBeFocused();await expect(line(page,114)).toHaveAttribute("data-log-current-match","true");
 await expect(next(page)).toBeDisabled();await line(page,114).click();await expect(inspector(page)).toContainText('Profile "dev" đang active');await next(page).click();
 await expect(lesson(page)).toContainText("2/4");await line(page,182).click();await expect(next(page)).toBeDisabled();
 await expect(lesson(page).locator(".reading-feedback")).toContainText("chưa có kết nối thành công");
 await search(page).getByRole("textbox").fill("L377");await line(page,377).click();
 await expect(inspector(page)).toContainText("trước khi xác thực");await next(page).click();
 await expect(lesson(page)).toContainText("3/4");await line(page,3377).click();
 await expect(next(page)).toBeDisabled();await search(page).getByRole("textbox").fill("Caused by:");
 await expect(search(page)).toContainText("sau L3377");
 for(const n of [3399,4083,4375,4547]){await match(page,n);await line(page,n).click();}
 await expect(next(page)).toBeEnabled();await expect(lesson(page).locator(".reading-feedback")).toContainText("thành phần bị ảnh hưởng");
 await line(page,377).click();await button(page,"Lần đường kết nối PostgreSQL từ L377").click();
 await expect(route(page).locator(".postgres-effective-status")).toContainText("Đích đã được log xác nhận: localhost:5432");
 await expect(route(page).locator('[data-startup-line="183"]')).toHaveCount(0);
 await button(page,"Lần về cấu hình DB").click();
 await expect(route(page)).toContainText('profile is active: "dev"');
 const yaml=route(page).getByRole("figure",{name:"application-dev.yml · ví dụ dev trong repo"});
 await expect(yaml.locator('[data-source-line="33"]')).toHaveAttribute("data-source-highlight","true");
 await expect(yaml).toContainText('${DOCKER_HOST_IP:localhost}/alpaca-event');
 await button(page,"Xem vị trí trong Run Configuration").click();
 await expect(route(page).getByRole("region",{name:"Cấu hình lần Run PostgreSQL"})).toContainText("SPRING_DATASOURCE_URL");
 await expect(route(page).getByRole("table",{name:"YAML, lần Run và phần chưa xác nhận"})).toContainText("chưa chứng minh không có ghi đè");
 await button(page,"Phân biệt DB local với DB từ xa").click();
 await expect(route(page).locator(".redis-docker-window")).toHaveCount(0);
 await button(page,"Xem cách kiểm tra cổng trên máy chạy Command").click();
 await expect(route(page).getByRole("region",{name:"Kiểm tra đích đã được log xác nhận"})).toContainText("Test-NetConnection localhost -Port 5432");
 await button(page,"Nếu PostgreSQL của bài chạy bằng Docker").click();
 await expect(route(page).getByRole("figure",{name:"Compose trong repo · service postgres-write"})).toContainText("postgres-write");
 await route(page).getByRole("radio",{name:"15432:5432",exact:true}).check();
 await expect(route(page).locator(".postgres-simulated-target")).toContainText("localhost:15432");
 await expect(route(page).locator(".postgres-effective-status")).toContainText("localhost:5432");
 await button(page,"Áp dụng vào phiên thật").click();
 await route(page).getByRole("radio",{name:"Connection refused đủ chứng minh Docker đang tắt",exact:true}).check();
 await expect(button(page,"Hoàn tất và quay lại câu đang học")).toBeDisabled();
 await route(page).getByRole("radio",{name:"Kiểm tra cổng trên máy chạy Command; đối chiếu Docker nếu DB của bài chạy bằng Docker",exact:true}).check();
 await button(page,"Hoàn tất và quay lại câu đang học").click();
 await expect(lesson(page)).toContainText("3/4");await expect(lesson(page).getByRole("heading")).toBeFocused();await expect(next(page)).toBeEnabled();
 await expect(search(page).getByRole("textbox")).toHaveValue("Caused by:");
 await next(page).click();await expect(lesson(page)).toContainText("4/4");
 await button(page,"Gợi ý tìm dòng").click();await expect(line(page,4939)).toBeFocused();
 await line(page,4939).click();await expect(lesson(page).locator(".reading-feedback")).toContainText("Java đã bắt đầu chạy");
 await lesson(page).getByRole("button",{name:"Đối chiếu hai phiên",exact:true}).click();
 const comparison=lesson(page).getByRole("table",{name:"Đối chiếu hai phiên lỗi"});
 await expect(comparison.getByRole("row").filter({hasText:"07/11"})).toContainText("Chưa biết host/port từ log");
 await expect(comparison.getByRole("row").filter({hasText:"08/11"})).toContainText("DB");
 expect(new URL(page.url()).searchParams.get("psim")).toBe(original);
 await button(page,"Xem lại phiên 07/11 · default").click();await expect(lesson(page)).toContainText("1/14");
 await button(page,sessionName).click();await expect(lesson(page)).toContainText("Đã đọc xong phiên 08/11");
});

test("mobile reload keeps the 08/11 cause cursor and route separate from the 07/11 bookmark and unknown address",async({page})=>{
 test.setTimeout(90000);await page.setViewportSize({width:390,height:844});
 await page.addInitScript(()=>{
  const key="backend-learning-workshop.real-log-reading.v1";
  if(!localStorage.getItem(key)){
   localStorage.setItem(key,JSON.stringify({version:1,session:"failure",failureStep:4,postgresStep:2}));
   localStorage.setItem("backend-learning-workshop.postgres-route.v1",JSON.stringify({version:1,step:2,envSet:true}));
  }
 });
 await open(page);await line(page,3377).click();await line(page,3378).click();
 await button(page,"Lần đường kết nối PostgreSQL từ L377").click();await button(page,"Lần về cấu hình DB").click();await page.reload();
 await expect(route(page)).toContainText('profile is active: "dev"');
 await expect(route(page).locator(".postgres-effective-status")).toContainText("localhost:5432");
 expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
 await button(page,"Quay lại bài đọc log").click();await expect(lesson(page)).toContainText("3/4");
 await expect(lesson(page).getByLabel("Lần chuỗi lỗi Eventuate và JPA")).toContainText("✓ Đọc thành phần Eventuate");
 await button(page,"Gợi ý tìm dòng").click();await expect(line(page,4083)).toBeFocused();await expect(next(page)).toBeDisabled();
 await button(page,"Phiên lỗi · 07/11").click();await expect(lesson(page)).toContainText("5/14");
 await line(page,183).click();await inspector(page).getByRole("button",{name:"Lần đường kết nối PostgreSQL",exact:true}).click();
 await expect(route(page)).toContainText('default profile: "default"');
 await expect(route(page).locator(".postgres-effective-status")).toContainText("Chưa biết địa chỉ hiệu lực");
 await expect(route(page).getByRole("radio",{name:"Đã đặt DOCKER_HOST_IP=postgres.lab.example",exact:true})).toBeChecked();
 await button(page,"Quay lại bài đọc log").click();await button(page,sessionName).click();await expect(lesson(page)).toContainText("3/4");
 await expect(lesson(page).getByLabel("Lần chuỗi lỗi Eventuate và JPA")).toContainText("✓ Đọc thành phần Eventuate");
 expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
});
