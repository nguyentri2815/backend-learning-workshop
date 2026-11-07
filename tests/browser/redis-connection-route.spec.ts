import {test,expect} from "@playwright/test";
import type {Page} from "@playwright/test";
import source from "../../src/content/setup/redis-route-source.json" with {type:"json"};
import {startupSource} from "../../src/setup/startup-log-model";
import {realLogSource} from "../../src/setup/real-log-practice-model";
import {correctInspectionPlace,emptyRedisRoute,routeTarget} from "../../src/setup/redis-route-model";
import {normalizeSimulation} from "../../src/setup/practice-runtime-model";
import {practice} from "./runtime-helpers";

const reader=(page:Page)=>practice(page).getByRole("region",{name:"Bài tập đọc log thật",exact:true});
const route=(page:Page)=>reader(page).getByRole("region",{name:"Lần đường kết nối Redis",exact:true});
const button=(page:Page,name:string)=>route(page).getByRole("button",{name,exact:true});
const line=(page:Page,n:number)=>reader(page).locator(`[data-startup-line="${n}"]`);
const simulation=(page:Page)=>normalizeSimulation(JSON.parse(new URL(page.url()).searchParams.get("psim")??"{}"));
async function open(page:Page,n=3432){
 await page.addInitScript(()=>{const key="backend-learning-workshop.real-log-reading.v1";if(!localStorage.getItem(key))localStorage.setItem(key,JSON.stringify({version:1,session:"failure",failureStep:2}));});
 await page.goto(`/journey/environment?${new URLSearchParams({experience:"project",task:"startup",readlog:"1",psim:JSON.stringify({commandCase:{id:"redis-connect",branch:"address"}})})}`);
 await line(page,n).click();await reader(page).getByRole("button",{name:"Lần đường kết nối Redis",exact:true}).click();await expect(route(page)).toBeVisible();
}
async function toNetwork(page:Page){
 await button(page,"Mở nơi tạo Redis client").click();await button(page,"Lần ngược địa chỉ trong log").click();await button(page,"127.0.0.1:6379").click();await button(page,"Xem cấu hình lần Run").click();await button(page,"Xác định đường kết nối").click();
}
async function inspectDocker(page:Page){
 await expect(route(page).locator(".redis-docker-window")).toHaveCount(0);await button(page,"Mở Docker Desktop → Containers").click();await expect(route(page).locator(".redis-docker-window")).toContainText("Engine: Running");
 await expect(route(page).locator(".redis-docker-window")).toContainText("Chưa mở Status");await button(page,"Xem Status Redis").click();await expect(route(page).locator(".redis-docker-window")).toContainText("Chưa đối chiếu Ports");await button(page,"Đối chiếu Ports với địa chỉ Command").click();
}

test("reviewed binding identifies cache.redis, exact client factory and same YAML values without claiming override provenance",()=>{
 const text=source.refs.client.rows.map(row=>row.text).join("\n");
 expect(source.refs.client.sha256).toBe(startupSource.sources.cache.sha256);
 expect(source.refs.client.rows.find(row=>row.line===26)?.text).toBe('    @Value("${cache.redis:redis://localhost:6379}")');
 for(const value of ['@Bean(name = "redissonClient"','.setAddress(redisUrl)','return Redisson.create(config);','cacheManager(@Qualifier("redissonClient")','return new ALPSpringCacheManager(redissonClient'])expect(text).toContain(value);
 for(const ref of [source.refs.base,source.refs.dev])expect(ref.rows.find(row=>row.line===119)?.text.trim()).toBe("redis: redis://localhost:6379");
 expect(source.refs.queue.rows.map(row=>row.text).join("\n")).toContain("private final SharedGlobalConfigService sharedGlobalConfigService");
 expect(source.refs.platform.rows.map(row=>row.text).join("\n")).toContain('redissonClient.getMap("global-config-cache")');
 expect(realLogSource.rows.find(row=>row.line===114)?.text).toContain('default profile: "default"');
 expect(JSON.stringify(source)).not.toMatch(/nguye|\b[CD]:\\|password\s*[=:]|Bearer /i);
 const state=emptyRedisRoute();expect(routeTarget({...state,hostPort:6380})).toEqual({host:"127.0.0.1",port:6380});expect(correctInspectionPlace({...state,place:"remote"})).toBe(false);expect(correctInspectionPlace({...state,mode:"remote",place:"remote"})).toBe(true);
});

