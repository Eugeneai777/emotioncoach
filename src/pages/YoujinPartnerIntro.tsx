import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Check, TrendingUp, Users, Gift, Clock } from "lucide-react";
import { youjinPartnerLevels } from "@/config/partnerLevels";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export default function YoujinPartnerIntro() {
  const navigate = useNavigate();
  const [selectedLevel, setSelectedLevel] = useState<string>('L1');

  const handlePurchase = () => {
    const level = youjinPartnerLevels.find(l => l.level === selectedLevel);
    if (!level) return;

    const totalAmount = level.minPrepurchase * 9.9;
    toast.success(`即将支付 ¥${totalAmount.toFixed(2)}`);
    
    // TODO: 集成支付接口
    // navigate to payment page or trigger payment modal
  };

  const getPrice = (level: typeof youjinPartnerLevels[0]) => {
    return (level.minPrepurchase * 9.9).toFixed(2);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-orange-50/30">
      <div className="container max-w-5xl mx-auto px-4 py-8 space-y-8">
        {/* Header */}
        <div className="space-y-4">
          <Button
            variant="ghost"
            onClick={() => navigate("/partner/type")}
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            返回选择
          </Button>
          
          <div className="text-center space-y-2">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-orange-500 to-amber-500 bg-clip-text text-transparent">
              💪 有劲合伙人计划
            </h1>
            <p className="text-muted-foreground text-lg">
              预购体验包，建立长期用户关系，享受持续分成
            </p>
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
                  L1享20%，L2享40%，L3享50%+二级10%
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

        {/* 等级选择 */}
        <Card>
          <CardHeader>
            <CardTitle>选择您的合伙人等级</CardTitle>
            <CardDescription>预购数量越多，等级越高，佣金比例越高</CardDescription>
          </CardHeader>
          <CardContent>
            <RadioGroup value={selectedLevel} onValueChange={setSelectedLevel}>
              <div className="space-y-4">
                {youjinPartnerLevels.map((level) => (
                  <div key={level.level} className="relative">
                    <RadioGroupItem
                      value={level.level}
                      id={level.level}
                      className="peer sr-only"
                    />
                    <Label
                      htmlFor={level.level}
                      className="flex cursor-pointer rounded-lg border-2 border-muted bg-card p-6 hover:bg-accent peer-data-[state=checked]:border-orange-500 peer-data-[state=checked]:bg-orange-50/50"
                    >
                      <div className="flex-1 space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <span className="text-3xl">{level.icon}</span>
                            <div>
                              <p className="text-lg font-semibold">{level.name}</p>
                              <p className="text-sm text-muted-foreground">{level.description}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-2xl font-bold text-orange-600">¥{getPrice(level)}</p>
                            <p className="text-xs text-muted-foreground">
                              {level.minPrepurchase}份 × ¥9.9
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-4 text-sm">
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
                            <div key={idx} className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Check className="w-4 h-4 text-orange-500" />
                              <span>{benefit}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </Label>
                  </div>
                ))}
              </div>
            </RadioGroup>

            <Button 
              onClick={handlePurchase}
              className="w-full mt-6 gap-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600"
              size="lg"
            >
              立即成为有劲合伙人
            </Button>
          </CardContent>
        </Card>

        {/* 常见问题 */}
        <Card>
          <CardHeader>
            <CardTitle>常见问题</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <p className="font-medium">Q: 体验包有效期多久？</p>
              <p className="text-sm text-muted-foreground">
                A: 从购买日起1年内有效，用户可以随时兑换。
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
                A: 9.9元体验包、365会员、有劲训练营、AI教练升级包等所有有劲产品。不包括绽放训练营。
              </p>
            </div>

            <div className="space-y-2">
              <p className="font-medium">Q: 能否升级到更高等级？</p>
              <p className="text-sm text-muted-foreground">
                A: 可以！随时可以补差价升级到更高等级，享受更高佣金比例。
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}