import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { GripVertical, Sparkles, Download } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";

interface Value {
  id: string;
  name: string;
  category: string;
  description: string;
}

const valueCategories = [
  { id: "family", name: "家庭关系", color: "hsl(340, 75%, 55%)" },
  { id: "career", name: "事业成就", color: "hsl(210, 75%, 55%)" },
  { id: "health", name: "健康活力", color: "hsl(120, 60%, 50%)" },
  { id: "growth", name: "个人成长", color: "hsl(280, 65%, 60%)" },
  { id: "contribution", name: "社会贡献", color: "hsl(45, 90%, 55%)" },
  { id: "pleasure", name: "享受生活", color: "hsl(30, 85%, 60%)" }
];

const allValues: Value[] = [
  { id: "family", name: "家庭和睦", category: "family", description: "与家人保持亲密关系" },
  { id: "love", name: "爱情婚姻", category: "family", description: "拥有深厚的爱情关系" },
  { id: "friendship", name: "友谊珍贵", category: "family", description: "维护真挚的友情" },
  { id: "achievement", name: "成就感", category: "career", description: "在工作中获得认可" },
  { id: "creativity", name: "创造力", category: "career", description: "发挥创新能力" },
  { id: "leadership", name: "领导力", category: "career", description: "影响和带领他人" },
  { id: "fitness", name: "身体健康", category: "health", description: "保持良好体能" },
  { id: "mental", name: "心理健康", category: "health", description: "内心平和宁静" },
  { id: "energy", name: "充沛精力", category: "health", description: "每天活力满满" },
  { id: "learning", name: "持续学习", category: "growth", description: "不断提升自己" },
  { id: "wisdom", name: "智慧增长", category: "growth", description: "获得人生智慧" },
  { id: "courage", name: "勇敢突破", category: "growth", description: "敢于面对挑战" },
  { id: "help", name: "帮助他人", category: "contribution", description: "为他人带来价值" },
  { id: "justice", name: "公平正义", category: "contribution", description: "维护公平" },
  { id: "environment", name: "环保责任", category: "contribution", description: "保护环境" },
  { id: "beauty", name: "美的体验", category: "pleasure", description: "欣赏美好事物" },
  { id: "adventure", name: "冒险探索", category: "pleasure", description: "体验新鲜事物" },
  { id: "leisure", name: "休闲放松", category: "pleasure", description: "享受闲暇时光" }
];

