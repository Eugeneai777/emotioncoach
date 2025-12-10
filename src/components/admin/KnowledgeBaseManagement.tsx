import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RefreshCw, Search, Database, BookOpen, Users, Tent, Package, Star } from "lucide-react";
import { toast } from "sonner";
import KnowledgeBaseMatrix from "./KnowledgeBaseMatrix";
import KnowledgeDocEditor from "./KnowledgeDocEditor";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

interface KnowledgeItem {
  id: string;
  title: string;
  content: string;
  doc_type: string;
  coach_key: string | null;
  camp_type: string | null;
  package_key: string | null;
  partner_level: string | null;
  keywords: string[];
  is_active: boolean;
  display_order?: number;
  category?: string;
  created_at?: string;
}

interface CoachTemplate {
  id: string;
  coach_key: string;
  title: string;
  emoji: string;
}

interface CampTemplate {
  id: string;
  camp_type: string;
  camp_name: string;
  icon: string;
}

interface PackageTemplate {
  id: string;
  package_key: string;
  package_name: string;
}

interface PartnerLevel {
  id: string;
  level_name: string;
  partner_type: string;
}

// Document types configuration
const DOC_TYPES = [
  { type: "intro", label: "产品介绍", description: "产品定位、核心功能、价值主张" },
  { type: "four_steps", label: "四部曲/模型", description: "核心方法论、步骤详解" },
  { type: "science", label: "科学依据", description: "理论基础、研究支持" },
  { type: "faq", label: "常见问题", description: "FAQ、用户疑问解答" },
  { type: "scenarios", label: "适用场景", description: "使用场景、案例说明" },
  { type: "audience", label: "适用人群", description: "目标用户、适用条件" },
  { type: "benefits", label: "权益说明", description: "套餐权益、合伙人权益详情" },
  { type: "usage_guide", label: "使用指南", description: "操作步骤、使用方法" },
  { type: "general", label: "通用知识", description: "其他通用内容" },
];

