import {expect,test} from '@playwright/test';
import type {Locator,Page} from '@playwright/test';
import {assemblySteps} from '../../src/content/policy/assembly';
import {learningSteps} from '../../src/content/policy/assembly-learning';
import {creationContext} from '../../src/policy/create-model';
import {implementationChanges,implementationLessons,implementationRows} from '../../src/content/policy/assembly-implementation';
import sources from '../../src/content/policy/assembly-source.json' with {type:'json'};

const lessons=learningSteps(creationContext(new URLSearchParams()));
function url(step:string) {
  const params=new URLSearchParams({group:'create',mode:'assembly',assemblyStep:step,node:'save',sim:'command',at:'save-return',stop:'save-return',walk:'quote-ui,quote-request,controller-call'});
  params.set(`assemblyAnswers.${step}`,lessons[step].decisions.map(()=>0).join(','));
  params.set(`assemblyView.${step}`,'pattern');
  return '/journey/policy?'+params;
}
async function open(page:Page,step:string) {
  await page.goto(url(step));
  await page.getByRole('button',{name:'Xem sơ đồ phối hợp',exact:true}).click();
  return page.getByRole('dialog',{name:'Sơ đồ phối hợp và cây workspace'});
}
const practice=(dialog:Locator)=>dialog.locator('.implementation-practice');
const next=(dialog:Locator)=>dialog.getByRole('button',{name:'Tiếp theo',exact:true}).click();
async function locate(dialog:Locator) {await dialog.getByRole('button',{name:'Chỉ vị trí',exact:true}).click();}
async function connect(dialog:Locator,step:string,index:number) {
  const task=implementationLessons[step].tasks[index];
  await locate(dialog);
  if(task.answer)await dialog.getByRole('combobox',{name:'Chọn thao tác',exact:true}).selectOption(task.answer);
  await dialog.getByRole('button',{name:task.action,exact:true}).click();
  await expect(dialog.locator('.implementation-task > header')).toContainText('Đã thực hiện');
}

test('checkpoints cover exactly six steps; simulation never exposes future edits or changes the snapshot',()=>{
  expect(Object.keys(implementationLessons)).toEqual(assemblySteps.map(s=>s.id));
  for(const step of assemblySteps) {
    const lesson=implementationLessons[step.id];
    expect(lesson.tasks.length).toBeGreaterThanOrEqual(3);
    for(const task of lesson.tasks) {
      expect(task.why.length).toBeGreaterThan(30);expect(task.result.length).toBeGreaterThan(30);expect(task.enables.length).toBeGreaterThan(25);
      for(const p of task.patches??[]) {
        expect(p.to).toBeLessThanOrEqual(sources[p.ref].rows.length);
        expect(p.from).toBeGreaterThan(0);
      }
    }
  }
  const original=JSON.stringify(sources);
  const before=implementationRows('func','validate',[]).map(r=>r.text).join('\n');
  expect(before).toContain('exec(String quoteId)');expect(before).not.toContain('quoteRepository.findById(quoteId)');
  const afterRead=implementationRows('func','validate',['repository','read']).map(r=>r.text).join('\n');
  expect(afterRead).toContain('quoteRepository.findById(quoteId)');expect(afterRead).not.toContain('PlatformErrorCode.QUOTE_NOT_EXIST');
  const afterGuard=implementationRows('func','validate',['repository','read','guards']);
  expect(afterGuard.find(r=>r.line===63)?.text).toContain('PlatformErrorCode.QUOTE_NOT_EXIST');
  expect(afterGuard.find(r=>r.line===77)?.text).toContain('PlatformErrorCode.QUOTE_CAN_NOT_RELEASE_POLICY');
  expect(afterGuard.some(r=>r.text.includes('MappingUtils.mapObject(quoteAggregate, CreatePolicyCommand.class)'))).toBe(false);
  expect(afterGuard.some(r=>r.text.includes('policyAggregateRepository.save(command)'))).toBe(false);
  const stepOne=implementationRows('func','quote',['api','receiver']);
  expect(stepOne.find(r=>r.line===60)?.text).toContain('exec(String quoteId)');
  expect(stepOne.some(r=>r.text.includes('quoteRepository.findById(quoteId)'))).toBe(false);
  for(const p of implementationChanges)expect(sources[p.ref].rows.slice(p.from-1,p.to).some(r=>r.text.trim())).toBe(true);
  expect(JSON.stringify(sources)).toBe(original);
});

