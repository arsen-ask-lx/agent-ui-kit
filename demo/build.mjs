// Сборка ролика из снимков.
//
// ⚠️ НАЕЗД — ЭТО ВЫРЕЗКА, А НЕ УВЕЛИЧЕНИЕ. Снимок 2560×1440, выдача 1080p:
// вырезая из него кусок 1280×720, мы получаем двукратное приближение при
// растягивании всего в полтора раза — и то из PNG без потерь. Прежний ролик
// увеличивал сжатую запись экрана вчетверо, отсюда и каша.
//
// Кадры стоят неподвижно и сменяются наплывом. Движение здесь и не нужно:
// меняется само содержимое — появляется рамка, открывается поле, набирается
// текст, — а неподвижный кадр читается спокойно, чего и не хватало.
import { execFileSync } from "node:child_process";
import { readFileSync, rmSync } from "node:fs";

const SHOTS = "shots";
const OUT = "../docs";
const W = 2560;
const H = 1440;
const FADE = 0.5;

const scenes = JSON.parse(readFileSync(`${SHOTS}/scenes.json`, "utf8"));
const ff = (args) => execFileSync("ffmpeg", args, { stdio: ["ignore", "ignore", "inherit"] });

/** Прямоугольник вырезки вокруг того, о чём идёт речь. */
function frameFor(focus) {
  if (!focus) return { w: W, h: H, x: 0, y: 0 };
  // Не ближе 1100 пикселей по ширине: у мелкой цели вроде значка в меню
  // вырезка «по размеру» дала бы десятикратное увеличение, а вместе с ней
  // пропало бы и поле ввода, которое открывается рядом. При съёмке в двойной
  // плотности 1100 пикселей снимка — это 550 пикселей вёрстки, то есть
  // приближение больше чем вдвое, и поле в кадр помещается.
  const w = Math.min(W, Math.max(1100, Math.round(focus.width * 2.2)));
  const h = Math.round((w * 9) / 16);
  const cx = focus.x + focus.width / 2;
  const cy = focus.y + focus.height / 2;
  return {
    w,
    h,
    x: Math.round(Math.min(Math.max(cx - w / 2, 0), W - w)),
    y: Math.round(Math.min(Math.max(cy - h / 2, 0), H - h)),
  };
}

// Каждая сцена — отдельный отрезок: так проще и надёжнее, чем один фильтр
// на четырнадцать входов, и понятнее при разборе, если что-то съедет.
scenes.forEach((scene, i) => {
  const f = frameFor(scene.focus);
  ff([
    "-y", "-v", "error",
    "-loop", "1", "-t", String(scene.hold), "-i", `${SHOTS}/${scene.file}`,
    "-i", `${SHOTS}/cap-${scene.file}`,
    "-filter_complex",
    `[0:v]crop=${f.w}:${f.h}:${f.x}:${f.y},scale=1920:1080:flags=lanczos[bg];` +
      `[bg][1:v]overlay=0:H-h:format=auto,fps=30,format=yuv420p[v]`,
    "-map", "[v]", "-c:v", "libx264", "-preset", "slow", "-crf", "17",
    `${SHOTS}/scene-${i}.mp4`,
  ]);
});

/** Склейка наплывом: список входов, цепочка xfade, общая длительность. */
function stitch(list, file) {
  const inputs = list.flatMap((i) => ["-i", `${SHOTS}/scene-${i}.mp4`]);
  let filter = "";
  let last = "0:v";
  let offset = scenes[list[0]].hold - FADE;
  list.slice(1).forEach((sceneIndex, k) => {
    const label = `x${k}`;
    filter += `[${last}][${k + 1}:v]xfade=transition=fade:duration=${FADE}:offset=${offset.toFixed(2)}[${label}];`;
    last = label;
    offset += scenes[sceneIndex].hold - FADE;
  });
  ff([...["-y", "-v", "error"], ...inputs, "-filter_complex", filter.replace(/;$/, ""),
      "-map", `[${last}]`, "-c:v", "libx264", "-preset", "slow", "-crf", "17",
      "-pix_fmt", "yuv420p", file]);
}

stitch(scenes.map((_, i) => i), `${OUT}/demo.mp4`);

// Гифка для README — не весь ролик, а его костяк: заметка от наведения до
// записи и файл в конце. Целиком это мегабайты, которые README не оправдает.
const SHORT = [2, 3, 4, 5, 11];
stitch(SHORT, `${SHOTS}/short.mp4`);
ff(["-y", "-v", "error", "-i", `${SHOTS}/short.mp4`, "-vf",
    "fps=10,scale=760:-1:flags=lanczos,split[a][b];[a]palettegen=max_colors=128[p];" +
    "[b][p]paletteuse=dither=bayer:bayer_scale=5",
    "-loop", "0", `${OUT}/demo.gif`]);

scenes.forEach((_, i) => rmSync(`${SHOTS}/scene-${i}.mp4`, { force: true }));
rmSync(`${SHOTS}/short.mp4`, { force: true });

console.log("готово: docs/demo.mp4 и docs/demo.gif");
