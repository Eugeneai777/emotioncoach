import React, { useState } from "react";
import { Helmet } from "react-helmet";
import { motion } from "framer-motion";
import { Heart, Award, Users, Sparkles, Newspaper, GraduationCap, BookOpen, MessageSquareQuote, ChevronRight } from "lucide-react";
import { MarriageNav } from "@/components/marriage/MarriageNav";
import { MarriageFooter } from "@/components/marriage/MarriageFooter";
import { MarriageBackButton } from "@/components/marriage/MarriageBackButton";
import { Badge } from "@/components/ui/badge";
import teamGao from "@/assets/team-gao.png";
import teamHehua from "@/assets/team-hehua.png";
import teamMi from "@/assets/team-mi.png";
import teamZhoujin from "@/assets/team-zhoujin.png";
import teamXiangli from "@/assets/team-xiangli.png";
import teamAnyi from "@/assets/team-anyi.png";
import teamZhoulang from "@/assets/team-zhoulang.png";
import teamAnran from "@/assets/team-anran.png";

const timeline = [
  { year: "2004", event: "创立婚因有道，开始深耕婚姻家庭服务领域", icon: Heart },
  { year: "2022", event: "参与婚姻家庭辅导行业标准相关工作", icon: Award },
  { year: "2023", event: "参与婚姻家庭咨询师国家标准修订工作", icon: Award },
  { year: "2024.8", event: "联合发起「幸福筑基计划」，与婚姻与家庭杂志社、威盛信望爱公益基金会合作，发布新婚导航课程（5主题29节课）", icon: Users },
  { year: "2024.10", event: "新婚导航课被地方妇联推广使用（浙江缙云）", icon: Users },
  { year: "2025.1", event: "引入AI技术，推出智能婚姻测评与关系分析工具", icon: Sparkles },
  { year: "2025.8", event: "亮相第十九届中国心理学大会（深圳），成为唯一婚姻主题参展机构", icon: Award },
  { year: "2025.12", event: "亮相全国婚姻服务行业研讨会，获「副理事长单位」授牌，加入全国婚姻服务行业产教融合共同体", icon: Award },
];

const stats = [
  { number: "20+", label: "年深耕经验" },
  { number: "34", label: "省市覆盖" },
  { number: "10万+", label: "家庭受益" },
  { number: "98%", label: "用户满意度" },
];

const values = [
  { emoji: "🤝", title: "专业", desc: "持证团队，循证方法，科学指导每一段关系" },
  { emoji: "💜", title: "温暖", desc: "没有评判，只有理解与陪伴" },
  { emoji: "🔒", title: "隐私", desc: "严格保密，让你安心倾诉" },
  { emoji: "🌱", title: "成长", desc: "不只修复问题，更帮助关系持续成长" },
];

type MediaCategory = "conferences" | "welfare" | "media";

const mediaCategories: { key: MediaCategory; label: string }[] = [
  { key: "conferences", label: "行业大会" },
  { key: "welfare", label: "公益项目" },
  { key: "media", label: "媒体报道" },
];

const mediaReports: Record<MediaCategory, { title: string; date: string; summary: string; source: string }[]> = {
  conferences: [
    { title: "第十九届中国心理学大会", date: "2025.8", summary: "婚因有道成为大会唯一以婚姻为主题的参展机构，展示七项胜任力模型、婚姻关系测评量表等原创工具", source: "新浪财经" },
    { title: "全国婚姻服务行业研讨会", date: "2025.12", summary: "获「副理事长单位」授牌，加入全国婚姻服务行业产教融合共同体，与中国民政职业大学达成校企合作", source: "新浪新闻" },
  ],
  welfare: [
    { title: "幸福筑基计划", date: "2024.8", summary: "联合婚姻与家庭杂志社、威盛信望爱公益基金会，发布新婚导航课程（5大主题29节课），助力婚前教育普及", source: "中国网心理中国" },
    { title: "幸福同行·家庭幸福公益月", date: "2025", summary: "联合全国百余位婚姻家庭咨询师，面向3000个家庭提供公益支持，推出「幸福护照」活动", source: "婚因有道" },
  ],
  media: [
    { title: "新婚导航课被地方妇联推广", date: "2024.10", summary: "浙江缙云妇联率先引入新婚导航课程，将婚前教育纳入地方公共服务体系", source: "澎湃新闻" },
  ],
};

