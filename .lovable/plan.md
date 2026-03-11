

## 在亲子日记页显示孩子情绪趋势

### 当前状态
`XiaojinMoodReport` 组件目前只嵌在 `/parent-coach` 的 `TeenModeEntryCard` 中。`/parent-diary` 页面有三个 Tab（简报、情绪趋势、模式洞察），但都只展示家长自己的教练对话数据，没有孩子端数据。

### 方案
在「情绪趋势」Tab 中，将 `XiaojinMoodReport` 组件添加到最顶部，作为第一个卡片显示。这样家长在查看自己的情绪热力图之前，先看到孩子的情绪周报。

### 文件变更

| 文件 | 变更 |
|------|------|
| `src/pages/ParentChildDiary.tsx` | 导入 `XiaojinMoodReport`，在「趋势」Tab 的 `space-y` 容器最前面插入该组件 |

只需在第 272 行的 `<div className="space-y-4">` 内、`UnifiedEmotionHeatmap` 之前加入 `<XiaojinMoodReport />`。

