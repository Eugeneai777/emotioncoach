import { useState, useMemo, useEffect } from "react";
import { PAGE_OG_CONFIGS, OG_IMAGES } from "@/config/ogConfig";
import { OGCardPreview } from "./OGCardPreview";
import { OGBatchUpload } from "./OGBatchUpload";
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
import { useOGConfigurations } from "@/hooks/useOGConfigurations";

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
    const map = new Map<string, typeof customConfigs extends (infer T)[] ? T : never>();
    customConfigs?.forEach(config => {
      map.set(config.page_key, config);
    });
    return map;
  }, [customConfigs]);

  const allConfigs = useMemo(() => {
    return Object.entries(PAGE_OG_CONFIGS).map(([key, config]) => ({
      key,
      config,
      customConfig: customConfigMap.get(key),
    }));
  }, [customConfigMap]);

  const filteredConfigs = useMemo(() => {
    let results = allConfigs;

    // 按产品线筛选
    if (selectedLine !== "all") {
      const lineFilter = productLines[selectedLine]?.filter;
      if (lineFilter) {
        results = results.filter(item => lineFilter(item.key));
      }
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
  }, [allConfigs, selectedLine, searchQuery, productLines]);

  const imageCount = Object.keys(OG_IMAGES).length;
  const pageCount = allConfigs.length;
  const customCount = customConfigs?.length || 0;

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
            <span className="text-sm">OG图片</span>
          </div>
          <p className="text-2xl font-bold text-foreground mt-1">{imageCount}</p>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Sparkles className="h-4 w-4" />
            <span className="text-sm">已自定义</span>
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
          {filteredConfigs.map(({ key, config, customConfig }) => (
            <OGCardPreview 
              key={key} 
              pageKey={key} 
              config={config}
              customConfig={customConfig}
            />
          ))}
        </div>
      )}
    </div>
  );
}
