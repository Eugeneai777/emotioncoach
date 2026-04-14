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
import { Copy, Loader2, Download, Clapperboard, User, Film, Sparkles, ShoppingCart, Target, MessageSquare, Video, Play, Square, Check } from "lucide-react";

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
  bgm: string;
  duration: string;
  relatedProduct?: string;
}

interface DramaScript {
  title: string;
  synopsis: string;
  characters: Character[];
  scenes: Scene[];
  totalScenes: number;
  estimatedDuration: string;
  conversionScript?: string;
  commentHook?: string;
}

type VideoStatus = "idle" | "submitting" | "in_queue" | "generating" | "done" | "failed";

interface SceneVideoState {
  status: VideoStatus;
  taskId?: string;
  videoUrl?: string;
  error?: string;
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

export default function DramaScriptGenerator() {
  const [mode, setMode] = useState<"generic" | "youjin">("generic");
  const [theme, setTheme] = useState("");
  const [genre, setGenre] = useState("suspense");
  const [style, setStyle] = useState("anime");
  const [sceneCount, setSceneCount] = useState(8);
  const [targetAudience, setTargetAudience] = useState("women");
  const [conversionStyle, setConversionStyle] = useState("plot");
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<DramaScript | null>(null);
  const [suggestedThemes, setSuggestedThemes] = useState<{ title: string; description: string }[]>([]);
  const [loadingThemes, setLoadingThemes] = useState(false);
  const [selectedThemeIdx, setSelectedThemeIdx] = useState<number | null>(null);
  const themeFetchRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Video generation state
  const [videoAspectRatio, setVideoAspectRatio] = useState("9:16");
  const [videoDuration, setVideoDuration] = useState(5);
  const [sceneVideos, setSceneVideos] = useState<Record<number, SceneVideoState>>({});
  const [batchGenerating, setBatchGenerating] = useState(false);
  const [merging, setMerging] = useState(false);
  const pollingRefs = useRef<Record<number, ReturnType<typeof setInterval>>>({});

  const toggleProduct = (key: string) => {
    setSelectedProducts((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const getSelectedProductDetails = (): ProductItem[] => {
    const all: ProductItem[] = [];
    Object.values(PRODUCT_CATALOG).forEach((cat) => {
      cat.items.forEach((item) => {
        if (selectedProducts.has(item.key)) all.push(item);
      });
    });
    return all;
  };

  const getProductName = (key: string): string => {
    for (const cat of Object.values(PRODUCT_CATALOG)) {
      const found = cat.items.find((i) => i.key === key);
      if (found) return found.name;
    }
    return key;
  };

  // Auto-fetch suggested themes when products change in youjin mode
  const fetchSuggestedThemes = useCallback(async () => {
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
        body: { action: "suggest_themes", products, targetAudience },
      });
      if (data?.themes && Array.isArray(data.themes)) {
        setSuggestedThemes(data.themes.slice(0, 3));
      }
    } catch {
      // silently fail
    } finally {
      setLoadingThemes(false);
    }
  }, [mode, selectedProducts, targetAudience]);

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
  }, [selectedProducts, targetAudience, mode]);

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
    // Clear all polling
    Object.values(pollingRefs.current).forEach(clearInterval);
    pollingRefs.current = {};

    try {
      const body: any = { theme, genre, style, sceneCount, mode };
      if (mode === "youjin") {
        body.products = getSelectedProductDetails();
        body.targetAudience = targetAudience;
        body.conversionStyle = conversionStyle;
      }
      const { data, error } = await supabase.functions.invoke("drama-script-ai", { body });
      if (data?.error || error) {
        throw new Error(await extractEdgeFunctionError(data, error, "生成失败，请稍后重试"));
      }
      setResult(data as DramaScript);
      toast.success("脚本生成成功！");
    } catch (e: any) {
      toast.error(e.message || "生成失败");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string, label = "提示词") => {
    navigator.clipboard.writeText(text);
    toast.success(`${label}已复制`);
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

      const blob = await mergeVideosClientSide(urls, (msg) => toast.info(msg));
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

  const downloadSingleVideo = (url: string, sceneNum: number) => {
    const a = document.createElement("a");
    a.href = url;
    a.download = `scene-${sceneNum}.mp4`;
    a.target = "_blank";
    a.click();
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
    <AdminPageLayout
      title={
        <span className="flex items-center gap-2">
          <Clapperboard className="h-5 w-5" />
          AI漫剧分镜脚本
        </span>
      }
      description="输入故事主题，AI自动生成多场景分镜脚本，画面提示词可直接用于即梦/MJ生图"
    >
      {/* Mode Toggle */}
      <div className="flex gap-2 mb-4">
        <Button
          variant={mode === "generic" ? "default" : "outline"}
          onClick={() => setMode("generic")}
          disabled={loading}
        >
          🎬 通用漫剧
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
      <Card>
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>题材类型</Label>
              <div className="flex flex-wrap gap-2">
                {GENRES.map((g) => (
                  <button
                    key={g.value}
                    onClick={() => setGenre(g.value)}
                    disabled={loading}
                    className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
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
                    className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
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

          {/* Youjin-specific options */}
          {mode === "youjin" && (
            <>
              <div className="space-y-2">
                <Label className="flex items-center gap-1.5">
                  <Target className="h-4 w-4" /> 目标人群
                </Label>
                <div className="flex flex-wrap gap-2">
                  {TARGET_AUDIENCES.map((a) => (
                    <button
                      key={a.value}
                      onClick={() => setTargetAudience(a.value)}
                      disabled={loading}
                      className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
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

              <div className="space-y-2">
                <Label>转化方式</Label>
                <div className="flex flex-wrap gap-2">
                  {CONVERSION_STYLES.map((c) => (
                    <button
                      key={c.value}
                      onClick={() => setConversionStyle(c.value)}
                      disabled={loading}
                      className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                        conversionStyle === c.value
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
                  <TabsList className="w-full flex">
                    {Object.entries(PRODUCT_CATALOG).map(([key, cat]) => (
                      <TabsTrigger key={key} value={key} className="flex-1 text-xs">
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
                  <div className="text-xs text-muted-foreground">
                    已选 {selectedProducts.size} 个产品：{getSelectedProductDetails().map((p) => p.name).join("、")}
                  </div>
                )}
              </div>
            </>
          )}

          {/* Suggested Themes for Youjin mode */}
          {mode === "youjin" && (loadingThemes || suggestedThemes.length > 0) && (
            <div className="space-y-2">
              <Label className="flex items-center gap-1.5">
                <Sparkles className="h-4 w-4 text-amber-500" /> AI推荐爆款主题
              </Label>
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
              <p className="text-xs text-muted-foreground">点击选用推荐主题，或在下方输入自定义主题</p>
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

      {/* Results */}
      {result && (
        <div className="space-y-4 mt-6">
          {/* Title & Synopsis */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{result.title}</CardTitle>
                <div className="flex gap-2">
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
              <p className="text-sm text-muted-foreground leading-relaxed">{result.synopsis}</p>
            </CardContent>
          </Card>

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

                {completedCount > 0 && (
                  <span className="text-xs text-muted-foreground">
                    已完成 {completedCount}/{result.scenes.length}
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
                      <><Download className="h-4 w-4" /> 合并下载成片</>
                    )}
                  </Button>
                )}
              </div>

              {completedCount > 0 && completedCount < result.scenes.length && (
                <Progress value={(completedCount / result.scenes.length) * 100} className="h-2" />
              )}

              <p className="text-xs text-muted-foreground">
                ⚠️ 视频生成需 1-3 分钟/片段，生成后链接 1 小时内有效，请及时下载
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

                          {/* Video preview */}
                          {videoState.status === "done" && videoState.videoUrl && (
                            <div className="mt-2">
                              <video
                                src={videoState.videoUrl}
                                controls
                                className="w-full max-w-md rounded-lg border"
                                preload="metadata"
                              />
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
  );
}
