import { useNavigate, useSearchParams } from "react-router-dom";
import { DynamicOGMeta } from "@/components/common/DynamicOGMeta";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowLeft, 
  GraduationCap, 
  Trophy, 
  Users, 
  Sparkles,
  TrendingUp,
  Gift,
  CheckCircle2,
  ArrowRight,
  Crown,
  Share2,
  Eye,
  Heart,
  Lightbulb
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { zhCN } from "date-fns/locale";
import WealthInviteCardDialog from "@/components/wealth-camp/WealthInviteCardDialog";
import { useWealthCampAnalytics } from "@/hooks/useWealthCampAnalytics";
import { useCampSummary } from "@/hooks/useCampSummary";
import { useAssessmentBaseline } from "@/hooks/useAssessmentBaseline";
import { GraduateContinueCard } from "@/components/wealth-camp/GraduateContinueCard";
import { AchievementBadgeWall } from "@/components/wealth-camp/AchievementBadgeWall";
import { AchievementCelebration } from "@/components/wealth-camp/AchievementCelebration";
import { useAwakeningProgress } from "@/hooks/useAwakeningProgress";
import { useAchievementChecker } from "@/hooks/useAchievementChecker";
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  ResponsiveContainer, 
  Area,
  ComposedChart,
  ReferenceLine
} from 'recharts';

interface GraduationData {
  campId: string;
  campName: string;
  completedAt: string;
  totalDays: number;
  journalCount: number;
  awakeningScore: number;
}

// Three-layer growth bar component
function GrowthLayerBar({ 
  label, 
  emoji,
  baseline, 
  current, 
  colorClass,
  bgClass 
}: { 
  label: string;
  emoji: string;
  baseline: number; 
  current: number;
  colorClass: string;
  bgClass: string;
}) {
  const growth = current - baseline;
  const growthPercent = baseline > 0 ? Math.round((growth / baseline) * 100) : 0;
  
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="flex items-center gap-1.5">
          <span>{emoji}</span>
          <span className="font-medium">{label}</span>
        </span>
        <span className={`text-xs font-medium ${growth > 0 ? 'text-emerald-600' : 'text-muted-foreground'}`}>
          {growth > 0 ? `+${growth.toFixed(0)}%` : `${growth.toFixed(0)}%`}
        </span>
      </div>
      <div className="relative h-3 bg-muted/50 rounded-full overflow-hidden">
        {/* Baseline marker */}
        <div 
          className="absolute top-0 h-full w-0.5 bg-gray-400 z-10"
          style={{ left: `${Math.min(baseline, 100)}%` }}
        />
        {/* Current progress */}
        <div 
          className={`h-full rounded-full transition-all duration-500 ${bgClass}`}
          style={{ width: `${Math.min(current, 100)}%` }}
        />
      </div>
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>Day 0: {baseline.toFixed(0)}%</span>
        <span>毕业: {current.toFixed(0)}%</span>
      </div>
    </div>
  );
}

