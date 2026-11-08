import {expect,test} from '@playwright/test';
import type {Page} from '@playwright/test';

const step=(page:Page,index:number)=>page.getByRole('navigation',{name:'Sáu bước phát hành trực tiếp'}).getByRole('button').nth(index-1);
async function begin(page:Page,quote='QUOTE-LEARN-101') {
  await page.goto('/journey/policy?group=create&mode=steps&node=quote');
  await page.getByLabel('Quote mẫu',{exact:true}).selectOption(quote);
  await page.getByRole('button',{name:'Phát hành thành hợp đồng',exact:true}).click();
  await page.getByRole('button',{name:'Lần vào backend',exact:true}).click();
  await page.locator('.policy-call-links').getByRole('button',{name:'CreatePolicyFunc.exec(quoteId) ↗',exact:true}).click();
  const control=page.getByRole('button',{name:'Chạy đến dòng tiếp theo',exact:true});
  await expect(control).toBeInViewport({ratio:.999});
  const nav=(await page.getByRole('navigation',{name:'Sáu bước phát hành trực tiếp'}).boundingBox())!;
  expect((await control.boundingBox())!.y).toBeGreaterThanOrEqual(nav.y+nav.height);
}
async function debug(page:Page,count=8){for(let i=0;i<count;i++)await page.getByTestId('practice-action-dock').getByRole('button').last().click();}

test('six steps start with Quote details; publish opens pending Network and backend source opens only on request',async({page})=>{
  const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
  // Cover the subtab entry with no explicit node as well as a direct step link.
  await page.goto('/journey/policy?group=create&mode=steps');
  await expect(step(page,1)).toHaveAttribute('aria-current','step');
  await expect(step(page,2)).toBeDisabled();
  await expect(step(page,2)).toContainText('Tiếp theo');
  await expect(page.getByTestId('quote-detail-screen')).toContainText('Q-DEMO-101');
  await expect(page.getByTestId('quote-detail-screen')).toContainText('1.800.000 VND');
  await expect(page.getByTestId('policy-source')).toHaveCount(0);
  await expect(page.getByTestId('create-network')).toHaveCount(0);
  await expect(page.locator('.policy-json').first()).not.toBeVisible();
  await page.getByRole('button',{name:'Phát hành thành hợp đồng',exact:true}).click();
  await expect(page.getByTestId('create-network')).toHaveAttribute('data-state','pending');
  await expect(page.getByTestId('create-network')).toContainText('POST /policy/create/QUOTE-LEARN-101');
  await expect(page.getByTestId('network-quote-id')).toHaveText('QUOTE-LEARN-101');
  await expect(page.getByTestId('create-network')).toContainText('Trống · 0 byte');
  await expect(page.getByTestId('policy-source')).toHaveCount(0);
  await page.getByRole('button',{name:'Lần vào backend',exact:true}).click();
  await expect(page.getByTestId('policy-source')).toHaveAttribute('data-source-id','create-api');
  await expect(page.getByTestId('policy-source').locator('[data-line="45"]')).toHaveAttribute('data-explained','true');
  await expect(page.locator('.tree-file')).toHaveCount(1);
  await expect(page.locator('.policy-reading-points')).toHaveCount(0);
  await expect(step(page,2)).toBeEnabled();expect(errors).toEqual([]);
});

