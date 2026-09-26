const STORAGE_KEY = "frame-dna-workbench-v02";
const LEGACY_STORAGE_KEY = "frame-dna-workbench-v01";
const THEME_STORAGE_KEY = "frame-dna-workbench-theme";
const THEME_OPTIONS = Object.freeze({
  dark: "暗色",
  light: "亮色",
  color: "彩色",
});
const MAX_VERSIONS = 20;
const REQUEST_TIMEOUT_MS = 5 * 60 * 1000 + 15000;
const QUICK_REQUEST_TIMEOUT_MS = 2 * 60 * 1000 + 15000;
const HEALTH_CHECK_TIMEOUT_MS = 5000;
const MAX_VIDEO_FRAMES = 8;
const MIN_VIDEO_SEGMENT_SECONDS = 0.2;
const MAX_VIDEO_FILE_BYTES = 250 * 1024 * 1024;
const ANALYSIS_MODE_OPTIONS = {
  quick: {
    label: "快速结果 · 只生成最终提示词",
    note: "只做一次轻量视觉分析，直接给出 Midjourney 与 GPT Image 2 两套提示词；不生成语义层、锚点或候选方案。适合先拿结果。想再快一点，可在下方选择 DeepSeek V4 Flash 或 GPT-5.6 Luna。切换后重新点击反推才会生效。",
  },
  layered: {
    label: "分层分析 · 提示词 + 可编辑语义层",
    note: "生成可编辑的风格、空间、构图、镜头等语义层，并分开列出画面事实与 AI 推断；适合精调、重新编译和生成三套候选。切换后重新点击反推才会生效。",
  },
};

const PRODUCT_PROMPT_TASK_OPTIONS = {
  reverse: {
    label: "产品反推 · 从证据整理提示词",
    note: "从产品图、参考图和文字中提取可确认的产品身份与画面语言，不擅自新增故事。",
  },
  continue: {
    label: "场景续写 · 锁住产品进入新画面",
    note: "产品身份保持不变，按照你的想法把它放进新的场景、构图和光线中。",
  },
};

const PRODUCT_PROMPT_DEPTH_OPTIONS = {
  quick: {
    label: "快速提示词 · 先拿结果",
    note: "优先返回可复制的双平台提示词，适合先试一版。",
  },
  detailed: {
    label: "详细方案 · 产品锁定 + 场景拆解",
    note: "把产品身份、场景变量和编辑边界分开写清楚，适合精调和复用。",
  },
};

const PRODUCT_REFERENCE_ROLE_OPTIONS = {
  both: "风格、构图、光线与空间方法",
  style: "风格、光线、色彩与材质氛围",
  composition: "构图、空间位置与镜头关系",
};

const LAYER_LABELS = {
  style: "视觉风格",
  space: "空间结构",
  composition: "构图关系",
  camera: "机位镜头",
  lighting: "光线设计",
  color: "色彩结构",
  material: "材质细节",
  atmosphere: "空气氛围",
  subject: "主体内容",
  product: "产品约束",
  constraints: "不可变项",
  exclusions: "排除内容",
};

const SOURCE_LABELS = {
  observed: "画面事实",
  inferred: "合理推断",
  user_mixed: "用户混合",
};

const CONFIDENCE_LABELS = {
  high: "高置信",
  medium: "中置信",
  low: "低置信",
};

const MODEL_OPTIONS = {
  auto: {
    label: "自动 · 跟随 Codex 配置（推荐）",
    description: "不覆盖 Codex 当前配置，最不容易因模型更新或账号权限变化而失效。",
  },
  "gpt-5.6-sol": {
    label: "GPT-5.6 Sol · 最高质量（gpt-5.6-sol）",
    description: "旗舰模型，适合首次反推、复杂空间关系和高要求的风格拆解。",
  },
  "gpt-5.6-terra": {
    label: "GPT-5.6 Terra · 质量／速度均衡（gpt-5.6-terra）",
    description: "均衡模型，适合日常参考图分析与持续调整。",
  },
  "gpt-5.6-luna": {
    label: "GPT-5.6 Luna · 快速迭代（gpt-5.6-luna）",
    description: "快速模型，适合快速试错、改层和反复重新编译。",
  },
  "deepseek/deepseek-v4-pro": {
    label: "DeepSeek V4 Pro · 高质量反推（deepseek/deepseek-v4-pro）",
    description: "当前 Codex 默认模型，适合详细、稳定的图片反推；速度比 Flash 慢。",
  },
  "deepseek/deepseek-v4-flash": {
    label: "DeepSeek V4 Flash · 快速迭代（deepseek/deepseek-v4-flash）",
    description: "快速模型，适合日常反推、反复试错和快速改层。",
  },
  "deepseek/deepseek-v4-flash-vision-exp": {
    label: "DeepSeek V4 Flash Vision 实验版（deepseek/deepseek-v4-flash-vision-exp）",
    description: "实验性视觉模型，可用于图片理解测试；质量与稳定性以实际输出为准。",
  },
};

const ANCHOR_TYPES = {
  subject: { label: "主体焦点", x: 0.42, y: 0.39, width: 0.18, height: 0.26 },
  foreground: { label: "前景框景", x: 0.04, y: 0.54, width: 0.25, height: 0.37 },
  horizon: { label: "地平线", x: 0.08, y: 0.61, width: 0.84, height: 0.035 },
  negative_space: { label: "留白区域", x: 0.62, y: 0.12, width: 0.26, height: 0.23 },
};

const COMPOSITION_FORMATS = {
  "21:9": { label: "超宽横构图", width: 21, height: 9 },
  "16:9": { label: "横构图", width: 16, height: 9 },
  "3:2": { label: "摄影横构图", width: 3, height: 2 },
  "9:16": { label: "竖构图", width: 9, height: 16 },
  "1:1": { label: "方形构图", width: 1, height: 1 },
};

const COVER_PRESETS = Object.freeze({
  xiaohongshu: { label: "小红书图文封面", platform: "小红书", width: 1080, height: 1440, aspectRatio: "3:4", safe: 0.88 },
  "channels-landscape": { label: "视频号横版", platform: "视频号", width: 1280, height: 720, aspectRatio: "16:9", safe: 0.88 },
  "channels-portrait": { label: "视频号竖版", platform: "视频号", width: 1080, height: 1920, aspectRatio: "9:16", safe: 0.88 },
});

function createDefaultCoverState() {
  return { preset: "xiaohongshu", focusX: 50, focusY: 52 };
}

function createDefaultComposition() {
  return {
    frames: Object.fromEntries(Object.keys(COMPOSITION_FORMATS).map((aspectRatio) => [aspectRatio, {
      zoom: 1,
      panX: 0,
      panY: 0,
    }])),
  };
}

function createDefaultVideoState() {
  return {
    source: null,
    restoredSource: null,
    frames: [],
    clipStart: 0,
    clipEnd: null,
    directorNote: "",
    exclusions: "",
    breakdown: null,
    promptLanguage: "zh",
  };
}

function createDefaultVideoProgress() {
  return {
    visible: false,
    active: false,
    status: "idle",
    percent: 0,
    stage: "等待开始",
    detail: "—",
    startedAt: 0,
    frameCount: 0,
    serverConnected: false,
  };
}

function createDefaultProductPromptState() {
  return {
    productImage: null,
    referenceImage: null,
    productName: "",
    referenceName: "",
    idea: "",
    productNotes: "",
    task: "reverse",
    depth: "quick",
    referenceRole: "both",
    aspectRatio: "16:9",
    result: null,
  };
}

function createDefaultPromptStudyState() {
  return {
    image: null,
    imageName: "",
    title: "",
    englishPrompt: "",
    result: null,
    cardDataUrl: null,
    stale: false,
  };
}

const REVISION_ISSUES = {
  composition: "构图位置",
  color: "色彩气氛",
  product: "产品／主体",
  scale: "尺度层次",
  style: "风格质感",
  lighting: "光线",
};

const VARIANT_META = {
  faithful: {
    title: "忠实还原",
    summary: "尽量保留参考图已经成立的结构、光线与留白。",
    visualStrategy: "不新增叙事，只把参考图的构图层次和克制气氛稳定复现。",
    bestFor: "你已经喜欢参考图本身，只需要稳定得到同类画面时。",
    tradeoff: "空间扩写和戏剧性最少，画面不会主动变得更夸张。",
  },
  balanced: {
    title: "平衡扩写",
    summary: "在保持主体身份的前提下，补全更完整的空间层次。",
    visualStrategy: "保留参考图的视觉 DNA，同时适度增加前中远景、光线层次与电影感。",
    bestFor: "你想从局部参考发展成完整大全景，但不希望风格失控时。",
    tradeoff: "会比原图多一些环境信息，纯还原程度会相应下降。",
  },
  creative: {
    title: "创意增强",
    summary: "保留锁定主体和构图锚点，强化尺度、情绪或戏剧张力。",
    visualStrategy: "只在允许变化的区域加强空间尺度、气氛和视觉冲击，不改变主体身份。",
    bestFor: "你要做海报感、片头感或更强情绪的画面时。",
    tradeoff: "风格表达更强，和参考图的克制程度会拉开距离。",
  },
};

const EMPTY_PROJECT = {
  id: null,
  title: "未命名项目",
  updatedAt: null,
  createdAt: null,
  assets: null,
};

const IMAGE_ASSET_KINDS = ["primary", "product", "result"];

function createImageAssetActions() {
  return Object.fromEntries(IMAGE_ASSET_KINDS.map((kind) => [kind, "preserve"]));
}

const DEFAULT_FORM = {
  scopes: ["style", "space", "composition", "camera", "lighting", "color", "material", "atmosphere"],
  inheritText: "",
  targetScene: "",
  excludeText: "",
  aspectRatio: "16:9",
  model: "auto",
  analysisMode: "layered",
};

const DEFAULT_PROMPT_LANGUAGES = {
  midjourney: "en",
  gptImage2: "zh",
};

const WORKSPACE_META = Object.freeze({
  home: {
    title: "首页",
    copy: "查看项目状态，并决定这次从哪里开始。",
  },
  image: {
    title: "图片反推",
    copy: "上传参考图，整理画面证据，并生成双平台提示词。",
  },
  covers: {
    title: "平台封面",
    copy: "为同一张参考图校准平台尺寸、安全区和封面提示词。",
  },
  product: {
    title: "产品提示词工坊",
    copy: "锁定产品身份，再把产品带入新的画面和场景。",
  },
  video: {
    title: "视频拉片",
    copy: "先选要分析的片段，再逐镜拆解可重制的画面与运动。",
  },
  assets: {
    title: "视觉资产库",
    copy: "沉淀效果图、双语提示词和可复用的美学分析。",
  },
});

const state = {
  form: { ...DEFAULT_FORM },
  images: {
    primary: null,
    product: null,
    result: null,
  },
  region: null,
  cropMode: false,
  analysisSummary: "",
  analysisMode: null,
  layers: [],
  referencePlan: null,
  platformPrompts: null,
  warnings: [],
  versions: [],
  anchors: [],
  composition: createDefaultComposition(),
  variants: [],
  selectedVariantId: null,
  revision: null,
  feedback: { issues: [], note: "" },
  project: { ...EMPTY_PROJECT },
  imageAssetActions: createImageAssetActions(),
  projects: [],
  assets: [],
  hasProductImage: false,
  activePlatform: "midjourney",
  activeWorkspace: "home",
  promptLanguages: { ...DEFAULT_PROMPT_LANGUAGES },
  promptStudy: createDefaultPromptStudyState(),
  productPrompt: createDefaultProductPromptState(),
  cover: createDefaultCoverState(),
  video: createDefaultVideoState(),
  videoProgress: createDefaultVideoProgress(),
  busy: false,
};

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];

const elements = {
  systemStatus: $("#system-status"),
  themeSwitcher: $("#theme-switcher"),
  themeOptions: $$("[data-theme-option]"),
  themeCurrent: $("#theme-current"),
  workspaceNav: $("#workspace-nav"),
  workspaceViews: $$("[data-workspace-view]"),
  homeProjectName: $("#home-project-name"),
  homeProjectMeta: $("#home-project-meta"),
  homeImageStatus: $("#home-image-status"),
  homeAssetCount: $("#home-asset-count"),
  homeVideoStatus: $("#home-video-status"),
  homeRecentAssets: $("#home-recent-assets"),
  inspectorWorkspaceTitle: $("#inspector-workspace-title"),
  inspectorWorkspaceCopy: $("#inspector-workspace-copy"),
  inspectorProjectTitle: $("#inspector-project-title"),
  inspectorProjectStatus: $("#inspector-project-status"),
  inspectorImageStatus: $("#inspector-image-status"),
  inspectorAssetCount: $("#inspector-asset-count"),
  inspectorCodexStatus: $("#inspector-codex-status"),
  coverPresetGrid: $("#cover-preset-grid"),
  coverStage: $("#cover-stage"),
  coverFocusX: $("#cover-focus-x"),
  coverFocusY: $("#cover-focus-y"),
  coverFocusXValue: $("#cover-focus-x-value"),
  coverFocusYValue: $("#cover-focus-y-value"),
  coverPreview: $("#cover-preview"),
  coverPreviewTitle: $("#cover-preview-title"),
  coverPreviewSize: $("#cover-preview-size"),
  coverStageEmpty: $("#cover-stage-empty"),
  coverPrompt: $("#cover-prompt"),
  coverFeedback: $("#cover-feedback"),
  exportCover: $("#export-cover"),
  copyCoverPrompt: $("#copy-cover-prompt"),
  coverUploadAction: $("#cover-upload-action"),
  primaryDropzone: $("#primary-dropzone"),
  primaryFile: $("#primary-file"),
  primaryUploadButton: $("#primary-upload-button"),
  primaryStage: $("#primary-stage"),
  primaryPreview: $("#primary-preview"),
  primaryToolbar: $("#primary-toolbar"),
  primaryFileName: $("#primary-file-name"),
  primaryRemove: $("#primary-remove"),
  cropToggle: $("#crop-toggle"),
  cropHelp: $("#crop-help"),
  cropSelection: $("#crop-selection"),
  productDropzone: $("#product-dropzone"),
  productFile: $("#product-file"),
  productUploadButton: $("#product-upload-button"),
  productPreview: $("#product-preview"),
  productTitle: $("#product-title"),
  productFileName: $("#product-file-name"),
  productRemove: $("#product-remove"),
  projectControls: $(".project-controls"),
  projectTitle: $("#project-title"),
  saveProject: $("#save-project"),
  openProjects: $("#open-projects"),
  projectsPopover: $("#projects-popover"),
  projectsList: $("#projects-list"),
  projectsCount: $("#projects-count"),
  scopeGrid: $("#scope-grid"),
  inheritText: $("#inherit-text"),
  targetScene: $("#target-scene"),
  excludeText: $("#exclude-text"),
  aspectRatio: $("#aspect-ratio"),
  analysisMode: $("#analysis-mode"),
  analysisModeNote: $("#analysis-mode-note"),
  codexModel: $("#codex-model"),
  modelNote: $("#model-note"),
  directionMode: $("#direction-mode"),
  directionModeTitle: $("#direction-mode-title"),
  directionModeCopy: $("#direction-mode-copy"),
  pureReverseButton: $("#pure-reverse-button"),
  analyzeButton: $("#analyze-button"),
  analysisFeedback: $("#analysis-feedback"),
  emptyState: $("#empty-state"),
  emptyUploadAction: $("#empty-upload-action"),
  emptyUploadActionLabel: $("#empty-upload-action-label"),
  loadingState: $("#loading-state"),
  loadingIndex: $("#loading-index"),
  loadingTitle: $("#loading-title"),
  loadingCopy: $("#loading-copy"),
  loadingElapsed: $("#loading-elapsed"),
  results: $("#results"),
  analysisModeBadge: $("#analysis-mode-badge"),
  analysisSummary: $("#analysis-summary"),
  referencePlan: $("#reference-plan"),
  layersHeading: $("#layers-heading"),
  layersGrid: $("#layers-grid"),
  layerChangeCount: $("#layer-change-count"),
  versionCount: $("#version-count"),
  saveVersion: $("#save-version"),
  restoreVersion: $("#restore-version"),
  exportMenu: $("#export-menu"),
  exportPopover: $("#export-popover"),
  exportMarkdown: $("#export-markdown"),
  exportJson: $("#export-json"),
  compileButton: $("#compile-button"),
  compileRow: $("#compile-row"),
  compositionSection: $("#composition-section"),
  variantsSection: $("#variants-section"),
  promptLanguageNote: $("#prompt-language-note"),
  promptLanguageZh: $(".prompt-language-tab[data-prompt-language='zh']"),
  promptLanguageEn: $(".prompt-language-tab[data-prompt-language='en']"),
  completePromptLanguages: $("#complete-prompt-languages"),
  compositionStage: $("#composition-stage"),
  compositionImage: $("#composition-image"),
  compositionEmpty: $("#composition-empty"),
  compositionFormatName: $("#composition-format-name"),
  compositionZoomOut: $("#composition-zoom-out"),
  compositionZoomIn: $("#composition-zoom-in"),
  compositionZoomLabel: $("#composition-zoom-label"),
  compositionReset: $("#composition-reset"),
  compositionPreviewLandscape: $("#composition-preview-landscape"),
  compositionPreviewPortrait: $("#composition-preview-portrait"),
  anchorList: $("#anchor-list"),
  anchorCount: $("#anchor-count"),
  generateVariants: $("#generate-variants"),
  variantsGrid: $("#variants-grid"),
  activeVariantStatus: $("#active-variant-status"),
  assetCount: $("#asset-count"),
  assetTitle: $("#asset-title"),
  savePrimaryAsset: $("#save-primary-asset"),
  saveResultAsset: $("#save-result-asset"),
  refreshAssets: $("#refresh-assets"),
  assetLibraryNote: $("#asset-library-note"),
  assetGrid: $("#asset-grid"),
  promptStudyWorkshop: $("#prompt-study-workshop"),
  promptStudyDropzone: $("#prompt-study-dropzone"),
  promptStudyFile: $("#prompt-study-file"),
  promptStudyUploadButton: $("#prompt-study-upload-button"),
  promptStudyImagePreview: $("#prompt-study-image-preview"),
  promptStudyUploadPlaceholder: $("#prompt-study-upload-placeholder"),
  promptStudyImageTitle: $("#prompt-study-image-title"),
  promptStudyImageMeta: $("#prompt-study-image-meta"),
  promptStudyImageRemove: $("#prompt-study-image-remove"),
  promptStudyTitleInput: $("#prompt-study-title-input"),
  promptStudyEnglish: $("#prompt-study-english"),
  analyzePromptStudy: $("#analyze-prompt-study"),
  promptStudyProgress: $("#prompt-study-progress"),
  promptStudyFeedback: $("#prompt-study-feedback"),
  promptStudyResult: $("#prompt-study-result"),
  promptStudyResultTitle: $("#prompt-study-result-title"),
  promptStudySummary: $("#prompt-study-summary"),
  promptStudyChinese: $("#prompt-study-chinese"),
  promptStudyAnalysisList: $("#prompt-study-analysis-list"),
  promptStudyCardPreview: $("#prompt-study-card-preview"),
  refreshPromptStudyCard: $("#refresh-prompt-study-card"),
  downloadPromptStudyCard: $("#download-prompt-study-card"),
  savePromptStudyAsset: $("#save-prompt-study-asset"),
  copyPromptStudyEnglish: $("#copy-prompt-study-english"),
  copyPromptStudyChinese: $("#copy-prompt-study-chinese"),
  resultDropzone: $("#result-dropzone"),
  resultFile: $("#result-file"),
  resultUploadButton: $("#result-upload-button"),
  resultPreview: $("#result-preview"),
  resultUploadCopy: $("#result-upload-copy"),
  resultRemove: $("#result-remove"),
  revisionIssues: $("#revision-issues"),
  revisionNote: $("#revision-note"),
  reviseButton: $("#revise-button"),
  revisionResult: $("#revision-result"),
  warningsPanel: $("#warnings-panel"),
  warningsList: $("#warnings-list"),
  videoFile: $("#video-file"),
  videoUploadButton: $("#video-upload-button"),
  videoPlayerWrap: $("#video-player-wrap"),
  videoPlayer: $("#video-player"),
  videoStatus: $("#video-status"),
  videoFileName: $("#video-file-name"),
  videoMeta: $("#video-meta"),
  videoTimeline: $("#video-timeline"),
  videoCurrentTime: $("#video-current-time"),
  videoDuration: $("#video-duration"),
  videoClipStart: $("#video-clip-start"),
  videoClipEnd: $("#video-clip-end"),
  videoClipStartSeconds: $("#video-clip-start-seconds"),
  videoClipEndSeconds: $("#video-clip-end-seconds"),
  videoClipLabel: $("#video-clip-label"),
  setVideoClipStart: $("#set-video-clip-start"),
  setVideoClipEnd: $("#set-video-clip-end"),
  resetVideoClip: $("#reset-video-clip"),
  captureCurrentFrame: $("#capture-current-frame"),
  useCurrentFrameAsPrimary: $("#use-current-frame-as-primary"),
  sampleVideoFrames: $("#sample-video-frames"),
  clearVideoFrames: $("#clear-video-frames"),
  videoFrameCount: $("#video-frame-count"),
  videoFrameGrid: $("#video-frame-grid"),
  videoDirectorNote: $("#video-director-note"),
  videoExclusions: $("#video-exclusions"),
  analyzeVideo: $("#analyze-video"),
  videoAnalysisFeedback: $("#video-analysis-feedback"),
  videoAnalysisProgress: $("#video-analysis-progress"),
  videoProgressTrack: $("#video-progress-track"),
  videoProgressBar: $("#video-progress-bar"),
  videoProgressTitle: $("#video-progress-title"),
  videoProgressPercent: $("#video-progress-percent"),
  videoProgressDetail: $("#video-progress-detail"),
  videoProgressElapsed: $("#video-progress-elapsed"),
  videoProgressNote: $("#video-progress-note"),
  videoResults: $("#video-results"),
  videoSummary: $("#video-summary"),
  videoContinuity: $("#video-continuity"),
  videoShotList: $("#video-shot-list"),
  videoWarnings: $("#video-warnings"),
  videoWarningsList: $("#video-warnings-list"),
  copyVideoStoryboard: $("#copy-video-storyboard"),
  downloadVideoStoryboard: $("#download-video-storyboard"),
  clearVideoReport: $("#clear-video-report"),
  productPromptLab: $("#product-prompt-lab"),
  productPromptProductDropzone: $("#product-prompt-product-dropzone"),
  productPromptProductFile: $("#product-prompt-product-file"),
  productPromptProductButton: $("#product-prompt-product-button"),
  productPromptProductPreview: $("#product-prompt-product-preview"),
  productPromptProductCopy: $("#product-prompt-product-copy"),
  productPromptProductMeta: $("#product-prompt-product-meta"),
  productPromptProductRemove: $("#product-prompt-product-remove"),
  productPromptReferenceDropzone: $("#product-prompt-reference-dropzone"),
  productPromptReferenceFile: $("#product-prompt-reference-file"),
  productPromptReferenceButton: $("#product-prompt-reference-button"),
  productPromptReferencePreview: $("#product-prompt-reference-preview"),
  productPromptReferenceCopy: $("#product-prompt-reference-copy"),
  productPromptReferenceMeta: $("#product-prompt-reference-meta"),
  productPromptReferenceRemove: $("#product-prompt-reference-remove"),
  productPromptIdea: $("#product-prompt-idea"),
  productPromptProductNotes: $("#product-prompt-product-notes"),
  productPromptTask: $("#product-prompt-task"),
  productPromptDepth: $("#product-prompt-depth"),
  productPromptReferenceRole: $("#product-prompt-reference-role"),
  productPromptAspectRatio: $("#product-prompt-aspect-ratio"),
  productPromptTaskNote: $("#product-prompt-task-note"),
  productPromptDepthNote: $("#product-prompt-depth-note"),
  generateProductPrompt: $("#generate-product-prompt"),
  productPromptFeedback: $("#product-prompt-feedback"),
  productPromptResults: $("#product-prompt-results"),
  productPromptSummary: $("#product-prompt-summary"),
  productPromptIdentity: $("#product-prompt-identity"),
  productPromptScene: $("#product-prompt-scene"),
  productPromptWarnings: $("#product-prompt-warnings"),
  productPromptWarningsList: $("#product-prompt-warnings-list"),
  productPromptMidjourneyEnglish: $("#product-prompt-midjourney-english"),
  productPromptMidjourneyChinese: $("#product-prompt-midjourney-chinese"),
  productPromptMidjourneyParameters: $("#product-prompt-midjourney-parameters"),
  productPromptMidjourneyReference: $("#product-prompt-midjourney-reference"),
  productPromptMidjourneyNegative: $("#product-prompt-midjourney-negative"),
  productPromptGptChinese: $("#product-prompt-gpt-chinese"),
  productPromptGptEnglish: $("#product-prompt-gpt-english"),
  productPromptGptRoles: $("#product-prompt-gpt-roles"),
  productPromptGptBoundary: $("#product-prompt-gpt-boundary"),
  productPromptGptNegative: $("#product-prompt-gpt-negative"),
  copyProductPromptMidjourney: $("#copy-product-prompt-midjourney"),
  copyProductPromptMidjourneyChinese: $("#copy-product-prompt-midjourney-chinese"),
  copyProductPromptGptChinese: $("#copy-product-prompt-gpt-chinese"),
  copyProductPromptGptEnglish: $("#copy-product-prompt-gpt-english"),
  toast: $("#toast"),
};

const REQUIRED_UI_IDS = [
  "system-status",
  "theme-switcher",
  "theme-current",
  "workspace-nav",
  "workspace-home",
  "workspace-image",
  "workspace-covers",
  "home-recent-assets",
  "inspector-workspace-title",
  "primary-file",
  "analyze-button",
  "results",
  "asset-library",
  "prompt-study-workshop",
  "prompt-study-file",
  "analyze-prompt-study",
  "save-prompt-study-asset",
  "product-prompt-lab",
  "video-workbench",
  "cover-preview",
  "cover-stage",
  "toast",
];

function showUiRuntimeError(error) {
  const target = document.getElementById("ui-runtime-error");
  if (!target) return;
  const detail = String(error?.message || error || "未知错误").replace(/\s+/g, " ").slice(0, 260);
  target.textContent = `界面启动出现错误：${detail}。请刷新页面；若仍出现，请把这条提示截图发给我。`;
  target.hidden = false;
  document.documentElement.dataset.appReady = "false";
}

function normalizeTheme(theme) {
  return Object.hasOwn(THEME_OPTIONS, theme) ? theme : "color";
}

function applyTheme(theme, { persistSelection = true } = {}) {
  const normalized = normalizeTheme(theme);
  document.documentElement.dataset.theme = normalized;
  document.documentElement.style.colorScheme = normalized === "light" ? "light" : "dark";
  elements.themeOptions.forEach((option) => {
    const active = option.dataset.themeOption === normalized;
    option.classList.toggle("active", active);
    option.setAttribute("aria-pressed", String(active));
  });
  elements.themeCurrent.textContent = THEME_OPTIONS[normalized];
  elements.themeSwitcher.dataset.activeTheme = normalized;
  if (persistSelection) {
    try {
      localStorage.setItem(THEME_STORAGE_KEY, normalized);
    } catch {
      // 主题仍然在本次页面会话中生效。
    }
  }
}

function restoreTheme() {
  let savedTheme = "color";
  try {
    savedTheme = localStorage.getItem(THEME_STORAGE_KEY) || "color";
  } catch {
    // 使用默认彩色主题。
  }
  applyTheme(savedTheme, { persistSelection: false });
}

function assertRequiredUi() {
  const invalid = REQUIRED_UI_IDS.filter((id) => document.querySelectorAll(`#${id}`).length !== 1);
  if (invalid.length) throw new Error(`界面关键节点异常：${invalid.join("、")}`);
}

function createElement(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function escapeHtml(value) {
  return String(value || "").replace(/[&<>'"]/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "'": "&#39;",
    '"': "&quot;",
  })[character]);
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function normalizePlatformPromptLanguages(platform, prompt) {
  if (!prompt || typeof prompt !== "object") return prompt;
  const originalPrompt = typeof prompt.prompt === "string" ? prompt.prompt : "";
  const promptChinese = typeof prompt.promptChinese === "string"
    ? prompt.promptChinese
    : hasChineseText(originalPrompt) ? originalPrompt : "";
  const promptEnglish = typeof prompt.promptEnglish === "string"
    ? prompt.promptEnglish
    : hasChineseText(originalPrompt) ? "" : originalPrompt;
  return {
    ...prompt,
    prompt: platform === "midjourney"
      ? promptEnglish || originalPrompt
      : promptChinese || originalPrompt,
    promptChinese,
    promptEnglish,
  };
}

function normalizePromptLanguages(platformPrompts) {
  if (!platformPrompts || typeof platformPrompts !== "object") return platformPrompts;
  return {
    ...platformPrompts,
    midjourney: normalizePlatformPromptLanguages("midjourney", platformPrompts.midjourney),
    gptImage2: normalizePlatformPromptLanguages("gptImage2", platformPrompts.gptImage2),
  };
}

function normalizeVariantsPromptLanguages(variants) {
  return Array.isArray(variants)
    ? variants.map((variant) => ({ ...variant, platformPrompts: normalizePromptLanguages(variant?.platformPrompts) }))
    : [];
}

function persistableState() {
  return {
    form: state.form,
    region: state.region,
    analysisSummary: state.analysisSummary,
    analysisMode: state.analysisMode,
    layers: state.layers,
    referencePlan: state.referencePlan,
    platformPrompts: state.platformPrompts,
    warnings: state.warnings,
    versions: state.versions,
    anchors: state.anchors,
    composition: state.composition,
    variants: state.variants,
    selectedVariantId: state.selectedVariantId,
    revision: state.revision,
    feedback: state.feedback,
    project: state.project,
    hasProductImage: state.hasProductImage,
    activePlatform: state.activePlatform,
    activeWorkspace: state.activeWorkspace,
    promptLanguages: state.promptLanguages,
    cover: state.cover,
    promptStudy: {
      imageName: state.promptStudy.image?.name || state.promptStudy.imageName || "",
      title: state.promptStudy.title,
      englishPrompt: state.promptStudy.englishPrompt,
      result: state.promptStudy.result,
    },
    productPrompt: {
      productName: state.productPrompt.productImage?.name || state.productPrompt.productName || "",
      referenceName: state.productPrompt.referenceImage?.name || state.productPrompt.referenceName || "",
      idea: state.productPrompt.idea,
      productNotes: state.productPrompt.productNotes,
      task: state.productPrompt.task,
      depth: state.productPrompt.depth,
      referenceRole: state.productPrompt.referenceRole,
      aspectRatio: state.productPrompt.aspectRatio,
      result: state.productPrompt.result,
    },
    video: {
      source: state.video.source
        ? {
            name: state.video.source.name,
            duration: state.video.source.duration,
            width: state.video.source.width,
            height: state.video.source.height,
          }
        : state.video.restoredSource,
      directorNote: state.video.directorNote,
      exclusions: state.video.exclusions,
      clipStart: state.video.clipStart,
      clipEnd: state.video.clipEnd,
      breakdown: state.video.breakdown,
      promptLanguage: state.video.promptLanguage,
    },
  };
}

function persist() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(persistableState()));
  } catch {
    showToast("本地保存空间不足，请先导出 JSON 备份。", true);
  }
}

