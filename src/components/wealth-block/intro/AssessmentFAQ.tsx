import { motion } from "framer-motion";
import { HelpCircle } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqItems = [
  {
    q: "这个测评适合什么人？",
    a: "适合所有感觉「赚钱总是卡住」的人。无论你是职场人、创业者、自由职业者，还是全职妈妈，只要你觉得自己的收入与能力不匹配，或者内心有「不敢要钱」「不配有钱」的感觉，都可以通过这个测评找到根源。",
  },
  {
    q: "测评需要多长时间？",
    a: "整个测评大约需要 8-10 分钟。包含 30 道场景化选择题（约 5 分钟）和 AI 智能追问环节（约 2-3 分钟）。AI 追问不是额外负担，而是帮你更精准定位卡点的关键步骤。",
  },
  {
    q: "AI 智能追问是什么？",
    a: "在你完成基础测评后，AI 会根据你的回答模式，用自然语言追问 2-3 个关键问题。比如你在「谈薪」场景得分偏低，AI 可能会问「你上次面对加薪机会时，内心第一反应是什么？」——这些追问能帮助识别连你自己都没意识到的深层卡点。",
  },
  {
    q: "测评结果准确吗？",
    a: "我们的测评模型基于中科院心理所的财富心理学研究框架，结合哈佛商学院行为经济学理论，并通过 12,000+ 样本验证。AI 追问进一步提高了个性化精度。不过测评反映的是你当下的状态，随着成长你的结果也会变化。",
  },
  {
    q: "AI 语音教练是怎么工作的？",
    a: "完成测评后，你可以直接与 AI 财富教练进行 1 对 1 语音对话（前 5 次免费）。教练会基于你的四穷人格类型和觉醒指数，逐条解析你的卡点成因，实时根据你的回答调整对话方向——不是预设脚本，而是真正理解你的个性化对话。就像和一位懂你的教练面对面交流一样自然。",
  },
  {
    q: "觉醒顾问能帮我什么？",
    a: "觉醒顾问是你专属的成长伙伴。完成测评后，顾问会为你制定 7 天定制觉醒路径，每天一个小步骤帮你逐步突破。比如你发现自己是「情绪穷」主导，顾问会帮你设计专门针对金钱焦虑的每日练习。你还可以随时找顾问 1 对 1 对话，不限次数地倾诉困惑、获取指导，每周还会帮你回顾觉醒进展。",
  },
  {
    q: "我的测评数据安全吗？",
    a: "绝对安全。所有数据都经过端到端加密存储，我们严格遵守《个人信息保护法》。你的测评结果仅对你本人可见，不会被用于任何商业用途或分享给第三方。",
  },
  {
    q: "可以重复测评吗？",
    a: "可以。我们建议每隔 1-3 个月重新测评一次，追踪自己的成长变化。每次测评都会生成新的报告，你可以在历史记录中对比不同时期的变化趋势。",
  },
  {
    q: "9.9 元包含什么？",
    a: "包含完整测评（30 道场景题 + AI 智能追问）、四穷人格雷达图、觉醒指数评估、个性化卡点故事解读、突破建议方案，以及免费体验 AI 语音教练和觉醒顾问服务。性价比远超市面上 200-500 元的同类产品。",
  },
  {
    q: "付款后多久可以开始？",
    a: "付款成功后立即开始，无需等待。整个流程是：付款 → 开始答题 → AI 追问 → 实时生成报告 → 体验语音教练 → 领取觉醒顾问服务。全程在线完成，随时随地都可以做。",
  },
];

export function AssessmentFAQ() {
  return (
    <section className="py-10">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-50px" }}
        className="text-center mb-6"
      >
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 text-slate-600 text-xs font-medium mb-3">
          <HelpCircle className="w-3.5 h-3.5" />
          常见问题
        </div>
        <h2 className="text-xl font-bold text-slate-800">你可能想问</h2>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-30px" }}
        className="rounded-2xl bg-white border border-slate-200 overflow-hidden"
      >
        <Accordion type="single" collapsible className="w-full">
          {faqItems.map((item, idx) => (
            <AccordionItem key={idx} value={`faq-${idx}`} className="border-b border-slate-100 last:border-0">
              <AccordionTrigger className="px-4 py-3.5 text-sm text-left text-slate-700 hover:no-underline hover:bg-slate-50">
                <span className="pr-2">{item.q}</span>
              </AccordionTrigger>
              <AccordionContent className="px-4 text-xs text-slate-500 leading-relaxed">
                {item.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </motion.div>
    </section>
  );
}
