import { cp, mkdtemp, rm, symlink } from "node:fs/promises";
import { execFile } from "node:child_process";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import packageJson from "../package.json" with { type: "json" };
import { promisify } from "node:util";

const run = promisify(execFile);
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const APP_NAME = "参考图反推工作台";
const APP_PATH = path.join(ROOT, "release", "mac-arm64", `${APP_NAME}.app`);
const OUTPUT = path.join(ROOT, "release", `${APP_NAME}-${packageJson.version}-arm64.dmg`);

if (process.platform !== "darwin") {
  throw new Error("DMG 封装只能在 macOS 上运行。");
}

const staging = await mkdtemp(path.join(os.tmpdir(), "reference-prompt-workbench-dmg-"));
try {
  await cp(APP_PATH, path.join(staging, path.basename(APP_PATH)), { recursive: true });
  await symlink("/Applications", path.join(staging, "Applications"));
  await run("hdiutil", ["create", "-volname", APP_NAME, "-srcfolder", staging, "-ov", "-format", "UDZO", OUTPUT]);
  console.log(`已生成 macOS DMG：${OUTPUT}`);
} finally {
  await rm(staging, { recursive: true, force: true });
}
