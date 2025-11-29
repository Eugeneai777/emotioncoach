import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X, Plus, Tag } from "lucide-react";
import { toast } from "sonner";

interface CommunicationTag {
  id: string;
  name: string;
  color: string;
}

interface Props {
  briefingId: string;
  selectedTags: CommunicationTag[];
  onTagsChange: (tags: CommunicationTag[]) => void;
}

export function CommunicationBriefingTagSelector({
  briefingId,
  selectedTags,
  onTagsChange,
}: Props) {
  const [allTags, setAllTags] = useState<CommunicationTag[]>([]);
  const [newTagName, setNewTagName] = useState("");
  const [isAddingTag, setIsAddingTag] = useState(false);

  useEffect(() => {
    loadTags();
  }, []);

  const loadTags = async () => {
    const { data, error } = await supabase
      .from("communication_tags")
      .select("*")
      .order("name");

    if (error) {
      console.error("Error loading tags:", error);
      return;
    }

    setAllTags(data || []);
  };

  const createTag = async () => {
    if (!newTagName.trim()) return;

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from("communication_tags")
      .insert([{ name: newTagName.trim(), user_id: user.id }])
      .select()
      .single();

    if (error) {
      toast.error("创建标签失败");
      console.error(error);
      return;
    }

    setAllTags([...allTags, data]);
    await addTagToBriefing(data);
    setNewTagName("");
    setIsAddingTag(false);
  };

  const addTagToBriefing = async (tag: CommunicationTag) => {
    const { error } = await supabase
      .from("communication_briefing_tags")
      .insert([{
        communication_briefing_id: briefingId,
        tag_id: tag.id,
      }]);

    if (error) {
      toast.error("添加标签失败");
      console.error(error);
      return;
    }

    onTagsChange([...selectedTags, tag]);
    toast.success("标签已添加");
  };

  const removeTagFromBriefing = async (tagId: string) => {
    const { error } = await supabase
      .from("communication_briefing_tags")
      .delete()
      .eq("communication_briefing_id", briefingId)
      .eq("tag_id", tagId);

    if (error) {
      toast.error("移除标签失败");
      console.error(error);
      return;
    }

    onTagsChange(selectedTags.filter((t) => t.id !== tagId));
    toast.success("标签已移除");
  };

  const availableTags = allTags.filter(
    (tag) => !selectedTags.some((st) => st.id === tag.id)
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {selectedTags.map((tag) => (
          <Badge
            key={tag.id}
            variant="secondary"
            className="pl-3 pr-1"
            style={{ backgroundColor: `${tag.color}20`, color: tag.color }}
          >
            {tag.name}
            <Button
              size="icon"
              variant="ghost"
              className="h-4 w-4 ml-1"
              onClick={() => removeTagFromBriefing(tag.id)}
            >
              <X className="h-3 w-3" />
            </Button>
          </Badge>
        ))}
      </div>

      {availableTags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {availableTags.map((tag) => (
            <Badge
              key={tag.id}
              variant="outline"
              className="cursor-pointer hover:bg-accent"
              onClick={() => addTagToBriefing(tag)}
              style={{ borderColor: tag.color, color: tag.color }}
            >
              <Plus className="h-3 w-3 mr-1" />
              {tag.name}
            </Badge>
          ))}
        </div>
      )}

      {isAddingTag ? (
        <div className="flex gap-2">
          <Input
            value={newTagName}
            onChange={(e) => setNewTagName(e.target.value)}
            placeholder="新标签名称"
            onKeyDown={(e) => e.key === "Enter" && createTag()}
            autoFocus
          />
          <Button onClick={createTag} size="sm">
            确定
          </Button>
          <Button
            onClick={() => {
              setIsAddingTag(false);
              setNewTagName("");
            }}
            variant="outline"
            size="sm"
          >
            取消
          </Button>
        </div>
      ) : (
        <Button
          onClick={() => setIsAddingTag(true)}
          variant="outline"
          size="sm"
          className="w-full"
        >
          <Tag className="h-4 w-4 mr-2" />
          创建新标签
        </Button>
      )}
    </div>
  );
}