

## 两个功能：帖子可见性设置 + 评论回复

### 功能一：帖子可见性（隐私）设置

数据库已有 `visibility` 字段（text 类型，默认 `public`）。需要扩展支持三种可见性级别：

- **public** — 所有人可见（现有默认值）
- **followers_only** — 仅关注我的人可见
- **private** — 仅自己可见

#### 改动范围

**1. 发布器 `PostComposer.tsx`**
- 在"匿名分享"开关上方增加可见性选择器（三个选项按钮：公开 / 仅关注者 / 仅自己）
- 将选中的值写入 `visibility` 字段

**2. 编辑器 `PostEditDialog.tsx`**
- 同样增加可见性选择器，允许发布后修改可见性

**3. 其他发布入口**
- `CampShareDialog.tsx` 和 `BriefingShareDialog.tsx` — 增加同样的可见性选项
- `StoryCoach.tsx` — 故事发布时增加可见性选项

**4. 帖子查询过滤**（核心逻辑）
- `CommunityWaterfall.tsx` — 加载帖子后过滤：显示 public 帖子 + 自己的所有帖子 + followers_only 帖子（如果当前用户关注了作者）
- `Community.tsx`、`CommunityDiscover.tsx` — 同样增加可见性过滤
- `UserProfile.tsx` — 查看他人主页时过滤私密帖子

**5. 数据库层**
- 创建一个数据库函数 `get_visible_posts` 处理可见性判断（基于 `user_follows` 表），避免前端多次查询
- 更新 RLS 策略：SELECT 策略增加可见性判断

**6. UI 展示**
- 在帖子卡片或详情页显示锁/眼睛图标标识非公开帖子

---

### 功能二：评论回复（嵌套评论）

数据库 `post_comments` 表已有 `parent_id` 字段（外键引用自身），支持嵌套评论的基础设施已就绪。

#### 改动范围

**1. `CommentSection.tsx`**
- 加载评论时，分两层加载：先加载顶级评论（`parent_id IS NULL`，已实现），再对每条顶级评论加载子评论
- 展示子评论时缩进显示，并标注"回复 @用户名"
- 每条评论增加"回复"按钮

**2. `PostDetailSheet.tsx`**
- 底部评论输入框支持"回复模式"：点击某条评论的"回复"按钮后，输入框显示"回复 @用户名"提示
- 发送时将 `parent_id` 设置为被回复评论的 ID
- 点击取消可退出回复模式

**3. 通知增强**
- 回复评论时，同时通知被回复者（除自回复外）

---

### 技术细节

```text
数据库变更：
+------------------------------------------+
| RLS 策略更新：community_posts SELECT      |
| 条件：                                    |
|   visibility = 'public'                   |
|   OR user_id = auth.uid()                 |
|   OR (visibility = 'followers_only'       |
|       AND EXISTS(select 1 from            |
|       user_follows where                  |
|       follower_id = auth.uid()            |
|       AND following_id = user_id))        |
+------------------------------------------+

新建数据库函数：
  get_visible_posts_for_user(uid) 
  — 返回对该用户可见的帖子
+------------------------------------------+
```

涉及修改的文件清单：
- `src/components/community/PostComposer.tsx` — 增加可见性选择
- `src/components/community/PostEditDialog.tsx` — 编辑时修改可见性
- `src/components/community/CommentSection.tsx` — 嵌套评论展示 + 回复按钮
- `src/components/community/PostDetailSheet.tsx` — 回复模式输入
- `src/components/community/CommunityWaterfall.tsx` — 可见性过滤
- `src/components/community/WaterfallPostCard.tsx` — 可见性图标
- `src/components/camp/CampShareDialog.tsx` — 增加可见性选择
- `src/components/briefing/BriefingShareDialog.tsx` — 增加可见性选择
- `src/pages/Community.tsx` — 查询过滤
- `src/pages/CommunityDiscover.tsx` — 查询过滤
- `src/pages/StoryCoach.tsx` — 增加可见性选择
- `src/pages/UserProfile.tsx` — 他人主页过滤
- 数据库迁移：更新 RLS 策略

