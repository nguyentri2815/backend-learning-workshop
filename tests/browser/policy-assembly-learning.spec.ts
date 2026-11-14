import {expect, test} from '@playwright/test';
import type {Page} from '@playwright/test';
import {assemblySteps} from '../../src/content/policy/assembly';
import {learningSteps} from '../../src/content/policy/assembly-learning';
import {creationContext} from '../../src/policy/create-model';
import {executionSession} from '../../src/policy/policy-execution';
import {evidenceRows} from '../../src/policy/AssemblySourceView';
import sources from '../../src/content/policy/assembly-source.json' with {type:'json'};
import {assemblySourceGuides} from '../../src/content/policy/assembly-source-guide';

const base='/journey/policy?group=create&mode=assembly';
async function discover(page:Page, options=[0,0]) {
  for(let i=0;i<options.length;i++) {
    await page.locator('.assembly-question').getByRole('radio').nth(options[i]).click();
    if(i<options.length-1) await page.getByRole('button',{name:'Quyết định tiếp theo',exact:true}).click();
  }
}
async function mode(page:Page,name:string) {await page.getByRole('tablist',{name:'Chế độ tư duy lắp ráp'}).getByRole('tab',{name,exact:true}).click();}

test('source evidence includes both ends and whole method bodies for all six learning steps',()=>{
  const lessons=learningSteps(creationContext(new URLSearchParams()));
  for(const step of assemblySteps) {
    const lesson=lessons[step.id];
    expect(lesson.decisions.length).toBeGreaterThanOrEqual(2);
    expect(lesson.patterns[0].badge).toBe('Mẫu đang dùng trong Policy');
    for(const pattern of lesson.patterns) {
      for(const edge of pattern.edges) {
        expect(pattern.nodes.some(n=>n.id===edge.from)).toBe(true);
        expect(pattern.nodes.some(n=>n.id===edge.to)).toBe(true);
        expect(edge.evidence.length).toBeGreaterThanOrEqual(2);
      }
      for(const item of [...pattern.nodes.flatMap(n=>n.evidence),...pattern.edges.flatMap(e=>e.evidence),...pattern.examples]) {
        expect(sources[item.ref]).toBeTruthy();
        expect(assemblySourceGuides[item.ref].role).toBeTruthy();
        expect(assemblySourceGuides[item.ref].explanation.length).toBeGreaterThan(35);
        const rows=evidenceRows(item);
        expect(rows.length).toBeGreaterThan(0);
        if(!item.from&&!item.to&&!/\b(class|interface)\b/.test(sources[item.ref].rows[sources[item.ref].line-1].text)) {
          expect(rows.at(-1)!.text.trim()).toMatch(/^[};]|;$/);
        }
      }
    }
  }
});

