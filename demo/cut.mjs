// Сборка ролика из следа Playwright.
//
// ⚠️ ДВА ПРОХОДА, И ЭТО ВЫНУЖДЕННО. Встроенное вшивание субтитров на Windows
// падает: путь к файлу .srt уходит в разбор фильтра ffmpeg с обратными косыми
// чертами и там разваливается («Unable to open ..docs.recast-tmpburn…»).
// Поэтому recast выдаёт видео и .srt рядом, а надписи вжигаются вторым
// вызовом — из каталога с файлом, где имя короткое и без разделителей.
// Файл субтитров называется по имени вывода: raw.mp4 → raw.srt.
import { execFileSync } from "node:child_process";
import { rmSync, writeFileSync } from "node:fs";
import { Recast } from "playwright-recast";

const trace = "./test-results/demo-agent-ui-kit-in-half-a-minute/trace.zip";
const out = "../docs";

await Recast.from(trace)
  .parse()
  // Подписи собираются из narrate() в сценарии; наезд опирается на их
  // разметку времени, поэтому идёт после них.
  .subtitlesFromTrace()
  .autoZoom({ inputLevel: 1.7, clickLevel: 1.5 })
  .cursorOverlay()
  .clickEffect()
  .render({ format: "mp4", resolution: "1080p", burnSubtitles: false })
  .toFile(`${out}/raw.mp4`);

const ff = (args) => execFileSync("ffmpeg", args, { cwd: out, stdio: "inherit" });
const io_list = (name, text) => writeFileSync(`${out}/${name}`, text);

// Крупно, с плотной подложкой: ролик смотрят в ленте, мелкий шрифт там не
// читается, а прозрачная надпись тонет в светлых кадрах.
const style =
  "FontName=Segoe UI,FontSize=22,PrimaryColour=&H00FFFFFF,BackColour=&H99000000," +
  "BorderStyle=4,Outline=0,Shadow=0,MarginV=40,Bold=1";

ff(["-y", "-i", "raw.mp4", "-vf", `subtitles=raw.srt:force_style='${style}'`,
    "-c:v", "libx264", "-preset", "slow", "-crf", "22", "-pix_fmt", "yuv420p", "demo.mp4"]);

// Гифка для README — не весь ролик, а два куска: первая заметка и файл,
// в который она легла. Целиком это девять мегабайт: столько README грузится
// дольше, чем читатель готов ждать, а третья заметка ничего не добавляет к
// уже понятому жесту.
const CUTS = [["1.9", "8.6"], ["26.6", "7.4"]];
CUTS.forEach(([from, len], i) =>
  ff(["-y", "-v", "error", "-ss", from, "-t", len, "-i", "demo.mp4",
      "-an", "-c:v", "libx264", "-preset", "fast", "-crf", "20", `piece${i}.mp4`]),
);
io_list("pieces.txt", CUTS.map((_, i) => `file 'piece${i}.mp4'`).join(String.fromCharCode(10)));
ff(["-y", "-v", "error", "-f", "concat", "-safe", "0", "-i", "pieces.txt", "-c", "copy", "cut.mp4"]);

// Палитра считается по всему куску — иначе на градиентах идёт грязь.
// Ширина и частота кадров подобраны под вес.
ff(["-y", "-v", "error", "-i", "cut.mp4", "-vf",
    "fps=10,scale=720:-1:flags=lanczos,split[a][b];[a]palettegen=max_colors=96[p];[b][p]paletteuse=dither=bayer:bayer_scale=5",
    "-loop", "0", "demo.gif"]);

CUTS.forEach((_, i) => rmSync(`${out}/piece${i}.mp4`, { force: true }));
rmSync(`${out}/pieces.txt`, { force: true });
rmSync(`${out}/cut.mp4`, { force: true });

console.log("готово: docs/demo.mp4 и docs/demo.gif");
