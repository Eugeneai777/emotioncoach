

# 统一套餐卡片规格方案

## 问题分析

从截图可见，两个卡片高度不同的原因：

| 卡片 | 功能点数量 | 额外元素 |
|------|-----------|---------|
| 尝鲜会员 | 4 个 | 价格下方有"⚠️ 限购一次"提示 |
| 365会员 | 3 个 | 无额外提示 |

## 解决方案

### 方案：使用 Flexbox 拉伸 + 固定功能区高度

通过 CSS Flexbox 让两张卡片自动等高，并将按钮固定在底部。

### 具体改动

**文件**：`src/components/PackageSelector.tsx`

1. **统一功能点数量**
   - 移除 features 数组中的"⚠️ 限购一次"（因为已在价格下方单独显示）
   - 为 365会员添加一个占位功能点，使两边数量相同

2. **卡片结构优化**
   ```text
   Card (h-full flex flex-col)
   ├── CardHeader (固定高度区域)
   │   ├── 标题 + 图标 + 徽章
   │   ├── 价格
   │   └── 配额信息 + 限购提示（固定高度，无内容时保留空间）
   ├── CardContent (flex-1 flex flex-col)
   │   ├── 功能列表 (flex-1，自动填充)
   │   └── 按钮 (mt-auto，始终在底部)
   ```

3. **CSS 改动**
   - 外层卡片：`h-full flex flex-col`
   - CardContent：`flex-1 flex flex-col`
   - 功能列表：`flex-1`
   - 按钮：`mt-auto`

---

## 改动文件

| 文件 | 改动说明 |
|------|----------|
| `src/components/PackageSelector.tsx` | 调整卡片布局为等高 flex 结构 |

---

## 技术细节

```typescript
// packageConfig 调整
const packageConfig = [
  {
    key: "basic",
    features: ["AI对话体验", "基础功能", "365天有效"],  // 移除重复的限购提示
  },
  {
    key: "member365",
    features: ["AI对话无限使用", "全部高级功能", "365天有效期"],
  },
];

// 卡片结构
<Card className={`h-full flex flex-col ${pkg.popular ? "border-primary" : ""}`}>
  <CardHeader className="space-y-3">
    {/* 标题、价格等保持不变 */}
    {/* 限购提示保留，但添加固定高度容器 */}
    <div className="h-5">
      {pkg.limitPurchase && !pkg.isPurchased && (
        <div className="text-xs text-amber-600">⚠️ 限购一次</div>
      )}
    </div>
  </CardHeader>
  <CardContent className="flex-1 flex flex-col space-y-4">
    <ul className="flex-1 space-y-2">
      {/* 功能列表 */}
    </ul>
    <Button className="w-full mt-auto">
      {/* 按钮始终在底部 */}
    </Button>
  </CardContent>
</Card>
```

---

## 预期效果

- 两张卡片始终等高
- 按钮始终对齐在底部
- 功能列表区域自动适应
- 限购提示不再影响布局

