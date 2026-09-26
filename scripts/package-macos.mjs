import { cp, chmod, mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import packageJson from "../package.json" with { type: "json" };

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DIST = path.join(ROOT, "dist");
const APP_NAME = "参考图反推工作台-浏览器启动器";
const DATA_NAME = "参考图反推工作台";
const BROWSER_LAUNCHER_NAME = "参考图反推工作台-浏览器版.command";
const APP_ROOT = path.join(DIST, `${APP_NAME}.app`);
const CONTENTS = path.join(APP_ROOT, "Contents");
const RESOURCES = path.join(CONTENTS, "Resources");
const BUNDLE_ROOT = path.join(RESOURCES, "workbench");
const MACOS = path.join(CONTENTS, "MacOS");
const NODE_BIN = process.execPath;

if (process.platform !== "darwin") {
  throw new Error("macOS 封装只能在 macOS 上运行。");
}

const copyIfPresent = async (source, target) => {
  try {
    await cp(source, target, { recursive: true });
  } catch (error) {
    if (error?.code !== "ENOENT") throw error;
  }
};

await mkdir(DIST, { recursive: true });
await rm(APP_ROOT, { recursive: true, force: true });
await mkdir(MACOS, { recursive: true });
await mkdir(RESOURCES, { recursive: true });
await mkdir(BUNDLE_ROOT, { recursive: true });

await Promise.all([
  copyIfPresent(path.join(ROOT, "public"), path.join(BUNDLE_ROOT, "public")),
  copyIfPresent(path.join(ROOT, "schemas"), path.join(BUNDLE_ROOT, "schemas")),
  copyIfPresent(path.join(ROOT, "projects"), path.join(BUNDLE_ROOT, "projects")),
  copyIfPresent(path.join(ROOT, "asset-library"), path.join(BUNDLE_ROOT, "asset-library")),
  copyIfPresent(path.join(ROOT, "server.mjs"), path.join(BUNDLE_ROOT, "server.mjs")),
  copyIfPresent(path.join(ROOT, "package.json"), path.join(BUNDLE_ROOT, "package.json")),
]);

const infoPlist = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>CFBundleDisplayName</key>
  <string>${APP_NAME}</string>
  <key>CFBundleExecutable</key>
  <string>${APP_NAME}</string>
  <key>CFBundleIdentifier</key>
  <string>local.reference-prompt-workbench</string>
  <key>CFBundleName</key>
  <string>${APP_NAME}</string>
  <key>CFBundlePackageType</key>
  <string>APPL</string>
  <key>CFBundleShortVersionString</key>
  <string>${packageJson.version}</string>
  <key>CFBundleVersion</key>
  <string>${packageJson.version}</string>
  <key>LSMinimumSystemVersion</key>
  <string>12.0</string>
</dict>
</plist>
`;
await writeFile(path.join(CONTENTS, "Info.plist"), infoPlist, "utf8");

const launcher = `#!/bin/zsh
set -u

APP_CONTENTS="$(cd "$(dirname "$0")/.." && pwd)"
WORKBENCH_ROOT="$APP_CONTENTS/Resources/workbench"
DATA_ROOT="\${WORKBENCH_DATA_ROOT:-\$HOME/Library/Application Support/${DATA_NAME}}"
PORT_VALUE="\${PORT:-4317}"
BASE_URL="http://127.0.0.1:\$PORT_VALUE"
URL="\$BASE_URL/"
NODE_BIN="${NODE_BIN}"
if [ ! -x "\$NODE_BIN" ]; then
  NODE_BIN="\$(command -v node || true)"
fi
if [ -z "\$NODE_BIN" ] || [ ! -x "\$NODE_BIN" ]; then
  /usr/bin/osascript -e 'display dialog "找不到 Node.js。请先安装 Node.js，再启动工作台。" with title "工作台" buttons {"好"} default button "好"' >/dev/null 2>&1 || true
  exit 1
fi

mkdir -p "\$DATA_ROOT/projects" "\$DATA_ROOT/asset-library"
if [ ! -f "\$DATA_ROOT/.seeded-v0.8" ]; then
  if [ -d "\$WORKBENCH_ROOT/projects" ]; then
    cp -R "\$WORKBENCH_ROOT/projects/." "\$DATA_ROOT/projects/" 2>/dev/null || true
  fi
  if [ -d "\$WORKBENCH_ROOT/asset-library" ]; then
    cp -R "\$WORKBENCH_ROOT/asset-library/." "\$DATA_ROOT/asset-library/" 2>/dev/null || true
  fi
  touch "\$DATA_ROOT/.seeded-v0.8"
fi

if ! /usr/bin/curl -fsS --max-time 1 "\$BASE_URL/api/health" >/dev/null 2>&1; then
  PROJECTS_ROOT="\$DATA_ROOT/projects" \\
  ASSET_LIBRARY_ROOT="\$DATA_ROOT/asset-library" \\
  PORT="\$PORT_VALUE" \\
  nohup "\$NODE_BIN" "\$WORKBENCH_ROOT/server.mjs" >"\$DATA_ROOT/server.log" 2>&1 &
fi

READY=0
for attempt in {1..40}; do
  if /usr/bin/curl -fsS --max-time 1 "\$BASE_URL/api/health" >/dev/null 2>&1; then
    READY=1
    break
  fi
  /bin/sleep 0.15
done

if [ "\$READY" -ne 1 ]; then
  /usr/bin/osascript -e 'display dialog "参考图反推工作台启动失败，请查看 ~/Library/Application Support/参考图反推工作台/server.log" with title "工作台" buttons {"好"} default button "好"' >/dev/null 2>&1 || true
  exit 1
fi

if [ "\${WORKBENCH_NO_OPEN:-0}" = "1" ]; then
  exit 0
fi

if ! /usr/bin/open "\$URL"; then
  /usr/bin/osascript -e 'display dialog "工作台服务已启动，但系统无法打开浏览器。请手动打开 http://127.0.0.1:4317/" with title "工作台" buttons {"好"} default button "好"' >/dev/null 2>&1 || true
  exit 1
fi
`;
const launcherPath = path.join(MACOS, APP_NAME);
await writeFile(launcherPath, launcher, "utf8");
await chmod(launcherPath, 0o755);

const browserLauncher = `#!/bin/zsh
set -u
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
URL="http://127.0.0.1:4317/"
BASE_URL="http://127.0.0.1:4317"
NODE_BIN="${NODE_BIN}"
if [ ! -x "\$NODE_BIN" ]; then
  NODE_BIN="\$(command -v node || true)"
fi
if [ -z "\$NODE_BIN" ] || [ ! -x "\$NODE_BIN" ]; then
  /usr/bin/osascript -e 'display dialog "找不到 Node.js。请先安装 Node.js，再启动工作台。" with title "工作台" buttons {"好"} default button "好"' >/dev/null 2>&1 || true
  exit 1
fi
if ! /usr/bin/curl -fsS --max-time 1 "$BASE_URL/api/health" >/dev/null 2>&1; then
  nohup "\$NODE_BIN" "$ROOT/server.mjs" >"$ROOT/.workbench-server.log" 2>&1 &
fi
for attempt in {1..40}; do
  if /usr/bin/curl -fsS --max-time 1 "$BASE_URL/api/health" >/dev/null 2>&1; then
    if [ "\${WORKBENCH_NO_OPEN:-0}" = "1" ]; then
      exit 0
    fi
    /usr/bin/open "$URL"
    exit 0
  fi
  /bin/sleep 0.15
done
/usr/bin/osascript -e 'display dialog "浏览器版服务启动失败，请查看项目目录下的 .workbench-server.log" with title "工作台" buttons {"好"} default button "好"' >/dev/null 2>&1 || true
exit 1
`;
const browserLauncherPath = path.join(DIST, BROWSER_LAUNCHER_NAME);
await writeFile(browserLauncherPath, browserLauncher, "utf8");
await chmod(browserLauncherPath, 0o755);

const readme = `参考图反推工作台 V0.9 双版本启动

1. 桌面应用
双击「${APP_NAME}.app」可启动浏览器版壳。真正的独立 Electron 桌面版位于 release/。

2. 浏览器版
双击「${BROWSER_LAUNCHER_NAME}」，或在项目目录执行 npm start，然后打开 http://127.0.0.1:4317/。

两个版本使用独立数据目录，不会互相覆盖。浏览器版仍使用项目目录下的 projects 与 asset-library；桌面版使用用户级数据目录。
`;
await writeFile(path.join(DIST, "README-双版本启动.txt"), readme, "utf8");

console.log(`已生成 macOS 桌面应用：${APP_ROOT}`);
console.log(`已生成浏览器版启动器：${browserLauncherPath}`);
