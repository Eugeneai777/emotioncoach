

## 仅在测评结果页显示教练解说按钮

### 问题
当前底部导航栏的"教练解说"FAB 按钮始终显示，在非结果页时只是变灰（`disabled`），但用户希望它**仅在结果页出现**。

### 方案

**修改文件：`src/pages/WealthBlockAssessment.tsx`**

将底部导航栏的中间区域（教练解说 FAB）用条件渲染包裹：

- **有结果时**（`showResult && currentResult`）：显示教练解说 FAB（凸出样式）
- **无结果时**：不渲染 FAB，底部栏变成简洁的两栏布局（重新测评 + 历史记录）

```text
有结果时：
  [重新测评]   🎙️ 教练解说(凸出)   [历史记录]

无结果时：
  [重新测评]              [历史记录]
```

### 技术细节

在第 841-853 行，将 FAB 区域包裹条件判断：

```tsx
{showResult && currentResult && (
  <div className="relative -top-4 flex flex-col items-center">
    <AssessmentVoiceCoach
      result={currentResult}
      aiInsight={null}
      healthScore={...}
    />
  </div>
)}
```

同时移除 `disabled` 属性（因为不再需要 -- 按钮只在结果页出现，天然就是可用状态）。

