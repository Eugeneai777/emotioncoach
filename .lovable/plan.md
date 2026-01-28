
# 让产品中心显示全部训练营

## 问题
产品中心 (`/packages`) 页面的"有劲训练营"和"绽放训练营"tab 都是硬编码的静态内容，没有从数据库动态获取全部训练营。

### 当前状态
- `/packages` 的"有劲训练营"只显示一个固定的"财富觉醒训练营"
- 数据库中"有劲训练营"有3个：情绪日记、青少年困境突破、财富觉醒
- 数据库中"绽放训练营"有2个：身份绽放、情感绽放

### 对比
- `/camp-list` 页面正确地从数据库获取并展示所有训练营
- `/packages` 页面使用硬编码内容

## 解决方案

将"有劲训练营"和"绽放训练营"tab 改为动态从 `camp_templates` 表获取训练营列表。

## 技术实现

### 修改文件：`src/components/ProductComparisonTable.tsx`

#### 1. 添加训练营数据查询

```typescript
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

// 在组件内添加查询
const { data: campTemplates } = useQuery({
  queryKey: ['camp-templates-for-packages'],
  queryFn: async () => {
    const { data, error } = await supabase
      .from('camp_templates')
      .select('*')
      .eq('is_active', true)
      .order('display_order');
    if (error) throw error;
    return data;
  },
  enabled: category === 'youjin-camp' || category === 'bloom-camp',
});
```

#### 2. 修改"有劲训练营"渲染逻辑（第350-400行）

**改为：**
- 筛选 `category === 'youjin'` 的训练营
- 循环渲染每个训练营卡片
- 使用数据库中的 `camp_name`、`price`、`benefits` 等字段

```typescript
if (category === 'youjin-camp') {
  const youjinCamps = campTemplates?.filter(c => (c.category || 'youjin') === 'youjin') || [];
  
  return (
    <div className="space-y-3">
      {youjinCamps.length === 0 ? (
        <p className="text-center text-muted-foreground py-8">暂无训练营</p>
      ) : (
        youjinCamps.map(camp => (
          <MobileCard key={camp.id} className="...">
            <span>{camp.icon}</span>
            <h3>{camp.camp_name}</h3>
            <p>{camp.camp_subtitle}</p>
            <div>¥{camp.price}</div>
            <Button onClick={() => handlePurchase({...})}>立即报名</Button>
          </MobileCard>
        ))
      )}
    </div>
  );
}
```

#### 3. 同样修改"绽放训练营"渲染逻辑

筛选 `category === 'bloom'` 的训练营，使用相同的动态渲染模式。

### 格式化价格

复用已有的 `formatMoney` 函数确保价格显示一致：
```typescript
function formatMoney(value: number | null | undefined): string {
  const num = Number(value) || 0;
  return new Intl.NumberFormat('zh-CN', { maximumFractionDigits: 2 }).format(num);
}
```

## 预期效果

| 页面 | 当前显示 | 修改后 |
|:-----|:---------|:-------|
| /packages 有劲训练营 | 仅"财富觉醒训练营" | 情绪日记 + 青少年困境突破 + 财富觉醒 (3个) |
| /packages 绽放训练营 | 可能也是硬编码 | 身份绽放 + 情感绽放 (2个) |

## 文件清单

| 文件 | 操作 |
|:-----|:-----|
| src/components/ProductComparisonTable.tsx | 修改：添加训练营数据查询，动态渲染训练营列表 |

## 可选优化

1. 添加加载状态（骨架屏）
2. 添加"了解更多"按钮跳转到详情页
3. 显示报名人数等统计信息
