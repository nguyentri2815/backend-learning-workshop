import type {Page} from '@playwright/test';
export async function choosePolicySession(page:Page,id:'quote-beginner'|'direct-quote'){
 await page.getByRole('button',{name:'Mô phỏng cả phiên triển khai',exact:true}).click();
 await page.getByRole('menuitemradio',{name:id==='quote-beginner'?/^Xây Policy từ Quote/:/^Phát hành trực tiếp từ Quote/}).click();
}
