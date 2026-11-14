import {expect,test} from '@playwright/test';
import type {Page} from '@playwright/test';
import {assemblySteps} from '../../src/content/policy/assembly';

const base='/journey/policy?group=create&mode=assembly';
const views=(page:Page)=>page.getByRole('tablist',{name:'Chế độ tư duy lắp ráp'});

test('1440 × 900 at 100%: all six steps show the first question and both choices without scrolling',async({page})=>{
  await page.setViewportSize({width:1440,height:900});
  for(const step of assemblySteps) {
    await page.goto(`${base}&assemblyStep=${step.id}`);
    await expect(views(page).getByRole('tab',{name:'Suy luận',exact:true})).toHaveAttribute('aria-selected','true');
    await expect(page.locator('.assembly-question:visible')).toHaveCount(1);
    expect(await page.evaluate(()=>({y:scrollY,zoom:visualViewport?.scale}))).toEqual({y:0,zoom:1});
    for(const choice of await page.locator('.assembly-choice-options label').all()) {
      const bounds=(await choice.boundingBox())!;
      expect(bounds.y).toBeGreaterThan(0);expect(bounds.y+bounds.height).toBeLessThanOrEqual(900);
    }
    await expect(page.locator('.assembly-technical')).not.toHaveAttribute('open','');
    await expect(page.locator('.assembly-step-strip')).not.toContainText('Có thể xem');
    const source=page.locator('.assembly-context-panel');
    expect((await source.boundingBox())!.x).toBeGreaterThan((await page.locator('.assembly-question').boundingBox())!.x);
    expect(await page.locator('.assembly-working-panel').first().evaluate(el=>getComputedStyle(el).overflowY)).toBe('visible');
    expect(await source.evaluate(el=>getComputedStyle(el).overflowY)).toBe('visible');
    expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(1440);
  }
});

