import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Plus, Pencil, Trash2, Search, BookOpen, GraduationCap, FileText, Users, MessageCircle } from "lucide-react";
import { toast } from "sonner";

interface KnowledgeItem {
  id: string;
  category: string;
  title: string;
  content: string;
  keywords: string[] | null;
  display_order: number;
  is_active: boolean;
  doc_type: string | null;
  coach_key: string | null;
  camp_type: string | null;
}

interface CoachTemplate {
  coach_key: string;
  title: string;
  emoji: string;
}

interface CampTemplate {
  camp_type: string;
  camp_name: string;
  icon: string;
}

const docTypeConfig: Record<string, { label: string; color: string; icon: any }> = {
  intro: { label: "介绍", color: "bg-blue-100 text-blue-800", icon: BookOpen },
  camp: { label: "训练营", color: "bg-purple-100 text-purple-800", icon: GraduationCap },
  faq: { label: "常见问题", color: "bg-green-100 text-green-800", icon: MessageCircle },
  guide: { label: "使用指南", color: "bg-amber-100 text-amber-800", icon: FileText },
  policy: { label: "政策说明", color: "bg-gray-100 text-gray-800", icon: FileText },
};

const scopeOptions = [
  { value: "coach", label: "关联教练" },
  { value: "camp", label: "关联训练营" },
  { value: "general", label: "通用文档" },
];