for(const mobile of [false,true])for(const dark of [false,true])test(`${mobile?'mobile':'desktop'} ${dark?'dark':'light'}: step 2 acceptance, retained diagram/code/tree and isolated replay`,async({page})=>{
  await page.setViewportSize(mobile?{width:390,height:844}:{width:1440,height:900});
  const errors:string[]=[];page.on('pageerror',error=>errors.push(error.message));
  const dialog=await open(page,'validate');
  if(dark) {
    await dialog.getByRole('button',{name:'Đóng sơ đồ phối hợp',exact:true}).click();
    await page.getByRole('button',{name:'Giao diện tối',exact:true}).click();
    await page.getByRole('button',{name:'Xem sơ đồ phối hợp',exact:true}).click();
  }
  await expect(dialog.getByRole('tab',{name:'Sơ đồ liên quan',exact:true})).toHaveAttribute('aria-selected','true');
  const treeToggle=dialog.getByRole('button',{name:/^Cây workspace/});
  if(await treeToggle.getAttribute('aria-expanded')==='false')await treeToggle.click();
  await dialog.getByRole('navigation',{name:'Chọn node liên quan'}).getByRole('button').first().click();
  await dialog.locator('.assembly-diagram-source').getByRole('button',{name:'Mở toàn bộ file',exact:true}).click();
  const source=dialog.locator('.assembly-diagram-source');
  await expect(source.locator('[data-testid=highlighted-code]')).toHaveAttribute('data-ready','true');
  const originalSource=await source.getAttribute('data-source-ref');
  const markedLines=await source.locator('[data-code-tone]').evaluateAll(nodes=>nodes.map(n=>n.getAttribute('data-line')));
  const treeChoice=await dialog.locator('.assembly-diagram-panel .assembly-diagram-tree .tree-file.selected').textContent();
  const graphTransform=await dialog.locator('.react-flow__viewport').getAttribute('style');
  const replayKeys=['node','sim','at','stop','walk'];
  const replay=Object.fromEntries(replayKeys.map(k=>[k,new URL(page.url()).searchParams.get(k)]));
  await dialog.getByRole('tab',{name:'Từng bước triển khai',exact:true}).click();
  const p=practice(dialog);
  await expect(p).toContainText('Mốc khởi đầu · Bước 2');
  await expect(p.locator('.implementation-empty')).toBeVisible();
  // Find the repository without using the locator hint.
  await p.getByRole('button',{name:'QuoteRepository.java',exact:true}).click();
  await expect(p.locator('.implementation-code')).toContainText('extends JpaRepository<QuoteAggregate, String>');
  await p.getByRole('button',{name:'Mở repository',exact:true}).click();
  await expect(p.locator('.implementation-result')).toContainText('không tạo repository mới');
  await next(dialog);
  await locate(dialog);
  await expect(p.locator('.implementation-code')).not.toContainText('quoteRepository.findById(quoteId)');
  await p.getByRole('combobox',{name:'Chọn thao tác'}).selectOption('policyRepository.findById(quoteId)');
  await p.getByRole('button',{name:'Thêm lời gọi',exact:true}).click();
  await expect(p.locator('.implementation-feedback')).toContainText('không trả QuoteAggregate');
  await p.getByRole('combobox',{name:'Chọn thao tác'}).selectOption('quoteRepository.findById(quoteId)');
  await p.getByRole('button',{name:'Thêm lời gọi',exact:true}).click();
  await expect(p.locator('.implementation-diff')).toContainText('Trước');
  await expect(p.locator('.implementation-diff section').last()).toContainText('quoteRepository.findById(quoteId)');
  await expect(p.locator('.implementation-diff section').first()).not.toContainText('quoteRepository.findById(quoteId)');
  await next(dialog);
  await connect(dialog,'validate',2);
  await p.getByRole('button',{name:'Mở toàn bộ file',exact:true}).click();
  const full=p.locator('[data-practice-full]');
  await expect(full.locator('[data-line="62"]')).toHaveAttribute('data-code-tone','component');
  await expect(full.locator('[data-line="63"]')).toContainText('QUOTE_NOT_EXIST');
  await expect(full.locator('[data-line="76"]')).toHaveAttribute('data-code-tone','component');
  await expect(full.locator('[data-line="61"]')).not.toHaveAttribute('data-code-tone','component');
  await expect(full.locator('[data-line="62"]')).toBeInViewport();
  // The code and outer reading positions survive tab changes.
  const scroll=await full.locator('[data-testid=highlighted-code]').evaluate(el=>{el.scrollTop=30;return el.scrollTop;});
  const practiceScroll=await dialog.locator('.assembly-implementation-panel').evaluate(el=>el.scrollTop);
  await dialog.getByRole('tab',{name:'Sơ đồ liên quan',exact:true}).click();
  await expect(source).toHaveAttribute('data-source-ref',originalSource!);
  await expect(source.getByRole('button',{name:'Đoạn liên quan',exact:true})).toBeVisible();
  expect(await source.locator('[data-code-tone]').evaluateAll(nodes=>nodes.map(n=>n.getAttribute('data-line')))).toEqual(markedLines);
  expect(await dialog.locator('.assembly-diagram-panel .assembly-diagram-tree .tree-file.selected').textContent()).toBe(treeChoice);
  expect(await dialog.locator('.react-flow__viewport').getAttribute('style')).toBe(graphTransform);
  await dialog.getByRole('tab',{name:'Từng bước triển khai',exact:true}).click();
  await expect(dialog.getByRole('tab',{name:'Từng bước triển khai',exact:true})).toHaveAttribute('aria-selected','true');
  expect(await full.locator('[data-testid=highlighted-code]').evaluate(el=>el.scrollTop)).toBe(scroll);
  expect(await dialog.locator('.assembly-implementation-panel').evaluate(el=>el.scrollTop)).toBe(practiceScroll);
  await next(dialog);
  await p.getByRole('button',{name:'Thử nhánh thiếu dữ liệu',exact:true}).click();
  await expect(p.locator('[data-trial=missing]')).toContainText('QUOTE_NOT_EXIST');
  await expect(dialog.getByRole('button',{name:'Tiếp theo',exact:true})).toBeDisabled();
  await p.getByRole('button',{name:'Thử nhánh hợp lệ',exact:true}).click();
  await expect(p.locator('[data-trial=valid]')).toContainText('được phép dựng Command');
  await p.getByRole('button',{name:'Thử thêm: đã có Policy',exact:true}).click();
  await expect(p.locator('[data-trial=blocked]')).toContainText('QUOTE_CAN_NOT_RELEASE_POLICY');
  await dialog.getByRole('button',{name:'Trước',exact:true}).click();
  await next(dialog);
  await expect(p.locator('[data-trial]')).toHaveCount(3);
  await dialog.getByRole('button',{name:'Trước',exact:true}).click();
  await dialog.getByRole('button',{name:'Trước',exact:true}).click();
  await p.getByRole('button',{name:'Xem đoạn liên quan',exact:true}).click();
  await expect(p.locator('.implementation-diff section').first()).not.toContainText('PlatformErrorCode.QUOTE_NOT_EXIST');
  await expect(p.locator('.implementation-task > header')).toContainText('Đã thực hiện');
  await next(dialog);await next(dialog);
  await page.screenshot({path:`docs/review/implementation-step2-${mobile?'mobile':'desktop'}-${dark?'dark':'light'}.png`});
  await page.reload();
  await expect(practice(page.getByRole('dialog')).locator('[data-trial]')).toHaveCount(3);
  await page.getByRole('dialog').getByRole('button',{name:'Làm lại phần này',exact:true}).click();
  await expect(page.locator('.implementation-task')).toHaveAttribute('data-task','repository');
  await expect(page.locator('[data-trial]')).toHaveCount(0);
  await expect(page.locator('.implementation-empty')).toBeVisible();
  const params=new URL(page.url()).searchParams;
  expect(Object.fromEntries(replayKeys.map(k=>[k,params.get(k)]))).toEqual(replay);
  expect(errors).toEqual([]);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(mobile?390:1440);
});

