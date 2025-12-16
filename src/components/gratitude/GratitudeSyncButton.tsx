import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/components/ui/collapsible";
import { RefreshCw, Loader2, Sparkles, Check, Brain, Heart, Coins, Activity, Leaf, PartyPopper, Users, ChevronDown } from "lucide-react";

interface GratitudeSyncButtonProps {
  entryCount: number;
  unanalyzedCount: number;
  onAnalyze: () => Promise<void>;
  isAnalyzing: boolean;
  isLoggedIn: boolean;
}

// 七维幸福图标
const happinessDimensions = [
  { icon: Brain, label: "创造", color: "text-purple-500" },
  { icon: Heart, label: "关系", color: "text-pink-500" },
  { icon: Coins, label: "财富", color: "text-yellow-500" },
  { icon: Activity, label: "健康", color: "text-green-500" },
  { icon: Leaf, label: "内在", color: "text-teal-500" },
  { icon: PartyPopper, label: "体验", color: "text-orange-500" },
  { icon: Users, label: "贡献", color: "text-blue-500" },
];

export const GratitudeSyncButton = ({
  entryCount,
  unanalyzedCount,
  onAnalyze,
  isAnalyzing,
  isLoggedIn,
}: GratitudeSyncButtonProps) => {
  const [isValueOpen, setIsValueOpen] = useState(false);
  const hasEntries = entryCount > 0;
  const hasUnanalyzed = unanalyzedCount > 0;
  const allAnalyzed = hasEntries && !hasUnanalyzed;

  // 根据状态选择图标和样式
  const getIconStyle = () => {
    if (allAnalyzed) {
      return "bg-gradient-to-br from-green-400 to-emerald-500";
    }
    if (hasUnanalyzed) {
      return "bg-gradient-to-br from-teal-400 to-cyan-500 animate-float";
    }
    return "bg-gradient-to-br from-gray-300 to-gray-400 dark:from-gray-600 dark:to-gray-700";
  };

  return (
    <div className="p-4 bg-gradient-to-r from-teal-50/90 to-cyan-50/90 dark:from-teal-900/30 dark:to-cyan-900/30 rounded-2xl border border-teal-200/60 dark:border-teal-700/40 shadow-sm">
      <div className="flex items-center gap-3 mb-3">
        {/* Icon */}
        <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 shadow-lg ${getIconStyle()}`}>
          {allAnalyzed ? (
            <Check className="w-6 h-6 text-white" />
          ) : (
            <RefreshCw className={`w-6 h-6 text-white ${isAnalyzing ? 'animate-spin' : ''}`} />
          )}
        </div>
        
        {/* Content */}
        <div className="flex-1 min-w-0">
          {allAnalyzed ? (
            <>
              <p className="text-sm font-semibold text-green-700 dark:text-green-300 flex items-center gap-1">
                <Sparkles className="w-4 h-4" />
                全部已同步分析
              </p>
              <p className="text-xs text-green-600/80 dark:text-green-400/70 mt-0.5">
                {entryCount} 条感恩已完成分析，查看标签分布了解你的幸福来源
              </p>
            </>
          ) : hasUnanalyzed ? (
            <>
              <p className="text-sm font-semibold text-teal-800 dark:text-teal-200">
                📊 发现你的幸福密码
              </p>
              <p className="text-xs text-teal-600/80 dark:text-teal-400/70 mt-0.5">
                {unanalyzedCount} 条待分析，AI 将为你解读七维幸福分布
              </p>
            </>
          ) : (
            <>
              <p className="text-sm font-semibold text-teal-800 dark:text-teal-200">
                📊 写下感恩，发现幸福来源
              </p>
              <p className="text-xs text-teal-600/80 dark:text-teal-400/70 mt-0.5">
                {isLoggedIn ? "记录后 AI 将分析你的七维幸福分布" : "注册后解锁 AI 分析功能"}
              </p>
            </>
          )}
        </div>
      </div>

      {/* Analyze Button */}
      {!allAnalyzed && (
        <Button
          onClick={onAnalyze}
          disabled={isAnalyzing || !hasUnanalyzed || !isLoggedIn}
          className={`w-full mb-3 h-10 ${hasUnanalyzed && isLoggedIn
            ? 'bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 shadow-md' 
            : 'bg-gray-300 dark:bg-gray-600 cursor-not-allowed'}`}
        >
          {isAnalyzing ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
              分析中...
            </>
          ) : (
            <>
              <RefreshCw className="w-4 h-4 mr-2" />
              {hasUnanalyzed 
                ? `✨ 立即同步分析 (${unanalyzedCount}条)` 
                : '写下感恩后可同步分析'}
            </>
          )}
        </Button>
      )}

      {/* Seven Dimensions Preview */}
      <div className="flex flex-wrap gap-1.5 justify-center">
        {happinessDimensions.map((dim, index) => (
          <div
            key={index}
            className="flex items-center gap-0.5 text-xs text-muted-foreground bg-white/60 dark:bg-gray-800/40 px-1.5 py-0.5 rounded-full"
          >
            <dim.icon className={`w-3 h-3 ${dim.color}`} />
            <span>{dim.label}</span>
          </div>
        ))}
      </div>

      {/* Value Explanation Collapsible */}
      <Collapsible open={isValueOpen} onOpenChange={setIsValueOpen}>
        <CollapsibleTrigger className="w-full mt-3 pt-3 border-t border-teal-200/40 dark:border-teal-700/30 flex items-center justify-center gap-1 text-xs text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300 transition-colors">
          <span>💡 了解七维幸福分析</span>
          <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${isValueOpen ? 'rotate-180' : ''}`} />
        </CollapsibleTrigger>
        
        <CollapsibleContent>
          <div className="mt-3 p-3 bg-white/50 dark:bg-gray-800/30 rounded-xl text-xs space-y-2">
            <p className="text-teal-700 dark:text-teal-300">
              AI 会分析你的每条感恩，识别属于哪个幸福维度：
            </p>
            <ul className="space-y-1.5 text-teal-600/90 dark:text-teal-400/80">
              <li className="flex items-start gap-1.5">
                <span className="text-teal-500">✦</span>
                <span>发现你的幸福主要来自哪些维度</span>
              </li>
              <li className="flex items-start gap-1.5">
                <span className="text-teal-500">✦</span>
                <span>识别被忽略的维度（你的成长机会）</span>
              </li>
              <li className="flex items-start gap-1.5">
                <span className="text-teal-500">✦</span>
                <span>追踪幸福分布的变化趋势</span>
              </li>
            </ul>
            <p className="pt-2 text-teal-500/80 dark:text-teal-500/70 italic text-center">
              🌟 研究表明，幸福感来源越多元，心理韧性越强
            </p>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
};