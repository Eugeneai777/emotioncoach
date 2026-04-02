import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ChevronRight,
  Users,
  Award,
  MessageCircle,
  Shield,
  Sparkles,
  Brain,
  Heart,
  Info,
} from "lucide-react";

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-50px" },
  transition: { duration: 0.5 },
};

/* ─── 1. 痛点共鸣区 ─── */
const painPoints = [
  { emoji: "😶", text: "活得像别人的影子，找不到真正的自己", color: "border-l-indigo-400" },
  { emoji: "💔", text: "不敢拒绝、不敢冒犯，总在看别人脸色", color: "border-l-violet-400" },
  { emoji: "🌀", text: "想改变却反复打回原形，陷入旧模式", color: "border-l-purple-400" },
  { emoji: "😞", text: "总觉得自己不够好，怎么努力都没有底气", color: "border-l-blue-400" },
  { emoji: "🔥", text: "压力山大，身体和情绪都在报警", color: "border-l-rose-400" },
  { emoji: "🤷", text: "迷茫没方向，不知道自己真正想要什么", color: "border-l-amber-400" },
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
              className={`flex items-center gap-3 bg-white rounded-2xl px-4 py-3.5 border border-indigo-100 border-l-4 ${item.color} shadow-sm`}
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
        className="text-center text-sm text-indigo-600 font-medium pt-2"
      >
        💜 这些不是你的错，而是身份认知的迷雾。改变，从认识自己开始。
      </motion.p>
    </section>
  );
}

/* ─── 2. 课程学习安排 ─── */
const stages = [
  {
    stage: 1,
    title: "我知道我是谁",
    color: "from-blue-500 to-blue-600",
    borderColor: "border-blue-200",
    bgColor: "from-blue-50 to-blue-100/50",
    badgeBg: "bg-blue-100 text-blue-700",
    lessons: [
      "不知道自己是谁，怎么活得精彩",
      "知道自己是谁，是改变的内核",
      "知道自己是谁，在自己的故事里发光",
      "谁能告诉我，我到底是谁",
    ],
  },
  {
    stage: 2,
    title: "自主生命，自主成长",
    color: "from-emerald-500 to-emerald-600",
    borderColor: "border-emerald-200",
    bgColor: "from-emerald-50 to-emerald-100/50",
    badgeBg: "bg-emerald-100 text-emerald-700",
    lessons: [
      "重构城墙，是对自己的尊荣",
      "我能为自己负责，唤醒了内在力量感",
      "系统清理过的生命空间，如此清爽",
      "散落和隐藏的回归，我开始圆满",
    ],
  },
  {
    stage: 3,
    title: "突破迷雾，美好呈现",
    color: "from-violet-500 to-violet-600",
    borderColor: "border-violet-200",
    bgColor: "from-violet-50 to-violet-100/50",
    badgeBg: "bg-violet-100 text-violet-700",
    lessons: [
      "突破谎言，拥有真相带来的自由",
      "突破假冒，享受生命力量的滋养",
      "突破家庭的情绪基因，活出无限可能",
      "突破低阶依恋，开启人生智慧",
    ],
  },
  {
    stage: 4,
    title: "转化困境，破茧成蝶",
    color: "from-orange-500 to-orange-600",
    borderColor: "border-orange-200",
    bgColor: "from-orange-50 to-orange-100/50",
    badgeBg: "bg-orange-100 text-orange-700",
    lessons: [
      "转化伤痛，饶恕带来生命的偿还",
      "转化内在声言，善用自由意志的力量",
      "转化评判，带来接纳的修复",
      "转化频率，成为同频共振",
    ],
  },
];

