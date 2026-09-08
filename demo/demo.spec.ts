import { readFileSync, rmSync } from "node:fs";
import { expect, test } from "@playwright/test";
import { narrate, pace, setupRecast, zoom } from "playwright-recast";

// Помощники библиотеки цепляются к сведениям о прогоне: без этого narrate
// не знает, куда складывать пометки для субтитров.
setupRecast(test);

// ⚠️ ПОДПИСИ ЗАДАЮТСЯ narrate(), А НЕ test.step. Библиотека собирает субтитры
// из пометок narrate; названия шагов теста она не читает — проверено пустым
// файлом субтитров на первой попытке.
//
// Заметки оставляются в трёх разных углах экрана нарочно: смысл указателя
// виден только там, где элементов много и описать их словами дороже, чем
// ткнуть.

const NOTES = "../NOTES.md";

/** Одна заметка: подвести курсор с Alt, кликнуть, набрать, отправить. */
async function note(page, locator, text: string, level = 2.0) {
  // ⚠️ СНАЧАЛА ПОДВЕСТИ В ВИДИМУЮ ЧАСТЬ. boundingBox отдаёт координаты
  // относительно страницы: для элемента ниже сгиба клик уходит мимо окна и
  // попадает в <html> — заметка записывается, но про пустоту.
  await locator.scrollIntoViewIfNeeded();
  await pace(page, 400);
  await zoom(locator, level);
  await page.keyboard.down("Alt");
  const box = (await locator.boundingBox())!;
  // Курсор ведётся по многим точкам: рывок читается как склейка, а не как рука.
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2, { steps: 26 });
  await pace(page, 1100);
  await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
  await page.keyboard.up("Alt");
  await pace(page, 700);
  await page.keyboard.type(text, { delay: 42 });
  await pace(page, 900);
  await page.keyboard.press("Enter");
  await pace(page, 1000);
}

test("agent-ui-kit in half a minute", async ({ page }) => {
  // Файл начинается пустым, иначе в конце показывается чужая история.
  rmSync(NOTES, { force: true });

  await narrate("A real screen. Dozens of elements, and three of them are wrong.");
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Overview" })).toBeVisible();
  await pace(page, 2400);

  await narrate("Hold Alt and point. The element under the cursor lights up.");
  await note(
    page,
    page.locator(".stat-card", { hasText: "Open tickets" }).locator(".delta"),
    "a rising ticket count is bad news — this delta must be red, not green",
  );

  await narrate("Point at the next one. No screenshots, no explaining where it is.");
  await note(
    page,
    page.locator(".order-row", { hasText: "Edsger Dijkstra" }).locator(".pill"),
    "a failed payment needs a retry button right here in the row",
    2.2,
  );

  await narrate("And a third, on the other side of the screen.");
  await note(
    page,
    page.locator(".nav-item", { hasText: "Invoices" }).locator(".nav-badge"),
    "this badge keeps counting invoices that were already paid",
    2.4,
  );

  await narrate("Three notes in twenty seconds. This is the file they landed in.");
  // Показ настоящего файла: он читается с диска сразу после прогона, а не
  // рисуется. Ролик не может показать то, чего плагин не записал.
  const notes = readFileSync(NOTES, "utf8").trim();
  await page.setContent(`
    <style>
      body { margin:0; background:#0d0d0f; color:#ececef; font:15px/1.6 ui-monospace,"Cascadia Mono",monospace; }
      .head { padding:12px 20px; border-bottom:1px solid #27272d; color:#8f8f99; font-size:13px; }
      pre { margin:0; padding:18px 22px; white-space:pre-wrap; font:inherit; }
      .k { color:#e5484d; } .b { color:#fff; font-weight:700; }
    </style>
    <div class="head">NOTES.md</div>
    <pre>${notes
      .replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[c]!)
      .replace(/^## (.+)$/gm, '<span class="b">## $1</span>')
      .replace(/\*\*(where|what|classes|id|data-testid|page|when):\*\*/g, '<span class="k">$1:</span>')}</pre>
  `);
  await pace(page, 3000);

  await narrate("The component chain and the classes — enough to find the line.");
  await pace(page, 3200);

  await narrate("Now tell your agent: work through NOTES.md.");
  await pace(page, 3000);
});
