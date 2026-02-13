import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Sparkles, BarChart3 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";

interface AIActivityAnalysisProps {
  partnerId: string;
}

export function AIActivityAnalysis({ partnerId }: AIActivityAnalysisProps) {
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleAnalysis = async () => {
    setLoading(true);
    setAnalysis(null);
    try {
      const { data, error } = await supabase.functions.invoke("flywheel-ai-analysis", {
        body: { partner_id: partnerId, mode: "weekly_report" },
      });
      if (error) throw error;
      setAnalysis(data?.analysis || "分析完成，暂无数据。");
    } catch (err: any) {
      toast.error("AI 分析失败: " + (err.message || "未知错误"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-primary" />
          AI 活动分析
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <Button onClick={handleAnalysis} disabled={loading} className="w-full">
          {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Sparkles className="w-4 h-4 mr-2" />}
          生成 AI 周报 & 优化建议
        </Button>
        {analysis && (
          <div className="bg-muted rounded-lg p-4 text-sm prose prose-sm max-w-none dark:prose-invert">
            <ReactMarkdown>{analysis}</ReactMarkdown>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
