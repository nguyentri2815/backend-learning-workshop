import {expect,test} from '@playwright/test';
import type {Locator} from '@playwright/test';
import sources from '../../src/content/policy/assembly-source.json' with {type:'json'};
import {learningSteps} from '../../src/content/policy/assembly-learning';
import {creationContext} from '../../src/policy/create-model';
import {cooperationTrace,componentFocus,diagramModel,patternSelection,selectPatternNode,selectPatternEdge} from '../../src/policy/assembly-pattern-model';

const lessons=learningSteps(creationContext(new URLSearchParams()));
const url=(step='quote',pattern='path')=>`/journey/policy?group=create&mode=assembly&assemblyStep=${step}&assemblyAnswers.${step}=0,0&assemblyView.${step}=pattern&assemblyPattern.${step}=${pattern}`;
async function markText(root:Locator,line:number,tone:string) {
  return root.locator(`[data-line="${line}"] [data-expression-tone="${tone}"]`).allTextContents().then(parts=>parts.join(''));
}

test('all 21 source pairs, component ranges and inheritance edges agree with the bundled snapshot',()=>{
  let pairs=0;
  for(const lesson of Object.values(lessons))for(const pattern of lesson.patterns) {
    for(const node of pattern.nodes)for(const e of node.evidence) {
      for(const a of componentFocus(e).annotations) {
        expect(a.start).toBeGreaterThan(0);expect(a.end).toBeLessThanOrEqual(sources[e.ref].rows.length);
      }
    }
    for(const e of pattern.edges) {
      const trace=cooperationTrace(pattern,e);pairs++;
      for(const side of [trace.caller,trace.receiver])for(const a of side.focus.annotations) {
        const lines=sources[side.focus.ref].rows.slice(a.start-1,a.end).map(r=>r.text).join('\n');
        expect(lines.length).toBeGreaterThan(0);if(a.expression)expect(lines).toContain(a.expression);
      }
    }
  }
  expect(pairs).toBe(21);
  const graph=diagramModel(lessons.quote.patterns[0]);
  const inheritance=graph.relations.find(e=>e.to==='support:baseController')!;
  expect(inheritance.kind).toBe('inheritance');
  expect(sources.controller.rows[inheritance.fromFocus!.annotations[0].start-1].text).toContain('extends BaseController');
  const detailBase=diagramModel(lessons.result.patterns.find(p=>p.id==='detail')!).relations.find(e=>e.from==='detail'&&e.to==='support:base')!;
  expect(detailBase.toFocus!.annotations[0].start).toBe(11);
  expect(sources.base.rows[10].text).toContain('public class BaseFunc');
  expect(graph.files.map(f=>f.path.split('/').at(-1))).toEqual(expect.arrayContaining(['PolicyController.java','CreatePolicyFunc.java','BaseController.java']));
  const saveGraph=diagramModel(lessons.save.patterns[0]);
  expect(saveGraph.nodes.find(n=>n.id==='save')!.ref).toBe('save');
  expect(saveGraph.nodes.find(n=>n.id==='event')!.ref).toBe('event');
  expect(saveGraph.relations.some(r=>r.kind==='inheritance'&&r.from==='event')).toBe(false);
  const mapGraph=diagramModel(lessons.map.patterns[0]);
  expect(mapGraph.nodes.find(n=>n.id==='mapping')!.ref).toBe('mapping');
  expect(mapGraph.relations.filter(r=>r.kind==='inheritance'&&r.to==='support:base')).toHaveLength(1);
  const params=new URLSearchParams();
  for(const [key,value] of Object.entries(selectPatternNode('quote','func')))params.set(key,value);
  for(const [key,value] of Object.entries(selectPatternEdge('quote','receive')))params.set(key,value);
  expect(patternSelection(lessons.quote.patterns[0],params,'quote').node.id).toBe('func');
  const legacy=new URLSearchParams({'assemblyInspect.map':'edge:calculate'});
  for(const [key,value] of Object.entries(selectPatternNode('map','command',patternSelection(lessons.map.patterns[0],legacy,'map').edge.id)))legacy.set(key,value);
  expect(patternSelection(lessons.map.patterns[0],legacy,'map').edge.id).toBe('calculate');
});

