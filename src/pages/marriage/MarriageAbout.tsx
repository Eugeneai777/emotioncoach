import React from "react";
import { Helmet } from "react-helmet";
import { motion } from "framer-motion";
import { Heart } from "lucide-react";
import { MarriageNav } from "@/components/marriage/MarriageNav";
import { MarriageFooter } from "@/components/marriage/MarriageFooter";

const timeline = [
  { year: "2004", event: "创立婚因有道，开始深耕婚姻家庭服务领域" },
  { year: "2022", event: "参与婚姻家庭辅导行业标准相关工作" },
  { year: "2023", event: "参与婚姻家庭咨询师国家标准修订工作" },
  { year: "2024", event: "联合公益机构推出幸福家庭项目" },
  { year: "2025", event: "引入AI技术，推出智能婚姻测评与关系分析工具" },
];

const MarriageAbout: React.FC = () => {
  return (
    <>
      <Helmet>
        <title>关于婚因有道 - 深耕婚姻家庭服务20年</title>
      </Helmet>
      <div className="min-h-screen bg-gradient-to-b from-marriage-light to-white pb-24">
        <div className="px-5 pt-10 max-w-lg mx-auto">
          <div className="text-center mb-8">
            <Heart className="h-10 w-10 text-marriage-primary mx-auto mb-3" />
            <h1 className="text-xl font-bold text-foreground mb-2">关于婚因有道</h1>
            <p className="text-sm text-muted-foreground leading-relaxed">
              婚因有道深耕婚姻家庭服务领域20年，<br />
              致力于帮助更多家庭建立<br />
              更健康、更稳定、更有希望的关系。
            </p>
          </div>

          {/* Timeline */}
          <h2 className="text-base font-bold text-foreground mb-4">发展历程</h2>
          <div className="space-y-0">
            {timeline.map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -10 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="flex gap-4 pb-6 last:pb-0"
              >
                <div className="flex flex-col items-center">
                  <div className="w-3 h-3 rounded-full bg-marriage-primary shrink-0 mt-1" />
                  {i < timeline.length - 1 && <div className="w-0.5 flex-1 bg-marriage-border mt-1" />}
                </div>
                <div>
                  <span className="text-xs font-bold text-marriage-primary">{item.year}</span>
                  <p className="text-sm text-foreground mt-0.5">{item.event}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
        <MarriageFooter />
        <MarriageNav />
      </div>
    </>
  );
};

export default MarriageAbout;
