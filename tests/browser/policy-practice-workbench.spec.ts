import {expect,test} from '@playwright/test';
import type {Page} from '@playwright/test';

const primary=(page:Page)=>page.getByTestId('practice-action-dock').getByRole('button').last();
const line=(page:Page,n:number)=>page.getByTestId('policy-source').locator(`[data-line="${n}"]`);
const context='group=create&mode=steps&quote=QUOTE-LEARN-101&sentQuote=QUOTE-LEARN-101&backend=1&debugVersion=2';
async function start(page:Page){
  await page.goto('/journey/policy?group=create&mode=steps&node=quote');
  await primary(page).click();await primary(page).click();
  await page.locator('.policy-call-links').getByRole('button',{name:'CreatePolicyFunc.exec(quoteId) ↗',exact:true}).click();
}

test('caller, L67, explicit entry at L70, read modes and scrolling preserve the execution pointer',async({page})=>{
  await start(page);
  await expect(page.getByTestId('source-handoff')).toContainText('PolicyController.createPolicy');
  await expect(page.getByTestId('source-handoff')).toContainText('exec · L61');
  await expect(line(page,61)).toHaveAttribute('data-upcoming','true');
  for(let i=0;i<4;i++)await primary(page).click();
  await expect(primary(page)).toHaveText('Vào runInternal');
  await expect(line(page,67)).toHaveAttribute('data-executed','true');
  await expect(line(page,70)).toHaveAttribute('data-upcoming','true');
  await page.getByRole('button',{name:'Xem nơi gọi',exact:true}).click();
  await expect(page.getByTestId('policy-source')).toHaveAttribute('data-source-id','create-api');
  await expect(line(page,45)).toHaveAttribute('data-viewing','true');
  expect(new URL(page.url()).searchParams.get('debugMax')).toBe('4');
  await page.getByRole('button',{name:'Quay về dòng đang chạy',exact:true}).click();
  await expect(line(page,67)).toHaveAttribute('data-viewing','true');
  await primary(page).click();
  await expect(line(page,70)).toHaveAttribute('data-viewing','true');
  await expect(line(page,74)).toHaveAttribute('data-upcoming','true');
  await expect(page.getByTestId('debug-after')).toContainText('quoteAggregate');
  await expect(page.getByTestId('source-handoff')).toContainText('L67');
  await expect(page.getByTestId('source-handoff')).toContainText('runInternal · L70');
  await expect(page.locator('.practice-tree-handoff')).toContainText('CreatePolicyFunc.java');
  await page.getByRole('button',{name:'Mở rộng ngữ cảnh',exact:true}).click();
  await expect(page.getByTestId('policy-source')).toHaveAttribute('data-reading-mode','context');
  await expect(line(page,60)).toContainText('exec(String quoteId)');
  await expect(line(page,224)).toContainText('publishedQuote');
  await expect(page.getByTestId('policy-source')).toContainText('không có trong snapshot');
  const code=page.getByTestId('code-scroll');
  await code.evaluate(e=>{e.scrollTop=e.scrollHeight;});
  await expect(primary(page)).toBeInViewport({ratio:.99});
  const dock=(await page.getByTestId('practice-action-dock').boundingBox())!;
  expect((await page.getByTestId('policy-source').boundingBox())!.y).toBeGreaterThan(dock.y+dock.height);
  expect(new URL(page.url()).searchParams.get('debugMax')).toBe('5');
  await page.getByRole('button',{name:'Toàn bộ file',exact:true}).click();
  await expect(page.getByTestId('practice-file-unavailable')).toContainText('chưa có bản đầy đủ');
  await expect(page.getByTestId('practice-file-unavailable')).toContainText('D:\\ALPACA\\agent-system');
  await expect(page.getByTestId('policy-source')).toHaveCount(0);
  await page.getByRole('button',{name:'Quay về dòng đang chạy',exact:true}).click();
  await expect(line(page,70)).toHaveAttribute('data-viewing','true');
  await primary(page).click();await expect(line(page,74)).toHaveAttribute('data-viewing','true');
  await page.getByRole('button',{name:'Về điểm dừng trước',exact:true}).click();
  await expect(line(page,70)).toHaveAttribute('data-viewing','true');
  await expect(line(page,74)).toHaveAttribute('data-executed','true');
  expect(new URL(page.url()).searchParams.get('debugMax')).toBe('6');
});

