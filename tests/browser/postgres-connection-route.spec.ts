import {test,expect} from "@playwright/test";
import type {Page} from "@playwright/test";
import source from "../../src/content/setup/postgres-route-source.json" with {type:"json"};
import {realLogSource} from "../../src/setup/real-log-practice-model";
import {practice} from "./runtime-helpers";

const reader=(page:Page)=>practice(page).getByRole("region",{name:"Bài tập đọc log thật",exact:true});
const route=(page:Page)=>reader(page).getByRole("region",{name:"Lần đường kết nối PostgreSQL",exact:true});
const button=(page:Page,name:string)=>route(page).getByRole("button",{name,exact:true});
const line=(page:Page,n:number)=>reader(page).locator(`[data-startup-line="${n}"]`);
const lesson=(page:Page)=>reader(page).getByRole("region",{name:"Câu đang học",exact:true});
async function open(page:Page){
 await page.goto(`/journey/environment?${new URLSearchParams({experience:"project",task:"startup",readlog:"1",psim:JSON.stringify({commandCase:{id:"redis-connect",branch:"address"}})})}`);
 await expect(reader(page)).toBeVisible();
}
async function enter(page:Page){
 await line(page,183).click();await reader(page).getByRole("button",{name:"Lần đường kết nối PostgreSQL",exact:true}).click();
 await expect(route(page)).toBeVisible();
}
async function seedQuestionFive(page:Page){
 await page.addInitScript(()=>{
  const key="backend-learning-workshop.real-log-reading.v1";
  if(!localStorage.getItem(key))localStorage.setItem(key,JSON.stringify({version:1,session:"failure",failureStep:4}));
 });
}

test("PostgreSQL excerpts retain the conditional request read, entity mapping, redacted YAML and original L187",()=>{
 const text=(id:keyof typeof source.refs)=>source.refs[id].rows.map(row=>row.text).join("\n");
 expect(text("controller")).toContain('getAllConfig()');
 expect(text("service")).toContain('@Component');
 expect(text("service")).toContain('if (allConfig.isEmpty())');
 expect(text("service")).toContain('configRepository.findAll()');
 expect(text("repository")).toContain('extends JpaRepository<ConfigAggregate, String>');
 expect(text("entity")).toContain('@Table(name = "config_aggregate")');
 expect(text("base")).toContain('jdbc:postgresql://[host đã che]/rnd');
 expect(text("dev")).toContain('jdbc:postgresql://${DOCKER_HOST_IP:localhost}/alpaca-event');
 expect(text("compose")).toContain('postgres-write:');expect(text("compose")).toContain('5432:5432');
 for(const ref of Object.values(source.refs))expect(ref.sha256).toMatch(/^[a-f0-9]{64}$/);
 expect(JSON.stringify(source)).not.toMatch(/nguye|\b[CD]:\\|password\s*[=:]|username\s*[=:]|Bearer |\b(?:\d{1,3}\.){3}\d{1,3}\b/i);
 expect(realLogSource.sourceSha256).toBe('671639be3f5a570032af0479fd8822ad499f977f1adab6dca579b48a627bada6');
 const jdbc=realLogSource.rows.find(row=>row.line===187)!;
 expect(jdbc.text).toBe("\tDatabase JDBC URL [Connecting through datasource 'HikariDataSource (HikariPool-1)']");
 expect(jdbc.text).not.toContain('jdbc:postgresql://');expect(jdbc.group).toBe('data');
});

