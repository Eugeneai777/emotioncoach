import React from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Heart,
  Shield,
  Users,
  BookOpen,
  Mic,
  PenLine,
  Video,
  Sparkles,
  Brain,
  Flame,
  Flower2,
  MessageCircle,
  Award,
  BarChart3,
  Clock,
  ChevronRight,
} from "lucide-react";

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-50px" },
  transition: { duration: 0.5 },
};

/* ─── 1. 痛点共鸣区 ─── */
const painPoints = [
  { emoji: "😶", text: "情绪压抑在心里，想表达却不知如何开口", color: "border-l-blue-400" },
  { emoji: "💔", text: "亲密关系中反复受伤，不敢再去信任", color: "border-l-pink-400" },
  { emoji: "👶", text: "童年创伤像影子，一直影响着现在的生活", color: "border-l-purple-400" },
  { emoji: "😤", text: "害怕冲突，总是压下愤怒，却越来越委屈", color: "border-l-orange-400" },
  { emoji: "😞", text: "总觉得自己不够好，怎么努力都不够", color: "border-l-amber-400" },
  { emoji: "🌀", text: "想改变却不知从何开始，反复陷入旧模式", color: "border-l-teal-400" },
];

function PainPointsSection() {
  return (
    <section className="space-y-6">
      <motion.div {...fadeInUp} className="text-center space-y-2">
        <h2 className="text-2xl md:text-3xl font-bold">你是否也有这些困扰？</h2>
        <p className="text-muted-foreground">很多人和你一样，正经历这些挣扎</p>
      </motion.div>
      <div className="space-y-3">
        {painPoints.map((item, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -16 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.07, duration: 0.4 }}
          >
            <div
              className={`flex items-center gap-3 bg-white rounded-2xl px-4 py-3.5 border border-purple-100 border-l-4 ${item.color} shadow-sm`}
            >
              <span className="text-2xl flex-shrink-0">{item.emoji}</span>
              <span className="text-sm text-foreground leading-relaxed">{item.text}</span>
              <ChevronRight className="h-4 w-4 text-muted-foreground/30 flex-shrink-0" />
            </div>
          </motion.div>
        ))}
      </div>
      <motion.p
        {...fadeInUp}
        className="text-center text-sm text-purple-600 font-medium pt-2"
      >
        💜 这些不是你的错，而是情感模式在运作。改变，从看见开始。
      </motion.p>
    </section>
  );
}

/* ─── 2. 课程亮点区 ─── */
const highlights = [
  { icon: BookOpen, title: "28天系统课程", desc: "非碎片学习，4 阶递进式深度成长路径", color: "from-blue-500 to-blue-600" },
  { icon: Video, title: "黛汐老师直播答疑", desc: "每周六晚直播，1V1 互动解答你的困惑", color: "from-purple-500 to-purple-600" },
  { icon: PenLine, title: "教练课 + 情绪日记", desc: "双轨并行，从认知到体验的深度转化", color: "from-pink-500 to-pink-600" },
  { icon: Brain, title: "4 阶递进成长", desc: "恐惧 → 苏醒 → 整合 → 绽放，层层深入", color: "from-amber-500 to-orange-500" },
  { icon: Sparkles, title: "从认知到体验", desc: "不仅是学知识，更是亲身体验情感流动", color: "from-teal-500 to-emerald-500" },
  { icon: Shield, title: "安全的团体场域", desc: "同频学员互助，在安全中被看见被支持", color: "from-rose-500 to-pink-500" },
];

