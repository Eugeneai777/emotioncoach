import { useMemo } from "react";
import { format, getDay } from "date-fns";
import { zhCN } from "date-fns/locale";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, LineChart, Line, Legend } from "recharts";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown } from "lucide-react";
import { EmotionIntensityGuide } from "./EmotionIntensityGuide";

interface TagType {
  id: string;
  name: string;
  color: string;
}

interface Briefing {
  id: string;
  emotion_theme: string;
  created_at: string;
  emotion_intensity?: number;
  tags?: TagType[];
}

interface EmotionCycleAnalysisProps {
  briefings: Briefing[];
}

// 定义情绪类别
const EMOTION_CATEGORIES = {
  negative: ["焦虑", "不安", "失落", "压力", "无力", "发火", "生气", "伤心", "孤单", "难过", "紧张", "撑不住", "不够好", "后悔", "担心", "自卑"],
  positive: ["被认可", "感谢", "温暖", "被帮助", "轻松", "感动", "安心", "平静", "成功", "顺利", "被理解", "感恩", "被表扬", "放松"],
  mixed: ["又想又怕", "怀念", "矛盾", "纠结", "自责", "内疚", "惊讶", "哇", "没想到", "过去", "想起", "愧疚"],
  growth: ["我明白", "我想尝试", "我成长了", "其实", "原来", "我懂了", "我发现", "我变了", "我决定", "我相信", "我要改变"],
};

