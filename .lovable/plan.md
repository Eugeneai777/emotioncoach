
## 问题诊断

用户在 `/assessment/male_midlife_vitality` 测评结果页点【一键登录,解锁完整报告】后体验差，根因有 2 个：

### 问题 1：登录后跳到 `/mini-app`，回不到测评页（核心 Bug）

`src/pages/DynamicAssessmentPage.tsx:444-447` 拼接的是 `/auth?returnUrl=...`，但 `src/pages/Auth.tsx:265` 只识别 `?redirect=` 参数。`returnUrl` 被静默忽略 → 走默认 fallback → 落到 `/mini-app`。

同问题还出现在 `src/components/dynamic-assessment/DynamicAssessmentIntro.tsx:481`（同一作者的拼写错误，全站只有这两处用了 `returnUrl`，其余 30+ 处都是 `?redirect=`）。

### 问题 2：登录路径"不像一步到位"

当前流程：
```
点【一键登录】
 → window.location.href 全页刷新（慢）
 → /auth 多 Tab 表单页（手机号 / 密码 / 微信 / 谷歌）
 → 用户还得选一种方式
 → 微信用户再跳 WeChatOAuthCallback 三步进度卡（接收授权/验证身份/返回页面）
 → 跳错页面
```

用户预期：点一下，环境内最顺的方式自动走完，回到结果页。

---

## 优化方案（商业架构师视角）

测评结果页是**关键转化漏斗**——用户已完成 20 题、看到部分结果、产生强烈"想看全部"动机。此时每多一步操作都是流失。原则：**环境感知 + 路径最短 + 状态无缝**。

### 改动 1：修复 redirect 参数（必做，1 行级别）

**文件**：`src/pages/DynamicAssessmentPage.tsx` line 444-447  
**文件**：`src/components/dynamic-assessment/DynamicAssessmentIntro.tsx` line 481

把 `returnUrl` 改成 `redirect`，并用 `navigate()` 替代 `window.location.href`（避免全页刷新，保留 React 状态）。

同时在跳转**前**额外写入 `localStorage.setItem('auth_redirect', returnPath)`——这是 `Auth.tsx` 已支持的"最高优先级"回跳锚（line 264-271），可在微信 OAuth roundtrip 清掉 URL query 后仍然命中，**这是微信环境登录后能回到测评页的关键**。

### 改动 2：在测评页增加"环境感知一键登录"

在 `onLoginToUnlock` 处理函数里：

```text
1. 写入 auth_redirect = 当前测评页路径（含 query）
2. 检测环境：
   - 微信浏览器  → 直接跳 /wechat-auth?mode=login&redirect=...
                  （后续可进一步在 WeChatAuth 内自动触发 OAuth，
                    但本期先保证落到正确入口）
   - 其他环境    → 跳 /auth?redirect=...&default_login=true
                  （default_login 已被 Auth.tsx 支持,line 58）
```

效果：微信用户少一次 Tab 选择；非微信用户进入登录页时默认聚焦"登录"而非"注册"。

### 改动 3：简化 WeChatOAuthCallback 的"3 步骤"视觉

`src/pages/WeChatOAuthCallback.tsx` 当前展示三格进度（接收授权/验证身份/返回页面）让用户感觉"流程很长"。整个 callback 通常 < 1.5s 完成，进度条反而放大了等待感。

改为单一极简加载态：一个旋转图标 + 一行文案"正在登录..."。错误态保留。视觉上从"系统在做 3 件事"变成"瞬间完成"，与商业目标一致。

### 改动 4：登录后无缝恢复结果（已具备，验证即可）

`DynamicAssessmentPage.tsx:225-254` 的 `useEffect` 已实现"登录回跳后从 localStorage 读 lite 答案 → 自动重算 → 写库"。改动 1 修好回跳路径后，整条链路自动通：

```text
未登录答题 → 缓存到 localStorage（24h TTL）
   ↓
点【一键登录】→ 写 auth_redirect → 跳登录
   ↓
登录成功 → Auth.tsx 读 auth_redirect → navigate 回测评页
   ↓
DynamicAssessmentPage 挂载 → useEffect 读缓存 → 自动出完整结果 + 写历史
```

无需让用户重答，无需手动点"查看结果"。

---

## 技术变更清单

| 文件 | 变更 |
|---|---|
| `src/pages/DynamicAssessmentPage.tsx` | `onLoginToUnlock` 改为：写 `auth_redirect` → 按环境分发到 `/wechat-auth` 或 `/auth?redirect=...&default_login=true`，使用 `navigate()` |
| `src/components/dynamic-assessment/DynamicAssessmentIntro.tsx` | line 481 同样修复 `returnUrl` → `redirect` + `auth_redirect` 写入 |
| `src/pages/WeChatOAuthCallback.tsx` | 删除 3 格进度网格，改为单一 spinner + "正在登录..." 文案；保留错误态 |

无 schema / RLS / Edge Function 变更。无新依赖。

---

## 验证路径（实施后）

1. 普通浏览器：测评页 → 点登录 → `/auth?redirect=/assessment/male_midlife_vitality&default_login=true` → 登录 → 直接回到测评页并展示完整结果。
2. 微信浏览器：同上，跳 `/wechat-auth`，OAuth 完成后回到测评页（依赖 `auth_redirect` localStorage 锚）。
3. 历史记录：登录后 `dynamic_assessment_results` 表新增 1 条本次记录。

请确认是否按此方案实施。
