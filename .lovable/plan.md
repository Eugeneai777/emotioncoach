
# 隐藏成长路径页面的价格和佣金信息

## 需要修改的内容

根据截图，需要移除以下显示的价格和佣金信息：

| 位置 | 当前显示 | 操作 |
|------|----------|------|
| 组合测评卡片 | ¥9.9 | 移除 |
| 21天训练营卡片 | ¥299 | 移除 |
| 365会员卡片 | ¥365 | 移除 |
| 有劲合伙人横幅 | ¥999起 + 佣金20%-50% | 移除 |

## 修改方案

### 1. 移除节点卡片中的价格显示

**文件：`src/components/growth/GrowthNodeCard.tsx`**

删除第117-121行的价格 Badge 渲染：

```typescript
// 删除以下代码：
{node.price && (
  <Badge variant="outline" className="text-xs">
    {node.price}
  </Badge>
)}
```

### 2. 移除合伙人横幅中的价格和佣金

**文件：`src/components/growth/GrowthPathVisualization.tsx`**

删除第165-169行的价格和佣金区域：

```typescript
// 删除以下代码：
<div className="text-right flex-shrink-0">
  <Badge className="bg-background/80 text-foreground hover:bg-background">
    ¥999起
  </Badge>
  <p className="text-xs text-muted-foreground mt-1">佣金20%-50%</p>
</div>
```

## 修改清单

| 文件 | 修改内容 |
|------|----------|
| `src/components/growth/GrowthNodeCard.tsx` | 移除价格 Badge 渲染代码 |
| `src/components/growth/GrowthPathVisualization.tsx` | 移除合伙人横幅的价格和佣金显示 |

## 预期效果

- 成长路径页面不再显示任何价格信息
- 合伙人横幅不再显示 "¥999起" 和 "佣金20%-50%"
- 页面布局保持整洁，用户点击后在详情页再看到具体价格
