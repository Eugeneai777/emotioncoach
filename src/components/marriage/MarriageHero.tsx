import React from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Heart, Shield, Users } from "lucide-react";
import { Button } from "@/components/ui/button";

export const MarriageHero: React.FC = () => {
  const navigate = useNavigate();

  return (
    <section className="relative px-5 pt-12 pb-8 overflow-hidden">
      {/* Decorative background */}
      <div className="absolute inset-0 bg-gradient-to-b from-marriage-light via-white to-white" />
      <div className="absolute top-0 right-0 w-48 h-48 rounded-full bg-marriage-primary/5 blur-3xl" />
      <div className="absolute bottom-0 left-0 w-32 h-32 rounded-full bg-marriage-accent/10 blur-2xl" />

      <div className="relative z-10 max-w-lg mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center space-y-4"
        >
          <div className="inline-flex items-center gap-1.5 bg-marriage-primary/10 text-marriage-primary px-3 py-1 rounded-full text-xs font-medium">
            <Heart className="h-3.5 w-3.5" />
            婚姻全生命周期服务生态平台
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold text-foreground leading-tight">
            让每一对夫妻<br />享受婚姻之旅
          </h1>

          <p className="text-sm text-muted-foreground leading-relaxed">
            深耕婚姻家庭服务20年，<br />
            结合AI测评与专业咨询，<br />
            助力幸福中国。
          </p>

          <div className="flex flex-col gap-3 pt-2">
            <Button
              onClick={() => navigate("/marriage/assessments")}
              className="w-full h-12 rounded-xl bg-marriage-primary hover:bg-marriage-primary/90 text-white text-base font-semibold shadow-lg shadow-marriage-primary/25"
            >
              开始婚姻测评
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate("/marriage/ai-tools")}
              className="w-full h-11 rounded-xl border-marriage-primary/30 text-marriage-primary hover:bg-marriage-light"
            >
              体验AI婚姻教练
            </Button>
          </div>
        </motion.div>

        {/* Trust badges */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="mt-8 grid grid-cols-3 gap-3"
        >
          {[
            { icon: Shield, text: "专业深耕20年" },
            { icon: Users, text: "AI+大数据驱动" },
            { icon: Heart, text: "政府认证供应商" },
          ].map((item, i) => (
            <div key={i} className="flex flex-col items-center gap-1.5 text-center">
              <div className="w-9 h-9 rounded-full bg-marriage-primary/10 flex items-center justify-center">
                <item.icon className="h-4 w-4 text-marriage-primary" />
              </div>
              <span className="text-[10px] text-muted-foreground leading-tight">{item.text}</span>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};
