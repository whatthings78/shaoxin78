import { execFile } from "node:child_process";
import { mkdir, rm } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";

const run = promisify(execFile);
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const BUILD = path.join(ROOT, "build");
const SOURCE = path.join(BUILD, "icon.svg");
const ICONSET = path.join(BUILD, "icon.iconset");
const RENDER_DIR = path.join(BUILD, "icon-render");
const OUTPUT = path.join(BUILD, "icon.icns");
const variants = [
  [16, "icon_16x16.png"],
  [32, "icon_16x16@2x.png"],
  [32, "icon_32x32.png"],
  [64, "icon_32x32@2x.png"],
  [128, "icon_128x128.png"],
  [256, "icon_128x128@2x.png"],
  [256, "icon_256x256.png"],
  [512, "icon_256x256@2x.png"],
  [512, "icon_512x512.png"],
  [1024, "icon_512x512@2x.png"],
];

await mkdir(BUILD, { recursive: true });
await rm(ICONSET, { recursive: true, force: true });
await rm(RENDER_DIR, { recursive: true, force: true });
await mkdir(ICONSET, { recursive: true });
await mkdir(RENDER_DIR, { recursive: true });
await run("qlmanage", ["-t", "-s", "1024", "-o", RENDER_DIR, SOURCE]);
const renderedPng = path.join(RENDER_DIR, "icon.svg.png");
for (const [size, name] of variants) {
  await run("sips", ["-s", "format", "png", "-z", String(size), String(size), renderedPng, "--out", path.join(ICONSET, name)]);
}
await run("iconutil", ["-c", "icns", ICONSET, "-o", OUTPUT]);
await rm(ICONSET, { recursive: true, force: true });
await rm(RENDER_DIR, { recursive: true, force: true });
console.log(`已生成应用图标：${OUTPUT}`);
