import { useMemo } from "react";
import { format, getDay } from "date-fns";
import { zhCN } from "date-fns/locale";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, LineChart, Line, Legend } from "recharts";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown } from "lucide-react";
import { EmotionIntensityGuide } from "../EmotionIntensityGuide";

interface ParentTag {
  id: string;
  name: string;
  color: string;
}

interface ParentSession {
  id: string;
  created_at: string;
  tags?: ParentTag[];
  briefing?: {
    emotion_theme: string;
    emotion_intensity: number | null;
  };
}

interface ParentCycleAnalysisProps {
  sessions: ParentSession[];
}

const EMOTION_CATEGORIES = {
  negative: ["焦虑", "不安", "失落", "压力", "无力", "发火", "生气", "伤心", "孤单", "难过", "紧张", "撑不住", "不够好", "后悔", "担心", "自卑", "愤怒", "沮丧", "挫败", "着急", "控制", "无奈", "委屈", "不被理解", "不信任", "疲惫", "担忧", "烦躁", "崩溃", "恐惧", "害怕", "绝望", "心累", "厌烦", "抓狂", "失望", "受伤", "被忽视", "不耐烦"],
  positive: ["被认可", "感谢", "温暖", "被帮助", "轻松", "感动", "安心", "平静", "成功", "顺利", "被理解", "感恩", "被表扬", "放松", "开心", "喜悦", "自豪", "希望", "欣慰", "满足", "幸福", "信任", "亲近", "连接", "欣赏", "陪伴", "支持", "鼓励"],
  mixed: ["又想又怕", "怀念", "矛盾", "纠结", "自责", "内疚", "惊讶", "哇", "没想到", "过去", "想起", "愧疚", "复杂", "犹豫", "迷茫", "困惑", "不确定", "徘徊"],
  growth: ["我明白", "我想尝试", "我成长了", "其实", "原来", "我懂了", "我发现", "我变了", "我决定", "我相信", "我要改变", "我理解了", "我学到了", "反思", "觉察", "意识到", "看见", "理解", "接纳", "放下", "尝试", "改变", "成长", "进步", "突破"],
};

