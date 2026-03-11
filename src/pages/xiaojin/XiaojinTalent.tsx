import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { useXiaojinQuota } from "@/hooks/useXiaojinQuota";
import { PurchaseOnboardingDialog } from "@/components/onboarding/PurchaseOnboardingDialog";

interface Question {
  q: string;
  options: { label: string; type: string }[];
}

const questions: Question[] = [
  { q: "如果有一天不用上学，你最想做什么？", options: [
    { label: "研究有趣的东西", type: "explorer" }, { label: "创作视频或内容", type: "creator" },
    { label: "帮助别人", type: "helper" }, { label: "想办法赚钱", type: "builder" }
  ]},
  { q: "朋友们遇到问题时，你通常会？", options: [
    { label: "帮他们分析原因", type: "explorer" }, { label: "用有趣的方式安慰", type: "creator" },
    { label: "陪在他们身边", type: "helper" }, { label: "帮他们想解决方案", type: "builder" }
  ]},
  { q: "你最享受的时刻是？", options: [
    { label: "学到新知识的瞬间", type: "explorer" }, { label: "完成一件作品时", type: "creator" },
    { label: "看到别人因我而开心", type: "helper" }, { label: "达成一个小目标", type: "builder" }
  ]},
  { q: "如果能有一个超能力，你想要？", options: [
    { label: "读懂所有书", type: "explorer" }, { label: "让想象变成现实", type: "creator" },
    { label: "感受别人的情绪", type: "helper" }, { label: "预见未来趋势", type: "builder" }
  ]},
  { q: "你做作业时最常的状态是？", options: [
    { label: "忍不住去查更多资料", type: "explorer" }, { label: "想把作业做得很有创意", type: "creator" },
    { label: "喜欢和同学一起讨论", type: "helper" }, { label: "先做完再说", type: "builder" }
  ]},
  { q: "你最喜欢哪类视频？", options: [
    { label: "科普知识类", type: "explorer" }, { label: "创意剪辑/音乐", type: "creator" },
    { label: "暖心故事", type: "helper" }, { label: "商业/科技/炫酷", type: "builder" }
  ]},
  { q: "班级活动中你更愿意？", options: [
    { label: "策划方案和调研", type: "explorer" }, { label: "负责设计和创意", type: "creator" },
    { label: "组织和协调大家", type: "helper" }, { label: "当负责人推动执行", type: "builder" }
  ]},
  { q: "你觉得成功是？", options: [
    { label: "搞懂复杂的事情", type: "explorer" }, { label: "创造出独一无二的东西", type: "creator" },
    { label: "让身边的人更好", type: "helper" }, { label: "实现自己的目标", type: "builder" }
  ]},
  { q: "假期你最想做的事？", options: [
    { label: "去博物馆或实验室", type: "explorer" }, { label: "学一个新技能", type: "creator" },
    { label: "和朋友一起做公益", type: "helper" }, { label: "尝试做一个小项目", type: "builder" }
  ]},
  { q: "你最崇拜哪类人？", options: [
    { label: "科学家/学者", type: "explorer" }, { label: "艺术家/创作者", type: "creator" },
    { label: "老师/医生/志愿者", type: "helper" }, { label: "企业家/领导者", type: "builder" }
  ]},
];

const talentResults: Record<string, { name: string; emoji: string; desc: string; skills: string[] }> = {
  explorer: { name: "探索者型", emoji: "🔬", desc: "你天生对未知充满好奇，很多科学家、创业者都属于这种类型。", skills: ["探索", "分析", "解决问题"] },
  creator: { name: "创造者型", emoji: "🎨", desc: "你拥有丰富的想象力和创造力，天生适合用作品表达自我。", skills: ["创意", "表达", "设计"] },
  helper: { name: "守护者型", emoji: "💝", desc: "你天生善解人意，能感受到别人的需求，是天生的领导者和守护者。", skills: ["共情", "沟通", "关怀"] },
  builder: { name: "建造者型", emoji: "🏗️", desc: "你有强烈的目标感和执行力，善于把想法变成现实。", skills: ["执行", "规划", "决策"] },
};

