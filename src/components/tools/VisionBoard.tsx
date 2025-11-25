import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Trash2, Edit2, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";

interface VisionItem {
  id: string;
  category: string;
  title: string;
  description: string;
  image_url?: string;
}

const categories = [
  { id: "career", name: "事业", color: "hsl(210, 75%, 55%)", icon: "💼" },
  { id: "relationships", name: "关系", color: "hsl(340, 75%, 55%)", icon: "❤️" },
  { id: "health", name: "健康", color: "hsl(120, 60%, 50%)", icon: "💪" },
  { id: "wealth", name: "财富", color: "hsl(45, 90%, 55%)", icon: "💰" },
  { id: "growth", name: "成长", color: "hsl(280, 65%, 60%)", icon: "🌱" }
];

export const VisionBoard = () => {
  const { user } = useAuth();
  const [items, setItems] = useState<VisionItem[]>([]);
  const [activeCategory, setActiveCategory] = useState("career");
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingItem, setEditingItem] = useState<VisionItem | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    image_url: ""
  });

  useEffect(() => {
    loadVisionItems();
  }, [user]);

  const loadVisionItems = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("vision_items")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setItems(data || []);
    } catch (error) {
      console.error("Error loading vision items:", error);
    }
  };

  const handleSave = async () => {
    if (!user || !formData.title) {
      toast({
        title: "请填写标题",
        variant: "destructive"
      });
      return;
    }

    try {
      if (editingItem) {
        const { error } = await supabase
          .from("vision_items")
          .update({
            title: formData.title,
            description: formData.description,
            image_url: formData.image_url || null
          })
          .eq("id", editingItem.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("vision_items")
          .insert({
            user_id: user.id,
            category: activeCategory,
            title: formData.title,
            description: formData.description,
            image_url: formData.image_url || null
          });

        if (error) throw error;
      }

      toast({
        title: editingItem ? "更新成功" : "添加成功"
      });

      setFormData({ title: "", description: "", image_url: "" });
      setShowAddForm(false);
      setEditingItem(null);
      loadVisionItems();
    } catch (error) {
      console.error("Error saving vision item:", error);
      toast({
        title: "保存失败",
        variant: "destructive"
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("确定要删除这个愿景吗？")) return;

    try {
      const { error } = await supabase
        .from("vision_items")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "删除成功"
      });
      loadVisionItems();
    } catch (error) {
      console.error("Error deleting vision item:", error);
      toast({
        title: "删除失败",
        variant: "destructive"
      });
    }
  };

  const handleEdit = (item: VisionItem) => {
    setEditingItem(item);
    setFormData({
      title: item.title,
      description: item.description,
      image_url: item.image_url || ""
    });
    setShowAddForm(true);
  };

  const categoryItems = items.filter(item => item.category === activeCategory);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>我的人生愿景画布</CardTitle>
          <CardDescription>在不同的生活领域，绘制你的理想蓝图</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeCategory} onValueChange={setActiveCategory}>
            <TabsList className="grid grid-cols-5 w-full">
              {categories.map((cat) => (
                <TabsTrigger key={cat.id} value={cat.id} className="gap-2">
                  <span>{cat.icon}</span>
                  <span className="hidden sm:inline">{cat.name}</span>
                </TabsTrigger>
              ))}
            </TabsList>

            {categories.map((category) => (
              <TabsContent key={category.id} value={category.id} className="mt-6">
                <div className="space-y-4">
                  {!showAddForm && (
                    <Button
                      onClick={() => {
                        setShowAddForm(true);
                        setEditingItem(null);
                        setFormData({ title: "", description: "", image_url: "" });
                      }}
                      className="w-full"
                      style={{ backgroundColor: category.color }}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      添加{category.name}愿景
                    </Button>
                  )}

                  {showAddForm && (
                    <Card style={{ borderColor: `${category.color}40` }}>
                      <CardHeader>
                        <CardTitle className="text-lg">
                          {editingItem ? "编辑" : "添加"}{category.name}愿景
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div>
                          <label className="text-sm font-medium mb-2 block">标题</label>
                          <Input
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            placeholder="例如：成为行业专家"
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium mb-2 block">描述</label>
                          <Textarea
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            placeholder="详细描述你的愿景..."
                            rows={4}
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium mb-2 block">图片链接（可选）</label>
                          <Input
                            value={formData.image_url}
                            onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                            placeholder="https://..."
                          />
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            className="flex-1"
                            onClick={() => {
                              setShowAddForm(false);
                              setEditingItem(null);
                              setFormData({ title: "", description: "", image_url: "" });
                            }}
                          >
                            取消
                          </Button>
                          <Button
                            className="flex-1"
                            onClick={handleSave}
                            style={{ backgroundColor: category.color }}
                          >
                            保存
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {categoryItems.length === 0 && !showAddForm && (
                    <div className="text-center py-12 text-muted-foreground">
                      <span className="text-4xl mb-4 block">{category.icon}</span>
                      <p>还没有{category.name}愿景</p>
                      <p className="text-sm">点击上面的按钮添加你的第一个愿景</p>
                    </div>
                  )}

                  <div className="grid gap-4 md:grid-cols-2">
                    {categoryItems.map((item) => (
                      <Card key={item.id} className="overflow-hidden">
                        {item.image_url && (
                          <div className="aspect-video relative bg-muted">
                            <img
                              src={item.image_url}
                              alt={item.title}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}
                        <CardContent className="pt-4">
                          <h3 className="font-semibold text-lg mb-2">{item.title}</h3>
                          <p className="text-sm text-muted-foreground mb-4">{item.description}</p>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEdit(item)}
                            >
                              <Edit2 className="w-3 h-3 mr-1" />
                              编辑
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDelete(item.id)}
                            >
                              <Trash2 className="w-3 h-3 mr-1" />
                              删除
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>

      {items.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>AI 愿景洞察</CardTitle>
          </CardHeader>
          <CardContent>
            <Button className="w-full">
              <Sparkles className="w-4 h-4 mr-2" />
              生成AI愿景分析报告
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