const EmotionCycleAnalysis = ({ briefings }: EmotionCycleAnalysisProps) => {
  const weekdayData = useMemo(() => {
    const weekdays = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];
    const counts = Array(7).fill(0).map(() => ({ total: 0, negative: 0, positive: 0 }));

    briefings.forEach((briefing) => {
      const day = getDay(new Date(briefing.created_at));
      counts[day].total += 1;

      // 分析情绪类型
      const tags = briefing.tags?.map(t => t.name) || [];
      const hasNegative = tags.some(tag => EMOTION_CATEGORIES.negative.includes(tag));
      const hasPositive = tags.some(tag => EMOTION_CATEGORIES.positive.includes(tag));

      if (hasNegative) counts[day].negative += 1;
      if (hasPositive) counts[day].positive += 1;
    });

    return weekdays.map((name, index) => ({
      name,
      total: counts[index].total,
      negative: counts[index].negative,
      positive: counts[index].positive,
    }));
  }, [briefings]);

  const timePatternData = useMemo(() => {
    const hourCounts = Array(24).fill(0);

    briefings.forEach((briefing) => {
      const hour = new Date(briefing.created_at).getHours();
      hourCounts[hour] += 1;
    });

    // 分组：早晨(6-11)、下午(12-17)、晚上(18-23)、深夜(0-5)
    const periods = [
      { name: "深夜 (0-5)", count: hourCounts.slice(0, 6).reduce((a, b) => a + b, 0) },
      { name: "早晨 (6-11)", count: hourCounts.slice(6, 12).reduce((a, b) => a + b, 0) },
      { name: "下午 (12-17)", count: hourCounts.slice(12, 18).reduce((a, b) => a + b, 0) },
      { name: "晚上 (18-23)", count: hourCounts.slice(18, 24).reduce((a, b) => a + b, 0) },
    ];

    return periods;
  }, [briefings]);

  const emotionDistribution = useMemo(() => {
    const distribution = {
      negative: 0,
      positive: 0,
      mixed: 0,
      growth: 0,
    };

    briefings.forEach((briefing) => {
      const tags = briefing.tags?.map(t => t.name) || [];
      
      if (tags.some(tag => EMOTION_CATEGORIES.negative.includes(tag))) distribution.negative += 1;
      if (tags.some(tag => EMOTION_CATEGORIES.positive.includes(tag))) distribution.positive += 1;
      if (tags.some(tag => EMOTION_CATEGORIES.mixed.includes(tag))) distribution.mixed += 1;
      if (tags.some(tag => EMOTION_CATEGORIES.growth.includes(tag))) distribution.growth += 1;
    });

    const total = briefings.length || 1;
    return [
      { category: "负面情绪", value: (distribution.negative / total) * 100, count: distribution.negative },
      { category: "正面情绪", value: (distribution.positive / total) * 100, count: distribution.positive },
      { category: "混合情绪", value: (distribution.mixed / total) * 100, count: distribution.mixed },
      { category: "反思成长", value: (distribution.growth / total) * 100, count: distribution.growth },
    ];
  }, [briefings]);

  // 根据强度返回颜色
  const getIntensityColor = (intensity: number) => {
    if (intensity <= 3) return "hsl(142, 76%, 36%)"; // 绿色 - 低强度
    if (intensity <= 6) return "hsl(38, 92%, 50%)"; // 橙色 - 中等强度
    return "hsl(0, 84%, 60%)"; // 红色 - 高强度
  };

  // 根据强度返回背景色
  const getIntensityBgColor = (intensity: number) => {
    if (intensity <= 3) return "bg-green-500/10";
    if (intensity <= 6) return "bg-orange-500/10";
    return "bg-red-500/10";
  };

  // 情绪强度趋势分析
  const intensityTrendData = useMemo(() => {
    const briefingsWithIntensity = briefings
      .filter(b => b.emotion_intensity !== null && b.emotion_intensity !== undefined)
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
      .slice(-14); // 最近14条记录

    return briefingsWithIntensity.map((briefing, index) => ({
      index: index + 1,
      date: format(new Date(briefing.created_at), "MM/dd", { locale: zhCN }),
      intensity: briefing.emotion_intensity,
    }));
  }, [briefings]);

  const intensityStats = useMemo(() => {
    const intensities = briefings
      .filter(b => b.emotion_intensity !== null && b.emotion_intensity !== undefined)
      .map(b => b.emotion_intensity!);

    if (intensities.length === 0) {
      return { avg: 0, max: 0, min: 0, trend: "stable" as const };
    }

    const avg = intensities.reduce((sum, val) => sum + val, 0) / intensities.length;
    const max = Math.max(...intensities);
    const min = Math.min(...intensities);

    // 分析趋势：比较最近7条和之前7条的平均值
    const recent = intensities.slice(-7);
    const previous = intensities.slice(-14, -7);
    
    let trend: "up" | "down" | "stable" = "stable";
    if (recent.length > 0 && previous.length > 0) {
      const recentAvg = recent.reduce((sum, val) => sum + val, 0) / recent.length;
      const previousAvg = previous.reduce((sum, val) => sum + val, 0) / previous.length;
      
      if (recentAvg > previousAvg + 0.5) trend = "up";
      else if (recentAvg < previousAvg - 0.5) trend = "down";
    }

    return { avg, max, min, trend };
  }, [briefings]);

  const insights = useMemo(() => {
    const insights: { type: "peak" | "valley" | "pattern"; text: string }[] = [];

    // 情绪强度分析
    if (intensityStats.avg > 0) {
      if (intensityStats.trend === "up") {
        insights.push({
          type: "peak",
          text: `近期情绪强度呈上升趋势，平均强度${intensityStats.avg.toFixed(1)}分`
        });
      } else if (intensityStats.trend === "down") {
        insights.push({
          type: "valley",
          text: `近期情绪强度有所下降，平均强度${intensityStats.avg.toFixed(1)}分`
        });
      } else {
        insights.push({
          type: "pattern",
          text: `情绪强度保持相对稳定，平均强度${intensityStats.avg.toFixed(1)}分`
        });
      }
    }

    // 分析星期几的高峰
    const maxWeekday = weekdayData.reduce((max, current) => 
      current.total > max.total ? current : max
    );
    if (maxWeekday.total > 0) {
      insights.push({
        type: "peak",
        text: `你在${maxWeekday.name}最常进行情绪梳理（${maxWeekday.total}次）`
      });
    }

    // 分析时段偏好
    const maxPeriod = timePatternData.reduce((max, current) =>
      current.count > max.count ? current : max
    );
    if (maxPeriod.count > 0) {
      insights.push({
        type: "pattern",
        text: `你更倾向在${maxPeriod.name}梳理情绪（${maxPeriod.count}次）`
      });
    }

    // 分析情绪类型倾向
    const dominantEmotion = emotionDistribution.reduce((max, current) =>
      current.count > max.count ? current : max
    );
    if (dominantEmotion.count > 0) {
      insights.push({
        type: "pattern",
        text: `「${dominantEmotion.category}」占${dominantEmotion.value.toFixed(0)}%，是你最常关注的情绪类型`
      });
    }

    // 工作日 vs 周末分析
    const weekdayCount = weekdayData.slice(1, 6).reduce((sum, d) => sum + d.total, 0);
    const weekendCount = weekdayData[0].total + weekdayData[6].total;
    if (weekdayCount > weekendCount * 1.5) {
      insights.push({
        type: "pattern",
        text: "工作日的情绪梳理明显多于周末，可能工作压力是主要触发因素"
      });
    } else if (weekendCount > weekdayCount * 1.5) {
      insights.push({
        type: "pattern",
        text: "周末更常进行情绪梳理，你可能在给自己更多反思空间"
      });
    }

    return insights;
  }, [weekdayData, timePatternData, emotionDistribution, intensityStats]);

  if (briefings.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">还没有足够的数据进行周期分析</p>
        <p className="text-sm text-muted-foreground mt-2">完成更多情绪梳理后会生成周期分析 🌿</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6">
      <Card className="p-4 md:p-6 space-y-3 md:space-y-4">
        <h3 className="text-base md:text-lg font-semibold text-foreground flex items-center gap-2">
          🔍 周期洞察
        </h3>
        <div className="space-y-2">
          {insights.map((insight, index) => (
            <div
              key={index}
              className="flex items-start gap-2 md:gap-3 p-2.5 md:p-3 rounded-xl bg-background/50"
            >
              {insight.type === "peak" ? (
                <TrendingUp className="w-4 h-4 md:w-5 md:h-5 text-green-500 flex-shrink-0 mt-0.5" />
              ) : insight.type === "valley" ? (
                <TrendingDown className="w-4 h-4 md:w-5 md:h-5 text-orange-500 flex-shrink-0 mt-0.5" />
              ) : (
                <div className="w-4 h-4 md:w-5 md:h-5 rounded-full bg-primary/20 flex-shrink-0 mt-0.5" />
              )}
              <p className="text-xs md:text-sm text-foreground/90">{insight.text}</p>
            </div>
          ))}
        </div>
      </Card>

      {intensityTrendData.length > 0 && (
        <Card className="p-4 md:p-6 space-y-3 md:space-y-4">
          <div className="space-y-1">
            <h3 className="text-base md:text-lg font-semibold text-foreground flex items-center gap-2">
              📊 情绪强度趋势
            </h3>
            <p className="text-xs md:text-sm text-muted-foreground">
              追踪你的情绪强度变化（1-10分）
            </p>
          </div>
          
          <div className="grid grid-cols-3 gap-3 md:gap-4 mb-4">
            <div className={`p-3 rounded-xl text-center transition-colors ${getIntensityBgColor(intensityStats.avg)}`}>
              <p className="text-[10px] md:text-xs text-muted-foreground mb-1">平均强度</p>
              <p 
                className="text-lg md:text-2xl font-semibold"
                style={{ color: getIntensityColor(intensityStats.avg) }}
              >
                {intensityStats.avg.toFixed(1)}
              </p>
            </div>
            <div className={`p-3 rounded-xl text-center transition-colors ${getIntensityBgColor(intensityStats.max)}`}>
              <p className="text-[10px] md:text-xs text-muted-foreground mb-1">最高强度</p>
              <p 
                className="text-lg md:text-2xl font-semibold"
                style={{ color: getIntensityColor(intensityStats.max) }}
              >
                {intensityStats.max}
              </p>
            </div>
            <div className={`p-3 rounded-xl text-center transition-colors ${getIntensityBgColor(intensityStats.min)}`}>
              <p className="text-[10px] md:text-xs text-muted-foreground mb-1">最低强度</p>
              <p 
                className="text-lg md:text-2xl font-semibold"
                style={{ color: getIntensityColor(intensityStats.min) }}
              >
                {intensityStats.min}
              </p>
            </div>
          </div>

          <div className="w-full h-[200px] md:h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={intensityTrendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis
                  dataKey="date"
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                  className="md:text-xs"
                />
                <YAxis
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                  domain={[0, 10]}
                  className="md:text-xs"
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                    fontSize: "11px",
                    padding: "6px 10px",
                  }}
                  labelStyle={{ color: "hsl(var(--foreground))", fontSize: "11px" }}
                />
                <Legend
                  wrapperStyle={{ fontSize: "11px" }}
                  iconType="line"
                />
                <Line
                  type="monotone"
                  dataKey="intensity"
                  name="情绪强度"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  dot={(props: any) => {
                    const { cx, cy, payload } = props;
                    const color = getIntensityColor(payload.intensity);
                    return (
                      <circle
                        cx={cx}
                        cy={cy}
                        r={4}
                        fill={color}
                        stroke={color}
                        strokeWidth={2}
                      />
                    );
                  }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="flex items-center justify-center gap-4 md:gap-6 pt-3 md:pt-4 border-t border-border/50">
            <div className="flex items-center gap-1.5 md:gap-2">
              <div className="w-2.5 h-2.5 md:w-3 md:h-3 rounded-full bg-green-500" />
              <span className="text-[10px] md:text-xs text-muted-foreground">低强度 (1-3)</span>
            </div>
            <div className="flex items-center gap-1.5 md:gap-2">
              <div className="w-2.5 h-2.5 md:w-3 md:h-3 rounded-full bg-orange-500" />
              <span className="text-[10px] md:text-xs text-muted-foreground">中等 (4-6)</span>
            </div>
            <div className="flex items-center gap-1.5 md:gap-2">
              <div className="w-2.5 h-2.5 md:w-3 md:h-3 rounded-full bg-red-500" />
              <span className="text-[10px] md:text-xs text-muted-foreground">高强度 (7-10)</span>
            </div>
          </div>

          <div className="flex justify-center pt-3 md:pt-4">
            <EmotionIntensityGuide />
          </div>
        </Card>
      )}

      <Card className="p-4 md:p-6 space-y-3 md:space-y-4">
        <div className="space-y-1">
          <h3 className="text-base md:text-lg font-semibold text-foreground flex items-center gap-2">
            📅 星期分布
          </h3>
          <p className="text-xs md:text-sm text-muted-foreground">
            查看你在一周中每天的情绪梳理频率
          </p>
        </div>
        <div className="w-full h-[200px] md:h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={weekdayData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis
                dataKey="name"
                stroke="hsl(var(--muted-foreground))"
                fontSize={10}
                tickLine={false}
                axisLine={false}
                className="md:text-xs"
              />
              <YAxis
                stroke="hsl(var(--muted-foreground))"
                fontSize={10}
                tickLine={false}
                axisLine={false}
                allowDecimals={false}
                className="md:text-xs"
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                  fontSize: "11px",
                  padding: "6px 10px",
                }}
                labelStyle={{ color: "hsl(var(--foreground))", fontSize: "11px" }}
              />
              <Bar dataKey="total" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card className="p-4 md:p-6 space-y-3 md:space-y-4">
        <div className="space-y-1">
          <h3 className="text-base md:text-lg font-semibold text-foreground flex items-center gap-2">
            ⏰ 时段偏好
          </h3>
          <p className="text-xs md:text-sm text-muted-foreground">
            了解你在一天中何时最常梳理情绪
          </p>
        </div>
        <div className="w-full h-[200px] md:h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={timePatternData}>
              <PolarGrid stroke="hsl(var(--border))" />
              <PolarAngleAxis
                dataKey="name"
                stroke="hsl(var(--muted-foreground))"
                fontSize={9}
                className="md:text-xs"
              />
              <PolarRadiusAxis
                stroke="hsl(var(--muted-foreground))"
                fontSize={10}
                angle={90}
                className="md:text-xs"
              />
              <Radar
                name="次数"
                dataKey="count"
                stroke="hsl(var(--primary))"
                fill="hsl(var(--primary))"
                fillOpacity={0.3}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                  fontSize: "11px",
                  padding: "6px 10px",
                }}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card className="p-4 md:p-6 space-y-3 md:space-y-4">
        <div className="space-y-1">
          <h3 className="text-base md:text-lg font-semibold text-foreground flex items-center gap-2">
            🎭 情绪类型分布
          </h3>
          <p className="text-xs md:text-sm text-muted-foreground">
            查看不同情绪类型在你的简报中的占比
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
          {emotionDistribution.map((item) => (
            <div
              key={item.category}
              className="p-3 md:p-4 rounded-xl bg-background/50 space-y-2"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs md:text-sm font-medium text-foreground">{item.category}</span>
                <Badge variant="secondary" className="text-[10px] md:text-xs">
                  {item.value.toFixed(0)}%
                </Badge>
              </div>
              <div className="w-full bg-border/30 rounded-full h-1.5 md:h-2 overflow-hidden">
                <div
                  className="h-full bg-primary transition-all duration-500"
                  style={{ width: `${item.value}%` }}
                />
              </div>
              <p className="text-[10px] md:text-xs text-muted-foreground">{item.count} 次</p>
            </div>
          ))}
        </div>
      </Card>

      <div className="flex items-center justify-center text-[10px] md:text-xs text-muted-foreground pt-2 md:pt-4">
        <span>基于 {briefings.length} 条简报的分析结果</span>
      </div>
    </div>
  );
};

export default EmotionCycleAnalysis;
