# GitHub 发布检查清单

## 当前可提交内容

- `public/`：浏览器界面
- `server.mjs`：本地服务与 Codex 调用桥接
- `desktop/`：Electron 主进程
- `schemas/`：结构化输出 schema
- `scripts/`：图标和本地打包脚本
- `test/`：冒烟、嵌入服务和端到端测试
- `package.json`、`package-lock.json`、`README.md`

## 已排除内容

- `node_modules/`
- `projects/` 和 `asset-library/`：本地项目、参考图、生成图、提示词与资产卡
- `dist/` 和 `release/`：本地启动器、`.app`、`.zip`、`.dmg`
- 日志、`.DS_Store`、测试临时输出
- `.env` 与其他本地密钥配置

## 提交前检查

```bash
npm install
npm run check
npm test
npm run test:desktop
git status --short
git add .
git diff --cached --stat
```

确认暂存区中没有个人图片、资产 JSON、安装包、API Key 或本机绝对路径后，再创建首个提交。

## 运行边界

该项目目前是本地工作台。GitHub 仓库保存源码，不能直接替代本机 Codex CLI，也不能仅靠 GitHub Pages 提供完整的图片反推服务。
