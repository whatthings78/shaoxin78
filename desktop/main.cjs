const { app, BrowserWindow, Menu, dialog, shell } = require("electron/main");
const { mkdir } = require("node:fs/promises");
const path = require("node:path");
const { pathToFileURL } = require("node:url");

let mainWindow;
let workbenchServer;
let workbenchUrl;
const isDesktopSmokeTest = process.env.WORKBENCH_DESKTOP_SMOKE === "1";

app.setPath("userData", path.join(app.getPath("appData"), "参考图反推工作台"));

function createMenu() {
  const template = [
    {
      label: "工作台",
      submenu: [
        { role: "about", label: "关于参考图反推工作台" },
        { type: "separator" },
        { role: "services", label: "服务" },
        { type: "separator" },
        { role: "hide", label: "隐藏" },
        { role: "hideOthers", label: "隐藏其他" },
        { role: "unhide", label: "显示全部" },
        { type: "separator" },
        { role: "quit", label: "退出参考图反推工作台" },
      ],
    },
    {
      label: "编辑",
      submenu: [
        { role: "undo", label: "撤销" },
        { role: "redo", label: "重做" },
        { type: "separator" },
        { role: "cut", label: "剪切" },
        { role: "copy", label: "复制" },
        { role: "paste", label: "粘贴" },
        { role: "selectAll", label: "全选" },
      ],
    },
    {
      label: "视图",
      submenu: [
        { role: "reload", label: "重新载入" },
        { role: "forceReload", label: "强制重新载入" },
        { type: "separator" },
        { role: "resetZoom", label: "实际大小" },
        { role: "zoomIn", label: "放大" },
        { role: "zoomOut", label: "缩小" },
        { type: "separator" },
        { role: "togglefullscreen", label: "切换全屏" },
      ],
    },
    {
      label: "窗口",
      submenu: [{ role: "minimize", label: "最小化" }, { role: "zoom", label: "缩放" }],
    },
  ];
  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

async function startWorkbenchServer() {
  const dataRoot = path.join(app.getPath("userData"), "data");
  await Promise.all([
    mkdir(path.join(dataRoot, "projects"), { recursive: true }),
    mkdir(path.join(dataRoot, "asset-library"), { recursive: true }),
  ]);
  process.env.PROJECTS_ROOT = path.join(dataRoot, "projects");
  process.env.ASSET_LIBRARY_ROOT = path.join(dataRoot, "asset-library");
  process.env.WORKBENCH_CWD = dataRoot;
  process.env.WORKBENCH_EMBEDDED = "1";

  const applicationRoot = path.resolve(__dirname, "..");
  const serverModule = await import(pathToFileURL(path.join(applicationRoot, "server.mjs")).href);
  workbenchServer = serverModule.server;
  const address = await serverModule.startServer({ port: 0 });
  const port = typeof address === "object" && address ? address.port : 4317;
  workbenchUrl = `http://127.0.0.1:${port}/`;
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1540,
    height: 980,
    minWidth: 1120,
    minHeight: 720,
    show: false,
    backgroundColor: "#0a1117",
    title: "参考图反推工作台",
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  mainWindow.once("ready-to-show", () => {
    if (!isDesktopSmokeTest) mainWindow.show();
  });
  mainWindow.webContents.once("did-finish-load", () => {
    if (isDesktopSmokeTest) {
      console.log("desktop window smoke passed");
      app.quit();
    }
  });
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (!url.startsWith(workbenchUrl)) shell.openExternal(url);
    return { action: "deny" };
  });
  mainWindow.webContents.on("will-navigate", (event, url) => {
    if (!url.startsWith(workbenchUrl)) {
      event.preventDefault();
      shell.openExternal(url);
    }
  });
  mainWindow.webContents.on("did-fail-load", (_event, errorCode, errorDescription) => {
    if (errorCode !== -3) {
      dialog.showErrorBox("工作台页面无法载入", `${errorDescription}\n\n请重新打开应用。`);
    }
  });
  mainWindow.on("closed", () => {
    mainWindow = undefined;
  });
  mainWindow.loadURL(workbenchUrl);
}

app.whenReady()
  .then(async () => {
    createMenu();
    await startWorkbenchServer();
    createWindow();
    app.on("activate", () => {
      if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
  })
  .catch((error) => {
    dialog.showErrorBox("工作台启动失败", error instanceof Error ? error.message : String(error));
    app.quit();
  });

app.on("window-all-closed", () => app.quit());
app.on("before-quit", () => {
  if (workbenchServer?.listening) workbenchServer.close();
});
