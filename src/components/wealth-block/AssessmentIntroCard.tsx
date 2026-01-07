import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Target, Lightbulb, BarChart3, Rocket, Check, LogIn, ArrowRight, AlertTriangle, TrendingDown, Shield, Sparkles } from "lucide-react";

interface AssessmentIntroCardProps {
  isLoggedIn: boolean;
  onStart: () => void;
  onLogin: () => void;
  onPay?: () => void; // 新增：支付按钮回调
}

const statistics = {
  totalAssessments: 12847,
  breakthroughUsers: 3892,
};

const authorityData = [
  { source: "中科院心理所", stat: "72%", desc: "的理财失败源于潜意识信念", icon: "🔬" },
  { source: "哈佛商学院", stat: "23%", desc: "情绪化决策导致的收益损失", icon: "📈" },
  { source: "2024财富心理调研", stat: "85%", desc: "的人存在至少2种财富卡点", icon: "📊" },
];

const upgradedPainPoints = [
  { emoji: "😰", text: "工资到账没几天就见底，钱不知道花哪了" },
  { emoji: "💔", text: "看到别人赚钱成功，酸涩感比开心更多" },
  { emoji: "🙈", text: "一想到要推销自己的服务，就浑身不自在" },
  { emoji: "⏰", text: "赚钱的机会来了，却总找借口拖延" },
  { emoji: "😓", text: "明明很努力，但银行卡余额始终没变化" },
];

const valuePoints = [
  { icon: Target, title: "精准定位", desc: "识别行为、情绪、信念三层卡点", color: "text-emerald-500" },
  { icon: BarChart3, title: "可视诊断", desc: "四穷雷达图 + 健康指数仪表盘", color: "text-cyan-500" },
  { icon: Lightbulb, title: "AI深度分析", desc: "智能追问挖掘隐藏模式", color: "text-violet-500" },
  { icon: Rocket, title: "个性方案", desc: "匹配专属突破训练营", color: "text-amber-500" },
];

const pricingIncludes = [
  "30道专业场景测评",
  "AI智能深度分析报告",
  "四穷人格画像",
  "个性化突破方案",
];

const loginBenefits = [
  "查看历史趋势变化",
  "解锁21天训练营",
  "获得AI教练个性化指导",
];

