import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { chmod, mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const PORT = 43917;
const fakeCodexPath = path.join(ROOT, "test", "fake-codex.mjs");
const promptCapturePath = path.join(tmpdir(), `frame-dna-smoke-${process.pid}.txt`);
const argsCapturePath = path.join(tmpdir(), `frame-dna-smoke-args-${process.pid}.json`);
const projectsRoot = await mkdtemp(path.join(tmpdir(), "frame-dna-projects-"));
const assetsRoot = await mkdtemp(path.join(tmpdir(), "frame-dna-assets-"));
const TEST_IMAGE = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=";

function assertSafeMidjourneyParameters(parameters) {
  assert.equal(parameters, "--ar 16:9 --s 150 --c 8 --no logo, watermark");
  assert.doesNotMatch(parameters, /--(?:sref|sw|oref|ow|cref|cw|iw)\b/i);
}

function assertBilingualPrompts(prompts) {
  assert.ok(prompts.midjourney.promptChinese.length > 10);
  assert.ok(prompts.midjourney.promptEnglish.length > 10);
  assert.ok(prompts.gptImage2.promptChinese.length > 10);
  assert.ok(prompts.gptImage2.promptEnglish.length > 10);
}

await chmod(fakeCodexPath, 0o755);
const child = spawn(process.execPath, ["server.mjs"], {
  cwd: ROOT,
  env: {
    ...process.env,
    PORT: String(PORT),
    CODEX_BIN: fakeCodexPath,
    FAKE_CODEX_CAPTURE: promptCapturePath,
    FAKE_CODEX_ARGS_CAPTURE: argsCapturePath,
    PROJECTS_ROOT: projectsRoot,
    ASSET_LIBRARY_ROOT: assetsRoot,
    WORKBENCH_CWD: projectsRoot,
  },
  stdio: ["ignore", "pipe", "pipe"],
});

async function waitForServer() {
  for (let attempt = 0; attempt < 50; attempt += 1) {
    try {
      const response = await fetch(`http://127.0.0.1:${PORT}/api/health`);
      if (response.ok) return;
    } catch {
      // Server is still starting.
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error("Server did not start in time");
}

try {
  await waitForServer();
  const healthResponse = await fetch(`http://127.0.0.1:${PORT}/api/health`);
  const health = await healthResponse.json();
  assert.equal(health.ok, true);
  assert.equal(health.version, "0.9.0");

  const pageResponse = await fetch(`http://127.0.0.1:${PORT}/`);
  const page = await pageResponse.text();
  assert.equal(pageResponse.status, 200);
  const ids = [...page.matchAll(/\sid="([^"]+)"/g)].map((match) => match[1]);
  const duplicateIds = [...new Set(ids.filter((id, index) => ids.indexOf(id) !== index))];
  assert.deepEqual(duplicateIds, [], `页面不能包含重复 ID：${duplicateIds.join("、")}`);
  assert.match(page, /参考图反推工作台/);
  assert.match(page, /id="ui-runtime-error"/);
  assert.match(page, /id="theme-switcher"/);
  assert.match(page, /data-theme-option="dark"/);
  assert.match(page, /data-theme-option="light"/);
  assert.match(page, /data-theme-option="color"/);
  assert.match(page, /id="workspace-nav"/);
  assert.match(page, /data-workspace="home"/);
  assert.match(page, /data-workspace="image"/);
  assert.match(page, /data-workspace="covers"/);
  assert.match(page, /data-workspace="product"/);
  assert.match(page, /data-workspace="video"/);
  assert.match(page, /data-workspace="assets"/);
  assert.match(page, /id="workspace-home"/);
  assert.match(page, /id="workspace-image"/);
  assert.match(page, /id="workspace-covers"/);
  assert.match(page, /id="home-recent-assets"/);
  assert.match(page, /id="cover-preset-grid"/);
  assert.match(page, /id="cover-preview"/);
  assert.match(page, /1080 × 1440/);
  assert.match(page, /1280 × 720/);
  assert.match(page, /1080 × 1920/);
  assert.match(page, /id="inspector-workspace-title"/);
  assert.match(page, /全部可选。不填写时，只反推参考图本身/);
  assert.match(page, /纯反推模式/);
  assert.match(page, /横构图/);
  assert.match(page, /竖构图/);
  assert.match(page, /composition-image/);
  assert.match(page, /anchor-precision-note/);
  assert.match(page, /视觉资产库/);
  assert.match(page, /ASSET GALLERY/);
  assert.match(page, /已存效果图/);
  assert.match(page, /standalone-asset-library/);
  assert.match(page, /提示词美学卡/);
  assert.match(page, /prompt-study-file/);
  assert.match(page, /analyze-prompt-study/);
  assert.match(page, /save-prompt-study-asset/);
  assert.match(page, /save-primary-asset/);
  assert.match(page, /copy-midjourney-command/);
  assert.match(page, /先放图，再复制/);
  assert.match(page, /analysis-feedback/);
  assert.match(page, /loading-elapsed/);
  assert.match(page, /empty-upload-action/);
  assert.match(page, /prompt-language-switch/);
  assert.match(page, /complete-prompt-languages/);
  assert.match(page, /analysis-mode/);
  assert.match(page, /快速结果/);
  assert.match(page, /分层分析/);
  assert.match(page, /HORIZONTAL OUTPAINT/);
  assert.match(page, /16:9 左右扩展/);
  assert.match(page, /锁定主体／产品/);
  assert.match(page, /DeepSeek V4 Pro/);
  assert.match(page, /deepseek\/deepseek-v4-flash/);
  assert.match(page, /产品提示词工坊/);
  assert.match(page, /product-prompt-product-file/);
  assert.match(page, /product-prompt-reference-file/);
  assert.match(page, /场景续写/);
  assert.match(page, /视频拉片工作台/);
  assert.match(page, /id="video-file"/);
  assert.match(page, /id="sample-video-frames"/);
  assert.match(page, /id="video-clip-start"/);
  assert.match(page, /id="video-clip-end"/);
  assert.match(page, /id="set-video-clip-start"/);
  assert.match(page, /id="set-video-clip-end"/);
  assert.match(page, /ANALYSIS WINDOW/);
  assert.match(page, /id="analyze-video"/);
  assert.match(page, /id="video-analysis-progress"/);
  assert.match(page, /id="video-progress-track"/);
  assert.match(page, /模型分析阶段没有实时百分比接口/);
  assert.match(page, /copy-video-storyboard/);
  assert.match(page, /clear-video-report/);
  assert.doesNotMatch(page, /id="crop-reset"/);
  assert.doesNotMatch(page, /目标大全景 <b>必填<\/b>/);

  const appResponse = await fetch(`http://127.0.0.1:${PORT}/app.js`);
  const appSource = await appResponse.text();
  assert.equal(appResponse.status, 200);
  assert.doesNotMatch(appSource, /"复原"/);
  assert.match(appSource, /startCompositionPan/);
  assert.match(appSource, /compositionPreviewLandscape/);
  assert.match(appSource, /movingCrop/);
  assert.match(appSource, /startAnchorResize/);
  assert.match(appSource, /saveCurrentAsAsset/);
  assert.match(appSource, /asset-card-visual/);
  assert.match(appSource, /asset-reuse-button/);
  assert.match(appSource, /asset\.image\?\.url \|\| asset\.shareCard\?\.url/);
  assert.match(appSource, /createAssetShareCard/);
  assert.match(appSource, /buildMidjourneyCommand/);
  assert.match(appSource, /buildProductPromptPayload/);
  assert.match(appSource, /api\/product-prompt/);
  assert.match(appSource, /safeMidjourneyParameters/);
  assert.match(appSource, /resetAnalysisForNewPrimary/);
  assert.match(appSource, /clearRenderedAnalysisFields/);
  assert.match(appSource, /emptyUploadAction/);
  assert.match(appSource, /verifyAnalysisService/);
  assert.match(appSource, /REQUEST_TIMEOUT_MS/);
  assert.match(appSource, /completePromptLanguages/);
  assert.match(appSource, /promptLanguages/);
  assert.match(appSource, /setAspectRatio/);
  assert.match(appSource, /outpaintPreset/);
  assert.match(appSource, /captureVideoFrameAt/);
  assert.match(appSource, /useVideoFrameAsPrimary/);
  assert.match(appSource, /videoStoryboardMarkdown/);
  assert.match(appSource, /MAX_VIDEO_FRAMES/);
  assert.match(appSource, /getVideoClipRange/);
  assert.match(appSource, /setVideoClipValue/);
  assert.match(appSource, /startVideoProgress/);
  assert.match(appSource, /pollVideoAnalysisHealth/);
  assert.match(appSource, /failVideoProgress/);
  assert.match(appSource, /buildQuickAnalysisPrompt|analysisMode/);
  assert.match(appSource, /REQUIRED_UI_IDS/);
  assert.match(appSource, /assertRequiredUi/);
  assert.match(appSource, /showUiRuntimeError/);
  assert.match(appSource, /dataset\.appReady/);
  assert.match(appSource, /window\.location\.protocol === "file:"/);
  assert.match(appSource, /WORKSPACE_META/);
  assert.match(appSource, /setActiveWorkspace/);
  assert.match(appSource, /renderAppShell/);
  assert.match(appSource, /renderHomeRecentAssets/);
  assert.match(appSource, /COVER_PRESETS/);
  assert.match(appSource, /exportCover/);
  assert.match(appSource, /buildCoverPrompt/);
  assert.match(appSource, /activeWorkspace/);
  assert.match(appSource, /THEME_STORAGE_KEY/);
  assert.match(appSource, /function applyTheme/);
  assert.match(appSource, /function restoreTheme/);

  const serverSource = await readFile(path.join(ROOT, "server.mjs"), "utf8");
  assert.match(serverSource, /function startServer/);
  assert.match(serverSource, /WORKBENCH_EMBEDDED/);
  assert.match(serverSource, /CODEX_CWD/);
  assert.match(serverSource, /spawn\\s\+ENOTDIR/);

  const analyzeResponse = await fetch(`http://127.0.0.1:${PORT}/api/analyze`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      primaryImage: TEST_IMAGE,
      scopes: ["style"],
      inheritText: "",
      targetScene: "",
      excludeText: "",
      aspectRatio: "16:9",
      model: "gpt-5.6-terra",
      region: null,
    }),
  });
  assert.equal(analyzeResponse.status, 200);
  const analyzeResult = await analyzeResponse.json();
  assertSafeMidjourneyParameters(analyzeResult.platformPrompts.midjourney.parameters);
  assertBilingualPrompts(analyzeResult.platformPrompts);
  assert.match(analyzeResult.platformPrompts.midjourney.referenceUsage, /Image Prompt/);
  const prompt = await readFile(promptCapturePath, "utf8");
  const codexArgs = JSON.parse(await readFile(argsCapturePath, "utf8"));
  assert.match(prompt, /纯反推模式：忠实描述参考图本身/);
  assert.match(prompt, /无（保持参考图原有场景，不扩写）/);
  assert.doesNotMatch(prompt, /基于参考视觉语言扩写为完整大全景/);
  assert.deepEqual(codexArgs.slice(0, 4), ["--ask-for-approval", "never", "--model", "gpt-5.6-terra"]);

  const quickAnalyzeResponse = await fetch(`http://127.0.0.1:${PORT}/api/analyze`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      primaryImage: TEST_IMAGE,
      scopes: ["style", "composition"],
      inheritText: "",
      targetScene: "",
      excludeText: "",
      aspectRatio: "16:9",
      analysisMode: "quick",
      model: "gpt-5.6-luna",
      region: null,
    }),
  });
  assert.equal(quickAnalyzeResponse.status, 200);
  const quickResult = await quickAnalyzeResponse.json();
  assert.equal(quickResult.analysisMode, "quick");
  assert.deepEqual(quickResult.layers, []);
  assert.equal(quickResult.referencePlan, null);
  assertBilingualPrompts(quickResult.platformPrompts);
  const quickArgs = JSON.parse(await readFile(argsCapturePath, "utf8"));
  assert.equal(quickArgs[quickArgs.indexOf("-c") + 1], 'model_reasoning_effort="low"');
  assert.match(await readFile(promptCapturePath, "utf8"), /快速提示词引擎/);

  const outpaintAnalyzeResponse = await fetch(`http://127.0.0.1:${PORT}/api/analyze`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      primaryImage: TEST_IMAGE,
      scopes: ["style", "space", "composition", "subject"],
      inheritText: "无",
      targetScene: "将竖屏参考图进行 16:9 横构图左右扩展：完整保留原图主体的身份、形态、姿势、比例、位置与内容关系；不裁切、不拉伸、不缩放主体，只向左、右两端自然补全原场景。",
      excludeText: "不要新增人物或无关物体。",
      aspectRatio: "16:9",
      model: "gpt-5.6-terra",
      region: null,
    }),
  });
  assert.equal(outpaintAnalyzeResponse.status, 200);
  assert.match(await readFile(promptCapturePath, "utf8"), /横向扩图模式/);
  assert.match(await readFile(promptCapturePath, "utf8"), /左右两端补/);
  assert.match(await readFile(promptCapturePath, "utf8"), /不得把竖图放大后裁切/);

  const productPromptResponse = await fetch(`http://127.0.0.1:${PORT}/api/product-prompt`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      productImage: TEST_IMAGE,
      referenceImage: TEST_IMAGE,
      idea: "把产品放在雨夜的黑色石台上，右侧留出标题空间。",
      productNotes: "银灰色金属外壳，比例和轮廓不变。",
      task: "continue",
      depth: "detailed",
      referenceRole: "both",
      aspectRatio: "16:9",
      model: "gpt-5.6-terra",
    }),
  });
  assert.equal(productPromptResponse.status, 200);
  const productPromptResult = await productPromptResponse.json();
  assert.ok(productPromptResult.productIdentity.length > 10);
  assert.ok(productPromptResult.sceneDirection.length > 10);
  assertBilingualPrompts(productPromptResult.platformPrompts);
  assertSafeMidjourneyParameters(productPromptResult.platformPrompts.midjourney.parameters);
  assert.match(productPromptResult.platformPrompts.midjourney.referenceUsage, /图片1/);
  assert.match(productPromptResult.platformPrompts.gptImage2.imageRoles, /产品参考/);
  assert.match(await readFile(promptCapturePath, "utf8"), /产品提示词工坊/);
  const productArgs = JSON.parse(await readFile(argsCapturePath, "utf8"));
  assert.equal(productArgs.filter((argument) => argument === "--image").length, 2);

  const ideaOnlyProductResponse = await fetch(`http://127.0.0.1:${PORT}/api/product-prompt`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      idea: "一个适合高端科技广告的银灰色便携产品，冷蓝环境光，极简背景。",
      task: "reverse",
      depth: "quick",
      aspectRatio: "1:1",
      model: "gpt-5.6-luna",
    }),
  });
  assert.equal(ideaOnlyProductResponse.status, 200);
  const ideaOnlyProduct = await ideaOnlyProductResponse.json();
  assert.ok(ideaOnlyProduct.platformPrompts.gptImage2.promptChinese.length > 10);
  assert.match(ideaOnlyProduct.warnings.join("；"), /未提供独立产品图/);
  const ideaOnlyArgs = JSON.parse(await readFile(argsCapturePath, "utf8"));
  assert.equal(ideaOnlyArgs.filter((argument) => argument === "--image").length, 0);

  const videoAnalyzeResponse = await fetch(`http://127.0.0.1:${PORT}/api/video/analyze`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      video: { name: "sample.mp4", duration: 3.6, width: 1280, height: 720 },
      frames: [
        { time: 0, image: TEST_IMAGE },
        { time: 3.6, image: TEST_IMAGE },
      ],
      directorNote: "保留冷蓝灰色调和主体空间方向。",
      exclusions: "不要品牌和字幕。",
      aspectRatio: "16:9",
      model: "gpt-5.6-terra",
    }),
  });
  assert.equal(videoAnalyzeResponse.status, 200);
  const videoAnalysis = await videoAnalyzeResponse.json();
  assert.equal(videoAnalysis.shots.length, 2);
  assert.ok(videoAnalysis.styleContinuity.length >= 2);
  assert.match(videoAnalysis.shots[0].imagePromptChinese, /冷蓝灰/);
  assert.match(videoAnalysis.shots[0].imagePromptEnglish, /cinematic/i);
  assert.match(videoAnalysis.shots[0].videoPromptChinese, /摄影机/);
  assert.match(videoAnalysis.shots[0].music, /当前版本只分析画面帧/);
  assert.equal(videoAnalysis.aspectRatio, "16:9");
  assert.match(await readFile(promptCapturePath, "utf8"), /视频拉片工作台/);
  assert.match(await readFile(promptCapturePath, "utf8"), /关键帧 1：00:00.0/);
  const videoArgs = JSON.parse(await readFile(argsCapturePath, "utf8"));
  assert.equal(videoArgs.filter((argument) => argument === "--image").length, 2);

  const clippedVideoAnalyzeResponse = await fetch(`http://127.0.0.1:${PORT}/api/video/analyze`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      video: { name: "sample.mp4", duration: 3.6, width: 1280, height: 720 },
      frames: [
        { time: 1, image: TEST_IMAGE },
        { time: 2.5, image: TEST_IMAGE },
      ],
      clipStart: 1,
      clipEnd: 2.5,
      aspectRatio: "16:9",
      model: "gpt-5.6-terra",
    }),
  });
  assert.equal(clippedVideoAnalyzeResponse.status, 200);
  const clippedVideo = await clippedVideoAnalyzeResponse.json();
  assert.equal(clippedVideo.clipStart, 1);
  assert.equal(clippedVideo.clipEnd, 2.5);
  clippedVideo.shots.forEach((shot) => {
    assert.ok(shot.startTime >= 1 && shot.endTime <= 2.5);
  });
  assert.match(await readFile(promptCapturePath, "utf8"), /选定片段/);

  const outsideClipResponse = await fetch(`http://127.0.0.1:${PORT}/api/video/analyze`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      video: { name: "sample.mp4", duration: 3.6, width: 1280, height: 720 },
      frames: [
        { time: 0.4, image: TEST_IMAGE },
        { time: 1.4, image: TEST_IMAGE },
      ],
      clipStart: 1,
      clipEnd: 2.5,
      aspectRatio: "16:9",
      model: "gpt-5.6-terra",
    }),
  });
  assert.equal(outsideClipResponse.status, 400);
  assert.match((await outsideClipResponse.json()).error, /不在当前分析片段内/);

  const tooFewFramesResponse = await fetch(`http://127.0.0.1:${PORT}/api/video/analyze`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      video: { name: "sample.mp4", duration: 3.6 },
      frames: [{ time: 0, image: TEST_IMAGE }],
    }),
  });
  assert.equal(tooFewFramesResponse.status, 400);

  const compilePayload = {
    layers: [{ id: "style", title: "视觉风格", promptText: "忠实反推参考图视觉风格", enabled: true, locked: false }],
    targetScene: "无",
    inheritText: "无",
    excludeText: "无",
    aspectRatio: "16:9",
    model: "gpt-5.6-terra",
    anchors: [{ id: "anchor-1", type: "subject", label: "主体焦点", x: 0.4, y: 0.4, width: 0.2, height: 0.25, locked: true }],
    referencePlan: {},
  };
  const compileResponse = await fetch(`http://127.0.0.1:${PORT}/api/compile`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(compilePayload),
  });
  assert.equal(compileResponse.status, 200);
  const compileResult = await compileResponse.json();
  assert.match(compileResult.midjourney.prompt, /faithful reference scene/);
  assertBilingualPrompts(compileResult);
  assertSafeMidjourneyParameters(compileResult.midjourney.parameters);
  assert.match(await readFile(promptCapturePath, "utf8"), /主体焦点/);

  const promptLanguagesResponse = await fetch(`http://127.0.0.1:${PORT}/api/prompt-languages`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      platformPrompts: compileResult,
      aspectRatio: "16:9",
      model: "gpt-5.6-terra",
    }),
  });
  assert.equal(promptLanguagesResponse.status, 200);
  const promptLanguagesResult = await promptLanguagesResponse.json();
  assertBilingualPrompts(promptLanguagesResult.platformPrompts);
  assert.match(await readFile(promptCapturePath, "utf8"), /提示词双语校对器/);

  const variantsResponse = await fetch(`http://127.0.0.1:${PORT}/api/variants`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(compilePayload),
  });
  assert.equal(variantsResponse.status, 200);
  const variantsResult = await variantsResponse.json();
  assert.equal(variantsResult.variants.length, 3);
  assert.deepEqual(variantsResult.variants.map((variant) => variant.id), ["faithful", "balanced", "creative"]);
  assert.match(variantsResult.variants[0].decisionGuide.visualStrategy, /[\u4e00-\u9fff]/);
  variantsResult.variants.forEach((variant) => assertSafeMidjourneyParameters(variant.platformPrompts.midjourney.parameters));
  variantsResult.variants.forEach((variant) => assertBilingualPrompts(variant.platformPrompts));

  const assetAnalyzeResponse = await fetch(`http://127.0.0.1:${PORT}/api/assets/analyze`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      image: TEST_IMAGE,
      aspectRatio: "16:9",
      model: "gpt-5.6-terra",
    }),
  });
  assert.equal(assetAnalyzeResponse.status, 200);
  const assetAnalysis = await assetAnalyzeResponse.json();
  assert.match(assetAnalysis.title, /[\u4e00-\u9fff]/);
  assert.ok(assetAnalysis.tags.length >= 2);
  assert.match(assetAnalysis.platformPrompts.gptImage2.prompt, /忠实反推/);
  assertBilingualPrompts(assetAnalysis.platformPrompts);
  assertSafeMidjourneyParameters(assetAnalysis.platformPrompts.midjourney.parameters);
  assert.match(await readFile(promptCapturePath, "utf8"), /视觉资产整理员/);

  const assetSaveResponse = await fetch(`http://127.0.0.1:${PORT}/api/assets`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      title: assetAnalysis.title,
      summary: assetAnalysis.summary,
      tags: assetAnalysis.tags,
      sourceKind: "primary",
      image: TEST_IMAGE,
      imageName: "reference.png",
      shareCard: TEST_IMAGE,
      prompts: assetAnalysis.platformPrompts,
      warnings: assetAnalysis.warnings,
    }),
  });
  assert.equal(assetSaveResponse.status, 200);
  const savedAsset = await assetSaveResponse.json();
  assert.ok(savedAsset.asset.image.url);
  assert.ok(savedAsset.asset.shareCard.url);

  const assetsResponse = await fetch(`http://127.0.0.1:${PORT}/api/assets`);
  assert.equal(assetsResponse.status, 200);
  const assets = await assetsResponse.json();
  assert.equal(assets.assets.length, 1);

  const loadedAssetResponse = await fetch(`http://127.0.0.1:${PORT}/api/assets/${savedAsset.asset.id}`);
  assert.equal(loadedAssetResponse.status, 200);
  const loadedAsset = await loadedAssetResponse.json();
  assert.equal(loadedAsset.asset.title, assetAnalysis.title);
  assert.ok(loadedAsset.asset.prompts.midjourney.prompt.length > 10);
  assert.ok(loadedAsset.asset.prompts.midjourney.parameters.includes("--ar 16:9"));

  const shareCardResponse = await fetch(`http://127.0.0.1:${PORT}${savedAsset.asset.shareCard.url}`);
  assert.equal(shareCardResponse.status, 200);
  assert.equal(shareCardResponse.headers.get("content-type"), "image/png");

  const promptAestheticResponse = await fetch(`http://127.0.0.1:${PORT}/api/prompt-aesthetic/analyze`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      image: TEST_IMAGE,
      englishPrompt: "cold steel-grey desaturated palette, lone figure against massive industrial environment, IMAX wide angle, low angle shot",
      model: "gpt-5.6-terra",
    }),
  });
  assert.equal(promptAestheticResponse.status, 200);
  const promptAesthetic = await promptAestheticResponse.json();
  assert.match(promptAesthetic.promptChinese, /冷灰/);
  assert.ok(promptAesthetic.aestheticAnalysis.length >= 3);
  assert.match(await readFile(promptCapturePath, "utf8"), /提示词美学卡分析器/);

  const promptStudySaveResponse = await fetch(`http://127.0.0.1:${PORT}/api/assets`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      cardType: "prompt-aesthetic",
      title: promptAesthetic.title,
      summary: promptAesthetic.summary,
      tags: promptAesthetic.tags,
      sourceKind: "prompt_aesthetic",
      image: TEST_IMAGE,
      imageName: "prompt-result.png",
      shareCard: TEST_IMAGE,
      promptStudy: {
        englishPrompt: promptAesthetic.englishPrompt,
        chinesePrompt: promptAesthetic.promptChinese,
        aestheticAnalysis: promptAesthetic.aestheticAnalysis,
      },
      warnings: promptAesthetic.warnings,
    }),
  });
  assert.equal(promptStudySaveResponse.status, 200);
  const savedPromptStudy = await promptStudySaveResponse.json();
  assert.equal(savedPromptStudy.asset.cardType, "prompt-aesthetic");
  assert.equal(savedPromptStudy.asset.promptStudy.englishPrompt, promptAesthetic.englishPrompt);
  assert.ok(savedPromptStudy.asset.shareCard.url);

  const loadedPromptStudyResponse = await fetch(`http://127.0.0.1:${PORT}/api/assets/${savedPromptStudy.asset.id}`);
  assert.equal(loadedPromptStudyResponse.status, 200);
  const loadedPromptStudy = await loadedPromptStudyResponse.json();
  assert.equal(loadedPromptStudy.asset.promptStudy.chinesePrompt, promptAesthetic.promptChinese);
  assert.ok(loadedPromptStudy.asset.promptStudy.aestheticAnalysis.length >= 3);

  const assetsAfterPromptStudyResponse = await fetch(`http://127.0.0.1:${PORT}/api/assets`);
  assert.equal(assetsAfterPromptStudyResponse.status, 200);
  const assetsAfterPromptStudy = await assetsAfterPromptStudyResponse.json();
  assert.equal(assetsAfterPromptStudy.assets.length, 2);

  const deleteAssetResponse = await fetch(`http://127.0.0.1:${PORT}/api/assets/${savedPromptStudy.asset.id}`, { method: "DELETE" });
  assert.equal(deleteAssetResponse.status, 200);
  const assetsAfterDeleteResponse = await fetch(`http://127.0.0.1:${PORT}/api/assets`);
  const assetsAfterDelete = await assetsAfterDeleteResponse.json();
  assert.equal(assetsAfterDelete.assets.length, 1);

  const revisionResponse = await fetch(`http://127.0.0.1:${PORT}/api/revise`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      ...compilePayload,
      primaryImage: TEST_IMAGE,
      resultImage: TEST_IMAGE,
      issues: ["composition", "scale"],
      note: "主体需要回到画面中间",
    }),
  });
  assert.equal(revisionResponse.status, 200);
  const revisionResult = await revisionResponse.json();
  assert.match(revisionResult.revisedPrompts.gptImage2.prompt, /revised/);
  assertBilingualPrompts(revisionResult.revisedPrompts);
  assertSafeMidjourneyParameters(revisionResult.revisedPrompts.midjourney.parameters);

  const projectSaveResponse = await fetch(`http://127.0.0.1:${PORT}/api/projects`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      title: "V0.3 测试项目",
      primaryImage: TEST_IMAGE,
      primaryName: "reference.png",
      resultImage: TEST_IMAGE,
      resultName: "result.png",
      state: {
        form: { model: "gpt-5.6-terra" },
        anchors: compilePayload.anchors,
        composition: {
          frames: {
            "16:9": { zoom: 1.1, panX: 0.2, panY: -0.1 },
            "9:16": { zoom: 1.25, panX: -0.3, panY: 0.2 },
          },
        },
        variants: variantsResult.variants,
      },
    }),
  });
  assert.equal(projectSaveResponse.status, 200);
  const savedProject = await projectSaveResponse.json();
  assert.equal(savedProject.project.title, "V0.3 测试项目");
  assert.ok(savedProject.project.assets.primary.url);

  const projectsResponse = await fetch(`http://127.0.0.1:${PORT}/api/projects`);
  assert.equal(projectsResponse.status, 200);
  const projects = await projectsResponse.json();
  assert.equal(projects.projects.length, 1);

  const projectResponse = await fetch(`http://127.0.0.1:${PORT}/api/projects/${savedProject.project.id}`);
  assert.equal(projectResponse.status, 200);
  const loadedProject = await projectResponse.json();
  assert.equal(loadedProject.project.state.anchors.length, 1);
  assert.equal(loadedProject.project.state.composition.frames["9:16"].zoom, 1.25);

  const assetResponse = await fetch(`http://127.0.0.1:${PORT}${savedProject.project.assets.primary.url}`);
  assert.equal(assetResponse.status, 200);
  assert.equal(assetResponse.headers.get("content-type"), "image/png");

  const preserveProjectResponse = await fetch(`http://127.0.0.1:${PORT}/api/projects`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      id: savedProject.project.id,
      title: "V0.4 保留素材测试",
      state: {},
      primaryImage: null,
      productImage: null,
      resultImage: null,
      imageActions: { primary: "preserve", product: "preserve", result: "preserve" },
    }),
  });
  assert.equal(preserveProjectResponse.status, 200);
  const preservedProject = await preserveProjectResponse.json();
  assert.equal(preservedProject.project.title, "V0.4 保留素材测试");
  assert.equal(preservedProject.project.assets.primary.url, savedProject.project.assets.primary.url);

  const invalidModelResponse = await fetch(`http://127.0.0.1:${PORT}/api/analyze`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      primaryImage: TEST_IMAGE,
      scopes: ["style"],
      model: "not-a-real-model",
    }),
  });
  assert.equal(invalidModelResponse.status, 400);

  const deepseekAnalyzeResponse = await fetch(`http://127.0.0.1:${PORT}/api/analyze`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      primaryImage: TEST_IMAGE,
      scopes: ["style"],
      inheritText: "",
      targetScene: "",
      excludeText: "",
      aspectRatio: "16:9",
      model: "deepseek/deepseek-v4-pro",
      region: null,
    }),
  });
  assert.equal(deepseekAnalyzeResponse.status, 200);
  const deepseekArgs = JSON.parse(await readFile(argsCapturePath, "utf8"));
  assert.ok(deepseekArgs.includes("--model"));
  assert.ok(deepseekArgs.includes("deepseek/deepseek-v4-pro"));

  const missingResponse = await fetch(`http://127.0.0.1:${PORT}/missing-file`);
  assert.equal(missingResponse.status, 404);
  console.log("smoke test passed");
} finally {
  child.kill("SIGTERM");
  await rm(promptCapturePath, { force: true });
  await rm(argsCapturePath, { force: true });
  await rm(projectsRoot, { recursive: true, force: true });
  await rm(assetsRoot, { recursive: true, force: true });
}
