

# 小红书 MCP Server 架构方案

## 整体架构

```text
┌─────────────────┐     ┌──────────────────────┐     ┌─────────────────────┐
│   前端 React App │────▶│  Edge Function        │────▶│  阿里云服务器        │
│   (管理后台页面)  │     │  xhs-mcp-proxy       │     │  xiaohongshu-mcp    │
│                  │◀────│                      │◀────│  (Go/MCP Server)    │
└─────────────────┘     └──────────────────────┘     └────────┬────────────┘
                                                              │
                                                     Playwright 浏览器
                                                              │
                                                     ┌────────▼────────┐
                                                     │   小红书网页版    │
                                                     └─────────────────┘
```

## 三层设计

### 第一层：阿里云服务器 — MCP Server

在现有阿里云服务器（已部署微信代理的那台）上增加小红书 MCP Server。

**部署方案：**
- 使用 `xpzouying/xiaohongshu-mcp`（Go 版，最成熟）
- 启动后监听 HTTP 端口（如 3001），暴露 MCP Streamable HTTP 协议
- 首次启动需扫码登录小红书，Cookie 持久化到本地

**安全措施：**
- 添加 `X-API-Key` 请求头验证，防止未授权调用
- 仅允许来自 Supabase Edge Function IP 的请求（或通过 API Key 认证）
- 端口 3001 不对公网开放，只通过 Nginx 反向代理 + 路径前缀暴露

**Nginx 配置示例：**
```text
location /xhs-mcp/ {
    proxy_pass http://127.0.0.1:3001/;
    proxy_set_header X-Real-IP $remote_addr;
}
```

访问地址：`http://YOUR_SERVER_IP:3000/xhs-mcp/mcp`

### 第二层：Edge Function — xhs-mcp-proxy

新建 `supabase/functions/xhs-mcp-proxy/index.ts`，作为前端与 MCP Server 之间的安全中间层。

**职责：**
1. 验证前端请求的用户身份（JWT 认证，限管理员角色）
2. 将前端的业务请求翻译为 MCP 协议调用
3. 转发到阿里云 MCP Server，解析响应返回给前端
4. 缓存热门搜索结果到数据库，减少重复抓取

**需要的 Secrets：**
- `XHS_MCP_SERVER_URL`：MCP Server 地址
- `XHS_MCP_API_KEY`：MCP Server 认证密钥

**接口设计：**

| 操作 | 请求体 | 说明 |
|------|--------|------|
| 搜索笔记 | `{ action: "search", keyword: "情绪管理", limit: 20 }` | 按关键词搜索 |
| 获取笔记详情 | `{ action: "detail", note_id: "xxx" }` | 获取单篇笔记内容+数据 |
| 批量分析 | `{ action: "analyze", keyword: "心理成长" }` | 搜索+AI 分析爆款规律 |

### 第三层：前端管理页面

在管理后台新增"小红书数据分析"页面。

**功能模块：**
1. **关键词搜索**：输入关键词，展示笔记列表（标题、点赞、收藏、评论数）
2. **数据排行**：按互动量排序，一目了然
3. **AI 分析面板**：调用 Lovable AI 分析爆款共性（标题结构、情绪钩子、话题标签）
4. **收藏夹**：收藏优质笔记，方便后续参考
5. **文案生成**：基于爆款规律，AI 生成适合自身品牌的文案

## 数据库设计

新增两张表：

**xhs_search_cache** — 搜索结果缓存（减少重复抓取）
| 字段 | 类型 | 说明 |
|------|------|------|
| id | uuid | 主键 |
| keyword | text | 搜索关键词 |
| results | jsonb | 搜索结果 JSON |
| cached_at | timestamptz | 缓存时间 |
| expires_at | timestamptz | 过期时间（如 24h） |

**xhs_saved_notes** — 收藏的笔记
| 字段 | 类型 | 说明 |
|------|------|------|
| id | uuid | 主键 |
| user_id | uuid | 操作人 |
| note_id | text | 小红书笔记 ID |
| title | text | 标题 |
| content | text | 内容 |
| author | text | 作者 |
| likes | integer | 点赞数 |
| collects | integer | 收藏数 |
| comments | integer | 评论数 |
| note_url | text | 原始链接 |
| tags | text[] | 标签 |
| ai_analysis | text | AI 分析结论 |
| created_at | timestamptz | 收藏时间 |

## 实施步骤

### 阶段 1：服务器端（用户自行操作）

1. SSH 登录阿里云服务器
2. 安装 Go 运行环境 + Playwright
3. 克隆 `xpzouying/xiaohongshu-mcp`，编译运行
4. 扫码登录小红书（Cookie 会自动保存）
5. 配置 Nginx 反向代理 + API Key 认证
6. 用 PM2 或 systemd 管理进程

### 阶段 2：后端对接（Lovable 实现）

1. 添加 `XHS_MCP_SERVER_URL` 和 `XHS_MCP_API_KEY` 两个 Secret
2. 创建数据库表 `xhs_search_cache` + `xhs_saved_notes`
3. 创建 Edge Function `xhs-mcp-proxy`
4. 实现搜索、详情、分析三个接口

### 阶段 3：前端页面（Lovable 实现）

1. 管理后台新增"小红书分析"入口
2. 搜索面板 + 结果列表 + 数据排序
3. AI 分析面板（调用 Lovable AI）
4. 收藏与文案生成功能

## 风险与注意

| 风险 | 应对 |
|------|------|
| 小红书反爬封号 | 控制请求频率（≤1次/5秒）；只在需要时搜索，结果缓存 24h |
| Cookie 过期 | 服务器端需定期检查登录状态，过期后重新扫码 |
| 数据合规 | 仅内部分析使用，不公开展示抓取内容 |
| 服务器资源 | Playwright 占用约 200-500MB 内存，确认服务器配置足够 |

## 成本评估

| 项目 | 费用 | 说明 |
|------|------|------|
| 服务器 | ¥0（复用现有） | 已有阿里云服务器 |
| MCP Server | 免费 | 开源项目 |
| Edge Function | 包含在 Lovable Cloud | 无额外费用 |
| AI 分析 | 包含在 Lovable AI | 使用 Gemini/GPT |

## 涉及文件（阶段 2-3）

| 文件 | 操作 |
|------|------|
| `supabase/functions/xhs-mcp-proxy/index.ts` | 新建 |
| `supabase/migrations/xxx.sql` | 新建（两张表） |
| `src/pages/admin/XhsAnalysis.tsx` | 新建 |
| `src/components/admin/xhs/*` | 新建（搜索/列表/分析组件） |
| `src/hooks/useXhsSearch.ts` | 新建 |

