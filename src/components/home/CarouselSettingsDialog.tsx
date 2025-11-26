import { useState, useEffect } from "react";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { GripVertical, Plus, Trash2, Edit } from "lucide-react";
import { CarouselModule, CustomCard } from "@/types/carousel";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import CustomCardEditor from "./CustomCardEditor";

interface CarouselSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  modules: CarouselModule[];
  autoPlay: boolean;
  interval: number;
  onSave: (
    modules: CarouselModule[],
    autoPlay: boolean,
    interval: number
  ) => void;
  onRefreshCustomCards: () => void;
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
  onRefreshCustomCards,
}: CarouselSettingsDialogProps) {
  const [localModules, setLocalModules] = useState(modules);
  const [localAutoPlay, setLocalAutoPlay] = useState(autoPlay);
  const [localInterval, setLocalInterval] = useState(interval / 1000);
  const [customCards, setCustomCards] = useState<CustomCard[]>([]);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingCard, setEditingCard] = useState<CustomCard | undefined>();

  useEffect(() => {
    setLocalModules(modules);
    setLocalAutoPlay(autoPlay);
    setLocalInterval(interval / 1000);
  }, [modules, autoPlay, interval]);

  useEffect(() => {
    if (open) {
      loadCustomCards();
    }
  }, [open]);

  const loadCustomCards = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("custom_carousel_cards")
      .select("*")
      .eq("user_id", user.id)
      .order("display_order", { ascending: true });

    if (data) {
      setCustomCards(data as CustomCard[]);
    }
  };

  const handleDragEnd = (result: DropResult) => {
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
    onRefreshCustomCards();
    onOpenChange(false);
  };

  const handleDeleteCard = async (cardId: string) => {
    const { error } = await supabase
      .from("custom_carousel_cards")
      .delete()
      .eq("id", cardId);

    if (error) {
      toast.error("删除失败");
    } else {
      toast.success("卡片已删除");
      loadCustomCards();
      onRefreshCustomCards();
    }
  };

  const handleEditCard = (card: CustomCard) => {
    setEditingCard(card);
    setEditorOpen(true);
  };

  const handleCardSaved = () => {
    loadCustomCards();
    onRefreshCustomCards();
    setEditingCard(undefined);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span>⚙️</span>
            <span>轮播展示设置</span>
          </DialogTitle>
          <DialogDescription>
            自定义轮播卡片的显示顺序和内容
          </DialogDescription>
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
                              className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg border"
                            >
                              <div {...provided.dragHandleProps}>
                                <GripVertical className="h-5 w-5 text-muted-foreground" />
                              </div>
                              <span className="text-lg">{moduleInfo.emoji}</span>
                              <span className="flex-1 text-sm">
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
          <div className="bg-muted/50 p-3 rounded-lg space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-lg">✨</span>
              <span className="text-sm font-medium">智能排序</span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
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
            <Button onClick={handleSave} className="flex-1">
              保存设置
            </Button>
          </div>

          <Separator className="my-6" />

          {/* Custom Cards Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">自定义卡片</h3>
                <p className="text-sm text-muted-foreground">
                  创建个性化内容卡片
                </p>
              </div>
              <Button
                onClick={() => {
                  setEditingCard(undefined);
                  setEditorOpen(true);
                }}
                size="sm"
              >
                <Plus className="mr-2 h-4 w-4" />
                创建卡片
              </Button>
            </div>

            {customCards.length > 0 ? (
              <div className="space-y-2">
                {customCards.map((card) => (
                  <div
                    key={card.id}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{card.emoji}</span>
                      <div>
                        <p className="font-medium">{card.title}</p>
                        {card.subtitle && (
                          <p className="text-sm text-muted-foreground">
                            {card.subtitle}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditCard(card)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteCard(card.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 border border-dashed rounded-lg">
                <p className="text-sm text-muted-foreground">
                  还没有自定义卡片
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  点击"创建卡片"开始设计你的个性化内容
                </p>
              </div>
            )}
          </div>
        </div>
      </DialogContent>

      <CustomCardEditor
        open={editorOpen}
        onOpenChange={setEditorOpen}
        onSave={handleCardSaved}
        editingCard={editingCard}
      />
    </Dialog>
  );
}
