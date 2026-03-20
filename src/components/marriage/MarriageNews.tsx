import React from "react";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Newspaper, Award, Heart, Users } from "lucide-react";

const highlights = [
  {
    icon: Award,
    label: "唯一婚姻主题参展机构",
    desc: "第十九届中国心理学大会（深圳·2025年8月），婚因有道成为大会唯一以婚姻为主题的参展机构",
  },
  {
    icon: Users,
    label: "四有咨询师培养理念",
    desc: "有专业、有能力、有收入、有尊严——打造婚姻家庭咨询新生态",
  },
  {
    icon: Heart,
    label: "幸福同行·公益月",
    desc: "联合全国百余位咨询师，面向3000个家庭提供公益支持，推出「幸福护照」活动",
  },
];

const tags = ["中国心理学大会", "公益月", "3000家庭", "四有咨询师", "幸福护照"];

export const MarriageNews: React.FC = () => {
  return (
    <section className="px-5 py-8 bg-white">
      <div className="max-w-lg mx-auto">
        <div className="flex items-center gap-2 mb-4 justify-center">
          <Newspaper className="w-5 h-5 text-marriage-primary" />
          <h2 className="text-lg font-bold text-foreground">行业动态</h2>
        </div>

        <div className="space-y-3 mb-4">
          {highlights.map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="bg-marriage-light/60 rounded-xl p-4 border border-marriage-border"
            >
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg bg-marriage-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                  <item.icon className="w-4 h-4 text-marriage-primary" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-foreground mb-1">
                    {item.label}
                  </h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Quote */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="bg-marriage-primary/5 rounded-xl p-4 border border-marriage-primary/20 mb-4"
        >
          <p className="text-xs text-marriage-primary italic text-center leading-relaxed">
            "心理学大会上终于看到有人把婚姻作为独立主题来做，婚姻是家庭的起点、孩子教育的源头、社会的基石。"
          </p>
        </motion.div>

        {/* Tags */}
        <div className="flex flex-wrap gap-2 justify-center">
          {tags.map((tag) => (
            <Badge
              key={tag}
              variant="secondary"
              className="text-xs bg-marriage-light text-marriage-primary border-marriage-border"
            >
              {tag}
            </Badge>
          ))}
        </div>
      </div>
    </section>
  );
};
