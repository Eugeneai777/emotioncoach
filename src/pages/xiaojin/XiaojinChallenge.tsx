import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Check } from "lucide-react";
import { useXiaojinQuota } from "@/hooks/useXiaojinQuota";
import { PurchaseOnboardingDialog } from "@/components/onboarding/PurchaseOnboardingDialog";
import { uploadMoodLog } from "@/utils/xiaojinMoodUpload";

const challenges = [
  { day: 1, q: "今天让你开心的一件小事是什么？" },
  { day: 2, q: "今天你做了一件勇敢的事吗？" },
  { day: 3, q: "你今天学到了什么新东西？" },
  { day: 4, q: "今天你帮助了谁？" },
  { day: 5, q: "你今天最感恩的事是什么？" },
  { day: 6, q: "用三个词形容你今天的心情" },
  { day: 7, q: "最近一次你克服困难是什么？" },
  { day: 8, q: "如果给今天打分(1-10)，你打几分？" },
  { day: 9, q: "你最近最想和谁说谢谢？" },
  { day: 10, q: "你觉得自己最大的优点是什么？" },
  { day: 14, q: "这两周你最大的变化是什么？" },
  { day: 21, q: "你发现自己什么时候最有能量？" },
  { day: 30, q: "如果未来10年完成一件大事，你希望是什么？" },
  { day: 50, q: "回顾前50天，你最骄傲的一个改变是什么？" },
  { day: 75, q: "你觉得自己离理想的自己还有多远？" },
  { day: 100, q: "写一封信给100天前的自己" },
];

export default function XiaojinChallenge() {
  const navigate = useNavigate();
  const { remaining, deduct } = useXiaojinQuota();
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [currentDay] = useState(1);
  const [answer, setAnswer] = useState("");
  const [completed, setCompleted] = useState(false);

  const todayChallenge = challenges.find(c => c.day === currentDay) || challenges[0];

  const handleComplete = () => {
    if (!answer.trim()) return;
    if (!deduct(1)) {
      setShowUpgrade(true);
      return;
    }
    setCompleted(true);
    // Upload mood log for challenge completion
    uploadMoodLog({ moodLabel: "成长挑战", intensity: 2, featureUsed: "challenge" });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50/80 via-white to-gray-50">
      <div className="max-w-md mx-auto px-5 pt-6 pb-8">
        <div className="flex items-center justify-between mb-6">
          <button onClick={() => navigate("/xiaojin")} className="flex items-center gap-1 text-gray-400 text-sm">
            <ArrowLeft className="w-4 h-4" /> 返回
          </button>
          <span className="text-xs text-gray-400">剩余 <span className={`font-bold ${remaining > 20 ? 'text-amber-500' : remaining > 0 ? 'text-orange-500' : 'text-red-500'}`}>{remaining}</span> 点</span>
        </div>

        <div className="text-center mb-8">
          <h1 className="text-xl font-bold text-gray-800 mb-2">🔥 成长100天挑战</h1>
          <p className="text-xs text-gray-400">每天一个问题，遇见更好的自己</p>
        </div>

        {/* Progress */}
        <div className="mb-6">
          <div className="flex items-center justify-between text-xs text-gray-400 mb-2">
            <span>进度</span>
            <span>Day {currentDay}/100</span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-orange-400 to-amber-400 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${currentDay}%` }}
            />
          </div>
        </div>

        {!completed ? (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-orange-100 mb-4">
              <div className="text-xs text-orange-400 font-medium mb-3">Day {todayChallenge.day}</div>
              <h2 className="text-base font-semibold text-gray-800 mb-4">{todayChallenge.q}</h2>
              <textarea
                value={answer}
                onChange={e => setAnswer(e.target.value)}
                placeholder="写下你的回答..."
                className="w-full rounded-xl border border-gray-200 p-3 text-sm resize-none h-28 focus:outline-none focus:border-orange-300"
              />
            </div>

            <button
              onClick={handleComplete}
              disabled={!answer.trim()}
              className="w-full bg-gradient-to-r from-orange-400 to-amber-400 text-white rounded-xl py-3 text-sm font-medium disabled:opacity-50 active:scale-[0.98] transition-transform"
            >
              完成今日挑战 ✓
            </button>
          </motion.div>
        ) : (
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center">
            <div className="bg-gradient-to-br from-orange-100 to-amber-50 rounded-3xl p-8 shadow-md">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Check className="w-8 h-8 text-green-500" />
              </div>
              <p className="text-xs text-orange-400 mb-1">成长记录卡</p>
              <h2 className="text-lg font-bold text-gray-800 mb-2">Day {todayChallenge.day} 完成！</h2>
              <p className="text-sm text-gray-500 mb-4 px-4">"{answer}"</p>
              <div className="text-[10px] text-gray-300">小劲AI · {new Date().toLocaleDateString()}</div>
            </div>

            {/* Upcoming */}
            <div className="mt-6 text-left">
              <p className="text-xs text-gray-400 mb-3">即将到来的挑战</p>
              <div className="space-y-2">
                {challenges.filter(c => c.day > currentDay).slice(0, 3).map(c => (
                  <div key={c.day} className="bg-white rounded-xl p-3 border border-gray-100 flex items-center gap-3">
                    <span className="text-xs text-gray-300 w-10">Day{c.day}</span>
                    <span className="text-xs text-gray-500 flex-1">{c.q}</span>
                    <span className="text-gray-200">🔒</span>
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={() => navigate("/xiaojin")}
              className="mt-6 w-full bg-gradient-to-r from-orange-400 to-amber-400 text-white rounded-xl py-3 text-sm font-medium active:scale-[0.98] transition-transform"
            >
              回到首页
            </button>
          </motion.div>
        )}
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
