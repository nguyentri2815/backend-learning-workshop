import {walkStatus} from './policy-status-helpers';
import {expect, test} from '@playwright/test';
import {finishDetail,detailStage,detailPoint} from './policy-detail-helpers';
import {createHash} from 'node:crypto';
import {operations, policySource, readingPoints} from '../../src/content/policy/lesson';
import {detailSample, makeSearchRequest, MISSING_POLICY_ID, POLICY_PROGRESS_KEY, searchSamples} from '../../src/policy/policy-model';
import { createNodes, verifiedFlows } from '../../src/content/policy/flows';
import { creationContext } from '../../src/policy/create-model';

test('Policy fixtures preserve source bounds and references for all five operation groups', () => {
  expect(operations.map(item => item.id)).toEqual(['list', 'detail', 'create', 'update', 'status']);
  const refs = new Map(policySource.excerpts.map(item => [item.id, item]));
  for (const item of [...operations, ...readingPoints]) {
    const links = 'refs' in item ? item.refs : [item.ref, ...(item.related ?? [])];
    for (const id of links) expect(refs.has(id), id).toBe(true);
  }
  for (const item of policySource.excerpts) {
    expect(item.rows.map(row => row.line)).toEqual(Array.from({length: item.to - item.from + 1}, (_, i) => item.from + i));
    expect(createHash('sha256').update(item.rows.map(row => row.text).join('\n')).digest('hex')).toBe(item.excerptSha256);
    expect(item.sha256).toMatch(/^[a-f0-9]{64}$/);
    expect(policySource.repositories).toHaveProperty(item.repository);
  }
  expect(refs.get('q-api')!.module).toBe('3-agent-query-service');
  expect(refs.get('c-api')!.module).toBe('1-agent-command-service');
});

test('sample search applies status and unit scope before pagination; detail uses the selected id', () => {
  const criteria = {keyword: 'S-DEMO', status: '100', pageNumber: 0, pageSize: 2};
  const first = searchSamples(criteria);
  const second = searchSamples({...criteria, pageNumber: 1});
  expect(first.totalElements).toBe(3);
  expect(first.content.map(item => item.id)).toEqual(['POL-LEARN-001', 'POL-LEARN-002']);
  expect(second.content.map(item => item.id)).toEqual(['POL-LEARN-003']);
  expect(searchSamples({...criteria, status: 'all'}).totalElements).toBe(5);
  expect(searchSamples({...criteria, keyword: 'S-DEMO-006', status: 'all'}).content).toEqual([]);
  expect(searchSamples({...criteria, keyword: 'S-DEMO-004'}).content).toEqual([]);
  expect(makeSearchRequest({...criteria, status: 'all'})).not.toHaveProperty('status');
  expect(detailSample(second.content[0].id)?.id).toBe('POL-LEARN-003');
  expect(detailSample(MISSING_POLICY_ID)).toBeNull();
});

test('every new lesson reference is sourced; Command and Query fixtures are separated', () => {
  for(const node of createNodes) {
    expect(policySource.excerpts.some(e=>e.id===node.ref)).toBe(true);
    for(const link of node.links??[]) expect(policySource.excerpts.some(e=>e.id===link.ref)).toBe(true);
  }
  for(const flow of verifiedFlows) for(const ref of flow.refs) expect(policySource.excerpts.some(e=>e.id===ref),ref).toBe(true);
  const command=creationContext(new URLSearchParams('quote=QUOTE-LEARN-101&sim=command'));
  expect(command.commandReady).toBe(true); expect(command.viewReady).toBe(false);
  const view=creationContext(new URLSearchParams('quote=QUOTE-LEARN-101&sim=view'));
  expect(view.policy).toEqual(command.policy);
  const criteria={keyword:view.policy.policyCode,status:'all',pageNumber:0,pageSize:2};
  expect(searchSamples(criteria).totalElements).toBe(0);
  expect(searchSamples(criteria,[view.policy]).content[0].id).toBe(view.policy.id);
  expect(detailSample(view.policy.id,[view.policy])?.customerName).toBe(view.quote.customerModel.name);
  expect(creationContext(new URLSearchParams('quote=QUOTE-LEARN-103&sim=view')).viewReady).toBe(false);
});

test('deep step, reference, subtab, reload and browser history preserve context',async({page})=>{
  await page.goto('/journey/policy?group=create&mode=steps&node=map&quote=QUOTE-LEARN-102&sim=checked&ref=create-customer');
  await expect(page.getByTestId('policy-source')).toHaveAttribute('data-source-id','create-customer');
  await expect(page.getByTestId('quote-policy-mapping')).toContainText('Khách hàng mẫu Nam');
  await page.getByRole('tab',{name:'Nhìn toàn cảnh',exact:true}).click();
  await expect(page.locator('.policy-overview-resume')).toContainText('Đang giữ bước 3');
  await page.getByRole('tab',{name:'Làm lại từng bước',exact:true}).click();
  await expect(page.getByTestId('policy-source')).toHaveAttribute('data-source-id','create-customer');
  await page.reload();
  await expect(page.getByTestId('quote-policy-mapping')).toContainText('0 · Chưa tới hiệu lực');
  await page.getByRole('tab',{name:'04 Cập nhật'}).click();
  await page.getByRole('tab',{name:'01 Tạo mới'}).click();
  await expect(page.getByTestId('policy-source')).toHaveAttribute('data-source-id','create-customer');
  await page.goBack();
  await expect(page.getByRole('tab',{name:'04 Cập nhật'})).toHaveAttribute('aria-selected','true');
  await page.goForward();
  await expect(page.getByTestId('quote-policy-mapping')).toContainText('Khách hàng mẫu Nam');
  await page.getByRole('link',{name:'Yêu cầu bồi thường',exact:true}).click();
  await page.getByRole('link',{name:'Khám phá Policy',exact:true}).click();
  await expect(page.getByTestId('policy-source')).toHaveAttribute('data-source-id','create-customer');
  await page.getByRole('button',{name:'Về câu đang học',exact:true}).click();
  await expect(page.getByTestId('highlighted-code')).toHaveAttribute('data-ready','true');
  const scroll=page.getByTestId('code-scroll');
  await scroll.evaluate(el=>{el.scrollTop=120;});
  const top=await scroll.evaluate(el=>el.scrollTop);
  await page.getByRole('tab',{name:'Nhìn toàn cảnh',exact:true}).click();
  await page.getByRole('tab',{name:'Làm lại từng bước',exact:true}).click();
  await expect(page.getByTestId('highlighted-code')).toHaveAttribute('data-ready','true');
  await expect.poll(()=>scroll.evaluate(el=>el.scrollTop)).toBeCloseTo(top,0);
});

