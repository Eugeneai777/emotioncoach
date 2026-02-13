

# 社区动态置顶与管理功能

## 概述
为管理员增加社区动态(帖子)的置顶和删除能力，包括数据库字段扩展、管理后台界面、以及社区前端展示置顶帖的逻辑。

---

## 1. 数据库变更

在 `community_posts` 表新增两个字段：

- `is_pinned` (boolean, 默认 false) -- 是否置顶
- `pinned_at` (timestamp, 可空) -- 置顶时间，用于多条置顶帖排序

---

## 2. 新增管理后台页面：社区动态管理

在"内容管理"菜单组下新增 **"社区动态"** 菜单项，路由 `/admin/community-posts`。

页面功能：
- **帖子列表表格**：显示标题/内容摘要、作者、类型、发布时间、点赞数、评论数、置顶状态
- **筛选**：按类型(story/checkin等)、置顶状态筛选
- **操作按钮**：
  - **置顶 / 取消置顶**：切换 `is_pinned` 和 `pinned_at`
  - **删除帖子**：确认弹窗后删除
- 置顶帖用醒目标记(如图钉图标 + 背景色)区分

---

## 3. 社区前端适配

修改 `src/pages/Community.tsx` 中的查询逻辑：
- 查询时按 `is_pinned DESC, pinned_at DESC NULLS LAST, created_at DESC` 排序
- 置顶帖在瀑布流顶部展示，卡片上显示"置顶"角标

修改 `src/components/community/WaterfallPostCard.tsx`：
- 当 `is_pinned === true` 时，卡片左上角显示小图钉标记

---

## 技术细节

### 涉及文件

| 操作 | 文件 |
|------|------|
| 数据库迁移 | 新增 `is_pinned`, `pinned_at` 字段 |
| 新建 | `src/components/admin/CommunityPostsManagement.tsx` |
| 编辑 | `src/components/admin/AdminSidebar.tsx` (加菜单) |
| 编辑 | `src/pages/Admin.tsx` (加路由) |
| 编辑 | `src/pages/Community.tsx` (排序逻辑) |
| 编辑 | `src/components/community/WaterfallPostCard.tsx` (置顶角标) |

### 管理组件核心逻辑

```text
CommunityPostsManagement
  +-- 搜索框 + 筛选(类型/置顶状态)
  +-- Table
  |     +-- 内容摘要 | 作者 | 类型 | 点赞 | 评论 | 置顶状态 | 操作
  |     +-- 操作: [置顶/取消置顶] [删除]
  +-- 删除确认 AlertDialog
```

### 置顶/取消置顶 SQL 逻辑

```text
置顶: UPDATE community_posts SET is_pinned = true, pinned_at = now() WHERE id = ?
取消: UPDATE community_posts SET is_pinned = false, pinned_at = null WHERE id = ?
```

### 社区查询排序调整

```text
.order('is_pinned', { ascending: false })
.order('pinned_at', { ascending: false, nullsFirst: false })
.order('created_at', { ascending: false })
```