test('valid Quote traverses debug, mapping, all writes, view checkpoints and two reads with the same Policy ID',async({page})=>{
  test.setTimeout(60_000);
  const calls:string[]=[];const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
  page.on('request',r=>{if(/^\/(policy|quote)\//.test(new URL(r.url()).pathname))calls.push(r.url());});
  await begin(page);
  await expect(page.getByTestId('policy-source')).toHaveAttribute('data-source-id','create-check');
  await expect(page.getByTestId('debug-before')).toContainText('QUOTE-LEARN-101');
  await expect(page.getByTestId('policy-source').locator('[data-line="61"]')).toHaveAttribute('data-explained','true');
  await debug(page,1);
  await expect(page.getByTestId('debug-after')).toContainText('"present": true');
  await expect(page.getByTestId('debug-after')).toContainText('Q-DEMO-101');
  await debug(page,2);
  await expect(page.getByTestId('policy-source').locator('[data-line="66"]')).toHaveAttribute('data-explained','true');
  await page.getByRole('button',{name:'Về điểm dừng trước',exact:true}).click();
  await expect(page.getByTestId('policy-debug')).toHaveAttribute('data-cursor','2');
  await debug(page,3);
  await expect(page.getByTestId('policy-source').locator('[data-line="74"]')).toHaveAttribute('data-explained','true');
  await expect(page.getByTestId('debug-after')).toContainText('policyAggregateList');
  await expect(page.getByTestId('debug-after')).toContainText('[]');
  await debug(page,1);
  await expect(page.getByTestId('policy-source').locator('[data-line="75"]')).toHaveAttribute('data-explained','true');
  await debug(page,1);
  await expect(step(page,2)).toContainText('đã hoàn thành');
  await expect(page.getByTestId('create-network')).toHaveAttribute('data-state','pending');
  await page.getByRole('button',{name:'Sang bước 3: Dựng dữ liệu Policy',exact:true}).click();
  await expect(page.getByTestId('mapping-trace')).toContainText('Quote.customerModel.name');
  await expect(page.getByTestId('mapping-trace')).toContainText('command.customerName');
  await expect(page.getByTestId('mapping-trace')).toContainText('Khách hàng mẫu Mai');
  await expect(page.getByTestId('policy-source').locator('[data-line="206"]')).toHaveAttribute('data-explained','true');
  await page.getByRole('button',{name:'Ngày hiệu lực',exact:true}).click();
  await expect(page.getByTestId('mapping-trace')).toContainText('2026-11-01T00:00:00+07:00');
  await expect(page.getByTestId('policy-source').locator('[data-line="90"]')).toHaveAttribute('data-explained','true');
  await page.getByRole('button',{name:'Xác nhận dữ liệu → bước 4',exact:true}).click();
  await page.getByRole('button',{name:'Thực hiện bước ghi mô phỏng',exact:true}).click();
  const policyId='POL-FROM-QUOTE-LEARN-101';
  await expect(page.getByTestId('command-written')).toContainText(policyId);
  await expect(page.getByTestId('command-written')).toContainText('Quote.status=PUBLISHED(9)');
  await expect(page.getByTestId('command-written')).toContainText('secondInsuranceId=INS-QUOTE-LEARN-101');
  await expect(page.getByTestId('policy-source')).toHaveAttribute('data-source-id','store-save');
  await expect(page.getByTestId('policy-source').locator('[data-line="126"]')).toHaveAttribute('data-explained','true');
  await expect(page.getByTestId('create-network')).toHaveAttribute('data-state','complete');
  await page.getByRole('button',{name:'Mở Chi tiết ngay bằng Policy ID',exact:true}).click();
  await expect(page.getByTestId('policy-detail')).toContainText(policyId);
  await page.getByRole('tab',{name:'01 Tạo mới',exact:true}).click();
  await expect(page.getByTestId('command-written')).toContainText(policyId);
  await page.getByRole('button',{name:'Sang bước 5: Cập nhật dữ liệu tra cứu',exact:true}).click();
  await page.getByRole('button',{name:'Xem danh sách trước khi Flow ghi view',exact:true}).click();
  await expect(page.getByTestId('query-before-view')).toContainText('0 hợp đồng');
  await page.getByRole('group',{name:'Event và Flow'}).getByRole('button',{name:'Flow nhận event',exact:true}).click();
  await expect(page.getByTestId('policy-source')).toHaveAttribute('data-source-id','flow-create');
  await page.getByRole('button',{name:'Cho Flow xử lý event → ghi view',exact:true}).click();
  await expect(page.getByTestId('query-after-view')).toContainText('1 hợp đồng');
  await expect(page.getByTestId('query-after-view')).toContainText(policyId);
  await expect(page.getByTestId('query-before-view')).toContainText('0 hợp đồng');
  await expect(page.getByTestId('policy-source').locator('[data-line="56"]')).toHaveAttribute('data-explained','true');
  await page.getByRole('button',{name:'Sang bước 6: Xem kết quả',exact:true}).click();
  await page.getByRole('button',{name:'Tìm Policy vừa tạo',exact:true}).click();
  await expect(page.getByTestId('created-search')).toContainText(policyId);
  await page.getByRole('button',{name:'Mở chi tiết từ kết quả',exact:true}).click();
  await expect(page.getByTestId('created-direct-detail')).toContainText(policyId);
  await expect(page.getByTestId('policy-source')).toHaveAttribute('data-source-id','c-find');
  await page.getByRole('button',{name:'Mở chi tiết theo ID',exact:true}).click();
  await expect(page.getByTestId('created-direct-detail')).toContainText('Mở trực tiếp theo ID');
  await expect(page.getByTestId('created-direct-detail')).toContainText(policyId);
  await page.getByRole('button',{name:'Xác nhận đã đối chiếu cùng ID',exact:true}).click();
  await expect(step(page,6)).toContainText('đã hoàn thành');
  // Revisiting completed steps never starts another request or undoes results.
  await step(page,1).click();
  await expect(page.getByTestId('practice-quote-id')).toHaveText('QUOTE-LEARN-101');
  await expect(page.getByTestId('create-network')).toHaveAttribute('data-state','complete');
  await expect(page.getByRole('button',{name:'Phát hành thành hợp đồng',exact:true})).toHaveCount(0);
  await step(page,4).click();await expect(page.getByTestId('command-written')).toContainText(policyId);
  await step(page,6).click();await page.reload();
  await expect(page.getByTestId('created-direct-detail')).toContainText(policyId);
  await page.getByRole('button',{name:'Mở bài Danh sách với Policy vừa tạo',exact:true}).click();
  await expect(page.locator('.policy-result-summary')).toContainText('1 hợp đồng');
  await page.getByRole('button',{name:`Mở chi tiết ${policyId}`,exact:true}).click();
  await expect(page.getByTestId('policy-detail')).toContainText(policyId);
  await expect(page.getByTestId('policy-detail')).toContainText('Khách hàng mẫu Mai');
  expect(calls).toEqual([]);expect(errors).toEqual([]);
});

for(const fixture of [
  {quote:'QUOTE-NOT-FOUND',count:2,line:63,error:'AGENT.QUOTE_NOT_EXIST'},
  {quote:'QUOTE-LEARN-103',count:8,line:77,error:'AGENT.QUOTE_CAN_NOT_RELEASE_POLICY'},
])test(`blocked ${fixture.quote} stops at source line ${fixture.line}, updates Network and allows a clean retry`,async({page})=>{
  await begin(page,fixture.quote);
  await debug(page,1);
  await expect(page.getByTestId('debug-after')).toContainText(fixture.quote==='QUOTE-NOT-FOUND'?'"present": false':'"present": true');
  await debug(page,fixture.count-1);
  await expect(page.getByTestId('create-failure')).toContainText(fixture.error);
  await expect(page.getByTestId('create-network')).toHaveAttribute('data-state','blocked');
  await expect(page.getByTestId('create-network')).toContainText(`CreatePolicyFunc.java:${fixture.line}`);
  await expect(step(page,3)).toBeDisabled();await expect(step(page,4)).toBeDisabled();
  await expect(page.getByTestId('policy-source').locator(`[data-line="${fixture.line}"]`)).toHaveAttribute('data-explained','true');
  if(fixture.count===2){
    await expect(page.getByTestId('debug-after')).not.toContainText('policyAggregateList');
    await expect(page.getByTestId('policy-source').locator('[data-line="74"]')).toHaveAttribute('data-explained','false');
  }else await expect(page.getByTestId('debug-before')).toContainText('POL-EXISTING-103');
  await page.getByRole('button',{name:'Về điểm dừng trước',exact:true}).click();
  await expect(page.getByTestId('create-network')).toHaveAttribute('data-state','blocked');
  await page.getByRole('button',{name:'Quay về dòng đang chạy',exact:true}).click();
  await page.getByRole('button',{name:'Đổi sang Quote hợp lệ để thử lại',exact:true}).click();
  await expect(page.getByTestId('practice-quote-id')).toHaveText('QUOTE-LEARN-101');
  await expect(page.getByTestId('create-network')).toHaveCount(0);
  await expect(page.getByTestId('policy-source')).toHaveCount(0);
  await page.getByRole('button',{name:'Phát hành thành hợp đồng',exact:true}).click();
  await page.getByRole('button',{name:'Lần vào backend',exact:true}).click();
  await page.getByRole('button',{name:'Vào bước 2: Kiểm tra Quote',exact:true}).click();
  await debug(page);await page.getByRole('button',{name:'Sang bước 3: Dựng dữ liệu Policy',exact:true}).click();
  await page.getByRole('button',{name:'Xác nhận dữ liệu → bước 4',exact:true}).click();
  await page.getByRole('button',{name:'Thực hiện bước ghi mô phỏng',exact:true}).click();
  await expect(page.getByTestId('create-network')).toHaveAttribute('data-state','complete');
  await expect(page.getByTestId('command-written')).toContainText('POL-FROM-QUOTE-LEARN-101');
  await page.getByRole('button',{name:'Sang bước 5: Cập nhật dữ liệu tra cứu',exact:true}).click();
  await page.getByRole('button',{name:'Cho Flow xử lý event → ghi view',exact:true}).click();
  await page.getByRole('button',{name:'Sang bước 6: Xem kết quả',exact:true}).click();
  await page.getByRole('button',{name:'Mở chi tiết theo ID',exact:true}).click();
  await expect(page.getByTestId('created-direct-detail')).toContainText('POL-FROM-QUOTE-LEARN-101');
});

test('debug cursor and source survive reload, subtab changes and history; future dates produce initial status zero',async({page})=>{
  await begin(page,'QUOTE-LEARN-102');await debug(page,6);
  await expect(page.getByTestId('policy-source').locator('[data-line="74"]')).toHaveAttribute('data-explained','true');
  await page.reload();await expect(page.getByTestId('policy-debug')).toHaveAttribute('data-cursor','6');
  await page.getByRole('tab',{name:'Nhìn toàn cảnh',exact:true}).click();
  await page.getByRole('tab',{name:'Làm lại từng bước',exact:true}).click();
  await expect(page.getByTestId('policy-debug')).toHaveAttribute('data-cursor','6');
  await debug(page,2);await page.getByRole('button',{name:'Sang bước 3: Dựng dữ liệu Policy',exact:true}).click();
  await page.getByRole('button',{name:'Trạng thái ban đầu',exact:true}).click();
  await expect(page.getByTestId('mapping-trace')).toContainText('0 · Chưa tới hiệu lực');
  await expect(page.getByTestId('policy-source')).toHaveAttribute('data-source-id','create-status');
  await page.goBack();await expect(page.getByTestId('mapping-trace')).toContainText('command.customerName');
  await page.goForward();await expect(page.getByTestId('mapping-trace')).toContainText('0 · Chưa tới hiệu lực');
});

test('direct links enforce prerequisites; mobile Quote, Network and debug fit the screen',async({page})=>{
  await page.goto('/journey/policy?group=create&mode=steps&node=save');
  await expect(page.locator('.policy-prerequisite')).toContainText('Cần hoàn tất thao tác trước');
  await expect(page.getByRole('button',{name:'Thực hiện bước ghi mô phỏng',exact:true})).toHaveCount(0);
  await page.setViewportSize({width:390,height:844});
  await begin(page);await debug(page,6);
  await expect(page.getByTestId('debug-after')).toContainText('policyAggregateList');
  expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
  await page.getByRole('checkbox',{name:'Xuống dòng code',exact:true}).uncheck();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
});
