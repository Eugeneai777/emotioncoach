import React from "react";
import { Helmet } from "react-helmet";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { QrCode, FileText, Phone, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MarriageNav } from "@/components/marriage/MarriageNav";
import { MarriageFooter } from "@/components/marriage/MarriageFooter";
import { MarriageBackButton } from "@/components/marriage/MarriageBackButton";

const resources = [
  { icon: FileText, title: "婚姻关系改善指南", desc: "系统了解关系修复的方法与步骤" },
  { icon: FileText, title: "夫妻沟通避坑清单", desc: "避免常见沟通错误，减少争吵" },
  { icon: FileText, title: "婚姻风险预警表", desc: "识别关系中的危险信号" },
];

const MarriageHelp: React.FC = () => {
  const navigate = useNavigate();

  return (
    <>
      <Helmet>
        <title>获取帮助 - 婚因有道</title>
      </Helmet>
      <div className="min-h-screen bg-gradient-to-b from-marriage-light to-white pb-24">
        <MarriageBackButton />
        <div className="px-5 pt-10 max-w-lg mx-auto">
          <h1 className="text-xl font-bold text-foreground text-center mb-1">获取帮助</h1>
          <p className="text-xs text-muted-foreground text-center mb-8">
            你可以先做测评，也可以直接联系老师获得帮助
          </p>

          {/* WeChat QR */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl p-6 border border-marriage-border shadow-sm text-center mb-6"
          >
            <div className="w-16 h-16 rounded-2xl bg-marriage-primary/10 flex items-center justify-center mx-auto mb-3">
              <QrCode className="h-8 w-8 text-marriage-primary" />
            </div>
            <h2 className="text-base font-bold text-foreground mb-1">扫码添加老师</h2>
            <p className="text-xs text-muted-foreground mb-4">备注：公众号</p>
            <div className="w-40 h-40 bg-marriage-light rounded-xl mx-auto flex items-center justify-center border border-marriage-border">
              <span className="text-xs text-muted-foreground">微信二维码</span>
            </div>
          </motion.div>

          {/* Resources */}
          <h2 className="text-base font-bold text-foreground mb-3">免费领取资料</h2>
          <div className="space-y-2.5 mb-8">
            {resources.map((r, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 8 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="bg-white rounded-xl p-3.5 border border-marriage-border shadow-sm flex items-center gap-3"
              >
                <div className="w-9 h-9 rounded-lg bg-marriage-primary/10 flex items-center justify-center shrink-0">
                  <r.icon className="h-4 w-4 text-marriage-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold text-foreground">{r.title}</h3>
                  <p className="text-[10px] text-muted-foreground">{r.desc}</p>
                </div>
                <Download className="h-4 w-4 text-muted-foreground/40" />
              </motion.div>
            ))}
          </div>

          {/* CTA */}
          <div className="flex flex-col gap-3">
            <Button
              className="w-full h-12 rounded-xl bg-marriage-primary hover:bg-marriage-primary/90 text-white text-base font-semibold shadow-lg shadow-marriage-primary/25"
            >
              添加老师微信
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate("/marriage/assessments")}
              className="w-full h-11 rounded-xl border-marriage-primary/30 text-marriage-primary"
            >
              先做婚姻测评
            </Button>
          </div>
        </div>
        <MarriageFooter />
        <MarriageNav />
      </div>
    </>
  );
};

export default MarriageHelp;
