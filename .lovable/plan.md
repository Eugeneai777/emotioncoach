

## 全站条款/协议文本换行问题修复

### 排查结果

共发现 **4处** 存在同类问题（`items-start` + 无 `whitespace-nowrap`，可能导致文本换行）：

| 文件 | 位置 | 文本内容 | 问题 |
|------|------|---------|------|
| `WechatPayDialog.tsx` | 第1212-1228行 | "我已阅读并同意《xxx》和《隐私政策》" | `items-start` + `mt-0.5` + 无 `whitespace-nowrap` |
| `AlipayPayDialog.tsx` | 第300-316行 | "我已阅读并同意《xxx》和《隐私政策》" | `items-start` + `mt-0.5` + 无 `whitespace-nowrap` |
| `WeChatAuth.tsx` | 第327-343行 | "我已阅读并同意 服务条款 和 隐私政策" | `items-start` + `mt-0.5` + `mx-0.5` 间距 |
| `SubmitStep.tsx` | 第154-163行 | "我已阅读并同意《教练入驻协议》..." | `items-start` + 无 `whitespace-nowrap`（此条较长，不适合强制单行） |

以下 **2处** 已修复或无问题：
- `Auth.tsx` — 已在上次修复
- `QuickRegisterStep.tsx` — 已在上次修复
- `TeamCoachingPayDialog.tsx` — 已使用 `items-center`，文本较短，无问题

### 修改方案

**1. `src/components/WechatPayDialog.tsx`（第1212-1228行）**
- `items-start` 改为 `items-center`
- 移除 Checkbox 的 `mt-0.5`
- label 添加 `whitespace-nowrap`
- 移除 Link 的 `mx-0.5`

**2. `src/components/AlipayPayDialog.tsx`（第300-316行）**
- `items-start` 改为 `items-center`
- 移除 Checkbox 的 `mt-0.5`
- label 添加 `whitespace-nowrap`

**3. `src/pages/WeChatAuth.tsx`（第327-343行）**
- `items-start` 改为 `items-center`
- 移除 Checkbox 的 `mt-0.5`
- label 添加 `whitespace-nowrap`
- 移除 Link 的 `mx-0.5`

**4. `src/components/coach-application/SubmitStep.tsx`（第154-163行）**
- `items-start` 改为 `items-center`
- 此处文本较长（含多句话），不加 `whitespace-nowrap`，保留自然换行，仅做居中对齐优化

### 涉及文件

- `src/components/WechatPayDialog.tsx`
- `src/components/AlipayPayDialog.tsx`
- `src/pages/WeChatAuth.tsx`
- `src/components/coach-application/SubmitStep.tsx`

