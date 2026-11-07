import type { Simulation } from "./practice-runtime-model";
export const serviceCatalog=[
  {id:"postgres-write",name:"sale-platform-postgres-write-1",ports:"5432 → 5432",role:"Dữ liệu ghi / event",line:77},
  {id:"postgres-read",name:"sale-platform-postgres-read-1",ports:"5433 → 5432",role:"Đích đọc được khai báo riêng",line:87},
  {id:"rabbitmq",name:"rabbitmq",ports:"5672 → 5672 · UI 15672 → 15672",role:"Thông điệp AMQP",line:3},
  {id:"redis",name:"redis",ports:"6379 → 6379",role:"Cache / session",line:65},
  {id:"zookeeper",name:"sale-platform-zookeeper-1",ports:"2181 → 2181",role:"Hỗ trợ broker event",line:19},
  {id:"kafka",name:"alpaca.kafka.event",ports:"9092 → 9092",role:"Broker event",line:23},
  {id:"debezium",name:"debezium",ports:"8086 → 8083",role:"Connector CDC; chưa xác nhận đăng ký",line:45},
  {id:"kafka-ui",name:"kafka-ui",ports:"8080 → 8080",role:"Quan sát Kafka",line:34},
  {id:"rebrow",name:"rebrow",ports:"5001 → 5001",role:"Công cụ xem Redis; chưa xác minh target",line:71},
] as const;
export function containerStatus(sim:Simulation,id:string){
  if(!sim.containers[id])return "chưa được tạo trong bài";
  if(!sim.daemon)return "Không quan sát được · Engine chưa sẵn sàng";
  return sim.containers[id]==="running"?"running":"stopped";
}
export function serviceEvidence(sim:Simulation,id:string){
  if(!sim.containers[id])return "Chưa có container; chưa có bằng chứng readiness";
  return sim.daemon&&sim.containers[id]==="running"&&sim.readyEvidence.includes(id)?"Log mô phỏng: DB nhận kết nối; chưa kiểm tra auth/schema":"Chưa xác nhận sẵn sàng; Compose không có healthcheck";
}
export const infraNodes=[
  {id:"command",label:"Command",group:"java",note:"Ghi dữ liệu · port 9901"},
  {id:"flow",label:"Flow",group:"java",note:"Điều phối · profile cần đối chiếu"},
  {id:"query",label:"Query",group:"java",note:"Đọc dữ liệu · base/dev khác đích"},
  {id:"cdc-app",label:"Kafka CDC Java",group:"java",note:"Khác container Debezium"},
  {id:"other-java",label:"Các app Java khác",group:"java",note:"7 app · quan hệ chưa khảo sát"},
  {id:"swagger",label:"Swagger",group:"java",note:"Được khai báo; source còn thiếu"},
  ...serviceCatalog.map(item=>({id:item.id,label:item.id,group:["kafka-ui","rebrow"].includes(item.id)?"tools":"support",note:item.role})),
];
export const infraEdges=[
  {id:"command-db",source:"command",target:"postgres-write",label:"dev · JDBC :5432",proof:"command-dev",lines:[30,33,45],direct:true,command:true,explanation:"Command dev mặc định dùng localhost:5432 nếu DOCKER_HOST_IP không ghi đè. Chỉ đối chiếu target; chưa có kết nối Java."},
  {id:"command-rabbit",source:"command",target:"rabbitmq",label:"AMQP :5672",proof:"command-dev",lines:[51,52,54],direct:true,command:true,explanation:"spring.rabbitmq.host = 127.0.0.1; port 5672. Host port khớp Compose khi Java chạy trên host."},
  {id:"command-redis",source:"command",target:"redis",label:"cache :6379",proof:"command-dev",lines:[118,119,120,121],direct:true,command:true,explanation:"Ba cấu hình cache.redis, redis-persistent và redis-session. Chưa có bằng chứng auth hoặc thao tác Redis."},
  {id:"command-kafka",source:"command",target:"kafka",label:"event config :9092",proof:"command-dev",lines:[7,8,9,10],direct:true,command:true,explanation:"eventuatelocal.kafka.bootstrap.servers khai báo broker. Ba kết nối của G1 không bao quát dependency event này."},
  {id:"query-read",source:"query",target:"postgres-read",label:"file gốc · :5433",proof:"query-base",lines:[21,24],direct:true,command:false,explanation:"Query application.yml trỏ localhost:5433. application-dev.yml:33 lại dùng :5432; không gán mọi profile vào postgres-read."},
  {id:"query-dev-write",source:"query",target:"postgres-write",label:"dev · :5432",proof:"query-dev",lines:[30,33],direct:true,command:false,explanation:"Chỉ mapping cổng trong file dev. Database/quyền/override cần kiểm tra; không suy ra replication từ write sang read."},
  {id:"flow-command",source:"flow",target:"command",label:"file gốc · HTTP :9901",proof:"flow-base",lines:[64,65],direct:true,command:false,explanation:"system.platform-command.api trong file gốc của Flow trỏ Command. Profile dev có override; không khẳng định local ở mọi profile."},
  {id:"cdc-kafka",source:"cdc-app",target:"kafka",label:"producer / consumer",proof:"cdc",lines:[3,4,30,31],direct:true,command:false,explanation:"Kafka CDC Java cấu hình spring.kafka và system.kafka tới alpaca.kafka.event:9092; không phải Debezium Connect."},
  {id:"kafka-zk",source:"kafka",target:"zookeeper",label:"depends_on / :2181",proof:"compose",lines:[28,29,33],direct:false,command:true,explanation:"Compose khai báo Kafka phụ thuộc Zookeeper. Với Command đây là hạ tầng hỗ trợ gián tiếp; depends_on không là readiness."},
  {id:"debezium-db",source:"debezium",target:"postgres-write",label:"depends_on · CDC",proof:"compose",lines:[50,51],direct:false,command:false,explanation:"Compose khai báo depends_on postgres-write. connector_request.json:8,10 hướng tới postgres-write:5432; chưa chứng minh connector được đăng ký hoặc CDC đang chạy."},
  {id:"debezium-kafka",source:"debezium",target:"kafka",label:"BOOTSTRAP_SERVERS",proof:"compose",lines:[52,57],direct:false,command:false,explanation:"Compose cấu hình Debezium Connect dùng broker alpaca.kafka.event:9092. Không vẽ luồng dữ liệu runtime đã thành công."},
  {id:"ui-kafka",source:"kafka-ui",target:"kafka",label:"depends_on",proof:"compose",lines:[39,40],direct:false,command:false,explanation:"Kafka UI phụ thuộc Kafka và mount kui/config.yml. File đó có cả localhost:9092 và kafka:9092; cần đối chiếu network/alias để truy cập, chưa xác nhận UI kết nối broker."},
] as const;
