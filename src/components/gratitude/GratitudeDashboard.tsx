import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { BarChart3, Sparkles, Calendar, Loader2, TrendingUp, Star, Rocket, Target, Lightbulb } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ThemeRadarChart } from "./ThemeRadarChart";
import { GratitudeThemeBadge, THEME_DEFINITIONS, getThemeById } from "./GratitudeThemeBadge";
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

// Parse AI content into sections
const parseAnalysisContent = (content: string) => {
  const sections: Record<string, string> = {
    overview: "",
    composition: "",
    trends: "",
    strengths: "",
    nextSteps: "",
  };

  const sectionPatterns = [
    { key: "overview", pattern: /##\s*1\.\s*幸福总览[\s\S]*?(?=##\s*2\.|$)/i },
    { key: "composition", pattern: /##\s*2\.\s*幸福构成[\s\S]*?(?=##\s*3\.|$)/i },
    { key: "trends", pattern: /##\s*3\.\s*幸福趋势[\s\S]*?(?=##\s*4\.|$)/i },
    { key: "strengths", pattern: /##\s*4\.\s*幸福亮点[\s\S]*?(?=##\s*5\.|$)/i },
    { key: "nextSteps", pattern: /##\s*5\.\s*幸福下一步[\s\S]*/i },
  ];

  sectionPatterns.forEach(({ key, pattern }) => {
    const match = content.match(pattern);
    if (match) {
      sections[key] = match[0].replace(/^##\s*\d+\.\s*[^\n]+\n/, "").trim();
    }
  });

  return sections;
};

// Calculate percentages from theme stats
const calculatePercentages = (themeStats: Record<string, number>) => {
  const total = Object.values(themeStats).reduce((sum, count) => sum + count, 0);
  if (total === 0) return {};
  
  return Object.fromEntries(
    Object.entries(themeStats).map(([key, count]) => [
      key,
      Math.round((count / total) * 100)
    ])
  );
};

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
    daily: "今日幸福",
    weekly: "本周幸福报告",
    monthly: "本月幸福趋势",
  };

  const sections = dashboardData ? parseAnalysisContent(dashboardData.analysisContent) : null;
  const percentages = dashboardData ? calculatePercentages(dashboardData.themeStats) : {};

  return (
    <div className="space-y-4">
      {/* Report Type Selection */}
      <Card className="bg-gradient-to-br from-teal-50/80 via-cyan-50/60 to-blue-50/80 dark:from-teal-950/30 dark:via-cyan-950/20 dark:to-blue-950/30 backdrop-blur border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <BarChart3 className="w-5 h-5 text-teal-600" />
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
            className="w-full bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600"
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
      {dashboardData && sections && (
        <>
          {/* 1. 幸福总览 */}
          <Card className="bg-gradient-to-br from-teal-50/80 to-cyan-50/80 dark:from-teal-950/30 dark:to-cyan-950/30 backdrop-blur border-border/50 overflow-hidden">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <Target className="w-5 h-5 text-teal-600" />
                  幸福总览
                </CardTitle>
                <span className="text-xs text-muted-foreground bg-background/50 px-2 py-1 rounded-full">
                  {dashboardData.startDate} 至 {dashboardData.endDate}
                </span>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4 p-4 bg-white/60 dark:bg-black/20 rounded-xl mb-3">
                <div className="text-center px-4 border-r border-border/30">
                  <div className="text-3xl font-bold text-teal-600">{dashboardData.totalEntries}</div>
                  <div className="text-xs text-muted-foreground">条感恩</div>
                </div>
                <div className="flex-1">
                  <div className="text-xs text-muted-foreground mb-2">幸福主要来源</div>
                  <div className="flex flex-wrap gap-1.5">
                    {Object.entries(dashboardData.themeStats)
                      .filter(([_, count]) => count > 0)
                      .sort((a, b) => b[1] - a[1])
                      .slice(0, 3)
                      .map(([themeId]) => (
                        <GratitudeThemeBadge
                          key={themeId}
                          themeId={themeId}
                          size="sm"
                        />
                      ))}
                  </div>
                </div>
              </div>
              {sections.overview && (
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  <ReactMarkdown
                    components={{
                      p: ({ children }) => <p className="text-sm text-muted-foreground mb-2">{children}</p>,
                      ul: ({ children }) => <ul className="text-sm space-y-1 list-disc pl-4">{children}</ul>,
                      li: ({ children }) => <li className="text-muted-foreground">{children}</li>,
                    }}
                  >
                    {sections.overview}
                  </ReactMarkdown>
                </div>
              )}
            </CardContent>
          </Card>

          {/* 2. 幸福构成 - 雷达图 + 百分比 */}
          <Card className="bg-gradient-to-br from-blue-50/80 to-indigo-50/80 dark:from-blue-950/30 dark:to-indigo-950/30 backdrop-blur border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-blue-600" />
                幸福构成（七维占比）
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4">
                {/* Radar Chart */}
                <div className="bg-white/60 dark:bg-black/20 rounded-xl p-2">
                  <ThemeRadarChart themeStats={dashboardData.themeStats} />
                </div>
                
                {/* Percentage List */}
                <div className="space-y-2">
                  {THEME_DEFINITIONS.map(theme => {
                    const percentage = percentages[theme.id] || 0;
                    const count = dashboardData.themeStats[theme.id] || 0;
                    return (
                      <div key={theme.id} className="flex items-center gap-2 p-2 bg-white/60 dark:bg-black/20 rounded-lg">
                        <span className="text-lg">{theme.emoji}</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-medium truncate">{theme.name}</span>
                            <span className="text-xs text-muted-foreground">{percentage}%</span>
                          </div>
                          <div className="h-1.5 bg-muted/30 rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all duration-500"
                              style={{
                                width: `${percentage}%`,
                                backgroundColor: theme.color,
                              }}
                            />
                          </div>
                        </div>
                        <span className="text-xs text-muted-foreground w-8 text-right">{count}条</span>
                      </div>
                    );
                  })}
                </div>
              </div>
              
              {sections.composition && (
                <div className="mt-4 p-3 bg-white/40 dark:bg-black/10 rounded-lg">
                  <ReactMarkdown
                    components={{
                      p: ({ children }) => <p className="text-sm text-muted-foreground">{children}</p>,
                      blockquote: ({ children }) => (
                        <blockquote className="border-l-2 border-blue-400 pl-3 italic text-sm text-muted-foreground">
                          {children}
                        </blockquote>
                      ),
                    }}
                  >
                    {sections.composition}
                  </ReactMarkdown>
                </div>
              )}
            </CardContent>
          </Card>

          {/* 3. 幸福趋势 */}
          <Card className="bg-gradient-to-br from-emerald-50/80 to-teal-50/80 dark:from-emerald-950/30 dark:to-teal-950/30 backdrop-blur border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-emerald-600" />
                幸福趋势
              </CardTitle>
            </CardHeader>
            <CardContent>
              {sections.trends ? (
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  <ReactMarkdown
                    components={{
                      p: ({ children }) => <p className="text-sm text-muted-foreground mb-2">{children}</p>,
                      ul: ({ children }) => <ul className="text-sm space-y-2 list-none pl-0">{children}</ul>,
                      li: ({ children }) => (
                        <li className="text-muted-foreground bg-white/50 dark:bg-black/20 p-2 rounded-lg">
                          {children}
                        </li>
                      ),
                    }}
                  >
                    {sections.trends}
                  </ReactMarkdown>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">暂无趋势分析</p>
              )}
            </CardContent>
          </Card>

          {/* 4. 幸福亮点 */}
          <Card className="bg-gradient-to-br from-amber-50/80 to-orange-50/80 dark:from-amber-950/30 dark:to-orange-950/30 backdrop-blur border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Star className="w-5 h-5 text-amber-600" />
                幸福亮点（你的超能力）
              </CardTitle>
            </CardHeader>
            <CardContent>
              {sections.strengths ? (
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  <ReactMarkdown
                    components={{
                      p: ({ children }) => <p className="text-sm text-muted-foreground mb-2">{children}</p>,
                      ul: ({ children }) => <ul className="text-sm space-y-2 list-none pl-0">{children}</ul>,
                      li: ({ children }) => (
                        <li className="text-muted-foreground bg-white/50 dark:bg-black/20 p-3 rounded-lg border-l-3 border-amber-400">
                          <span className="text-amber-600 mr-2">✨</span>
                          {children}
                        </li>
                      ),
                    }}
                  >
                    {sections.strengths}
                  </ReactMarkdown>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">暂无亮点分析</p>
              )}
            </CardContent>
          </Card>

          {/* 5. 幸福下一步 */}
          <Card className="bg-gradient-to-br from-rose-50/80 to-pink-50/80 dark:from-rose-950/30 dark:to-pink-950/30 backdrop-blur border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Rocket className="w-5 h-5 text-rose-600" />
                幸福下一步
              </CardTitle>
            </CardHeader>
            <CardContent>
              {sections.nextSteps ? (
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  <ReactMarkdown
                    components={{
                      p: ({ children }) => <p className="text-sm text-muted-foreground mb-2">{children}</p>,
                      ul: ({ children }) => <ul className="text-sm space-y-2 list-none pl-0">{children}</ul>,
                      li: ({ children }) => (
                        <li className="text-muted-foreground bg-white/50 dark:bg-black/20 p-3 rounded-lg flex items-start gap-2">
                          <Lightbulb className="w-4 h-4 text-rose-500 mt-0.5 shrink-0" />
                          <span>{children}</span>
                        </li>
                      ),
                    }}
                  >
                    {sections.nextSteps}
                  </ReactMarkdown>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">暂无行动建议</p>
              )}
            </CardContent>
          </Card>

          {/* Highlights */}
          {dashboardData.highlights.length > 0 && (
            <Card className="bg-card/60 backdrop-blur border-border/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-primary" />
                  TOP {dashboardData.highlights.length} 感恩时刻
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[300px]">
                  <div className="space-y-2 pr-4">
                    {dashboardData.highlights.map((item, index) => (
                      <div
                        key={item.id}
                        className="p-3 rounded-lg bg-background/50 border border-border/30"
                      >
                        <div className="flex items-start gap-2">
                          <span className="text-lg font-medium text-primary">{index + 1}.</span>
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
                </ScrollArea>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
};
