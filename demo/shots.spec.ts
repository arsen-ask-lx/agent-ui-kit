import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { readFileSync } from "node:fs";
import { expect, test } from "@playwright/test";
import type { Locator, Page } from "@playwright/test";

// СЪЁМКА КАДРАМИ, А НЕ ВИДЕО, И ЭТО РЕШАЮЩЕЕ ДЛЯ РЕЗКОСТИ.
// Playwright умеет писать экран, но пишет его в VP8 с низким потоком: текст
// в кадре плывёт при любом разрешении, а наезд превращает его в кашу.
// Здесь каждый шаг — снимок PNG без потерь в 2560×1440; наезд потом делается
// вырезкой из него, то есть увеличения качества не теряет вовсе.
//
// Второй выигрыш — темп. У ролика из кадров каждый шаг держится столько,
// сколько нужно на прочтение подписи, а не столько, сколько занял клик.

const SHOTS = "shots";
const NOTES = "../NOTES.md";
/** Снимок вдвое плотнее вёрстки: координаты элементов надо перевести. */
const DPR = 2;

type Scene = {
  file: string;
  caption: string;
  /** Куда наезжать: прямоугольник в пикселях снимка. Пусто — кадр целиком. */
  focus?: { x: number; y: number; width: number; height: number };
  /** Сколько держать кадр, секунды. */
  hold: number;
};

const scenes: Scene[] = [];