function applySavedState(saved) {
  state.form = { ...DEFAULT_FORM, ...(saved?.form || {}) };
  if (!MODEL_OPTIONS[state.form.model]) state.form.model = DEFAULT_FORM.model;
  if (!ANALYSIS_MODE_OPTIONS[state.form.analysisMode]) state.form.analysisMode = DEFAULT_FORM.analysisMode;
  state.analysisSummary = saved?.analysisSummary || "";
  state.region = saved?.region && typeof saved.region === "object" ? saved.region : null;
  state.layers = Array.isArray(saved?.layers) ? saved.layers : [];
  state.referencePlan = saved?.referencePlan || null;
  state.platformPrompts = normalizePromptLanguages(saved?.platformPrompts || null);
  state.warnings = Array.isArray(saved?.warnings) ? saved.warnings : [];
  state.versions = Array.isArray(saved?.versions) ? saved.versions.slice(-MAX_VERSIONS) : [];
  state.anchors = Array.isArray(saved?.anchors) ? saved.anchors.filter((anchor) => ANCHOR_TYPES[anchor?.type]) : [];
  state.composition = normalizeComposition(saved?.composition);
  state.variants = normalizeVariantsPromptLanguages(saved?.variants);
  state.selectedVariantId = typeof saved?.selectedVariantId === "string" ? saved.selectedVariantId : null;
  state.revision = saved?.revision && typeof saved.revision === "object"
    ? { ...saved.revision, revisedPrompts: normalizePromptLanguages(saved.revision.revisedPrompts) }
    : null;
  state.feedback = {
    issues: Array.isArray(saved?.feedback?.issues) ? saved.feedback.issues.filter((issue) => REVISION_ISSUES[issue]) : [],
    note: typeof saved?.feedback?.note === "string" ? saved.feedback.note : "",
  };
  state.project = { ...EMPTY_PROJECT, ...(saved?.project || {}) };
  state.imageAssetActions = createImageAssetActions();
  state.hasProductImage = saved?.hasProductImage === true;
  state.activePlatform = saved?.activePlatform === "gptImage2" ? "gptImage2" : "midjourney";
  state.activeWorkspace = WORKSPACE_META[saved?.activeWorkspace]
    ? saved.activeWorkspace
    : state.platformPrompts || state.project.id
      ? "image"
      : "home";
  state.promptLanguages = {
    midjourney: saved?.promptLanguages?.midjourney === "zh" ? "zh" : "en",
    gptImage2: saved?.promptLanguages?.gptImage2 === "en" ? "en" : "zh",
  };
  state.cover = {
    ...createDefaultCoverState(),
    preset: COVER_PRESETS[saved?.cover?.preset] ? saved.cover.preset : "xiaohongshu",
    focusX: Math.min(100, Math.max(0, Number.isFinite(Number(saved?.cover?.focusX)) ? Number(saved.cover.focusX) : 50)),
    focusY: Math.min(100, Math.max(0, Number.isFinite(Number(saved?.cover?.focusY)) ? Number(saved.cover.focusY) : 52)),
  };
  state.promptStudy = {
    ...createDefaultPromptStudyState(),
    imageName: typeof saved?.promptStudy?.imageName === "string" ? saved.promptStudy.imageName : "",
    title: typeof saved?.promptStudy?.title === "string" ? saved.promptStudy.title : "",
    englishPrompt: typeof saved?.promptStudy?.englishPrompt === "string" ? saved.promptStudy.englishPrompt : "",
    result: saved?.promptStudy?.result && typeof saved.promptStudy.result === "object"
      ? saved.promptStudy.result
      : null,
  };
  state.productPrompt = {
    ...createDefaultProductPromptState(),
    productName: typeof saved?.productPrompt?.productName === "string" ? saved.productPrompt.productName : "",
    referenceName: typeof saved?.productPrompt?.referenceName === "string" ? saved.productPrompt.referenceName : "",
    idea: typeof saved?.productPrompt?.idea === "string" ? saved.productPrompt.idea : "",
    productNotes: typeof saved?.productPrompt?.productNotes === "string" ? saved.productPrompt.productNotes : "",
    task: PRODUCT_PROMPT_TASK_OPTIONS[saved?.productPrompt?.task] ? saved.productPrompt.task : "reverse",
    depth: PRODUCT_PROMPT_DEPTH_OPTIONS[saved?.productPrompt?.depth] ? saved.productPrompt.depth : "quick",
    referenceRole: PRODUCT_REFERENCE_ROLE_OPTIONS[saved?.productPrompt?.referenceRole] ? saved.productPrompt.referenceRole : "both",
    aspectRatio: COMPOSITION_FORMATS[saved?.productPrompt?.aspectRatio] ? saved.productPrompt.aspectRatio : "16:9",
    result: saved?.productPrompt?.result && typeof saved.productPrompt.result === "object"
      ? {
          ...saved.productPrompt.result,
          platformPrompts: normalizePromptLanguages(saved.productPrompt.result.platformPrompts || {}),
        }
      : null,
  };
  state.video = {
    ...createDefaultVideoState(),
    restoredSource: saved?.video?.source && typeof saved.video.source === "object"
      ? {
          name: typeof saved.video.source.name === "string" ? saved.video.source.name : "上次本地视频",
          duration: Number(saved.video.source.duration) || 0,
          width: Number(saved.video.source.width) || 0,
          height: Number(saved.video.source.height) || 0,
        }
      : null,
    directorNote: typeof saved?.video?.directorNote === "string" ? saved.video.directorNote : "",
    exclusions: typeof saved?.video?.exclusions === "string" ? saved.video.exclusions : "",
    breakdown: saved?.video?.breakdown && typeof saved.video.breakdown === "object" ? saved.video.breakdown : null,
    promptLanguage: saved?.video?.promptLanguage === "en" ? "en" : "zh",
    clipStart: Number.isFinite(Number(saved?.video?.clipStart)) ? Number(saved.video.clipStart) : 0,
    clipEnd: Number.isFinite(Number(saved?.video?.clipEnd)) ? Number(saved.video.clipEnd) : null,
  };
  state.analysisMode = ANALYSIS_MODE_OPTIONS[saved?.analysisMode]
    ? saved.analysisMode
    : state.platformPrompts
      ? state.layers.length > 0 ? "layered" : "quick"
      : null;
}

function restorePersistentState() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || localStorage.getItem(LEGACY_STORAGE_KEY) || "null");
    if (!saved || typeof saved !== "object") return;
    applySavedState(saved);
  } catch {
    localStorage.removeItem(STORAGE_KEY);
  }
}

let toastTimer;
function showToast(message, isError = false) {
  clearTimeout(toastTimer);
  elements.toast.textContent = message;
  elements.toast.classList.toggle("error", isError);
  elements.toast.hidden = false;
  toastTimer = setTimeout(() => {
    elements.toast.hidden = true;
  }, isError ? 5600 : 3200);
}

function setAnalysisFeedback(message = "", isError = false) {
  elements.analysisFeedback.textContent = message;
  elements.analysisFeedback.classList.toggle("error", isError);
  elements.analysisFeedback.hidden = !message;
}

function setPromptStudyFeedback(message = "", isError = false) {
  elements.promptStudyFeedback.textContent = message;
  elements.promptStudyFeedback.classList.toggle("error", isError);
  elements.promptStudyFeedback.hidden = !message;
}

function getPromptStudyResult() {
  const result = state.promptStudy?.result;
  if (!result || typeof result !== "object") return null;
  const aestheticAnalysis = Array.isArray(result.aestheticAnalysis)
    ? result.aestheticAnalysis
      .filter((item) => item && typeof item === "object")
      .map((item, index) => ({
        title: String(item.title || `美学要点 ${index + 1}`).trim(),
        keywords: Array.isArray(item.keywords)
          ? item.keywords.map((keyword) => String(keyword || "").trim()).filter(Boolean)
          : [],
        evidence: String(item.evidence || "").trim(),
        effect: String(item.effect || "").trim(),
      }))
      .filter((item) => item.keywords.length && item.evidence && item.effect)
    : [];
  if (!String(result.promptChinese || "").trim() || aestheticAnalysis.length === 0) return null;
  return {
    title: String(result.title || "提示词学习结果").trim(),
    summary: String(result.summary || "").trim(),
    promptChinese: String(result.promptChinese || "").trim(),
    aestheticAnalysis,
    tags: Array.isArray(result.tags) ? result.tags.map((tag) => String(tag || "").trim()).filter(Boolean) : [],
    warnings: Array.isArray(result.warnings) ? result.warnings.map((warning) => String(warning || "").trim()).filter(Boolean) : [],
  };
}

function hasPromptStudyInputs() {
  return Boolean(state.promptStudy.image?.dataUrl && state.promptStudy.englishPrompt.trim());
}

function isPromptStudyReady() {
  return Boolean(hasPromptStudyInputs() && getPromptStudyResult() && !state.promptStudy.stale);
}

function renderPromptStudyAnalysis() {
  elements.promptStudyAnalysisList.replaceChildren();
  const result = getPromptStudyResult();
  if (!result) return;
  result.aestheticAnalysis.forEach((item, index) => {
    const article = createElement("article", "prompt-study-analysis-item");
    const copy = createElement("div");
    const title = createElement("h6", "", item.title);
    const keywords = createElement("p", "prompt-study-keywords", item.keywords.join(" · "));
    const evidence = createElement("p");
    evidence.append(createElement("strong", "", "画面证据："), document.createTextNode(item.evidence));
    const effect = createElement("p");
    effect.append(createElement("strong", "", "视觉作用："), document.createTextNode(item.effect));
    copy.append(title, keywords, evidence, effect);
    article.append(createElement("span", "prompt-study-analysis-index", String(index + 1).padStart(2, "0")), copy);
    elements.promptStudyAnalysisList.append(article);
  });
}

function renderPromptStudy() {
  const study = state.promptStudy;
  const result = getPromptStudyResult();
  const hasImage = Boolean(study.image?.dataUrl);
  const hasCard = Boolean(study.cardDataUrl);
  const ready = isPromptStudyReady();

  elements.promptStudyImagePreview.hidden = !hasImage;
  elements.promptStudyUploadPlaceholder.hidden = hasImage;
  elements.promptStudyImageRemove.hidden = !hasImage;
  elements.promptStudyDropzone.classList.toggle("has-image", hasImage);
  if (hasImage) {
    elements.promptStudyImagePreview.src = study.image.dataUrl;
    elements.promptStudyImageTitle.textContent = study.image.name || "已加载效果图";
    elements.promptStudyImageMeta.textContent = "更换图片会清空当前中文与美学拆解";
  } else {
    elements.promptStudyImagePreview.removeAttribute("src");
    elements.promptStudyImageTitle.textContent = study.imageName ? `请重新上传：${study.imageName}` : "上传效果图";
    elements.promptStudyImageMeta.textContent = study.imageName ? "浏览器不会保存原图；请重新选择后继续" : "PNG · JPG · WEBP · 最大 15MB";
  }
  if (document.activeElement !== elements.promptStudyTitleInput) elements.promptStudyTitleInput.value = study.title || "";
  if (document.activeElement !== elements.promptStudyEnglish) elements.promptStudyEnglish.value = study.englishPrompt || "";

  elements.promptStudyResult.hidden = !result;
  if (result) {
    elements.promptStudyResultTitle.textContent = study.stale ? `${result.title} · 需要重新分析` : result.title;
    elements.promptStudySummary.textContent = result.summary || "已完成中文提示词和视觉美学拆解。";
    if (document.activeElement !== elements.promptStudyChinese) elements.promptStudyChinese.value = result.promptChinese;
    renderPromptStudyAnalysis();
  } else {
    elements.promptStudySummary.textContent = "";
    elements.promptStudyChinese.value = "";
    elements.promptStudyAnalysisList.replaceChildren();
  }

  elements.promptStudyCardPreview.hidden = !hasCard;
  if (hasCard) elements.promptStudyCardPreview.src = study.cardDataUrl;
  else elements.promptStudyCardPreview.removeAttribute("src");
  elements.analyzePromptStudy.disabled = state.busy;
  elements.refreshPromptStudyCard.disabled = state.busy || !ready;
  elements.downloadPromptStudyCard.disabled = state.busy || !ready;
  elements.savePromptStudyAsset.disabled = state.busy || !ready;
  elements.copyPromptStudyEnglish.disabled = !study.englishPrompt.trim();
  elements.copyPromptStudyChinese.disabled = !result;
}

async function setPromptStudyImage(file) {
  try {
    const dataUrl = await readFileAsDataUrl(file);
    state.promptStudy.image = { dataUrl, name: file.name, type: file.type, size: file.size };
    state.promptStudy.imageName = file.name;
    state.promptStudy.result = null;
    state.promptStudy.cardDataUrl = null;
    state.promptStudy.stale = false;
    setPromptStudyFeedback("效果图已加载。粘贴生成这张图时使用的原始英文提示词，再开始分析。");
    renderPromptStudy();
    persist();
  } catch (error) {
    setPromptStudyFeedback(error.message || "效果图读取失败。", true);
    showToast(error.message || "效果图读取失败。", true);
  }
}

function clearPromptStudyImage() {
  state.promptStudy.image = null;
  state.promptStudy.imageName = "";
  state.promptStudy.result = null;
  state.promptStudy.cardDataUrl = null;
  state.promptStudy.stale = false;
  elements.promptStudyFile.value = "";
  setPromptStudyFeedback("效果图已移除；中文提示词和美学拆解已清空，原始英文仍保留。");
  renderPromptStudy();
  persist();
}

function bindPromptStudyDropzone() {
  ["dragenter", "dragover"].forEach((eventName) => {
    elements.promptStudyDropzone.addEventListener(eventName, (event) => {
      event.preventDefault();
      elements.promptStudyDropzone.classList.add("dragging");
    });
  });
  ["dragleave", "drop"].forEach((eventName) => {
    elements.promptStudyDropzone.addEventListener(eventName, (event) => {
      event.preventDefault();
      elements.promptStudyDropzone.classList.remove("dragging");
    });
  });
  elements.promptStudyDropzone.addEventListener("drop", (event) => {
    const file = event.dataTransfer?.files?.[0];
    if (file) setPromptStudyImage(file);
  });
  elements.promptStudyFile.addEventListener("change", () => {
    const file = elements.promptStudyFile.files?.[0];
    if (file) setPromptStudyImage(file);
    elements.promptStudyFile.value = "";
  });
}

function updatePromptStudyTitle() {
  state.promptStudy.title = elements.promptStudyTitleInput.value.trim();
  state.promptStudy.cardDataUrl = null;
  persist();
  renderPromptStudy();
}

function updatePromptStudyEnglish() {
  const nextValue = elements.promptStudyEnglish.value;
  if (nextValue !== state.promptStudy.englishPrompt && state.promptStudy.result) {
    state.promptStudy.stale = true;
    state.promptStudy.cardDataUrl = null;
    setPromptStudyFeedback("原始英文提示词已修改。为避免中文和美学分析错配，请重新生成分析后再保存。", true);
  }
  state.promptStudy.englishPrompt = nextValue;
  persist();
  renderPromptStudy();
}

function updatePromptStudyChinese() {
  const result = getPromptStudyResult();
  if (!result) return;
  state.promptStudy.result = { ...state.promptStudy.result, promptChinese: elements.promptStudyChinese.value };
  state.promptStudy.cardDataUrl = null;
  persist();
  renderPromptStudy();
}

async function analyzePromptStudy() {
  if (!state.promptStudy.image?.dataUrl) {
    setPromptStudyFeedback("请先上传英文提示词对应的效果图。", true);
    showToast("请先上传效果图。", true);
    return;
  }
  if (!state.promptStudy.englishPrompt.trim()) {
    setPromptStudyFeedback("请粘贴生成这张图时使用的原始英文提示词。", true);
    showToast("请先粘贴原始英文提示词。", true);
    return;
  }
  updateFormFromControls();
  setPromptStudyFeedback("正在检查本机 Codex 服务…");
  try {
    await verifyAnalysisService();
  } catch (error) {
    const message = error?.message || "本机 Codex 服务未就绪。";
    setPromptStudyFeedback(message, true);
    showToast(message, true);
    return;
  }

  setBusy(true, "prompt-study");
  elements.promptStudyProgress.hidden = false;
  elements.analyzePromptStudy.textContent = "正在拆解画面…";
  const startedAt = Date.now();
  const progressTimer = setInterval(() => {
    const seconds = Math.floor((Date.now() - startedAt) / 1000);
    const phase = seconds < 8 ? "正在核对效果图与英文原文…" : seconds < 22
      ? "正在整理中文对照与视觉证据…"
      : "正在生成可学习的美学拆解…";
    setPromptStudyFeedback(`${phase} 已等待 ${seconds} 秒，完成后会自动生成图片卡预览。`);
  }, 1000);
  try {
    const result = await apiRequest("/api/prompt-aesthetic/analyze", {
      image: state.promptStudy.image.dataUrl,
      englishPrompt: state.promptStudy.englishPrompt,
      model: state.form.model,
    });
    state.promptStudy.result = result;
    state.promptStudy.stale = false;
    if (!state.promptStudy.title.trim()) state.promptStudy.title = result.title || "未命名提示词美学卡";
    state.promptStudy.cardDataUrl = null;
    renderPromptStudy();
    try {
      await refreshPromptStudyCard({ silent: true });
      setPromptStudyFeedback("分析完成：中文对照、美学拆解和可分享 PNG 已生成。现在可以直接保存到资产库。 ");
    } catch (cardError) {
      setPromptStudyFeedback(`分析已经完成，但图片卡预览生成失败：${cardError.message}`, true);
    }
    persist();
    showToast("提示词美学卡已生成。 ");
    elements.promptStudyResult.scrollIntoView({ behavior: "smooth", block: "start" });
  } catch (error) {
    const message = error?.message || "提示词美学分析失败，请稍后重试。";
    setPromptStudyFeedback(message, true);
    showToast(message, true);
  } finally {
    clearInterval(progressTimer);
    elements.promptStudyProgress.hidden = true;
    elements.analyzePromptStudy.innerHTML = "生成中文与美学拆解 <span aria-hidden=\"true\">↗</span>";
    setBusy(false, "prompt-study");
  }
}