test('step 3 keeps an answered decision, selected pattern/source and technical reference across modes',async({page})=>{
  await page.setViewportSize({width:1440,height:900});
  const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(`${base}&assemblyStep=map`);
  const source=page.locator('.assembly-context-panel');
  await expect(source).toContainText('customerModel.name');
  await expect(source).toContainText('01/11/2026');
  await expect(source).toContainText('31/10/2027');
  await expect(source.locator('.assembly-input-data dt').filter({hasText:/^status$/})).toHaveCount(0);
  await expect(source.locator('.assembly-output-data')).toHaveCount(0);
  const title=(await page.locator('.assembly-step-heading h2').boundingBox())!, selector=(await page.getByRole('combobox',{name:'Bộ dữ liệu khám phá'}).boundingBox())!;
  expect(Math.abs(title.y-selector.y)).toBeLessThan(15);
  await page.screenshot({path:'docs/review/assembly-workspace-step3-1440-light.png'});
  await page.getByRole('button',{name:'Thông tin dữ liệu mô phỏng',exact:true}).click();
  await expect(page.getByRole('note')).toContainText('2026-11-08');
  await page.getByRole('button',{name:'Đóng thông tin',exact:true}).click();
  await page.locator('.assembly-question').getByRole('radio').first().click();
  await expect(page.locator('.assembly-consequence')).toContainText('quoteId=QUOTE-LEARN-101');
  await page.getByRole('button',{name:'Quyết định tiếp theo',exact:true}).click();
  await expect(page.locator('.assembly-question:visible')).toHaveCount(1);
  await expect(page.locator('.assembly-question')).toHaveAttribute('data-decision','calculate');
  const summary=page.getByRole('navigation',{name:'Tiến trình quyết định'}).getByRole('button').first();
  const toolbar=(await page.locator('.assembly-decision-toolbar').boundingBox())!;
  const questionTop=(await page.locator('.assembly-question').boundingBox())!.y;
  expect(questionTop-toolbar.y-toolbar.height).toBeGreaterThanOrEqual(0);
  expect(questionTop-toolbar.y-toolbar.height).toBeLessThanOrEqual(30);
  await expect(page.locator('.assembly-question-history')).toHaveCount(0);
  await expect(source).toContainText('08/11/2026');
  await page.locator('.assembly-question').getByRole('radio').first().click();
  await views(page).getByRole('tab',{name:'Phối hợp',exact:true}).click();
  await page.getByRole('navigation',{name:'Chọn một lần bàn giao'}).getByRole('button').filter({hasText:'Bổ sung theo nghiệp vụ'}).click();
  await expect(source).toContainText('Bổ sung theo nghiệp vụ');
  await views(page).getByRole('tab',{name:'Suy luận',exact:true}).click();
  await summary.click();
  await expect(page.locator('.assembly-question')).toHaveAttribute('data-decision','copy');
  await expect(page.locator('.assembly-question').getByRole('radio').first()).toBeChecked();
  await page.locator('.assembly-question').getByRole('radio').nth(1).click();
  await expect(page.locator('.assembly-consequence')).toContainText('Nhập lại có thể lệch');
  await views(page).getByRole('tab',{name:'Chọn mẫu',exact:true}).click();
  await page.getByRole('navigation',{name:'Mở khung thành phần'}).getByRole('button',{name:'Helper',exact:true}).click();
  const evidence=page.locator('.assembly-pattern-inspector .assembly-source-entry').first();
  await evidence.locator('.assembly-source-toggle').click();
  await expect(evidence.locator('[data-testid=highlighted-code]').first()).toHaveAttribute('data-ready','true');
  await views(page).getByRole('tab',{name:'Suy luận',exact:true}).click();
  await expect(page.locator('.assembly-question')).toHaveAttribute('data-decision','copy');
  await expect(page.locator('.assembly-question').getByRole('radio').nth(1)).toBeChecked();
  await views(page).getByRole('tab',{name:'Chọn mẫu',exact:true}).click();
  await expect(page.locator('.assembly-frame-heading h4')).toHaveText('Mẫu Helper');
  await expect(evidence.locator('.assembly-source-toggle')).toHaveAttribute('aria-expanded','true');
  await page.locator('.assembly-technical > summary').click();
  await expect(page.locator('.assembly-map')).toBeVisible();
  await page.getByRole('button',{name:'Xem mẫu thật',exact:true}).click();
  await expect(page.locator('.assembly-evidence')).toContainText('runInternal');
  await page.getByRole('button',{name:'Đóng source',exact:true}).click();
  await page.locator('.assembly-technical > summary').click();
  await views(page).getByRole('tab',{name:'Suy luận',exact:true}).click();
  await page.getByRole('button',{name:'Giao diện tối',exact:true}).click();
  await page.evaluate(()=>window.scrollTo(0,0));
  await page.screenshot({path:'docs/review/assembly-workspace-step3-1440-dark.png'});
  await page.reload();
  await expect(page.locator('.assembly-question')).toHaveAttribute('data-decision','copy');
  await expect(page.locator('.assembly-question').getByRole('radio').nth(1)).toBeChecked();
  expect(errors).toEqual([]);
});

test('mobile keeps source next to the question and scrolls the active step into the horizontal strip',async({page})=>{
  await page.setViewportSize({width:390,height:844});
  await page.goto(`${base}&assemblyStep=map`);
  const question=page.locator('.assembly-question'), data=question.locator('.assembly-mobile-data');
  await expect(data).toBeVisible();
  await expect(data).toContainText('customerModel.name');
  const fields=(await data.boundingBox())!, choices=(await question.locator('.assembly-choice-options').boundingBox())!;
  expect(choices.y-fields.y-fields.height).toBeLessThanOrEqual(20);
  await page.screenshot({path:'docs/review/assembly-workspace-step3-mobile.png',fullPage:true});
  for(const id of ['result','quote','flow','map']) {
    await page.goto(`${base}&assemblyStep=${id}`);
    await expect(page.locator('.assembly-question')).toBeVisible();
    const strip=page.locator('.assembly-step-strip ol');
    await expect.poll(async()=>strip.evaluate(el=>{
      const active=el.querySelector('[aria-current=step]')!.getBoundingClientRect(), bounds=el.getBoundingClientRect();
      return active.left>=bounds.left-1&&active.right<=bounds.right+1;
    })).toBe(true);
    expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
  }
});
