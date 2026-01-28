import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Pencil, Plus, Tent } from "lucide-react";
import { toast } from "sonner";
import { CampEditDialog } from "./camps/CampEditDialog";
import type { Database } from "@/integrations/supabase/types";

type CampTemplateRow = Database["public"]["Tables"]["camp_templates"]["Row"];

export function CampTemplatesManagement() {
  const queryClient = useQueryClient();
  const [selectedCategory, setSelectedCategory] = useState<string>("youjin");
  const [editingCamp, setEditingCamp] = useState<CampTemplateRow | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const { data: camps = [], isLoading } = useQuery({
    queryKey: ["camp-templates"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("camp_templates")
        .select("*")
        .order("display_order", { ascending: true });

      if (error) throw error;
      return data;
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const { error } = await supabase
        .from("camp_templates")
        .update({ is_active: isActive })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["camp-templates"] });
      toast.success("状态已更新");
    },
    onError: () => {
      toast.error("更新失败");
    },
  });

  const filteredCamps = camps.filter(
    (camp) => (camp.category || "youjin") === selectedCategory
  );

  const handleEdit = (camp: CampTemplateRow) => {
    setEditingCamp(camp);
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingCamp(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Tent className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold">训练营管理</h1>
        </div>
      </div>

      <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
        <TabsList>
          <TabsTrigger value="youjin">有劲训练营</TabsTrigger>
          <TabsTrigger value="bloom">绽放训练营</TabsTrigger>
        </TabsList>

        <TabsContent value={selectedCategory} className="mt-6">
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">
              加载中...
            </div>
          ) : filteredCamps.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              暂无训练营
            </div>
          ) : (
            <div className="grid gap-4">
              {filteredCamps.map((camp) => (
                <Card key={camp.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <span className="text-3xl">{camp.icon || "🏕️"}</span>
                        <div>
                          <h3 className="font-semibold text-lg">
                            {camp.camp_name}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {camp.camp_subtitle || "暂无副标题"}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline">
                              ¥{camp.price || 0}
                              {camp.original_price && (
                                <span className="ml-1 line-through text-muted-foreground">
                                  ¥{camp.original_price}
                                </span>
                              )}
                            </Badge>
                            <Badge variant="secondary">
                              {camp.duration_days}天
                            </Badge>
                            {camp.price_note && (
                              <Badge variant="destructive" className="text-xs">
                                {camp.price_note}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-muted-foreground">
                            {camp.is_active ? "已启用" : "已禁用"}
                          </span>
                          <Switch
                            checked={camp.is_active}
                            onCheckedChange={(checked) =>
                              toggleActiveMutation.mutate({
                                id: camp.id,
                                isActive: checked,
                              })
                            }
                          />
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(camp)}
                        >
                          <Pencil className="h-4 w-4 mr-1" />
                          编辑
                        </Button>
                      </div>
                    </div>

                    {/* Benefits preview */}
                    {camp.benefits && Array.isArray(camp.benefits) && (
                      <div className="mt-3 pt-3 border-t">
                        <p className="text-xs text-muted-foreground mb-2">
                          权益列表：
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {(camp.benefits as string[]).slice(0, 5).map((benefit, idx) => (
                            <Badge key={idx} variant="outline" className="text-xs">
                              {benefit}
                            </Badge>
                          ))}
                          {(camp.benefits as string[]).length > 5 && (
                            <Badge variant="outline" className="text-xs">
                              +{(camp.benefits as string[]).length - 5}
                            </Badge>
                          )}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <CampEditDialog
        camp={editingCamp}
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onClose={handleCloseDialog}
      />
    </div>
  );
}
