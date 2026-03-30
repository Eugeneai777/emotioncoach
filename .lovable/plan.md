

# 修复测评路由 + 更新文案

## 改动

### 1. `src/App.tsx`（第480行）
将 `/women-competitiveness` 从 `Navigate` 重定向改回直接渲染 `WomenCompetitiveness` 组件：
```tsx
// 从
<Route path="/women-competitiveness" element={<Navigate to="/assessment/women_competitiveness" replace />} />
// 改为
<Route path="/women-competitiveness" element={<WomenCompetitiveness />} />
```

### 2. `src/pages/MamaAssistant.tsx`
- **第167行**：路由从 `/assessment/women_competitiveness` 改为 `/women-competitiveness`
- **第174行**：`"5分钟 · 免费"` → `"7分钟 · 限时¥9.9"`
- **第187行**：`"3分钟 · 免费"` → `"5分钟 · 限时¥9.9"`

## 影响范围
纯展示层 + 路由修复，不影响任何业务逻辑。手机端/电脑端排版无变化。

