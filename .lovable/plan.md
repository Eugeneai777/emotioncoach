

# 修复"浏览更多测评"跳转路径

## 问题

"我的学习"页面底部的"浏览更多测评"按钮跳转到 `/mini-app`（有劲门户），应跳转到 `/assessment-picker`（测评选择页）。

## 改动

### `src/pages/CampList.tsx` 第 419 行

将 `navigate('/mini-app')` 改为 `navigate('/assessment-picker')`。

一行改动，无其他文件涉及。

