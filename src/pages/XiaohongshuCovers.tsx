import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { AdminPageLayout } from "@/components/admin/shared/AdminPageLayout";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Download, ImageIcon, Loader2, Palette, Type, Shuffle } from "lucide-react";
import { cn } from "@/lib/utils";

const THEMES = [
  { key: "觉醒", label: "马上觉醒", desc: "骏马觉醒，金光破晓" },
  { key: "发财", label: "马上发财", desc: "踏金币，元宝飞溅" },
  { key: "回血", label: "马上回血", desc: "浴火重生，伤口化光" },
  { key: "看见", label: "马上看见", desc: "山巅俯瞰，洞察全局" },
  { key: "破局", label: "马上破局", desc: "冲破锁链，碎片飞溅" },
  { key: "翻身", label: "马上翻身", desc: "深渊跃天，逆转姿态" },
  { key: "出发", label: "马上出发", desc: "面向日出，红带飘扬" },
];

const STYLES = [
  { name: "随机", color: "bg-gradient-to-r from-purple-500 to-pink-500" },
  { name: "暗黑大字报", color: "bg-gray-900" },
  { name: "红底白字冲击", color: "bg-red-700" },
  { name: "奶油温柔风", color: "bg-amber-100" },
  { name: "深蓝高级感", color: "bg-blue-950" },
  { name: "荧光撞色", color: "bg-green-500" },
  { name: "极简黑白", color: "bg-white border border-gray-300" },
];

interface CoverResult {
  imageUrl?: string;
  loading?: boolean;
  error?: string;
}

