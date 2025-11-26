import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import GradientPicker, { GRADIENT_PRESETS } from "./GradientPicker";
import CustomCarouselCard from "./CustomCarouselCard";

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
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>✨ {editingCard ? "编辑" : "创建"}自定义卡片</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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

        <div className="flex justify-end gap-2 pt-4 border-t">
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
