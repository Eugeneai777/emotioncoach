import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Settings, Plus, Trash2, GripVertical, Save } from "lucide-react";
import { toast } from "sonner";

export interface ProductLineCategory {
  id: string;
  label: string;
  keywords: string; // comma separated keywords
  emoji: string;
}

const DEFAULT_CATEGORIES: ProductLineCategory[] = [
  { id: "wealth", label: "财富教练", keywords: "wealth", emoji: "💰" },
  { id: "emotion", label: "情绪教练", keywords: "emotion", emoji: "💜" },
  { id: "gratitude", label: "感恩教练", keywords: "gratitude", emoji: "🙏" },
  { id: "story", label: "故事教练", keywords: "story,awakening", emoji: "📖" },
  { id: "parent", label: "亲子教练", keywords: "parent,teen", emoji: "👨‍👩‍👧" },
  { id: "communication", label: "沟通教练", keywords: "communication,vibrant", emoji: "💬" },
  { id: "camp", label: "训练营", keywords: "camp,training", emoji: "🏕️" },
  { id: "partner", label: "合伙人", keywords: "partner,promo,referral", emoji: "🤝" },
];

const STORAGE_KEY = "og_preview_categories";

export function loadCategories(): ProductLineCategory[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.error("Failed to load categories:", e);
  }
  return DEFAULT_CATEGORIES;
}

export function saveCategories(categories: ProductLineCategory[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(categories));
  } catch (e) {
    console.error("Failed to save categories:", e);
  }
}

export function buildProductLines(categories: ProductLineCategory[]) {
  const lines: Record<string, { label: string; filter: (key: string) => boolean }> = {
    all: { label: "全部", filter: () => true },
  };

  // Build category filters
  const allKeywords: string[] = [];
  categories.forEach((cat) => {
    const keywords = cat.keywords.split(",").map((k) => k.trim().toLowerCase()).filter(Boolean);
    allKeywords.push(...keywords);
    
    lines[cat.id] = {
      label: `${cat.emoji} ${cat.label}`,
      filter: (key: string) => {
        const k = key.toLowerCase();
        return keywords.some((kw) => k.includes(kw));
      },
    };
  });

  // Add "other" category
  lines.other = {
    label: "📄 其他",
    filter: (key: string) => {
      const k = key.toLowerCase();
      return !allKeywords.some((kw) => k.includes(kw));
    },
  };

  return lines;
}

interface OGCategoryManagerProps {
  onCategoriesChange: (categories: ProductLineCategory[]) => void;
}

export function OGCategoryManager({ onCategoriesChange }: OGCategoryManagerProps) {
  const [open, setOpen] = useState(false);
  const [categories, setCategories] = useState<ProductLineCategory[]>(() => loadCategories());
  const [editingCategories, setEditingCategories] = useState<ProductLineCategory[]>([]);

  useEffect(() => {
    if (open) {
      setEditingCategories([...categories]);
    }
  }, [open, categories]);

  const handleAddCategory = () => {
    const newId = `cat_${Date.now()}`;
    setEditingCategories([
      ...editingCategories,
      { id: newId, label: "新分类", keywords: "", emoji: "📁" },
    ]);
  };

  const handleRemoveCategory = (id: string) => {
    setEditingCategories(editingCategories.filter((c) => c.id !== id));
  };

  const handleUpdateCategory = (id: string, field: keyof ProductLineCategory, value: string) => {
    setEditingCategories(
      editingCategories.map((c) => (c.id === id ? { ...c, [field]: value } : c))
    );
  };

  const handleSave = () => {
    // Validate
    const hasEmpty = editingCategories.some((c) => !c.label.trim());
    if (hasEmpty) {
      toast.error("分类名称不能为空");
      return;
    }

    saveCategories(editingCategories);
    setCategories(editingCategories);
    onCategoriesChange(editingCategories);
    setOpen(false);
    toast.success("分类配置已保存");
  };

  const handleReset = () => {
    setEditingCategories([...DEFAULT_CATEGORIES]);
  };

  const moveCategory = (index: number, direction: "up" | "down") => {
    const newCategories = [...editingCategories];
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newCategories.length) return;
    [newCategories[index], newCategories[targetIndex]] = [newCategories[targetIndex], newCategories[index]];
    setEditingCategories(newCategories);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Settings className="h-4 w-4" />
          编辑分类
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>编辑 OG 分类</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          <p className="text-sm text-muted-foreground">
            自定义分类名称、图标和匹配关键词（多个关键词用逗号分隔）
          </p>

          <div className="space-y-3">
            {editingCategories.map((cat, index) => (
              <div
                key={cat.id}
                className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg"
              >
                <div className="flex flex-col gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-5 w-5"
                    onClick={() => moveCategory(index, "up")}
                    disabled={index === 0}
                  >
                    <GripVertical className="h-3 w-3 rotate-90" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-5 w-5"
                    onClick={() => moveCategory(index, "down")}
                    disabled={index === editingCategories.length - 1}
                  >
                    <GripVertical className="h-3 w-3 rotate-90" />
                  </Button>
                </div>

                <div className="flex-1 grid grid-cols-[60px_1fr_2fr] gap-2">
                  <div>
                    <Label className="text-xs text-muted-foreground">图标</Label>
                    <Input
                      value={cat.emoji}
                      onChange={(e) => handleUpdateCategory(cat.id, "emoji", e.target.value)}
                      className="h-8 text-center"
                      maxLength={4}
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">名称</Label>
                    <Input
                      value={cat.label}
                      onChange={(e) => handleUpdateCategory(cat.id, "label", e.target.value)}
                      className="h-8"
                      placeholder="分类名称"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">关键词</Label>
                    <Input
                      value={cat.keywords}
                      onChange={(e) => handleUpdateCategory(cat.id, "keywords", e.target.value)}
                      className="h-8"
                      placeholder="keyword1,keyword2"
                    />
                  </div>
                </div>

                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-destructive hover:text-destructive"
                  onClick={() => handleRemoveCategory(cat.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>

          <Button variant="outline" onClick={handleAddCategory} className="w-full gap-2">
            <Plus className="h-4 w-4" />
            添加分类
          </Button>

          <div className="flex justify-between pt-4 border-t">
            <Button variant="ghost" onClick={handleReset}>
              恢复默认
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setOpen(false)}>
                取消
              </Button>
              <Button onClick={handleSave} className="gap-2">
                <Save className="h-4 w-4" />
                保存
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