test('rapid choice and mode changes retain both updates before Router renders',async({page})=>{
  await page.goto('/journey/policy?group=create&mode=assembly&assemblyStep=map&assemblyAnswers.map=0,');
  await expect(page.locator('.assembly-question')).toHaveAttribute('data-decision','calculate');
  await page.evaluate(()=>{
    document.querySelector<HTMLInputElement>('.assembly-question input[type=radio]')!.click();
    document.querySelector<HTMLButtonElement>('#assembly-tab-cooperate')!.click();
  });
  await expect(page.getByRole('tab',{name:'Phối hợp',exact:true})).toHaveAttribute('aria-selected','true');
  await expect.poll(()=>new URL(page.url()).searchParams.get('assemblyAnswers.map')).toBe('0,0');
  await page.getByRole('button',{name:'Xem mẫu thiết kế',exact:true}).click();
  await page.getByRole('tab',{name:'KHUNG THÀNH PHẦN',exact:true}).click();
  await expect(page.getByRole('button',{name:'Sao chép mẫu',exact:true})).toBeVisible();
  await page.evaluate(()=>{
    const node=[...document.querySelectorAll<HTMLButtonElement>('[aria-label="Mở khung thành phần"] button')].find(b=>b.textContent==='Helper')!;
    node.click();
    document.querySelector<HTMLButtonElement>('.assembly-frame-tabs button:nth-child(2)')!.click();
  });
  await expect(page.getByRole('tab',{name:'KHUNG PHỐI HỢP',exact:true})).toHaveAttribute('aria-selected','true');
  await page.getByRole('tab',{name:'KHUNG THÀNH PHẦN',exact:true}).click();
  await expect(page.locator('.assembly-frame-heading h4')).toHaveText('Mẫu Helper');
});