test('step 1: situation → responsibilities → quoteId handoff → cooperation pattern → Controller → Func',async({page})=>{
  const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(base);
  await expect(page.locator('.assembly-context-panel')).toContainText('QUOTE-LEARN-101');
  await expect(page.locator('.assembly-technical')).not.toHaveAttribute('open','');
  await expect(page.locator('.assembly-learning .react-flow__node')).toHaveCount(0);
  await expect(page.locator('.assembly-question')).toHaveCount(1);
  await page.locator('.assembly-hint summary').click();
  await expect(page.locator('.assembly-hint')).toContainText('Hồ sơ đã lưu');
  await page.locator('.assembly-question').first().getByRole('radio').nth(1).click();
  await expect(page.locator('.assembly-consequence').first()).toContainText('Form có thể đã cũ');
  await mode(page,'Phối hợp');
  await expect(page.locator('.assembly-learning .react-flow__node')).toHaveCount(1);
  await mode(page,'Suy luận');
  await page.locator('.assembly-question').first().getByRole('radio').first().click();
  await page.getByRole('button',{name:'Quyết định tiếp theo',exact:true}).click();
  await page.locator('.assembly-question').getByRole('radio').first().click();
  await mode(page,'Phối hợp');
  await expect(page.locator('.assembly-learning .react-flow__node')).toHaveCount(2);
  await page.locator('.assembly-learning-canvas .assembly-handoff-edge').click();
  await expect(page.locator('.assembly-context-panel .assembly-handoff')).toContainText('quoteId="QUOTE-LEARN-101"');
  await mode(page,'Chọn mẫu');
  await expect(page.getByRole('radio',{name:'Nhận ID trên URL → giao Func',exact:false})).toBeChecked();
  await expect(page.locator('.assembly-pattern-inspector')).toContainText('KHUNG PHỐI HỢP');
  await expect(page.locator('.assembly-pattern-inspector')).toContainText('exec(quoteId)');
  await page.getByRole('radio',{name:'Nhận biểu mẫu → giao Func',exact:false}).click();
  await expect(page.locator('.assembly-pattern-description')).toContainText('CreateQuoteRequest');
  await expect(page.locator('.assembly-pattern-description')).toContainText('Tham khảo · tạo Quote');
  await page.getByRole('radio',{name:'Nhận ID trên URL → giao Func',exact:false}).click();
  await page.getByRole('navigation',{name:'Mở khung thành phần'}).getByRole('button',{name:'Controller',exact:true}).click();
  await expect(page.locator('.assembly-frame-heading h4')).toHaveText('Mẫu Controller');
  await page.locator('.assembly-pattern-inspector .assembly-source-entry').first().locator('.assembly-source-toggle').click();
  await expect(page.locator('.assembly-pattern-inspector .assembly-source-meta').first()).toContainText('createPolicy');
  await expect(page.locator('.assembly-pattern-inspector [data-testid=highlighted-code]').last()).toHaveAttribute('data-ready','true');
  await page.getByRole('navigation',{name:'Mở khung thành phần'}).getByRole('button',{name:'Func',exact:true}).click();
  await expect(page.locator('.assembly-frame-heading h4')).toHaveText('Mẫu Func');
  await page.locator('.assembly-pattern-inspector .assembly-source-entry').first().locator('.assembly-source-toggle').click();
  await expect(page.locator('.assembly-pattern-inspector .assembly-source-meta').first()).toContainText('CreatePolicyFunc');
  await expect(page.locator('.assembly-pattern-inspector')).toContainText('runInternal(quoteAggregate)');
  await mode(page,'Suy luận');
  await expect(page.locator('.assembly-question')).toHaveAttribute('data-decision','organize');
  await mode(page,'Chọn mẫu');
  await expect(page.locator('.assembly-pattern-inspector .assembly-source-toggle').first()).toHaveAttribute('aria-expanded','true');
  await page.reload();
  await expect(page.locator('.assembly-frame-heading h4')).toHaveText('Mẫu Func');
  expect(new URL(page.url()).searchParams.get('assemblyAnswers.quote')).toBe('0,0');
  expect(errors).toEqual([]);
});

