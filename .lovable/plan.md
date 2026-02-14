
# 让邀请码兑换入口更显眼

## 问题分析

当前 `BloomInviteCodeEntry` 组件只出现在两个位置：
- 测评结果页底部（WealthBlockResult）
- Lite 测评结果页（WealthAssessmentLite）

但用户最先看到的 **AssessmentIntroCard（测评介绍/付费页）** 上完全没有邀请码入口。已登录但未购买的用户只看到 "9.9 开始测评" 按钮，很容易忽略邀请码功能。

## 方案

在 `AssessmentIntroCard` 的底部定价模块（Section 9）中，紧接 CTA 按钮下方，为已登录但未购买的用户插入一个醒目的 `BloomInviteCodeEntry` 卡片（card 变体）。

### 具体改动

**文件：`src/components/wealth-block/AssessmentIntroCard.tsx`**

1. 导入 `BloomInviteCodeEntry` 组件
2. 在定价模块的 CTA 按钮与底部版权文字之间，增加条件渲染：
   - 条件：`isLoggedIn && !hasPurchased`
   - 内容：`<BloomInviteCodeEntry variant="card" onSuccess={onStart} />`
3. 这样已登录未购买的用户会在付费按钮正下方看到一个带渐变边框、Gift 图标的邀请码入口卡片，非常醒目

### 技术细节

在 `AssessmentIntroCard` 组件约第 578 行（CTA 按钮之后）插入：

```tsx
{isLoggedIn && !hasPurchased && (
  <BloomInviteCodeEntry variant="card" onSuccess={onStart} />
)}
```

同时需要在文件顶部添加导入：
```tsx
import { BloomInviteCodeEntry } from "./BloomInviteCodeEntry";
```

只修改一个文件，改动量很小。邀请码卡片自带玫瑰色渐变背景和 Gift 图标，在定价区域中会非常显眼。
