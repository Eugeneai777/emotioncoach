

## 修复：财富教练主页社区与有劲社区显示不一致

### 问题根因

财富教练主页和有劲社区（`/community`）都使用同一个 `CommunityWaterfall` 组件，但每次组件挂载时都是独立的实例，各自重新加载数据。差异来自 **推荐系统的随机性**：

1. `recommend-posts` 边缘函数每次调用可能返回不同的推荐帖子列表
2. `sessionStorage` 缓存只有 2 分钟有效期，两个页面前后访问时缓存可能已过期
3. 缓存过期后重新调用推荐函数，得到不同结果，导致两个页面显示不同帖子

```text
访问有劲社区 --> 调用推荐 --> 缓存结果A --> 显示帖子集A
  (2分钟后)
访问财富教练 --> 缓存过期 --> 重新推荐 --> 缓存结果B --> 显示帖子集B（不同！）
```

### 修复方案

将推荐缓存时间延长，并且在教练空间内嵌社区中跳过推荐逻辑，统一按时间排序显示，确保与主社区非推荐模式一致。

**文件：`src/components/coach/CoachCommunity.tsx`**

给 `CommunityWaterfall` 传入一个新 prop `disableRecommendation={true}`，让教练主页内嵌的社区瀑布流不走推荐，直接按时间排序：

```typescript
import CommunityWaterfall from "@/components/community/CommunityWaterfall";

export const CoachCommunity = () => {
  return (
    <div className="w-full animate-in fade-in-50 slide-in-from-bottom-4 duration-500">
      <CommunityWaterfall disableRecommendation />
    </div>
  );
};
```

**文件：`src/components/community/CommunityWaterfall.tsx`**

1. 组件增加可选 prop `disableRecommendation?: boolean`
2. 在 `loadPosts` 的"发现"分支中，当 `disableRecommendation` 为 `true` 时，跳过推荐逻辑，直接使用时间排序查询（与非推荐模式相同）

```typescript
// 组件签名
interface CommunityWaterfallProps {
  disableRecommendation?: boolean;
}

const CommunityWaterfall = ({ disableRecommendation = false }: CommunityWaterfallProps) => {
  // ...
  
  // 在"发现"分支中：
  if (useRecommendation && !disableRecommendation && pageNum === 0 && filter === 'all') {
    // 走推荐逻辑...
  } else {
    // 走时间排序...
  }
};
```

这样确保：
- 主社区页面（`/community`）继续使用推荐算法
- 教练空间内嵌社区统一按时间+置顶排序，与主社区的"非推荐"视图一致
- 两个页面显示相同的帖子顺序，不再有差异

