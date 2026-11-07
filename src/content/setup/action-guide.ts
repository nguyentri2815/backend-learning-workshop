import { apps } from "./runbooks";
import { beginnerChecks } from "./beginner-actions";

export type ActionStepId = "source" | "tools" | "config" | "dependencies" | "build" | "run" | "ready";
export type ModuleId = "command" | "flow" | "query" | "integration" | "cdc";
export interface MissingInfo { what: string; affects: string; find: string }
export interface GuideCheck {
  id: string; title: string; action: string; where: string;
  how: { text: string; command?: boolean; output?: string }[];
  effect: string; why?: string;
  command?: string; shell?: "PowerShell" | "Git Bash";
  dynamicCommand?: "build" | "artifact" | "port" | "git";
  read: string; done: string; failure: string[];
  nextCheckStep?: ActionStepId; missing?: MissingInfo;
}
export interface ActionGuideStep {
  id: ActionStepId; title: string; shortTitle: string; goal: string;
  checks: GuideCheck[]; elsewhere: string[]; historyIds: string[]; fileIds: string[]; evidenceIds: string[];
}
const moduleIds: ModuleId[] = ["command", "flow", "query", "integration", "cdc"];
const mainClasses = ["AgentCommandServiceApplication", "AgentFlowServiceApplication", "AgentQueryServiceApplication", "AgentIntegrationServiceApplication", "KafkaCDCServiceApplication"];
const moduleConfig = [
  "dev: PostgreSQL localhost, DB alpaca-event, schema platform_event; cổng 5432 suy ra từ mặc định PostgreSQL. Vẫn có API bên ngoài; startup có thể đổi schema.",
  "Cấu hình gốc: PostgreSQL cổng 5432, schema sale_platform. dev đổi schema sang platform_event và đổi broker/API. Profile local chuẩn chưa chốt.",
  "Cấu hình gốc: PostgreSQL cổng 5433, schema sale_platform. dev dùng 5432/schema platform_event, đổi auth và ddl-auto. Đồng bộ dữ liệu chưa xác minh.",
  "Cấu hình gốc: Kafka/DB local, schema platform_event; Core/auth bên ngoài chưa kiểm thử. dev đổi hostname Kafka; cần xác nhận dependency theo task.",
  "Kafka alpaca.kafka.event:9092 phải truy cập được từ Windows; topic gốc khác dev. Network/CDC còn cần xác nhận.",
];
export const guideModules = apps.map((app, index) => ({
  ...app, config: moduleConfig[index], id: moduleIds[index], mainClass: mainClasses[index],
  gitRoot: app.module.startsWith("agent-service/") ? "workspaces/agent-service" : app.module.startsWith("agent-integration-service/") ? "workspaces/agent-integration-service" : "workspaces/2-infrastructure/kafka-cdc-service",
}));
export const actionSteps: ActionGuideStep[] = [
  { id: "source", title: "Kiểm tra source workspace", shortTitle: "Source dự án",
    goal: "Mở đúng thư mục Java và biết mã nguồn cần cho task đã có đủ hay còn thiếu.", checks: beginnerChecks.source,
    elsewhere: ["Tìm settings.gradle(.kts) để xem danh sách module; module là một phần mã nguồn có cấu hình build riêng.", "Đọc README, script bootstrap/clone và .gitmodules nếu có. So đường dẫn được khai báo với thư mục thật và project dependency trong build.gradle của module."],
    historyIds: ["S00", "S02", "S03"], fileIds: ["java-settings", "java-clone"], evidenceIds: ["E-workspace"] },
  { id: "tools", title: "Chuẩn bị công cụ và IDE", shortTitle: "Java và IDE",
    goal: "Kiểm tra Java trước; chỉ cài hoặc chọn lại khi cần. Đồng bộ công cụ build và IntelliJ với Java 21.", checks: beginnerChecks.tools,
    elsewhere: ["Tìm toolchain/sourceCompatibility trong build.gradle(.kts) hoặc Java version trong pom.xml. Đọc gradle/wrapper/gradle-wrapper.properties để biết phiên bản Gradle.", "So Project SDK, language level, bytecode target và Gradle JVM với yêu cầu repo. Với Docker, kiểm tra cả phần Server."],
    historyIds: ["S01", "S04", "S05", "S12"], fileIds: ["java-root-build", "java-wrapper"], evidenceIds: ["E-toolchain", "E-ide"] },
  { id: "config", title: "Kiểm tra cấu hình và kết nối", shortTitle: "Cấu hình",
    goal: "Chọn một module theo task, xác định profile và đích kết nối trước khi khởi động.", checks: beginnerChecks.config,
    elsewhere: ["Tìm application*.yml/properties trong src/main/resources. So file gốc với file theo profile, rồi xem env/arguments/file ngoài có ghi đè không.", "Đọc dependency endpoint từ cấu hình ứng dụng rồi đối chiếu Compose; không suy mọi service trong Compose đều cần chạy."],
    historyIds: ["S17", "S11"], fileIds: ["java-command-dev", "java-flow-default", "java-query-default"], evidenceIds: ["E-command-dev", "E-profiles"] },
  { id: "dependencies", title: "Chạy dịch vụ phụ thuộc", shortTitle: "Dịch vụ phụ thuộc",
    goal: "Chuẩn bị đúng dịch vụ của task, kiểm tra chủ sở hữu và độ sẵn sàng trước khi chạy app.", checks: beginnerChecks.dependencies,
    elsewhere: ["Trong Compose, tìm services, container_name, ports, volumes và networks; so với địa chỉ ứng dụng sẽ kết nối.", "Tìm readiness/healthcheck và log từng dịch vụ. Tên container và cổng máy là hai nguồn xung đột khác nhau."],
    historyIds: ["S05", "S06", "S07", "S08"], fileIds: ["java-compose", "java-connector"], evidenceIds: ["E-compose", "E-connector"] },
  { id: "build", title: "Build module cần làm", shortTitle: "Build module",
    goal: "Biên dịch và đóng gói đúng module; đọc kết quả của lần build vừa chạy.", checks: beginnerChecks.build,
    elsewhere: ["Xác định wrapper và đường dẫn module trước khi chọn task build. Root có thể chỉ gom các module.", "Đọc kết quả build mới cùng metadata artifact; không dùng JAR cũ để kết luận source vừa build thành công."],
    historyIds: ["S09", "S10", "S12"], fileIds: ["java-root-build", "java-settings", "java-main"], evidenceIds: ["E-build", "E-artifacts"] },
  { id: "run", title: "Chạy và kiểm tra ứng dụng", shortTitle: "Chạy và kiểm tra",
    goal: "Khi đủ cấu hình, chạy một app, kiểm tra log/cổng/API theo task và biết cách dừng app đó.", checks: beginnerChecks.run,
    elsewhere: ["Tìm main class chứa SpringApplication.run, server.port, profile và hướng dẫn health/API đọc trong repo.", "Kiểm tra riêng build, process/cổng, HTTP và nghiệp vụ; một cổng mở không chứng minh API hay toàn bộ luồng dữ liệu hoạt động."],
    historyIds: ["S11", "S13", "S17", "S18"], fileIds: ["java-command-dev", "java-flow-default", "java-query-default"], evidenceIds: ["E-S11", "E-profiles"] },
  { id: "ready", title: "Sẵn sàng làm task", shortTitle: "Task đầu tiên",
    goal: "Ghi phạm vi, kết quả kiểm tra và phần còn thiếu trước khi bắt đầu sửa code.", checks: beginnerChecks.ready,
    elsewhere: ["Đọc AGENTS.md/README và xác định ranh giới Git/module trước khi giao task cho agent.", "Chuẩn bị baseline trước sửa và tiêu chí sau sửa. Thiếu cấu hình/API contract thì ghi câu hỏi cụ thể."],
    historyIds: ["S03", "S10", "S18"], fileIds: ["java-settings"], evidenceIds: ["E-git", "E-S10"] },
];
export const actionStepById = new Map(actionSteps.map(step => [step.id, step]));
export const guideCheckIds = new Set(actionSteps.flatMap(step => step.checks.map(check => check.id)));
export function guideCommand(check: GuideCheck, moduleId: ModuleId | null): string | null {
  if (check.command) return check.command;
  const module = guideModules.find(value => value.id === moduleId);
  if (!module) return null;
  switch (check.dynamicCommand) {
    case "build": return `.\\gradlew.bat ${module.task}:assemble`;
    case "artifact": return `Get-ChildItem -LiteralPath 'workspaces/${module.module}/build/libs' -Filter '*.jar' |\n  Select-Object Name,Length,LastWriteTime`;
    case "port": return `Get-NetTCPConnection -State Listen -LocalPort ${module.port} |\n  Select-Object LocalAddress,LocalPort,OwningProcess`;
    case "git": return `git --no-optional-locks status --short\ngit --no-optional-locks -C ${module.gitRoot} status --short`;
    default: return null;
  }
}
export const legacyActionMap: Record<string, ActionStepId> = {
  map: "source", prerequisites: "tools", start: "dependencies", check: "run", diagnose: "tools",
  S00: "source", S01: "tools", S02: "source", S03: "source", S04: "tools", S05: "tools", S06: "dependencies", S07: "dependencies", S08: "dependencies", S09: "build", S10: "build", S11: "run", S12: "tools", S13: "run", S14: "ready", S15: "ready", S16: "ready", S17: "config", S18: "run",
  "R-F0": "source", "R-F1": "tools", "R-F2": "source", "R-F3": "tools", "R-F4": "dependencies", "R-F5": "build", "R-F6": "config",
  "R-D0": "tools", "R-D1": "dependencies", "R-D2": "dependencies", "R-D3": "config", "R-D4": "run", "R-D5": "run", "R-D6": "run",
  "R-B0": "build", "R-B1": "build", "R-B2": "build", "R-X0": "tools", "R-X1": "dependencies", "R-X2": "build", "R-X3": "config", "R-X4": "run",
};
