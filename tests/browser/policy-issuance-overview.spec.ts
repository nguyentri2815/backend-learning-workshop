import {expect,test} from '@playwright/test';
import {approvalBranch,issuanceBranches,issuanceExtensions,mainIssuancePoints,postIssuance,quoteOrigin} from '../../src/content/policy/issuance';
import {excerptById} from '../../src/content/policy/lesson';
import {button,runThrough} from './execution-helpers';
import {finishDetail} from './policy-detail-helpers';

test('issuance content points to source and keeps branch return contracts and extension anchors distinct',()=>{
  const points=[...quoteOrigin,...mainIssuancePoints,...issuanceBranches.flatMap(b=>b.points),...approvalBranch().points,...approvalBranch(true).points];
  const refs=[...points.map(p=>p.ref),...issuanceBranches.flatMap(b=>b.changes.map(c=>c.ref)),...approvalBranch(true).changes.map(c=>c.ref),...issuanceExtensions.flatMap(e=>e.refs),...postIssuance.core.refs,...postIssuance.view.refs];
  for(const ref of refs)expect(excerptById[ref],ref).toBeDefined();
  expect(approvalBranch().result).toContain('Boolean');
  expect(approvalBranch(true).result).toContain('String Policy ID');
  expect(excerptById['origin-id'].rows.map(r=>r.text).join('\n')).toContain('applicationIdGenerator.genIdAsString()');
  expect(excerptById['store-save'].rows.map(r=>r.text).join('\n')).toContain('setId(entityId)');
  expect(excerptById['origin-save'].rows.map(r=>r.text).join('\n')).toContain('return quoteAggregateEntity');
  expect(excerptById['origin-response'].rows.map(r=>r.text).join('\n')).toContain('getEntityId()');
  expect(issuanceExtensions.find(e=>e.id==='online-recheck')!.anchor).toContain('WAIT_PAYMENT_ONLINE');
  expect(issuanceExtensions.find(e=>e.id==='release-retry')!.anchor).toContain('PAID');
});

const node=(page:import('@playwright/test').Page,id:string)=>page.locator(`.react-flow__node[data-id="${id}"]`);
const openNode=async(page:import('@playwright/test').Page,id:string)=>{await node(page,id).locator('.policy-map-node-content').click();};

test('fresh overview shows all nine points, four branches and three outcomes before opening descriptions',async({page})=>{
  const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('/journey/policy');
  await expect(page.locator('.policy-learning-path')).toHaveText('Đường học: Phát hành trực tiếp');
  await expect(page.locator('.react-flow__node')).toHaveCount(9);
  await expect(page.getByTestId('issuance-map-detail')).toHaveCount(0);
  await expect(page.getByTestId('policy-source')).toHaveCount(0);
  await expect(page.getByLabel('Quote mẫu trong toàn cảnh',{exact:true})).toHaveCount(0);
  for(const id of ['quote','direct','cash','online','approval','save','published','view','core']){
    await expect(node(page,id)).toBeInViewport({ratio:.999});
    await expect(node(page,id).locator('small')).toHaveCount(1);
  }
  await expect(node(page,'direct').locator('.policy-map-node')).toHaveClass(/is-active/);
  await expect(page.locator('.react-flow__edge')).toHaveCount(11);
  await expect(page.locator('.react-flow__edge[data-id="save-core"] path').first()).toHaveCSS('stroke-dasharray','7px, 5px');
  // Compact desktop: all paths remain visible without scrolling to the map.
  await page.setViewportSize({width:1366,height:768});
  for(const id of ['quote','direct','cash','online','approval','save','published','view','core'])await expect(node(page,id)).toBeInViewport({ratio:.999});
  expect(errors).toEqual([]);
});

