import React from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { DynamicOGMeta } from "@/components/common/DynamicOGMeta";
import { ArrowLeft, ArrowRight, Clock, Lock, GraduationCap, Eye, Heart, Lightbulb, RefreshCw, Target, ChevronRight, Sparkles, Users, BookOpen } from "lucide-react";
import { IntroShareDialog } from "@/components/common/IntroShareDialog";
import { introShareConfigs } from "@/config/introShareConfig";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useActiveCoachTemplates } from "@/hooks/useCoachTemplates";
import { categories as toolCategories } from "@/config/energyStudioTools";

// 四层支持系统数据
const fourLayers = [
  { 
    level: 1, 
    emoji: '📝', 
    name: '轻记录入口', 
    desc: '6大觉醒维度：情绪/感恩/行动/选择/关系/方向',
    color: 'bg-amber-100 text-amber-700',
    gradient: 'from-amber-400 to-orange-500'
  },
  { 
    level: 2, 
    emoji: '🪞', 
    name: '智能看见', 
    desc: '5件事：看见状态、告诉正常、指出盲点、新角度、微行动',
    color: 'bg-blue-100 text-blue-700',
    gradient: 'from-blue-400 to-cyan-500'
  },
  { 
    level: 3, 
    emoji: '🤍', 
    name: 'AI教练深入', 
    desc: '当问题反复出现时，专业AI教练陪你深入理清',
    color: 'bg-purple-100 text-purple-700',
    gradient: 'from-purple-400 to-pink-500'
  },
  { 
    level: 4, 
    emoji: '🤝', 
    name: '真人支持', 
    desc: '21天训练营 + 真人教练，被陪着走一段',
    color: 'bg-teal-100 text-teal-700',
    gradient: 'from-teal-400 to-emerald-500'
  },
];

// 教练Emoji映射
const coachEmojiMap: Record<string, string> = {
  emotion: '💚',
  parent: '👨‍👩‍👧',
  story: '📖',
  vibrant_life_sage: '❤️',
  communication: '💬',
  wealth_coach_4_questions: '💰',
  gratitude_coach: '🌸',
};

// 教练场景映射
const coachScenarios: Record<string, string[]> = {
  emotion: ['焦虑', '压力', '情绪低落'],
  wealth_coach_4_questions: ['财务焦虑', '卡点突破'],
  parent: ['亲子冲突', '沟通障碍'],
  communication: ['人际关系', '职场沟通'],
  story: ['人生规划', '自我探索'],
  gratitude_coach: ['幸福感提升', '正向心态'],
  vibrant_life_sage: ['日常问题', '综合陪伴'],
};

// 教练渐变映射
const coachGradientMap: Record<string, string> = {
  emotion: 'from-emerald-400 to-teal-500',
  parent: 'from-pink-400 to-rose-500',
  story: 'from-amber-400 to-orange-500',
  vibrant_life_sage: 'from-rose-400 to-pink-500',
  communication: 'from-blue-400 to-indigo-500',
  wealth_coach_4_questions: 'from-amber-400 to-yellow-500',
  gratitude_coach: 'from-pink-300 to-rose-400',
};

// 有劲AI六大能力
const aiCapabilities = [
  { icon: '💬', text: '对话式陪伴' },
  { icon: '📊', text: '情绪洞察' },
  { icon: '🧭', text: '行为教练' },
  { icon: '📋', text: '日报周报' },
  { icon: '👥', text: '社群共振' },
  { icon: '🧠', text: '大模型智慧' },
];

// 用户价值
const userValues = [
  { emoji: '🎯', text: '清晰方向' },
  { emoji: '💪', text: '稳定心态' },
  { emoji: '✅', text: '可执行行动' },
  { emoji: '📈', text: '持续成长' },
  { emoji: '🤗', text: '被理解、被陪伴的力量' },
];

// 核心价值（3项）
const platformCoreValues = [
  { 
    num: 1,
    title: '温暖陪伴与真实关系', 
    desc: '提供情绪理解、倾听、反思，帮助你被看见',
    gradient: 'from-rose-400 to-pink-500'
  },
  { 
    num: 2,
    title: '系统工具与实用方法', 
    desc: '结构化流程：看见 → 理解 → 行动 → 成长',
    gradient: 'from-blue-400 to-indigo-500'
  },
  { 
    num: 3,
    title: '社群联结与成长共振', 
    desc: '绽放故事、伙伴支持、训练营，让改变不再孤单',
    gradient: 'from-amber-400 to-orange-500'
  },
];

