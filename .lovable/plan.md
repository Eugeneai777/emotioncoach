

# 加速有劲AI语音教练接通

## 当前瓶颈分析

连接流程是严格串行的，每一步都要等上一步完成：

```text
麦克风权限 → getSession → refreshSession → getUser(失败才走) 
→ 扣费(deductQuota) → 获取时长限制(5次DB查询) → 请求Token → 建立WebRTC/WebSocket连接
```

主要耗时点：
1. **refreshSession**：每次都强制刷新，即使 token 未过期（约 200-500ms）
2. **扣费 deductQuota**：调用 Edge Function，等待网络往返（约 300-800ms）
3. **获取时长限制 getMaxDurationForUser**：串行查 5 张表（subscriptions → orders → packages → feature_items → package_feature_settings），约 500-1500ms
4. **请求 Token**：Edge Function 内部再请求 OpenAI/豆包 API（约 500-2000ms）
5. 以上全部串行，总计 2-5 秒以上

## 优化方案

### 1. 并行化：扣费 + 时长查询 + Token 请求同时进行

当前是 `扣费 → 获取token → 建立连接`，改为：

```text
麦克风权限(已有预获取)
    ↓
Session 检查(跳过 refreshSession，改为惰性刷新)
    ↓
┌─────────────────┬────────────────────┬──────────────────┐
│ 扣费(deductQuota)│ 获取时长限制        │ 获取Token(最耗时) │
└─────────────────┴────────────────────┴──────────────────┘
    ↓ 全部完成
建立 WebRTC/WebSocket 连接
```

**预估节省：800-2000ms**

### 2. 跳过不必要的 refreshSession

当前每次通话都调用 `supabase.auth.refreshSession()`，即使 access_token 仍有效（通常 1 小时有效期）。改为：检查 token 过期时间，仅在即将过期（<5 分钟）时才刷新。

**预估节省：200-500ms**

### 3. 时长限制查询合并为单个 RPC 函数

当前 `getMaxDurationForUser` 串行查询 5 张表。改为创建一个数据库函数 `get_voice_max_duration(p_user_id, p_feature_key)`，一次查询返回结果。

**预估节省：300-800ms**

### 4. Token 预热（可选，未来优化）

在用户点击语音按钮之前（如页面加载时），预请求麦克风权限和预检查余额，减少点击后的等待。当前已有 `hasPreviouslyGranted()` 检测，可进一步扩展。

## 改动计划

### 数据库迁移
创建 `get_voice_max_duration(p_user_id uuid, p_feature_key text)` 函数，将 5 次查询合并为 1 次 SQL。

### `src/components/coach/CoachVoiceChat.tsx`
1. **并行化**：将 `deductQuota(1)`、`getMaxDurationForUser()`、Token 获取（通过提前构造 audio client）改为 `Promise.all` 并行执行
2. **惰性 refreshSession**：检查 `session.expires_at`，仅在快过期时刷新
3. **getMaxDurationForUser** 改为调用新的 RPC 函数，1 次查询替代 5 次

### 不变项
- 麦克风预获取逻辑不变（已在用户手势中同步执行）
- 扣费重试逻辑不变
- 双轨切换（豆包/OpenAI）不变
- 计费、断线重连、浮窗等功能不变

