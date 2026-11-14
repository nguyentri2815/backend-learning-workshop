import {test,expect} from '@playwright/test';
import type {Page} from '@playwright/test';
import {implementationTasks,listSource} from '../../src/content/policy/list';
import {listJourney} from '../../src/content/policy/list-journey';
import {listLearningLesson,listPatternModel as listPatternAdapter} from '../../src/policy/list-learning-data';
import {listLearningState,listScenarios,evaluateList} from '../../src/policy/list-model';

const root='/journey/policy?group=list',route=root+'&mode=steps';
const business=(page:Page,index:number)=>page.locator('.learning-steps button').nth(index);
async function point(page:Page,id:string){await page.getByRole('button',{name:'Điểm sau',exact:true}).click();await expect(page.getByTestId('list-checkpoint')).toHaveAttribute('data-viewing',id);await expect(page.getByTestId('list-checkpoint')).toHaveAttribute('data-executed','true');}
async function stage(page:Page,id:string){await page.getByRole('button',{name:'Bước sau',exact:true}).click();await expect(page.getByTestId('list-checkpoint')).toHaveAttribute('data-viewing',id);}
async function send(page:Page){await page.getByRole('button',{name:'Tìm hợp đồng mẫu',exact:true}).click();await expect(page.getByTestId('list-checkpoint')).toHaveAttribute('data-viewing','list-api');await expect(page.getByTestId('list-checkpoint')).toHaveAttribute('data-executed','true');}
async function toScope(page:Page){await send(page);await point(page,'list-input');await stage(page,'list-scope');}
async function toResults(page:Page,earlyError=false){await toScope(page);await point(page,'list-scope');if(!earlyError)await point(page,'list-filter');await stage(page,earlyError?'list-result':'list-page');if(!earlyError)await point(page,'list-page');await point(page,'list-result');await point(page,'list-table');}
async function answerStep(page:Page,id='list-scope'){
 for(let i=0;i<2;i++){await page.getByRole('navigation',{name:'Tiến trình quyết định'}).getByRole('button').nth(i).click();await page.locator('.assembly-choice-options input').first().click();await expect.poll(()=>new URL(page.url()).searchParams.get(`assemblyAnswers.${id}`)?.split(',')[i]).toBe('0');}
}

test('all List patterns, code pairs and diagram files stay inside verified snapshots',()=>{
 const params=new URLSearchParams(),session=listLearningState(params);
 for(const step of listJourney)for(const pattern of listLearningLesson(step,session,params).patterns){
  const model=listPatternAdapter.diagram(pattern);expect(model.files.length).toBeGreaterThan(1);
  for(const edge of pattern.edges){const trace=listPatternAdapter.trace(pattern,edge);for(const side of [trace.caller,trace.receiver])for(const mark of side.focus.annotations){expect(mark.start).toBeGreaterThan(0);expect(mark.end).toBeLessThanOrEqual(listPatternAdapter.sources[side.focus.ref].rows.length);expect(listPatternAdapter.sources[side.focus.ref].rows.slice(mark.start-1,mark.end).map(r=>r.text).join('\n')).toBe(side.code);}}
 }
});

test('overview shares the map tools, legend and entry action; branches and resume retain the lesson',async({page})=>{
 await page.goto(root+'&mode=overview');await expect(page.getByTestId('list-journey-map').locator('.react-flow__node')).toHaveCount(8);
 await expect(page.locator('.policy-map-tools')).toContainText('Đặt lại bố cục');await expect(page.locator('.policy-map-legend')).toContainText('Đường đang học');await expect(page.getByRole('button',{name:'Làm lại từng bước',exact:true})).toBeVisible();
 await page.getByRole('button',{name:'3B Không có hợp đồng phù hợp',exact:true}).click();await expect(page.locator('.policy-learning-path')).toContainText('Kết quả rỗng');
 await page.getByRole('button',{name:'Làm lại từng bước',exact:true}).click();await expect(page.getByRole('textbox',{name:'Từ khóa',exact:true})).toHaveValue('KHONG-CO');
 await page.getByRole('tab',{name:'Nhìn toàn cảnh',exact:true}).click();await page.getByRole('button',{name:'Quay về đúng bước đang học',exact:true}).click();await expect(page.locator('.list-practice')).toHaveAttribute('data-business-step','find');
});