const faculty = [
  { name: "高牵牛", title: "首席专家", tags: ["中科院心理所博士研究生", "婚姻家庭咨询师"] },
  { name: "米老师", title: "核心专家", tags: ["心理学大会现场专家"] },
  { name: "何华", title: "执行院长", tags: ["中科院心理所博士研究生"] },
  { name: "周瑾", title: "讲师 / 法律顾问", tags: ["法律咨询", "婚姻法务"] },
  { name: "祥丽", title: "高级咨询师", tags: ["北大心理学学士"] },
  { name: "安逸", title: "高级导师", tags: ["河南卫视特约嘉宾"] },
  { name: "周浪", title: "咨询师", tags: ["婚姻咨询1000+小时"] },
  { name: "安然", title: "高级咨询师", tags: ["资深从业者"] },
];

const trainingStages = [
  { stage: "01", title: "个人成长", subtitle: "婚姻能力训练", format: "线上", color: "from-green-400 to-emerald-500" },
  { stage: "02", title: "专业技能", subtitle: "初级(线上) + 中级(线下3天)", format: "线上+线下", color: "from-blue-400 to-indigo-500" },
  { stage: "03", title: "职业咨询", subtitle: "高级(线下4天+6个月实习)", format: "线下", color: "from-purple-400 to-violet-500" },
  { stage: "04", title: "导师培养", subtitle: "督导师 + 导师认证", format: "进阶", color: "from-amber-400 to-orange-500" },
];

const testimonials = [
  { name: "学员 A", text: "从一个婚姻的'门外汉'变成了能帮助别人的咨询师，四有理念让我找到了职业方向。", tag: "第3期学员" },
  { name: "学员 B", text: "线下实操环节非常落地，导师一对一督导让成长速度翻倍。", tag: "高级班学员" },
  { name: "学员 C", text: "不仅学到了专业技能，更修复了自己的婚姻关系，感恩遇到婚因有道。", tag: "个人成长班学员" },
];