export const ValuesExplorer = () => {
  const { user } = useAuth();
  const [selectedValues, setSelectedValues] = useState<Value[]>([]);
  const [rankedValues, setRankedValues] = useState<Value[]>([]);
  const [step, setStep] = useState<"select" | "rank" | "result">("select");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadSavedValues();
  }, [user]);

  const loadSavedValues = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from("user_values")
        .select("*")
        .eq("user_id", user.id)
        .order("priority");

      if (error) throw error;

      if (data && data.length > 0) {
        const saved = data.map((v, index) => {
          const value = allValues.find(av => av.name === v.value_name);
          return value || { id: `saved-${index}`, name: v.value_name, category: "custom", description: "" };
        });
        setRankedValues(saved);
        setStep("result");
      }
    } catch (error) {
      console.error("Error loading values:", error);
    }
  };

  const toggleValue = (value: Value) => {
    if (selectedValues.find(v => v.id === value.id)) {
      setSelectedValues(selectedValues.filter(v => v.id !== value.id));
    } else {
      if (selectedValues.length < 10) {
        setSelectedValues([...selectedValues, value]);
      } else {
        toast({
          title: "最多选择10个",
          description: "请选择最重要的10个价值观",
          variant: "destructive"
        });
      }
    }
  };

  const handleStartRanking = () => {
    if (selectedValues.length < 3) {
      toast({
        title: "至少选择3个",
        description: "请至少选择3个价值观",
        variant: "destructive"
      });
      return;
    }
    setRankedValues([...selectedValues]);
    setStep("rank");
  };

  const handleDragEnd = (result: any) => {
    if (!result.destination) return;

    const items = Array.from(rankedValues);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    setRankedValues(items);
  };

  const handleSaveValues = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      // 删除旧的价值观
      await supabase
        .from("user_values")
        .delete()
        .eq("user_id", user.id);

      // 保存新的价值观
      const valuesToInsert = rankedValues.map((value, index) => ({
        user_id: user.id,
        value_name: value.name,
        priority: index + 1
      }));

      const { error } = await supabase
        .from("user_values")
        .insert(valuesToInsert);

      if (error) throw error;

      toast({
        title: "保存成功！",
        description: "你的核心价值观已保存"
      });
      setStep("result");
    } catch (error) {
      console.error("Error saving values:", error);
      toast({
        title: "保存失败",
        description: "请稍后重试",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getCategoryColor = (categoryId: string) => {
    return valueCategories.find(c => c.id === categoryId)?.color || "hsl(var(--primary))";
  };

  return (
    <div className="space-y-6">
      {step === "select" && (
        <>
          <Card>
            <CardHeader>
              <CardTitle>第一步：选择你的价值观</CardTitle>
              <CardDescription>
                从下面选择 3-10 个对你最重要的价值观（已选择 {selectedValues.length}/10）
              </CardDescription>
            </CardHeader>
            <CardContent>
              {valueCategories.map((category) => (
                <div key={category.id} className="mb-6">
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: category.color }}
                    />
                    {category.name}
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {allValues
                      .filter(v => v.category === category.id)
                      .map((value) => {
                        const isSelected = selectedValues.find(v => v.id === value.id);
                        return (
                          <Badge
                            key={value.id}
                            variant={isSelected ? "default" : "outline"}
                            className="cursor-pointer px-4 py-2 text-sm"
                            style={{
                              backgroundColor: isSelected ? category.color : undefined,
                              borderColor: category.color
                            }}
                            onClick={() => toggleValue(value)}
                          >
                            {value.name}
                          </Badge>
                        );
                      })}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button
              size="lg"
              onClick={handleStartRanking}
              disabled={selectedValues.length < 3}
            >
              下一步：排序
            </Button>
          </div>
        </>
      )}

      {step === "rank" && (
        <>
          <Card>
            <CardHeader>
              <CardTitle>第二步：排序你的价值观</CardTitle>
              <CardDescription>
                拖动价值观卡片，按重要性从上到下排序
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DragDropContext onDragEnd={handleDragEnd}>
                <Droppable droppableId="values">
                  {(provided) => (
                    <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-2">
                      {rankedValues.map((value, index) => (
                        <Draggable key={value.id} draggableId={value.id} index={index}>
                          {(provided) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className="flex items-center gap-3 p-4 bg-card border rounded-lg hover:shadow-md transition-shadow"
                            >
                              <GripVertical className="w-5 h-5 text-muted-foreground" />
                              <div
                                className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm"
                                style={{
                                  backgroundColor: `${getCategoryColor(value.category)}20`,
                                  color: getCategoryColor(value.category)
                                }}
                              >
                                {index + 1}
                              </div>
                              <div className="flex-1">
                                <div className="font-medium">{value.name}</div>
                                <div className="text-sm text-muted-foreground">{value.description}</div>
                              </div>
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </DragDropContext>
            </CardContent>
          </Card>

          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setStep("select")}>
              返回
            </Button>
            <Button size="lg" onClick={handleSaveValues} disabled={loading}>
              {loading ? "保存中..." : "保存价值观"}
            </Button>
          </div>
        </>
      )}

      {step === "result" && rankedValues.length > 0 && (
        <>
          <Card>
            <CardHeader>
              <CardTitle>你的核心价值观</CardTitle>
              <CardDescription>
                这些是驱动你人生的核心价值观
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {rankedValues.slice(0, 5).map((value, index) => (
                <div
                  key={value.id}
                  className="flex items-center gap-3 p-4 rounded-lg"
                  style={{
                    backgroundColor: `${getCategoryColor(value.category)}10`,
                    borderLeft: `4px solid ${getCategoryColor(value.category)}`
                  }}
                >
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center font-bold"
                    style={{
                      backgroundColor: getCategoryColor(value.category),
                      color: "white"
                    }}
                  >
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-lg">{value.name}</div>
                    <div className="text-sm text-muted-foreground">{value.description}</div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>价值观洞察</CardTitle>
              <CardDescription>基于你的核心价值观</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm">
                你最重视 <strong>{rankedValues[0]?.name}</strong>，
                这表明你希望在生活中 {rankedValues[0]?.description.toLowerCase()}。
                同时，<strong>{rankedValues[1]?.name}</strong> 和 <strong>{rankedValues[2]?.name}</strong> 
                也对你很重要。
              </p>
              <div className="p-4 bg-muted/50 rounded-lg">
                <h4 className="font-medium mb-2">💡 生活建议</h4>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  <li>• 确保日常决策与你的核心价值观保持一致</li>
                  <li>• 定期回顾这些价值观，看是否需要调整</li>
                  <li>• 在面临选择时，问自己：这符合我的核心价值观吗？</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setStep("select")}>
              <Download className="w-4 h-4 mr-2" />
              重新探索
            </Button>
            <Button>
              <Sparkles className="w-4 h-4 mr-2" />
              与AI深度对话
            </Button>
          </div>
        </>
      )}
    </div>
  );
};
