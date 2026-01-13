import { useState, useMemo } from "react";
import { Check, Tags, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { ProductLineCategory } from "./OGCategoryManager";
import { OGConfiguration } from "@/hooks/useOGConfigurations";

// 页面键名到中文名称的映射
const PAGE_KEY_LABELS: Record<string, string> = {
  home: "首页",
  coachSpace: "教练空间",
  coachSpaceIntro: "教练空间介绍",
  energyStudio: "有劲生活馆",
  courses: "学习课程",
  community: "社区",
  myPosts: "我的帖子",
  packages: "产品中心",
  wealthBlock: "财富卡点测评",
  wealthBlockIntro: "财富卡点介绍",
  wealthCamp: "财富觉醒训练营",
  wealthCampIntro: "财富训练营介绍",
  wealthJournal: "财富觉醒日记",
  wealthCoach: "财富教练",
  emotionCoach: "情绪教练",
  parentCoach: "亲子教练",
  teenCoach: "青少年教练",
  vibrantLife: "有劲生活教练",
  partner: "合伙人",
  partnerIntro: "合伙人介绍",
  partnerDashboard: "合伙人仪表盘",
  bloomPartner: "绽放合伙人",
  bloomCamp: "绽放训练营",
  profile: "个人中心",
  settings: "设置",
  notifications: "通知",
  auth: "登录注册",
  breathing: "呼吸练习",
  gratitude: "感恩日记",
  awakening: "觉察日记",
  coach: "AI教练",
};

// 获取页面中文名称
export function getPageKeyLabel(key: string): string {
  // 尝试精确匹配
  if (PAGE_KEY_LABELS[key]) {
    return PAGE_KEY_LABELS[key];
  }
  
  // 尝试部分匹配
  for (const [pattern, label] of Object.entries(PAGE_KEY_LABELS)) {
    if (key.toLowerCase().includes(pattern.toLowerCase())) {
      return label;
    }
  }
  
  // 返回原始键名
  return key;
}

interface OGBatchCategorizeProps {
  configs: Array<{
    key: string;
    customConfig?: OGConfiguration | null;
    autoCategoryId?: string | null;
  }>;
  categories: ProductLineCategory[];
}

export function OGBatchCategorize({ configs, categories }: OGBatchCategorizeProps) {
  const [open, setOpen] = useState(false);
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());
  const [targetCategory, setTargetCategory] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const queryClient = useQueryClient();
  
  // 按当前分类分组
  const groupedConfigs = useMemo(() => {
    const groups: Record<string, typeof configs> = { uncategorized: [] };
    categories.forEach(cat => {
      groups[cat.id] = [];
    });
    
    configs.forEach(config => {
      const categoryId = config.customConfig?.category_id || config.autoCategoryId;
      if (categoryId && groups[categoryId]) {
        groups[categoryId].push(config);
      } else {
        groups.uncategorized.push(config);
      }
    });
    
    return groups;
  }, [configs, categories]);
  
  const toggleKey = (key: string) => {
    const newSet = new Set(selectedKeys);
    if (newSet.has(key)) {
      newSet.delete(key);
    } else {
      newSet.add(key);
    }
    setSelectedKeys(newSet);
  };
  
  const toggleCategory = (categoryId: string) => {
    const categoryKeys = groupedConfigs[categoryId]?.map(c => c.key) || [];
    const allSelected = categoryKeys.every(k => selectedKeys.has(k));
    
    const newSet = new Set(selectedKeys);
    if (allSelected) {
      categoryKeys.forEach(k => newSet.delete(k));
    } else {
      categoryKeys.forEach(k => newSet.add(k));
    }
    setSelectedKeys(newSet);
  };
  
  const handleApply = async () => {
    if (selectedKeys.size === 0 || !targetCategory) {
      toast.error("请选择卡片和目标分类");
      return;
    }
    
    setIsSubmitting(true);
    try {
      const { data: user } = await supabase.auth.getUser();
      
      for (const key of selectedKeys) {
        await supabase
          .from("og_configurations")
          .upsert({
            page_key: key,
            category_id: targetCategory === "clear" ? null : targetCategory,
            updated_by: user.user?.id,
            updated_at: new Date().toISOString(),
          }, {
            onConflict: 'page_key',
          });
      }
      
      queryClient.invalidateQueries({ queryKey: ["og-configurations"] });
      toast.success(`已更新 ${selectedKeys.size} 个卡片的分类`);
      setOpen(false);
      setSelectedKeys(new Set());
      setTargetCategory("");
    } catch (error) {
      console.error("批量分类失败:", error);
      toast.error("批量分类失败");
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const getCategoryLabel = (categoryId: string) => {
    const cat = categories.find(c => c.id === categoryId);
    return cat ? `${cat.emoji} ${cat.label}` : "未分类";
  };
  
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Tags className="h-4 w-4" />
          批量分类
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>批量分类 OG 卡片</DialogTitle>
          <DialogDescription>
            选择多个卡片并统一分配到指定分类
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* 目标分类选择 */}
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium">目标分类:</span>
            <Select value={targetCategory} onValueChange={setTargetCategory}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="选择分类" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.emoji} {cat.label}
                  </SelectItem>
                ))}
                <SelectItem value="clear">
                  <span className="text-muted-foreground">清除分类</span>
                </SelectItem>
              </SelectContent>
            </Select>
            
            {selectedKeys.size > 0 && (
              <Badge variant="secondary">
                已选 {selectedKeys.size} 个
              </Badge>
            )}
          </div>
          
          {/* 卡片列表 */}
          <ScrollArea className="h-[400px] border rounded-lg p-2">
            <div className="space-y-4">
              {Object.entries(groupedConfigs).map(([categoryId, items]) => {
                if (items.length === 0) return null;
                
                const categoryKeys = items.map(c => c.key);
                const allSelected = categoryKeys.every(k => selectedKeys.has(k));
                const someSelected = categoryKeys.some(k => selectedKeys.has(k));
                
                return (
                  <div key={categoryId} className="space-y-2">
                    <div className="flex items-center gap-2 sticky top-0 bg-background py-1">
                      <Checkbox
                        checked={allSelected}
                        onCheckedChange={() => toggleCategory(categoryId)}
                        className="data-[state=indeterminate]:bg-primary/50"
                        data-state={someSelected && !allSelected ? "indeterminate" : undefined}
                      />
                      <span className="font-medium text-sm">
                        {getCategoryLabel(categoryId)}
                      </span>
                      <Badge variant="outline" className="text-xs">
                        {items.length}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2 pl-6">
                      {items.map((config) => {
                        const isManual = !!config.customConfig?.category_id;
                        return (
                          <div
                            key={config.key}
                            className="flex items-center gap-2 p-2 rounded-md border hover:bg-muted/50 cursor-pointer"
                            onClick={() => toggleKey(config.key)}
                          >
                            <Checkbox
                              checked={selectedKeys.has(config.key)}
                              onCheckedChange={() => toggleKey(config.key)}
                            />
                            <span className="text-sm truncate flex-1" title={config.key}>
                              {getPageKeyLabel(config.key)}
                            </span>
                            {isManual && (
                              <Check className="h-3 w-3 text-primary flex-shrink-0" />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            取消
          </Button>
          <Button 
            onClick={handleApply} 
            disabled={selectedKeys.size === 0 || !targetCategory || isSubmitting}
          >
            {isSubmitting ? "处理中..." : `应用到 ${selectedKeys.size} 个卡片`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
