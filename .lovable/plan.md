

# 余额不足横幅优化方案

## 问题现状
当前语音教练通话中余额不足时，`insufficientDuringCall` 分支会替换整个页面为一个深色全屏界面 + UnifiedPayDialog 弹窗，体验突兀。用户需求是：**保持在教练页面，仅在顶部显示横幅提示，点击"前往充值"跳转产品中心**。

## 修改方案

### 文件：`src/components/coach/CoachVoiceChat.tsx`

**1. 替换 `insufficientDuringCall` 的全屏渲染逻辑（L2023-2073）**

将当前的全屏替换渲染改为：不再 `return` 一个独立页面，而是在主界面顶部插入一条横幅。

- 删除 `if (insufficientDuringCall) { return (...) }` 这个独立分支
- 在主 `return` 的顶部状态栏区域之上，添加条件渲染横幅

**2. 横幅设计**

```text
┌──────────────────────────────────────┐
│ 用户余额不足，继续请前往充值  [前往充值] │  ← 横幅
├──────────────────────────────────────┤
│          (原有教练页面不变)            │
└──────────────────────────────────────┘
```

- 横幅背景色：使用当前教练的 `primaryColor` 对应的颜色（rose→粉色，purple→紫色，orange→橙色等）
- 文字：白色 `"用户余额不足，继续请前往充值"`
- 按钮：白色背景 + 主色字体的 `"前往充值"` 按钮
- 横幅有进入动画（从顶部滑入）

**3. "前往充值"按钮行为**

- 点击后跳转到 `/packages`（即产品中心 `https://wechat.eugenewe.net/packages`）
- 不关闭通话页面，不弹 UnifiedPayDialog
- 用户在产品中心购买完成后，点浏览器返回即可回到教练页面

**4. 余额不足时不断开连接、不报错**

- 设置 `insufficientDuringCall` 时，不再调用 `chatRef.current?.disconnect()` 和 `clearInterval(durationRef.current)`
- 移除 `disconnectNoticeRef` 中与"点数不足"相关的 toast 提示
- 保持页面停留在当前教练界面，通话自然暂停（服务端不再扣费即可）

**5. colorMap 扩展**

在现有 `colorMap` 中新增 `banner` 和 `bannerText` 字段，用于横幅样式：

```typescript
rose:   { ..., banner: 'bg-rose-500',   bannerText: 'text-rose-600' },
purple: { ..., banner: 'bg-purple-500', bannerText: 'text-purple-600' },
orange: { ..., banner: 'bg-orange-500', bannerText: 'text-orange-600' },
// 其他颜色类似
```

### 不涉及的改动
- 文字教练（`useDynamicCoachChat`）当前没有计费逻辑，无需改动
- 不修改 `deduct-quota` 边缘函数
- 不修改支付流程和现有路由
- 不影响训练营权益检查逻辑

### 改动范围
- **仅修改** `src/components/coach/CoachVoiceChat.tsx`
  - 删除 L2023-2073 的全屏 insufficientDuringCall 分支
  - 在主 return 顶部添加条件横幅
  - 修改余额不足触发点：不断开连接、不报 toast
  - colorMap 增加横幅相关颜色字段

