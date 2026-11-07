import type { Simulation } from "./practice-runtime-model";

export const ideActions:Record<string,{instruction:string;result:string}>={
  file:{instruction:"Mở menu File trong cửa sổ IntelliJ mô phỏng.",result:"Menu File đã mở; cấu hình project chưa thay đổi."},
  structure:{instruction:"Chọn Project Structure… trong menu File.",result:"Đã mở Project Structure; đây là cửa sổ cấu hình project."},
  project:{instruction:"Chọn Project dưới Project Settings ở cột trái.",result:"Đang xem Project: SDK và Language level nằm trong cửa sổ này."},
  sdk:{instruction:"Bấm trường SDK để xem các JDK đã đăng ký.",result:"Đã mở danh sách SDK. JDK của project phục vụ phân tích code và SDK mặc định của module."},
  "sdk-choice":{instruction:"Chọn JDK 21 trong danh sách; hoặc mở nhánh chưa có JDK.",result:"Project SDK đã chọn 21; chưa Apply, chưa đổi JVM chạy Gradle hoặc terminal."},
  add:{instruction:"Chọn Add SDK để tìm nhánh bổ sung JDK.",result:"Add SDK cho phép chọn thư mục đã có hoặc mở Download JDK."},
  disk:{instruction:"Chọn Add JDK from disk… để tìm JDK đã có trên đĩa.",result:"Hộp chọn thư mục JDK đã mở trong bài."},
  "jdk-folder":{instruction:"Chọn thư mục gốc JDK 21 minh họa, không chọn thư mục bin.",result:"Đã đăng ký và chọn JDK 21 trong mô hình; không đọc đĩa hoặc cài JDK thật."},
  download:{instruction:"Chọn Download JDK… để xem nơi chọn phiên bản khi chưa cài JDK.",result:"Đã mở hộp Download JDK; chưa tải gì."},
  "download-choice":{instruction:"Chọn Version 21 trong hộp Download JDK minh họa.",result:"Đã chọn phiên bản 21 trong nhánh học; mô hình giả định JDK đã được cung cấp để tiếp tục. Máy thật cần hướng dẫn cài của team."},
  language:{instruction:"Bấm Language level trong trang Project.",result:"Language level quyết định cú pháp IDE hiểu; toolchain biên dịch vẫn do build.gradle:48 quy định là 21."},
  "language-choice":{instruction:"Chọn 21 trong danh sách Language level.",result:"Language level đã chọn 21; thay đổi đang chờ Apply."},
  "project-apply":{instruction:"Bấm Apply trong Project Structure.",result:"Đã áp dụng Project SDK và Language level trong bài; Settings của Gradle chưa được kiểm tra."},
  "project-ok":{instruction:"Bấm OK để đóng Project Structure.",result:"Đã đóng Project Structure. Tiếp theo tìm Settings ở menu File."},
  "settings-file":{instruction:"Mở menu File để đến Settings.",result:"Menu File đã mở; Project Structure và Settings là hai cửa sổ khác nhau."},
  settings:{instruction:"Chọn Settings… trong menu File.",result:"Đã mở Settings; cần tìm nhóm cấu hình build."},
  "build-settings":{instruction:"Mở Build, Execution, Deployment trong cây Settings.",result:"Đã mở nhóm build. Một số phiên bản đặt Gradle dưới Build Tools."},
  "gradle-settings":{instruction:"Chọn Gradle trong cây Settings.",result:"Đang xem cấu hình Gradle của agent-workspaces; Wrapper 8.14.3 lấy từ project."},
  "gradle-jvm":{instruction:"Bấm Gradle JVM trong trang Gradle.",result:"Gradle JVM chạy Gradle khi import/build từ IDE; khác với toolchain compiler và Project SDK."},
  "gradle-choice":{instruction:"Chọn JDK 21 cho Gradle JVM.",result:"Đã chọn JVM 21 cho Gradle trong IDE; JAVA_HOME và terminal bên ngoài vẫn giữ nguyên."},
  "settings-apply":{instruction:"Bấm Apply trong Settings.",result:"Đã áp dụng Gradle JVM trong bài; chưa Reload Gradle."},
  "settings-ok":{instruction:"Bấm OK để đóng Settings.",result:"Đã đóng Settings; cần nạp lại mô hình Gradle."},
  "gradle-window":{instruction:"Mở cửa sổ công cụ Gradle ở mép phải IDE.",result:"Đã mở Gradle tool window; chưa nạp lại project."},
  reload:{instruction:"Bấm Reload All Gradle Projects trong thanh công cụ Gradle.",result:"Đã Reload mô hình Gradle trong bài; không build hoặc chạy Java."},
  check:{instruction:"Bấm Xem kết quả kiểm tra trong bài học.",result:"Đã kiểm tra SDK, language level và Gradle JVM sau Apply/OK/Reload trong bài. Terminal cần kiểm tra riêng."},
  done:{instruction:"Đã hoàn thành đường đi cấu hình. Tiếp tục để khảo sát dịch vụ hỗ trợ.",result:""},
};

