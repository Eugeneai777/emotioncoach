import { ArrowLeft, Link2, Gift, Check, Sparkles, Users, Target, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";

const PromoGuide = () => {
  const navigate = useNavigate();

  return (
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
          <h1 className="text-lg font-semibold text-teal-800">推广模式指南</h1>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Hero Section */}
        <div className="text-center py-6">
          <div className="text-4xl mb-3">🚀</div>
          <h2 className="text-2xl font-bold text-teal-800 mb-2">两种推广方式，灵活组合</h2>
          <p className="text-teal-600">选择最适合你的推广策略，让每次分享都有收获</p>
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
                <p className="text-sm text-white/80">推荐日常使用 ⭐</p>
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

        {/* 活动兑换码 */}
        <Card className="bg-white/70 backdrop-blur border-amber-200 overflow-hidden">
          <div className="bg-gradient-to-r from-amber-500 to-orange-500 p-4">
            <div className="flex items-center gap-3 text-white">
              <div className="p-2 bg-white/20 rounded-lg">
                <Gift className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold">活动兑换码</h3>
                <p className="text-sm text-white/80">适合特殊活动</p>
              </div>
            </div>
          </div>
          <CardContent className="p-4 space-y-4">
            {/* 特点 */}
            <div>
              <h4 className="font-medium text-amber-800 mb-2 flex items-center gap-2">
                <Sparkles className="h-4 w-4" /> 特点
              </h4>
              <div className="space-y-2">
                {[
                  "一码一用户，用完自动作废",
                  "每个码可单独设置入口类型",
                  "可追踪每个码的使用情况"
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-2 text-sm text-amber-700">
                    <Check className="h-4 w-4 text-amber-500 mt-0.5 flex-shrink-0" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* 使用场景 */}
            <div>
              <h4 className="font-medium text-amber-800 mb-2 flex items-center gap-2">
                <Target className="h-4 w-4" /> 适合场景
              </h4>
              <div className="grid grid-cols-2 gap-2">
                {["限时促销活动", "VIP专属福利", "线下活动分发", "合作渠道追踪"].map((scene, i) => (
                  <div key={i} className="bg-amber-50 rounded-lg px-3 py-2 text-sm text-amber-700 text-center">
                    {scene}
                  </div>
                ))}
              </div>
            </div>

            {/* 工作原理 */}
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg p-3">
              <h4 className="font-medium text-amber-800 mb-2 flex items-center gap-2">
                <Zap className="h-4 w-4" /> 工作原理
              </h4>
              <div className="flex items-center justify-between text-xs text-amber-600">
                <span>生成兑换码</span>
                <span>→</span>
                <span>分发给用户</span>
                <span>→</span>
                <span>用户输入</span>
                <span>→</span>
                <span>码失效</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 对比表格 */}
        <Card className="bg-white/70 backdrop-blur border-teal-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-teal-800 text-base flex items-center gap-2">
              <Users className="h-5 w-5" /> 两种方式对比
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-teal-100">
                    <th className="text-left py-2 px-2 text-teal-600 font-medium">对比项</th>
                    <th className="text-center py-2 px-2 text-teal-700 font-medium">固定链接</th>
                    <th className="text-center py-2 px-2 text-amber-700 font-medium">活动码</th>
                  </tr>
                </thead>
                <tbody className="text-teal-700">
                  <tr className="border-b border-teal-50">
                    <td className="py-2 px-2">使用次数</td>
                    <td className="py-2 px-2 text-center text-teal-600 font-medium">无限 ♾️</td>
                    <td className="py-2 px-2 text-center">一次</td>
                  </tr>
                  <tr className="border-b border-teal-50">
                    <td className="py-2 px-2">有效期</td>
                    <td className="py-2 px-2 text-center text-teal-600 font-medium">永久</td>
                    <td className="py-2 px-2 text-center">用后作废</td>
                  </tr>
                  <tr className="border-b border-teal-50">
                    <td className="py-2 px-2">入口类型</td>
                    <td className="py-2 px-2 text-center">统一设置</td>
                    <td className="py-2 px-2 text-center text-amber-600 font-medium">每码独立</td>
                  </tr>
                  <tr className="border-b border-teal-50">
                    <td className="py-2 px-2">适合场景</td>
                    <td className="py-2 px-2 text-center">日常推广</td>
                    <td className="py-2 px-2 text-center">特殊活动</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-2">追踪方式</td>
                    <td className="py-2 px-2 text-center">按渠道统计</td>
                    <td className="py-2 px-2 text-center text-amber-600 font-medium">精确到单码</td>
                  </tr>
                </tbody>
              </table>
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
                <span className="text-white/90"> 先使用固定推广链接，简单高效</span>
              </div>
              <div className="bg-white/20 rounded-lg p-3">
                <span className="font-medium">🚀 进阶玩法：</span>
                <span className="text-white/90"> 配合活动兑换码做限时促销</span>
              </div>
              <div className="bg-white/20 rounded-lg p-3">
                <span className="font-medium">⭐ 高级策略：</span>
                <span className="text-white/90"> 多种方式组合，追踪不同渠道效果</span>
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
  );
};

export default PromoGuide;
