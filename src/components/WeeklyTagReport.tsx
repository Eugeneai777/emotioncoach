import { useState, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, Download, Loader2, Calendar, TrendingUp, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import TagSentimentBadge from "./TagSentimentBadge";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

interface WeeklyReportData {
  period: { startDate: string; endDate: string };
  userName: string;
  tagSummaries: Array<{
    name: string;
    color: string;
    sentiment: string;
    count: number;
    avgIntensity: number | null;
    topThemes: string[];
  }>;
  dailyIntensities: Array<{
    date: string;
    avgIntensity: number;
    count: number;
  }>;
  insights: {
    summary: string;
    highlights: string[];
    concerns: string[];
    recommendations: Array<{
      title: string;
      description: string;
    }>;
    outlook: string;
  };
  totalRecords: number;
}

interface WeeklyTagReportProps {
  startDate?: Date;
  endDate?: Date;
}

const WeeklyTagReport = ({ startDate, endDate }: WeeklyTagReportProps): JSX.Element => {
  const [reportData, setReportData] = useState<WeeklyReportData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);

  const loadReportData = async () => {
    try {
      setIsLoading(true);

      // 默认本周
      const end = endDate || new Date();
      const start = startDate || new Date(end.getTime() - 7 * 24 * 60 * 60 * 1000);

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('未登录');

      const { data, error } = await supabase.functions.invoke('generate-tag-report', {
        headers: {
          Authorization: `Bearer ${session.access_token}`
        },
        body: {
          startDate: start.toISOString(),
          endDate: end.toISOString(),
        }
      });

      if (error) throw error;

      setReportData(data);

      toast.success('报告生成成功', {
        description: '查看你本周的情绪分析报告',
      });
    } catch (error: any) {
      console.error('Error loading report:', error);
      toast.error('生成报告失败', {
        description: error.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const generatePDF = async () => {
    if (!reportRef.current || !reportData) return;

    try {
      setIsGeneratingPDF(true);

      // 使用html2canvas截图
      const canvas = await html2canvas(reportRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      
      const fileName = `情绪报告_${reportData.period.startDate}_${reportData.period.endDate}.pdf`;
      
      // 尝试使用系统分享 API（移动端）
      const pdfBlob = pdf.output('blob');
      const file = new File([pdfBlob], fileName, { type: 'application/pdf' });
      
      if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        try {
          await navigator.share({
            files: [file],
            title: '情绪周报',
            text: `${reportData.period.startDate} 至 ${reportData.period.endDate} 情绪报告`,
          });
          toast.success('分享成功');
          return;
        } catch {
          // 系统分享取消，降级到下载
        }
      }
      
      // 降级：直接下载
      pdf.save(fileName);
      toast.success('PDF已下载', {
        description: '报告已保存到本地',
      });
    } catch (error: any) {
      console.error('Error generating PDF:', error);
      toast.error('生成PDF失败', {
        description: error.message,
      });
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  if (!reportData) {
    return (
      <Card className="p-6 text-center">
        <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
        <h3 className="text-base font-semibold mb-2">生成周报告</h3>
        <p className="text-sm text-muted-foreground mb-4">
          查看你本周的情绪数据分析和AI洞察
        </p>
        <Button onClick={loadReportData} disabled={isLoading} className="gap-2">
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              生成中...
            </>
          ) : (
            <>
              <FileText className="w-4 h-4" />
              生成本周报告
            </>
          )}
        </Button>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* 操作栏 */}
      <div className="flex items-center justify-between">
        <h3 className="text-base md:text-lg font-semibold text-foreground flex items-center gap-2">
          <FileText className="w-5 h-5" />
          周情绪报告
        </h3>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={loadReportData} disabled={isLoading}>
            刷新
          </Button>
          <Button size="sm" onClick={generatePDF} disabled={isGeneratingPDF} className="gap-2">
            {isGeneratingPDF ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                生成中...
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                导出PDF
              </>
            )}
          </Button>
        </div>
      </div>

      {/* 报告内容 */}
      <div ref={reportRef} className="space-y-4 bg-white dark:bg-gray-900 p-6 rounded-lg">
        {/* 报告头部 */}
        <div className="text-center border-b pb-4">
          <h1 className="text-2xl font-bold text-foreground mb-2">
            情绪管理周报告
          </h1>
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Calendar className="w-4 h-4" />
            <span>
              {new Date(reportData.period.startDate).toLocaleDateString('zh-CN')} - {new Date(reportData.period.endDate).toLocaleDateString('zh-CN')}
            </span>
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            {reportData.userName} 的情绪数据分析
          </p>
        </div>

        {/* 总体概况 */}
        <Card className="p-4">
          <h3 className="font-semibold mb-3">📊 总体概况</h3>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{reportData.totalRecords}</div>
              <div className="text-xs text-muted-foreground">记录次数</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{reportData.tagSummaries.length}</div>
              <div className="text-xs text-muted-foreground">使用标签</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {reportData.dailyIntensities.length > 0
                  ? (reportData.dailyIntensities.reduce((sum, d) => sum + d.avgIntensity, 0) / reportData.dailyIntensities.length).toFixed(1)
                  : '0'}
              </div>
              <div className="text-xs text-muted-foreground">平均强度</div>
            </div>
          </div>
        </Card>

        {/* AI总结 */}
        <Card className="p-4 bg-blue-50 dark:bg-blue-950">
          <h3 className="font-semibold mb-2">🤖 AI洞察</h3>
          <p className="text-sm text-foreground mb-3">{reportData.insights.summary}</p>
        </Card>

        {/* 亮点 */}
        {reportData.insights.highlights.length > 0 && (
          <Card className="p-4">
            <h3 className="font-semibold mb-2">✨ 本周亮点</h3>
            <ul className="space-y-1">
              {reportData.insights.highlights.map((highlight, index) => (
                <li key={index} className="text-sm text-foreground flex items-start gap-2">
                  <span className="text-green-600">•</span>
                  <span>{highlight}</span>
                </li>
              ))}
            </ul>
          </Card>
        )}

        {/* 标签使用统计 */}
        <Card className="p-4">
          <h3 className="font-semibold mb-3">🏷️ 标签使用统计</h3>
          <div className="space-y-2">
            {reportData.tagSummaries.slice(0, 5).map((tag, index) => (
              <div key={index} className="flex items-center gap-2">
                <Badge
                  variant="secondary"
                  className="min-w-[80px]"
                  style={{
                    backgroundColor: `${tag.color}20`,
                    color: tag.color,
                  }}
                >
                  {tag.name}
                </Badge>
                <TagSentimentBadge sentiment={tag.sentiment as any} size="sm" />
                <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full"
                    style={{
                      width: `${(tag.count / Math.max(...reportData.tagSummaries.map(t => t.count))) * 100}%`,
                    }}
                  />
                </div>
                <span className="text-sm font-medium min-w-[40px] text-right">
                  {tag.count}次
                </span>
                {tag.avgIntensity && (
                  <Badge variant="outline" className="text-xs">
                    {tag.avgIntensity.toFixed(1)}
                  </Badge>
                )}
              </div>
            ))}
          </div>
        </Card>

        {/* 趋势图表 */}
        {reportData.dailyIntensities.length > 0 && (
          <div className="space-y-4">
            <Card className="p-4">
              <h3 className="font-semibold mb-4">📈 情绪强度趋势</h3>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={reportData.dailyIntensities}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis 
                    dataKey="date" 
                    className="text-xs" 
                    tick={{ fill: 'hsl(var(--muted-foreground))' }}
                  />
                  <YAxis 
                    className="text-xs"
                    tick={{ fill: 'hsl(var(--muted-foreground))' }}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--background))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '6px'
                    }}
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="avgIntensity" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={2}
                    name="平均强度"
                    dot={{ fill: 'hsl(var(--primary))' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </Card>

            <Card className="p-4">
              <h3 className="font-semibold mb-4">📊 标签使用对比</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={reportData.tagSummaries.slice(0, 10)}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis 
                    dataKey="name" 
                    className="text-xs"
                    angle={-45}
                    textAnchor="end"
                    height={80}
                    tick={{ fill: 'hsl(var(--muted-foreground))' }}
                  />
                  <YAxis 
                    className="text-xs"
                    tick={{ fill: 'hsl(var(--muted-foreground))' }}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--background))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '6px'
                    }}
                  />
                  <Legend />
                  <Bar 
                    dataKey="count" 
                    fill="hsl(var(--primary))"
                    name="使用次数"
                    radius={[8, 8, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </Card>
          </div>
        )}

        {/* 建议 */}
        {reportData.insights.recommendations.length > 0 && (
          <Card className="p-4">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-yellow-500" />
              个性化建议
            </h3>
            <div className="space-y-3">
              {reportData.insights.recommendations.map((rec, index) => (
                <div key={index} className="border-l-2 border-primary pl-3">
                  <h4 className="font-medium text-sm mb-1">{rec.title}</h4>
                  <p className="text-xs text-muted-foreground">{rec.description}</p>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* 下周展望 */}
        <Card className="p-4 bg-green-50 dark:bg-green-950">
          <h3 className="font-semibold mb-2">🎯 下周展望</h3>
          <p className="text-sm text-foreground">{reportData.insights.outlook}</p>
        </Card>

        {/* 页脚 */}
        <div className="text-center text-xs text-muted-foreground pt-4 border-t">
          <p>由AI驱动的情绪管理系统生成 · {new Date().toLocaleDateString('zh-CN')}</p>
        </div>
      </div>
    </div>
  );
};

export default WeeklyTagReport;
