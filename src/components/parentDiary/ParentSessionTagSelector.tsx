import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

interface ParentTag {
  id: string;
  name: string;
  color: string;
}

interface ParentSessionTagSelectorProps {
  sessionId: string;
  selectedTags: ParentTag[];
  onTagsChange: () => void;
}

export const ParentSessionTagSelector = ({
  sessionId,
  selectedTags,
  onTagsChange,
}: ParentSessionTagSelectorProps) => {
  const [availableTags, setAvailableTags] = useState<ParentTag[]>([]);
  const [newTagName, setNewTagName] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadTags();
  }, []);

  const loadTags = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("parent_tags")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: true });

    setAvailableTags(data || []);
  };

  const handleAddTag = async (tagId: string) => {
    try {
      const { error } = await supabase
        .from("parent_session_tags")
        .insert({ session_id: sessionId, tag_id: tagId });

      if (error) throw error;

      toast({
        title: "标签已添加",
        description: "成功添加标签到对话",
      });
      onTagsChange();
    } catch (error: any) {
      toast({
        title: "添加失败",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleRemoveTag = async (tagId: string) => {
    try {
      const { error } = await supabase
        .from("parent_session_tags")
        .delete()
        .eq("session_id", sessionId)
        .eq("tag_id", tagId);

      if (error) throw error;

      toast({
        title: "标签已移除",
        description: "成功移除标签",
      });
      onTagsChange();
    } catch (error: any) {
      toast({
        title: "移除失败",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleCreateTag = async () => {
    if (!newTagName.trim()) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const colors = ["#8B5CF6", "#EC4899", "#3B82F6", "#10B981", "#F59E0B"];
      const randomColor = colors[Math.floor(Math.random() * colors.length)];

      const { data, error } = await supabase
        .from("parent_tags")
        .insert({
          user_id: user.id,
          name: newTagName.trim(),
          color: randomColor,
        })
        .select()
        .single();

      if (error) throw error;

      if (data) {
        await handleAddTag(data.id);
        setNewTagName("");
        setIsDialogOpen(false);
        loadTags();
      }
    } catch (error: any) {
      toast({
        title: "创建失败",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const unselectedTags = availableTags.filter(
    (tag) => !selectedTags.some((st) => st.id === tag.id)
  );

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {selectedTags.map((tag) => (
          <Badge
            key={tag.id}
            variant="secondary"
            className="gap-1 pr-1"
            style={{
              backgroundColor: `${tag.color}20`,
              color: tag.color,
              borderColor: tag.color,
            }}
          >
            {tag.name}
            <Button
              variant="ghost"
              size="sm"
              className="h-4 w-4 p-0 hover:bg-transparent"
              onClick={() => handleRemoveTag(tag.id)}
            >
              <X className="h-3 w-3" />
            </Button>
          </Badge>
        ))}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2">
            <Plus className="w-4 h-4" />
            添加标签
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>选择或创建标签</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {unselectedTags.length > 0 && (
              <div>
                <p className="text-sm font-medium text-foreground mb-2">
                  现有标签
                </p>
                <div className="flex flex-wrap gap-2">
                  {unselectedTags.map((tag) => (
                    <Badge
                      key={tag.id}
                      variant="outline"
                      className="cursor-pointer hover:opacity-80"
                      style={{
                        borderColor: tag.color,
                        color: tag.color,
                      }}
                      onClick={() => {
                        handleAddTag(tag.id);
                        setIsDialogOpen(false);
                      }}
                    >
                      {tag.name}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            <div>
              <p className="text-sm font-medium text-foreground mb-2">
                创建新标签
              </p>
              <div className="flex gap-2">
                <Input
                  placeholder="输入标签名称"
                  value={newTagName}
                  onChange={(e) => setNewTagName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleCreateTag();
                    }
                  }}
                />
                <Button onClick={handleCreateTag}>创建</Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
