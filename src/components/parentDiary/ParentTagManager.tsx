import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tags, Plus, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface ParentTag {
  id: string;
  name: string;
  color: string;
}

interface ParentTagManagerProps {
  onTagsChange: () => void;
}

export const ParentTagManager = ({ onTagsChange }: ParentTagManagerProps) => {
  const [tags, setTags] = useState<ParentTag[]>([]);
  const [newTagName, setNewTagName] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
      loadTags();
    }
  }, [isOpen]);

  const loadTags = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("parent_tags")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: true });

    setTags(data || []);
  };

  const handleCreateTag = async () => {
    if (!newTagName.trim()) {
      toast({
        title: "请输入标签名称",
        variant: "destructive",
      });
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const colors = ["#8B5CF6", "#EC4899", "#3B82F6", "#10B981", "#F59E0B", "#F97316"];
      const randomColor = colors[Math.floor(Math.random() * colors.length)];

      const { error } = await supabase
        .from("parent_tags")
        .insert({
          user_id: user.id,
          name: newTagName.trim(),
          color: randomColor,
        });

      if (error) throw error;

      toast({
        title: "标签已创建",
        description: `成功创建标签 "${newTagName.trim()}"`,
      });

      setNewTagName("");
      loadTags();
      onTagsChange();
    } catch (error: any) {
      toast({
        title: "创建失败",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDeleteTag = async (tagId: string, tagName: string) => {
    if (!confirm(`确定要删除标签 "${tagName}" 吗？`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from("parent_tags")
        .delete()
        .eq("id", tagId);

      if (error) throw error;

      toast({
        title: "标签已删除",
        description: `成功删除标签 "${tagName}"`,
      });

      loadTags();
      onTagsChange();
    } catch (error: any) {
      toast({
        title: "删除失败",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2 px-2 md:px-3">
          <Tags className="w-4 h-4" />
          <span className="hidden sm:inline">标签管理</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>标签管理</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="输入新标签名称"
              value={newTagName}
              onChange={(e) => setNewTagName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleCreateTag();
                }
              }}
            />
            <Button onClick={handleCreateTag} size="sm">
              <Plus className="w-4 h-4" />
            </Button>
          </div>

          <div className="space-y-2 max-h-[300px] overflow-y-auto">
            {tags.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                还没有标签
              </p>
            ) : (
              tags.map((tag) => (
                <div
                  key={tag.id}
                  className="flex items-center justify-between p-2 rounded-lg border border-border hover:bg-muted/50"
                >
                  <Badge
                    variant="secondary"
                    style={{
                      backgroundColor: `${tag.color}20`,
                      color: tag.color,
                      borderColor: tag.color,
                    }}
                  >
                    {tag.name}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteTag(tag.id, tag.name)}
                    className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="w-4 h-4" />
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