test('selecting branches retains the complete map and shows one branch contract beside it',async({page})=>{
  await page.goto('/journey/policy');
  await openNode(page,'cash');
  await expect(page.getByTestId('issuance-branch-detail')).toContainText('CreatePolicyForCash');
  await expect(page.getByTestId('issuance-branch-detail')).toContainText('CheckoutInfoModel.entityId');
  const mapBox=await page.getByTestId('issuance-map').boundingBox();
  const detailBox=await page.getByTestId('issuance-map-detail').boundingBox();
  expect(detailBox!.x).toBeGreaterThan(mapBox!.x+mapBox!.width);
  await openNode(page,'online');
  await expect(node(page,'online').locator('.policy-map-node')).toHaveClass(/is-active/);
  await expect(node(page,'direct').locator('.policy-map-node')).not.toHaveClass(/is-active/);
  await expect(page.getByTestId('issuance-branch-detail')).toContainText('Lượt pay đầu trả CheckoutInfoModel với entityId của Quote');
  await expect(page.getByTestId('issuance-branch-detail')).not.toContainText('CreatePolicyForCash');
  await expect(page.locator('.react-flow__node')).toHaveCount(9);
  await openNode(page,'approval');
  await expect(page.getByTestId('issuance-branch-detail')).toContainText('Boolean');
  await expect(page.getByTestId('issuance-branch-detail')).toContainText('WAIT_PAYMENT_CASH');
  await page.getByLabel('Biến thể duyệt thanh toán',{exact:true}).selectOption('now');
  await expect(page.getByTestId('issuance-branch-detail')).toContainText('String Policy ID');
  await expect(page.getByTestId('issuance-branch-detail')).toContainText('validatePaymentNowQuote');
  await expect(page.locator('.policy-status-changes')).toContainText('UNPAID');
  await page.reload();await expect(page.getByLabel('Biến thể duyệt thanh toán',{exact:true})).toHaveValue('now');
  await page.getByRole('button',{name:'Đóng chi tiết',exact:true}).click();
  await expect(page.getByTestId('issuance-map-detail')).toHaveCount(0);
  await expect(node(page,'approval').locator('.policy-map-node')).toHaveClass(/is-active/);
});

test('drag moves edges without opening details, branch changes preserve positions, reset restores layout and viewport',async({page})=>{
  await page.goto('/journey/policy');
  const quote=node(page,'quote');
  const initial=await quote.evaluate(el=>el.style.transform);
  const edge=page.locator('.react-flow__edge[data-id="quote-direct"] .react-flow__edge-path');
  const originalEdge=await edge.getAttribute('d');
  const box=(await quote.boundingBox())!;
  await page.mouse.move(box.x+box.width/2,box.y+box.height/2);
  await page.mouse.down();await page.mouse.move(box.x+box.width/2+42,box.y+box.height/2-80,{steps:12});await page.mouse.up();
  await expect.poll(()=>quote.evaluate(el=>el.style.transform)).not.toBe(initial);
  const dragged=await quote.evaluate(el=>el.style.transform);
  await expect(edge).not.toHaveAttribute('d',originalEdge!);
  await expect(page.getByTestId('issuance-map-detail')).toHaveCount(0);
  await openNode(page,'online');
  await expect(page.getByTestId('issuance-branch-detail')).toBeVisible();
  await expect.poll(()=>quote.evaluate(el=>el.style.transform)).toBe(dragged);
  await page.getByRole('button',{name:'Đóng chi tiết',exact:true}).click();
  await expect.poll(()=>quote.evaluate(el=>el.style.transform)).toBe(dragged);
  // Pan and zoom are enabled; reset also returns the viewport to the whole diagram.
  const viewport=page.locator('.policy-shared-canvas .react-flow__viewport');
  const beforeZoom=await viewport.getAttribute('style');
  await page.locator('.react-flow__controls-zoomin').click();
  await expect(viewport).not.toHaveAttribute('style',beforeZoom!);
  const beforePan=await viewport.getAttribute('style');
  const canvas=(await page.getByTestId('issuance-map').boundingBox())!;
  await page.mouse.move(canvas.x+20,canvas.y+20);await page.mouse.down();
  await page.mouse.move(canvas.x+65,canvas.y+45,{steps:8});await page.mouse.up();
  await expect(viewport).not.toHaveAttribute('style',beforePan!);
  await page.getByRole('button',{name:'Đặt lại bố cục',exact:true}).click();
  await expect.poll(()=>quote.evaluate(el=>el.style.transform)).toBe(initial);
  for(const id of ['quote','approval','core'])await expect(node(page,id)).toBeInViewport({ratio:.999});
  await expect(node(page,'online').locator('.policy-map-node')).toHaveClass(/is-active/);
  await page.getByRole('button',{name:'Làm lại từng bước',exact:true}).click();
  await expect(page).toHaveURL(/mode=steps/);
  await expect(page.getByTestId('quote-detail-screen')).toBeVisible();
  await expect(page.getByTestId('policy-source')).toHaveCount(0);
});