export default function XiaohongshuCovers() {
  const [results, setResults] = useState<Record<string, CoverResult>>({});
  const [generating, setGenerating] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Custom text fields
  const [selectedStyle, setSelectedStyle] = useState("随机");
  const [customHook, setCustomHook] = useState("");
  const [customTitle, setCustomTitle] = useState("");
  const [customBottom, setCustomBottom] = useState("");

  const completedCount = Object.values(results).filter((r) => r.imageUrl).length;
  const progress = generating ? ((currentIndex) / THEMES.length) * 100 : (completedCount / THEMES.length) * 100;

  const hasCustomText = customHook || customTitle || customBottom;

  const buildRequestBody = (themeKey: string) => {
    const body: Record<string, unknown> = { theme: themeKey };
    if (hasCustomText) {
      body.customText = {
        ...(customHook && { hook: customHook }),
        ...(customTitle && { title: customTitle }),
        ...(customBottom && { bottom: customBottom }),
      };
    }
    if (selectedStyle !== "随机") {
      body.styleName = selectedStyle;
    }
    return body;
  };

  const generateAll = async () => {
    setGenerating(true);
    setResults({});

    for (let i = 0; i < THEMES.length; i++) {
      const theme = THEMES[i];
      setCurrentIndex(i);
      setResults((prev) => ({ ...prev, [theme.key]: { loading: true } }));

      try {
        const { data, error } = await supabase.functions.invoke("generate-xiaohongshu-covers", {
          body: buildRequestBody(theme.key),
        });

        if (error) throw error;
        setResults((prev) => ({ ...prev, [theme.key]: { imageUrl: data.imageUrl } }));
        toast.success(`${theme.label} 生成成功`);
      } catch (e: any) {
        const msg = e?.message || "生成失败";
        setResults((prev) => ({ ...prev, [theme.key]: { error: msg } }));
        toast.error(`${theme.label}: ${msg}`);
      }

      if (i < THEMES.length - 1) {
        await new Promise((r) => setTimeout(r, 3000));
      }
    }

    setGenerating(false);
    setCurrentIndex(THEMES.length);
  };

  const generateSingle = async (themeKey: string) => {
    setResults((prev) => ({ ...prev, [themeKey]: { loading: true } }));
    try {
      const { data, error } = await supabase.functions.invoke("generate-xiaohongshu-covers", {
        body: buildRequestBody(themeKey),
      });
      if (error) throw error;
      setResults((prev) => ({ ...prev, [themeKey]: { imageUrl: data.imageUrl } }));
      toast.success("生成成功");
    } catch (e: any) {
      setResults((prev) => ({ ...prev, [themeKey]: { error: e?.message || "失败" } }));
      toast.error(e?.message || "生成失败");
    }
  };

  const downloadImage = async (url: string, name: string) => {
    try {
      const resp = await fetch(url);
      const blob = await resp.blob();
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `${name}.png`;
      a.click();
      URL.revokeObjectURL(a.href);
    } catch {
      toast.error("下载失败");
    }
  };

  return (
    <AdminPageLayout
      title="小红书封面生成器"
      description="爆款大字报风格 · 6种设计风格 · 自定义文案"
      actions={
        <Button onClick={generateAll} disabled={generating} size="lg">
          {generating ? (
            <>
              <Loader2 className="animate-spin mr-2 h-4 w-4" />
              生成中 ({currentIndex + 1}/{THEMES.length})
            </>
          ) : (
            <>
              <ImageIcon className="mr-2 h-4 w-4" />
              一键生成全部
            </>
          )}
        </Button>
      }
    >
      {/* Style & Text Controls */}
      <Card className="p-4 space-y-4">
        {/* Style Selector */}
        <div className="space-y-2">
          <Label className="flex items-center gap-1.5 text-sm font-medium">
            <Palette className="w-4 h-4" />
            选择风格
          </Label>
          <div className="flex flex-wrap gap-2">
            {STYLES.map((style) => (
              <button
                key={style.name}
                onClick={() => setSelectedStyle(style.name)}
                className={cn(
                  "px-3 py-1.5 rounded-full text-xs font-medium transition-all border-2",
                  selectedStyle === style.name
                    ? "border-primary ring-2 ring-primary/20 scale-105"
                    : "border-transparent hover:border-muted-foreground/30"
                )}
              >
                <span className="flex items-center gap-1.5">
                  <span className={cn("w-3 h-3 rounded-full inline-block", style.color)} />
                  {style.name === "随机" && <Shuffle className="w-3 h-3" />}
                  {style.name}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Custom Text */}
        <div className="space-y-3">
          <Label className="flex items-center gap-1.5 text-sm font-medium">
            <Type className="w-4 h-4" />
            自定义文案 <span className="text-muted-foreground font-normal">(留空使用默认文案)</span>
          </Label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">顶部钩子句</Label>
              <Input
                placeholder="如：除夕夜 别人在数红包"
                value={customHook}
                onChange={(e) => setCustomHook(e.target.value)}
                className="text-sm"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">主标题（大字）</Label>
              <Textarea
                placeholder="如：为什么我总赚不到钱？&#10;用换行分隔多行"
                value={customTitle}
                onChange={(e) => setCustomTitle(e.target.value)}
                className="text-sm min-h-[60px]"
                rows={2}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">底部标签</Label>
              <Input
                placeholder="如：马上觉醒"
                value={customBottom}
                onChange={(e) => setCustomBottom(e.target.value)}
                className="text-sm"
              />
            </div>
          </div>
          {hasCustomText && (
            <p className="text-xs text-amber-600 flex items-center gap-1">
              ✨ 自定义文案已启用，所有生成将使用您填写的文字
            </p>
          )}
        </div>
      </Card>

      {generating && (
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>正在生成: {THEMES[currentIndex]?.label}</span>
            <span>{currentIndex}/{THEMES.length}</span>
          </div>
          <Progress value={progress} />
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {THEMES.map((theme) => {
          const result = results[theme.key];
          return (
            <Card key={theme.key} className="overflow-hidden">
              <AspectRatio ratio={3 / 4}>
                {result?.loading ? (
                  <div className="w-full h-full flex items-center justify-center bg-muted">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : result?.imageUrl ? (
                  <img
                    src={result.imageUrl}
                    alt={theme.label}
                    className="w-full h-full object-cover"
                  />
                ) : result?.error ? (
                  <div className="w-full h-full flex items-center justify-center bg-destructive/10 p-3">
                    <p className="text-xs text-destructive text-center">{result.error}</p>
                  </div>
                ) : (
                  <Skeleton className="w-full h-full" />
                )}
              </AspectRatio>
              <div className="p-3 space-y-1">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-sm">{theme.label}</h3>
                  {result?.imageUrl && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => downloadImage(result.imageUrl!, theme.label)}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">{theme.desc}</p>
                {!generating && !result?.loading && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full mt-1"
                    onClick={() => generateSingle(theme.key)}
                  >
                    {result?.imageUrl ? "重新生成" : "单独生成"}
                  </Button>
                )}
              </div>
            </Card>
          );
        })}
      </div>
    </AdminPageLayout>
  );
}
