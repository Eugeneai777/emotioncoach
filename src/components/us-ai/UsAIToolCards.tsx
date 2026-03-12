import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { MessageCircle, Languages, Wrench } from "lucide-react";

const tools = [
  {
    type: "chat",
    icon: MessageCircle,
    title: "今天我们聊什么",
    desc: "每天一个问题，让两个人更了解彼此。",
    examples: ["最近让你压力最大的事情是什么？", "最近一件让你开心的事情是什么？", "最近你最需要支持的事情是什么？"],
    btn: "开始对话",
    gradient: "from-usai-primary/10 to-usai-light",
  },
  {
    type: "translate",
    icon: Languages,
    title: "情侣情绪翻译器",
    desc: "很多争吵，其实只是表达方式错了。",
    examples: ['"你怎么又这么晚回来？"'],
    btn: "翻译情绪",
    gradient: "from-pink-50 to-usai-light",
  },
  {
    type: "repair",
    icon: Wrench,
    title: "冲突修复助手",
    desc: "吵架之后，不知道怎么开口？",
    examples: ['"刚刚我语气有点重，其实我只是有点累，不是不在乎你。"'],
    btn: "修复关系",
    gradient: "from-usai-beige to-usai-light",
  },
];

const UsAIToolCards = () => {
  const navigate = useNavigate();

  return (
    <section className="px-5 space-y-4">
      <h2 className="text-lg font-bold text-usai-foreground px-1">核心工具</h2>
      {tools.map((t, i) => (
        <motion.div
          key={t.type}
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: i * 0.1 }}
          className={`rounded-2xl p-5 bg-gradient-to-br ${t.gradient} border border-usai-primary/10`}
        >
          <div className="flex items-center gap-2 mb-2">
            <div className="w-9 h-9 rounded-xl bg-usai-primary/15 flex items-center justify-center">
              <t.icon className="w-4.5 h-4.5 text-usai-primary" />
            </div>
            <h3 className="text-base font-bold text-usai-foreground">{t.title}</h3>
          </div>
          <p className="text-sm text-muted-foreground mb-3">{t.desc}</p>
          <div className="space-y-1.5 mb-4">
            {t.examples.map((ex, j) => (
              <p key={j} className="text-xs text-usai-foreground/70 bg-white/60 rounded-lg px-3 py-1.5 italic">
                {ex}
              </p>
            ))}
          </div>
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => navigate(`/us-ai/tool?type=${t.type}`)}
            className="w-full py-3 rounded-xl bg-usai-primary text-white font-semibold text-sm"
          >
            {t.btn}
          </motion.button>
        </motion.div>
      ))}
    </section>
  );
};

export default UsAIToolCards;
