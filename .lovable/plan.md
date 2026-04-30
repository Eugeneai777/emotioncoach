# AI 个性化洞察 — 商业架构评估与修复方案

## 一、现状诊断（基于真实数据库 + 代码审查）

### 1. 严重故障：洞察生成 100% 失败
- `partner_assessment_results` 表共 **51 条** 完成记录,涵盖 `male_midlife_vitality / sbti_personality / women_competitiveness / ind-kyrhyt_workplace_burnout` 四类测评。
- **`ai_insight` 字段全部为 NULL**(0/51 成功率)。
- Edge Function `generate-partner-assessment-insight` 的执行日志为空 → 说明前端 `supabase.functions.invoke` 调用根本没出网就被吞掉了,或被静默 catch。
- 用户在结果页只看到「正在生成...」加载动画,过几秒后变成空白(因为没设置失败回退文案与重试入口)。

### 2. 业务侧的体验断点
- 用户在结果页只能"等待+消失",没有失败提示、没有重试按钮。
- 历史记录页(`DynamicAssessmentHistory.tsx`)对 `ai_insight=null` 直接显示"暂无 AI 洞察",**无法补生成**。
- 当前 prompt 只用 `dimensionScores + primaryPattern + totalScore` 三个变量,**完全没用到用户昵称、头像、其他测评历史、订单/购买行为**,洞察千篇一律,缺乏"个性化"实质。

### 3. 架构侧的隐患
- `generateInsight` 与 `saveResult` 并行触发,`savedResultId` 经常在 AI 返回时还没就绪 → 即便 AI 成功,update 也会因为 id 为空而静默跳过(目前代码用 `if (savedResultId)` 直接放弃)。
- Edge Function 没有任何用户上下文(userId/profile/orders),缺乏可扩展架构。
- 没有"幂等重生成"接口,无法在历史页一键补洞察。

---

## 二、商业架构师视角:目标重定义

| 触点 | 当前状态 | 期望状态 |
|------|---------|---------|
| 测评完成首屏 | 加载圈→空白 | **必出洞察**(本次答题数据 + 用户档案) |
| 历史记录展开 | 多数为空 | 旧记录**自动补生成**并落库,下次直接显示 |
| 洞察内容质感 | 仅基于本次得分 | 融合**昵称、性别、最近测评、付费等级、平台行为标签**,呈现"懂我"的体感 |
| 失败兜底 | 静默消失 | 友好失败文案 + **一键重试按钮** |
| 转化链路 | 洞察后无明确动作 | 洞察末尾结合用户**未购套餐**自动推荐 1 个对应训练营/教练 |

---

## 三、技术实施方案(分 4 阶段,优先级递减)

### Phase 1 — 首要修复:让洞察生成稳定跑通(本轮必做)

**目标**:首屏 100% 出洞察,零静默失败。

1. **重写 `DynamicAssessmentPage.tsx` 的生成与持久化时序**
   - 将 `saveResult` 改为返回 Promise,**先 await 拿到 `savedResultId`,再调用 `generateInsight`**,把 id 一起传入 edge function,由 edge function 内部直接 update 落库(消除前端竞态)。
   - 失败时 `setAiInsight(null)` 同时设置 `insightError` 状态,UI 出现「生成失败,点击重试」按钮。

2. **强化 Edge Function `generate-partner-assessment-insight`**
   - 接收新参数:`userId`、`resultId`、`assessmentKey`。
   - 用 service role 直接 `update partner_assessment_results set ai_insight=... where id=resultId`,前端不再负责 update(避免 RLS 失败)。
   - 增加详细 console.log,便于后续诊断。

3. **结果组件 `DynamicAssessmentResult.tsx` 增加重试 UI**
   - `loadingInsight=false && !aiInsight` 时显示 “生成失败,点此重试” 按钮。
   - 通过新增 `onRegenerateInsight` prop 回调。

### Phase 2 — 历史记录自动补洞察

1. **`DynamicAssessmentHistory.tsx` 展开历史记录时**:
   - 若 `record.ai_insight` 为空,自动后台触发一次 `generate-partner-assessment-insight`(传入 resultId),完成后写库 + 局部更新 UI。
   - 加节流:每条记录 24h 内只自动尝试一次,避免反复调用。

2. **(可选) 一次性回填脚本**:管理员触发 backfill,把已有 51 条空洞察一次性补全(后续可放在隐藏的 admin 入口,本轮不强制实现)。

### Phase 3 — 真正"个性化":多维度上下文注入

升级 edge function 的 prompt 构建:

```
【用户画像】
- 昵称:{display_name}  性别:{gender}  年龄段:{age_range}
- 平台身份:{member_tier}  (付费会员/免费)
- 已购训练营:{owned_camps}
- 近 30 天完成的其它测评:{recent_assessments}
- 行为标签:{behavior_tags}  (如:经常浏览情绪类/财富类内容)

【本次测评】
- 测评:{title}
- 主要模式:{primary_pattern}
- 维度得分:...

【输出要求】
1. 开头使用"{nickname},..."直接称呼
2. 结合 TA 已购/未购套餐,在结尾推荐 1 个最对应的下一步动作
3. 若 TA 之前做过相关测评,引用一句关联(如"上次你在情绪测评显示...")
```

数据来源:
- `profiles`(昵称、头像、性别)
- `orders` where status='paid'(已购套餐)
- `partner_assessment_results`(同 user 的历史)
- 暂无平台浏览行为表 → 第三阶段先用"已购+测评"做画像,浏览行为留给 Phase 4。

### Phase 4 — 行为标签(后续迭代,本轮不做)

引入轻量浏览埋点表 `user_behavior_signals` 或基于现有 `monitor_*` 日志聚合,让洞察真正"读得到"用户在平台的兴趣轨迹。本轮先打通主链路,Phase 4 视效果再投入。

---

## 四、本轮(Phase 1 + 2 + 3 基础版)文件改动清单

- `supabase/functions/generate-partner-assessment-insight/index.ts`
  - 新增 userId/resultId/assessmentKey 参数
  - 用 service role 拉 profile + orders + 近期 assessments 拼 prompt
  - 生成成功后直接 update DB,失败返回明确 errorCode
- `src/pages/DynamicAssessmentPage.tsx`
  - 改为 await save → 拿 id → 调 invoke,移除前端 update
  - 新增 `insightError` 状态 + `regenerateInsight()`
- `src/components/dynamic-assessment/DynamicAssessmentResult.tsx`
  - 新增 `onRegenerateInsight` prop,失败态显示重试按钮
- `src/components/dynamic-assessment/DynamicAssessmentHistory.tsx`
  - 展开历史记录时若 `ai_insight` 为空,自动触发后台补生成(节流 24h)

不影响现有逻辑:复用现有 hook、表结构、组件 props 仅做新增,无破坏性变更。

---

## 五、验收标准

1. 在 `/assessment/male_midlife_vitality` 完成一次新测评 → 结果页 5 秒内出现以"昵称"开头、含 3 条建议、并带"下一步推荐"的洞察文本,数据库 `partner_assessment_results.ai_insight` 同步落库。
2. 进入历史记录,展开任意旧记录 → 若原本无洞察,展开后约 5 秒内自动出现并永久保留。
3. 主动断网或 mock 失败 → 结果页显示「生成失败,点此重试」,点击后重新生成。
4. Edge function 日志可见每次调用的 userId/resultId/耗时/成功率。
