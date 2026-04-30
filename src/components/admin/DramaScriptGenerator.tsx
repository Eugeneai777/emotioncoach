import { useState, useRef, useCallback, useEffect } from "react";
import { AdminPageLayout } from "./shared/AdminPageLayout";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { extractEdgeFunctionError } from "@/lib/edgeFunctionError";
import { mergeVideosClientSide } from "@/utils/videoMerger";
import { toast } from "sonner";
import { Copy, Loader2, Download, Clapperboard, User, Film, Sparkles, ShoppingCart, Target, MessageSquare, Video, Play, Square, Check, X, Mic, Volume2, RefreshCw, Save, Library, Trash2, Wand2, Image as ImageIcon } from "lucide-react";

const GENRES = [
  { value: "suspense", label: "🔍 悬疑推理" },
  { value: "romance", label: "💕 爱情情感" },
  { value: "comedy", label: "😂 搞笑幽默" },
  { value: "healing", label: "🌿 治愈温暖" },
  { value: "scifi", label: "🚀 科幻未来" },
  { value: "horror", label: "👻 恐怖惊悚" },
];

const STYLES = [
  { value: "cyberpunk", label: "🌃 赛博朋克" },
  { value: "anime", label: "🎌 日系动漫" },
  { value: "chinese", label: "🏮 中国风" },
  { value: "realistic", label: "🎬 3D写实" },
  { value: "comic", label: "💥 美式漫画" },
];

const TARGET_AUDIENCES = [
  { value: "women", label: "👩 35+女性" },
  { value: "men", label: "👨 中年男性" },
  { value: "professional", label: "💼 职场人" },
  { value: "general", label: "🌐 通用" },
];

const CONVERSION_STYLES = [
  { value: "plot", label: "🎭 剧情植入", desc: "产品自然出现在剧情中" },
  { value: "ending", label: "📢 结尾推荐", desc: "剧情结束后推荐产品" },
  { value: "usage", label: "📱 角色使用", desc: "主角使用产品解决问题" },
];

const CONFLICT_LEVELS = [
  { value: "standard", label: "标准冲突", desc: "清晰矛盾 + 温和反转" },
  { value: "strong", label: "强冲突", desc: "高压开场 + 情绪升级" },
  { value: "viral", label: "爆款夸张", desc: "极限误会 + 强反转结尾" },
];

const SEQUEL_DIRECTIONS = [
  { value: "new_evidence", label: "新证据推翻上一集" },
  { value: "third_party_pressure", label: "第三方闯入加压" },
  { value: "costly_counterattack", label: "主角反击但代价更大" },
  { value: "hidden_truth", label: "沉默真相突然爆开" },
  { value: "countdown_choice", label: "限时选择逼到绝境" },
];

const SEQUEL_OPENING_ANGLES = [
  { value: "one_second_later", label: "上一句台词后1秒接上" },
  { value: "prop_focus", label: "用关键道具开场" },
  { value: "reaction_first", label: "先拍对方沉默反应" },
  { value: "external_interrupt", label: "电话/敲门/弹窗打断" },
];

const BASE_URL = "https://wechat.eugenewe.net";

interface ProductItem {
  key: string;
  name: string;
  description: string;
  route: string;
  url: string;
}

const PRODUCT_CATALOG: Record<string, { label: string; icon: string; items: ProductItem[] }> = {
  assessment: {
    label: "📊 测评",
    icon: "📊",
    items: [
      { key: "emotion_health", name: "情绪健康测评", description: "基于PHQ-9/GAD-7量表，快速了解情绪健康状态", route: "/assessment/emotion-health", url: `${BASE_URL}/assessment/emotion-health` },
      { key: "wealth_block", name: "财富卡点测评", description: "发现阻碍财富增长的心理卡点", route: "/wealth-block-assessment", url: `${BASE_URL}/wealth-block-assessment` },
      { key: "women_competitiveness", name: "35+女性竞争力", description: "评估职场女性核心竞争力维度", route: "/assessment/women-competitiveness", url: `${BASE_URL}/assessment/women-competitiveness` },
      { key: "midlife_awakening", name: "中场觉醒力", description: "中年人生觉醒力全面评估", route: "/assessment/midlife-awakening", url: `${BASE_URL}/assessment/midlife-awakening` },
      { key: "scl90", name: "SCL-90心理健康", description: "90项症状自评，全面心理健康筛查", route: "/assessment/scl90", url: `${BASE_URL}/assessment/scl90` },
    ],
  },
  camp: {
    label: "🏕 训练营",
    icon: "🏕",
    items: [
      { key: "emotion_stress_7", name: "7天有劲训练营", description: "7天情绪解压，AI+真人教练陪伴式成长", route: "/camps", url: `${BASE_URL}/camps` },
      { key: "wealth_block_7", name: "财富觉醒营", description: "突破财富卡点，重塑金钱关系", route: "/camps", url: `${BASE_URL}/camps` },
      { key: "identity_bloom", name: "身份绽放营", description: "发现真实自我，绽放独特价值", route: "/camps", url: `${BASE_URL}/camps` },
      { key: "emotion_bloom", name: "情绪绽放营", description: "深度情绪疗愈，从内而外绽放", route: "/camps", url: `${BASE_URL}/camps` },
    ],
  },
  tool: {
    label: "🛠 工具",
    icon: "🛠",
    items: [
      { key: "emotion_sos", name: "情绪SOS", description: "情绪崩溃时的即时AI急救工具", route: "/emotion-sos", url: `${BASE_URL}/emotion-sos` },
      { key: "breathing", name: "呼吸练习", description: "科学呼吸法，快速平复焦虑", route: "/breathing", url: `${BASE_URL}/breathing` },
      { key: "ai_coach", name: "AI教练对话", description: "24小时在线AI情绪教练，随时倾诉", route: "/coach-voice-chat", url: `${BASE_URL}/coach-voice-chat` },
    ],
  },
  store: {
    label: "🛒 商城",
    icon: "🛒",
    items: [
      { key: "zhile_capsule", name: "知乐胶囊", description: "天然植物配方，改善睡眠与情绪", route: "/health-store", url: `${BASE_URL}/health-store` },
      { key: "synergy_package", name: "协同套餐", description: "AI训练营+知乐胶囊，身心协同调理", route: "/promo/synergy", url: `${BASE_URL}/promo/synergy` },
    ],
  },
};

interface Character {
  name: string;
  description: string;
  imagePrompt: string;
  referenceImageUrl?: string;
}

interface PrimaryCharacterLockCard {
  name: string;
  sourceCharacterIndex: number;
  fixedAppearance: string;
  fixedOutfit: string;
  identityAndTemperament: string;
  visualPrompt: string;
  negativePrompt: string;
  referenceImageUrl?: string;
  createdAt: string;
}

interface Scene {
  sceneNumber: number;
  panel: string;
  imagePrompt: string;
  characterAction: string;
  dialogue: string;
  narration?: string;
  bgm: string;
  duration: string;
  relatedProduct?: string;
  generatedImageUrl?: string;
}

interface DramaScript {
  title: string;
  synopsis: string;
  conversionStyles?: string[];
  coverPoster?: {
    headline: string;
    subheadline: string;
    hookText: string;
    posterImagePrompt: string;
  };
  consistencyCheck?: {
    overallScore: number;
    characterScore: number;
    plotScore: number;
    visualScore: number;
    productScore: number;
    verdict: string;
    issues: string[];
    regenerationAdvice: string;
  };
  continuityBridge?: {
    inheritedFromPrevious: string;
    openingConnection: string;
    unresolvedHookCarried: string;
    nextEpisodeHook: string;
  };
  primaryCharacterLock?: PrimaryCharacterLockCard;
  characters: Character[];
  scenes: Scene[];
  totalScenes: number;
  estimatedDuration: string;
  conversionScript?: string;
  commentHook?: string;
}

interface SavedDramaScript {
  id: string;
  creator_id: string;
  title: string;
  synopsis: string | null;
  mode: "generic" | "youjin";
  theme: string;
  genre: string | null;
  style: string | null;
  conflict_intensity: string | null;
  target_audience: string | null;
  conversion_style: string | null;
  selected_products: ProductItem[];
  script_data: DramaScript;
  series_id: string;
  parent_script_id: string | null;
  episode_number: number;
  created_at: string;
}

type VideoStatus = "idle" | "submitting" | "in_queue" | "generating" | "done" | "failed";

interface SceneVideoState {
  status: VideoStatus;
  taskId?: string;
  videoUrl?: string;
  error?: string;
}

type AudioStatus = "idle" | "generating" | "done" | "failed";

interface SceneAudioState {
  status: AudioStatus;
  audioBase64?: string;
  audioUrl?: string; // Public URL after upload to storage
  error?: string;
}

type ImageStatus = "idle" | "generating" | "done" | "failed";

interface SceneImageState {
  status: ImageStatus;
  imageUrl?: string;
  error?: string;
}

function base64ToBlob(base64: string, mimeType: string): Blob {
  const byteChars = atob(base64);
  const byteNums = new Uint8Array(byteChars.length);
  for (let i = 0; i < byteChars.length; i++) byteNums[i] = byteChars.charCodeAt(i);
  return new Blob([byteNums], { type: mimeType });
}

const ASPECT_RATIOS = [
  { value: "9:16", label: "9:16 竖屏" },
  { value: "16:9", label: "16:9 横屏" },
  { value: "1:1", label: "1:1 方形" },
];

const VIDEO_DURATIONS = [
  { value: 5, label: "5秒" },
  { value: 10, label: "10秒" },
];

const STYLE_LOCKS: Record<string, string> = {
  cyberpunk: "竖屏短剧，赛博朋克都市夜景，霓虹边缘光，高对比电影感，真实表演节奏，统一冷暖霓虹色调，不要字幕、水印、UI文字。",
  anime: "竖屏短剧，高级日系动画剧集质感，干净线条，统一角色比例，电影感构图，情绪表演清晰，不要字幕、水印、UI文字。",
  chinese: "竖屏短剧，现代中国审美，克制东方氛围，电影感光影，统一低饱和色调，真实情绪张力，不要字幕、水印、UI文字。",
  realistic: "竖屏9:16，现实主义都市短剧风格，电影感光影，低饱和度，真实人物表演，浅景深，情绪张力强，不要卡通、二次元、字幕、水印、UI文字。",
  comic: "竖屏短剧，美式漫画电影质感，强构图，戏剧化光影，统一人物造型和色彩层次，不要字幕、水印、UI文字。",
};

const CONSISTENCY_THRESHOLD = 85;

const normalizeConversionStyles = (styles?: string[] | string | null) => {
  const values = Array.isArray(styles) ? styles : styles ? [styles] : ["plot"];
  const validValues = values.filter((value) => CONVERSION_STYLES.some((style) => style.value === value));
  return validValues.length > 0 ? validValues : ["plot"];
};

const inferFixedOutfit = (text: string) => {
  const matches = text.match(/(?:wearing|dressed in|outfit|clothing|服装|穿着|身穿|外套|衬衫|西装|连衣裙|长裤|裙子|上衣)[^.,;，。；]*/gi);
  return matches?.slice(0, 3).join("；") || "沿用人物一固定服装与配饰，不随镜头改变";
};

const inferFixedAppearance = (char: Character) => {
  const text = [char.description, char.imagePrompt].filter(Boolean).join("；");
  return text || "保持人物一固定脸型、年龄感、发型、身材和可识别外貌特征";
};

const buildPrimaryCharacterLockCard = (script?: DramaScript | null): PrimaryCharacterLockCard | undefined => {
  const primary = script?.characters?.[0];
  if (!primary) return undefined;
  const fixedAppearance = inferFixedAppearance(primary);
  const fixedOutfit = inferFixedOutfit([primary.description, primary.imagePrompt].filter(Boolean).join("；"));
  const identityAndTemperament = primary.description || "保持人物一身份、性格、情绪状态和表演气质一致";
  const negativePrompt = "不要改变人物一的脸型、年龄感、发型、服装、身材、身份和气质；不要替换主角；不要新增无关主角；不要字幕、水印、Logo、UI文字；不要卡通化或风格漂移。";
  return {
    name: primary.name || "人物一",
    sourceCharacterIndex: 0,
    fixedAppearance,
    fixedOutfit,
    identityAndTemperament,
    visualPrompt: `${primary.name || "人物一"}：${primary.description || ""}。固定视觉：${primary.imagePrompt || ""}。固定服装：${fixedOutfit}。`,
    negativePrompt,
    referenceImageUrl: primary.referenceImageUrl,
    createdAt: new Date().toISOString(),
  };
};

const ensurePrimaryCharacterLock = (script: DramaScript): DramaScript => ({
  ...script,
  primaryCharacterLock: script.primaryCharacterLock || buildPrimaryCharacterLockCard(script),
});