async function apiRequest(path, payload, { timeoutMs = REQUEST_TIMEOUT_MS } = {}) {
  const controller = new AbortController();
  let timedOut = false;
  const timeout = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, timeoutMs);
  try {
    const response = await fetch(path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    let result;
    try {
      result = await response.json();
    } catch {
      throw new Error(`服务返回异常（${response.status}）。`);
    }
    if (!response.ok) throw new Error(result.error || `请求失败（${response.status}）。`);
    return result;
  } catch (error) {
    if (timedOut) {
      throw new Error(timeoutMs < REQUEST_TIMEOUT_MS
        ? "快速反推等待超过 2 分钟，已停止等待。请改用 DeepSeek V4 Flash 或 GPT-5.6 Luna 后重试。"
        : "反推等待超过 5 分钟，已停止等待。请确认 Codex 没有被其他任务占用后重试。");
    }
    if (error?.name === "AbortError") throw new Error("请求已停止，请重新点击反推。");
    if (error instanceof TypeError || /failed to fetch/i.test(String(error?.message || ""))) {
      throw new Error("无法连接本机反推服务。请确认工作台服务正在运行，再刷新页面重试。");
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

async function verifyAnalysisService() {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), HEALTH_CHECK_TIMEOUT_MS);
  try {
    const response = await fetch("/api/health", { cache: "no-store", signal: controller.signal });
    const health = await response.json();
    if (!response.ok || !health?.ok || !health.codexAvailable) {
      throw new Error("本机 Codex 服务未就绪。请确认工作台服务正在运行后再试。");
    }
    if (health.busy) throw new Error("Codex 正在处理另一项反推任务，请等待当前任务结束后再试。");
  } catch (error) {
    if (error?.name === "AbortError") throw new Error("无法在 5 秒内连接本机反推服务。请确认服务正在运行后刷新页面。");
    if (error instanceof TypeError || /failed to fetch/i.test(String(error?.message || ""))) {
      throw new Error("无法连接本机反推服务。请确认服务正在运行后刷新页面。");
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

async function apiGet(path) {
  const response = await fetch(path, { cache: "no-store" });
  let result;
  try {
    result = await response.json();
  } catch {
    throw new Error(`服务返回异常（${response.status}）。`);
  }
  if (!response.ok) throw new Error(result.error || `请求失败（${response.status}）。`);
  return result;
}

async function checkHealth() {
  try {
    const response = await fetch("/api/health", { cache: "no-store" });
    const health = await response.json();
    if (!response.ok || !health.ok || !health.codexAvailable) throw new Error("Codex unavailable");
    elements.systemStatus.className = "system-status ready";
    elements.systemStatus.lastElementChild.textContent = health.busy ? "Codex 正在运行" : "Codex 已连接";
  } catch {
    elements.systemStatus.className = "system-status error";
    elements.systemStatus.lastElementChild.textContent = "Codex 未连接";
  }
  renderAppShell();
}

function updateFormFromControls() {
  state.form.inheritText = elements.inheritText.value.trim();
  state.form.targetScene = elements.targetScene.value.trim();
  state.form.excludeText = elements.excludeText.value.trim();
  state.form.aspectRatio = elements.aspectRatio.value;
  state.form.analysisMode = ANALYSIS_MODE_OPTIONS[elements.analysisMode.value]
    ? elements.analysisMode.value
    : DEFAULT_FORM.analysisMode;
  state.form.model = MODEL_OPTIONS[elements.codexModel.value] ? elements.codexModel.value : DEFAULT_FORM.model;
  state.form.scopes = $$('#scope-grid input:checked').map((input) => input.value);
  updateDirectionMode();
  updateAnalysisModeNote();
  updateModelNote();
  persist();
}

function updateAnalysisModeNote() {
  const mode = ANALYSIS_MODE_OPTIONS[state.form.analysisMode] ? state.form.analysisMode : DEFAULT_FORM.analysisMode;
  if (elements.analysisMode) elements.analysisMode.value = mode;
  if (elements.analysisModeNote) {
    elements.analysisModeNote.textContent = ANALYSIS_MODE_OPTIONS[mode].note;
  }
}

function updateModelNote() {
  const model = MODEL_OPTIONS[state.form.model] || MODEL_OPTIONS.auto;
  elements.modelNote.textContent = model.description;
}

function renderProjectControls() {
  if (document.activeElement !== elements.projectTitle) {
    elements.projectTitle.value = state.project.title || "未命名项目";
  }
}

function normalizeWorkspace(workspace) {
  return WORKSPACE_META[workspace] ? workspace : "home";
}

function getImageWorkspaceStatus() {
  if (state.images.primary) return state.platformPrompts ? "已反推" : "已载入";
  if (state.platformPrompts) return "提示词已就绪";
  return "未载入";
}

function getVideoWorkspaceStatus() {
  const shotCount = state.video.breakdown?.shots?.length || 0;
  if (shotCount) return `${shotCount} 镜已拆`;
  if (state.video.source) return "片段已载入";
  if (state.video.restoredSource) return "等待重载";
  return "未开始";
}

function getProjectStatus() {
  if (state.project.id) {
    return state.project.updatedAt
      ? `已保存 · ${new Date(state.project.updatedAt).toLocaleDateString("zh-CN")}`
      : "已保存到本地项目库";
  }
  return "尚未保存到本地项目库";
}

function getAssetSourceLabel(asset) {
  if (asset?.cardType === "prompt-aesthetic") return "美学学习卡";
  if (asset?.sourceKind === "result") return "生成结果图";
  return "参考图资产";
}

function renderHomeRecentAssets() {
  if (!elements.homeRecentAssets) return;
  const assets = Array.isArray(state.assets) ? state.assets.slice(0, 3) : [];
  elements.homeRecentAssets.replaceChildren();
  if (assets.length === 0) {
    elements.homeRecentAssets.append(createElement("p", "home-recent-empty", "还没有资产。完成一轮反推后，把值得复用的画面存进来。"));
    return;
  }
  assets.forEach((asset) => {
    const card = createElement("button", "home-recent-asset");
    card.type = "button";
    const imageUrl = asset.shareCard?.url || asset.image?.url || "";
    if (imageUrl) {
      const preview = document.createElement("img");
      preview.src = imageUrl;
      preview.alt = asset.title || "视觉资产缩略图";
      preview.loading = "lazy";
      card.append(preview);
    }
    const copy = document.createElement("span");
    copy.append(
      createElement("span", "", getAssetSourceLabel(asset)),
      createElement("strong", "", asset.title || "未命名视觉资产"),
      createElement("small", "", asset.createdAt ? new Date(asset.createdAt).toLocaleDateString("zh-CN") : "本机资产")
    );
    card.append(copy);
    card.addEventListener("click", () => setActiveWorkspace("assets"));
    elements.homeRecentAssets.append(card);
  });
}

function renderAppShell() {
  const workspace = normalizeWorkspace(state.activeWorkspace);
  state.activeWorkspace = workspace;
  const meta = WORKSPACE_META[workspace];
  const assetCount = Array.isArray(state.assets) ? state.assets.length : 0;
  const imageStatus = getImageWorkspaceStatus();
  const videoStatus = getVideoWorkspaceStatus();

  elements.workspaceViews.forEach((view) => {
    view.hidden = view.dataset.workspaceView !== workspace;
  });
  $$('[data-workspace]').forEach((button) => {
    const isActive = button.dataset.workspace === workspace;
    button.classList.toggle("active", isActive);
    if (isActive) button.setAttribute("aria-current", "page");
    else button.removeAttribute("aria-current");
  });

  elements.homeProjectName.textContent = state.project.title || "未命名项目";
  elements.homeProjectMeta.textContent = state.images.primary
    ? `${state.platformPrompts ? "主参考图已完成反推，可继续校正或保存资产。" : "主参考图已载入，可以开始反推画面语言。"}`
    : state.platformPrompts
      ? "提示词已恢复。进入图片反推，可继续调整语义层和平台版本。"
      : "还没有载入主参考图。可以先从图片反推开始。";
  elements.homeImageStatus.textContent = imageStatus;
  elements.homeAssetCount.textContent = `${assetCount} 个`;
  elements.homeVideoStatus.textContent = videoStatus;
  renderHomeRecentAssets();

  elements.inspectorWorkspaceTitle.textContent = meta.title;
  elements.inspectorWorkspaceCopy.textContent = meta.copy;
  elements.inspectorProjectTitle.textContent = state.project.title || "未命名项目";
  elements.inspectorProjectStatus.textContent = getProjectStatus();
  elements.inspectorImageStatus.textContent = imageStatus;
  elements.inspectorAssetCount.textContent = String(assetCount);
  elements.inspectorCodexStatus.textContent = state.busy
    ? "正在处理"
    : elements.systemStatus.classList.contains("ready")
      ? "已连接"
      : "检查中";
}

function setActiveWorkspace(workspace, { persistSelection = true, scroll = true } = {}) {
  state.activeWorkspace = normalizeWorkspace(workspace);
  renderAppShell();
  if (persistSelection) persist();
  if (scroll) {
    requestAnimationFrame(() => document.getElementById("top")?.scrollIntoView({ block: "start" }));
  }
}

function renderFeedbackControls() {
  elements.revisionNote.value = state.feedback.note || "";
  $$("#revision-issues input").forEach((input) => {
    input.checked = state.feedback.issues.includes(input.value);
  });
}

function isBlankDirection(value) {
  const normalized = String(value || "").trim();
  return !normalized || /^(无|没有|无需|未指定|不指定)[。.!！]?$/.test(normalized);
}

function keepsOriginalScene(value) {
  const normalized = String(value || "").trim();
  return /保持.*(原画面|原场景|参考图)|不做.*扩写|只.*反推/.test(normalized);
}

function getDirectionMode() {
  const hasInherit = !isBlankDirection(state.form.inheritText);
  const hasTarget = !isBlankDirection(state.form.targetScene);
  const hasExclude = !isBlankDirection(state.form.excludeText);
  if (hasTarget && !keepsOriginalScene(state.form.targetScene)) return "expansion";
  if (hasInherit || hasTarget || hasExclude) return "guided";
  return "pure";
}

function updateDirectionMode() {
  const mode = getDirectionMode();
  const content = {
    pure: ["纯反推模式", "只反推参考图本身，不新增场景；三个空白项会自动按“无”处理。"],
    guided: ["定向反推模式", "保持原场景，只按你填写的继承或排除要求优化提示词。"],
    expansion: ["画面扩写模式", "先反推参考图，再按目标画面补全新的空间与内容。"],
  }[mode];
  elements.directionMode.dataset.mode = mode;
  elements.directionModeTitle.textContent = content[0];
  elements.directionModeCopy.textContent = content[1];
  if (!state.busy) {
    const quick = state.form.analysisMode === "quick";
    elements.analyzeButton.querySelector(".button-label").textContent = {
      pure: quick ? "快速反推提示词" : "直接反推参考图",
      guided: quick ? "快速按要求反推" : "按参考要求反推",
      expansion: quick ? "快速反推并扩写" : "反推并扩写目标画面",
    }[mode];
  }
}

function fillMissingDirectorRequirements() {
  const fields = [elements.inheritText, elements.targetScene, elements.excludeText];
  let filledCount = 0;
  fields.forEach((field) => {
    if (String(field.value || "").trim()) return;
    field.value = "无";
    filledCount += 1;
  });
  updateFormFromControls();
  return filledCount;
}

function setPureReverseMode() {
  [elements.inheritText, elements.targetScene, elements.excludeText].forEach((field) => {
    field.value = "无";
  });
  updateFormFromControls();
  showToast("已切换为纯反推：不会新增或扩写画面内容。");
}

function applySuggestion(button) {
  const field = document.getElementById(button.dataset.fillTarget);
  if (!field) return;
  const value = button.dataset.fillValue || "";
  const current = isBlankDirection(field.value) ? "" : field.value.trim().replace(/[；;]\s*$/, "");
  if (button.dataset.fillMode === "replace" || !current) {
    field.value = value;
  } else if (!current.includes(value)) {
    field.value = `${current}；${value}`;
  }
  field.dispatchEvent(new Event("input", { bubbles: true }));
  const aspectRatio = button.dataset.setAspectRatio;
  if (aspectRatio && COMPOSITION_FORMATS[aspectRatio]) {
    elements.aspectRatio.value = aspectRatio;
    elements.aspectRatio.dispatchEvent(new Event("change", { bubbles: true }));
  }
  if (button.dataset.outpaintPreset === "true") {
    showToast("已切换为 16:9 左右扩展：主体保持不变，左右两端只补全原场景。 ");
  }
  field.focus();
}

function populateControls() {
  elements.inheritText.value = state.form.inheritText || "";
  elements.targetScene.value = state.form.targetScene || "";
  elements.excludeText.value = state.form.excludeText || "";
  elements.aspectRatio.value = state.form.aspectRatio || "16:9";
  elements.analysisMode.value = ANALYSIS_MODE_OPTIONS[state.form.analysisMode] ? state.form.analysisMode : DEFAULT_FORM.analysisMode;
  elements.codexModel.value = MODEL_OPTIONS[state.form.model] ? state.form.model : DEFAULT_FORM.model;
  $$('#scope-grid input').forEach((input) => {
    input.checked = state.form.scopes.includes(input.value);
  });
  updateDirectionMode();
  updateAnalysisModeNote();
  updateModelNote();
  renderProjectControls();
  renderFeedbackControls();
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    if (!file.type.match(/^image\/(png|jpeg|webp)$/)) {
      reject(new Error("仅支持 PNG、JPG 和 WEBP 图片。"));
      return;
    }
    if (file.size > 15 * 1024 * 1024) {
      reject(new Error("单张图片不能超过 15MB。"));
      return;
    }
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("图片读取失败。"));
    reader.readAsDataURL(file);
  });
}

function resetAnalysisForNewPrimary() {
  state.region = null;
  state.cropMode = false;
  state.analysisSummary = "";
  state.analysisMode = null;
  state.layers = [];
  state.referencePlan = null;
  state.platformPrompts = null;
  state.warnings = [];
  state.versions = [];
  state.anchors = [];
  state.composition = createDefaultComposition();
  state.variants = [];
  state.selectedVariantId = null;
  state.revision = null;
  state.feedback = { issues: [], note: "" };
  state.images.result = null;
  state.imageAssetActions.result = "remove";
  state.activePlatform = "midjourney";
  state.promptLanguages = { ...DEFAULT_PROMPT_LANGUAGES };
  state.form.inheritText = "";
  state.form.targetScene = "";
  state.form.excludeText = "";
  elements.resultFile.value = "";
  clearRenderedAnalysisFields();
  setAnalysisFeedback();
}

function clearRenderedAnalysisFields() {
  elements.analysisSummary.textContent = "";
  elements.referencePlan.replaceChildren();
  elements.layersGrid.replaceChildren();
  elements.layerChangeCount.textContent = "0 项修改";
  elements.versionCount.textContent = "0 个版本";
  elements.anchorList.replaceChildren();
  elements.anchorCount.textContent = "0 个锚点";
  elements.variantsGrid.replaceChildren();
  elements.activeVariantStatus.hidden = true;
  elements.activeVariantStatus.textContent = "";
  [
    "#midjourney-prompt",
    "#midjourney-reference",
    "#midjourney-parameters",
    "#midjourney-negative",
    "#gpt-prompt",
    "#gpt-roles",
    "#gpt-boundary",
    "#gpt-negative",
  ].forEach((selector) => setTextAreaValue(selector, ""));
  elements.revisionResult.replaceChildren();
  elements.revisionResult.hidden = true;
  elements.warningsList.replaceChildren();
  elements.warningsPanel.hidden = true;
  elements.assetTitle.value = "";
  elements.promptLanguageNote.textContent = "";
  elements.completePromptLanguages.hidden = true;
}

async function setImage(kind, file) {
  try {
    const dataUrl = await readFileAsDataUrl(file);
    if (kind === "primary") resetAnalysisForNewPrimary();
    state.images[kind] = { dataUrl, name: file.name, type: file.type, size: file.size };
    state.imageAssetActions[kind] = "replace";
    if (kind === "primary") {
      populateControls();
    }
    if (kind === "result") state.revision = null;
    renderImages();
    renderCurrentStage();
    persist();
    if (kind === "primary") {
      showToast("已切换主参考图：旧反推结果、提示词、导演要求和结果图已清空；产品／主体参考保留。");
    }
  } catch (error) {
    showToast(error.message, true);
  }
}

function clearImage(kind) {
  state.images[kind] = null;
  state.imageAssetActions[kind] = "remove";
  if (kind === "primary") {
    resetAnalysisForNewPrimary();
    elements.primaryFile.value = "";
    populateControls();
  } else if (kind === "product") {
    elements.productFile.value = "";
  } else {
    elements.resultFile.value = "";
    state.revision = null;
  }
  renderImages();
  renderCurrentStage();
  persist();
}

function getCoverPreset() {
  return COVER_PRESETS[state.cover.preset] || COVER_PRESETS.xiaohongshu;
}

function buildCoverPrompt() {
  const preset = getCoverPreset();
  const basePrompt = state.platformPrompts?.midjourney?.promptEnglish
    || "cinematic reference-image composition with clear subject hierarchy and controlled negative space";
  const focus = `${Math.round(state.cover.focusX)}% horizontal, ${Math.round(state.cover.focusY)}% vertical`;
  return `${preset.platform} cover prompt patch\n\nEnglish:\n${basePrompt}; ${preset.aspectRatio} cover composition, ${preset.width}x${preset.height}px output, keep the focal subject near ${focus}, preserve a clean central safe area for optional title text, no watermark, no platform UI.\n\n中文：\n${preset.platform}封面，${preset.width}×${preset.height}px，${preset.aspectRatio}画幅；主体焦点约在${focus}，保留中央安全区供后期标题使用，保持参考图的光线、色彩和空间层次，不添加水印或平台界面。`;
}

function setCoverFeedback(message = "", isError = false) {
  elements.coverFeedback.textContent = message;
  elements.coverFeedback.classList.toggle("error", isError);
  elements.coverFeedback.hidden = !message;
}

function renderCoverWorkbench() {
  if (!elements.coverPreview) return;
  const preset = getCoverPreset();
  const hasPrimary = Boolean(state.images.primary?.dataUrl);
  elements.coverPresetGrid?.querySelectorAll("[data-cover-preset]").forEach((button) => {
    const active = button.dataset.coverPreset === state.cover.preset;
    button.classList.toggle("active", active);
    button.setAttribute("aria-pressed", String(active));
  });
  elements.coverFocusX.value = String(Math.round(state.cover.focusX));
  elements.coverFocusY.value = String(Math.round(state.cover.focusY));
  elements.coverFocusXValue.textContent = `${Math.round(state.cover.focusX)}%`;
  elements.coverFocusYValue.textContent = `${Math.round(state.cover.focusY)}%`;
  elements.coverPreviewTitle.textContent = preset.label;
  elements.coverPreviewSize.textContent = `${preset.width} × ${preset.height}`;
  elements.coverStage.style.aspectRatio = `${preset.width} / ${preset.height}`;
  elements.coverPreview.hidden = !hasPrimary;
  elements.coverStageEmpty.hidden = hasPrimary;
  elements.exportCover.disabled = !hasPrimary || state.busy;
  elements.copyCoverPrompt.disabled = state.busy;
  elements.coverPrompt.value = buildCoverPrompt();
  if (hasPrimary) {
    elements.coverPreview.src = state.images.primary.dataUrl;
    elements.coverPreview.style.objectPosition = `${state.cover.focusX}% ${state.cover.focusY}%`;
  } else {
    elements.coverPreview.removeAttribute("src");
  }
}

function setCoverPreset(presetId) {
  if (!COVER_PRESETS[presetId]) return;
  state.cover.preset = presetId;
  persist();
  renderCoverWorkbench();
}

function updateCoverFocus(axis, value) {
  const numericValue = Math.min(100, Math.max(0, Number(value) || 0));
  state.cover[axis] = numericValue;
  persist();
  renderCoverWorkbench();
}

function downloadDataUrl(dataUrl, filename) {
  const link = document.createElement("a");
  link.href = dataUrl;
  link.download = filename;
  document.body.append(link);
  link.click();
  link.remove();
}

async function exportCover() {
  const source = state.images.primary;
  if (!source?.dataUrl) {
    setCoverFeedback("请先上传主参考图，再导出平台封面。", true);
    return;
  }
  const preset = getCoverPreset();
  try {
    const image = await loadImageFromDataUrl(source.dataUrl);
    const sourceWidth = image.naturalWidth || image.width;
    const sourceHeight = image.naturalHeight || image.height;
    const targetRatio = preset.width / preset.height;
    const sourceRatio = sourceWidth / sourceHeight;
    let cropWidth = sourceWidth;
    let cropHeight = sourceHeight;
    let sx = 0;
    let sy = 0;
    if (sourceRatio > targetRatio) {
      cropWidth = sourceHeight * targetRatio;
      sx = (sourceWidth - cropWidth) * (state.cover.focusX / 100);
    } else if (sourceRatio < targetRatio) {
      cropHeight = sourceWidth / targetRatio;
      sy = (sourceHeight - cropHeight) * (state.cover.focusY / 100);
    }
    const canvas = document.createElement("canvas");
    canvas.width = preset.width;
    canvas.height = preset.height;
    canvas.getContext("2d").drawImage(image, sx, sy, cropWidth, cropHeight, 0, 0, preset.width, preset.height);
    downloadDataUrl(canvas.toDataURL("image/png"), `参考图反推-${preset.platform}-${preset.aspectRatio.replace(":", "x")}.png`);
    setCoverFeedback(`已导出 ${preset.label}：${preset.width} × ${preset.height} PNG。安全区虚线未写入图片。`);
  } catch (error) {
    setCoverFeedback(error?.message || "封面导出失败。", true);
  }
}

function renderImages() {
  const primary = state.images.primary;
  elements.primaryPreview.hidden = !primary;
  elements.primaryUploadButton.hidden = Boolean(primary);
  elements.primaryToolbar.hidden = !primary;
  elements.primaryStage.classList.toggle("has-image", Boolean(primary));
  if (primary) {
    elements.primaryPreview.src = primary.dataUrl;
    elements.primaryFileName.textContent = primary.name;
  } else {
    elements.primaryPreview.removeAttribute("src");
  }
  elements.emptyUploadActionLabel.textContent = primary ? "更换主参考图" : "选择主参考图";
  renderCrop();

  const product = state.images.product;
  state.hasProductImage = Boolean(product);
  elements.productPreview.hidden = !product;
  elements.productRemove.hidden = !product;
  elements.productDropzone.classList.toggle("has-image", Boolean(product));
  const glyph = elements.productUploadButton.querySelector(".upload-glyph");
  glyph.hidden = Boolean(product);
  if (product) {
    elements.productPreview.src = product.dataUrl;
    elements.productTitle.textContent = "产品／主体参考已添加";
    elements.productFileName.textContent = product.name;
  } else {
    elements.productPreview.removeAttribute("src");
    elements.productTitle.textContent = "添加产品／主体参考";
    elements.productFileName.textContent = "可选 · 不继承背景和构图";
  }

  const result = state.images.result;
  elements.resultPreview.hidden = !result;
  elements.resultRemove.hidden = !result;
  elements.resultDropzone.classList.toggle("has-image", Boolean(result));
  if (result) {
    elements.resultPreview.src = result.dataUrl;
    elements.resultUploadCopy.innerHTML = `<strong>已上传：${escapeHtml(result.name)}</strong><small>可用于偏差修正与项目保存</small>`;
  } else {
    elements.resultPreview.removeAttribute("src");
    elements.resultUploadCopy.innerHTML = "<strong>上传生成结果图</strong><small>用于与主参考图比对</small>";
  }
  renderCompositionStage();
  renderCoverWorkbench();
  renderRevision();
  renderAssetControls();
  renderAppShell();
}

function renderAssetControls() {
  const hasPrimary = Boolean(state.images.primary);
  const hasResult = Boolean(state.images.result);
  elements.savePrimaryAsset.disabled = state.busy || !hasPrimary;
  elements.saveResultAsset.disabled = state.busy || !hasResult;
  elements.savePrimaryAsset.title = hasPrimary ? "为当前主参考图生成独立提示词并存入资产库" : "请先上传主参考图";
  elements.saveResultAsset.title = hasResult ? "为当前生成结果图生成独立提示词并存入资产库" : "请先上传生成结果图";
  if (!state.busy && !hasPrimary && !hasResult && state.layers.length > 0) {
    elements.assetLibraryNote.textContent = "当前提示词仍可继续编辑，但页面没有已加载的图片。请重新上传想入库的主参考图／生成结果图，或打开一个已保存图片的项目。";
  }
}

function formatVideoTime(seconds) {
  const safeSeconds = Math.max(0, Number(seconds) || 0);
  const minutes = Math.floor(safeSeconds / 60);
  const remainder = safeSeconds - minutes * 60;
  return `${String(minutes).padStart(2, "0")}:${remainder.toFixed(1).padStart(4, "0")}`;
}

let videoProgressTimer;
let videoProgressHealthTimer;

function formatProgressElapsed(seconds) {
  const safeSeconds = Math.max(0, Math.floor(Number(seconds) || 0));
  if (safeSeconds < 60) return `${safeSeconds} 秒`;
  return `${Math.floor(safeSeconds / 60)} 分 ${safeSeconds % 60} 秒`;
}

function estimateVideoProgress(elapsedSeconds) {
  const elapsed = Math.max(0, Number(elapsedSeconds) || 0);
  if (elapsed < 3) {
    return {
      percent: 8 + Math.round(elapsed * 2),
      stage: "提交关键帧",
      detail: "正在把已选关键帧发送到本机反推服务。",
    };
  }
  if (elapsed < 10) {
    return {
      percent: 14 + Math.round((elapsed - 3) * 1.2),
      stage: "等待服务接收",
      detail: "请求已发出，正在等待本机 Codex 接收。",
    };
  }
  if (elapsed < 45) {
    return {
      percent: 23 + Math.round((elapsed - 10) * 0.72),
      stage: "读取关键帧",
      detail: "Codex 正在读取画面证据，提取主体、构图和镜头信息。",
    };
  }
  if (elapsed < 140) {
    return {
      percent: 48 + Math.round((elapsed - 45) * 0.32),
      stage: "拆分镜头关系",
      detail: "正在判断镜头变化、空间连续性和可确认的运动。",
    };
  }
  if (elapsed < 260) {
    return {
      percent: 78 + Math.round((elapsed - 140) * 0.075),
      stage: "编译双语提示词",
      detail: "正在生成静态图像提示词、动态视频提示词与 LibTV 字段。",
    };
  }
  return {
    percent: 92,
    stage: "等待最终结果",
    detail: "分析仍在运行；超过 5 分钟会自动停止并显示具体错误。",
  };
}

function stopVideoProgressTimers() {
  clearInterval(videoProgressTimer);
  clearInterval(videoProgressHealthTimer);
  videoProgressTimer = null;
  videoProgressHealthTimer = null;
}

function renderVideoProgress() {
  const progress = state.videoProgress;
  if (!elements.videoAnalysisProgress) return;
  elements.videoAnalysisProgress.hidden = !progress.visible;
  if (!progress.visible) return;

  const percent = Math.round(clampNumber(Number(progress.percent) || 0, 0, 100));
  elements.videoAnalysisProgress.classList.toggle("active", progress.active);
  elements.videoAnalysisProgress.classList.toggle("error", progress.status === "error");
  elements.videoAnalysisProgress.classList.toggle("complete", progress.status === "complete");
  elements.videoProgressTitle.textContent = progress.stage || "处理中";
  elements.videoProgressPercent.textContent = `${percent}%`;
  elements.videoProgressBar.style.width = `${percent}%`;
  elements.videoProgressDetail.textContent = progress.detail || "—";
  elements.videoProgressElapsed.textContent = progress.startedAt
    ? `已用 ${formatProgressElapsed((Date.now() - progress.startedAt) / 1000)}`
    : "—";
  elements.videoProgressTrack.setAttribute("aria-valuenow", String(percent));
  elements.videoProgressTrack.setAttribute("aria-valuetext", `${progress.stage || "处理中"}，${percent}%`);
  elements.videoProgressNote.textContent = progress.status === "error"
    ? "本次请求已停止。请根据上方错误修改关键帧或模型后重试。"
    : progress.status === "complete"
      ? "本次拉片已完成，结果已写入下方逐镜分镜区域。"
      : "模型分析阶段没有实时百分比接口，进度会按已确认的服务阶段和等待时间估算；如果请求失败，具体原因会保留在这里。";
}

function resetVideoProgress() {
  stopVideoProgressTimers();
  state.videoProgress = createDefaultVideoProgress();
  renderVideoProgress();
}

function tickVideoProgress() {
  const progress = state.videoProgress;
  if (!progress.active || !progress.startedAt) return;
  const estimate = estimateVideoProgress((Date.now() - progress.startedAt) / 1000);
  const serverPercent = Number.isFinite(Number(progress.serverPercent)) ? Number(progress.serverPercent) : 0;
  state.videoProgress = {
    ...progress,
    percent: Math.min(92, Math.max(progress.percent, serverPercent, estimate.percent)),
    stage: progress.serverStage || estimate.stage,
    detail: progress.serverDetail || `${estimate.detail} 已选择 ${progress.frameCount} 张关键帧。`,
  };
  renderVideoProgress();
  updateVideoStatus();
}

async function pollVideoAnalysisHealth() {
  if (!state.videoProgress.active) return;
  try {
    const response = await fetch("/api/health", { cache: "no-store" });
    const health = await response.json();
    if (!state.videoProgress.active) return;
    const run = health?.run;
    if (health?.busy && (!run?.kind || run.kind === "video")) {
      state.videoProgress = {
        ...state.videoProgress,
        serverConnected: true,
        serverPercent: Number.isFinite(Number(run.percent)) ? Number(run.percent) : null,
        serverStage: run.stage || "Codex 正在分析",
        serverDetail: run.detail || "本机 Codex 已接收请求，正在处理。",
      };
    } else if (state.videoProgress.serverConnected) {
      state.videoProgress = {
        ...state.videoProgress,
        serverPercent: Math.max(Number(state.videoProgress.serverPercent) || 0, 97),
        serverStage: "等待工作台接收结果",
        serverDetail: "本机 Codex 已完成分析，正在等待工作台整理结果。",
      };
    } else if (health?.codexAvailable === false) {
      state.videoProgress = {
        ...state.videoProgress,
        serverDetail: "本机 Codex 暂未就绪，仍在等待请求结果；若失败会显示具体原因。",
      };
    }
    renderVideoProgress();
    updateVideoStatus();
  } catch {
    if (!state.videoProgress.active) return;
    state.videoProgress = {
      ...state.videoProgress,
      serverDetail: "暂时无法读取服务状态，仍在等待本次请求；若连接中断会显示错误。",
    };
    renderVideoProgress();
  }
}

function startVideoProgress(frameCount) {
  stopVideoProgressTimers();
  state.videoProgress = {
    ...createDefaultVideoProgress(),
    visible: true,
    active: true,
    status: "running",
    percent: 4,
    stage: "准备逐镜拉片",
    detail: `已选择 ${frameCount} 张关键帧，正在检查本机 Codex 服务。`,
    startedAt: Date.now(),
    frameCount,
  };
  renderVideoProgress();
  updateVideoStatus();
  videoProgressTimer = setInterval(tickVideoProgress, 1000);
  videoProgressHealthTimer = setInterval(() => { void pollVideoAnalysisHealth(); }, 1500);
  void pollVideoAnalysisHealth();
}

function completeVideoProgress(detail) {
  stopVideoProgressTimers();
  state.videoProgress = {
    ...state.videoProgress,
    visible: true,
    active: false,
    status: "complete",
    percent: 100,
    stage: "拉片完成",
    detail: detail || "已生成逐镜分镜与双语提示词。",
  };
  renderVideoProgress();
  updateVideoStatus();
}

function failVideoProgress(message) {
  stopVideoProgressTimers();
  state.videoProgress = {
    ...state.videoProgress,
    visible: true,
    active: false,
    status: "error",
    stage: "拉片失败",
    detail: message || "未能完成视频拉片。",
  };
  renderVideoProgress();
  updateVideoStatus();
}

function getVideoSourceMetadata() {
  return state.video.source || state.video.restoredSource || null;
}

function getVideoClipRange() {
  const metadata = getVideoSourceMetadata();
  const duration = Math.max(0, Number(metadata?.duration) || 0);
  if (!duration) return { duration: 0, start: 0, end: 0 };
  const minimumGap = Math.min(MIN_VIDEO_SEGMENT_SECONDS, duration);
  let start = clampNumber(Number(state.video.clipStart), 0, duration);
  let end = clampNumber(
    Number.isFinite(Number(state.video.clipEnd)) ? Number(state.video.clipEnd) : duration,
    0,
    duration
  );
  if (end - start < minimumGap) {
    if (end < minimumGap) {
      end = minimumGap;
      start = 0;
    } else {
      start = Math.max(0, end - minimumGap);
    }
  }
  return { duration, start, end };
}

function isVideoTimeInClip(seconds) {
  const range = getVideoClipRange();
  return range.duration > 0 && Number(seconds) >= range.start - 0.02 && Number(seconds) <= range.end + 0.02;
}

function renderVideoClipControls() {
  const range = getVideoClipRange();
  const hasSource = Boolean(state.video.source && range.duration);
  const start = range.start;
  const end = range.end;
  const clipLength = Math.max(0, end - start);
  const isFullVideo = range.duration > 0 && start <= 0.01 && end >= range.duration - 0.01;
  [elements.videoClipStart, elements.videoClipEnd, elements.videoClipStartSeconds, elements.videoClipEndSeconds, elements.setVideoClipStart, elements.setVideoClipEnd, elements.resetVideoClip].forEach((control) => {
    if (!control) return;
    control.disabled = state.busy || !hasSource;
  });
  if (elements.videoClipStart) {
    elements.videoClipStart.max = String(range.duration || 1);
    elements.videoClipStart.value = String(start);
  }
  if (elements.videoClipEnd) {
    elements.videoClipEnd.max = String(range.duration || 1);
    elements.videoClipEnd.value = String(end);
  }
  if (elements.videoClipStartSeconds) {
    elements.videoClipStartSeconds.max = String(range.duration || 1);
    elements.videoClipStartSeconds.value = start.toFixed(2);
  }
  if (elements.videoClipEndSeconds) {
    elements.videoClipEndSeconds.max = String(range.duration || 1);
    elements.videoClipEndSeconds.value = end.toFixed(2);
  }
  if (elements.videoClipLabel) {
    elements.videoClipLabel.textContent = hasSource
      ? `分析范围：${formatVideoTime(start)} — ${formatVideoTime(end)} · ${clipLength.toFixed(1)} 秒${isFullVideo ? " · 整段" : " · 仅此片段"}`
      : "分析范围：载入视频后设置入点和出点";
  }
}

function updateVideoStatus() {
  const source = state.video.source;
  const metadata = getVideoSourceMetadata();
  const range = getVideoClipRange();
  const selectedCount = state.video.frames.filter((frame) => frame.selected !== false && isVideoTimeInClip(frame.time)).length;
  if (state.videoProgress.visible && state.videoProgress.active) {
    elements.videoStatus.textContent = `正在拉片 · ${Math.round(state.videoProgress.percent)}% · ${selectedCount} 帧`;
    return;
  }
  if (state.videoProgress.status === "error" && state.videoProgress.visible) {
    elements.videoStatus.textContent = "拉片失败 · 请查看错误并重试";
    return;
  }
  if (state.videoProgress.status === "complete" && state.videoProgress.visible && state.video.breakdown) {
    elements.videoStatus.textContent = `拉片完成 · ${state.video.breakdown.shots?.length || 0} 个镜头 · ${selectedCount} 帧`;
    return;
  }
  elements.videoStatus.textContent = source
    ? `${formatVideoTime(source.duration)} · ${selectedCount} 帧待分析 · 片段 ${formatVideoTime(range.start)}—${formatVideoTime(range.end)}`
    : metadata
      ? "上次拉片已恢复 · 重新选择视频可继续取帧"
      : "尚未载入视频";
}

function setVideoClipValue(kind, rawValue, { feedback = false } = {}) {
  const range = getVideoClipRange();
  if (!range.duration || !state.video.source) return;
  const minimumGap = Math.min(MIN_VIDEO_SEGMENT_SECONDS, range.duration);
  let start = range.start;
  let end = range.end;
  const numericValue = Number(rawValue);
  const value = Number.isFinite(numericValue)
    ? clampNumber(numericValue, 0, range.duration)
    : kind === "start" ? start : end;
  if (kind === "start") {
    start = Math.min(value, end - minimumGap);
  } else {
    end = Math.max(value, start + minimumGap);
  }
  state.video.clipStart = Number(start.toFixed(3));
  state.video.clipEnd = Number(end.toFixed(3));
  invalidateVideoBreakdown();
  resetVideoProgress();
  persist();
  renderVideoClipControls();
  updateVideoStatus();
  renderVideoFrames();
  renderVideoResults();
  if (feedback) {
    setVideoFeedback(`分析片段已设置为 ${formatVideoTime(start)} — ${formatVideoTime(end)}。自动取帧和逐镜拉片只使用此范围。`);
  }
}

function setVideoClipFromCurrent(kind) {
  if (!state.video.source) return;
  const currentTime = Number(elements.videoPlayer.currentTime) || 0;
  setVideoClipValue(kind, currentTime, { feedback: true });
}

function resetVideoClip() {
  const range = getVideoClipRange();
  if (!range.duration || !state.video.source) return;
  state.video.clipStart = 0;
  state.video.clipEnd = range.duration;
  invalidateVideoBreakdown();
  resetVideoProgress();
  persist();
  renderVideoClipControls();
  updateVideoStatus();
  renderVideoFrames();
  renderVideoResults();
  setVideoFeedback("已恢复整段视频范围。自动取帧和逐镜拉片会覆盖整个视频。 ");
}

function setVideoFeedback(message = "", isError = false) {
  elements.videoAnalysisFeedback.textContent = message;
  elements.videoAnalysisFeedback.classList.toggle("error", isError);
  elements.videoAnalysisFeedback.hidden = !message;
}

function updateVideoSettingsFromControls() {
  state.video.directorNote = elements.videoDirectorNote.value.trim();
  state.video.exclusions = elements.videoExclusions.value.trim();
  persist();
}

function isSupportedVideoFile(file) {
  const type = String(file?.type || "").toLowerCase();
  const extension = String(file?.name || "").toLowerCase().match(/\.(mp4|mov|webm|ogv)$/)?.[1];
  return ["video/mp4", "video/webm", "video/quicktime", "video/ogg"].includes(type) || Boolean(extension);
}

function revokeCurrentVideoUrl() {
  const objectUrl = state.video.source?.objectUrl;
  if (objectUrl) URL.revokeObjectURL(objectUrl);
}

function invalidateVideoBreakdown() {
  state.video.breakdown = null;
}

function makeVideoFrameId() {
  return globalThis.crypto?.randomUUID?.() || `frame-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function renderVideoTimeline() {
  const source = state.video.source;
  const duration = Number(source?.duration) || 0;
  const currentTime = Math.min(Math.max(0, Number(elements.videoPlayer.currentTime) || 0), duration || 0);
  elements.videoTimeline.disabled = !source || state.busy;
  elements.videoTimeline.max = String(duration || 1);
  elements.videoTimeline.value = String(currentTime);
  elements.videoCurrentTime.textContent = formatVideoTime(currentTime);
  elements.videoDuration.textContent = formatVideoTime(duration);
}

function renderVideoFrames() {
  const frames = Array.isArray(state.video.frames) ? state.video.frames : [];
  const selectedCount = frames.filter((frame) => frame.selected !== false && isVideoTimeInClip(frame.time)).length;
  elements.videoFrameCount.textContent = `${selectedCount} / ${MAX_VIDEO_FRAMES} 已选`;
  elements.videoFrameGrid.replaceChildren();
  if (frames.length === 0) {
    elements.videoFrameGrid.append(createElement("p", "video-frames-empty", state.video.source
      ? "拖动时间轴后可采集当前帧，或先用“自动取 6 帧”建立初始证据。"
      : "载入视频后，可先自动取帧；每一帧都可手动取消、删除或作为图片 1。"));
    return;
  }
  frames.forEach((frame) => {
    const inClip = isVideoTimeInClip(frame.time);
    const selected = frame.selected !== false && inClip;
    const card = createElement("article", `video-frame-card${selected ? " selected" : " muted"}${inClip ? "" : " out-of-clip"}`);
    const thumbnail = createElement("button", "video-frame-thumbnail");
    thumbnail.type = "button";
    thumbnail.setAttribute("aria-pressed", String(selected));
    thumbnail.title = !inClip
      ? "这帧在分析片段外，不会发送；请调整片段范围"
      : frame.selected === false ? "重新选入本次拉片" : "取消选入本次拉片";
    const image = document.createElement("img");
    image.src = frame.dataUrl;
    image.alt = `${formatVideoTime(frame.time)} 的关键帧`;
    thumbnail.append(image);
    thumbnail.addEventListener("click", () => {
      if (state.busy) return;
      if (!isVideoTimeInClip(frame.time)) {
        setVideoFeedback("这张关键帧位于当前分析片段之外，不会发送给 Codex；请调整片段入点／出点。", true);
        return;
      }
      frame.selected = frame.selected === false;
      invalidateVideoBreakdown();
      persist();
      renderVideoFrames();
      renderVideoResults();
    });

    const meta = createElement("div", "video-frame-meta");
    meta.append(
      createElement("strong", "", formatVideoTime(frame.time)),
      createElement("small", "", !inClip ? "片段外 · 不分析" : frame.selected === false ? "未选入" : "已选入")
    );
    const controls = createElement("div", "video-frame-card-actions");
    const useAsPrimary = createElement("button", "", "作为图片 1");
    useAsPrimary.type = "button";
    useAsPrimary.disabled = state.busy;
    useAsPrimary.addEventListener("click", () => useVideoFrameAsPrimary(frame));
    const remove = createElement("button", "danger", "删除");
    remove.type = "button";
    remove.disabled = state.busy;
    remove.addEventListener("click", () => {
      state.video.frames = state.video.frames.filter((candidate) => candidate.id !== frame.id);
      invalidateVideoBreakdown();
      persist();
      renderVideoFrames();
      renderVideoResults();
    });
    controls.append(useAsPrimary, remove);
    card.append(thumbnail, meta, controls);
    elements.videoFrameGrid.append(card);
  });
}

function renderVideo() {
  const source = state.video.source;
  const metadata = getVideoSourceMetadata();
  const restored = !source && metadata;
  elements.videoPlayerWrap.hidden = !source;
  elements.videoUploadButton.classList.toggle("has-video", Boolean(source));
  elements.videoFileName.textContent = source?.name || metadata?.name || "未选择视频";
  const dimensions = metadata?.width && metadata?.height ? `${metadata.width} × ${metadata.height}` : "尺寸待加载";
  elements.videoMeta.textContent = metadata ? `${formatVideoTime(metadata.duration)} · ${dimensions}${restored ? " · 已恢复记录" : ""}` : "—";
  updateVideoStatus();
  elements.videoDirectorNote.value = state.video.directorNote || "";
  elements.videoExclusions.value = state.video.exclusions || "";
  elements.captureCurrentFrame.disabled = state.busy || !source;
  elements.useCurrentFrameAsPrimary.disabled = state.busy || !source;
  elements.sampleVideoFrames.disabled = state.busy || !source;
  elements.clearVideoFrames.disabled = state.busy || state.video.frames.length === 0;
  elements.clearVideoReport.disabled = state.busy || !state.video.breakdown;
  renderVideoClipControls();
  renderVideoTimeline();
  renderVideoFrames();
  renderVideoProgress();
  renderVideoResults();
  renderAppShell();
}

function renderVideoResults() {
  const report = state.video.breakdown;
  elements.videoResults.hidden = !report;
  if (!report) {
    elements.videoSummary.textContent = "";
    elements.videoContinuity.replaceChildren();
    elements.videoShotList.replaceChildren();
    elements.videoWarningsList.replaceChildren();
    elements.videoWarnings.hidden = true;
    return;
  }
  elements.videoSummary.textContent = report.summary || "已按关键帧整理逐镜拉片。";
  $$("[data-video-language]").forEach((button) => {
    button.setAttribute("aria-pressed", String(button.dataset.videoLanguage === state.video.promptLanguage));
  });

  elements.videoContinuity.replaceChildren();
  const continuity = Array.isArray(report.styleContinuity) ? report.styleContinuity.filter(Boolean) : [];
  if (continuity.length) {
    const title = createElement("strong", "", "跨镜连续性锁定");
    const list = createElement("div", "video-continuity-list");
    continuity.forEach((item) => list.append(createElement("span", "", item)));
    elements.videoContinuity.append(title, list);
  }

  elements.videoShotList.replaceChildren();
  (Array.isArray(report.shots) ? report.shots : []).forEach((shot, index) => {
    const card = createElement("article", "video-shot-card");
    const head = createElement("header", "video-shot-head");
    const marker = createElement("span", "video-shot-number", String(index + 1).padStart(2, "0"));
    const title = createElement("div", "video-shot-title");
    title.append(
      createElement("h4", "", shot.title || `镜头 ${index + 1}`),
      createElement("p", "", `${formatVideoTime(shot.startTime)} — ${formatVideoTime(shot.endTime)} · ${Math.max(0, Number(shot.endTime) - Number(shot.startTime)).toFixed(1)} 秒`)
    );
    head.append(marker, title);
    const factual = createElement("p", "video-shot-description", shot.visualDescription || "无法确认");
    const fieldGrid = createElement("dl", "video-shot-fields");
    [
      ["叙事内容", shot.narrative],
      ["景别", shot.shotSize],
      ["摄影机角度", shot.cameraAngle],
      ["摄影机运动", shot.cameraMovement],
      ["焦距与景深", shot.lensAndDepth],
      ["光线", shot.lighting],
      ["背景音乐", shot.music],
      ["人声／音效", shot.sound],
      ["衔接", shot.transition],
    ].forEach(([label, value]) => {
      const group = createElement("div", "");
      group.append(createElement("dt", "", label), createElement("dd", "", value || "无法确认"));
      fieldGrid.append(group);
    });
    const lock = createElement("div", "video-shot-lock");
    lock.append(
      createElement("strong", "", "连续性锁定"),
      createElement("p", "", shot.continuityLock || "保持相邻镜头的已确认视觉连续性。"),
      createElement("strong", "", "本镜排除"),
      createElement("p", "", shot.exclusions || "不新增未确认内容。")
    );
    const prompts = createElement("div", "video-shot-prompts");
    const language = state.video.promptLanguage === "en" ? "English" : "中文";
    [
      ["静态图像提示词", shot[`imagePrompt${language}`]],
      ["动态视频提示词", shot[`videoPrompt${language}`]],
    ].forEach(([label, prompt]) => {
      const block = createElement("section", "video-shot-prompt");
      const promptHead = createElement("div", "video-shot-prompt-head");
      promptHead.append(createElement("strong", "", `${label} · ${language}`));
      const copy = createElement("button", "", "复制");
      copy.type = "button";
      copy.addEventListener("click", () => copyText(prompt || "", `${label}已复制。`));
      promptHead.append(copy);
      const promptText = document.createElement("textarea");
      promptText.rows = 5;
      promptText.readOnly = true;
      promptText.value = prompt || "未生成该语言版本。";
      block.append(promptHead, promptText);
      prompts.append(block);
    });
    card.append(head, factual, fieldGrid, lock, prompts);
    elements.videoShotList.append(card);
  });

  const warnings = Array.isArray(report.warnings) ? report.warnings.filter(Boolean) : [];
  elements.videoWarnings.hidden = warnings.length === 0;
  elements.videoWarningsList.replaceChildren();
  warnings.forEach((warning) => elements.videoWarningsList.append(createElement("li", "", warning)));
}

function waitForVideoReady() {
  const player = elements.videoPlayer;
  if (player.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const cleanup = () => {
      player.removeEventListener("loadeddata", handleReady);
      player.removeEventListener("error", handleError);
    };
    const handleReady = () => {
      cleanup();
      resolve();
    };
    const handleError = () => {
      cleanup();
      reject(new Error("浏览器无法解码这个视频。请先转成 H.264 MP4 或 WEBM 再试。"));
    };
    player.addEventListener("loadeddata", handleReady, { once: true });
    player.addEventListener("error", handleError, { once: true });
  });
}

function seekVideoTo(seconds) {
  const player = elements.videoPlayer;
  const duration = Number(state.video.source?.duration) || 0;
  const target = Math.min(Math.max(0, Number(seconds) || 0), duration);
  if (Math.abs(player.currentTime - target) < 0.02 && player.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
    return Promise.resolve();
  }
  return new Promise((resolve, reject) => {
    let timeout;
    const cleanup = () => {
      clearTimeout(timeout);
      player.removeEventListener("seeked", handleSeeked);
      player.removeEventListener("error", handleError);
    };
    const handleSeeked = () => {
      cleanup();
      resolve();
    };
    const handleError = () => {
      cleanup();
      reject(new Error("视频定位失败，请重新载入该视频后再取帧。"));
    };
    timeout = setTimeout(() => {
      cleanup();
      reject(new Error("视频定位超过 5 秒，请换一个可在浏览器播放的视频。"));
    }, 5000);
    player.addEventListener("seeked", handleSeeked, { once: true });
    player.addEventListener("error", handleError, { once: true });
    player.currentTime = target;
  });
}

async function captureVideoFrameAt(seconds, { render = true } = {}) {
  const source = state.video.source;
  if (!source) throw new Error("请先载入一个本地视频。");
  if (state.video.frames.length >= MAX_VIDEO_FRAMES) {
    throw new Error(`关键帧最多保留 ${MAX_VIDEO_FRAMES} 张。请删除不需要的帧后再采集。`);
  }
  await waitForVideoReady();
  await seekVideoTo(seconds);
  const player = elements.videoPlayer;
  if (!isVideoTimeInClip(player.currentTime)) {
    const range = getVideoClipRange();
    throw new Error(`当前时间 ${formatVideoTime(player.currentTime)} 不在分析片段 ${formatVideoTime(range.start)} — ${formatVideoTime(range.end)} 内，请先调整时间轴或片段范围。`);
  }
  const duplicate = state.video.frames.find((frame) => Math.abs(frame.time - player.currentTime) < 0.06);
  if (duplicate) {
    duplicate.selected = true;
    if (render) renderVideo();
    return duplicate;
  }
  const sourceWidth = player.videoWidth || source.width;
  const sourceHeight = player.videoHeight || source.height;
  if (!sourceWidth || !sourceHeight) throw new Error("当前视频没有可读取的画面尺寸。请等待视频载入完成后重试。");
  const frameWidth = Math.min(1600, sourceWidth);
  const canvas = document.createElement("canvas");
  canvas.width = frameWidth;
  canvas.height = Math.max(1, Math.round(sourceHeight * (frameWidth / sourceWidth)));
  const context = canvas.getContext("2d");
  context.drawImage(player, 0, 0, canvas.width, canvas.height);
  const frame = {
    id: makeVideoFrameId(),
    time: Number(player.currentTime.toFixed(3)),
    dataUrl: canvas.toDataURL("image/jpeg", 0.88),
    selected: true,
  };
  state.video.frames = [...state.video.frames, frame].sort((left, right) => left.time - right.time);
  invalidateVideoBreakdown();
  if (!state.busy) resetVideoProgress();
  if (render) {
    persist();
    renderVideo();
  }
  return frame;
}

async function setVideoSource(file) {
  if (!isSupportedVideoFile(file)) {
    showToast("仅支持 MP4、MOV、WEBM 或 OGV 视频。", true);
    return;
  }
  if (file.size > MAX_VIDEO_FILE_BYTES) {
    showToast("本地视频不能超过 250MB。请先裁剪或压缩后再取帧。", true);
    return;
  }
  revokeCurrentVideoUrl();
  const objectUrl = URL.createObjectURL(file);
  state.video.source = {
    objectUrl,
    name: file.name || "未命名本地视频",
    type: file.type || "video/*",
    size: file.size,
    duration: 0,
    width: 0,
    height: 0,
  };
  state.video.restoredSource = null;
  state.video.frames = [];
  state.video.clipStart = 0;
  state.video.clipEnd = null;
  invalidateVideoBreakdown();
  resetVideoProgress();
  elements.videoPlayer.src = objectUrl;
  elements.videoPlayer.load();
  renderVideo();
  persist();
  setVideoFeedback("视频已载入浏览器，等待读取时长与尺寸。请先在“分析片段”里设置入点和出点，再自动取帧或手动定位。 ");
}

function useVideoFrameAsPrimary(frame) {
  if (!frame?.dataUrl) return;
  resetAnalysisForNewPrimary();
  const sourceName = state.video.source?.name || getVideoSourceMetadata()?.name || "视频关键帧";
  state.images.primary = {
    dataUrl: frame.dataUrl,
    name: `${sourceName} · ${formatVideoTime(frame.time)}.jpg`,
    type: "image/jpeg",
    size: Math.round(frame.dataUrl.length * 0.75),
  };
  state.imageAssetActions.primary = "replace";
  elements.primaryFile.value = "";
  populateControls();
  renderImages();
  renderCurrentStage();
  persist();
  showToast("已把该关键帧设为图片 1；旧图片反推结果已清空，视频关键帧仍保留。 ");
  elements.primaryDropzone.scrollIntoView({ behavior: "smooth", block: "start" });
}

async function captureCurrentVideoFrame() {
  try {
    const frame = await captureVideoFrameAt(elements.videoPlayer.currentTime);
    setVideoFeedback(`已采集 ${formatVideoTime(frame.time)} 的关键帧。`);
  } catch (error) {
    showToast(error.message, true);
    setVideoFeedback(error.message, true);
  }
}

async function useCurrentVideoFrameAsPrimary() {
  try {
    const frame = await captureVideoFrameAt(elements.videoPlayer.currentTime);
    useVideoFrameAsPrimary(frame);
  } catch (error) {
    showToast(error.message, true);
    setVideoFeedback(error.message, true);
  }
}

async function sampleVideoFrames() {
  const source = state.video.source;
  if (!source) {
    showToast("请先载入一个本地视频。", true);
    return;
  }
  if (state.video.frames.length > 0) {
    const message = "已有关键帧。为避免覆盖手动选择，请先点击“清空关键帧”，再自动取帧。";
    showToast(message, true);
    setVideoFeedback(message, true);
    return;
  }
  const player = elements.videoPlayer;
  const wasPlaying = !player.paused;
  const previousTime = player.currentTime;
  player.pause();
  elements.sampleVideoFrames.disabled = true;
  elements.sampleVideoFrames.textContent = "正在取帧…";
  try {
    await waitForVideoReady();
    const duration = Number(source.duration) || Number(player.duration);
    if (!duration) throw new Error("视频时长还未准备好，请稍候再试。 ");
    const clip = getVideoClipRange();
    if (clip.end - clip.start < MIN_VIDEO_SEGMENT_SECONDS) {
      throw new Error(`分析片段至少需要 ${MIN_VIDEO_SEGMENT_SECONDS.toFixed(1)} 秒，请先调整入点和出点。`);
    }
    const count = 6;
    const padding = Math.min(0.2, (clip.end - clip.start) * 0.04);
    const first = Math.min(clip.end, clip.start + padding);
    const last = Math.max(first, clip.end - padding);
    for (let index = 0; index < count; index += 1) {
      const time = first + (last - first) * (index / Math.max(1, count - 1));
      await captureVideoFrameAt(time, { render: false });
    }
    await seekVideoTo(previousTime);
    persist();
    renderVideo();
    setVideoFeedback(`已在 ${formatVideoTime(clip.start)} — ${formatVideoTime(clip.end)} 片段内自动取 6 帧。请取消不需要的帧，或补采真正的转场和关键动作。 `);
  } catch (error) {
    showToast(error.message, true);
    setVideoFeedback(error.message, true);
  } finally {
    elements.sampleVideoFrames.textContent = "自动取 6 帧";
    renderVideo();
    if (wasPlaying) player.play().catch(() => {});
  }
}

function clearVideoFrames() {
  if (state.video.frames.length === 0) return;
  state.video.frames = [];
  invalidateVideoBreakdown();
  resetVideoProgress();
  persist();
  renderVideo();
  setVideoFeedback("关键帧已清空，旧的逐镜结果也已撤销。 ");
}

function clearVideoReport() {
  if (!state.video.breakdown) return;
  state.video.breakdown = null;
  resetVideoProgress();
  if (!state.video.source) state.video.restoredSource = null;
  persist();
  renderVideo();
  setVideoFeedback("拉片结果已清空。重新载入视频并选择关键帧后，可开始新的逐镜分析。 ");
}

function buildVideoAnalysisPayload() {
  updateVideoSettingsFromControls();
  const source = state.video.source;
  const clip = getVideoClipRange();
  return {
    video: source ? {
      name: source.name,
      duration: source.duration,
      width: source.width,
      height: source.height,
    } : null,
    frames: state.video.frames
      .filter((frame) => frame.selected !== false && isVideoTimeInClip(frame.time))
      .map((frame) => ({ time: frame.time, image: frame.dataUrl })),
    clipStart: clip.start,
    clipEnd: clip.end,
    directorNote: state.video.directorNote,
    exclusions: state.video.exclusions,
    aspectRatio: state.form.aspectRatio,
    model: state.form.model,
  };
}

function validateVideoAnalysisPayload(payload) {
  if (!payload.video?.duration) return "请先载入完成本地视频，再开始拉片。";
  if (payload.clipEnd - payload.clipStart < MIN_VIDEO_SEGMENT_SECONDS) {
    return `分析片段至少需要 ${MIN_VIDEO_SEGMENT_SECONDS.toFixed(1)} 秒，请重新设置入点和出点。`;
  }
  if (payload.frames.length < 2) return "至少选择 2 张关键帧，才能判断镜头之间的变化。";
  if (payload.frames.length > MAX_VIDEO_FRAMES) return `一次最多分析 ${MAX_VIDEO_FRAMES} 张关键帧。`;
  return "";
}

async function analyzeVideo() {
  if (state.busy || state.videoProgress.active) return;
  const payload = buildVideoAnalysisPayload();
  const validationError = validateVideoAnalysisPayload(payload);
  if (validationError) {
    showToast(validationError, true);
    setVideoFeedback(validationError, true);
    return;
  }
  startVideoProgress(payload.frames.length);
  setBusy(true, "video");
  elements.analyzeVideo.firstChild.textContent = "正在逐镜拉片… ";
  setVideoFeedback("正在检查本机 Codex 服务…");
  try {
    await verifyAnalysisService();
  } catch (error) {
    const message = error?.message || "无法连接本机反推服务。";
    failVideoProgress(message);
    showToast(message, true);
    setVideoFeedback(message, true);
    elements.analyzeVideo.firstChild.textContent = "开始逐镜拉片 ";
    setBusy(false, "video");
    return;
  }
  setVideoFeedback(`已发送 ${payload.frames.length} 张关键帧，正在拆分镜头与双语提示词。关键帧较多时会需要一些时间。`);
  try {
    const result = await apiRequest("/api/video/analyze", payload);
    state.video.breakdown = { ...result, aspectRatio: result.aspectRatio || payload.aspectRatio };
    persist();
    renderVideoResults();
    completeVideoProgress(`已整理 ${result.shots?.length || 0} 个镜头，并生成 LibTV 15 字段分镜。`);
    setVideoFeedback("");
    showToast(`逐镜拉片完成：已整理 ${result.shots?.length || 0} 个镜头，并生成 LibTV 15 字段分镜。`);
    elements.videoResults.scrollIntoView({ behavior: "smooth", block: "start" });
  } catch (error) {
    const message = error?.message || "视频拉片失败，请检查本机 Codex 服务后重试。";
    failVideoProgress(message);
    showToast(message, true);
    setVideoFeedback(message, true);
  } finally {
    elements.analyzeVideo.firstChild.textContent = "开始逐镜拉片 ";
    setBusy(false, "video");
  }
}

function videoPromptFor(shot, type) {
  const suffix = state.video.promptLanguage === "en" ? "English" : "Chinese";
  return shot?.[`${type}Prompt${suffix}`] || "";
}

function escapeMarkdownCell(value) {
  return String(value || "无法确认").replace(/\|/g, "\\|").replace(/\n+/g, "<br>");
}

function libtvFieldsForShot(shot, index) {
  const startTime = Number(shot?.startTime) || 0;
  const endTime = Number(shot?.endTime) || startTime;
  const videoPrompt = [videoPromptFor(shot, "video"), shot?.transition ? `衔接：${shot.transition}` : ""]
    .filter(Boolean)
    .join("；");
  return [
    ["镜号", String(index + 1).padStart(2, "0")],
    ["开始时间", formatVideoTime(startTime)],
    ["结束时间", formatVideoTime(endTime)],
    ["时长", `${Math.max(0, endTime - startTime).toFixed(1)} 秒`],
    ["画面描述", shot?.visualDescription],
    ["叙事内容", shot?.narrative],
    ["景别", shot?.shotSize],
    ["摄影机角度", shot?.cameraAngle],
    ["摄影机运动", shot?.cameraMovement],
    ["焦距与景深", shot?.lensAndDepth],
    ["光线", shot?.lighting],
    ["背景音乐", shot?.music],
    ["人声/音效", shot?.sound],
    ["图像生成提示词", videoPromptFor(shot, "image")],
    ["视频运动提示词", videoPrompt],
  ];
}

function videoStoryboardMarkdown() {
  const report = state.video.breakdown;
  if (!report) return "";
  const source = getVideoSourceMetadata();
  const shots = Array.isArray(report.shots) ? report.shots : [];
  const lines = [
    "# LibTV 15 字段分镜",
    "",
    `- 来源视频：${source?.name || "未命名本地视频"}`,
    `- 视频长度：${formatVideoTime(source?.duration || 0)}`,
    `- 本次分析片段：${formatVideoTime(report.clipStart ?? 0)} — ${formatVideoTime(report.clipEnd ?? source?.duration ?? 0)}`,
    `- 目标画幅：${report.aspectRatio || state.form.aspectRatio}`,
    `- 提示词语言：${state.video.promptLanguage === "en" ? "English" : "中文"}`,
    `- 导出时间：${new Date().toLocaleString("zh-CN")}`,
    "",
    "## 整体拉片判断",
    "",
    report.summary || "无",
    "",
    "## 跨镜连续性锁定",
    "",
  ];
  (report.styleContinuity || []).forEach((item) => lines.push(`- ${item}`));
  if (!(report.styleContinuity || []).length) lines.push("- 无额外锁定项。");
  lines.push("", "## 单镜头编辑卡", "");
  shots.forEach((shot, index) => {
    const fields = libtvFieldsForShot(shot, index);
    lines.push(`### 镜头 ${String(index + 1).padStart(2, "0")} · ${shot.title || "未命名镜头"}`, "", "| 字段 | 内容 |", "| --- | --- |");
    fields.forEach(([label, value]) => lines.push(`| ${label} | ${escapeMarkdownCell(value)} |`));
    lines.push("", `**连续性锁定：** ${shot.continuityLock || "无"}`, "", `**本镜排除：** ${shot.exclusions || "无"}`, "");
  });
  lines.push("## 完整宽表", "");
  const headers = libtvFieldsForShot(shots[0] || {}, 0).map(([label]) => label);
  lines.push(`| ${headers.join(" | ")} |`, `| ${headers.map(() => "---").join(" | ")} |`);
  shots.forEach((shot, index) => {
    lines.push(`| ${libtvFieldsForShot(shot, index).map(([, value]) => escapeMarkdownCell(value)).join(" | ")} |`);
  });
  if (report.warnings?.length) {
    lines.push("", "## 拉片边界", "");
    report.warnings.forEach((warning) => lines.push(`- ${warning}`));
  }
  return lines.join("\n");
}

