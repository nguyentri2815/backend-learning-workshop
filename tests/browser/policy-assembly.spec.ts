import {expect, test} from '@playwright/test';
import {assemblySteps, assemblyQuestions, components, mechanismNotes, stepDetails} from '../../src/content/policy/assembly';
import sources from '../../src/content/policy/assembly-source.json' with {type: 'json'};
import {executionCheckpoints, executionSession} from '../../src/policy/policy-execution';

test('six steps link to real evidence and valid passive checkpoints', () => {
  expect(assemblySteps).toHaveLength(6);
  const checkpoints = executionCheckpoints(new URLSearchParams());
  for (const step of assemblySteps) {
    expect(assemblyQuestions[step.id]).toBeTruthy();
    for (const [from, to] of step.edges) {
      expect(step.nodes).toContain(from); expect(step.nodes).toContain(to);
    }
    for (const id of step.nodes) {
      const component = components[id], context = stepDetails[step.id][id];
      expect(context.why.length).toBeGreaterThan(25);
      expect(checkpoints.find(c => c.id === (context.checkpoint ?? step.checkpoint))?.stage).toBe(step.id);
      for (const ref of [...component.refs, ...(context.refs ?? []), ...mechanismNotes[id].map(note => note.ref), ...component.comparison ? [component.comparison] : []]) {
        const source = sources[ref as keyof typeof sources];
        expect(source.rows[source.line - 1].text).toContain(source.symbol.split(' · ')[1]);
        expect(source.sha256).toHaveLength(64);
      }
    }
  }
});

test('deep links open all six explanations and source comparisons without running checkpoints', async ({page}) => {
  for (const step of assemblySteps) {
    const id = step.nodes[0];
    await page.goto(`/journey/policy?group=create&mode=assembly&assemblyStep=${step.id}&component=${id}&assemblyPane=compare`);
    await expect(page.locator('.assembly-detail h3')).toHaveText(components[id].name);
    await expect(page.locator('.assembly-reason')).toContainText(assemblyQuestions[step.id]);
    await expect(page.locator('.assembly-source-columns > div')).toHaveCount(2);
    const other = sources[components[id].comparison as keyof typeof sources];
    await expect(page.locator('.assembly-source-meta').last()).toContainText(other.symbol);
    expect(new URL(page.url()).searchParams.has('walk')).toBe(false);
    expect(new URL(page.url()).searchParams.has('sim')).toBe(false);
  }
});

test('framework evidence identifies the configured implementation and opens the current source anchor', async ({page}) => {
  await page.goto('/journey/policy?group=create&mode=assembly&assemblyStep=save&component=save');
  await page.locator('.assembly-mechanisms summary').click();
  await page.locator('.assembly-mechanisms button').first().click();
  await expect(page.locator('.assembly-source-meta')).toContainText('PlatformConfig');
  await page.getByRole('button', {name: 'Mở toàn bộ file', exact: true}).click();
  await expect(page.getByTestId('highlighted-code')).toHaveAttribute('data-ready', 'true');
  await expect(page.locator(`[data-line="${sources.repositoryBean.line}"]`)).toBeInViewport();
  await page.goto('/journey/policy?group=create&mode=assembly&assemblyStep=flow&component=workflow&assemblyPane=calls&assemblyRef=kafkaSubscribe');
  await expect(page.locator('.assembly-source-meta')).toContainText('EventuateKafkaAggregateSubscriptions');
  await expect(page.locator('.assembly-limit')).toContainText('chưa xác định thành phần chuyển bảng events lên Kafka');
});

test('return keeps a new Quote attempt deliberately selected in practice', async ({page}) => {
  await page.goto('/journey/policy?group=create&mode=assembly&assemblyStep=quote&component=controller&stop=quote-ui&at=quote-ui');
  await page.getByRole('button', {name: 'Xem khi chạy', exact: true}).click();
  await page.getByRole('combobox', {name: 'Quote mẫu'}).selectOption('QUOTE-LEARN-102');
  await page.locator('.assembly-return').click();
  await expect(page.locator('.assembly-detail h3')).toHaveText(components.controller.name);
  expect(new URL(page.url()).searchParams.get('quote')).toBe('QUOTE-LEARN-102');
  await page.getByRole('tab', {name: 'Làm lại từng bước', exact: true}).click();
  await expect(page.getByRole('combobox', {name: 'Quote mẫu'})).toHaveValue('QUOTE-LEARN-102');
  expect(executionSession(new URL(page.url()).searchParams, 'quote').done.size).toBe(0);
});

