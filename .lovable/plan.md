

# /laoge 页面优化：删除语音 + 隐藏非核心模块 + 悬浮转化条

## 修改文件：`src/pages/LaogeAI.tsx`

### 删除内容
1. **语音按钮区块**（第136-163行）— 整个 Voice CTA 区块
2. **语音对话组件**（第237-249行）— `CoachVoiceChat` 渲染
3. **「今日老哥一句话」区块**（第172-215行）
4. **「设为我的首页」按钮**（第217-235行）
5. **TOOLS 中的 `decision`**（第15-25行）
6. **不再需要的 import/状态**：`Send`, `Mic`, `CoachVoiceChat`, `useAuth`, `getSavedVoiceType`, `showVoice`, `dailyInput`, `dailySubmitted`

### 修改内容
- Hero 标签从 `["事业", "赚钱", "决策", "压力", "健康"]` 改为 `["赚钱", "事业", "压力", "健康"]`

### 新增内容
- 顶部悬浮转化条：`sticky top-0 z-50`，深橙色背景 `#EF6A20`
- 左侧文案：「🔥 中年男人职场突围方案」白色加粗
- 右侧按钮：「了解详情 →」白色边框圆角按钮
- 点击跳转 `/promo/zhile-havruta`

### 不影响的功能
- 其他页面语音入口不受影响
- 工具卡片组件、AI对话、Edge Function 不变
- 底部导航不变

