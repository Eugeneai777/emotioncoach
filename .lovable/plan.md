

## 优化 /partner-intro 页面设计排版

### 问题分析

根据用户反馈：
1. **不要使用双排设计** - 需要改回单列布局
2. **有劲合伙人权益应作为价值卡片** - 有劲初级合伙人价格是 ¥792，应该加入总价值计算

### 当前问题

| 问题 | 当前状态 | 需修改 |
|:-----|:---------|:-------|
| 布局 | 双列 `grid-cols-2` | 改为单列 |
| 有劲权益价值 | `benefit_value = 0` | 更新为 ¥792 |
| 总价值 | ¥46,560（不含有劲） | ¥47,352（含有劲 ¥792） |

---

### 实施方案

#### 1. 数据库更新 - 有劲权益价值

将"有劲产品推广权益"的 `benefit_value` 从 0 更新为 792：

```sql
UPDATE partner_benefits 
SET benefit_value = 792.00,
    benefit_description = '自动获得有劲初级合伙人身份（价值¥792），有劲全产品18%一级佣金'
WHERE benefit_name = '有劲产品推广权益';
```

#### 2. 布局优化 - 改为单列

将权益卡片从双列改回单列布局，保持左右结构（图标+内容）：

```tsx
// 改动前
<div className="grid grid-cols-2 gap-3">

// 改动后 - 单列布局
<div className="space-y-3">
  {benefits.map(benefit => (
    <Card className="border border-accent/20 rounded-xl">
      <CardContent className="p-4">
        <div className="flex items-center gap-4">
          {/* 图标 */}
          <div className="text-3xl flex-shrink-0">{benefit.benefit_icon}</div>
          <div className="flex-1 min-w-0">
            {/* 名称 + 价格徽章（同一行） */}
            <div className="flex items-center gap-2 flex-wrap">
              <div className="font-semibold text-sm">{benefit.benefit_name}</div>
              {Number(benefit.benefit_value) > 0 && (
                <Badge variant="outline" className="text-xs">
                  ¥{Number(benefit.benefit_value).toLocaleString()}
                </Badge>
              )}
            </div>
            {/* 描述 */}
            <p className="text-xs text-muted-foreground mt-1">
              {benefit.benefit_description}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  ))}
</div>
```

#### 3. 有劲权益卡片特殊样式

保留橙色主题和点击跳转交互：

```tsx
const isYoujinBenefit = benefit.benefit_name === '有劲产品推广权益';

<Card 
  className={cn(
    "border border-accent/20 rounded-xl",
    isYoujinBenefit && "border-orange-200 bg-gradient-to-br from-orange-50 to-amber-50 cursor-pointer hover:shadow-md"
  )}
  onClick={isYoujinBenefit ? () => navigate("/partner/youjin-plan") : undefined}
>
```

---

### 涉及文件

| 操作 | 文件/表 | 修改内容 |
|:-----|:--------|:---------|
| UPDATE | 数据库 `partner_benefits` | 更新有劲权益价值为 ¥792 |
| 修改 | `src/pages/PartnerIntro.tsx` | 单列布局，保留有劲权益特殊样式 |

---

### 预期效果

1. **布局改进**：
   - 单列布局，每个权益卡片一行
   - 左侧图标 + 右侧名称/价格/描述

2. **价值计算**：
   - 有劲权益显示 ¥792 价格徽章
   - 总价值从 ¥46,560 更新为 ¥47,352

3. **交互保留**：
   - 有劲权益卡片橙色主题
   - 点击可跳转了解详情

