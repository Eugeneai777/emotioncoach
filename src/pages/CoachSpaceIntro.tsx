import React from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet";
import { ArrowLeft, ArrowRight, Clock, Lock, GraduationCap, Target, MessageCircle, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useActiveCoachTemplates } from "@/hooks/useCoachTemplates";

const coachEmojiMap: Record<string, string> = {
  emotion: '💚',
  parent: '👨‍👩‍👧',
  story: '📖',
  vibrant_life_sage: '❤️',
  communication: '💬',
  wealth_coach_4_questions: '💰',
  gratitude_coach: '🌸',
};

const coachScenarios: Record<string, string[]> = {
  emotion: ['焦虑', '压力', '情绪低落'],
  wealth_coach_4_questions: ['财务焦虑', '卡点突破'],
  parent: ['亲子冲突', '沟通障碍'],
  communication: ['人际关系', '职场沟通'],
  story: ['人生规划', '自我探索'],
  gratitude_coach: ['幸福感提升', '正向心态'],
  vibrant_life_sage: ['日常问题', '综合陪伴'],
};

const coachGradientMap: Record<string, string> = {
  emotion: 'from-emerald-400 to-teal-500',
  parent: 'from-pink-400 to-rose-500',
  story: 'from-amber-400 to-orange-500',
  vibrant_life_sage: 'from-rose-400 to-pink-500',
  communication: 'from-blue-400 to-indigo-500',
  wealth_coach_4_questions: 'from-amber-400 to-yellow-500',
  gratitude_coach: 'from-pink-300 to-rose-400',
};

const coreValues = [
  {
    icon: Clock,
    title: '24/7 随时陪伴',
    description: '不分时间、不分地点，随时开启对话',
    gradient: 'from-blue-400 to-cyan-500',
  },
  {
    icon: Lock,
    title: '隐私安全',
    description: '对话内容加密保护，安心倾诉',
    gradient: 'from-emerald-400 to-teal-500',
  },
  {
    icon: GraduationCap,
    title: '专业陪伴',
    description: '基于心理学框架，科学有效的引导',
    gradient: 'from-violet-400 to-purple-500',
  },
];

const usageSteps = [
  {
    step: 1,
    icon: Target,
    title: '选择教练',
    description: '根据当前状态，选择最适合的AI教练',
  },
  {
    step: 2,
    icon: MessageCircle,
    title: '开启对话',
    description: '像和朋友聊天一样，说出你的困扰',
  },
  {
    step: 3,
    icon: Sparkles,
    title: '获得成长',
    description: '在陪伴中觉察、理解、转化',
  },
];

