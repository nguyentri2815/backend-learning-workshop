import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";

const viewportKey = "backend-learning-workshop.setup-flow-viewport.v1";
type View = { x: number; y: number; zoom: number };
async function readView(page: Page): Promise<View> {
  return page.locator(".guide-graph .react-flow__viewport").evaluate(element => {
    const matrix = new DOMMatrix(getComputedStyle(element).transform);
    return { x: matrix.e, y: matrix.f, zoom: matrix.a };
  });
}
async function graphReady(page: Page) {
  if (await page.locator(".guide-map-toggle").getAttribute("aria-expanded") === "false") await page.locator(".guide-map-toggle").click();
  await expect(page.getByTestId("setup-graph")).toHaveAttribute("data-ready", "true");
  await expect(page.locator(".react-flow__node")).toHaveCount(7);
  await page.getByTestId("setup-graph").scrollIntoViewIfNeeded();
}
async function expectView(page: Page, target: View) {
  await expect.poll(async () => {
    const actual = await readView(page);
    return Math.max(Math.abs(actual.x-target.x), Math.abs(actual.y-target.y), Math.abs(actual.zoom-target.zoom));
  }).toBeLessThan(0.02);
}
async function pan(page: Page, dx: number, dy: number) {
  await page.getByTestId("setup-graph").scrollIntoViewIfNeeded();
  const point = await page.locator(".guide-graph").evaluate(element => {
    const rect = element.getBoundingClientRect();
    for (const yRatio of [0.3, 0.5, 0.7, 0.9, 0.1]) for (const xRatio of [0.05, 0.5, 0.95, 0.3, 0.7]) {
      const x = rect.left + rect.width*xRatio;
      const y = rect.top + rect.height*yRatio;
      const target = document.elementFromPoint(x,y);
      if (target?.classList.contains("react-flow__pane")) return {x,y};
    }
    return null;
  });
  expect(point, "A blank part of the graph can be dragged").not.toBeNull();
  await page.mouse.move(point!.x, point!.y);
  await page.mouse.down();
  await page.mouse.move(point!.x+dx, point!.y+dy, {steps:8});
  await page.mouse.up();
}
async function assertAllNodesFit(page: Page) {
  const errors = await page.locator(".guide-graph").evaluate(element => {
    const frame = element.getBoundingClientRect();
    const nodes = [...element.querySelectorAll<HTMLElement>(".guide-flow-node-button")].map(node => ({id:node.closest<HTMLElement>(".react-flow__node")?.dataset.id,rect:node.getBoundingClientRect()}));
    const failures:string[]=[];
    for (const node of nodes) {
      if (node.rect.left<frame.left-1 || node.rect.right>frame.right+1 || node.rect.top<frame.top-1 || node.rect.bottom>frame.bottom+1) failures.push(`Clipped ${node.id}`);
    }
    for (let i=0;i<nodes.length;i++) for (let j=i+1;j<nodes.length;j++) {
      const a=nodes[i].rect, b=nodes[j].rect;
      if (Math.min(a.right,b.right)>Math.max(a.left,b.left) && Math.min(a.bottom,b.bottom)>Math.max(a.top,b.top)) failures.push(`Overlapping ${nodes[i].id}/${nodes[j].id}`);
    }
    for (const edge of element.querySelectorAll<SVGGElement>(".react-flow__edge")) {
      const path = edge.querySelector<SVGPathElement>(".react-flow__edge-path");
      if (!path?.getAttribute("d")) {failures.push("Missing edge path");continue;}
      const endpoints=(edge.dataset.id ?? "").split("-");
      const transform=path.getScreenCTM();
      if (!transform) {failures.push("Missing edge transform");continue;}
      for (let sample=1;sample<20;sample++) {
        const raw=path.getPointAtLength(path.getTotalLength()*sample/20);
        const point=new DOMPoint(raw.x,raw.y).matrixTransform(transform);
        for (const node of nodes.filter(node=>node.id && !endpoints.includes(node.id))) {
          const r=node.rect;
          if(point.x>r.left+1 && point.x<r.right-1 && point.y>r.top+1 && point.y<r.bottom-1) failures.push(`Edge crosses ${node.id}`);
        }
      }
    }
    return failures;
  });
  expect(errors).toEqual([]);
}

