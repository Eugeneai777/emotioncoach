

# 登录按钮与卡片配色区分

## 问题
登录按钮和"绽放合伙人"卡片都使用了红粉色系（`from-rose-500 to-pink-500`），视觉上难以区分。

## 方案
将登录区域的按钮和背景改为蓝紫色系，与三张卡片的红/橙/紫色形成差异化。

### 具体修改（`src/pages/BloomPartnerIntro.tsx`）

| 元素 | 当前颜色 | 改为 |
|------|----------|------|
| 未登录提示背景 | `from-rose-100 to-pink-100` | `from-blue-50 to-indigo-50` |
| 提示边框 | `border-rose-200/60` | `border-blue-200/60` |
| 提示文字 | `text-rose-700` | `text-blue-700` |
| 登录按钮 | `from-rose-500 to-pink-500` | `from-blue-500 to-indigo-500` |

三张卡片颜色保持不变（红、橙、紫）。