test("shots for the demo", async ({ page, context }) => {
  rmSync(SHOTS, { recursive: true, force: true });
  mkdirSync(SHOTS, { recursive: true });
  rmSync(NOTES, { force: true });

  let n = 0;
  /** Снимок целиком; область наезда задаётся элементом или прямо. */
  async function shot(caption: string, hold: number, focus?: Locator | Scene["focus"]) {
    const file = `${String(++n).padStart(2, "0")}.png`;
    await page.screenshot({ path: `${SHOTS}/${file}` });
    let box: Scene["focus"] | undefined;
    if (focus && "boundingBox" in focus) {
      const found = await focus.boundingBox();
      // boundingBox отдаёт координаты вёрстки, а вырезка идёт по снимку.
      if (found) {
        box = {
          x: found.x * DPR, y: found.y * DPR,
          width: found.width * DPR, height: found.height * DPR,
        };
      }
    } else if (focus) {
      box = focus;
    }
    scenes.push({ file, caption, hold, focus: box });
  }

  /** Навести с зажатым Alt — плагин рисует рамку вокруг элемента. */
  async function pointAt(locator: Locator) {
    await locator.scrollIntoViewIfNeeded();
    const box = (await locator.boundingBox())!;
    await page.keyboard.down("Alt");
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2, { steps: 8 });
    return box;
  }

  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Overview" })).toBeVisible();
  await page.waitForTimeout(600);

  await shot("Your app, running in the browser. Dozens of elements on one screen.", 4.2);

  // ── заметка первая: зелёная дельта, которая должна быть красной ──
  const delta = page.locator(".stat-card", { hasText: "Open tickets" }).locator(".delta");
  await shot(
    "Something here is wrong: tickets are up 22%, and it is shown in green.",
    4.6,
    page.locator(".stat-card", { hasText: "Open tickets" }),
  );

  const deltaBox = await pointAt(delta);
  await page.waitForTimeout(300);
  await shot("Hold Alt. Whatever the cursor is over lights up.", 4.4, delta);

  await page.mouse.click(deltaBox.x + deltaBox.width / 2, deltaBox.y + deltaBox.height / 2);
  await page.keyboard.up("Alt");
  await page.waitForTimeout(300);
  await shot("Click it. A small field opens next to the element.", 4.2, delta);

  const text1 = "a rising ticket count is bad news — this delta must be red, not green";
  await page.keyboard.type(text1, { delay: 8 });
  await page.waitForTimeout(200);
  await shot("Say what is wrong. Plain words, the way you would say it out loud.", 5.2, delta);

  await page.keyboard.press("Enter");
  await page.waitForTimeout(500);
  await shot("Enter. The note is already written to a file on disk.", 4.0, delta);

  // ── заметка вторая: статус в таблице, другой конец экрана ──
  const pill = page.locator(".order-row", { hasText: "Edsger Dijkstra" }).locator(".pill");
  const pillBox = await pointAt(pill);
  await page.waitForTimeout(300);
  await shot("Next one, further down: a payment that failed.", 4.2, pill);

  await page.mouse.click(pillBox.x + pillBox.width / 2, pillBox.y + pillBox.height / 2);
  await page.keyboard.up("Alt");
  await page.keyboard.type("a failed payment needs a retry button right here in the row", { delay: 8 });
  await page.waitForTimeout(200);
  await shot("No screenshots. No explaining where on the screen it sits.", 4.6, pill);
  await page.keyboard.press("Enter");
  await page.waitForTimeout(400);

  // ── заметка третья: бейдж в боковом меню ──
  const badge = page.locator(".nav-item", { hasText: "Invoices" }).locator(".nav-badge");
  const badgeBox = await pointAt(badge);
  await page.waitForTimeout(300);
  await shot("And a third, on the other side of the screen.", 4.0, badge);

  await page.mouse.click(badgeBox.x + badgeBox.width / 2, badgeBox.y + badgeBox.height / 2);
  await page.keyboard.up("Alt");
  await page.keyboard.type("this badge keeps counting invoices that were already paid", { delay: 8 });
  await page.waitForTimeout(200);
  await shot("Three notes in half a minute of walking the screen.", 4.6, badge);
  await page.keyboard.press("Enter");
  await page.waitForTimeout(600);

  // ── и файл, в который всё это легло ──
  const notes = readFileSync(NOTES, "utf8").trim();
  const view = await context.newPage();
  await view.setViewportSize({ width: 1280, height: 720 });
  // Размер шрифта — как в редакторе; крупным его делает двойная плотность
  // съёмки и вырезка при сборке, а не завышенные пункты в разметке.
  await view.setContent(`
    <style>
      body { margin:0; background:#0d0d0f; color:#ececef; font:17px/1.7 ui-monospace,"Cascadia Mono",monospace; }
      .head { padding:13px 24px; border-bottom:1px solid #27272d; color:#8f8f99; font-size:15px; }
      pre { margin:0; padding:20px 26px; white-space:pre-wrap; font:inherit; }
      .k { color:#e5484d; } .b { color:#fff; font-weight:700; }
    </style>
    <div class="head">NOTES.md</div>
    <pre>${notes
      .replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[c]!)
      .replace(/^## (.+)$/gm, '<span class="b">## $1</span>')
      .replace(/\*\*(where|what|classes|id|data-testid|page|when):\*\*/g, '<span class="k">$1:</span>')}</pre>
  `);
  await view.waitForTimeout(300);

  const shotOf = async (caption: string, hold: number, focus?: Scene["focus"]) => {
    const file = `${String(++n).padStart(2, "0")}.png`;
    await view.screenshot({ path: `${SHOTS}/${file}` });
    scenes.push({ file, caption, hold, focus });
  };

  await shotOf("This is the file they landed in. Markdown, in your repository.", 5.0);
  await shotOf(
    "Each note carries the component chain — the path to the element in your code.",
    5.6,
    { x: 40, y: 150, width: 1360, height: 300 },
  );
  await shotOf(
    "Plus the tag, the classes and the page. Enough to find the line with one search.",
    5.6,
    { x: 40, y: 150, width: 1360, height: 470 },
  );
  await shotOf("Then you say to your agent: work through NOTES.md.", 4.6);

  // Подписи рисуются браузером, а не ffmpeg: так они набраны нормальным
  // шрифтом с нормальными переносами, и не нужно экранировать двоеточия и
  // проценты в фильтре. Прозрачный фон — чтобы лечь поверх кадра.
  const cap = await context.newPage();
  // ⚠️ ПОЛОВИННЫЙ РАЗМЕР ОКНА, ПОТОМУ ЧТО СЪЁМКА В ДВОЙНОЙ ПЛОТНОСТИ.
  // При окне 1920 полоса выходит снимком 3840 — вдвое шире кадра, и подпись
  // уезжает за правый край. Проверено: «Click it. A small field ope…».
  await cap.setViewportSize({ width: 960, height: 130 });
  for (const [i, scene] of scenes.entries()) {
    await cap.setContent(`
      <style>
        html, body { margin:0; background:transparent; }
        .bar {
          height:130px; display:flex; align-items:center; justify-content:center;
          padding:0 45px; box-sizing:border-box;
          background:linear-gradient(transparent, rgba(0,0,0,0.82) 34%, rgba(0,0,0,0.92));
        }
        p {
          margin:0; text-align:center; color:#fff; text-wrap:balance;
          font:600 20px/1.32 "Segoe UI", system-ui, sans-serif; letter-spacing:-0.01em;
          text-shadow:0 1px 6px rgba(0,0,0,0.9);
        }
      </style>
      <div class="bar"><p>${scene.caption.replace(/&/g, "&amp;").replace(/</g, "&lt;")}</p></div>
    `);
    await cap.screenshot({ path: `${SHOTS}/cap-${scene.file}`, omitBackground: true });
  }

  writeFileSync(`${SHOTS}/scenes.json`, JSON.stringify(scenes, null, 2));
});
