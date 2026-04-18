import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Target, BarChart3, FileText, Check, LogIn, ArrowRight, AlertTriangle, TrendingDown, Shield, Sparkles, Brain, Loader2 } from "lucide-react";
import { AIComparisonCard } from "./AIComparisonCard";
import { BloomInviteCodeEntry } from "./BloomInviteCodeEntry";
import { AssessmentFlowCard } from "./AssessmentFlowCard";
import { AssessmentPreviewCard } from "./AssessmentPreviewCard";

// 检测是否为移动端
const isMobileDevice = () => {
  if (typeof window === 'undefined') return false;
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth < 768;
};

interface AssessmentIntroCardProps {
  isLoggedIn: boolean;
  hasPurchased?: boolean; // 是否已购买测评
  isBloomPartner?: boolean; // 是否已是绽放合伙人
  isLoading?: boolean; // 新增：是否正在加载登录/购买状态
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
  { icon: BarChart3, title: "可视诊断", desc: "四穷雷达图 + 觉醒指数仪表盘", color: "text-cyan-500" },
  { icon: Brain, title: "AI智能追问", desc: "根据回答动态生成深度追问，挖掘隐藏盲点", color: "text-violet-500" },
  { icon: FileText, title: "专属报告", desc: "人格故事解读 + 个性化突破建议", color: "text-amber-500" },
];

const pricingIncludes = [
  "30道专业场景测评",
  "AI智能深度追问",
  "四穷雷达图诊断",
  "个性化突破建议",
];

const loginBenefits = [
  "查看历史趋势变化",
  "解锁财富觉醒训练营",
  "获得AI教练个性化指导",
];

