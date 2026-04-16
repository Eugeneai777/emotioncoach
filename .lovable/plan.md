

# 点数明细区域增加"点数规则"入口按钮

## 方案

在"点数明细"标题栏右侧，将当前的"近期记录"文字替换为一个可点击的"📖 点数规则"按钮。点击后弹出已有的 `PointsRulesDialog` 组件，复用现有逻辑，零新增组件。

## 视觉设计

- 按钮样式：带 `Info` 图标的小型文字按钮，使用 `text-primary` 颜色，hover 时加下划线
- 位置：标题行右侧（替换"近期记录"），不占用额外空间
- 交互：点击打开已有的 `PointsRulesDialog` 弹窗

## 修改文件

| 文件 | 改动 |
|------|------|
| `src/components/VoiceUsageSection.tsx` | 导入 `PointsRulesDialog` + `Info` 图标，添加 `showRules` state，标题栏右侧改为可点击按钮 |

改动约 15 行，不涉及新文件或后端。