function downloadVideoStoryboard() {
  const content = videoStoryboardMarkdown();
  if (!content) {
    showToast("请先完成一次逐镜拉片。", true);
    return;
  }
  const stamp = new Date().toISOString().slice(0, 19).replace(/[T:]/g, "-");
  downloadBlob(content, "text/markdown;charset=utf-8", `LibTV-15字段分镜-${stamp}.md`);
  showToast("LibTV 15 字段分镜 Markdown 已导出。 ");
}

function renderCrop() {
  const enabled = Boolean(state.images.primary && state.cropMode);
  elements.primaryStage.classList.toggle("crop-active", enabled);
  elements.cropToggle.classList.toggle("active", enabled);
  elements.cropToggle.textContent = enabled ? "结束框选" : "框选局部";
  elements.cropHelp.hidden = !enabled;
  if (!state.region || !state.images.primary) {
    elements.cropSelection.hidden = true;
    return;
  }
  elements.cropSelection.hidden = false;
  elements.cropSelection.style.left = `${state.region.x * 100}%`;
  elements.cropSelection.style.top = `${state.region.y * 100}%`;
  elements.cropSelection.style.width = `${state.region.width * 100}%`;
  elements.cropSelection.style.height = `${state.region.height * 100}%`;
}

function bindDropzone(dropzone, input, kind) {
  ["dragenter", "dragover"].forEach((eventName) => {
    dropzone.addEventListener(eventName, (event) => {
      event.preventDefault();
      dropzone.classList.add("dragging");
    });
  });
  ["dragleave", "drop"].forEach((eventName) => {
    dropzone.addEventListener(eventName, (event) => {
      event.preventDefault();
      dropzone.classList.remove("dragging");
    });
  });
  dropzone.addEventListener("drop", (event) => {
    const file = event.dataTransfer?.files?.[0];
    if (file) setImage(kind, file);
  });
  input.addEventListener("change", () => {
    const file = input.files?.[0];
    if (file) setImage(kind, file);
  });
}

let cropStart = null;
let movingCrop = null;
function cropPoint(event) {
  const rect = elements.primaryPreview.getBoundingClientRect();
  return {
    x: Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width)),
    y: Math.max(0, Math.min(1, (event.clientY - rect.top) / rect.height)),
  };
}

function updateCropFromPoints(start, end) {
  state.region = {
    x: Math.min(start.x, end.x),
    y: Math.min(start.y, end.y),
    width: Math.abs(end.x - start.x),
    height: Math.abs(end.y - start.y),
  };
  renderCrop();
}

function bindCropInteraction() {
  elements.primaryStage.addEventListener("pointerdown", (event) => {
    if (!state.cropMode || !state.images.primary) return;
    event.preventDefault();
    cropStart = cropPoint(event);
    elements.primaryStage.setPointerCapture(event.pointerId);
    updateCropFromPoints(cropStart, cropStart);
  });
  elements.primaryStage.addEventListener("pointermove", (event) => {
    if (movingCrop?.pointerId === event.pointerId && state.region) {
      const point = cropPoint(event);
      state.region.x = clampNumber(point.x - movingCrop.offsetX, 0, 1 - state.region.width);
      state.region.y = clampNumber(point.y - movingCrop.offsetY, 0, 1 - state.region.height);
      renderCrop();
      return;
    }
    if (!cropStart || !state.cropMode) return;
    updateCropFromPoints(cropStart, cropPoint(event));
  });
  const stopCropInteraction = (event) => {
    if (movingCrop?.pointerId === event.pointerId) {
      movingCrop = null;
      elements.cropSelection.classList.remove("moving");
      persist();
      return;
    }
    if (!cropStart || !state.cropMode) return;
    updateCropFromPoints(cropStart, cropPoint(event));
    if (state.region.width < 0.02 || state.region.height < 0.02) state.region = null;
    cropStart = null;
    renderCrop();
    persist();
  };
  elements.primaryStage.addEventListener("pointerup", stopCropInteraction);
  elements.primaryStage.addEventListener("pointercancel", stopCropInteraction);
  elements.cropSelection.addEventListener("pointerdown", (event) => {
    if (!state.cropMode || !state.region) return;
    event.preventDefault();
    event.stopPropagation();
    const point = cropPoint(event);
    movingCrop = {
      pointerId: event.pointerId,
      offsetX: point.x - state.region.x,
      offsetY: point.y - state.region.y,
    };
    elements.cropSelection.classList.add("moving");
    try {
      elements.primaryStage.setPointerCapture(event.pointerId);
    } catch {
      // Pointer capture is not essential for a mouse drag.
    }
  });
}

