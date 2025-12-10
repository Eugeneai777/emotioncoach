import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2, GripVertical } from "lucide-react";
import { CoachStep } from "@/hooks/useCoachTemplates";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";

interface CoachStepsEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  steps: CoachStep[];
  onSave: (steps: CoachStep[]) => void;
}

export function CoachStepsEditor({ open, onOpenChange, steps: initialSteps, onSave }: CoachStepsEditorProps) {
  // 标准化输入步骤格式
  const normalizeSteps = (rawSteps: any[]): CoachStep[] => {
    return rawSteps.map((step, index) => ({
      id: step.id ?? step.step ?? (index + 1),
      emoji: step.emoji ?? step.icon ?? "➡️",
      name: step.name ?? step.title ?? "新步骤",
      description: step.description ?? ""
    }));
  };

  const [steps, setSteps] = useState<CoachStep[]>(normalizeSteps(initialSteps));

  const handleAddStep = () => {
    const newId = Math.max(...steps.map(s => s.id), 0) + 1;
    setSteps([...steps, {
      id: newId,
      emoji: "➡️",
      name: "新步骤",
      description: "步骤描述"
    }]);
  };

  const handleDeleteStep = (id: number) => {
    setSteps(steps.filter(s => s.id !== id));
  };

  const handleUpdateStep = (id: number, field: keyof CoachStep, value: string) => {
    setSteps(steps.map(s => s.id === id ? { ...s, [field]: value } : s));
  };

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const items = Array.from(steps);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    // 重新分配ID以保持顺序
    const reordered = items.map((item, index) => ({ ...item, id: index + 1 }));
    setSteps(reordered);
  };

  const handleSave = () => {
    // 保存时只保留标准字段 (id, emoji, name, description)
    const standardizedSteps = steps.map(step => ({
      id: step.id,
      emoji: step.emoji,
      name: step.name,
      description: step.description
    }));
    onSave(standardizedSteps);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>编辑四部曲步骤</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="steps">
              {(provided) => (
                <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-4">
                  {steps.map((step, index) => (
                    <Draggable key={step.id} draggableId={step.id.toString()} index={index}>
                      {(provided) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          className="border rounded-lg p-4 space-y-3 bg-card"
                        >
                          <div className="flex items-center gap-2">
                            <div {...provided.dragHandleProps}>
                              <GripVertical className="h-5 w-5 text-muted-foreground cursor-grab" />
                            </div>
                            <span className="font-semibold text-sm">步骤 {step.id}</span>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteStep(step.id)}
                              className="ml-auto"
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <Label>Emoji</Label>
                              <Input
                                value={step.emoji}
                                onChange={(e) => handleUpdateStep(step.id, 'emoji', e.target.value)}
                                placeholder="1️⃣"
                              />
                            </div>
                            <div>
                              <Label>名称</Label>
                              <Input
                                value={step.name}
                                onChange={(e) => handleUpdateStep(step.id, 'name', e.target.value)}
                                placeholder="觉察"
                              />
                            </div>
                          </div>

                          <div>
                            <Label>描述（一句话说明）</Label>
                            <Textarea
                              value={step.description}
                              onChange={(e) => handleUpdateStep(step.id, 'description', e.target.value)}
                              placeholder="简洁的一句话描述，10-20字"
                              rows={2}
                            />
                          </div>
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>

          <Button onClick={handleAddStep} variant="outline" className="w-full">
            <Plus className="h-4 w-4 mr-2" />
            添加步骤
          </Button>
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button onClick={handleSave}>
            保存
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}