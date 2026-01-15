import { useState, useMemo } from "react";
import { OG_BASE_URL, DEFAULT_OG_CONFIG, pathToKeyMap, OGConfig } from "@/config/ogConfig";
import { OGCardPreview } from "./OGCardPreview";
import { OGBatchUpload } from "./OGBatchUpload";
import { OGBatchCategorize } from "./OGBatchCategorize";
import { OGCategoryManager, loadCategories, buildProductLines, ProductLineCategory } from "./OGCategoryManager";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Image as ImageIcon, FileText, Filter, Sparkles, Loader2, Upload } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useOGConfigurations, OGConfiguration } from "@/hooks/useOGConfigurations";

export default function OGPreviewManagement() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLine, setSelectedLine] = useState<string>("all");
  const [batchUploadOpen, setBatchUploadOpen] = useState(false);
  const [categories, setCategories] = useState<ProductLineCategory[]>(() => loadCategories());
  
  // Build product lines from categories
  const productLines = useMemo(() => buildProductLines(categories), [categories]);
  
  // Fetch custom configurations from database
  const { data: customConfigs, isLoading } = useOGConfigurations();

  // Create a map for quick lookup
  const customConfigMap = useMemo(() => {
    const map = new Map<string, OGConfiguration>();
    customConfigs?.forEach(config => {
      map.set(config.page_key, config);
    });
    return map;
  }, [customConfigs]);

  // 计算每个页面的自动分类
  const getAutoCategoryId = (pageKey: string): string | null => {
    for (const category of categories) {
      const filter = productLines[category.id]?.filter;
      if (filter && filter(pageKey)) {
        return category.id;
      }
    }
    return null;
  };

  // 从路径映射和数据库配置构建页面列表
  const allConfigs = useMemo(() => {
    // 收集所有已知的页面 key（从路由映射 + 数据库）
    const pageKeys = new Set<string>(Object.values(pathToKeyMap));
    customConfigs?.forEach(c => pageKeys.add(c.page_key));
    
    return Array.from(pageKeys).map(key => {
      const customConfig = customConfigMap.get(key);
      
      // 构建配置：优先数据库，否则使用默认
      const config: OGConfig = {
        title: customConfig?.title || DEFAULT_OG_CONFIG.title,
        ogTitle: customConfig?.og_title || DEFAULT_OG_CONFIG.ogTitle,
        description: customConfig?.description || DEFAULT_OG_CONFIG.description,
        image: customConfig?.image_url || DEFAULT_OG_CONFIG.image,
        url: customConfig?.url || `${OG_BASE_URL}/`,
      };
      
      return {
        key,
        config,
        customConfig,
        autoCategoryId: getAutoCategoryId(key),
      };
    }).sort((a, b) => a.key.localeCompare(b.key));
  }, [customConfigs, customConfigMap, categories, productLines]);

  const filteredConfigs = useMemo(() => {
    let results = allConfigs;

    // 按产品线筛选 - 优先使用手动分类，其次自动分类
    if (selectedLine !== "all") {
      results = results.filter(item => {
        // 手动分类优先
        const manualCategoryId = item.customConfig?.category_id;
        if (manualCategoryId) {
          return manualCategoryId === selectedLine;
        }
        // 回退到自动分类
        return item.autoCategoryId === selectedLine;
      });
    }

    // 按搜索词筛选
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      results = results.filter(item => 
        item.key.toLowerCase().includes(query) ||
        item.config.title.toLowerCase().includes(query) ||
        item.config.ogTitle.toLowerCase().includes(query) ||
        item.config.description.toLowerCase().includes(query) ||
        item.config.url.toLowerCase().includes(query)
      );
    }

    return results;
  }, [allConfigs, selectedLine, searchQuery]);

  const pageCount = allConfigs.length;
  const customCount = customConfigs?.length || 0;
  // 有自定义图片的配置数量
  const imageCount = customConfigs?.filter(c => c.image_url)?.length || 0;

  const handleCategoriesChange = (newCategories: ProductLineCategory[]) => {
    setCategories(newCategories);
    // Reset selection if current selection no longer exists
    if (selectedLine !== "all" && selectedLine !== "other" && !newCategories.find(c => c.id === selectedLine)) {
      setSelectedLine("all");
    }
  };

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">OG 预览管理</h1>
          <p className="text-muted-foreground mt-1">
            预览、编辑和上传所有页面的微信分享配置
          </p>
        </div>
        <OGCategoryManager onCategoriesChange={handleCategoriesChange} />
      </div>

      {/* 统计概览 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center gap-2 text-muted-foreground">
            <FileText className="h-4 w-4" />
            <span className="text-sm">页面配置</span>
          </div>
          <p className="text-2xl font-bold text-foreground mt-1">{pageCount}</p>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center gap-2 text-muted-foreground">
            <ImageIcon className="h-4 w-4" />
            <span className="text-sm">自定义图片</span>
          </div>
          <p className="text-2xl font-bold text-foreground mt-1">
            {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : imageCount}
          </p>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Sparkles className="h-4 w-4" />
            <span className="text-sm">已配置</span>
          </div>
          <p className="text-2xl font-bold text-amber-500 mt-1">
            {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : customCount}
          </p>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Filter className="h-4 w-4" />
            <span className="text-sm">当前筛选</span>
          </div>
          <p className="text-2xl font-bold text-foreground mt-1">{filteredConfigs.length}</p>
        </div>
      </div>

      {/* 筛选工具栏 */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="搜索页面名称、标题、描述..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={selectedLine} onValueChange={setSelectedLine}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="选择产品线" />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(productLines).map(([key, { label }]) => (
              <SelectItem key={key} value={key}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        {/* Batch upload button */}
        {selectedLine !== "all" && filteredConfigs.length > 0 && (
          <Button
            variant="outline"
            onClick={() => setBatchUploadOpen(true)}
            className="gap-2"
          >
            <Upload className="h-4 w-4" />
            批量上传
          </Button>
        )}
        
        {/* Batch categorize button */}
        <OGBatchCategorize
          configs={allConfigs}
          categories={categories}
        />
      </div>

      {/* 产品线快捷标签 */}
      <div className="flex flex-wrap gap-2">
        {Object.entries(productLines).map(([key, { label }]) => (
          <Badge
            key={key}
            variant={selectedLine === key ? "default" : "outline"}
            className="cursor-pointer"
            onClick={() => setSelectedLine(key)}
          >
            {label}
          </Badge>
        ))}
      </div>

      {/* Batch upload dialog */}
      <OGBatchUpload
        open={batchUploadOpen}
        onOpenChange={setBatchUploadOpen}
        productLine={productLines[selectedLine]?.label || selectedLine}
        pageKeys={filteredConfigs.map(c => c.key)}
      />

      {/* OG卡片网格 */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : filteredConfigs.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>没有找到匹配的配置</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredConfigs.map(({ key, config, customConfig, autoCategoryId }) => (
            <OGCardPreview 
              key={key} 
              pageKey={key} 
              config={config}
              customConfig={customConfig}
              categories={categories}
              autoCategoryId={autoCategoryId}
            />
          ))}
        </div>
      )}
    </div>
  );
}
