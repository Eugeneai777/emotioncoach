import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Clock, Target, CheckCircle, History } from "lucide-react";

interface DynamicAssessmentIntroProps {
  template: {
    emoji: string;
    title: string;
    subtitle: string | null;
    description: string | null;
    gradient: string;
    dimensions: any[];
    question_count: number;
  };
  onStart: () => void;
  onShowHistory?: () => void;
  hasHistory?: boolean;
}

export function DynamicAssessmentIntro({ template, onStart, onShowHistory, hasHistory }: DynamicAssessmentIntroProps) {
  const dimensions = template.dimensions || [];

  return (
    <div className="min-h-screen bg-background">
      {/* Header gradient */}
      <div className={`bg-gradient-to-br ${template.gradient} p-8 pb-10 text-white text-center`}>
        <div className="text-5xl mb-4">{template.emoji}</div>
        <h1 className="text-2xl font-bold mb-2">{template.title}</h1>
        {template.subtitle && (
          <p className="text-white/80">{template.subtitle}</p>
        )}
      </div>

      <div className="max-w-lg mx-auto px-4 -mt-4 space-y-4 pb-8">
        {/* Description */}
        {template.description && (
          <Card className="border-border/50 bg-card/90 backdrop-blur">
            <CardContent className="p-5">
              <p className="text-muted-foreground text-sm leading-relaxed">{template.description}</p>
            </CardContent>
          </Card>
        )}

        {/* Dimensions */}
        {dimensions.length > 0 && (
          <Card className="border-border/50 bg-card/90 backdrop-blur">
            <CardContent className="p-5">
              <h2 className="font-semibold text-foreground mb-3">测评维度</h2>
              <div className="grid grid-cols-2 gap-2">
                {dimensions.map((d: any) => (
                  <div key={d.key} className="flex items-center gap-2 p-2.5 bg-muted/50 rounded-lg">
                    <span className="text-lg">{d.emoji}</span>
                    <div>
                      <p className="text-sm font-medium">{d.label}</p>
                      {d.description && (
                        <p className="text-xs text-muted-foreground line-clamp-1">{d.description}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Benefits */}
        <Card className="border-border/50 bg-card/90 backdrop-blur">
          <CardContent className="p-5">
            <h2 className="font-semibold text-foreground mb-3">你将获得</h2>
            <div className="space-y-2.5">
              {["专业维度分析报告", "AI 个性化解读", "改善建议与行动方案"].map((item) => (
                <div key={item} className="flex items-center gap-2.5">
                  <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />
                  <span className="text-sm text-muted-foreground">{item}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Info */}
        <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Clock className="w-4 h-4" />
            <span>约 {Math.ceil(template.question_count / 5)} 分钟</span>
          </div>
          <div className="w-px h-4 bg-border" />
          <div className="flex items-center gap-1">
            <Target className="w-4 h-4" />
            <span>{template.question_count} 题</span>
          </div>
        </div>

        {/* Buttons */}
        <Button onClick={onStart} className="w-full h-12 text-base gap-2" size="lg">
          开始测评 <ArrowRight className="w-5 h-5" />
        </Button>

        {hasHistory && onShowHistory && (
          <Button variant="outline" onClick={onShowHistory} className="w-full gap-2">
            <History className="w-4 h-4" /> 查看历史记录
          </Button>
        )}
      </div>
    </div>
  );
}
