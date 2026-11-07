import type { SetupFile } from "./model";

const resource = (module: string, name: string) => `workspaces/${module}/src/main/resources/${name}`;
// Allowlisted excerpts read during the design survey, 04/11/2026.
// No full config, private endpoints, connection strings, credentials or fabricated snapshots.
export const setupFiles: SetupFile[] = [
  { id: "java-root-build", path: "build.gradle", role: "Plugin áp cho subprojects, toolchain và cấu hình Compose của Gradle.", evidenceId: "E-build", excerpts: [
    { start: 26, lines: ["bootJar {", "    enabled = false", "}"] },
    { start: 34, lines: ["subprojects {", '    apply plugin: "java"', '    apply plugin: "jacoco"', '    apply plugin: "org.springframework.boot"', '    apply plugin: "io.spring.dependency-management"'] },
    { start: 46, evidenceId: "E-toolchain", lines: ["    java {", "        toolchain {", "            languageVersion = JavaLanguageVersion.of(21)", "        }", "    }"] },
    { start: 102, evidenceId: "E-compose", lines: ['    projectName = "sale-platform"', '    useComposeFiles = ["docker-compose-env.yml"]'] },
  ] },
  { id: "java-settings", path: "settings.gradle", role: "Danh sách module, gồm cả Swagger đang thiếu trong lần khảo sát.", evidenceId: "E-workspace", excerpts: [
    { start: 1, lines: ["rootProject.name = 'agent-workspaces'", "include 'workspaces:1-shared:shared-base'"] },
    { start: 27, lines: ["include 'workspaces:2-infrastructure:swagger-service'", "include 'workspaces:2-infrastructure:kafka-cdc-service'", "", "include 'workspaces:agent-service:1-agent-command-service'", "include 'workspaces:agent-service:2-agent-flow-service'", "include 'workspaces:agent-service:3-agent-query-service'"] },
    { start: 37, lines: ["include 'workspaces:agent-integration-service:agent-integration-service'"] },
  ] },
  { id: "java-clone", path: "git-cmd.sh", role: "Target clone đúng nhóm agent-system. Remote đã được che; đoạn này không phải command để sao chép chạy.", evidenceId: "E-workspace", excerpts: [
    { start: 1, lines: ["git clone [remote đã che] workspaces/1-shared", "git clone [remote đã che] workspaces/2-infrastructure/assets-service", "git clone [remote đã che] workspaces/2-infrastructure/camunda-service", "git clone [remote đã che] workspaces/2-infrastructure/notification-service", "git clone [remote đã che] workspaces/2-infrastructure/schedule-service", "git clone [remote đã che] workspaces/2-infrastructure/sso-server", "git clone [remote đã che] workspaces/2-infrastructure/stomp-service", "git clone [remote đã che] workspaces/2-infrastructure/kafka-cdc-service", "", "git clone [remote đã che] workspaces/agent-service", "git clone [remote đã che] workspaces/agent-integration-service"] },
  ] },
  { id: "java-wrapper", path: "gradle/wrapper/gradle-wrapper.properties", role: "Gradle Wrapper chọn distribution 8.14.3; không chứng minh JVM hiện đang dùng.", evidenceId: "E-toolchain", excerpts: [
    { start: 3, lines: ["distributionUrl=https\\://services.gradle.org/distributions/gradle-8.14.3-bin.zip"] },
  ] },
  { id: "java-compose", path: "docker-compose-env.yml", role: "Tên container cố định và host/container ports. Đoạn trích không bao gồm thông tin đăng nhập.", evidenceId: "E-compose", excerpts: [
    { start: 23, lines: ["  kafka:", "    image: eventuateio/eventuate-kafka:0.9.0.RELEASE", "    container_name: alpaca.kafka.event", "    ports:", "      - 9092:9092"] },
    { start: 45, lines: ["  debezium:", "    image: debezium/connect:2.7.3.Final", "    restart: always", "    container_name: debezium", "    hostname: debezium", "    depends_on:", "      - postgres-write", "      - kafka", "      - zookeeper", "    ports:", "      - '8086:8083'"] },
    { start: 77, lines: ["  postgres-write:", "    build: docker/postgres", "    ports:", "      - 5432:5432"] },
    { start: 87, lines: ["  postgres-read:", "    build: docker/postgres", "    ports:", '      - "5433:5432"'] },
  ] },
  { id: "java-connector", path: "docker/cdc-config/connector_request.json", role: "File tìm thấy khi thiết kế; chưa xác nhận là payload đã dùng tại S08. Chỉ trích các trường không nhạy cảm.", evidenceId: "E-connector", excerpts: [
    { start: 13, lines: ['    "name": "platform-event-buf",', '    "plugin.name": "pgoutput",', '    "schema.include.list": "platform_event",', '    "table.include.list": "platform_event.events",'] },
    { start: 23, lines: ['    "topic.prefix": "platform"'] },
  ] },
  { id: "java-command-dev", path: resource("agent-service/1-agent-command-service", "application-dev.yml"), role: "Command dev: datasource local, schema có thể thay đổi khi boot, external services và auth vẫn cần kiểm tra.", evidenceId: "E-command-dev", excerpts: [
    { start: 2, lines: ["server:", "  port: 9901"] },
    { start: 33, lines: ["    url: [đã che connection string; localhost, DB alpaca-event; không ghi port tường minh]"] },
    { start: 36, lines: ["      connection-init-sql: CREATE SCHEMA IF NOT EXISTS platform_event"] },
    { start: 41, lines: ["      ddl-auto: update"] },
    { start: 45, lines: ["        default_schema: platform_event"] },
    { start: 94, lines: ["alpaca:", "  local: false"] },
  ] },
  { id: "java-flow-default", path: resource("agent-service/2-agent-flow-service", "application.yml"), role: "Flow mặc định ghi schema sale_platform ở DB local 5432. Đây không phải profile local chuẩn đã chốt.", evidenceId: "E-profiles", excerpts: [
    { start: 3, lines: ["  port: 82"] },
    { start: 42, lines: ["        default_schema: sale_platform"] },
    { start: 46, lines: ["    url: [đã che connection string; localhost:5432, DB alpaca-event]"] },
  ] },
  { id: "java-query-default", path: resource("agent-service/3-agent-query-service", "application.yml"), role: "Query mặc định đọc 5433, sale_platform; dev đổi sang 5432/platform_event và đổi auth. Chưa có bằng chứng replication.", evidenceId: "E-profiles", excerpts: [
    { start: 2, lines: ["  port: 9902"] },
    { start: 24, lines: ["    url: [đã che connection string; localhost:5433, DB alpaca-event]"] },
    { start: 33, lines: ["      ddl-auto: none"] },
    { start: 37, lines: ["        default_schema: sale_platform"] },
    { start: 61, lines: ["alpaca:", "  local: true"] },
  ] },
  { id: "java-main", path: "workspaces/agent-service/1-agent-command-service/src/main/java/com/alpaca/agent/AgentCommandServiceApplication.java", symbol: "AgentCommandServiceApplication.main", role: "Main class tồn tại; không tự ép profile dev trong đoạn main.", evidenceId: "E-build", excerpts: [
    { start: 25, lines: ["public class AgentCommandServiceApplication {", "    public static void main(String[] args) {", "        SpringApplication.run(AgentCommandServiceApplication.class, args);", "    }", "}"] },
  ] },
];
