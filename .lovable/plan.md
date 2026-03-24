

# /laoge 页面优化：删除语音 + 隐藏非核心模块 + 悬浮转化条（已完成）

## 修改文件：`src/pages/LaogeAI.tsx`

### 已删除
1. 语音按钮区块 + CoachVoiceChat 组件
2. 「今日老哥一句话」区块
3. 「设为我的首页」按钮
4. TOOLS 中的 decision 工具
5. 不再需要的 import/状态：Send, Mic, CoachVoiceChat, useAuth, getSavedVoiceType, showVoice, dailyInput, dailySubmitted

### 已修改
- Hero 标签改为：赚钱、事业、压力、健康

### 已新增
- 顶部悬浮转化条：sticky top-0 z-50，深橙色背景 #EF6A20
- 左侧文案：🔥 中年男人职场突围方案
- 右侧按钮：了解详情 → 跳转 /promo/zhile-havruta
