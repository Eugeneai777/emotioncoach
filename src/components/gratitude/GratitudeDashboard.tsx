import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { BarChart3, Sparkles, Calendar, Loader2, Star, Rocket, Target, Tag, AlertCircle, ArrowUp, Lightbulb, Brain, CheckCircle2, ArrowRight, Link } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ThemeRadarChart } from "./ThemeRadarChart";
import { GratitudeThemeBadge, THEME_DEFINITIONS, getThemeById } from "./GratitudeThemeBadge";
import { GratitudeTagDistribution } from "./GratitudeTagDistribution";
import ReactMarkdown from "react-markdown";
import { useSmartNotification } from "@/hooks/useSmartNotification";
import { GratitudeReportPaywall } from "@/components/conversion/GratitudeReportPaywall";

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

interface GratitudeDashboardProps {
  themeStats: Record<string, number>;
  onTagClick?: (themeId: string) => void;
  selectedTag?: string | null;
  isLoggedIn?: boolean;
}

// Parse AI content into sections with enhanced trend parsing
const parseAnalysisContent = (content: string) => {
  const sections: Record<string, string> = {
    overview: "",
    composition: "",
    trends: "",
    trendsUp: "",
    trendsDown: "",
    trendsPattern: "",
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

  // Parse trends subsections
  if (sections.trends) {
    const upMatch = sections.trends.match(/###\s*📈\s*上升维度[\s\S]*?(?=###|$)/i);
    const downMatch = sections.trends.match(/###\s*⚠️\s*需要关注的维度[\s\S]*?(?=###|$)/i);
    const patternMatch = sections.trends.match(/###\s*🔗\s*幸福组合洞察[\s\S]*/i);
    
    if (upMatch) sections.trendsUp = upMatch[0].replace(/^###[^\n]+\n/, "").trim();
    if (downMatch) sections.trendsDown = downMatch[0].replace(/^###[^\n]+\n/, "").trim();
    if (patternMatch) sections.trendsPattern = patternMatch[0].replace(/^###[^\n]+\n/, "").trim();
  }

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

// Get lowest dimensions for focus area
const getLowestDimensions = (themeStats: Record<string, number>, count: number = 2) => {
  const sorted = Object.entries(themeStats)
    .filter(([_, value]) => true) // Include all, even 0
    .sort((a, b) => a[1] - b[1]);
  return sorted.slice(0, count).map(([id, value]) => ({ id, count: value }));
};

export const GratitudeDashboard = ({ themeStats, onTagClick, selectedTag, isLoggedIn = true }: GratitudeDashboardProps) => {
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"distribution" | "report">("distribution");
  const [reportType, setReportType] = useState<"daily" | "weekly" | "monthly">("weekly");
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [showPaywall, setShowPaywall] = useState(false);
  const { toast } = useToast();
  const { triggerNotification } = useSmartNotification('gratitude_coach');

  // Calculate theme stats list with percentages and indicators
  const themeStatsList = useMemo(() => {
    const stats = dashboardData?.themeStats || themeStats;
    const total = Object.values(stats).reduce((sum, c) => sum + c, 0);
    const counts = Object.values(stats);
    const maxCount = Math.max(...counts);
    const minCount = Math.min(...counts);
    
    return THEME_DEFINITIONS.map(theme => ({
      ...theme,
      count: stats[theme.id] || 0,
      percentage: total > 0 ? ((stats[theme.id] || 0) / total * 100) : 0,
      isMax: (stats[theme.id] || 0) === maxCount && maxCount > 0,
      isMin: (stats[theme.id] || 0) === minCount && total > 0
    })).sort((a, b) => b.count - a.count);
  }, [dashboardData?.themeStats, themeStats]);

  // Check if user has subscription
  const checkSubscription = async (): Promise<boolean> => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return false;

      const { data } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', session.user.id)
        .eq('status', 'active')
        .gte('end_date', new Date().toISOString().split('T')[0])
        .maybeSingle();

      return !!data;
    } catch (error) {
      console.error('Error checking subscription:', error);
      return false;
    }
  };

  const generateReport = async () => {
    // Check subscription first
    const hasSubscription = await checkSubscription();
    
    if (!hasSubscription) {
      // Show paywall
      setShowPaywall(true);
      return;
    }

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
      toast({ title: "幸福报告生成成功！" });

      // 触发智能通知
      const highlightDimension = Object.entries(data.themeStats || {})
        .sort((a, b) => (b[1] as number) - (a[1] as number))[0]?.[0] || '';
      const dimensionsCount = Object.values(data.themeStats || {}).filter((c: any) => c > 0).length;
      
      triggerNotification('after_gratitude_analysis', {
        report_type: reportType,
        dimensions_count: dimensionsCount,
        highlight_dimension: highlightDimension,
      });
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
      {/* Main Dashboard Card with Tabs */}
      <Card className="bg-gradient-to-br from-pink-50/80 via-rose-50/60 to-amber-50/80 dark:from-pink-950/30 dark:via-rose-950/20 dark:to-amber-950/30 backdrop-blur border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <BarChart3 className="w-5 h-5 text-pink-600" />
            幸福仪表盘
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Main Tabs: Distribution vs Report */}
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
            <TabsList className="grid grid-cols-2 w-full">
              <TabsTrigger value="distribution" className="text-xs gap-1.5">
                <Tag className="w-3.5 h-3.5" />
                标签分布
              </TabsTrigger>
              <TabsTrigger value="report" className="text-xs gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                幸福报告
              </TabsTrigger>
            </TabsList>

            {/* Distribution Tab Content */}
            <TabsContent value="distribution" className="mt-4">
              <GratitudeTagDistribution
                themeStats={themeStats}
                onTagClick={onTagClick}
                selectedTag={selectedTag}
              />
            </TabsContent>

            {/* Report Tab Content */}
            <TabsContent value="report" className="mt-4 space-y-4">
              {/* Time Range Selection */}
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
                className="w-full bg-gradient-to-r from-pink-400 to-rose-500 hover:from-pink-500 hover:to-rose-600"
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
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Dashboard Results */}
      {dashboardData && sections && (
        <div className="space-y-5 animate-fade-in">
          {/* 1. 幸福总览 */}
          <Card className="bg-gradient-to-br from-pink-50/80 to-rose-50/80 dark:from-pink-950/30 dark:to-rose-950/30 backdrop-blur border-border/50 overflow-hidden">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <Target className="w-5 h-5 text-pink-600" />
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
                  <div className="text-3xl font-bold text-pink-600">{dashboardData.totalEntries}</div>
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

          {/* 2. 幸福构成 - 雷达图 + 七维统计 + 一句话总结 */}
          <Card className="bg-gradient-to-br from-blue-50/80 to-indigo-50/80 dark:from-blue-950/30 dark:to-indigo-950/30 backdrop-blur border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-blue-600" />
                幸福构成
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Radar Chart - 居中显示 */}
              <div className="bg-white/60 dark:bg-black/20 rounded-xl p-2 max-w-md mx-auto">
                <ThemeRadarChart themeStats={dashboardData.themeStats} />
              </div>

              {/* 七维幸福占比 - 详细统计列表 */}
              <div className="bg-white/60 dark:bg-black/20 rounded-xl p-4">
                <h4 className="text-sm font-medium text-blue-700 dark:text-blue-300 mb-3 flex items-center gap-2">
                  <BarChart3 className="w-4 h-4" />
                  七维幸福占比
                </h4>
                <div className="space-y-2.5">
                  {themeStatsList.map(theme => {
                    const maxPercentage = Math.max(...themeStatsList.map(t => t.percentage));
                    const barWidth = maxPercentage > 0 ? (theme.percentage / maxPercentage) * 100 : 0;
                    
                    return (
                      <div key={theme.id} className="flex items-center gap-2">
                        {/* Emoji + Name */}
                        <div className="w-20 flex items-center gap-1.5 shrink-0">
                          <span className="text-base">{theme.emoji}</span>
                          <span className="text-xs font-medium text-foreground/80 truncate">{theme.name.replace('幸福', '')}</span>
                        </div>
                        
                        {/* Progress Bar */}
                        <div className="flex-1 h-2.5 bg-muted/40 rounded-full overflow-hidden">
                          <div 
                            className="h-full rounded-full transition-all duration-500"
                            style={{ 
                              width: `${barWidth}%`,
                              backgroundColor: theme.color 
                            }}
                          />
                        </div>
                        
                        {/* Count */}
                        <span className="w-8 text-right text-xs font-semibold text-foreground">
                          {theme.count}次
                        </span>
                        
                        {/* Percentage */}
                        <span className="w-12 text-right text-xs text-muted-foreground">
                          ({theme.percentage.toFixed(1)}%)
                        </span>
                        
                        {/* Indicator */}
                        <div className="w-6">
                          {theme.isMax && theme.count > 0 && (
                            <span className="text-xs bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 px-1 py-0.5 rounded">🔝</span>
                          )}
                          {theme.isMin && theme.count === 0 && (
                            <span className="text-xs bg-orange-50 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 px-1 py-0.5 rounded">⚠️</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
              
              {/* 一句话总结 */}
              {sections.composition && (
                <div className="p-4 bg-gradient-to-r from-blue-100/60 to-indigo-100/60 dark:from-blue-900/30 dark:to-indigo-900/30 rounded-xl border border-blue-200/50 dark:border-blue-700/30">
                  <p className="text-sm text-blue-800 dark:text-blue-200 text-center font-medium">
                    💬 {sections.composition.replace(/^["「]|["」]$/g, '').trim()}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* 3. 上升维度 */}
          <div className="rounded-lg bg-gradient-to-br from-pink-50/80 to-rose-50/80 dark:from-pink-950/30 dark:to-rose-950/30 p-4">
            <h4 className="text-sm font-medium flex items-center gap-2 mb-3 text-pink-700 dark:text-pink-400">
              <ArrowUp className="w-4 h-4" />
              上升维度
            </h4>
            {sections.trendsUp ? (
              <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                {sections.trendsUp.replace(/\*\*/g, '').replace(/^[-•]\s*/gm, '').trim()}
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">暂无数据</p>
            )}
          </div>

          {/* 💡 需要关注的维度 */}
          {sections.trendsDown && (
            <div className="rounded-lg bg-gradient-to-br from-amber-50/90 to-orange-50/90 dark:from-amber-950/40 dark:to-orange-950/40 p-4 border border-amber-200/50 dark:border-amber-800/50">
              <h4 className="text-sm font-medium flex items-center gap-2 mb-3 text-amber-700 dark:text-amber-400">
                <AlertCircle className="w-4 h-4" />
                需要关注
              </h4>
              <p className="text-sm text-amber-900/80 dark:text-amber-100/80 leading-relaxed whitespace-pre-line">
                {sections.trendsDown.replace(/\*\*/g, '').replace(/^[-•]\s*/gm, '').trim()}
              </p>
            </div>
          )}

          {/* 4. 幸福组合洞察 */}
          <div className="rounded-lg bg-gradient-to-br from-violet-50/90 to-purple-50/90 dark:from-violet-950/40 dark:to-purple-950/40 p-4 border border-violet-200/50 dark:border-violet-800/50">
            <h4 className="text-sm font-medium flex items-center gap-2 mb-3 text-violet-700 dark:text-violet-400">
              <Link className="w-4 h-4" />
              幸福组合洞察
            </h4>
            
            {/* 为什么重要 - 精简版 */}
            <div className="p-3 bg-violet-100/60 dark:bg-violet-900/30 rounded-md mb-3">
              <p className="text-sm text-violet-700/80 dark:text-violet-300/80 leading-relaxed">
                💡 当一个场景触发多种幸福，幸福感会<strong className="text-violet-800 dark:text-violet-200">成倍增长</strong>——这是「幸福复利」
              </p>
            </div>

            {sections.trendsPattern ? (
              <div className="space-y-3">
                {(() => {
                  const patternContent = sections.trendsPattern;
                  const targetMatch = patternContent.match(/\*\*🎯[^*]*\*\*[\s\S]*?(?=\*\*🧠|$)/i);
                  const brainMatch = patternContent.match(/\*\*🧠[^*]*\*\*[\s\S]*?(?=\*\*✅|$)/i);
                  const actionMatch = patternContent.match(/\*\*✅[^*]*\*\*[\s\S]*/i);
                  
                  return (
                    <>
                      {targetMatch && (
                        <div className="p-3 bg-white/60 dark:bg-black/20 rounded-md">
                          <div className="flex items-center gap-2 mb-2">
                            <Target className="w-4 h-4 text-violet-500" />
                            <span className="text-sm font-medium text-violet-700 dark:text-violet-300">组合模式</span>
                          </div>
                          <p className="text-sm text-muted-foreground leading-relaxed">
                            {targetMatch[0].replace(/\*\*🎯[^*]*\*\*\s*/i, "").replace(/\*\*/g, '').trim()}
                          </p>
                        </div>
                      )}

                      {brainMatch && (
                        <div className="p-3 bg-blue-50/60 dark:bg-blue-950/20 rounded-md">
                          <div className="flex items-center gap-2 mb-2">
                            <Brain className="w-4 h-4 text-blue-500" />
                            <span className="text-sm font-medium text-blue-700 dark:text-blue-300">这说明</span>
                          </div>
                          <p className="text-sm text-blue-800/80 dark:text-blue-200/80 leading-relaxed">
                            {brainMatch[0].replace(/\*\*🧠[^*]*\*\*\s*/i, "").replace(/\*\*/g, '').trim()}
                          </p>
                        </div>
                      )}

                      {actionMatch && (
                        <div className="p-3 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/40 dark:to-teal-950/40 rounded-md border border-emerald-200/60 dark:border-emerald-700/40">
                          <div className="flex items-center gap-2 mb-2">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                            <span className="text-sm font-medium text-emerald-700 dark:text-emerald-300">行动建议</span>
                          </div>
                          <p className="text-sm text-emerald-800 dark:text-emerald-200 leading-relaxed">
                            {actionMatch[0].replace(/\*\*✅[^*]*\*\*\s*/i, "").replace(/\*\*/g, '').trim()}
                          </p>
                        </div>
                      )}
                    </>
                  );
                })()}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-3">生成报告后可查看</p>
            )}
          </div>

          {/* 5. 幸福亮点 */}
          <Card className="bg-gradient-to-br from-rose-50/80 via-pink-50/60 to-amber-50/80 dark:from-rose-950/30 dark:via-pink-950/20 dark:to-amber-950/30 backdrop-blur border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Star className="w-5 h-5 text-rose-500" />
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
                        <li className="text-muted-foreground bg-gradient-to-r from-white/70 to-rose-50/50 dark:from-black/20 dark:to-rose-950/20 p-3 rounded-xl border-l-3 border-rose-400 shadow-sm">
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

          {/* 6. 幸福下一步 */}
          <Card className="bg-gradient-to-br from-cyan-50/80 to-blue-50/80 dark:from-cyan-950/30 dark:to-blue-950/30 backdrop-blur border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Rocket className="w-5 h-5 text-cyan-600" />
                幸福下一步
              </CardTitle>
            </CardHeader>
            <CardContent>
              {sections.nextSteps ? (
                <div className="space-y-2">
                  <ReactMarkdown
                    components={{
                      p: ({ children }) => <p className="text-sm text-muted-foreground mb-2">{children}</p>,
                      ul: ({ children }) => <div className="space-y-2">{children}</div>,
                      li: ({ children }) => {
                        const text = String(children);
                        let bgClass = "bg-white/50 dark:bg-black/20";
                        
                        if (text.includes("继续") || text.includes("✅")) {
                          bgClass = "bg-emerald-50/80 dark:bg-emerald-950/30 border-l-3 border-emerald-400";
                        } else if (text.includes("加强") || text.includes("📈")) {
                          bgClass = "bg-blue-50/80 dark:bg-blue-950/30 border-l-3 border-blue-400";
                        } else if (text.includes("实验") || text.includes("🧪")) {
                          bgClass = "bg-violet-50/80 dark:bg-violet-950/30 border-l-3 border-violet-400";
                        } else if (text.includes("盲区") || text.includes("🔍")) {
                          bgClass = "bg-amber-50/80 dark:bg-amber-950/30 border-l-3 border-amber-400";
                        }
                        
                        return (
                          <div className={`p-3 rounded-xl ${bgClass}`}>
                            <span className="text-sm text-muted-foreground">{children}</span>
                          </div>
                        );
                      },
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
        </div>
      )}

      {/* Report Paywall */}
      <GratitudeReportPaywall
        open={showPaywall}
        onClose={() => setShowPaywall(false)}
      />
    </div>
  );
};
