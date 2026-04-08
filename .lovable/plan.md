

# 小红书全链路内容营销自动化系统

## 现有基础

已有：搜索笔记、收藏笔记、MCP 代理 Edge Function（`xhs-mcp-proxy`）、数据库缓存表。

需新增：AI 内容生成、自动发布、自动评论、数据追踪四大模块。

## 架构总览

```text
┌─────────────────────────────────────────────────────┐
│                  管理后台 UI                         │
│  搜索分析 │ AI生成 │ 发布管理 │ 自动评论 │ 数据追踪  │
└──────┬──────────────────────────────────────────────┘
       │
┌──────▼──────────────────┐     ┌────────────────────┐
│  xhs-mcp-proxy          │────▶│  阿里云 MCP Server  │
│  + publish / comment    │     │  create_note        │
│  + AI content gen       │     │  comment_note       │
│  (Edge Function)        │     │  search_notes       │
└─────────────────────────┘     └────────────────────┘
       │
┌──────▼──────────────────┐
│  xhs-content-generator  │  ← Lovable AI 生成文案+图片描述
│  (新 Edge Function)     │
└─────────────────────────┘
```

## 数据库新增 3 张表

**xhs_content_tasks** — 内容生成与发布任务

| 字段 | 类型 | 说明 |
|------|------|------|
| id | uuid | 主键 |
| user_id | uuid | 创建人 |
| status | text | draft / generating / ready / publishing / published / failed |
| topic | text | 主题关键词（如"情绪管理"） |
| target_audience | text | 目标人群 |
| ai_title | text | AI 生成标题 |
| ai_content | text | AI 生成正文 |
| ai_tags | text[] | AI 生成标签 |
| ai_image_prompts | jsonb | AI 生成的配图描述 |
| image_urls | text[] | 已生成/上传的图片 URL |
| published_note_id | text | 发布后的小红书笔记 ID |
| published_at | timestamptz | 发布时间 |
| schedule_at | timestamptz | 定时发布时间（NULL=手动） |
| created_at | timestamptz | 创建时间 |

**xhs_auto_comments** — 自动评论任务

| 字段 | 类型 | 说明 |
|------|------|------|
| id | uuid | 主键 |
| target_note_id | text | 目标笔记 ID |
| target_title | text | 目标笔记标题 |
| comment_text | text | 评论内容 |
| status | text | pending / sent / failed |
| sent_at | timestamptz | 发送时间 |
| error_message | text | 错误信息 |
| created_at | timestamptz | 创建时间 |

**xhs_performance_tracking** — 发布内容数据追踪

| 字段 | 类型 | 说明 |
|------|------|------|
| id | uuid | 主键 |
| content_task_id | uuid | 关联内容任务 |
| note_id | text | 小红书笔记 ID |
| likes | integer | 点赞数 |
| collects | integer | 收藏数 |
| comments | integer | 评论数 |
| tracked_at | timestamptz | 采集时间 |

## Edge Function 扩展

### 1. `xhs-content-generator`（新建）

用 Lovable AI 生成小红书风格图文内容：
- 输入：主题 + 目标人群 + 风格偏好
- 输出：标题（含 emoji 钩子）、正文（分段+标签）、配图描述、推荐标签
- 用 `google/gemini-3-flash-preview` 生成

### 2. `xhs-mcp-proxy` 扩展 3 个 action

- **`publish`**：调用 MCP `create_note` 发布图文笔记
- **`comment`**：调用 MCP `comment_note` 发表评论（带 5 秒最小间隔）
- **`track`**：调用 MCP `get_note` 获取最新数据，写入 tracking 表

## 前端新增 4 个 Tab 页

在现有 `XhsAnalysis.tsx` 的 Tabs 中增加：

1. **AI 生成**（`XhsContentCreator`）
   - 输入主题/人群 → AI 生成标题+正文+标签
   - 预览编辑 → 可手动修改
   - 一键发布 / 定时发布

2. **发布管理**（`XhsPublishManager`）
   - 任务列表：状态筛选（草稿/已发布/失败）
   - 查看已发布笔记的数据表现

3. **自动评论**（`XhsAutoComment`）
   - 从搜索结果中选择笔记 → AI 生成评论
   - 批量评论队列（间隔 ≥ 5 秒，防封号）
   - 评论历史记录

4. **数据追踪**（`XhsPerformanceTracker`）
   - 已发布内容的点赞/收藏/评论趋势
   - 对比不同主题的表现

## 安全与风控

- 发布/评论频率限制：≤ 1 次/5 秒，每日上限可配置
- 所有操作仅限 admin 角色
- 评论内容 AI 生成后需人工确认（可选跳过）

## 涉及文件

| 文件 | 操作 |
|------|------|
| `supabase/migrations/xxx.sql` | 新建 3 张表 |
| `supabase/functions/xhs-content-generator/index.ts` | 新建 |
| `supabase/functions/xhs-mcp-proxy/index.ts` | 扩展 publish/comment/track |
| `src/components/admin/xhs/XhsAnalysis.tsx` | 增加 4 个 Tab |
| `src/components/admin/xhs/XhsContentCreator.tsx` | 新建 |
| `src/components/admin/xhs/XhsPublishManager.tsx` | 新建 |
| `src/components/admin/xhs/XhsAutoComment.tsx` | 新建 |
| `src/components/admin/xhs/XhsPerformanceTracker.tsx` | 新建 |
| `src/hooks/useXhsSearch.ts` | 扩展发布/评论/追踪方法 |

## 前提条件

MCP Server 需已部署且支持 `create_note`、`comment_note` 工具。如未部署，系统会在 UI 中提示配置状态。

