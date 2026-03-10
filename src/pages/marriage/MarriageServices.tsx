import React from "react";
import { Helmet } from "react-helmet";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Heart, MessageCircle, Users, Shield, ClipboardCheck, Phone, BarChart3, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MarriageNav } from "@/components/marriage/MarriageNav";
import { MarriageFooter } from "@/components/marriage/MarriageFooter";

const services = [
  { icon: Heart, title: "婚姻关系修复咨询", desc: "专业咨询师1对1帮助修复夫妻关系" },
  { icon: MessageCircle, title: "夫妻沟通辅导", desc: "改善沟通模式，减少争吵与冷战" },
  { icon: Users, title: "家庭关系辅导", desc: "解决婆媳矛盾、亲子冲突等家庭问题" },
  { icon: Shield, title: "婚姻危机干预", desc: "紧急婚姻状况的专业支持与引导" },
];

const flow = [
  { icon: ClipboardCheck, label: "婚姻测评", desc: "了解关系现状" },
  { icon: Phone, label: "初步沟通", desc: "与咨询师对接" },
  { icon: BarChart3, label: "关系分析", desc: "深入问题根源" },
  { icon: BookOpen, label: "持续辅导", desc: "制定修复方案" },
];

const MarriageServices: React.FC = () => {
  const navigate = useNavigate();

  return (
    <>
      <Helmet>
        <title>专业婚姻家庭咨询服务 - 婚因有道</title>
      </Helmet>
      <div className="min-h-screen bg-gradient-to-b from-marriage-light to-white pb-24">
        <div className="px-5 pt-10 max-w-lg mx-auto">
          <h1 className="text-xl font-bold text-foreground text-center mb-6">专业婚姻家庭咨询服务</h1>

          {/* Services */}
          <div className="space-y-3 mb-8">
            {services.map((s, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="bg-white rounded-2xl p-4 border border-marriage-border shadow-sm flex items-start gap-3"
              >
                <div className="w-10 h-10 rounded-xl bg-marriage-primary/10 flex items-center justify-center shrink-0">
                  <s.icon className="h-5 w-5 text-marriage-primary" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-foreground">{s.title}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">{s.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Flow */}
          <h2 className="text-base font-bold text-foreground text-center mb-4">服务流程</h2>
          <div className="flex items-start justify-between gap-1 mb-8">
            {flow.map((f, i) => (
              <div key={i} className="flex flex-col items-center text-center flex-1">
                <div className="w-11 h-11 rounded-xl bg-marriage-primary/10 flex items-center justify-center mb-1.5">
                  <f.icon className="h-5 w-5 text-marriage-primary" />
                </div>
                <span className="text-[11px] font-semibold text-foreground">{f.label}</span>
                <span className="text-[9px] text-muted-foreground">{f.desc}</span>
                {i < flow.length - 1 && (
                  <div className="hidden" />
                )}
              </div>
            ))}
          </div>

          <Button
            onClick={() => navigate("/marriage/help")}
            className="w-full h-12 rounded-xl bg-marriage-primary hover:bg-marriage-primary/90 text-white text-base font-semibold shadow-lg shadow-marriage-primary/25"
          >
            预约咨询
          </Button>
        </div>
        <MarriageFooter />
        <MarriageNav />
      </div>
    </>
  );
};

export default MarriageServices;
