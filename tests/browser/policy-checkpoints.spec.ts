import {expect,test} from '@playwright/test';
import {advanceTo,button,header,line,primary,ready,route,runThrough,openCheckpointDetails,returnToStop} from './execution-helpers';

for(const missing of [false,true])test(`Optional snapshots ${missing?'missing':'valid'} only change after L61; L62 only observes a condition`,async({page})=>{
 await page.goto(route);if(missing)await page.getByLabel('Quote mẫu',{exact:true}).selectOption('QUOTE-NOT-FOUND');await advanceTo(page,'quote-read');
 const before=page.getByTestId('debug-before'),after=page.getByTestId('debug-after');
 await expect(before).toContainText('Chưa gán');await expect(after).toContainText('Chưa chạy dòng này');await primary(page).click();
 await expect(after).toContainText(missing?'Optional rỗng':'Optional có giá trị');await expect(after.locator('[data-variable=optional]')).toHaveAttribute('data-changed','true');
 await primary(page).click();await expect(after.locator('[data-variable=optional]')).toHaveAttribute('data-changed','false');
 await expect(after.locator('[data-changed=true]')).toHaveCount(0);await expect(after).toContainText('Kết quả điều kiện · quan sát');
});
for(const mobile of [false,true])test(`${mobile?'mobile':'desktop'} historical L61 and current L76 share IDs across header, editor and variables with wrap on/off`,async({page})=>{
 if(mobile)await page.setViewportSize({width:390,height:844});await page.goto(route);await runThrough(page,'duplicate-guard');
 const walk=new URL(page.url()).searchParams.get('walk');
 for(const wrap of [false,true]){
  await page.getByRole('checkbox',{name:'Xuống dòng code',exact:true}).setChecked(wrap);await openCheckpointDetails(page);await page.getByLabel('Điểm đang xem',{exact:true}).selectOption('quote-read');
  for(const target of [header(page),page.getByTestId('checkpoint-editor'),page.locator('.checkpoint-variable-wrapper')])await expect(target).toHaveAttribute('data-checkpoint-id','quote-read');
  await expect(line(page,61)).toBeInViewport();await expect(page.getByTestId('debug-after')).not.toContainText('policyAggregateList');
  expect(new URL(page.url()).searchParams.get('walk')).toBe(walk);await returnToStop(page);await expect(line(page,76)).toBeInViewport();await expect(page.getByTestId('debug-after')).toContainText('policyAggregateList');
 }
 if(!mobile){const width=(await page.getByTestId('code-scroll').boundingBox())!.width;await button(page,'Thu gọn vùng biến').click();expect((await page.getByTestId('code-scroll').boundingBox())!.width).toBeGreaterThan(width+100);}
 else{const editor=(await page.locator('.practice-reader-pane').boundingBox())!,vars=(await page.getByTestId('checkpoint-variables').boundingBox())!;expect(vars.y).toBeGreaterThanOrEqual(editor.y+editor.height);}
 await page.reload();await ready(page);await expect(header(page)).toHaveAttribute('data-checkpoint-id','duplicate-guard');expect(new URL(page.url()).searchParams.get('walk')).toBe(walk);
});
test('method scopes expose parameters and incremental command fields instead of future assignments',async({page})=>{
 await page.goto(route);await advanceTo(page,'internal-enter');await expect(page.getByTestId('debug-after')).not.toContainText('optional');
 await advanceTo(page,'status-enter');await expect(page.getByTestId('debug-after')).not.toContainText('command');
 await advanceTo(page,'fill-enter');await expect(page.getByTestId('debug-after')).toContainText('quoteAggregate');await expect(page.getByTestId('debug-after')).toContainText('command');await expect(page.getByTestId('debug-after')).not.toContainText('customerName');
 await advanceTo(page,'fill-name');await expect(page.getByTestId('debug-after')).toContainText('customerName');await expect(page.getByTestId('debug-after')).not.toContainText('policyCode');
 await advanceTo(page,'map-code');await expect(page.getByTestId('debug-after')).toContainText('policyCode');await expect(page.getByTestId('debug-after')).not.toContainText('policyId');
});
