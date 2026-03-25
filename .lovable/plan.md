
目标：修复 `/settings`「资料」页“立即绑定微信账号”无响应，改为一键拉起微信授权，并确保绑定到当前登录账号（手机号登录同样生效）。

1) 问题定位（已确认）
- `src/components/profile/WeChatBindStatus.tsx` 当前 `handleBind` 只执行 `navigate('/settings?tab=notifications')`，没有触发授权。
- `src/pages/Settings.tsx` 的 Tabs 使用 `defaultValue`（非受控）；在同页内改 URL 参数时，tab 可能不切换，用户体感“没反应”。

2) 代码改造方案（最小改动、复用现有能力）

A. `src/components/profile/WeChatBindStatus.tsx`
- 新增 `bindLoading` 状态（防重复点击 + 给出反馈）。
- 将“未绑定时”的按钮逻辑改为直接发起绑定：
  - 调用 `supabase.functions.invoke('get-wechat-bind-url', { body: { redirectUri: 'https://wechat.eugenewe.net/wechat-oauth-callback' } })`
  - 在微信浏览器内：`window.location.href = data.url`，直接进入微信授权。
  - 非微信浏览器：跳转 `/settings?tab=notifications&autoBindWechat=true`（复用通知页已有二维码弹窗流程）。
- “已绑定时”的“管理微信设置”仍保留跳转通知页。
- 按钮文案在 loading 时显示“拉起授权中...”。

B. `src/components/SmartNotificationPreferences.tsx`
- 增加对 URL 参数 `autoBindWechat=true` 的自动触发逻辑：
  - 组件加载后检测到该参数且当前未绑定时，自动调用现有 `handleWechatBind()`。
  - 触发后清理参数（`setSearchParams` 删除 `autoBindWechat`），避免刷新重复弹窗。
- 复用当前绑定弹窗/二维码/Realtime 监听，不新增 UI。

C. `src/pages/Settings.tsx`
- 将 Tabs 改为“受控”模式（`value + onValueChange`）并与 `tab` 参数同步：
  - `value` 来源于 `searchParams.get('tab') ?? 'reminders'`
  - 切换 tab 时写回 URL（保留其他 query）。
- 目的：从资料页跳到 `?tab=notifications` 时界面一定切过去，彻底消除“点击没反应”。

3) “绑定到手机号账号”保证
- 无需后端改动：`get-wechat-bind-url` 已用 `state=bind_${user.id}`，`wechat-oauth-process` 按该 `bindUserId` 绑定。
- 因此无论用户是邮箱登录还是手机号登录，都会绑定到“当前登录账号”对应的用户 ID。

4) 验收标准
- 微信内访问 `/settings` 的资料页，点“立即绑定微信账号”后可直接进入微信授权页。
- 授权完成后回到设置页，显示已绑定（并可自动出现关注引导）。
- 非微信浏览器点击后会进入通知页并自动弹出绑定二维码窗口。
- 手机号登录用户完成授权后，`wechat_user_mappings.system_user_id` 对应当前登录用户。
