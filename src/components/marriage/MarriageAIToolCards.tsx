import React from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { MessageSquareWarning, MessagesSquare, BookHeart } from "lucide-react";
import { Button } from "@/components/ui/button";

const tools = [
  {
    id: "quarrel",
    title: "AI吵架复盘器",
    desc: "输入最近一次争吵，AI帮你分析冲突原因、误解点和修复建议。",
    icon: MessageSquareWarning,
    gradient: "from-rose-500 to-pink-500",
  },
  {
    id: "coach",
    title: "AI夫妻沟通教练",
    desc: '把"说不清"的委屈和情绪，转化为更容易被理解的表达方式。',
    icon: MessagesSquare,
    gradient: "from-marriage-primary to-violet-500",
  },
  {
    id: "diary",
    title: "AI关系日记",
    desc: "每天记录关系状态，AI帮助分析关系趋势。",
    icon: BookHeart,
    gradient: "from-teal-500 to-emerald-500",
  },
];

export const MarriageAIToolCards: React.FC = () => {
  const navigate = useNavigate();

  return (
    <section className="px-5 py-8">
      <div className="max-w-lg mx-auto">
        <h2 className="text-lg font-bold text-foreground text-center mb-1">
          AI关系工具
        </h2>
        <p className="text-xs text-muted-foreground text-center mb-5">
          帮助你梳理情绪，复盘冲突，改善沟通
        </p>

        <div className="space-y-3">
          {tools.map((tool, i) => (
            <motion.div
              key={tool.id}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="bg-white rounded-2xl p-4 border border-marriage-border shadow-sm"
            >
              <div className="flex items-start gap-3">
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${tool.gradient} flex items-center justify-center shrink-0`}>
                  <tool.icon className="h-5 w-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-bold text-foreground mb-1">{tool.title}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">{tool.desc}</p>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => navigate(`/marriage/ai-tools?tool=${tool.id}`)}
                    className="mt-2.5 h-8 rounded-lg border-marriage-primary/30 text-marriage-primary hover:bg-marriage-light text-xs"
                  >
                    {tool.id === "diary" ? "开始记录" : "体验工具"}
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