test("question 5/14 → L183 → source and config → local/remote → return to the same answered question",async({page})=>{
 test.setTimeout(90000);await open(page);
 for(const n of [3205,3499,112,114]){
  await line(page,n).click();await reader(page).getByRole("button",{name:"Tiếp tục bài học",exact:true}).click();
 }
 await expect(lesson(page)).toContainText("5/14");
 const original=new URL(page.url()).searchParams.get("psim");await enter(page);
 await button(page,"Ai dùng kết nối này?").click();
 await expect(route(page)).toContainText("Luồng này xảy ra khi xử lý request.");
 const service=route(page).getByRole("figure",{name:"Service nghiệp vụ gọi repository khi cache rỗng"});
 await expect(service.locator('[data-source-line="49"]')).toHaveAttribute("data-source-highlight","true");
 await expect(service).toContainText("configRepository.findAll()");
 for(const n of [183,184,280])await route(page).locator(`[data-startup-line="${n}"]`).click();
 await expect(route(page).locator(".redis-node-explanation")).toContainText("cần bằng chứng riêng");
 await button(page,"Lần về cấu hình DB").click();await expect(route(page)).toContainText('default profile: "default"');
 for(const name of ["application.yml · giá trị trong YAML đã che host","application-dev.yml · ví dụ dev trong repo"]){
  await expect(route(page).getByRole("figure",{name}).locator('[data-source-line="33"]')).toHaveAttribute("data-source-highlight","true");
 }
 await expect(route(page).locator(".postgres-resolved-url")).toContainText("jdbc:postgresql://localhost/alpaca-event");
 await route(page).getByRole("radio",{name:"Đã đặt DOCKER_HOST_IP=postgres.lab.example",exact:true}).check();
 await expect(route(page).locator(".postgres-resolved-url")).toContainText("jdbc:postgresql://postgres.lab.example/alpaca-event");
 await expect(route(page).getByRole("table",{name:"Các phần của JDBC URL dev"})).toContainText("5432 · mặc định");
 await button(page,"Xem vị trí trong Run Configuration").click();
 const run=route(page).getByRole("region",{name:"Cấu hình lần Run PostgreSQL"});
 for(const key of ["Active profiles","SPRING_DATASOURCE_URL","DOCKER_HOST_IP","--spring.datasource.url","-Dspring.datasource.url","spring.config.import"])await expect(run).toContainText(key);
 await button(page,"Mở L187 · Database JDBC URL").click();await expect(route(page).locator('[data-startup-line="187"]')).toContainText("HikariDataSource (HikariPool-1)");
 await expect(route(page).getByRole("table",{name:"YAML, lần Run và phần chưa xác nhận"})).toContainText("Chưa biết địa chỉ hiệu lực");
 await button(page,"Phân biệt DB local với DB từ xa").click();
 await expect(route(page).getByRole("figure",{name:"Compose trong repo · service postgres-write"})).toContainText("5432:5432");
 await route(page).getByRole("radio",{name:"15432:5432",exact:true}).check();
 await expect(route(page).locator(".postgres-simulated-target")).toContainText("jdbc:postgresql://localhost:15432/alpaca-event");
 await route(page).getByRole("group",{name:"Command Windows tới PostgreSQL trong Docker"}).getByRole("button",{name:/^15432:5432/}).click();
 await expect(route(page).locator(".redis-node-explanation")).toContainText("Command trên Windows dùng cổng 15432");
 await route(page).getByRole("radio",{name:"Hostname PostgreSQL từ xa · Giả lập",exact:true}).check();
 await expect(route(page).locator(".redis-docker-window")).toHaveCount(0);
 await expect(route(page).getByRole("region",{name:"Nơi kiểm tra đường PostgreSQL"})).toContainText("Test-NetConnection postgres.lab.example -Port 5432");
 await expect(route(page)).toContainText("Cấu hình cổng Docker trên máy mình không giải thích được đường kết nối này.");
 await expect(route(page).locator(".postgres-effective-status")).toContainText("Chưa biết địa chỉ hiệu lực");
 await button(page,"Áp dụng vào phiên thật").click();
 await expect(route(page)).toContainText("Hikari đã mở kết nối. Muốn biết DB nằm ở đâu, bạn sẽ xem thêm bằng chứng nào?");
 await route(page).getByRole("radio",{name:"Chỉ cần nhãn Database JDBC URL ở L187",exact:true}).check();
 await expect(button(page,"Hoàn tất và quay lại câu đang học")).toBeDisabled();
 await route(page).getByRole("radio",{name:"JDBC URL hiệu lực và môi trường chạy Command",exact:true}).check();
 await button(page,"Hoàn tất và quay lại câu đang học").click();
 await expect(lesson(page)).toContainText("5/14");
 await expect(lesson(page).getByRole("heading",{level:4})).toBeFocused();
 await expect(lesson(page).locator('[data-answer="correct"]')).toBeVisible();
 await expect(reader(page).getByRole("button",{name:"Tiếp tục bài học",exact:true})).toBeEnabled();
 expect(new URL(page.url()).searchParams.get("psim")).toBe(original);
 await reader(page).getByRole("button",{name:"Tiếp tục bài học",exact:true}).click();await expect(lesson(page)).toContainText("6/14");
});