export default function XiaojinTalent() {
  const navigate = useNavigate();
  const { remaining, deduct } = useXiaojinQuota();
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [current, setCurrent] = useState(0);
  const [scores, setScores] = useState<Record<string, number>>({ explorer: 0, creator: 0, helper: 0, builder: 0 });
  const [done, setDone] = useState(false);

  const handleAnswer = (type: string) => {
    // 天赋测试整体扣1点（在最后一题时扣费）
    if (current === questions.length - 1) {
      if (!deduct(1)) {
        setShowUpgrade(true);
        return;
      }
    }

    const newScores = { ...scores, [type]: scores[type] + 1 };
    setScores(newScores);
    if (current < questions.length - 1) {
      setCurrent(current + 1);
    } else {
      setDone(true);
    }
  };

  const topType = Object.entries(scores).sort((a, b) => b[1] - a[1])[0][0];
  const result = talentResults[topType];

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50/80 via-white to-gray-50">
      <div className="max-w-md mx-auto px-5 pt-6 pb-8">
        <div className="flex items-center justify-between mb-6">
          <button onClick={() => navigate("/xiaojin")} className="flex items-center gap-1 text-gray-400 text-sm">
            <ArrowLeft className="w-4 h-4" /> 返回
          </button>
          <span className="text-xs text-gray-400">剩余 <span className={`font-bold ${remaining > 20 ? 'text-amber-500' : remaining > 0 ? 'text-orange-500' : 'text-red-500'}`}>{remaining}</span> 点</span>
        </div>

        <AnimatePresence mode="wait">
          {!done ? (
            <motion.div key={current} initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.3 }}>
              <div className="flex items-center gap-2 mb-6">
                <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-blue-400 to-sky-400 rounded-full"
                    initial={{ width: `${(current / questions.length) * 100}%` }}
                    animate={{ width: `${((current + 1) / questions.length) * 100}%` }}
                  />
                </div>
                <span className="text-xs text-gray-400">{current + 1}/{questions.length}</span>
              </div>

              <h2 className="text-lg font-bold text-gray-800 mb-6">{questions[current].q}</h2>

              <div className="space-y-3">
                {questions[current].options.map((opt, i) => (
                  <button
                    key={i}
                    onClick={() => handleAnswer(opt.type)}
                    className="w-full bg-white border border-gray-200 rounded-xl p-4 text-left text-sm text-gray-700 hover:border-blue-300 hover:bg-blue-50/50 active:scale-[0.98] transition-all"
                  >
                    {String.fromCharCode(65 + i)}. {opt.label}
                  </button>
                ))}
              </div>
            </motion.div>
          ) : (
            <motion.div key="result" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
              <div className="bg-gradient-to-br from-blue-100 via-sky-50 to-white rounded-3xl p-8 shadow-md text-center">
                <p className="text-xs text-blue-400 mb-1">你的天赋类型</p>
                <span className="text-5xl block my-4">{result.emoji}</span>
                <h2 className="text-xl font-bold text-gray-800 mb-3">{result.name}</h2>
                <p className="text-sm text-gray-500 leading-relaxed mb-5">{result.desc}</p>
                <div className="flex justify-center gap-2 mb-4">
                  {result.skills.map(s => (
                    <span key={s} className="bg-blue-100 text-blue-600 text-xs px-3 py-1 rounded-full">{s}</span>
                  ))}
                </div>
                <p className="text-[10px] text-gray-300">小劲AI · {new Date().toLocaleDateString()}</p>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => navigate("/xiaojin")}
                  className="flex-1 bg-white border border-gray-200 rounded-xl py-3 text-sm text-gray-600 active:scale-[0.98] transition-transform"
                >
                  回到首页
                </button>
                <button
                  className="flex-1 bg-gradient-to-r from-blue-400 to-sky-400 text-white rounded-xl py-3 text-sm font-medium active:scale-[0.98] transition-transform"
                >
                  保存天赋卡
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <PurchaseOnboardingDialog
        open={showUpgrade}
        onOpenChange={setShowUpgrade}
        defaultPackage="member365"
        triggerFeature="免费体验点数已用完"
        onSuccess={() => setShowUpgrade(false)}
      />
    </div>
  );
}
