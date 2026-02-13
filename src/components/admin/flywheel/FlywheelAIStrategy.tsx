import { useState } from "react";
import { AdminPageLayout } from "../shared/AdminPageLayout";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Brain, FileText, Loader2, Copy } from "lucide-react";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";

interface AnalysisResult {
  analysis: string;
  funnel_stats: Record<string, number>;
  generated_at: string;
}

export default function FlywheelAIStrategy() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [history, setHistory] = useState<AnalysisResult[]>([]);

  const runAnalysis = async (mode: "analysis" | "weekly_report") => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("flywheel-ai-analysis", {
        body: { mode },
      });

      if (error) {
        toast.error("分析失败：" + error.message);
        return;
      }

      if (data?.error) {
        toast.error(data.error);
        return;
      }

      setResult(data);
      setHistory(prev => [data, ...prev]);
      toast.success(mode === "weekly_report" ? "周报已生成" : "分析完成");
    } catch (err) {
      toast.error("请求失败");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("已复制到剪贴板");
  };

  return (
    <AdminPageLayout
      title="AI策略中心"
      description="AI自动分析漏斗数据，给出优化建议和周报"
      actions={
        <div className="flex gap-2">
          <Button size="sm" onClick={() => runAnalysis("analysis")} disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Brain className="h-4 w-4 mr-1" />}
            生成分析
          </Button>
          <Button size="sm" variant="outline" onClick={() => runAnalysis("weekly_report")} disabled={loading}>
            <FileText className="h-4 w-4 mr-1" />
            生成周报
          </Button>
        </div>
      }
    >
      {result && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">
              分析结果
              <span className="text-xs text-muted-foreground ml-2">
                {new Date(result.generated_at).toLocaleString("zh-CN")}
              </span>
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={() => copyToClipboard(result.analysis)}>
              <Copy className="h-4 w-4 mr-1" />复制
            </Button>
          </CardHeader>
          <CardContent>
            <div className="prose prose-sm max-w-none dark:prose-invert">
              <ReactMarkdown>{result.analysis}</ReactMarkdown>
            </div>

            {result.funnel_stats && (
              <div className="mt-4 p-3 bg-muted/50 rounded-lg">
                <p className="text-xs font-medium text-muted-foreground mb-2">数据摘要</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-sm">
                  <div>曝光: {result.funnel_stats.impressions}</div>
                  <div>测评完成: {result.funnel_stats.complete_test}</div>
                  <div>成交: {result.funnel_stats.payment}</div>
                  <div>收入: ¥{result.funnel_stats.total_revenue?.toLocaleString()}</div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {!result && !loading && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <Brain className="h-12 w-12 mb-4 opacity-30" />
            <p>点击"生成分析"按钮，AI将读取近7天数据并自动诊断</p>
          </CardContent>
        </Card>
      )}

      {loading && (
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary mr-3" />
            <span className="text-muted-foreground">AI正在分析数据，请稍候...</span>
          </CardContent>
        </Card>
      )}

      {history.length > 1 && (
        <Card>
          <CardHeader><CardTitle className="text-sm">历史分析记录</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {history.slice(1).map((h, i) => (
              <div key={i} className="p-2 border rounded text-sm cursor-pointer hover:bg-muted/50" onClick={() => setResult(h)}>
                <span className="text-muted-foreground">{new Date(h.generated_at).toLocaleString("zh-CN")}</span>
                <span className="ml-2">{h.analysis.substring(0, 60)}...</span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </AdminPageLayout>
  );
}
