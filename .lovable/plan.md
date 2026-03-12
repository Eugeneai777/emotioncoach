

## Plan: 创建"我们AI"情侣关系助手产品

### 概述
创建一个独立的产品页面 `/us-ai`，包含首页6大板块和3个AI工具页面。采用暖橙+浅粉配色，Apple极简风格，移动端优先。

### 文件结构

| 文件 | 说明 |
|------|------|
| `src/pages/UsAI.tsx` | 首页，组合所有板块 |
| `src/components/us-ai/UsAIHero.tsx` | 主视觉区（标题+副标题+CTA） |
| `src/components/us-ai/UsAIToolCards.tsx` | 三个核心工具卡片 |
| `src/components/us-ai/UsAIAssessment.tsx` | 3分钟关系测评入口 |
| `src/components/us-ai/UsAIDailyCard.tsx` | 每日关系卡（赞美/感恩/理解/梦想） |
| `src/components/us-ai/UsAICalmButton.tsx` | 吵架冷静按钮（90秒引导） |
| `src/components/us-ai/UsAICTA.tsx` | 底部行动按钮 |
| `src/components/us-ai/UsAIUpgrade.tsx` | 7天情侣AI陪伴计划（可选） |
| `src/pages/UsAITool.tsx` | AI工具交互页（聊什么/翻译器/冲突修复） |
| `src/App.tsx` | 添加 `/us-ai` 和 `/us-ai/tool` 路由 |

### 配色方案
在 tailwind.config.ts 添加 `usai` 色系，使用暖橙 `#F4845F`、浅粉 `#FFF0EB`、柔和米色 `#FDF6F0` 的 CSS 变量。

### 各板块实现

**1. Hero 区**
- 大标题"我们AI" + 副标题"两个人，更懂彼此"
- 介绍文字 + 两个按钮（开始体验/看看怎么用）
- 暖橙渐变背景，装饰性模糊圆形

**2. 三个核心工具卡片**
- 今天我们聊什么：点击进入对话式AI工具页
- 情侣情绪翻译器：输入TA的话 → AI翻译真实情绪
- 冲突修复助手：输入事件 → AI分析+修复句
- 每个卡片含图标、标题、介绍、按钮，跳转到 `/us-ai/tool?type=chat|translate|repair`

**3. 关系测评**
- 展示5种关系模式标签
- "开始测评"按钮（可跳转到现有测评引擎或独立页面）

**4. 每日关系卡**
- 4种卡片类型轮播展示（赞美/感恩/理解/梦想）
- 连续记录天数 + 关系成长进度

**5. 吵架冷静按钮**
- 大圆形按钮，点击启动90秒倒计时
- 引导文字分阶段显示（深呼吸→整理情绪→思考）
- 倒计时结束后显示AI生成的一句修复话

**6. CTA + 升级区**
- "关系是可以练习的" + 开始使用按钮
- 7天情侣AI陪伴计划展示卡

### AI工具页（UsAITool.tsx）
- 根据 `type` 参数切换工具模式
- 使用现有的 `marriage-ai-tool` Edge Function，新增 `us-chat`/`us-translate`/`us-repair` 三种 mode
- 输入框 + AI结果展示，卡片化输出

### Edge Function 更新
在 `supabase/functions/marriage-ai-tool/index.ts` 中添加三种新 mode 的 system prompt：
- `us-chat`：生成每日对话问题 + 情绪总结 + 行动建议
- `us-translate`：情绪翻译，输出真实含义
- `us-repair`：冲突分析 + 修复句生成

### 路由
```
/us-ai → UsAI（首页）
/us-ai/tool?type=chat|translate|repair → UsAITool（工具页）
```

