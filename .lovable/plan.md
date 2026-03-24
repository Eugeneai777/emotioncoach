

# /mini-app 底部导航改造：三项式布局

## 概述

将底部导航从「我的 + 语音教练」两项布局改为「我的 + 文字AI + 学习」三项布局，同时瘦身「我的」页面。

## 改动范围（3个文件）

### 1. `src/components/awakening/AwakeningBottomNav.tsx` — 重写

**移除内容：**
- 所有语音通话相关代码（CoachVoiceChat、UnifiedPayDialog、PurchaseOnboardingDialog、预热逻辑、余额检查、useAuth、supabase 引用）

**保留内容：**
- 中间 Logo 凸起按钮的视觉样式（呼吸动画、光晕效果）

**新增/修改内容：**
- 中间按钮 onClick → `navigate('/youjin-life/chat')`，无登录门槛
- 右侧新增「学习」按钮（BookOpen 图标），点击跳转 `/camps?filter=my`
- 右侧空占位 `div` 替换为实际按钮
- 布局变为左中右三项对称

**关于右侧跳转 `/camps?filter=my` 的说明：**
- `/camps` 页面（CampList.tsx）已支持 `?filter=my` 参数筛选用户训练营
- 已购用户直接看到"我的训练营"，未购用户可手动切换查看全部
- 直接复用现有页面，不额外新建聚合页，避免增加维护成本

### 2. `src/pages/MiniAppEntry.tsx` — 移除冗余快捷面板

**移除内容：**
- `paidShortcuts` 数组及其渲染（「我的订单」「我的测评」「我的训练营」快捷面板）
- 相关 import（ShoppingCart、ClipboardList、Tent）
- `hasPaidOrder` 状态及其 orders 表查询逻辑

### 3. `src/pages/MyPage.tsx` — 瘦身（已完成）

**移除内容：**
- 「学习与成长中心」区块（LEARNING_MODULES 及其渲染）
- 「助你持续成长」五大板块区块
- 相关的 import

**保留内容：**
- 账号信息卡片
- 订单信息区块（完整保留，默认展示最近2笔）
- 设置区块
- 关于我们

## 不受影响的功能

- 语音教练在各人群页面（/workplace、/laoge 等）的独立入口不受影响
- `/youjin-life` 页面底部的语音入口不受影响
- `/camps` 页面功能不变
- 「我的」页面的订单查看功能完整保留
