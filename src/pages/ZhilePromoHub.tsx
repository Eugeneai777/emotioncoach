import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles, Brain, Heart, MessageCircle, BookOpen, Users, Shield, Pill, BarChart3, Zap, Eye } from "lucide-react";
import zhileCapsules from "@/assets/zhile-capsules.jpeg";

interface PromoCard {
  id: string;
  title: string;
  subtitle: string;
  emoji: string;
  gradient: string;
  path: string;
  category: 'coach' | 'tool' | 'assessment' | 'camp' | 'partner' | 'bundle';
  tag?: string;
}

const promoCards: PromoCard[] = [
  // 组合套餐
  {
    id: 'synergy',
    title: '心智×身体 全天候抗压套餐',
    subtitle: '训练营 + 知乐胶囊，双引擎协同',
    emoji: '🔥',
    gradient: 'from-blue-600 to-violet-600',
    path: '/promo/synergy',
    category: 'bundle',
    tag: '限时特惠',
  },
  // AI教练
  {
    id: 'vibrant-life',
    title: 'AI生活教练',
    subtitle: '24小时智能陪伴，5大生活场景',
    emoji: '🌟',
    gradient: 'from-indigo-500 to-purple-500',
    path: '/vibrant-life-intro',
    category: 'coach',
  },
  {
    id: 'parent-coach',
    title: '亲子情绪教练',
    subtitle: '读懂情绪，连结孩子',
    emoji: '💜',
    gradient: 'from-pink-600 to-rose-500',
    path: '/parent-coach-intro',
    category: 'coach',
  },
  {
    id: 'parent-teen',
    title: '亲子双轨模式',
    subtitle: '父母与孩子各有独立空间',
    emoji: '👨‍👩‍👧',
    gradient: 'from-violet-500 to-purple-500',
    path: '/parent-teen-intro',
    category: 'coach',
  },
  {
    id: 'wealth-coach',
    title: '财富觉醒教练',
    subtitle: '看见卡点，突破限制',
    emoji: '💰',
    gradient: 'from-amber-500 to-orange-600',
    path: '/wealth-coach-intro',
    category: 'coach',
  },
  {
    id: 'story-coach',
    title: '故事教练',
    subtitle: '把经历变成力量',
    emoji: '📖',
    gradient: 'from-cyan-600 to-blue-600',
    path: '/story-coach-intro',
    category: 'coach',
  },
  {
    id: 'communication-coach',
    title: '沟通教练',
    subtitle: '化解冲突，高效表达',
    emoji: '💬',
    gradient: 'from-blue-600 to-indigo-600',
    path: '/communication-intro',
    category: 'coach',
  },
  {
    id: 'coach-space',
    title: 'AI教练空间',
    subtitle: '7位AI教练，随时待命',
    emoji: '🎯',
    gradient: 'from-sky-500 to-cyan-500',
    path: '/coach-space-intro',
    category: 'coach',
  },
  // 工具
  {
    id: 'energy-studio',
    title: '有劲生活馆',
    subtitle: '情绪梳理一站式入口',
    emoji: '✨',
    gradient: 'from-teal-500 to-emerald-500',
    path: '/energy-studio-intro',
    category: 'tool',
  },
  {
    id: 'awakening',
    title: '觉察系统',
    subtitle: '6维深度觉察训练',
    emoji: '🔮',
    gradient: 'from-violet-600 to-purple-600',
    path: '/awakening-intro',
    category: 'tool',
  },
  {
    id: 'alive-check',
    title: '安全打卡',
    subtitle: '让关心你的人安心',
    emoji: '💗',
    gradient: 'from-pink-500 to-rose-500',
    path: '/alive-check-intro',
    category: 'tool',
  },
  // 测评
  {
    id: 'scl90',
    title: 'SCL-90 心理健康自评',
    subtitle: '专业90题量表，10大因子',
    emoji: '🧠',
    gradient: 'from-purple-600 to-indigo-600',
    path: '/scl90',
    category: 'assessment',
  },
  {
    id: 'emotion-health',
    title: '情绪健康测评',
    subtitle: '32题三层诊断，找到情绪卡点',
    emoji: '❤️‍🩹',
    gradient: 'from-violet-500 to-pink-500',
    path: '/emotion-health',
    category: 'assessment',
  },
  {
    id: 'wealth-block',
    title: '财富卡点测评',
    subtitle: '30个场景深度扫描财富盲点',
    emoji: '💎',
    gradient: 'from-amber-600 to-purple-600',
    path: '/wealth-block-intro',
    category: 'assessment',
  },
  // 训练营
  {
    id: 'wealth-camp',
    title: '财富觉醒训练营',
    subtitle: '7天突破财富天花板',
    emoji: '🏕️',
    gradient: 'from-orange-500 to-amber-500',
    path: '/wealth-camp-intro',
    category: 'camp',
  },
  // 合伙人
  {
    id: 'partner-intro',
    title: '有劲合伙人',
    subtitle: '边成长边赚钱，零门槛',
    emoji: '💪',
    gradient: 'from-orange-500 to-red-600',
    path: '/partner-intro',
    category: 'partner',
  },
  {
    id: 'youjin-partner',
    title: '有劲合伙人计划',
    subtitle: '高额佣金，专属培训支持',
    emoji: '🚀',
    gradient: 'from-orange-600 to-red-600',
    path: '/partner/youjin-intro',
    category: 'partner',
  },
  {
    id: 'bloom-partner',
    title: '财富觉醒3部曲',
    subtitle: '测评→训练营→成为合伙人',
    emoji: '🌸',
    gradient: 'from-purple-500 to-violet-600',
    path: '/bloom-partner-intro',
    category: 'partner',
  },
  // 平台介绍
  {
    id: 'platform-intro',
    title: '有劲AI · 每个人的生活教练',
    subtitle: '温暖陪伴 × 系统工具 × 成长社群',
    emoji: '🌟',
    gradient: 'from-indigo-500 to-pink-500',
    path: '/platform-intro',
    category: 'tool',
  },
  {
    id: 'introduction',
    title: '有劲AI 介绍',
    subtitle: '7位AI教练24小时在线',
    emoji: '📋',
    gradient: 'from-pink-500 to-violet-500',
    path: '/introduction',
    category: 'tool',
  },
];

