import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Search, BookOpen, HelpCircle, FileText, Megaphone } from "lucide-react";

interface KnowledgeItem {
  id: string;
  category: string;
  title: string;
  content: string;
  keywords: string[] | null;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

const categoryConfig = {
  faq: { label: '常见问题', icon: HelpCircle, color: 'bg-blue-500' },
  guide: { label: '使用指南', icon: BookOpen, color: 'bg-green-500' },
  policy: { label: '政策说明', icon: FileText, color: 'bg-amber-500' },
  announcement: { label: '公告通知', icon: Megaphone, color: 'bg-purple-500' },
};

export default function KnowledgeBaseManagement() {
  const [items, setItems] = useState<KnowledgeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<KnowledgeItem | null>(null);
  
  // 表单状态
  const [formData, setFormData] = useState({
    category: 'faq',
    title: '',
    content: '',
    keywords: '',
    display_order: 0,
    is_active: true,
  });

  useEffect(() => {
    loadItems();
  }, []);

  const loadItems = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('support_knowledge_base')
      .select('*')
      .order('category')
      .order('display_order');
    
    if (error) {
      toast.error('加载知识库失败');
      console.error(error);
    } else {
      setItems(data || []);
    }
    setLoading(false);
  };

  const handleSubmit = async () => {
    if (!formData.title.trim() || !formData.content.trim()) {
      toast.error('请填写标题和内容');
      return;
    }

    const keywordsArray = formData.keywords
      .split(',')
      .map(k => k.trim())
      .filter(k => k.length > 0);

    const payload = {
      category: formData.category,
      title: formData.title.trim(),
      content: formData.content.trim(),
      keywords: keywordsArray.length > 0 ? keywordsArray : null,
      display_order: formData.display_order,
      is_active: formData.is_active,
    };

    if (editingItem) {
      const { error } = await supabase
        .from('support_knowledge_base')
        .update(payload)
        .eq('id', editingItem.id);
      
      if (error) {
        toast.error('更新失败');
        console.error(error);
      } else {
        toast.success('更新成功');
        loadItems();
        closeDialog();
      }
    } else {
      const { error } = await supabase
        .from('support_knowledge_base')
        .insert(payload);
      
      if (error) {
        toast.error('创建失败');
        console.error(error);
      } else {
        toast.success('创建成功');
        loadItems();
        closeDialog();
      }
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除这条记录吗？')) return;
    
    const { error } = await supabase
      .from('support_knowledge_base')
      .delete()
      .eq('id', id);
    
    if (error) {
      toast.error('删除失败');
      console.error(error);
    } else {
      toast.success('删除成功');
      loadItems();
    }
  };

  const handleToggleActive = async (item: KnowledgeItem) => {
    const { error } = await supabase
      .from('support_knowledge_base')
      .update({ is_active: !item.is_active })
      .eq('id', item.id);
    
    if (error) {
      toast.error('更新失败');
    } else {
      loadItems();
    }
  };

  const openEditDialog = (item: KnowledgeItem) => {
    setEditingItem(item);
    setFormData({
      category: item.category,
      title: item.title,
      content: item.content,
      keywords: item.keywords?.join(', ') || '',
      display_order: item.display_order,
      is_active: item.is_active,
    });
    setIsDialogOpen(true);
  };

  const closeDialog = () => {
    setIsDialogOpen(false);
    setEditingItem(null);
    setFormData({
      category: 'faq',
      title: '',
      content: '',
      keywords: '',
      display_order: 0,
      is_active: true,
    });
  };

  const filteredItems = items.filter(item => {
    const matchesSearch = searchQuery === '' || 
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.content.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || item.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const stats = {
    total: items.length,
    faq: items.filter(i => i.category === 'faq').length,
    guide: items.filter(i => i.category === 'guide').length,
    policy: items.filter(i => i.category === 'policy').length,
    announcement: items.filter(i => i.category === 'announcement').length,
  };

  return (
    <div className="space-y-6">
      {/* 统计卡片 */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold">{stats.total}</div>
            <div className="text-sm text-muted-foreground">总条目</div>
          </CardContent>
        </Card>
        {Object.entries(categoryConfig).map(([key, config]) => (
          <Card key={key}>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold">{stats[key as keyof typeof stats]}</div>
              <div className="text-sm text-muted-foreground">{config.label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 操作栏 */}
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <div className="flex gap-2 flex-1 w-full md:w-auto">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="搜索标题或内容..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="分类" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部分类</SelectItem>
              {Object.entries(categoryConfig).map(([key, config]) => (
                <SelectItem key={key} value={key}>{config.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => closeDialog()}>
              <Plus className="h-4 w-4 mr-2" />
              新增条目
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingItem ? '编辑知识库条目' : '新增知识库条目'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">分类</label>
                  <Select value={formData.category} onValueChange={(v) => setFormData({...formData, category: v})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(categoryConfig).map(([key, config]) => (
                        <SelectItem key={key} value={key}>{config.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">排序</label>
                  <Input
                    type="number"
                    value={formData.display_order}
                    onChange={(e) => setFormData({...formData, display_order: parseInt(e.target.value) || 0})}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">标题</label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  placeholder="如：如何开始使用情绪教练？"
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">内容</label>
                <Textarea
                  value={formData.content}
                  onChange={(e) => setFormData({...formData, content: e.target.value})}
                  placeholder="详细的回答或说明内容..."
                  rows={6}
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">关键词（用逗号分隔）</label>
                <Input
                  value={formData.keywords}
                  onChange={(e) => setFormData({...formData, keywords: e.target.value})}
                  placeholder="如：情绪教练, 使用, 开始"
                />
                <p className="text-xs text-muted-foreground">关键词用于AI智能匹配，请填写用户可能搜索的词语</p>
              </div>
              
              <div className="flex items-center gap-2">
                <Switch
                  checked={formData.is_active}
                  onCheckedChange={(v) => setFormData({...formData, is_active: v})}
                />
                <label className="text-sm">启用</label>
              </div>
              
              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={closeDialog}>取消</Button>
                <Button onClick={handleSubmit}>{editingItem ? '保存' : '创建'}</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* 列表 */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-24">分类</TableHead>
                <TableHead>标题</TableHead>
                <TableHead className="hidden md:table-cell">关键词</TableHead>
                <TableHead className="w-20">排序</TableHead>
                <TableHead className="w-20">状态</TableHead>
                <TableHead className="w-24">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">加载中...</TableCell>
                </TableRow>
              ) : filteredItems.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    暂无数据
                  </TableCell>
                </TableRow>
              ) : (
                filteredItems.map((item) => {
                  const config = categoryConfig[item.category as keyof typeof categoryConfig];
                  const Icon = config?.icon || HelpCircle;
                  return (
                    <TableRow key={item.id}>
                      <TableCell>
                        <Badge variant="secondary" className="gap-1">
                          <Icon className="h-3 w-3" />
                          {config?.label || item.category}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{item.title}</div>
                        <div className="text-xs text-muted-foreground line-clamp-1 max-w-xs">
                          {item.content}
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <div className="flex flex-wrap gap-1">
                          {item.keywords?.slice(0, 3).map((kw, i) => (
                            <Badge key={i} variant="outline" className="text-xs">{kw}</Badge>
                          ))}
                          {item.keywords && item.keywords.length > 3 && (
                            <Badge variant="outline" className="text-xs">+{item.keywords.length - 3}</Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{item.display_order}</TableCell>
                      <TableCell>
                        <Switch
                          checked={item.is_active}
                          onCheckedChange={() => handleToggleActive(item)}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" onClick={() => openEditDialog(item)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDelete(item.id)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