test('every step has its own actions, before/after changes, results and reset checkpoint',async({page})=>{
  const errors:string[]=[];page.on('pageerror',error=>errors.push(error.message));
  for(const step of assemblySteps.filter(s=>s.id!=='validate')) {
    const dialog=await open(page,step.id);
    await dialog.getByRole('tab',{name:'Từng bước triển khai',exact:true}).click();
    const p=practice(dialog),tasks=implementationLessons[step.id].tasks;
    for(const [index,task] of tasks.entries()) {
      await expect(p.locator('.implementation-task')).toHaveAttribute('data-task',task.id);
      await locate(dialog);
      if(task.kind==='read-check') {
        await p.getByRole('textbox',{name:'Policy ID để kiểm tra'}).fill('QUOTE-LEARN-101');
        await p.getByRole('button',{name:task.action,exact:true}).click();
        await expect(p.locator('.implementation-feedback')).toContainText('quoteId không phải Policy ID');
        await p.getByRole('textbox',{name:'Policy ID để kiểm tra'}).fill('POL-FROM-QUOTE-LEARN-101');
      }
      await connect(dialog,step.id,index);
      await expect(p.locator('.implementation-result')).toContainText(task.enables);
      if(task.patches) {
        await expect(p.locator('.implementation-diff section')).toHaveCount(2);
        await p.getByRole('button',{name:'Mở toàn bộ file',exact:true}).click();
        const line=task.patches[0].from;
        await expect(p.locator(`[data-practice-full] [data-line="${line}"]`)).toHaveAttribute('data-code-tone','component');
        await p.getByRole('button',{name:'Xem đoạn liên quan',exact:true}).click();
      }
      if(task.kind==='view')await expect(p.locator('.implementation-view-result')).toContainText('Chưa có dòng');
      if(task.kind==='read-check')await expect(p.locator('.implementation-read-result tbody tr')).toHaveCount(2);
      if(index<tasks.length-1)await next(dialog);
    }
    await dialog.getByRole('button',{name:'Trước',exact:true}).click();
    await expect(p.locator('.implementation-task > header')).toContainText('Đã thực hiện');
    await next(dialog);
    await dialog.getByRole('button',{name:'Làm lại phần này',exact:true}).click();
    await expect(p.locator('.implementation-task')).toHaveAttribute('data-task',tasks[0].id);
    await expect(p.locator('.implementation-empty')).toBeVisible();
  }
  expect(errors).toEqual([]);
});

test('next business step is beside decision navigation and has no duplicate footer',async({page})=>{
  for(const [index,step] of assemblySteps.entries()) {
    await page.goto(`/journey/policy?group=create&mode=assembly&assemblyStep=${step.id}`);
    const toolbar=page.locator('.assembly-decision-toolbar');
    await expect(toolbar.getByRole('button',{name:'Quyết định tiếp theo',exact:true})).toBeVisible();
    if(index<5) {
      const button=page.getByRole('button',{name:`Bước ${index+2} · ${assemblySteps[index+1].title}`,exact:true});
      await expect(button).toHaveCount(1);
      expect(await button.evaluate(el=>Boolean(el.closest('.assembly-decision-toolbar')))).toBe(true);
      await button.click();
      await expect(page.locator('.assembly-step-heading h2')).toHaveText(`${index+2}/6 · ${assemblySteps[index+1].title}`);
    }
    await expect(page.locator('.assembly-learning-next')).toHaveCount(0);
  }
});