for(const mobile of [false,true])for(const dark of [false,true])test.describe(`${mobile?'mobile':'desktop'} ${dark?'dark':'light'}`,()=>{
  test.use({viewport:mobile?{width:390,height:844}:{width:1440,height:900},hasTouch:mobile,permissions:['clipboard-read','clipboard-write']});
  test('step 1 A/B full files, component copy and linked workspace tree',async({page})=>{
    const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
    await page.goto(url());if(dark)await page.getByRole('button',{name:'Giao diện tối',exact:true}).click();
    const tabs=page.getByRole('tablist',{name:'Loại khung code'});
    await expect(tabs.getByRole('tab',{name:'KHUNG PHỐI HỢP',exact:true})).toHaveAttribute('aria-selected','true');
    const a=page.locator('.assembly-source-entry[data-source-ref=controller]'),b=page.locator('.assembly-source-entry[data-source-ref=func]');
    await page.getByRole('button',{name:/^Mở source A/}).click();
    await expect(a.locator('[data-line="45"] [data-expression-tone=caller]').first()).toBeVisible();
    expect(await markText(a,45,'caller')).toBe('exec(quoteId)');
    await a.locator('summary').filter({hasText:'Mở toàn bộ file'}).click();
    const afull=a.locator('[data-full-source=controller]');
    await expect(afull.locator('[data-line="45"] [data-expression-tone=caller]').first()).toBeInViewport();
    expect(await markText(afull,45,'caller')).toBe('exec(quoteId)');
    await expect(afull.locator('[data-line="44"]')).not.toHaveAttribute('data-code-tone','caller');
    await expect(a.locator('.assembly-source-toggle')).toContainText('A · Bên gọi');
    await page.getByRole('button',{name:/^Mở source B/}).click();
    await expect(b.locator('[data-line="60"] [data-expression-tone=receiver]').first()).toBeVisible();
    expect(await markText(b,60,'receiver')).toBe('exec(String quoteId)');
    await b.locator('summary').filter({hasText:'Mở toàn bộ file'}).click();
    const bfull=b.locator('[data-full-source=func]');
    await expect(bfull.locator('[data-line="60"] [data-expression-tone=receiver]').first()).toBeInViewport();
    expect(await markText(bfull,60,'receiver')).toBe('exec(String quoteId)');
    expect(await afull.locator('[data-line="45"]').evaluate(el=>getComputedStyle(el).backgroundColor)).not.toBe(await bfull.locator('[data-line="60"]').evaluate(el=>getComputedStyle(el).backgroundColor));
    await page.evaluate(()=>window.scrollTo(0,0));
    await page.screenshot({path:`docs/review/pattern-pair-${mobile?'mobile':'desktop'}-${dark?'dark':'light'}.png`,fullPage:true});

    await page.getByRole('navigation',{name:'Mở khung thành phần'}).getByRole('button',{name:'Func',exact:true}).click();
    await tabs.getByRole('tab',{name:'KHUNG PHỐI HỢP',exact:true}).click();
    await expect(page.locator('.assembly-frame-heading h4')).toHaveText('Bàn giao quoteId');
    await tabs.getByRole('tab',{name:'KHUNG THÀNH PHẦN',exact:true}).click();
    await expect(page.locator('.assembly-frame-heading h4')).toHaveText('Mẫu Func');
    await page.getByRole('navigation',{name:'Mở khung thành phần'}).getByRole('button',{name:'Controller',exact:true}).click();
    await page.getByRole('button',{name:'Sao chép mẫu',exact:true}).click();
    await expect(page.getByRole('button',{name:'Đã sao chép',exact:true})).toBeVisible();
    expect((await page.evaluate(()=>navigator.clipboard.readText())).replace(/\r\n/g,'\n')).toBe(lessons.quote.patterns[0].nodes[0].frame);
    const componentSource=page.locator('.assembly-source-entry[data-source-ref=controller]');
    await componentSource.locator('.assembly-source-toggle').click();
    await componentSource.locator('summary').filter({hasText:'Mở toàn bộ file'}).click();
    await expect(componentSource.locator('[data-full-source=controller] [data-line="43"]')).toHaveAttribute('data-code-tone','component');
    await expect(componentSource.locator('[data-full-source=controller] [data-line="46"]')).toHaveAttribute('data-code-tone','component');
    await tabs.evaluate(el=>el.scrollIntoView({block:'start'}));
    await page.screenshot({path:`docs/review/pattern-component-${mobile?'mobile':'desktop'}-${dark?'dark':'light'}.png`});
    await page.getByRole('region',{name:'Mẫu để làm theo'}).getByRole('button',{name:'Xem sơ đồ liên quan',exact:true}).click();
    const dialog=page.getByRole('dialog',{name:'Sơ đồ phối hợp và cây workspace',exact:true});
    await expect(dialog).toBeVisible();
    let reader=dialog.getByRole('region',{name:'Source đang đối chiếu'});
    await expect(reader).toHaveAttribute('data-source-ref','controller');
    await reader.getByRole('button',{name:'Mở toàn bộ file',exact:true}).click();
    await expect(reader.locator('[data-line="43"]')).toHaveAttribute('data-code-tone','component');
    await expect(reader.locator('[data-line="46"]')).toHaveAttribute('data-code-tone','component');
    if(mobile)await dialog.getByRole('button',{name:/^Cây workspace/}).click();
    const tree=dialog.getByLabel('Cây file của mẫu đang chọn');
    await tree.getByRole('button',{name:/^BaseController.java/}).click();
    reader=dialog.getByRole('region',{name:'Source đang đối chiếu'});
    await expect(reader).toHaveAttribute('data-source-ref','baseController');
    await expect(dialog.locator('.react-flow__node[data-id="support:baseController"]')).toHaveCSS('border-top-width','2px');
    await expect(reader.locator('[data-line="12"]')).toHaveAttribute('data-code-tone','support');
    await expect(reader.locator('[data-line="14"]')).toHaveAttribute('data-code-tone','support');
    await expect(reader.locator('[data-line="13"]')).not.toHaveAttribute('data-code-tone','support');
    await reader.getByRole('button',{name:'Mở toàn bộ file',exact:true}).click();
    await expect(reader.locator('[data-line="12"] [data-expression-tone=support]').first()).toBeInViewport();
    await dialog.getByRole('navigation',{name:'Chọn node liên quan'}).getByRole('button',{name:'PolicyController',exact:true}).click();
    await expect(tree.locator('.tree-file.selected')).toContainText('PolicyController.java');
    await dialog.getByRole('navigation',{name:'Chọn quan hệ của mẫu'}).getByRole('button',{name:'Bàn giao quoteId',exact:true}).click();
    await expect(dialog.locator('.assembly-diagram-handoff')).toContainText('QUOTE-LEARN-101');
    await dialog.getByRole('button',{name:'A · Đi tới bên gọi / nơi cung cấp',exact:true}).click();
    reader=dialog.getByRole('region',{name:'Source đang đối chiếu'});
    await reader.getByRole('button',{name:'Mở toàn bộ file',exact:true}).click();
    await expect(reader.locator('[data-line="45"] [data-expression-tone=caller]').first()).toBeInViewport();
    await expect(reader.locator('[data-line="44"]')).not.toHaveAttribute('data-code-tone','component');
    await dialog.screenshot({path:`docs/review/pattern-tree-${mobile?'mobile':'desktop'}-${dark?'dark':'light'}.png`});
    await dialog.getByRole('button',{name:'Đóng sơ đồ phối hợp',exact:true}).click();
    await expect(tabs.getByRole('tab',{name:'KHUNG PHỐI HỢP',exact:true})).toHaveAttribute('aria-selected','true');
    expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(mobile?390:1440);
    expect(errors).toEqual([]);
  });
});