export function IntelliJPractice({sim:s,update}:{sim:Simulation;update:(patch:Partial<Simulation>,complete?:boolean)=>void}) {
  const step=ideActions[s.ideStep]?s.ideStep:"file";
  const lastControl=({"sdk-choice":"sdk","jdk-folder":"sdk","download-choice":"sdk","language-choice":"language","gradle-choice":"gradle-jvm"} as Record<string,string>)[s.ideLast]??s.ideLast;
  function act(key:string,next:string,patch:Partial<Simulation>={}) {
    update({...patch,ideStep:next,ideLast:key,ideHint:false,synced:false,notice:""},false);
  }
  function control(key:string,label:string,next:string,patch:Partial<Simulation>={},extra?:string) {
    return <button type="button" className={`${extra??""} ${(s.ideHint?step===key:lastControl===key)?"ide-located":""}`} data-ide-action={key} disabled={step!==key} onClick={()=>act(key,next,patch)}>{label}</button>;
  }
  const project=["project","sdk","sdk-choice","add","disk","download","jdk-folder","download-choice","language","language-choice","project-apply","project-ok"].includes(step);
  const settings=["build-settings","gradle-settings","gradle-jvm","gradle-choice","settings-apply","settings-ok"].includes(step);
  return <section className="runtime-activity ide-practice" aria-label="Thực hành cấu hình IntelliJ">
    <h3>Tìm đúng cửa sổ, đổi từng cấu hình</h3>
    <p className="ide-reference">Tham chiếu bố cục IntelliJ IDEA 2026.3 Help · Windows / New UI. Chưa xác định được phiên bản máy bạn từ bàn giao và .idea; tên/vị trí có thể khác.</p>
    <div className="ide-mission"><b>Thao tác hiện tại</b><p>{ideActions[step].instruction}</p></div>
    <div className="ide-shell">
      <div className="ide-title"><span className="ide-logo">IJ</span><b>agent-workspaces</b><span>IntelliJ IDEA</span></div>
      <div className="ide-menubar">{step==="settings-file"?control("settings-file","File","settings"):control("file","File","structure")}<span>Edit</span><span>View</span><span>Navigate</span><span>Code</span></div>
      {["structure","settings"].includes(step)&&<div className="ide-menu">{step==="structure"?control("structure","Project Structure…  Ctrl+Alt+Shift+S","project"):control("settings","Settings…  Ctrl+Alt+S","build-settings")}</div>}
      {project?<div className="ide-dialog" aria-label="Project Structure">
        <div className="ide-dialog-title">Project Structure</div>
        <div className="ide-dialog-body"><nav aria-label="Project Structure sections"><small>Project Settings</small>{control("project","Project","sdk")}<span>Modules</span><span>Libraries</span><span>Facets</span><span>Artifacts</span><small>Platform Settings</small><span>SDKs</span><span>Global Libraries</span></nav>
          <div className="ide-page"><h4>Project</h4><label>Name: <output>agent-workspaces</output></label><div className="ide-config-row"><b>SDK:</b>{control("sdk",s.ideMissing?"< No SDK > ▾":`${s.sdk} · JDK ${s.sdk} ▾`,"sdk-choice")}</div>
            {step==="sdk-choice"&&<div className="ide-popup"><small>Detected SDKs</small>{!s.ideMissing&&control("sdk-choice","21 · Eclipse Temurin JDK","language",{sdk:21})}<button onClick={()=>update({ideMissing:true,ideStep:"add",ideLast:"sdk",ideHint:false,synced:false})}>Nhánh: chưa có JDK 21 trong danh sách</button></div>}
            {step==="add"&&<div className="ide-popup">{control("add","Add SDK ▸","disk")}</div>}
            {["disk","download"].includes(step)&&<div className="ide-popup">{control("disk","Add JDK from disk…","jdk-folder")}<button onClick={()=>act("download","download-choice")}>Download JDK…</button></div>}
            {step==="jdk-folder"&&<div className="ide-picker"><b>Select JDK home directory</b><code>C:\JDKs\jdk-21</code><p>Thư mục minh họa có bin/java và bin/javac; không duyệt đĩa thật.</p>{control("jdk-folder","Chọn thư mục JDK 21 minh họa","language",{sdk:21,ideMissing:false})}</div>}
            {step==="download-choice"&&<div className="ide-picker"><b>Download JDK</b><p>Vendor: Eclipse Temurin · Location: thư mục minh họa</p>{control("download-choice","Version: 21 · tiếp tục mô phỏng","language",{sdk:21,ideMissing:false})}<small>Không tải/cài đặt. Máy thật cần chọn bản được team cho phép.</small></div>}
            <div className="ide-config-row"><b>Language level:</b>{control("language",`${s.language} ▾`,"language-choice")}</div>
            {step==="language-choice"&&<div className="ide-popup">{control("language-choice","21 – Record patterns, pattern matching for switch","project-apply",{language:21})}</div>}
            <label>Compiler output: <output>…/agent-workspaces/out</output></label>
          </div></div><footer>{control("project-apply","Apply","project-ok")}{control("project-ok","OK","settings-file")}</footer>
      </div>:settings?<div className="ide-dialog" aria-label="Settings">
        <div className="ide-dialog-title">Settings</div><div className="ide-dialog-body"><nav aria-label="Settings sections"><small>Appearance & Behavior</small><span>Editor</span>{control("build-settings","▸ Build, Execution, Deployment","gradle-settings")}{step!=="build-settings"&&control("gradle-settings","  Gradle","gradle-jvm")}</nav><div className="ide-page"><h4>Build, Execution, Deployment {step!=="build-settings"&&" › Gradle"}</h4>{!["build-settings","gradle-settings"].includes(step)&&<><label>Gradle project: <output>agent-workspaces</output></label><label>Build and run using: <output>Gradle</output></label><label>Distribution: <output>Wrapper · 8.14.3</output></label><div className="ide-config-row"><b>Gradle JVM:</b>{control("gradle-jvm",`${s.gradleJvm} · JDK ${s.gradleJvm} ▾`,"gradle-choice")}</div>{step==="gradle-choice"&&<div className="ide-popup">{control("gradle-choice","21 · Eclipse Temurin JDK","settings-apply",{gradleJvm:21})}</div>}</>}</div></div><footer>{control("settings-apply","Apply","settings-ok")}{control("settings-ok","OK","gradle-window")}</footer>
      </div>:<div className="ide-editor"><div className="ide-project-mini">Project<br/>▾ agent-workspaces<br/>　build.gradle<br/>　settings.gradle</div><pre>{"// build.gradle:46–50\njava {\n  toolchain {\n    languageVersion = JavaLanguageVersion.of(21)\n  }\n}"}</pre><aside>{control("gradle-window","Gradle","reload")}</aside></div>}
      {["reload","check","done"].includes(step)&&<div className="ide-gradle-tool"><b>Gradle · agent-workspaces</b>{control("reload","↻ Reload All Gradle Projects","check")}<span>{["check","done"].includes(step)?"Import hoàn tất trong mô hình; chưa chạy build/task Java.":"Tasks · chưa reload"}</span></div>}
    </div>
    <p className="ide-explanation">{["gradle-jvm","gradle-choice","settings-apply","settings-ok","gradle-window","reload","check","done"].includes(step)?`Project SDK ${s.sdk}: IDE/module · Gradle JVM ${s.gradleJvm}: chạy Gradle trong IDE · toolchain 21: compiler do build.gradle yêu cầu. Terminal trong bài vẫn JDK ${s.jdk}; chọn SDK trong IDE không đổi JAVA_HOME hoặc mọi terminal.`:"Project SDK là JDK mà IDE/module tham chiếu. Language level là mức cú pháp IDE hiểu. Toolchain 21 trong build.gradle chọn compiler; chưa có Java nào chạy từ các lựa chọn này."}</p>
    {s.ideLast&&<p className="ide-feedback" role="note">{ideActions[s.ideLast]?.result}</p>}
    {step==="check"&&<button className={`button primary ${s.ideHint?"ide-located":""}`} data-ide-action="check" onClick={()=>update({ideStep:"done",ideLast:"check",ideHint:false,synced:s.sdk===21&&s.language===21&&s.gradleJvm===21,notice:"ide-ok"},true)}>Xem kết quả kiểm tra trong bài học</button>}
    {step==="done"&&<div className="runtime-result"><b>KẾT QUẢ TRONG BÀI</b><p>Project SDK {s.sdk} · Language level {s.language} · Gradle JVM {s.gradleJvm} · Reload đã thực hiện.</p><p>Chưa build/chạy Java; terminal JDK {s.jdk} cần đối chiếu riêng.</p></div>}
    <details className="runtime-diagnosis"><summary>Nhánh: IDE đỏ nhưng Gradle build được</summary><p>S12 ghi chênh language/bytecode 17/21; file .idea hiện tại đã là 21. Đây là hai thời điểm khác nhau. Nếu vẫn đỏ sau kiểm tra cấu hình/reload, đối chiếu module SDK, bytecode, Lombok và annotation processing.</p><button className="button secondary" onClick={()=>update({ideStep:"file",ideLast:"",language:17,synced:false,diagnosis:true,notice:""})}>Xem tình huống IDE lệch 17/21</button></details>
    <details><summary>Nguồn tham chiếu bố cục</summary><p>.idea/misc.xml:4 và gradle.xml:8 xác nhận giá trị 21, không xác nhận phiên bản hoặc giao diện đang dùng.</p><p><a href="https://www.jetbrains.com/help/idea/sdk.html" target="_blank" rel="noreferrer">JetBrains · Project SDK / Add JDK</a> · <a href="https://www.jetbrains.com/help/idea/gradle-settings.html" target="_blank" rel="noreferrer">Gradle settings</a> · <a href="https://www.jetbrains.com/help/idea/gradle.html" target="_blank" rel="noreferrer">Gradle tool window / reload</a></p><p>Help tham chiếu 2026.3, tra ngày 06/11/2026. Bản khác có thể đặt Gradle dưới Build Tools.</p></details>
  </section>;
}
