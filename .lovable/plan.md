原因已经定位：你现在访问的是 `/assessment/women_competitiveness`，它走的是通用动态测评结果页 `DynamicAssessmentResult.tsx`，不是之前改过的旧版 `CompetitivenessResult.tsx`。所以你账号 18898593978 的历史报告看不到推荐，是因为推荐卡片加在旧入口组件里，当前真实入口没有给 `women_competitiveness` 显示该卡片。

计划如下：

1. 在 `DynamicAssessmentResult.tsx` 增加对 `template.assessment_key === 'women_competitiveness'` 的判断。
2. 在 AI 洞察之后、分享/历史操作之前，插入「7天有劲训练营」推荐卡片。
3. 卡片复用当前动态结果页的卡片风格，文案针对 35+ 女性：职场+家庭双线疲惫、每日15分钟能量练习、重启节奏感与竞争力底气。
4. CTA 继续跳转到 `/camp-intro/emotion_stress_7`。
5. 不改数据库、不改付费逻辑、不影响情绪健康测评之前去掉训练营入口的设置。

实施后，你账号之前做过的历史 35+女性竞争力测评报告也会显示该推荐，因为历史报告同样走这个动态结果组件。