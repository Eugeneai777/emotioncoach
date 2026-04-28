import { useState, useRef, useCallback, useEffect } from "react";
import { AdminPageLayout } from "./shared/AdminPageLayout";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
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

const CONSISTENCY_THRESHOLD = 85;

const normalizeConversionStyles = (styles?: string[] | string | null) => {
  const values = Array.isArray(styles) ? styles : styles ? [styles] : ["plot"];
  const validValues = values.filter((value) => CONVERSION_STYLES.some((style) => style.value === value));
  return validValues.length > 0 ? validValues : ["plot"];
};

export default function DramaScriptGenerator() {
  const [mode, setMode] = useState<"generic" | "youjin">("generic");
  const [theme, setTheme] = useState("");
  const [genre, setGenre] = useState("suspense");
  const [style, setStyle] = useState("anime");
  const [sceneCount, setSceneCount] = useState(8);
  const [conflictIntensity, setConflictIntensity] = useState("strong");
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
  const [suggestedThemes, setSuggestedThemes] = useState<{ title: string; description: string }[]>([]);
  const [loadingThemes, setLoadingThemes] = useState(false);
  const [selectedThemeIdx, setSelectedThemeIdx] = useState<number | null>(null);
  const themeFetchRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Video generation state
  const [videoAspectRatio, setVideoAspectRatio] = useState("9:16");
  const [videoDuration, setVideoDuration] = useState(5);
  const [sceneVideos, setSceneVideos] = useState<Record<number, SceneVideoState>>({});
  const [videoPreviewFallbacks, setVideoPreviewFallbacks] = useState<Record<number, boolean>>({});
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
      setResult(data as DramaScript);
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
        script_data: { ...result, conversionStyles: mode === "youjin" ? conversionStyles : undefined },
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

  const loadSavedScript = (script: SavedDramaScript) => {
    setMode(script.mode || "generic");
    setTheme(script.theme || script.title);
    setGenre(script.genre || "suspense");
    setStyle(script.style || "anime");
    setConflictIntensity(script.conflict_intensity || "strong");
    setTargetAudience(script.target_audience || "women");
    setConversionStyles(normalizeConversionStyles(script.script_data?.conversionStyles || script.conversion_style));
    setSelectedProducts(new Set((script.selected_products || []).map((p) => p.key)));
    setResult(script.script_data);
    setSavedScriptId(script.id);
    setActiveSavedScript(script);
    clearGeneratedAssets();
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
    setResult(null);
    clearGeneratedAssets();
    try {
      const productsForSequel = script.selected_products || [];
      const body: any = {
        action: "generate_sequel",
        theme: `${script.title} 后续：冲突继续升级`,
        genre: script.genre || genre,
        style: script.style || style,
        sceneCount,
        mode: script.mode,
        conflictIntensity,
        previousScript: script,
      };
      if (script.mode === "youjin") {
        const sequelConversionStyles = normalizeConversionStyles(script.script_data?.conversionStyles || script.conversion_style || conversionStyles);
        body.products = productsForSequel;
        body.targetAudience = script.target_audience || targetAudience;
        body.conversionStyles = sequelConversionStyles;
        body.conversionStyle = sequelConversionStyles[0] || "plot";
      }
      const { data, error } = await supabase.functions.invoke("drama-script-ai", { body });
      if (data?.error || error) {
        throw new Error(await extractEdgeFunctionError(data, error, "续集生成失败，请稍后重试"));
      }
      setMode(script.mode || "generic");
      setGenre(script.genre || genre);
      setStyle(script.style || style);
      setTargetAudience(script.target_audience || targetAudience);
      setConversionStyles(normalizeConversionStyles(script.script_data?.conversionStyles || script.conversion_style || conversionStyles));
      setSelectedProducts(new Set(productsForSequel.map((p) => p.key)));
      setTheme((data as DramaScript).title);
      setResult(data as DramaScript);
      setSavedScriptId(null);
      setActiveSavedScript(script);
      const check = (data as DramaScript).consistencyCheck;
      if (check && check.overallScore < CONSISTENCY_THRESHOLD) {
        toast.error(`一致性评分 ${check.overallScore}，低于${CONSISTENCY_THRESHOLD}，建议重新生成`);
      }
      toast.success(`第${script.episode_number + 1}集已生成，确认后可保存`);
    } catch (e: any) {
      toast.error(e.message || "续集生成失败");
    } finally {
      setGeneratingSequel(false);
    }
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
    const blob = new Blob([JSON.stringify(result, null, 2)], { type: "application/json" });
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

  const generateSceneVideo = useCallback(async (scene: Scene) => {
    const num = scene.sceneNumber;
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
          prompt: scene.imagePrompt,
          aspect_ratio: videoAspectRatio,
          duration: videoDuration,
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
  }, [videoAspectRatio, videoDuration, updateSceneVideo, pollVideoStatus]);

  const handleBatchGenerate = async () => {
    if (!result) return;
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
      <div className="flex flex-wrap gap-2 mb-4 min-w-0">
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
      <Card className="max-w-full overflow-hidden">
        <CardContent className="pt-6 space-y-5">
          <div className="space-y-2">
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

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 min-w-0">
            <div className="space-y-2">
              <Label>题材类型</Label>
              <div className="flex flex-wrap gap-2">
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

            <div className="space-y-2">
              <Label>画风选择</Label>
              <div className="flex flex-wrap gap-2">
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

          <div className="space-y-2">
            <Label>冲突强度</Label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
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
                <div className="flex flex-wrap gap-2">
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
                <div className="flex flex-wrap gap-2">
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

              <div className="space-y-2">
                <Label className="flex items-center gap-1.5">
                  <ShoppingCart className="h-4 w-4" /> 选择转化产品 *
                </Label>
                <Tabs defaultValue="assessment" className="w-full">
                  <TabsList className="w-full h-auto flex flex-wrap justify-start gap-1">
                    {Object.entries(PRODUCT_CATALOG).map(([key, cat]) => (
                      <TabsTrigger key={key} value={key} className="flex-1 min-w-[72px] text-xs">
                        {cat.label}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                  {Object.entries(PRODUCT_CATALOG).map(([key, cat]) => (
                    <TabsContent key={key} value={key}>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {cat.items.map((item) => (
                          <label
                            key={item.key}
                            className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
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
                            <div className="min-w-0">
                              <div className="text-sm font-medium">{item.name}</div>
                              <div className="text-xs text-muted-foreground mt-0.5">{item.description}</div>
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
            <div className="space-y-2 max-h-72 overflow-auto pr-1">
              {savedScripts.map((script) => (
                <div key={script.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 rounded-lg border p-3 min-w-0 overflow-hidden">
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
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Results */}
      {result && (
        <div className="space-y-4 mt-6">
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
                  生成续集
                </Button>
                {!activeSavedScript && !savedScriptId && (
                  <span className="text-xs text-muted-foreground self-center">先保存当前脚本后，可继续生成第2集。</span>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Sequel Consistency Check */}
          {result.consistencyCheck && (
            <Card className={result.consistencyCheck.overallScore < CONSISTENCY_THRESHOLD ? "border-destructive/50" : "border-primary/30"}>
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
                    <p className="text-sm font-medium text-destructive">评分低于阈值，建议不要保存，直接重新生成续集。</p>
                    <p className="text-xs text-muted-foreground">{result.consistencyCheck.regenerationAdvice}</p>
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

          {/* Cover Poster Draft */}
          {result.coverPoster && (
            <Card className="border-primary/30">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <ImageIcon className="h-4 w-4" /> 本集封面海报草案
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="rounded-lg bg-muted/50 p-3">
                    <Label className="text-xs text-muted-foreground">封面主标题</Label>
                    <p className="text-sm font-semibold mt-1">{result.coverPoster.headline}</p>
                  </div>
                  <div className="rounded-lg bg-muted/50 p-3">
                    <Label className="text-xs text-muted-foreground">辅助文案</Label>
                    <p className="text-sm mt-1">{result.coverPoster.subheadline}</p>
                  </div>
                  <div className="rounded-lg bg-muted/50 p-3">
                    <Label className="text-xs text-muted-foreground">封面钩子</Label>
                    <p className="text-sm font-medium mt-1">{result.coverPoster.hookText}</p>
                  </div>
                </div>
                <div className="bg-muted/50 rounded-lg p-3">
                  <div className="flex items-start justify-between gap-2">
                    <code className="text-xs break-all flex-1 leading-relaxed">{result.coverPoster.posterImagePrompt}</code>
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
            <Card className="border-primary/30">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" /> 转化文案
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {result.conversionScript && (
                  <div className="space-y-2">
                    <Label className="text-xs font-medium">视频描述文案</Label>
                    <div className="bg-muted/50 rounded-lg p-3">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm whitespace-pre-wrap flex-1">{buildFullConversionText()}</p>
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
                    <div className="bg-muted/50 rounded-lg p-3">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm whitespace-pre-wrap flex-1">{result.commentHook}</p>
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
          <div>
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <User className="h-4 w-4" /> 角色设定
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {result.characters.map((char, i) => (
                <Card key={i} className="border-dashed">
                  <CardContent className="pt-4 space-y-2">
                    <div className="font-medium">{char.name}</div>
                    <p className="text-sm text-muted-foreground">{char.description}</p>
                    <div className="bg-muted/50 rounded-lg p-3">
                      <div className="flex items-start justify-between gap-2">
                        <code className="text-xs break-all flex-1">{char.imagePrompt}</code>
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
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Video Generation Settings */}
          <Card className="border-dashed border-primary/40">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Video className="h-4 w-4" /> 视频生成设置
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs">画面比例</Label>
                  <div className="flex gap-2">
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
                <div className="space-y-2">
                  <Label className="text-xs">片段时长</Label>
                  <div className="flex gap-2">
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
              <div className="flex items-center gap-3 flex-wrap">
                <Button
                  onClick={handleBatchGenerate}
                  disabled={batchGenerating || anyVideoGenerating}
                  className="gap-2"
                >
                  {batchGenerating ? (
                    <><Loader2 className="h-4 w-4 animate-spin" /> 批量提交中...</>
                  ) : (
                    <><Play className="h-4 w-4" /> 全部生成视频</>
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

              <p className="text-xs text-muted-foreground">
                ⚠️ 视频生成需 1-3 分钟/片段，生成后链接 1 小时内有效，请及时下载。旁白和视频需在剪辑软件中合并。
              </p>
            </CardContent>
          </Card>

          {/* Scenes Timeline */}
          <div>
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <Film className="h-4 w-4" /> 分镜时间线
            </h3>
            <div className="space-y-3">
              {result.scenes.map((scene) => {
                const videoState = sceneVideos[scene.sceneNumber] || { status: "idle" as VideoStatus };

                return (
                  <Card key={scene.sceneNumber}>
                    <CardContent className="pt-4">
                      <div className="flex items-start gap-4">
                        <div className="flex flex-col items-center shrink-0">
                          <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
                            {scene.sceneNumber}
                          </div>
                          <span className="text-xs text-muted-foreground mt-1">{scene.duration}</span>
                        </div>

                        <div className="flex-1 space-y-2 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded font-medium">
                              {scene.panel}
                            </span>
                            <span className="text-xs text-muted-foreground">🎵 {scene.bgm}</span>
                            {scene.relatedProduct && (
                              <span className="text-xs bg-accent text-accent-foreground px-2 py-0.5 rounded">
                                🔗 {getProductName(scene.relatedProduct)}
                              </span>
                            )}
                          </div>

                          <div className="text-sm">
                            <span className="text-muted-foreground">动作：</span>
                            {scene.characterAction}
                          </div>
                          {scene.dialogue && (
                            <div className="text-sm italic border-l-2 border-primary/30 pl-3">
                              「{scene.dialogue}」
                            </div>
                          )}

                          <div className="bg-muted/50 rounded-lg p-3">
                            <div className="flex items-start justify-between gap-2">
                              <code className="text-xs break-all flex-1 leading-relaxed">
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
                            </div>
                          </div>

                          {/* Video generation per scene */}
                          <div className="flex items-center gap-2 flex-wrap pt-1">
                            {videoState.status === "idle" && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="gap-1.5 text-xs h-8"
                                onClick={() => generateSceneVideo(scene)}
                                disabled={anyVideoGenerating && videoState.status === "idle"}
                              >
                                <Video className="h-3 w-3" /> 生成视频
                              </Button>
                            )}

                            {(videoState.status === "submitting" || videoState.status === "in_queue" || videoState.status === "generating") && (
                              <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                                <Loader2 className="h-3 w-3 animate-spin" />
                                {getStatusLabel(videoState.status)}
                              </span>
                            )}

                            {videoState.status === "done" && videoState.videoUrl && (
                              <div className="flex items-center gap-2">
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
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-destructive">{videoState.error || "失败"}</span>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-xs h-7"
                                  onClick={() => generateSceneVideo(scene)}
                                >
                                  重试
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
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs text-primary flex items-center gap-1">
                                      <Volume2 className="h-3 w-3" /> 旁白已生成
                                    </span>
                                    <audio
                                      src={URL.createObjectURL(base64ToBlob(audioState.audioBase64, "audio/mpeg"))}
                                      controls
                                      className="h-7 max-w-[200px]"
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
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs text-destructive">{audioState.error || "旁白生成失败"}</span>
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
                                  <span className="text-xs text-muted-foreground truncate max-w-[200px]">
                                    📝 {(scene.narration || scene.dialogue).slice(0, 30)}...
                                  </span>
                                )}
                              </div>
                            );
                          })()}

                          {/* Video preview */}
                          {videoState.status === "done" && videoState.videoUrl && (
                            <div className="mt-2">
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
                                  className="w-full max-w-md rounded-lg border"
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
