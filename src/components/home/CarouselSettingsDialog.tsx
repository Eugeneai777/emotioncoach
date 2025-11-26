import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { GripVertical } from "lucide-react";
import { CarouselModule } from "@/types/carousel";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";

interface CarouselSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  modules: CarouselModule[];
  autoPlay: boolean;
  interval: number;
  onSave: (modules: CarouselModule[], autoPlay: boolean, interval: number) => void;
}

const MODULE_LABELS: Record<string, { label: string; emoji: string }> = {
  emotion_steps: { label: "情绪四部曲", emoji: "🌱" },
  daily_reminder: { label: "温柔提醒", emoji: "💭" },
  training_camp: { label: "训练营进度", emoji: "🏕️" },
  today_progress: { label: "今日情绪进度", emoji: "📊" },
  goal_progress: { label: "目标进度", emoji: "🎯" },
};

export default function CarouselSettingsDialog({
  open,
  onOpenChange,
  modules,
  autoPlay,
  interval,
  onSave,
}: CarouselSettingsDialogProps) {
  const [localModules, setLocalModules] = useState(modules);
  const [localAutoPlay, setLocalAutoPlay] = useState(autoPlay);
  const [localInterval, setLocalInterval] = useState(interval / 1000);

  const handleDragEnd = (result: any) => {
    if (!result.destination) return;

    const items = Array.from(localModules);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    const updatedModules = items.map((item, index) => ({
      ...item,
      order: index + 1,
    }));

    setLocalModules(updatedModules);
  };

  const toggleModule = (id: string) => {
    setLocalModules(
      localModules.map((m) =>
        m.id === id ? { ...m, enabled: !m.enabled } : m
      )
    );
  };

  const handleSave = () => {
    onSave(localModules, localAutoPlay, localInterval * 1000);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span>⚙️</span>
            <span>轮播展示设置</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Module list with drag and drop */}
          <div className="space-y-2">
            <Label>显示模块（拖拽排序）</Label>
            <DragDropContext onDragEnd={handleDragEnd}>
              <Droppable droppableId="modules">
                {(provided) => (
                  <div
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                    className="space-y-2"
                  >
                    {localModules.map((module, index) => {
                      const moduleInfo = MODULE_LABELS[module.id];
                      return (
                        <Draggable
                          key={module.id}
                          draggableId={module.id}
                          index={index}
                        >
                          {(provided) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              className="flex items-center gap-3 p-3 bg-healing-warmWhite rounded-lg border border-healing-sage/20"
                            >
                              <div {...provided.dragHandleProps}>
                                <GripVertical className="h-5 w-5 text-healing-forestGreen/40" />
                              </div>
                              <span className="text-lg">{moduleInfo.emoji}</span>
                              <span className="flex-1 text-sm text-healing-forestGreen">
                                {moduleInfo.label}
                              </span>
                              <Switch
                                checked={module.enabled}
                                onCheckedChange={() => toggleModule(module.id)}
                              />
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
          </div>

          {/* Auto-play settings */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="auto-play">自动轮播</Label>
              <Switch
                id="auto-play"
                checked={localAutoPlay}
                onCheckedChange={setLocalAutoPlay}
              />
            </div>

            {localAutoPlay && (
              <div className="space-y-2">
                <Label htmlFor="interval">切换间隔（秒）</Label>
                <Input
                  id="interval"
                  type="number"
                  min="3"
                  max="30"
                  value={localInterval}
                  onChange={(e) => setLocalInterval(Number(e.target.value))}
                  className="w-full"
                />
              </div>
            )}
          </div>

          {/* Smart sorting info */}
          <div className="bg-healing-cream p-3 rounded-lg space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-lg">✨</span>
              <span className="text-sm font-medium text-healing-forestGreen">
                智能排序
              </span>
            </div>
            <p className="text-xs text-healing-forestGreen/60 leading-relaxed">
              有更新的内容会自动优先显示，无需手动调整
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              取消
            </Button>
            <Button
              onClick={handleSave}
              className="flex-1 bg-healing-lightGreen hover:bg-healing-sage text-white"
            >
              保存设置
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
