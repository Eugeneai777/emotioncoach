import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Plus, Edit, Trash2, Settings } from "lucide-react";
import { toast } from "sonner";
import { PackageFeatureSettingsDialog } from "./PackageFeatureSettingsDialog";

import { Database } from "@/integrations/supabase/types";

type Package = Database["public"]["Tables"]["packages"]["Row"];

export function PackagesManagement() {
  const queryClient = useQueryClient();
  const [editingPackage, setEditingPackage] = useState<Package | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [settingsPackageId, setSettingsPackageId] = useState<string | null>(null);

  const { data: packages, isLoading } = useQuery({
    queryKey: ["admin-packages"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("packages")
        .select("*")
        .order("product_line", { ascending: true })
        .order("display_order", { ascending: true });
      if (error) throw error;
      return data as Package[];
    },
  });

  const createPackage = useMutation({
    mutationFn: async (pkg: Database["public"]["Tables"]["packages"]["Insert"]) => {
      const { error } = await supabase.from("packages").insert(pkg);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-packages"] });
      toast.success("套餐创建成功");
      setIsDialogOpen(false);
      setEditingPackage(null);
    },
    onError: (error: Error) => {
      toast.error(`创建失败: ${error.message}`);
    },
  });

  const updatePackage = useMutation({
    mutationFn: async ({ id, ...pkg }: Database["public"]["Tables"]["packages"]["Update"] & { id: string }) => {
      const { error } = await supabase.from("packages").update(pkg).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-packages"] });
      toast.success("套餐更新成功");
      setIsDialogOpen(false);
      setEditingPackage(null);
    },
    onError: (error: Error) => {
      toast.error(`更新失败: ${error.message}`);
    },
  });

  const deletePackage = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("packages").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-packages"] });
      toast.success("套餐删除成功");
    },
    onError: (error: Error) => {
      toast.error(`删除失败: ${error.message}`);
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const packageData = {
      package_key: formData.get("package_key") as string,
      package_name: formData.get("package_name") as string,
      product_line: formData.get("product_line") as string,
      price: parseFloat(formData.get("price") as string) || null,
      original_price: parseFloat(formData.get("original_price") as string) || null,
      duration_days: parseInt(formData.get("duration_days") as string) || null,
      ai_quota: parseInt(formData.get("ai_quota") as string) || null,
      description: formData.get("description") as string,
      is_active: formData.get("is_active") === "on",
      display_order: parseInt(formData.get("display_order") as string) || 0,
    };

    if (editingPackage) {
      updatePackage.mutate({ id: editingPackage.id, ...packageData });
    } else {
      createPackage.mutate(packageData);
    }
  };

  // Filter packages - only show membership packages, not training camps
  const membershipPackages = packages?.filter((p) => 
    !p.package_key?.includes("camp") && 
    !p.package_key?.includes("training")
  ) || [];

  if (isLoading) {
    return <div className="flex justify-center p-8">加载中...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">套餐权益管理</h2>
          <p className="text-muted-foreground">管理会员套餐和权益配置（训练营在功能管理中配置）</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditingPackage(null)}>
              <Plus className="mr-2 h-4 w-4" />
              新增套餐
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <form onSubmit={handleSubmit}>
              <DialogHeader>
                <DialogTitle>{editingPackage ? "编辑套餐" : "新增套餐"}</DialogTitle>
                <DialogDescription>填写套餐信息</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="package_key">套餐KEY</Label>
                    <Input
                      id="package_key"
                      name="package_key"
                      defaultValue={editingPackage?.package_key}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="package_name">套餐名称</Label>
                    <Input
                      id="package_name"
                      name="package_name"
                      defaultValue={editingPackage?.package_name}
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="product_line">产品线</Label>
                  <Select name="product_line" defaultValue={editingPackage?.product_line || "youjin"}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="youjin">有劲</SelectItem>
                      <SelectItem value="bloom">绽放</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="price">价格</Label>
                    <Input
                      id="price"
                      name="price"
                      type="number"
                      step="0.01"
                      defaultValue={editingPackage?.price || ""}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="original_price">原价</Label>
                    <Input
                      id="original_price"
                      name="original_price"
                      type="number"
                      step="0.01"
                      defaultValue={editingPackage?.original_price || ""}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="duration_days">有效期(天)</Label>
                    <Input
                      id="duration_days"
                      name="duration_days"
                      type="number"
                      defaultValue={editingPackage?.duration_days || ""}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="ai_quota">AI配额</Label>
                    <Input
                      id="ai_quota"
                      name="ai_quota"
                      type="number"
                      defaultValue={editingPackage?.ai_quota || ""}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">描述</Label>
                  <Textarea
                    id="description"
                    name="description"
                    defaultValue={editingPackage?.description || ""}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="display_order">显示顺序</Label>
                    <Input
                      id="display_order"
                      name="display_order"
                      type="number"
                      defaultValue={editingPackage?.display_order || 0}
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="is_active"
                      name="is_active"
                      defaultChecked={editingPackage?.is_active ?? true}
                    />
                    <Label htmlFor="is_active">启用</Label>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  取消
                </Button>
                <Button type="submit">{editingPackage ? "更新" : "创建"}</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>会员套餐列表</CardTitle>
          <CardDescription>点击设置按钮配置套餐包含的功能权益</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>套餐名称</TableHead>
                <TableHead>产品线</TableHead>
                <TableHead>价格</TableHead>
                <TableHead>有效期</TableHead>
                <TableHead>AI配额</TableHead>
                <TableHead>状态</TableHead>
                <TableHead>操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {membershipPackages.map((pkg) => (
                <TableRow key={pkg.id}>
                  <TableCell className="font-medium">{pkg.package_name}</TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {pkg.product_line === "youjin" ? "有劲" : "绽放"}
                    </Badge>
                  </TableCell>
                  <TableCell>¥{pkg.price || "-"}</TableCell>
                  <TableCell>{pkg.duration_days ? `${pkg.duration_days}天` : "-"}</TableCell>
                  <TableCell>{pkg.ai_quota === -1 ? "无限" : pkg.ai_quota || "-"}</TableCell>
                  <TableCell>
                    <Badge variant={pkg.is_active ? "default" : "secondary"}>
                      {pkg.is_active ? "启用" : "禁用"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setEditingPackage(pkg);
                          setIsDialogOpen(true);
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setSettingsPackageId(pkg.id)}
                      >
                        <Settings className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          if (confirm("确定删除此套餐？")) {
                            deletePackage.mutate(pkg.id);
                          }
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {membershipPackages.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                    暂无套餐，点击右上角新增
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {settingsPackageId && (
        <PackageFeatureSettingsDialog
          packageId={settingsPackageId}
          open={!!settingsPackageId}
          onOpenChange={(open) => !open && setSettingsPackageId(null)}
        />
      )}
    </div>
  );
}