for(const mobile of [false,true]) test(`${mobile?'mobile':'desktop'} follows all six steps, preserves replay and opens technical reference`,async({page})=>{
  if(mobile) await page.setViewportSize({width:390,height:844});
  const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(`${base}&node=save&sim=command&at=save-return&stop=save-return&walk=quote-ui,quote-request,controller-call&assemblyStep=quote`);
  const before=executionSession(new URL(page.url()).searchParams,'save');
  await page.getByRole('combobox',{name:'Bộ dữ liệu khám phá'}).selectOption('QUOTE-LEARN-102');
  for(const [i,step] of assemblySteps.entries()) {
    await page.getByRole('navigation',{name:'Sáu bước tư duy lắp ráp'}).getByRole('button').filter({hasText:step.title}).click();
    await expect(page.locator(mobile?'.assembly-mobile-data':'.assembly-context-panel')).toContainText(i<4?'QUOTE-LEARN-102':'POL-FROM-QUOTE-LEARN-102');
    await discover(page);
    await mode(page,'Phối hợp');
    // Each arrow is an individually inspectable responsibility/data boundary.
    const handoffs=page.getByRole('navigation',{name:'Chọn một lần bàn giao'}).getByRole('button');
    for(let e=0;e<await handoffs.count();e++) {
      await handoffs.nth(e).click();
      await expect(page.locator('.assembly-context-panel .assembly-handoff')).toContainText('Dữ liệu bàn giao');
    }
    await mode(page,'Chọn mẫu');
    await expect(page.locator('.assembly-pattern-picker input:checked')).toHaveCount(1);
    await expect(page.locator('.assembly-pattern-inspector')).toBeVisible();
    if(step.id==='map') {
      await page.getByRole('navigation',{name:'Mở khung thành phần'}).getByRole('button',{name:'Helper',exact:true}).click();
      await page.locator('.assembly-context-panel .assembly-output-data > summary').click();
      await expect(page.locator('.assembly-pattern-description')).toContainText('NOT_RUNNING (0)');
    }
    if(step.id==='save') {
      await page.getByRole('navigation',{name:'Mở khung phối hợp'}).getByRole('button').filter({hasText:'Repository đưa Event vào apply'}).click();
      await expect(page.locator('.assembly-pattern-inspector')).toContainText('applyEventsToMutableAggregate');
    }
    if(step.id==='flow') await expect(page.locator('.assembly-pattern-description .assembly-limit')).toContainText('Chưa xác định thành phần chuyển bảng events lên Kafka');
    if(step.id==='result') {
      await mode(page,'Suy luận');
      await page.getByRole('navigation',{name:'Tiến trình quyết định'}).getByRole('button').filter({hasText:'1.'}).click();
      await page.locator('.assembly-question').first().getByRole('radio').nth(1).click();
      await mode(page,'Chọn mẫu');
      await expect(page.getByRole('radio',{name:'Chi tiết · ID → Func → repository',exact:false})).toBeChecked();
      await expect(page.locator('.assembly-pattern-description')).toContainText('POL-FROM-QUOTE-LEARN-102');
      await page.getByRole('navigation',{name:'Mở khung thành phần'}).getByRole('button',{name:'Func chi tiết',exact:true}).click();
      await expect(page.locator('.assembly-pattern-inspector')).toContainText('POLICY_NOT_EXIST');
    }
    await page.locator('.assembly-technical > summary').click();
    await expect(page.locator('.assembly-detail')).toBeVisible();
    await page.getByRole('button',{name:'Xem mẫu thật',exact:true}).click();
    await expect(page.locator('.assembly-evidence')).toBeVisible();
    await page.getByRole('button',{name:'Đóng source',exact:true}).click();
    await page.locator('.assembly-technical > summary').click();
    const current=executionSession(new URL(page.url()).searchParams,'save');
    expect(current.context.quote.id).toBe(before.context.quote.id);
    expect([...current.done]).toEqual([...before.done]);
    expect(current.stop.id).toBe(before.stop.id);
    expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(mobile?390:1512);
  }
  await page.getByRole('tab',{name:'Làm lại từng bước',exact:true}).click();
  await expect(page.getByTestId('policy-debug')).toHaveAttribute('data-checkpoint-id','save-return');
  await page.getByRole('tab',{name:'Tư duy lắp ráp',exact:true}).click();
  await page.getByRole('navigation',{name:'Sáu bước tư duy lắp ráp'}).getByRole('button').filter({hasText:'Phát hành từ Quote'}).click();
  expect(new URL(page.url()).searchParams.get('assemblyAnswers.quote')).toBe('0,0');
  await mode(page,'Suy luận');
  for(const theme of ['sáng','tối']) {
    await page.getByRole('button',{name:`Giao diện ${theme}`,exact:true}).click();
    await page.evaluate(()=>window.scrollTo(0,0));
    await page.screenshot({path:`docs/review/assembly-discovery-${mobile?'mobile':'desktop'}-${theme==='sáng'?'light':'dark'}.png`,fullPage:true});
  }
  expect(errors).toEqual([]);
});