test("Redis log → exact client source → profile and provenance → host/container path → Docker check and fresh startup evidence",async({page})=>{
 test.setTimeout(90000);await open(page);const original=simulation(page);
 await expect(route(page).getByRole("heading",{level:3})).toHaveText("Ai trong Command đang cần Redis?");
 const chain=route(page).getByRole("navigation",{name:"Chuỗi bean cần Redis"});await expect(chain).toContainText("queueHandler");await chain.getByRole("button",{name:/cacheManager/}).click();await expect(route(page)).toContainText('@Qualifier("redissonClient")');
 await button(page,"Mở nơi tạo Redis client").click();
 const factory=route(page).getByRole("figure",{name:"Tạo Redis client trong Java"});await expect(factory).toContainText("SpringCacheConfig.java:33");await expect(factory.locator('[data-source-line="38"]')).toHaveAttribute("data-source-highlight","true");await expect(factory.locator('[data-source-line="39"]')).toContainText("Redisson.create(config)");
 await expect(route(page)).toContainText("Redisson client là thành phần nằm trong ứng dụng Java. Redis server là dịch vụ chạy bên ngoài tiến trình Command.");
 await button(page,"Lần ngược địa chỉ trong log").click();await button(page,"127.0.0.1:6379").click();
 await expect(route(page).getByRole("figure",{name:"Binding chính xác của client đang lỗi"})).toContainText('${cache.redis:redis://localhost:6379}');
 await expect(route(page)).toContainText('default profile: "default"');
 for(const name of ["application.yml · giá trị trong file","application-dev.yml · giá trị trong file"]){const file=route(page).getByRole("figure",{name});await expect(file.locator('[data-source-line="119"]')).toHaveAttribute("data-source-highlight","true");await expect(file).toContainText("redis: redis://localhost:6379");}
 await expect(route(page)).toContainText("Chạy với dev không đổi địa chỉ Redis");
 await button(page,"Xem cấu hình lần Run").click();await expect(route(page).getByRole("region",{name:"Cấu hình lần Run"})).toContainText("CACHE_REDIS");await expect(route(page).getByRole("table",{name:"File, giá trị đã dùng và nguồn cuối cùng"})).toContainText("Chưa xác nhận");await expect(route(page)).toContainText("--cache.redis=");
 await button(page,"Xác định đường kết nối").click();
 const diagram=route(page).getByRole("group",{name:"Command Windows tới Redis trong Docker"});await diagram.getByRole("button",{name:/^127.0.0.1:6379/}).click();await expect(route(page).locator(".redis-node-explanation")).toContainText("chính máy Windows");
 await route(page).getByRole("radio",{name:"Từ Windows chạy Command tới hostname Redis từ xa",exact:true}).check();await expect(button(page,"Kiểm tra đường đã chọn")).toBeDisabled();
 await route(page).getByRole("radio",{name:"Docker Desktop cục bộ trên Windows chạy Command",exact:true}).check();await button(page,"Kiểm tra đường đã chọn").click();await inspectDocker(page);
 await expect(route(page).getByRole("table")).toContainText("Exited");await expect(route(page).getByRole("table")).toContainText("6379:6379");await expect(button(page,"Start command-redis-practice · Giả lập")).toHaveCount(0);
 await button(page,"Xem Logs Redis").click();await expect(route(page).getByLabel("Logs Redis trước Start")).toContainText("Giả lập");await button(page,"Start command-redis-practice · Giả lập").click();await button(page,"Kiểm tra Windows → Redis · Giả lập").click();
 await expect(route(page).getByLabel("Kết quả kiểm tra giả lập")).toContainText("TcpTestSucceeded : True");
 await route(page).getByText("Lệnh khi giao diện chưa đủ: mục đích và cách đọc",{exact:true}).click();await expect(route(page).locator(".redis-extra-commands")).toContainText("docker ps -a");await expect(route(page).locator(".redis-extra-commands")).toContainText("docker exec command-redis-practice redis-cli PING");
 await button(page,"Run lại Command · Giả lập").click();
 for(const [n,label] of [[1,"Đọc mốc Tomcat started"],[2,"Đọc mốc Started của Command"],[3,"Hoàn tất đường kết nối"]] as const){await route(page).locator(`[data-startup-line="${n}"]`).click();await button(page,label).click();}
 await expect(route(page)).toContainText("đã có Redis kết nối → Tomcat started → Started");await route(page).locator(".redis-route-header").getByRole("button",{name:"Quay lại bài đọc log",exact:true}).click();
 await expect(reader(page).getByRole("region",{name:"Câu đang học"})).toContainText("3/14");expect(simulation(page)).toEqual(original);
});

