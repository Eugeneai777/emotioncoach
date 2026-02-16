

## 修复：社区动态在不同页面显示不一致

### 问题根因

经代码分析，发现 `CommunityWaterfall.tsx` 的数据库查询缺少关键字段和排序逻辑：

### 问题 1：查询未包含 `is_pinned`、`pinned_at`、`visibility` 字段

当前的 SELECT 语句（第 204-212 行）：
```
id, user_id, post_type, title, content, image_urls, emotion_theme,
is_anonymous, likes_count, created_at, camp_id
```
缺少了 `is_pinned`、`pinned_at` 和 `visibility`，导致：
- 置顶帖子无法正确标记和显示置顶徽章
- 隐私可见性标识（锁头图标）无法正常展示
- 卡片组件中的 `post.is_pinned` 和 `post.visibility` 始终为 undefined

### 问题 2：没有置顶优先排序

所有查询路径（发现、关注、同频、故事）都只按 `created_at` 降序排序，没有按 `is_pinned DESC, pinned_at DESC` 优先排列。不同时间加载可能因为推荐缓存差异，导致置顶帖子位置不一致。

### 修复方案

**文件：`src/components/community/CommunityWaterfall.tsx`**

#### 修改 1：补充查询字段（第 204-212 行）

在 SELECT 中添加 `is_pinned, pinned_at, visibility`：

```typescript
let query = supabase
  .from('community_posts')
  .select(`
    id, user_id, post_type, title, content, image_urls, emotion_theme,
    is_anonymous, likes_count, created_at, camp_id,
    is_pinned, pinned_at, visibility,
    training_camps!camp_id (
      camp_type,
      camp_name,
      template_id
    )
  `);
```

#### 修改 2：所有排序路径加入置顶优先

在每个 filter 分支的排序逻辑中，将 `.order('created_at', { ascending: false })` 改为先按 `is_pinned` 降序、再按 `pinned_at` 降序、最后按 `created_at` 降序。涉及以下位置：

- 关注筛选（约第 241 行）
- 同频筛选（约第 280 行）
- 故事筛选（约第 293 行）
- 其他类型筛选（约第 300 行）
- 发现-推荐模式（约第 332 行）
- 发现-普通模式（约第 335、339 行）

每处改为：
```typescript
.order('is_pinned', { ascending: false, nullsFirst: false })
.order('pinned_at', { ascending: false, nullsFirst: false })
.order('created_at', { ascending: false })
```

#### 修改 3：Post 接口补充字段

在 Post 接口（第 13-30 行）添加缺失字段：

```typescript
interface Post {
  // ... 现有字段
  is_pinned?: boolean;
  pinned_at?: string;
  visibility?: string;
}
```

这些修改确保所有页面（主页和教练空间）使用同一组件时，都能拿到完整的帖子数据，置顶帖子始终排在最前面，显示结果一致。

