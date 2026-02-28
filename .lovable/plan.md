

# 青春期孩子情绪·家长应对能力测评（三力测评）

## 设计升级：更精细的题库 + AI 深度解读

### 题库设计：24题（每力8题）

相比原计划的15题，扩展到 **24题**，每个维度8题，涵盖更细分的子维度：

| 维度 | 子维度 | 题数 |
|------|--------|------|
| 情绪稳定力 | 自我觉察(2) + 情绪隔离(2) + 压力承受(2) + 自我调节(2) | 8题 |
| 情绪洞察力 | 行为解码(2) + 需求识别(2) + 情绪命名(2) + 发展理解(2) | 8题 |
| 关系修复力 | 主动修复(2) + 非暴力沟通(2) + 信任重建(2) + 柔性回应(2) | 8题 |

每题4级评分（1-4），含正向题和反向题混合，题目顺序打乱避免模式化作答。

### AI 元素融合

**1. AI 情景追问（答题中）**
- 当用户在某个子维度连续得高分或低分时，触发一道 AI 生成的情景题
- 例：稳定力低分时，AI 生成"假如孩子考试不及格回家，你的第一反应是？"并给出4个具体情景选项
- 复用已有的 `smart-question-followup` 边缘函数模式

**2. AI 个性化报告（结果页）**
- 新建边缘函数 `generate-parent-ability-insight`，基于三力得分、弱项子维度、情景追问回答，生成：
  - 你的"家长情绪画像"（一段 3-4 句的人物素描）
  - 最需突破的1个盲区 + 具体场景分析
  - 本周可执行的1个微行动
- 使用 Lovable AI (gemini-2.5-flash)

**3. AI 雷达图解读（结果页）**
- 在三力雷达图下方，AI 生成一句话点评三力平衡状态
- 例："你的洞察力远高于稳定力，说明你能看懂孩子，但容易被情绪带走——先稳住自己，你的洞察才能发挥作用。"

### 结果分型（6种，比原来4种更精细）

| 类型 | 条件 | 描述 |
|------|------|------|
| 稳定引航型 | 三力均衡且高 | 情绪稳定，既能看懂孩子也能修复关系 |
| 情绪卷入型 | 稳定力明显低 | 容易被孩子情绪带走，先处理自己的情绪 |
| 认知盲区型 | 洞察力明显低 | 常误读孩子行为，需要学习"看见"孩子 |
| 断裂回避型 | 修复力明显低 | 冲突后回避，关系裂痕积累 |
| 心有余力不足型 | 洞察高但稳定+修复低 | 能看懂但做不到，需要技能训练 |
| 潜力觉醒型 | 整体中等偏低 | 三力都有提升空间，系统训练效果最好 |

---

## 文件清单

| 操作 | 文件 | 说明 |
|------|------|------|
| 新建 | `src/components/parent-ability-assessment/parentAbilityData.ts` | 24题题库、子维度定义、6种结果类型、计算逻辑 |
| 新建 | `src/components/parent-ability-assessment/ParentAbilityStartScreen.tsx` | 开始页：痛点共鸣 + 三力简介 + "3分钟测一测" |
| 新建 | `src/components/parent-ability-assessment/ParentAbilityQuestions.tsx` | 答题页：逐题滑动 + AI 情景追问（高/低分触发） |
| 新建 | `src/components/parent-ability-assessment/ParentAbilityResult.tsx` | 结果页：雷达图 + AI 画像 + 类型卡片 + 训练营 CTA |
| 新建 | `src/pages/ParentAbilityAssessment.tsx` | 页面容器，管理流程状态 |
| 新建 | `supabase/functions/generate-parent-ability-insight/index.ts` | AI 报告生成边缘函数 |
| 修改 | `src/App.tsx` | 添加路由 `/parent-ability-assessment` |
| 修改 | `src/pages/CampIntro.tsx` | 训练营介绍页增加"先测一测"入口按钮 |

---

## 技术细节

### AI 情景追问触发逻辑

```text
在每个子维度（2题一组）答完后检查：
- 如果2题得分均 <= 2（弱项），触发 AI 情景追问
- 调用 smart-question-followup 函数，传入子维度信息
- 生成一道具体情景选择题，答案纳入最终报告
- 最多触发 3 次追问，避免测评过长
```

### 边缘函数 `generate-parent-ability-insight`

```text
输入：三力得分、各子维度得分、结果类型、情景追问回答
输出：JSON { portrait, blindSpot, microAction, balanceComment }
- portrait: 3-4 句家长情绪画像
- blindSpot: 最弱子维度的场景分析
- microAction: 本周可执行的1个练习
- balanceComment: 雷达图一句话解读
```

### 用户流程

```text
训练营介绍页 → "先测一测我的三力水平"
  → 开始页（3个痛点场景 + 三力介绍）
  → 答题（24题 + 最多3道AI情景追问，约5分钟）
  → 结果页（雷达图 + AI画像 + 类型 + 训练营推荐）
```

### UI 风格

- 配色：emerald/teal 渐变，与训练营主题一致
- 复用现有 `CommAssessmentQuestions` 的滑动交互模式
- AI 加载时使用 Sparkles 图标 + 渐进式文字显示
- 雷达图使用 recharts（已安装）

