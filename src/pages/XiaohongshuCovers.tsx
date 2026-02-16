import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Skeleton } from "@/components/ui/skeleton";
import { AdminPageLayout } from "@/components/admin/shared/AdminPageLayout";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Download, ImageIcon, Loader2 } from "lucide-react";

const THEMES = [
  { key: "觉醒", label: "马上觉醒", desc: "骏马觉醒，金光破晓" },
  { key: "发财", label: "马上发财", desc: "踏金币，元宝飞溅" },
  { key: "回血", label: "马上回血", desc: "浴火重生，伤口化光" },
  { key: "看见", label: "马上看见", desc: "山巅俯瞰，洞察全局" },
  { key: "破局", label: "马上破局", desc: "冲破锁链，碎片飞溅" },
  { key: "翻身", label: "马上翻身", desc: "深渊跃天，逆转姿态" },
  { key: "出发", label: "马上出发", desc: "面向日出，红带飘扬" },
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

  const completedCount = Object.values(results).filter((r) => r.imageUrl).length;
  const progress = generating ? ((currentIndex) / THEMES.length) * 100 : (completedCount / THEMES.length) * 100;

  const generateAll = async () => {
    setGenerating(true);
    setResults({});

    for (let i = 0; i < THEMES.length; i++) {
      const theme = THEMES[i];
      setCurrentIndex(i);
      setResults((prev) => ({ ...prev, [theme.key]: { loading: true } }));

      try {
        const { data, error } = await supabase.functions.invoke("generate-xiaohongshu-covers", {
          body: { theme: theme.key },
        });

        if (error) throw error;
        setResults((prev) => ({ ...prev, [theme.key]: { imageUrl: data.imageUrl } }));
        toast.success(`${theme.label} 生成成功`);
      } catch (e: any) {
        const msg = e?.message || "生成失败";
        setResults((prev) => ({ ...prev, [theme.key]: { error: msg } }));
        toast.error(`${theme.label}: ${msg}`);
      }

      // Delay between requests to avoid rate limiting
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
        body: { theme: themeKey },
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
      description="马上系列 · 红金马年配色 · 7张封面一键生成"
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