function CurriculumSection() {
  return (
    <section className="space-y-6">
      <motion.div {...fadeInUp} className="text-center space-y-2">
        <h2 className="text-2xl md:text-3xl font-bold">4阶递进式深度成长</h2>
        <p className="text-muted-foreground">每阶4节音频课 + 4次教练课，循序渐进</p>
      </motion.div>
      <div className="space-y-4">
        {stages.map((s, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1, duration: 0.45 }}
          >
            <Card className={`border ${s.borderColor} bg-gradient-to-br ${s.bgColor} overflow-hidden`}>
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <span className={`inline-flex items-center px-3 py-1 rounded-full bg-gradient-to-r ${s.color} text-white text-xs font-semibold`}>
                    第{s.stage}阶
                  </span>
                  <CardTitle className="text-base">{s.title}</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-2">
                  {s.lessons.map((lesson, j) => (
                    <div key={j} className="flex items-start gap-2.5">
                      <div className={`w-5 h-5 rounded-full bg-gradient-to-r ${s.color} flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0 mt-0.5`}>
                        {j + 1}
                      </div>
                      <span className="text-sm leading-relaxed text-foreground/80">{lesson}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* 上课形式时间线 */}
      <motion.div {...fadeInUp}>
        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground bg-white/80 rounded-xl border border-indigo-100 p-4">
          <span className="text-indigo-600 font-medium">🎧 音频课</span>
          <span>→</span>
          <span className="text-violet-600 font-medium">💪 教练课</span>
          <span>→</span>
          <span className="text-purple-600 font-medium">🌸 绽放海沃塔社群</span>
          <span className="text-xs text-muted-foreground ml-1">（每周开营）</span>
        </div>
      </motion.div>
    </section>
  );
}

/* ─── 3. 核心训练方法 — 绽放海沃塔 ─── */
const havrutaSteps = [
  { icon: MessageCircle, label: "倾诉", desc: "3人一组伙伴关系，深度分享与倾听", color: "bg-indigo-500" },
  { icon: Brain, label: "探索", desc: "提问→回答→讨论，激发内在觉察", color: "bg-violet-500" },
  { icon: Sparkles, label: "挑战", desc: "循序渐进突破舒适区，实现真实成长", color: "bg-purple-500" },
  { icon: Heart, label: "觉察打卡", desc: "课后生活觉察，将所学落地到日常", color: "bg-pink-500" },
];

function HavrutaSection() {
  return (
    <section className="space-y-6">
      <motion.div {...fadeInUp} className="text-center space-y-2">
        <h2 className="text-2xl md:text-3xl font-bold">核心训练方法</h2>
        <p className="text-muted-foreground">绽放海沃塔 — 不只是课堂，更是生命的练习场</p>
      </motion.div>
      <div className="relative max-w-md mx-auto">
        <div className="absolute left-[22px] top-6 bottom-6 w-0.5 bg-gradient-to-b from-indigo-300 via-violet-300 to-pink-300" />
        <div className="space-y-6">
          {havrutaSteps.map((step, i) => {
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
                <div className="bg-white rounded-2xl border border-indigo-100 shadow-sm p-4 flex-1">
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

/* ─── 4. 课程亮点 ─── */
const courseHighlights = [
  { icon: Shield, title: "3年沉淀验证", desc: "200+学员体系化打磨，经过实证的成长路径", color: "from-indigo-500 to-indigo-600" },
  { icon: Award, title: "学员好评率95%+", desc: "高完成率反馈，真正能坚持走完的训练营", color: "from-violet-500 to-violet-600" },
  { icon: Users, title: "小班教学陪伴", desc: "不只是课堂，全程陪伴你走完成长之路", color: "from-purple-500 to-purple-600" },
  { icon: Heart, title: "长期社群+免费复训", desc: "学完不散，持续陪伴与深化成长", color: "from-pink-500 to-pink-600" },
  { icon: Sparkles, title: "全维度成长提升", desc: "行为、身份、能量三维同步提升", color: "from-amber-500 to-orange-500" },
];

function HighlightsSection() {
  return (
    <section className="space-y-6">
      <motion.div {...fadeInUp} className="text-center space-y-2">
        <h2 className="text-2xl md:text-3xl font-bold">为什么选择身份绽放？</h2>
        <p className="text-muted-foreground">五大核心亮点，值得你的信赖</p>
      </motion.div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {courseHighlights.map((item, i) => {
          const Icon = item.icon;
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08, duration: 0.4 }}
            >
              <Card className="bg-white/90 border-indigo-100 hover:shadow-lg transition-shadow h-full">
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

/* ─── 5. 三层权益金字塔 ─── */
function DeliverySection() {
  return (
    <section className="space-y-6">
      <motion.div {...fadeInUp} className="text-center space-y-2">
        <h2 className="text-2xl md:text-3xl font-bold">你将获得</h2>
        <p className="text-muted-foreground">三层交付体系，价值远超价格</p>
      </motion.div>

      {/* 核心交付 */}
      <motion.div {...fadeInUp}>
        <Card className="border-2 border-indigo-300 bg-gradient-to-br from-indigo-50 to-violet-50 shadow-md">
          <CardHeader className="pb-2">
            <Badge className="w-fit bg-gradient-to-r from-indigo-600 to-violet-600 text-white border-0 mb-2">
              核心交付
            </Badge>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              {[
                { num: "16", unit: "节", label: "音频课", icon: "🎧" },
                { num: "16", unit: "节", label: "教练课", icon: "💪" },
                { num: "4", unit: "阶", label: "系统训练", icon: "📋" },
                { num: "1", unit: "个月", label: "深度成长", icon: "🌱" },
              ].map((item, i) => (
                <div key={i} className="text-center bg-white/80 rounded-xl p-3 border border-indigo-100">
                  <span className="text-2xl">{item.icon}</span>
                  <p className="text-lg font-bold text-indigo-700 mt-1">
                    {item.num}<span className="text-sm font-normal">{item.unit}</span>
                  </p>
                  <p className="text-xs text-muted-foreground">{item.label}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* 成长收获 */}
      <motion.div {...fadeInUp}>
        <Card className="border border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50">
          <CardHeader className="pb-2">
            <Badge className="w-fit bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0 mb-2">
              成长收获
            </Badge>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { icon: Brain, text: "突破自我认知局限，看清真实的自己" },
                { icon: Shield, text: "找到真实身份，建立稳固的内在安全感" },
                { icon: Sparkles, text: "生命能量绽放，活出自在丰盈的人生" },
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

      {/* 附加权益 */}
      <motion.div {...fadeInUp}>
        <Card className="border border-teal-200 bg-gradient-to-br from-teal-50 to-emerald-50">
          <CardHeader className="pb-2">
            <Badge className="w-fit bg-gradient-to-r from-teal-500 to-emerald-500 text-white border-0 mb-2">
              附加权益
            </Badge>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {["学员专属社群", "AI教练陪伴", "成长数据报告", "课程永久回放", "免费复训"].map(
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

/* ─── 6. 适合人群 ─── */
const targetAudience = [
  {
    emoji: "📚",
    title: "学了很多却无法改变",
    desc: "知道却做不到，需要从认知突破到行为转化",
  },
  {
    emoji: "🔄",
    title: "被各类问题困扰",
    desc: "压力、情绪、关系等多维度困扰需要系统疏理",
  },
  {
    emoji: "💫",
    title: "常常自我攻击",
    desc: "通过非评判性自我觉察，重建内在力量与自我认同",
  },
  {
    emoji: "🌱",
    title: "渴望成长与完满关系",
    desc: "提升情绪理解力与沟通模式，促进关系质的改变",
  },
];

function AudienceSection() {
  return (
    <section className="space-y-6">
      <motion.div {...fadeInUp} className="text-center space-y-2">
        <h2 className="text-2xl md:text-3xl font-bold">适合这样的你</h2>
        <p className="text-muted-foreground">如果你有以下困扰或期待，这就是你的成长入口</p>
      </motion.div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-4xl mx-auto">
        {targetAudience.map((item, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.08, duration: 0.35 }}
          >
            <Card className="bg-white/90 border-indigo-100 hover:shadow-md transition-shadow h-full">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <span className="text-2xl flex-shrink-0">{item.emoji}</span>
                  <div>
                    <p className="font-semibold text-sm text-foreground mb-1">{item.title}</p>
                    <p className="text-xs text-muted-foreground leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

/* ─── 7. 课程说明 ─── */
const courseNotes = [
  { label: "课程形式", value: "线上音频课 + 教练课 + 小班社群" },
  { label: "课程周期", value: "1个月（4阶 × 每阶1周）" },
  { label: "开营时间", value: "每周滚动开营，购买后安排入营" },
  { label: "延期规则", value: "因特殊原因可申请延期1次，最长延期30天" },
  { label: "退款政策", value: "开营前可全额退款；开营后7天内未完成第一阶可退50%" },
  { label: "复训福利", value: "结营学员享免费复训资格，持续巩固成长" },
];

function CourseNotesSection() {
  return (
    <section className="space-y-6">
      <motion.div {...fadeInUp} className="text-center space-y-2">
        <h2 className="text-2xl md:text-3xl font-bold">课程说明</h2>
        <p className="text-muted-foreground">报名前请了解以下信息</p>
      </motion.div>
      <motion.div {...fadeInUp}>
        <Card className="bg-slate-50/80 border-slate-200">
          <CardContent className="p-4">
            <div className="space-y-3">
              {courseNotes.map((note, i) => (
                <div key={i} className="flex items-start gap-3">
                  <Info className="w-4 h-4 text-indigo-400 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <span className="text-sm font-medium text-foreground">{note.label}：</span>
                    <span className="text-sm text-muted-foreground">{note.value}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </section>
  );
}

/* ─── 8. 师资信任区 ─── */
function CoachSection() {
  return (
    <section className="space-y-6">
      <motion.div {...fadeInUp} className="text-center space-y-2">
        <h2 className="text-2xl md:text-3xl font-bold">你的带领者</h2>
      </motion.div>
      <motion.div {...fadeInUp}>
        <Card className="bg-gradient-to-br from-indigo-50 via-violet-50 to-white border-indigo-200 shadow-md overflow-hidden">
          <CardContent className="p-5">
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-400 to-violet-400 flex items-center justify-center text-white text-2xl font-bold flex-shrink-0 shadow-lg">
                黛
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-bold text-lg">黛汐老师</h3>
                  <Badge className="bg-indigo-100 text-indigo-700 border-0 text-xs">总教练</Badge>
                </div>
                <p className="text-xs text-muted-foreground mb-3">
                  "你不仅仅是你以为的样子"
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {["生命教练", "认证国际脑点执行师", "PNCC心流教练", "高级心理咨询师"].map(
                    (cert, i) => (
                      <Badge key={i} variant="outline" className="text-xs bg-white/80 border-indigo-100">
                        {cert}
                      </Badge>
                    )
                  )}
                </div>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {["身份重建", "信念突破", "能量转化"].map((s, i) => (
                    <Badge key={i} className="text-xs bg-violet-50 text-violet-600 border-0">
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
            { num: "4", label: "大阶段" },
            { num: "16", label: "节音频课" },
            { num: "16", label: "节教练课" },
            { num: "200+", label: "学员验证" },
          ].map((item, i) => (
            <div key={i} className="bg-white rounded-xl border border-indigo-100 p-3 shadow-sm">
              <p className="text-xl font-bold text-indigo-600">{item.num}</p>
              <p className="text-xs text-muted-foreground">{item.label}</p>
            </div>
          ))}
        </div>
      </motion.div>
    </section>
  );
}

/* ─── Main Export ─── */
export function IdentityBloomIntroSections() {
  return (
    <div className="space-y-12">
      <PainPointsSection />
      <CurriculumSection />
      <HavrutaSection />
      <HighlightsSection />
      <DeliverySection />
      <AudienceSection />
      <CourseNotesSection />
      <CoachSection />
    </div>
  );
}
