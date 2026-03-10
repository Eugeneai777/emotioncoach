import React from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";

export const assessments = [
  {
    id: "happiness",
    title: "婚姻幸福指数测评",
    desc: "了解当前婚姻的稳定度、沟通健康度与情绪连接",
    emoji: "💕",
    color: "from-pink-50 to-rose-50",
    borderColor: "border-pink-100",
  },
  {
    id: "divorce-risk",
    title: "离婚风险指数测评",
    desc: "识别冷战、冲突、情感疏离带来的关系风险",
    emoji: "⚠️",
    color: "from-amber-50 to-orange-50",
    borderColor: "border-amber-100",
  },
  {
    id: "communication",
    title: "夫妻沟通模式测评",
    desc: "了解你们属于合作型、回避型、防御型还是对抗型",
    emoji: "💬",
    color: "from-blue-50 to-indigo-50",
    borderColor: "border-blue-100",
  },
  {
    id: "in-law",
    title: "婆媳关系压力指数",
    desc: "识别家庭角色冲突、边界问题与伴侣立场",
    emoji: "🏠",
    color: "from-emerald-50 to-teal-50",
    borderColor: "border-emerald-100",
  },
  {
    id: "repair",
    title: "婚姻修复可能性测评",
    desc: "帮助判断这段关系是否还有修复机会",
    emoji: "🌱",
    color: "from-purple-50 to-violet-50",
    borderColor: "border-purple-100",
  },
];

export const MarriageAssessmentCards: React.FC = () => {
  const navigate = useNavigate();

  return (
    <section className="px-5 py-8 bg-marriage-light/50">
      <div className="max-w-lg mx-auto">
        <h2 className="text-lg font-bold text-foreground text-center mb-1">
          5个最受欢迎的关系测评
        </h2>
        <p className="text-xs text-muted-foreground text-center mb-5">
          专业测评，快速了解你的关系状态
        </p>

        <div className="space-y-3">
          {assessments.map((a, i) => (
            <motion.div
              key={a.id}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className={`bg-gradient-to-r ${a.color} rounded-2xl p-4 border ${a.borderColor} shadow-sm`}
            >
              <div className="flex items-start gap-3">
                <span className="text-3xl mt-0.5">{a.emoji}</span>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-bold text-foreground mb-1">{a.title}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">{a.desc}</p>
                  <Button
                    size="sm"
                    onClick={() => navigate(`/marriage/assessments?id=${a.id}`)}
                    className="mt-2.5 h-8 rounded-lg bg-marriage-primary hover:bg-marriage-primary/90 text-white text-xs px-4"
                  >
                    立即测评
                  </Button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
