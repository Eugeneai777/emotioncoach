
# 为内容管理员定制专属仪表板

## 概述
为 `content_admin` 角色创建一个专属的内容管理仪表板，展示内容相关的统计数据（社区动态、举报、教练模板、课程等），替代当前直接跳转到社区动态页面的行为。同时优化社区动态管理页面的体验。

---

## 改动内容

### 1. 新建内容管理员仪表板组件

**新文件**: `src/components/admin/ContentAdminDashboard.tsx`

展示以下统计卡片：
- 社区动态总数 / 今日新增
- 置顶帖数量
- 待审核举报数
- 教练模板数量
- 训练营模板数量
- 视频课程数量

下方区域：
- 待处理举报提醒（带跳转链接）
- 最近社区动态列表（最新5条，快速预览）
- 快速操作入口（管理社区动态、查看举报、管理教练模板等）

### 2. 修改路由和侧边栏

**`src/components/admin/AdminLayout.tsx`**
- `content_admin` 访问 `/admin` 时不再重定向，改为显示 `ContentAdminDashboard`
- 为 `content_admin` 注册 index 路由

**`src/components/admin/AdminSidebar.tsx`**
- 在 `content_admin` 的导航分组中增加"概览"入口，指向 `/admin`

### 3. 优化社区动态管理页面

**`src/components/admin/CommunityPostsManagement.tsx`**
- 顶部增加统计摘要卡片（总帖数、今日新增、置顶数、总互动量）
- 增加可见性筛选（公开/仅关注者/私密）
- 表格增加可见性列显示

---

## 技术细节

### ContentAdminDashboard 数据查询
使用 `@tanstack/react-query` 分别查询：
- `community_posts`: 总数、今日新增、置顶数
- `post_reports`: 待审核数
- `coach_templates` / `camp_templates` / `video_courses`: 各自总数
- `community_posts` 最近5条：用于"最新动态"列表

### 路由变更
```text
AdminLayout.tsx:
  - 移除 content_admin 的重定向逻辑
  - 添加: <Route index element={<ContentAdminDashboard />} /> (在 content_admin 路由块中)

AdminSidebar.tsx:
  - 概览分组 roles 改为 ['admin', 'content_admin']
  - content_admin 的概览项指向 /admin，label 改为"内容概览"
  - 或新增一个 content_admin 专属概览分组
```

### 社区动态页面优化
在现有表格上方添加4个统计卡片，使用与 AdminDashboard 相同的 StatCard 样式：
- 总帖数
- 今日新增
- 置顶帖数
- 总互动（点赞+评论总和）

增加 visibility 筛选下拉框和表格列。