function HighlightsSection() {
  return (
    <section className="space-y-6">
      <motion.div {...fadeInUp} className="text-center space-y-2">
        <h2 className="text-2xl md:text-3xl font-bold">为什么选择情感绽放训练营？</h2>
        <p className="text-muted-foreground">六大核心亮点，助你系统化成长</p>
      </motion.div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {highlights.map((item, i) => {
          const Icon = item.icon;
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08, duration: 0.4 }}
            >
              <Card className="bg-white/90 border-purple-100 hover:shadow-lg transition-shadow h-full">
                <CardHeader className="pb-2">
                  <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${item.color} flex items-center justify-center text-white mb-2`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <CardTitle className="text-base">{item.title}</CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}

/* ─── 3. 每阶学习闭环 ─── */
const loopSteps = [
  { icon: Mic, label: "音频课学习", desc: "每天 1 节音频课，随时随地沉浸学习", color: "bg-blue-500" },
  { icon: Heart, label: "教练课实践", desc: "配套教练课引导，把知识转化为体验", color: "bg-purple-500" },
  { icon: PenLine, label: "情绪日记记录", desc: "每日情绪觉察与记录，AI 陪伴反思", color: "bg-pink-500" },
  { icon: Video, label: "周六直播答疑", desc: "黛汐老师在线直播，答疑 + 深度辅导", color: "bg-amber-500" },
];

function LearningLoopSection() {
  return (
    <section className="space-y-6">
      <motion.div {...fadeInUp} className="text-center space-y-2">
        <h2 className="text-2xl md:text-3xl font-bold">每阶学习流程</h2>
        <p className="text-muted-foreground">每阶 4 周，循序渐进，形成完整学习闭环</p>
      </motion.div>
      <div className="relative max-w-md mx-auto">
        {/* Timeline line */}
        <div className="absolute left-[22px] top-6 bottom-6 w-0.5 bg-gradient-to-b from-blue-300 via-purple-300 to-amber-300" />
        <div className="space-y-6">
          {loopSteps.map((step, i) => {
            const Icon = step.icon;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -12 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.4 }}
                className="flex items-start gap-4 relative"
              >
                <div className={`w-11 h-11 rounded-full ${step.color} flex items-center justify-center text-white flex-shrink-0 z-10 shadow-md`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="bg-white rounded-2xl border border-purple-100 shadow-sm p-4 flex-1">
                  <p className="font-semibold text-sm mb-0.5">{step.label}</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">{step.desc}</p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ─── 4. 三层权益金字塔 ─── */
function DeliverySection() {
  return (
    <section className="space-y-6">
      <motion.div {...fadeInUp} className="text-center space-y-2">
        <h2 className="text-2xl md:text-3xl font-bold">你将获得</h2>
        <p className="text-muted-foreground">三层交付体系，价值远超价格</p>
      </motion.div>

      {/* 核心交付 */}
      <motion.div {...fadeInUp}>
        <Card className="border-2 border-purple-300 bg-gradient-to-br from-purple-50 to-pink-50 shadow-md">
          <CardHeader className="pb-2">
            <Badge className="w-fit bg-gradient-to-r from-purple-600 to-pink-600 text-white border-0 mb-2">
              核心交付
            </Badge>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              {[
                { num: "16", unit: "节", label: "音频课", icon: "🎧" },
                { num: "16", unit: "节", label: "教练课", icon: "💪" },
                { num: "4", unit: "次", label: "直播答疑", icon: "📺" },
                { num: "28", unit: "天", label: "系统训练", icon: "📅" },
              ].map((item, i) => (
                <div key={i} className="text-center bg-white/80 rounded-xl p-3 border border-purple-100">
                  <span className="text-2xl">{item.icon}</span>
                  <p className="text-lg font-bold text-purple-700 mt-1">
                    {item.num}<span className="text-sm font-normal">{item.unit}</span>
                  </p>
                  <p className="text-xs text-muted-foreground">{item.label}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* 专属权益 */}
      <motion.div {...fadeInUp}>
        <Card className="border border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50">
          <CardHeader className="pb-2">
            <Badge className="w-fit bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0 mb-2">
              专属权益
            </Badge>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { icon: Award, text: "黛汐老师亲自带班，每周直播深度辅导" },
                { icon: BarChart3, text: "AI 情绪日记系统，实时追踪你的成长轨迹" },
                { icon: MessageCircle, text: "社群互助答疑，班主任日常陪伴" },
              ].map((item, i) => {
                const Icon = item.icon;
                return (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-amber-100 flex items-center justify-center flex-shrink-0">
                      <Icon className="w-4 h-4 text-amber-600" />
                    </div>
                    <span className="text-sm leading-relaxed">{item.text}</span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* 附加福利 */}
      <motion.div {...fadeInUp}>
        <Card className="border border-teal-200 bg-gradient-to-br from-teal-50 to-emerald-50">
          <CardHeader className="pb-2">
            <Badge className="w-fit bg-gradient-to-r from-teal-500 to-emerald-500 text-white border-0 mb-2">
              附加福利
            </Badge>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {["学员专属社群", "成长数据报告", "课程永久回放", "AI 情绪教练", "冥想音频库"].map(
                (item, i) => (
                  <Badge key={i} variant="outline" className="bg-white/80 border-teal-200 text-teal-700 py-1.5 px-3">
                    ✓ {item}
                  </Badge>
                )
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </section>
  );
}

/* ─── 5. 适合人群（共鸣卡片） ─── */
const audienceVoices = [
  { quote: "总是在关系中受伤，不敢再信任任何人", tag: "亲密关系创伤" },
  { quote: "小时候被忽视的痛，现在还在影响我", tag: "童年创伤" },
  { quote: "明明很愤怒，却只会默默忍着流泪", tag: "情绪压抑" },
  { quote: "不敢拒绝别人，总是委屈自己成全别人", tag: "讨好型人格" },
  { quote: "总觉得自己配不上好的，哪里都不够好", tag: "低自我价值感" },
  { quote: "想走出来，可每次都重复老路", tag: "行为模式固化" },
];

function AudienceSection() {
  return (
    <section className="space-y-6">
      <motion.div {...fadeInUp} className="text-center space-y-2">
        <h2 className="text-2xl md:text-3xl font-bold">适合这样的你</h2>
        <p className="text-muted-foreground">如果这些心声说中了你，你就是我们在等的人</p>
      </motion.div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-4xl mx-auto">
        {audienceVoices.map((item, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.06, duration: 0.35 }}
          >
            <Card className="bg-white/90 border-purple-100 hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <p className="text-sm italic text-foreground leading-relaxed mb-2">
                  "{item.quote}"
                </p>
                <Badge variant="outline" className="text-xs bg-purple-50 text-purple-600 border-purple-200">
                  {item.tag}
                </Badge>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

/* ─── 6. 导师信任区 ─── */
function CoachSection() {
  return (
    <section className="space-y-6">
      <motion.div {...fadeInUp} className="text-center space-y-2">
        <h2 className="text-2xl md:text-3xl font-bold">你的带领者</h2>
      </motion.div>
      <motion.div {...fadeInUp}>
        <Card className="bg-gradient-to-br from-purple-50 via-pink-50 to-white border-purple-200 shadow-md overflow-hidden">
          <CardContent className="p-5">
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white text-2xl font-bold flex-shrink-0 shadow-lg">
                黛
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-bold text-lg">黛汐老师</h3>
                  <Badge className="bg-purple-100 text-purple-700 border-0 text-xs">总教练</Badge>
                </div>
                <p className="text-xs text-muted-foreground mb-3">
                  "你不仅仅是你以为的样子"
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {["生命教练", "认证国际脑点执行师", "PNCC心流教练", "高级心理咨询师"].map(
                    (cert, i) => (
                      <Badge key={i} variant="outline" className="text-xs bg-white/80 border-purple-100">
                        {cert}
                      </Badge>
                    )
                  )}
                </div>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {["创伤修复", "人格整合", "潜能激发"].map((s, i) => (
                    <Badge key={i} className="text-xs bg-pink-50 text-pink-600 border-0">
                      {s}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* 课程数据统计 */}
      <motion.div {...fadeInUp}>
        <div className="grid grid-cols-4 gap-2 text-center">
          {[
            { num: "28", label: "天" },
            { num: "4", label: "大阶段" },
            { num: "16", label: "节音频课" },
            { num: "16", label: "节教练课" },
          ].map((item, i) => (
            <div key={i} className="bg-white rounded-xl border border-purple-100 p-3 shadow-sm">
              <p className="text-xl font-bold text-purple-600">{item.num}</p>
              <p className="text-xs text-muted-foreground">{item.label}</p>
            </div>
          ))}
        </div>
      </motion.div>
    </section>
  );
}

/* ─── Main Export ─── */
export function EmotionBloomIntroSections() {
  return (
    <div className="space-y-12">
      <PainPointsSection />
      <HighlightsSection />
      <LearningLoopSection />
      <DeliverySection />
      <AudienceSection />
      <CoachSection />
    </div>
  );
}
