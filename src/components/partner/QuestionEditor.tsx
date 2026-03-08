import { useState, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash2, GripVertical, ChevronDown, ChevronRight, Plus, Upload } from "lucide-react";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface QuestionEditorProps {
  questions: any[];
  dimensions: any[];
  onChange: (questions: any[]) => void;
}

export function QuestionEditor({ questions, dimensions, onChange }: QuestionEditorProps) {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  const [bulkInput, setBulkInput] = useState("");
  const [showBulkAdd, setShowBulkAdd] = useState(false);

  const updateQuestion = (index: number, field: string, value: any) => {
    const updated = [...questions];
    updated[index] = { ...updated[index], [field]: value };
    onChange(updated);
  };

  const removeQuestion = (index: number) => {
    onChange(questions.filter((_, i) => i !== index));
    if (expandedIndex === index) setExpandedIndex(null);
  };

  const handleDragEnd = useCallback((result: DropResult) => {
    if (!result.destination) return;
    const items = Array.from(questions);
    const [moved] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, moved);
    onChange(items);
  }, [questions, onChange]);

  const addQuestion = () => {
    const defaultDim = dimensions[0]?.key || dimensions[0]?.label || "";
    const newQ = { text: "", dimension: defaultDim, positive: true };
    onChange([...questions, newQ]);
    setExpandedIndex(questions.length);
  };

  const handleBulkAdd = () => {
    const lines = bulkInput.trim().split("\n").filter(Boolean);
    if (lines.length === 0) return;
    const defaultDim = dimensions[0]?.key || dimensions[0]?.label || "";
    const newQuestions = lines.map((line) => ({
      text: line.replace(/^\d+[.、)\s]+/, "").trim(),
      dimension: defaultDim,
      positive: true,
    }));
    onChange([...questions, ...newQuestions]);
    setBulkInput("");
    setShowBulkAdd(false);
    toast.success(`已添加 ${newQuestions.length} 道题目`);
  };

  const dimOptions = dimensions.map((d: any) => d.key || d.label);

  return (
    <Card>
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="font-semibold text-sm text-muted-foreground">
            题目 ({questions.length})
          </h4>
          <div className="flex items-center gap-1.5">
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs gap-1"
              onClick={() => setShowBulkAdd(!showBulkAdd)}
            >
              <Upload className="w-3 h-3" />
              批量添加
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs gap-1"
              onClick={addQuestion}
            >
              <Plus className="w-3 h-3" />
              添加题目
            </Button>
          </div>
        </div>

        {/* Bulk add */}
        {showBulkAdd && (
          <div className="border rounded-lg p-3 bg-muted/30 space-y-2">
            <p className="text-xs text-muted-foreground">每行一题，自动去除序号前缀</p>
            <Textarea
              value={bulkInput}
              onChange={(e) => setBulkInput(e.target.value)}
              rows={5}
              placeholder={"1. 我能快速识别自己的情绪\n2. 我善于倾听他人的感受\n3. 面对冲突时我能冷静应对"}
              className="text-sm"
            />
            <div className="flex gap-2">
              <Button size="sm" className="h-7 text-xs" onClick={handleBulkAdd} disabled={!bulkInput.trim()}>
                确认添加
              </Button>
              <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setShowBulkAdd(false)}>
                取消
              </Button>
            </div>
          </div>
        )}

        {/* Draggable questions */}
        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="questions">
            {(provided) => (
              <div ref={provided.innerRef} {...provided.droppableProps} className="space-y-2">
                {questions.map((q: any, i: number) => {
                  const isExpanded = expandedIndex === i;
                  return (
                    <Draggable key={`q-${i}`} draggableId={`q-${i}`} index={i}>
                      {(dragProvided, snapshot) => (
                        <div
                          ref={dragProvided.innerRef}
                          {...dragProvided.draggableProps}
                          className={cn(
                            "border rounded-lg transition-shadow",
                            snapshot.isDragging && "shadow-lg ring-2 ring-primary/20"
                          )}
                        >
                          {/* Collapsed header */}
                          <div
                            className="flex items-center gap-2 p-2.5 cursor-pointer hover:bg-muted/30 transition-colors rounded-lg"
                            onClick={() => setExpandedIndex(isExpanded ? null : i)}
                          >
                            <div {...dragProvided.dragHandleProps} className="cursor-grab active:cursor-grabbing p-0.5">
                              <GripVertical className="w-4 h-4 text-muted-foreground/50" />
                            </div>
                            <span className="text-xs text-muted-foreground shrink-0 w-7">Q{i + 1}</span>
                            {isExpanded ? (
                              <ChevronDown className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                            ) : (
                              <ChevronRight className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                            )}
                            <span className="text-sm truncate flex-1">{q.text || "（空题）"}</span>
                            <Badge variant="outline" className="text-[10px] shrink-0">{q.dimension}</Badge>
                            {!q.positive && <Badge variant="secondary" className="text-[10px] shrink-0">反向</Badge>}
                          </div>

                          {/* Expanded editor */}
                          {isExpanded && (
                            <div className="px-3 pb-3 space-y-2 border-t pt-2">
                              <Textarea
                                value={q.text || ""}
                                onChange={(e) => updateQuestion(i, "text", e.target.value)}
                                rows={2}
                                className="text-sm"
                                placeholder="题目内容"
                              />
                              <div className="flex items-center gap-2 flex-wrap">
                                <Select
                                  value={q.dimension || ""}
                                  onValueChange={(v) => updateQuestion(i, "dimension", v)}
                                >
                                  <SelectTrigger className="text-xs h-7 w-auto min-w-[100px]">
                                    <SelectValue placeholder="维度" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {dimOptions.map((d: string) => (
                                      <SelectItem key={d} value={d}>{d}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <Button
                                  variant={q.positive ? "outline" : "secondary"}
                                  size="sm"
                                  className="h-7 text-xs"
                                  onClick={() => updateQuestion(i, "positive", !q.positive)}
                                >
                                  {q.positive ? "正向计分" : "反向计分"}
                                </Button>
                                <div className="flex-1" />
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 text-xs text-destructive hover:text-destructive"
                                  onClick={() => removeQuestion(i)}
                                >
                                  <Trash2 className="w-3 h-3 mr-1" />
                                  删除
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </Draggable>
                  );
                })}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>

        {questions.length === 0 && (
          <p className="text-xs text-muted-foreground text-center py-4">暂无题目，点击上方按钮添加</p>
        )}
      </CardContent>
    </Card>
  );
}
