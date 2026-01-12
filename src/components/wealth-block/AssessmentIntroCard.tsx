import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { BarChart3, Check, LogIn, ArrowRight, Sparkles } from "lucide-react";

interface AssessmentIntroCardProps {
  isLoggedIn: boolean;
  onStart: () => void;
  onLogin: () => void;
  onPay?: () => void;
}

const statistics = {
  totalAssessments: 12847,
  breakthroughUsers: 3892,
};

const painPoints = [
  { emoji: "😰", text: "工资到账没几天就见底" },
  { emoji: "💔", text: "看到别人赚钱成功，心里酸酸的" },
  { emoji: "🙈", text: "一想到推销自己就浑身不自在" },
  { emoji: "😓", text: "明明很努力，余额始终没变化" },
];

const pricingIncludes = [
  "30道专业场景测评",
  "AI智能深度追问",
  "四穷雷达图诊断",
  "个性化突破建议",
];

const threeLayers = [
  { emoji: "🚶", name: "行为层", desc: "表面症状", color: "bg-amber-50 border-amber-200 text-amber-700" },
  { emoji: "💭", name: "情绪层", desc: "内在触发", color: "bg-orange-50 border-orange-200 text-orange-700" },
  { emoji: "💡", name: "信念层", desc: "根本原因", color: "bg-red-50 border-red-200 text-red-700" },
];

export function AssessmentIntroCard({ isLoggedIn, onStart, onLogin, onPay }: AssessmentIntroCardProps) {
  return (
    <div className="space-y-3">
      {/* Hero Section - Compact */}
      <Card className="relative overflow-hidden bg-gradient-to-br from-amber-50 via-orange-50 to-white border-amber-300 p-4 shadow-sm">
        <div className="absolute top-0 right-0 w-32 h-32 bg-amber-200/30 rounded-full blur-3xl" />
        
        <div className="relative text-center space-y-2">
          {/* Brand */}
          <div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-amber-600 via-orange-500 to-amber-600 bg-clip-text text-transparent">
              财富卡点测评
            </h1>
            <p className="text-[10px] text-slate-500">Powered by 有劲AI · 财富教练</p>
          </div>
          
          {/* Social Proof */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-amber-100/80 rounded-full border border-amber-200">
            <BarChart3 className="w-3.5 h-3.5 text-amber-600" />
            <span className="text-amber-700 text-xs font-medium">
              {statistics.totalAssessments.toLocaleString()} 人已找到答案
            </span>
          </div>
          
          {/* Core Message */}
          <div className="py-2">
            <p className="text-sm text-slate-600 mb-1">你有没有这种感觉？</p>
            <p className="text-xl font-bold text-slate-800">
              赚钱这件事，好像被
              <span className="text-red-500">「隐形刹车」</span>
              卡住了
            </p>
          </div>
          
          {/* CTA Button */}
          <Button
            onClick={onPay || onStart}
            size="lg"
            className="w-full h-11 text-base font-bold bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 hover:from-amber-600 hover:via-orange-600 hover:to-red-600 shadow-lg shadow-amber-500/30 border-0 text-white"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            ¥9.9 开始测评
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </Card>

      {/* Pain Points - Compact Grid */}
      <Card className="p-3 bg-white border-slate-200 shadow-sm">
        <p className="text-xs text-slate-500 mb-2 text-center">你是否经常这样？</p>
        <div className="grid grid-cols-2 gap-2">
          {painPoints.map((point, idx) => (
            <div
              key={idx}
              className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 border border-slate-100"
            >
              <span className="text-sm shrink-0">{point.emoji}</span>
              <span className="text-xs text-slate-600 leading-tight">{point.text}</span>
            </div>
          ))}
        </div>
      </Card>

      {/* Three Layers - Horizontal Compact */}
      <Card className="p-3 bg-white border-slate-200 shadow-sm">
        <p className="text-xs text-slate-500 mb-2 text-center">三层剥离 · 直达核心</p>
        <div className="flex gap-2">
          {threeLayers.map((layer, idx) => (
            <div 
              key={idx}
              className={`flex-1 text-center p-2 rounded-lg border ${layer.color}`}
            >
              <div className="text-lg">{layer.emoji}</div>
              <div className="text-xs font-medium">{layer.name}</div>
              <div className="text-[10px] opacity-70">{layer.desc}</div>
            </div>
          ))}
        </div>
      </Card>

      {/* Pricing - Compact */}
      <Card className="p-4 bg-gradient-to-br from-amber-50 via-orange-50 to-white border-amber-300 shadow-sm">
        <div className="text-center space-y-3">
          <div className="flex items-center justify-center gap-2">
            <span className="text-slate-400 line-through text-sm">¥99</span>
            <span className="text-3xl font-bold text-amber-600">¥9.9</span>
            <span className="px-1.5 py-0.5 bg-red-500 rounded text-[10px] text-white font-medium">限时</span>
          </div>
          
          <div className="grid grid-cols-2 gap-1.5 text-left">
            {pricingIncludes.map((item, idx) => (
              <div key={idx} className="flex items-center gap-1 text-xs text-slate-600">
                <Check className="w-3 h-3 text-emerald-500 shrink-0" />
                <span>{item}</span>
              </div>
            ))}
          </div>
          
          <Button
            onClick={onPay || onStart}
            size="lg"
            className="w-full h-12 text-base font-bold bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 hover:from-amber-600 hover:via-orange-600 hover:to-red-600 shadow-lg shadow-amber-500/30 border-0 text-white"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            ¥9.9 立即测评
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
          
          <p className="text-xs text-slate-500">
            已有 <span className="text-amber-600 font-medium">{statistics.breakthroughUsers.toLocaleString()}</span> 人通过测评获得突破
          </p>
        </div>
      </Card>

      {/* Login Guidance - Compact */}
      {!isLoggedIn && (
        <Card className="p-3 bg-white border-slate-200 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-indigo-100 shrink-0">
              <LogIn className="w-4 h-4 text-indigo-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-slate-700 font-medium">登录后可保存结果</p>
              <p className="text-xs text-slate-500">查看历史趋势 · 解锁训练营</p>
            </div>
            <Button size="sm" onClick={onLogin} className="bg-indigo-600 hover:bg-indigo-700 text-white shrink-0">
              登录
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
