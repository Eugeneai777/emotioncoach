

## 在 OG 分享监控中增加用户分享记录

### 需求理解

当前 `monitor_og_health` 表只记录**异常**（图片加载失败、配置缺失等），不记录用户实际触发分享的行为。需要增加 `share_action` 类型，记录每次用户点击分享的事件，用于统计分享频率、热门页面和用户行为分析。

### 实现方案

#### 1. 数据库：复用现有 `monitor_og_health` 表

无需新建表。新增一个 `issue_type = 'share_action'`，severity 设为 `info`。现有 RLS 已允许 `anon` 和 `authenticated` INSERT，无需修改。

表的现有字段完全满足需求：
- `page_key` / `page_path` → 分享的页面
- `user_id` → 谁分享的
- `platform` → 分享环境（微信/iOS/Android）
- `extra` → 存放分享方式（webshare/preview/download）、分享内容类型等

#### 2. 前端：在 `shareUtils.ts` 的 `handleShareWithFallback` 中埋点

在分享操作完成后，调用 `ogHealthReporter.ts` 新增的 `reportShareAction()` 上报一条记录。包含：
- `page_key`：当前路由路径作为 key
- `page_path`：`window.location.pathname`
- `method`：webshare / preview / download
- `platform`：自动检测
- `extra`：分享标题、文件名等

#### 3. 管理后台：`OGHealthMonitor.tsx` 增加分享记录展示

- 在 `ISSUE_TYPE_CONFIG` 中添加 `share_action` 类型配置
- 统计卡片新增"分享次数"卡片
- 事件列表中自然展示分享记录（绿色图标区分）

### 修改文件清单

| 文件 | 改动 |
|------|------|
| `src/lib/ogHealthReporter.ts` | 新增 `reportShareAction()` 函数 |
| `src/utils/shareUtils.ts` | 在 `handleShareWithFallback` 返回前调用上报 |
| `src/components/admin/OGHealthMonitor.tsx` | 添加 `share_action` 类型配置和统计卡片 |

无需数据库迁移，复用现有表和 RLS 策略。

