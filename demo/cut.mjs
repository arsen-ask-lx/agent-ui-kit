// Сборка ролика из следа Playwright.
//
// ⚠️ ДВА ПРОХОДА, И ЭТО ВЫНУЖДЕННО. Встроенное вшивание субтитров на Windows
// падает: путь к файлу .srt уходит в разбор фильтра ffmpeg с обратными косыми
// чертами и там разваливается («Unable to open ..docs.recast-tmpburn…»).
// Поэтому recast выдаёт видео и .srt рядом, а надписи вжигаются вторым
// вызовом — из каталога с файлом, где имя короткое и без разделителей.
// Файл субтитров называется по имени вывода: raw.mp4 → raw.srt.
import { execFileSync } from "node:child_process";
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

// Крупно, с плотной подложкой: ролик смотрят в ленте, мелкий шрифт там не
// читается, а прозрачная надпись тонет в светлых кадрах.
const style =
  "FontName=Segoe UI,FontSize=22,PrimaryColour=&H00FFFFFF,BackColour=&H99000000," +
  "BorderStyle=4,Outline=0,Shadow=0,MarginV=40,Bold=1";

ff(["-y", "-i", "raw.mp4", "-vf", `subtitles=raw.srt:force_style='${style}'`,
    "-c:v", "libx264", "-preset", "slow", "-crf", "22", "-pix_fmt", "yuv420p", "demo.mp4"]);

// Гифка для README: GitHub проигрывает её сам, без плеера и без звука.
// Палитра считается по всему ролику — иначе на градиентах идёт грязь.
// Ширина и частота кадров подобраны под вес: README с гифкой на четыре
// мегабайта грузится дольше, чем читатель готов ждать.
ff(["-y", "-i", "demo.mp4", "-vf",
    "fps=11,scale=820:-1:flags=lanczos,split[a][b];[a]palettegen=max_colors=128[p];[b][p]paletteuse=dither=bayer:bayer_scale=5",
    "-loop", "0", "demo.gif"]);

console.log("готово: docs/demo.mp4 и docs/demo.gif");
