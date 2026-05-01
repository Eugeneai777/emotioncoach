## 目标

为 `/assessment/male_midlife_vitality`【男人有劲状态评估】启用 **Lite 模式**:
- 未登录用户测完 → 看到部分结果 → 引导登录 → 解锁完整报告
- 已登录用户 → 完整体验,不受影响

---

## 一、Lite 模式划分(关键设计)

| 区块 | 未登录(Lite) | 已登录(完整) |
|---|---|---|
| 顶部分数环 / 有劲状态指数 | ✅ 显示 | ✅ 显示 |
| 6 维状态雷达图 | ✅ 显示(给视觉冲击) | ✅ 显示 |
| 6 维详细得分 + 文字解读 | 🔒 模糊处理(blur)+ 解锁卡片覆盖 | ✅ 显示 |
| AI 个性化洞察 | 🔒 不显示 | ✅ 显示 |
| 7 天训练营 / 身份绽放推荐卡 | 🔒 不显示 | ✅ 显示 |
| **分享我的有劲状态报告** 按钮 | ✅ **保留显示**(满足约束1) | ✅ 显示 |
| **保存为图片(海报)** | ✅ **保留**(走的是同一个 `handleShare`) | ✅ 保留 |
| **登录解锁完整报告** 卡片 | ✅ 显示 | ❌ 不显示 |

> 训练营卡片在 Lite 模式不展示 = 引导用户先登录,登录后才能看到训练营入口与支付。这不影响支付链路本身——支付逻辑在 `/camp-intro/emotion_stress_7` 页面,与登录态独立,**对训练营支付零侵入**。

---

## 二、技术实施(2 个文件改动)

### 文件 1: `src/pages/DynamicAssessmentPage.tsx`

**改动点 A (line 41)**:把硬编码的 `isLiteMode = false` 改为基于登录态 + 测评类型的动态判断:

```ts
const isLiteMode = !user && (
  template?.assessment_key === 'male_midlife_vitality' ||
  scoringType === 'sbti'   // 保留原 SBTI 行为
);
```

**改动点 B (line 174 附近 handleQuestionsComplete)**:
- 当前已是"答完即出结果",**不阻断未登录用户**,继续保持(避免提高放弃率)
- 已登录用户走原 `saveResult` 写入数据库;未登录用户结果只在内存中(本来就是这样,无需改)

### 文件 2: `src/components/dynamic-assessment/DynamicAssessmentResult.tsx`

**改动点 C (line 488 附近 6维详细得分块)**:在 `isMaleMidlifeVitality` 的得分列表外层包一层条件遮罩:
- `isLiteMode && isMaleMidlifeVitality` 时:列表正常渲染但加 `blur-sm select-none` + 上覆"登录查看详细解读"半透明遮罩

**改动点 D (line 639 SBTI 解锁卡片)**:扩展条件,新增独立的男人有劲解锁卡片(走 `Lock` 图标 + 主品牌色):
```tsx
{isMaleMidlifeVitality && isLiteMode && (
  <Card>
    <Lock /> 登录查看你的完整有劲状态报告
    · 6 维深度诊断  · AI 私人解读  · 个性化恢复方案
    [微信一键登录,解锁完整报告 →]
  </Card>
)}
```
按钮 `onClick={onLoginToUnlock}`(已有现成回调,跳转 `/auth?returnUrl=/assessment/male_midlife_vitality`,登录后回到测评页 — 但当前实现回到 intro,需要补充结果重算或本地缓存,见**改动点 E**)

**改动点 E (登录后无缝回到完整结果)**:
- 在 `DynamicAssessmentPage` 中,Lite 模式下进入 `result` phase 时,把 `answers` 写入 `sessionStorage`(key: `lite_result_${assessmentKey}`)
- 页面挂载时若 `user` 已登录且 sessionStorage 有缓存 → 自动 `calculateAndShowResult(cachedAnswers)`
- 这复用了 [Assessment State Persistence](mem://features/assessment/state-persistence-pattern-zh) 已建立的模式,与 OAuth 回跳完全兼容

**改动点 F (分享按钮约束)**:确认 line 710 的"分享我的有劲状态报告"按钮 **不加 `!isLiteMode` 条件**,保留 Lite 模式下的分享能力,满足约束1。

---

## 三、约束验证

### 约束 1:海报、保存报告、训练营支付不受影响

| 功能 | 影响评估 |
|---|---|
| 分享海报 (`handleShare`) | ✅ Lite 模式保留按钮,html2canvas 截图区域包含已展示的雷达 + 分数,海报内容仍然完整可分享 |
| 保存为图片 | ✅ 同分享链路,无影响 |
| 7 天训练营支付 | ✅ 训练营推荐卡只在登录后展示,但 `/camp-intro/emotion_stress_7` 路由独立,任何已登录用户都可直接进入支付,**支付链路零改动** |
| 历史记录保存 | ✅ 已登录用户走原逻辑;未登录用户本就不存,符合预期 |

### 约束 2:全端兼容(H5 / 小程序 / 桌面)

- 解锁卡片复用现有 SBTI 卡片相同的 `Card` + `motion.div` 结构 → 已在三端验证过
- 模糊遮罩使用 `blur-sm` (Tailwind 原生,所有 WebView 支持)
- 微信一键登录走现有 `/auth` 页面,小程序内通过 `wechat.eugenewe.net` 域 OAuth(已有标准)
- 登录回跳通过 `sessionStorage`,在小程序 WebView 中持久(已有 [Payment Resumption](mem://technical/payment/payment-resumption-pattern-zh) 验证过的模式)
- 桌面端结果页本就是单列响应式布局,Lock 卡片不会破坏排版

---

## 四、QA 检查清单(实施后)

1. 未登录 → 测完 → 看到分数环 + 雷达 + 模糊得分 + 解锁卡片 + 分享按钮
2. 未登录 → 点分享 → 海报正常生成,扫码进测评
3. 未登录 → 点解锁 → 跳 `/auth` → 微信登录 → 回到结果页 → 看到完整报告(6 维详解 + AI 洞察 + 训练营卡片)
4. 已登录 → 测完 → 直接看到完整报告(无任何 Lite 提示)
5. 登录用户 → 点训练营卡片 → `/camp-intro/emotion_stress_7` → 支付链路正常
6. 三端截图对比:H5 / 微信内 / 桌面端,确认无溢出、字号、按钮点击区域正常

---

## 五、不改动 / 不动的部分

- `partner_assessment_templates.require_auth` **保持 false**(不强制登录,维持低门槛入口)
- 答题 / 分数计算 / 海报生成代码完全不动
- 训练营、支付、AI 教练相关 edge function 不动
- 数据库 schema 不动

---

## 估时

总计约 **15-20 分钟**实施 + 5 分钟三端截图 QA。
