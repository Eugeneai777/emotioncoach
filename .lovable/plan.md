

## 批量发送微信模版消息 — 管理后台页面

### 概述
在管理后台新增「微信群发」页面，允许管理员筛选用户并批量发送微信公众号模版消息。

### 实现方案

#### 1. 新建 Edge Function：`batch-send-wechat-template`
- 接收参数：`user_ids[]`、`scenario`、`custom_title`、`custom_message`
- 使用 `validateServiceRole` 鉴权（仅后台可调用）
- 遍历 user_ids，逐个调用现有 `send-wechat-template-message` 函数
- 返回每个用户的发送结果（成功/失败/原因）
- 支持自定义 notification 内容覆盖默认变体

#### 2. 新建前端页面：`src/components/admin/WechatBroadcast.tsx`
功能区域：
- **用户筛选**：从 `wechat_user_mappings`（已绑定+已关注）拉取用户列表，关联 profiles 显示昵称
- **场景选择**：下拉选择 scenario（default / encouragement / inactivity 等）
- **自定义内容**：可选填自定义标题和消息内容（覆盖默认模版变体）
- **预览**：发送前显示将发送的模版字段预览
- **批量发送按钮**：确认后调用 Edge Function，显示进度和结果汇总

#### 3. 路由 & 导航注册
- `AdminLayout.tsx`：添加 `<Route path="wechat-broadcast" element={<WechatBroadcast />} />`
- `AdminSidebar.tsx`：在「运营数据」分组下添加「微信群发」菜单项，使用 `Mail` 图标

### 改动文件清单
| 文件 | 操作 |
|------|------|
| `supabase/functions/batch-send-wechat-template/index.ts` | 新建 |
| `src/components/admin/WechatBroadcast.tsx` | 新建 |
| `src/components/admin/AdminLayout.tsx` | 添加路由 |
| `src/components/admin/AdminSidebar.tsx` | 添加菜单项 |
| `supabase/config.toml` | 添加 function 配置（verify_jwt=false） |

### 安全性
- Edge Function 使用 service role key 鉴权
- 前端页面仅 admin 角色可见（已有路由保护）
- 发送前需二次确认弹窗，显示将发送人数