for(const mobile of [false,true])test(`${mobile?'mobile':'desktop'}: search, locked checkpoints, same submitted criteria on paging, row ID and empty result`,async({page})=>{
 await page.setViewportSize(mobile?{width:390,height:844}:{width:1440,height:1000});const api:string[]=[],errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(/^\/policy\//.test(new URL(r.url()).pathname))api.push(r.url());});
 await page.goto(root+'&mode=overview');await page.getByRole('button',{name:'Làm lại từng bước',exact:true}).click();await expect(business(page,1)).toBeDisabled();await expect(page.getByRole('combobox',{name:'Danh tính backend mẫu'})).not.toBeVisible();
 await toScope(page);await expect(page.getByTestId('list-checkpoint')).toHaveAttribute('data-executed','false');await expect(page.getByTestId('debug-after')).toContainText('Chưa chạy dòng này');
 await point(page,'list-scope');await expect(page.getByTestId('debug-after')).toContainText('backend');await point(page,'list-filter');await expect(page.getByTestId('debug-before')).toContainText('criteria');await expect(page.getByTestId('debug-after')).toContainText('normalizedKeyword');
 await stage(page,'list-page');await point(page,'list-page');await point(page,'list-result');await point(page,'list-table');await expect(page.getByTestId('list-results').locator('tbody tr')).toHaveCount(2);
 await business(page,0).click();await page.getByRole('textbox',{name:'Từ khóa',exact:true}).fill('KHONG-CO');await page.locator('.list-advanced>summary').click();await page.getByRole('combobox',{name:'Danh tính backend mẫu'}).selectOption('missing');await business(page,2).click();
 await page.getByRole('button',{name:'Trang tiếp',exact:true}).click();await expect(page.getByTestId('list-results')).toContainText('POL-LEARN-003');await expect(page.locator('.list-page-change')).toContainText('0 → 1');
 const params=new URL(page.url()).searchParams;expect(JSON.parse(params.get('listRequest')!)).toMatchObject({keyword:'S-DEMO',pageNumber:1});expect(params.get('listSentPersona')).toBe('seller');expect(JSON.parse(params.get('listDraft')!).keyword).toBe('KHONG-CO');
 await page.getByTestId('list-results').locator('tbody tr').click();await page.getByRole('button',{name:'Bàn giao POL-LEARN-003 sang Chi tiết',exact:true}).click();await expect(page.getByTestId('policy-id-trail')).toContainText('POL-LEARN-003');
 await page.getByRole('tab',{name:'02 Danh sách',exact:true}).click();await page.reload();await expect(page.locator('.list-selected-id')).toContainText('POL-LEARN-003');
 await business(page,0).click();await page.locator('.list-advanced>summary').click();await page.getByRole('group',{name:'Tình huống Danh sách'}).getByRole('button',{name:'Kết quả rỗng',exact:true}).click();await toResults(page);await expect(page.getByTestId('list-results').locator('tbody tr')).toHaveCount(0);await expect(page.locator('.list-empty')).toContainText('Không có hợp đồng');await page.reload();await expect(page.locator('.list-empty')).toBeVisible();
 expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(mobile?390:1440);expect(api).toEqual([]);expect(errors).toEqual([]);
});

test('middle step uses shared reasoning, handoff, frames, same-file A/B colors and both workspace modes without moving the stop',async({page,context})=>{
 await context.grantPermissions(['clipboard-read','clipboard-write']);await page.goto(route);await toScope(page);await point(page,'list-scope');await point(page,'list-filter');
 await page.getByRole('tab',{name:'Tư duy lắp ráp',exact:true}).click();await expect(page.locator('.assembly-step-heading')).toContainText('2/4');await expect(page.locator('.assembly-question')).toContainText('Vì sao S-DEMO-001');await expect(page.locator('.assembly-context-panel')).toContainText('DV-A');await expect(page.locator('.assembly-technical')).not.toHaveAttribute('open','');
 await page.getByText('Mở gợi ý',{exact:true}).click();await expect(page.locator('.assembly-consequence')).toHaveCount(0);await answerStep(page);
 await page.getByRole('tab',{name:'Phối hợp',exact:true}).click();await page.getByRole('navigation',{name:'Chọn một lần bàn giao'}).getByRole('button').last().click();await expect(page.locator('.assembly-handoff')).toContainText('Giao SQL và Pageable');await expect(page.locator('.assembly-handoff')).toContainText('DV-A');
 await page.getByRole('navigation',{name:'Chọn một lần bàn giao'}).getByRole('button').first().click();await page.getByRole('button',{name:'Xem mẫu thiết kế',exact:true}).click();
 await expect(page.locator('.assembly-pattern-picker')).toContainText('Mẫu tham khảo đã xác minh');await expect(page.locator('.assembly-pair-frames>section')).toHaveCount(2);await page.getByRole('button',{name:/^Mở source A/}).click();
 const source=page.locator('.assembly-source-entry[data-source-ref=search]');await source.locator('summary').filter({hasText:'Mở toàn bộ file'}).click();const full=source.locator('[data-full-source=search]');await expect(full.locator('[data-line="47"]')).toHaveAttribute('data-code-tone','caller');await expect(full.locator('[data-line="54"]')).toHaveAttribute('data-code-tone','receiver');
 await page.getByRole('tab',{name:'KHUNG THÀNH PHẦN',exact:true}).click();await page.getByRole('button',{name:'Sao chép mẫu',exact:true}).click();expect(await page.evaluate(()=>navigator.clipboard.readText())).toContain('SaleUnitViewEntity');
 await page.getByRole('tab',{name:'KHUNG PHỐI HỢP',exact:true}).click();await page.getByRole('button',{name:'Xem sơ đồ phối hợp',exact:true}).click();const dialog=page.getByRole('dialog',{name:'Sơ đồ phối hợp và cây workspace'});await expect(dialog.getByLabel('Cây file của mẫu đang chọn',{exact:true})).toBeVisible();
 await dialog.getByRole('button',{name:'Giao SQL và Pageable',exact:true}).click();await dialog.getByRole('button',{name:'B · Đi tới bên nhận',exact:true}).click();await dialog.getByRole('button',{name:'Mở toàn bộ file',exact:true}).click();await expect(dialog.locator('[data-full-source=repository] [data-line="26"]')).toHaveAttribute('data-code-tone','receiver');await expect(dialog.locator('[data-full-source=repository] [data-line="39"]')).toHaveAttribute('data-code-tone','receiver');
 await dialog.getByRole('tab',{name:'Từng bước triển khai',exact:true}).click();await expect(dialog.locator('.list-build-task')).toHaveAttribute('data-task','conditions');await page.keyboard.press('Escape');
 await page.getByRole('tab',{name:'Làm lại từng bước',exact:true}).click();await expect(page.getByTestId('list-checkpoint')).toHaveAttribute('data-stop','list-filter');await expect(page.getByTestId('list-checkpoint')).toHaveAttribute('data-executed','true');
});

test('assembly samples and decisions are per step and do not overwrite replay data',async({page})=>{
 await page.goto(route);await toScope(page);await point(page,'list-scope');const sent=new URL(page.url()).searchParams.get('listRequest');
 await page.getByRole('tab',{name:'Tư duy lắp ráp',exact:true}).click();await page.getByRole('combobox',{name:'Bộ dữ liệu khám phá'}).selectOption('empty');await expect(page.locator('.assembly-context-panel')).toContainText('KHONG-CO');expect(new URL(page.url()).searchParams.get('listRequest')).toBe(sent);expect(new URL(page.url()).searchParams.get('listCursor')).toBe('list-scope');
 await answerStep(page);await page.getByRole('tab',{name:'Chọn mẫu',exact:true}).click();await business(page,2).click();await expect(page.getByRole('tab',{name:'Suy luận',exact:true})).toHaveAttribute('aria-selected','true');await expect(page.locator('.assembly-consequence')).toHaveCount(0);await business(page,1).click();await expect(page.getByRole('tab',{name:'Chọn mẫu',exact:true})).toHaveAttribute('aria-selected','true');
});

test('history, previous source positions and legacy deep links keep viewed versus executed checkpoints separate',async({page})=>{
 await page.goto(route+'&node=list-filter&searched=1&listStop=2&listCursor=list-scope&listPriorPoint=list-input');await expect(page.getByTestId('list-checkpoint')).toHaveAttribute('data-executed','false');await expect(page.getByRole('button',{name:'Điểm sau',exact:true})).toBeDisabled();
 await expect(page.getByRole('button',{name:/Xem vị trí trước/})).toContainText('SearchPolicyRequest.java');await page.getByRole('button',{name:'Mở chi tiết',exact:true}).click();await page.getByRole('button',{name:'Quay về dòng đang chạy',exact:true}).click();await point(page,'list-filter');
 await page.getByRole('button',{name:'Điểm trước',exact:true}).click();await expect(page.getByTestId('list-checkpoint')).toHaveAttribute('data-viewing','list-scope');await expect(page.getByTestId('list-checkpoint')).toHaveAttribute('data-stop','list-filter');await point(page,'list-filter');
 await page.getByRole('button',{name:'Luồng thực thi',exact:true}).click();const trace=page.getByRole('dialog');await trace.getByText('Các cạnh và dữ liệu bàn giao',{exact:true}).click();await trace.getByRole('navigation',{name:'Các cạnh Danh sách'}).getByRole('button').nth(2).click();await expect(trace).not.toBeVisible();await expect(page.getByTestId('list-checkpoint')).toHaveAttribute('data-viewing','list-filter');await expect(page.getByTestId('list-checkpoint')).toHaveAttribute('data-stop','list-filter');
 await page.getByRole('tab',{name:'01 Tạo mới',exact:true}).click();await page.getByRole('tab',{name:'02 Danh sách',exact:true}).click();await page.reload();await expect(page.getByTestId('list-checkpoint')).toHaveAttribute('data-viewing','list-filter');await expect(page.getByTestId('list-code')).toHaveAttribute('data-source-ref','search');
 await page.goto(route+'&point=list-source');await expect(page.locator('.list-practice')).toHaveAttribute('data-business-step','results');await expect(page.getByTestId('list-checkpoint')).toHaveAttribute('data-stop','none');await expect(page.getByTestId('debug-after')).toContainText('Chưa chạy dòng này');
});

test('empty, identity failure and all special search scenarios retain the verified fixture behavior',async({page})=>{
 test.setTimeout(60000);await page.goto(route);
 for(const scenario of listScenarios.filter(s=>s.id!=='page')){
  await business(page,0).click();await page.locator('.list-advanced>summary').click();await page.getByRole('group',{name:'Tình huống Danh sách'}).getByRole('button',{name:scenario.title,exact:true}).click();await toResults(page,scenario.persona==='missing');
  const result=evaluateList(scenario.request,scenario.persona);await expect(page.getByTestId('list-results').locator('tbody tr')).toHaveCount(result.page.content.length);await expect(page.locator('.list-result-summary')).toContainText(`${result.page.totalElements} hợp đồng`);if(scenario.id==='error')await expect(page.locator('.list-results-panel')).toContainText('Rỗng do catch');
 }
});

test('each business step has a scoped implementation workspace with real patches and trials',async({page})=>{
 test.setTimeout(60000);
 const groups=[['find',['pattern','dto','endpoint']],['scope',['conditions']],['results',['read','map']],['detail',['trial']]] as const;
 for(const [businessId,ids] of groups){
  const stepId=`list-${businessId}`,node=listJourney.find(s=>s.id===businessId)!.points[0],params=new URLSearchParams({group:'list',mode:'assembly',node,[`assemblyAnswers.${stepId}`]:'0,0',[`assemblyView.${stepId}`]:'pattern',[`assemblyDiagram.${stepId}`]:'1',[`assemblyDiagramMode.${stepId}`]:'practice'});
  await page.goto('/journey/policy?'+params);const dialog=page.getByRole('dialog',{name:'Sơ đồ phối hợp và cây workspace'});
  for(const [i,id] of ids.entries()){
   const task=implementationTasks.find(t=>t.id===id)!;await expect(dialog.locator('.list-build-task')).toHaveAttribute('data-task',id);await dialog.getByRole('button',{name:'Chỉ vị trí',exact:true}).click();await expect(dialog.locator('.list-build-code h4')).toContainText(listSource.sources[task.ref].path.split('/').at(-1)!);
   if(id==='trial'){for(const title of ['Tìm thấy','Kết quả rỗng','Đổi trang','Phạm vi dữ liệu','Lỗi bị trả rỗng'])await dialog.getByRole('button',{name:`Thử ${title}`,exact:true}).click();}
   else{await dialog.getByRole('combobox',{name:'Thao tác triển khai'}).selectOption('1');await dialog.getByRole('button',{name:task.action,exact:true}).click();await expect(dialog.getByRole('status')).toContainText('Chưa khớp');await dialog.getByRole('combobox',{name:'Thao tác triển khai'}).selectOption('0');await dialog.getByRole('button',{name:task.action,exact:true}).click();if(id!=='pattern')await expect(dialog.locator('.list-build-diff')).toBeVisible();}
   await expect(dialog.locator('.list-build-result')).toContainText(task.result);if(i<ids.length-1)await dialog.getByRole('button',{name:'Tiếp theo',exact:true}).click();
  }
  await page.reload();await expect(dialog.locator('.list-build-task')).toHaveAttribute('data-task',ids.at(-1)!);await dialog.getByRole('button',{name:'Làm lại phần triển khai',exact:true}).click();await expect(dialog.locator('.list-build-task')).toHaveAttribute('data-task',ids[0]);
 }
});

test('Create view hands a real row to List, while a Command-only ID cannot produce a handoff',async({page})=>{
 await page.goto('/journey/policy?group=create&mode=steps&node=result&sim=view');await page.getByRole('button',{name:'Mở bài Danh sách với Policy vừa tạo',exact:true}).click();await expect(page.getByTestId('list-results')).toContainText('POL-FROM-QUOTE-LEARN-101');await page.getByRole('button',{name:'Mở chi tiết POL-FROM-QUOTE-LEARN-101',exact:true}).click();await expect(page.getByTestId('policy-id-trail')).toContainText('POL-FROM-QUOTE-LEARN-101');
 await page.goto('/journey/policy?'+new URLSearchParams({group:'list',mode:'steps',node:'list-handoff',quote:'QUOTE-LEARN-101',sim:'command',searched:'1',keyword:'S-DEMO-CREATED-101',status:'all',selected:'POL-FROM-QUOTE-LEARN-101',listStop:'7'}));await expect(page.getByTestId('list-results').locator('tbody tr')).toHaveCount(0);await expect(page.locator('.list-selected-id')).toHaveCount(0);
});
