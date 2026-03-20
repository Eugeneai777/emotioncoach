import React from "react";
import { motion } from "framer-motion";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import teamGao from "@/assets/team-gao.png";
import teamHehua from "@/assets/team-hehua.png";
import teamMi from "@/assets/team-mi.png";

const team = [
  { name: "高牵牛", title: "婚因有道学苑首席专家", fallback: "高", avatar: teamGao },
  { name: "何华", title: "婚因有道学苑执行院长", fallback: "何", avatar: teamHehua },
  { name: "米老师", title: "婚因有道核心专家", fallback: "米", avatar: teamMi },
];

export const MarriageTeam: React.FC = () => {
  return (
    <section className="px-5 py-8 bg-marriage-light/50">
      <div className="max-w-lg mx-auto">
        <h2 className="text-lg font-bold text-foreground text-center mb-5">
          核心团队
        </h2>
        <div className="grid grid-cols-3 gap-3">
          {team.map((member, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="bg-white rounded-xl p-5 border border-marriage-border shadow-sm text-center"
            >
              <Avatar className="w-14 h-14 mx-auto mb-3">
                <AvatarImage src={member.avatar} alt={member.name} />
                <AvatarFallback className="bg-marriage-primary/10 text-marriage-primary text-lg font-bold">
                  {member.fallback}
                </AvatarFallback>
              </Avatar>
              <h3 className="text-sm font-bold text-foreground">{member.name}</h3>
              <p className="text-xs text-muted-foreground mt-1">{member.title}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
