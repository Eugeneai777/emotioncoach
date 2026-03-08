import { useNavigate } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import * as Icons from "lucide-react";
import { cn } from "@/lib/utils";

interface Tool {
  id: string;
  tool_id: string;
  title: string;
  description: string;
  icon_name: string;
  gradient: string;
  category: string;
}

// Quick relief tools (large cards)
const quickReliefIds = ["breathing", "alive-check", "declaration", "panic"];

interface ToolGridProps {
  tools: Tool[];
  onToolClick: (toolId: string) => void;
}

const getIcon = (iconName: string) => {
  const Icon = (Icons as any)[iconName] || Icons.Sparkles;
  return <Icon className="w-5 h-5" />;
};

const ToolGrid = ({ tools, onToolClick }: ToolGridProps) => {
  const quickRelief = tools.filter((t) => quickReliefIds.includes(t.tool_id));
  const deepExplore = tools.filter((t) => !quickReliefIds.includes(t.tool_id));

  return (
    <div className="space-y-4">
      {/* Quick Relief Section */}
      {quickRelief.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
            <span>⚡</span> 快速缓解
          </h3>
          <div className="grid grid-cols-2 gap-2">
            {quickRelief.map((tool) => (
              <button
                key={tool.id}
                onClick={() => onToolClick(tool.tool_id)}
                className={cn(
                  "flex flex-col items-start gap-2 p-3.5 rounded-xl border border-border/50",
                  "bg-card hover:border-primary/30 active:scale-[0.97] transition-all text-left"
                )}
              >
                <div className={`p-2 rounded-lg bg-gradient-to-br ${tool.gradient} text-white`}>
                  {getIcon(tool.icon_name)}
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">{tool.title}</p>
                  <p className="text-[11px] text-muted-foreground line-clamp-2 mt-0.5">
                    {tool.description}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Deep Explore Section */}
      {deepExplore.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
            <span>🔍</span> 深度探索
          </h3>
          <div className="space-y-1.5">
            {deepExplore.map((tool) => (
              <button
                key={tool.id}
                onClick={() => onToolClick(tool.tool_id)}
                className="w-full flex items-center gap-3 p-3 rounded-xl bg-card border border-border/50 hover:border-primary/30 active:scale-[0.98] transition-all text-left"
              >
                <div className={`p-2 rounded-lg bg-gradient-to-br ${tool.gradient} text-white shrink-0`}>
                  {getIcon(tool.icon_name)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">{tool.title}</p>
                  <p className="text-xs text-muted-foreground line-clamp-1">{tool.description}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ToolGrid;