function clampNumber(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function normalizeComposition(input) {
  const frames = {};
  Object.keys(COMPOSITION_FORMATS).forEach((aspectRatio) => {
    const source = input?.frames?.[aspectRatio] || {};
    const zoom = Number(source.zoom);
    const panX = Number(source.panX);
    const panY = Number(source.panY);
    frames[aspectRatio] = {
      zoom: clampNumber(Number.isFinite(zoom) ? zoom : 1, 1, 3),
      panX: clampNumber(Number.isFinite(panX) ? panX : 0, -1, 1),
      panY: clampNumber(Number.isFinite(panY) ? panY : 0, -1, 1),
    };
  });
  return { frames };
}

function getCompositionFormat(aspectRatio = state.form.aspectRatio) {
  return COMPOSITION_FORMATS[aspectRatio] || COMPOSITION_FORMATS["16:9"];
}

function getCompositionFrame(aspectRatio = state.form.aspectRatio) {
  state.composition = normalizeComposition(state.composition);
  return state.composition.frames[aspectRatio] || state.composition.frames["16:9"];
}

function setCompositionImageSource(image, dataUrl) {
  if (image.dataset.source === dataUrl) return;
  image.dataset.source = dataUrl;
  image.src = dataUrl;
}

function getCompositionMetrics(container, frame) {
  const primary = state.images.primary;
  const naturalWidth = elements.compositionImage.naturalWidth;
  const naturalHeight = elements.compositionImage.naturalHeight;
  const rect = container.getBoundingClientRect();
  if (!primary || !naturalWidth || !naturalHeight || !rect.width || !rect.height) return null;
  const coverScale = Math.max(rect.width / naturalWidth, rect.height / naturalHeight);
  const width = naturalWidth * coverScale * frame.zoom;
  const height = naturalHeight * coverScale * frame.zoom;
  return {
    rect,
    width,
    height,
    maxPanX: Math.max(0, (width - rect.width) / 2),
    maxPanY: Math.max(0, (height - rect.height) / 2),
  };
}

function positionCompositionImage(image, container, frame) {
  const metrics = getCompositionMetrics(container, frame);
  if (!metrics) {
    image.hidden = true;
    return;
  }
  image.hidden = false;
  image.style.width = `${metrics.width}px`;
  image.style.height = `${metrics.height}px`;
  image.style.left = `${metrics.rect.width / 2 + frame.panX * metrics.maxPanX}px`;
  image.style.top = `${metrics.rect.height / 2 + frame.panY * metrics.maxPanY}px`;
  image.style.transform = "translate(-50%, -50%)";
}

let compositionLayoutFrame = 0;
function scheduleCompositionFraming() {
  cancelAnimationFrame(compositionLayoutFrame);
  compositionLayoutFrame = requestAnimationFrame(() => {
    compositionLayoutFrame = 0;
    renderCompositionFraming();
  });
}

function renderCompositionFraming() {
  const primary = state.images.primary;
  if (!primary) {
    [elements.compositionImage, elements.compositionPreviewLandscape, elements.compositionPreviewPortrait].forEach((image) => {
      image.hidden = true;
      image.removeAttribute("src");
      delete image.dataset.source;
    });
    return;
  }
  const activeFrame = getCompositionFrame();
  positionCompositionImage(elements.compositionImage, elements.compositionStage, activeFrame);
  positionCompositionImage(elements.compositionPreviewLandscape, elements.compositionPreviewLandscape.parentElement, getCompositionFrame("16:9"));
  positionCompositionImage(elements.compositionPreviewPortrait, elements.compositionPreviewPortrait.parentElement, getCompositionFrame("9:16"));
}

function renderCompositionCompare() {
  const activeAspect = state.form.aspectRatio;
  $$(".composition-compare-card").forEach((card) => {
    const active = card.dataset.compositionAspect === activeAspect;
    card.setAttribute("aria-pressed", String(active));
  });
  if (!state.images.primary) return;
  setCompositionImageSource(elements.compositionPreviewLandscape, state.images.primary.dataUrl);
  setCompositionImageSource(elements.compositionPreviewPortrait, state.images.primary.dataUrl);
}

function setCompositionAspect(aspectRatio) {
  if (!COMPOSITION_FORMATS[aspectRatio]) return;
  state.form.aspectRatio = aspectRatio;
  elements.aspectRatio.value = aspectRatio;
  getCompositionFrame(aspectRatio);
  updateFormFromControls();
  renderCompositionStage();
}

function changeCompositionZoom(delta) {
  if (!state.images.primary) return;
  const frame = getCompositionFrame();
  const nextZoom = clampNumber(frame.zoom + delta, 1, 3);
  if (nextZoom === frame.zoom) return;
  frame.zoom = nextZoom;
  persist();
  renderCompositionStage();
}

function resetCompositionFraming() {
  const frame = getCompositionFrame();
  frame.zoom = 1;
  frame.panX = 0;
  frame.panY = 0;
  persist();
  renderCompositionStage();
}

function createAnchorId() {
  return globalThis.crypto?.randomUUID?.() || `anchor-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function addAnchor(type) {
  const template = ANCHOR_TYPES[type];
  if (!template) return;
  state.anchors.push({
    id: createAnchorId(),
    type,
    label: template.label,
    x: template.x,
    y: template.y,
    width: template.width,
    height: template.height,
    locked: false,
  });
  persist();
  renderCompositionStage();
}

function renderAnchorOverlays() {
  elements.compositionStage.querySelectorAll(".composition-anchor").forEach((node) => node.remove());
  state.anchors.forEach((anchor) => {
    const template = ANCHOR_TYPES[anchor.type];
    if (!template) return;
    const node = createElement("button", "composition-anchor", anchor.label || template.label);
    node.type = "button";
    node.dataset.anchorId = anchor.id;
    node.dataset.type = anchor.type;
    node.classList.toggle("locked", anchor.locked === true);
    node.title = anchor.locked ? "此锚点已固定" : "拖动移动；拖右下角手柄调整大小";
    node.style.left = `${clampNumber(Number(anchor.x) || 0, 0, 1) * 100}%`;
    node.style.top = `${clampNumber(Number(anchor.y) || 0, 0, 1) * 100}%`;
    node.style.width = `${clampNumber(Number(anchor.width) || template.width, 0.02, 1) * 100}%`;
    node.style.height = `${clampNumber(Number(anchor.height) || template.height, 0.02, 1) * 100}%`;
    node.addEventListener("pointerdown", startAnchorDrag);
    const resizeHandle = createElement("span", "anchor-resize-handle");
    resizeHandle.setAttribute("aria-hidden", "true");
    resizeHandle.addEventListener("pointerdown", startAnchorResize);
    node.append(resizeHandle);
    elements.compositionStage.append(node);
  });
}

function renderAnchorList() {
  elements.anchorList.replaceChildren();
  if (state.anchors.length === 0) {
    elements.anchorList.append(createElement("p", "variants-empty", "还没有锚点。先添加主体、前景、地平线或留白区域。"));
    return;
  }
  state.anchors.forEach((anchor, index) => {
    const template = ANCHOR_TYPES[anchor.type];
    if (!template) return;
    const card = createElement("div", "anchor-card");
    const input = document.createElement("input");
    input.value = anchor.label || template.label;
    input.maxLength = 80;
    input.setAttribute("aria-label", `${template.label}锚点名称`);
    input.addEventListener("input", () => {
      state.anchors[index].label = input.value;
      renderAnchorOverlays();
      persist();
    });
    const lock = createElement("button", anchor.locked ? "locked" : "", anchor.locked ? "已固定" : "固定");
    lock.type = "button";
    lock.addEventListener("click", () => {
      state.anchors[index].locked = !state.anchors[index].locked;
      persist();
      renderCompositionStage();
    });
    const remove = createElement("button", "", "移除");
    remove.type = "button";
    remove.addEventListener("click", () => {
      state.anchors.splice(index, 1);
      persist();
      renderCompositionStage();
    });
    const x = clampNumber(Number(anchor.x) || 0, 0, 1);
    const y = clampNumber(Number(anchor.y) || 0, 0, 1);
    const width = clampNumber(Number(anchor.width) || template.width, 0.02, 1);
    const height = clampNumber(Number(anchor.height) || template.height, 0.02, 1);
    const geometry = createElement(
      "span",
      "anchor-geometry",
      `位置 x ${Math.round(x * 1000) / 10}% · y ${Math.round(y * 1000) / 10}%　范围 ${Math.round(width * 1000) / 10}% × ${Math.round(height * 1000) / 10}%`
    );
    card.append(input, lock, remove, geometry);
    elements.anchorList.append(card);
  });
}

function renderCompositionStage() {
  const primary = state.images.primary;
  const format = getCompositionFormat();
  const frame = getCompositionFrame();
  elements.compositionStage.style.aspectRatio = `${format.width} / ${format.height}`;
  elements.compositionStage.classList.toggle("has-reference", Boolean(primary));
  elements.compositionFormatName.textContent = `${format.label} · ${state.form.aspectRatio}`;
  elements.compositionZoomLabel.textContent = `${Math.round(frame.zoom * 100)}%`;
  elements.compositionZoomOut.disabled = !primary || frame.zoom <= 1;
  elements.compositionZoomIn.disabled = !primary || frame.zoom >= 3;
  elements.compositionReset.disabled = !primary || (frame.zoom === 1 && frame.panX === 0 && frame.panY === 0);
  elements.compositionEmpty.hidden = Boolean(primary);
  if (primary) setCompositionImageSource(elements.compositionImage, primary.dataUrl);
  else {
    elements.compositionImage.hidden = true;
    elements.compositionImage.removeAttribute("src");
    delete elements.compositionImage.dataset.source;
  }
  elements.anchorCount.textContent = `${state.anchors.length} 个锚点`;
  renderCompositionCompare();
  renderAnchorOverlays();
  renderAnchorList();
  scheduleCompositionFraming();
}

let draggingAnchor = null;
let resizingAnchor = null;
let panningComposition = null;

function startAnchorDrag(event) {
  const id = event.currentTarget.dataset.anchorId;
  const anchor = state.anchors.find((candidate) => candidate.id === id);
  if (!anchor || anchor.locked) {
    if (anchor?.locked) showToast("此锚点已固定；如需移动，请先取消固定。", true);
    return;
  }
  event.preventDefault();
  event.stopPropagation();
  const rect = elements.compositionStage.getBoundingClientRect();
  draggingAnchor = {
    id,
    pointerId: event.pointerId,
    offsetX: (event.clientX - rect.left) / rect.width - anchor.x,
    offsetY: (event.clientY - rect.top) / rect.height - anchor.y,
  };
  try {
    elements.compositionStage.setPointerCapture(event.pointerId);
  } catch {
    // Pointer capture is not essential for a mouse drag.
  }
}

function startAnchorResize(event) {
  const id = event.currentTarget.closest(".composition-anchor")?.dataset.anchorId;
  const anchor = state.anchors.find((candidate) => candidate.id === id);
  if (!anchor || anchor.locked) {
    if (anchor?.locked) showToast("此锚点已固定；如需调整范围，请先取消固定。", true);
    return;
  }
  event.preventDefault();
  event.stopPropagation();
  const rect = elements.compositionStage.getBoundingClientRect();
  resizingAnchor = {
    id,
    pointerId: event.pointerId,
    startX: event.clientX,
    startY: event.clientY,
    startWidth: anchor.width,
    startHeight: anchor.height,
    stageWidth: rect.width,
    stageHeight: rect.height,
  };
  try {
    elements.compositionStage.setPointerCapture(event.pointerId);
  } catch {
    // Pointer capture is not essential for a mouse drag.
  }
}

function startCompositionPan(event) {
  if (!state.images.primary || event.button !== 0 || event.target.closest(".composition-anchor")) return;
  const frame = getCompositionFrame();
  const metrics = getCompositionMetrics(elements.compositionStage, frame);
  if (!metrics) return;
  event.preventDefault();
  panningComposition = {
    pointerId: event.pointerId,
    startX: event.clientX,
    startY: event.clientY,
    startPanX: frame.panX,
    startPanY: frame.panY,
    maxPanX: metrics.maxPanX,
    maxPanY: metrics.maxPanY,
  };
  elements.compositionStage.classList.add("is-panning");
  try {
    elements.compositionStage.setPointerCapture(event.pointerId);
  } catch {
    // Pointer capture is not essential for a mouse drag.
  }
}

function bindAnchorInteraction() {
  elements.compositionStage.addEventListener("pointerdown", startCompositionPan);
  elements.compositionStage.addEventListener("pointermove", (event) => {
    if (panningComposition?.pointerId === event.pointerId) {
      const frame = getCompositionFrame();
      if (panningComposition.maxPanX > 0) {
        frame.panX = clampNumber(panningComposition.startPanX + (event.clientX - panningComposition.startX) / panningComposition.maxPanX, -1, 1);
      }
      if (panningComposition.maxPanY > 0) {
        frame.panY = clampNumber(panningComposition.startPanY + (event.clientY - panningComposition.startY) / panningComposition.maxPanY, -1, 1);
      }
      renderCompositionFraming();
      return;
    }
    if (resizingAnchor?.pointerId === event.pointerId) {
      const anchor = state.anchors.find((candidate) => candidate.id === resizingAnchor.id);
      if (!anchor) return;
      anchor.width = clampNumber(
        resizingAnchor.startWidth + (event.clientX - resizingAnchor.startX) / resizingAnchor.stageWidth,
        0.02,
        1 - anchor.x
      );
      anchor.height = clampNumber(
        resizingAnchor.startHeight + (event.clientY - resizingAnchor.startY) / resizingAnchor.stageHeight,
        0.02,
        1 - anchor.y
      );
      renderAnchorOverlays();
      return;
    }
    if (draggingAnchor?.pointerId === event.pointerId) {
      const anchor = state.anchors.find((candidate) => candidate.id === draggingAnchor.id);
      if (!anchor) return;
      const rect = elements.compositionStage.getBoundingClientRect();
      anchor.x = clampNumber((event.clientX - rect.left) / rect.width - draggingAnchor.offsetX, 0, 1 - anchor.width);
      anchor.y = clampNumber((event.clientY - rect.top) / rect.height - draggingAnchor.offsetY, 0, 1 - anchor.height);
      renderAnchorOverlays();
    }
  });
  const stop = (event) => {
    if (panningComposition?.pointerId === event.pointerId) {
      panningComposition = null;
      elements.compositionStage.classList.remove("is-panning");
      persist();
      renderCompositionCompare();
      scheduleCompositionFraming();
    }
    if (resizingAnchor?.pointerId === event.pointerId) {
      resizingAnchor = null;
      persist();
      renderAnchorList();
    }
    if (draggingAnchor?.pointerId === event.pointerId) {
      draggingAnchor = null;
      persist();
      renderAnchorList();
    }
  };
  elements.compositionStage.addEventListener("pointerup", stop);
  elements.compositionStage.addEventListener("pointercancel", stop);
}

function getLoadingSteps() {
  if (state.form.analysisMode === "quick") {
    return [
      ["01 / 02", "正在读取画面与构图", "只提取生成最终提示词所需的可见信息。"],
      ["02 / 02", "正在输出双平台提示词", "跳过语义层、候选方案和锚点报告，优先返回可复制结果。"],
    ];
  }
  const thirdStep = getDirectionMode() === "expansion"
    ? ["03 / 04", "正在扩写目标画面", "按导演要求补全前景、中景与远景的空间结构。"]
    : ["03 / 04", "正在还原画面结构", "保持参考图的原有场景，不擅自增加新内容。"];
  return [
    ["01 / 04", "正在读取画面证据", "区分可见事实、合理推断与用户创作要求。"],
    ["02 / 04", "正在拆解视觉 DNA", "提取构图、光线、色彩、材质与空间关系。"],
    thirdStep,
    ["04 / 04", "正在编译双平台语言", "分别组织 Midjourney 与 GPT Image 2 提示词。"],
  ];
}

let loadingTimer;
let loadingElapsedTimer;
let loadingStartedAt = 0;
function startLoading() {
  let index = 0;
  const loadingSteps = getLoadingSteps();
  loadingStartedAt = Date.now();
  clearInterval(loadingTimer);
  clearInterval(loadingElapsedTimer);
  elements.emptyState.hidden = true;
  elements.results.hidden = true;
  elements.loadingState.hidden = false;
  setAnalysisFeedback("已连接本机 Codex，正在反推图片。页面会持续显示进度；若服务不可用或超时，会在这里给出具体原因。");
  const paint = () => {
    const [step, title, copy] = loadingSteps[index % loadingSteps.length];
    elements.loadingIndex.textContent = step;
    elements.loadingTitle.textContent = title;
    elements.loadingCopy.textContent = copy;
    index += 1;
  };
  paint();
  loadingTimer = setInterval(paint, 4300);
  const paintElapsed = () => {
    const seconds = Math.max(0, Math.floor((Date.now() - loadingStartedAt) / 1000));
    elements.loadingElapsed.textContent = seconds < 60
      ? `已等待 ${seconds} 秒。${state.form.analysisMode === "quick" ? "快速模式通常更快返回。" : "复杂图片通常需要几十秒。"}`
      : `已等待 ${Math.floor(seconds / 60)} 分 ${seconds % 60} 秒。Codex 仍在处理；超过 ${state.form.analysisMode === "quick" ? "2 分钟" : "5 分钟"} 会自动停止并显示错误。`;
  };
  paintElapsed();
  loadingElapsedTimer = setInterval(paintElapsed, 1000);
}

function stopLoading() {
  clearInterval(loadingTimer);
  clearInterval(loadingElapsedTimer);
  elements.loadingState.hidden = true;
}

function setBusy(busy, mode = "analyze") {
  state.busy = busy;
  elements.analyzeButton.disabled = busy;
  elements.compileButton.disabled = busy;
  elements.analysisMode.disabled = busy;
  elements.codexModel.disabled = busy;
  elements.generateVariants.disabled = busy;
  elements.reviseButton.disabled = busy;
  elements.saveProject.disabled = busy;
  elements.openProjects.disabled = busy;
  elements.refreshAssets.disabled = busy;
  elements.completePromptLanguages.disabled = busy || !state.platformPrompts;
  elements.analyzeVideo.disabled = busy;
  renderAssetControls();
  renderPromptStudy();
  renderProductPromptControls();
  renderVideo();
  elements.analyzeButton.querySelector(".button-label").textContent = busy && mode === "analyze" ? "正在反推…" : {
    pure: state.form.analysisMode === "quick" ? "快速反推提示词" : "直接反推参考图",
    guided: state.form.analysisMode === "quick" ? "快速按要求反推" : "按参考要求反推",
    expansion: state.form.analysisMode === "quick" ? "快速反推并扩写" : "反推并扩写目标画面",
  }[getDirectionMode()];
  if (mode === "compile") elements.compileButton.firstChild.textContent = busy ? "正在重新编译… " : "重新编译双平台提示词 ";
  renderAppShell();
  checkHealth();
}

function buildAnalysisPayload() {
  updateFormFromControls();
  return {
    primaryImage: state.images.primary?.dataUrl,
    productImage: state.images.product?.dataUrl || null,
    scopes: state.form.scopes,
    inheritText: state.form.inheritText,
    targetScene: state.form.targetScene,
    excludeText: state.form.excludeText,
    aspectRatio: state.form.aspectRatio,
    analysisMode: state.form.analysisMode,
    model: state.form.model,
    region: state.region,
  };
}

function validateAnalysisInput(payload) {
  if (!payload.primaryImage) return "请先上传一张主参考图。";
  if (payload.scopes.length === 0) return "至少选择一个反推范围。";
  return "";
}

async function analyze() {
  let payload = buildAnalysisPayload();
  const validationError = validateAnalysisInput(payload);
  if (validationError) {
    setAnalysisFeedback(validationError, true);
    showToast(validationError, true);
    return;
  }

  const filledCount = fillMissingDirectorRequirements();
  payload = buildAnalysisPayload();
  if (filledCount > 0) showToast(`${filledCount} 个空白导演要求已自动按“无”处理。`);

  setAnalysisFeedback("正在检查本机 Codex 服务…");
  try {
    await verifyAnalysisService();
  } catch (error) {
    const message = error?.message || "无法连接本机反推服务。";
    setAnalysisFeedback(message, true);
    showToast(message, true);
    return;
  }

  setBusy(true, "analyze");
  startLoading();
  try {
    const result = await apiRequest("/api/analyze", payload, {
      timeoutMs: payload.analysisMode === "quick" ? QUICK_REQUEST_TIMEOUT_MS : REQUEST_TIMEOUT_MS,
    });
    state.analysisSummary = result.summary || "";
    state.analysisMode = result.analysisMode || payload.analysisMode || "layered";
    state.layers = (result.layers || []).map((layer) => ({
      ...layer,
      title: layer.title || LAYER_LABELS[layer.id] || layer.id,
      locked: false,
      originalPromptText: layer.promptText || "",
    }));
    state.referencePlan = result.referencePlan || null;
    state.platformPrompts = normalizePromptLanguages(result.platformPrompts || null);
    state.warnings = result.warnings || [];
    state.variants = [];
    state.selectedVariantId = null;
    state.revision = null;
    state.hasProductImage = Boolean(state.images.product);
    persist();
    stopLoading();
    setAnalysisFeedback();
    renderResults();
    const elapsedSeconds = Math.max(1, Math.round((Date.now() - loadingStartedAt) / 1000));
    const elapsedLabel = elapsedSeconds < 60
      ? `${elapsedSeconds} 秒`
      : `${Math.floor(elapsedSeconds / 60)} 分 ${elapsedSeconds % 60} 秒`;
    showToast(`${state.analysisMode === "quick" ? "快速反推" : "分层反推"}完成（${elapsedLabel} · ${MODEL_OPTIONS[state.form.model].label}）：双平台提示词已生成。`);
  } catch (error) {
    stopLoading();
    renderCurrentStage();
    const message = error?.message || "反推失败，请检查本机 Codex 服务后重试。";
    setAnalysisFeedback(message, true);
    showToast(message, true);
  } finally {
    setBusy(false);
  }
}

function renderCurrentStage() {
  const hasResults = Boolean(state.platformPrompts)
    && (state.analysisMode === "quick" || state.layers.length > 0);
  elements.emptyState.hidden = hasResults;
  elements.results.hidden = !hasResults;
  if (hasResults) renderResults();
}

function renderReferencePlan() {
  elements.referencePlan.replaceChildren();
  if (!state.referencePlan) return;
  const midjourney = createElement("article", "reference-note");
  midjourney.append(
    createElement("small", "", "MIDJOURNEY REFERENCE ROUTE"),
    createElement("strong", "", "Image Prompt · 图片1"),
    createElement("span", "", "先在 Midjourney 中实际添加图片1，再复制工作台生成的可执行命令。这里不使用未绑定图片的 Style／Omni Reference 参数。")
  );
  const gpt = createElement("article", "reference-note");
  gpt.append(
    createElement("small", "", "GPT IMAGE 2 IMAGE ROLES"),
    createElement("strong", "", "图片 1 · 主参考"),
    createElement("span", "", state.referencePlan.gptPrimaryRole || "")
  );
  elements.referencePlan.append(midjourney, gpt);
}

function modifiedLayerCount() {
  return state.layers.filter((layer) => layer.promptText !== layer.originalPromptText).length;
}

function renderLayerMeta() {
  const count = modifiedLayerCount();
  elements.layerChangeCount.textContent = `${count} 项修改`;
  elements.versionCount.textContent = `${state.versions.length} 个版本`;
  elements.restoreVersion.disabled = state.versions.length === 0;
}

function renderLayers() {
  elements.layersGrid.replaceChildren();
  state.layers.forEach((layer, index) => {
    const modified = layer.promptText !== layer.originalPromptText;
    const card = createElement("article", "layer-card");
    card.classList.toggle("modified", modified);
    card.classList.toggle("disabled", layer.enabled === false);
    card.classList.toggle("locked", layer.locked === true);

    const head = createElement("div", "layer-head");
    const titleWrap = createElement("div", "layer-title-wrap");
    const titleLine = createElement("div", "layer-title-line");
    titleLine.append(createElement("h4", "", layer.title || LAYER_LABELS[layer.id] || layer.id));
    if (modified) titleLine.append(createElement("span", "modified-badge", "已修改"));
    const badges = createElement("div", "layer-badges");
    badges.append(
      createElement("span", "source-badge", SOURCE_LABELS[layer.sourceType] || layer.sourceType),
      createElement("span", "confidence", CONFIDENCE_LABELS[layer.confidence] || layer.confidence)
    );
    titleWrap.append(titleLine, badges);

    const controls = createElement("div", "layer-controls");
    const enableButton = createElement("button", "layer-action", layer.enabled === false ? "启用" : "停用");
    enableButton.type = "button";
    enableButton.title = layer.enabled === false ? "把这一层加入提示词" : "暂时不把这一层加入提示词";
    enableButton.addEventListener("click", () => {
      state.layers[index].enabled = layer.enabled === false;
      persist();
      renderLayers();
    });

    const lockButton = createElement("button", `layer-action${layer.locked ? " active" : ""}`, layer.locked ? "已锁" : "锁定");
    lockButton.type = "button";
    lockButton.title = "锁定后，重新编译会把这一层写成不可变约束";
    lockButton.addEventListener("click", () => {
      state.layers[index].locked = !layer.locked;
      persist();
      renderLayers();
    });

    controls.append(enableButton, lockButton);
    head.append(titleWrap, controls);

    const evidence = createElement("div", "evidence");
    const observed = document.createElement("details");
    const observedSummary = createElement("summary", "", "画面事实");
    observed.append(observedSummary, createElement("p", "", layer.observation || "无法确认"));
    const inferred = document.createElement("details");
    const inferredSummary = createElement("summary", "", "AI 推断");
    inferred.append(inferredSummary, createElement("p", "", layer.inference || "无额外推断"));
    evidence.append(observed, inferred);

    const textarea = document.createElement("textarea");
    textarea.value = layer.promptText || "";
    textarea.rows = 5;
    textarea.setAttribute("aria-label", `${layer.title}可编辑提示词`);
    textarea.addEventListener("input", () => {
      state.layers[index].promptText = textarea.value;
      const isModified = textarea.value !== state.layers[index].originalPromptText;
      card.classList.toggle("modified", isModified);
      const existing = titleLine.querySelector(".modified-badge");
      if (isModified && !existing) titleLine.append(createElement("span", "modified-badge", "已修改"));
      if (!isModified && existing) existing.remove();
      renderLayerMeta();
      persist();
    });
    card.append(head, evidence, textarea);
    elements.layersGrid.append(card);
  });
  renderLayerMeta();
}

function setTextAreaValue(selector, value) {
  const element = $(selector);
  if (element) element.value = value || "";
}

const MIDJOURNEY_IMAGE_PROMPT_USAGE = "先把图片1放入 Midjourney 的 Image Prompt 区域，再复制下方可执行命令。图片1负责传递原有构图、内容关系与视觉语言；本工作台不会输出未绑定参考图的 --sref、--sw、--oref、--ow 或 --iw。";

function safeMidjourneyParameters(value, aspectRatio = state.form.aspectRatio) {
  const source = String(value || "").trim();
  const ratio = /^\d{1,2}:\d{1,2}$/.test(aspectRatio || "") ? aspectRatio : "16:9";
  const stylize = source.match(/--(?:stylize|s)\s+(\d{1,4})\b/i)?.[1];
  const chaos = source.match(/--(?:chaos|c)\s+(\d{1,3})\b/i)?.[1];
  const noTerms = (source.match(/--no\s+([\s\S]*?)(?=\s--[a-z][a-z-]*(?:\s|$)|$)/i)?.[1] || "")
    .trim()
    .replace(/\s+/g, " ");
  const parameters = [`--ar ${ratio}`];
  if (stylize) parameters.push(`--s ${Math.max(0, Math.min(1000, Number(stylize)))}`);
  if (chaos) parameters.push(`--c ${Math.max(0, Math.min(100, Number(chaos)))}`);
  if (noTerms) parameters.push(`--no ${noTerms}`);
  return parameters.join(" ");
}

function stripMidjourneyParameterTail(value) {
  const prompt = String(value || "").trim();
  const parameterStart = prompt.search(/\s--[a-z]/i);
  return parameterStart >= 0 ? prompt.slice(0, parameterStart).trim() : prompt;
}

function normalizeMidjourneyPromptState() {
  const midjourney = state.platformPrompts?.midjourney;
  if (!midjourney) return;
  const nextPrompt = stripMidjourneyParameterTail(midjourney.promptEnglish || midjourney.prompt);
  const nextParameters = safeMidjourneyParameters(midjourney.parameters);
  const changed = midjourney.prompt !== nextPrompt
    || midjourney.promptEnglish !== nextPrompt
    || midjourney.parameters !== nextParameters
    || midjourney.referenceUsage !== MIDJOURNEY_IMAGE_PROMPT_USAGE;
  midjourney.prompt = nextPrompt;
  midjourney.promptEnglish = nextPrompt;
  midjourney.parameters = nextParameters;
  midjourney.referenceUsage = MIDJOURNEY_IMAGE_PROMPT_USAGE;
  if (changed) persist();
}

function buildMidjourneyCommand() {
  const prompt = stripMidjourneyParameterTail(state.platformPrompts?.midjourney?.promptEnglish || state.platformPrompts?.midjourney?.prompt);
  const parameters = safeMidjourneyParameters(state.platformPrompts?.midjourney?.parameters);
  return [prompt, parameters].filter(Boolean).join(" ").replace(/\s+/g, " ").trim();
}

function getPromptLanguage(platform) {
  const configured = state.promptLanguages?.[platform];
  return configured === "zh" || configured === "en" ? configured : DEFAULT_PROMPT_LANGUAGES[platform];
}

function getPromptLanguageKey(language) {
  return language === "zh" ? "promptChinese" : "promptEnglish";
}

function getPromptVersion(platform, language = getPromptLanguage(platform)) {
  return state.platformPrompts?.[platform]?.[getPromptLanguageKey(language)] || "";
}

function setPromptEditorVersion(selector, platform) {
  const editor = $(selector);
  if (!editor) return;
  const language = getPromptLanguage(platform);
  const prompt = getPromptVersion(platform, language);
  editor.value = prompt;
  editor.lang = language === "zh" ? "zh-CN" : "en";
  editor.classList.toggle("prompt-en", language === "en");
  editor.placeholder = prompt
    ? ""
    : "此历史版本尚未生成该语言对照。点击“补全中英文版本”即可生成。";
}

function renderPromptLanguageControls() {
  const platform = state.activePlatform;
  const language = getPromptLanguage(platform);
  const hasVersion = Boolean(getPromptVersion(platform, language));
  elements.promptLanguageZh.textContent = platform === "midjourney" ? "中文理解" : "中文执行";
  elements.promptLanguageEn.textContent = platform === "midjourney" ? "English 执行" : "English 对照";
  $$(".prompt-language-tab").forEach((tab) => {
    const active = tab.dataset.promptLanguage === language;
    tab.classList.toggle("active", active);
    tab.setAttribute("aria-pressed", String(active));
  });
  const platformLabel = platform === "midjourney" ? "Midjourney" : "GPT Image 2";
  if (!hasVersion) {
    elements.promptLanguageNote.textContent = `当前保存的 ${platformLabel} 提示词没有${language === "zh" ? "中文" : "英文"}对照；补全时只翻译，不改变已确认的画面要求。`;
  } else if (language === "zh") {
    elements.promptLanguageNote.textContent = "中文理解版：用于核对画面语义、构图与限制项。修改中文不会自动翻译英文。";
  } else if (platform === "midjourney") {
    elements.promptLanguageNote.textContent = "English 执行版：复制 Midjourney 命令时始终使用此版本。修改英文不会自动翻译中文。";
  } else {
    elements.promptLanguageNote.textContent = "English 对照版：便于跨平台协作核对。修改英文不会自动翻译中文。";
  }
  elements.completePromptLanguages.hidden = hasVersion || !state.platformPrompts;
  elements.completePromptLanguages.disabled = state.busy || !state.platformPrompts;
}

function renderPlatformPrompts() {
  normalizeMidjourneyPromptState();
  const prompts = normalizePromptLanguages(state.platformPrompts);
  if (!prompts) return;
  state.platformPrompts = prompts;
  setPromptEditorVersion("#midjourney-prompt", "midjourney");
  setTextAreaValue("#midjourney-reference", prompts.midjourney?.referenceUsage);
  setTextAreaValue("#midjourney-parameters", prompts.midjourney?.parameters);
  setTextAreaValue("#midjourney-negative", prompts.midjourney?.negativeGuidance);
  setPromptEditorVersion("#gpt-prompt", "gptImage2");
  setTextAreaValue("#gpt-roles", prompts.gptImage2?.imageRoles);
  setTextAreaValue("#gpt-boundary", prompts.gptImage2?.editBoundary);
  setTextAreaValue("#gpt-negative", prompts.gptImage2?.negativeGuidance);
  renderPlatformTabs();
  renderActiveVariantStatus();
}

function renderPlatformTabs() {
  $$(".platform-tab").forEach((tab) => {
    const active = tab.dataset.platform === state.activePlatform;
    tab.classList.toggle("active", active);
    tab.setAttribute("aria-selected", String(active));
  });
  $("#output-midjourney").hidden = state.activePlatform !== "midjourney";
  $("#output-gptImage2").hidden = state.activePlatform !== "gptImage2";
  renderPromptLanguageControls();
}

function renderWarnings() {
  elements.warningsList.replaceChildren();
  const warnings = state.warnings.filter(Boolean);
  elements.warningsPanel.hidden = warnings.length === 0;
  warnings.forEach((warning) => elements.warningsList.append(createElement("li", "", warning)));
}

function renderResults() {
  const quick = state.analysisMode === "quick";
  elements.emptyState.hidden = true;
  elements.loadingState.hidden = true;
  elements.results.hidden = false;
  elements.results.classList.toggle("quick-mode", quick);
  elements.analysisModeBadge.textContent = quick
    ? "快速结果 · 只生成最终提示词"
    : "分层分析 · 可编辑语义层";
  elements.layersHeading.hidden = quick;
  elements.compositionSection.hidden = quick;
  elements.compileRow.hidden = quick;
  elements.variantsSection.hidden = quick;
  elements.analysisSummary.textContent = state.analysisSummary || "已生成视觉语义母版。";
  renderReferencePlan();
  renderLayers();
  renderCompositionStage();
  renderVariants();
  renderPlatformPrompts();
  renderRevision();
  renderWarnings();
}

function buildCompilePayload() {
  updateFormFromControls();
  return {
    layers: state.layers.map(({ id, title, promptText, enabled, locked }) => ({
      id,
      title,
      promptText,
      enabled,
      locked,
    })),
    targetScene: state.form.targetScene,
    inheritText: state.form.inheritText,
    excludeText: state.form.excludeText,
    aspectRatio: state.form.aspectRatio,
    model: state.form.model,
    hasProductImage: state.hasProductImage,
    anchors: state.anchors,
    referencePlan: state.referencePlan,
  };
}

function requireLayeredAnalysis() {
  if (state.analysisMode === "quick") {
    showToast("当前是快速结果，只有最终提示词；如需逐层编辑、空间锚点或候选方案，请切换为“分层分析”后重新反推。", true);
    return false;
  }
  if (state.layers.length === 0) {
    showToast("请先完成分层反推。", true);
    return false;
  }
  return true;
}

async function compilePrompts() {
  if (!requireLayeredAnalysis()) return;
  setBusy(true, "compile");
  try {
    const result = await apiRequest("/api/compile", buildCompilePayload());
    state.platformPrompts = normalizePromptLanguages({
      midjourney: result.midjourney,
      gptImage2: result.gptImage2,
    });
    state.warnings = result.warnings || [];
    state.selectedVariantId = null;
    state.revision = null;
    persist();
    renderPlatformPrompts();
    renderWarnings();
    showToast(`双平台提示词已按当前语义层重新编译（${MODEL_OPTIONS[state.form.model].label}）。`);
    document.querySelector(".platform-section").scrollIntoView({ behavior: "smooth", block: "start" });
  } catch (error) {
    showToast(error.message, true);
  } finally {
    setBusy(false, "compile");
  }
}

async function completePromptLanguages() {
  if (!state.platformPrompts) {
    showToast("请先完成一次提示词生成。", true);
    return;
  }
  updateFormFromControls();
  setBusy(true, "languages");
  elements.completePromptLanguages.textContent = "正在补全双语…";
  try {
    const result = await apiRequest("/api/prompt-languages", {
      platformPrompts: state.platformPrompts,
      aspectRatio: state.form.aspectRatio,
      model: state.form.model,
    });
    state.platformPrompts = normalizePromptLanguages(result.platformPrompts || state.platformPrompts);
    persist();
    renderPlatformPrompts();
    showToast("中英文提示词已补全；两种语言可分别编辑。");
  } catch (error) {
    showToast(error.message, true);
  } finally {
    elements.completePromptLanguages.textContent = "补全中英文版本";
    setBusy(false, "languages");
  }
}

function hasChineseText(value) {
  return /[\u4e00-\u9fff]/.test(String(value || ""));
}

function getVariantPresentation(variant) {
  const fallback = VARIANT_META[variant?.id] || {
    title: "候选方案",
    summary: "基于当前视觉语义和构图锚点生成。",
    visualStrategy: "基于当前视觉语义和构图锚点生成。",
    bestFor: "需要进一步比较时。",
    tradeoff: "请先检查双平台执行提示词。",
  };
  const guide = variant?.decisionGuide || {};
  return {
    title: hasChineseText(variant?.title) ? variant.title : fallback.title,
    summary: hasChineseText(variant?.summary) ? variant.summary : fallback.summary,
    visualStrategy: hasChineseText(guide.visualStrategy) ? guide.visualStrategy : fallback.visualStrategy,
    bestFor: hasChineseText(guide.bestFor) ? guide.bestFor : fallback.bestFor,
    tradeoff: hasChineseText(guide.tradeoff) ? guide.tradeoff : fallback.tradeoff,
  };
}

function renderActiveVariantStatus() {
  const variant = state.variants.find((candidate) => candidate.id === state.selectedVariantId);
  if (!variant) {
    elements.activeVariantStatus.hidden = true;
    elements.activeVariantStatus.textContent = "";
    return;
  }
  const presentation = getVariantPresentation(variant);
  elements.activeVariantStatus.hidden = false;
  elements.activeVariantStatus.textContent = `当前已采用「${presentation.title}」：${presentation.visualStrategy} 已替换 Midjourney 与 GPT Image 2 的全部提示词框。`;
}

function flashAppliedPrompts() {
  const editors = $$(".platform-section textarea");
  editors.forEach((editor) => editor.classList.add("prompt-applied"));
  setTimeout(() => editors.forEach((editor) => editor.classList.remove("prompt-applied")), 820);
}

function renderVariants() {
  elements.variantsGrid.replaceChildren();
  if (state.variants.length === 0) {
    elements.variantsGrid.append(createElement("p", "variants-empty", "当前还没有候选方向。先确认语义层和空间锚点，再生成三套可比较方案。"));
    return;
  }
  state.variants.forEach((variant) => {
    const card = createElement("article", "variant-card");
    card.classList.toggle("selected", variant.id === state.selectedVariantId);
    const stage = { faithful: "DIRECTION 01", balanced: "DIRECTION 02", creative: "DIRECTION 03" }[variant.id] || "PROMPT DIRECTION";
    const presentation = getVariantPresentation(variant);
    const decision = createElement("div", "variant-decision");
    const decisionTitle = createElement("span", "variant-decision-title", "中文判断");
    const strategy = createElement("p", "", presentation.visualStrategy);
    const bestFor = createElement("p", "", `适合：${presentation.bestFor}`);
    const tradeoff = createElement("p", "", `取舍：${presentation.tradeoff}`);
    decision.append(decisionTitle, strategy, bestFor, tradeoff);
    const execution = document.createElement("details");
    execution.className = "variant-execution";
    execution.append(
      createElement("summary", "", "查看英文 Midjourney 执行提示词"),
      createElement("code", "", variant.platformPrompts?.midjourney?.prompt || "暂无 Midjourney 预览")
    );
    card.append(
      createElement("small", "", stage),
      createElement("strong", "", presentation.title),
      createElement("p", "variant-summary", presentation.summary),
      decision,
      execution
    );
    if (variant.id === state.selectedVariantId) {
      card.append(createElement("span", "variant-adopted", "已写入双平台提示词框"));
    }
    const useButton = createElement("button", "variant-use-button", variant.id === state.selectedVariantId ? "当前采用" : "采用并替换双平台提示词");
    useButton.type = "button";
    useButton.disabled = variant.id === state.selectedVariantId;
    useButton.addEventListener("click", () => applyVariant(variant.id));
    card.append(useButton);
    elements.variantsGrid.append(card);
  });
}

function applyVariant(id) {
  const variant = state.variants.find((candidate) => candidate.id === id);
  if (!variant?.platformPrompts) return;
  const nextPrompts = normalizePromptLanguages(clone(variant.platformPrompts));
  state.platformPrompts = nextPrompts;
  state.selectedVariantId = variant.id;
  state.revision = null;
  persist();
  renderVariants();
  renderPlatformPrompts();
  flashAppliedPrompts();
  renderRevision();
  showToast(`已采用「${getVariantPresentation(variant).title}」：Midjourney 与 GPT Image 2 的全部提示词框已替换。`);
  document.querySelector(".platform-section").scrollIntoView({ behavior: "smooth", block: "start" });
}

async function generateVariants() {
  if (!requireLayeredAnalysis()) return;
  setBusy(true, "variants");
  elements.generateVariants.textContent = "正在生成三套方向…";
  try {
    const result = await apiRequest("/api/variants", buildCompilePayload());
    state.variants = normalizeVariantsPromptLanguages(result.variants);
    state.selectedVariantId = null;
    state.warnings = [...new Set([...(state.warnings || []), ...(result.warnings || [])])];
    persist();
    renderVariants();
    renderWarnings();
    showToast(`已生成 ${state.variants.length} 套候选方向。`);
  } catch (error) {
    showToast(error.message, true);
  } finally {
    elements.generateVariants.textContent = "生成三套方向";
    setBusy(false, "variants");
  }
}

function updateFeedbackFromControls() {
  state.feedback.issues = $$("#revision-issues input:checked").map((input) => input.value);
  state.feedback.note = elements.revisionNote.value.trim();
  persist();
}

function renderRevision() {
  elements.revisionResult.replaceChildren();
  const revision = state.revision;
  elements.revisionResult.hidden = !revision;
  if (!revision) return;
  elements.revisionResult.append(
    createElement("h4", "", "偏差诊断与修正版"),
    createElement("p", "", revision.summary || "已根据参考图与生成结果整理修正方向。")
  );
  const list = document.createElement("ul");
  (revision.deviations || []).forEach((deviation) => {
    const item = document.createElement("li");
    item.textContent = `${deviation.area || "偏差"}：${deviation.diagnosis || ""} → ${deviation.correction || ""}`;
    list.append(item);
  });
  if (list.childElementCount) elements.revisionResult.append(list);
  const apply = createElement("button", "", "采用修正版提示词");
  apply.type = "button";
  apply.addEventListener("click", applyRevision);
  elements.revisionResult.append(apply);
}

function applyRevision() {
  if (!state.revision?.revisedPrompts) return;
  state.platformPrompts = normalizePromptLanguages(clone(state.revision.revisedPrompts));
  state.selectedVariantId = null;
  state.warnings = [...new Set([...(state.warnings || []), ...(state.revision.warnings || [])])];
  persist();
  renderPlatformPrompts();
  renderVariants();
  renderWarnings();
  showToast("已采用修正版提示词；可继续生成、回传并迭代。" );
  document.querySelector(".platform-section").scrollIntoView({ behavior: "smooth", block: "start" });
}

function buildRevisionPayload() {
  updateFeedbackFromControls();
  return {
    ...buildCompilePayload(),
    primaryImage: state.images.primary?.dataUrl,
    resultImage: state.images.result?.dataUrl,
    issues: state.feedback.issues,
    note: state.feedback.note,
  };
}

async function reviseResult() {
  if (!state.images.primary) {
    showToast("请先保留主参考图，或从本地项目库加载完整项目。", true);
    return;
  }
  if (!state.images.result) {
    showToast("请先上传一张生成结果图。", true);
    return;
  }
  if (!requireLayeredAnalysis()) return;
  setBusy(true, "revision");
  elements.reviseButton.firstChild.textContent = "正在比对并修正… ";
  try {
    const result = await apiRequest("/api/revise", buildRevisionPayload());
    state.revision = result;
    persist();
    renderRevision();
    showToast("偏差诊断完成，已生成一套可采用的修正版提示词。" );
  } catch (error) {
    showToast(error.message, true);
  } finally {
    elements.reviseButton.firstChild.textContent = "分析偏差并生成修正版 ";
    setBusy(false, "revision");
  }
}

function bindPromptField(selector, platform, key) {
  const field = $(selector);
  field.addEventListener("input", (event) => {
    if (!state.platformPrompts?.[platform]) return;
    const activeKey = key === "prompt" ? getPromptLanguageKey(getPromptLanguage(platform)) : key;
    state.platformPrompts[platform][activeKey] = event.target.value;
    if (platform === "midjourney" && activeKey === "promptEnglish") {
      state.platformPrompts.midjourney.prompt = event.target.value;
    }
    if (platform === "gptImage2" && activeKey === "promptChinese") {
      state.platformPrompts.gptImage2.prompt = event.target.value;
    }
    persist();
  });
  if (platform === "midjourney" && (key === "prompt" || key === "parameters")) {
    field.addEventListener("blur", () => {
      if (!state.platformPrompts?.midjourney) return;
      const activeKey = key === "prompt" ? getPromptLanguageKey(getPromptLanguage(platform)) : key;
      if (key === "prompt" && activeKey !== "promptEnglish") return;
      const safeValue = key === "prompt"
        ? stripMidjourneyParameterTail(field.value)
        : safeMidjourneyParameters(field.value);
      if (field.value === safeValue) return;
      field.value = safeValue;
      state.platformPrompts.midjourney[activeKey] = safeValue;
      if (activeKey === "promptEnglish") state.platformPrompts.midjourney.prompt = safeValue;
      persist();
      showToast("已移除未绑定图片的 Midjourney 参数；请使用“复制可执行命令”。");
    });
  }
}

async function copyText(text, successMessage = "已复制。") {
  if (!text) {
    showToast("当前没有可复制的内容。", true);
    return;
  }
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.append(textarea);
    textarea.select();
    document.execCommand("copy");
    textarea.remove();
  }
  showToast(successMessage);
}

function setProductPromptFeedback(message = "", isError = false) {
  elements.productPromptFeedback.textContent = message;
  elements.productPromptFeedback.classList.toggle("error", isError);
  elements.productPromptFeedback.hidden = !message;
}

function productPromptImageConfig(kind) {
  return kind === "product"
    ? {
        imageKey: "productImage",
        nameKey: "productName",
        dropzone: elements.productPromptProductDropzone,
        input: elements.productPromptProductFile,
        button: elements.productPromptProductButton,
        preview: elements.productPromptProductPreview,
        copy: elements.productPromptProductCopy,
        meta: elements.productPromptProductMeta,
        remove: elements.productPromptProductRemove,
        emptyTitle: "上传产品图",
        emptyMeta: "可选 · 锁定形态、比例、材质与颜色",
        alt: "产品提示词工坊的产品参考图",
      }
    : {
        imageKey: "referenceImage",
        nameKey: "referenceName",
        dropzone: elements.productPromptReferenceDropzone,
        input: elements.productPromptReferenceFile,
        button: elements.productPromptReferenceButton,
        preview: elements.productPromptReferencePreview,
        copy: elements.productPromptReferenceCopy,
        meta: elements.productPromptReferenceMeta,
        remove: elements.productPromptReferenceRemove,
        emptyTitle: "上传场景参考图",
        emptyMeta: "可选 · 借鉴风格、构图或空间方法",
        alt: "产品提示词工坊的场景参考图",
      };
}

function renderProductPromptImage(kind) {
  const config = productPromptImageConfig(kind);
  const source = state.productPrompt[config.imageKey];
  const savedName = state.productPrompt[config.nameKey];
  const hasSource = Boolean(source?.dataUrl);
  config.button.classList.toggle("has-image", hasSource);
  config.preview.hidden = !hasSource;
  config.preview.alt = config.alt;
  if (hasSource) config.preview.src = source.dataUrl;
  else config.preview.removeAttribute("src");
  config.copy.textContent = hasSource ? source.name : savedName || config.emptyTitle;
  config.meta.textContent = hasSource ? `${source.type || "图片"} · ${Math.round(source.size / 1024)}KB` : config.emptyMeta;
  config.remove.hidden = !hasSource;
  config.remove.disabled = state.busy;
  config.input.disabled = state.busy;
}

function renderProductPromptControls() {
  const productPrompt = state.productPrompt;
  elements.productPromptIdea.value = productPrompt.idea || "";
  elements.productPromptProductNotes.value = productPrompt.productNotes || "";
  elements.productPromptTask.value = PRODUCT_PROMPT_TASK_OPTIONS[productPrompt.task] ? productPrompt.task : "reverse";
  elements.productPromptDepth.value = PRODUCT_PROMPT_DEPTH_OPTIONS[productPrompt.depth] ? productPrompt.depth : "quick";
  elements.productPromptReferenceRole.value = PRODUCT_REFERENCE_ROLE_OPTIONS[productPrompt.referenceRole] ? productPrompt.referenceRole : "both";
  elements.productPromptAspectRatio.value = COMPOSITION_FORMATS[productPrompt.aspectRatio] ? productPrompt.aspectRatio : "16:9";
  elements.productPromptTaskNote.textContent = PRODUCT_PROMPT_TASK_OPTIONS[productPrompt.task]?.note || PRODUCT_PROMPT_TASK_OPTIONS.reverse.note;
  elements.productPromptDepthNote.textContent = PRODUCT_PROMPT_DEPTH_OPTIONS[productPrompt.depth]?.note || PRODUCT_PROMPT_DEPTH_OPTIONS.quick.note;
  [elements.productPromptTask, elements.productPromptDepth, elements.productPromptReferenceRole, elements.productPromptAspectRatio, elements.productPromptIdea, elements.productPromptProductNotes].forEach((control) => {
    control.disabled = state.busy;
  });
  elements.generateProductPrompt.disabled = state.busy;
  renderProductPromptImage("product");
  renderProductPromptImage("reference");
  renderProductPromptResult();
}

function renderProductPromptResult() {
  const result = state.productPrompt.result;
  elements.productPromptResults.hidden = !result;
  if (!result) {
    elements.productPromptSummary.textContent = "";
    elements.productPromptIdentity.value = "";
    elements.productPromptScene.value = "";
    elements.productPromptWarnings.hidden = true;
    elements.productPromptWarningsList.replaceChildren();
    [
      elements.productPromptMidjourneyEnglish,
      elements.productPromptMidjourneyChinese,
      elements.productPromptMidjourneyParameters,
      elements.productPromptMidjourneyReference,
      elements.productPromptMidjourneyNegative,
      elements.productPromptGptChinese,
      elements.productPromptGptEnglish,
      elements.productPromptGptRoles,
      elements.productPromptGptBoundary,
      elements.productPromptGptNegative,
    ].forEach((field) => { field.value = ""; });
    return;
  }
  const prompts = result.platformPrompts || {};
  const midjourney = prompts.midjourney || {};
  const gptImage2 = prompts.gptImage2 || {};
  elements.productPromptSummary.textContent = result.summary || "已整理产品身份与场景方向。";
  elements.productPromptIdentity.value = result.productIdentity || "";
  elements.productPromptScene.value = result.sceneDirection || "";
  elements.productPromptMidjourneyEnglish.value = midjourney.promptEnglish || midjourney.prompt || "";
  elements.productPromptMidjourneyChinese.value = midjourney.promptChinese || "";
  elements.productPromptMidjourneyParameters.value = midjourney.parameters || "";
  elements.productPromptMidjourneyReference.value = midjourney.referenceUsage || "";
  elements.productPromptMidjourneyNegative.value = midjourney.negativeGuidance || "";
  elements.productPromptGptChinese.value = gptImage2.promptChinese || gptImage2.prompt || "";
  elements.productPromptGptEnglish.value = gptImage2.promptEnglish || "";
  elements.productPromptGptRoles.value = gptImage2.imageRoles || "";
  elements.productPromptGptBoundary.value = gptImage2.editBoundary || "";
  elements.productPromptGptNegative.value = gptImage2.negativeGuidance || "";
  const warnings = Array.isArray(result.warnings) ? result.warnings.filter(Boolean) : [];
  elements.productPromptWarnings.hidden = warnings.length === 0;
  elements.productPromptWarningsList.replaceChildren(...warnings.map((warning) => createElement("li", "", warning)));
}

async function setProductPromptImage(kind, file) {
  const config = productPromptImageConfig(kind);
  try {
    const dataUrl = await readFileAsDataUrl(file);
    state.productPrompt[config.imageKey] = { dataUrl, name: file.name, type: file.type, size: file.size };
    state.productPrompt[config.nameKey] = file.name || "未命名图片";
    state.productPrompt.result = null;
    setProductPromptFeedback("已更新参考图；请重新生成产品提示词。 ");
    persist();
    renderProductPromptControls();
  } catch (error) {
    setProductPromptFeedback(error.message, true);
    showToast(error.message, true);
  }
}

function clearProductPromptImage(kind) {
  const config = productPromptImageConfig(kind);
  state.productPrompt[config.imageKey] = null;
  state.productPrompt[config.nameKey] = "";
  state.productPrompt.result = null;
  config.input.value = "";
  setProductPromptFeedback("已移除该参考图；请重新生成产品提示词。 ");
  persist();
  renderProductPromptControls();
}

function bindProductPromptDropzone(kind) {
  const config = productPromptImageConfig(kind);
  ["dragenter", "dragover"].forEach((eventName) => {
    config.dropzone.addEventListener(eventName, (event) => {
      event.preventDefault();
      config.dropzone.classList.add("dragging");
    });
  });
  ["dragleave", "drop"].forEach((eventName) => {
    config.dropzone.addEventListener(eventName, (event) => {
      event.preventDefault();
      config.dropzone.classList.remove("dragging");
    });
  });
  config.dropzone.addEventListener("drop", (event) => {
    const file = event.dataTransfer?.files?.[0];
    if (file) setProductPromptImage(kind, file);
  });
  config.input.addEventListener("change", () => {
    const file = config.input.files?.[0];
    if (file) setProductPromptImage(kind, file);
    config.input.value = "";
  });
  config.button.addEventListener("click", () => {
    if (!state.busy) config.input.click();
  });
  config.remove.addEventListener("click", () => clearProductPromptImage(kind));
}

function updateProductPromptSettings() {
  state.productPrompt.idea = elements.productPromptIdea.value.trim();
  state.productPrompt.productNotes = elements.productPromptProductNotes.value.trim();
  state.productPrompt.task = PRODUCT_PROMPT_TASK_OPTIONS[elements.productPromptTask.value] ? elements.productPromptTask.value : "reverse";
  state.productPrompt.depth = PRODUCT_PROMPT_DEPTH_OPTIONS[elements.productPromptDepth.value] ? elements.productPromptDepth.value : "quick";
  state.productPrompt.referenceRole = PRODUCT_REFERENCE_ROLE_OPTIONS[elements.productPromptReferenceRole.value] ? elements.productPromptReferenceRole.value : "both";
  state.productPrompt.aspectRatio = COMPOSITION_FORMATS[elements.productPromptAspectRatio.value] ? elements.productPromptAspectRatio.value : "16:9";
  elements.productPromptTaskNote.textContent = PRODUCT_PROMPT_TASK_OPTIONS[state.productPrompt.task].note;
  elements.productPromptDepthNote.textContent = PRODUCT_PROMPT_DEPTH_OPTIONS[state.productPrompt.depth].note;
  persist();
}

function buildProductPromptPayload() {
  updateProductPromptSettings();
  return {
    productImage: state.productPrompt.productImage?.dataUrl || null,
    referenceImage: state.productPrompt.referenceImage?.dataUrl || null,
    idea: state.productPrompt.idea,
    productNotes: state.productPrompt.productNotes,
    task: state.productPrompt.task,
    depth: state.productPrompt.depth,
    referenceRole: state.productPrompt.referenceRole,
    aspectRatio: state.productPrompt.aspectRatio,
    model: state.form.model,
  };
}

function validateProductPromptPayload(payload) {
  if (!payload.productImage && !payload.referenceImage && !payload.idea && !payload.productNotes) {
    return "请至少提供产品图、参考图或一句产品想法。";
  }
  if (payload.task === "continue" && !payload.productImage && !payload.productNotes) {
    return "续写模式最好提供产品图或产品补充信息，以免产品形态发生漂移。";
  }
  return "";
}

async function generateProductPrompt() {
  const payload = buildProductPromptPayload();
  const validationError = validateProductPromptPayload(payload);
  if (validationError) {
    setProductPromptFeedback(validationError, true);
    showToast(validationError, true);
    return;
  }
  setProductPromptFeedback("正在检查本机 Codex 服务…");
  try {
    await verifyAnalysisService();
  } catch (error) {
    const message = error?.message || "无法连接本机反推服务。";
    setProductPromptFeedback(message, true);
    showToast(message, true);
    return;
  }
  setBusy(true, "productPrompt");
  elements.generateProductPrompt.textContent = "正在整理产品提示词…";
  setProductPromptFeedback(payload.depth === "quick"
    ? "已发送输入，优先生成可复制的双平台结果。"
    : "已发送输入，正在拆分产品身份与场景变量；详细模式会稍慢一些。 ");
  try {
    const result = await apiRequest("/api/product-prompt", payload, {
      timeoutMs: payload.depth === "quick" ? QUICK_REQUEST_TIMEOUT_MS : REQUEST_TIMEOUT_MS,
    });
    state.productPrompt.result = {
      ...result,
      platformPrompts: normalizePromptLanguages(result.platformPrompts || {}),
    };
    persist();
    renderProductPromptControls();
    setProductPromptFeedback("已生成。现在可以直接复制，或先改产品锁定项和场景方向再继续使用。 ");
    showToast("产品提示词已生成：Midjourney 与 GPT Image 2 双平台结果已就绪。 ");
    elements.productPromptResults.scrollIntoView({ behavior: "smooth", block: "start" });
  } catch (error) {
    const message = error?.message || "产品提示词生成失败，请检查输入后重试。";
    setProductPromptFeedback(message, true);
    showToast(message, true);
  } finally {
    elements.generateProductPrompt.textContent = "生成产品提示词";
    setBusy(false, "productPrompt");
  }
}

function updateProductPromptResultField(path, value) {
  if (!state.productPrompt.result) return;
  const [section, key] = path.split(".");
  if (section === "midjourney" || section === "gptImage2") {
    state.productPrompt.result.platformPrompts ||= {};
    state.productPrompt.result.platformPrompts[section] ||= {};
    state.productPrompt.result.platformPrompts[section][key] = value;
    if (section === "midjourney" && key === "promptEnglish") state.productPrompt.result.platformPrompts.midjourney.prompt = value;
    if (section === "gptImage2" && key === "promptChinese") state.productPrompt.result.platformPrompts.gptImage2.prompt = value;
  } else {
    state.productPrompt.result[section] = value;
  }
  persist();
}

function assetKindLabel(kind) {
  return kind === "result" ? "生成结果图" : "主参考图";
}

function loadImageFromDataUrl(dataUrl) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("分享卡图片读取失败，请换一张图片后重试。"));
    image.src = dataUrl;
  });
}

function wrapCanvasText(context, text, maxWidth, maxLines = Infinity) {
  const lines = [];
  let current = "";
  for (const character of Array.from(String(text || "").replace(/\r/g, ""))) {
    if (character === "\n") {
      if (current) lines.push(current);
      current = "";
      continue;
    }
    const next = `${current}${character}`;
    if (current && context.measureText(next).width > maxWidth) {
      lines.push(current);
      current = character;
    } else {
      current = next;
    }
  }
  if (current) lines.push(current);
  if (lines.length <= maxLines) return { lines, truncated: false };
  const limited = lines.slice(0, maxLines);
  let finalLine = limited.at(-1) || "";
  while (finalLine && context.measureText(`${finalLine}…`).width > maxWidth) finalLine = finalLine.slice(0, -1);
  limited[limited.length - 1] = `${finalLine}…`;
  return { lines: limited, truncated: true };
}

function drawImageCover(context, image, x, y, width, height) {
  const scale = Math.max(width / image.naturalWidth, height / image.naturalHeight);
  const drawWidth = image.naturalWidth * scale;
  const drawHeight = image.naturalHeight * scale;
  context.drawImage(image, x + (width - drawWidth) / 2, y + (height - drawHeight) / 2, drawWidth, drawHeight);
}

function drawCanvasLines(context, lines, x, y, lineHeight) {
  lines.forEach((line, index) => context.fillText(line, x, y + index * lineHeight));
  return y + lines.length * lineHeight;
}

async function createAssetShareCard({ imageDataUrl, title, summary, tags, midjourneyPrompt, midjourneyParameters, gptPrompt }) {
  const sourceImage = await loadImageFromDataUrl(imageDataUrl);
  const width = 1600;
  const padding = 92;
  const imageHeight = 960;
  const tempCanvas = document.createElement("canvas");
  const tempContext = tempCanvas.getContext("2d");
  const fontFamily = '-apple-system, BlinkMacSystemFont, "PingFang SC", "Microsoft YaHei", sans-serif';
  tempContext.font = `32px ${fontFamily}`;
  const summaryLines = wrapCanvasText(tempContext, summary || "未提供画面摘要。", width - padding * 2, 5).lines;
  tempContext.font = `27px ${fontFamily}`;
  const midjourneyText = [
    midjourneyPrompt || "未保存 Midjourney 提示词。",
    midjourneyParameters ? `Parameters: ${midjourneyParameters}` : "",
  ].filter(Boolean).join("\n");
  const midjourneyResult = wrapCanvasText(tempContext, midjourneyText, width - padding * 2, 28);
  const gptPromptResult = wrapCanvasText(tempContext, gptPrompt || "未提供中文提示词。", width - padding * 2, 38);
  const tagText = (tags || []).map((tag) => `#${tag}`).join("   ");
  tempContext.font = `24px ${fontFamily}`;
  const tagLines = wrapCanvasText(tempContext, tagText, width - padding * 2, 2).lines;
  const height = Math.max(2200, 1230 + summaryLines.length * 48 + tagLines.length * 40 + midjourneyResult.lines.length * 43 + gptPromptResult.lines.length * 43 + 520);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  context.fillStyle = "#101315";
  context.fillRect(0, 0, width, height);
  context.fillStyle = "#161b1d";
  context.fillRect(0, 0, width, 62);
  context.fillStyle = "#e7a649";
  context.fillRect(0, 0, 260, 6);
  context.fillStyle = "#b9c5c1";
  context.font = `600 18px ${fontFamily}`;
  context.letterSpacing = "2px";
  context.fillText("FRAME / DNA  ·  VISUAL ASSET", padding, 39);
  context.letterSpacing = "0px";

  context.save();
  context.beginPath();
  context.rect(0, 62, width, imageHeight);
  context.clip();
  drawImageCover(context, sourceImage, 0, 62, width, imageHeight);
  context.restore();
  const gradient = context.createLinearGradient(0, 62 + imageHeight * 0.58, 0, 62 + imageHeight);
  gradient.addColorStop(0, "rgba(0, 0, 0, 0)");
  gradient.addColorStop(1, "rgba(0, 0, 0, 0.52)");
  context.fillStyle = gradient;
  context.fillRect(0, 62, width, imageHeight);

  let y = imageHeight + 132;
  context.fillStyle = "#e9ebe7";
  context.font = `600 54px ${fontFamily}`;
  const titleLines = wrapCanvasText(context, title || "未命名视觉资产", width - padding * 2, 2).lines;
  y = drawCanvasLines(context, titleLines, padding, y, 68) + 28;
  context.fillStyle = "#aab2af";
  context.font = `32px ${fontFamily}`;
  y = drawCanvasLines(context, summaryLines, padding, y, 48) + 24;
  if (tagLines.length) {
    context.fillStyle = "#8fc8c2";
    context.font = `24px ${fontFamily}`;
    y = drawCanvasLines(context, tagLines, padding, y, 38) + 38;
  }
  context.fillStyle = "#e7a649";
  context.fillRect(padding, y, 54, 3);
  y += 44;
  context.fillStyle = "#d2d5d1";
  context.font = `600 20px ${fontFamily}`;
  context.letterSpacing = "1.5px";
  context.fillText("MIDJOURNEY · ENGLISH EXECUTION PROMPT", padding, y);
  context.letterSpacing = "0px";
  y += 50;
  context.fillStyle = "#f2f1ed";
  context.font = `27px ${fontFamily}`;
  y = drawCanvasLines(context, midjourneyResult.lines, padding, y, 43) + 40;
  if (midjourneyResult.truncated) {
    context.fillStyle = "#8b9290";
    context.font = `21px ${fontFamily}`;
    context.fillText("Midjourney 提示词较长，完整版本已保存在本机资产库。", padding, y);
    y += 34;
  }
  context.fillStyle = "#d2d5d1";
  context.font = `600 20px ${fontFamily}`;
  context.letterSpacing = "1.5px";
  context.fillText("GPT IMAGE 2 · 中文执行提示词", padding, y);
  context.letterSpacing = "0px";
  y += 50;
  context.fillStyle = "#f2f1ed";
  context.font = `27px ${fontFamily}`;
  y = drawCanvasLines(context, gptPromptResult.lines, padding, y, 43) + 40;
  if (gptPromptResult.truncated) {
    context.fillStyle = "#8b9290";
    context.font = `21px ${fontFamily}`;
    context.fillText("GPT Image 2 提示词较长，完整版本已保存在本机资产库。", padding, y);
    y += 34;
  }
  context.strokeStyle = "rgba(255, 255, 255, 0.16)";
  context.beginPath();
  context.moveTo(padding, height - 66);
  context.lineTo(width - padding, height - 66);
  context.stroke();
  context.fillStyle = "#848a88";
  context.font = `20px ${fontFamily}`;
  context.fillText("可分享预览图 · Midjourney 与 GPT Image 2 完整提示词均存于本机资产库", padding, height - 30);
  return canvas.toDataURL("image/png");
}

async function createPromptStudyShareCard({ imageDataUrl, title, summary, tags, englishPrompt, chinesePrompt, aestheticAnalysis }) {
  const sourceImage = await loadImageFromDataUrl(imageDataUrl);
  const width = 1600;
  const padding = 88;
  const contentWidth = width - padding * 2;
  const imageHeight = 840;
  const fontFamily = '-apple-system, BlinkMacSystemFont, "PingFang SC", "Microsoft YaHei", sans-serif';
  const tempCanvas = document.createElement("canvas");
  const tempContext = tempCanvas.getContext("2d");
  const measure = (font, text, maxWidth, maxLines) => {
    tempContext.font = `${font} ${fontFamily}`;
    return wrapCanvasText(tempContext, text, maxWidth, maxLines);
  };
  const titleLines = measure("600 54px", title || "未命名提示词美学卡", contentWidth, 2).lines;
  const summaryLines = measure("30px", summary || "这张效果图的提示词美学拆解。", contentWidth, 5).lines;
  const tagLines = measure("23px", (tags || []).map((tag) => `#${tag}`).join("   "), contentWidth, 2).lines;
  const english = measure("25px", englishPrompt || "未保存英文提示词。", contentWidth, 36);
  const chinese = measure("25px", chinesePrompt || "未生成中文提示词。", contentWidth, 36);
  const analysisBlocks = (aestheticAnalysis || []).slice(0, 6).map((item, index) => {
    const keywords = measure("22px", (item.keywords || []).join(" · "), contentWidth - 92, 2).lines;
    const evidence = measure("24px", item.evidence || "未提供画面证据。", contentWidth - 92, 6).lines;
    const effect = measure("24px", item.effect || "未提供视觉作用说明。", contentWidth - 92, 6).lines;
    return {
      index: String(index + 1).padStart(2, "0"),
      title: String(item.title || `美学要点 ${index + 1}`),
      keywords,
      evidence,
      effect,
      height: 205 + keywords.length * 32 + evidence.length * 37 + effect.length * 37,
    };
  });
  const textHeight = titleLines.length * 66 + summaryLines.length * 46 + (tagLines.length ? tagLines.length * 36 + 26 : 0);
  const promptHeight = 94 + english.lines.length * 39 + (english.truncated ? 34 : 0)
    + 94 + chinese.lines.length * 39 + (chinese.truncated ? 34 : 0);
  const analysisHeight = 86 + analysisBlocks.reduce((total, block) => total + block.height + 16, 0);
  const height = Math.max(3340, 1180 + textHeight + promptHeight + analysisHeight + 180);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  context.fillStyle = "#0d1115";
  context.fillRect(0, 0, width, height);
  context.fillStyle = "#151c20";
  context.fillRect(0, 0, width, 64);
  context.fillStyle = "#e7a649";
  context.fillRect(0, 0, 284, 6);
  context.fillStyle = "#bcc6c1";
  context.font = `600 18px ${fontFamily}`;
  context.fillText("PROMPT / ATLAS  ·  AESTHETICS CARD", padding, 40);

  const imageY = 64;
  context.fillStyle = "#080b0e";
  context.fillRect(0, imageY, width, imageHeight);
  const scale = Math.min(width / sourceImage.naturalWidth, imageHeight / sourceImage.naturalHeight);
  const drawWidth = sourceImage.naturalWidth * scale;
  const drawHeight = sourceImage.naturalHeight * scale;
  context.drawImage(sourceImage, (width - drawWidth) / 2, imageY + (imageHeight - drawHeight) / 2, drawWidth, drawHeight);
  const imageShade = context.createLinearGradient(0, imageY + imageHeight * 0.58, 0, imageY + imageHeight);
  imageShade.addColorStop(0, "rgba(4, 7, 10, 0)");
  imageShade.addColorStop(1, "rgba(4, 7, 10, .62)");
  context.fillStyle = imageShade;
  context.fillRect(0, imageY, width, imageHeight);

  let y = imageY + imageHeight + 92;
  context.fillStyle = "#f0eee7";
  context.font = `600 54px ${fontFamily}`;
  y = drawCanvasLines(context, titleLines, padding, y, 66) + 24;
  context.fillStyle = "#b9c0bc";
  context.font = `30px ${fontFamily}`;
  y = drawCanvasLines(context, summaryLines, padding, y, 46) + 20;
  if (tagLines.length) {
    context.fillStyle = "#8fc8c2";
    context.font = `23px ${fontFamily}`;
    y = drawCanvasLines(context, tagLines, padding, y, 36) + 30;
  }

  const drawPromptBlock = (label, promptResult, truncationText) => {
    context.fillStyle = "#e7a649";
    context.fillRect(padding, y, 54, 3);
    y += 42;
    context.fillStyle = "#d2d6d0";
    context.font = `600 19px ${fontFamily}`;
    context.fillText(label, padding, y);
    y += 48;
    context.fillStyle = "#f2f1ed";
    context.font = `25px ${fontFamily}`;
    y = drawCanvasLines(context, promptResult.lines, padding, y, 39) + 26;
    if (promptResult.truncated) {
      context.fillStyle = "#89918e";
      context.font = `20px ${fontFamily}`;
      context.fillText(truncationText, padding, y);
      y += 34;
    }
    y += 20;
  };
  drawPromptBlock("ORIGINAL ENGLISH PROMPT · 原文", english, "英文提示词较长；完整原文已写入本机资产库。");
  drawPromptBlock("CHINESE PROMPT · 中文对照", chinese, "中文提示词较长；完整版本已写入本机资产库。");

  context.fillStyle = "#8fc8c2";
  context.font = `600 20px ${fontFamily}`;
  context.fillText("AESTHETIC BREAKDOWN · 核心美学拆解", padding, y);
  y += 42;
  analysisBlocks.forEach((block) => {
    const blockY = y;
    context.fillStyle = "#141a1e";
    context.fillRect(padding, blockY, contentWidth, block.height);
    context.strokeStyle = "rgba(236, 232, 221, .14)";
    context.strokeRect(padding + .5, blockY + .5, contentWidth - 1, block.height - 1);
    context.fillStyle = "#e7a649";
    context.font = `600 24px ${fontFamily}`;
    context.fillText(block.index, padding + 24, blockY + 38);
    context.fillStyle = "#f0eee7";
    context.font = `600 28px ${fontFamily}`;
    context.fillText(block.title, padding + 92, blockY + 37);
    let innerY = blockY + 73;
    context.fillStyle = "#8fc8c2";
    context.font = `22px ${fontFamily}`;
    innerY = drawCanvasLines(context, block.keywords, padding + 92, innerY, 32) + 12;
    context.fillStyle = "#bdc2be";
    context.font = `24px ${fontFamily}`;
    context.fillText("画面证据：", padding + 92, innerY);
    innerY += 36;
    context.fillStyle = "#d8d9d3";
    innerY = drawCanvasLines(context, block.evidence, padding + 92, innerY, 37) + 12;
    context.fillStyle = "#bdc2be";
    context.font = `24px ${fontFamily}`;
    context.fillText("视觉作用：", padding + 92, innerY);
    innerY += 36;
    context.fillStyle = "#d8d9d3";
    drawCanvasLines(context, block.effect, padding + 92, innerY, 37);
    y += block.height + 16;
  });
  context.strokeStyle = "rgba(236, 232, 221, .18)";
  context.beginPath();
  context.moveTo(padding, height - 64);
  context.lineTo(width - padding, height - 64);
  context.stroke();
  context.fillStyle = "#838b88";
  context.font = `19px ${fontFamily}`;
  context.fillText("原图、英文原文、中文对照和美学拆解均保存在本机资产库", padding, height - 28);
  return canvas.toDataURL("image/png");
}

async function refreshPromptStudyCard({ silent = false } = {}) {
  if (!isPromptStudyReady()) throw new Error("请先完成当前效果图的中文提示词和美学拆解。");
  const result = getPromptStudyResult();
  state.promptStudy.cardDataUrl = await createPromptStudyShareCard({
    imageDataUrl: state.promptStudy.image.dataUrl,
    title: state.promptStudy.title || result.title,
    summary: result.summary,
    tags: result.tags,
    englishPrompt: state.promptStudy.englishPrompt,
    chinesePrompt: result.promptChinese,
    aestheticAnalysis: result.aestheticAnalysis,
  });
  renderPromptStudy();
  persist();
  if (!silent) {
    setPromptStudyFeedback("图片卡预览已更新；完整文字仍以资产库 JSON 中的版本为准。 ");
    showToast("提示词美学卡预览已更新。 ");
  }
  return state.promptStudy.cardDataUrl;
}

async function handleRefreshPromptStudyCard() {
  setBusy(true, "prompt-study-card");
  try {
    await refreshPromptStudyCard();
  } catch (error) {
    setPromptStudyFeedback(error.message || "图片卡预览生成失败。", true);
    showToast(error.message || "图片卡预览生成失败。", true);
  } finally {
    setBusy(false, "prompt-study-card");
  }
}

async function downloadPromptStudyCard() {
  if (!isPromptStudyReady()) {
    showToast("请先完成当前效果图的中文提示词和美学拆解。", true);
    return;
  }
  setBusy(true, "prompt-study-card");
  try {
    const dataUrl = state.promptStudy.cardDataUrl || await refreshPromptStudyCard({ silent: true });
    const link = document.createElement("a");
    link.href = dataUrl;
    link.download = `${(state.promptStudy.title || "提示词美学卡").replace(/[\\/:*?\"<>|]/g, "-")}.png`;
    document.body.append(link);
    link.click();
    link.remove();
    setPromptStudyFeedback("PNG 图片卡已开始下载。 ");
    showToast("提示词美学卡 PNG 已下载。 ");
  } catch (error) {
    setPromptStudyFeedback(error.message || "PNG 下载失败。", true);
    showToast(error.message || "PNG 下载失败。", true);
  } finally {
    setBusy(false, "prompt-study-card");
  }
}

async function savePromptStudyAsset() {
  if (!isPromptStudyReady()) {
    showToast("请先重新分析当前英文提示词，再保存到资产库。", true);
    return;
  }
  const result = getPromptStudyResult();
  setBusy(true, "prompt-study-save");
  setPromptStudyFeedback("正在把原图、原始英文、中文对照、美学拆解和 PNG 卡片写入本机资产库…");
  try {
    const shareCard = state.promptStudy.cardDataUrl || await refreshPromptStudyCard({ silent: true });
    const title = state.promptStudy.title || result.title || "未命名提示词美学卡";
    const saved = await apiRequest("/api/assets", {
      cardType: "prompt-aesthetic",
      title,
      summary: result.summary,
      tags: result.tags,
      sourceKind: "prompt_aesthetic",
      image: state.promptStudy.image.dataUrl,
      imageName: state.promptStudy.image.name,
      shareCard,
      promptStudy: {
        englishPrompt: state.promptStudy.englishPrompt,
        chinesePrompt: result.promptChinese,
        aestheticAnalysis: result.aestheticAnalysis,
      },
      warnings: result.warnings,
    });
    state.assets = [saved.asset, ...state.assets.filter((asset) => asset.id !== saved.asset?.id)];
    renderAssets();
    setPromptStudyFeedback(`“${title}”已保存。资产库会保留完整文字，不会只存缩略图。`);
    showToast("提示词美学卡已保存到资产库。 ");
  } catch (error) {
    const message = error?.message || "保存提示词美学卡失败。";
    setPromptStudyFeedback(message, true);
    showToast(message, true);
  } finally {
    setBusy(false, "prompt-study-save");
  }
}

function renderAssets() {
  renderAppShell();
  const assets = Array.isArray(state.assets) ? state.assets : [];
  elements.assetCount.textContent = `${assets.length} 个资产`;
  elements.assetGrid.replaceChildren();
  if (assets.length === 0) {
    elements.assetGrid.append(createElement("p", "assets-empty", "还没有视觉资产。可把主参考图、生成结果图，或英文提示词的效果图存进来。"));
    return;
  }
  assets.forEach((asset) => {
    const isPromptStudy = asset.cardType === "prompt-aesthetic" && asset.promptStudy;
    const titleText = asset.title || "未命名视觉资产";
    const sourceText = isPromptStudy ? "提示词美学卡" : asset.sourceKind === "result" ? "生成结果图" : "主参考图";
    const midjourneyPrompt = !isPromptStudy
      ? asset.prompts?.midjourney?.promptEnglish
        || asset.prompts?.midjourney?.prompt
        || asset.prompts?.midjourney?.promptChinese
        || ""
      : "";
    const gptPrompt = !isPromptStudy
      ? asset.prompts?.gptImage2?.promptChinese
        || asset.prompts?.gptImage2?.prompt
        || ""
      : "";
    const card = createElement("article", "asset-card");
    const visual = createElement("div", "asset-card-visual");
    const preview = document.createElement("img");
    preview.className = "asset-card-preview";
    preview.src = asset.image?.url || asset.shareCard?.url || "";
    preview.alt = `${titleText}的效果图`;
    preview.loading = "lazy";
    preview.decoding = "async";
    const visualLabel = createElement("span", "asset-card-image-label", asset.image?.url ? "效果图" : "分享卡");
    const visualCopy = createElement("div", "asset-card-visual-copy");
    visualCopy.append(
      createElement("span", "asset-source", sourceText),
      createElement("h4", "asset-card-title", titleText)
    );
    visual.append(preview, visualLabel, visualCopy);
    card.append(visual);

    const body = createElement("div", "asset-card-body");
    const meta = createElement("div", "asset-card-meta");
    meta.append(
      createElement("span", "asset-source-detail", isPromptStudy ? "双语提示词与美学拆解" : "双平台提示词资产"),
      createElement("small", "", asset.createdAt ? new Date(asset.createdAt).toLocaleString("zh-CN") : "本机资产")
    );
    const summary = createElement("p", "asset-card-summary", asset.summary || "未提供画面摘要。");
    const tags = createElement("div", "asset-tags");
    (asset.tags || []).forEach((tag) => tags.append(createElement("span", "", `#${tag}`)));
    body.append(meta, summary);
    if (tags.childElementCount) body.append(tags);

    const reuseBar = createElement("div", "asset-reuse-bar");
    reuseBar.append(createElement("span", "asset-reuse-label", "快速复用"));
    const appendCopyAction = (label, value, successMessage) => {
      if (!value) return;
      const button = createElement("button", "asset-reuse-button", label);
      button.type = "button";
      button.addEventListener("click", () => copyText(value, successMessage));
      reuseBar.append(button);
    };
    if (isPromptStudy) {
      appendCopyAction("复制英文原词", asset.promptStudy.englishPrompt, "英文原始提示词已复制。 ");
      appendCopyAction("复制中文提示词", asset.promptStudy.chinesePrompt, "中文提示词已复制。 ");
    } else {
      appendCopyAction("复制 Midjourney", midjourneyPrompt, "Midjourney 提示词已复制。 ");
      appendCopyAction("复制 GPT Image 2", gptPrompt, "GPT Image 2 提示词已复制。 ");
    }
    if (reuseBar.childElementCount > 1) body.append(reuseBar);

    if (isPromptStudy) {
      const study = asset.promptStudy;
      body.append(createElement("small", "asset-prompt-status", "已保存：原始英文、中文对照与关键词—证据—作用美学拆解"));
      const studyDetails = document.createElement("details");
      studyDetails.className = "asset-prompts";
      studyDetails.append(createElement("summary", "", "查看原文、中文与美学拆解"));
      const promptGrid = createElement("div", "asset-prompt-grid");
      [
        ["原始英文提示词", study.englishPrompt, "英文原始提示词已复制。"],
        ["中文提示词", study.chinesePrompt, "中文提示词已复制。"],
      ].forEach(([label, prompt, successMessage]) => {
        const promptBlock = createElement("section", "asset-prompt-block");
        const promptHead = createElement("div", "asset-prompt-head");
        const copyButton = createElement("button", "text-button", "复制");
        copyButton.type = "button";
        copyButton.addEventListener("click", () => copyText(prompt || "", successMessage));
        promptHead.append(createElement("strong", "", label), copyButton);
        promptBlock.append(promptHead, createElement("p", "", prompt || "提示词缺失"));
        promptGrid.append(promptBlock);
      });
      studyDetails.append(promptGrid);
      const analysisList = createElement("div", "prompt-study-analysis-list");
      (study.aestheticAnalysis || []).forEach((item, index) => {
        const analysis = createElement("article", "prompt-study-analysis-item");
        const copy = createElement("div");
        const evidence = createElement("p");
        evidence.append(createElement("strong", "", "画面证据："), document.createTextNode(item.evidence || ""));
        const effect = createElement("p");
        effect.append(createElement("strong", "", "视觉作用："), document.createTextNode(item.effect || ""));
        copy.append(
          createElement("h6", "", item.title || `美学要点 ${index + 1}`),
          createElement("p", "prompt-study-keywords", (item.keywords || []).join(" · ")),
          evidence,
          effect
        );
        analysis.append(createElement("span", "prompt-study-analysis-index", String(index + 1).padStart(2, "0")), copy);
        analysisList.append(analysis);
      });
      studyDetails.append(analysisList);
      body.append(studyDetails);
    } else {
      body.append(createElement(
        "small",
        `asset-prompt-status${midjourneyPrompt ? "" : " missing"}`,
        midjourneyPrompt
          ? "已保存：Midjourney + GPT Image 2 双平台提示词"
          : "警告：这个资产没有保存 Midjourney 提示词，请重新存入。"
      ));

      const promptDetails = document.createElement("details");
      promptDetails.className = "asset-prompts";
      promptDetails.append(createElement("summary", "", "查看并复制双平台提示词"));
      const promptGrid = createElement("div", "asset-prompt-grid");
      [
        ["Midjourney", [midjourneyPrompt, asset.prompts?.midjourney?.parameters ? `参数：${asset.prompts.midjourney.parameters}` : ""].filter(Boolean).join("\n"), "复制 Midjourney 提示词"],
        ["GPT Image 2", gptPrompt, "复制 GPT Image 2 提示词"],
      ].forEach(([label, prompt, successMessage]) => {
        const promptBlock = createElement("section", "asset-prompt-block");
        const promptHead = createElement("div", "asset-prompt-head");
        const copyButton = createElement("button", "text-button", "复制");
        copyButton.type = "button";
        copyButton.addEventListener("click", () => copyText(prompt || "", successMessage));
        promptHead.append(createElement("strong", "", label), copyButton);
        const text = createElement("p", "", prompt || "提示词缺失");
        promptBlock.append(promptHead, text);
        promptGrid.append(promptBlock);
      });
      promptDetails.append(promptGrid);
      body.append(promptDetails);
    }

    const actions = createElement("div", "asset-card-actions");
    if (asset.shareCard?.url) {
      const download = createElement("a", "asset-download", isPromptStudy ? "下载美学卡 PNG" : "下载提示词卡 PNG");
      download.href = asset.shareCard.url;
      download.download = `${asset.title || "视觉资产"}-${isPromptStudy ? "美学卡" : "提示词卡"}.png`;
      actions.append(download);
    }
    if (asset.image?.url) {
      const source = createElement("button", "text-button", "查看原图");
      source.type = "button";
      source.addEventListener("click", () => openAssetImagePreview(asset));
      actions.append(source);
    }
    if (isPromptStudy && asset.image?.url && asset.promptStudy) {
      const rebuild = createElement("button", "text-button", "更新提示词美学卡");
      rebuild.type = "button";
      rebuild.title = "用已保存的英文原文、中文对照和美学拆解重建 PNG，不重新调用模型";
      rebuild.addEventListener("click", () => rebuildPromptStudyShareCard(asset));
      actions.append(rebuild);
    }
    if (!isPromptStudy && asset.image?.url && asset.prompts?.midjourney?.prompt) {
      const rebuild = createElement("button", "text-button", "更新双平台分享卡");
      rebuild.type = "button";
      rebuild.title = "用已保存的 Midjourney 与 GPT Image 2 提示词重新生成分享卡，不重新调用模型";
      rebuild.addEventListener("click", () => rebuildAssetShareCard(asset));
      actions.append(rebuild);
    }
    const remove = createElement("button", "text-button danger-action", "删除资产");
    remove.type = "button";
    remove.title = "从本机资产库删除这张资产卡及其文件";
    remove.addEventListener("click", () => deleteAsset(asset));
    actions.append(remove);
    body.append(actions);
    if (asset.warnings?.length) {
      const warningDetails = document.createElement("details");
      warningDetails.className = "asset-warning-details";
      warningDetails.append(
        createElement("summary", "", `查看注意边界 · ${asset.warnings.length} 项`),
        createElement("p", "asset-warning", asset.warnings.join("；"))
      );
      body.append(warningDetails);
    }
    card.append(body);
    elements.assetGrid.append(card);
  });
}

async function refreshAssets() {
  const result = await apiGet("/api/assets");
  state.assets = Array.isArray(result.assets) ? result.assets : [];
  renderAssets();
}

function openAssetImagePreview(asset) {
  const imageUrl = asset?.image?.url;
  if (!imageUrl) return;
  const overlay = createElement("div", "asset-image-modal");
  overlay.setAttribute("role", "dialog");
  overlay.setAttribute("aria-modal", "true");
  overlay.setAttribute("aria-label", `${asset.title || "视觉资产"}原图预览`);
  const panel = createElement("div", "asset-image-modal-panel");
  const close = createElement("button", "asset-image-modal-close", "关闭");
  close.type = "button";
  close.setAttribute("aria-label", "关闭原图预览");
  const image = document.createElement("img");
  image.src = imageUrl;
  image.alt = `${asset.title || "视觉资产"}原图`;
  image.decoding = "async";
  image.loading = "eager";
  panel.append(close, image);
  overlay.append(panel);
  document.body.append(overlay);
  const closePreview = () => overlay.remove();
  close.addEventListener("click", closePreview);
  overlay.addEventListener("click", (event) => {
    if (event.target === overlay) closePreview();
  });
  const onKeydown = (event) => {
    if (event.key === "Escape") {
      closePreview();
      document.removeEventListener("keydown", onKeydown);
    }
  };
  document.addEventListener("keydown", onKeydown);
  close.focus();
}

async function deleteAsset(asset) {
  if (!asset?.id) return;
  const title = asset.title || "未命名视觉资产";
  if (!window.confirm(`确定删除“${title}”？原图、分享卡和提示词记录都会从本机资产库移除。`)) return;
  try {
    await apiRequest(`/api/assets/${encodeURIComponent(asset.id)}`, { method: "DELETE" });
    state.assets = state.assets.filter((item) => item.id !== asset.id);
    renderAssets();
    renderHome();
    showToast(`已删除“${title}”。`);
  } catch (error) {
    showToast(`删除失败：${error.message}`, true);
  }
}

async function rebuildAssetShareCard(asset) {
  if (!asset?.id || !asset.image?.url || !asset.prompts) {
    showToast("这个资产缺少原图或双平台提示词，无法重建分享卡。", true);
    return;
  }
  const sourceLabel = asset.sourceKind === "result" ? "生成结果图" : "主参考图";
  elements.assetLibraryNote.textContent = `正在用已保存的双平台提示词更新“${asset.title || "未命名资产"}”分享卡…`;
  setBusy(true, "asset");
  try {
    const source = await loadProjectAsset(asset.image);
    if (!source?.dataUrl) throw new Error("资产原图读取失败。");
    const prompts = asset.prompts;
    const shareCard = await createAssetShareCard({
      imageDataUrl: source.dataUrl,
      title: asset.title,
      summary: asset.summary,
      tags: asset.tags,
      midjourneyPrompt: prompts.midjourney?.promptEnglish || prompts.midjourney?.prompt,
      midjourneyParameters: prompts.midjourney?.parameters,
      gptPrompt: prompts.gptImage2?.promptChinese || prompts.gptImage2?.prompt,
    });
    const saved = await apiRequest("/api/assets", {
      id: asset.id,
      title: asset.title,
      summary: asset.summary,
      tags: asset.tags,
      sourceKind: asset.sourceKind,
      image: source.dataUrl,
      imageName: source.name || asset.image.name,
      shareCard,
      prompts,
      warnings: asset.warnings || [],
    });
    state.assets = [saved.asset, ...state.assets.filter((candidate) => candidate.id !== saved.asset?.id)];
    renderAssets();
    elements.assetLibraryNote.textContent = `“${asset.title || sourceLabel}”分享卡已更新，已包含 Midjourney 与 GPT Image 2 提示词。`;
    showToast("双平台分享卡已更新。 ");
  } catch (error) {
    elements.assetLibraryNote.textContent = `“${asset.title || sourceLabel}”分享卡更新失败。`;
    showToast(error.message, true);
  } finally {
    setBusy(false, "asset");
  }
}

async function rebuildPromptStudyShareCard(asset) {
  if (!asset?.id || !asset.image?.url || !asset.promptStudy) {
    showToast("这个资产缺少原图或提示词美学分析，无法重建图片卡。", true);
    return;
  }
  const study = asset.promptStudy;
  const analysis = Array.isArray(study.aestheticAnalysis) ? study.aestheticAnalysis : [];
  if (!study.englishPrompt || !study.chinesePrompt || analysis.length === 0) {
    showToast("这个资产的提示词美学资料不完整，无法重建图片卡。", true);
    return;
  }
  elements.assetLibraryNote.textContent = `正在用已保存的原文与美学拆解更新“${asset.title || "未命名资产"}”图片卡…`;
  setBusy(true, "asset");
  try {
    const source = await loadProjectAsset(asset.image);
    if (!source?.dataUrl) throw new Error("资产原图读取失败。 ");
    const shareCard = await createPromptStudyShareCard({
      imageDataUrl: source.dataUrl,
      title: asset.title,
      summary: asset.summary,
      tags: asset.tags,
      englishPrompt: study.englishPrompt,
      chinesePrompt: study.chinesePrompt,
      aestheticAnalysis: analysis,
    });
    const saved = await apiRequest("/api/assets", {
      id: asset.id,
      cardType: "prompt-aesthetic",
      title: asset.title,
      summary: asset.summary,
      tags: asset.tags,
      sourceKind: asset.sourceKind,
      image: source.dataUrl,
      imageName: source.name || asset.image.name,
      shareCard,
      promptStudy: study,
      warnings: asset.warnings || [],
    });
    state.assets = [saved.asset, ...state.assets.filter((candidate) => candidate.id !== saved.asset?.id)];
    renderAssets();
    elements.assetLibraryNote.textContent = `“${asset.title || "未命名资产"}”提示词美学卡已更新。`;
    showToast("提示词美学卡已更新。 ");
  } catch (error) {
    elements.assetLibraryNote.textContent = `“${asset.title || "未命名资产"}”提示词美学卡更新失败。`;
    showToast(error.message, true);
  } finally {
    setBusy(false, "asset");
  }
}

async function saveCurrentAsAsset(kind) {
  const source = state.images[kind];
  if (!source) {
    showToast(`请先上传${assetKindLabel(kind)}。`, true);
    return;
  }
  updateFormFromControls();
  const sourceLabel = assetKindLabel(kind);
  elements.assetLibraryNote.textContent = `正在为${sourceLabel}独立反推提示词，并生成分享卡…`;
  setBusy(true, "asset");
  try {
    const analyzed = await apiRequest("/api/assets/analyze", {
      image: source.dataUrl,
      aspectRatio: state.form.aspectRatio,
      model: state.form.model,
    });
    const title = elements.assetTitle.value.trim() || analyzed.title || `${sourceLabel}资产`;
    const prompts = analyzed.platformPrompts;
    if (!prompts?.midjourney?.prompt || !prompts?.gptImage2?.prompt) {
      throw new Error("该画面的双平台提示词生成不完整，请重试。");
    }
    const shareCard = await createAssetShareCard({
      imageDataUrl: source.dataUrl,
      title,
      summary: analyzed.summary,
      tags: analyzed.tags,
      midjourneyPrompt: prompts.midjourney.promptEnglish || prompts.midjourney.prompt,
      midjourneyParameters: prompts.midjourney.parameters,
      gptPrompt: prompts.gptImage2.prompt,
    });
    const saved = await apiRequest("/api/assets", {
      title,
      summary: analyzed.summary,
      tags: analyzed.tags,
      sourceKind: kind,
      image: source.dataUrl,
      imageName: source.name,
      shareCard,
      prompts,
      warnings: analyzed.warnings || [],
    });
    state.assets = [saved.asset, ...state.assets.filter((asset) => asset.id !== saved.asset?.id)];
    elements.assetTitle.value = "";
    elements.assetLibraryNote.textContent = `已存入${sourceLabel}：独立双平台提示词与分享卡 PNG 都已在本机生成。`;
    renderAssets();
    showToast(`“${title}”已存入视觉资产库，可下载提示词卡或复制双平台提示词。`);
  } catch (error) {
    elements.assetLibraryNote.textContent = `未能存入${sourceLabel}，请检查提示后重试。`;
    showToast(error.message, true);
  } finally {
    setBusy(false, "asset");
  }
}

function imageFromBlob(blob, name) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve({
      dataUrl: reader.result,
      name: name || "项目素材",
      type: blob.type || "image/png",
      size: blob.size || 0,
    });
    reader.onerror = () => reject(new Error("项目素材读取失败。"));
    reader.readAsDataURL(blob);
  });
}

