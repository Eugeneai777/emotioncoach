import { useNavigate } from "react-router-dom";
import { DynamicOGMeta } from "@/components/common/DynamicOGMeta";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { HeartHandshake, Bell, Shield, Users, Clock, Check, ArrowRight, Share2 } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import { IntroShareDialog } from "@/components/common/IntroShareDialog";
import { introShareConfigs } from "@/config/introShareConfig";
import { useAuth } from "@/hooks/useAuth";
import { usePackagePurchased } from "@/hooks/usePackagePurchased";

const AliveCheckIntro = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { data: hasPurchased, isLoading: purchaseLoading } = usePackagePurchased('alive_check');
  
  // 是否显示轻模式入口（未登录或未购买）
  const showLiteEntry = !authLoading && !purchaseLoading && (!user || !hasPurchased);

  // 核心功能
  const features = [
    {
      icon: <HeartHandshake className="w-6 h-6" />,
      title: "每日安全确认",
      description: "一键打卡表示「我活得很好」，建立安全确认习惯",
      gradient: "from-rose-500 to-pink-500"
    },
    {
      icon: <Bell className="w-6 h-6" />,
      title: "自动邮件通知",
      description: "连续多天未打卡时，系统自动通知您设定的紧急联系人",
      gradient: "from-pink-500 to-fuchsia-500"
    },
    {
      icon: <Clock className="w-6 h-6" />,
      title: "灵活阈值设置",
      description: "自定义未打卡天数阈值（1-14天），适应不同生活节奏",
      gradient: "from-fuchsia-500 to-purple-500"
    },
    {
      icon: <Users className="w-6 h-6" />,
      title: "多联系人支持",
      description: "最多设置5位紧急联系人，多重保障更安心",
      gradient: "from-purple-500 to-rose-500"
    }
  ];

  // 适合人群
  const targetAudience = [
    { emoji: "🏠", text: "独居者", desc: "独自生活，需要有人牵挂" },
    { emoji: "✈️", text: "远离家人的游子", desc: "在外打拼，让家人安心" },
    { emoji: "👴", text: "空巢老人", desc: "子女不在身边，保持联系" },
    { emoji: "💼", text: "经常出差的职场人", desc: "行程繁忙，确保安全" },
    { emoji: "🌍", text: "异国留学/工作者", desc: "跨时区生活，定期报平安" }
  ];

  // 使用流程
  const steps = [
    { num: "01", title: "设置联系人", desc: "添加1-5位紧急联系人的姓名和邮箱" },
    { num: "02", title: "每天打卡", desc: "点击「我活得很好」按钮完成安全确认" },
    { num: "03", title: "自动守护", desc: "连续未打卡超过阈值天数时，联系人收到提醒" }
  ];

  return (
    <div className="h-screen overflow-y-auto overscroll-contain bg-gradient-to-b from-rose-50 via-pink-50 to-fuchsia-50 relative" style={{ WebkitOverflowScrolling: 'touch' }}>
      <DynamicOGMeta pageKey="aliveCheckIntro" />
      
      {/* Header */}
      <PageHeader title="安全打卡介绍" showBack rightActions={
        introShareConfigs.aliveCheck && (
          <IntroShareDialog config={introShareConfigs.aliveCheck} />
        )
      } />

      <div className="max-w-lg mx-auto px-4 py-6 space-y-6 relative z-10">
        {/* Hero Section */}
        <div className="text-center space-y-4">
          <div className="relative inline-block">
            <div className="absolute inset-0 bg-gradient-to-br from-rose-400 to-pink-400 rounded-2xl blur-lg opacity-40 animate-pulse" />
            <div className="relative inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-rose-400 via-pink-400 to-fuchsia-400 shadow-lg">
              <span className="text-4xl">💗</span>
            </div>
          </div>
          
          <div className="space-y-2">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-rose-600 via-pink-600 to-fuchsia-600 bg-clip-text text-transparent">
              「死了吗」安全打卡
            </h1>
            <p className="text-rose-600 font-medium">
              让关心你的人安心，让你关心的人放心
            </p>
          </div>
          
          <Card className="border-0 shadow-md bg-white/60 backdrop-blur-sm">
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground leading-relaxed">
                每天一次安全确认，如果连续多天失联，系统会自动通知您的紧急联系人。
                <span className="font-medium text-rose-600">简单的习惯，守护重要的人。</span>
              </p>
            </CardContent>
          </Card>
        </div>

        {/* 核心功能 */}
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <span className="text-xl">✨</span>
            <h2 className="text-lg font-bold text-foreground">核心功能</h2>
          </div>
          
          <div className="grid gap-3">
            {features.map((feature, idx) => (
              <Card key={idx} className="border-0 shadow-lg bg-white/60 backdrop-blur-sm overflow-hidden">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className={`p-2.5 rounded-xl bg-gradient-to-br ${feature.gradient} text-white shadow-lg flex-shrink-0`}>
                      {feature.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-foreground">{feature.title}</h3>
                      <p className="text-sm text-muted-foreground mt-1">{feature.description}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* 适合人群 */}
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <span className="text-xl">👥</span>
            <h2 className="text-lg font-bold text-foreground">适合人群</h2>
          </div>
          
          <Card className="border-0 shadow-lg bg-white/60 backdrop-blur-sm">
            <CardContent className="p-4 space-y-3">
              {targetAudience.map((item, idx) => (
                <div key={idx} className="flex items-center gap-3 p-3 bg-gradient-to-r from-rose-50/80 to-pink-50/80 rounded-xl border border-rose-100/50">
                  <span className="text-2xl">{item.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <span className="font-medium text-foreground">{item.text}</span>
                    <p className="text-xs text-muted-foreground">{item.desc}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </section>

        {/* 使用流程 */}
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <span className="text-xl">📋</span>
            <h2 className="text-lg font-bold text-foreground">使用流程</h2>
          </div>
          
          <Card className="border-0 shadow-lg bg-white/60 backdrop-blur-sm">
            <CardContent className="p-4 space-y-4">
              {steps.map((step, idx) => (
                <div key={idx} className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-rose-500 to-pink-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                    {step.num}
                  </div>
                  <div className="flex-1 pt-1">
                    <h3 className="font-semibold text-foreground">{step.title}</h3>
                    <p className="text-sm text-muted-foreground">{step.desc}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </section>

        {/* 隐私保护 */}
        <section className="space-y-3">
          <Card className="border-0 shadow-lg bg-gradient-to-br from-rose-100/80 to-pink-100/80 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <Shield className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-rose-800">隐私保护</h3>
                  <p className="text-sm text-rose-700 mt-1">
                    您的打卡记录仅用于安全监测，联系人邮箱仅在紧急情况下使用，不会用于任何其他目的。
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* CTA区域 */}
        <section className="space-y-3 pb-8">
          <Button 
            onClick={() => navigate('/auth?redirect=/alive-check')}
            className="w-full bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white shadow-lg h-12 text-base font-semibold"
          >
            立即开启
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
          
          <Button 
            variant="outline" 
            onClick={() => navigate('/')}
            className="w-full border-rose-200 text-rose-700 hover:bg-rose-50"
          >
            返回首页
          </Button>
          
          <p className="text-xs text-center text-muted-foreground">
            💡 需要注册/登录后使用，您的数据安全有保障
          </p>
          
          {/* 轻模式入口 */}
          {showLiteEntry && (
            <div className="mt-6 pt-4 border-t border-rose-200/30 space-y-3 text-center">
              <a 
                href="/alive-check-lite" 
                className="text-muted-foreground text-sm block hover:text-rose-600 transition-colors"
              >
                💡 先体验后付费 ¥9.9
              </a>
              <p className="text-muted-foreground text-xs">
                北京好企劲商务信息咨询有限公司 京ICP备2023001408号-5
              </p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default AliveCheckIntro;
