

## 将"开始测评"改为"重新测评"

### 修改文件：`src/pages/WealthBlockAssessment.tsx`（约第 837 行）

将底部导航栏左侧按钮的文字从"开始测评"改为"重新测评"，同时将图标从 `Play` 改为 `RotateCcw`（重新开始的图标），更准确地表达按钮的功能（重置回测评首页）。

### 技术细节

- 导入 `RotateCcw` 图标（来自 lucide-react）
- 将按钮文字 `开始测评` → `重新测评`
- 将图标从 `Play` 替换为 `RotateCcw`
- onClick 逻辑保持不变（已有 `setShowIntro(true)` 重置功能）

