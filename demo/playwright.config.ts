import { defineConfig } from "@playwright/test";

// Съёмка ролика, а не проверка. Отсюда и настройки: один рабочий поток,
// без повторов, с записью следа — из него recast и собирает видео.
export default defineConfig({
  testDir: ".",
  workers: 1,
  retries: 0,
  use: {
    baseURL: "http://localhost:5177",
    viewport: { width: 1280, height: 720 },
    trace: "on",
    video: "on",
  },
  // Пример поднимается сам. Если он уже запущен — берём запущенный.
  webServer: {
    command: "npm run example -- --port 5177 --strictPort",
    cwd: "..",
    url: "http://localhost:5177",
    reuseExistingServer: true,
    timeout: 120_000,
  },
});
