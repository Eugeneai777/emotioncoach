import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface MoodOption {
  id: string;
  emoji: string;
  label: string;
  description: string;
  tools: { id: string; name: string; reason: string }[];
}

const moods: MoodOption[] = [
  {
    id: "anxious",
    emoji: "😰",
    label: "焦虑",
    description: "心跳加速，坐立不安",
    tools: [
      { id: "breathing", name: "呼吸练习", reason: "4-7-8 呼吸法可以在 2 分钟内降低心率" },
      { id: "panic", name: "恐慌急救", reason: "32条认知提醒帮你恢复掌控感" },
      { id: "emotion-sos", name: "情绪🆘按钮", reason: "即时获得AI陪伴和安抚" },
    ],
  },
  {
    id: "low",
    emoji: "😞",
    label: "低落",
    description: "提不起劲，什么都不想做",
    tools: [
      { id: "alive-check", name: "每日安全守护", reason: "一个简单但有力的安全确认" },
      { id: "gratitude", name: "感恩日记", reason: "记录3件小事，唤醒积极感受" },
      { id: "declaration", name: "能量宣言卡", reason: "给自己一句有力量的话" },
    ],
  },
  {
    id: "confused",
    emoji: "🌫️",
    label: "迷茫",
    description: "不知道该怎么办，方向不清",
    tools: [
      { id: "values", name: "价值观探索", reason: "找到你内心真正珍视的东西" },
      { id: "midlife-awakening", name: "中场觉醒力测评", reason: "6维扫描找到突破口" },
      { id: "vision", name: "人生愿景画布", reason: "让目标变得清晰可见" },
    ],
  },
  {
    id: "okay",
    emoji: "😊",
    label: "还不错",
    description: "状态平稳，想做点什么",
    tools: [
      { id: "declaration", name: "能量宣言卡", reason: "趁状态好给自己充电" },
      { id: "strengths", name: "优势发现", reason: "深入了解你的独特天赋" },
      { id: "mindfulness", name: "正念练习", reason: "让好状态持续更久" },
    ],
  },
];

// Map tool IDs to routes
const toolRoutes: Record<string, string> = {
  breathing: "breathing",
  panic: "panic",
  "emotion-sos": "/emotion-sos",
  "alive-check": "alive-check",
  gratitude: "gratitude",
  declaration: "declaration",
  values: "values",
  "midlife-awakening": "/midlife-awakening",
  vision: "vision",
  strengths: "strengths",
  mindfulness: "mindfulness",
};

interface MoodEntryCardProps {
  onToolSelect: (toolId: string) => void;
}

const MoodEntryCard = ({ onToolSelect }: MoodEntryCardProps) => {
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const navigate = useNavigate();

  const activeMood = moods.find((m) => m.id === selectedMood);

  const handleToolClick = (toolId: string) => {
    const route = toolRoutes[toolId];
    if (route?.startsWith("/")) {
      navigate(route);
    } else {
      onToolSelect(toolId);
    }
  };

  return (
    <div className="rounded-2xl bg-gradient-to-br from-primary/10 via-accent/5 to-secondary/10 border border-primary/20 p-4 space-y-3">
      <div className="text-center">
        <h2 className="text-base font-semibold text-foreground">你现在感觉怎么样？</h2>
        <p className="text-xs text-muted-foreground mt-0.5">选一个最接近的状态，我来帮你</p>
      </div>

      <div className="grid grid-cols-4 gap-2">
        {moods.map((mood) => (
          <button
            key={mood.id}
            onClick={() => setSelectedMood(selectedMood === mood.id ? null : mood.id)}
            className={cn(
              "flex flex-col items-center gap-1 py-2.5 px-1 rounded-xl transition-all",
              "border border-transparent",
              selectedMood === mood.id
                ? "bg-primary/15 border-primary/30 scale-105"
                : "bg-card hover:bg-accent/50 active:scale-95"
            )}
          >
            <span className="text-2xl">{mood.emoji}</span>
            <span className="text-xs font-medium">{mood.label}</span>
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {activeMood && (
          <motion.div
            key={activeMood.id}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="space-y-2 overflow-hidden"
          >
            <p className="text-xs text-muted-foreground text-center">
              {activeMood.description}，试试这些：
            </p>
            {activeMood.tools.map((tool) => (
              <button
                key={tool.id}
                onClick={() => handleToolClick(tool.id)}
                className="w-full flex items-center gap-3 p-3 rounded-xl bg-card border border-border/50 hover:border-primary/30 active:scale-[0.98] transition-all text-left"
              >
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-medium text-foreground">{tool.name}</span>
                  <p className="text-xs text-muted-foreground mt-0.5">{tool.reason}</p>
                </div>
                <span className="text-primary text-xs font-medium shrink-0">开始 →</span>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MoodEntryCard;