// 教练核心价值
const coachCoreValues = [
  { icon: Clock, title: '24/7 随时陪伴', description: '不分时间地点', gradient: 'from-blue-400 to-cyan-500' },
  { icon: Lock, title: '隐私安全', description: '加密保护对话', gradient: 'from-emerald-400 to-teal-500' },
  { icon: GraduationCap, title: '专业陪伴', description: '心理学框架', gradient: 'from-violet-400 to-purple-500' },
  { icon: BookOpen, title: '我的日记', description: '日报/周报/档案', gradient: 'from-amber-400 to-orange-500' },
];

// 生活馆关键功能
const studioKeyFeatures = [
  { emoji: '🔮', name: '觉醒入口', desc: '6维深度觉察训练', route: '/awakening' },
  { emoji: '💰', name: '财富卡点测评', desc: 'AI财富心理测评', route: '/wealth-block' },
  { emoji: '📚', name: '学习课程', desc: '情绪/财富课程库', route: '/courses' },
  { emoji: '🏕️', name: '训练营', desc: '21天系统训练', route: '/camps' },
];

// 合伙人类型
const partnerTypes = [
  { 
    emoji: '💪', 
    name: '有劲合伙人', 
    desc: '体验包分发模式',
    price: '¥999起',
    features: ['预购体验包', '分发建立关系', '持续佣金20%-50%'],
    route: '/partner/youjin-intro',
    gradient: 'from-orange-400 to-amber-500'
  },
  { 
    emoji: '👑', 
    name: '绽放合伙人', 
    desc: '直推分成模式',
    price: '¥19,800',
    features: ['直推30%佣金', '二级10%佣金', '永久收益'],
    route: '/partner-intro',
    gradient: 'from-purple-400 to-pink-500'
  },
];

// 快捷入口
const quickLinks = [
  { category: '教练相关', links: [
    { name: '教练空间介绍', route: '/coach-space-intro' },
    { name: '生活教练', route: '/vibrant-life-intro' },
    { name: '亲子教练', route: '/parent-coach-intro' },
    { name: '财富教练', route: '/wealth-coach-intro' },
  ]},
  { category: '工具相关', links: [
    { name: '生活馆介绍', route: '/energy-studio-intro' },
    { name: '觉醒系统', route: '/awakening-intro' },
    { name: '四层支持', route: '/transformation-flow' },
  ]},
  { category: '商业相关', links: [
    { name: '有劲合伙人', route: '/partner/youjin-intro' },
    { name: '绽放合伙人', route: '/partner-intro' },
    { name: '推广指南', route: '/partner/promo-guide' },
  ]},
];