test("React Flow renders seven readable nodes and six clear ordered edges; selection and progress agree", async ({page}) => {
  const errors:string[]=[];
  page.on("pageerror",error=>errors.push(error.message));
  await page.goto("/journey/environment?experience=guide");
  await graphReady(page);
  await expect(page.locator(".react-flow__edge")).toHaveCount(6);
  await expect(page.locator(".guide-ordered-steps")).toHaveCount(0);
  await assertAllNodesFit(page);
  const baseline=await readView(page);
  await page.locator(".guide-step-nav").getByRole("button",{name:"Bước 2: Chuẩn bị công cụ và IDE",exact:true}).click();
  await expect(page).toHaveURL(/step=tools/);
  await expect(page.locator('.react-flow__node[data-id="tools"] button')).toHaveAttribute("aria-current","step");
  for (const id of ["tools-java","tools-jdk","tools-gradle","tools-ide","tools-docker"]) {
    if (await page.locator(`#guide-action-${id}`).getAttribute("aria-expanded") !== "true") await page.locator(`#guide-action-${id}`).click();
    await page.getByRole("checkbox").check();
  }
  await expect(page.locator('.react-flow__node[data-id="tools"]')).toContainText("Đã tự kiểm tra");
  await expect(page.locator('.react-flow__node[data-id="tools"]')).toContainText("5/5");
  await expect(page.locator(".guide-total")).toContainText("1 / 7");
  await expectView(page,baseline);
  await page.locator('.react-flow__node[data-id="config"] button').focus();
  await page.keyboard.press("Enter");
  await expect(page.locator(".guide-detail-heading")).toContainText("Kiểm tra cấu hình");
  await expectView(page,baseline);
  expect(errors).toEqual([]);
});

test("zoom buttons, wheel and drag move the real viewport; explicit overview and current-step focus recover it", async ({page}) => {
  await page.goto("/journey/environment?step=run");
  await graphReady(page);
  const baseline=await readView(page);
  await page.getByRole("button",{name:"Phóng to flow",exact:true}).click();
  await expect.poll(async()=>(await readView(page)).zoom).toBeGreaterThan(baseline.zoom+0.1);
  const zoomed=await readView(page);
  await pan(page,48,26);
  await expect.poll(async()=>Math.abs((await readView(page)).x-zoomed.x)).toBeGreaterThan(30);
  const dragged=await readView(page);
  expect(Math.abs(dragged.zoom-zoomed.zoom)).toBeLessThan(0.001);
  await page.getByRole("button",{name:"Về bước đang làm",exact:true}).click();
  await expect.poll(async()=>{
    const frame=await page.locator(".guide-graph").boundingBox();
    const node=await page.locator('.react-flow__node[data-id="run"] button').boundingBox();
    return Math.max(Math.abs(node!.x+node!.width/2-frame!.x-frame!.width/2),Math.abs(node!.y+node!.height/2-frame!.y-frame!.height/2));
  }).toBeLessThan(2);
  expect(Math.abs((await readView(page)).zoom-dragged.zoom)).toBeLessThan(0.001);
  await page.getByRole("button",{name:"Xem toàn cảnh",exact:true}).click();
  await expectView(page,baseline);
  await assertAllNodesFit(page);
  const frame=(await page.locator(".guide-graph").boundingBox())!;
  await page.mouse.move(frame.x+frame.width/2,frame.y+frame.height/2);
  await page.mouse.wheel(0,-140);
  await expect.poll(async()=>(await readView(page)).zoom).toBeGreaterThan(baseline.zoom+0.01);
  const wheelZoom=await readView(page);
  await page.getByRole("button",{name:"Thu nhỏ flow",exact:true}).click();
  await expect.poll(async()=>(await readView(page)).zoom).toBeLessThan(wheelZoom.zoom-0.01);
});

test("viewport survives checklist, details/file dialog, node selection, Back/Forward, reload and leaving the journey", async ({page}) => {
  await page.goto("/journey/environment?step=tools&check=tools-java");
  await graphReady(page);
  await page.getByRole("button",{name:"Phóng to flow",exact:true}).click();
  await expect.poll(async()=>(await readView(page)).zoom).toBeGreaterThan(1.1);
  await pan(page,12,14);
  const position=await readView(page);
  await page.getByRole("checkbox",{name:/Tôi đã kiểm tra xong/}).check();
  await expectView(page,position);
  await page.getByRole("button",{name:"Xem cách đã xử lý trong repo này",exact:true}).click();
  await expectView(page,position);
  await page.locator(".guide-history-files").getByRole("button",{name:"build.gradle",exact:true}).click();
  await expect(page.getByTestId("highlighted-code")).toContainText("JavaLanguageVersion.of(21)");
  await expectView(page,position);
  await page.getByRole("button",{name:"Về checklist",exact:true}).click();
  await expectView(page,position);
  await page.locator(".guide-step-nav").getByRole("button",{name:"Bước 5: Build module cần làm",exact:true}).click();
  await expectView(page,position);
  await page.goBack();
  await expect(page).toHaveURL(/step=tools/);
  await expectView(page,position);
  await page.goForward();
  await expect(page).toHaveURL(/step=build/);
  await expectView(page,position);
  await page.reload();
  await graphReady(page);
  await expectView(page,position);
  await expect(page.locator(".guide-detail-heading")).toContainText("Build module");
  await page.getByRole("link",{name:/Policy.*02/}).click();
  await page.getByRole("link",{name:/Hiểu và chạy dự án.*01/}).click();
  await graphReady(page);
  await expectView(page,position);
});

