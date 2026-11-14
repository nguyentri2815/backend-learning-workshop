import {expect,test} from '@playwright/test';

const base='/journey/policy?group=create&mode=assembly&assemblyStep=quote';

for(const mobile of [false,true])for(const dark of [false,true])test.describe(`${mobile?'mobile':'desktop'} ${dark?'dark':'light'}`,()=>{
  test.use({viewport:mobile?{width:390,height:844}:{width:1440,height:900},hasTouch:mobile});

  test('option meaning, decision toolbar and independent code explanations',async({page})=>{
    const errors:string[]=[];page.on('pageerror',error=>errors.push(error.message));
    await page.goto(base);
    if(dark)await page.getByRole('button',{name:'Giao diện tối',exact:true}).click();
    const options=page.locator('.assembly-choice-options label');
    const progress=page.getByRole('navigation',{name:'Tiến trình quyết định'});
    await expect(options).toHaveCount(2);
    await expect(options.first()).toHaveAttribute('data-fit','neutral');
    await expect(options.last()).toHaveAttribute('data-fit','neutral');
    await expect(page.locator('.assembly-option-fit')).toHaveCount(0);
    expect(await options.first().evaluate(el=>getComputedStyle(el).backgroundColor)).toBe(await options.last().evaluate(el=>getComputedStyle(el).backgroundColor));
    await page.locator('.assembly-hint summary').click();
    await expect(page.locator('.assembly-option-fit')).toHaveCount(0);

    await page.locator('.assembly-question').getByRole('radio').last().click();
    await expect(options.first()).toHaveAttribute('data-fit','current');
    await expect(options.first()).toContainText('Phù hợp với API hiện tại');
    await expect(options.first().locator('.assembly-option-fit .lucide-check')).toBeVisible();
    await expect(options.last()).toHaveAttribute('data-fit','alternative');
    await expect(options.last()).toContainText('Cần API nhận dữ liệu form');
    await expect(options.last().locator('.assembly-option-fit .lucide-info')).toBeVisible();
    await expect(options.last().getByRole('radio')).toBeChecked();
    await expect(options.last()).toHaveClass(/is-selected/);
    expect(await options.first().evaluate(el=>getComputedStyle(el).backgroundColor)).not.toBe(await options.last().evaluate(el=>getComputedStyle(el).backgroundColor));
    await expect(page.locator('.assembly-consequence')).toContainText('API hiện tại không đọc form từ request body');
    await expect(progress.getByRole('button').first()).toHaveAttribute('data-explored','true');
    await page.evaluate(()=>window.scrollTo(0,0));
    await page.screenshot({path:`docs/review/assembly-options-${mobile?'mobile':'desktop'}-${dark?'dark':'light'}.png`,fullPage:true});
    const next=page.getByRole('button',{name:'Quyết định tiếp theo',exact:true});
    expect((await next.boundingBox())!.y).toBeLessThan((await page.locator('.assembly-question').boundingBox())!.y);
    await next.click();
    await expect(progress.getByRole('button').first()).toHaveAttribute('data-state','explored');
    await expect(progress.getByRole('button').first()).toContainText('Đã khám phá');
    await expect(progress.getByRole('button').last()).toHaveAttribute('aria-current','step');
    await expect(page.locator('.assembly-option-fit')).toHaveCount(0);

    // Revisiting preserves an exploratory choice and lets the learner change it.
    await progress.getByRole('button').first().click();
    await expect(options.last().getByRole('radio')).toBeChecked();
    await page.locator('.assembly-question').getByRole('radio').first().click();
    await expect(page.locator('.assembly-consequence')).toContainText('quoteId=QUOTE-LEARN-101 từ URL');
    await next.click();
    await page.locator('.assembly-question').getByRole('radio').first().click();
    await expect(options.first()).toContainText('Cách Policy đang triển khai');
    await expect(options.last()).toContainText('Khác cách Policy triển khai');
    await expect(progress.getByRole('button').last()).toHaveAttribute('data-explored','true');
    await page.getByRole('button',{name:'Xem phối hợp',exact:true}).click();
    await expect(page.locator('#assembly-tab-cooperate')).toHaveAttribute('aria-selected','true');
    await expect(page.locator('.assembly-learning .react-flow__node')).toHaveCount(2);
    await page.getByRole('button',{name:'Xem mẫu thiết kế',exact:true}).click();
    await expect(page.locator('#assembly-tab-pattern')).toHaveAttribute('aria-selected','true');
    await page.getByRole('navigation',{name:'Mở khung thành phần'}).getByRole('button',{name:'Controller',exact:true}).click();

    const frameInfo=page.getByRole('button',{name:'Giải thích khung Controller',exact:true});
    await frameInfo.focus();await frameInfo.press('Enter');
    await expect(page.locator('.assembly-frame-heading').getByRole('note')).toContainText('Đây là khung method để làm theo');
    const controller=page.locator('.assembly-source-entry[data-source-ref=controller]');
    const sourceToggle=controller.locator('.assembly-source-toggle');
    const sourceInfo=controller.getByRole('button',{name:'Giải thích source PolicyController.java · Ví dụ triển khai',exact:true});
    await expect(sourceToggle).toHaveAttribute('aria-expanded','false');
    if(mobile)await sourceInfo.tap();else{await sourceInfo.focus();await sourceInfo.press('Space');}
    await expect(controller.getByRole('note')).toContainText('endpoint Policy thật');
    await expect(sourceToggle).toHaveAttribute('aria-expanded','false');
    await expect(controller.locator('.assembly-source-content')).toBeHidden();
    await sourceToggle.click();
    await expect(controller.locator('.assembly-source-content')).toBeVisible();
    await expect(controller.getByRole('note')).toBeVisible();
    await sourceInfo.click();
    await expect(controller.getByRole('note')).toHaveCount(0);
    await expect(sourceToggle).toHaveAttribute('aria-expanded','true');
    await sourceInfo.click();
    await sourceToggle.click();
    await expect(controller.getByRole('note')).toBeVisible();
    await expect(sourceToggle).toHaveAttribute('aria-expanded','false');
    await sourceInfo.focus();await sourceInfo.press('Escape');
    await expect(controller.getByRole('note')).toHaveCount(0);
    await expect(sourceInfo).toBeFocused();

    const baseController=page.locator('.assembly-source-entry[data-source-ref=baseController]');
    await baseController.getByRole('button',{name:'Giải thích source BaseController.java · Lớp nền',exact:true}).click();
    await expect(baseController.getByRole('note')).toContainText('applicationContext và executorService');
    await expect(baseController.locator('.assembly-source-toggle')).toHaveAttribute('aria-expanded','false');
    await page.evaluate(()=>window.scrollTo(0,0));
    await page.screenshot({path:`docs/review/assembly-explanations-${mobile?'mobile':'desktop'}-${dark?'dark':'light'}.png`,fullPage:true});
    expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(mobile?390:1440);
    expect(errors).toEqual([]);
  });
});

test('opening a decision is independent of exploration progress',async({page})=>{
  await page.goto(base);
  const progress=page.getByRole('navigation',{name:'Tiến trình quyết định'});
  await progress.getByRole('button').last().click();
  await expect(page.locator('.assembly-question')).toHaveAttribute('data-decision','organize');
  await expect(progress.locator('[data-explored=true]')).toHaveCount(0);
  await progress.getByRole('button').first().click();
  await expect(page.locator('.assembly-question').getByRole('radio').first()).not.toBeChecked();
  await expect(page.locator('.assembly-question').getByRole('radio').last()).not.toBeChecked();
});
