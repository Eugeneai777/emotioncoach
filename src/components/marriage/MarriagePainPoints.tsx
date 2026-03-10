import React from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const painPoints = [
  { emoji: "😤", text: "经常争吵，却不知道真正问题在哪" },
  { emoji: "🥶", text: "沟通越来越少，关系越来越冷" },
  { emoji: "💔", text: "一方想修复，一方却不愿沟通" },
  { emoji: "👶", text: "为孩子教育方式反复冲突" },
  { emoji: "👵", text: "婆媳关系影响夫妻关系" },
  { emoji: "😩", text: "明明还爱，却越来越累" },
  { emoji: "🤔", text: "想离婚，却又犹豫不决" },
];

export const MarriagePainPoints: React.FC = () => {
  const navigate = useNavigate();

  return (
    <section className="px-5 py-8">
      <div className="max-w-lg mx-auto">
        <h2 className="text-lg font-bold text-foreground text-center mb-5">
          你是否也正在经历这些问题？
        </h2>

        <div className="space-y-2.5">
          {painPoints.map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -10 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.06 }}
              className="flex items-center gap-3 bg-white rounded-xl px-4 py-3 border border-marriage-border shadow-sm"
            >
              <span className="text-xl">{item.emoji}</span>
              <span className="flex-1 text-sm text-foreground">{item.text}</span>
              <ChevronRight className="h-4 w-4 text-muted-foreground/40" />
            </motion.div>
          ))}
        </div>

        <div className="mt-6 text-center">
          <Button
            onClick={() => navigate("/marriage/assessments")}
            className="rounded-xl bg-marriage-primary hover:bg-marriage-primary/90 text-white px-8 shadow-md shadow-marriage-primary/20"
          >
            先做一次婚姻测评
          </Button>
        </div>
      </div>
    </section>
  );
};
