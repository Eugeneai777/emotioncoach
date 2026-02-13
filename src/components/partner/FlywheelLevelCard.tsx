import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, Sparkles, Eye, Users, DollarSign } from "lucide-react";
import { cn } from "@/lib/utils";

export interface FlywheelLevel {
  level: string;
  name: string;
  icon: string;
  description: string;
  products: string[];
  priceRange: string;
  color: string;
}

interface FlywheelLevelCardProps {
  levelConfig: FlywheelLevel;
  stats: { reach: number; conversions: number; revenue: number; conversionRate: number };
  upgradeRate?: number | null;
  isLast: boolean;
  onOpenWizard: (level: string) => void;
}

const COLOR_MAP: Record<string, { border: string; bg: string; text: string; icon: string }> = {
  blue: { border: "border-l-blue-500", bg: "bg-blue-50", text: "text-blue-700", icon: "bg-blue-100 text-blue-600" },
  emerald: { border: "border-l-emerald-500", bg: "bg-emerald-50", text: "text-emerald-700", icon: "bg-emerald-100 text-emerald-600" },
  purple: { border: "border-l-purple-500", bg: "bg-purple-50", text: "text-purple-700", icon: "bg-purple-100 text-purple-600" },
  amber: { border: "border-l-amber-500", bg: "bg-amber-50", text: "text-amber-700", icon: "bg-amber-100 text-amber-600" },
};

export function FlywheelLevelCard({ levelConfig, stats, upgradeRate, isLast, onOpenWizard }: FlywheelLevelCardProps) {
  const [open, setOpen] = useState(false);
  const colors = COLOR_MAP[levelConfig.color] || COLOR_MAP.blue;

  return (
    <div className="space-y-0">
      <Collapsible open={open} onOpenChange={setOpen}>
        <CollapsibleTrigger asChild>
          <Card className={cn("border-l-4 cursor-pointer transition-all hover:shadow-md", colors.border, open && "shadow-md")}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center text-lg", colors.icon)}>
                    {levelConfig.icon}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className={cn("text-xs font-bold px-1.5 py-0.5 rounded", colors.bg, colors.text)}>
                        {levelConfig.level}
                      </span>
                      <h3 className="font-semibold text-sm">{levelConfig.name}</h3>
                      <span className="text-xs text-muted-foreground">{levelConfig.priceRange}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{levelConfig.description}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="hidden sm:flex items-center gap-4 text-xs">
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Eye className="w-3.5 h-3.5" />
                      <span>{stats.reach}</span>
                    </div>
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Users className="w-3.5 h-3.5" />
                      <span>{stats.conversionRate.toFixed(1)}%</span>
                    </div>
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <DollarSign className="w-3.5 h-3.5" />
                      <span>¥{stats.revenue.toLocaleString()}</span>
                    </div>
                  </div>
                  <ChevronDown className={cn("w-4 h-4 text-muted-foreground transition-transform", open && "rotate-180")} />
                </div>
              </div>
            </CardContent>
          </Card>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div className="ml-6 border-l-2 border-dashed border-muted pl-4 py-3 space-y-3">
            {/* Products */}
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1">关联产品</p>
              <div className="flex flex-wrap gap-1.5">
                {levelConfig.products.map((p) => (
                  <span key={p} className={cn("text-xs px-2 py-0.5 rounded-full", colors.bg, colors.text)}>
                    {p}
                  </span>
                ))}
              </div>
            </div>

            {/* Stats detail */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-muted/50 rounded-lg p-2.5 text-center">
                <p className="text-lg font-bold">{stats.reach}</p>
                <p className="text-xs text-muted-foreground">触达</p>
              </div>
              <div className="bg-muted/50 rounded-lg p-2.5 text-center">
                <p className="text-lg font-bold">{stats.conversions}</p>
                <p className="text-xs text-muted-foreground">转化</p>
              </div>
              <div className="bg-muted/50 rounded-lg p-2.5 text-center">
                <p className="text-lg font-bold">¥{stats.revenue.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">收入</p>
              </div>
            </div>

            {/* AI Landing Page Button */}
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={(e) => { e.stopPropagation(); onOpenWizard(levelConfig.level); }}
            >
              <Sparkles className="w-4 h-4 mr-1" />
              AI 定制落地页
            </Button>
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* Upgrade arrow between levels */}
      {!isLast && (
        <div className="flex items-center justify-center py-1">
          <div className="flex flex-col items-center text-muted-foreground">
            <div className="w-px h-3 bg-border" />
            <div className="text-xs font-medium px-2 py-0.5 rounded-full bg-muted">
              ↓ {upgradeRate !== null && upgradeRate !== undefined ? `${upgradeRate.toFixed(1)}%` : "—"}
            </div>
            <div className="w-px h-3 bg-border" />
          </div>
        </div>
      )}
    </div>
  );
}