const formatPrimaryCharacterLock = (script?: DramaScript | null) => {
  const lock = script?.primaryCharacterLock || buildPrimaryCharacterLockCard(script);
  if (!lock) return "";
  return `${lock.name}
固定外貌：${lock.fixedAppearance}
固定服装：${lock.fixedOutfit}
身份气质：${lock.identityAndTemperament}
视觉提示：${lock.visualPrompt}
负面提示：${lock.negativePrompt}`;
};

const summarizeSceneForSequel = (scene?: Scene) => {
  if (!scene) return "上一集结尾暂无摘要";
  return [scene.characterAction, scene.dialogue || scene.narration]
    .filter(Boolean)
    .join("｜")
    .slice(0, 120) || "上一集结尾暂无摘要";
};

const buildPreviousScriptContext = (script: SavedDramaScript) => {
  const scriptData = script.script_data;
  const scenes = scriptData?.scenes || [];
  return {
    id: script.id,
    title: script.title,
    synopsis: script.synopsis,
    mode: script.mode,
    genre: script.genre,
    style: script.style,
    conflict_intensity: script.conflict_intensity,
    target_audience: script.target_audience,
    conversion_style: script.conversion_style,
    selected_products: script.selected_products || [],
    series_id: script.series_id,
    episode_number: script.episode_number,
    script_data: {
      title: scriptData?.title || script.title,
      synopsis: scriptData?.synopsis || script.synopsis,
      characters: scriptData?.characters || [],
      scenes: scenes.slice(-2),
      conversionStyles: scriptData?.conversionStyles,
      continuityBridge: scriptData?.continuityBridge,
      consistencyCheck: scriptData?.consistencyCheck,
    },
  };
};

