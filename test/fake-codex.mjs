#!/usr/bin/env node

import { writeFile } from "node:fs/promises";

const args = process.argv.slice(2);
const outputIndex = args.indexOf("--output-last-message");
const outputPath = outputIndex >= 0 ? args[outputIndex + 1] : "";

let prompt = "";
for await (const chunk of process.stdin) prompt += chunk;

if (process.env.FAKE_CODEX_CAPTURE) {
  await writeFile(process.env.FAKE_CODEX_CAPTURE, prompt, "utf8");
}
if (process.env.FAKE_CODEX_ARGS_CAPTURE) {
  await writeFile(process.env.FAKE_CODEX_ARGS_CAPTURE, JSON.stringify(args), "utf8");
}

function prompts(suffix = "") {
  const midjourneyEnglish = `faithful reference scene${suffix}`;
  const midjourneyChinese = `忠实还原参考画面${suffix}，保持原有场景、构图关系与视觉语言。`;
  const gptChinese = `忠实反推参考图，不增加新元素。${suffix}`;
  const gptEnglish = `Faithfully reconstruct the reference image without adding new elements.${suffix}`;
  return {
    midjourney: {
      prompt: midjourneyEnglish,
      promptChinese: midjourneyChinese,
      promptEnglish: midjourneyEnglish,
      referenceUsage: "Style Reference",
      parameters: "--ar 16:9 --stylize 150 --chaos 8 --sw 250 --ow 300 --sref https://example.invalid/style.jpg --oref https://example.invalid/object.jpg --no logo, watermark",
      negativeGuidance: "no added elements"
    },
    gptImage2: {
      prompt: gptChinese,
      promptChinese: gptChinese,
      promptEnglish: gptEnglish,
      imageRoles: "图片1为主参考图",
      editBoundary: "保持原画面",
      negativeGuidance: "不增加新元素"
    }
  };
}

const analysisResult = {
  summary: "测试反推结果",
  layers: [
    {
      id: "style",
      title: "视觉风格",
      sourceType: "observed",
      observation: "测试画面事实",
      inference: "无",
      promptText: "忠实反推参考图视觉风格",
      confidence: "high",
      enabled: true
    }
  ],
  referencePlan: {
    midjourneyPrimaryUse: "Style Reference",
    midjourneyPrimaryReason: "测试",
    midjourneyProductUse: "Not provided",
    midjourneyProductReason: "未提供",
    gptPrimaryRole: "主参考图",
    gptProductRole: "未提供"
  },
  platformPrompts: prompts(),
  warnings: []
};

const variantsResult = {
  variants: [
    {
      id: "faithful",
      title: "忠实还原",
      summary: "尽量保留参考图已经成立的结构、光线与留白。",
      decisionGuide: {
        visualStrategy: "不新增叙事，只把参考图的构图层次和克制气氛稳定复现。",
        bestFor: "你已经喜欢参考图本身，只需要稳定得到同类画面时。",
        tradeoff: "空间扩写和戏剧性最少，画面不会主动变得更夸张。"
      },
      platformPrompts: prompts(" faithful")
    },
    {
      id: "balanced",
      title: "平衡扩写",
      summary: "在保持主体身份的前提下，补全更完整的空间层次。",
      decisionGuide: {
        visualStrategy: "保留参考图的视觉 DNA，同时适度增加前中远景、光线层次与电影感。",
        bestFor: "你想从局部参考发展成完整大全景，但不希望风格失控时。",
        tradeoff: "会比原图多一些环境信息，纯还原程度会相应下降。"
      },
      platformPrompts: prompts(" balanced")
    },
    {
      id: "creative",
      title: "创意增强",
      summary: "保留锁定主体和构图锚点，强化尺度、情绪或戏剧张力。",
      decisionGuide: {
        visualStrategy: "只在允许变化的区域加强空间尺度、气氛和视觉冲击，不改变主体身份。",
        bestFor: "你要做海报感、片头感或更强情绪的画面时。",
        tradeoff: "风格表达更强，和参考图的克制程度会拉开距离。"
      },
      platformPrompts: prompts(" creative")
    }
  ],
  warnings: []
};

