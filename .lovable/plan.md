

# 中场觉醒力测评结果页优化 — 目标感 + 雷达图简化 + 教练路由修复

## 问题诊断

1. **缺乏目标感**: 结果只展示"你现在怎样"，没有告诉用户"理想状态是什么"以及"如何从当前状态到达目标"
2. **雷达图意义不清**: 6维雷达图数值全是"越高越差"，用户看不出好坏，也没有参考基线
3. **维度详情冗余**: 信息堆叠但缺乏层次，AI 分析可能还在加载时用户就刷过去了
4. **教练路由错误**: 点击"和觉醒教练聊聊"跳转到 `/assessment-coach`，使用的是情绪健康教练（`assessment-emotion-coach` 边缘函数），完全不了解中场觉醒测评的上下文

## 解决方案

### 一、雷达图：从"问题图"变成"觉醒图"（语义翻转）

将雷达图数据从"分数越高=问题越大"翻转为"觉醒度 = 100 - 原始分"，让图形变成：

- 越往外 = 状态越好
- 用户一眼看出哪些维度"已觉醒"、哪些"待突破"
- 添加一个 60 分的虚线基准圈，标注"平均水平"，让用户知道自己在哪

同时在雷达图下方用一句话点明："图形越饱满，觉醒度越高。虚线为平均水平。"

### 二、增加"目标感"模块

在核心指标卡片中：
- 每个环形进度圈下方添加目标值标记（如"目标: < 30"或"目标: > 70"）
- 用绿色/橙色/红色区分"已达标/接近/需努力"

新增"你的觉醒地图"卡片（替代原来纯雷达图卡片）：
- 雷达图 + 右侧简短的 2-3 条"优先突破建议"
- 明确告诉用户："你最需要突破的是 XX 维度，建议从 XX 开始"

### 三、内容结构精简

调整后的信息层次：

```text
1. 人格类型揭晓（保留，已有仪式感）
2. 核心指标 + 目标值（3个圆环，增加目标标记）
3. 觉醒地图（翻转后的雷达图 + 优先突破建议）
4. AI 深度分析（保留，是核心价值）
5. 维度详情（精简：默认只展示最需关注的2个维度，其余折叠）
6. 下一步 CTA
7. 操作按钮
```

### 四、修复觉醒教练路由

当前问题：`MidlifeAwakeningResult` 和 `MidlifeAIAnalysis` 的"和教练深聊"按钮都导航到 `/assessment-coach`，后者使用 `assessment-emotion-coach` 边缘函数，其 system prompt 完全是情绪健康教练的角色，不了解中场觉醒测评数据。

修复方案：
- 在 `AssessmentCoachChat.tsx` 中检测 `fromAssessment === 'midlife_awakening'` 时，修改页面标题和发送给边缘函数的 `patternName`
- 在 `assessment-emotion-coach` 边缘函数中，当检测到 `fromAssessment === 'midlife_awakening'` 时，使用觉醒教练专属的 system prompt，包含人格类型和维度数据
- `handleStartCoach` 传递更多上下文（`personalityType`、`dimensions`、`aiAnalysis`）到路由 state

---

## 技术细节

### 修改文件清单

**1. `src/components/midlife-awakening/MidlifeAwakeningResult.tsx`**

- 雷达图数据翻转：`value: 100 - d.score`（觉醒度）
- 雷达图添加 60 分基准线（用 `ReferenceLine` 或第二个半透明 Radar 数据系列）
- 核心指标圈添加目标值显示（内耗 < 30, 行动力 > 70, 使命 > 70）
- 雷达图下方添加"优先突破"文字（取最低觉醒度的 2 个维度）
- 维度详情 Accordion 默认展开最需关注的 1 个维度，其余折叠
- `handleStartCoach` 传递完整上下文到路由 state（包含 `fromAssessment`、`dimensions`、`personalityType` 等）

**2. `src/components/midlife-awakening/MidlifeAIAnalysis.tsx`**

- `handleStartCoach` 同步修复，确保传递 `fromAssessment: 'midlife_awakening'` 和完整测评数据

**3. `src/components/emotion-health/AssessmentCoachChat.tsx`**

- 读取路由 state 中的 `fromAssessment`
- 当 `fromAssessment === 'midlife_awakening'` 时：
  - 修改 `patternInfo` 为觉醒相关的名称/描述
  - 在 `createSession` 和 `sendMessage` 中传递 `fromAssessment` 给边缘函数

**4. `src/pages/AssessmentCoachPage.tsx`**

- 当 `fromAssessment === 'midlife_awakening'` 时，页面标题改为"AI 觉醒教练"
- 将 `fromAssessment` 和额外数据传递给 `AssessmentCoachChat`

**5. `supabase/functions/assessment-emotion-coach/index.ts`**

- 新增分支：当 `fromAssessment === 'midlife_awakening'` 时，使用觉醒教练专属 system prompt
- 觉醒教练 prompt 重点：基于中场觉醒测评数据，聚焦用户的人格类型和核心困境，引导探索突破路径
- 保留原有情绪教练逻辑不变（`else` 分支）

