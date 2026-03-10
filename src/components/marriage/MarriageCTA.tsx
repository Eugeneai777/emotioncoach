import React from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";

export const MarriageCTA: React.FC = () => {
  const navigate = useNavigate();

  return (
    <section className="px-5 py-10 bg-gradient-to-b from-marriage-light to-white">
      <div className="max-w-lg mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <Heart className="h-8 w-8 text-marriage-primary mx-auto mb-4 opacity-60" />
          <h2 className="text-lg font-bold text-foreground mb-2 leading-relaxed">
            很多关系不是没爱了<br />而是不会表达了
          </h2>
          <p className="text-sm text-muted-foreground mb-6">
            从一次测评开始，<br />给关系一个重新变好的机会。
          </p>

          <div className="flex flex-col gap-3">
            <Button
              onClick={() => navigate("/marriage/assessments")}
              className="w-full h-12 rounded-xl bg-marriage-primary hover:bg-marriage-primary/90 text-white text-base font-semibold shadow-lg shadow-marriage-primary/25"
            >
              开始测评
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate("/marriage/help")}
              className="w-full h-11 rounded-xl border-marriage-primary/30 text-marriage-primary hover:bg-marriage-light"
            >
              添加老师微信
            </Button>
          </div>
        </motion.div>
      </div>
    </section>
  );
};