for (const mobile of [false, true]) test(`${mobile ? 'mobile' : 'desktop'} assembly preserves execution and reading context`, async ({page}) => {
  if (mobile) await page.setViewportSize({width: 390, height: 844});
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/journey/policy?group=create&mode=steps&node=save&sim=command&stop=save-return&at=save-return&reader=context&backend=1');
  await expect(page.getByTestId('policy-debug')).toHaveAttribute('data-checkpoint-id', 'save-return');
  const original = new URL(page.url()).searchParams;
  const before = executionSession(original, 'save');
  await page.getByRole('tab', {name: 'Tư duy lắp ráp', exact: true}).click();
  await expect(page.locator('.assembly h2')).toContainText('Ghi Policy');
  for (const step of assemblySteps) {
    await page.getByRole('navigation', {name: 'Sáu bước tư duy lắp ráp'}).getByRole('button').filter({hasText: step.title}).click();
    await expect(page.locator('.assembly h2')).toContainText(step.title);
    expect(new URL(page.url()).searchParams.get('stop')).toBe('save-return');
  }
  await page.getByRole('navigation', {name: 'Sáu bước tư duy lắp ráp'}).getByRole('button').filter({hasText: 'Ghi Policy'}).click();
  await page.locator('.assembly-technical > summary').click();
  if (mobile) {
    await expect(page.locator('.assembly-map')).not.toBeVisible();
    await page.locator('.assembly-mobile-select select').selectOption('aggregate');
  }
  else {
    const node = page.locator('.assembly .react-flow__node[data-id="aggregate"]');
    await expect(node).toBeVisible();
    expect((await page.locator('.assembly-canvas').boundingBox())!.height).toBeGreaterThan(300);
    await node.click();
  }
  await page.getByRole('button', {name: 'So với mẫu khác', exact: true}).click();
  await expect(page.locator('.assembly-evidence')).toContainText('QuoteAggregate');
  await expect(page.getByTestId('highlighted-code').first()).toHaveAttribute('data-ready', 'true');
  await page.getByRole('button', {name: 'Mở toàn bộ file', exact: true}).click();
  const code = page.getByTestId('code-scroll').first();
  await code.evaluate(el => { el.scrollTop = 400; });
  await page.getByRole('button', {name: 'Giao diện tối', exact: true}).click();
  await expect(page.getByTestId('highlighted-code').first()).toHaveAttribute('data-syntax-theme', 'dark');
  const assembly = page.url();
  await page.reload();
  await expect(page.locator('.assembly-detail h3')).toContainText('PolicyAggregate');
  await expect(page.locator('.assembly-evidence')).toContainText('QuoteAggregate');
  await expect(page.getByTestId('highlighted-code').first()).toHaveAttribute('data-syntax-theme', 'dark');
  await code.evaluate(el => { el.scrollTop = 400; });
  await page.getByRole('button', {name: 'Xem khi chạy', exact: true}).click();
  await expect(page.getByTestId('policy-debug')).toHaveAttribute('data-checkpoint-id', 'save-event');
  const after = executionSession(new URL(page.url()).searchParams, 'save');
  expect([...after.done]).toEqual([...before.done]);
  expect(after.stop.id).toBe(before.stop.id);
  expect(after.context.policy).toEqual(before.context.policy);
  await page.locator('.assembly-return').click();
  expect(page.url()).toBe(assembly);
  await expect(page.locator('.assembly-evidence')).toBeVisible();
  await expect.poll(() => code.evaluate(el => el.scrollTop)).toBe(400);
  await page.getByRole('tab', {name: 'Làm lại từng bước', exact: true}).click();
  await expect(page.getByTestId('policy-debug')).toHaveAttribute('data-checkpoint-id', 'save-return');
  await page.getByRole('tab', {name: 'Tư duy lắp ráp', exact: true}).click();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(mobile ? 390 : 1512);
  await page.getByRole('button', {name: 'Đóng source', exact: true}).click();
  await page.mouse.move(0, 0);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({path: `docs/review/assembly-${mobile ? 'mobile' : 'desktop'}-dark.png`, fullPage: true});
  await page.getByRole('button', {name: 'Giao diện sáng', exact: true}).click();
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({path: `docs/review/assembly-${mobile ? 'mobile' : 'desktop'}-light.png`, fullPage: true});
  expect(errors).toEqual([]);
});

