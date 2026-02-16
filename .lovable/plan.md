

## 财富卡点测评三项用户反馈优化

### 反馈 1：AI 追问选完选项后直接跳到下一题，用户误以为需要手动输入

**问题分析**：在 `DeepFollowUpDialog` 中，用户点击选项后立即跳转到下一题（无过渡），给人"还没答完就被跳走"的感觉。普通追问 `FollowUpDialog` 也类似——选完后 300ms 直接切题。

**优化方案**：
- 在 `FollowUpDialog` 和 `DeepFollowUpDialog` 中，用户选择选项后增加一个短暂的"已选中"视觉反馈（选中态高亮 + "感谢" toast），停留约 600ms 再跳转
- 选中的选项显示勾选动画，让用户明确感知"我的选择已被记录"
- 在选项区域上方增加微提示文字："点击选项即为回答"

### 反馈 2：前面题目的答案选项（从不/偶尔/有时/经常/总是）不够具体，与部分场景化题目不贴切

**问题分析**：当前 30 道题共用同一套频率标签 `scoreLabels`（从不/偶尔/有时/经常/总是）。但题目是场景化设计（如"朋友分享好消息时你脱口而出'经济不好'"），用"偶尔"不如用"有点像我"更直观。

**优化方案**：
- 将 `scoreLabels` 从频率型改为**认同型**标签，更贴合场景化题目：
  - 1 分："完全不是我"
  - 2 分："偶尔这样"
  - 3 分："有时会"
  - 4 分："经常这样"
  - 5 分："太像我了"
- 这种表述与场景化描述更匹配（例如"朋友分享好消息时..." → "太像我了" 比 "总是" 更自然）

### 反馈 3：分享测试报告到微信无效

**问题分析**：分享流程使用 `ShareDialogBase` → `html2canvas` 生成图片 → `navigator.share` 或图片预览。可能的失败点：
- `html2canvas` 对隐藏在 `fixed -left-[9999px]` 的导出卡片渲染失败
- 微信 H5 环境下 `navigator.share` 不可用，但图片预览兜底也可能因滚动锁定/z-index 冲突而不显示
- `exportCardRef.current` 在用户点击时可能为 null（卡片未挂载完成）

**优化方案**：
- 在 `WealthInviteCardDialog` 中增加生成失败的错误上报和用户重试引导
- 确保 `exportCard` 使用 `visibility: hidden` 而非 `opacity: 0` + 远离屏幕的方式（某些浏览器对 off-screen 元素不渲染）
- 在 `ShareDialogBase` 的 `handleGenerateImage` 中增加 `exportCardRef.current` 为 null 时的等待重试逻辑（最多等 2 秒）
- 增加 catch 块的详细错误日志和用户友好的失败提示

### 技术实现细节

| 文件 | 修改内容 |
|------|---------|
| `src/components/wealth-block/wealthBlockData.ts` | 将 `scoreLabels` 改为认同型标签 |
| `src/components/wealth-block/FollowUpDialog.tsx` | 选项点击后增加选中态反馈 + 延迟跳转 |
| `src/components/wealth-block/DeepFollowUpDialog.tsx` | 同上，增加选中反馈和"点击即回答"提示 |
| `src/components/ui/share-dialog-base.tsx` | 增加 ref 空值等待重试 + 错误处理增强 |

### 改动范围

- 修改 4 个文件
- 无后端改动，无数据库改动
- 主要是 UX 微调和分享稳定性修复