export default function KnowledgeBaseManagement() {
  const [items, setItems] = useState<KnowledgeItem[]>([]);
  const [coaches, setCoaches] = useState<CoachTemplate[]>([]);
  const [camps, setCamps] = useState<CampTemplate[]>([]);
  const [packages, setPackages] = useState<PackageTemplate[]>([]);
  const [partnerLevels, setPartnerLevels] = useState<PartnerLevel[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Editor state
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<KnowledgeItem | undefined>();
  const [editorDocType, setEditorDocType] = useState("");
  const [editorDocTypeLabel, setEditorDocTypeLabel] = useState("");
  const [editorCoachKey, setEditorCoachKey] = useState<string | null>(null);
  const [editorCoachName, setEditorCoachName] = useState("");
  const [editorCampType, setEditorCampType] = useState<string | null>(null);
  const [editorPackageKey, setEditorPackageKey] = useState<string | null>(null);
  const [editorPartnerLevel, setEditorPartnerLevel] = useState<string | null>(null);
  
  // View dialog state
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [viewingItem, setViewingItem] = useState<KnowledgeItem | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load knowledge items
      const { data: itemsData, error: itemsError } = await supabase
        .from("support_knowledge_base")
        .select("*")
        .order("display_order", { ascending: true });

      if (itemsError) throw itemsError;
      setItems(itemsData || []);

      // Load coaches
      const { data: coachesData, error: coachesError } = await supabase
        .from("coach_templates")
        .select("id, coach_key, title, emoji")
        .eq("is_active", true)
        .order("display_order", { ascending: true });

      if (coachesError) throw coachesError;
      setCoaches(coachesData || []);

      // Load camps
      const { data: campsData, error: campsError } = await supabase
        .from("camp_templates")
        .select("id, camp_type, camp_name, icon")
        .eq("is_active", true)
        .order("display_order", { ascending: true });

      if (campsError) throw campsError;
      setCamps(campsData || []);

      // Load packages
      const { data: packagesData, error: packagesError } = await supabase
        .from("packages")
        .select("id, package_key, package_name")
        .eq("is_active", true)
        .order("display_order", { ascending: true });

      if (packagesError) throw packagesError;
      setPackages(packagesData || []);

      // Load partner levels
      const { data: levelsData, error: levelsError } = await supabase
        .from("partner_level_rules")
        .select("id, level_name, partner_type")
        .eq("is_active", true)
        .order("display_order", { ascending: true });

      if (levelsError) throw levelsError;
      setPartnerLevels(levelsData || []);
    } catch (error: any) {
      console.error("Load error:", error);
      toast.error("加载失败");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Build columns for matrix
  const matrixColumns = useMemo(() => {
    const columns: { key: string; name: string; emoji: string; type: "coach" | "tool" | "camp" | "package" | "partner" }[] = [];
    
    // Add emotion button as a special tool
    columns.push({
      key: "emotion_button",
      name: "情绪按钮",
      emoji: "🆘",
      type: "tool",
    });
    
    // Add coaches
    coaches.forEach((coach) => {
      columns.push({
        key: coach.coach_key,
        name: coach.title,
        emoji: coach.emoji,
        type: "coach",
      });
    });
    
    // Add camps
    camps.forEach((camp) => {
      columns.push({
        key: camp.camp_type,
        name: camp.camp_name,
        emoji: camp.icon,
        type: "camp",
      });
    });

    // Add packages
    packages.forEach((pkg) => {
      columns.push({
        key: pkg.package_key,
        name: pkg.package_name,
        emoji: "📦",
        type: "package",
      });
    });

    // Add partner levels
    partnerLevels.forEach((level) => {
      columns.push({
        key: level.level_name,
        name: level.partner_type === 'bloom' ? '绽放合伙人' : `${level.level_name}合伙人`,
        emoji: "⭐",
        type: "partner",
      });
    });
    
    return columns;
  }, [coaches, camps, packages, partnerLevels]);

  // Handle cell click in matrix
  const handleCellClick = (
    docType: string,
    coachKey: string | null,
    campType: string | null,
    packageKey: string | null,
    partnerLevel: string | null,
    existingItem?: KnowledgeItem
  ) => {
    const docTypeConfig = DOC_TYPES.find((d) => d.type === docType);
    const column = matrixColumns.find(
      (c) => (campType && c.key === campType) || (packageKey && c.key === packageKey) || (partnerLevel && c.key === partnerLevel) || (!campType && !packageKey && !partnerLevel && c.key === coachKey)
    );

    setEditingItem(existingItem);
    setEditorDocType(docType);
    setEditorDocTypeLabel(docTypeConfig?.label || docType);
    setEditorCoachKey(coachKey);
    setEditorCoachName(column?.name || "通用");
    setEditorCampType(campType);
    setEditorPackageKey(packageKey);
    setEditorPartnerLevel(partnerLevel);
    setEditorOpen(true);
  };

  // Handle view item
  const handleViewItem = (item: KnowledgeItem) => {
    setViewingItem(item);
    setViewDialogOpen(true);
  };

  // Statistics
  const stats = useMemo(() => {
    const total = items.length;
    const coachCount = items.filter((i) => i.coach_key && !i.camp_type && !i.package_key && !i.partner_level).length;
    const campCount = items.filter((i) => i.camp_type).length;
    const packageCount = items.filter((i) => i.package_key).length;
    const partnerCount = items.filter((i) => i.partner_level).length;
    const activeCount = items.filter((i) => i.is_active).length;
    
    return { total, coachCount, campCount, packageCount, partnerCount, activeCount };
  }, [items]);

  // Filter items for list view
  const filteredItems = useMemo(() => {
    if (!searchQuery) return items;
    const query = searchQuery.toLowerCase();
    return items.filter(
      (item) =>
        item.title.toLowerCase().includes(query) ||
        item.content.toLowerCase().includes(query) ||
        item.keywords?.some((k) => k.toLowerCase().includes(query))
    );
  }, [items, searchQuery]);

  // Get doc type label
  const getDocTypeLabel = (type: string) => {
    return DOC_TYPES.find((d) => d.type === type)?.label || type;
  };

  // Get column name
  const getColumnName = (item: KnowledgeItem) => {
    if (item.camp_type) {
      const camp = camps.find((c) => c.camp_type === item.camp_type);
      return camp?.camp_name || item.camp_type;
    }
    if (item.package_key) {
      const pkg = packages.find((p) => p.package_key === item.package_key);
      return pkg?.package_name || item.package_key;
    }
    if (item.partner_level) {
      const level = partnerLevels.find((l) => l.level_name === item.partner_level);
      return level ? (level.partner_type === 'bloom' ? '绽放合伙人' : `${level.level_name}合伙人`) : item.partner_level;
    }
    if (item.coach_key) {
      if (item.coach_key === "emotion_button") return "情绪按钮";
      const coach = coaches.find((c) => c.coach_key === item.coach_key);
      return coach?.title || item.coach_key;
    }
    return "通用";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">知识库管理</h2>
          <p className="text-muted-foreground">管理AI客服的知识库内容</p>
        </div>
        <Button onClick={loadData} variant="outline" size="sm">
          <RefreshCw className="w-4 h-4 mr-2" />
          刷新
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Database className="w-8 h-8 text-primary" />
              <div>
                <div className="text-2xl font-bold">{stats.total}</div>
                <div className="text-sm text-muted-foreground">总文档</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <BookOpen className="w-8 h-8 text-blue-500" />
              <div>
                <div className="text-2xl font-bold">{stats.coachCount}</div>
                <div className="text-sm text-muted-foreground">教练</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Tent className="w-8 h-8 text-purple-500" />
              <div>
                <div className="text-2xl font-bold">{stats.campCount}</div>
                <div className="text-sm text-muted-foreground">训练营</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Package className="w-8 h-8 text-orange-500" />
              <div>
                <div className="text-2xl font-bold">{stats.packageCount}</div>
                <div className="text-sm text-muted-foreground">套餐</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Star className="w-8 h-8 text-amber-500" />
              <div>
                <div className="text-2xl font-bold">{stats.partnerCount}</div>
                <div className="text-sm text-muted-foreground">合伙人</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Users className="w-8 h-8 text-green-500" />
              <div>
                <div className="text-2xl font-bold">{stats.activeCount}</div>
                <div className="text-sm text-muted-foreground">已启用</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="matrix" className="space-y-4">
        <TabsList>
          <TabsTrigger value="matrix">📊 矩阵视图</TabsTrigger>
          <TabsTrigger value="list">📋 列表视图</TabsTrigger>
        </TabsList>

        {/* Matrix View */}
        <TabsContent value="matrix">
          <KnowledgeBaseMatrix
            items={items}
            coaches={matrixColumns}
            docTypes={DOC_TYPES}
            onCellClick={handleCellClick}
            onViewItem={handleViewItem}
          />
        </TabsContent>

        {/* List View */}
        <TabsContent value="list" className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="搜索标题、内容、关键词..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* List */}
          <div className="space-y-3">
            {filteredItems.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  {searchQuery ? "未找到匹配的文档" : "暂无知识库文档"}
                </CardContent>
              </Card>
            ) : (
              filteredItems.map((item) => (
                <Card
                  key={item.id}
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => handleViewItem(item)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-medium truncate">{item.title}</h3>
                          {!item.is_active && (
                            <Badge variant="secondary" className="text-xs">
                              已停用
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {item.content?.substring(0, 100)}...
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant="outline" className="text-xs">
                            {getDocTypeLabel(item.doc_type || "general")}
                          </Badge>
                          <Badge variant="secondary" className="text-xs">
                            {getColumnName(item)}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {item.content?.length || 0}字
                          </span>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingItem(item);
                          setEditorDocType(item.doc_type || "general");
                          setEditorDocTypeLabel(getDocTypeLabel(item.doc_type || "general"));
                          setEditorCoachKey(item.coach_key);
                          setEditorCoachName(getColumnName(item));
                          setEditorCampType(item.camp_type);
                          setEditorPackageKey(item.package_key);
                          setEditorPartnerLevel(item.partner_level);
                          setEditorOpen(true);
                        }}
                      >
                        编辑
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Editor Dialog */}
      <KnowledgeDocEditor
        open={editorOpen}
        onOpenChange={setEditorOpen}
        item={editingItem}
        docType={editorDocType}
        docTypeLabel={editorDocTypeLabel}
        coachKey={editorCoachKey}
        coachName={editorCoachName}
        campType={editorCampType}
        packageKey={editorPackageKey}
        partnerLevel={editorPartnerLevel}
        onSaved={loadData}
      />

      {/* View Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {viewingItem?.title}
              {viewingItem && !viewingItem.is_active && (
                <Badge variant="secondary">已停用</Badge>
              )}
            </DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh]">
            <div className="space-y-4 pr-4">
              <div className="flex items-center gap-2">
                <Badge variant="outline">
                  {getDocTypeLabel(viewingItem?.doc_type || "general")}
                </Badge>
                <Badge variant="secondary">{viewingItem && getColumnName(viewingItem)}</Badge>
                <span className="text-sm text-muted-foreground">
                  {viewingItem?.content?.length || 0}字
                </span>
              </div>
              <div className="whitespace-pre-wrap text-sm bg-muted/50 p-4 rounded-lg">
                {viewingItem?.content}
              </div>
              {viewingItem?.keywords && viewingItem.keywords.length > 0 && (
                <div>
                  <div className="text-sm font-medium mb-2">关键词</div>
                  <div className="flex flex-wrap gap-1">
                    {viewingItem.keywords.map((keyword, i) => (
                      <Badge key={i} variant="outline" className="text-xs">
                        {keyword}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
          <div className="flex justify-end gap-2 pt-4">
            <Button
              variant="outline"
              onClick={() => setViewDialogOpen(false)}
            >
              关闭
            </Button>
            <Button
              onClick={() => {
                setViewDialogOpen(false);
                if (viewingItem) {
                  setEditingItem(viewingItem);
                  setEditorDocType(viewingItem.doc_type || "general");
                  setEditorDocTypeLabel(getDocTypeLabel(viewingItem.doc_type || "general"));
                  setEditorCoachKey(viewingItem.coach_key);
                  setEditorCoachName(getColumnName(viewingItem));
                  setEditorCampType(viewingItem.camp_type);
                  setEditorPackageKey(viewingItem.package_key);
                  setEditorPartnerLevel(viewingItem.partner_level);
                  setEditorOpen(true);
                }
              }}
            >
              编辑
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
