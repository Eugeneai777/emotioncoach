import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { MessageCircle, Quote } from "lucide-react";

const testimonials = [
  {
    quote: "第三次对话时，AI说'你上次提到对父亲有愧疚感'，我当时就哭了",
    highlight: "AI说'你上次提到对父亲有愧疚感'",
    user: "小雨",
    tag: "AI记忆",
  },
  {
    quote: "训练营第15天，AI告诉我'你的手穷模式已转变为手富'，比我自己更早发现",
    highlight: "'你的手穷模式已转变为手富'",
    user: "阿杰",
    tag: "AI见证",
  },
  {
    quote: "原来AI真的会记得我说过的每一句话，感觉被深深理解了",
    highlight: "AI真的会记得我说过的每一句话",
    user: "晓晓",
    tag: "AI陪伴",
  },
];

export function AITestimonialsCard() {
  return (
    <Card className="p-4 bg-gradient-to-br from-slate-900 via-indigo-950/30 to-slate-900 border-indigo-500/30">
      <div className="flex items-center gap-2 mb-4">
        <MessageCircle className="w-4 h-4 text-indigo-400" />
        <h3 className="font-medium text-sm text-indigo-200">用户真实反馈</h3>
      </div>
      
      <div className="space-y-3">
        {testimonials.map((item, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + idx * 0.12 }}
            className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/40 relative"
          >
            {/* Quote Icon */}
            <Quote className="absolute top-2 right-2 w-4 h-4 text-indigo-400/30" />
            
            {/* Tag */}
            <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-indigo-500/20 border border-indigo-500/30 mb-2">
              <span className="text-[10px] text-indigo-300 font-medium">{item.tag}</span>
            </div>
            
            {/* Quote Content */}
            <p className="text-xs text-slate-300 leading-relaxed mb-2">
              "{item.quote}"
            </p>
            
            {/* User */}
            <div className="flex items-center justify-end gap-1.5">
              <div className="w-5 h-5 rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center">
                <span className="text-[10px] text-white font-medium">{item.user[0]}</span>
              </div>
              <span className="text-[10px] text-slate-400">—— {item.user}</span>
            </div>
          </motion.div>
        ))}
      </div>
      
      {/* Trust Signal */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="mt-3 text-center"
      >
        <p className="text-[10px] text-slate-500">
          来自已完成财富觉醒训练营的真实用户
        </p>
      </motion.div>
    </Card>
  );
}
