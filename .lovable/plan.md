

# SBTI 人格测评 — 复刻 sbti.ai 完整版

## 概述
将当前简化版 SBTI（5维度、8人格）升级为完整版，对齐 sbti.ai 原版的 15 维度 × 27 种人格 × H/M/L 维度组合匹配逻辑。

## 核心改动

### 1. 新增 SBTI 评分策略 (`src/lib/scoring-engine.ts`)
新增 `scoreSBTI` 函数并注册到 registry：
- 15 个维度各自计算原始分，然后归一化为 H（高）/ M（中）/ L（低）三级
- 每种人格类型预定义一个 15 维度的 H/M/L 模式（如 CTRL = `HHHHMHHHMHHHHHMH`）
- 遍历 27 种人格，计算当前答案与每种模式的匹配度，取最高匹配者
- 特殊触发：检测隐藏支线题答案，满足条件直接分配 DRUNK（酒鬼）
- 兜底类型：无强匹配时返回 HHHH（傻乐者）

### 2. 重写模板数据（SQL UPDATE）
更新 `partner_assessment_templates` 表中 `sbti_personality` 记录：

**dimensions** — 15 个维度：
S1自尊自信、S2自我清晰度、S3核心价值、E1依恋安全感、E2情感投入度、E3边界与依赖、A1世界观倾向、A2规则与灵活度、A3人生意义感、Ac1动机导向、Ac2决策风格、Ac3执行模式、So1社交主动性、So2人际边界感、So3表达与真实度

**questions** — 重写 31 道题：
- A/B/C 三选项格式（对应 H/M/L 计分）
- 幽默场景化风格（原创，不照搬原版内容）
- 含 1 道隐藏支线触发题

**result_patterns** — 27 种人格：
CTRL(拿捏者)、ATM-er(送钱者)、Dior-s(屌丝)、BOSS(领导者)、THAN-K(感恩者)、OH-NO(哦不人)、GOGO(行者)、SEXY(尤物)、LOVE-R(多情者)、MUM(妈妈)、FAKE(伪人)、OJBK(无所谓人)、MALO(吗喽)、JOKE-R(小丑)、WOC!(握草人)、THIN-K(思考者)、SHIT(愤世者)、ZZZZ(装死者)、POOR(贫困者)、MONK(僧人)、IMSB(傻者)、SOLO(孤儿)、FUCK(草者)、DEAD(死者)、IMFW(废物)、HHHH(傻乐者)、DRUNK(酒鬼)

每种人格包含：维度匹配模式、描述、特征标签、一句话金句

**scoring_type** → 设为 `sbti`

### 3. 结果页适配 (`DynamicAssessmentResult.tsx`)
当 `scoringType === 'sbti'` 时：
- Hero 区域显示人格四字母代码 + 中文名（如 **MALO · 吗喽**），不显示分数环
- 维度展示改为 H/M/L 标签式（绿/黄/红色 badge），分 5 组（自我/情感/态度/行动/社交）展示
- 隐藏"改善建议"卡片（娱乐测评不需要）
- 底部加娱乐声明："本测试仅供娱乐，请勿当真 🎭"

### 4. 问题组件兼容
现有 `DynamicAssessmentQuestions` 已支持 `question.options` 数组（任意长度），A/B/C 三选项天然兼容，无需改动。

## 文件变更清单
| 文件 | 操作 |
|------|------|
| `src/lib/scoring-engine.ts` | 新增 `scoreSBTI` 策略 + 27种人格匹配逻辑 |
| `src/components/dynamic-assessment/DynamicAssessmentResult.tsx` | SBTI 专属结果展示 |
| 数据库 migration | UPDATE `partner_assessment_templates` 的 dimensions/questions/result_patterns/scoring_type |

## 技术要点
- 匹配算法：对每种人格的 15 维度模式，计算与用户实际 H/M/L 的汉明距离，取距离最小者
- H/M/L 阈值：维度得分归一化后，>0.66 = H，0.33-0.66 = M，<0.33 = L
- 隐藏触发优先级高于常规匹配

