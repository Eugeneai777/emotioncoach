import { useState, useRef, useEffect, useCallback } from "react";
import { ChevronRight, X, ArrowRight, CheckCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { MamaChat } from "./MamaChat";
import { useCampPurchase } from "@/hooks/useCampPurchase";

interface FieldConfig {
  key: string;
  label: string;
  placeholder: string;
  type?: "text" | "select";
  options?: string[];
}

export interface MamaRoundConfig {
  fields: FieldConfig[];
  buttonText: string;
}

interface RoundHistoryEntry {
  inputs: Record<string, string>;
  aiResponse: string;
}

interface MamaToolCardProps {
  tool: string;
  title: string;
  description: string;
  icon: string;
  rounds: MamaRoundConfig[];
}

export function MamaToolCard({ tool, title, description, icon, rounds }: MamaToolCardProps) {
  const navigate = useNavigate();
  const { data: purchaseData } = useCampPurchase('emotion_stress_7');
  const [expanded, setExpanded] = useState(false);
  const [currentRound, setCurrentRound] = useState(0);
  const [roundHistory, setRoundHistory] = useState<RoundHistoryEntry[]>([]);
  const [currentInputs, setCurrentInputs] = useState<Record<string, string>>({});
  const [isWaitingAI, setIsWaitingAI] = useState(false);
  const [allDone, setAllDone] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
      scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
    }, 100);
  }, []);

  useEffect(() => { scrollToBottom(); }, [roundHistory, isWaitingAI, allDone, scrollToBottom]);

  const handleClose = () => {
    setExpanded(false);
    setCurrentRound(0);
    setRoundHistory([]);
    setCurrentInputs({});
    setIsWaitingAI(false);
    setAllDone(false);
  };

  const handleRoundSubmit = () => {
    const round = rounds[currentRound];
    const hasInput = round.fields.some(f => currentInputs[f.key]?.trim());
    if (!hasInput) return;
    setIsWaitingAI(true);
  };

  const handleAIComplete = (responseText: string) => {
    const newEntry: RoundHistoryEntry = { inputs: { ...currentInputs }, aiResponse: responseText };
    const newHistory = [...roundHistory, newEntry];
    setRoundHistory(newHistory);
    setCurrentInputs({});
    setIsWaitingAI(false);

    if (currentRound >= 2) {
      setAllDone(true);
    } else {
      setCurrentRound(prev => prev + 1);
    }
  };

  const getAllInputs = (): Record<string, string> => {
    const all: Record<string, string> = {};
    roundHistory.forEach(entry => Object.assign(all, entry.inputs));
    Object.assign(all, currentInputs);
    return all;
  };

  const getHistoryForAI = () => {
    return roundHistory.map((entry, i) => ({
      round: i + 1,
      inputs: entry.inputs,
      response: entry.aiResponse,
    }));
  };

  if (!expanded) {
    return (
      <button
        onClick={() => setExpanded(true)}
        className="w-full flex flex-col items-center gap-2 p-4 rounded-2xl bg-white border border-pink-100/80 shadow-sm hover:border-rose-300 hover:shadow-md transition-all text-center active:scale-[0.97]"
      >
        <span className="text-3xl">{icon}</span>
        <div>
          <div className="font-bold text-rose-900 text-sm">{title}</div>
          <div className="text-[11px] text-rose-500/70 mt-0.5">{description}</div>
        </div>
      </button>
    );
  }

  const currentRoundConfig = rounds[currentRound];

  return (
    <div className="col-span-2 rounded-2xl bg-white border border-pink-200 overflow-hidden shadow-lg">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-pink-100">
        <div className="flex items-center gap-2">
          <span className="text-xl">{icon}</span>
          <span className="font-bold text-rose-900">{title}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-rose-400">
            {Math.min(currentRound + 1, 3)}/3
          </span>
          <button onClick={handleClose} className="p-1 rounded-lg hover:bg-rose-50 transition-colors">
            <X className="w-5 h-5 text-rose-400" />
          </button>
        </div>
      </div>

      <div ref={scrollRef} className="p-4 space-y-4 max-h-[70vh] overflow-y-auto">
        {/* Render history */}
        {roundHistory.map((entry, i) => (
          <div key={i} className="space-y-3">
            <div className="flex justify-end">
              <div className="bg-rose-100/60 rounded-xl rounded-tr-sm px-3 py-2 max-w-[80%]">
                {Object.entries(entry.inputs).filter(([, v]) => v?.trim()).map(([k, v]) => {
                  const field = rounds[i]?.fields.find(f => f.key === k);
                  return (
                    <p key={k} className="text-xs text-rose-900">
                      <span className="text-rose-500">{field?.label || k}：</span>{v}
                    </p>
                  );
                })}
              </div>
            </div>
            <div className="flex justify-start">
              <div className="bg-rose-50 rounded-xl rounded-tl-sm px-3 py-2 max-w-[85%] border border-pink-100">
                <p className="text-xs text-rose-800/80 whitespace-pre-wrap leading-relaxed">
                  {entry.aiResponse}
                </p>
              </div>
            </div>
          </div>
        ))}

        {/* Current round: waiting AI */}
        {isWaitingAI && (
          <div className="space-y-3">
            <div className="flex justify-end">
              <div className="bg-rose-100/60 rounded-xl rounded-tr-sm px-3 py-2 max-w-[80%]">
                {Object.entries(currentInputs).filter(([, v]) => v?.trim()).map(([k, v]) => {
                  const field = currentRoundConfig?.fields.find(f => f.key === k);
                  return (
                    <p key={k} className="text-xs text-rose-900">
                      <span className="text-rose-500">{field?.label || k}：</span>{v}
                    </p>
                  );
                })}
              </div>
            </div>
            <MamaChat
              tool={tool}
              inputs={getAllInputs()}
              round={currentRound + 1}
              history={getHistoryForAI()}
              onComplete={handleAIComplete}
            />
          </div>
        )}

        {/* Current round: form */}
        {!isWaitingAI && !allDone && currentRoundConfig && (
          <div className="space-y-3">
            {currentRoundConfig.fields.map((field) => (
              <div key={field.key} className="space-y-1.5">
                <label className="text-sm font-medium text-rose-900">{field.label}</label>
                {field.type === "select" && field.options ? (
                  <select
                    value={currentInputs[field.key] || ""}
                    onChange={(e) => setCurrentInputs(prev => ({ ...prev, [field.key]: e.target.value }))}
                    className="w-full rounded-lg bg-rose-50/50 border border-pink-200 text-rose-900 p-3 text-sm focus:outline-none focus:border-rose-400"
                  >
                    <option value="">{field.placeholder}</option>
                    {field.options.map(opt => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    value={currentInputs[field.key] || ""}
                    onChange={(e) => setCurrentInputs(prev => ({ ...prev, [field.key]: e.target.value }))}
                    placeholder={field.placeholder}
                    className="w-full rounded-lg bg-rose-50/50 border border-pink-200 text-rose-900 p-3 text-sm placeholder:text-rose-300 focus:outline-none focus:border-rose-400"
                  />
                )}
              </div>
            ))}
            <button
              onClick={handleRoundSubmit}
              className="w-full py-3 rounded-lg bg-gradient-to-r from-pink-400 to-rose-500 text-white font-bold text-sm hover:opacity-90 transition-opacity"
            >
              {currentRoundConfig.buttonText}
            </button>
          </div>
        )}

        {/* Conversion card after final round */}
        {allDone && (() => {
          if (purchaseData) {
            return (
              <div className="mt-4 p-4 rounded-xl border border-green-500/30 bg-gradient-to-br from-green-50 to-green-50/50">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <p className="text-sm font-bold text-rose-900">✅ 已加入7天有劲训练营</p>
                </div>
                <p className="text-xs text-rose-600/70 mb-3">继续完成今日训练，保持你的成长节奏</p>
                <button
                  onClick={() => navigate("/camp-checkin")}
                  className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-lg bg-green-600 text-white text-sm font-bold hover:opacity-90 transition-opacity"
                >
                  继续训练
                  <ArrowRight className="w-4 h-4" />
                </button>
                <button
                  onClick={handleClose}
                  className="mt-2 w-full py-2 text-xs text-rose-400 hover:text-rose-600 transition-colors"
                >
                  再聊一次
                </button>
              </div>
            );
          }

          const conversionCopy: Record<string, { title: string; desc: string }> = {
            career:  { title: '🌸 想要突破职场瓶颈？', desc: '7天有劲训练营帮你找回内在力量，重建自信' },
            balance: { title: '🌸 想要找回生活能量？', desc: '7天有劲训练营帮你从疲惫中恢复，活出自己' },
            emotion: { title: '🌸 想要系统疗愈情绪？', desc: '7天有劲训练营帮你从根源化解情绪困扰' },
            growth:  { title: '🌸 想要开启全新成长？', desc: '7天有劲训练营帮你发现潜能，创造可能' },
          };
          const copy = conversionCopy[tool] || conversionCopy.emotion;
          return (
            <div className="mt-4 p-4 rounded-xl border border-rose-200 bg-gradient-to-br from-rose-50 to-pink-50">
              <p className="text-sm font-bold text-rose-900">
                {copy.title}
              </p>
              <p className="text-xs text-rose-600/70 mt-1">
                {copy.desc}
              </p>
              <button
                onClick={() => navigate("/promo/synergy?source=mama")}
                className="mt-3 w-full flex items-center justify-center gap-1.5 py-2.5 rounded-lg bg-gradient-to-r from-pink-400 to-rose-500 text-white text-sm font-bold hover:opacity-90 transition-opacity"
              >
                了解详情
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                onClick={handleClose}
                className="mt-2 w-full py-2 text-xs text-rose-400 hover:text-rose-600 transition-colors"
              >
                再聊一次
              </button>
            </div>
          );
        })()}
      </div>
    </div>
  );
}
