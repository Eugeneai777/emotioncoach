import React from "react";
import { Helmet } from "react-helmet";
import { motion } from "framer-motion";
import { Heart, Award, Users, MapPin, Sparkles } from "lucide-react";
import { MarriageNav } from "@/components/marriage/MarriageNav";
import { MarriageFooter } from "@/components/marriage/MarriageFooter";

const timeline = [
  { year: "2004", event: "创立婚因有道，开始深耕婚姻家庭服务领域", icon: Heart },
  { year: "2022", event: "参与婚姻家庭辅导行业标准相关工作", icon: Award },
  { year: "2023", event: "参与婚姻家庭咨询师国家标准修订工作", icon: Award },
  { year: "2024", event: "联合公益机构推出幸福家庭项目", icon: Users },
  { year: "2025", event: "引入AI技术，推出智能婚姻测评与关系分析工具", icon: Sparkles },
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

const MarriageAbout: React.FC = () => {
  return (
    <>
      <Helmet>
        <title>关于婚因有道 - 深耕婚姻家庭服务20年</title>
        <meta name="description" content="婚因有道深耕婚姻家庭服务领域20年，致力于帮助更多家庭建立更健康、更稳定、更有希望的关系。" />
      </Helmet>
      <div className="min-h-screen bg-white pb-24">
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
            <h1 className="text-2xl font-bold text-foreground mb-3 leading-tight">
              关于婚因有道
            </h1>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-xs mx-auto">
              深耕婚姻家庭服务领域20年，致力于帮助更多家庭建立更健康、更稳定、更有希望的关系。
            </p>
          </motion.div>
        </section>

        {/* Stats */}
        <section className="px-5 -mt-2">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-lg mx-auto grid grid-cols-4 gap-2"
          >
            {stats.map((s, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="bg-marriage-light/60 rounded-2xl py-4 text-center"
              >
                <div className="text-xl font-bold text-marriage-primary">{s.number}</div>
                <div className="text-[10px] text-muted-foreground mt-0.5">{s.label}</div>
              </motion.div>
            ))}
          </motion.div>
        </section>

        {/* Our Values */}
        <section className="px-5 py-10">
          <div className="max-w-lg mx-auto">
            <h2 className="text-lg font-bold text-foreground text-center mb-1">我们的理念</h2>
            <p className="text-xs text-muted-foreground text-center mb-5">每段关系都值得被认真对待</p>
            <div className="grid grid-cols-2 gap-3">
              {values.map((v, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.08 }}
                  className="bg-white rounded-2xl p-4 border border-marriage-border shadow-sm"
                >
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
              {/* Vertical line */}
              <div className="absolute left-[22px] top-2 bottom-2 w-0.5 bg-marriage-border" />

              <div className="space-y-5">
                {timeline.map((item, i) => {
                  const Icon = item.icon;
                  return (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -15 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: i * 0.1 }}
                      className="flex gap-4 relative"
                    >
                      <div className="w-[44px] h-[44px] rounded-xl bg-white border border-marriage-border shadow-sm flex items-center justify-center shrink-0 z-10">
                        <Icon className="h-5 w-5 text-marriage-primary" />
                      </div>
                      <div className="bg-white rounded-2xl p-3.5 border border-marriage-border shadow-sm flex-1">
                        <span className="inline-block text-[10px] font-bold text-white bg-marriage-primary rounded-full px-2.5 py-0.5 mb-1.5">
                          {item.year}
                        </span>
                        <p className="text-sm text-foreground leading-relaxed">{item.event}</p>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
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
              让每一个家庭都有机会<br />
              回到爱的轨道上来。
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