const revisionResult = {
  summary: "结果图的主体位置偏右，需要收紧构图锚点。",
  deviations: [
    { area: "构图位置", diagnosis: "主体偏右", correction: "主体回到中央三分之一位置" }
  ],
  revisedPrompts: prompts(" revised"),
  warnings: []
};

const assetResult = {
  title: "雾中冷灰建筑大全景",
  summary: "低饱和冷蓝灰色调的建筑大全景，利用雾化空气透视、暗色前景和大片留白建立安静克制的电影感。",
  tags: ["冷蓝灰", "雾化空间", "建筑大全景", "电影感"],
  platformPrompts: prompts(" asset"),
  warnings: []
};

const promptAestheticResult = {
  title: "冷灰巨构与孤独尺度",
  summary: "通过低饱和冷灰色、巨大建筑尺度和前景孤立人物，画面把克制的写实空间转换成带有压力感的电影构图。",
  promptChinese: "冷灰色低饱和未来巨构空间，一名孤独人物位于暗色前景，巨大的工业建筑延伸至远处；广角低机位，右侧定向冷白光，空气中悬浮细小尘埃，保持真实材质与沉重安静的电影氛围。",
  aestheticAnalysis: [
    {
      title: "冷灰低饱和基调",
      keywords: ["cold steel-grey desaturated palette", "no warmth no color"],
      evidence: "画面以钢灰、蓝灰和冷白高光为主，几乎没有显眼暖色，远景与前景都保持压低的饱和度。",
      effect: "统一的低饱和冷色把空间从普通建筑画面拉向理性、疏离且略带压迫感的硬科幻氛围。"
    },
    {
      title: "巨物与人的尺度对比",
      keywords: ["lone figure against massive industrial environment"],
      evidence: "前景人物的体量很小，后方工业结构占据大部分画幅，人物成为清晰的尺度参照。",
      effect: "用可辨认的人类尺度放大建筑的压迫感，同时建立观众代入画面的视觉锚点。"
    },
    {
      title: "广角低机位构图",
      keywords: ["IMAX wide angle", "low angle shot"],
      evidence: "画面从较低视点向上看，近处结构被拉出纵深，建筑的垂直线条向上汇聚。",
      effect: "低机位和广角共同强化了空间高度与前景到远景的透视，让巨构显得更有重量。"
    },
    {
      title: "硬质定向光与悬浮介质",
      keywords: ["single directional light shaft", "dust suspended in air"],
      evidence: "冷白方向光切出结构边缘，空气中的细微颗粒让光束和远近层次可见。",
      effect: "让金属材料具有明确体积，同时用空气介质把平面背景分成可感知的空间层。"
    }
  ],
  tags: ["冷灰巨构", "低饱和", "尺度对比", "广角低机位"],
  warnings: ["具体模型参数和命名摄影风格无法仅凭单张效果图验证，需要以原始英文提示词为准。"]
};

const productPromptResult = {
  summary: "一件冷蓝灰金属产品被放入克制的高端科技广告场景，保留产品形态并让环境服务于主体。",
  productIdentity: "产品为银灰色金属外壳，轮廓和比例保持图片1可见形态；表面为平滑半哑光材质，冷蓝灰主色，细节文字与内部结构无法确认。",
  sceneDirection: "以产品为视觉中心，置于低反射深色台面，右侧保留纵深和留白；使用冷蓝环境光与少量克制暖色轮廓光，广角近景，背景通过雾化空气透视退后。",
  platformPrompts: prompts(" product"),
  warnings: ["细小文字、Logo 和无法从参考图确认的内部结构需要人工核对。"]
};

const promptLanguageResult = {
  midjourney: {
    promptChinese: "忠实还原参考画面，保持原有场景、构图关系与视觉语言。",
    promptEnglish: "faithful reference scene"
  },
  gptImage2: {
    promptChinese: "忠实反推参考图，不增加新元素。",
    promptEnglish: "Faithfully reconstruct the reference image without adding new elements."
  }
};

