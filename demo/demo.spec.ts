import { expect, test } from "@playwright/test";
import { narrate, pace, setupRecast, zoom } from "playwright-recast";

// Помощники библиотеки цепляются к сведениям о прогоне: без этого narrate
// не знает, куда складывать пометки для субтитров.
setupRecast(test);

// ⚠️ ПОДПИСИ ЗАДАЮТСЯ narrate(), А НЕ test.step. Библиотека собирает субтитры
// из пометок, которые оставляет narrate; названия шагов теста она не читает —
// проверено пустым файлом субтитров на первой попытке.
//
// Каждая реплика написана зрителю, который видит инструмент впервые: что
// нажать и что произойдёт. Пауза после реплики — время на прочтение.
test("agent-ui-kit in half a minute", async ({ page }) => {
  await narrate("Your app is running. Something in it looks wrong.");
  await page.goto("/");
  await expect(page.getByText("Channels")).toBeVisible();
  await pace(page, 2200);

  const row = page.getByRole("button", { name: "# design" });

  await narrate("Hold Alt. The element under the cursor lights up.");
  await zoom(row, 1.8);
  await page.keyboard.down("Alt");
  const box = (await row.boundingBox())!;
  // Курсор ведётся по многим точкам: рывок читается как склейка, а не как рука.
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2, { steps: 30 });
  await pace(page, 2400);

  await narrate("Click it. A field opens right there, over the app.");
  await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
  await page.keyboard.up("Alt");
  await pace(page, 1800);

  await narrate("Type what is wrong, in your own words.");
  await page.keyboard.type("the unread badge overlaps the channel name", { delay: 60 });
  await pace(page, 1600);

  await narrate("Press Enter. The note is written to NOTES.md.");
  await page.keyboard.press("Enter");
  await pace(page, 2400);

  await narrate("With the component chain: App > Rail > RoomList > RoomRow.");
  await pace(page, 2800);

  await narrate("Then tell your agent: work through NOTES.md.");
  await pace(page, 2800);
});
