import React from "react";
import { motion } from "framer-motion";
import { Award, Cpu, Building2, MapPin } from "lucide-react";

const advantages = [
  { icon: Award, title: "婚姻情感领域专业深耕20年", color: "bg-purple-100 text-marriage-primary" },
  { icon: Cpu, title: "大数据及人工智能技术支撑", color: "bg-blue-100 text-blue-600" },
  { icon: Building2, title: "政府认证供应商，知名企业战略合作伙伴", color: "bg-emerald-100 text-emerald-600" },
  { icon: MapPin, title: "遍及全国的咨询师队伍", color: "bg-amber-100 text-amber-600" },
];

export const MarriageWhyUs: React.FC = () => {
  return (
    <section className="px-5 py-8 bg-marriage-light/50">
      <div className="max-w-lg mx-auto">
        <h2 className="text-lg font-bold text-foreground text-center mb-5">
          深耕婚姻家庭服务20年
        </h2>

        <div className="grid grid-cols-2 gap-3">
          {advantages.map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className="bg-white rounded-xl p-4 border border-marriage-border shadow-sm text-center"
            >
              <div className={`w-10 h-10 rounded-xl ${item.color} flex items-center justify-center mx-auto mb-2.5`}>
                <item.icon className="h-5 w-5" />
              </div>
              <p className="text-xs font-medium text-foreground leading-relaxed">{item.title}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
