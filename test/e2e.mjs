import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const imagePath = process.argv[2] || process.env.TEST_IMAGE;
const PORT = Number.parseInt(process.env.TEST_PORT || "43918", 10);

if (!imagePath) {
  throw new Error("Pass a PNG, JPG, or WEBP path to npm run test:e2e -- /path/to/image.jpg");
}

const extension = path.extname(imagePath).toLowerCase();
const mime = extension === ".png" ? "image/png" : extension === ".webp" ? "image/webp" : "image/jpeg";
const image = await readFile(imagePath);
const dataUrl = `data:${mime};base64,${image.toString("base64")}`;

function assertSafeMidjourneyParameters(parameters) {
  assert.match(parameters, /--ar 16:9/);
  assert.doesNotMatch(parameters, /--(?:sref|sw|oref|ow|cref|cw|iw)\b/i);
}

function assertBilingualPrompts(prompts) {
  assert.ok(prompts.midjourney.promptChinese.length > 20, "Midjourney Chinese prompt should be present");
  assert.ok(prompts.midjourney.promptEnglish.length > 20, "Midjourney English prompt should be present");
  assert.ok(prompts.gptImage2.promptChinese.length > 20, "GPT Image 2 Chinese prompt should be present");
  assert.ok(prompts.gptImage2.promptEnglish.length > 20, "GPT Image 2 English prompt should be present");
}

const child = spawn(process.execPath, ["server.mjs"], {
  cwd: ROOT,
  env: { ...process.env, PORT: String(PORT) },
  stdio: ["ignore", "pipe", "pipe"],
});

let childOutput = "";
child.stdout.on("data", (chunk) => {
  childOutput += chunk;
});
child.stderr.on("data", (chunk) => {
  childOutput += chunk;
});

