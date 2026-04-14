import { useState } from "react";
import { AdminPageLayout } from "./shared/AdminPageLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { supabase } from "@/integrations/supabase/client";
import { extractEdgeFunctionError } from "@/lib/edgeFunctionError";
import { toast } from "sonner";
import { Copy, Loader2, Download, Clapperboard, User, Film } from "lucide-react";

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
}

interface DramaScript {
  title: string;
  synopsis: string;
  characters: Character[];
  scenes: Scene[];
  totalScenes: number;
  estimatedDuration: string;
}

export default function DramaScriptGenerator() {
  const [theme, setTheme] = useState("");
  const [genre, setGenre] = useState("suspense");
  const [style, setStyle] = useState("anime");
  const [sceneCount, setSceneCount] = useState(8);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<DramaScript | null>(null);

  const handleGenerate = async () => {
    if (!theme.trim()) {
      toast.error("请输入故事主题");
      return;
    }
    setLoading(true);
    setResult(null);
    try {
      const { data, error } = await supabase.functions.invoke("drama-script-ai", {
        body: { theme, genre, style, sceneCount },
      });
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
      {/* Input Form */}
      <Card>
        <CardContent className="pt-6 space-y-5">
          <div className="space-y-2">
            <Label>故事主题 *</Label>
            <Input
              placeholder="例如：一个程序员穿越到古代成为宰相"
              value={theme}
              onChange={(e) => setTheme(e.target.value)}
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

          <Button onClick={handleGenerate} disabled={loading || !theme.trim()} className="w-full">
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                AI生成中，请稍候...
              </>
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

          {/* Scenes Timeline */}
          <div>
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <Film className="h-4 w-4" /> 分镜时间线
            </h3>
            <div className="space-y-3">
              {result.scenes.map((scene) => (
                <Card key={scene.sceneNumber}>
                  <CardContent className="pt-4">
                    <div className="flex items-start gap-4">
                      {/* Scene number */}
                      <div className="flex flex-col items-center shrink-0">
                        <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
                          {scene.sceneNumber}
                        </div>
                        <span className="text-xs text-muted-foreground mt-1">{scene.duration}</span>
                      </div>

                      <div className="flex-1 space-y-2 min-w-0">
                        {/* Panel type */}
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded font-medium">
                            {scene.panel}
                          </span>
                          <span className="text-xs text-muted-foreground">🎵 {scene.bgm}</span>
                        </div>

                        {/* Action & Dialogue */}
                        <div className="text-sm">
                          <span className="text-muted-foreground">动作：</span>
                          {scene.characterAction}
                        </div>
                        {scene.dialogue && (
                          <div className="text-sm italic border-l-2 border-primary/30 pl-3">
                            「{scene.dialogue}」
                          </div>
                        )}

                        {/* Image Prompt */}
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
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
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
