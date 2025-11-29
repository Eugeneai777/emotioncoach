import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

interface CoachStep {
  step: number;
  title: string;
  icon: string;
  description: string;
  questions: string[];
}

interface CoachPreview {
  coach_key: string;
  emoji: string;
  title: string;
  subtitle?: string;
  description?: string;
  primary_color?: string;
  gradient?: string;
  placeholder?: string;
  history_label?: string;
  steps?: CoachStep[];
  system_prompt?: string;
  briefing_tool_config?: any;
}

interface CoachPreviewCardProps {
  template: CoachPreview;
}

export function CoachPreviewCard({ template }: CoachPreviewCardProps) {
  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="text-4xl">{template.emoji}</div>
          <div className="flex-1">
            <CardTitle>{template.title}</CardTitle>
            {template.subtitle && (
              <CardDescription>{template.subtitle}</CardDescription>
            )}
          </div>
          <Badge variant="outline">{template.coach_key}</Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* 基础信息 */}
        <div>
          <h4 className="font-semibold mb-2">基础信息</h4>
          <div className="space-y-2 text-sm">
            {template.description && (
              <p className="text-muted-foreground">{template.description}</p>
            )}
            <div className="flex gap-2">
              {template.primary_color && (
                <Badge variant="secondary">主题色: {template.primary_color}</Badge>
              )}
              {template.gradient && (
                <Badge variant="secondary" className={`bg-gradient-to-r ${template.gradient} text-white`}>
                  渐变预览
                </Badge>
              )}
            </div>
          </div>
        </div>

        <Separator />

        {/* 四部曲步骤 */}
        {template.steps && template.steps.length > 0 && (
          <div>
            <h4 className="font-semibold mb-3">四部曲步骤</h4>
            <div className="space-y-3">
              {template.steps.map((step) => (
                <div key={step.step} className="border rounded-lg p-3">
                  <div className="flex items-start gap-2">
                    <span className="text-2xl">{step.icon}</span>
                    <div className="flex-1">
                      <div className="font-medium">
                        步骤 {step.step}: {step.title}
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {step.description}
                      </p>
                      {step.questions && step.questions.length > 0 && (
                        <div className="mt-2 space-y-1">
                          <div className="text-xs font-medium text-muted-foreground">引导问题：</div>
                          {step.questions.map((q, idx) => (
                            <div key={idx} className="text-xs text-muted-foreground">
                              • {q}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <Separator />

        {/* System Prompt预览 */}
        {template.system_prompt && (
          <div>
            <h4 className="font-semibold mb-2">System Prompt</h4>
            <div className="bg-muted rounded-lg p-3 max-h-48 overflow-y-auto">
              <pre className="text-xs whitespace-pre-wrap font-mono">
                {template.system_prompt}
              </pre>
            </div>
          </div>
        )}

        {/* 交互配置 */}
        <div>
          <h4 className="font-semibold mb-2">交互配置</h4>
          <div className="space-y-2 text-sm">
            {template.placeholder && (
              <div>
                <span className="text-muted-foreground">输入框占位：</span>
                <span className="ml-2">{template.placeholder}</span>
              </div>
            )}
            {template.history_label && (
              <div>
                <span className="text-muted-foreground">历史标签：</span>
                <span className="ml-2">{template.history_label}</span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}