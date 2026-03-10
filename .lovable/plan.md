

## 问题分析

当第4阶段完成后，系统依赖 AI 在后续回复中调用 `generate_parent_briefing` 工具。但 AI 有时只回复文字"简报正在生成中"，而不实际调用工具，导致简报永远不生成。

## 解决方案

在 `parent-emotion-coach/index.ts` 的 `complete_stage` 处理逻辑中，当 stage 4 完成后，如果 AI 的 follow-up 回复**没有**调用 `generate_parent_briefing` 工具，则**自动发起第三轮 AI 调用**，强制要求生成简报。如果第三轮仍未调用，则**直接在代码中生成简报**（fallback）。

### 具体改动

**`supabase/functions/parent-emotion-coach/index.ts`**

1. 在 follow-up 消息处理部分（约 line 760-780），当 `complete_stage` 的 `args.stage === 4` 且 follow-up 没有调用 `generate_parent_briefing` 时：
   - 将 follow-up 消息加入历史
   - 再发一轮 AI 请求，系统提示强制要求："你必须立即调用 generate_parent_briefing 工具"
   - 如果第三轮仍无工具调用，用对话历史中已有的信息直接在代码中构造简报数据并存库（fallback 保底）

2. 修改 stage 4 的 prompt，更强调"不要说正在生成，直接调用工具"

### 用户体验

- 完成第4阶段后，简报一定会生成，不再出现"简报正在生成中"却无结果的情况
- 用户无需额外操作

