

## 去掉结果页"重新测评"按钮

### 修改内容

**文件：`src/components/wealth-block/WealthBlockResult.tsx`**

- 删除第 691-698 行的"重新测评"按钮（`<Button variant="ghost">` + `RotateCcw` 图标）
- 清理不再使用的 `RotateCcw` import（如果该文件中无其他引用）
- `onRetake` prop 保留不删（因为 `WealthAssessmentLite.tsx` 等其他页面仍在使用该组件并传入 `onRetake`），但可将其改为可选 `onRetake?: () => void`

用户想重新测评时，通过底部 Tab 栏的"开始测评"即可触发，无需在结果页重复放置按钮。