test('Quote details preserve quoteId on request and trace generated, stored and returned ID',async({page})=>{
  const calls:string[]=[];page.on('request',r=>{if(/^\/(quote|policy)\/(create|search)/.test(new URL(r.url()).pathname))calls.push(r.url());});
  await page.goto('/journey/policy');await openNode(page,'quote');
  await page.getByLabel('Quote mẫu trong toàn cảnh',{exact:true}).selectOption('QUOTE-LEARN-102');
  await page.getByRole('button',{name:'Xem request mẫu',exact:true}).click();
  await expect(page.getByTestId('quote-id-before')).toHaveText('QUOTE-LEARN-102');
  await expect(page.getByTestId('quote-id-after')).toHaveText('QUOTE-LEARN-102');
  await page.getByRole('button',{name:'Quote đến từ đâu?',exact:true}).click();
  await expect(page.getByTestId('issuance-map-detail')).toContainText('Chưa xác nhận thao tác trên màn hình nghiệp vụ');
  await expect(page.getByTestId('policy-source')).toHaveAttribute('data-source-id','origin-api');
  await page.locator('.policy-reading-points').getByRole('button',{name:'4. Sinh entityId của Quote',exact:true}).click();
  await expect(page.getByTestId('policy-source')).toContainText('applicationIdGenerator.genIdAsString()');
  await page.locator('.policy-reading-points').getByRole('button',{name:'5. Gắn ID và lưu Quote',exact:true}).click();
  await expect(page.getByTestId('policy-source')).toContainText('setId(entityId)');
  await page.locator('.policy-reading-points').getByRole('button',{name:'6. Trả và chuyển tiếp ID',exact:true}).click();
  await expect(page.getByTestId('policy-source')).toContainText('getEntityId()');
  await page.locator('.policy-reading-points').getByRole('button',{name:'7. Dùng lại ID để tạo Policy',exact:true}).click();
  await expect(page.getByTestId('policy-source')).toContainText('/create/{quoteId}');expect(calls).toEqual([]);
});

test('origin to direct practice to online recheck returns to the exact practice step and code after reload and Back',async({page})=>{
  await page.goto('/journey/policy');await openNode(page,'quote');
  await page.getByRole('button',{name:'Quote đến từ đâu?',exact:true}).click();
  await page.getByRole('button',{name:'Mở bài phát hành trực tiếp',exact:true}).click();
  await page.getByLabel('Quote mẫu',{exact:true}).selectOption('QUOTE-LEARN-102');
  await runThrough(page,'duplicate-guard');
  await button(page,'Bước sau').click();
  await page.getByRole('button',{name:'fillMissingValue → customerName ↗',exact:true}).click();
  await page.getByRole('tab',{name:'Nhìn toàn cảnh',exact:true}).click();
  await openNode(page,'online');
  await page.getByRole('button',{name:'Kiểm tra lại giao dịch online ↗',exact:true}).click();
  await expect(page.getByTestId('issuance-map-detail')).toContainText('retryCheckPayment ≤ 3');
  await page.locator('.policy-reading-points').getByRole('button',{name:/3\. ScanPaymentInProcessFunc/}).click();
  await expect(page.getByTestId('policy-source')).toHaveAttribute('data-source-id','online-recheck');
  await page.reload();
  await expect(page.getByTestId('policy-source')).toHaveAttribute('data-source-id','online-recheck');
  await page.getByTestId('policy-resume-practice').click();
  const params=new URL(page.url()).searchParams;
  expect(params.get('node')).toBe('map');expect(params.get('at')).toBe('fill-enter');expect(params.get('sim')).toBe('checked');
  await expect(page.getByTestId('policy-source')).toHaveAttribute('data-source-id','create-customer');
  await expect(page.getByTestId('quote-policy-mapping')).toContainText('Khách hàng mẫu Nam');
  await page.goBack();await expect(page.getByTestId('policy-source')).toHaveAttribute('data-source-id','online-recheck');
});