test("L3469 entry and 6380:6379 change the Windows target, with evidence before simulated config repair",async({page})=>{
 test.setTimeout(90000);await open(page,3469);await toNetwork(page);
 await route(page).getByRole("radio",{name:"6380:6379",exact:true}).check();await expect(route(page).locator(".redis-route-origin")).toContainText("127.0.0.1:6379");await expect(route(page).locator(".redis-path-diagram")).toContainText("127.0.0.1:6380");
 await route(page).getByRole("group",{name:"Command Windows tới Redis trong Docker"}).getByRole("button",{name:/^6380:6379/}).click();await expect(route(page).locator(".redis-node-explanation")).toContainText("Số bên trái 6380 là cổng Windows");
 await route(page).getByRole("radio",{name:"Docker Desktop cục bộ trên Windows chạy Command",exact:true}).check();await button(page,"Kiểm tra đường đã chọn").click();await inspectDocker(page);await expect(route(page).getByRole("table")).toContainText("Running");await expect(route(page).getByRole("table")).toContainText("6380:6379");
 await expect(button(page,"Start command-redis-practice · Giả lập")).toHaveCount(0);await button(page,"Áp dụng địa chỉ mô phỏng đã đối chiếu").click();await expect(route(page).getByRole("status")).toContainText("Số 6379 bên phải");
 await route(page).getByRole("textbox",{name:"Cổng Windows cho Command",exact:true}).fill("6380");await button(page,"Áp dụng địa chỉ mô phỏng đã đối chiếu").click();await button(page,"Kiểm tra Windows → Redis · Giả lập").click();await expect(route(page).getByLabel("Kết quả kiểm tra giả lập")).toContainText("-Port 6380");
 await button(page,"Run lại Command · Giả lập").click();await expect(route(page).locator('[data-startup-line="1"]')).toContainText("127.0.0.1:6380");
});

test("clickable address opens its reverse binding; remote branch persists on mobile and checks its hostname without local Docker",async({page})=>{
 test.setTimeout(90000);await page.setViewportSize({width:390,height:844});await page.goto("/journey/environment?experience=project&task=startup&readlog=1");
 await reader(page).getByRole("button",{name:"Lần ngược địa chỉ 127.0.0.1:6379 trong log",exact:true}).click();await expect(route(page)).toContainText("Binding chính xác của client đang lỗi");await expect(route(page).getByRole("heading",{level:3})).toHaveText("Địa chỉ đã dùng được cấp từ đâu?");
 await button(page,"Xem cấu hình lần Run").click();await button(page,"Xác định đường kết nối").click();await page.reload();await expect(route(page).getByRole("heading",{level:3})).toHaveText("Tôi sẽ kiểm tra ở đâu?");
 await route(page).getByText("Nếu cấu hình trỏ sang máy khác",{exact:true}).click();await button(page,"Dùng ví dụ Redis từ xa").click();await expect(route(page).getByRole("group",{name:"Command Windows tới Redis từ xa"})).toContainText("redis.lab.example:6380");
 await route(page).getByRole("radio",{name:"Docker Desktop cục bộ trên Windows chạy Command",exact:true}).check();await expect(button(page,"Kiểm tra đường đã chọn")).toBeDisabled();await expect(route(page).getByRole("status")).toContainText("Docker Desktop cục bộ chưa cho biết");
 await route(page).getByRole("radio",{name:"Từ Windows chạy Command tới hostname Redis từ xa",exact:true}).check();await button(page,"Kiểm tra đường đã chọn").click();await expect(route(page).locator(".redis-docker-window")).toHaveCount(0);await button(page,"Thử TCP tới hostname · Giả lập").click();await expect(route(page).getByLabel("Kết quả kiểm tra giả lập")).toContainText("Test-NetConnection redis.lab.example -Port 6380");
 await route(page).getByText("Lệnh khi giao diện chưa đủ: mục đích và cách đọc",{exact:true}).click();await expect(route(page).locator(".redis-extra-commands")).not.toContainText("docker ps");await expect(route(page).locator(".redis-extra-commands")).not.toContainText("docker exec");
 expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
});

test("returning from the route preserves the diagnosis and the bookmarked lesson",async({page})=>{
 await page.goto("/journey/environment?experience=project&task=startup&readlog=1");await line(page,3205).click();await reader(page).getByRole("button",{name:"Lần nguyên nhân lỗi này",exact:true}).click();await reader(page).getByRole("button",{name:"Tìm Caused by trong console",exact:true}).click();
 await line(page,3432).click();await reader(page).getByRole("button",{name:"Lần đường kết nối Redis",exact:true}).click();await button(page,"Mở nơi tạo Redis client").click();await button(page,"Quay lại bài đọc log").click();
 await expect(reader(page).getByRole("region",{name:"Luồng chẩn đoán"})).toContainText("Tìm nguyên nhân bên dưới lỗi phụ thuộc");
 await reader(page).getByRole("button",{name:"Quay lại câu đang học",exact:true}).click();await expect(reader(page).getByRole("region",{name:"Câu đang học"})).toContainText("1/14");
});
