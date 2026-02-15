

## 修复：用户发布动态后在社区不显示

### 问题根因

经过代码分析，发现有 **两个核心原因** 导致用户发布的动态在社区不显示：

### 原因 1：推荐缓存遮蔽新帖子

社区"发现"页首次加载时，走的是推荐逻辑（`recommend-posts` 函数），结果会缓存 2 分钟。查询条件是 `.in('id', recommendedIds)`，**只显示推荐列表里的帖子**。用户刚发布的新帖子不在推荐列表中，自然看不到。

```text
用户发帖 --> 查看社区 --> 命中缓存 --> 缓存里没有新帖 --> 看不到
```

### 原因 2：分享简报后没有触发社区刷新

从 `BriefingShareDialog`（简报分享对话框）发布帖子后，没有派发 `post-updated` 事件来通知 `CommunityWaterfall` 组件刷新数据。

### 修复方案

**文件 1：`src/components/briefing/BriefingShareDialog.tsx`**

在分享成功后，派发 `post-updated` 事件并清除推荐缓存：

```typescript
// 分享成功后
toast({ title: "分享成功" });

// 清除推荐缓存，确保社区刷新时能看到新帖
sessionStorage.removeItem('community_recommendation_cache');

// 通知社区组件刷新
window.dispatchEvent(new CustomEvent('post-updated'));
```

**文件 2：`src/components/community/CommunityWaterfall.tsx`**

修改 `loadPosts` 中"发现"页的推荐逻辑，确保始终混入用户自己最新的帖子：

在推荐模式下（第 306-316 行），获取推荐帖子后，额外查询当前用户最近 24 小时内发布的帖子，合并到结果中。这样即使推荐列表没有用户的新帖，用户也能在"发现"页看到自己的内容。

```typescript
// 在推荐结果返回后，补充用户自己最近的帖子
if (session?.user && recommendedIds) {
  const { data: myRecentPosts } = await supabase
    .from('community_posts')
    .select('id')
    .eq('user_id', session.user.id)
    .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
    .order('created_at', { ascending: false })
    .limit(3);

  if (myRecentPosts?.length) {
    const myIds = myRecentPosts.map(p => p.id);
    recommendedIds = [...new Set([...myIds, ...recommendedIds])];
  }
}
```

**文件 3：`src/components/community/PostComposer.tsx`**

在发布成功后同样清除推荐缓存：

```typescript
// 发布成功后
sessionStorage.removeItem('community_recommendation_cache');
```

### 总结

三处修改确保：
1. 发布后立即清除推荐缓存，下次加载获取最新推荐
2. 发布后触发社区刷新事件
3. "发现"页始终包含用户自己最近 24 小时的帖子，不受推荐算法遮蔽

