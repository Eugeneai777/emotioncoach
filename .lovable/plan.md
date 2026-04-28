计划如下：

1. 新增“男人有劲状态自测”的专属推广海报配置
   - 在现有测评推广海报配置中加入 `male_midlife_vitality`。
   - 文案方向贴合施强健康公众号流量：中年男性、状态自测、精力/睡眠/压力/关键时刻信心、非诊断、3分钟完成。
   - 这样未开始做题时，页面右上角分享按钮可生成完整推广海报，而不是因为缺少配置无法展示。

2. 未开始做题页复用 SBTI 的“推广海报”逻辑
   - 保持当前 `/assessment/male_midlife_vitality` intro 页右上角分享入口。
   - 使用现有 `AssessmentPromoShareDialog` + `AssessmentPromoShareCard` 生成带二维码的邀请海报。
   - 分享路径固定为 `/assessment/male_midlife_vitality`，支持当前统一推广域名 `wechat.eugenewe.net`。

3. 测评结果页新增男士专属结果海报
   - 参考 SBTI 结果页的逻辑：隐藏渲染分享卡片，通过 `executeOneClickShare` 生成图片，微信环境展示可长按保存的图片预览。
   - 新建一个 `MaleMidlifeVitalityShareCard`，使用统一 `ShareCardBase`，带二维码、品牌和扫码入口。
   - 海报内容包含：用户昵称、测评名称、结果画像、总分/状态百分比、核心维度条、轻量行动提示和“扫码测你的有劲状态”。
   - 结果页分享按钮文案针对该测评调整为“分享我的有劲状态报告”，区别于普通动态测评。

4. 保留现有 SBTI 和通用动态测评逻辑不变
   - SBTI 继续使用 `SBTIShareCard`。
   - 其他动态测评继续使用 `DynamicAssessmentShareCard`。
   - 仅当 `assessment_key === 'male_midlife_vitality'` 时切换到新的男士专属海报。

技术细节：
```text
涉及文件：
- src/components/dynamic-assessment/AssessmentPromoShareCard.tsx
- src/components/dynamic-assessment/DynamicAssessmentResult.tsx
- 新增 src/components/dynamic-assessment/MaleMidlifeVitalityShareCard.tsx

复用能力：
- ShareCardBase：二维码、统一推广域名、底部品牌
- executeOneClickShare：生成图片、微信/小程序/iOS 预览兼容
- getProxiedAvatarUrl：头像跨域兼容
```

预期效果：
- 用户未开始做题时，可以一键生成该测评的推广海报。
- 用户完成测评后，可以一键生成自己的结果海报。
- 海报风格比通用测评更贴合中年男性内容流量，更利于公众号投放和后续训练营转化。