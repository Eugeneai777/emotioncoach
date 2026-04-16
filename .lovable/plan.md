

# 移除 mini-app 页面"我的测评"入口模块

## 现状

`MiniAppEntry.tsx` 第544-566行有一个"我的测评"卡片，点击跳转到 `/energy-studio?tab=assessments`（即 AssessmentPicker 页面，展示所有测评分类列表）。

同时，底部 Tab 的【学习】页面（CampList）在 `filterParam === 'my'` 时已经展示了"我的测评"历史记录。功能重复。

## 方案

直接删除 `MiniAppEntry.tsx` 中第544-566行的"我的测评记录入口"模块。用户通过底部【学习】Tab 即可查看已完成的测评。

## 修改文件

| 文件 | 改动 |
|------|------|
| `src/pages/MiniAppEntry.tsx` | 删除第544-566行"我的测评"入口卡片，以及相关的 `ClipboardList` 导入（如不再使用） |

约删除 20 行代码。

