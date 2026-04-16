

# SBTI 测评优化 — 选项丰富化 + 专属分享海报

## 问题分析

1. **选项不够贴合**：当前每题仅 3 个选项（A/B/C），用户反馈"有些答案没有完全符合"、"有些是瞎选"。3 个选项覆盖面有限，很多用户的真实反应落在选项之间。

2. **分享海报不适配 SBTI**：当前 `DynamicAssessmentShareCard` 是通用模板（分数环 + 维度条形图），不适合 SBTI 这种人格类型测评。SBTI 应展示人格代号、emoji、特征标签、金句等核心信息。

---

## 方案一：扩充选项 — 每题 4 个选项

将每道题从 3 个选项扩充至 **4 个选项**，新增一个中间态选项（score=1），原有中间选项改为 score=2 或调整分值为 3/2/1/0。

**评分调整**：
- 原始：A=2, B=1, C=0
- 新增后：A=3, B=2, C=1, D=0
- `sbti-scoring.ts` 中 `maxPerQ` 从 2 改为 3
- `normalizeToLevel` 的 H/M/L 阈值保持 >0.66 / ≥0.33 / <0.33 不变

**数据库更新**：
- 通过 edge function 或手动更新 `partner_assessment_templates` 的 `questions` JSON，为全部 61 题各增加一个第 4 选项
- 第 4 选项应覆盖"介于两者之间"或"视情况而定"的常见用户心理

**改动文件**：
| 文件 | 改动 |
|------|------|
| `src/lib/sbti-scoring.ts` | `maxPerQ` 从 2 改为 3 |
| 数据库 `partner_assessment_templates` | 61 题各增加第 4 选项（score 分布改为 3/2/1/0） |

---

## 方案二：SBTI 专属分享海报

创建 `SBTIShareCard` 组件，专门展示人格类型信息：

**海报内容**：
- 用户头像 + 昵称
- 人格代号（如 CTRL）+ emoji
- 副标题（如"掌控一切指挥官"）
- 5 个特征标签（如"天生领袖"、"效率怪物"）
- 金句（quote）
- 匹配度百分比
- 底部 QR 码 + "扫码测测你的搞钱人格" 引导文案
- 有劲AI logo

**结果页分享按钮优化**：
- 当前 SBTI 结果页已有 Share2 图标按钮，但使用通用 ShareCard
- 改为使用 SBTI 专属 ShareCard，展示人格精华
- 增加一个更醒目的底部分享 CTA 按钮："📤 分享我的搞钱人格"

**改动文件**：
| 文件 | 改动 |
|------|------|
| `src/components/dynamic-assessment/SBTIShareCard.tsx` | **新建** — SBTI 专属分享卡片 |
| `src/components/dynamic-assessment/DynamicAssessmentResult.tsx` | SBTI 模式下使用 SBTIShareCard，底部增加醒目分享按钮 |

---

## 实施步骤

1. 更新 `sbti-scoring.ts` 的 `maxPerQ` 为 3
2. 编写数据库更新脚本，为 61 题生成第 4 选项（基于每题场景，补充一个"视情况/看心情/折中"类选项）
3. 创建 `SBTIShareCard.tsx` 专属海报组件
4. 修改 `DynamicAssessmentResult.tsx` 集成新海报和分享 CTA

