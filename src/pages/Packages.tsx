import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, Sparkles, Zap, Crown, ArrowLeft } from "lucide-react";
import { PurchaseHistory } from "@/components/PurchaseHistory";
import { AccountBalance } from "@/components/AccountBalance";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

const packages = [
  {
    id: 'free',
    name: '免费体验',
    quota: 50,
    price: 0,
    duration: '永久',
    icon: Sparkles,
    popular: false,
    gradient: 'from-gray-400/10 to-gray-500/10',
    features: [
      '50次AI对话',
      '基础情绪记录',
      '简报生成',
      '基础数据分析'
    ]
  },
  {
    id: 'monthly',
    name: '月度套餐',
    quota: 300,
    price: 29,
    duration: '30天',
    icon: Zap,
    popular: true,
    gradient: 'from-primary/20 to-primary/10',
    features: [
      '300次AI对话',
      '高级情绪分析',
      '完整数据导出',
      '标签管理系统',
      '目标设定与追踪',
      '优先客服支持'
    ]
  },
  {
    id: 'youjin365',
    name: '有劲365',
    quota: 1500,
    price: 99,
    duration: '365天',
    icon: Crown,
    popular: false,
    gradient: 'from-amber-400/20 to-orange-500/20',
    features: [
      '1500次AI对话',
      '全部高级功能',
      '专属VIP客服',
      '无限数据导出',
      '深度情绪分析',
      '优先新功能体验',
      '个性化建议'
    ]
  }
];

export default function Packages() {
  const navigate = useNavigate();

  const handlePurchase = (pkg: typeof packages[0]) => {
    toast.info("支付功能开发中", {
      description: "请联系管理员进行充值操作 🌿"
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      {/* 返回按钮 */}
      <div className="container max-w-7xl mx-auto px-4 pt-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/")}
          className="gap-2 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="w-4 h-4" />
          返回首页
        </Button>
      </div>

      <div className="container max-w-7xl mx-auto px-4 py-8 space-y-12">
        {/* 标题区域 */}
        <div className="text-center space-y-4 animate-in fade-in-50 slide-in-from-bottom-4 duration-700">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
            <Sparkles className="w-4 h-4" />
            选择最适合您的套餐
          </div>
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
            开启您的情绪觉醒之旅
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            根据您的使用需求，选择最合适的对话次数套餐，享受专业的情绪管理服务
          </p>
        </div>

        {/* 账户余额 */}
        <div className="flex justify-center animate-in fade-in-50 slide-in-from-bottom-4 duration-700 delay-100">
          <AccountBalance />
        </div>

        {/* 套餐卡片 */}
        <div className="grid md:grid-cols-3 gap-6 lg:gap-8 animate-in fade-in-50 slide-in-from-bottom-4 duration-700 delay-200">
          {packages.map((pkg, index) => {
            const Icon = pkg.icon;
            return (
              <Card 
                key={pkg.id} 
                className={`relative overflow-hidden transition-all duration-300 hover:shadow-xl hover:scale-105 ${
                  pkg.popular 
                    ? 'border-primary shadow-lg shadow-primary/20 ring-2 ring-primary/20' 
                    : 'border-border hover:border-primary/30'
                }`}
                style={{
                  animationDelay: `${index * 100}ms`
                }}
              >
                {/* 推荐标签 */}
                {pkg.popular && (
                  <div className="absolute top-4 right-4 z-10">
                    <div className="bg-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded-full shadow-lg flex items-center gap-1">
                      <Crown className="w-3 h-3" />
                      推荐
                    </div>
                  </div>
                )}

                {/* 背景渐变 */}
                <div className={`absolute inset-0 bg-gradient-to-br ${pkg.gradient} opacity-50`} />

                <CardHeader className="relative">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                        pkg.popular ? 'bg-primary/20' : 'bg-muted'
                      }`}>
                        <Icon className={`w-6 h-6 ${pkg.popular ? 'text-primary' : 'text-muted-foreground'}`} />
                      </div>
                      <CardTitle className="text-2xl">{pkg.name}</CardTitle>
                      <CardDescription className="text-sm">{pkg.duration}有效期</CardDescription>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="relative space-y-6">
                  {/* 价格 */}
                  <div className="space-y-1">
                    <div className="flex items-baseline gap-1">
                      {pkg.price === 0 ? (
                        <span className="text-4xl font-bold text-foreground">免费</span>
                      ) : (
                        <>
                          <span className="text-2xl font-medium text-muted-foreground">¥</span>
                          <span className="text-4xl font-bold text-foreground">{pkg.price}</span>
                        </>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground font-medium">
                      {pkg.quota} 次AI对话
                    </p>
                  </div>

                  {/* 功能列表 */}
                  <ul className="space-y-3">
                    {pkg.features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-3 group">
                        <div className="flex-shrink-0 w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center mt-0.5 group-hover:bg-primary/20 transition-colors">
                          <Check className="h-3 w-3 text-primary" />
                        </div>
                        <span className="text-sm text-foreground leading-relaxed">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>

                <CardFooter className="relative">
                  <Button 
                    className={`w-full transition-all duration-300 ${
                      pkg.popular 
                        ? 'bg-primary hover:bg-primary/90 shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40' 
                        : ''
                    }`}
                    onClick={() => handlePurchase(pkg)}
                    disabled={pkg.price === 0}
                    variant={pkg.popular ? 'default' : 'outline'}
                    size="lg"
                  >
                    {pkg.price === 0 ? '当前套餐' : '立即购买'}
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>

        {/* 购买历史 */}
        <div className="animate-in fade-in-50 slide-in-from-bottom-4 duration-700 delay-300">
          <PurchaseHistory />
        </div>

        {/* 底部说明 */}
        <div className="text-center text-sm text-muted-foreground space-y-2 animate-in fade-in-50 duration-700 delay-400">
          <p>💡 套餐购买后立即生效，对话次数累计计算</p>
          <p>🔒 我们承诺保护您的隐私数据安全</p>
        </div>
      </div>
    </div>
  );
}
