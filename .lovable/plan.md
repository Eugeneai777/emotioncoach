

# 修复产品组合包与商城商品内容不同步的问题

## 问题根因

产品组合包的文案数据存在两份：

```text
组合包定义 (partners.custom_product_packages)
  └── ai_content: { target_audience, pain_points, solution, expected_results }
  └── 管理后台编辑/AI润色后会更新

商城商品 (health_store_products.description)
  └── 纯文本，用 ### 分隔的4个板块
  └── 仅在首次"上架到商城"时写入，之后不再同步
```

编辑组合包文案后，商城商品仍然显示旧内容，因为没有同步更新已上架商品的 description。

## 修改方案

修改 **1 个文件**：`src/components/admin/industry-partners/PartnerProductBundles.tsx`

### 方案：保存组合包时自动同步已上架商品

在 `handleSave` 函数中，如果该组合包已有 `published_product_id`（说明已上架），则在保存组合包的同时，用最新的 `ai_content` 重新构建 description 并更新对应的商城商品。

### 技术细节

1. 将 `BundlePublishPreview` 中的 `buildDescription` 和 `normalizeContent` 逻辑提取为共享工具函数，避免重复代码。

2. 在 `handleSave`（约第 222 行）中增加同步逻辑：

```typescript
const handleSave = async () => {
  // ... 现有的保存逻辑 ...

  // 如果已上架，同步更新商城商品的 description、名称和价格
  const existingPublishedId = editingId
    ? bundles.find(b => b.id === editingId)?.published_product_id
    : null;

  if (existingPublishedId && aiContent) {
    const description = buildBundleDescription(aiContent);
    await supabase
      .from("health_store_products")
      .update({
        product_name: bundleName.trim(),
        description,
        price: totalPrice,
        original_price: Math.round(totalPrice * 1.3),
      })
      .eq("id", existingPublishedId);
  }
};
```

3. 提取共享函数 `buildBundleDescription`：

```typescript
function normalizeContent(text: string): string {
  if (!text || text.includes('✅') || text.includes('\n')) return text;
  const sentences = text.split(/[。！？]/).map(s => s.trim()).filter(s => s.length > 0);
  if (sentences.length <= 1) return text;
  return sentences.map(s => '✅ ' + s).join('\n');
}

function buildBundleDescription(aiContent: ProductBundle['ai_content']): string {
  if (!aiContent) return '';
  const sections = [
    aiContent.target_audience && '### 适合谁\n' + normalizeContent(aiContent.target_audience),
    aiContent.pain_points && '### 解决什么问题\n' + normalizeContent(aiContent.pain_points),
    aiContent.solution && '### 我们如何帮你\n' + normalizeContent(aiContent.solution),
    aiContent.expected_results && '### 你将收获\n' + normalizeContent(aiContent.expected_results),
  ].filter(Boolean);
  return sections.join('\n\n');
}
```

4. 同时更新 `BundlePublishPreview.tsx` 中的 `buildDescription` 方法，改为调用同一个共享函数，确保格式一致。

## 效果

- 编辑组合包文案并保存后，已上架的商城商品会自动同步更新
- 名称、价格、文案三者保持一致
- 无需手动下架再重新上架