export function AssessmentIntroCard({ isLoggedIn, hasPurchased = false, isBloomPartner = false, isLoading = false, onStart, onLogin, onPay }: AssessmentIntroCardProps) {
  const isMobile = isMobileDevice();
  
  // 处理支付按钮点击
  const handlePayClick = () => {
    // 已购买，直接开始测评
    if (hasPurchased) {
      onStart();
      return;
    }
    
    // 未购买，正常支付流程
    if (onPay) {
      onPay();
    } else {
      onStart();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      {/* Section 1: Brand + Warning Alert Opening */}
      <Card className="relative overflow-hidden bg-gradient-to-br from-amber-50 via-orange-50 to-white border-amber-300 p-5 shadow-sm">
        <div className="absolute top-0 right-0 w-40 h-40 bg-amber-200/30 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-orange-200/30 rounded-full blur-2xl" />
        
        <div className="relative text-center space-y-3">
          {/* Brand Identity */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-2"
          >
            <h1 className="text-2xl font-bold bg-gradient-to-r from-amber-600 via-orange-500 to-amber-600 bg-clip-text text-transparent mb-1">
              财富卡点测评
            </h1>
            <p className="text-[10px] text-slate-500">Powered by 有劲AI</p>
          </motion.div>
          
          {/* 社交证明置顶 */}
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-amber-100/80 rounded-full border border-amber-200"
          >
            <BarChart3 className="w-4 h-4 text-amber-600" />
            <span className="text-amber-700 text-sm font-medium">
              {statistics.totalAssessments.toLocaleString()} 人已找到答案
            </span>
          </motion.div>
          
          {/* 共鸣式提问 - 逐字显示 */}
          <motion.h2 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="text-lg text-slate-600 font-normal flex justify-center"
          >
            {"你有没有这种感觉？".split("").map((char, i) => (
              <motion.span
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 + i * 0.05 }}
              >
                {char}
              </motion.span>
            ))}
          </motion.h2>
          
          {/* 核心痛点 - 大字强调 + 关键词闪烁 */}
          <div className="text-2xl sm:text-3xl font-bold text-slate-800 leading-relaxed">
            <motion.p
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5, type: "spring", stiffness: 100 }}
            >
              赚钱这件事
            </motion.p>
            <motion.p
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.7, type: "spring", stiffness: 100 }}
            >
              好像被
              <motion.span 
                className="text-red-500 inline-block"
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ 
                  opacity: 1, 
                  scale: [1, 1.05, 1],
                  textShadow: [
                    "0 0 0px rgba(239,68,68,0)",
                    "0 0 20px rgba(239,68,68,0.6)",
                    "0 0 0px rgba(239,68,68,0)"
                  ]
                }}
                transition={{ 
                  opacity: { delay: 0.9, duration: 0.3 },
                  scale: { delay: 1.2, duration: 1.5, repeat: Infinity, repeatDelay: 2 },
                  textShadow: { delay: 1.2, duration: 1.5, repeat: Infinity, repeatDelay: 2 }
                }}
              >
                「隐形刹车」
              </motion.span>
              卡住了
            </motion.p>
          </div>
          
          {/* 接纳式副文案 - 渐入 + 关键词高亮 */}
          <div className="text-slate-500 text-sm leading-relaxed">
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.1 }}
            >
              不是你不够努力
            </motion.p>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.3 }}
            >
              是有个东西，一直在
              <motion.span 
                className="text-red-500 font-medium inline-block"
                animate={{ 
                  scale: [1, 1.03, 1],
                  opacity: [1, 0.8, 1]
                }}
                transition={{ 
                  delay: 1.8,
                  duration: 2,
                  repeat: Infinity,
                  repeatDelay: 1
                }}
              >
                暗中拖你后腿
              </motion.span>
            </motion.p>
          </div>
          
          {/* 已有账号登录入口 */}
          {!isLoggedIn && (
            <button
              onClick={onLogin}
              className="w-full mt-2 py-2 text-sm text-primary hover:underline flex items-center justify-center gap-1.5"
            >
              <LogIn className="w-4 h-4" />
              已有账号？点击登录
            </button>
          )}
        </div>
      </Card>

      {/* Section 2: Pain Points */}
      <Card className="p-4 bg-white border-slate-200 shadow-sm">
        <div className="flex items-center gap-2 mb-3">
          <TrendingDown className="w-4 h-4 text-slate-500" />
          <h3 className="font-medium text-sm text-slate-700">你是否经常这样？</h3>
        </div>
        <div className="space-y-2.5">
          {upgradedPainPoints.map((point, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0.01, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 + idx * 0.05 }}
              style={{ transform: 'translateZ(0)', willChange: 'transform, opacity' }}
              className="flex items-start gap-3 p-2.5 rounded-lg bg-slate-50 border border-slate-200"
            >
              <span className="text-lg shrink-0">{point.emoji}</span>
              <span className="text-sm text-slate-700 leading-relaxed">{point.text}</span>
            </motion.div>
          ))}
        </div>
        
        {/* Loss Aversion Trigger */}
        <div className="mt-4 p-3 rounded-lg bg-gradient-to-r from-red-50 to-orange-50 border border-red-200">
          <p className="text-xs text-red-600 text-center leading-relaxed">
            如果不解决这些卡点，你可能会继续原地踏步 <span className="font-bold text-red-500">3-5年</span><br />
            反复陷入「努力→失败→自责」的循环
          </p>
        </div>
      </Card>

      {/* Section 3: Authority Data */}
      <Card className="p-4 bg-gradient-to-br from-indigo-50 via-violet-50 to-white border-indigo-200 shadow-sm">
        <div className="flex items-center gap-2 mb-3">
          <Shield className="w-4 h-4 text-indigo-600" />
          <h3 className="font-medium text-sm text-slate-800">来自权威机构的研究</h3>
        </div>
        <div className="space-y-3">
          {authorityData.map((item, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0.01, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + idx * 0.1 }}
              style={{ transform: 'translateZ(0)', willChange: 'transform, opacity' }}
              className="flex items-start gap-3 p-3 rounded-lg bg-white border border-indigo-200"
            >
              <span className="text-xl shrink-0">{item.icon}</span>
              <div className="min-w-0">
                <div className="text-xs text-indigo-500 mb-0.5">{item.source}</div>
                <div className="text-sm text-slate-700">
                  <span className="text-indigo-600 font-bold text-lg">{item.stat}</span>
                  <span className="text-slate-600 ml-1">{item.desc}</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </Card>

      {/* Section 4: AI Comparison Card - NEW */}
      <AIComparisonCard />


      {/* Section 5: Assessment Structure - Onion Model */}
      <Card className="p-5 bg-white border-slate-200 shadow-sm">
        <h3 className="font-medium text-sm mb-4 text-center text-slate-800">
          测评结构 · 三层剥离法
        </h3>
        
        {/* SVG Onion Concentric Circles */}
        <div className="relative w-full aspect-square max-w-[240px] mx-auto">
          <svg viewBox="0 0 200 200" className="w-full h-full">
            {/* Gradient Definitions - Light theme */}
            <defs>
              <radialGradient id="behaviorGradient" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#fbbf24" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#d97706" stopOpacity="0.7" />
              </radialGradient>
              <radialGradient id="emotionGradient" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#f97316" stopOpacity="0.5" />
                <stop offset="100%" stopColor="#ea580c" stopOpacity="0.8" />
              </radialGradient>
              <radialGradient id="beliefGradient" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#ef4444" stopOpacity="0.7" />
                <stop offset="100%" stopColor="#dc2626" stopOpacity="0.95" />
              </radialGradient>
              {/* Enhanced Glow filter for core - multi-layer glow */}
              <filter id="coreGlow" x="-100%" y="-100%" width="300%" height="300%">
                <feGaussianBlur in="SourceGraphic" stdDeviation="2" result="blur1"/>
                <feColorMatrix in="blur1" type="matrix" 
                  values="1 0 0 0 0.2
                          0 0.2 0 0 0
                          0 0 0.1 0 0
                          0 0 0 1 0" result="glow1"/>
                <feGaussianBlur in="SourceGraphic" stdDeviation="6" result="blur2"/>
                <feColorMatrix in="blur2" type="matrix"
                  values="1 0 0 0 0.1
                          0 0.15 0 0 0
                          0 0 0.05 0 0
                          0 0 0 0.8 0" result="glow2"/>
                <feGaussianBlur in="SourceGraphic" stdDeviation="12" result="blur3"/>
                <feColorMatrix in="blur3" type="matrix"
                  values="0.9 0 0 0 0
                          0 0.1 0 0 0
                          0 0 0 0 0
                          0 0 0 0.5 0" result="glow3"/>
                <feMerge>
                  <feMergeNode in="glow3"/>
                  <feMergeNode in="glow2"/>
                  <feMergeNode in="glow1"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
            </defs>
            
            {/* Ripple Waves - Outward diffusion from core */}
            {[0, 1, 2].map((i) => (
              <motion.circle
                key={`ripple-${i}`}
                cx="100" 
                cy="100" 
                r="38"
                fill="none"
                stroke="#ef4444"
                strokeWidth="2"
                strokeDasharray="6 4"
                initial={{ scale: 1, opacity: 0 }}
                animate={{ 
                  scale: [1, 2.4], 
                  opacity: [0.5, 0] 
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  delay: i * 1,
                  ease: "easeOut"
                }}
                style={{ transformOrigin: "100px 100px" }}
              />
            ))}
            
            {/* Outer Ring - Behavior Layer with breathing */}
            <motion.circle 
              cx="100" cy="100" r="90"
              fill="none" 
              stroke="url(#behaviorGradient)" 
              strokeWidth="18"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ 
                opacity: [0.8, 1, 0.8], 
                scale: 1 
              }}
              transition={{ 
                opacity: { duration: 3, repeat: Infinity, ease: "easeInOut" },
                scale: { delay: 0.2, duration: 0.5 }
              }}
            />
            <motion.text 
              x="100" y="22" 
              textAnchor="middle" 
              fontSize="10" 
              fill="#b45309"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              🚶 行为层
            </motion.text>
            
            {/* Middle Ring - Emotion Layer with breathing */}
            <motion.circle 
              cx="100" cy="100" r="65"
              fill="none" 
              stroke="url(#emotionGradient)" 
              strokeWidth="18"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ 
                opacity: [0.85, 1, 0.85], 
                scale: 1 
              }}
              transition={{ 
                opacity: { duration: 3, repeat: Infinity, ease: "easeInOut", delay: 0.5 },
                scale: { delay: 0.4, duration: 0.5 }
              }}
            />
            <motion.text 
              x="155" y="55" 
              textAnchor="middle" 
              fontSize="10" 
              fill="#c2410c"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
            >
              💭 情绪层
            </motion.text>
            
            {/* Core Circle - Belief Layer with pulse */}
            <motion.circle 
              cx="100" cy="100" r="38"
              fill="url(#beliefGradient)"
              filter="url(#coreGlow)"
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ 
                opacity: 1, 
                scale: [1, 1.06, 1]
              }}
              transition={{ 
                opacity: { delay: 0.6, duration: 0.5 },
                scale: { duration: 2, repeat: Infinity, ease: "easeInOut" }
              }}
              style={{ transformOrigin: "100px 100px" }}
            />
            <motion.text 
              x="100" y="95" 
              textAnchor="middle" 
              fontSize="10" 
              fill="#ffffff"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
            >
              💡 信念层
            </motion.text>
            <motion.text 
              x="100" y="110" 
              textAnchor="middle" 
              fontSize="8" 
              fill="#fecaca"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.9 }}
            >
              根本原因
            </motion.text>
          </svg>
        </div>
        
        {/* Legend - Three Columns */}
        <div className="grid grid-cols-3 gap-2 mt-4">
          {/* Behavior Layer */}
          <motion.div 
            className="text-center p-2.5 rounded-lg bg-amber-50 border border-amber-200"
            initial={{ opacity: 0.01, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            style={{ transform: 'translateZ(0)', willChange: 'transform, opacity' }}
          >
            <div className="text-lg mb-1">🚶</div>
            <div className="text-xs font-medium text-amber-700">行为层</div>
            <div className="text-[10px] text-amber-600">表面症状</div>
            <div className="text-[10px] text-slate-500 mt-1">10题</div>
          </motion.div>
          
          {/* Emotion Layer */}
          <motion.div 
            className="text-center p-2.5 rounded-lg bg-orange-50 border border-orange-200"
            initial={{ opacity: 0.01, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            style={{ transform: 'translateZ(0)', willChange: 'transform, opacity' }}
          >
            <div className="text-lg mb-1">💭</div>
            <div className="text-xs font-medium text-orange-700">情绪层</div>
            <div className="text-[10px] text-orange-600">内在触发</div>
            <div className="text-[10px] text-slate-500 mt-1">10题</div>
          </motion.div>
          
          {/* Belief Layer */}
          <motion.div 
            className="text-center p-2.5 rounded-lg bg-red-50 border border-red-200"
            initial={{ opacity: 0.01, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            style={{ transform: 'translateZ(0)', willChange: 'transform, opacity' }}
          >
            <div className="text-lg mb-1">💡</div>
            <div className="text-xs font-medium text-red-700">信念层</div>
            <div className="text-[10px] text-red-600">根本原因</div>
            <div className="text-[10px] text-slate-500 mt-1">10题</div>
          </motion.div>
        </div>
        
        {/* Bottom Guide Text */}
        <p className="text-center text-[10px] text-slate-500 mt-3">
          由外向内 · 层层剥离 · 直达核心卡点
        </p>
      </Card>

      {/* Section 7: Assessment Flow */}
      <AssessmentFlowCard />

      {/* Section 8: Assessment Preview */}
      <AssessmentPreviewCard />


      {/* Section 9: Pricing Module */}
      <Card className="p-5 bg-gradient-to-br from-amber-50 via-orange-50 to-white border-amber-300 relative overflow-hidden shadow-sm">
        <div className="absolute top-0 right-0 w-24 h-24 bg-amber-200/40 rounded-full blur-2xl" />
        <div className="absolute -bottom-4 -left-4 w-20 h-20 bg-orange-200/40 rounded-full blur-xl" />
        
        <div className="relative text-center space-y-4">
          <h3 className="font-bold text-lg text-slate-800">开启你的财富觉醒之旅</h3>
          
          <div className="flex items-center justify-center gap-3">
            <span className="text-4xl font-bold text-amber-600">¥9.9</span>
            <span className="px-2 py-0.5 bg-red-500 rounded text-xs text-white font-medium animate-pulse">限时</span>
          </div>
          
          <div className="grid grid-cols-2 gap-2 text-left">
            {pricingIncludes.map((item, idx) => (
              <div key={idx} className="flex items-center gap-1.5 text-xs text-slate-600">
                <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span>{item}</span>
              </div>
            ))}
          </div>
          
          <Button
            onClick={handlePayClick}
            size="lg"
            className="w-full h-12 text-base font-bold bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 hover:from-amber-600 hover:via-orange-600 hover:to-red-600 shadow-lg shadow-amber-500/30 border-0 text-white"
          >
            <span className="flex items-center gap-2">
              {hasPurchased ? '继续测评' : '立即测评'}
              <ArrowRight className="w-4 h-4" />
            </span>
          </Button>
          
          {/* 邀请码兑换入口 - 已登录、未购买、非绽放合伙人、且购买状态已确认加载完成 */}
          {isLoggedIn && !hasPurchased && !isBloomPartner && !isLoading && (
            <BloomInviteCodeEntry variant="card" onSuccess={onStart} />
          )}

          {/* 底部登录入口 */}
          {!isLoggedIn && (
            <button
              onClick={onLogin}
              className="w-full mt-3 py-2 text-sm text-primary hover:underline flex items-center justify-center gap-1.5"
            >
              <LogIn className="w-4 h-4" />
              已有账号？点击登录
            </button>
          )}
          
          
          <p className="text-xs text-slate-400 pt-2 border-t border-amber-200 text-center">
            💎 财富卡点测评 · Powered by 有劲AI
          </p>
        </div>
      </Card>
    </motion.div>
  );
}
