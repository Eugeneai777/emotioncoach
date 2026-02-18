

# 为文案板块添加 AI 润色功能

## 当前问题

现在每个文案板块（适合谁、痛点、方案、收获）只有"手动编辑"按钮，用户需要自己修改文字。缺少一键让 AI 优化已有文案的功能。

## 改动方案

### 1. Edge Function: `supabase/functions/ai-generate-bundle/index.ts`

新增 `type: "polish_copy"` 分支：

- 接收参数：`field`（哪个板块）、`currentText`（当前文案）、`bundleName`、`instruction`（可选的用户润色指令）
- 调用 AI 对当前文案进行润色优化，保持原意但提升表达力和说服力
- 返回优化后的文案

### 2. 前端: `PartnerProductBundles.tsx`

在每个文案板块的"编辑"按钮旁边，新增"AI 润色"按钮：

- 点击后调用 edge function 的 `polish_copy` 模式
- 显示加载状态（Sparkles 图标旋转）
- AI 返回后自动替换该板块文案，并切换到预览模式展示效果
- 用户不满意可以点击"编辑"手动微调，或再次点击"AI 润色"重新生成

### 改动范围

| 文件 | 改动 |
|------|------|
| `supabase/functions/ai-generate-bundle/index.ts` | 新增 `polish_copy` 分支，调用 AI 润色单个板块文案 |
| `src/components/admin/industry-partners/PartnerProductBundles.tsx` | 每个文案板块增加"AI 润色"按钮 + 加载状态 |

### 用户体验

1. AI 生成初始文案后，用户可以逐个板块点击"AI 润色"让 AI 进一步优化
2. 也可以先手动编辑修改方向，再点"AI 润色"让 AI 在此基础上润色
3. 两种编辑方式（手动 + AI）可以交替使用，直到满意为止

