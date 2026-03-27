import { useState, useRef, useEffect, useCallback } from "react";
import { ChevronRight, X, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { LaogeChat } from "./LaogeChat";
import type { RoundConfig } from "@/pages/LaogeAI";

interface FieldConfig {
  key: string;
  label: string;
  placeholder: string;
  type?: "text" | "select";
  options?: string[];
}

interface RoundHistoryEntry {
  inputs: Record<string, string>;
  aiResponse: string;
}

interface LaogeToolCardProps {
  tool: string;
  title: string;
  description: string;
  icon: string;
  rounds: RoundConfig[];
}

export function LaogeToolCard({ tool, title, description, icon, rounds }: LaogeToolCardProps) {
  const navigate = useNavigate();
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

  // Collect all inputs from history + current round
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
        className="w-full flex items-center gap-3 p-4 rounded-xl bg-[hsl(var(--laoge-card))] border border-[hsl(var(--laoge-border))] hover:border-[hsl(var(--laoge-accent))] transition-all group text-left"
      >
        <span className="text-2xl flex-shrink-0">{icon}</span>
        <div className="flex-1 min-w-0">
          <div className="font-bold text-[hsl(var(--laoge-text))] text-base">{title}</div>
          <div className="text-xs text-[hsl(var(--laoge-text-muted))] mt-0.5 truncate">{description}</div>
        </div>
        <ChevronRight className="w-5 h-5 text-[hsl(var(--laoge-text-muted))] group-hover:text-[hsl(var(--laoge-accent))] transition-colors flex-shrink-0" />
      </button>
    );
  }

  const currentRoundConfig = rounds[currentRound];

  return (
    <div className="rounded-xl bg-[hsl(var(--laoge-card))] border border-[hsl(var(--laoge-border))] overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-[hsl(var(--laoge-border))]">
        <div className="flex items-center gap-2">
          <span className="text-xl">{icon}</span>
          <span className="font-bold text-[hsl(var(--laoge-text))]">{title}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-[hsl(var(--laoge-text-muted))]">
            {Math.min(currentRound + 1, 3)}/3
          </span>
          <button onClick={handleClose} className="p-1 rounded-lg hover:bg-[hsl(var(--laoge-bg))] transition-colors">
            <X className="w-5 h-5 text-[hsl(var(--laoge-text-muted))]" />
          </button>
        </div>
      </div>

      <div ref={scrollRef} className="p-4 space-y-4 max-h-[70vh] overflow-y-auto">
        {/* Render history */}
        {roundHistory.map((entry, i) => (
          <div key={i} className="space-y-3">
            {/* User input summary */}
            <div className="flex justify-end">
              <div className="bg-[hsl(var(--laoge-accent)/0.15)] rounded-xl rounded-tr-sm px-3 py-2 max-w-[80%]">
                {Object.entries(entry.inputs).filter(([, v]) => v?.trim()).map(([k, v]) => {
                  const field = rounds[i]?.fields.find(f => f.key === k);
                  return (
                    <p key={k} className="text-xs text-[hsl(var(--laoge-text))]">
                      <span className="text-[hsl(var(--laoge-text-muted))]">{field?.label || k}：</span>{v}
                    </p>
                  );
                })}
              </div>
            </div>
            {/* AI response */}
            <div className="flex justify-start">
              <div className="bg-[hsl(var(--laoge-bg))] rounded-xl rounded-tl-sm px-3 py-2 max-w-[85%] border border-[hsl(var(--laoge-border))]">
                <p className="text-xs text-[hsl(var(--laoge-text-muted))] whitespace-pre-wrap leading-relaxed">
                  {entry.aiResponse}
                </p>
              </div>
            </div>
          </div>
        ))}

        {/* Current round: waiting AI */}
        {isWaitingAI && (
          <div className="space-y-3">
            {/* Show current inputs as user bubble */}
            <div className="flex justify-end">
              <div className="bg-[hsl(var(--laoge-accent)/0.15)] rounded-xl rounded-tr-sm px-3 py-2 max-w-[80%]">
                {Object.entries(currentInputs).filter(([, v]) => v?.trim()).map(([k, v]) => {
                  const field = currentRoundConfig?.fields.find(f => f.key === k);
                  return (
                    <p key={k} className="text-xs text-[hsl(var(--laoge-text))]">
                      <span className="text-[hsl(var(--laoge-text-muted))]">{field?.label || k}：</span>{v}
                    </p>
                  );
                })}
              </div>
            </div>
            {/* AI streaming */}
            <LaogeChat
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
                <label className="text-sm font-medium text-[hsl(var(--laoge-text))]">{field.label}</label>
                {field.type === "select" && field.options ? (
                  <select
                    value={currentInputs[field.key] || ""}
                    onChange={(e) => setCurrentInputs(prev => ({ ...prev, [field.key]: e.target.value }))}
                    className="w-full rounded-lg bg-[hsl(var(--laoge-bg))] border border-[hsl(var(--laoge-border))] text-[hsl(var(--laoge-text))] p-3 text-sm focus:outline-none focus:border-[hsl(var(--laoge-accent))]"
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
                    className="w-full rounded-lg bg-[hsl(var(--laoge-bg))] border border-[hsl(var(--laoge-border))] text-[hsl(var(--laoge-text))] p-3 text-sm placeholder:text-[hsl(var(--laoge-text-muted))] focus:outline-none focus:border-[hsl(var(--laoge-accent))]"
                  />
                )}
              </div>
            ))}
            <button
              onClick={handleRoundSubmit}
              className="w-full py-3 rounded-lg bg-[hsl(var(--laoge-accent))] text-white font-bold text-sm hover:opacity-90 transition-opacity"
            >
              {currentRoundConfig.buttonText}
            </button>
          </div>
        )}

        {/* Conversion card after final round */}
        {allDone && (() => {
          const conversionCopy: Record<string, { title: string; desc: string }> = {
            money:   { title: '🔥 想要突破收入瓶颈？', desc: '7天有劲训练营帮你重建赚钱的内在动力' },
            career:  { title: '🔥 想要找回事业方向？', desc: '7天有劲训练营帮你破解职场内耗' },
            stress:  { title: '🔥 想要系统减压？', desc: '7天有劲训练营帮你从根源化解压力' },
            health:  { title: '🔥 想要恢复身心活力？', desc: '7天有劲训练营帮你重启身体能量' },
          };
          const copy = conversionCopy[tool] || conversionCopy.stress;
          return (
            <div className="mt-4 p-4 rounded-xl border border-[hsl(var(--laoge-accent)/0.3)] bg-gradient-to-br from-[hsl(var(--laoge-accent)/0.08)] to-[hsl(var(--laoge-accent)/0.02)]">
              <p className="text-sm font-bold text-[hsl(var(--laoge-text))]">
                {copy.title}
              </p>
              <p className="text-xs text-[hsl(var(--laoge-text-muted))] mt-1">
                {copy.desc}
              </p>
              <button
                onClick={() => navigate("/promo/synergy?source=laoge")}
                className="mt-3 w-full flex items-center justify-center gap-1.5 py-2.5 rounded-lg bg-[hsl(var(--laoge-accent))] text-white text-sm font-bold hover:opacity-90 transition-opacity"
              >
                了解详情
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                onClick={handleClose}
                className="mt-2 w-full py-2 text-xs text-[hsl(var(--laoge-text-muted))] hover:text-[hsl(var(--laoge-text))] transition-colors"
              >
                再问老哥一次
              </button>
            </div>
          );
        })()}
      </div>
    </div>
  );
}
