

## 向全部公众号关注者发送模版消息

### 当前限制
现有系统只能发送给**在网站上绑定了微信的用户**（`wechat_user_mappings` 表，约85人）。但公众号的实际关注者可能远多于此——很多人关注了公众号但从未在网站注册/绑定。

### 解决方案
通过微信 API `/cgi-bin/user/get` 拉取公众号的**全部关注者 openid 列表**，然后直接用 openid 发送模版消息（绕过 userId 查找）。

### 实施步骤

#### 1. 新建 Edge Function：`fetch-wechat-followers`
- 调用微信 API `GET /cgi-bin/user/get` 分页拉取全部关注者 openid（每次最多 10000 个）
- 通过现有代理（`WECHAT_PROXY_URL`）调用
- 返回 openid 列表和总数
- 使用 `validateServiceRole` 鉴权

#### 2. 修改 `batch-send-wechat-template`
- 新增支持 `openids[]` 参数（与现有 `user_ids[]` 并存）
- 当传入 openids 时，直接用 openid 构造模版消息并发送，跳过 userId → openid 的查找和 `wechat_enabled` 检查
- 仍使用相同的模版 ID 和消息变体系统

#### 3. 修改 `send-wechat-template-message`
- 新增支持直接传入 `openid` 参数（不需要 userId）
- 当传入 openid 时，跳过 `wechat_user_mappings` 查找和 `wechat_enabled` 检查，直接发送

#### 4. 更新前端 `WechatBroadcast.tsx`
- 新增「发送模式」切换：
  - **网站绑定用户**（现有逻辑，可逐个选择）
  - **全部公众号关注者**（新增，一键拉取全部 openid 后批量发送）
- 全部关注者模式下：显示关注者总数，一键发送，不需要逐个勾选
- 发送结果按 openid 显示

### 改动文件
| 文件 | 操作 |
|------|------|
| `supabase/functions/fetch-wechat-followers/index.ts` | 新建 |
| `supabase/functions/send-wechat-template-message/index.ts` | 修改：支持直接传 openid |
| `supabase/functions/batch-send-wechat-template/index.ts` | 修改：支持 openids 模式 |
| `src/components/admin/WechatBroadcast.tsx` | 修改：添加发送模式切换 |
| `supabase/config.toml` | 添加新 function 配置 |

### 安全性
- 所有新增 Edge Function 使用 service role key 鉴权
- 仅管理后台可触发，前端有 admin 路由保护

