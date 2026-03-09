

# /mama 宝妈AI生活助手 — 全面优化方案

## 一、视觉体验优化

### 1.1 MamaHero — 增加入场动画与层次感
- 使用 framer-motion 为标题、副标题、按钮组添加交错淡入上滑动画（staggerChildren）
- Hero 区域增加柔和渐变背景（从 `#FFF8F0` 到 `#FFE8D6`），增加视觉层次
- 困扰按钮增加微妙的 hover 阴影渐变和选中态反馈

### 1.2 卡片统一优化
- 所有模块卡片（TiredEntry、EmotionCheck、DailyEnergy、ToolGrid、AssessmentEntry）统一增加 framer-motion 滚动进场动画（`whileInView`）
- ToolGrid 四个教练卡增加左侧彩色条纹装饰，视觉区分更明显
- AssessmentEntry 增加微妙的渐变动画背景

### 1.3 底部安全区适配
- 页面底部 padding 使用 `pb-safe`（env(safe-area-inset-bottom)）适配 iPhone 底部

## 二、交互体验优化

### 2.1 AI Chat 交互增强
- **打字指示器**：将 Loader2 替换为三点跳动动画（更像真人在打字）
- **快捷追问按钮**：AI 回复后，在消息下方显示 2-3 个快捷追问选项（如"怎么具体做？""还有别的方法吗？""如果孩子哭了呢？"），点击直接发送
- **键盘适配**：移动端键盘弹起时，输入区域自动上推，防止被遮挡
- **关闭确认**：对话中途关闭时，增加轻量提示"确定离开对话？"

### 2.2 按钮反馈
- 所有触发 AI 的按钮点击后增加短暂的"已发送"视觉反馈（按钮变色 + 小 checkmark），然后弹出 Chat Sheet
- 情绪按钮增加点击涟漪效果

### 2.3 感恩记录交互
- 提交感恩记录后显示一个温馨的 confetti 动画（使用已有的 canvas-confetti）
- 显示"已记录第 N 条感恩"的统计

## 三、AI 回复质量优化

### 3.1 提示词优化（mama-ai-coach Edge Function）
- **角色深化**：增加"你像一个经验丰富、温柔而有智慧的好姐妹"的人设描述
- **回复结构化**：明确要求 AI 按"共情 → 洞察 → 建议 → 鼓励"四步回复
- **场景化回复**：针对不同 context 类型（困扰/情绪/疲惫/工具），在提示词中加入差异化指令
- **告别检测**：加入结束对话检测规则（与其他教练一致）
- **控制长度**：限制回复在 200 字以内，避免冗长

### 3.2 模型升级
- 从 `google/gemini-3-flash-preview` 升级为 `google/gemini-2.5-flash`，在保持速度的同时提升共情和语言质量

## 四、功能增强

### 4.1 快捷追问（最重要的功能增强）
- AI 回复后，Edge Function 同时返回 3 个建议追问（通过 tool calling 结构化输出）
- 前端在 AI 消息下方渲染为可点击的 chip 按钮

### 4.2 语音输入
- 在 Chat Sheet 输入栏增加麦克风按钮，使用 Web Speech API（`webkitSpeechRecognition`）进行语音转文字
- 适合宝妈带娃时不方便打字的场景

### 4.3 历史记录提示
- 页面顶部显示"上次聊过：xxx"的小提示（存 localStorage），点击可恢复上次对话

### 4.4 分享测评结果
- 测评结果页增加"生成分享卡片"功能，使用 html2canvas 截图生成图片供分享

---

## 技术实现清单

| 文件 | 改动 |
|------|------|
| `MamaHero.tsx` | framer-motion 入场动画、渐变背景 |
| `MamaTiredEntry.tsx` | 滚动进场动画、按钮反馈 |
| `MamaEmotionCheck.tsx` | 滚动进场动画、按钮反馈 |
| `MamaDailyEnergy.tsx` | 滚动进场动画、confetti、计数统计 |
| `MamaToolGrid.tsx` | 滚动进场动画、卡片装饰 |
| `MamaAssessmentEntry.tsx` | 渐变动画背景 |
| `MamaAIChat.tsx` | 打字指示器、快捷追问、语音输入、键盘适配、上次对话提示 |
| `MamaAssessment.tsx` | 分享卡片功能 |
| `mama-ai-coach/index.ts` | 提示词优化、模型升级、返回追问建议 |