const videoAnalysisResult = {
  summary: "测试视频被拆为两个以冷色空间与缓慢推进为主的镜头。",
  styleContinuity: [
    "保持冷蓝灰主色与低饱和电影光线。",
    "保持主体从右向左的空间方向。"
  ],
  shots: [
    {
      id: "01",
      startTime: 0,
      endTime: 1.8,
      title: "空间建立",
      visualDescription: "冷灰色大型结构位于画面右侧，远处空间保持留白。",
      narrative: "建立环境尺度与主体进入方向。",
      shotSize: "大全景",
      cameraAngle: "平视略仰",
      cameraMovement: "无法确认（采样帧无法完整确认连续运动）",
      lensAndDepth: "广角，中远景清晰",
      lighting: "冷白侧逆光，金属表面有低亮反射",
      music: "无法确认（当前版本只分析画面帧）",
      sound: "无法确认（当前版本只分析画面帧）",
      transition: "按画面节奏自然衔接",
      imagePromptChinese: "冷蓝灰色电影感大型结构大全景，主体位于画面右侧，保留左侧留白与低饱和冷白侧逆光。",
      imagePromptEnglish: "A cinematic cool blue-gray wide shot of a large structure on the right side, preserving negative space on the left and low-saturation cool white sidelight.",
      videoPromptChinese: "从静态大全景开始，摄影机克制地缓慢推进，保持主体从右向左的空间方向和冷白金属反射。",
      videoPromptEnglish: "Start from the static wide shot and use a restrained slow push-in, preserving the right-to-left spatial direction and cool-white metallic reflections.",
      continuityLock: "保持主体形态、右侧位置、冷蓝灰色调与空间方向。",
      exclusions: "不新增文字、Logo、人物或无法从关键帧确认的建筑细节。"
    },
    {
      id: "02",
      startTime: 1.8,
      endTime: 3.6,
      title: "主体靠近",
      visualDescription: "主体仍停留在画面右侧，前景反射与冷雾层次更明显。",
      narrative: "在不改变空间方向的前提下强化主体与环境关系。",
      shotSize: "中大全景",
      cameraAngle: "平视",
      cameraMovement: "缓慢推进建议，原始连续运动无法从采样帧完全确认",
      lensAndDepth: "中等广角，前景轻微虚化",
      lighting: "冷白高光与低饱和蓝灰环境光",
      music: "无法确认（当前版本只分析画面帧）",
      sound: "无法确认（当前版本只分析画面帧）",
      transition: "保持主体方向连续后切入下一镜",
      imagePromptChinese: "冷蓝灰色中大全景，右侧主体保持原有形态，前景有轻微金属反射和冷雾空气透视。",
      imagePromptEnglish: "A cool blue-gray medium-wide shot with the right-side subject retaining its original shape, subtle foreground metallic reflections, and cool misty atmospheric perspective.",
      videoPromptChinese: "在保持主体形态和空间方向不变的前提下，摄影机缓慢推进，前景反射轻微掠过，衔接到下一镜。",
      videoPromptEnglish: "Keep the subject shape and spatial direction unchanged while the camera slowly pushes in, letting foreground reflections pass subtly before transitioning to the next shot.",
      continuityLock: "保持上一镜的主体身份、右侧位置、冷白高光和冷蓝灰主色。",
      exclusions: "不新增品牌、字幕、人物身份、额外情节或未确认的镜头运动。"
    }
  ],
  warnings: ["当前结果基于关键帧采样，不能替代逐帧剪辑点和音轨分析。"]
};

const result = prompt.includes("视频拉片工作台")
  ? videoAnalysisResult
  : prompt.includes("产品提示词工坊")
    ? productPromptResult
  : prompt.includes("提示词美学卡分析器")
    ? promptAestheticResult
  : prompt.includes("视觉资产整理员")
    ? assetResult
  : prompt.includes("提示词双语校对器")
    ? promptLanguageResult
  : prompt.includes("生成结果偏差修正器")
    ? revisionResult
  : prompt.includes("视觉提示词方案策划器")
    ? variantsResult
  : prompt.includes("视觉提示词编译器")
    ? { ...prompts(), warnings: [] }
  : analysisResult;

if (!outputPath) throw new Error("Missing --output-last-message path");
await writeFile(outputPath, JSON.stringify(result), "utf8");