const MarriageAbout: React.FC = () => {
  const [activeMedia, setActiveMedia] = useState<MediaCategory>("conferences");

  return (
    <>
      <Helmet>
        <title>关于婚因有道 - 深耕婚姻家庭服务20年</title>
        <meta name="description" content="婚因有道深耕婚姻家庭服务领域20年，致力于帮助更多家庭建立更健康、更稳定、更有希望的关系。" />
      </Helmet>
      <div className="min-h-screen bg-white pb-24">
        <MarriageBackButton />

        {/* Hero */}
        <section className="relative px-5 pt-12 pb-10 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-marriage-light via-marriage-light/40 to-white" />
          <div className="absolute top-6 right-0 w-40 h-40 rounded-full bg-marriage-primary/8 blur-3xl" />
          <div className="absolute bottom-0 left-0 w-32 h-32 rounded-full bg-marriage-accent/10 blur-2xl" />
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="relative z-10 max-w-lg mx-auto text-center"
          >
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-marriage-primary to-marriage-primary/70 shadow-lg shadow-marriage-primary/20 mb-5">
              <Heart className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-3 leading-tight">关于婚因有道</h1>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-xs mx-auto">
              深圳市乐知网络科技有限公司旗下品牌，专注婚姻全生命周期服务20年，致力于帮助更多家庭回到爱的轨道上来。
            </p>
          </motion.div>
        </section>

        {/* Stats */}
        <section className="px-5 -mt-2">
          <motion.div initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="max-w-lg mx-auto grid grid-cols-4 gap-2">
            {stats.map((s, i) => (
              <motion.div key={i} initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }} className="bg-marriage-light/60 rounded-2xl py-4 text-center">
                <div className="text-xl font-bold text-marriage-primary">{s.number}</div>
                <div className="text-[10px] text-muted-foreground mt-0.5">{s.label}</div>
              </motion.div>
            ))}
          </motion.div>
        </section>

        {/* Values */}
        <section className="px-5 py-10">
          <div className="max-w-lg mx-auto">
            <h2 className="text-lg font-bold text-foreground text-center mb-1">我们的理念</h2>
            <p className="text-xs text-muted-foreground text-center mb-5">每段关系都值得被认真对待</p>
            <div className="grid grid-cols-2 gap-3">
              {values.map((v, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }} className="bg-white rounded-2xl p-4 border border-marriage-border shadow-sm">
                  <span className="text-2xl">{v.emoji}</span>
                  <h3 className="text-sm font-bold text-foreground mt-2 mb-1">{v.title}</h3>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">{v.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Timeline */}
        <section className="px-5 py-10 bg-marriage-light/30">
          <div className="max-w-lg mx-auto">
            <h2 className="text-lg font-bold text-foreground text-center mb-1">发展历程</h2>
            <p className="text-xs text-muted-foreground text-center mb-6">二十年坚守，只为更好的家庭</p>
            <div className="relative">
              <div className="absolute left-[22px] top-2 bottom-2 w-0.5 bg-marriage-border" />
              <div className="space-y-5">
                {timeline.map((item, i) => {
                  const Icon = item.icon;
                  return (
                    <motion.div key={i} initial={{ opacity: 0, x: -15 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }} className="flex gap-4 relative">
                      <div className="w-[44px] h-[44px] rounded-xl bg-white border border-marriage-border shadow-sm flex items-center justify-center shrink-0 z-10">
                        <Icon className="h-5 w-5 text-marriage-primary" />
                      </div>
                      <div className="bg-white rounded-2xl p-3.5 border border-marriage-border shadow-sm flex-1">
                        <span className="inline-block text-[10px] font-bold text-white bg-marriage-primary rounded-full px-2.5 py-0.5 mb-1.5">{item.year}</span>
                        <p className="text-sm text-foreground leading-relaxed">{item.event}</p>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        {/* Media Reports */}
        <section className="px-5 py-10">
          <div className="max-w-lg mx-auto">
            <div className="flex items-center gap-2 mb-1 justify-center">
              <Newspaper className="w-5 h-5 text-marriage-primary" />
              <h2 className="text-lg font-bold text-foreground">媒体报道</h2>
            </div>
            <p className="text-xs text-muted-foreground text-center mb-5">权威媒体关注与行业认可</p>

            <div className="flex gap-2 justify-center mb-4">
              {mediaCategories.map((cat) => (
                <button
                  key={cat.key}
                  onClick={() => setActiveMedia(cat.key)}
                  className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                    activeMedia === cat.key
                      ? "bg-marriage-primary text-white border-marriage-primary"
                      : "bg-white text-muted-foreground border-marriage-border hover:border-marriage-primary/50"
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            <div className="space-y-3">
              {mediaReports[activeMedia].map((item, i) => (
                <motion.div
                  key={`${activeMedia}-${i}`}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.08 }}
                  className="bg-white rounded-xl p-4 border border-marriage-border shadow-sm"
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-bold text-foreground">{item.title}</h3>
                    <span className="text-[10px] text-muted-foreground shrink-0 ml-2">{item.date}</span>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed mb-2">{item.summary}</p>
                  <Badge variant="secondary" className="text-[10px] bg-marriage-light text-marriage-primary border-marriage-border">
                    来源：{item.source}
                  </Badge>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Faculty */}
        <section className="px-5 py-10 bg-marriage-light/30">
          <div className="max-w-lg mx-auto">
            <div className="flex items-center gap-2 mb-1 justify-center">
              <GraduationCap className="w-5 h-5 text-marriage-primary" />
              <h2 className="text-lg font-bold text-foreground">专业师资</h2>
            </div>
            <p className="text-xs text-muted-foreground text-center mb-5">来自中科院、北大等顶尖院校的专家团队</p>

            <div className="grid grid-cols-2 gap-3">
              {faculty.map((f, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.06 }}
                  className="bg-white rounded-xl p-3.5 border border-marriage-border shadow-sm"
                >
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-marriage-primary/20 to-marriage-primary/5 flex items-center justify-center mb-2">
                    <span className="text-sm font-bold text-marriage-primary">{f.name[0]}</span>
                  </div>
                  <h3 className="text-sm font-bold text-foreground">{f.name}</h3>
                  <p className="text-[11px] text-marriage-primary mb-2">{f.title}</p>
                  <div className="flex flex-wrap gap-1">
                    {f.tags.map((tag) => (
                      <span key={tag} className="text-[9px] text-muted-foreground bg-marriage-light rounded px-1.5 py-0.5">{tag}</span>
                    ))}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Training System */}
        <section className="px-5 py-10">
          <div className="max-w-lg mx-auto">
            <div className="flex items-center gap-2 mb-1 justify-center">
              <BookOpen className="w-5 h-5 text-marriage-primary" />
              <h2 className="text-lg font-bold text-foreground">培养体系</h2>
            </div>
            <p className="text-xs text-muted-foreground text-center mb-5">四阶段咨询师成长路径</p>

            <div className="space-y-3">
              {trainingStages.map((s, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="flex items-center gap-3"
                >
                  <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${s.color} flex items-center justify-center shrink-0 shadow-sm`}>
                    <span className="text-xs font-bold text-white">{s.stage}</span>
                  </div>
                  <div className="flex-1 bg-white rounded-xl p-3 border border-marriage-border shadow-sm">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-bold text-foreground">{s.title}</h3>
                      <Badge variant="outline" className="text-[9px] border-marriage-border text-muted-foreground">{s.format}</Badge>
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-0.5">{s.subtitle}</p>
                  </div>
                  {i < trainingStages.length - 1 && (
                    <ChevronRight className="w-4 h-4 text-muted-foreground/30 shrink-0 hidden" />
                  )}
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <section className="px-5 py-10 bg-marriage-light/30">
          <div className="max-w-lg mx-auto">
            <div className="flex items-center gap-2 mb-1 justify-center">
              <MessageSquareQuote className="w-5 h-5 text-marriage-primary" />
              <h2 className="text-lg font-bold text-foreground">学员见证</h2>
            </div>
            <p className="text-xs text-muted-foreground text-center mb-5">来自真实学员的声音</p>

            <div className="space-y-3">
              {testimonials.map((t, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 8 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="bg-white rounded-xl p-4 border border-marriage-border shadow-sm"
                >
                  <p className="text-xs text-foreground leading-relaxed mb-3 italic">"{t.text}"</p>
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-medium text-foreground">{t.name}</span>
                    <Badge variant="secondary" className="text-[9px] bg-marriage-light text-marriage-primary border-marriage-border">{t.tag}</Badge>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Mission */}
        <section className="px-5 py-10">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-lg mx-auto bg-gradient-to-br from-marriage-primary to-marriage-primary/80 rounded-2xl p-6 text-center shadow-lg shadow-marriage-primary/15"
          >
            <Sparkles className="h-6 w-6 text-white/80 mx-auto mb-3" />
            <h2 className="text-base font-bold text-white mb-2">我们的使命</h2>
            <p className="text-sm text-white/90 leading-relaxed">
              让每一个家庭都有机会<br />回到爱的轨道上来。
            </p>
          </motion.div>
        </section>

        <MarriageFooter />
        <MarriageNav />
      </div>
    </>
  );
};

export default MarriageAbout;
