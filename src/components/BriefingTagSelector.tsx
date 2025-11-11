import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Plus, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface TagType {
  id: string;
  name: string;
  color: string;
}

interface BriefingTagSelectorProps {
  briefingId: string;
  selectedTags: TagType[];
  onTagsChange: () => void;
}

export const BriefingTagSelector = ({ briefingId, selectedTags, onTagsChange }: BriefingTagSelectorProps) => {
  const [availableTags, setAvailableTags] = useState<TagType[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadAvailableTags();
  }, []);

  const loadAvailableTags = async () => {
    const { data, error } = await supabase
      .from("tags")
      .select("*")
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error loading tags:", error);
      return;
    }

    setAvailableTags(data || []);
  };

  const isTagSelected = (tagId: string) => {
    return selectedTags.some((t) => t.id === tagId);
  };

  const toggleTag = async (tag: TagType) => {
    if (isTagSelected(tag.id)) {
      // Remove tag
      const { error } = await supabase
        .from("briefing_tags")
        .delete()
        .eq("briefing_id", briefingId)
        .eq("tag_id", tag.id);

      if (error) {
        toast({
          title: "移除标签失败",
          description: error.message,
          variant: "destructive",
        });
        return;
      }
    } else {
      // Add tag
      const { error } = await supabase
        .from("briefing_tags")
        .insert({
          briefing_id: briefingId,
          tag_id: tag.id,
        });

      if (error) {
        toast({
          title: "添加标签失败",
          description: error.message,
          variant: "destructive",
        });
        return;
      }
    }

    onTagsChange();
  };

  return (
    <div className="flex flex-wrap gap-2 items-center">
      {selectedTags.map((tag) => (
        <Badge
          key={tag.id}
          variant="secondary"
          className="text-xs"
          style={{
            backgroundColor: `${tag.color}20`,
            color: tag.color,
            borderColor: tag.color,
          }}
        >
          {tag.name}
        </Badge>
      ))}
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="h-6 gap-1 text-xs">
            <Plus className="w-3 h-3" />
            标签
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-56 p-2" align="start">
          {availableTags.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-2">
              请先创建标签 🏷️
            </p>
          ) : (
            <div className="space-y-1">
              {availableTags.map((tag) => (
                <Button
                  key={tag.id}
                  variant="ghost"
                  size="sm"
                  className="w-full justify-between"
                  onClick={() => toggleTag(tag)}
                >
                  <Badge
                    variant="secondary"
                    className="text-xs"
                    style={{
                      backgroundColor: `${tag.color}20`,
                      color: tag.color,
                      borderColor: tag.color,
                    }}
                  >
                    {tag.name}
                  </Badge>
                  {isTagSelected(tag.id) && <Check className="w-4 h-4" />}
                </Button>
              ))}
            </div>
          )}
        </PopoverContent>
      </Popover>
    </div>
  );
};