test('verified update/status maps distinguish existing transitions, initial status and missing evidence',async({page})=>{
  await page.goto('/journey/policy?group=update');
  await expect(page.getByTestId('update-lesson')).toHaveAttribute('data-flow','checkout');
  await page.getByRole('navigation',{name:'Chọn flow Cập nhật',exact:true}).getByRole('button',{name:'Đường sửa createdDate cần xác nhận',exact:true}).click();
  await expect(page.getByTestId('update-journey-map')).toContainText('createdDate vẫn null');
  await page.getByRole('tab',{name:'05 Đổi trạng thái'}).click();
  await page.getByRole('button',{name:'Nhận trạng thái hợp đồng từ điều chỉnh Core',exact:true}).click();
  await expect(page.locator('.status-evidence')).toContainText('API chấm dứt riêng');
  await page.getByRole('button',{name:'Làm lại từng bước',exact:true}).click();
  await page.getByRole('button',{name:'Nhận trạng thái Core mẫu',exact:true}).click();await walkStatus(page,'core-status','core-value');
  await expect(page.getByTestId('policy-source')).toContainText('command.setStatus(endorsementInfoResponse.getStatus())');
  await expect(page.getByTestId('status-axes')).toContainText('paymentStatus');
});

test('existing list/detail keeps pagination, source references and the missing-policy branch',async({page})=>{
  await page.goto('/journey/policy?group=list&mode=steps');
  await page.getByRole('button',{name:'Tìm hợp đồng mẫu',exact:true}).click();
  await page.getByRole('button',{name:'Xem tiêu chí đã nhận',exact:true}).click();
  await page.getByRole('button',{name:'Bước sau',exact:true}).click();
  await page.getByRole('button',{name:'Áp dụng phạm vi và tiêu chí',exact:true}).click();
  await page.getByRole('button',{name:'Bước sau',exact:true}).click();
  await page.getByRole('button',{name:'Nhận trang kết quả',exact:true}).click();
  await page.getByRole('button',{name:'Trang tiếp',exact:true}).click();
  await page.getByRole('button',{name:'Mở chi tiết POL-LEARN-003',exact:true}).click();
  await finishDetail(page);
  await expect(page.getByTestId('policy-detail')).toContainText('POL-LEARN-003');
  await page.locator('.detail-data-group').first().click();
  await expect(page.getByTestId('policy-source')).toHaveAttribute('data-source-id','find');
  await expect(page.getByTestId('policy-source').locator('[data-line="34"]')).toHaveAttribute('data-explained','true');
  await expect(page.getByTestId('detail-checkpoint')).toHaveAttribute('data-stop','detail-response');
  await page.goto('/journey/policy?group=detail&mode=steps&detailId=POL-NOT-FOUND');
  await page.getByRole('button',{name:'Mở hợp đồng mẫu',exact:true}).click();
  await detailStage(page,'detail-find');await detailPoint(page,'detail-find');await detailPoint(page,'detail-record');
  await expect(page.locator('.policy-branch-result')).toContainText('AGENT.POLICY_NOT_EXIST');
  await expect(page.getByTestId('policy-source').locator('[data-line="32"]')).toHaveAttribute('data-explained','true');
});

test('progress reset stays scoped and mobile source/overview do not overflow',async({page})=>{
  await page.setViewportSize({width:390,height:844});
  await page.goto('/journey/policy?group=list&mode=steps');
  await page.evaluate(()=>localStorage.setItem('backend-learning-workshop.learning.v1',JSON.stringify({completed:['claims:requirements'],notes:{}})));
  await page.getByRole('button',{name:'Tìm hợp đồng mẫu',exact:true}).click();
  await page.getByRole('button',{name:'Đánh dấu đã đọc và tự giải thích',exact:true}).click();
  expect(await page.evaluate(key=>JSON.parse(localStorage.getItem(key)!),POLICY_PROGRESS_KEY)).toEqual({completed:['search']});
  await page.getByRole('button',{name:'Làm lại bài đọc',exact:true}).click();
  await expect(page.getByRole('tab',{name:'01 Tạo mới'})).toHaveAttribute('aria-selected','true');
  expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('backend-learning-workshop.learning.v1')!).completed)).toEqual(['claims:requirements']);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
  await page.getByRole('button',{name:'Làm lại từng bước',exact:true}).click();
  await page.getByRole('button',{name:'Điểm sau',exact:true}).click();
  await page.getByRole('button',{name:'Điểm sau',exact:true}).click();
  await expect(page.getByTestId('highlighted-code')).toHaveAttribute('data-ready','true');
  await page.getByRole('checkbox',{name:'Xuống dòng code',exact:true}).uncheck();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
  await page.screenshot({path:'test-results/policy-create-mobile.png',fullPage:true});
});