export const ParentCycleAnalysis = ({ sessions }: ParentCycleAnalysisProps) => {
  const weekdayData = useMemo(() => {
    const weekdays = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];
    const counts = Array(7).fill(0).map(() => ({ total: 0, negative: 0, positive: 0 }));

    sessions.forEach((session) => {
      const day = getDay(new Date(session.created_at));
      counts[day].total += 1;

      const tags = session.tags?.map(t => t.name) || [];
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
  }, [sessions]);

  const timePatternData = useMemo(() => {
    const hourCounts = Array(24).fill(0);
    sessions.forEach((session) => {
      const hour = new Date(session.created_at).getHours();
      hourCounts[hour] += 1;
    });

    return [
      { name: "深夜 (0-5)", count: hourCounts.slice(0, 6).reduce((a, b) => a + b, 0) },
      { name: "早晨 (6-11)", count: hourCounts.slice(6, 12).reduce((a, b) => a + b, 0) },
      { name: "下午 (12-17)", count: hourCounts.slice(12, 18).reduce((a, b) => a + b, 0) },
      { name: "晚上 (18-23)", count: hourCounts.slice(18, 24).reduce((a, b) => a + b, 0) },
    ];
  }, [sessions]);

  const emotionDistribution = useMemo(() => {
    const distribution = { negative: 0, positive: 0, mixed: 0, growth: 0 };

    sessions.forEach((session) => {
      const tags = session.tags?.map(t => t.name) || [];
      if (tags.some(tag => EMOTION_CATEGORIES.negative.includes(tag))) distribution.negative += 1;
      if (tags.some(tag => EMOTION_CATEGORIES.positive.includes(tag))) distribution.positive += 1;
      if (tags.some(tag => EMOTION_CATEGORIES.mixed.includes(tag))) distribution.mixed += 1;
      if (tags.some(tag => EMOTION_CATEGORIES.growth.includes(tag))) distribution.growth += 1;
    });

    const total = sessions.length || 1;
    return [
      { category: "负面情绪", value: (distribution.negative / total) * 100, count: distribution.negative },
      { category: "正面情绪", value: (distribution.positive / total) * 100, count: distribution.positive },
      { category: "混合情绪", value: (distribution.mixed / total) * 100, count: distribution.mixed },
      { category: "反思成长", value: (distribution.growth / total) * 100, count: distribution.growth },
    ];
  }, [sessions]);

  const getIntensityColor = (intensity: number) => {
    if (intensity <= 3) return "hsl(142, 76%, 36%)";
    if (intensity <= 6) return "hsl(38, 92%, 50%)";
    return "hsl(0, 84%, 60%)";
  };

  const getIntensityBgColor = (intensity: number) => {
    if (intensity <= 3) return "bg-green-500/10";
    if (intensity <= 6) return "bg-orange-500/10";
    return "bg-red-500/10";
  };

  const intensityTrendData = useMemo(() => {
    const records = sessions
      .filter(s => s.briefing?.emotion_intensity !== null && s.briefing?.emotion_intensity !== undefined)
      .map(s => ({ date: new Date(s.created_at), intensity: s.briefing!.emotion_intensity! }))
      .sort((a, b) => a.date.getTime() - b.date.getTime())
      .slice(-14);

    return records.map((record, index) => ({
      index: index + 1,
      date: format(record.date, "MM/dd", { locale: zhCN }),
      intensity: record.intensity,
    }));
  }, [sessions]);

  const intensityStats = useMemo(() => {
    const intensities = sessions
      .filter(s => s.briefing?.emotion_intensity !== null && s.briefing?.emotion_intensity !== undefined)
      .map(s => s.briefing!.emotion_intensity!);

    if (intensities.length === 0) {
      return { avg: 0, max: 0, min: 0, trend: "stable" as const, totalCount: 0 };
    }

    const avg = intensities.reduce((sum, val) => sum + val, 0) / intensities.length;
    const max = Math.max(...intensities);
    const min = Math.min(...intensities);

    const recent = intensities.slice(-7);
    const previous = intensities.slice(-14, -7);
    
    let trend: "up" | "down" | "stable" = "stable";
    if (recent.length > 0 && previous.length > 0) {
      const recentAvg = recent.reduce((sum, val) => sum + val, 0) / recent.length;
      const previousAvg = previous.reduce((sum, val) => sum + val, 0) / previous.length;
      
      if (recentAvg > previousAvg + 0.5) trend = "up";
      else if (recentAvg < previousAvg - 0.5) trend = "down";
    }

    return { avg, max, min, trend, totalCount: intensities.length };
  }, [sessions]);

  const insights = useMemo(() => {
    const insights: { type: "peak" | "valley" | "pattern"; text: string }[] = [];

    if (intensityStats.avg > 0) {
      if (intensityStats.trend === "up") {
        insights.push({ type: "peak", text: `近期情绪强度呈上升趋势，平均强度${intensityStats.avg.toFixed(1)}分` });
      } else if (intensityStats.trend === "down") {
        insights.push({ type: "valley", text: `近期情绪强度有所下降，平均强度${intensityStats.avg.toFixed(1)}分` });
      } else {
        insights.push({ type: "pattern", text: `情绪强度保持相对稳定，平均强度${intensityStats.avg.toFixed(1)}分` });
      }
    }

    const maxWeekday = weekdayData.reduce((max, current) => current.total > max.total ? current : max);
    if (maxWeekday.total > 0) {
      insights.push({ type: "peak", text: `你在${maxWeekday.name}最常进行亲子教练对话（${maxWeekday.total}次）` });
    }

    const maxPeriod = timePatternData.reduce((max, current) => current.count > max.count ? current : max);
    if (maxPeriod.count > 0) {
      insights.push({ type: "pattern", text: `你更倾向在${maxPeriod.name}进行亲子对话（${maxPeriod.count}次）` });
    }

    const dominantEmotion = emotionDistribution.reduce((max, current) => current.count > max.count ? current : max);
    if (dominantEmotion.count > 0) {
      insights.push({ type: "pattern", text: `「${dominantEmotion.category}」占${dominantEmotion.value.toFixed(0)}%，是你最常关注的情绪类型` });
    }

    return insights;
  }, [weekdayData, timePatternData, emotionDistribution, intensityStats]);

  if (sessions.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">还没有足够的数据进行周期分析</p>
        <p className="text-sm text-muted-foreground mt-2">完成更多亲子教练对话后会生成周期分析 🌿</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6">
      <Card className="p-4 md:p-6 space-y-3 md:space-y-4">
        <h3 className="text-base md:text-lg font-semibold text-foreground flex items-center gap-2">🔍 周期洞察</h3>
        <div className="space-y-2">
          {insights.map((insight, index) => (
            <div key={index} className="flex items-start gap-2 md:gap-3 p-2.5 md:p-3 rounded-xl bg-background/50">
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
            <h3 className="text-base md:text-lg font-semibold text-foreground flex items-center gap-2">📊 情绪强度趋势</h3>
            <p className="text-xs md:text-sm text-muted-foreground">追踪你的情绪强度变化（1-10分）</p>
          </div>
          
          <div className="grid grid-cols-3 gap-2 md:gap-4 mb-3 md:mb-4">
            <div className={`p-2.5 md:p-3 rounded-xl text-center ${getIntensityBgColor(intensityStats.avg)}`}>
              <p className="text-[9px] md:text-xs text-muted-foreground mb-0.5">平均强度</p>
              <p className="text-base md:text-2xl font-bold" style={{ color: getIntensityColor(intensityStats.avg) }}>{intensityStats.avg.toFixed(1)}</p>
            </div>
            <div className={`p-2.5 md:p-3 rounded-xl text-center ${getIntensityBgColor(intensityStats.max)}`}>
              <p className="text-[9px] md:text-xs text-muted-foreground mb-0.5">最高强度</p>
              <p className="text-base md:text-2xl font-bold" style={{ color: getIntensityColor(intensityStats.max) }}>{intensityStats.max}</p>
            </div>
            <div className={`p-2.5 md:p-3 rounded-xl text-center ${getIntensityBgColor(intensityStats.min)}`}>
              <p className="text-[9px] md:text-xs text-muted-foreground mb-0.5">最低强度</p>
              <p className="text-base md:text-2xl font-bold" style={{ color: getIntensityColor(intensityStats.min) }}>{intensityStats.min}</p>
            </div>
          </div>

          <div className="w-full h-[250px] md:h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={intensityTrendData} margin={{ top: 5, right: 5, left: -15, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} domain={[0, 10]} />
                <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px" }} />
                <Legend wrapperStyle={{ fontSize: "12px" }} />
                <Line type="monotone" dataKey="intensity" name="情绪强度" stroke="#a855f7" strokeWidth={2.5} dot={(props: any) => {
                  const { cx, cy, payload } = props;
                  return <circle cx={cx} cy={cy} r={5} fill={getIntensityColor(payload.intensity)} stroke={getIntensityColor(payload.intensity)} strokeWidth={2} />;
                }} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="flex justify-center pt-3"><EmotionIntensityGuide /></div>
        </Card>
      )}

      <Card className="p-4 md:p-6 space-y-3 md:space-y-4">
        <h3 className="text-base md:text-lg font-semibold">📅 星期分布</h3>
        <div className="w-full h-[250px] md:h-[300px]">
          <ResponsiveContainer><BarChart data={weekdayData}><CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" /><XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={11} /><YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} /><Tooltip /><Bar dataKey="total" fill="#a855f7" radius={[8, 8, 0, 0]} /></BarChart></ResponsiveContainer>
        </div>
      </Card>

      <Card className="p-4 md:p-6 space-y-3 md:space-y-4">
        <h3 className="text-base md:text-lg font-semibold">⏰ 时段偏好</h3>
        <div className="w-full h-[200px] md:h-[300px]">
          <ResponsiveContainer><RadarChart data={timePatternData}><PolarGrid /><PolarAngleAxis dataKey="name" /><PolarRadiusAxis /><Radar name="次数" dataKey="count" stroke="#a855f7" fill="#a855f7" fillOpacity={0.3} /></RadarChart></ResponsiveContainer>
        </div>
      </Card>

      <Card className="p-4 md:p-6 space-y-3 md:space-y-4">
        <h3 className="text-base md:text-lg font-semibold">🎭 情绪类型分布</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
          {emotionDistribution.map((item) => (
            <div key={item.category} className="p-3 md:p-4 rounded-xl bg-background/50 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs md:text-sm font-medium">{item.category}</span>
                <Badge variant="secondary" className="text-[10px] md:text-xs">{item.value.toFixed(0)}%</Badge>
              </div>
              <div className="w-full bg-border/30 rounded-full h-1.5 md:h-2">
                <div className="h-full bg-purple-500 transition-all" style={{ width: `${item.value}%` }} />
              </div>
              <p className="text-[10px] md:text-xs text-muted-foreground">{item.count} 次</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};