async function loadProjectAsset(asset) {
  if (!asset?.url) return null;
  const response = await fetch(asset.url, { cache: "no-store" });
  if (!response.ok) throw new Error("项目素材读取失败，请确认项目文件完整。" );
  return imageFromBlob(await response.blob(), asset.name);
}

function renderProjectsList() {
  elements.projectsList.replaceChildren();
  elements.projectsCount.textContent = `${state.projects.length}`;
  if (state.projects.length === 0) {
    elements.projectsList.append(createElement("p", "projects-empty", "还没有本地项目。完成一次反推后点击“保存项目”。"));
    return;
  }
  state.projects.forEach((project) => {
    const button = createElement("button", "project-list-item");
    button.type = "button";
    const copy = document.createElement("span");
    copy.append(
      createElement("strong", "", project.title || "未命名项目"),
      createElement("small", "", project.updatedAt ? new Date(project.updatedAt).toLocaleString("zh-CN") : "本地项目")
    );
    button.append(copy, createElement("em", "", project.id === state.project.id ? "当前" : "打开"));
    button.addEventListener("click", () => loadProject(project.id));
    elements.projectsList.append(button);
  });
}

async function refreshProjects() {
  const result = await apiGet("/api/projects");
  state.projects = Array.isArray(result.projects) ? result.projects : [];
  renderProjectsList();
}

