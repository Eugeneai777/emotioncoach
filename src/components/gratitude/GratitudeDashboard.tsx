import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { BarChart3, Sparkles, Calendar, Loader2, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ThemeRadarChart } from "./ThemeRadarChart";
import { GratitudeThemeBadge } from "./GratitudeThemeBadge";
import ReactMarkdown from "react-markdown";

interface DashboardData {
  reportId?: string;
  reportType: string;
  startDate: string;
  endDate: string;
  totalEntries: number;
  themeStats: Record<string, number>;
  analysisContent: string;
  highlights: Array<{
    id: string;
    content: string;
    themes: string[];
    date: string;
  }>;
}

export const GratitudeDashboard = () => {
  const [loading, setLoading] = useState(false);
  const [reportType, setReportType] = useState<"daily" | "weekly" | "monthly">("weekly");
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const { toast } = useToast();

  const generateReport = async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast({ title: "请先登录", variant: "destructive" });
        return;
      }

      const { data, error } = await supabase.functions.invoke("generate-gratitude-dashboard", {
        body: { reportType },
      });

      if (error) {
        console.error("Dashboard generation error:", error);
        toast({ title: "生成失败", description: error.message, variant: "destructive" });
        return;
      }

      if (data.error) {
        toast({ title: data.message || data.error, variant: "destructive" });
        return;
      }

      setDashboardData(data);
      toast({ title: "幸福仪表盘生成成功！" });
    } catch (error) {
      console.error("Error generating dashboard:", error);
      toast({ title: "生成失败", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const reportLabels = {
    daily: "今日感恩",
    weekly: "本周幸福报告",
    monthly: "本月人生趋势",
  };

  return (
    <div className="space-y-4">
      {/* Report Type Selection */}
      <Card className="bg-card/60 backdrop-blur border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <BarChart3 className="w-5 h-5 text-primary" />
            幸福仪表盘
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Tabs value={reportType} onValueChange={(v) => setReportType(v as typeof reportType)}>
            <TabsList className="grid grid-cols-3 w-full">
              <TabsTrigger value="daily" className="text-xs">
                📝 今日
              </TabsTrigger>
              <TabsTrigger value="weekly" className="text-xs">
                📊 本周
              </TabsTrigger>
              <TabsTrigger value="monthly" className="text-xs">
                📈 本月
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <Button
            onClick={generateReport}
            disabled={loading}
            className="w-full"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                AI 分析中...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                生成 {reportLabels[reportType]}
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Dashboard Results */}
      {dashboardData && (
        <>
          {/* Overview Card */}
          <Card className="bg-card/60 backdrop-blur border-border/50">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  {reportLabels[dashboardData.reportType as keyof typeof reportLabels]}
                </CardTitle>
                <span className="text-xs text-muted-foreground">
                  {dashboardData.startDate} 至 {dashboardData.endDate}
                </span>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4 p-3 bg-primary/5 rounded-lg">
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">{dashboardData.totalEntries}</div>
                  <div className="text-xs text-muted-foreground">条感恩</div>
                </div>
                <div className="flex-1 flex flex-wrap gap-1">
                  {Object.entries(dashboardData.themeStats)
                    .filter(([_, count]) => count > 0)
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 4)
                    .map(([themeId, count]) => (
                      <GratitudeThemeBadge
                        key={themeId}
                        themeId={themeId}
                        size="sm"
                        showLabel={false}
                      />
                    ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Radar Chart */}
          <Card className="bg-card/60 backdrop-blur border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">🎯 七维度占比</CardTitle>
            </CardHeader>
            <CardContent>
              <ThemeRadarChart themeStats={dashboardData.themeStats} />
            </CardContent>
          </Card>

          {/* AI Analysis */}
          <Card className="bg-card/60 backdrop-blur border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-500" />
                AI 洞察分析
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px] pr-4">
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  <ReactMarkdown
                    components={{
                      h2: ({ children }) => (
                        <h2 className="text-base font-semibold text-foreground mt-4 mb-2 first:mt-0">
                          {children}
                        </h2>
                      ),
                      p: ({ children }) => (
                        <p className="text-sm text-muted-foreground mb-2">{children}</p>
                      ),
                      ul: ({ children }) => (
                        <ul className="text-sm space-y-1 list-disc pl-4 mb-3">{children}</ul>
                      ),
                      li: ({ children }) => (
                        <li className="text-muted-foreground">{children}</li>
                      ),
                    }}
                  >
                    {dashboardData.analysisContent}
                  </ReactMarkdown>
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Highlights */}
          {dashboardData.highlights.length > 0 && (
            <Card className="bg-card/60 backdrop-blur border-border/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">⭐ TOP {dashboardData.highlights.length} 感恩时刻</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {dashboardData.highlights.map((item, index) => (
                    <div
                      key={item.id}
                      className="p-3 rounded-lg bg-background/50 border border-border/30"
                    >
                      <div className="flex items-start gap-2">
                        <span className="text-lg">{index + 1}.</span>
                        <div className="flex-1">
                          <p className="text-sm">{item.content}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <span className="text-xs text-muted-foreground">
                              {new Date(item.date).toLocaleDateString("zh-CN")}
                            </span>
                            <div className="flex gap-1">
                              {item.themes?.map(themeId => (
                                <GratitudeThemeBadge
                                  key={themeId}
                                  themeId={themeId}
                                  size="sm"
                                  showLabel={false}
                                />
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
};
