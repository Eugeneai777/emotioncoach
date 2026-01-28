import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Plus, X, ChevronDown, ChevronUp } from "lucide-react";
import { CampStageData } from "./CampEditDialog";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

interface StagesEditorProps {
  stages: CampStageData[];
  onChange: (stages: CampStageData[]) => void;
}

export function StagesEditor({ stages, onChange }: StagesEditorProps) {
  const [openStages, setOpenStages] = useState<Record<number, boolean>>({});

  const handleAddStage = () => {
    const newStage: CampStageData = {
      stage: stages.length + 1,
      title: `阶段 ${stages.length + 1}`,
      lessons: [],
    };
    onChange([...stages, newStage]);
    setOpenStages((prev) => ({ ...prev, [stages.length]: true }));
  };

  const handleRemoveStage = (index: number) => {
    const updated = stages.filter((_, i) => i !== index).map((s, i) => ({
      ...s,
      stage: i + 1,
    }));
    onChange(updated);
  };

  const handleUpdateStage = (index: number, updates: Partial<CampStageData>) => {
    const updated = [...stages];
    updated[index] = { ...updated[index], ...updates };
    onChange(updated);
  };

  const handleAddLesson = (stageIndex: number) => {
    const updated = [...stages];
    updated[stageIndex].lessons.push("新课程");
    onChange(updated);
  };

  const handleUpdateLesson = (
    stageIndex: number,
    lessonIndex: number,
    value: string
  ) => {
    const updated = [...stages];
    updated[stageIndex].lessons[lessonIndex] = value;
    onChange(updated);
  };

  const handleRemoveLesson = (stageIndex: number, lessonIndex: number) => {
    const updated = [...stages];
    updated[stageIndex].lessons = updated[stageIndex].lessons.filter(
      (_, i) => i !== lessonIndex
    );
    onChange(updated);
  };

  const toggleStage = (index: number) => {
    setOpenStages((prev) => ({ ...prev, [index]: !prev[index] }));
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <Label>阶段课程配置</Label>
        <Button onClick={handleAddStage} variant="outline" size="sm">
          <Plus className="h-4 w-4 mr-1" />
          添加阶段
        </Button>
      </div>

      {stages.length === 0 ? (
        <p className="text-center py-8 text-muted-foreground">
          暂无阶段，请添加
        </p>
      ) : (
        <div className="space-y-3">
          {stages.map((stage, stageIndex) => (
            <Collapsible
              key={stageIndex}
              open={openStages[stageIndex]}
              onOpenChange={() => toggleStage(stageIndex)}
            >
              <div className="border rounded-lg overflow-hidden">
                <CollapsibleTrigger asChild>
                  <div className="flex items-center justify-between p-3 bg-muted/50 cursor-pointer hover:bg-muted">
                    <div className="flex items-center gap-3">
                      {openStages[stageIndex] ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                      <span className="font-medium">
                        阶段 {stage.stage}: {stage.title}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        ({stage.lessons.length} 节课)
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveStage(stageIndex);
                      }}
                      className="text-destructive hover:text-destructive"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </CollapsibleTrigger>

                <CollapsibleContent>
                  <div className="p-3 space-y-3 border-t">
                    <div className="space-y-2">
                      <Label>阶段标题</Label>
                      <Input
                        value={stage.title}
                        onChange={(e) =>
                          handleUpdateStage(stageIndex, { title: e.target.value })
                        }
                        placeholder="觉察期"
                      />
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <Label>课程列表</Label>
                        <Button
                          onClick={() => handleAddLesson(stageIndex)}
                          variant="ghost"
                          size="sm"
                        >
                          <Plus className="h-3 w-3 mr-1" />
                          添加课程
                        </Button>
                      </div>

                      {stage.lessons.length === 0 ? (
                        <p className="text-sm text-muted-foreground py-2">
                          暂无课程
                        </p>
                      ) : (
                        <div className="space-y-2">
                          {stage.lessons.map((lesson, lessonIndex) => (
                            <div
                              key={lessonIndex}
                              className="flex items-center gap-2"
                            >
                              <span className="text-xs text-muted-foreground w-6">
                                {lessonIndex + 1}.
                              </span>
                              <Input
                                value={lesson}
                                onChange={(e) =>
                                  handleUpdateLesson(
                                    stageIndex,
                                    lessonIndex,
                                    e.target.value
                                  )
                                }
                                className="flex-1"
                              />
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() =>
                                  handleRemoveLesson(stageIndex, lessonIndex)
                                }
                                className="text-destructive hover:text-destructive"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </CollapsibleContent>
              </div>
            </Collapsible>
          ))}
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        每个阶段可包含多节课程，点击阶段卡片展开编辑
      </p>
    </div>
  );
}
