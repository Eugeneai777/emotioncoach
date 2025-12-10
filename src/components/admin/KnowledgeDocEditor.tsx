import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Trash2, Save, Eye, Sparkles, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface KnowledgeItem {
  id: string;
  title: string;
  content: string;
  doc_type: string;
  coach_key: string | null;
  camp_type: string | null;
  package_key: string | null;
  partner_level: string | null;
  keywords: string[];
  is_active: boolean;
  display_order?: number;
}

interface KnowledgeDocEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item?: KnowledgeItem;
  docType: string;
  docTypeLabel: string;
  coachKey: string | null;
  coachName: string;
  campType: string | null;
  packageKey?: string | null;
  partnerLevel?: string | null;
  onSaved: () => void;
}

const KnowledgeDocEditor = ({
  open,
  onOpenChange,
  item,
  docType,
  docTypeLabel,
  coachKey,
  coachName,
  campType,
  packageKey,
  partnerLevel,
  onSaved,
}: KnowledgeDocEditorProps) => {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [keywords, setKeywords] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [displayOrder, setDisplayOrder] = useState(0);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [generating, setGenerating] = useState(false);

  const isEditing = !!item;

  useEffect(() => {
    if (item) {
      setTitle(item.title);
      setContent(item.content);
      setKeywords(item.keywords?.join(", ") || "");
      setIsActive(item.is_active);
      setDisplayOrder(item.display_order || 0);
    } else {
      // Set default title based on doc type and coach
      setTitle(`${coachName} - ${docTypeLabel}`);
      setContent("");
      setKeywords("");
      setIsActive(true);
      setDisplayOrder(0);
    }
    setPreviewMode(false);
  }, [item, docType, docTypeLabel, coachKey, coachName, campType, open]);

  const handleAIGenerate = async () => {
    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-knowledge-content", {
        body: {
          docType,
          docTypeLabel,
          coachKey,
          coachName,
          campType,
          packageKey,
          partnerLevel,
        },
      });

      if (error) throw error;

      if (data.title) setTitle(data.title);
      if (data.keywords?.length) setKeywords(data.keywords.join(", "));
      if (data.content) setContent(data.content);

      toast.success("AI已生成内容，请检查并调整");
    } catch (error: any) {
      console.error("AI generate error:", error);
      toast.error(error.message || "AI生成失败");
    } finally {
      setGenerating(false);
    }
  };

  const handleSave = async () => {
    if (!title.trim() || !content.trim()) {
      toast.error("请填写标题和内容");
      return;
    }

    setSaving(true);
    try {
      const keywordsArray = keywords
        .split(",")
        .map((k) => k.trim())
        .filter(Boolean);

      const data = {
        title: title.trim(),
        content: content.trim(),
        keywords: keywordsArray,
        doc_type: docType,
        coach_key: coachKey,
        camp_type: campType,
        package_key: packageKey || null,
        partner_level: partnerLevel || null,
        is_active: isActive,
        display_order: displayOrder,
        category: packageKey ? "package" : partnerLevel ? "partner" : campType ? "camp" : coachKey ? "coach" : "general",
      };

      if (isEditing && item) {
        const { error } = await supabase
          .from("support_knowledge_base")
          .update(data)
          .eq("id", item.id);

        if (error) throw error;
        toast.success("文档已更新");
      } else {
        const { error } = await supabase
          .from("support_knowledge_base")
          .insert(data);

        if (error) throw error;
        toast.success("文档已创建");
      }

      onSaved();
      onOpenChange(false);
    } catch (error: any) {
      console.error("Save error:", error);
      toast.error(error.message || "保存失败");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!item) return;
    if (!confirm("确定要删除这个文档吗？")) return;

    setDeleting(true);
    try {
      const { error } = await supabase
        .from("support_knowledge_base")
        .delete()
        .eq("id", item.id);

      if (error) throw error;
      toast.success("文档已删除");
      onSaved();
      onOpenChange(false);
    } catch (error: any) {
      console.error("Delete error:", error);
      toast.error(error.message || "删除失败");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isEditing ? "编辑文档" : "添加文档"}
            <Badge variant="outline">{docTypeLabel}</Badge>
            <Badge variant="secondary">{coachName}</Badge>
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="flex-1 pr-4">
          <div className="space-y-4 py-4">
            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title">标题</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="文档标题"
              />
            </div>

            {/* Content */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="content">内容</Label>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleAIGenerate}
                    disabled={generating}
                    className="gap-1 text-primary"
                  >
                    {generating ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Sparkles className="w-4 h-4" />
                    )}
                    {generating ? "生成中..." : "AI智能填充"}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setPreviewMode(!previewMode)}
                    className="gap-1"
                  >
                    <Eye className="w-4 h-4" />
                    {previewMode ? "编辑" : "预览"}
                  </Button>
                </div>
              </div>
              {previewMode ? (
                <div className="min-h-[300px] p-4 bg-muted/50 rounded-md whitespace-pre-wrap text-sm">
                  {content}
                </div>
              ) : (
                <Textarea
                  id="content"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="文档内容（支持换行）"
                  className="min-h-[300px] font-mono text-sm"
                />
              )}
              <p className="text-xs text-muted-foreground">
                字数：{content.length}
              </p>
            </div>

            {/* Keywords */}
            <div className="space-y-2">
              <Label htmlFor="keywords">关键词（逗号分隔）</Label>
              <Input
                id="keywords"
                value={keywords}
                onChange={(e) => setKeywords(e.target.value)}
                placeholder="关键词1, 关键词2, 关键词3"
              />
              <p className="text-xs text-muted-foreground">
                用于AI客服搜索匹配
              </p>
            </div>

            {/* Display Order */}
            <div className="space-y-2">
              <Label htmlFor="displayOrder">显示顺序</Label>
              <Input
                id="displayOrder"
                type="number"
                value={displayOrder}
                onChange={(e) => setDisplayOrder(parseInt(e.target.value) || 0)}
              />
            </div>

            {/* Active Switch */}
            <div className="flex items-center justify-between">
              <div>
                <Label>启用状态</Label>
                <p className="text-xs text-muted-foreground">
                  停用后AI客服将不使用此文档
                </p>
              </div>
              <Switch checked={isActive} onCheckedChange={setIsActive} />
            </div>
          </div>
        </ScrollArea>

        <DialogFooter className="flex-shrink-0 gap-2">
          {isEditing && (
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleting}
              className="mr-auto"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              {deleting ? "删除中..." : "删除"}
            </Button>
          )}
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            <Save className="w-4 h-4 mr-2" />
            {saving ? "保存中..." : "保存"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default KnowledgeDocEditor;
