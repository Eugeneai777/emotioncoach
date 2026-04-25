确认原因：`/assessment-coach` 使用的是独立组件 `AssessmentCoachChat.tsx`，没有走财富文字教练使用的 `CoachLayout -> CoachInputFooter -> VoiceInputButton` 输入区，所以当前底部只有输入框和发送按钮，麦克风入口缺失。

实施方案：

1. 只改情绪文字教练独立输入区
   - 修改范围限定在 `src/components/emotion-health/AssessmentCoachChat.tsx`。
   - 不改 `CoachLayout`、`CoachInputFooter`、`VoiceInputButton`、语音通话组件、其他 AI 教练页面，避免影响财富/沟通/父母/动态教练等现有逻辑。

2. 恢复与财富文字教练一致的麦克风入口
   - 在底部输入框左侧加入现有 `VoiceInputButton`。
   - 样式保持和财富文字教练一致：圆形按钮、44px 触控区域、录音中高亮/动画、处理中 loading。
   - 语音识别完成后，把识别文字追加到当前输入框中，逻辑与财富教练一致：已有文字时追加空格，没有文字时直接填入。

3. 保持对话发送逻辑不变
   - 发送按钮、Enter 发送、加载禁用、简报生成后隐藏输入区等行为保持原样。
   - 麦克风按钮仅在 `!briefing` 的输入区内显示，和输入框生命周期一致。

4. 麦克风资源安全
   - 复用现有 `VoiceInputButton` 内部的录音和 `voice-to-text` 转文字流程。
   - 保持现有麦克风管理器接入，不新增独立录音实现，减少资源泄漏风险。
   - 如发现 `VoiceInputButton` 停止后只软释放麦克风导致录音状态残留，会在不改变交互的前提下补充安全释放，但会谨慎评估，避免影响连续语音输入体验。

5. 验证
   - 运行 TypeScript 检查，确认没有类型错误。
   - 检查 `/assessment-coach` 输入区结构，确认麦克风在输入框左侧、发送按钮仍在右侧。
   - 确认其他启用 `enableVoiceInput` 的教练仍使用原组件路径，不被本次改动波及。