test("L183, L184, L280 and Repository/JPA/DB each expose the branch without advancing the lesson",async({page})=>{
 await seedQuestionFive(page);await open(page);
 for(const n of [183,184,280]){
  await line(page,n).click();
  await reader(page).getByRole("region",{name:"Dòng đang xem"}).getByRole("button",{name:"Lần đường kết nối PostgreSQL",exact:true}).click();
  await button(page,"Quay lại bài đọc log").click();await expect(lesson(page)).toContainText("5/14");
 }
 await line(page,112).click();
 await reader(page).getByRole("navigation",{name:"Nhóm hoạt động startup"}).getByRole("button",{name:/Repository, JPA, DB/}).click();
 await reader(page).getByLabel("Ba câu đọc nhóm log").getByRole("button",{name:"Lần đường kết nối PostgreSQL",exact:true}).click();
 await expect(route(page)).toBeVisible();await button(page,"Quay lại bài đọc log").click();await expect(lesson(page)).toContainText("5/14");
});

test("mobile reload retains config, remote example and the question bookmark while the real URL stays unknown",async({page})=>{
 test.setTimeout(60000);await page.setViewportSize({width:390,height:844});await seedQuestionFive(page);await open(page);await enter(page);
 await button(page,"Lần về cấu hình DB").click();
 await route(page).getByRole("radio",{name:"Đã đặt DOCKER_HOST_IP=postgres.lab.example",exact:true}).check();
 await button(page,"Mở L187 · Database JDBC URL").click();await button(page,"Xem vị trí trong Run Configuration").click();
 await page.reload();
 await expect(route(page).getByRole("heading",{level:3})).toHaveText("Địa chỉ PostgreSQL được lấy từ đâu?");
 await expect(route(page).locator('[data-startup-line="187"]')).toBeVisible();
 await expect(route(page).getByRole("radio",{name:"Đã đặt DOCKER_HOST_IP=postgres.lab.example",exact:true})).toBeChecked();
 expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
 await button(page,"Phân biệt DB local với DB từ xa").click();
 await route(page).getByRole("radio",{name:"Hostname PostgreSQL từ xa · Giả lập",exact:true}).check();await page.reload();
 await expect(route(page).getByRole("group",{name:"Command Windows tới PostgreSQL từ xa"})).toBeVisible();
 await expect(route(page).locator(".postgres-effective-status")).toContainText("Chưa biết địa chỉ hiệu lực");
 expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
 await button(page,"Quay lại bài đọc log").click();await expect(lesson(page)).toContainText("5/14");
});

test("early return preserves Redis diagnosis and its independent question bookmark",async({page})=>{
 await seedQuestionFive(page);await open(page);await line(page,3205).click();
 await reader(page).getByRole("button",{name:"Lần nguyên nhân lỗi này",exact:true}).click();
 await reader(page).getByRole("button",{name:"Tìm Caused by trong console",exact:true}).click();
 await enter(page);await button(page,"Quay lại bài đọc log").click();
 await expect(reader(page).getByRole("region",{name:"Luồng chẩn đoán"})).toContainText("Tìm nguyên nhân bên dưới lỗi phụ thuộc");
 await reader(page).getByRole("button",{name:"Quay lại câu đang học",exact:true}).click();await expect(lesson(page)).toContainText("5/14");
});
