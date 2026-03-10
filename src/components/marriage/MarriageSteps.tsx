import React from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ClipboardCheck, Bot, UserCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

const steps = [
  {
    step: 1,
    title: "先做婚姻测评",
    desc: "快速识别关系状态",
    icon: ClipboardCheck,
    color: "bg-pink-100 text-pink-600",
  },
  {
    step: 2,
    title: "AI关系分析",
    desc: "梳理情绪与沟通盲点",
    icon: Bot,
    color: "bg-marriage-primary/10 text-marriage-primary",
  },
  {
    step: 3,
    title: "专业咨询辅导",
    desc: "制定关系修复方案",
    icon: UserCheck,
    color: "bg-emerald-100 text-emerald-600",
  },
];

export const MarriageSteps: React.FC = () => {
  const navigate = useNavigate();

  return (
    <section className="px-5 py-8">
      <div className="max-w-lg mx-auto">
        <h2 className="text-lg font-bold text-foreground text-center mb-1">
          AI帮助看见问题
        </h2>
        <p className="text-sm text-muted-foreground text-center mb-6">
          专业老师帮助解决问题
        </p>

        <div className="space-y-4">
          {steps.map((s, i) => (
            <motion.div
              key={s.step}
              initial={{ opacity: 0, x: -15 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.12 }}
              className="flex items-center gap-4"
            >
              <div className="relative flex flex-col items-center">
                <div className={`w-12 h-12 rounded-xl ${s.color} flex items-center justify-center`}>
                  <s.icon className="h-6 w-6" />
                </div>
                {i < steps.length - 1 && (
                  <div className="w-0.5 h-6 bg-marriage-border mt-1" />
                )}
              </div>
              <div>
                <div className="text-[10px] text-muted-foreground mb-0.5">第{s.step}步</div>
                <h3 className="text-sm font-bold text-foreground">{s.title}</h3>
                <p className="text-xs text-muted-foreground">{s.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="mt-6 text-center">
          <Button
            onClick={() => navigate("/marriage/help")}
            className="rounded-xl bg-marriage-primary hover:bg-marriage-primary/90 text-white px-8 shadow-md shadow-marriage-primary/20"
          >
            预约专业咨询
          </Button>
        </div>
      </div>
    </section>
  );
};