export default function DramaScriptGenerator() {
  const [mode, setMode] = useState<"generic" | "youjin">("generic");
  const [theme, setTheme] = useState("");
  const [genre, setGenre] = useState("suspense");
  const [style, setStyle] = useState("anime");
  const [sceneCount, setSceneCount] = useState(8);
  const [conflictIntensity, setConflictIntensity] = useState("viral");
  const [targetAudience, setTargetAudience] = useState("women");
  const [conversionStyles, setConversionStyles] = useState<string[]>(["plot"]);
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<DramaScript | null>(null);
  const [savedScripts, setSavedScripts] = useState<SavedDramaScript[]>([]);
  const [savedScriptId, setSavedScriptId] = useState<string | null>(null);
  const [activeSavedScript, setActiveSavedScript] = useState<SavedDramaScript | null>(null);
  const [savingScript, setSavingScript] = useState(false);
  const [loadingSavedScripts, setLoadingSavedScripts] = useState(false);
  const [generatingSequel, setGeneratingSequel] = useState(false);
  const [sequelGenerationSource, setSequelGenerationSource] = useState<{ title: string; episodeNumber: number } | null>(null);
  const [sequelGenerationStep, setSequelGenerationStep] = useState("");
  const [sequelGenerationError, setSequelGenerationError] = useState<string | null>(null);
  const [pendingSequel, setPendingSequel] = useState<{ source: SavedDramaScript; script: DramaScript; products: ProductItem[]; conversionStyles: string[] } | null>(null);
  const [sequelDirection, setSequelDirection] = useState("new_evidence");
  const [sequelOpeningAngle, setSequelOpeningAngle] = useState("one_second_later");
  const [suggestedThemes, setSuggestedThemes] = useState<{ title: string; description: string }[]>([]);
  const [loadingThemes, setLoadingThemes] = useState(false);
  const [selectedThemeIdx, setSelectedThemeIdx] = useState<number | null>(null);
  const [sequelConversionOverrides, setSequelConversionOverrides] = useState<Record<string, string[]>>({});
  const themeFetchRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sequelStatusRef = useRef<HTMLDivElement | null>(null);

  // Image/video generation state
  const [imageAspectRatio, setImageAspectRatio] = useState("9:16");
  const [sceneImages, setSceneImages] = useState<Record<number, SceneImageState>>({});
  const [characterImages, setCharacterImages] = useState<Record<number, SceneImageState>>({});
  const [batchGeneratingImages, setBatchGeneratingImages] = useState(false);
  const [generatingCharacterRefs, setGeneratingCharacterRefs] = useState(false);

  // Video generation state
  const [videoAspectRatio, setVideoAspectRatio] = useState("9:16");
  const [videoDuration, setVideoDuration] = useState(5);
  const [sceneVideos, setSceneVideos] = useState<Record<number, SceneVideoState>>({});
  const [videoPreviewFallbacks, setVideoPreviewFallbacks] = useState<Record<number, boolean>>({});
  const [confirmedPrimaryLock, setConfirmedPrimaryLock] = useState("");
  const [confirmedStyleLock, setConfirmedStyleLock] = useState("");
  const [locksConfirmed, setLocksConfirmed] = useState(false);
  const [batchGenerating, setBatchGenerating] = useState(false);
  const [merging, setMerging] = useState(false);
  const pollingRefs = useRef<Record<number, ReturnType<typeof setInterval>>>({});

  // Audio/TTS state
  const [sceneAudios, setSceneAudios] = useState<Record<number, SceneAudioState>>({});
  const [batchGeneratingAudio, setBatchGeneratingAudio] = useState(false);

  const toggleProduct = (key: string) => {
    setSelectedProducts((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const toggleConversionStyle = (value: string) => {
    setConversionStyles((prev) => {
      if (prev.includes(value)) {
        const next = prev.filter((item) => item !== value);
        return next.length > 0 ? next : ["plot"];
      }
      return [...prev, value];
    });
  };

  const getScriptConversionStyles = (script: SavedDramaScript) =>
    normalizeConversionStyles(script.script_data?.conversionStyles || script.conversion_style || conversionStyles);

  const getSequelConversionStyles = (script: SavedDramaScript) =>
    sequelConversionOverrides[script.id] || getScriptConversionStyles(script);

  const toggleSequelConversionStyle = (script: SavedDramaScript, value: string) => {
    setSequelConversionOverrides((prev) => {
      const current = prev[script.id] || getScriptConversionStyles(script);
      const next = current.includes(value) ? current.filter((item) => item !== value) : [...current, value];
      return { ...prev, [script.id]: next.length > 0 ? next : ["plot"] };
    });
  };

  const getSelectedProductDetails = useCallback((): ProductItem[] => {
    const all: ProductItem[] = [];
    Object.values(PRODUCT_CATALOG).forEach((cat) => {
      cat.items.forEach((item) => {
        if (selectedProducts.has(item.key)) all.push(item);
      });
    });
    return all;
  }, [selectedProducts]);

  const getProductName = (key: string): string => {
    for (const cat of Object.values(PRODUCT_CATALOG)) {
      const found = cat.items.find((i) => i.key === key);
      if (found) return found.name;
    }
    return key;
  };

  const fetchSavedScripts = useCallback(async () => {
    setLoadingSavedScripts(true);
    try {
      const { data, error } = await (supabase as any)
        .from("drama_scripts")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(30);
      if (error) throw error;
      setSavedScripts((data || []) as unknown as SavedDramaScript[]);
    } catch (e: any) {
      toast.error(e.message || "脚本库加载失败");
    } finally {
      setLoadingSavedScripts(false);
    }
  }, []);

  useEffect(() => {
    fetchSavedScripts();
  }, [fetchSavedScripts]);

  // Auto-fetch suggested themes when products change in youjin mode
  const fetchSuggestedThemes = useCallback(async (avoidTitles: string[] = []) => {
    if (mode !== "youjin" || selectedProducts.size === 0) {
      setSuggestedThemes([]);
      return;
    }
    setLoadingThemes(true);
    setSuggestedThemes([]);
    setSelectedThemeIdx(null);
    try {
      const products = getSelectedProductDetails();
      const { data, error } = await supabase.functions.invoke("drama-script-ai", {
        body: { action: "suggest_themes", products, targetAudience, conflictIntensity, avoidTitles },
      });
      if (data?.themes && Array.isArray(data.themes)) {
        setSuggestedThemes(data.themes.slice(0, 3));
      }
    } catch {
      // silently fail
    } finally {
      setLoadingThemes(false);
    }
  }, [mode, selectedProducts, targetAudience, conflictIntensity, getSelectedProductDetails]);

  useEffect(() => {
    if (mode !== "youjin" || selectedProducts.size === 0) {
      setSuggestedThemes([]);
      return;
    }
    if (themeFetchRef.current) clearTimeout(themeFetchRef.current);
    themeFetchRef.current = setTimeout(() => {
      fetchSuggestedThemes();
    }, 600);
    return () => {
      if (themeFetchRef.current) clearTimeout(themeFetchRef.current);
    };
  }, [selectedProducts, targetAudience, mode, conflictIntensity, fetchSuggestedThemes]);

  const refreshSuggestedThemes = () => {
    fetchSuggestedThemes(suggestedThemes.map((item) => item.title));
  };

  const handleGenerate = async () => {
    if (!theme.trim()) {
      toast.error("请输入故事主题");
      return;
    }
    if (mode === "youjin" && selectedProducts.size === 0) {
      toast.error("请至少选择一个产品");
      return;
    }
    setLoading(true);
    setResult(null);
    setSceneVideos({});
    setVideoPreviewFallbacks({});
    setSceneAudios({});
    setSceneImages({});
    setCharacterImages({});
    setSequelGenerationError(null);
    // Clear all polling
    Object.values(pollingRefs.current).forEach(clearInterval);
    pollingRefs.current = {};

    try {
      const body: any = { theme, genre, style, sceneCount, mode, conflictIntensity };
      if (mode === "youjin") {
        body.products = getSelectedProductDetails();
        body.targetAudience = targetAudience;
        body.conversionStyles = conversionStyles;
        body.conversionStyle = conversionStyles[0] || "plot";
      }
      const { data, error } = await supabase.functions.invoke("drama-script-ai", { body });
      if (data?.error || error) {
        throw new Error(await extractEdgeFunctionError(data, error, "生成失败，请稍后重试"));
      }
      const generatedScript = ensurePrimaryCharacterLock(data as DramaScript);
      setResult(generatedScript);
      setConfirmedPrimaryLock(formatPrimaryCharacterLock(generatedScript));
      setConfirmedStyleLock(STYLE_LOCKS[style] || STYLE_LOCKS.realistic);
      setLocksConfirmed(false);
      setSavedScriptId(null);
      setActiveSavedScript(null);
      toast.success("脚本生成成功！");
    } catch (e: any) {
      toast.error(e.message || "生成失败");
    } finally {
      setLoading(false);
    }
  };

  const clearGeneratedAssets = () => {
    setSceneVideos({});
    setVideoPreviewFallbacks({});
    setSceneAudios({});
    setSceneImages({});
    setCharacterImages({});
    Object.values(pollingRefs.current).forEach(clearInterval);
    pollingRefs.current = {};
  };

  const saveCurrentScript = async () => {
    if (!result) return;
    setSavingScript(true);
    try {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError || !userData.user) throw new Error("请先登录后再保存脚本");

      const selectedProductDetails = getSelectedProductDetails();
      const isUpdatingExisting = Boolean(savedScriptId && activeSavedScript?.id === savedScriptId);
      const payload = {
        creator_id: userData.user.id,
        title: result.title,
        synopsis: result.synopsis,
        mode,
        theme,
        genre,
        style,
        conflict_intensity: conflictIntensity,
        target_audience: mode === "youjin" ? targetAudience : null,
        conversion_style: mode === "youjin" ? conversionStyles[0] || "plot" : null,
        selected_products: selectedProductDetails,
        script_data: buildScriptWithGeneratedImages(),
        series_id: isUpdatingExisting ? activeSavedScript?.series_id : activeSavedScript?.series_id,
        parent_script_id: isUpdatingExisting ? activeSavedScript?.parent_script_id : activeSavedScript?.id || null,
        episode_number: isUpdatingExisting ? activeSavedScript?.episode_number || 1 : activeSavedScript ? activeSavedScript.episode_number + 1 : 1,
      };
      if (!payload.series_id) delete (payload as any).series_id;

      const query = savedScriptId
        ? (supabase as any).from("drama_scripts").update(payload).eq("id", savedScriptId).select().limit(1)
        : (supabase as any).from("drama_scripts").insert(payload).select().limit(1);
      const { data, error } = await query;
      if (error) throw error;
      if (!data || data.length === 0) throw new Error("保存失败：权限不足或记录未写入");

      const saved = data[0] as SavedDramaScript;
      setSavedScriptId(saved.id);
      setActiveSavedScript(saved);
      await fetchSavedScripts();
      toast.success("脚本已保存");
    } catch (e: any) {
      toast.error(e.message || "保存失败");
    } finally {
      setSavingScript(false);
    }
  };

  const buildScriptWithGeneratedImages = useCallback((): DramaScript | null => {
    if (!result) return null;
    return {
      ...result,
      primaryCharacterLock: {
        ...(result.primaryCharacterLock || buildPrimaryCharacterLockCard(result)!),
        referenceImageUrl: characterImages[0]?.imageUrl || result.primaryCharacterLock?.referenceImageUrl || result.characters[0]?.referenceImageUrl,
      },
      conversionStyles: mode === "youjin" ? conversionStyles : undefined,
      characters: result.characters.map((char, index) => ({
        ...char,
        referenceImageUrl: characterImages[index]?.imageUrl || char.referenceImageUrl,
      })),
      scenes: result.scenes.map((scene) => ({
        ...scene,
        generatedImageUrl: sceneImages[scene.sceneNumber]?.imageUrl || scene.generatedImageUrl,
      })),
    };
  }, [characterImages, conversionStyles, mode, result, sceneImages]);

  const loadSavedScript = (script: SavedDramaScript) => {
    setMode(script.mode || "generic");
    setTheme(script.theme || script.title);
    setGenre(script.genre || "suspense");
    setStyle(script.style || "anime");
    setConflictIntensity(script.conflict_intensity || "viral");
    setTargetAudience(script.target_audience || "women");
    setConversionStyles(normalizeConversionStyles(script.script_data?.conversionStyles || script.conversion_style));
    setSelectedProducts(new Set((script.selected_products || []).map((p) => p.key)));
    const loadedScript = ensurePrimaryCharacterLock(script.script_data);
    setResult(loadedScript);
    setConfirmedPrimaryLock(formatPrimaryCharacterLock(loadedScript));
    setConfirmedStyleLock(STYLE_LOCKS[script.style || style] || STYLE_LOCKS.realistic);
    setLocksConfirmed(Boolean(loadedScript.primaryCharacterLock));
    setSequelGenerationError(null);
    setSequelGenerationSource(null);
    setSceneImages(Object.fromEntries((script.script_data?.scenes || []).filter((s) => s.generatedImageUrl).map((s) => [s.sceneNumber, { status: "done", imageUrl: s.generatedImageUrl! }])));
    setCharacterImages(Object.fromEntries((script.script_data?.characters || []).map((c, index) => c.referenceImageUrl ? [index, { status: "done", imageUrl: c.referenceImageUrl }] : null).filter(Boolean) as [number, SceneImageState][]));
    setSavedScriptId(script.id);
    setActiveSavedScript(script);
    setSceneVideos({});
    setVideoPreviewFallbacks({});
    setSceneAudios({});
    Object.values(pollingRefs.current).forEach(clearInterval);
    pollingRefs.current = {};
    toast.success(`已载入《${script.title}》第${script.episode_number}集`);
  };

  const deleteSavedScript = async (script: SavedDramaScript) => {
    try {
      const { data, error } = await (supabase as any)
        .from("drama_scripts")
        .delete()
        .eq("id", script.id)
        .select()
        .limit(1);
      if (error) throw error;
      if (!data || data.length === 0) throw new Error("删除失败：权限不足或记录不存在");
      if (savedScriptId === script.id) {
        setSavedScriptId(null);
        setActiveSavedScript(null);
      }
      await fetchSavedScripts();
      toast.success("脚本已删除");
    } catch (e: any) {
      toast.error(e.message || "删除失败");
    }
  };

  const generateSequel = async (script = activeSavedScript) => {
    if (!script) {
      toast.error("请先保存或载入一个脚本，再生成续集");
      return;
    }
    setGeneratingSequel(true);
    setSequelGenerationSource({ title: script.title, episodeNumber: script.episode_number });
    setSequelGenerationStep("正在准备续集上下文...");
    setSequelGenerationError(null);
    setPendingSequel(null);
    try {
      const productsForSequel = script.selected_products || [];
      const sequelConversionStyles = getSequelConversionStyles(script);
      const lastScene = script.script_data?.scenes?.[script.script_data.scenes.length - 1];
      const previousLastSceneSummary = summarizeSceneForSequel(lastScene);
      const previousCharacterSummary = (script.script_data?.characters || []).map((char) => `${char.name}：${char.description}`).join("；");
      const sequelCreativeSeed = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const baseBody: any = {
        action: "generate_sequel",
        theme: "系列短剧续集：承接上一集结尾继续推进",
        genre: script.genre || genre,
        style: script.style || style,
        sceneCount,
        mode: script.mode,
        conflictIntensity,
        sequelEpisodeNumber: script.episode_number + 1,
        previousTitle: script.script_data?.title || script.title,
        previousSynopsis: script.script_data?.synopsis || script.synopsis,
        previousLastSceneSummary,
        previousCharacterSummary,
        previousScript: buildPreviousScriptContext(script),
        sequelCreativeSeed,
        sequelDirection,
        sequelOpeningAngle,
      };
      if (script.mode === "youjin") {
        baseBody.products = productsForSequel;
        baseBody.targetAudience = script.target_audience || targetAudience;
        baseBody.conversionStyles = sequelConversionStyles;
        baseBody.conversionStyle = sequelConversionStyles[0] || "plot";
      }

      setSequelGenerationStep("正在生成单版本续集...");
      const { data, error } = await supabase.functions.invoke("drama-script-ai", { body: baseBody });
      if (data?.error || error) {
        throw new Error(await extractEdgeFunctionError(data, error, "续集生成失败，请稍后重试"));
      }
      if ((data as DramaScript).consistencyCheck && ((data as DramaScript).consistencyCheck?.overallScore || 100) < CONSISTENCY_THRESHOLD) {
        toast.error(`一致性评分 ${(data as DramaScript).consistencyCheck?.overallScore}，建议重新生成一次`);
      }
      const sequelScript = ensurePrimaryCharacterLock(data as DramaScript);
      setPendingSequel({ source: script, script: sequelScript, products: productsForSequel, conversionStyles: sequelConversionStyles });
      setConfirmedPrimaryLock(formatPrimaryCharacterLock(sequelScript));
      setConfirmedStyleLock(STYLE_LOCKS[style] || STYLE_LOCKS.realistic);
      setLocksConfirmed(false);
      toast.success(`已生成第${script.episode_number + 1}集续集预览，未替换前不会改当前脚本`);
    } catch (e: any) {
      const message = e.message || "续集生成失败";
      setSequelGenerationError(message);
      toast.error(message);
    } finally {
      setGeneratingSequel(false);
      setSequelGenerationStep("");
    }
  };

  const applyPendingSequel = () => {
    if (!pendingSequel) return;
    const { source, script, products, conversionStyles: nextConversionStyles } = pendingSequel;
    setMode(source.mode || "generic");
    setGenre(source.genre || genre);
    setStyle(source.style || style);
    setTargetAudience(source.target_audience || targetAudience);
    setConversionStyles(nextConversionStyles);
    setSelectedProducts(new Set(products.map((p) => p.key)));
    clearGeneratedAssets();
    setTheme(script.title);
    setResult(script);
    setSavedScriptId(null);
    setActiveSavedScript(source);
    setPendingSequel(null);
    setSequelGenerationError(null);
    toast.success(`已替换为第${source.episode_number + 1}集续集`);
  };

  const discardPendingSequel = () => {
    setPendingSequel(null);
    setSequelGenerationError(null);
    toast.info("已保留当前脚本，续集预览已放弃");
  };

  const copyToClipboard = (text: string, label = "提示词") => {
    navigator.clipboard.writeText(text);
    toast.success(`${label}已复制`);
  };

  const [modalVideoUrl, setModalVideoUrl] = useState<string | null>(null);

  const openVideoUrl = (url: string) => {
    // Try new tab first
    const popup = window.open(url, "_blank", "noopener,noreferrer");
    if (popup) return;
    // Fallback: show in-page modal instead of navigating away
    setModalVideoUrl(url);
  };

  const exportJSON = () => {
    if (!result) return;
    const blob = new Blob([JSON.stringify(buildScriptWithGeneratedImages(), null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${result.title || "drama-script"}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const buildFullConversionText = () => {
    if (!result?.conversionScript) return "";
    let text = result.conversionScript;
    getSelectedProductDetails().forEach((p) => {
      text = text.replace(new RegExp(`\\{\\{${p.name}\\}\\}`, "g"), `${p.name} 👉 ${p.url}`);
    });
    return text;
  };

  // --- GPT Image 2.0 Scene Image Generation ---
  const characterReferenceUrls = useCallback(() => {
    return Object.values(characterImages).map((state) => state.imageUrl).filter(Boolean) as string[];
  }, [characterImages]);

  const buildPrimaryCharacterLock = useCallback(() => {
    const primary = result?.characters?.[0];
    if (!primary) return "当前脚本暂无人物一，请严格保持画面中已有主角的年龄、脸型、服装和气质一致。";
    return `${primary.name}：${primary.description}\n固定视觉：${primary.imagePrompt}\n要求：保持同一位人物一，不要改变脸型、年龄感、发型、服装、身材、气质和身份，不要替换主角。`;
  }, [result]);

  const buildStyleLock = useCallback(() => {
    return STYLE_LOCKS[style] || STYLE_LOCKS.realistic;
  }, [style]);

  const buildJimengVideoPrompt = useCallback((scene: Scene) => {
    return `【人物一锁定】\n${buildPrimaryCharacterLock()}\n\n【统一风格锁定】\n${buildStyleLock()}\n\n【当前镜头】\n镜头${scene.sceneNumber}：${scene.panel}\n动作：${scene.characterAction}\n台词/情绪：${scene.dialogue || scene.narration || "无台词，靠表演传达情绪"}\n原始画面提示词：${scene.imagePrompt}\n\n【连续性要求】\n这是同一部短剧《${result?.title || "短剧"}》的第${scene.sceneNumber}个镜头，必须延续前后镜头的人物状态、服装、场景气质、情绪张力和视觉风格。不要新增无关主角，不要出现字幕、水印、Logo或UI文字。`;
  }, [buildPrimaryCharacterLock, buildStyleLock, result]);

  const getVideoReferenceUrls = useCallback((sceneNum: number) => {
    const urls = [
      sceneImages[sceneNum]?.imageUrl,
      characterImages[0]?.imageUrl || result?.primaryCharacterLock?.referenceImageUrl || result?.characters?.[0]?.referenceImageUrl,
      ...Object.entries(characterImages)
        .filter(([index]) => index !== "0")
        .map(([, state]) => state.imageUrl),
    ].filter(Boolean) as string[];
    return Array.from(new Set(urls)).slice(0, 3);
  }, [characterImages, result, sceneImages]);

  const generateCharacterReference = useCallback(async (char: Character, index: number) => {
    if (!result) return null;
    setCharacterImages((prev) => ({ ...prev, [index]: { status: "generating" } }));
    try {
      const { data, error } = await supabase.functions.invoke("drama-scene-image-openai", {
        body: {
          action: "character_reference",
          title: result.title,
          style,
          aspectRatio: "1:1",
          characters: [char],
          scene: {
            sceneNumber: `char-${index + 1}`,
            panel: "front-facing character reference portrait",
            characterAction: `Create a clean canonical character reference portrait for ${char.name}`,
            dialogue: "",
            imagePrompt: `${char.imagePrompt}. Full character identity reference, consistent face, hairstyle, outfit, recognizable props, clean background, no text.`,
          },
        },
      });
      if (data?.error || error) throw new Error(await extractEdgeFunctionError(data, error, "角色定妆图生成失败"));
      const imageUrl = data?.imageUrl as string | undefined;
      if (!imageUrl) throw new Error("未返回图片地址");
      setCharacterImages((prev) => ({ ...prev, [index]: { status: "done", imageUrl } }));
      return imageUrl;
    } catch (e: any) {
      setCharacterImages((prev) => ({ ...prev, [index]: { status: "failed", error: e.message || "生成失败" } }));
      toast.error(`${char.name} 定妆图生成失败：${e.message || "请重试"}`);
      return null;
    }
  }, [result, style]);

  const handleGenerateAndSavePrimaryReference = async () => {
    if (!result?.characters?.[0]) {
      toast.error("当前脚本没有人物一，无法生成参考图");
      return;
    }

    const imageUrl = await generateCharacterReference(result.characters[0], 0);
    if (!imageUrl) return;

    const baseLock = result.primaryCharacterLock || buildPrimaryCharacterLockCard(result);
    const updatedScript: DramaScript = {
      ...result,
      primaryCharacterLock: baseLock ? { ...baseLock, referenceImageUrl: imageUrl } : undefined,
      characters: result.characters.map((char, index) =>
        index === 0 ? { ...char, referenceImageUrl: imageUrl } : char
      ),
    };

    setResult(updatedScript);
    if (activeSavedScript) {
      setActiveSavedScript({ ...activeSavedScript, script_data: updatedScript });
    }

    if (savedScriptId) {
      try {
        const { data, error } = await (supabase as any)
          .from("drama_scripts")
          .update({ script_data: updatedScript })
          .eq("id", savedScriptId)
          .select()
          .limit(1);
        if (error) throw error;
        if (!data || data.length === 0) throw new Error("保存失败：权限不足或记录未写入");
        await fetchSavedScripts();
        toast.success("人物一参考图已生成，并保存到脚本库");
      } catch (e: any) {
        toast.error(e.message || "人物一参考图已生成，但保存到脚本库失败");
      }
    } else {
      toast.success("人物一参考图已生成，并保存到当前脚本数据；点击“保存脚本”后会写入脚本库");
    }
  };

  const handleGenerateCharacterReferences = async () => {
    if (!result) return;
    setGeneratingCharacterRefs(true);
    for (let i = 0; i < result.characters.length; i++) {
      if (characterImages[i]?.status === "done") continue;
      await generateCharacterReference(result.characters[i], i);
      await new Promise((r) => setTimeout(r, 800));
    }
    setGeneratingCharacterRefs(false);
    toast.success("角色定妆图已生成");
  };

  const generateSceneImage = useCallback(async (scene: Scene, extraReferences: string[] = []) => {
    if (!result) return null;
    const num = scene.sceneNumber;
    setSceneImages((prev) => ({ ...prev, [num]: { status: "generating" } }));
    try {
      const { data, error } = await supabase.functions.invoke("drama-scene-image-openai", {
        body: {
          title: result.title,
          style,
          aspectRatio: imageAspectRatio,
          characters: result.characters.map((char, index) => ({
            ...char,
            referenceImageUrl: characterImages[index]?.imageUrl || char.referenceImageUrl,
          })),
          characterReferenceUrls: characterReferenceUrls(),
          referenceImageUrls: extraReferences,
          scene,
        },
      });
      if (data?.error || error) throw new Error(await extractEdgeFunctionError(data, error, "分镜图片生成失败"));
      const imageUrl = data?.imageUrl as string | undefined;
      if (!imageUrl) throw new Error("未返回图片地址");
      setSceneImages((prev) => ({ ...prev, [num]: { status: "done", imageUrl } }));
      toast.success(`场景 ${num} 图片已生成`);
      return imageUrl;
    } catch (e: any) {
      setSceneImages((prev) => ({ ...prev, [num]: { status: "failed", error: e.message || "生成失败" } }));
      toast.error(`场景 ${num} 图片生成失败：${e.message || "请重试"}`);
      return null;
    }
  }, [characterImages, characterReferenceUrls, imageAspectRatio, result, style]);

  const handleBatchGenerateImages = async () => {
    if (!result) return;
    setBatchGeneratingImages(true);
    let previousImageUrl: string | undefined;
    for (const scene of result.scenes) {
      const state = sceneImages[scene.sceneNumber];
      if (state?.status === "done") {
        previousImageUrl = state.imageUrl;
        continue;
      }
      const references = previousImageUrl ? [previousImageUrl] : [];
      const imageUrl = await generateSceneImage(scene, references);
      if (imageUrl) previousImageUrl = imageUrl;
      await new Promise((r) => setTimeout(r, 1200));
    }
    setBatchGeneratingImages(false);
    toast.info("分镜图片批量生成已完成");
  };

  const downloadImage = async (url: string, label: string) => {
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error("下载失败");
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = `${label}.png`;
      a.click();
      URL.revokeObjectURL(blobUrl);
    } catch {
      copyToClipboard(url, "图片链接");
      toast.info("已复制图片链接，请在新标签页打开保存");
    }
  };

  // --- Video Generation Logic ---

  const updateSceneVideo = useCallback((sceneNum: number, update: Partial<SceneVideoState>) => {
    setSceneVideos(prev => ({
      ...prev,
      [sceneNum]: { ...prev[sceneNum], ...update },
    }));
  }, []);

  const pollVideoStatus = useCallback((sceneNum: number, taskId: string) => {
    // Clear existing polling for this scene
    if (pollingRefs.current[sceneNum]) {
      clearInterval(pollingRefs.current[sceneNum]);
    }

    const interval = setInterval(async () => {
      try {
        const { data, error } = await supabase.functions.invoke("jimeng-video-gen", {
          body: { action: "query", task_id: taskId },
        });
        if (error || data?.error) {
          clearInterval(interval);
          delete pollingRefs.current[sceneNum];
          updateSceneVideo(sceneNum, { status: "failed", error: data?.error || "查询失败" });
          return;
        }

        const status = data.status;
        if (status === "done" && data.video_url) {
          clearInterval(interval);
          delete pollingRefs.current[sceneNum];
          updateSceneVideo(sceneNum, { status: "done", videoUrl: data.video_url });
          toast.success(`场景 ${sceneNum} 视频生成完成！`);
        } else if (status === "failed" || status === "error") {
          clearInterval(interval);
          delete pollingRefs.current[sceneNum];
          updateSceneVideo(sceneNum, { status: "failed", error: "视频生成失败" });
        } else {
          // in_queue or generating
          updateSceneVideo(sceneNum, { status: status === "generating" ? "generating" : "in_queue" });
        }
      } catch {
        // Network error, keep polling
      }
    }, 5000);

    pollingRefs.current[sceneNum] = interval;
  }, [updateSceneVideo]);

  const generateSceneVideo = useCallback(async (scene: Scene, forcedDuration?: number) => {
    const num = scene.sceneNumber;
    const durationToUse = forcedDuration || videoDuration;
    setVideoPreviewFallbacks((prev) => {
      if (!prev[num]) return prev;
      const next = { ...prev };
      delete next[num];
      return next;
    });
    updateSceneVideo(num, { status: "submitting" });

    try {
      const { data, error } = await supabase.functions.invoke("jimeng-video-gen", {
        body: {
          action: "submit",
          prompt: buildJimengVideoPrompt(scene),
          aspect_ratio: videoAspectRatio,
          duration: durationToUse,
          image_urls: getVideoReferenceUrls(num),
        },
      });

      if (error || data?.error) {
        updateSceneVideo(num, { status: "failed", error: data?.error || "提交失败" });
        return false;
      }

      updateSceneVideo(num, { status: "in_queue", taskId: data.task_id });
      pollVideoStatus(num, data.task_id);
      return true;
    } catch (e: any) {
      updateSceneVideo(num, { status: "failed", error: e.message });
      return false;
    }
  }, [buildJimengVideoPrompt, getVideoReferenceUrls, videoAspectRatio, videoDuration, updateSceneVideo, pollVideoStatus]);

  const handleBatchGenerate = async () => {
    if (!result) return;
    if (!locksConfirmed) {
      toast.info("请先确认人物一锁定卡和统一风格锁定卡，系统仍将使用当前文案继续提交视频。", { duration: 5000 });
    }
    const hasPrimaryRef = Boolean(characterImages[0]?.imageUrl || result.primaryCharacterLock?.referenceImageUrl || result.characters[0]?.referenceImageUrl);
    const imageCount = result.scenes.filter((scene) => sceneImages[scene.sceneNumber]?.imageUrl).length;
    if (!hasPrimaryRef || imageCount < result.scenes.length) {
      toast.info("建议先生成“人物一参考图”和“全部分镜图片”，这样 8 个镜头的人物与风格更一致。仍将继续提交视频。", { duration: 6000 });
    }
    setBatchGenerating(true);
    for (const scene of result.scenes) {
      const state = sceneVideos[scene.sceneNumber];
      if (state?.status === "done") continue; // skip already done
      await generateSceneVideo(scene);
      // Small delay between submissions
      await new Promise(r => setTimeout(r, 1000));
    }
    setBatchGenerating(false);
    toast.info("所有分镜已提交，请等待生成完成");
  };

  const allVideosDone = result?.scenes.every(s => sceneVideos[s.sceneNumber]?.status === "done") ?? false;
  const anyVideoGenerating = Object.values(sceneVideos).some(v => 
    v.status === "submitting" || v.status === "in_queue" || v.status === "generating"
  );
  const completedCount = Object.values(sceneVideos).filter(v => v.status === "done").length;

  // Audio computed values
  const allAudiosDone = result?.scenes.every(s => sceneAudios[s.sceneNumber]?.status === "done") ?? false;
  const anyAudioGenerating = Object.values(sceneAudios).some(a => a.status === "generating");
  const completedAudioCount = Object.values(sceneAudios).filter(a => a.status === "done").length;
  const completedImageCount = Object.values(sceneImages).filter((img) => img.status === "done").length;
  const anyImageGenerating = Object.values(sceneImages).some((img) => img.status === "generating") || batchGeneratingImages || generatingCharacterRefs;

  // --- TTS Audio Generation ---
  const generateSceneAudio = useCallback(async (scene: Scene) => {
    const num = scene.sceneNumber;
    const text = scene.narration || scene.dialogue;
    if (!text?.trim()) {
      toast.error(`场景 ${num} 没有旁白/台词文案`);
      return;
    }
    setSceneAudios(prev => ({ ...prev, [num]: { status: "generating" } }));
    try {
      const { data, error } = await supabase.functions.invoke("volcengine-tts", {
        body: { text, voice_type: "zh_female_cancan_mars_bigtts" },
      });
      if (error || data?.error) {
        throw new Error(data?.error || "TTS生成失败");
      }
      if (!data?.audioContent) throw new Error("未返回音频数据");

      // Upload audio to storage for server-side merge
      let audioUrl: string | undefined;
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const bytes = atob(data.audioContent);
          const arr = new Uint8Array(bytes.length);
          for (let i = 0; i < bytes.length; i++) arr[i] = bytes.charCodeAt(i);
          const blob = new Blob([arr], { type: "audio/mpeg" });
          const path = `audio/${user.id}/${Date.now()}-scene${num}.mp3`;
          const { error: upErr } = await supabase.storage.from("video-assets").upload(path, blob, { contentType: "audio/mpeg" });
          if (!upErr) {
            const { data: urlData } = supabase.storage.from("video-assets").getPublicUrl(path);
            audioUrl = urlData.publicUrl;
          } else {
            console.warn("Audio upload failed, will still keep base64:", upErr.message);
          }
        }
      } catch (upE) {
        console.warn("Audio upload error:", upE);
      }

      setSceneAudios(prev => ({ ...prev, [num]: { status: "done", audioBase64: data.audioContent, audioUrl } }));
      toast.success(`场景 ${num} 旁白已生成`);
    } catch (e: any) {
      setSceneAudios(prev => ({ ...prev, [num]: { status: "failed", error: e.message } }));
    }
  }, []);

  const handleBatchGenerateAudio = async () => {
    if (!result) return;
    setBatchGeneratingAudio(true);
    for (const scene of result.scenes) {
      const state = sceneAudios[scene.sceneNumber];
      if (state?.status === "done") continue;
      await generateSceneAudio(scene);
      await new Promise(r => setTimeout(r, 500));
    }
    setBatchGeneratingAudio(false);
    toast.info("所有旁白已生成完毕");
  };

  const downloadSceneAudio = (sceneNum: number) => {
    const state = sceneAudios[sceneNum];
    if (!state?.audioBase64) return;
    const blob = base64ToBlob(state.audioBase64, "audio/mpeg");
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `scene-${sceneNum}-narration.mp3`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadMergedAudio = () => {
    if (!result) return;
    const chunks: Uint8Array[] = [];
    for (const scene of result.scenes) {
      const state = sceneAudios[scene.sceneNumber];
      if (state?.audioBase64) {
        const bytes = atob(state.audioBase64);
        const arr = new Uint8Array(bytes.length);
        for (let i = 0; i < bytes.length; i++) arr[i] = bytes.charCodeAt(i);
        chunks.push(arr);
      }
    }
    if (chunks.length === 0) { toast.error("没有已生成的旁白"); return; }
    const totalLen = chunks.reduce((s, c) => s + c.length, 0);
    const merged = new Uint8Array(totalLen);
    let offset = 0;
    for (const c of chunks) { merged.set(c, offset); offset += c.length; }
    const blob = new Blob([merged], { type: "audio/mpeg" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${result.title || "drama"}-narration.mp3`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("合并旁白下载成功");
  };

  const handleMergeDownload = async () => {
    if (!result) return;
    setMerging(true);
    try {
      const urls = result.scenes
        .map(s => sceneVideos[s.sceneNumber]?.videoUrl)
        .filter(Boolean) as string[];

      if (urls.length === 0) {
        toast.error("没有已完成的视频");
        return;
      }

      // Collect audio URLs in same order as video URLs
      const audioUrls = result.scenes
        .filter(s => sceneVideos[s.sceneNumber]?.videoUrl)
        .map(s => sceneAudios[s.sceneNumber]?.audioUrl || null);

      const blob = await mergeVideosClientSide(urls, (msg) => toast.info(msg), audioUrls);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${result.title || "drama"}-merged.mp4`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("合并下载成功！");
    } catch (e: any) {
      toast.error(e.message || "合并失败");
    } finally {
      setMerging(false);
    }
  };

  const downloadSingleVideo = async (url: string, sceneNum: number) => {
    try {
      toast.info(`正在下载场景 ${sceneNum} 视频...`);
      const response = await fetch(url);
      if (!response.ok) throw new Error("下载失败");
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = `scene-${sceneNum}.mp4`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
    } catch {
      toast.info("下载受限，已尝试直接打开视频");
      openVideoUrl(url);
    }
  };

  const getStatusLabel = (status: VideoStatus): string => {
    switch (status) {
      case "submitting": return "提交中...";
      case "in_queue": return "排队中...";
      case "generating": return "生成中...";
      case "done": return "已完成";
      case "failed": return "失败";
      default: return "";
    }
  };

  return (
    <>
    <div className={pendingSequel ? "pb-52 sm:pb-36" : undefined}>
      <AdminPageLayout
        title={
          <span className="flex items-center gap-2">
            <Clapperboard className="h-5 w-5" />
            AI短剧分镜脚本
          </span>
        }
        description="输入故事主题，AI自动生成多场景分镜脚本，画面提示词可直接用于即梦/MJ生图"
      >
      {/* Mode Toggle */}
      <div className="mb-4 flex w-full min-w-0 flex-wrap gap-2 overflow-hidden">
        <Button
          variant={mode === "generic" ? "default" : "outline"}
          onClick={() => setMode("generic")}
          disabled={loading}
        >
          🎬 通用短剧
        </Button>
        <Button
          variant={mode === "youjin" ? "default" : "outline"}
          onClick={() => setMode("youjin")}
          disabled={loading}
        >
          <Sparkles className="h-4 w-4" />
          有劲AI专属
        </Button>
      </div>

      {/* Input Form */}
      <Card className="w-full max-w-full min-w-0 shrink overflow-hidden">
        <CardContent className="w-full min-w-0 space-y-5 overflow-hidden pt-6">
          <div className="w-full min-w-0 space-y-2 overflow-hidden">
            <Label>故事主题 *</Label>
            <Input
              placeholder={mode === "youjin" 
                ? "例如：一个焦虑的职场妈妈如何找回自我" 
                : "例如：一个程序员穿越到古代成为宰相"}
              value={theme}
              onChange={(e) => { setTheme(e.target.value); setSelectedThemeIdx(null); }}
              disabled={loading}
            />
          </div>

            <div className="grid w-full min-w-0 grid-cols-1 gap-4 overflow-hidden lg:grid-cols-2">
            <div className="w-full min-w-0 space-y-2 overflow-hidden">
              <Label>题材类型</Label>
              <div className="flex w-full min-w-0 flex-wrap gap-2 overflow-hidden">
                {GENRES.map((g) => (
                  <button
                    key={g.value}
                    onClick={() => setGenre(g.value)}
                    disabled={loading}
                    className={`max-w-full px-3 py-1.5 rounded-full text-sm border transition-colors break-words ${
                      genre === g.value
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-background border-border hover:bg-muted"
                    }`}
                  >
                    {g.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="w-full min-w-0 space-y-2 overflow-hidden">
              <Label>画风选择</Label>
              <div className="flex w-full min-w-0 flex-wrap gap-2 overflow-hidden">
                {STYLES.map((s) => (
                  <button
                    key={s.value}
                    onClick={() => setStyle(s.value)}
                    disabled={loading}
                    className={`max-w-full px-3 py-1.5 rounded-full text-sm border transition-colors break-words ${
                      style === s.value
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-background border-border hover:bg-muted"
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="w-full min-w-0 space-y-2 overflow-hidden">
            <Label>冲突强度</Label>
            <div className="grid w-full min-w-0 grid-cols-1 gap-2 overflow-hidden sm:grid-cols-3">
              {CONFLICT_LEVELS.map((level) => (
                <button
                  key={level.value}
                  onClick={() => setConflictIntensity(level.value)}
                  disabled={loading}
                    className={`min-w-0 text-left p-3 rounded-lg border transition-colors ${
                    conflictIntensity === level.value
                      ? "bg-primary/10 border-primary ring-1 ring-primary"
                      : "bg-background border-border hover:bg-muted/50"
                  }`}
                >
                  <div className="text-sm font-medium">{level.label}</div>
                  <div className="text-xs text-muted-foreground mt-1">{level.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Youjin-specific options */}
          {mode === "youjin" && (
            <>
              <div className="space-y-2 min-w-0">
                <Label className="flex items-center gap-1.5">
                  <Target className="h-4 w-4" /> 目标人群
                </Label>
                <div className="flex w-full min-w-0 flex-wrap gap-2 overflow-hidden">
                  {TARGET_AUDIENCES.map((a) => (
                    <button
                      key={a.value}
                      onClick={() => setTargetAudience(a.value)}
                      disabled={loading}
                      className={`max-w-full px-3 py-1.5 rounded-full text-sm border transition-colors break-words ${
                        targetAudience === a.value
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-background border-border hover:bg-muted"
                      }`}
                    >
                      {a.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2 min-w-0">
                <Label>转化方式（可多选）</Label>
                <div className="flex w-full min-w-0 flex-wrap gap-2 overflow-hidden">
                  {CONVERSION_STYLES.map((c) => (
                    <button
                      key={c.value}
                      onClick={() => toggleConversionStyle(c.value)}
                      disabled={loading}
                      className={`max-w-full px-3 py-1.5 rounded-full text-sm border transition-colors text-left break-words ${
                        conversionStyles.includes(c.value)
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-background border-border hover:bg-muted"
                      }`}
                    >
                      {c.label}
                      <span className="text-xs ml-1 opacity-70">{c.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="w-full min-w-0 space-y-2 overflow-hidden">
                <Label className="flex items-center gap-1.5">
                  <ShoppingCart className="h-4 w-4" /> 选择转化产品 *
                </Label>
                <Tabs defaultValue="assessment" className="w-full min-w-0 overflow-hidden">
                  <TabsList className="flex h-auto w-full min-w-0 flex-wrap justify-start gap-1 overflow-hidden">
                    {Object.entries(PRODUCT_CATALOG).map(([key, cat]) => (
                      <TabsTrigger key={key} value={key} className="flex-1 min-w-[72px] text-xs">
                        {cat.label}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                  {Object.entries(PRODUCT_CATALOG).map(([key, cat]) => (
                    <TabsContent key={key} value={key} className="w-full min-w-0 overflow-hidden">
                      <div className="grid w-full min-w-0 grid-cols-1 gap-2 overflow-hidden sm:grid-cols-2">
                        {cat.items.map((item) => (
                          <label
                            key={item.key}
                             className={`flex w-full min-w-0 items-start gap-3 overflow-hidden rounded-lg border p-3 transition-colors cursor-pointer ${
                              selectedProducts.has(item.key)
                                ? "border-primary bg-primary/5"
                                : "border-border hover:bg-muted/50"
                            }`}
                          >
                            <Checkbox
                              checked={selectedProducts.has(item.key)}
                              onCheckedChange={() => toggleProduct(item.key)}
                              disabled={loading}
                            />
                            <div className="min-w-0 flex-1 overflow-hidden">
                              <div className="break-words text-sm font-medium">{item.name}</div>
                              <div className="mt-0.5 break-words text-xs text-muted-foreground">{item.description}</div>
                            </div>
                          </label>
                        ))}
                      </div>
                    </TabsContent>
                  ))}
                </Tabs>
                {selectedProducts.size > 0 && (
                  <div className="text-xs text-muted-foreground break-words">
                    已选 {selectedProducts.size} 个产品：{getSelectedProductDetails().map((p) => p.name).join("、")}
                  </div>
                )}
              </div>
            </>
          )}

          {/* Suggested Themes for Youjin mode */}
          {mode === "youjin" && (loadingThemes || suggestedThemes.length > 0) && (
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-3">
                <Label className="flex items-center gap-1.5">
                  <Sparkles className="h-4 w-4 text-primary" /> AI推荐爆款主题
                </Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={refreshSuggestedThemes}
                  disabled={loadingThemes || loading || selectedProducts.size === 0}
                  className="h-8 gap-1.5 px-2 text-xs"
                >
                  {loadingThemes ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
                  再换3个
                </Button>
              </div>
              {loadingThemes ? (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="p-3 rounded-lg border border-border">
                      <Skeleton className="h-5 w-3/4 mb-2" />
                      <Skeleton className="h-4 w-full" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {suggestedThemes.map((t, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setTheme(t.title);
                        setSelectedThemeIdx(idx);
                      }}
                      disabled={loading}
                      className={`text-left p-3 rounded-lg border transition-all ${
                        selectedThemeIdx === idx
                          ? "border-primary bg-primary/10 ring-1 ring-primary"
                          : "border-border hover:border-primary/50 hover:bg-muted/50"
                      }`}
                    >
                      <div className="text-sm font-medium flex items-center gap-1">
                        🔥 {t.title}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">{t.description}</div>
                    </button>
                  ))}
                </div>
              )}
              <p className="text-xs text-muted-foreground">点击选用推荐主题，不满意可再换3个，或在下方输入自定义主题</p>
            </div>
          )}

          <div className="space-y-2">
            <Label>分镜数量: {sceneCount}</Label>
            <Slider
              value={[sceneCount]}
              onValueChange={([v]) => setSceneCount(v)}
              min={6}
              max={12}
              step={1}
              disabled={loading}
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>6</span>
              <span>12</span>
            </div>
          </div>

          <Button onClick={handleGenerate} disabled={loading || !theme.trim() || (mode === "youjin" && selectedProducts.size === 0)} className="w-full">
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                AI生成中，请稍候...
              </>
            ) : mode === "youjin" ? (
              "🎬 生成有劲AI专属脚本"
            ) : (
              "🎬 生成分镜脚本"
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Saved Scripts */}
      <Card className="mt-4 max-w-full overflow-hidden">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-3 min-w-0">
            <CardTitle className="text-base flex items-center gap-2 min-w-0">
              <Library className="h-4 w-4" /> 已保存脚本
            </CardTitle>
            <Button variant="outline" size="sm" onClick={fetchSavedScripts} disabled={loadingSavedScripts} className="h-8 gap-1.5 text-xs">
              {loadingSavedScripts ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
              刷新
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loadingSavedScripts ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => <Skeleton key={i} className="h-14 w-full" />)}
            </div>
          ) : savedScripts.length === 0 ? (
            <p className="text-sm text-muted-foreground">还没有保存的脚本，生成后点击保存即可沉淀为系列。</p>
          ) : (
            <div className="max-h-72 w-full min-w-0 space-y-2 overflow-auto overflow-x-hidden pr-1">
              {savedScripts.map((script) => (
                  <div key={script.id} className="flex flex-col gap-3 rounded-lg border p-3 min-w-0 overflow-hidden">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 min-w-0">
                  <button className="min-w-0 flex-1 text-left overflow-hidden" onClick={() => loadSavedScript(script)}>
                    <div className="flex items-center gap-2 flex-wrap min-w-0">
                      <span className="font-medium text-sm truncate min-w-0 max-w-full">{script.title}</span>
                      <span className="text-xs bg-muted px-2 py-0.5 rounded">第{script.episode_number}集</span>
                      <span className="text-xs text-muted-foreground bg-muted/60 px-2 py-0.5 rounded">
                        {script.mode === "youjin" ? "有劲AI" : "通用"}
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground mt-1 truncate">
                      {script.synopsis || script.theme} · {new Date(script.created_at).toLocaleString()}
                    </div>
                  </button>
                  <div className="flex flex-wrap items-center gap-1 shrink-0">
                    <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={() => loadSavedScript(script)}>载入</Button>
                    <Button variant="ghost" size="sm" className="h-8 text-xs gap-1" onClick={() => generateSequel(script)} disabled={generatingSequel}>
                      <Wand2 className="h-3 w-3" /> 续集
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => deleteSavedScript(script)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                    </div>
                    {script.mode === "youjin" && (
                      <div className="rounded-md bg-muted/40 p-2 min-w-0">
                        <div className="mb-2 text-xs text-muted-foreground">续集将继承的转化方式</div>
                        <div className="flex flex-wrap gap-1.5">
                          {CONVERSION_STYLES.map((style) => {
                            const selected = getSequelConversionStyles(script).includes(style.value);
                            return (
                              <button
                                key={style.value}
                                type="button"
                                onClick={() => toggleSequelConversionStyle(script, style.value)}
                                disabled={generatingSequel}
                                className={`max-w-full rounded-full border px-2.5 py-1 text-left text-xs transition-colors ${
                                  selected
                                    ? "border-primary bg-primary text-primary-foreground"
                                    : "border-border bg-background hover:bg-muted"
                                }`}
                              >
                                {style.label}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {(generatingSequel || sequelGenerationError) && sequelGenerationSource && (
        <Card ref={sequelStatusRef} className="mt-6 border-primary/30 bg-primary/5 max-w-full overflow-hidden">
          <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0 space-y-1">
              <div className={`flex items-center gap-2 text-sm font-medium ${sequelGenerationError ? "text-destructive" : "text-primary"}`}>
                {generatingSequel ? <Loader2 className="h-4 w-4 animate-spin" /> : sequelGenerationError ? <X className="h-4 w-4" /> : <Check className="h-4 w-4" />}
                {generatingSequel ? `正在生成第${sequelGenerationSource.episodeNumber + 1}集续集` : sequelGenerationError ? "续集生成中断" : `第${sequelGenerationSource.episodeNumber + 1}集续集已生成`}
              </div>
              <p className="text-xs text-muted-foreground break-words">
                {sequelGenerationError || sequelGenerationStep || (pendingSequel ? `已承接《${sequelGenerationSource.title}》第${sequelGenerationSource.episodeNumber}集生成新版本，确认后会替换当前编辑区。` : `承接《${sequelGenerationSource.title}》第${sequelGenerationSource.episodeNumber}集，通常需要等待 AI 完成单版本脚本。`)}
              </p>
            </div>
            {pendingSequel ? (
              <div className="flex shrink-0 flex-col gap-2 sm:items-end">
                <div className="grid w-full gap-2 sm:w-[420px] sm:grid-cols-2">
                  <Select value={sequelDirection} onValueChange={setSequelDirection} disabled={generatingSequel}>
                    <SelectTrigger className="h-9 text-xs"><SelectValue placeholder="冲突推进方向" /></SelectTrigger>
                    <SelectContent>{SEQUEL_DIRECTIONS.map((item) => <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>)}</SelectContent>
                  </Select>
                  <Select value={sequelOpeningAngle} onValueChange={setSequelOpeningAngle} disabled={generatingSequel}>
                    <SelectTrigger className="h-9 text-xs"><SelectValue placeholder="开场角度" /></SelectTrigger>
                    <SelectContent>{SEQUEL_OPENING_ANGLES.map((item) => <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="flex flex-wrap gap-2">
                <Button type="button" size="sm" onClick={applyPendingSequel} className="gap-1.5">
                  <Check className="h-3.5 w-3.5" /> 替换当前脚本
                </Button>
                <Button type="button" variant="outline" size="sm" onClick={() => generateSequel(pendingSequel.source)} disabled={generatingSequel} className="gap-1.5">
                  <RefreshCw className="h-3.5 w-3.5" /> 重新生成
                </Button>
                </div>
              </div>
            ) : (
              <div className="shrink-0 text-xs text-muted-foreground">{generatingSequel ? "请勿重复点击" : "可重新点击生成"}</div>
            )}
          </CardContent>
        </Card>
      )}

      {pendingSequel && (
        <Card className="mt-6 max-w-full min-w-0 overflow-hidden border-primary/40 bg-primary/5">
          <CardHeader className="pb-3">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0 space-y-1">
                <CardTitle className="text-base leading-snug break-words">
                  续集预览：{pendingSequel.script.title}
                </CardTitle>
                <p className="text-xs text-muted-foreground break-words">当前脚本还没有被覆盖；满意后点“替换当前脚本”，不满意可重新生成或保留当前脚本。</p>
              </div>
              <div className="flex shrink-0 flex-wrap gap-2">
                <Button type="button" size="sm" onClick={applyPendingSequel} className="gap-1.5"><Check className="h-3.5 w-3.5" /> 替换当前脚本</Button>
                <Button type="button" variant="outline" size="sm" onClick={discardPendingSequel} className="gap-1.5"><X className="h-3.5 w-3.5" /> 保留当前脚本</Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground leading-relaxed break-words whitespace-pre-wrap">{pendingSequel.script.synopsis}</p>
            {pendingSequel.script.consistencyCheck && (
              <div className="rounded-lg border bg-background/70 p-3 text-xs">
                <div className="mb-2 flex items-center justify-between gap-2 font-medium">
                  <span>一致性检查</span>
                  <span className={pendingSequel.script.consistencyCheck.overallScore < CONSISTENCY_THRESHOLD ? "text-destructive" : "text-primary"}>{pendingSequel.script.consistencyCheck.overallScore}/100</span>
                </div>
                <Progress value={pendingSequel.script.consistencyCheck.overallScore} className="h-2" />
                {pendingSequel.script.consistencyCheck.issues.length > 0 && <p className="mt-2 text-muted-foreground break-words">{pendingSequel.script.consistencyCheck.issues.join("；")}</p>}
              </div>
            )}
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {pendingSequel.script.scenes.slice(0, 4).map((scene) => (
                <div key={scene.sceneNumber} className="rounded-lg border bg-background/70 p-3 min-w-0">
                  <div className="mb-1 flex items-center gap-2 text-xs font-medium text-primary"><span>第{scene.sceneNumber}幕</span><span>{scene.duration}</span></div>
                  <p className="text-sm break-words">{scene.characterAction}</p>
                  {scene.dialogue && <p className="mt-2 border-l-2 border-primary/30 pl-2 text-sm italic break-words">「{scene.dialogue}」</p>}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Results */}
      {result && (
        <div className="space-y-4 mt-6 w-full max-w-full min-w-0 overflow-hidden">
          {/* Title & Synopsis */}
          <Card className="max-w-full overflow-hidden">
            <CardHeader className="pb-3">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 min-w-0">
                <CardTitle className="text-lg leading-snug break-words min-w-0 flex-1">{result.title}</CardTitle>
                <div className="flex gap-2 flex-wrap sm:justify-end min-w-0">
                  {activeSavedScript && (
                    <span className="text-xs text-primary bg-primary/10 px-2 py-1 rounded font-medium">
                      第{savedScriptId === activeSavedScript.id ? activeSavedScript.episode_number : activeSavedScript.episode_number + 1}集
                    </span>
                  )}
                  {mode === "youjin" && (
                    <span className="text-xs text-primary bg-primary/10 px-2 py-1 rounded font-medium">
                      有劲AI专属
                    </span>
                  )}
                  <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                    {result.totalScenes} 个分镜
                  </span>
                  <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                    ≈ {result.estimatedDuration}
                  </span>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground leading-relaxed break-words whitespace-pre-wrap">{result.synopsis}</p>
              <div className="flex flex-wrap gap-2 mt-4">
                <Button onClick={saveCurrentScript} disabled={savingScript} className="gap-2">
                  {savingScript ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  {savedScriptId ? "更新已保存脚本" : "保存脚本"}
                </Button>
                <Button variant="outline" onClick={() => generateSequel()} disabled={generatingSequel || (!activeSavedScript && !savedScriptId)} className="gap-2">
                  {generatingSequel ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
                  {generatingSequel && activeSavedScript ? `承接第${activeSavedScript.episode_number}集生成中...` : "生成续集"}
                </Button>
                {!activeSavedScript && !savedScriptId && (
                  <span className="text-xs text-muted-foreground self-center">先保存当前脚本后，可继续生成第2集。</span>
                )}
                {activeSavedScript && !generatingSequel && (
                  <span className="text-xs text-muted-foreground self-center break-words">
                    将承接第{activeSavedScript.episode_number}集结尾：{summarizeSceneForSequel(activeSavedScript.script_data?.scenes?.[activeSavedScript.script_data.scenes.length - 1])}
                  </span>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Sequel Consistency Check */}
          {result.consistencyCheck && (
            <Card className={`max-w-full min-w-0 overflow-hidden ${result.consistencyCheck.overallScore < CONSISTENCY_THRESHOLD ? "border-destructive/50" : "border-primary/30"}`}>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center justify-between gap-3">
                  <span className="flex items-center gap-2"><Check className="h-4 w-4" /> 角色/剧情一致性检查</span>
                  <span className={result.consistencyCheck.overallScore < CONSISTENCY_THRESHOLD ? "text-destructive" : "text-primary"}>
                    {result.consistencyCheck.overallScore}/100
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Progress value={result.consistencyCheck.overallScore} className="h-2" />
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                  <div className="rounded-lg bg-muted/50 p-2">角色 {result.consistencyCheck.characterScore}</div>
                  <div className="rounded-lg bg-muted/50 p-2">剧情 {result.consistencyCheck.plotScore}</div>
                  <div className="rounded-lg bg-muted/50 p-2">画面 {result.consistencyCheck.visualScore}</div>
                  <div className="rounded-lg bg-muted/50 p-2">产品 {result.consistencyCheck.productScore}</div>
                </div>
                {result.consistencyCheck.overallScore < CONSISTENCY_THRESHOLD && (
                  <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 space-y-2">
                    <p className="text-sm font-medium text-destructive">续集连续性风险较高，建议不要保存当前版本。</p>
                    <p className="text-xs text-muted-foreground">{result.consistencyCheck.regenerationAdvice}</p>
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      className="mt-1 gap-2"
                      onClick={() => generateSequel(activeSavedScript || undefined)}
                      disabled={generatingSequel || !activeSavedScript}
                    >
                      {generatingSequel ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
                      一键重生成续集
                    </Button>
                  </div>
                )}
                {result.consistencyCheck.issues.length > 0 && (
                  <ul className="list-disc pl-5 text-xs text-muted-foreground space-y-1">
                    {result.consistencyCheck.issues.map((issue, idx) => <li key={idx}>{issue}</li>)}
                  </ul>
                )}
              </CardContent>
            </Card>
          )}

          {result.continuityBridge && (
            <Card className="border-primary/30 max-w-full min-w-0 overflow-hidden">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Film className="h-4 w-4" /> 承接说明
                </CardTitle>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  用于判断本集是否真正延续上一集，而不是重新生成一个新故事。
                </p>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                <div className="rounded-lg bg-muted/50 p-3 min-w-0">
                  <div className="text-xs text-muted-foreground mb-1">本集继承了哪些点</div>
                  <p className="break-words">{result.continuityBridge.inheritedFromPrevious}</p>
                </div>
                <div className="rounded-lg bg-muted/50 p-3 min-w-0">
                  <div className="text-xs text-muted-foreground mb-1">第1幕如何接上集结尾</div>
                  <p className="break-words">{result.continuityBridge.openingConnection}</p>
                </div>
                <div className="rounded-lg bg-muted/50 p-3 min-w-0">
                  <div className="text-xs text-muted-foreground mb-1">未解决悬念如何延续</div>
                  <p className="break-words">{result.continuityBridge.unresolvedHookCarried}</p>
                </div>
                <div className="rounded-lg bg-muted/50 p-3 min-w-0">
                  <div className="text-xs text-muted-foreground mb-1">本集留下的新钩子</div>
                  <p className="break-words">{result.continuityBridge.nextEpisodeHook}</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Cover Poster Draft */}
          {result.coverPoster && (
            <Card className="border-primary/30 max-w-full min-w-0 overflow-hidden">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <ImageIcon className="h-4 w-4" /> 本集封面海报草案
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 min-w-0">
                  <div className="rounded-lg bg-muted/50 p-3 min-w-0 overflow-hidden">
                    <Label className="text-xs text-muted-foreground">封面主标题</Label>
                    <p className="text-sm font-semibold mt-1 break-words">{result.coverPoster.headline}</p>
                  </div>
                  <div className="rounded-lg bg-muted/50 p-3 min-w-0 overflow-hidden">
                    <Label className="text-xs text-muted-foreground">辅助文案</Label>
                    <p className="text-sm mt-1 break-words">{result.coverPoster.subheadline}</p>
                  </div>
                  <div className="rounded-lg bg-muted/50 p-3 min-w-0 overflow-hidden">
                    <Label className="text-xs text-muted-foreground">封面钩子</Label>
                    <p className="text-sm font-medium mt-1 break-words">{result.coverPoster.hookText}</p>
                  </div>
                </div>
                <div className="bg-muted/50 rounded-lg p-3 min-w-0 overflow-hidden">
                  <div className="flex items-start justify-between gap-2 min-w-0">
                    <code className="text-xs break-all flex-1 min-w-0 leading-relaxed">{result.coverPoster.posterImagePrompt}</code>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="shrink-0 h-7 w-7"
                      onClick={() => copyToClipboard(result.coverPoster!.posterImagePrompt, "封面图片提示词")}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Conversion Script & Comment Hook (Youjin mode) */}
          {mode === "youjin" && (result.conversionScript || result.commentHook) && (
            <Card className="border-primary/30 max-w-full min-w-0 overflow-hidden">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" /> 转化文案
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {result.conversionScript && (
                  <div className="space-y-2">
                    <Label className="text-xs font-medium">视频描述文案</Label>
                    <div className="bg-muted/50 rounded-lg p-3 min-w-0 overflow-hidden">
                      <div className="flex items-start justify-between gap-2 min-w-0">
                        <p className="text-sm whitespace-pre-wrap break-words flex-1 min-w-0">{buildFullConversionText()}</p>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="shrink-0 h-7 w-7"
                          onClick={() => copyToClipboard(buildFullConversionText(), "转化文案")}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
                {result.commentHook && (
                  <div className="space-y-2">
                    <Label className="text-xs font-medium">评论区置顶话术</Label>
                    <div className="bg-muted/50 rounded-lg p-3 min-w-0 overflow-hidden">
                      <div className="flex items-start justify-between gap-2 min-w-0">
                        <p className="text-sm whitespace-pre-wrap break-words flex-1 min-w-0">{result.commentHook}</p>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="shrink-0 h-7 w-7"
                          onClick={() => copyToClipboard(result.commentHook!, "评论区话术")}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Characters */}
          <div className="max-w-full min-w-0 overflow-hidden">
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <User className="h-4 w-4" /> 角色设定
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 min-w-0">
              {result.characters.map((char, i) => (
                <Card key={i} className="border-dashed max-w-full min-w-0 overflow-hidden">
                  <CardContent className="pt-4 space-y-2">
                    <div className="font-medium break-words">{char.name}</div>
                    <p className="text-sm text-muted-foreground break-words">{char.description}</p>
                    {characterImages[i]?.imageUrl && (
                      <div className="w-full max-w-full min-w-0 overflow-hidden rounded-lg border bg-muted/30">
                        <img src={characterImages[i].imageUrl} alt={`${char.name}定妆图`} className="aspect-square w-full max-h-64 object-contain" loading="lazy" />
                      </div>
                    )}
                    <div className="bg-muted/50 rounded-lg p-3 min-w-0 overflow-hidden">
                      <div className="flex items-start justify-between gap-2 min-w-0">
                        <code className="text-xs break-all flex-1 min-w-0">{char.imagePrompt}</code>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="shrink-0 h-7 w-7"
                          onClick={() => copyToClipboard(char.imagePrompt, "角色提示词")}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    <div className="flex w-full min-w-0 flex-wrap items-center gap-2 overflow-hidden">
                      <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs" onClick={() => generateCharacterReference(char, i)} disabled={generatingCharacterRefs || characterImages[i]?.status === "generating"}>
                        {characterImages[i]?.status === "generating" ? <Loader2 className="h-3 w-3 animate-spin" /> : <ImageIcon className="h-3 w-3" />}
                        {characterImages[i]?.imageUrl ? "重生成定妆图" : "生成定妆图"}
                      </Button>
                      {characterImages[i]?.status === "failed" && <span className="text-xs text-destructive break-words">{characterImages[i].error}</span>}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Video Generation Settings */}
          <Card className="w-full max-w-full min-w-0 shrink overflow-hidden border-dashed border-primary/40">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Video className="h-4 w-4" /> 图片 / 视频生成设置
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 w-full min-w-0 overflow-hidden">
                <div className="grid w-full min-w-0 grid-cols-1 gap-4 overflow-hidden sm:grid-cols-2">
                  <div className="w-full min-w-0 space-y-2 overflow-hidden">
                    <Label className="text-xs">GPT Image 2.0 图片比例</Label>
                    <div className="flex w-full min-w-0 flex-wrap gap-2 overflow-hidden">
                      {ASPECT_RATIOS.map(ar => (
                        <button key={ar.value} onClick={() => setImageAspectRatio(ar.value)} disabled={anyImageGenerating} className={`px-3 py-1.5 rounded-full text-xs border transition-colors ${imageAspectRatio === ar.value ? "bg-primary text-primary-foreground border-primary" : "bg-background border-border hover:bg-muted"}`}>
                          {ar.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="flex w-full min-w-0 flex-wrap items-end gap-2 overflow-hidden">
                    <Button variant="outline" onClick={handleGenerateCharacterReferences} disabled={generatingCharacterRefs || !result.characters.length} className="gap-2">
                      {generatingCharacterRefs ? <Loader2 className="h-4 w-4 animate-spin" /> : <User className="h-4 w-4" />}
                      生成角色定妆图
                    </Button>
                    <Button onClick={handleBatchGenerateImages} disabled={batchGeneratingImages || anyImageGenerating} className="gap-2">
                      {batchGeneratingImages ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImageIcon className="h-4 w-4" />}
                      全部生成分镜图片
                    </Button>
                    {completedImageCount > 0 && <span className="pb-2 text-xs text-muted-foreground">图片 {completedImageCount}/{result.scenes.length}</span>}
                  </div>
                </div>
                {completedImageCount > 0 && completedImageCount < result.scenes.length && (
                  <div className="mt-3 space-y-1">
                    <span className="text-xs text-muted-foreground">分镜图片生成进度</span>
                    <Progress value={(completedImageCount / result.scenes.length) * 100} className="h-2" />
                  </div>
                )}
              </div>

              <div className="grid w-full min-w-0 grid-cols-1 gap-3 overflow-hidden lg:grid-cols-2">
                <div className="rounded-lg border bg-muted/30 p-3 min-w-0 overflow-hidden">
                  <div className="mb-2 flex items-center gap-2 text-sm font-medium">
                    <User className="h-4 w-4" /> 人物一锁定
                  </div>
                  {result.primaryCharacterLock && (
                    <div className="mb-2 grid grid-cols-1 gap-1 text-xs text-muted-foreground sm:grid-cols-2">
                      <div className="break-words"><span className="font-medium text-foreground">固定外貌：</span>{result.primaryCharacterLock.fixedAppearance}</div>
                      <div className="break-words"><span className="font-medium text-foreground">固定服装：</span>{result.primaryCharacterLock.fixedOutfit}</div>
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground break-words whitespace-pre-line">{buildPrimaryCharacterLock()}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    {characterImages[0]?.imageUrl || result.primaryCharacterLock?.referenceImageUrl ? <span className="text-xs text-primary">已使用人物一参考图作为即梦图生视频参考</span> : <span className="text-xs text-muted-foreground">建议先生成并保存人物一参考图</span>}
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 gap-1 text-xs"
                      onClick={handleGenerateAndSavePrimaryReference}
                      disabled={characterImages[0]?.status === "generating" || generatingCharacterRefs}
                    >
                      {characterImages[0]?.status === "generating" ? <Loader2 className="h-3 w-3 animate-spin" /> : <ImageIcon className="h-3 w-3" />}
                      {characterImages[0]?.imageUrl || result.primaryCharacterLock?.referenceImageUrl ? "重生成人物一参考图" : "一键生成并保存人物一参考图"}
                    </Button>
                    <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs" onClick={() => copyToClipboard(buildPrimaryCharacterLock(), "人物一锁定词")}>
                      <Copy className="h-3 w-3" /> 复制
                    </Button>
                  </div>
                </div>
                <div className="rounded-lg border bg-muted/30 p-3 min-w-0 overflow-hidden">
                  <div className="mb-2 flex items-center gap-2 text-sm font-medium">
                    <Clapperboard className="h-4 w-4" /> 统一风格锁定
                  </div>
                  <p className="text-xs text-muted-foreground break-words">{buildStyleLock()}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <span className="text-xs text-muted-foreground">8镜头 × 10秒 ≈ 80秒；短视频可前后5秒、中段10秒。</span>
                    <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs" onClick={() => copyToClipboard(buildStyleLock(), "统一风格锁定词")}>
                      <Copy className="h-3 w-3" /> 复制
                    </Button>
                  </div>
                </div>
              </div>

              <div className="grid w-full min-w-0 grid-cols-1 gap-4 overflow-hidden sm:grid-cols-2">
                <div className="w-full min-w-0 space-y-2 overflow-hidden">
                  <Label className="text-xs">画面比例</Label>
                  <div className="flex w-full min-w-0 flex-wrap gap-2 overflow-hidden">
                    {ASPECT_RATIOS.map(ar => (
                      <button
                        key={ar.value}
                        onClick={() => setVideoAspectRatio(ar.value)}
                        disabled={anyVideoGenerating}
                        className={`px-3 py-1.5 rounded-full text-xs border transition-colors ${
                          videoAspectRatio === ar.value
                            ? "bg-primary text-primary-foreground border-primary"
                            : "bg-background border-border hover:bg-muted"
                        }`}
                      >
                        {ar.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="w-full min-w-0 space-y-2 overflow-hidden">
                  <Label className="text-xs">片段时长</Label>
                  <div className="flex w-full min-w-0 flex-wrap gap-2 overflow-hidden">
                    {VIDEO_DURATIONS.map(d => (
                      <button
                        key={d.value}
                        onClick={() => setVideoDuration(d.value)}
                        disabled={anyVideoGenerating}
                        className={`px-3 py-1.5 rounded-full text-xs border transition-colors ${
                          videoDuration === d.value
                            ? "bg-primary text-primary-foreground border-primary"
                            : "bg-background border-border hover:bg-muted"
                        }`}
                      >
                        {d.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Batch controls */}
              <div className="flex w-full min-w-0 flex-wrap items-center gap-3 overflow-hidden">
                <Button
                  onClick={handleBatchGenerate}
                  disabled={batchGenerating || anyVideoGenerating}
                  className="gap-2"
                >
                  {batchGenerating ? (
                    <><Loader2 className="h-4 w-4 animate-spin" /> 批量提交中...</>
                  ) : (
                    <><Play className="h-4 w-4" /> 按统一人物/风格生成全部视频</>
                  )}
                </Button>

                <Button
                  variant="outline"
                  onClick={handleBatchGenerateAudio}
                  disabled={batchGeneratingAudio || anyAudioGenerating}
                  className="gap-2"
                >
                  {batchGeneratingAudio ? (
                    <><Loader2 className="h-4 w-4 animate-spin" /> 旁白生成中...</>
                  ) : (
                    <><Mic className="h-4 w-4" /> 全部生成旁白</>
                  )}
                </Button>

                {completedCount > 0 && (
                  <span className="text-xs text-muted-foreground">
                    视频 {completedCount}/{result.scenes.length}
                  </span>
                )}
                {completedAudioCount > 0 && (
                  <span className="text-xs text-muted-foreground">
                    旁白 {completedAudioCount}/{result.scenes.length}
                  </span>
                )}

                {allVideosDone && (
                  <Button
                    variant="outline"
                    onClick={handleMergeDownload}
                    disabled={merging}
                    className="gap-2"
                  >
                    {merging ? (
                      <><Loader2 className="h-4 w-4 animate-spin" /> 合并中...</>
                    ) : (
                      <><Download className="h-4 w-4" /> 合并下载视频</>
                    )}
                  </Button>
                )}

                {allAudiosDone && (
                  <Button
                    variant="outline"
                    onClick={downloadMergedAudio}
                    className="gap-2"
                  >
                    <Volume2 className="h-4 w-4" /> 下载合并旁白
                  </Button>
                )}
              </div>

              {completedCount > 0 && completedCount < result.scenes.length && (
                <Progress value={(completedCount / result.scenes.length) * 100} className="h-2" />
              )}
              {completedAudioCount > 0 && completedAudioCount < result.scenes.length && (
                <div className="space-y-1">
                  <span className="text-xs text-muted-foreground">旁白生成进度</span>
                  <Progress value={(completedAudioCount / result.scenes.length) * 100} className="h-2" />
                </div>
              )}

              <p className="text-xs text-muted-foreground break-words">
                ⚠️ 视频生成需 1-3 分钟/片段，生成后链接 1 小时内有效，请及时下载。最佳顺序：先生成角色定妆图，再生成全部分镜图片，最后生成视频并合并下载。
              </p>
            </CardContent>
          </Card>

          {/* Scenes Timeline */}
          <div className="max-w-full min-w-0 overflow-hidden">
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <Film className="h-4 w-4" /> 分镜时间线
            </h3>
            <div className="space-y-3 max-w-full min-w-0 overflow-hidden">
              {result.scenes.map((scene) => {
                const videoState = sceneVideos[scene.sceneNumber] || { status: "idle" as VideoStatus };
                const imageState = sceneImages[scene.sceneNumber] || { status: "idle" as ImageStatus };

                return (
                  <Card key={scene.sceneNumber} className="max-w-full min-w-0 overflow-hidden">
                    <CardContent className="pt-4 min-w-0 overflow-hidden">
                      <div className="flex items-start gap-4 min-w-0">
                        <div className="flex flex-col items-center shrink-0">
                          <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
                            {scene.sceneNumber}
                          </div>
                          <span className="text-xs text-muted-foreground mt-1">{scene.duration}</span>
                        </div>

                        <div className="flex-1 space-y-2 min-w-0 overflow-hidden">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded font-medium">
                              {scene.panel}
                            </span>
                            <span className="text-xs text-muted-foreground break-words">🎵 {scene.bgm}</span>
                            {scene.relatedProduct && (
                              <span className="text-xs bg-accent text-accent-foreground px-2 py-0.5 rounded">
                                🔗 {getProductName(scene.relatedProduct)}
                              </span>
                            )}
                          </div>

                          <div className="text-sm break-words">
                            <span className="text-muted-foreground">动作：</span>
                            {scene.characterAction}
                          </div>
                          {scene.dialogue && (
                            <div className="text-sm italic border-l-2 border-primary/30 pl-3 break-words">
                              「{scene.dialogue}」
                            </div>
                          )}

                          <div className="bg-muted/50 rounded-lg p-3 min-w-0 overflow-hidden">
                            <div className="flex items-start justify-between gap-2 min-w-0">
                              <code className="text-xs break-all flex-1 min-w-0 leading-relaxed">
                                {scene.imagePrompt}
                              </code>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="shrink-0 h-7 w-7"
                                onClick={() => copyToClipboard(scene.imagePrompt, `场景${scene.sceneNumber}提示词`)}
                              >
                                <Copy className="h-3 w-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="shrink-0 h-7 gap-1 text-xs"
                                onClick={() => copyToClipboard(buildJimengVideoPrompt(scene), `场景${scene.sceneNumber}即梦提示词`)}
                              >
                                <Video className="h-3 w-3" /> 即梦词
                              </Button>
                            </div>
                          </div>

                          {/* GPT Image 2.0 image generation per scene */}
                          <div className="flex w-full min-w-0 flex-wrap items-center gap-2 overflow-hidden pt-1">
                            {imageState.status === "idle" && (
                              <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs" onClick={() => generateSceneImage(scene)} disabled={anyImageGenerating}>
                                <ImageIcon className="h-3 w-3" /> 生成图片
                              </Button>
                            )}
                            {imageState.status === "generating" && (
                              <span className="flex items-center gap-1.5 text-xs text-muted-foreground"><Loader2 className="h-3 w-3 animate-spin" /> GPT Image 2.0 生成中...</span>
                            )}
                            {imageState.status === "done" && imageState.imageUrl && (
                              <div className="flex flex-wrap items-center gap-2 min-w-0">
                                <span className="flex items-center gap-1 text-xs text-primary"><Check className="h-3 w-3" /> 图片已生成</span>
                                <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs" onClick={() => window.open(imageState.imageUrl!, "_blank", "noopener,noreferrer")}><Play className="h-3 w-3" /> 打开</Button>
                                <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs" onClick={() => copyToClipboard(imageState.imageUrl!, "图片链接")}><Copy className="h-3 w-3" /> 复制链接</Button>
                                <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs" onClick={() => downloadImage(imageState.imageUrl!, `scene-${scene.sceneNumber}`)}><Download className="h-3 w-3" /> 下载</Button>
                                <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs" onClick={() => generateSceneImage(scene)} disabled={anyImageGenerating}>重生成</Button>
                              </div>
                            )}
                            {imageState.status === "failed" && (
                              <div className="flex flex-wrap items-center gap-2 min-w-0">
                                <span className="text-xs text-destructive break-words">{imageState.error || "图片生成失败"}</span>
                                <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => generateSceneImage(scene)} disabled={anyImageGenerating}>重试</Button>
                              </div>
                            )}
                          </div>

                          {imageState.status === "done" && imageState.imageUrl && (
                            <div className="mt-2 w-full max-w-full min-w-0 overflow-hidden rounded-lg border bg-muted/30">
                              <img src={imageState.imageUrl} alt={`场景 ${scene.sceneNumber} GPT Image 2.0 分镜图`} className="max-h-[520px] w-full object-contain" loading="lazy" />
                            </div>
                          )}

                          {/* Video generation per scene */}
                          <div className="flex items-center gap-2 flex-wrap pt-1">
                            {videoState.status === "idle" && (
                              <div className="flex flex-wrap items-center gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="gap-1.5 text-xs h-8"
                                  onClick={() => generateSceneVideo(scene)}
                                  disabled={anyVideoGenerating && videoState.status === "idle"}
                                >
                                  <Video className="h-3 w-3" /> 生成本镜头视频
                                </Button>
                                <Button
                                  size="sm"
                                  className="gap-1.5 text-xs h-8"
                                  onClick={() => generateSceneVideo(scene, 10)}
                                  disabled={anyVideoGenerating && videoState.status === "idle"}
                                >
                                  <Video className="h-3 w-3" /> 生成10秒视频
                                </Button>
                              </div>
                            )}

                            {(videoState.status === "submitting" || videoState.status === "in_queue" || videoState.status === "generating") && (
                              <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                                <Loader2 className="h-3 w-3 animate-spin" />
                                {getStatusLabel(videoState.status)}
                              </span>
                            )}

                            {videoState.status === "done" && videoState.videoUrl && (
                              <div className="flex flex-wrap items-center gap-2 min-w-0">
                                <span className="text-xs text-primary flex items-center gap-1">
                                  <Check className="h-3 w-3" /> 已完成
                                </span>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-xs h-7 gap-1"
                                  onClick={() => openVideoUrl(videoState.videoUrl!)}
                                >
                                  <Play className="h-3 w-3" /> 打开
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-xs h-7 gap-1"
                                  onClick={() => downloadSingleVideo(videoState.videoUrl!, scene.sceneNumber)}
                                >
                                  <Download className="h-3 w-3" /> 下载
                                </Button>
                              </div>
                            )}

                            {videoState.status === "failed" && (
                              <div className="flex flex-wrap items-center gap-2 min-w-0">
                                <span className="text-xs text-destructive">{videoState.error || "失败"}</span>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-xs h-7"
                                  onClick={() => generateSceneVideo(scene)}
                                >
                                  重试
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="text-xs h-7"
                                  onClick={() => generateSceneVideo(scene, 10)}
                                >
                                  重试10秒
                                </Button>
                              </div>
                            )}
                          </div>

                          {/* Audio/TTS per scene */}
                          {(() => {
                            const audioState = sceneAudios[scene.sceneNumber] || { status: "idle" as AudioStatus };
                            return (
                              <div className="flex items-center gap-2 flex-wrap">
                                {audioState.status === "idle" && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="gap-1.5 text-xs h-8"
                                    onClick={() => generateSceneAudio(scene)}
                                    disabled={anyAudioGenerating}
                                  >
                                    <Mic className="h-3 w-3" /> 生成旁白
                                  </Button>
                                )}
                                {audioState.status === "generating" && (
                                  <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                                    <Loader2 className="h-3 w-3 animate-spin" /> 旁白生成中...
                                  </span>
                                )}
                                {audioState.status === "done" && audioState.audioBase64 && (
                                  <div className="flex flex-wrap items-center gap-2 min-w-0">
                                    <span className="text-xs text-primary flex items-center gap-1">
                                      <Volume2 className="h-3 w-3" /> 旁白已生成
                                    </span>
                                    <audio
                                      src={URL.createObjectURL(base64ToBlob(audioState.audioBase64, "audio/mpeg"))}
                                      controls
                                      className="h-7 w-full max-w-[200px] min-w-0"
                                      preload="metadata"
                                    />
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="text-xs h-7 gap-1"
                                      onClick={() => downloadSceneAudio(scene.sceneNumber)}
                                    >
                                      <Download className="h-3 w-3" /> 下载
                                    </Button>
                                  </div>
                                )}
                                {audioState.status === "failed" && (
                                  <div className="flex flex-wrap items-center gap-2 min-w-0">
                                    <span className="text-xs text-destructive break-words">{audioState.error || "旁白生成失败"}</span>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="text-xs h-7"
                                      onClick={() => generateSceneAudio(scene)}
                                    >
                                      重试
                                    </Button>
                                  </div>
                                )}
                                {(scene.narration || scene.dialogue) && audioState.status === "idle" && (
                                  <span className="text-xs text-muted-foreground truncate max-w-full sm:max-w-[200px]">
                                    📝 {(scene.narration || scene.dialogue).slice(0, 30)}...
                                  </span>
                                )}
                              </div>
                            );
                          })()}

                          {/* Video preview */}
                          {videoState.status === "done" && videoState.videoUrl && (
                            <div className="mt-2 max-w-full min-w-0 overflow-hidden">
                              {videoPreviewFallbacks[scene.sceneNumber] ? (
                                <div className="flex flex-wrap items-center gap-2 rounded-lg border border-dashed p-3">
                                  <span className="text-xs text-muted-foreground">当前环境无法直接预览，请点击打开或复制链接</span>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-7 gap-1 text-xs"
                                    onClick={() => openVideoUrl(videoState.videoUrl!)}
                                  >
                                    <Play className="h-3 w-3" /> 打开视频
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 gap-1 text-xs"
                                    onClick={() => copyToClipboard(videoState.videoUrl!, "视频链接")}
                                  >
                                    <Copy className="h-3 w-3" /> 复制链接
                                  </Button>
                                </div>
                              ) : (
                                <video
                                  key={`${scene.sceneNumber}-${videoState.videoUrl}`}
                                  src={videoState.videoUrl}
                                  controls
                                  className="w-full max-w-md max-h-[70vh] rounded-lg border"
                                  preload="metadata"
                                  onError={() => {
                                    setVideoPreviewFallbacks((prev) =>
                                      prev[scene.sceneNumber]
                                        ? prev
                                        : { ...prev, [scene.sceneNumber]: true }
                                    );
                                  }}
                                />
                              )}
                              <p className="text-xs text-muted-foreground mt-1">⚠️ 视频链接有效期约1小时，请及时下载</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* Export */}
          <div className="flex justify-end">
            <Button variant="outline" onClick={exportJSON}>
              <Download className="h-4 w-4" />
              导出完整脚本 JSON
            </Button>
          </div>
        </div>
      )}
      </AdminPageLayout>
    </div>

      {pendingSequel && sequelGenerationSource && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t bg-background/95 p-3 shadow-lg backdrop-blur supports-[backdrop-filter]:bg-background/80">
          <div className="mx-auto flex max-w-5xl flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0 text-sm">
              <div className="flex items-center gap-2 font-medium text-primary">
                <Check className="h-4 w-4" /> 第{sequelGenerationSource.episodeNumber + 1}集续集预览已生成（尚未替换）
              </div>
              <div className="truncate text-xs text-muted-foreground">页面上方可预览新脚本；不满意点保留当前脚本，当前脚本不会被覆盖。</div>
            </div>
            <div className="grid gap-2 sm:grid-cols-[180px_180px_auto_auto] sm:items-center">
              <Select value={sequelDirection} onValueChange={setSequelDirection} disabled={generatingSequel}>
                <SelectTrigger className="h-11"><SelectValue placeholder="冲突推进方向" /></SelectTrigger>
                <SelectContent>{SEQUEL_DIRECTIONS.map((item) => <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>)}</SelectContent>
              </Select>
              <Select value={sequelOpeningAngle} onValueChange={setSequelOpeningAngle} disabled={generatingSequel}>
                <SelectTrigger className="h-11"><SelectValue placeholder="开场角度" /></SelectTrigger>
                <SelectContent>{SEQUEL_OPENING_ANGLES.map((item) => <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>)}</SelectContent>
              </Select>
              <Button type="button" className="flex-1 gap-1.5 sm:flex-none" onClick={applyPendingSequel}>
                <Check className="h-4 w-4" /> 替换当前脚本
              </Button>
              <Button type="button" variant="ghost" className="flex-1 gap-1.5 sm:flex-none" onClick={discardPendingSequel}>
                <X className="h-4 w-4" /> 保留当前脚本
              </Button>
              <Button type="button" variant="outline" className="flex-1 gap-1.5 sm:flex-none" onClick={() => generateSequel(pendingSequel.source)} disabled={generatingSequel}>
                <RefreshCw className="h-4 w-4" /> 重新生成
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Video preview modal */}
      {modalVideoUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70" onClick={() => setModalVideoUrl(null)}>
          <div className="relative w-full max-w-2xl mx-4" onClick={(e) => e.stopPropagation()}>
            <Button
              variant="ghost"
              size="icon"
              className="absolute -top-10 right-0 text-white hover:bg-white/20"
              onClick={() => setModalVideoUrl(null)}
            >
              <X className="h-6 w-6" />
            </Button>
            <video
              src={modalVideoUrl}
              controls
              autoPlay
              className="w-full rounded-lg"
              onError={() => {
                toast.error("视频加载失败");
                copyToClipboard(modalVideoUrl, "视频链接");
                setModalVideoUrl(null);
              }}
            />
            <div className="flex justify-center gap-2 mt-3">
              <Button variant="secondary" size="sm" onClick={() => copyToClipboard(modalVideoUrl, "视频链接")}>
                <Copy className="h-3 w-3 mr-1" /> 复制链接
              </Button>
              <Button variant="secondary" size="sm" onClick={() => setModalVideoUrl(null)}>
                关闭
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
