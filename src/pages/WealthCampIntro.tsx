import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet";
import { ArrowLeft, Sparkles, Brain, MessageCircle, Share2, Gift, Heart, Target, Shield, Users, CheckCircle2, Clock, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { StartCampDialog } from "@/components/camp/StartCampDialog";
import { AssessmentFocusCard } from "@/components/wealth-camp/AssessmentFocusCard";
import { useWealthCampAnalytics } from "@/hooks/useWealthCampAnalytics";
import { WechatPayDialog } from "@/components/WechatPayDialog";
import { useCampPurchase } from "@/hooks/useCampPurchase";
import { toast } from "sonner";

const WealthCampIntro = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showStartDialog, setShowStartDialog] = useState(false);
  const [showPayDialog, setShowPayDialog] = useState(false);
  const { trackAssessmentTocamp } = useWealthCampAnalytics();
  
  // 检查用户是否已购买训练营
  const { data: purchaseRecord, refetch: refetchPurchase } = useCampPurchase("wealth_block_21");
  const hasPurchased = !!purchaseRecord;

  // 埋点：页面加载时追踪
  useEffect(() => {
    trackAssessmentTocamp('camp_intro_viewed');
  }, []);

  // Check if user has already joined the camp
  const { data: existingCamp } = useQuery({
    queryKey: ["existing-wealth-camp"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data } = await supabase
        .from("training_camps")
        .select("*")
        .eq("user_id", user.id)
        .eq("camp_type", "wealth_block_21")
        .in("status", ["active", "paused"])
        .maybeSingle();

      return data;
    },
  });

  const hasJoinedCamp = !!existingCamp;

  // Pain points that resonate with users
  const painPoints = [
    "明明知道该行动，却迟迟不动",
    "一想到钱、销售、邀请，就开始抗拒",
    "内心渴望丰盛，但行为始终很保守",
    "忙，却没有真实的积累感",
  ];

  // Daily 4 things
  const dailyFourThings = [
    {
      icon: Brain,
      time: "5-8 分钟",
      title: "财富觉察冥想",
      description: "让你真实感受到：当我面对金钱、价值、流动时，身体和情绪发生了什么。冥想在这里的作用只有一个：让卡点浮现出来。",
      color: "from-purple-500 to-indigo-500",
      bgColor: "bg-purple-50",
    },
    {
      icon: MessageCircle,
      time: "5 分钟",
      title: "财富教练对话",
      description: "完成「财富教练 4 步曲」：看见行为卡点 → 觉察情绪卡点 → 识别信念卡点 → 设计明天最小可进步的行动。",
      color: "from-amber-500 to-orange-500",
      bgColor: "bg-amber-50",
    },
    {
      icon: Share2,
      time: "1 句话",
      title: "打卡与分享",
      description: "「今天在金钱这件事上，我最真实看见的是：____。」真实本身，就是训练。",
      color: "from-teal-500 to-cyan-500",
      bgColor: "bg-teal-50",
    },
    {
      icon: Gift,
      time: "一个选择",
      title: "是否邀请一个人",
      description: "邀请是最轻量、最真实、最容易照见内在反应的行为实验。不是为了成交，而是训练本身。",
      color: "from-rose-500 to-pink-500",
      bgColor: "bg-rose-50",
    },
  ];

  // Invitation principles
  const invitationPrinciples = [
    {
      number: "01",
      title: "邀请是「分享入口」，不是索取结果",
      description: "你邀请的只是一个「体验和看看的机会」。只要你站在这个位置，邀请就不会变成压力。",
    },
    {
      number: "02",
      title: "邀请是对自己诚实，不是对别人负责",
      description: "每天邀请，真正被训练的不是对方，而是你自己：我敢不敢把我觉得有价值的东西递出去？",
    },
    {
      number: "03",
      title: "邀请是「照见卡点」，不是完成任务",
      description: "如果你发现自己不敢邀请、想拖延、想逃避——这不是失败，而是当天最重要的训练内容。",
    },
  ];

  // Coach value when not inviting
  const coachValues = [
    {
      icon: Target,
      title: "帮你看清：我在害怕什么？",
      description: "不是「我不自律」，而是：我怕被拒绝？我怕显得功利？我觉得自己还不够好？这些，才是真正的财富卡点。",
    },
    {
      icon: Zap,
      title: "帮你把模糊的不舒服，变成清晰的信念",
      description: "「我不配得」「谈钱会破坏关系」「我不应该为此收回报」——信念一旦被看见，就开始松动。",
    },
    {
      icon: CheckCircle2,
      title: "帮你设计「不邀请也算进步」的最小行动",
      description: "有时候，你的进步可能只是：想清楚要邀请谁、写好一句真实的话、或承认今天我还没准备好。不逃避这件事，本身就是进步。",
    },
  ];

  // Target audience
  const targetAudience = [
    "你不排斥赚钱，但排斥「推销自己」",
    "你感觉自己很努力，但财富始终卡住",
    "你希望一条不违背价值观的财富路径",
    "你想要的是长期改变，而不是一次刺激",
  ];

  return (
    <>
      <Helmet>
        <title>21天财富觉醒训练营 - 有劲AI</title>
        <meta name="description" content="每天15分钟，21天持续陪伴。通过财富觉察冥想、AI教练对话、打卡分享，帮你看见行为、情绪、信念上的财富卡点，走出卡住的位置。" />
        <meta name="keywords" content="财富觉醒,财富训练营,财富教练,金钱观,财富信念,有劲AI,21天训练营,财富突破,财富觉察" />
        <meta property="og:title" content="21天财富觉醒训练营 - 有劲AI" />
        <meta property="og:description" content="不是逼你赚钱，而是帮你走出卡住的位置。每天15分钟，AI教练陪你唤醒财富能量。" />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://eugeneai.me/wealth-camp-intro" />
        <link rel="canonical" href="https://eugeneai.me/wealth-camp-intro" />
      </Helmet>
      <div className="min-h-screen bg-gradient-to-b from-amber-50 via-orange-50/30 to-white">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-amber-100">
        <div className="flex items-center justify-between px-4 py-3">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-amber-700">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <span className="text-sm text-amber-600 font-medium">21天训练营</span>
          <div className="w-9" />
        </div>
      </div>

      <div className="pb-28">
        {/* Hero Section */}
        <section className="relative px-6 pt-8 pb-10 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-amber-400/20 via-orange-300/10 to-transparent" />
          <div className="absolute top-4 right-4 w-32 h-32 bg-gradient-to-br from-amber-200/40 to-orange-200/40 rounded-full blur-3xl" />
          
          <div className="relative">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-medium mb-4">
              <Sparkles className="w-3.5 h-3.5" />
              每天15分钟 · 21天持续陪伴
            </div>
            
            <h1 className="text-2xl font-bold text-foreground mb-3">
              财富觉醒训练营
            </h1>
            
            <p className="text-lg text-amber-700 font-medium mb-4">
              不是逼你赚钱，<br />
              而是帮你走出「卡住的位置」
            </p>
            
            <p className="text-muted-foreground leading-relaxed">
              很多人不是赚不到钱，<br />
              而是每天都卡在同一个地方，<br />
              却从来没有被真正看见。
            </p>
          </div>
        </section>

        {/* Personalized Assessment Focus - 基于测评结果的个性化重点 */}
        <AssessmentFocusCard variant="intro" className="mx-6" />

        {/* Pain Points Section */}
        <section className="px-6 py-8">
          <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
            你可能很努力、很有责任感、也不断学习成长，<br />
            但在「财富」这件事上，反复出现这些状态：
          </p>
          
          <div className="space-y-3">
            {painPoints.map((point, index) => (
              <div 
                key={index}
                className="flex items-start gap-3 p-3 bg-white/60 backdrop-blur rounded-xl border border-amber-100"
              >
                <div className="w-5 h-5 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <div className="w-2 h-2 rounded-full bg-amber-500" />
                </div>
                <p className="text-foreground text-sm">{point}</p>
              </div>
            ))}
          </div>
          
          <div className="mt-6 p-4 bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl border border-amber-200">
            <p className="text-foreground text-sm leading-relaxed">
              <span className="font-semibold text-amber-700">这不是能力问题，</span><br />
              而是财富在你身上的流动，被某个地方卡住了。
            </p>
          </div>
        </section>

        {/* Core Positioning */}
        <section className="px-6 py-8 bg-white/50">
          <h2 className="text-lg font-bold text-foreground mb-4">
            这个训练营，到底在做什么？
          </h2>
          
          <div className="space-y-4 text-sm text-muted-foreground leading-relaxed">
            <p>
              这不是一个教你「如何快速赚钱」的课程，<br />
              而是一套<span className="text-amber-700 font-medium">每天可执行、可持续的财富觉察与行动系统</span>。
            </p>
            
            <div className="p-4 bg-gradient-to-r from-amber-100/80 to-orange-100/80 rounded-2xl">
              <p className="text-amber-800 font-medium text-center">
                我们只做一件事：
              </p>
              <p className="text-amber-700 text-center mt-2">
                每天，帮助你看见：<br />
                你在行为、情绪、信念上的真实财富卡点，<br />
                并陪你向前迈出一个<br />
                「不消耗自己的小进步」。
              </p>
            </div>
            
            <p className="text-center text-muted-foreground">
              不是突破式改变，<br />
              而是<span className="text-amber-700 font-medium">真实、可持续的转化</span>。
            </p>
          </div>
        </section>

        {/* Daily 4 Things */}
        <section className="px-6 py-8">
          <h2 className="text-lg font-bold text-foreground mb-2">
            每天做哪四件事？
          </h2>
          <p className="text-sm text-muted-foreground mb-6">
            这四件事不是任务，而是一条「从内在 → 到现实」的自然路径。
          </p>
          
          <div className="space-y-4">
            {dailyFourThings.map((item, index) => (
              <div 
                key={index}
                className={`p-4 rounded-2xl ${item.bgColor} border border-white/50`}
              >
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${item.color} flex items-center justify-center flex-shrink-0`}>
                    <item.icon className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {item.time}
                      </span>
                    </div>
                    <h3 className="font-semibold text-foreground mb-2">{item.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Why Invitation Section */}
        <section className="px-6 py-8 bg-gradient-to-b from-rose-50/50 to-white">
          <h2 className="text-lg font-bold text-foreground mb-4">
            为什么这个训练营<br />一定要包含「每天邀请」？
          </h2>
          
          <div className="p-4 bg-white/80 backdrop-blur rounded-2xl border border-rose-100 mb-6">
            <p className="text-sm text-muted-foreground leading-relaxed">
              因为：<br /><br />
              财富不是只在内在发生，<br />
              它必须在现实中「流动一次」，<br />
              你才能真正看见自己的卡点。<br /><br />
              <span className="text-rose-600 font-medium">
                邀请，是最轻量、最真实、最容易照见内在反应的行为实验。
              </span>
            </p>
          </div>
          
          <h3 className="text-base font-semibold text-foreground mb-4">
            每天邀请的 3 个核心原则
          </h3>
          
          <div className="space-y-4">
            {invitationPrinciples.map((principle, index) => (
              <div 
                key={index}
                className="p-4 bg-white/80 backdrop-blur rounded-2xl border border-rose-100"
              >
                <div className="flex items-start gap-3">
                  <span className="text-2xl font-bold text-rose-200">{principle.number}</span>
                  <div>
                    <h4 className="font-semibold text-foreground text-sm mb-1">
                      {principle.title}
                    </h4>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {principle.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Coach Value Section */}
        <section className="px-6 py-8">
          <h2 className="text-lg font-bold text-foreground mb-2">
            如果今天「不想邀请」，<br />这个训练营还对我有价值吗？
          </h2>
          
          <div className="p-4 bg-gradient-to-r from-amber-100 to-orange-100 rounded-2xl mb-6">
            <p className="text-amber-800 font-semibold text-center">
              答案是：非常有价值。
            </p>
            <p className="text-amber-700 text-sm text-center mt-1">
              这正是有劲AI · 财富教练存在的意义。
            </p>
          </div>
          
          <p className="text-sm text-muted-foreground mb-4">
            当你不想邀请、抗拒邀请、甚至逃避邀请时，<br />
            财富教练不会催你、不会纠正你、不会评判你。<br />
            它只会陪你做三件事：
          </p>
          
          <div className="space-y-4">
            {coachValues.map((value, index) => (
              <div 
                key={index}
                className="p-4 bg-white/60 backdrop-blur rounded-2xl border border-amber-100"
              >
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-orange-400 flex items-center justify-center flex-shrink-0">
                    <value.icon className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground text-sm mb-1">
                      {value.title}
                    </h4>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {value.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Partner Identity Section */}
        <section className="px-6 py-8 bg-gradient-to-b from-emerald-50/50 to-white">
          <h2 className="text-lg font-bold text-foreground mb-4">
            为什么从「有劲合伙人」<br />这个统一身份开始？
          </h2>
          
          <div className="p-4 bg-white/80 backdrop-blur rounded-2xl border border-emerald-100">
            <p className="text-sm text-muted-foreground leading-relaxed mb-4">
              在这里，你不需要成为：<br />
              <span className="line-through text-muted-foreground/60">老师</span> · 
              <span className="line-through text-muted-foreground/60">销售</span> · 
              <span className="line-through text-muted-foreground/60">专家</span>
            </p>
            
            <div className="p-3 bg-gradient-to-r from-emerald-100 to-teal-100 rounded-xl">
              <p className="text-emerald-800 font-medium text-center">
                你只会被邀请进入一个安全、清晰的身份：
              </p>
              <p className="text-emerald-700 text-center mt-1 flex items-center justify-center gap-2">
                <Users className="w-4 h-4" />
                <span className="font-semibold">有劲合伙人 — 价值的连接者</span>
              </p>
            </div>
            
            <p className="text-sm text-muted-foreground leading-relaxed mt-4">
              当你帮助他人进入成长与改变，<br />
              系统会通过有劲合伙人分成计划，<br />
              让价值被记录、被承接、被回馈。<br /><br />
              <span className="text-emerald-600 font-medium">
                利他，不再只靠自觉，而是被结构支持。
              </span>
            </p>
          </div>
        </section>

        {/* Target Audience Section */}
        <section className="px-6 py-8">
          <h2 className="text-lg font-bold text-foreground mb-4">
            这个训练营，适合谁？
          </h2>
          
          <p className="text-sm text-muted-foreground mb-4">
            如果你符合以下任何一条，这里都适合你：
          </p>
          
          <div className="space-y-3">
            {targetAudience.map((item, index) => (
              <div 
                key={index}
                className="flex items-center gap-3 p-3 bg-white/60 backdrop-blur rounded-xl border border-amber-100"
              >
                <CheckCircle2 className="w-5 h-5 text-amber-500 flex-shrink-0" />
                <p className="text-foreground text-sm">{item}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Final CTA Section */}
        <section className="px-6 py-8">
          <div className="p-6 bg-gradient-to-br from-amber-100 via-orange-50 to-amber-50 rounded-3xl border border-amber-200">
            <div className="text-center">
              <h3 className="text-lg font-bold text-foreground mb-3">
                《财富觉醒训练营》
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                不是要求你每天完成什么，<br />
                而是陪你每天<br />
                <span className="text-amber-700 font-medium">不再逃避你在财富面前的真实反应。</span>
              </p>
              <p className="text-sm text-amber-600 mt-4 font-medium">
                当你敢看见、敢承认、敢前进一步，<br />
                邀请会自然发生，<br />
                财富也会开始流动。
              </p>
            </div>
          </div>
        </section>
      </div>

      {/* Sticky Bottom CTA */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/95 backdrop-blur-lg border-t border-amber-100 z-20">
        <div className="max-w-md mx-auto">
          {hasJoinedCamp ? (
            <Button
              onClick={() => navigate("/wealth-camp-checkin")}
              className="w-full h-12 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white rounded-xl font-medium text-base"
            >
              继续我的训练营
            </Button>
          ) : hasPurchased ? (
            <Button
              onClick={() => {
                trackAssessmentTocamp('camp_join_clicked');
                setShowStartDialog(true);
              }}
              className="w-full h-12 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white rounded-xl font-medium text-base"
            >
              开始训练营
            </Button>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center justify-center gap-2">
                <span className="text-muted-foreground line-through text-sm">¥399</span>
                <span className="text-2xl font-bold text-amber-600 dark:text-amber-400">¥299</span>
                <span className="text-xs bg-red-500 text-white px-1.5 py-0.5 rounded animate-pulse">限时优惠</span>
              </div>
              <Button
                onClick={() => {
                  trackAssessmentTocamp('camp_join_clicked');
                  setShowPayDialog(true);
                }}
                className="w-full h-12 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white rounded-xl font-medium text-base"
              >
                ¥299 开启21天训练营
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* WeChat Pay Dialog */}
      <WechatPayDialog
        open={showPayDialog}
        onOpenChange={setShowPayDialog}
        packageInfo={{
          key: 'camp-wealth_block_21',
          name: '财富觉醒训练营',
          price: 299
        }}
        onSuccess={() => {
          setShowPayDialog(false);
          toast.success("购买成功！请选择开始日期");
          refetchPurchase();
          queryClient.invalidateQueries({ queryKey: ['camp-purchase', 'wealth_block_21'] });
          setShowStartDialog(true);
        }}
      />

      {/* Start Camp Dialog */}
      <StartCampDialog
        open={showStartDialog}
        onOpenChange={setShowStartDialog}
        campTemplate={{
          camp_type: "wealth_block_21",
          camp_name: "财富觉醒训练营",
          duration_days: 21,
          icon: "💰",
          price: 299,
          original_price: 399,
          price_note: "限时优惠",
        }}
        onSuccess={(campId) => {
          trackAssessmentTocamp('camp_joined', { camp_id: campId });
          navigate("/wealth-camp-checkin");
        }}
      />
    </div>
    </>
  );
};

export default WealthCampIntro;
