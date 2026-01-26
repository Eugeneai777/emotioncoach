import { useState, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search } from 'lucide-react';
import { ShareCardPreviewItem } from '@/components/admin/ShareCardPreviewItem';
import { ShareCardPreviewDialog } from '@/components/admin/ShareCardPreviewDialog';
import {
  shareCardsRegistry,
  getCategoryStats,
  CATEGORY_LABELS,
  type ShareCardRegistryItem,
  type ShareCardCategory,
} from '@/config/shareCardsRegistry';

type FilterCategory = ShareCardCategory | 'all';

export default function ShareCardsAdmin() {
  const [searchQuery, setSearchQuery] = useState('');
  const [category, setCategory] = useState<FilterCategory>('all');
  const [previewItem, setPreviewItem] = useState<ShareCardRegistryItem | null>(null);

  const stats = useMemo(() => getCategoryStats(), []);
  const totalCount = shareCardsRegistry.length;

  const filteredCards = useMemo(() => {
    let result = shareCardsRegistry;

    // 分类筛选
    if (category !== 'all') {
      result = result.filter(item => item.category === category);
    }

    // 搜索筛选
    if (searchQuery.trim()) {
      const lowerQuery = searchQuery.toLowerCase();
      result = result.filter(item =>
        item.title.toLowerCase().includes(lowerQuery) ||
        item.id.toLowerCase().includes(lowerQuery) ||
        item.description?.toLowerCase().includes(lowerQuery)
      );
    }

    return result;
  }, [category, searchQuery]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">分享卡片管理</h1>
        <p className="text-muted-foreground mt-1">
          查看和测试所有 {totalCount} 张分享卡片
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Category Tabs */}
        <Tabs value={category} onValueChange={(v) => setCategory(v as FilterCategory)} className="flex-1">
          <TabsList className="grid grid-cols-5 w-full max-w-lg">
            <TabsTrigger value="all">
              全部 ({totalCount})
            </TabsTrigger>
            <TabsTrigger value="coach">
              {CATEGORY_LABELS.coach} ({stats.coach})
            </TabsTrigger>
            <TabsTrigger value="tool">
              {CATEGORY_LABELS.tool} ({stats.tool})
            </TabsTrigger>
            <TabsTrigger value="partner">
              {CATEGORY_LABELS.partner} ({stats.partner})
            </TabsTrigger>
            <TabsTrigger value="result">
              {CATEGORY_LABELS.result} ({stats.result})
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Search */}
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="搜索卡片..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Cards Grid */}
      {filteredCards.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredCards.map((item) => (
            <ShareCardPreviewItem
              key={item.id}
              item={item}
              onPreview={() => setPreviewItem(item)}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-muted-foreground">
          <p>未找到匹配的卡片</p>
          <p className="text-sm mt-1">尝试调整筛选条件</p>
        </div>
      )}

      {/* Preview Dialog */}
      <ShareCardPreviewDialog
        open={!!previewItem}
        onOpenChange={(open) => !open && setPreviewItem(null)}
        item={previewItem}
      />
    </div>
  );
}