const PlatformIntro = () => {
  const navigate = useNavigate();
  const { data: templates, isLoading } = useActiveCoachTemplates();

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50 pb-[env(safe-area-inset-bottom)]">
      <DynamicOGMeta pageKey="platformIntro" />
      
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-100">
        <div className="flex items-center justify-between px-4 h-14">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-slate-600">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="font-semibold text-slate-800">有劲AI平台介绍</h1>
          <IntroShareDialog config={introShareConfigs.platformIntro} />
        </div>
      </header>

      {/* 第一章｜什么是有劲AI？ */}
      <section className="relative px-4 pt-6 pb-6 overflow-hidden">
        <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-primary/20 to-accent/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-tr from-warm/20 to-primary/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="relative"
        >
          {/* 核心定义 - 突出视觉 */}
          <Card className="p-4 border border-primary/10 shadow-md bg-gradient-to-br from-primary/5 via-accent/5 to-warm/5 mb-5">
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary via-accent to-warm flex items-center justify-center flex-shrink-0 shadow-lg">
                <span className="text-3xl">🌟</span>
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-800">有劲AI是一位</p>
                <p className="text-primary font-bold text-lg">懂你、陪你、帮你成长的生活教练</p>
              </div>
            </div>
          </Card>
          
          {/* 六大能力 - 2x3 真正网格 */}
          <div className="mb-5">
            <p className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-primary" />
              它结合：
            </p>
            <div className="grid grid-cols-2 gap-2.5">
              {aiCapabilities.map((cap, index) => (
                <Card key={index} className="p-3 border border-slate-100 shadow-sm bg-white hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-slate-100 to-slate-50 flex items-center justify-center flex-shrink-0">
                      <span className="text-xl">{cap.icon}</span>
                    </div>
                    <p className="text-sm text-slate-700 font-medium">{cap.text}</p>
                  </div>
                </Card>
              ))}
            </div>
          </div>
          
          {/* 用户价值 - 紧凑两行居中 */}
          <Card className="p-4 border border-slate-100 shadow-sm mb-5 bg-gradient-to-br from-slate-50 to-white">
            <p className="text-sm font-semibold text-slate-700 mb-3 text-center">在生活里获得：</p>
            <div className="flex flex-wrap justify-center gap-2">
              {userValues.map((value, index) => (
                <span key={index} className="px-3 py-1.5 bg-primary/10 text-slate-700 rounded-full text-xs font-medium shadow-sm border border-primary/5">
                  {value.emoji} {value.text}
                </span>
              ))}
            </div>
          </Card>
          
          {/* 使命与愿景 - 增强视觉 */}
          <div className="grid grid-cols-2 gap-3 mb-5">
            <Card className="p-4 border border-rose-100 shadow-md bg-gradient-to-br from-rose-50 via-pink-50 to-white">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-rose-400 to-pink-500 flex items-center justify-center">
                  <span className="text-sm">🎯</span>
                </div>
                <p className="text-xs font-bold text-rose-600">使命 Mission</p>
              </div>
              <p className="text-sm text-slate-700 leading-relaxed">
                让好的行为变得简单，让更好的自己成为必然
              </p>
            </Card>
            <Card className="p-4 border border-blue-100 shadow-md bg-gradient-to-br from-blue-50 via-indigo-50 to-white">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center">
                  <span className="text-sm">🔭</span>
                </div>
                <p className="text-xs font-bold text-blue-600">愿景 Vision</p>
              </div>
              <p className="text-sm text-slate-700 leading-relaxed">
                让 AI 成为每一个人的生活教练，让成长可见、可感、可持续
              </p>
            </Card>
          </div>
          
          {/* 核心价值（3项）- 真正横向滚动 */}
          <div className="mb-5">
            <p className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-accent" />
              核心价值
            </p>
            <div className="overflow-x-auto scrollbar-hide -mx-4 px-4 pb-2">
              <div className="flex gap-3" style={{ width: 'max-content' }}>
                {platformCoreValues.map((value) => (
                  <Card key={value.num} className="w-[160px] flex-shrink-0 p-4 border border-slate-100 shadow-md hover:shadow-lg transition-shadow bg-white">
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${value.gradient} flex items-center justify-center mb-3 shadow-sm`}>
                      <span className="text-white text-sm font-bold">{value.num}</span>
                    </div>
                    <h4 className="font-bold text-sm text-slate-800 mb-1.5">{value.title}</h4>
                    <p className="text-xs text-slate-500 leading-relaxed">{value.desc}</p>
                  </Card>
                ))}
              </div>
            </div>
          </div>
          
          {/* CTA */}
          <Button 
            onClick={() => navigate('/coach/vibrant_life_sage')}
            size="lg"
            className="w-full bg-gradient-to-r from-primary to-accent text-white shadow-lg hover:shadow-xl transition-shadow text-base"
          >
            立即体验 <ArrowRight className="w-5 h-5 ml-1.5" />
          </Button>
        </motion.div>
      </section>

      {/* 分隔线 */}
      <div className="mx-4 h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent" />

      {/* 四层支持系统 */}
      <section className="px-4 py-6">
        <h3 className="text-base font-bold text-slate-800 mb-4 flex items-center gap-2">
          <span className="text-xl">🏗️</span> 四层支持系统
        </h3>
        
        <div className="space-y-3">
          {fourLayers.map((layer, index) => (
            <motion.div
              key={layer.level}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="p-4 border border-slate-100 shadow-md hover:shadow-lg transition-shadow">
                <div className="flex items-center gap-4">
                  <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${layer.gradient} flex items-center justify-center flex-shrink-0 shadow-md`}>
                    <span className="text-2xl">{layer.emoji}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`px-2 py-0.5 ${layer.color} rounded-md text-xs font-bold`}>L{layer.level}</span>
                      <h4 className="font-bold text-sm text-slate-800">{layer.name}</h4>
                    </div>
                    <p className="text-sm text-slate-500 leading-relaxed">{layer.desc}</p>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
        
        <Button 
          variant="outline" 
          className="w-full mt-4 text-primary border-primary/30 hover:bg-primary/5"
          onClick={() => navigate('/transformation-flow')}
        >
          了解四层支持详情 <ChevronRight className="w-4 h-4" />
        </Button>
      </section>

      {/* 分隔线 */}
      <div className="mx-4 h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent" />

      {/* 教练空间 */}
      <section className="px-4 py-6 bg-gradient-to-b from-slate-50/80 to-white">
        <h3 className="text-base font-bold text-slate-800 mb-4 flex items-center gap-2">
          <span className="text-xl">🤖</span> 教练空间
        </h3>
        
        {/* 核心价值 */}
        <div className="grid grid-cols-4 gap-2 mb-4">
          {coachCoreValues.map((value, index) => (
            <motion.div
              key={value.title}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="p-2 text-center border-0 shadow-sm">
                <div className={`w-8 h-8 mx-auto mb-1 rounded-lg bg-gradient-to-br ${value.gradient} flex items-center justify-center`}>
                  <value.icon className="w-4 h-4 text-white" />
                </div>
                <h4 className="text-[10px] font-semibold text-slate-700">{value.title}</h4>
                <p className="text-[9px] text-slate-500">{value.description}</p>
              </Card>
            </motion.div>
          ))}
        </div>
        
        {/* 我的日记详情 */}
        <Card className="mb-4 p-3 border-0 shadow-sm bg-gradient-to-r from-amber-50 to-orange-50">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <div>
              <h4 className="font-semibold text-sm text-slate-800">我的日记系统</h4>
              <p className="text-[10px] text-slate-500">你只需一句话，AI完成剩下全部</p>
            </div>
          </div>
          
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="p-2 bg-white/60 rounded-lg">
              <span className="text-lg">📋</span>
              <p className="text-[10px] font-medium text-slate-700">有劲日报</p>
              <p className="text-[9px] text-slate-500">每日情绪总结</p>
            </div>
            <div className="p-2 bg-white/60 rounded-lg">
              <span className="text-lg">📊</span>
              <p className="text-[10px] font-medium text-slate-700">有劲周报</p>
              <p className="text-[9px] text-slate-500">7天趋势追踪</p>
            </div>
            <div className="p-2 bg-white/60 rounded-lg">
              <span className="text-lg">📁</span>
              <p className="text-[10px] font-medium text-slate-700">成长档案</p>
              <p className="text-[9px] text-slate-500">21天完整记录</p>
            </div>
          </div>
        </Card>
        
        {/* 教练列表 */}
        <div className="grid grid-cols-2 gap-2">
          {isLoading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-20 bg-slate-100 rounded-xl animate-pulse" />
            ))
          ) : (
            templates?.slice(0, 6).map((coach, index) => {
              const emoji = coachEmojiMap[coach.coach_key] || '🤖';
              const scenarios = coachScenarios[coach.coach_key] || [];
              const gradient = coachGradientMap[coach.coach_key] || 'from-slate-400 to-slate-500';
              
              return (
                <motion.div
                  key={coach.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card 
                    className="p-3 border-0 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => coach.page_route && navigate(coach.page_route)}
                  >
                    <div className="flex items-start gap-2">
                      <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${gradient} flex items-center justify-center flex-shrink-0`}>
                        <span className="text-lg">{emoji}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-xs text-slate-800 truncate">{coach.title}</h4>
                        {scenarios.length > 0 && (
                          <p className="text-[10px] text-slate-500 truncate">{scenarios.join(' · ')}</p>
                        )}
                      </div>
                    </div>
                  </Card>
                </motion.div>
              );
            })
          )}
        </div>
        
        <Button 
          variant="ghost" 
          className="w-full mt-3 text-primary"
          onClick={() => navigate('/coach-space')}
        >
          进入教练空间 <ChevronRight className="w-4 h-4" />
        </Button>
      </section>

      {/* 分隔线 */}
      <div className="mx-4 h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent" />

      {/* 有劲生活馆 */}
      <section className="px-4 py-6">
        <h3 className="text-base font-bold text-slate-800 mb-4 flex items-center gap-2">
          <span className="text-xl">🏛️</span> 有劲生活馆
        </h3>
        
        {/* 三大工具分类 */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          {toolCategories.map((category, index) => (
            <motion.div
              key={category.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className={`p-2 text-center border-0 shadow-sm bg-gradient-to-br ${category.tabGradient} text-white`}>
                <span className="text-xl block mb-0.5">{category.emoji}</span>
                <h4 className="text-[10px] font-semibold">{category.name}</h4>
              </Card>
            </motion.div>
          ))}
        </div>
        
        {/* 关键功能入口 */}
        <div className="grid grid-cols-2 gap-2">
          {studioKeyFeatures.map((feature, index) => (
            <motion.div
              key={feature.name}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.08 }}
            >
              <Card 
                className="p-3 border-0 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => navigate(feature.route)}
              >
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{feature.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-xs text-slate-800">{feature.name}</h4>
                    <p className="text-[10px] text-slate-500">{feature.desc}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 flex-shrink-0" />
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
        
        <Button 
          variant="ghost" 
          className="w-full mt-3 text-primary"
          onClick={() => navigate('/energy-studio')}
        >
          进入有劲生活馆 <ChevronRight className="w-4 h-4" />
        </Button>
      </section>

      {/* 分隔线 */}
      <div className="mx-4 h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent" />

      {/* 合伙人体系 */}
      <section className="px-4 py-6 bg-gradient-to-b from-slate-50/80 to-white">
        <h3 className="text-base font-bold text-slate-800 mb-2 flex items-center gap-2">
          <span className="text-xl">🤝</span> 合伙人体系
        </h3>
        <p className="text-sm text-slate-500 mb-4">
          分享的不是商品，而是被帮助到的体验
        </p>
        
        <div className="grid grid-cols-2 gap-3">
          {partnerTypes.map((partner, index) => (
            <motion.div
              key={partner.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card 
                className="p-3 border-0 shadow-sm hover:shadow-md transition-shadow cursor-pointer h-full"
                onClick={() => navigate(partner.route)}
              >
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${partner.gradient} flex items-center justify-center mb-2`}>
                  <span className="text-2xl">{partner.emoji}</span>
                </div>
                <h4 className="font-bold text-sm text-slate-800 mb-0.5">{partner.name}</h4>
                <p className="text-[10px] text-slate-500 mb-1">{partner.desc}</p>
                <p className="text-xs font-semibold text-primary mb-2">{partner.price}</p>
                <div className="space-y-0.5">
                  {partner.features.map((feature) => (
                    <div key={feature} className="flex items-center gap-1 text-[10px] text-slate-600">
                      <span className="w-1 h-1 rounded-full bg-primary" />
                      {feature}
                    </div>
                  ))}
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
        
        {/* 价值闭环 */}
        <Card className="mt-4 p-3 border-0 shadow-sm bg-gradient-to-r from-primary/5 via-accent/5 to-warm/5">
          <p className="text-[10px] text-center text-slate-600">
            <span className="font-medium">价值闭环：</span> 用户体验 → 感受改变 → 成为会员 → 参加训练营 → 成为合伙人 → 持续被动收入
          </p>
        </Card>
      </section>

      {/* 分隔线 */}
      <div className="mx-4 h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent" />

      {/* 快捷入口导航 */}
      <section className="px-4 py-6">
        <h3 className="text-base font-bold text-slate-800 mb-4 flex items-center gap-2">
          <span className="text-xl">🔗</span> 更多了解
        </h3>
        
        <div className="space-y-3">
          {quickLinks.map((group) => (
            <div key={group.category}>
              <p className="text-xs text-slate-500 mb-2">{group.category}</p>
              <div className="flex flex-wrap gap-2">
                {group.links.map((link) => (
                  <Badge
                    key={link.name}
                    variant="secondary"
                    className="cursor-pointer hover:bg-primary/10 transition-colors text-xs px-2.5 py-1"
                    onClick={() => navigate(link.route)}
                  >
                    {link.name}
                  </Badge>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card className="p-6 text-center bg-gradient-to-br from-primary/5 via-accent/5 to-warm/5 border-0 shadow-sm">
            <span className="text-3xl mb-3 block">🚀</span>
            <h3 className="text-lg font-bold text-slate-800 mb-2">
              准备好开始你的成长之旅了吗？
            </h3>
            <p className="text-sm text-slate-600 mb-4">
              每一次对话，都是一次自我觉察的机会
            </p>
            
            <div className="flex flex-col gap-2">
              <Button 
                onClick={() => navigate('/coach/vibrant_life_sage')}
                className="w-full bg-gradient-to-r from-primary to-accent text-white shadow-md"
              >
                开始体验有劲AI <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
              <Button 
                variant="outline"
                onClick={() => navigate('/camps')}
                className="w-full text-slate-600"
              >
                加入21天训练营
              </Button>
            </div>
          </Card>
        </motion.div>
      </section>
    </div>
  );
};

export default PlatformIntro;
