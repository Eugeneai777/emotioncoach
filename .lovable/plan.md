

# 修复：默认显示"已有账号？点击登录"

## 问题原因
绽放合伙人页面跳转到认证页时，URL 中包含 `default_login=true` 参数，导致页面默认进入登录模式，底部显示"还没有账号？点击注册"。

实际期望是：默认进入注册模式，底部显示"已有账号？点击登录"。

## 修改内容

### 文件：`src/pages/BloomPartnerIntro.tsx`

| 位置 | 当前 | 改为 |
|------|------|------|
| 第 44 行（卡片跳转） | `/auth?mode=phone_only&default_login=true&redirect=...` | `/auth?mode=phone_only&redirect=...` |
| 第 49 行（登录按钮） | `/auth?mode=phone_only&default_login=true` | `/auth?mode=phone_only` |

移除 `default_login=true` 参数后，`phone_only` 模式下 `isLogin` 默认为 `false`（注册模式），底部就会正确显示"已有账号？点击登录"。
