import { ArrowLeft, Gift, Link2, Copy, QrCode, Image, Share2, ChevronRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { DynamicOGMeta } from "@/components/common/DynamicOGMeta";
import { IntroShareDialog } from "@/components/common/IntroShareDialog";
import { introShareConfigs } from "@/config/introShareConfig";
import { useExperiencePackageItems } from "@/hooks/useExperiencePackageItems";

const ICON_MAP: Record<string, string> = {
  blue: '💎',
  green: '💚',
  amber: '🔶',
  purple: '🔮',
};

const PromoGuide = () => {
  const navigate = useNavigate();
  const { items } = useExperiencePackageItems();

  return (
    <>
      <DynamicOGMeta pageKey="promoGuide" />
      <div className="h-screen overflow-y-auto overscroll-contain bg-gradient-to-br from-teal-50 via-cyan-50 to-blue-50" style={{ WebkitOverflowScrolling: 'touch' }}>
        {/* Header */}
        <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-teal-100">
          <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/partner")}
              className="text-teal-700"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-lg font-semibold text-teal-800">推广指南</h1>
            <IntroShareDialog config={introShareConfigs.promoGuide} />
          </div>
        </div>

        <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
          {/* 板块一：名额权益说明 */}
          <Card className="bg-white/70 backdrop-blur border-teal-200 overflow-hidden">
            <div className="bg-gradient-to-r from-teal-500 to-cyan-500 p-4">
              <div className="flex items-center gap-3 text-white">
                <div className="p-2 bg-white/20 rounded-lg">
                  <Gift className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold">每个名额 = 一份体验套餐</h3>
                  <p className="text-sm text-white/80">每分发一个用户，消耗你的 1 个名额</p>
                </div>
              </div>
            </div>
            <CardContent className="p-4">
              <p className="text-sm text-teal-600 mb-3">用户通过你的链接领取后，将获得以下权益：</p>
              <div className="space-y-2">
                {items.map((item) => (
                  <div key={item.item_key} className="flex items-center gap-3 bg-teal-50/80 rounded-lg px-3 py-2.5">
                    <span className="text-xl">{item.icon || ICON_MAP[item.color_theme] || '📦'}</span>
                    <div className="flex-1 min-w-0">
                      <span className="text-sm font-medium text-teal-800">{item.name}</span>
                      <span className="text-xs text-teal-500 ml-2">{item.value}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* 板块二：推广链接的目的 */}
          <Card className="bg-white/70 backdrop-blur border-teal-200 overflow-hidden">
            <div className="bg-gradient-to-r from-blue-500 to-indigo-500 p-4">
              <div className="flex items-center gap-3 text-white">
                <div className="p-2 bg-white/20 rounded-lg">
                  <Link2 className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold">推广链接做什么？</h3>
                  <p className="text-sm text-white/80">两种模式，灵活选择</p>
                </div>
              </div>
            </div>
            <CardContent className="p-4 space-y-4">
              {/* 免费模式 */}
              <div>
                <div className="text-sm font-medium text-teal-800 mb-2">🆓 免费模式</div>
                <div className="flex items-center gap-1.5 text-xs text-teal-600 flex-wrap">
                  <span className="bg-teal-50 rounded px-2 py-1">用户点击链接</span>
                  <ChevronRight className="h-3 w-3 text-teal-400 flex-shrink-0" />
                  <span className="bg-teal-50 rounded px-2 py-1">注册/登录</span>
                  <ChevronRight className="h-3 w-3 text-teal-400 flex-shrink-0" />
                  <span className="bg-teal-50 rounded px-2 py-1">免费领取</span>
                  <ChevronRight className="h-3 w-3 text-teal-400 flex-shrink-0" />
                  <span className="bg-emerald-100 rounded px-2 py-1 font-medium">成为学员</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1.5">消耗 1 个名额，用户免费获得体验套餐</p>
              </div>

              {/* 付费模式 */}
              <div>
                <div className="text-sm font-medium text-teal-800 mb-2">💰 付费模式（¥9.9）</div>
                <div className="flex items-center gap-1.5 text-xs text-teal-600 flex-wrap">
                  <span className="bg-teal-50 rounded px-2 py-1">用户点击链接</span>
                  <ChevronRight className="h-3 w-3 text-teal-400 flex-shrink-0" />
                  <span className="bg-teal-50 rounded px-2 py-1">注册/登录</span>
                  <ChevronRight className="h-3 w-3 text-teal-400 flex-shrink-0" />
                  <span className="bg-amber-50 rounded px-2 py-1">支付 ¥9.9</span>
                  <ChevronRight className="h-3 w-3 text-teal-400 flex-shrink-0" />
                  <span className="bg-emerald-100 rounded px-2 py-1 font-medium">按比例分成</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1.5">消耗 1 个名额，用户付费获得体验套餐，按合伙人佣金比例分成</p>
              </div>
            </CardContent>
          </Card>

          {/* 板块三：3 步开始推广 */}
          <Card className="bg-white/70 backdrop-blur border-teal-200 overflow-hidden">
            <div className="bg-gradient-to-r from-emerald-500 to-teal-500 p-4">
              <div className="flex items-center gap-3 text-white">
                <div className="p-2 bg-white/20 rounded-lg">
                  <Share2 className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold">3 步开始推广</h3>
                  <p className="text-sm text-white/80">简单操作，轻松上手</p>
                </div>
              </div>
            </div>
            <CardContent className="p-4 space-y-4">
              {[
                {
                  step: "1",
                  title: "选择入口方式",
                  desc: "在合伙人中心选择「免费」或「付费 ¥9.9」",
                  icon: <Sparkles className="h-4 w-4" />,
                },
                {
                  step: "2",
                  title: "获取推广素材",
                  desc: "复制链接、下载二维码 或 生成精美海报",
                  icons: [
                    <Copy key="c" className="h-4 w-4" />,
                    <QrCode key="q" className="h-4 w-4" />,
                    <Image key="i" className="h-4 w-4" />,
                  ],
                },
                {
                  step: "3",
                  title: "分享推广",
                  desc: "发到朋友圈、微信群、社交媒体等",
                  icon: <Share2 className="h-4 w-4" />,
                },
              ].map((s) => (
                <div key={s.step} className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-teal-500 to-cyan-500 text-white flex items-center justify-center text-sm font-bold flex-shrink-0">
                    {s.step}
                  </div>
                  <div>
                    <div className="text-sm font-medium text-teal-800">{s.title}</div>
                    <div className="text-xs text-teal-600 mt-0.5">{s.desc}</div>
                  </div>
                </div>
              ))}

              {/* 适合场景 */}
              <div className="pt-2">
                <div className="text-xs text-teal-500 mb-2">适合场景</div>
                <div className="grid grid-cols-2 gap-2">
                  {["朋友圈分享", "微信群推荐", "社交媒体发布", "名片/简介展示"].map((scene, i) => (
                    <div key={i} className="bg-teal-50 rounded-lg px-3 py-2 text-xs text-teal-700 text-center">
                      {scene}
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 板块四：使用建议 */}
          <Card className="bg-gradient-to-br from-teal-500 to-cyan-500 text-white border-0">
            <CardContent className="p-4 space-y-3">
              <h3 className="font-bold flex items-center gap-2">
                💡 使用建议
              </h3>
              <div className="space-y-2 text-sm">
                <div className="bg-white/20 rounded-lg p-3">
                  <span className="font-medium">🌱 新手建议：</span>
                  <span className="text-white/90"> 先设置好入口类型，然后复制链接分享</span>
                </div>
                <div className="bg-white/20 rounded-lg p-3">
                  <span className="font-medium">🚀 进阶玩法：</span>
                  <span className="text-white/90"> 生成海报配合朋友圈文案效果更好</span>
                </div>
                <div className="bg-white/20 rounded-lg p-3">
                  <span className="font-medium">⭐ 高级策略：</span>
                  <span className="text-white/90"> 在社群分享时配合训练营入口引导</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* CTA */}
          <Button
            className="w-full bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white shadow-lg"
            size="lg"
            onClick={() => navigate("/partner")}
          >
            开始推广
          </Button>

          <div className="h-6" />
        </div>
      </div>
    </>
  );
};

export default PromoGuide;