test('step 3 helper pair uses runInternal L87 → getPolicyStatus L195, with a copyable abbreviated component frame',async({page})=>{
  await page.goto(url('map','map-helper')+'&assemblyEdge.map=calculate&assemblyInspect.map=edge:calculate');
  await page.getByRole('button',{name:/^Mở source A/}).click();
  const caller=page.locator('.assembly-source-entry[data-source-ref=prepare]');
  await expect.poll(()=>markText(caller,87,'caller')).toBe('getPolicyStatus(now, effectiveDate, expirationDate)');
  await page.getByRole('button',{name:/^Mở source B/}).click();
  const receiver=page.locator('.assembly-source-entry[data-source-ref=status]');
  await expect(receiver.locator('[data-line="195"]')).toHaveAttribute('data-code-tone','receiver');
  await receiver.locator('summary').filter({hasText:'Mở toàn bộ file'}).click();
  await expect(receiver.locator('[data-full-source=status] [data-line="195"]')).toBeInViewport();
  await page.getByRole('navigation',{name:'Mở khung thành phần'}).getByRole('button',{name:'Helper',exact:true}).click();
  await expect(page.locator('.assembly-template-card > header')).toContainText('Có phần lược');
  await expect(page.getByRole('button',{name:'Sao chép mẫu',exact:true})).toBeVisible();
  await page.locator('.assembly-source-entry[data-source-ref=status]').getByRole('button',{name:'Xem sơ đồ liên quan',exact:true}).click();
  const dialog=page.getByRole('dialog',{name:'Sơ đồ phối hợp và cây workspace',exact:true});
  const reader=dialog.getByRole('region',{name:'Source đang đối chiếu'});
  await expect(reader).toHaveAttribute('data-source-ref','status');
  await reader.getByRole('button',{name:'Mở toàn bộ file',exact:true}).click();
  await expect(reader.locator('[data-line="195"]')).toBeInViewport();
  await dialog.getByRole('navigation',{name:'Chọn quan hệ của mẫu'}).getByRole('button',{name:'Bổ sung theo nghiệp vụ',exact:true}).click();
  await expect(dialog.locator('.assembly-diagram-handoff')).toBeVisible();
  await dialog.getByRole('button',{name:'B · Đi tới bên nhận',exact:true}).click();
  await expect(reader).toHaveAttribute('data-source-ref','status');
  await expect(reader.locator('[data-line="195"]')).toHaveAttribute('data-code-tone','receiver');
  await dialog.getByRole('navigation',{name:'Chọn quan hệ của mẫu'}).getByRole('button',{name:'Bổ sung theo nghiệp vụ',exact:true}).click();
  await dialog.getByRole('button',{name:'A · Đi tới bên gọi / nơi cung cấp',exact:true}).click();
  await expect(reader).toHaveAttribute('data-source-ref','prepare');
  await expect(reader.locator('[data-line="87"]')).toHaveAttribute('data-code-tone','caller');
  await dialog.screenshot({path:'docs/review/pattern-step3-helper-diagram.png'});
});

test('all existing pattern variants open both kinds of frame',async({page})=>{
  for(const [step,lesson] of Object.entries(lessons))for(const pattern of lesson.patterns) {
    await page.goto(url(step,pattern.id));
    await expect(page.getByRole('tab',{name:'KHUNG PHỐI HỢP',exact:true})).toHaveAttribute('aria-selected','true');
    await expect(page.locator('.assembly-pair-side')).toHaveCount(2);
    await page.getByRole('tab',{name:'KHUNG THÀNH PHẦN',exact:true}).click();
    await expect(page.getByRole('button',{name:'Sao chép mẫu',exact:true})).toBeVisible();
  }
});