export default function KnowledgeBaseManagement() {
  const [items, setItems] = useState<KnowledgeItem[]>([]);
  const [coaches, setCoaches] = useState<CoachTemplate[]>([]);
  const [camps, setCamps] = useState<CampTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCoach, setSelectedCoach] = useState<string>("all");
  const [selectedCamp, setSelectedCamp] = useState<string>("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<KnowledgeItem | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    keywords: "",
    display_order: 0,
    is_active: true,
    doc_type: "faq",
    scope: "general",
    coach_key: "",
    camp_type: "",
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [itemsRes, coachesRes, campsRes] = await Promise.all([
        supabase.from("support_knowledge_base").select("*").order("display_order"),
        supabase.from("coach_templates").select("coach_key, title, emoji").eq("is_active", true).order("display_order"),
        supabase.from("camp_templates").select("camp_type, camp_name, icon").eq("is_active", true).order("display_order"),
      ]);

      if (itemsRes.error) throw itemsRes.error;
      if (coachesRes.error) throw coachesRes.error;
      if (campsRes.error) throw campsRes.error;

      setItems(itemsRes.data || []);
      setCoaches(coachesRes.data || []);
      setCamps(campsRes.data || []);
    } catch (error) {
      console.error("Error loading data:", error);
      toast.error("加载数据失败");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!formData.title || !formData.content) {
      toast.error("请填写标题和内容");
      return;
    }

    const dataToSave = {
      title: formData.title,
      content: formData.content,
      keywords: formData.keywords.split(",").map(k => k.trim()).filter(Boolean),
      display_order: formData.display_order,
      is_active: formData.is_active,
      doc_type: formData.doc_type,
      category: formData.doc_type,
      coach_key: formData.scope === "coach" ? formData.coach_key : null,
      camp_type: formData.scope === "camp" ? formData.camp_type : null,
    };

    try {
      if (editingItem) {
        const { error } = await supabase
          .from("support_knowledge_base")
          .update(dataToSave)
          .eq("id", editingItem.id);
        if (error) throw error;
        toast.success("更新成功");
      } else {
        const { error } = await supabase
          .from("support_knowledge_base")
          .insert([dataToSave]);
        if (error) throw error;
        toast.success("添加成功");
      }
      closeDialog();
      loadData();
    } catch (error) {
      console.error("Error saving:", error);
      toast.error("保存失败");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("确定删除此文档？")) return;
    try {
      const { error } = await supabase.from("support_knowledge_base").delete().eq("id", id);
      if (error) throw error;
      toast.success("删除成功");
      loadData();
    } catch (error) {
      console.error("Error deleting:", error);
      toast.error("删除失败");
    }
  };

  const handleToggleActive = async (id: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from("support_knowledge_base")
        .update({ is_active: isActive })
        .eq("id", id);
      if (error) throw error;
      loadData();
    } catch (error) {
      console.error("Error toggling:", error);
      toast.error("更新失败");
    }
  };

  const openEditDialog = (item: KnowledgeItem) => {
    setEditingItem(item);
    const scope = item.coach_key ? "coach" : item.camp_type ? "camp" : "general";
    setFormData({
      title: item.title,
      content: item.content,
      keywords: item.keywords?.join(", ") || "",
      display_order: item.display_order,
      is_active: item.is_active,
      doc_type: item.doc_type || "faq",
      scope,
      coach_key: item.coach_key || "",
      camp_type: item.camp_type || "",
    });
    setIsDialogOpen(true);
  };

  const closeDialog = () => {
    setIsDialogOpen(false);
    setEditingItem(null);
    setFormData({
      title: "",
      content: "",
      keywords: "",
      display_order: 0,
      is_active: true,
      doc_type: "faq",
      scope: "general",
      coach_key: "",
      camp_type: "",
    });
  };

  const getCoachItems = () => {
    let filtered = items.filter(item => item.coach_key);
    if (selectedCoach !== "all") {
      filtered = filtered.filter(item => item.coach_key === selectedCoach);
    }
    if (searchQuery) {
      filtered = filtered.filter(item =>
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.content.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    return filtered;
  };

  const getCampItems = () => {
    let filtered = items.filter(item => item.camp_type);
    if (selectedCamp !== "all") {
      filtered = filtered.filter(item => item.camp_type === selectedCamp);
    }
    if (searchQuery) {
      filtered = filtered.filter(item =>
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.content.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    return filtered;
  };

  const getGeneralItems = () => {
    let filtered = items.filter(item => !item.coach_key && !item.camp_type);
    if (searchQuery) {
      filtered = filtered.filter(item =>
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.content.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    return filtered;
  };

  const renderDocCard = (item: KnowledgeItem) => {
    const docType = docTypeConfig[item.doc_type || "faq"] || docTypeConfig.faq;
    const DocIcon = docType.icon;

    return (
      <Card key={item.id} className={`${!item.is_active ? "opacity-60" : ""}`}>
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <DocIcon className="h-4 w-4 text-muted-foreground" />
              <CardTitle className="text-base">{item.title}</CardTitle>
            </div>
            <div className="flex items-center gap-2">
              <Badge className={docType.color}>{docType.label}</Badge>
              <Switch
                checked={item.is_active}
                onCheckedChange={(checked) => handleToggleActive(item.id, checked)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{item.content}</p>
          {item.keywords && item.keywords.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-3">
              {item.keywords.slice(0, 5).map((kw, i) => (
                <Badge key={i} variant="outline" className="text-xs">{kw}</Badge>
              ))}
              {item.keywords.length > 5 && (
                <Badge variant="outline" className="text-xs">+{item.keywords.length - 5}</Badge>
              )}
            </div>
          )}
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => openEditDialog(item)}>
              <Pencil className="h-3 w-3 mr-1" />
              编辑
            </Button>
            <Button size="sm" variant="outline" className="text-destructive" onClick={() => handleDelete(item.id)}>
              <Trash2 className="h-3 w-3 mr-1" />
              删除
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderCoachSection = () => {
    const coachItems = getCoachItems();
    const groupedByCoach = coaches.reduce((acc, coach) => {
      acc[coach.coach_key] = coachItems.filter(item => item.coach_key === coach.coach_key);
      return acc;
    }, {} as Record<string, KnowledgeItem[]>);

    if (selectedCoach !== "all") {
      return (
        <div className="grid gap-4 md:grid-cols-2">
          {coachItems.map(renderDocCard)}
          {coachItems.length === 0 && (
            <div className="col-span-2 text-center py-8 text-muted-foreground">
              暂无文档，点击"添加文档"创建
            </div>
          )}
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {coaches.map(coach => {
          const docs = groupedByCoach[coach.coach_key] || [];
          return (
            <Card key={coach.coach_key}>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <span>{coach.emoji}</span>
                  {coach.title}
                  <Badge variant="secondary">{docs.length} 篇</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {docs.length > 0 ? (
                  <div className="grid gap-3 md:grid-cols-2">
                    {docs.map(renderDocCard)}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground py-4 text-center">暂无文档</p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    );
  };

  const renderCampSection = () => {
    const campItems = getCampItems();
    const groupedByCamp = camps.reduce((acc, camp) => {
      acc[camp.camp_type] = campItems.filter(item => item.camp_type === camp.camp_type);
      return acc;
    }, {} as Record<string, KnowledgeItem[]>);

    if (selectedCamp !== "all") {
      return (
        <div className="grid gap-4 md:grid-cols-2">
          {campItems.map(renderDocCard)}
          {campItems.length === 0 && (
            <div className="col-span-2 text-center py-8 text-muted-foreground">
              暂无文档，点击"添加文档"创建
            </div>
          )}
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {camps.map(camp => {
          const docs = groupedByCamp[camp.camp_type] || [];
          return (
            <Card key={camp.camp_type}>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <span>{camp.icon}</span>
                  {camp.camp_name}
                  <Badge variant="secondary">{docs.length} 篇</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {docs.length > 0 ? (
                  <div className="grid gap-3 md:grid-cols-2">
                    {docs.map(renderDocCard)}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground py-4 text-center">暂无文档</p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    );
  };

  const stats = {
    total: items.length,
    byCoach: items.filter(i => i.coach_key).length,
    byCamp: items.filter(i => i.camp_type).length,
    general: items.filter(i => !i.coach_key && !i.camp_type).length,
  };

  if (loading) {
    return <div className="flex justify-center py-8">加载中...</div>;
  }

  return (
    <div className="space-y-6">
      {/* 统计卡片 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-xs text-muted-foreground">总文档数</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-2xl font-bold">{stats.byCoach}</p>
                <p className="text-xs text-muted-foreground">教练文档</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5 text-purple-600" />
              <div>
                <p className="text-2xl font-bold">{stats.byCamp}</p>
                <p className="text-xs text-muted-foreground">训练营文档</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-amber-600" />
              <div>
                <p className="text-2xl font-bold">{stats.general}</p>
                <p className="text-xs text-muted-foreground">通用文档</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 搜索和操作栏 */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="搜索文档..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => closeDialog()}>
              <Plus className="h-4 w-4 mr-2" />
              添加文档
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingItem ? "编辑文档" : "添加文档"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {/* 所属范围 */}
              <div className="space-y-2">
                <Label>所属范围</Label>
                <Select value={formData.scope} onValueChange={(v) => setFormData({ ...formData, scope: v, coach_key: "", camp_type: "" })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {scopeOptions.map(opt => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* 关联对象 */}
              {formData.scope === "coach" && (
                <div className="space-y-2">
                  <Label>选择教练</Label>
                  <Select value={formData.coach_key} onValueChange={(v) => setFormData({ ...formData, coach_key: v })}>
                    <SelectTrigger>
                      <SelectValue placeholder="选择教练" />
                    </SelectTrigger>
                    <SelectContent>
                      {coaches.map(coach => (
                        <SelectItem key={coach.coach_key} value={coach.coach_key}>
                          {coach.emoji} {coach.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {formData.scope === "camp" && (
                <div className="space-y-2">
                  <Label>选择训练营</Label>
                  <Select value={formData.camp_type} onValueChange={(v) => setFormData({ ...formData, camp_type: v })}>
                    <SelectTrigger>
                      <SelectValue placeholder="选择训练营" />
                    </SelectTrigger>
                    <SelectContent>
                      {camps.map(camp => (
                        <SelectItem key={camp.camp_type} value={camp.camp_type}>
                          {camp.icon} {camp.camp_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* 文档类型 */}
              <div className="space-y-2">
                <Label>文档类型</Label>
                <Select value={formData.doc_type} onValueChange={(v) => setFormData({ ...formData, doc_type: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(docTypeConfig).map(([key, config]) => (
                      <SelectItem key={key} value={key}>{config.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* 标题 */}
              <div className="space-y-2">
                <Label>标题</Label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="文档标题"
                />
              </div>

              {/* 内容 */}
              <div className="space-y-2">
                <Label>内容</Label>
                <Textarea
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  placeholder="文档内容..."
                  rows={8}
                />
              </div>

              {/* 关键词 */}
              <div className="space-y-2">
                <Label>关键词（逗号分隔）</Label>
                <Input
                  value={formData.keywords}
                  onChange={(e) => setFormData({ ...formData, keywords: e.target.value })}
                  placeholder="关键词1, 关键词2, ..."
                />
              </div>

              {/* 排序 */}
              <div className="space-y-2">
                <Label>排序（数字越小越靠前）</Label>
                <Input
                  type="number"
                  value={formData.display_order}
                  onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) || 0 })}
                />
              </div>

              {/* 是否启用 */}
              <div className="flex items-center gap-2">
                <Switch
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
                <Label>启用</Label>
              </div>

              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={closeDialog}>取消</Button>
                <Button onClick={handleSubmit}>保存</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* 分类 Tab */}
      <Tabs defaultValue="coach" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="coach" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            按教练
          </TabsTrigger>
          <TabsTrigger value="camp" className="flex items-center gap-2">
            <GraduationCap className="h-4 w-4" />
            按训练营
          </TabsTrigger>
          <TabsTrigger value="general" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            通用文档
          </TabsTrigger>
        </TabsList>

        <TabsContent value="coach" className="mt-4">
          <div className="mb-4">
            <Select value={selectedCoach} onValueChange={setSelectedCoach}>
              <SelectTrigger className="w-64">
                <SelectValue placeholder="筛选教练" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部教练</SelectItem>
                {coaches.map(coach => (
                  <SelectItem key={coach.coach_key} value={coach.coach_key}>
                    {coach.emoji} {coach.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {renderCoachSection()}
        </TabsContent>

        <TabsContent value="camp" className="mt-4">
          <div className="mb-4">
            <Select value={selectedCamp} onValueChange={setSelectedCamp}>
              <SelectTrigger className="w-64">
                <SelectValue placeholder="筛选训练营" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部训练营</SelectItem>
                {camps.map(camp => (
                  <SelectItem key={camp.camp_type} value={camp.camp_type}>
                    {camp.icon} {camp.camp_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {renderCampSection()}
        </TabsContent>

        <TabsContent value="general" className="mt-4">
          <div className="grid gap-4 md:grid-cols-2">
            {getGeneralItems().map(renderDocCard)}
            {getGeneralItems().length === 0 && (
              <div className="col-span-2 text-center py-8 text-muted-foreground">
                暂无通用文档，点击"添加文档"创建
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
