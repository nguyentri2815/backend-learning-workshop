import source from "../content/setup/practice-infrastructure-source.json" with {type:"json"};
import type {Simulation} from "./practice-runtime-model";
export const composeSetup=source.composeSetup;
export const composePlans=[
  {id:"postgres-write",from:77,to:86,kind:"build",image:"debezium/postgres:16-alpine",imageDescription:"Build docker/postgres; lấy base image nếu cache chưa có",volume:"./.docker/postgresql-write → /var/lib/postgresql/data",purpose:"Dữ liệu ghi/event của Command"},
  {id:"redis",from:65,to:70,kind:"pull",image:"redis",imageDescription:"Lấy image redis nếu máy chưa có",volume:"Compose không khai báo volume cho Redis",purpose:"Cache / session trong ví dụ Command"},
  {id:"rabbitmq",from:3,to:17,kind:"pull",image:"rabbitmq:3.8.19-management",imageDescription:"Lấy image RabbitMQ nếu máy chưa có",volume:"./.docker/rabbitmq/plugins → /opt/rabbitmq/addon-plugins",purpose:"Thông điệp AMQP trong ví dụ Command"},
  {id:"kafka",from:23,to:33,kind:"pull",image:"eventuateio/eventuate-kafka:0.9.0.RELEASE",imageDescription:"Lấy image Kafka nếu máy chưa có",volume:"Compose không khai báo volume cho Kafka",purpose:"Transport khi mục tiêu cần event",dependencies:"Kafka trong Compose này cần Zookeeper ở zookeeper:2181. Lệnh --no-deps không tự chạy Zookeeper; running chưa chứng minh broker sẵn sàng."},
  {id:"zookeeper",from:19,to:22,kind:"pull",image:"eventuateio/eventuate-zookeeper:0.9.0.RELEASE",imageDescription:"Lấy image Zookeeper nếu máy chưa có",volume:"Compose không khai báo volume cho Zookeeper",purpose:"Hỗ trợ Kafka gián tiếp theo Compose",dependencies:"Đây là quan hệ Kafka → Zookeeper từ Compose, chưa xác minh Java Command dùng trực tiếp khóa zookeeper."},
] as const;
export const composeCommand=(service:string)=>`docker compose -p ${composeSetup.projectName} -f ${composeSetup.composeFile} up -d --no-deps ${service}`;
export function dockerInstruction(s:Simulation){
  if(!s.dockerInstalled)return "Đọc dấu hiệu CLI chưa được tìm thấy. Hướng dẫn cài đặt nằm riêng; bài học không cài Docker.";
  if(!s.desktopOpen&&!s.daemon)return "Mở Docker Desktop trong mô phỏng; CLI có sẵn nhưng Engine chưa sẵn sàng.";
  if(!s.daemon)return "Chờ Engine và kiểm tra lại docker version để thấy cả Client và Server.";
  if(s.composeStage==="image")return "Hoàn tất bước lấy/build image trong tình huống; container vẫn chưa được tạo.";
  if(s.composeStage==="create")return "Tạo tài nguyên và container trong mô phỏng; quan sát container xuất hiện nhưng còn dừng.";
  if(s.composeStage==="start")return "Khởi động container vừa tạo; đây là bước sau tạo container.";
  if(!Object.keys(s.containers).length)return s.composePrepared?"Đọc lệnh cho một service đã chọn rồi bắt đầu Compose trong mô phỏng.":"Chọn một service trong Compose và chuẩn bị lệnh; repo chưa có container.";
  if(!s.dockerInspected)return "Chọn dòng container của repo để đối chiếu tên, project, port và log.";
  if(s.containers[s.containerSelected]!=="running")return "Container đã tồn tại nhưng dừng. Bấm Start để chạy lại, không cần tạo lần đầu.";
  if(s.containerSelected==="postgres-write"&&!s.readyEvidence.includes("postgres-write"))return "Container đã running; có thể xem thêm log PostgreSQL. Chưa đọc log không chặn Tiếp tục hoặc Run Command; readiness/kết nối Java vẫn chưa được xác minh.";
  if(s.readyEvidence.includes("postgres-write"))return "Đã đọc log PostgreSQL trong bài; auth/schema và Java vẫn chưa xác nhận. Có thể Stop rồi Start để so sánh.";
  return "Service đang running; chưa có bằng chứng readiness. Ví dụ tiếp tục chạy Java cần chuẩn bị PostgreSQL ở G2.";
}