test('a future component is read-only; mapping starts at runInternal; IDE, wiring and diff evidence open', async ({page}) => {
  await page.goto('/journey/policy?group=create&mode=steps&node=validate&at=quote-read&stop=quote-read&walk=quote-ui,quote-request,controller-call');
  const before = executionSession(new URL(page.url()).searchParams, 'validate');
  await page.getByRole('tab', {name: 'Tư duy lắp ráp', exact: true}).click();
  await page.getByRole('navigation', {name: 'Sáu bước tư duy lắp ráp'}).getByRole('button').filter({hasText: 'Dựng dữ liệu Policy'}).click();
  await page.locator('.assembly-technical > summary').click();
  await expect(page.locator('.assembly-detail')).toContainText('Bắt đầu ở runInternal');
  await page.getByRole('button', {name: 'Xem mẫu thật', exact: true}).click();
  await expect(page.locator('.assembly-source-meta')).toContainText('runInternal');
  await page.getByRole('button', {name: 'Tìm trong IDE', exact: true}).click();
  await expect(page.locator('.assembly-evidence')).toContainText('Go to Implementation');
  await page.getByRole('button', {name: 'Xem khi chạy', exact: true}).click();
  await expect(page.getByTestId('policy-debug')).toHaveAttribute('data-checkpoint-id', 'map-dates');
  const after = executionSession(new URL(page.url()).searchParams, 'map');
  expect([...after.done]).toEqual([...before.done]);
  expect(after.stop.id).toBe('quote-read');
  expect(after.navigation.openStages).toEqual(before.navigation.openStages);
  await page.locator('.assembly-return').click();
  await expect(page.locator('.assembly-evidence')).toContainText('Go to Implementation');
  await page.goto('/journey/policy?group=create&mode=assembly&assemblyStep=save&component=store&assemblyPane=calls&assemblyRef=jdbc');
  await expect(page.locator('.assembly-limit')).toContainText('publish là hàm rỗng');
  await expect(page.locator('.assembly-source-meta')).toContainText('AbstractJdbcAggregateCrud');
  const resize = page.locator('.assembly-resize');
  await resize.scrollIntoViewIfNeeded();
  const box = (await resize.boundingBox())!;
  await page.mouse.move(box.x + 3, box.y + 30); await page.mouse.down();
  await page.mouse.move(box.x + 80, box.y + 30); await page.mouse.up();
  expect((await resize.boundingBox())!.x).toBeGreaterThan(box.x + 30);
  await page.getByRole('button', {name: 'So với mẫu khác', exact: true}).click();
  await page.locator('.assembly-evidence summary').click();
  await expect(page.locator('.assembly-evidence details')).toHaveAttribute('open', '');
  await expect(page.locator('.assembly-evidence details [data-testid=highlighted-code]')).toHaveAttribute('data-ready', 'true');
});

test('returning to explanation also retains progress the learner deliberately makes in practice', async ({page}) => {
  await page.goto('/journey/policy?group=create&mode=assembly&node=save&assemblyStep=save&component=save&sim=mapped&stop=save-call&at=save-call');
  await page.getByRole('button', {name: 'Xem khi chạy', exact: true}).click();
  await page.getByRole('button', {name: 'Điểm sau', exact: true}).click();
  const current=executionSession(new URL(page.url()).searchParams,'save');
  expect(current.done.has('save-call')).toBe(true);
  await page.locator('.assembly-return').click();
  const restored=executionSession(new URL(page.url()).searchParams,'save');
  expect([...restored.done]).toEqual([...current.done]);
  expect(restored.stop.id).toBe(current.stop.id);
  await expect(page.locator('.assembly-detail h3')).toContainText('AggregateRepository');
});