const categoryLabels: Record<string, { label: string; icon: React.ReactNode }> = {
  bundle: { label: '组合套餐', icon: <Pill className="w-4 h-4" /> },
  coach: { label: 'AI教练', icon: <Brain className="w-4 h-4" /> },
  tool: { label: '工具 & 平台', icon: <Zap className="w-4 h-4" /> },
  assessment: { label: '测评诊断', icon: <BarChart3 className="w-4 h-4" /> },
  camp: { label: '训练营', icon: <Shield className="w-4 h-4" /> },
  partner: { label: '合伙人', icon: <Users className="w-4 h-4" /> },
};

const categoryOrder = ['bundle', 'coach', 'assessment', 'tool', 'camp', 'partner'];

export default function ZhilePromoHub() {
  const navigate = useNavigate();

  const groupedCards = categoryOrder.map(cat => ({
    category: cat,
    ...categoryLabels[cat],
    cards: promoCards.filter(c => c.category === cat),
  })).filter(g => g.cards.length > 0);

  return (
    <div className="min-h-screen bg-[#0a0e1a] text-slate-100 pb-12">
      {/* Hero */}
      <section className="relative overflow-hidden px-4 pt-14 pb-10 text-center"
        style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #172554 100%)' }}>
        {/* Floating dots */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {Array.from({ length: 12 }).map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1.5 h-1.5 rounded-full bg-blue-400/20"
              style={{ left: `${8 + i * 8}%`, top: `${15 + (i % 4) * 20}%` }}
              animate={{ y: [-8, 8, -8], opacity: [0.2, 0.5, 0.2] }}
              transition={{ duration: 4 + i * 0.3, repeat: Infinity }}
            />
          ))}
        </div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 text-xs mb-5">
            <Sparkles className="w-3.5 h-3.5" />
            知乐推广中心
          </div>

          <h1 className="text-2xl sm:text-3xl font-black mb-3">
            <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-violet-400 bg-clip-text text-transparent">
              全部推广页面
            </span>
          </h1>
          <p className="text-slate-400 text-sm max-w-md mx-auto">
            一站式浏览所有产品推广页 · 复制链接即可分享
          </p>

          {/* Product image */}
          <div className="mt-6 flex justify-center">
            <div className="relative">
              <img
                src={zhileCapsules}
                alt="知乐胶囊"
                className="w-28 h-28 object-cover rounded-2xl border-2 border-cyan-500/30 shadow-lg shadow-cyan-500/10"
              />
              <div className="absolute -bottom-2 -right-2 bg-gradient-to-r from-cyan-500 to-blue-500 text-white text-[10px] font-bold px-2.5 py-1 rounded-full shadow">
                {promoCards.length} 个页面
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Cards by category */}
      <div className="px-4 sm:px-6 max-w-2xl mx-auto mt-6 space-y-8">
        {groupedCards.map((group, gi) => (
          <motion.div
            key={group.category}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: gi * 0.08 }}
          >
            {/* Category header */}
            <div className="flex items-center gap-2 mb-3 px-1">
              <div className="w-7 h-7 rounded-lg bg-slate-800 border border-slate-700/60 flex items-center justify-center text-slate-400">
                {group.icon}
              </div>
              <h2 className="text-sm font-bold text-slate-300">{group.label}</h2>
              <span className="text-xs text-slate-600 ml-auto">{group.cards.length} 个</span>
            </div>

            {/* Cards */}
            <div className="space-y-2.5">
              {group.cards.map((card, ci) => (
                <motion.button
                  key={card.id}
                  initial={{ opacity: 0, x: -10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: ci * 0.05 }}
                  onClick={() => navigate(card.path)}
                  className="w-full flex items-center gap-3 p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/40 hover:border-slate-600/60 hover:bg-slate-800/80 transition-all text-left group"
                >
                  {/* Emoji badge */}
                  <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${card.gradient} flex items-center justify-center shrink-0 shadow-md`}>
                    <span className="text-xl">{card.emoji}</span>
                  </div>

                  {/* Text */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-semibold text-slate-200 truncate">{card.title}</h3>
                      {card.tag && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-400 shrink-0">
                          {card.tag}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 truncate mt-0.5">{card.subtitle}</p>
                  </div>

                  {/* Arrow */}
                  <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-slate-400 transition-colors shrink-0" />
                </motion.button>
              ))}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Footer */}
      <div className="text-center mt-10 px-4">
        <p className="text-xs text-slate-600">💊 知乐 · 让每一次分享都有价值</p>
      </div>
    </div>
  );
}