test('all six stages share navigation, trace and reading modes; 5 → 4 → 5 keeps Policy and progress',async({page})=>{
  const routes=[['quote',''],['validate','&debug=4&debugMax=4'],['map','&sim=checked'],['save','&sim=command&writePoint=insurance'],['flow','&sim=command&flowPoint=receive'],['result','&sim=view&readSource=detail']];
  for(const [index,[node,extra]] of routes.entries()){
    await page.goto(`/journey/policy?${context}&node=${node}${extra}`);
    await expect(page.getByRole('navigation',{name:'Điều hướng bước đang thao tác'})).toContainText(`Đang xem ${index+1}/6`);
    await expect(page.getByRole('region',{name:'Sơ đồ theo dõi thực thi'}).locator('.react-flow__node')).toHaveCount(6);
    await expect(page.getByRole('group',{name:'Phạm vi đọc code'}).getByRole('button')).toHaveCount(3);
    await expect(page.getByTestId('source-handoff')).toContainText('→');
    await expect(page.getByTestId('practice-action-dock')).toBeVisible();
  }
  await page.goto(`/journey/policy?${context}&node=flow&sim=command&flowPoint=receive`);
  await expect(page.getByTestId('source-handoff')).toContainText('Qua event CreatePolicyEvent');
  await expect(page.getByRole('navigation',{name:'Điều hướng bước đang thao tác'})).toContainText('Cho Flow xử lý event');
  const nav=page.getByRole('navigation',{name:'Điều hướng bước đang thao tác'});
  await nav.getByRole('button',{name:'← Bước 4: Ghi Policy',exact:true}).click();
  await expect(page.getByTestId('command-written')).toContainText('POL-FROM-QUOTE-LEARN-101');
  await expect(page.getByTestId('create-network')).toHaveAttribute('data-state','complete');
  await nav.getByRole('button',{name:'Bước 5: Cập nhật dữ liệu tra cứu →',exact:true}).click();
  await expect(page.getByTestId('create-network')).toHaveAttribute('data-state','complete');
  await primary(page).click();
  await expect(page.getByTestId('query-after-view')).toContainText('POL-FROM-QUOTE-LEARN-101');
  await nav.getByRole('button',{name:'← Bước 4: Ghi Policy',exact:true}).click();
  await nav.getByRole('button',{name:'Bước 5: Cập nhật dữ liệu tra cứu →',exact:true}).click();
  await expect(page.getByTestId('query-after-view')).toContainText('1 hợp đồng');
  expect(new URL(page.url()).searchParams.get('sim')).toBe('view');
  await nav.getByRole('button',{name:'Bước 6: Xem kết quả →',exact:true}).click();
  await primary(page).click();
  await expect(line(page,114)).toHaveAttribute('data-executed','true');
  await expect(page.getByTestId('policy-source').locator('[data-upcoming=true]')).toHaveCount(0);
  await expect(page.getByTestId('source-handoff')).toContainText('L26');
  await page.getByRole('button',{name:'Mở chi tiết chặng 6',exact:true}).click();
  const graph=page.getByRole('region',{name:'Sơ đồ theo dõi thực thi'});
  const query=(await graph.locator('.react-flow__node[data-id=query]').boundingBox())!;
  const detail=(await graph.locator('.react-flow__node[data-id=detail]').boundingBox())!;
  expect(detail.y).toBeGreaterThan(query.y+query.height);
  await expect(graph.locator('.react-flow__edge[data-id="1"]')).toHaveAttribute('aria-label','Edge from ui to detail');
});

for(const [quote,count,error] of [['QUOTE-NOT-FOUND',2,'AGENT.QUOTE_NOT_EXIST'],['QUOTE-LEARN-103',8,'AGENT.QUOTE_CAN_NOT_RELEASE_POLICY']] as const)
test(`blocked trace ${quote} ends at the branch and cannot navigate to mapping`,async({page})=>{
  await page.goto(`/journey/policy?group=create&mode=steps&node=validate&quote=${quote}&sentQuote=${quote}&backend=1&debugVersion=2&debug=${count}&debugMax=${count}&attempt=failed`);
  await page.getByRole('button',{name:'Mở chi tiết chặng 2',exact:true}).click();
  await expect(page.getByRole('region',{name:'Sơ đồ theo dõi thực thi'}).locator('.is-blocked')).toHaveCount(1);
  await expect(page.getByTestId('create-network')).toContainText(error);
  const next=page.getByRole('navigation',{name:'Điều hướng bước đang thao tác'}).getByRole('button',{name:'Bước 3: Dựng dữ liệu Policy →',exact:true});
  await expect(next).toBeDisabled();
  if(quote==='QUOTE-NOT-FOUND')await expect(page.getByRole('region',{name:'Sơ đồ theo dõi thực thi'})).toContainText('Không tới runInternal');
  await primary(page).click();await expect(page.getByTestId('practice-quote-id')).toHaveText('QUOTE-LEARN-101');
  await expect(page.getByTestId('create-network')).toHaveCount(0);
});

test('mobile reserves controls above code, supports tree and data panes, and keeps next action reachable after deep scroll',async({page})=>{
  await page.setViewportSize({width:390,height:844});
  await page.goto(`/journey/policy?${context}&node=validate&debug=4&debugMax=4`);
  await page.getByTestId('practice-workstation').evaluate(e=>e.scrollIntoView({block:'start'}));
  await page.getByRole('button',{name:'Thu sơ đồ để đọc code',exact:true}).click();
  await page.getByRole('button',{name:'Mở rộng ngữ cảnh',exact:true}).click();
  await page.getByTestId('code-scroll').evaluate(e=>{e.scrollTop=e.scrollHeight;});
  const code=(await page.getByTestId('code-scroll').boundingBox())!;
  expect(code.height).toBeGreaterThan(150);expect(code.width).toBeGreaterThan(320);
  await expect(primary(page)).toBeInViewport({ratio:.99});
  const dock=(await page.getByTestId('practice-action-dock').boundingBox())!;
  expect(code.y).toBeGreaterThan(dock.y+dock.height);
  await page.getByRole('button',{name:'Mở cây thư mục',exact:true}).click();
  await expect(page.getByLabel('Cây module Policy đã khám phá').getByRole('button',{name:'CreatePolicyFunc.java',exact:true})).toBeVisible();
  await page.getByRole('button',{name:'Thu cây thư mục',exact:true}).click();
  await primary(page).click();await expect(line(page,70)).toHaveAttribute('data-viewing','true');
  await page.getByRole('button',{name:'Dữ liệu bước 2 · biến trước/sau',exact:true}).click();
  await expect(page.getByTestId('debug-after')).toContainText('quoteAggregate');
  await expect(primary(page)).toBeInViewport({ratio:.99});
  await page.getByRole('button',{name:'Xem nơi gọi',exact:true}).click();
  await expect(line(page,67)).toHaveAttribute('data-viewing','true');
  await page.getByRole('button',{name:'Quay về dòng đang chạy',exact:true}).click();
  await expect(line(page,70)).toHaveAttribute('data-viewing','true');
  expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
});