async function toggleProjects() {
  const willOpen = elements.projectsPopover.hidden;
  elements.projectsPopover.hidden = !willOpen;
  elements.openProjects.setAttribute("aria-expanded", String(willOpen));
  if (!willOpen) return;
  elements.projectsList.replaceChildren(createElement("p", "projects-empty", "正在读取本地项目…"));
  try {
    await refreshProjects();
  } catch (error) {
    elements.projectsList.replaceChildren(createElement("p", "projects-empty", error.message));
  }
}

async function saveProject() {
  updateFormFromControls();
  state.project.title = elements.projectTitle.value.trim() || "未命名项目";
  setBusy(true, "project");
  try {
    const result = await apiRequest("/api/projects", {
      id: state.project.id,
      title: state.project.title,
      state: persistableState(),
      primaryImage: state.images.primary?.dataUrl || null,
      primaryName: state.images.primary?.name || "",
      productImage: state.images.product?.dataUrl || null,
      productName: state.images.product?.name || "",
      resultImage: state.images.result?.dataUrl || null,
      resultName: state.images.result?.name || "",
      imageActions: state.imageAssetActions,
    });
    state.project = { ...EMPTY_PROJECT, ...(result.project || {}) };
    state.imageAssetActions = createImageAssetActions();
    persist();
    renderProjectControls();
    renderAppShell();
    await refreshProjects();
    showToast(`项目“${state.project.title}”已保存到本地。`);
  } catch (error) {
    showToast(error.message, true);
  } finally {
    setBusy(false, "project");
  }
}