const CoachSpaceIntro = () => {
  const navigate = useNavigate();
  const { data: templates, isLoading } = useActiveCoachTemplates();

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50 pb-[env(safe-area-inset-bottom)]">
      <Helmet>
        <title>教练空间介绍 - 有劲AI</title>
        <meta name="description" content="了解有劲AI教练空间如何帮助你成长" />
        <meta property="og:title" content="有劲AI • 教练空间" />
        <meta property="og:description" content="24小时在线、隐私安全、专业陪伴的AI教练团队" />
        <meta property="og:image" content="https://wechat.eugenewe.net/og-youjin-ai.png" />
        <meta property="og:url" content="https://wechat.eugenewe.net/coach-space-intro" />
        <meta property="og:site_name" content="有劲AI" />
      </Helmet>
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-100">
        <div className="flex items-center justify-between px-4 h-14">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-slate-600">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="font-semibold text-slate-800">教练空间介绍</h1>
          <div className="w-9" />
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative px-6 pt-10 pb-8 text-center overflow-hidden">
        {/* Decorative blurs */}
        <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-primary/20 to-accent/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-tr from-warm/20 to-primary/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
        
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="relative"
        >
          <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-primary/10 via-accent/10 to-warm/10 flex items-center justify-center">
            <span className="text-4xl">🤖</span>
          </div>
          
          <h2 className="text-2xl font-bold text-slate-800 mb-3">
            AI教练空间
          </h2>
          
          <p className="text-slate-600 text-sm leading-relaxed mb-4 max-w-xs mx-auto">
            每一个情绪、每一段关系、每一个目标
            <br />
            都值得被专业陪伴
          </p>
          
          <div className="flex items-center justify-center gap-2 text-xs text-slate-500 mb-6">
            <span className="px-2 py-1 bg-slate-100 rounded-full">7位专属教练</span>
            <span>·</span>
            <span className="px-2 py-1 bg-slate-100 rounded-full">24小时在线</span>
            <span>·</span>
            <span className="px-2 py-1 bg-slate-100 rounded-full">隐私安全</span>
          </div>
          
          <Button 
            onClick={() => navigate('/coach-space')}
            className="bg-gradient-to-r from-primary to-accent text-white shadow-lg"
          >
            立即探索 <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        </motion.div>
      </section>

      {/* Core Values Section */}
      <section className="px-4 py-6">
        <h3 className="text-base font-semibold text-slate-800 mb-4 flex items-center gap-2">
          <span>💡</span> 为什么选择AI教练？
        </h3>
        
        <div className="grid grid-cols-3 gap-3">
          {coreValues.map((value, index) => (
            <motion.div
              key={value.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="p-3 text-center h-full border-0 shadow-sm">
                <div className={`w-10 h-10 mx-auto mb-2 rounded-xl bg-gradient-to-br ${value.gradient} flex items-center justify-center`}>
                  <value.icon className="w-5 h-5 text-white" />
                </div>
                <h4 className="text-xs font-semibold text-slate-800 mb-1">{value.title}</h4>
                <p className="text-[10px] text-slate-500 leading-tight">{value.description}</p>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Coach Lineup Section */}
      <section className="px-4 py-6">
        <h3 className="text-base font-semibold text-slate-800 mb-4 flex items-center gap-2">
          <span>🎯</span> 专属教练，覆盖生活全场景
        </h3>
        
        <div className="space-y-3">
          {isLoading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-28 bg-slate-100 rounded-xl animate-pulse" />
            ))
          ) : (
            templates?.map((coach, index) => {
              const emoji = coachEmojiMap[coach.coach_key] || '🤖';
              const scenarios = coachScenarios[coach.coach_key] || [];
              const gradient = coachGradientMap[coach.coach_key] || 'from-slate-400 to-slate-500';
              
              return (
                <motion.div
                  key={coach.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.08 }}
                >
                  <Card 
                    className="p-4 border-0 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => coach.page_route && navigate(coach.page_route)}
                  >
                    <div className="flex items-start gap-3">
                      {/* Emoji */}
                      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center flex-shrink-0`}>
                        <span className="text-2xl">{emoji}</span>
                      </div>
                      
                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <h4 className="font-bold text-sm text-slate-800">{coach.title}</h4>
                        </div>
                        
                        {coach.subtitle && (
                          <p className="text-xs text-slate-500 mb-1">{coach.subtitle}</p>
                        )}
                        
                        {coach.description && (
                          <p className="text-xs text-slate-600 mb-2 line-clamp-2">{coach.description}</p>
                        )}
                        
                        {/* Scenario Tags */}
                        {scenarios.length > 0 && (
                          <div className="flex flex-wrap gap-1.5">
                            {scenarios.map((scenario) => (
                              <Badge 
                                key={scenario}
                                variant="secondary" 
                                className="text-[10px] px-2 py-0.5 bg-slate-100 text-slate-600 font-normal"
                              >
                                {scenario}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                      
                      {/* Arrow */}
                      <ArrowRight className="w-4 h-4 text-slate-400 flex-shrink-0 mt-1" />
                    </div>
                  </Card>
                </motion.div>
              );
            })
          )}
        </div>
      </section>

      {/* Usage Steps Section */}
      <section className="px-4 py-6 bg-slate-50/50">
        <h3 className="text-base font-semibold text-slate-800 mb-4 flex items-center gap-2">
          <span>📝</span> 如何使用教练空间
        </h3>
        
        <div className="relative">
          {/* Connection Line */}
          <div className="absolute left-6 top-8 bottom-8 w-0.5 bg-gradient-to-b from-primary/30 via-accent/30 to-warm/30" />
          
          <div className="space-y-4">
            {usageSteps.map((step, index) => (
              <motion.div
                key={step.step}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 + index * 0.15 }}
                className="flex items-start gap-4"
              >
                <div className="relative z-10 w-12 h-12 rounded-full bg-white shadow-md flex items-center justify-center border-2 border-primary/20">
                  <step.icon className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1 pt-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs text-primary font-medium">Step {step.step}</span>
                    <h4 className="font-semibold text-sm text-slate-800">{step.title}</h4>
                  </div>
                  <p className="text-xs text-slate-500">{step.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Bottom CTA Section */}
      <section className="px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
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
                onClick={() => navigate('/coach-space')}
                className="w-full bg-gradient-to-r from-primary to-accent text-white shadow-md"
              >
                进入教练空间 <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
              <Button 
                variant="ghost"
                onClick={() => navigate('/')}
                className="w-full text-slate-600"
              >
                返回首页
              </Button>
            </div>
          </Card>
        </motion.div>
      </section>
    </div>
  );
};

export default CoachSpaceIntro;
