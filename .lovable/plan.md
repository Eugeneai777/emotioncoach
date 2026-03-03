

# 中场觉醒力测评 3.0 — AI赋能实现计划

## 产品概要

**《中场觉醒力测评 3.0》** — "你不是迷惘，你只是卡在中场转弯处"

- 6个维度，每维度5题，共30题
- 5分制（1=非常不同意 ~ 5=非常同意）
- 含反向计分题（第10、13、15、16、20、26、27、29、30题）
- 四种报告人格类型 + AI教练深度对话

## 架构设计

完全复用现有 **情绪健康测评** 的组件架构模式：

```text
数据层 (midlifeAwakeningData.ts)
  |
  +-- 介绍页 (MidlifeAwakeningStartScreen.tsx)
  |
  +-- 答题组件 (MidlifeAwakeningQuestions.tsx)
  |
  +-- 结果页 (MidlifeAwakeningResult.tsx)
  |     |
  |     +-- AI教练对话 (assessment-midlife-coach edge function)
  |
  +-- 历史记录 (MidlifeAwakeningHistory.tsx)
  |
  +-- 分享卡片 (MidlifeAwakeningShareCard.tsx)
  |
页面编排 (MidlifeAwakeningPage.tsx)
```

## 实施步骤

### 第一步：创建数据层 `src/components/midlife-awakening/midlifeAwakeningData.ts`

核心内容：

- **题库定义**：30题，每题包含 `id`, `dimension`, `text`, `isReversed` 字段
- **六大维度枚举**：`internalFriction`(内耗循环)、`selfWorth`(自我价值松动)、`actionStagnation`(行动停滞)、`supportSystem`(支持系统温度)、`regretRisk`(后悔风险)、`missionClarity`(使命清晰)
- **5分制评分选项**：1-5 分 (非常不同意 ~ 非常同意)
- **维度间过渡配置**：每完成一个维度后展示过渡动画文案
- **四种报告人格类型配置**：
  - 迷雾困兽型（高内耗+低行动）
  - 责任压抑型（高后悔+低表达）
  - 稳定焦虑型（外表稳定+内心空）
  - 觉醒转型型（使命高+行动待加强）
- **评分计算函数** `calculateMidlifeResult()`：
  - 每维度5题求和，标准化为0-100分
  - 反向题先翻转（6-原始分）再计算
  - 三大核心指标整合：内耗风险 = dim1 分数、行动力 = 100 - dim3 分数、使命清晰度 = dim6 分数
  - 类型判定逻辑：
    - 内耗 >= 60 且 行动力 <= 40 → 迷雾困兽型
    - 后悔风险(dim5) >= 60 且 支持系统(dim4) >= 60 → 责任压抑型
    - 内耗 < 50 且 使命清晰度 <= 40 → 稳定焦虑型
    - 其余 → 觉醒转型型
- **AI教练对话脚本**：4种人格各5-6轮引导式对话，复用 `DialogueRound` 接口

### 第二步：创建前端组件

复用现有情绪健康测评的 UI 模式：

1. **`MidlifeAwakeningStartScreen.tsx`** — 介绍页
   - 痛点共鸣区："中场困惑"场景描述
   - 测评亮点：6维度 + AI深度解读
   - 四种人格类型预览（2x2网格）
   - 开始按钮 + 付费逻辑

2. **`MidlifeAwakeningQuestions.tsx`** — 答题页
   - 复用 `AnimatePresence` 左右滑动切换
   - 5分制 Likert 按钮横排（非常不同意 ~ 非常同意）
   - 维度间过渡卡片（每5题一个维度，共6个维度过渡）
   - 自动前进 + 手动前后翻

3. **`MidlifeAwakeningResult.tsx`** — 结果页
   - 六维雷达图（使用 recharts RadarChart）
   - 人格类型卡片（emoji + 核心特征 + 困境 + 突破口）
   - 各维度得分条形图
   - AI教练对话入口按钮
   - 分享按钮

4. **`MidlifeAwakeningShareCard.tsx`** — 分享卡片
5. **`MidlifeAwakeningHistory.tsx`** — 历史记录列表
6. **`index.ts`** — 统一导出

### 第三步：创建页面和路由

- **`src/pages/MidlifeAwakeningPage.tsx`**：编排 start → questions → result 流程
- **`src/pages/MidlifeAwakeningHistory.tsx`**：历史记录页面
- 在 `App.tsx` 中注册路由 `/midlife-awakening` 和 `/midlife-awakening-history`

### 第四步：数据库

新建 migration 向 `packages` 表插入测评产品记录（如 `midlife_awakening_assessment`，定价待定），并创建历史记录存储：复用现有 `assessment_results` 表或新建 `midlife_awakening_results` 表存储答案和结果。

### 第五步：AI 教练 Edge Function

创建 `supabase/functions/assessment-midlife-coach/index.ts`：

- 完全复用 `assessment-emotion-coach` 的架构模式
- 使用 Lovable AI Gateway（`google/gemini-3-flash-preview`）
- 三个 action：`create_session`、`chat`、`complete`
- System prompt 根据用户的人格类型定制：
  - 迷雾困兽型 → 以微行动为核心引导，帮助走出"想太多做太少"循环
  - 责任压抑型 → 以表达训练为核心，引导说出未被听见的话
  - 稳定焦虑型 → 以使命重建为核心，帮助找回意义感
  - 觉醒转型型 → 以系统规划为核心，帮助把觉醒转化为具体行动
- 4阶段对话流程：觉察 → 理解 → 反思 → 行动
- 每次对话消耗用户AI点数（复用 `deduct_user_quota`）

### 第六步：训练营推荐联动

在结果页底部推荐相关训练营/教练入口，根据人格类型自动匹配：

| 人格类型 | 推荐教练 | 推荐工具 |
|---------|---------|---------|
| 迷雾困兽型 | 情绪教练 | 觉察记录 |
| 责任压抑型 | 沟通教练 | 表达训练 |
| 稳定焦虑型 | 生命故事教练 | 使命探索 |
| 觉醒转型型 | 目标教练 | 行动规划 |

## 技术要点

- 反向计分题（10、13、15、16、20、26、27、29、30）在计算时翻转为 `6 - score`
- 5分制评分（不同于情绪健康测评的4分制），需要新的评分选项 UI
- 六个维度的过渡动画需要5个过渡点（第5、10、15、20、25题之后）
- AI教练 edge function 需在 `supabase/config.toml` 中配置 `verify_jwt = false`
- 分享卡片需上传 OG 图片到 `og-images` bucket