async function loadProject(id) {
  if (id !== state.project.id && state.layers.length > 0 && !window.confirm("打开另一个项目会替换当前页面中的未保存修改，是否继续？")) {
    return;
  }
  setBusy(true, "project");
  try {
    const result = await apiGet(`/api/projects/${encodeURIComponent(id)}`);
    const project = result.project;
    if (!project) throw new Error("项目读取失败。");
    const hasSavedWorkspace = Boolean(WORKSPACE_META[project.state?.activeWorkspace]);
    applySavedState(project.state || {});
    state.project = {
      ...EMPTY_PROJECT,
      id: project.id,
      title: project.title,
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
      assets: project.assets || null,
    };
    const [primary, product, generated] = await Promise.all([
      loadProjectAsset(project.assets?.primary),
      loadProjectAsset(project.assets?.product),
      loadProjectAsset(project.assets?.result),
    ]);
    state.images = { primary, product, result: generated };
    state.hasProductImage = Boolean(product);
    populateControls();
    renderImages();
    renderPromptStudy();
    renderVideo();
    renderCurrentStage();
    if (!hasSavedWorkspace) state.activeWorkspace = "image";
    setActiveWorkspace(state.activeWorkspace, { persistSelection: false, scroll: false });
    persist();
    elements.projectsPopover.hidden = true;
    elements.openProjects.setAttribute("aria-expanded", "false");
    showToast(`已打开项目“${state.project.title}”。`);
  } catch (error) {
    showToast(error.message, true);
  } finally {
    setBusy(false, "project");
  }
}

function createSnapshot() {
  return {
    savedAt: new Date().toISOString(),
    form: clone(state.form),
    region: clone(state.region),
    analysisSummary: state.analysisSummary,
    analysisMode: state.analysisMode,
    layers: clone(state.layers),
    referencePlan: clone(state.referencePlan),
    platformPrompts: clone(state.platformPrompts),
    warnings: clone(state.warnings),
    anchors: clone(state.anchors),
    composition: clone(state.composition),
    variants: clone(state.variants),
    selectedVariantId: state.selectedVariantId,
    revision: clone(state.revision),
    feedback: clone(state.feedback),
    hasProductImage: state.hasProductImage,
    activeWorkspace: state.activeWorkspace,
    promptLanguages: clone(state.promptLanguages),
  };
}

function saveVersion() {
  if (!state.platformPrompts) {
    showToast("还没有可以保存的反推结果。", true);
    return;
  }
  updateFormFromControls();
  state.versions.push(createSnapshot());
  state.versions = state.versions.slice(-MAX_VERSIONS);
  persist();
  renderLayerMeta();
  showToast(`已保存版本 ${state.versions.length}。`);
}

function restoreLastVersion() {
  const snapshot = state.versions.at(-1);
  if (!snapshot) {
    showToast("还没有已保存版本。", true);
    return;
  }
  state.form = { ...DEFAULT_FORM, ...clone(snapshot.form) };
  state.region = clone(snapshot.region || null);
  state.analysisSummary = snapshot.analysisSummary || "";
  state.analysisMode = ANALYSIS_MODE_OPTIONS[snapshot.analysisMode]
    ? snapshot.analysisMode
    : snapshot.layers?.length > 0 ? "layered" : "quick";
  state.layers = clone(snapshot.layers || []);
  state.referencePlan = clone(snapshot.referencePlan || null);
  state.platformPrompts = normalizePromptLanguages(clone(snapshot.platformPrompts || null));
  state.warnings = clone(snapshot.warnings || []);
  state.anchors = clone(snapshot.anchors || []);
  state.composition = normalizeComposition(snapshot.composition);
  state.variants = normalizeVariantsPromptLanguages(clone(snapshot.variants || []));
  state.selectedVariantId = snapshot.selectedVariantId || null;
  state.revision = snapshot.revision
    ? { ...clone(snapshot.revision), revisedPrompts: normalizePromptLanguages(snapshot.revision.revisedPrompts) }
    : null;
  state.feedback = clone(snapshot.feedback || { issues: [], note: "" });
  state.hasProductImage = snapshot.hasProductImage === true;
  state.promptLanguages = {
    midjourney: snapshot.promptLanguages?.midjourney === "zh" ? "zh" : "en",
    gptImage2: snapshot.promptLanguages?.gptImage2 === "en" ? "en" : "zh",
  };
  populateControls();
  persist();
  renderResults();
  showToast(`已恢复 ${new Date(snapshot.savedAt).toLocaleString("zh-CN")} 的版本。`);
}

function safeFilename(extension) {
  const date = new Date().toISOString().slice(0, 19).replace(/[T:]/g, "-");
  return `参考图反推-${date}.${extension}`;
}

function downloadBlob(content, mimeType, filename) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function markdownExport() {
  const compositionFrame = getCompositionFrame();
  const lines = [
    "# 参考图反推项目",
    "",
    `- 导出时间：${new Date().toLocaleString("zh-CN")}`,
    `- 目标画幅：${state.form.aspectRatio}`,
    `- 输出模式：${state.analysisMode === "quick" ? "快速结果（只生成最终提示词）" : "分层分析（可编辑语义层）"}`,
    `- 参考图取景：${getCompositionFormat().label}，缩放 ${Math.round(compositionFrame.zoom * 100)}%，水平移动 ${Math.round(compositionFrame.panX * 100)}%，垂直移动 ${Math.round(compositionFrame.panY * 100)}%`,
    `- Codex 模型：${MODEL_OPTIONS[state.form.model]?.label || state.form.model}`,
    `- 目标画面：${state.form.targetScene || "无"}`,
    `- 继承要求：${state.form.inheritText || "未填写"}`,
    `- 排除要求：${state.form.excludeText || "未填写"}`,
    "",
    "## 整体判断",
    "",
    state.analysisSummary || "无",
    "",
  ];
  if (state.layers.length) {
    lines.push("## 视觉语义层", "");
    state.layers.forEach((layer) => {
      lines.push(`### ${layer.title}${layer.locked ? "（已锁定）" : ""}${layer.enabled === false ? "（已停用）" : ""}`);
      lines.push("");
      lines.push(`- 画面事实：${layer.observation || "无法确认"}`);
      lines.push(`- AI 推断：${layer.inference || "无"}`);
      lines.push("");
      lines.push(layer.promptText || "");
      lines.push("");
    });
  } else {
    lines.push("## 视觉语义层", "", "本次使用快速结果模式，未生成可编辑语义层；以下为直接可复制的双平台最终提示词。", "");
  }
  if (state.anchors.length) {
    lines.push("## 空间锚点", "");
    state.anchors.forEach((anchor) => {
      lines.push(`- ${anchor.label || ANCHOR_TYPES[anchor.type]?.label || anchor.type}：x=${Math.round(anchor.x * 100)}%，y=${Math.round(anchor.y * 100)}%，宽=${Math.round(anchor.width * 100)}%，高=${Math.round(anchor.height * 100)}%${anchor.locked ? "（固定）" : ""}`);
    });
    lines.push("");
  }
  lines.push(
    "## Midjourney · English 执行版",
    "",
    state.platformPrompts?.midjourney?.promptEnglish || state.platformPrompts?.midjourney?.prompt || "",
    "",
    "## Midjourney · 中文理解版",
    "",
    state.platformPrompts?.midjourney?.promptChinese || "未生成中文对照。",
    "",
    `**参考图用法：** ${state.platformPrompts?.midjourney?.referenceUsage || ""}`,
    "",
    `**参数：** ${state.platformPrompts?.midjourney?.parameters || ""}`,
    "",
    `**负面引导：** ${state.platformPrompts?.midjourney?.negativeGuidance || ""}`,
    "",
    "## GPT Image 2 · 中文执行版",
    "",
    state.platformPrompts?.gptImage2?.promptChinese || state.platformPrompts?.gptImage2?.prompt || "",
    "",
    "## GPT Image 2 · English 对照版",
    "",
    state.platformPrompts?.gptImage2?.promptEnglish || "未生成英文对照。",
    "",
    `**图片角色：** ${state.platformPrompts?.gptImage2?.imageRoles || ""}`,
    "",
    `**编辑边界：** ${state.platformPrompts?.gptImage2?.editBoundary || ""}`,
    "",
    `**禁止项：** ${state.platformPrompts?.gptImage2?.negativeGuidance || ""}`
  );
  if (state.warnings.length) {
    lines.push("", "## 注意边界", "");
    state.warnings.forEach((warning) => lines.push(`- ${warning}`));
  }
  return lines.join("\n");
}

function exportMarkdown() {
  downloadBlob(markdownExport(), "text/markdown;charset=utf-8", safeFilename("md"));
  elements.exportPopover.hidden = true;
  showToast("Markdown 已导出。索引图片不会写入文件。" );
}

function exportJson() {
  const exportState = {
    exportedAt: new Date().toISOString(),
    version: "0.9.0",
    ...createSnapshot(),
  };
  downloadBlob(JSON.stringify(exportState, null, 2), "application/json;charset=utf-8", safeFilename("json"));
  elements.exportPopover.hidden = true;
  showToast("JSON 项目已导出。图片因体积原因不包含在内。" );
}

function bindEvents() {
  elements.themeOptions.forEach((button) => {
    button.addEventListener("click", () => applyTheme(button.dataset.themeOption));
  });
  $$('[data-workspace]').forEach((button) => {
    button.addEventListener("click", () => setActiveWorkspace(button.dataset.workspace));
  });
  $$('[data-workspace-action]').forEach((control) => {
    control.addEventListener("click", (event) => {
      event.preventDefault();
      setActiveWorkspace(control.dataset.workspaceAction);
    });
  });

  bindDropzone(elements.primaryDropzone, elements.primaryFile, "primary");
  bindDropzone(elements.productDropzone, elements.productFile, "product");
  bindDropzone(elements.resultDropzone, elements.resultFile, "result");
  bindPromptStudyDropzone();
  bindCropInteraction();
  bindAnchorInteraction();

  elements.primaryUploadButton.addEventListener("click", () => elements.primaryFile.click());
  elements.emptyUploadAction.addEventListener("click", () => elements.primaryFile.click());
  elements.productUploadButton.addEventListener("click", () => elements.productFile.click());
  elements.resultUploadButton.addEventListener("click", () => elements.resultFile.click());
  elements.primaryRemove.addEventListener("click", () => clearImage("primary"));
  elements.productRemove.addEventListener("click", (event) => {
    event.stopPropagation();
    clearImage("product");
  });
  elements.resultRemove.addEventListener("click", (event) => {
    event.stopPropagation();
    clearImage("result");
  });
  elements.promptStudyUploadButton.addEventListener("click", () => elements.promptStudyFile.click());
  elements.promptStudyImageRemove.addEventListener("click", (event) => {
    event.stopPropagation();
    clearPromptStudyImage();
  });
  elements.promptStudyTitleInput.addEventListener("input", updatePromptStudyTitle);
  elements.promptStudyEnglish.addEventListener("input", updatePromptStudyEnglish);
  elements.promptStudyChinese.addEventListener("input", updatePromptStudyChinese);
  elements.analyzePromptStudy.addEventListener("click", analyzePromptStudy);
  elements.refreshPromptStudyCard.addEventListener("click", handleRefreshPromptStudyCard);
  elements.downloadPromptStudyCard.addEventListener("click", downloadPromptStudyCard);
  elements.savePromptStudyAsset.addEventListener("click", savePromptStudyAsset);
  elements.copyPromptStudyEnglish.addEventListener("click", () => {
    copyText(state.promptStudy.englishPrompt, "英文原始提示词已复制。 ");
  });
  elements.copyPromptStudyChinese.addEventListener("click", () => {
    copyText(getPromptStudyResult()?.promptChinese, "中文提示词已复制。 ");
  });
  elements.cropToggle.addEventListener("click", () => {
    if (!state.images.primary) return;
    state.cropMode = !state.cropMode;
    renderCrop();
  });

  [elements.inheritText, elements.targetScene, elements.excludeText].forEach((field) => {
    field.addEventListener("input", updateFormFromControls);
  });
  elements.aspectRatio.addEventListener("change", () => {
    updateFormFromControls();
    renderCompositionStage();
    if (state.platformPrompts) renderPlatformPrompts();
  });
  elements.codexModel.addEventListener("change", updateFormFromControls);
  elements.analysisMode.addEventListener("change", updateFormFromControls);
  elements.scopeGrid.addEventListener("change", updateFormFromControls);
  elements.projectTitle.addEventListener("input", () => {
    state.project.title = elements.projectTitle.value.trim() || "未命名项目";
    persist();
    renderAppShell();
  });
  elements.saveProject.addEventListener("click", saveProject);
  elements.openProjects.addEventListener("click", toggleProjects);
  elements.pureReverseButton.addEventListener("click", setPureReverseMode);
  $$(".suggestion-chips button").forEach((button) => {
    button.addEventListener("click", () => applySuggestion(button));
  });
  elements.analyzeButton.addEventListener("click", analyze);
  elements.compileButton.addEventListener("click", compilePrompts);
  elements.completePromptLanguages.addEventListener("click", completePromptLanguages);
  elements.generateVariants.addEventListener("click", generateVariants);
  elements.savePrimaryAsset.addEventListener("click", () => saveCurrentAsAsset("primary"));
  elements.saveResultAsset.addEventListener("click", () => saveCurrentAsAsset("result"));
  elements.coverPresetGrid.addEventListener("click", (event) => {
    const button = event.target.closest("[data-cover-preset]");
    if (button) setCoverPreset(button.dataset.coverPreset);
  });
  elements.coverFocusX.addEventListener("input", () => updateCoverFocus("focusX", elements.coverFocusX.value));
  elements.coverFocusY.addEventListener("input", () => updateCoverFocus("focusY", elements.coverFocusY.value));
  elements.exportCover.addEventListener("click", exportCover);
  elements.copyCoverPrompt.addEventListener("click", () => copyText(elements.coverPrompt.value, "平台封面提示词已复制。"));
  elements.coverUploadAction.addEventListener("click", () => setActiveWorkspace("image"));
  elements.refreshAssets.addEventListener("click", async () => {
    elements.assetLibraryNote.textContent = "正在读取本机资产库…";
    try {
      await refreshAssets();
      elements.assetLibraryNote.textContent = "资产库已刷新。每个资产都保留原图、独立双平台提示词和可分享 PNG。";
    } catch (error) {
      elements.assetLibraryNote.textContent = "资产库读取失败。";
      showToast(error.message, true);
    }
  });
  elements.compositionImage.addEventListener("load", scheduleCompositionFraming);
  elements.compositionZoomOut.addEventListener("click", () => changeCompositionZoom(-0.1));
  elements.compositionZoomIn.addEventListener("click", () => changeCompositionZoom(0.1));
  elements.compositionReset.addEventListener("click", resetCompositionFraming);
  $$(".composition-compare-card").forEach((card) => {
    card.addEventListener("click", () => setCompositionAspect(card.dataset.compositionAspect));
  });
  $$(".anchor-tools button").forEach((button) => {
    button.addEventListener("click", () => addAnchor(button.dataset.anchorType));
  });
  elements.revisionIssues.addEventListener("change", updateFeedbackFromControls);
  elements.revisionNote.addEventListener("input", updateFeedbackFromControls);
  elements.reviseButton.addEventListener("click", reviseResult);

  bindProductPromptDropzone("product");
  bindProductPromptDropzone("reference");
  [elements.productPromptIdea, elements.productPromptProductNotes].forEach((field) => {
    field.addEventListener("input", () => {
      updateProductPromptSettings();
      setProductPromptFeedback("");
    });
  });
  [
    elements.productPromptTask,
    elements.productPromptDepth,
    elements.productPromptReferenceRole,
    elements.productPromptAspectRatio,
  ].forEach((field) => {
    field.addEventListener("change", () => {
      updateProductPromptSettings();
      renderProductPromptControls();
    });
  });
  elements.generateProductPrompt.addEventListener("click", generateProductPrompt);
  elements.copyProductPromptMidjourney.addEventListener("click", () => {
    const prompts = state.productPrompt.result?.platformPrompts?.midjourney;
    copyText([prompts?.promptEnglish || prompts?.prompt, prompts?.parameters].filter(Boolean).join(" "), "产品 Midjourney 可执行提示词已复制。 ");
  });
  elements.copyProductPromptMidjourneyChinese.addEventListener("click", () => {
    copyText(state.productPrompt.result?.platformPrompts?.midjourney?.promptChinese, "产品 Midjourney 中文理解版已复制。 ");
  });
  elements.copyProductPromptGptChinese.addEventListener("click", () => {
    copyText(state.productPrompt.result?.platformPrompts?.gptImage2?.promptChinese || state.productPrompt.result?.platformPrompts?.gptImage2?.prompt, "产品 GPT Image 2 中文提示词已复制。 ");
  });
  elements.copyProductPromptGptEnglish.addEventListener("click", () => {
    copyText(state.productPrompt.result?.platformPrompts?.gptImage2?.promptEnglish, "产品 GPT Image 2 英文对照已复制。 ");
  });
  [
    [elements.productPromptIdentity, "productIdentity"],
    [elements.productPromptScene, "sceneDirection"],
    [elements.productPromptMidjourneyEnglish, "midjourney.promptEnglish"],
    [elements.productPromptMidjourneyChinese, "midjourney.promptChinese"],
    [elements.productPromptMidjourneyParameters, "midjourney.parameters"],
    [elements.productPromptMidjourneyReference, "midjourney.referenceUsage"],
    [elements.productPromptMidjourneyNegative, "midjourney.negativeGuidance"],
    [elements.productPromptGptChinese, "gptImage2.promptChinese"],
    [elements.productPromptGptEnglish, "gptImage2.promptEnglish"],
    [elements.productPromptGptRoles, "gptImage2.imageRoles"],
    [elements.productPromptGptBoundary, "gptImage2.editBoundary"],
    [elements.productPromptGptNegative, "gptImage2.negativeGuidance"],
  ].forEach(([field, path]) => {
    field.addEventListener("input", () => updateProductPromptResultField(path, field.value));
  });
  elements.productPromptMidjourneyParameters.addEventListener("blur", () => {
    if (!state.productPrompt.result) return;
    const safeValue = safeMidjourneyParameters(elements.productPromptMidjourneyParameters.value, state.productPrompt.aspectRatio);
    if (safeValue === elements.productPromptMidjourneyParameters.value) return;
    elements.productPromptMidjourneyParameters.value = safeValue;
    updateProductPromptResultField("midjourney.parameters", safeValue);
    showToast("已规范产品 Midjourney 参数，只保留画幅、风格、混沌和排除项。 ");
  });

  elements.videoUploadButton.addEventListener("click", () => elements.videoFile.click());
  elements.videoFile.addEventListener("change", async () => {
    const file = elements.videoFile.files?.[0];
    if (file) await setVideoSource(file);
    elements.videoFile.value = "";
  });
  elements.videoPlayer.addEventListener("loadedmetadata", () => {
    const source = state.video.source;
    if (!source) return;
    source.duration = Number.isFinite(elements.videoPlayer.duration) ? elements.videoPlayer.duration : 0;
    source.width = elements.videoPlayer.videoWidth || 0;
    source.height = elements.videoPlayer.videoHeight || 0;
    state.video.clipStart = 0;
    state.video.clipEnd = source.duration;
    if (source.duration > 60 * 60) {
      setVideoFeedback("当前版本只支持 1 小时以内的视频。请先截取想拉片的片段。", true);
    } else {
      setVideoFeedback("视频已准备好。可先自动取 6 帧，再删减或补采关键动作与转场。 ");
    }
    persist();
    renderVideo();
  });
  elements.videoPlayer.addEventListener("timeupdate", renderVideoTimeline);
  elements.videoPlayer.addEventListener("error", () => {
    if (state.video.source) {
      setVideoFeedback("浏览器无法解码这个视频。请先转成 H.264 MP4 或 WEBM 再试。", true);
    }
  });
  elements.videoTimeline.addEventListener("input", () => {
    if (!state.video.source) return;
    elements.videoPlayer.currentTime = Number(elements.videoTimeline.value);
    renderVideoTimeline();
  });
  elements.videoClipStart.addEventListener("input", () => setVideoClipValue("start", elements.videoClipStart.value));
  elements.videoClipEnd.addEventListener("input", () => setVideoClipValue("end", elements.videoClipEnd.value));
  elements.videoClipStart.addEventListener("change", () => setVideoClipValue("start", elements.videoClipStart.value, { feedback: true }));
  elements.videoClipEnd.addEventListener("change", () => setVideoClipValue("end", elements.videoClipEnd.value, { feedback: true }));
  elements.videoClipStartSeconds.addEventListener("change", () => setVideoClipValue("start", elements.videoClipStartSeconds.value, { feedback: true }));
  elements.videoClipEndSeconds.addEventListener("change", () => setVideoClipValue("end", elements.videoClipEndSeconds.value, { feedback: true }));
  elements.setVideoClipStart.addEventListener("click", () => setVideoClipFromCurrent("start"));
  elements.setVideoClipEnd.addEventListener("click", () => setVideoClipFromCurrent("end"));
  elements.resetVideoClip.addEventListener("click", resetVideoClip);
  elements.captureCurrentFrame.addEventListener("click", captureCurrentVideoFrame);
  elements.useCurrentFrameAsPrimary.addEventListener("click", useCurrentVideoFrameAsPrimary);
  elements.sampleVideoFrames.addEventListener("click", sampleVideoFrames);
  elements.clearVideoFrames.addEventListener("click", clearVideoFrames);
  [elements.videoDirectorNote, elements.videoExclusions].forEach((field) => {
    field.addEventListener("input", () => {
      updateVideoSettingsFromControls();
      if (!state.busy) resetVideoProgress();
      setVideoFeedback("导演要求已更新；如需让它作用于镜头拆解，请重新开始逐镜拉片。 ");
    });
  });
  elements.analyzeVideo.addEventListener("click", analyzeVideo);
  $$("[data-video-language]").forEach((button) => {
    button.addEventListener("click", () => {
      const language = button.dataset.videoLanguage;
      if (language !== "zh" && language !== "en") return;
      state.video.promptLanguage = language;
      persist();
      renderVideoResults();
    });
  });
  elements.copyVideoStoryboard.addEventListener("click", () => {
    copyText(videoStoryboardMarkdown(), "LibTV 15 字段分镜已复制。 ");
  });
  elements.downloadVideoStoryboard.addEventListener("click", downloadVideoStoryboard);
  elements.clearVideoReport.addEventListener("click", clearVideoReport);

  elements.saveVersion.addEventListener("click", saveVersion);
  elements.restoreVersion.addEventListener("click", restoreLastVersion);
  elements.exportMenu.addEventListener("click", () => {
    const willOpen = elements.exportPopover.hidden;
    elements.exportPopover.hidden = !willOpen;
    elements.exportMenu.setAttribute("aria-expanded", String(willOpen));
  });
  elements.exportMarkdown.addEventListener("click", exportMarkdown);
  elements.exportJson.addEventListener("click", exportJson);

  $$(".platform-tab").forEach((tab) => {
    tab.addEventListener("click", () => {
      state.activePlatform = tab.dataset.platform;
      persist();
      renderPlatformTabs();
    });
  });

  $$(".prompt-language-tab").forEach((tab) => {
    tab.addEventListener("click", () => {
      const language = tab.dataset.promptLanguage;
      if (language !== "zh" && language !== "en") return;
      state.promptLanguages[state.activePlatform] = language;
      persist();
      renderPlatformPrompts();
    });
  });

  $$(".copy-button").forEach((button) => {
    button.addEventListener("click", () => {
      if (button.dataset.copyCommand === "midjourney") {
        copyText(buildMidjourneyCommand(), "Midjourney 可执行命令已复制。先把图片1放入 Image Prompt 区域再生成。");
        return;
      }
      const target = $(`#${button.dataset.copyTarget}`);
      copyText(target?.value || "", `${target?.id === "gpt-prompt" ? "GPT Image 2" : "Midjourney"} 提示词已复制。`);
    });
  });

  bindPromptField("#midjourney-prompt", "midjourney", "prompt");
  bindPromptField("#midjourney-reference", "midjourney", "referenceUsage");
  bindPromptField("#midjourney-parameters", "midjourney", "parameters");
  bindPromptField("#midjourney-negative", "midjourney", "negativeGuidance");
  bindPromptField("#gpt-prompt", "gptImage2", "prompt");
  bindPromptField("#gpt-roles", "gptImage2", "imageRoles");
  bindPromptField("#gpt-boundary", "gptImage2", "editBoundary");
  bindPromptField("#gpt-negative", "gptImage2", "negativeGuidance");

  document.addEventListener("click", (event) => {
    if (!elements.exportPopover.hidden && !elements.exportPopover.contains(event.target) && event.target !== elements.exportMenu) {
      elements.exportPopover.hidden = true;
      elements.exportMenu.setAttribute("aria-expanded", "false");
    }
    if (!elements.projectsPopover.hidden && !elements.projectsPopover.contains(event.target) && !elements.projectControls?.contains?.(event.target)) {
      elements.projectsPopover.hidden = true;
      elements.openProjects.setAttribute("aria-expanded", "false");
    }
  });
  window.addEventListener("resize", scheduleCompositionFraming);
}

function initialize() {
  if (window.location.protocol === "file:") {
    throw new Error("当前是直接打开本地 HTML 文件。请改用 http://127.0.0.1:4317/ 打开工作台。");
  }
  assertRequiredUi();
  restoreTheme();
  restorePersistentState();
  populateControls();
  renderImages();
  renderPromptStudy();
  renderProductPromptControls();
  renderVideo();
  renderCoverWorkbench();
  bindEvents();
  renderCurrentStage();
  renderAssets();
  setActiveWorkspace(state.activeWorkspace, { persistSelection: false, scroll: false });
  refreshAssets().catch((error) => {
    elements.assetLibraryNote.textContent = `资产库暂时无法读取：${error.message}`;
  });
  checkHealth();
  setInterval(checkHealth, 30000);
  document.documentElement.dataset.appReady = "true";
}

window.addEventListener("error", (event) => {
  if (event.error) showUiRuntimeError(event.error);
});
window.addEventListener("unhandledrejection", (event) => {
  showUiRuntimeError(event.reason);
});

try {
  initialize();
} catch (error) {
  console.error(error);
  showUiRuntimeError(error);
}
