import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Flower2, Target, Sparkles, LogIn, LogOut, Loader2, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useAssessmentPurchase } from "@/hooks/useAssessmentPurchase";
import { supabase } from "@/integrations/supabase/client";
import { PageTour } from "@/components/PageTour";
import { usePageTour } from "@/hooks/usePageTour";
import { pageTourConfig } from "@/config/pageTourConfig";
import { toast } from "sonner";

const benefits = [
  {
    step: 1,
    title: "财富卡点测评",
    icon: Target,
    description: "30道深度测评，找到你的潜意识财富信念卡点",
    buttonText: "进入财富卡点测评",
    path: "/wealth-block",
    gradient: "from-amber-500 to-orange-500",
    bgGradient: "from-amber-50 to-orange-50",
  },
  {
    step: 2,
    title: "财富觉醒训练营",
    icon: Sparkles,
    description: "7天系统训练 + 每日冥想 + AI教练陪伴",
    buttonText: "进入财富觉醒训练营",
    path: "/wealth-camp-intro",
    gradient: "from-violet-500 to-purple-500",
    bgGradient: "from-violet-50 to-purple-50",
  },
  {
    step: 3,
    title: "成为合伙人",
    icon: Flower2,
    description: "三大训练营 + 1对1教练辅导 + 分销佣金",
    buttonText: "了解绽放合伙人",
    path: "/partner",
    gradient: "from-rose-500 to-pink-500",
    bgGradient: "from-rose-50 to-pink-50",
  },
];

const BloomPartnerIntro = () => {
  const navigate = useNavigate();
  const { user, loading, signOut } = useAuth();
  const { showTour, completeTour } = usePageTour('bloom_partner_intro');
  const { data: purchaseRecord, refetch: refetchPurchase } = useAssessmentPurchase();
  const [claiming, setClaiming] = useState(false);

  const handleWealthBlockClick = async () => {
    if (!user) {
      navigate(`/auth?mode=phone_only&redirect=${encodeURIComponent('/wealth-block')}`);
      return;
    }

    // Already purchased → go directly
    if (purchaseRecord) {
      navigate('/wealth-block');
      return;
    }

    // Try auto-claim bloom invitation
    setClaiming(true);
    try {
      const { data } = await supabase.functions.invoke('auto-claim-bloom-invitation');
      if (data?.matched && data?.success) {
        toast.success(data.message || '邀请码已自动兑换，权益已激活！');
        await refetchPurchase();
      }
    } catch (err) {
      console.error('Auto-claim failed:', err);
    } finally {
      setClaiming(false);
    }
    navigate('/wealth-block');
  };

  const handleCardClick = (path: string) => {
    if (path === '/wealth-block') {
      handleWealthBlockClick();
      return;
    }
    if (user) {
      navigate(path);
    } else {
      navigate(`/auth?mode=phone_only&redirect=${encodeURIComponent(path)}`);
    }
  };

  const handleLogin = () => {
    navigate("/auth?mode=phone_only&redirect=%2Fbloom-partner-intro");
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-rose-50 via-pink-50 to-purple-50">
      {/* Header */}
      <div className="pt-12 pb-6 text-center px-4">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-rose-400 to-pink-500 shadow-lg mb-4">
          <Flower2 className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-2xl font-bold text-foreground">财富觉醒 3 部曲</h1>
      </div>

      {/* Auth Status - Above Cards */}
      <div className="px-4 pb-4 max-w-md mx-auto">
        {!loading && !user && (
          <div className="rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200/60 p-4 space-y-3">
            <div className="flex items-center gap-2 text-blue-700">
              <LogIn className="w-4 h-4" />
              <span className="text-sm font-medium">请先登录后体验全部权益</span>
            </div>
            <Button
              onClick={handleLogin}
              className="w-full rounded-xl bg-gradient-to-r from-blue-500 to-indigo-500 hover:opacity-90 text-white border-0"
            >
              <LogIn className="w-4 h-4 mr-1.5" />
              手机号登录
            </Button>
          </div>
        )}
        {!loading && user && (
          <div className="rounded-2xl bg-gradient-to-r from-emerald-50 to-green-50 border border-emerald-200/60 p-3 flex items-center justify-between">
            <span className="text-sm text-emerald-700 font-medium">✅ 已登录，点击下方卡片即可进入</span>
            <button onClick={signOut} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
              <LogOut className="w-3.5 h-3.5" />
              退出登录
            </button>
          </div>
        )}
      </div>

      {/* Benefit Cards */}
      <div className="px-4 pb-12 space-y-4 max-w-md mx-auto">
        {benefits.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.title}
              className="bg-white/80 backdrop-blur-sm rounded-2xl border border-white/60 shadow-sm overflow-hidden"
            >
              <div className={`bg-gradient-to-r ${item.bgGradient} p-4 pb-3`}>
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${item.gradient} flex items-center justify-center shadow-sm`}>
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    <span className={`absolute -top-1.5 -left-1.5 w-5 h-5 rounded-full bg-gradient-to-br ${item.gradient} text-white text-[10px] font-bold flex items-center justify-center shadow ring-2 ring-white`}>
                      {item.step}
                    </span>
                  </div>
                  <h3 className="font-semibold text-foreground">{item.title}</h3>
                  {item.path === '/wealth-block' && user && (
                    purchaseRecord ? (
                      <span className="ml-auto inline-flex items-center gap-1 text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                        <CheckCircle className="w-3 h-3" />已解锁
                      </span>
                    ) : (
                      <span className="ml-auto text-xs font-medium text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                        需付费¥9.9
                      </span>
                    )
                  )}
                </div>
              </div>
              <div className="px-4 pb-4 pt-2">
                <p className="text-sm text-muted-foreground mb-3">{item.description}</p>
                <Button
                  onClick={() => handleCardClick(item.path)}
                  className={`w-full rounded-xl bg-gradient-to-r ${item.gradient} hover:opacity-90 text-white border-0`}
                  disabled={loading || (item.path === '/wealth-block' && claiming)}
                >
                  {item.path === '/wealth-block' && claiming ? (
                    <><Loader2 className="w-4 h-4 mr-1.5 animate-spin" />检查权益中...</>
                  ) : (
                    item.buttonText
                  )}
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      <PageTour
        open={showTour}
        onComplete={completeTour}
        steps={pageTourConfig.bloom_partner_intro}
        pageTitle="绽放合伙人"
      />
    </div>
  );
};

export default BloomPartnerIntro;
