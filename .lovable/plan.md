# Phase 4 第一步:轻量行为埋点(只建表 + 路由浏览)

## 目标
开始静默累计用户访问行为数据,为下一步 AI 个性化洞察升级提供数据基础。**不改任何现有支付/认证/测评/订单逻辑**,埋点失败全部静默吞掉。

## 范围
- 新建数据库表 `user_behavior_signals`(纯追加日志)
- 新增前端埋点 SDK
- 在 `App.tsx` 挂一个路由监听组件,自动记录 `page_view`
- 不接入按钮/卡片点击事件
- 不改 AI 洞察 prompt
- 无任何 UI 变化,用户/游客无感知

---

## 1. 数据库迁移

新建表 `public.user_behavior_signals`:

| 字段 | 类型 | 说明 |
|---|---|---|
| `id` | uuid PK | 主键 |
| `user_id` | uuid (nullable, FK auth.users) | 游客可为 null |
| `session_id` | text | 浏览器 sessionStorage 生成 |
| `event_type` | text | 本期固定 `page_view` |
| `path` | text | 路由 pathname(不含 query) |
| `referrer` | text (nullable) | 上一个 pathname |
| `metadata` | jsonb default `{}` | 预留扩展 |
| `created_at` | timestamptz default now() | 时间戳 |

**索引**:`(user_id, created_at desc)`、`(path, created_at desc)`、`(session_id, created_at desc)`

**RLS 策略**:
- INSERT(public 含匿名):`user_id IS NULL OR user_id = auth.uid()`
- SELECT(authenticated):`user_id = auth.uid()` 或 `has_role(auth.uid(),'admin')`
- 无 UPDATE / DELETE 策略 → 数据仅追加,任何人改不动

## 2. 前端埋点 SDK

新增 `src/lib/behaviorTracker.ts`:
- 导出 `trackPageView(path, referrer?)`
- 自动从 `supabase.auth.getUser()` 拿 user_id(未登录传 null)
- session_id 从 `sessionStorage.ubs_session_id` 读,不存在则生成 UUID 写入
- 节流:同一 path 2 秒内只发一次(防 React StrictMode 双调)
- 全程 try/catch + `.catch(()=>{})`,任何失败都静默

## 3. 路由监听组件

新增 `src/components/system/RouteTracker.tsx`:
- `useLocation()` 监听 pathname 变化
- 变化时调用 `trackPageView(pathname, prevPathname)`
- 返回 null,无任何渲染

在 `src/App.tsx` 中 `<BrowserRouter>` 内、`<ScrollUnlocker />` 旁边挂一行 `<RouteTracker />`。

---

## 改动清单
- 新建迁移:`supabase/migrations/<timestamp>_user_behavior_signals.sql`
- 新建文件:`src/lib/behaviorTracker.ts`
- 新建文件:`src/components/system/RouteTracker.tsx`
- 修改文件:`src/App.tsx`(只加 1 行 import + 1 行组件挂载)

## 风险评估
- ✅ 不触碰 orders / profiles / partner_assessment_results / 任何 edge function
- ✅ 表是全新的,任何写入失败都不影响业务
- ✅ 客户端 catch 全部静默,即使 Supabase 暂时不可用 UI 也不会卡
- ✅ 路由组件零渲染,不会触发额外 re-render
- ✅ 节流防止 StrictMode 重复写入

## 上线后效果
- 数据库 `user_behavior_signals` 开始累积每个 user/游客的页面访问轨迹
- 2 周后可基于该表做"用户兴趣类目"画像,作为 Phase 4 第二步的输入
- 用户/游客无任何感知,无 UI 变化,无性能负担

确认后切换到执行模式,我开始实施这 4 处改动。
