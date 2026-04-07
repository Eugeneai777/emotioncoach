

# 修复"浏览更多测评"跳转到全部测评页

## 问题

"浏览更多测评"按钮跳转到 `/assessment-picker`，该页面标题是"我的测评"，只显示**已拥有**的测评（代码中 `filter` 只保留 `ownedSet` 中的测评）。用户期望跳转到展示**全部测评**的页面，即截图中的 `/assessment-tools`（包含"日常工具"和"专业测评"两个 tab）。

## 改动

### `src/pages/CampList.tsx`

将两处 `navigate('/assessment-picker')` 改为 `navigate('/assessment-tools')`：
- 第 319 行：空状态下的"探索测评"按钮
- 第 419 行："浏览更多测评"按钮

共两行改动，无其他文件涉及。

