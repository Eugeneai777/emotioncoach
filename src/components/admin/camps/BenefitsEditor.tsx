import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, X, GripVertical } from "lucide-react";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";

interface BenefitsEditorProps {
  benefits: string[];
  onChange: (benefits: string[]) => void;
}

export function BenefitsEditor({ benefits, onChange }: BenefitsEditorProps) {
  const [newBenefit, setNewBenefit] = useState("");

  const handleAdd = () => {
    if (newBenefit.trim()) {
      onChange([...benefits, newBenefit.trim()]);
      setNewBenefit("");
    }
  };

  const handleRemove = (index: number) => {
    onChange(benefits.filter((_, i) => i !== index));
  };

  const handleUpdate = (index: number, value: string) => {
    const updated = [...benefits];
    updated[index] = value;
    onChange(updated);
  };

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const items = Array.from(benefits);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    onChange(items);
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Input
          value={newBenefit}
          onChange={(e) => setNewBenefit(e.target.value)}
          placeholder="输入权益名称..."
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleAdd();
            }
          }}
        />
        <Button onClick={handleAdd} variant="outline">
          <Plus className="h-4 w-4 mr-1" />
          添加
        </Button>
      </div>

      {benefits.length === 0 ? (
        <p className="text-center py-8 text-muted-foreground">
          暂无权益，请添加
        </p>
      ) : (
        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="benefits">
            {(provided) => (
              <div
                {...provided.droppableProps}
                ref={provided.innerRef}
                className="space-y-2"
              >
                {benefits.map((benefit, index) => (
                  <Draggable
                    key={`benefit-${index}`}
                    draggableId={`benefit-${index}`}
                    index={index}
                  >
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        className={`flex items-center gap-2 p-2 rounded-md border ${
                          snapshot.isDragging ? "bg-muted" : "bg-background"
                        }`}
                      >
                        <div
                          {...provided.dragHandleProps}
                          className="cursor-grab text-muted-foreground hover:text-foreground"
                        >
                          <GripVertical className="h-4 w-4" />
                        </div>
                        <span className="text-sm text-muted-foreground w-6">
                          {index + 1}.
                        </span>
                        <Input
                          value={benefit}
                          onChange={(e) => handleUpdate(index, e.target.value)}
                          className="flex-1"
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemove(index)}
                          className="text-destructive hover:text-destructive"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      )}

      <p className="text-xs text-muted-foreground">
        拖拽调整权益顺序，点击输入框直接编辑
      </p>
    </div>
  );
}
