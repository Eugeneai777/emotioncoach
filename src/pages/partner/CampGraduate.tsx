import { useNavigate } from "react-router-dom";
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
  Share2
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { zhCN } from "date-fns/locale";
import WealthInviteCardDialog from "@/components/wealth-camp/WealthInviteCardDialog";
import { useWealthCampAnalytics } from "@/hooks/useWealthCampAnalytics";

interface GraduationData {
  campName: string;
  completedAt: string;
  totalDays: number;
  journalCount: number;
  awakeningScore: number;
}

export default function CampGraduate() {
  const navigate = useNavigate();
  const [graduationData, setGraduationData] = useState<GraduationData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { trackEvent } = useWealthCampAnalytics();

  // 页面访问埋点
  useEffect(() => {
    trackEvent('graduate_page_viewed');
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
          .order('completed_at', { ascending: false })
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
            campName: '财富觉醒训练营',
            completedAt: camp.updated_at, // 使用 updated_at 作为完成时间
            totalDays: 7,
            journalCount: journalCount || 0,
            awakeningScore
          });
          
          // 埋点：21天毕业完成
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

  return (
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
          <h1 className="font-semibold">毕业生专属通道</h1>
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
                <div className="w-24 h-24 mx-auto mb-4 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm animate-bounce" style={{ animationDuration: '3s' }}>
                  <GraduationCap className="w-12 h-12" />
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
                    <p className="text-white/70 text-sm mb-6">
                      毕业时间：{format(new Date(graduationData.completedAt), 'yyyy年M月d日', { locale: zhCN })}
                    </p>
                    
                    {/* 成就数据卡片 */}
                    <div className="grid grid-cols-3 gap-3 mb-4">
                      <div className="bg-white/15 rounded-2xl p-4 backdrop-blur-sm border border-white/10">
                        <p className="text-3xl font-bold">{graduationData.totalDays}</p>
                        <p className="text-xs text-white/70 mt-1">坚持天数</p>
                      </div>
                      <div className="bg-white/15 rounded-2xl p-4 backdrop-blur-sm border border-white/10">
                        <p className="text-3xl font-bold">{graduationData.journalCount}</p>
                        <p className="text-xs text-white/70 mt-1">财富日记</p>
                      </div>
                      <div className="bg-white/15 rounded-2xl p-4 backdrop-blur-sm border border-white/10">
                        <p className="text-3xl font-bold">{graduationData.awakeningScore}</p>
                        <p className="text-xs text-white/70 mt-1">觉醒指数</p>
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
        {/* 分享毕业证书 */}
        <WealthInviteCardDialog
          defaultTab="milestone"
          trigger={
            <Button variant="outline" className="w-full h-12">
              <Share2 className="w-4 h-4 mr-2" />
              分享毕业证书到朋友圈
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

        {/* 下一步：成为合伙人 */}
        <Card className="border-0 shadow-xl overflow-hidden">
          <div className="h-1.5 bg-gradient-to-r from-emerald-500 to-teal-500" />
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-5 h-5 text-emerald-500" />
              <h3 className="font-semibold text-lg">你的下一步</h3>
            </div>
            
            <p className="text-muted-foreground text-sm mb-4">
              你已经亲身体验了财富觉醒的力量。现在，你可以成为<strong className="text-foreground">有劲合伙人</strong>，
              帮助更多人开启财富觉醒之旅，同时获得可观收益。
            </p>

            {/* 合伙人权益 */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              {partnerBenefits.map((benefit, index) => (
                <div
                  key={index}
                  className="p-3 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl"
                >
                  <div className="p-2 bg-emerald-100 rounded-lg w-fit mb-2 text-emerald-600">
                    {benefit.icon}
                  </div>
                  <h4 className="font-medium text-sm mb-0.5">{benefit.title}</h4>
                  <p className="text-xs text-muted-foreground">{benefit.desc}</p>
                </div>
              ))}
            </div>

            {/* 收益预估 */}
            <div className="p-4 bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl mb-4">
              <h4 className="font-medium text-sm text-amber-800 mb-2">💰 收益预估</h4>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">每月推荐10位学员</span>
                  <span className="font-semibold text-amber-700">≈ ¥897/月</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">发展5位下级合伙人</span>
                  <span className="font-semibold text-amber-700">+¥1,500/月</span>
                </div>
              </div>
            </div>

            {/* CTA */}
            <Button
              onClick={() => navigate('/partner/youjin-plan')}
              className="w-full h-12 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white"
            >
              了解有劲合伙人计划
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </CardContent>
        </Card>

        {/* 其他选择 */}
        <div className="space-y-3">
          <Button
            variant="outline"
            className="w-full h-11"
            onClick={() => navigate('/packages')}
          >
            <Crown className="w-4 h-4 mr-2" />
            升级365会员，继续深度使用
          </Button>
          
          <Button
            variant="ghost"
            className="w-full text-muted-foreground"
            onClick={() => navigate('/wealth-journal')}
          >
            查看我的财富日记
          </Button>
        </div>
          </>
        )}
      </div>
    </div>
  );
}
