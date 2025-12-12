import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Save, RotateCcw, Info } from "lucide-react";
import { StagePrompts } from "@/hooks/useCoachTemplates";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface StagePromptsEditorProps {
  stagePrompts: StagePrompts | null | undefined;
  onChange: (stagePrompts: StagePrompts) => void;
  onSave: () => void;
  isSaving?: boolean;
}

const STAGE_LABELS: Record<string, { title: string; emoji: string; description: string }> = {
  "0": { title: "开场", emoji: "👋", description: "用户进入时的欢迎和开放式邀请" },
  "1": { title: "觉察", emoji: "👁️", description: "帮用户从说事情转变为说感受" },
  "2": { title: "理解", emoji: "💭", description: "帮用户看见情绪背后的需求" },
  "3": { title: "反应", emoji: "🔄", description: "帮用户觉察习惯性反应模式" },
  "4": { title: "转化", emoji: "🌱", description: "帮用户确定具体可执行的小行动" },
  "5": { title: "简报", emoji: "📋", description: "生成情绪简报的指令" },
};

export function StagePromptsEditor({ stagePrompts, onChange, onSave, isSaving }: StagePromptsEditorProps) {
  const [activeTab, setActiveTab] = useState("stages");
  const [activeStage, setActiveStage] = useState("0");

  // 初始化默认值
  const currentPrompts: StagePrompts = stagePrompts || {
    coaching_techniques: "",
    question_templates: {},
    stages: {}
  };

  const handleCoachingTechniquesChange = (value: string) => {
    onChange({
      ...currentPrompts,
      coaching_techniques: value
    });
  };

  const handleStageChange = (stageKey: string, value: string) => {
    onChange({
      ...currentPrompts,
      stages: {
        ...currentPrompts.stages,
        [stageKey]: value
      }
    });
  };

  const handleQuestionTemplateChange = (
    stage: string,
    field: string,
    value: string | string[]
  ) => {
    const templates = currentPrompts.question_templates || {};
    const stageKey = stage as keyof typeof templates;
    
    onChange({
      ...currentPrompts,
      question_templates: {
        ...templates,
        [stageKey]: {
          ...(templates[stageKey] as any || {}),
          [field]: value
        }
      }
    });
  };

  const getStageContent = (stageKey: string) => {
    return currentPrompts.stages?.[stageKey] || "";
  };

  return (
    <div className="space-y-4">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="stages">阶段提示词</TabsTrigger>
          <TabsTrigger value="techniques">教练技术</TabsTrigger>
          <TabsTrigger value="templates">问法模板</TabsTrigger>
        </TabsList>

        <TabsContent value="stages" className="space-y-4 mt-4">
          <div className="flex gap-2 flex-wrap">
            {Object.entries(STAGE_LABELS).map(([key, { title, emoji }]) => (
              <Button
                key={key}
                variant={activeStage === key ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveStage(key)}
                className="gap-1"
              >
                <span>{emoji}</span>
                <span>阶段{key}</span>
                <span className="text-xs opacity-70">({title})</span>
              </Button>
            ))}
          </div>

          <Card>
            <CardHeader className="py-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base flex items-center gap-2">
                    {STAGE_LABELS[activeStage]?.emoji} 阶段{activeStage}: {STAGE_LABELS[activeStage]?.title}
                  </CardTitle>
                  <CardDescription className="text-xs mt-1">
                    {STAGE_LABELS[activeStage]?.description}
                  </CardDescription>
                </div>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Info className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <p>支持的动态变量：</p>
                      <ul className="text-xs mt-1 space-y-1">
                        <li>• 轮数信息会自动添加</li>
                        <li>• 用户偏好会自动添加</li>
                        <li>• 教练技术会自动添加</li>
                      </ul>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </CardHeader>
            <CardContent>
              <Textarea
                value={getStageContent(activeStage)}
                onChange={(e) => handleStageChange(activeStage, e.target.value)}
                className="min-h-[300px] font-mono text-sm"
                placeholder={`输入阶段${activeStage}的提示词...`}
              />
              <div className="flex justify-between items-center mt-2">
                <span className="text-xs text-muted-foreground">
                  字符数: {getStageContent(activeStage).length}
                </span>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="techniques" className="space-y-4 mt-4">
          <Card>
            <CardHeader className="py-3">
              <CardTitle className="text-base">教练式提问技术</CardTitle>
              <CardDescription className="text-xs">
                所有阶段共享的核心教练技术（镜像、留白、假设、下沉、洞察确认等）
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                value={currentPrompts.coaching_techniques || ""}
                onChange={(e) => handleCoachingTechniquesChange(e.target.value)}
                className="min-h-[350px] font-mono text-sm"
                placeholder="输入教练式提问技术说明..."
              />
              <div className="flex justify-between items-center mt-2">
                <span className="text-xs text-muted-foreground">
                  字符数: {(currentPrompts.coaching_techniques || "").length}
                </span>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="templates" className="space-y-4 mt-4">
          <ScrollArea className="h-[400px]">
            <div className="space-y-4 pr-4">
              {[1, 2, 3, 4].map((stageNum) => {
                const stageKey = `stage${stageNum}` as keyof typeof currentPrompts.question_templates;
                const templates = (currentPrompts.question_templates?.[stageKey] as any) || {};
                
                return (
                  <Card key={stageNum}>
                    <CardHeader className="py-3">
                      <CardTitle className="text-sm">
                        {STAGE_LABELS[String(stageNum)]?.emoji} 阶段{stageNum}: {STAGE_LABELS[String(stageNum)]?.title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div>
                        <Label className="text-xs">第一轮问法 (用逗号分隔多个选项)</Label>
                        <Input
                          value={(templates.round1 || []).join(", ")}
                          onChange={(e) => handleQuestionTemplateChange(
                            stageKey, 
                            "round1", 
                            e.target.value.split(", ").filter(Boolean)
                          )}
                          placeholder="问法1, 问法2, 问法3"
                          className="text-sm mt-1"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">第二轮问法 (用逗号分隔多个选项)</Label>
                        <Input
                          value={(templates.round2 || []).join(", ")}
                          onChange={(e) => handleQuestionTemplateChange(
                            stageKey, 
                            "round2", 
                            e.target.value.split(", ").filter(Boolean)
                          )}
                          placeholder="问法1, 问法2, 问法3"
                          className="text-sm mt-1"
                        />
                      </div>
                      {stageNum === 1 && (
                        <div>
                          <Label className="text-xs">深入问法 (用户未说情绪时)</Label>
                          <Input
                            value={(templates.deepenNoEmotion || []).join(", ")}
                            onChange={(e) => handleQuestionTemplateChange(
                              stageKey, 
                              "deepenNoEmotion", 
                              e.target.value.split(", ").filter(Boolean)
                            )}
                            placeholder="问法1, 问法2, 问法3"
                            className="text-sm mt-1"
                          />
                        </div>
                      )}
                      {stageNum === 3 && (
                        <>
                          <div>
                            <Label className="text-xs">承认模板</Label>
                            <Input
                              value={templates.acknowledge || ""}
                              onChange={(e) => handleQuestionTemplateChange(stageKey, "acknowledge", e.target.value)}
                              placeholder="输入承认模板..."
                              className="text-sm mt-1"
                            />
                          </div>
                          <div>
                            <Label className="text-xs">新可能问法 (用逗号分隔)</Label>
                            <Input
                              value={(templates.newPossibility || []).join(", ")}
                              onChange={(e) => handleQuestionTemplateChange(
                                stageKey, 
                                "newPossibility", 
                                e.target.value.split(", ").filter(Boolean)
                              )}
                              placeholder="问法1, 问法2, 问法3"
                              className="text-sm mt-1"
                            />
                          </div>
                        </>
                      )}
                      {(stageNum === 2 || stageNum === 3) && (
                        <div>
                          <Label className="text-xs">帮助选项</Label>
                          <Textarea
                            value={templates.helpOptions || ""}
                            onChange={(e) => handleQuestionTemplateChange(stageKey, "helpOptions", e.target.value)}
                            placeholder="输入帮助选项..."
                            className="text-sm mt-1 min-h-[60px]"
                          />
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end pt-2 border-t">
        <Button onClick={onSave} disabled={isSaving}>
          {isSaving ? (
            <span className="flex items-center gap-2">
              <span className="animate-spin">⏳</span>
              保存中...
            </span>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              保存阶段提示词
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
