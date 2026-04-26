优化方案：统一隐藏其它文字教练的“语音转换成功 / 已将语音转为文字”提示，不影响语音识别、文字填入、发送、错误提示等现有逻辑。

实施范围：
1. 保留现有已生效页面
   - `/emotion-coach`：继续隐藏成功提示。
   - `/assessment-coach`：继续隐藏成功提示。

2. 扩展到其它使用同一套输入栏的文字教练
   - 动态文字教练：`DynamicCoach`。
   - 沟通文字教练：`CommunicationCoach`。
   - 亲子/家长文字教练：`ParentCoach`。
   - 财富文字教练：`WealthCoachChat`。
   - 财富训练营内嵌/弹窗文字教练：`WealthCoachEmbedded`、`WealthCoachDialog`。

3. 直接使用语音按钮的文字输入场景
   - 感恩记录快捷输入：`GratitudeQuickAdd` 也会同步关闭成功提示，避免同类语音输入仍反复弹提示。

技术调整：
- 不改动语音识别接口、不改动麦克风录制流程、不改动简繁转换逻辑。
- 只在对应调用处传入现有参数：
  - `CoachLayout` / `CoachInputFooter`：`showVoiceInputSuccessToast={false}`。
  - 直接使用 `VoiceInputButton` 的位置：`showSuccessToast={false}`。
- 保留失败提示，例如“未识别到语音”“语音转换失败”“无法访问麦克风”等，避免用户在异常时没有反馈。

验证：
- 运行 TypeScript 检查，确保属性传递没有类型错误。
- 确认语音识别成功后仍然会把文字填入输入框，只是不再弹出成功提示。