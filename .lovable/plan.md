
目标：修复 /settings「资料」页“立即绑定微信账号”无响应，并改为一键拉起微信授权绑定（手机号登录用户同样绑定到当前账号）。

一、问题定位（已确认）
1) `src/components/profile/WeChatBindStatus.tsx` 当前 `handleBind` 只做了 `navigate('/settings?tab=notifications')`，没有触发授权。
2) `src/pages/Settings.tsx` 的 Tabs 使用 `defaultValue`（非受控），在“已在 settings 页内”切换 URL 参数时，界面不一定切到通知 tab，导致用户体感“没反应”。

二、实施方案（最小改动、直达授权）
1) 修改 `src/components/profile/WeChatBindStatus.tsx`
- 将“未绑定时”的按钮逻辑改为直接授权：
  - 调用 `get-wechat-bind-url`（现有后端能力不变）
  - 在微信浏览器内：`window.location.href = data.url` 直接拉起 OAuth 授权
  - 非微信浏览器：给出提示并跳到通知页（保留现有备用路径）
- 新增 `bindLoading` 状态，防止重复点击
- “已绑定时”的“管理微信设置”仍跳通知 tab

2) 修改 `src/pages/Settings.tsx`
- 将 Tabs 从非受控改为受控（`value + onValueChange`），并与 `tab/view` 参数同步
- 这样从资料区内部触发 `navigate('/settings?tab=notifications')` 时，UI会立即切页，不再“看起来没反应”

3) 不改动后端函数
- `get-wechat-bind-url` 与 `wechat-oauth-process` 已支持 `state=bind_{userId}` 绑定当前登录账号
- 所以“手机号登录用户绑定到手机号账号”天然成立（绑定的是当前账号 userId，无需额外分支）

三、验收标准
1) 微信内访问 `/settings?tab=profile`，点击“立即绑定微信账号”后，立即跳转微信授权页（open.weixin）。
2) 授权完成后回调成功，返回设置页并显示已绑定状态（已有回调逻辑继续生效）。
3) 非微信浏览器点击时有明确提示，且可进入通知页继续绑定流程。
4) 已绑定用户点击“管理微信设置”可稳定切到通知页（不再出现“无反应”）。

技术实现（给开发）
- 主要改动文件：
  - `src/components/profile/WeChatBindStatus.tsx`
  - `src/pages/Settings.tsx`
- 复用现有能力：
  - `supabase.functions.invoke('get-wechat-bind-url')`
  - 微信回调页 `src/pages/WeChatOAuthCallback.tsx`（无需修改）
- 建议统一使用 `@/utils/platform` 中 `isWeChatBrowser()`，避免重复 UA 检测逻辑。
