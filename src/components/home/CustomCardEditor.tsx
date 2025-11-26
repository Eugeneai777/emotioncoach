import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import GradientPicker, { GRADIENT_PRESETS } from "./GradientPicker";
import CustomCarouselCard from "./CustomCarouselCard";
import { CARD_TEMPLATES, TEMPLATE_CATEGORIES, CardTemplate } from "./cardTemplates";
import { Sparkles } from "lucide-react";

interface CustomCardEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: () => void;
  editingCard?: any;
}

const EMOJI_PRESETS = ["😊", "🎯", "💪", "🌟", "✨", "🔥", "🌸", "🌿", "🎨", "📚", "💡", "🎵"];

export default function CustomCardEditor({
  open,
  onOpenChange,
  onSave,
  editingCard,
}: CustomCardEditorProps) {
  const [emoji, setEmoji] = useState(editingCard?.emoji || "✨");
  const [title, setTitle] = useState(editingCard?.title || "");
  const [subtitle, setSubtitle] = useState(editingCard?.subtitle || "");
  const [description, setDescription] = useState(editingCard?.description || "");
  const [backgroundValue, setBackgroundValue] = useState(
    editingCard?.background_value || GRADIENT_PRESETS[0].value
  );
  const [textColor, setTextColor] = useState<"dark" | "light">(
    editingCard?.text_color || "dark"
  );
  const [imageUrl, setImageUrl] = useState(editingCard?.image_url || "");
  const [imagePosition, setImagePosition] = useState(
    editingCard?.image_position || "right"
  );
  const [hasReminder, setHasReminder] = useState(editingCard?.has_reminder || false);
  const [reminderTime, setReminderTime] = useState(editingCard?.reminder_time || "20:00");
  const [reminderMessage, setReminderMessage] = useState(
    editingCard?.reminder_message || ""
  );
  const [actionText, setActionText] = useState(editingCard?.action_text || "");
  const [actionType, setActionType] = useState(editingCard?.action_type || "chat");
  const [saving, setSaving] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("all");

  const handleTemplateSelect = (template: CardTemplate) => {
    setEmoji(template.emoji);
    setTitle(template.title);
    setSubtitle(template.subtitle);
    setDescription(template.description);
    setBackgroundValue(template.backgroundValue);
    setTextColor(template.textColor);
    setImagePosition(template.imagePosition);
    setHasReminder(template.hasReminder);
    setReminderTime(template.reminderTime);
    setReminderMessage(template.reminderMessage);
    setActionText(template.actionText);
    setActionType(template.actionType);
    toast.success(`已应用"${template.name}"模板`);
  };

  const filteredTemplates =
    selectedCategory === "all"
      ? CARD_TEMPLATES
      : CARD_TEMPLATES.filter((t) => t.category === selectedCategory);

  const handleSave = async () => {
    if (!title.trim()) {
      toast.error("请输入卡片标题");
      return;
    }

    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("未登录");

      const cardData = {
        user_id: user.id,
        title,
        subtitle: subtitle || null,
        description: description || null,
        emoji,
        background_type: "gradient",
        background_value: backgroundValue,
        text_color: textColor,
        image_url: imageUrl || null,
        image_position: imagePosition,
        has_reminder: hasReminder,
        reminder_time: hasReminder ? reminderTime : null,
        reminder_message: hasReminder ? reminderMessage : null,
        action_text: actionText || null,
        action_type: actionType || null,
        is_active: true,
      };

      if (editingCard?.id) {
        const { error } = await supabase
          .from("custom_carousel_cards")
          .update(cardData)
          .eq("id", editingCard.id);
        if (error) throw error;
        toast.success("卡片更新成功！");
      } else {
        const { error } = await supabase
          .from("custom_carousel_cards")
          .insert([cardData]);
        if (error) throw error;
        toast.success("卡片创建成功！");
      }

      onSave();
      onOpenChange(false);
    } catch (error) {
      console.error("保存卡片失败:", error);
      toast.error("保存失败，请重试");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            {editingCard ? "编辑" : "创建"}自定义卡片
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="custom" className="flex-1 flex flex-col min-h-0">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="templates">📚 模板库</TabsTrigger>
            <TabsTrigger value="custom">🎨 自定义</TabsTrigger>
          </TabsList>

          {/* Templates Tab */}
          <TabsContent value="templates" className="flex-1 min-h-0 mt-4">
            <div className="flex flex-col h-full">
              {/* Category Filter */}
              <ScrollArea className="w-full pb-4">
                <div className="flex gap-2">
                  {TEMPLATE_CATEGORIES.map((cat) => (
                    <Button
                      key={cat.id}
                      variant={selectedCategory === cat.id ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedCategory(cat.id)}
                      className="whitespace-nowrap"
                    >
                      {cat.icon} {cat.name}
                    </Button>
                  ))}
                </div>
              </ScrollArea>

              {/* Template Grid */}
              <ScrollArea className="flex-1">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pr-4">
                  {filteredTemplates.map((template) => (
                    <div
                      key={template.id}
                      className="group relative border rounded-xl p-4 hover:shadow-lg transition-all cursor-pointer bg-card"
                      onClick={() => handleTemplateSelect(template)}
                    >
                      <div className="flex items-start gap-3 mb-2">
                        <span className="text-2xl">{template.emoji}</span>
                        <div className="flex-1">
                          <h4 className="font-semibold text-sm mb-1">{template.name}</h4>
                          <p className="text-xs text-muted-foreground line-clamp-2">
                            {template.subtitle}
                          </p>
                        </div>
                      </div>
                      <div className="text-xs text-muted-foreground flex items-center gap-2">
                        <span className="px-2 py-0.5 bg-primary/10 text-primary rounded-full">
                          {template.category}
                        </span>
                      </div>
                      <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 rounded-xl transition-opacity" />
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          </TabsContent>

          {/* Custom Tab */}
          <TabsContent value="custom" className="flex-1 min-h-0 mt-4">
            <ScrollArea className="h-full">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pr-4">
          {/* Left: Form */}
          <div className="space-y-4">
            {/* Emoji Selector */}
            <div className="space-y-2">
              <Label>选择表情</Label>
              <div className="flex flex-wrap gap-2">
                {EMOJI_PRESETS.map((e) => (
                  <button
                    key={e}
                    type="button"
                    onClick={() => setEmoji(e)}
                    className={`text-2xl p-2 rounded-lg transition-all ${
                      emoji === e
                        ? "bg-primary text-primary-foreground scale-110"
                        : "bg-muted hover:bg-muted/80"
                    }`}
                  >
                    {e}
                  </button>
                ))}
              </div>
            </div>

            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title">标题 *</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="为你的卡片起个标题"
              />
            </div>

            {/* Subtitle */}
            <div className="space-y-2">
              <Label htmlFor="subtitle">副标题</Label>
              <Input
                id="subtitle"
                value={subtitle}
                onChange={(e) => setSubtitle(e.target.value)}
                placeholder="添加副标题（可选）"
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">描述</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="添加详细描述..."
                rows={3}
              />
            </div>

            {/* Gradient Picker */}
            <GradientPicker
              selected={backgroundValue}
              onSelect={(gradient, color) => {
                setBackgroundValue(gradient);
                setTextColor(color);
              }}
            />

            {/* Image */}
            <div className="space-y-2">
              <Label htmlFor="imageUrl">图片链接（可选）</Label>
              <Input
                id="imageUrl"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://..."
              />
            </div>

            {imageUrl && (
              <div className="space-y-2">
                <Label>图片位置</Label>
                <RadioGroup value={imagePosition} onValueChange={setImagePosition}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="right" id="right" />
                    <Label htmlFor="right">右侧</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="top" id="top" />
                    <Label htmlFor="top">顶部</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="background" id="background" />
                    <Label htmlFor="background">背景</Label>
                  </div>
                </RadioGroup>
              </div>
            )}

            {/* Reminder */}
            <div className="space-y-3 p-4 border rounded-lg">
              <div className="flex items-center justify-between">
                <Label htmlFor="reminder">启用每日提醒</Label>
                <Switch
                  id="reminder"
                  checked={hasReminder}
                  onCheckedChange={setHasReminder}
                />
              </div>
              {hasReminder && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="reminderTime">提醒时间</Label>
                    <Input
                      id="reminderTime"
                      type="time"
                      value={reminderTime}
                      onChange={(e) => setReminderTime(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="reminderMessage">提醒消息</Label>
                    <Input
                      id="reminderMessage"
                      value={reminderMessage}
                      onChange={(e) => setReminderMessage(e.target.value)}
                      placeholder="该做些什么了..."
                    />
                  </div>
                </>
              )}
            </div>

            {/* Action Button */}
            <div className="space-y-2">
              <Label htmlFor="actionText">按钮文字（可选）</Label>
              <Input
                id="actionText"
                value={actionText}
                onChange={(e) => setActionText(e.target.value)}
                placeholder="开始行动"
              />
            </div>
          </div>

                {/* Right: Preview */}
                <div className="space-y-2">
                  <Label>实时预览</Label>
                  <div className="sticky top-4">
                    <CustomCarouselCard
                      emoji={emoji}
                      title={title || "卡片标题"}
                      subtitle={subtitle}
                      description={description}
                      backgroundType="gradient"
                      backgroundValue={backgroundValue}
                      textColor={textColor}
                      imageUrl={imageUrl}
                      imagePosition={imagePosition}
                      actionText={actionText}
                    />
                  </div>
                </div>
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-2 pt-4 border-t mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "保存中..." : editingCard ? "更新卡片" : "保存卡片"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
