import fs from 'node:fs';
import {statusFlows,statusSource} from '../src/content/policy/status.ts';

const reports=[
 ['status-acceptance','Đổi trạng thái · 8 flow / 3 chế độ / 40 bài / điều hướng'],
 ['status-regression','Hồi quy Tạo mới, source workspace và toàn bộ Cập nhật'],
 ['status-source','Đối chiếu SHA256 snapshot với backend'],
 ['status-dialog','Kiểm tra lại cửa sổ dùng chung sau khi đưa style về component chung'],
 ['status-final-model','Đối chiếu lại dữ liệu tám flow và các biến thể sau khi chốt tên method nguồn'],
];
const tests=reports.map(([id,description])=>{
 const path=`.verification/${id}/report.json`,report=JSON.parse(fs.readFileSync(path,'utf8'));
 if(report.errors.length||report.stats.unexpected||report.stats.flaky||report.stats.skipped)throw Error(`Unresolved result: ${path}`);
 return {description,report:path,passed:report.stats.expected,failed:report.stats.unexpected,flaky:report.stats.flaky,skipped:report.stats.skipped,durationMs:report.stats.duration};
});
const captured=JSON.parse(fs.readFileSync('docs/review/policy-status-links.json','utf8'));
if(captured.errors.length||captured.observations.length!==90)throw Error('Review capture incomplete.');
const result={
 recordedAt:new Date().toISOString(),
 summary:`Hoàn tất 8 flow, 3 chế độ học và 40 bài triển khai theo bước. Build/typecheck đạt; ${tests[0].passed} kiểm tra Đổi trạng thái, ${tests[1].passed} kiểm tra hồi quy, ${tests[2].passed} kiểm tra source và ${tests[3].passed} kiểm tra lại cửa sổ/điều hướng đạt. ${Object.keys(statusSource.sources).length} file Java khớp SHA256; 45 fixture hợp lệ; 90 màn review với bảy cặp đối chiếu Tạo mới.`,
 tests,
 build:{command:'npm.cmd run build',result:'passed',note:'Vite có cảnh báo kích thước chunk >500 kB; source viewer dùng snapshot đầy đủ và được lazy-load theo tab.'},
 integrity:{sourceCommand:'node scripts/extract-policy-status-source.mjs --root D:/ALPACA/agent-system --check',sourceResult:'passed',completeJavaFiles:Object.keys(statusSource.sources).length,schedulerConfigurationExcerpts:statusSource.scheduleConfiguration.length,fixtureCommand:'node scripts/verify-fixtures.mjs',fixtureResult:'passed',bundledFiles:45,diffCheck:'passed'},
 review:{url:'http://localhost:3182/docs/review/policy-status.html',result:'HTTP 200; local image references checked',captures:captured.observations.length,browserErrors:captured.errors,desktopViewport:{width:1440,height:1000},mobileViewport:{width:390,height:844},zoom:1,deviceScaleFactor:1,pairedCreateScreens:['overview','checkpoint','reason','cooperate','pattern','diagram','implementation']},
 flows:statusFlows.map(f=>({id:f.id,title:f.title,family:f.family,entry:f.entry,identity:f.identity,callerVerified:f.callerVerified,modes:['overview','steps','assembly'],implementationStages:f.steps.length,checkpoints:f.points.length,event:f.eventName,limits:f.limits})),
 verifiedCases:['before effectiveDate → 0','within period → 100','after expirationDate → -1','exact effectiveDate with stored 0: query skips, helper not run','exact expirationDate with stored 100: query skips, helper not run','exact expirationDate with stored 0: selected, helper 100','missing/terminated DTO after selection: guard before helper','unchanged status: no Policy write','Core direct status including -100 and unknown numeric code; no date remap','Core same status still writes; paymentStatus computed separately','two creation entries converge at PolicyAggregate L328 after distinct guards','releaseDate adjustment precedes helper in approval/offline fixtures','online HTTP/queue/scan; PUBLISHED and blank-event early stop','mode/flow/group/reload/deep-link preservation','future source inspection cannot execute ahead of replay','full-file A/B highlights and clipboard','all eight mobile overviews and complete source in dark mode'],
 fixesVerified:['Controlled comparison date retains edits while Router changes URL.','Implementation action validates against current selected file.','Selecting a different online actor opens its checkpoint plan without reusing an executed HTTP cursor.','Shared dialog owns its tab/panel styles; header and mode tabs remain in view when scrolling implementation, with the status file tree alongside.'],
 limits:['Fixture/source verification only; no Java, API, database, gateway or queue was executed.','Caller for CreatePolicyWithoutLockAndTransactionFunc remains unverified; lesson starts at exec and map marks unknown actor.','Core business rules and outside producer of QuotePaidEvent are not established by these local call sites.','Java runtime timezone and deployment configuration overrides are not verified; Calendar fixture declares UTC+07:00.','Event/view timing is represented by separate checkpoints, not a runtime latency claim.'],
 backend:'Read-only; existing untracked docs directory preserved.',
};
fs.writeFileSync('docs/review/policy-status-validation.json',JSON.stringify(result,null,2)+'\n');
console.log(result.summary);
