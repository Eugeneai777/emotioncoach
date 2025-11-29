import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

interface PackageFeature {
  id: string;
  feature_id: string;
  access_level: string;
  access_value: string | null;
  feature_definitions: {
    feature_name: string;
    feature_key: string;
    category: string;
  };
}

interface PackageFeaturesDialogProps {
  packageId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PackageFeaturesDialog({ packageId, open, onOpenChange }: PackageFeaturesDialogProps) {
  const queryClient = useQueryClient();

  const { data: pkg } = useQuery({
    queryKey: ["package", packageId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("packages")
        .select("package_name")
        .eq("id", packageId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!packageId,
  });

  const { data: features } = useQuery({
    queryKey: ["package-features", packageId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("package_features")
        .select("*, feature_definitions(*)")
        .eq("package_id", packageId);
      if (error) throw error;
      return data as PackageFeature[];
    },
    enabled: !!packageId,
  });

  const { data: allFeatures } = useQuery({
    queryKey: ["all-features"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("feature_definitions")
        .select("*")
        .eq("is_active", true)
        .order("category")
        .order("display_order");
      if (error) throw error;
      return data;
    },
  });

  const updateFeature = useMutation({
    mutationFn: async ({
      id,
      access_level,
      access_value,
    }: {
      id: string;
      access_level: string;
      access_value: string | null;
    }) => {
      const { error } = await supabase
        .from("package_features")
        .update({ access_level, access_value })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["package-features", packageId] });
      toast.success("权益更新成功");
    },
  });

  const addFeature = useMutation({
    mutationFn: async ({
      feature_id,
      access_level,
      access_value,
    }: {
      feature_id: string;
      access_level: string;
      access_value: string | null;
    }) => {
      const { error } = await supabase
        .from("package_features")
        .insert({ package_id: packageId, feature_id, access_level, access_value });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["package-features", packageId] });
      toast.success("权益添加成功");
    },
  });

  const deleteFeature = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("package_features").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["package-features", packageId] });
      toast.success("权益删除成功");
    },
  });

  const existingFeatureIds = features?.map((f) => f.feature_id) || [];
  const availableFeatures = allFeatures?.filter((f) => !existingFeatureIds.includes(f.id)) || [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>配置套餐权益 - {pkg?.package_name}</DialogTitle>
          <DialogDescription>管理此套餐包含的功能和权限</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>功能名称</TableHead>
                <TableHead>分类</TableHead>
                <TableHead>权限级别</TableHead>
                <TableHead>权限值</TableHead>
                <TableHead>操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {features?.map((feature) => (
                <TableRow key={feature.id}>
                  <TableCell>{feature.feature_definitions.feature_name}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{feature.feature_definitions.category}</Badge>
                  </TableCell>
                  <TableCell>
                    <Select
                      defaultValue={feature.access_level}
                      onValueChange={(value) =>
                        updateFeature.mutate({
                          id: feature.id,
                          access_level: value,
                          access_value: feature.access_value,
                        })
                      }
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="full">完整</SelectItem>
                        <SelectItem value="partial">部分</SelectItem>
                        <SelectItem value="none">无</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <Input
                      placeholder="如: 10次/月"
                      defaultValue={feature.access_value || ""}
                      onBlur={(e) =>
                        updateFeature.mutate({
                          id: feature.id,
                          access_level: feature.access_level,
                          access_value: e.target.value || null,
                        })
                      }
                      className="w-32"
                    />
                  </TableCell>
                  <TableCell>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        if (confirm("确定删除此权益？")) {
                          deleteFeature.mutate(feature.id);
                        }
                      }}
                    >
                      删除
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {availableFeatures.length > 0 && (
            <div className="border-t pt-4">
              <h4 className="font-semibold mb-2">添加功能权益</h4>
              <div className="flex gap-2">
                <Select
                  onValueChange={(featureId) => {
                    addFeature.mutate({
                      feature_id: featureId,
                      access_level: "full",
                      access_value: null,
                    });
                  }}
                >
                  <SelectTrigger className="w-64">
                    <SelectValue placeholder="选择功能" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableFeatures.map((feature) => (
                      <SelectItem key={feature.id} value={feature.id}>
                        {feature.feature_name} ({feature.category})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