export default function CampGraduate() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const urlCampId = searchParams.get('campId');
  
  const [graduationData, setGraduationData] = useState<GraduationData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { trackEvent } = useWealthCampAnalytics();
  
  // Get camp summary data
  const { summary: campSummary, loading: summaryLoading, generating, generateSummary } = useCampSummary(
    graduationData?.campId || urlCampId || null,
    true
  );
  
  // Get baseline for comparison
  const { baseline } = useAssessmentBaseline(graduationData?.campId || urlCampId || undefined);
  
  // Get awakening progress for level info
  const { progress: awakeningProgress, currentLevel } = useAwakeningProgress();
  
  // Achievement checker - auto award achievements on page load
  const { checkAndAwardAchievements, checking: checkingAchievements, newlyEarned, showCelebration, closeCelebration } = useAchievementChecker();

  // 页面访问埋点 + 成就检查
  useEffect(() => {
    trackEvent('graduate_page_viewed');
    // 页面加载时检查并补发所有应得成就
    checkAndAwardAchievements();
  }, []);

  useEffect(() => {
    const fetchGraduationData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          navigate('/auth');
          return;
        }

        // 获取已完成的训练营
        const { data: camp } = await supabase
          .from('training_camps')
          .select('*')
          .eq('user_id', user.id)
          .in('camp_type', ['wealth_block_7', 'wealth_block_21'])
          .eq('status', 'completed')
          .order('updated_at', { ascending: false })
          .limit(1)
          .single();

        if (camp) {
          // 获取日记数量
          const { count: journalCount } = await supabase
            .from('wealth_journal_entries')
            .select('*', { count: 'exact', head: true })
            .eq('camp_id', camp.id);

          // 获取最新觉醒分数 (使用behavior_score + emotion_score + belief_score 计算)
          const { data: latestJournal } = await supabase
            .from('wealth_journal_entries')
            .select('behavior_score, emotion_score, belief_score')
            .eq('camp_id', camp.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

          const awakeningScore = latestJournal 
            ? Math.round(100 - ((latestJournal.behavior_score || 0) + (latestJournal.emotion_score || 0) + (latestJournal.belief_score || 0)) / 1.5)
            : 75;

          setGraduationData({
            campId: camp.id,
            campName: '财富觉醒训练营',
            completedAt: camp.updated_at,
            totalDays: 7,
            journalCount: journalCount || 0,
            awakeningScore
          });
          
          // 埋点：毕业完成
          trackEvent('camp_day21_completed', { metadata: { camp_id: camp.id } });
        }
      } catch (error) {
        console.error('Error fetching graduation data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchGraduationData();
  }, [navigate]);

  const partnerBenefits = [
    {
      icon: <TrendingUp className="w-5 h-5" />,
      title: "推广收益",
      desc: "每成功推荐1位学员，获得30%佣金"
    },
    {
      icon: <Users className="w-5 h-5" />,
      title: "团队裂变",
      desc: "发展下级合伙人，享受15%二级佣金"
    },
    {
      icon: <Gift className="w-5 h-5" />,
      title: "专属权益",
      desc: "免费使用全部AI功能 + 专属合伙人群"
    },
    {
      icon: <Crown className="w-5 h-5" />,
      title: "荣誉认证",
      desc: "有劲AI官方认证合伙人身份"
    }
  ];

  // Prepare daily chart data from camp summary
  const chartData = campSummary?.daily_scores?.map((item) => ({
    day: `D${item.day}`,
    score: item.score,
  })) || [];

  // Calculate three-layer growth data
  const getLayerGrowth = () => {
    if (!baseline || !campSummary) return null;
    
    // Convert 1-5 scores to percentage (assuming current scores from summary)
    const baselineBehavior = Math.round(((baseline.behavior_score - 1) / 4) * 100);
    const baselineEmotion = Math.round(((baseline.emotion_score - 1) / 4) * 100);
    const baselineBelief = Math.round(((baseline.belief_score - 1) / 4) * 100);
    
    // Use growth data from summary to calculate current
    const behaviorGrowth = campSummary.behavior_growth || 0;
    const emotionGrowth = campSummary.emotion_growth || 0;
    const beliefGrowth = campSummary.belief_growth || 0;
    
    return {
      behavior: { baseline: baselineBehavior, current: baselineBehavior + behaviorGrowth },
      emotion: { baseline: baselineEmotion, current: baselineEmotion + emotionGrowth },
      belief: { baseline: baselineBelief, current: baselineBelief + beliefGrowth },
    };
  };
  
  const layerGrowth = getLayerGrowth();

  return (
    <>
      <DynamicOGMeta pageKey="campGraduate" />
      
      {/* Achievement Celebration Modal */}
      {showCelebration && newlyEarned.length > 0 && (
        <AchievementCelebration 
          achievementKeys={newlyEarned} 
          onClose={closeCelebration} 
        />
      )}
      
    <div className="min-h-screen bg-gradient-to-b from-amber-50 via-white to-orange-50">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b">
        <div className="flex items-center justify-between p-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="font-semibold">毕业成长报告</h1>
          <div className="w-10" />
        </div>
      </div>

      <div className="p-4 space-y-6 pb-32">
        {/* 未毕业用户引导 */}
        {!isLoading && !graduationData && (
          <Card className="border-0 shadow-lg">
            <CardContent className="p-6 text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-amber-100 rounded-full flex items-center justify-center">
                <GraduationCap className="w-8 h-8 text-amber-500" />
              </div>
              <h3 className="font-semibold text-lg mb-2">还未完成训练营</h3>
              <p className="text-muted-foreground text-sm mb-4">
                完成7天财富觉醒训练营后，即可解锁毕业证书和合伙人专属通道
              </p>
              <Button
                onClick={() => navigate('/wealth-camp-intro')}
                className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
              >
                了解训练营
              </Button>
            </CardContent>
          </Card>
        )}

        {/* 毕业证书展示 - 7天专属样式 */}
        {graduationData && (
        <Card className="border-0 shadow-xl overflow-hidden relative">
          {/* 动态背景 */}
          <div className="absolute inset-0 bg-gradient-to-br from-amber-500 via-orange-500 to-rose-500">
            {/* 动画光晕效果 */}
            <div className="absolute inset-0 opacity-30">
              <div className="absolute top-0 left-1/4 w-64 h-64 bg-white/20 rounded-full blur-3xl animate-pulse" />
              <div className="absolute bottom-0 right-1/4 w-48 h-48 bg-rose-300/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
            </div>
          </div>
          
          <CardContent className="p-0 relative">
            <div className="p-6 text-white text-center relative">
              {/* 装饰边框 */}
              <div className="absolute inset-4 border-2 border-white/20 rounded-2xl pointer-events-none" />
              
              {/* 角落装饰 */}
              <div className="absolute top-6 left-6 w-8 h-8 border-t-2 border-l-2 border-white/40 rounded-tl-lg" />
              <div className="absolute top-6 right-6 w-8 h-8 border-t-2 border-r-2 border-white/40 rounded-tr-lg" />
              <div className="absolute bottom-6 left-6 w-8 h-8 border-b-2 border-l-2 border-white/40 rounded-bl-lg" />
              <div className="absolute bottom-6 right-6 w-8 h-8 border-b-2 border-r-2 border-white/40 rounded-br-lg" />
              
              {/* 飘落的星星动画 */}
              <div className="absolute inset-0 overflow-hidden pointer-events-none">
                {[...Array(6)].map((_, i) => (
                  <Sparkles
                    key={i}
                    className="absolute w-4 h-4 text-white/40 animate-bounce"
                    style={{
                      left: `${15 + i * 15}%`,
                      top: `${10 + (i % 3) * 25}%`,
                      animationDelay: `${i * 0.3}s`,
                      animationDuration: '2s'
                    }}
                  />
                ))}
              </div>
              
              <div className="relative z-10 py-4">
                {/* 毕业帽图标 - 带动画 */}
                <div className="w-20 h-20 mx-auto mb-4 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                  <GraduationCap className="w-10 h-10" />
                </div>
                
                <Badge className="bg-white/20 text-white border-white/30 mb-3 text-sm px-4 py-1">
                  🎓 7天财富觉醒 · 毕业证书
                </Badge>
                
                <h2 className="text-2xl font-bold mb-1 tracking-wide">
                  财富觉醒之旅
                </h2>
                <p className="text-white/80 text-lg mb-2">荣誉毕业证书</p>
                
                {graduationData && (
                  <>
                    <p className="text-white/70 text-sm mb-4">
                      毕业时间：{format(new Date(graduationData.completedAt), 'yyyy年M月d日', { locale: zhCN })}
                    </p>
                    
                    {/* 成就数据卡片 */}
                    <div className="grid grid-cols-3 gap-3 mb-4">
                      <div className="bg-white/15 rounded-2xl p-3 backdrop-blur-sm border border-white/10">
                        <p className="text-2xl font-bold">{graduationData.totalDays}</p>
                        <p className="text-xs text-white/70 mt-1">坚持天数</p>
                      </div>
                      <div className="bg-white/15 rounded-2xl p-3 backdrop-blur-sm border border-white/10">
                        <p className="text-2xl font-bold">{graduationData.journalCount}</p>
                        <p className="text-xs text-white/70 mt-1">财富日记</p>
                      </div>
                      <div className="bg-white/15 rounded-2xl p-3 backdrop-blur-sm border border-white/10">
                        <p className="text-2xl font-bold">
                          {campSummary?.awakening_growth != null 
                            ? (campSummary.awakening_growth >= 0 ? `+${campSummary.awakening_growth}` : campSummary.awakening_growth)
                            : graduationData.awakeningScore}
                        </p>
                        <p className="text-xs text-white/70 mt-1">
                          {campSummary?.awakening_growth != null ? '觉醒成长' : '觉醒指数'}
                        </p>
                      </div>
                    </div>
                    
                    {/* 认证标识 */}
                    <div className="flex items-center justify-center gap-2 text-white/60 text-xs">
                      <span className="w-12 h-px bg-white/30" />
                      <span>有劲AI · 财富教练认证</span>
                      <span className="w-12 h-px bg-white/30" />
                    </div>
                  </>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
        )}

        {/* 以下内容仅毕业用户可见 */}
        {graduationData && (
          <>
        {/* 觉醒曲线可视化 */}
        {chartData.length > 0 && (
          <Card className="border-0 shadow-lg overflow-hidden">
            <CardContent className="p-5">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="w-5 h-5 text-amber-500" />
                <h3 className="font-semibold text-lg">7天觉醒曲线</h3>
                {campSummary?.awakening_growth != null && (
                  <Badge className={`border-0 ml-auto ${campSummary.awakening_growth >= 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-orange-100 text-orange-700'}`}>
                    {campSummary.awakening_growth >= 0 ? `+${campSummary.awakening_growth}` : campSummary.awakening_growth} 成长
                  </Badge>
                )}
              </div>
              
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                    <defs>
                      <linearGradient id="graduateGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <XAxis 
                      dataKey="day" 
                      axisLine={false} 
                      tickLine={false}
                      tick={{ fontSize: 11, fill: '#9ca3af' }}
                    />
                    <YAxis 
                      domain={[0, 100]}
                      axisLine={false} 
                      tickLine={false}
                      tick={{ fontSize: 10, fill: '#9ca3af' }}
                    />
                    {baseline?.awakeningStart != null && (
                      <ReferenceLine 
                        y={baseline.awakeningStart} 
                        stroke="#9ca3af" 
                        strokeDasharray="4 4"
                        label={{ value: 'Day 0', position: 'right', fontSize: 10, fill: '#9ca3af' }}
                      />
                    )}
                    <Area 
                      type="monotone" 
                      dataKey="score" 
                      stroke="none"
                      fill="url(#graduateGradient)" 
                    />
                    <Line 
                      type="monotone" 
                      dataKey="score" 
                      stroke="#f59e0b" 
                      strokeWidth={2.5}
                      dot={{ r: 4, fill: '#f59e0b', strokeWidth: 2, stroke: 'white' }}
                      activeDot={{ r: 6, fill: '#f59e0b' }}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
              
              {/* Start/End comparison */}
              <div className="flex justify-between items-center mt-4 pt-4 border-t text-sm">
                <div className="text-center">
                  <div className="text-muted-foreground text-xs">起点</div>
                  <div className="font-semibold text-lg">{campSummary?.start_awakening ?? baseline?.awakeningStart ?? '--'}</div>
                </div>
                <ArrowRight className="w-5 h-5 text-amber-500" />
                <div className="text-center">
                  <div className="text-muted-foreground text-xs">终点</div>
                  <div className="font-semibold text-lg text-amber-600">{campSummary?.end_awakening ?? graduationData.awakeningScore}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* 三层成长对比 */}
        {layerGrowth && (
          <Card className="border-0 shadow-lg">
            <CardContent className="p-5">
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="w-5 h-5 text-violet-500" />
                <h3 className="font-semibold text-lg">三层突破成长</h3>
              </div>
              
              <div className="space-y-5">
                <GrowthLayerBar 
                  label="行为层" 
                  emoji="🎯"
                  baseline={layerGrowth.behavior.baseline}
                  current={layerGrowth.behavior.current}
                  colorClass="text-amber-600"
                  bgClass="bg-gradient-to-r from-amber-400 to-orange-400"
                />
                <GrowthLayerBar 
                  label="情绪层" 
                  emoji="💗"
                  baseline={layerGrowth.emotion.baseline}
                  current={layerGrowth.emotion.current}
                  colorClass="text-pink-600"
                  bgClass="bg-gradient-to-r from-pink-400 to-rose-400"
                />
                <GrowthLayerBar 
                  label="信念层" 
                  emoji="💡"
                  baseline={layerGrowth.belief.baseline}
                  current={layerGrowth.belief.current}
                  colorClass="text-violet-600"
                  bgClass="bg-gradient-to-r from-violet-400 to-purple-400"
                />
              </div>
            </CardContent>
          </Card>
        )}

        {/* AI教练寄语 */}
        {campSummary?.ai_coach_message && (
          <Card className="border-0 shadow-lg bg-gradient-to-br from-amber-50 to-orange-50">
            <CardContent className="p-5">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                <span className="font-semibold text-amber-800">AI教练寄语</span>
              </div>
              <p className="text-amber-900/80 leading-relaxed text-sm">
                {campSummary.ai_coach_message}
              </p>
            </CardContent>
          </Card>
        )}

        {/* 核心突破 */}
        {campSummary?.biggest_breakthrough && (
          <Card className="border-0 shadow-lg">
            <CardContent className="p-5">
              <div className="flex items-center gap-2 mb-3">
                <Trophy className="w-5 h-5 text-amber-500" />
                <h3 className="font-semibold">核心突破</h3>
              </div>
              <div className="p-4 bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl border border-amber-100">
                <p className="text-amber-900/80 italic">"{campSummary.biggest_breakthrough}"</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* 成就徽章墙 */}
        <AchievementBadgeWall showUnlocked={true} />

        {/* 分享毕业证书 */}
        <WealthInviteCardDialog
          defaultTab="milestone"
          campId={graduationData?.campId}
          currentDay={7}
          trigger={
            <Button className="w-full h-12 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600">
              <Share2 className="w-4 h-4 mr-2" />
              分享我的毕业成就
            </Button>
          }
        />

        {/* 你的蜕变 */}
        <Card className="border-0 shadow-lg">
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <Trophy className="w-5 h-5 text-amber-500" />
              <h3 className="font-semibold text-lg">你的7天蜕变</h3>
            </div>
            
            <div className="space-y-3">
              {[
                "建立了每日觉察财富情绪的习惯",
                "识别并开始转化限制性信念",
                "从「四穷」模式向「四富」模式转变",
                "学会用新视角看待金钱与自我价值"
              ].map((item, index) => (
                <div key={index} className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-muted-foreground">{item}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* 下一步：目标导向续航卡片 */}
        <GraduateContinueCard 
          awakeningGrowth={campSummary?.awakening_growth ?? 0}
          isPartner={false}
        />
          </>
        )}
      </div>
    </div>
    </>
  );
}
