import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { FileQuestion, Brain, FileText, ChevronRight } from "lucide-react";

const steps = [
  {
    icon: FileQuestion,
    title: "30道场景题",
    time: "5分钟",
    color: "from-blue-500 to-cyan-500",
  },
  {
    icon: Brain,
    title: "AI智能追问",
    time: "2-3分钟",
    color: "from-violet-500 to-purple-500",
  },
  {
    icon: FileText,
    title: "生成专属报告",
    time: "即时",
    color: "from-amber-500 to-orange-500",
  },
];

export function AssessmentFlowCard() {
  return (
    <Card className="p-4 bg-white border-slate-200 shadow-sm">
      <h3 className="font-medium text-sm text-slate-800 text-center mb-4">测评流程</h3>
      
      <div className="flex items-center justify-between gap-1">
        {steps.map((step, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 + idx * 0.1 }}
            className="flex items-center flex-1"
          >
            {/* Step Card */}
            <div className="flex-1 text-center">
              <div className={`w-10 h-10 mx-auto rounded-xl bg-gradient-to-br ${step.color} p-2 mb-2 shadow-md`}>
                <step.icon className="w-full h-full text-white" />
              </div>
              <p className="text-xs font-medium text-slate-700">{step.title}</p>
              <p className="text-[10px] text-slate-500 mt-0.5">{step.time}</p>
            </div>
            
            {/* Arrow */}
            {idx < steps.length - 1 && (
              <ChevronRight className="w-4 h-4 text-slate-400 shrink-0 mx-1" />
            )}
          </motion.div>
        ))}
      </div>
      
      <motion.p 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="text-[10px] text-slate-500 text-center mt-3"
      >
        全程AI引导，轻松完成
      </motion.p>
    </Card>
  );
}
