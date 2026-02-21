import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { FileQuestion, Brain, FileText, ChevronRight, Mic, Compass } from "lucide-react";

const assessmentSteps = [
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

const postSteps = [
  {
    icon: Mic,
    title: "AI教练解读",
    time: "24x7",
    color: "from-rose-500 to-pink-500",
  },
  {
    icon: Compass,
    title: "觉醒顾问",
    time: "24x7",
    color: "from-emerald-500 to-teal-500",
  },
];

function StepRow({ steps, startDelay = 0 }: { steps: typeof assessmentSteps; startDelay?: number }) {
  return (
    <div className="flex items-center justify-between gap-1">
      {steps.map((step, idx) => (
        <motion.div
          key={idx}
          initial={{ opacity: 0.01, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: startDelay + idx * 0.1 }}
          className="flex items-center flex-1"
          style={{ transform: 'translateZ(0)', willChange: 'transform, opacity' }}
        >
          <div className="flex-1 text-center">
            <div className={`w-10 h-10 mx-auto rounded-xl bg-gradient-to-br ${step.color} p-2 mb-2 shadow-md`}>
              <step.icon className="w-full h-full text-white" />
            </div>
            <p className="text-xs font-medium text-slate-700">{step.title}</p>
            <p className="text-[10px] text-slate-500 mt-0.5">{step.time}</p>
          </div>
          {idx < steps.length - 1 && (
            <ChevronRight className="w-4 h-4 text-slate-400 shrink-0 mx-1" />
          )}
        </motion.div>
      ))}
    </div>
  );
}

export function AssessmentFlowCard() {
  return (
    <Card className="p-4 bg-white border-slate-200 shadow-sm">
      <h3 className="font-medium text-sm text-slate-800 text-center mb-4">测评流程</h3>
      
      <StepRow steps={assessmentSteps} startDelay={0.1} />

      {/* Separator */}
      <div className="flex items-center gap-2 my-3">
        <div className="flex-1 border-t border-dashed border-slate-200" />
        <span className="text-[10px] text-slate-400 font-medium shrink-0">测评后</span>
        <div className="flex-1 border-t border-dashed border-slate-200" />
      </div>

      <StepRow steps={postSteps} startDelay={0.4} />
      
      <motion.p 
        initial={{ opacity: 0.01 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="text-[10px] text-slate-500 text-center mt-3"
        style={{ transform: 'translateZ(0)', willChange: 'transform, opacity' }}
      >
        从测评到突破，全程AI陪伴
      </motion.p>
    </Card>
  );
}
