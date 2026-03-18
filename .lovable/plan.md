

## 问题诊断：97% 卡住的根因

### 现象
在 `/wealth-assessment-lite` 页面，共 30 道题。97% = 29/30 已答，用户正在作答最后一题。此时有时能正常提交，有时会卡住。

### 根因分析

卡住是由 **AI 追问（follow-up）机制** 在最后一题触发时导致的，具体有两个问题：

**问题 1：AI 追问请求无超时保护**

当用户在最后一题选择了 4 分或 5 分时，`shouldAskFollowUp` 可能返回 true（5 分必触发，4 分 50% 概率触发）。此时 `generateFollowUp` 调用边缘函数 `smart-question-followup`，但**没有设置超时**。如果网络慢或边缘函数卡住，`pendingNextQuestion` 一直为 true，"查看结果"按钮一直处于 disabled 状态，用户就永久卡住了。

对比：后面的 `generateDeepFollowUp` 有 15 秒超时保护，但 `generateFollowUp` 完全没有。

**问题 2：追问弹窗可能不可见**

即使追问成功返回，追问对话框渲染在选项列表下方，在最后一题时用户可能看不到（尤其在小屏手机上），以为页面卡住了。

**为什么"有时正常"**：`shouldAskFollowUp` 对 4 分用了 `Math.random() > 0.5`，有随机性。选 1-3 分则不会触发追问，直接可以提交。

### 修复方案

1. **为 `generateFollowUp` 添加超时保护**（与 `generateDeepFollowUp` 一致，10 秒超时）
   - 在 `WealthBlockQuestions.tsx` 的 `generateFollowUp` 函数中加入 `setTimeout` + `AbortController` 或 Promise.race
   - 超时后自动关闭追问、重置 `pendingNextQuestion`，让用户可以继续

2. **最后一题不触发 AI 追问**
   - 在 `handleAnswer` 中，当 `isLastQuestion` 为 true 时跳过 `shouldAskFollowUp` 检查
   - 这样最后一题回答后用户可以直接点"查看结果"，避免在提交前被追问打断

3. **追问弹窗出现时自动滚动到可见区域**（可选优化）
   - 追问对话框出现后调用 `scrollIntoView`，确保用户能看到

### 涉及文件
- `src/components/wealth-block/WealthBlockQuestions.tsx` — 添加超时保护 + 最后一题跳过追问逻辑

