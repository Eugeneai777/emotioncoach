import { ArrowLeft, Link2, Check, Sparkles, Target, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet";

const PromoGuide = () => {
  const navigate = useNavigate();

  return (
    <>
      <Helmet>
        <title>推广指南 - 有劲AI</title>
        <meta name="description" content="固定推广链接使用指南，简单高效" />
        <meta property="og:title" content="有劲AI • 推广指南" />
        <meta property="og:description" content="固定推广链接，永久有效，让每次分享都有收获" />
        <meta property="og:image" content="https://wechat.eugenewe.net/og-youjin-ai.png" />
        <meta property="og:url" content="https://wechat.eugenewe.net/partner/promo-guide" />
        <meta property="og:site_name" content="有劲AI" />
      </Helmet>
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-cyan-50 to-blue-50">
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
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Hero Section */}
        <div className="text-center py-6">
          <div className="text-4xl mb-3">🚀</div>
          <h2 className="text-2xl font-bold text-teal-800 mb-2">固定推广链接</h2>
          <p className="text-teal-600">简单高效，让每次分享都有收获</p>
        </div>

        {/* 固定推广链接 */}
        <Card className="bg-white/70 backdrop-blur border-teal-200 overflow-hidden">
          <div className="bg-gradient-to-r from-teal-500 to-cyan-500 p-4">
            <div className="flex items-center gap-3 text-white">
              <div className="p-2 bg-white/20 rounded-lg">
                <Link2 className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold">固定推广链接</h3>
                <p className="text-sm text-white/80">永久有效，无限使用 ⭐</p>
              </div>
            </div>
          </div>
          <CardContent className="p-4 space-y-4">
            {/* 特点 */}
            <div>
              <h4 className="font-medium text-teal-800 mb-2 flex items-center gap-2">
                <Sparkles className="h-4 w-4" /> 特点
              </h4>
              <div className="space-y-2">
                {[
                  "永久有效，无需反复生成",
                  "无限次使用，不用担心用完",
                  "入口类型跟随你的设置自动变化"
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-2 text-sm text-teal-700">
                    <Check className="h-4 w-4 text-teal-500 mt-0.5 flex-shrink-0" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* 使用场景 */}
            <div>
              <h4 className="font-medium text-teal-800 mb-2 flex items-center gap-2">
                <Target className="h-4 w-4" /> 适合场景
              </h4>
              <div className="grid grid-cols-2 gap-2">
                {["朋友圈分享", "微信群推荐", "社交媒体发布", "名片/简介展示"].map((scene, i) => (
                  <div key={i} className="bg-teal-50 rounded-lg px-3 py-2 text-sm text-teal-700 text-center">
                    {scene}
                  </div>
                ))}
              </div>
            </div>

            {/* 工作原理 */}
            <div className="bg-gradient-to-r from-teal-50 to-cyan-50 rounded-lg p-3">
              <h4 className="font-medium text-teal-800 mb-2 flex items-center gap-2">
                <Zap className="h-4 w-4" /> 工作原理
              </h4>
              <div className="flex items-center justify-between text-xs text-teal-600">
                <span>用户扫码</span>
                <span>→</span>
                <span>识别身份</span>
                <span>→</span>
                <span>按设置给额度</span>
                <span>→</span>
                <span>成为学员</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 使用建议 */}
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