async function waitForServer() {
  for (let attempt = 0; attempt < 80; attempt += 1) {
    try {
      const response = await fetch(`http://127.0.0.1:${PORT}/api/health`);
      if (response.ok) return;
    } catch {
      // Still starting.
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error(`Server did not start.\n${childOutput}`);
}

async function post(route, payload) {
  const response = await fetch(`http://127.0.0.1:${PORT}${route}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(320000),
  });
  const body = await response.json();
  if (!response.ok) throw new Error(`${route} failed (${response.status}): ${body.error}\n${childOutput}`);
  return body;
}

try {
  await waitForServer();
  const analysis = await post("/api/analyze", {
    primaryImage: dataUrl,
    productImage: null,
    scopes: ["style", "space", "composition", "lighting", "color", "atmosphere"],
    inheritText: "继承画面的光线、色彩、空气感和空间层次，不复制原品牌、文字或具体主体。",
    targetScene: "扩写成16:9横向电影大全景，前景有遮挡，中景设置明确视觉主体，远景通过空气透视延伸，保留适度留白。",
    excludeText: "不要Logo、水印、平台UI和可识别品牌文字。",
    aspectRatio: "16:9",
    region: null,
  });

  assert.ok(analysis.summary.length > 10, "analysis summary should be present");
  assert.ok(analysis.layers.length >= 3, "analysis should include semantic layers");
  assert.ok(analysis.platformPrompts.midjourney.prompt.length > 20, "Midjourney prompt should be present");
  assert.ok(analysis.platformPrompts.gptImage2.prompt.length > 20, "GPT Image 2 prompt should be present");
  assertBilingualPrompts(analysis.platformPrompts);
  assertSafeMidjourneyParameters(analysis.platformPrompts.midjourney.parameters);

  const editedLayers = analysis.layers.map((layer, index) => ({
    id: layer.id,
    title: layer.title,
    promptText: index === 0 ? `${layer.promptText}，整体留白增加。` : layer.promptText,
    enabled: layer.enabled,
    locked: layer.id === "color",
  }));
  const compiled = await post("/api/compile", {
    layers: editedLayers,
    targetScene: "扩写成16:9横向电影大全景，前景有遮挡，中景设置明确视觉主体，远景通过空气透视延伸，保留适度留白。",
    inheritText: "继承画面的光线、色彩、空气感和空间层次。",
    excludeText: "不要Logo、水印、平台UI和品牌文字。",
    aspectRatio: "16:9",
    hasProductImage: false,
    referencePlan: analysis.referencePlan,
    anchors: [{
      id: "anchor-subject",
      type: "subject",
      label: "主体焦点",
      x: 0.42,
      y: 0.4,
      width: 0.18,
      height: 0.25,
      locked: true,
    }],
  });

  assert.ok(compiled.midjourney.prompt.length > 20, "compiled Midjourney prompt should be present");
  assert.ok(compiled.gptImage2.prompt.length > 20, "compiled GPT Image 2 prompt should be present");
  assertBilingualPrompts(compiled);
  assertSafeMidjourneyParameters(compiled.midjourney.parameters);

  const variants = await post("/api/variants", {
    layers: editedLayers,
    targetScene: "扩写成16:9横向电影大全景，前景有遮挡，中景设置明确视觉主体，远景通过空气透视延伸，保留适度留白。",
    inheritText: "继承画面的光线、色彩、空气感和空间层次。",
    excludeText: "不要Logo、水印、平台UI和品牌文字。",
    aspectRatio: "16:9",
    hasProductImage: false,
    referencePlan: analysis.referencePlan,
    anchors: [{
      id: "anchor-subject",
      type: "subject",
      label: "主体焦点",
      x: 0.42,
      y: 0.4,
      width: 0.18,
      height: 0.25,
      locked: true,
    }],
  });
  assert.equal(variants.variants.length, 3, "three candidate directions should be present");
  assert.deepEqual(variants.variants.map((variant) => variant.id), ["faithful", "balanced", "creative"]);
  assert.ok(/[\u4e00-\u9fff]/.test(variants.variants[0].title), "variant title should be Chinese");
  assert.ok(/[\u4e00-\u9fff]/.test(variants.variants[0].decisionGuide.visualStrategy), "variant guide should be Chinese");
  variants.variants.forEach((variant) => assertSafeMidjourneyParameters(variant.platformPrompts.midjourney.parameters));
  variants.variants.forEach((variant) => assertBilingualPrompts(variant.platformPrompts));

  const asset = await post("/api/assets/analyze", {
    image: dataUrl,
    aspectRatio: "16:9",
  });
  assert.ok(asset.title.length > 2, "asset title should be present");
  assert.ok(asset.tags.length >= 2, "asset tags should be present");
  assert.ok(asset.platformPrompts.midjourney.prompt.length > 20, "asset Midjourney prompt should be present");
  assert.ok(asset.platformPrompts.gptImage2.prompt.length > 20, "asset GPT Image 2 prompt should be present");
  assertBilingualPrompts(asset.platformPrompts);
  assertSafeMidjourneyParameters(asset.platformPrompts.midjourney.parameters);

  const revision = await post("/api/revise", {
    layers: editedLayers,
    targetScene: "扩写成16:9横向电影大全景，前景有遮挡，中景设置明确视觉主体，远景通过空气透视延伸，保留适度留白。",
    inheritText: "继承画面的光线、色彩、空气感和空间层次。",
    excludeText: "不要Logo、水印、平台UI和品牌文字。",
    aspectRatio: "16:9",
    hasProductImage: false,
    referencePlan: analysis.referencePlan,
    anchors: [{
      id: "anchor-subject",
      type: "subject",
      label: "主体焦点",
      x: 0.42,
      y: 0.4,
      width: 0.18,
      height: 0.25,
      locked: true,
    }],
    primaryImage: dataUrl,
    resultImage: dataUrl,
    issues: ["composition", "scale"],
    note: "主体需要回到画面中间，远景层次不要被压扁。",
  });
  assert.ok(revision.revisedPrompts.midjourney.prompt.length > 20, "revised Midjourney prompt should be present");
  assert.ok(revision.revisedPrompts.gptImage2.prompt.length > 20, "revised GPT Image 2 prompt should be present");
  assertBilingualPrompts(revision.revisedPrompts);
  assertSafeMidjourneyParameters(revision.revisedPrompts.midjourney.parameters);

  const outputPath = path.join(ROOT, "test", "e2e-output.json");
  await writeFile(outputPath, `${JSON.stringify({ analysis, compiled, variants, asset, revision }, null, 2)}\n`, "utf8");
  console.log(`e2e test passed: ${analysis.layers.length} layers, ${variants.variants.length} candidate directions`);
  console.log(`output: ${outputPath}`);
} finally {
  child.kill("SIGTERM");
}
