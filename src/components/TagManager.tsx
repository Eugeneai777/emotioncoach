import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Plus, X, Tag, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import TagSentimentBadge from "./TagSentimentBadge";

interface TagType {
  id: string;
  name: string;
  color: string;
  sentiment?: 'positive' | 'negative' | 'neutral' | null;
}

interface TagManagerProps {
  onTagsChange?: () => void;
}

export const TagManager = ({ onTagsChange }: TagManagerProps) => {
  const [tags, setTags] = useState<TagType[]>([]);
  const [newTagName, setNewTagName] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadTags();
  }, []);

  const loadTags = async () => {
    const { data, error } = await supabase
      .from("tags")
      .select("*")
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error loading tags:", error);
      return;
    }

    setTags((data || []) as TagType[]);
  };

  const createTag = async () => {
    if (!newTagName.trim()) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: newTag, error } = await supabase
      .from("tags")
      .insert({
        name: newTagName.trim(),
        user_id: user.id,
      })
      .select()
      .single();

    if (error) {
      toast({
        title: "创建标签失败",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    // 自动分类新标签
    if (newTag) {
      supabase.functions.invoke('classify-tag-sentiment', {
        body: { tagIds: [newTag.id] }
      }).catch(console.error);
    }

    toast({
      title: "标签已创建",
      description: `标签"${newTagName}"已成功创建并自动分类 🏷️`,
    });

    setNewTagName("");
    await loadTags();
    onTagsChange?.();
  };

  const deleteTag = async (tagId: string) => {
    const { error } = await supabase
      .from("tags")
      .delete()
      .eq("id", tagId);

    if (error) {
      toast({
        title: "删除失败",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "标签已删除",
    });

    await loadTags();
    onTagsChange?.();
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Tag className="w-4 h-4" />
          管理标签
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>标签管理</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="新标签名称"
              value={newTagName}
              onChange={(e) => setNewTagName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  createTag();
                }
              }}
            />
            <Button onClick={createTag} size="icon">
              <Plus className="w-4 h-4" />
            </Button>
          </div>
          <div className="space-y-2">
            {tags.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                还没有标签，创建第一个吧 🏷️
              </p>
            ) : (
              tags.map((tag) => (
                <div
                  key={tag.id}
                  className="flex items-center justify-between p-2 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors"
                >
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <Badge
                      variant="secondary"
                      className="text-sm"
                      style={{
                        backgroundColor: `${tag.color}20`,
                        color: tag.color,
                        borderColor: tag.color,
                      }}
                    >
                      {tag.name}
                    </Badge>
                    <TagSentimentBadge sentiment={tag.sentiment || null} size="sm" />
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 flex-shrink-0"
                    onClick={() => deleteTag(tag.id)}
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              ))
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
