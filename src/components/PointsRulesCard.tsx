import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { MessageSquare, Image, Mic, Tent, ChevronDown, Zap } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface PointsRulesCardProps {
  mode?: 'compact' | 'detailed';
  showBalance?: boolean;
  balance?: number;
  className?: string;
}

const pointTiers = [
  {
    points: 1,
    label: "1点",
    color: "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800",
    icon: MessageSquare,
    features: ["AI对话", "语音识别", "情绪分析", "视频推荐", "工具使用"]
  },
  {
    points: 2,
    label: "2点",
    color: "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800",
    icon: Mic,
    features: ["语音合成"]
  },
  {
    points: 5,
    label: "5点",
    color: "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 border-purple-200 dark:border-purple-800",
    icon: Image,
    features: ["AI生成图片"]
  },
  {
    points: 5,
    label: "5点/个",
    color: "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800",
    icon: Tent,
    features: ["训练营参加"],
    note: "一次性扣除"
  }
];

const detailedRules = [
  { category: "对话类", items: [
    { name: "AI对话", cost: 1 },
    { name: "情绪教练对话", cost: 1 },
    { name: "沟通教练对话", cost: 1 },
    { name: "亲子教练对话", cost: 1 },
    { name: "生活教练对话", cost: 1 },
  ]},
  { category: "语音类", items: [
    { name: "语音识别", cost: 1 },
    { name: "语音合成", cost: 2 },
  ]},
  { category: "分析类", items: [
    { name: "情绪分析", cost: 1 },
    { name: "智能推荐", cost: 1 },
    { name: "简报生成", cost: 1 },
  ]},
  { category: "生成类", items: [
    { name: "AI生成图片", cost: 5 },
  ]},
  { category: "训练营", items: [
    { name: "21天情绪日记训练营", cost: 5, note: "一次性" },
    { name: "21天青少年困境突破营", cost: 5, note: "一次性" },
  ]},
];

export function PointsRulesCard({ mode = 'compact', showBalance = false, balance, className }: PointsRulesCardProps) {
  const [isOpen, setIsOpen] = useState(false);

  if (mode === 'compact') {
    return (
      <div className={cn("space-y-3", className)}>
        {showBalance && balance !== undefined && (
          <div className="flex items-center justify-between bg-primary/10 rounded-lg p-3">
            <span className="text-sm font-medium">当前余额</span>
            <span className="text-lg font-bold text-primary">{balance} 点</span>
          </div>
        )}
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {pointTiers.map((tier, idx) => (
            <div 
              key={idx}
              className={cn(
                "rounded-lg border p-3 text-center space-y-1",
                tier.color
              )}
            >
              <tier.icon className="w-5 h-5 mx-auto" />
              <div className="font-bold text-sm">{tier.label}</div>
              <div className="text-xs opacity-80">
                {tier.features[0]}
                {tier.features.length > 1 && ` 等${tier.features.length}项`}
              </div>
              {tier.note && (
                <div className="text-xs opacity-60">{tier.note}</div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Detailed mode
  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Zap className="w-4 h-4 text-primary" />
          点数使用规则
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {showBalance && balance !== undefined && (
          <div className="flex items-center justify-between bg-primary/10 rounded-lg p-3">
            <span className="text-sm font-medium">当前余额</span>
            <span className="text-lg font-bold text-primary">{balance} 点</span>
          </div>
        )}

        {/* 四档概览 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {pointTiers.map((tier, idx) => (
            <div 
              key={idx}
              className={cn(
                "rounded-lg border p-3 text-center space-y-1",
                tier.color
              )}
            >
              <tier.icon className="w-5 h-5 mx-auto" />
              <div className="font-bold text-sm">{tier.label}</div>
              <div className="text-xs opacity-80">
                {tier.features.join("、")}
              </div>
              {tier.note && (
                <div className="text-xs opacity-60">{tier.note}</div>
              )}
            </div>
          ))}
        </div>

        {/* 详细规则折叠 */}
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm" className="w-full justify-between text-muted-foreground">
              查看详细规则
              <ChevronDown className={cn("w-4 h-4 transition-transform", isOpen && "rotate-180")} />
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-3 pt-3">
            {detailedRules.map((category) => (
              <div key={category.category} className="space-y-1">
                <div className="text-xs font-medium text-muted-foreground">{category.category}</div>
                <div className="space-y-1">
                  {category.items.map((item) => (
                    <div key={item.name} className="flex items-center justify-between text-sm py-1 px-2 rounded hover:bg-muted/50">
                      <span>{item.name}</span>
                      <span className="font-medium text-primary">
                        {item.cost}点{item.note ? ` (${item.note})` : '/次'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </CollapsibleContent>
        </Collapsible>
      </CardContent>
    </Card>
  );
}
