

## 优化 /partner-intro 页面设计排版

### 问题分析

根据截图参考，当前"专属权益"区块需要优化为更清晰的双列网格布局：
- 每个权益卡片包含：图标、名称、价格徽章、描述
- 视觉层次更清晰：图标居左、名称和价格同行、描述在下方
- 卡片圆角更大，间距更合适

### 当前数据库权益（10项）

| 序号 | 权益名称 | 价值 | 图标 |
|:-----|:---------|:-----|:-----|
| 1 | 身份绽放特训营 | ¥2,980 | 🌟 |
| 2 | 情感绽放特训营 | ¥3,980 | 💝 |
| 3 | 生命绽放特训营 | ¥12,800 | 🔥 |
| 4 | 英雄之旅线下课 | ¥10,000 | 🏆 |
| 5 | 绽放教练认证 | ¥16,800 | 📜 |
| 6 | 专属推广分成 | - | 💰 |
| 7 | 推广物料支持 | - | 🎨 |
| 8 | 合伙人专属社群 | - | 👥 |
| 9 | 优先参与权 | - | ⭐ |
| 10 | 有劲产品推广权益 | - | 💪 |

---

### 实施方案

#### 1. 优化权益卡片布局

**当前样式问题**：
- 卡片布局为单列（`grid-cols-1 md:grid-cols-2`）
- 图标和内容水平排列，不够清晰
- 价格徽章位置不突出

**优化后样式**（参考截图）：
- 始终使用双列布局（`grid-cols-2`）
- 每个卡片内部：
  - 左侧大图标
  - 右侧：名称 + 价格徽章（同一行）
  - 下方：描述文字
- 卡片圆角加大（`rounded-xl`）
- 卡片背景使用浅色渐变

```tsx
<div className="grid grid-cols-2 gap-3">
  {benefits.map(benefit => (
    <Card key={benefit.id} className="border border-accent/20 bg-gradient-to-br from-background to-accent/5 rounded-xl overflow-hidden">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          {/* 大图标 */}
          <div className="text-3xl">{benefit.benefit_icon}</div>
          <div className="flex-1 min-w-0">
            {/* 名称 + 价格徽章 */}
            <div className="flex items-center gap-2 flex-wrap">
              <div className="font-semibold text-sm leading-tight">{benefit.benefit_name}</div>
              {Number(benefit.benefit_value) > 0 && (
                <Badge variant="outline" className="text-xs whitespace-nowrap">
                  ¥{Number(benefit.benefit_value).toLocaleString()}
                </Badge>
              )}
            </div>
            {/* 描述 */}
            {benefit.benefit_description && (
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                {benefit.benefit_description}
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  ))}
</div>
```

#### 2. 调整权益区块标题

将"有劲产品推广权益"从单独卡片整合到权益列表中（数据库已包含），删除独立的有劲权益卡片：

**优化前**：
- 收益机制卡片
- 有劲产品推广卡片（单独）
- 10大专属权益卡片

**优化后**：
- 收益机制卡片
- 10大专属权益卡片（已包含有劲推广权益）

#### 3. 整合有劲权益入口

在权益列表末尾的"有劲产品推广权益"卡片添加点击交互，跳转至有劲计划页面：

```tsx
// 为有劲权益卡片添加 onClick
const isYoujinBenefit = benefit.benefit_name === '有劲产品推广权益';
<Card 
  className={cn(
    "border border-accent/20 bg-gradient-to-br from-background to-accent/5 rounded-xl",
    isYoujinBenefit && "border-orange-200 bg-gradient-to-br from-orange-50 to-amber-50 cursor-pointer hover:shadow-md transition-shadow"
  )}
  onClick={isYoujinBenefit ? () => navigate("/partner/youjin-plan") : undefined}
>
```

---

### 涉及文件

| 文件 | 修改内容 |
|:-----|:---------|
| `src/pages/PartnerIntro.tsx` | 优化权益卡片布局，移除独立有劲权益卡片，整合入权益列表 |

---

### 预期效果

1. **视觉效果**：
   - 双列网格布局，信息密度更高
   - 卡片样式与截图一致（图标 + 标题/价格 + 描述）
   - 有劲权益卡片有橙色主题区分

2. **交互优化**：
   - 点击有劲权益卡片可跳转了解详情
   - 整体页面更紧凑，减少滚动距离

3. **内容整合**：
   - 10项权益统一展示
   - 无冗余卡片

