

## 将能量测评工具卡片链接到产品页

### 改动

**修改 `src/pages/MamaAssistant.tsx`**

1. **"⚡ 能量评估"卡片**：点击后 `navigate("/packages")`，而非 `setShowAssessment(true)`
2. **底部"能量测评 & 工具"横幅CTA**：同样改为 `navigate("/packages")`
3. 可移除 `showAssessment` 状态和 `MamaAssessment` 相关导入（如果不再需要）

### 具体改动点

- `quickEntries` 数组中 "能量评估" 条目：设置 `route: "/packages"`
- 卡片 `onClick` 逻辑：`entry.route ? navigate(entry.route) : openChat(entry.context)`
- 底部横幅 `onClick`：`navigate("/packages")`