test('Command detail opens directly before view; Query and Core results remain separate',async({page})=>{
  const context='group=create&mode=overview&node=flow&quote=QUOTE-LEARN-101&sim=command';
  await page.goto(`/journey/policy?${context}`);await openNode(page,'save');
  await page.getByRole('button',{name:'Mở bài Chi tiết',exact:true}).click();
  await finishDetail(page);
  await expect(page.getByTestId('policy-detail')).toContainText('POL-FROM-QUOTE-LEARN-101');
  await page.goto(`/journey/policy?${context}`);await openNode(page,'view');
  await expect(page.getByTestId('issuance-map-detail')).toContainText('mốc view chưa chạy');
  await page.getByRole('button',{name:'Mở bài Danh sách',exact:true}).click();
  await expect(page.locator('.policy-result-summary')).toContainText('0 hợp đồng');
  await page.goto(`/journey/policy?${context.replace('sim=command','sim=view')}`);await openNode(page,'view');
  await expect(page.getByTestId('issuance-map-detail')).toContainText('Mô phỏng đã ghi view cùng ID');
  await expect(page.getByTestId('issuance-map-detail')).toContainText('sync-policy-view/{id}');
  await openNode(page,'core');
  await expect(page.getByTestId('issuance-map-detail')).toContainText('Chưa chạy mô phỏng/Core thật');
  await page.getByRole('button',{name:'Xem source API / lịch / kết quả Core',exact:true}).click();
  await page.locator('.policy-reading-points').getByRole('button',{name:/2\. SyncPolicyToCoreByPolicyIdFunc/}).click();
  await expect(page.getByTestId('policy-source')).toContainText('SyncPolicyStatus.SYNCED');
});

test('optional release and collection payment are attached to the selected branch; mobile details are below the diagram',async({page})=>{
  await page.setViewportSize({width:390,height:844});
  await page.goto('/journey/policy?group=create&mode=overview&node=validate&sentQuote=QUOTE-LEARN-101&backend=1');
  await openNode(page,'online');
  await expect(page.locator('[data-extension="collection-payment"]')).toHaveCount(0);
  const canvas=(await page.getByTestId('issuance-map').boundingBox())!;
  const panel=(await page.getByTestId('issuance-map-detail').boundingBox())!;
  expect(panel.y).toBeGreaterThan(canvas.y+canvas.height);
  await page.getByRole('button',{name:'Phát hành lại sau khi đã trả tiền ↗',exact:true}).click();
  await expect(page.getByTestId('issuance-map-detail')).toContainText('Listener lịch cho Quote PAID đang bị comment');
  await expect(page.getByTestId('highlighted-code')).toHaveAttribute('data-ready','true');
  expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
  await openNode(page,'cash');
  await expect(page.locator('[data-extension="online-recheck"]')).toHaveCount(0);
  await page.getByRole('button',{name:'Nộp phí thu hộ sau phát hành ↗',exact:true}).click();
  await expect(page.getByTestId('issuance-map-detail')).toContainText('Không tạo lại hợp đồng');
  expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
  await page.getByTestId('policy-resume-practice').click();
  await expect(page.getByTestId('policy-source')).toHaveAttribute('data-source-id','create-check');
});