test("responsive list remains complete on mobile and desktop returns to its saved viewport", async ({page}) => {
  await page.goto("/journey/environment?step=tools");
  await graphReady(page);
  await page.getByRole("button",{name:"Phóng to flow",exact:true}).click();
  await expect.poll(async()=>(await readView(page)).zoom).toBeGreaterThan(1.1);
  const position=await readView(page);
  await page.setViewportSize({width:390,height:844});
  await expect(page.locator(".guide-ordered-steps > li")).toHaveCount(7);
  await expect(page.getByTestId("setup-graph")).toHaveCount(0);
  await page.locator(".guide-step-nav").getByRole("button",{name:"Bước 6: Chạy và kiểm tra ứng dụng",exact:true}).click();
  await expect(page.locator(".guide-detail-heading")).toBeInViewport();
  await expect(page.locator(".guide-how")).toContainText("Chưa đủ thì chỉ đọc");
  await page.getByRole("button",{name:"Về bước đang làm",exact:true}).click();
  await expect(page.locator(".guide-detail-heading")).toBeInViewport();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
  await page.setViewportSize({width:1512,height:1050});
  await graphReady(page);
  await expectView(page,position);
  await expect(page.locator('.react-flow__node[data-id="run"] button')).toHaveAttribute("aria-current","step");
  await page.getByRole("button",{name:"Xem toàn cảnh",exact:true}).click();
  await assertAllNodesFit(page);
});

test("bad saved viewport falls back to an overview and reset does not destroy the graph view", async ({page}) => {
  await page.goto("/");
  await page.evaluate(key=>sessionStorage.setItem(key,'{"x":0,"y":0,"zoom":0}'),viewportKey);
  await page.goto("/journey/environment?step=tools");
  await graphReady(page);
  await assertAllNodesFit(page);
  await page.getByRole("button",{name:"Phóng to flow",exact:true}).click();
  await expect.poll(async()=>(await readView(page)).zoom).toBeGreaterThan(1.1);
  const position=await readView(page);
  await page.getByRole("checkbox",{name:/Tôi đã kiểm tra xong/}).check();
  await page.locator(".guide-toolbar").getByRole("button",{name:"Đặt lại tiến độ",exact:true}).click();
  await page.getByRole("dialog",{name:"Đặt lại tiến độ chạy dự án?"}).getByRole("button",{name:"Đặt lại",exact:true}).click();
  await expect(page.locator(".guide-total")).toContainText("0 / 7");
  await expectView(page,position);
  await expect(page.locator(".guide-detail-heading")).toContainText("Kiểm tra source workspace");
});

test("closing and reopening graph preserves pan/zoom and follows current selection without refitting", async ({page}) => {
  await page.goto("/journey/environment?step=tools&check=tools-java");
  await graphReady(page);
  await page.getByRole("button",{name:"Phóng to flow",exact:true}).click();
  await pan(page,37,22);
  const position=await readView(page);
  await page.locator(".guide-map-toggle").click();
  await expect(page.getByTestId("setup-graph")).toHaveCount(0);
  await page.locator(".guide-step-nav").getByRole("button",{name:/Bước 5:/}).click();
  await expect(page.locator("#guide-action-build-target")).toHaveAttribute("aria-expanded","true");
  await graphReady(page);
  await expectView(page,position);
  await expect(page.locator('.react-flow__node[data-id="build"] button')).toHaveAttribute("aria-current","step");
  await page.locator(".guide-map-toggle").click();
  await page.goBack();
  await expect(page.locator("#guide-action-tools-java")).toHaveAttribute("aria-expanded","true");
  await graphReady(page);
  await expectView(page,position);
  await expect(page.locator('.react-flow__node[data-id="tools"] button')).toHaveAttribute("aria-current","step");
});
