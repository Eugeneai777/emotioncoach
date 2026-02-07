import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { DynamicOGMeta } from "@/components/common/DynamicOGMeta";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Check, TrendingUp, Users, Gift, Clock, Share2, Sparkles } from "lucide-react";
import { IntroShareDialog } from "@/components/common/IntroShareDialog";
import { introShareConfigs } from "@/config/introShareConfig";
import { youjinPartnerLevels } from "@/config/partnerLevels";
import { toast } from "sonner";
import { UnifiedPayDialog } from "@/components/UnifiedPayDialog";
import { usePaymentCallback } from "@/hooks/usePaymentCallback";
import { ResponsiveComparison } from "@/components/ui/responsive-comparison";
import { usePartner } from "@/hooks/usePartner";
import { 
  experiencePackageItems, 
  commissionableProducts, 
  totalCommissionableCount 
} from "@/config/youjinPartnerProducts";

// 等级顺序映射
const levelOrder: Record<string, number> = { 'L1': 1, 'L2': 2, 'L3': 3 };

export default function YoujinPartnerIntro() {
  const navigate = useNavigate();
  const { partner, isExpired, daysUntilExpiry } = usePartner();
  const [payDialogOpen, setPayDialogOpen] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<{
    key: string;
    name: string;
    price: number;
  } | null>(null);

  // 判断是否已是有劲合伙人
  const isYoujinPartner = partner?.partner_type === 'youjin' && (partner?.status === 'active' || isExpired);
  const currentLevel = isYoujinPartner ? partner.partner_level : null;

  // 处理小程序支付成功回调
  const { isPaymentCallback } = usePaymentCallback({
    onSuccess: () => {
      console.log('[YoujinPartnerIntro] Payment callback success');
      const msg = isExpired ? '续费成功！佣金权益已恢复' : isYoujinPartner ? '续费成功！' : '恭喜您成为有劲合伙人！';
      toast.success(msg);
      setPayDialogOpen(false);
      navigate('/partner');
    },
    showToast: false,
    showConfetti: true,
    autoRedirect: false,
  });

  // 小程序支付回调时关闭弹窗
  useEffect(() => {
    if (isPaymentCallback) {
      setPayDialogOpen(false);
    }
  }, [isPaymentCallback]);

  // 判断按钮状态 - 续费时允许选择任意等级
  const getButtonState = (levelId: string) => {
    if (!currentLevel) return 'purchase'; // 未购买
    
    // 已过期或需要续费时，所有等级都可选
    if (isExpired) return levelId === currentLevel ? 'renew' : 'renew_switch';
    
    const currentOrder = levelOrder[currentLevel] || 0;
    const targetOrder = levelOrder[levelId] || 0;
    
    if (targetOrder === currentOrder) return 'renew'; // 同等级续费
    return 'renew_switch'; // 切换等级续费（不再区分升降级）
  };

  const handlePurchase = (levelId: string) => {
    const level = youjinPartnerLevels.find(l => l.level === levelId);
    if (!level) return;

    setSelectedPackage({
      key: `youjin_partner_${level.level.toLowerCase()}`,
      name: level.name,
      price: level.price,
    });
    setPayDialogOpen(true);
  };

  const handlePaymentSuccess = () => {
    const msg = isExpired ? '续费成功！佣金权益已恢复' : isYoujinPartner ? '续费成功！' : '恭喜您成为有劲合伙人！';
    toast.success(msg);
    navigate('/partner');
  };

  // 获取按钮文案
  const getButtonLabel = (levelId: string) => {
    const state = getButtonState(levelId);
    const level = youjinPartnerLevels.find(l => l.level === levelId);
    if (!level) return '';
    
    switch (state) {
      case 'purchase': return `立即购买 ${level.name}`;
      case 'renew': return `续费 ${level.name} ¥${level.price}`;
      case 'renew_switch': return `续费并切换到 ${level.name} ¥${level.price}`;
      default: return `立即购买 ${level.name}`;
    }
  };

  return (
    <div className="h-screen overflow-y-auto overscroll-contain bg-gradient-to-br from-background via-background to-orange-50/30" style={{ WebkitOverflowScrolling: 'touch' }}>
      <DynamicOGMeta pageKey="youjinPartnerIntro" />
      <div className="container max-w-5xl mx-auto px-4 py-8 space-y-8">
        {/* Header */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={() => navigate("/partner/type")}
              className="gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              返回选择
            </Button>
            <IntroShareDialog config={introShareConfigs.youjinPartner} />
          </div>
          
          <div className="text-center space-y-2">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-orange-500 to-amber-500 bg-clip-text text-transparent">
              💪 有劲合伙人计划
            </h1>
            <p className="text-muted-foreground text-lg">
              预购体验包，建立长期用户关系，享受持续分成
            </p>
            <Button
              variant="link"
              onClick={() => navigate("/partner/youjin-plan")}
              className="text-orange-600 hover:text-orange-700"
            >
              📖 查看完整介绍 →
            </Button>
          </div>
        </div>

        {/* 核心价值 */}
        <Card className="border-orange-200 bg-gradient-to-br from-orange-50/50 to-amber-50/50">
          <CardHeader>
            <CardTitle className="text-2xl">为什么选择有劲合伙人？</CardTitle>
            <CardDescription>长期经营，持续收益的合伙人模式</CardDescription>
          </CardHeader>
          <CardContent className="grid md:grid-cols-2 gap-4">
            <div className="flex gap-3">
              <Gift className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">分发体验包建立关系</p>
                <p className="text-sm text-muted-foreground">
                  预购100-1000份9.9元体验包，通过二维码分发给用户
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <TrendingUp className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">持续获得佣金</p>
                <p className="text-sm text-muted-foreground">
                  用户兑换后成为您的推荐用户，未来购买有劲产品都能分成
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <Users className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">等级越高佣金越高</p>
                <p className="text-sm text-muted-foreground">
                  L1享18%，L2享30%+二级5%，L3享50%+二级12%
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <Clock className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">推荐关系永久有效</p>
                <p className="text-sm text-muted-foreground">
                  一次兑换，终身绑定，享受长期被动收入
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 体验包内容 - Matrix 展示 */}
        <Card className="border-teal-200 dark:border-teal-800 bg-gradient-to-br from-teal-50/50 to-cyan-50/50 dark:from-teal-950/20 dark:to-cyan-950/20">
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2">
              <Gift className="w-5 h-5 text-teal-500" />
              可分发的体验包（共4种）
            </CardTitle>
            <CardDescription>合伙人可使用以下体验包转化用户，每次扫码兑换1种</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveComparison
              columns={[
                { header: "权益项目" },
                { header: "内容", highlight: true },
              ]}
              rows={experiencePackageItems.map(item => ({
                label: `${item.icon} ${item.name}`,
                values: [item.value]
              }))}
            />
          </CardContent>
        </Card>

        {/* 可分成产品 - Matrix 展示 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-orange-500" />
              可分成产品一览（{totalCommissionableCount}款）
            </CardTitle>
            <CardDescription>用户购买以下任意产品，您都能获得佣金</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveComparison
              columns={[
                { header: "产品类别" },
                { header: "产品名称" },
                { header: "价格", highlight: true },
              ]}
              rows={commissionableProducts.map((product, idx, arr) => {
                const isFirstInCategory = idx === 0 || arr[idx - 1].category !== product.category;
                return {
                  label: isFirstInCategory ? product.category : '',
                  values: [product.name, `¥${product.price}`]
                };
              })}
            />
          </CardContent>
        </Card>
        <div className="space-y-4">
          <div className="space-y-2">
            <h2 className="text-2xl font-bold">
              {isYoujinPartner ? '续费 / 选择等级' : '选择您的合伙人等级'}
            </h2>
            <p className="text-muted-foreground">
              {isExpired 
                ? '续费后有效期延长1年，佣金比例按所选等级生效'
                : isYoujinPartner 
                  ? '续费后有效期延长1年，可自由选择任意等级'
                  : '购买后有效期1年，到期可续费'}
            </p>
          </div>

          {/* 已是合伙人提示 */}
          {isYoujinPartner && (
            <Card className={`border-amber-200 bg-gradient-to-r ${isExpired ? 'from-red-50 to-orange-50' : 'from-amber-50 to-orange-50'}`}>
              <CardContent className="py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Sparkles className="w-5 h-5 text-amber-500" />
                    <div>
                      <p className="font-medium text-amber-800">
                        您当前是 <strong>{currentLevel}</strong> 合伙人
                        {isExpired && <span className="text-red-600 ml-2">（已过期）</span>}
                      </p>
                      <p className="text-sm text-amber-600 mt-0.5">
                        {isExpired 
                          ? '续费任意等级即可恢复佣金权益，有效期延长1年'
                          : daysUntilExpiry !== null 
                            ? `还有 ${daysUntilExpiry} 天到期，续费可选任意等级`
                            : '续费可选任意等级'}
                      </p>
                    </div>
                  </div>
                  <Badge variant="outline" className="border-amber-300 text-amber-700">
                    {partner?.prepurchase_count || 0} 份剩余
                  </Badge>
                </div>
              </CardContent>
            </Card>
          )}

          {/* 省钱提示 */}
          {!isYoujinPartner && (
            <Card className="border-teal-200 bg-gradient-to-r from-teal-50 to-cyan-50">
              <CardContent className="py-4">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">💎</span>
                  <div>
                    <p className="font-medium text-teal-800">一步到位更划算！</p>
                    <p className="text-sm text-teal-600">
                      直接购买钻石：¥4,950 | 先买初级再升级：¥792 + ¥4,950 = ¥5,742
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
          
          <div className="grid gap-6">
            {youjinPartnerLevels.map((level) => {
              const buttonState = getButtonState(level.level);
              
              return (
                <Card 
                  key={level.level}
                  className={`transition-all cursor-pointer hover:border-orange-500 hover:shadow-lg ${
                    buttonState === 'renew' && !isExpired ? 'border-green-300 bg-green-50/30' : ''
                  }`}
                  onClick={() => handlePurchase(level.level)}
                >
                  <CardContent className="p-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-4xl">{level.icon}</span>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="text-xl font-bold">{level.name}</p>
                            {buttonState === 'renew' && !isExpired && (
                              <Badge className="bg-green-100 text-green-700 border-green-200">当前等级</Badge>
                            )}
                          </div>
                          <p className="text-muted-foreground">{level.description}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-3xl font-bold text-orange-600">¥{level.price}</p>
                        <p className="text-sm text-muted-foreground">{level.minPrepurchase}份体验包 · 1年有效</p>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <span className="bg-orange-100 text-orange-700 px-3 py-1 rounded-full font-medium">
                        全产品 {(level.commissionRateL1 * 100).toFixed(0)}% 佣金
                      </span>
                      {level.commissionRateL2 > 0 && (
                        <span className="bg-amber-100 text-amber-700 px-3 py-1 rounded-full font-medium">
                          二级 {(level.commissionRateL2 * 100).toFixed(0)}% 佣金
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      {level.benefits.map((benefit, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-sm">
                          <Check className="w-4 h-4 text-orange-500" />
                          <span>{benefit}</span>
                        </div>
                      ))}
                    </div>

                    <Button 
                      className={`w-full gap-2 bg-gradient-to-r ${level.gradient} hover:opacity-90 text-white`}
                      size="lg"
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePurchase(level.level);
                      }}
                    >
                      {getButtonLabel(level.level)}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* 常见问题 */}
        <Card>
          <CardHeader>
            <CardTitle>常见问题</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <p className="font-medium">Q: 合伙人有效期多久？</p>
              <p className="text-sm text-muted-foreground">
                A: 购买后有效期1年，到期后需续费。续费时可自由选择任意等级，有效期延长1年。
              </p>
            </div>

            <div className="space-y-2">
              <p className="font-medium">Q: 到期后不续费会怎样？</p>
              <p className="text-sm text-muted-foreground">
                A: 到期后佣金权益冻结（不产生新佣金），但推荐关系永久保留，已有余额仍可提现。续费后即刻恢复。
              </p>
            </div>

            <div className="space-y-2">
              <p className="font-medium">Q: 如何分发体验包给用户？</p>
              <p className="text-sm text-muted-foreground">
                A: 成为合伙人后，系统会生成专属二维码，用户扫码即可兑换体验包并与您建立推荐关系。
              </p>
            </div>

            <div className="space-y-2">
              <p className="font-medium">Q: 可以分成哪些产品？</p>
              <p className="text-sm text-muted-foreground">
                A: 有劲产品线共7款可分成产品（365会员、训练营、合伙人套餐），体验包（¥9.9小工具）不参与佣金分成。详见上方"可分成产品一览"。
              </p>
            </div>

            <div className="space-y-2">
              <p className="font-medium">Q: 续费时可以换等级吗？</p>
              <p className="text-sm text-muted-foreground">
                A: 可以！续费时可自由选择任意等级，佣金比例和体验包配额按新等级生效。
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <UnifiedPayDialog
        open={payDialogOpen}
        onOpenChange={setPayDialogOpen}
        packageInfo={selectedPackage}
        onSuccess={handlePaymentSuccess}
      />
    </div>
  );
}