

## 修改 Auth 页面 phone_only 模式默认为注册

**文件：** `src/pages/Auth.tsx`

### 改动内容

当前在 `phone_only` 模式下，页面默认进入**登录**模式（`isLogin = true`），底部显示"还没有账号？点击注册"。

用户希望默认进入**注册**模式（`isLogin = false`），底部显示"已有账号？点击登录"。

### 技术细节

- **第 56 行**：将 `useState(isPhoneOnly ? true : true)` 改为 `useState(isPhoneOnly ? false : true)`
- 这样 phone_only 模式默认显示注册表单，底部切换文案变为"已有账号？点击登录"
- 需要同步检查密码预填逻辑是否受影响（当前 phone_only 模式预填密码 "123456" 仅在登录模式生效，改为注册模式后需确认是否仍需保留）
