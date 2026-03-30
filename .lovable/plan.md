

# 修复测评路由 + 调整工具入口位置

## 问题1：测评点击后没有内容

**原因**：`/mama` 页面的情绪健康测评路由是 `/assessment/emotion_health`（动态测评引擎），但实际情绪健康测评是一个独立页面，路由在 `/emotion-health`（EmotionHealthPage）。mini-app 的 badge 用的就是 `/emotion-health`，所以 mini-app 那边能正常打开。

**修复**：将 `/mama` 页面两个测评的路由改为与 mini-app badge 一致：
- `✨ 35+女性竞争力`：`/assessment/women_competitiveness`（不变，动态引擎有此模板）
- `💛 情绪健康自评`：`/assessment/emotion_health` → **`/emotion-health`**

## 问题2：工具入口放在测一测下面

**评估：合理，建议采纳**

当前布局从上到下是：4个痛点卡片 → 工具入口 → 测一测 → 设为首页。

将工具入口（语音教练、情绪日记、SOS）移到测一测下面更好：
- 痛点卡片是**核心转化通道**，测评是**诊断辅助**，两者应紧邻
- 语音/日记/SOS 是**辅助工具**，优先级最低，放最下面不影响使用

调整后布局：4个痛点卡片 → 测一测 → 工具入口 → 设为首页

## 改动文件

| 文件 | 改动 |
|------|------|
| `src/pages/MamaAssistant.tsx` | 情绪健康路由改为 `/emotion-health`；调换"工具入口"和"测一测"的 DOM 顺序 |

