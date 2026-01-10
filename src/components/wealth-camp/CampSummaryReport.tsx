import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Trophy, 
  TrendingUp, 
  Star, 
  Sparkles, 
  Target,
  Award,
  Share2,
  Download
} from "lucide-react";
import { motion } from "framer-motion";
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  ResponsiveContainer, 
  Tooltip,
  Area,
  AreaChart
} from "recharts";

interface CampSummary {
  id: string;
  user_id: string;
  camp_id: string | null;
  start_awakening: number | null;
  end_awakening: number | null;
  awakening_growth: number | null;
  behavior_growth: number | null;
  emotion_growth: number | null;
  belief_growth: number | null;
  daily_scores: { day: number; score: number; date: string }[] | null;
  biggest_breakthrough: string | null;
  focus_areas: string[] | null;
  achievements_unlocked: string[] | null;
  ai_coach_message: string | null;
  generated_at: string | null;
}

interface CampSummaryReportProps {
  summary: CampSummary;
  userName?: string;
  onShare?: () => void;
}

const ACHIEVEMENT_ICONS: Record<string, string> = {
  'first_checkin': '🌱',
  'streak_3': '🔥',
  'streak_7': '🏆',
  'behavior_master': '🎯',
  'emotion_master': '💗',
  'belief_master': '💡',
  'giving_champion': '🎁',
  'early_bird': '🌅',
  'consistent_player': '⭐',
  'breakthrough': '🚀'
};

const ACHIEVEMENT_NAMES: Record<string, string> = {
  'first_checkin': '觉醒起步',
  'streak_3': '三日连胜',
  'streak_7': '七日毕业',
  'behavior_master': '行为觉察师',
  'emotion_master': '情绪驾驭者',
  'belief_master': '信念转化师',
  'giving_champion': '给予冠军',
  'early_bird': '早起觉醒',
  'consistent_player': '稳定成长',
  'breakthrough': '突破达人'
};

export function CampSummaryReport({ summary, userName = "学员", onShare }: CampSummaryReportProps) {
  const growthPercentage = summary.awakening_growth || 0;
  const dailyScores = summary.daily_scores || [];
  
  // Prepare chart data
  const chartData = dailyScores.map(d => ({
    day: `D${d.day}`,
    score: d.score,
    fullDay: `第${d.day}天`
  }));

  // Calculate growth metrics
  const behaviorGrowth = summary.behavior_growth || 0;
  const emotionGrowth = summary.emotion_growth || 0;
  const beliefGrowth = summary.belief_growth || 0;

  return (
    <div className="space-y-6 pb-8">
      {/* Header Card - Growth Summary */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="relative overflow-hidden bg-gradient-to-br from-amber-500 via-orange-500 to-rose-500 text-white p-6">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2" />
          
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-4">
              <Trophy className="h-6 w-6" />
              <span className="text-lg font-semibold">7天财富觉醒 · 完成报告</span>
            </div>
            
            <div className="text-center py-4">
              <p className="text-white/80 mb-2">恭喜 {userName}！</p>
              <div className="flex items-center justify-center gap-3">
                <div className="text-5xl font-bold">{summary.start_awakening || 0}</div>
                <TrendingUp className="h-8 w-8 animate-pulse" />
                <div className="text-5xl font-bold">{summary.end_awakening || 0}</div>
              </div>
              <p className="text-white/90 mt-2">
                觉醒指数提升 <span className="font-bold text-xl">+{growthPercentage}</span> 点
              </p>
            </div>

            <div className="grid grid-cols-3 gap-4 mt-4">
              <div className="text-center bg-white/10 rounded-lg p-3">
                <div className="text-2xl font-bold">+{behaviorGrowth}</div>
                <div className="text-xs text-white/80">行为觉察</div>
              </div>
              <div className="text-center bg-white/10 rounded-lg p-3">
                <div className="text-2xl font-bold">+{emotionGrowth}</div>
                <div className="text-xs text-white/80">情绪觉察</div>
              </div>
              <div className="text-center bg-white/10 rounded-lg p-3">
                <div className="text-2xl font-bold">+{beliefGrowth}</div>
                <div className="text-xs text-white/80">信念觉察</div>
              </div>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Growth Curve Chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="h-5 w-5 text-amber-500" />
            <h3 className="font-semibold">7天成长曲线</h3>
          </div>
          
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis 
                  dataKey="day" 
                  axisLine={false} 
                  tickLine={false}
                  tick={{ fontSize: 12 }}
                />
                <YAxis 
                  domain={[0, 100]} 
                  axisLine={false} 
                  tickLine={false}
                  tick={{ fontSize: 12 }}
                />
                <Tooltip 
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-background border rounded-lg p-2 shadow-lg">
                          <p className="text-sm font-medium">{payload[0].payload.fullDay}</p>
                          <p className="text-amber-600 font-bold">觉醒指数: {payload[0].value}</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="score"
                  stroke="#f59e0b"
                  strokeWidth={3}
                  fill="url(#colorScore)"
                  dot={{ fill: '#f59e0b', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, fill: '#f59e0b' }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </motion.div>

      {/* Biggest Breakthrough */}
      {summary.biggest_breakthrough && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Card className="p-4 border-amber-200 bg-amber-50/50">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="h-5 w-5 text-amber-500" />
              <h3 className="font-semibold text-amber-800">最大突破</h3>
            </div>
            <p className="text-amber-900 leading-relaxed">
              {summary.biggest_breakthrough}
            </p>
          </Card>
        </motion.div>
      )}

      {/* Focus Areas */}
      {summary.focus_areas && summary.focus_areas.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.25 }}
        >
          <Card className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <Target className="h-5 w-5 text-violet-500" />
              <h3 className="font-semibold">重点成长领域</h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {summary.focus_areas.map((area, index) => (
                <Badge 
                  key={index} 
                  variant="secondary"
                  className="bg-violet-100 text-violet-700 hover:bg-violet-200"
                >
                  {area}
                </Badge>
              ))}
            </div>
          </Card>
        </motion.div>
      )}

      {/* Achievements */}
      {summary.achievements_unlocked && summary.achievements_unlocked.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <Card className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <Award className="h-5 w-5 text-amber-500" />
              <h3 className="font-semibold">解锁成就</h3>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {summary.achievements_unlocked.map((achievement, index) => (
                <motion.div
                  key={achievement}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.4 + index * 0.1 }}
                  className="flex items-center gap-2 bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg p-3"
                >
                  <span className="text-2xl">{ACHIEVEMENT_ICONS[achievement] || '🏅'}</span>
                  <span className="text-sm font-medium text-amber-800">
                    {ACHIEVEMENT_NAMES[achievement] || achievement}
                  </span>
                </motion.div>
              ))}
            </div>
          </Card>
        </motion.div>
      )}

      {/* AI Coach Message */}
      {summary.ai_coach_message && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.35 }}
        >
          <Card className="p-4 bg-gradient-to-br from-violet-50 to-purple-50 border-violet-200">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                <Star className="h-4 w-4 text-white" />
              </div>
              <h3 className="font-semibold text-violet-800">AI 教练寄语</h3>
            </div>
            <p className="text-violet-900 leading-relaxed whitespace-pre-wrap">
              {summary.ai_coach_message}
            </p>
          </Card>
        </motion.div>
      )}

      {/* Action Buttons */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
        className="flex gap-3"
      >
        <Button 
          className="flex-1 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
          onClick={onShare}
        >
          <Share2 className="h-4 w-4 mr-2" />
          分享成就
        </Button>
      </motion.div>
    </div>
  );
}