export function AssessmentIntroCard({ isLoggedIn, onStart, onLogin, onPay }: AssessmentIntroCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      {/* Section 1: Warning Alert Opening */}
      <Card className="relative overflow-hidden bg-gradient-to-br from-red-950 via-red-900 to-slate-900 border-red-500/30 p-5">
        <div className="absolute top-0 right-0 w-40 h-40 bg-red-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-orange-500/10 rounded-full blur-2xl" />
        
        <div className="relative text-center space-y-3">
          <motion.div 
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            className="inline-flex items-center gap-2 px-3 py-1.5 bg-red-500/20 rounded-full border border-red-500/30"
          >
            <AlertTriangle className="w-4 h-4 text-red-400" />
            <span className="text-red-300 text-sm font-medium">警示数据</span>
          </motion.div>
          
          <h2 className="text-2xl font-bold text-white">
            <span className="text-red-400">87%</span> 的人被「财富卡点」困扰
          </h2>
          
          <p className="text-red-200/80 text-sm leading-relaxed">
            不是你不够努力<br />
            是有东西在<span className="text-red-300 font-medium">暗中拖住你</span>
          </p>
          
          <div className="flex items-center justify-center gap-2 text-xs text-red-300/70 pt-1">
            <span className="px-2 py-1 bg-red-500/20 rounded-full border border-red-500/20">
              📊 {statistics.totalAssessments.toLocaleString()} 人已完成测评
            </span>
          </div>
        </div>
      </Card>

      {/* Section 2: Pain Points (Dark Cards) */}
      <Card className="p-4 bg-slate-900/95 border-slate-700/50">
        <div className="flex items-center gap-2 mb-3">
          <TrendingDown className="w-4 h-4 text-slate-400" />
          <h3 className="font-medium text-sm text-slate-300">你是否经常这样？</h3>
        </div>
        <div className="space-y-2.5">
          {upgradedPainPoints.map((point, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 + idx * 0.05 }}
              className="flex items-start gap-3 p-2.5 rounded-lg bg-slate-800/60 border border-slate-700/30"
            >
              <span className="text-lg shrink-0">{point.emoji}</span>
              <span className="text-sm text-slate-300 leading-relaxed">{point.text}</span>
            </motion.div>
          ))}
        </div>
        
        {/* Loss Aversion Trigger */}
        <div className="mt-4 p-3 rounded-lg bg-gradient-to-r from-red-950/50 to-orange-950/50 border border-red-900/30">
          <p className="text-xs text-red-300/90 text-center leading-relaxed">
            如果不解决这些卡点，你可能会继续原地踏步 <span className="font-bold text-red-400">3-5年</span><br />
            反复陷入「努力→失败→自责」的循环
          </p>
        </div>
      </Card>

      {/* Section 3: Authority Data (Blue/Purple) */}
      <Card className="p-4 bg-gradient-to-br from-indigo-950 via-violet-950 to-slate-900 border-indigo-500/30">
        <div className="flex items-center gap-2 mb-3">
          <Shield className="w-4 h-4 text-indigo-400" />
          <h3 className="font-medium text-sm text-indigo-200">来自权威机构的研究</h3>
        </div>
        <div className="space-y-3">
          {authorityData.map((item, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + idx * 0.1 }}
              className="flex items-start gap-3 p-3 rounded-lg bg-indigo-900/30 border border-indigo-700/30"
            >
              <span className="text-xl shrink-0">{item.icon}</span>
              <div className="min-w-0">
                <div className="text-xs text-indigo-300/70 mb-0.5">{item.source}</div>
                <div className="text-sm text-white">
                  <span className="text-indigo-300 font-bold text-lg">{item.stat}</span>
                  <span className="text-indigo-100/90 ml-1">{item.desc}</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </Card>

      {/* Section 4: Value Points (Green/Hope) */}
      <Card className="p-4 bg-gradient-to-br from-emerald-950 via-teal-950 to-slate-900 border-emerald-500/30">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="w-4 h-4 text-emerald-400" />
          <h3 className="font-medium text-sm text-emerald-200">这份测评将帮你</h3>
        </div>
        <div className="grid grid-cols-2 gap-2.5">
          {valuePoints.map((point, idx) => (
            <motion.div
              key={point.title}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 + idx * 0.05 }}
              className="p-3 rounded-lg bg-emerald-900/30 border border-emerald-700/30"
            >
              <div className="flex items-start gap-2">
                <div className={`p-1.5 rounded-md bg-slate-800/80 ${point.color}`}>
                  <point.icon className="w-3.5 h-3.5" />
                </div>
                <div className="min-w-0">
                  <h4 className="font-medium text-xs text-emerald-100">{point.title}</h4>
                  <p className="text-[10px] text-emerald-300/70 mt-0.5 leading-relaxed">{point.desc}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </Card>

      {/* Section 5: Assessment Structure Preview */}
      <Card className="p-4 bg-slate-800/80 border-slate-700/50">
        <h3 className="font-medium text-sm mb-3 text-center text-slate-200">测评结构</h3>
        <div className="flex items-center justify-between text-center text-xs">
          <div className="flex-1">
            <div className="w-10 h-10 mx-auto rounded-full bg-amber-900/50 border border-amber-600/30 flex items-center justify-center mb-1.5">
              <span className="text-lg">🚶</span>
            </div>
            <div className="font-medium text-amber-200">行为层</div>
            <div className="text-slate-400">10题</div>
          </div>
          <ArrowRight className="w-4 h-4 text-slate-500 shrink-0" />
          <div className="flex-1">
            <div className="w-10 h-10 mx-auto rounded-full bg-orange-900/50 border border-orange-600/30 flex items-center justify-center mb-1.5">
              <span className="text-lg">💭</span>
            </div>
            <div className="font-medium text-orange-200">情绪层</div>
            <div className="text-slate-400">10题</div>
          </div>
          <ArrowRight className="w-4 h-4 text-slate-500 shrink-0" />
          <div className="flex-1">
            <div className="w-10 h-10 mx-auto rounded-full bg-yellow-900/50 border border-yellow-600/30 flex items-center justify-center mb-1.5">
              <span className="text-lg">💡</span>
            </div>
            <div className="font-medium text-yellow-200">信念层</div>
            <div className="text-slate-400">10题</div>
          </div>
        </div>
      </Card>

      {/* Section 6: Pricing Module */}
      <Card className="p-5 bg-gradient-to-br from-slate-900 via-slate-800 to-amber-950/30 border-amber-500/40 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/10 rounded-full blur-2xl" />
        <div className="absolute -bottom-4 -left-4 w-20 h-20 bg-red-500/10 rounded-full blur-xl" />
        
        <div className="relative text-center space-y-4">
          <h3 className="font-bold text-lg text-white">解锁你的财富突破密码</h3>
          
          <div className="flex items-center justify-center gap-3">
            <span className="text-slate-500 line-through text-lg">¥99</span>
            <span className="text-4xl font-bold text-amber-400">¥9.9</span>
            <span className="px-2 py-0.5 bg-red-500 rounded text-xs text-white font-medium animate-pulse">限时</span>
          </div>
          
          <div className="grid grid-cols-2 gap-2 text-left">
            {pricingIncludes.map((item, idx) => (
              <div key={idx} className="flex items-center gap-1.5 text-xs text-slate-300">
                <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>{item}</span>
              </div>
            ))}
          </div>
          
          <Button
            onClick={onPay || onStart}
            size="lg"
            className="w-full h-12 text-base font-bold bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 hover:from-amber-600 hover:via-orange-600 hover:to-red-600 shadow-lg shadow-amber-500/30 border-0"
          >
            立即测评 · 有劲AI
          </Button>
          
          <p className="text-xs text-slate-400">
            已有 <span className="text-amber-400 font-medium">{statistics.breakthroughUsers.toLocaleString()}</span> 人通过测评获得突破
          </p>
          
          <p className="text-xs text-amber-400/80 pt-2 border-t border-amber-500/20 text-center">
            💎 有劲AI · 财富教练
          </p>
        </div>
      </Card>

      {/* Login Guidance (for non-logged in users) */}
      {!isLoggedIn && (
        <Card className="p-4 bg-slate-800/60 border-slate-700/50">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-indigo-900/50 shrink-0">
              <LogIn className="w-4 h-4 text-indigo-400" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-sm text-slate-200 mb-2">登录后可保存测评结果</h3>
              <div className="space-y-1.5 mb-4">
                {loginBenefits.map((benefit, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-xs text-slate-400">
                    <Check className="w-3 h-3 text-emerald-400 shrink-0" />
                    <span>{benefit}</span>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <Button size="sm" onClick={onLogin} className="flex-1 bg-indigo-600 hover:bg-indigo-700">
                  去登录
                </Button>
                <Button size="sm" variant="outline" onClick={onStart} className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-700">
                  先做测评
                </Button>
              </div>
            </div>
          </div>
        </Card>
      )}
    </motion.div>
  );
}
