

# 用 sbti.ai 原版数据更新 SBTI 测评内容

## 概述
已抓取 sbti.ai 全部内容，包括首页介绍、FAQ、27种人格的完整详情（描述、15维度 H/M/L 画像、金句）。现在需要将这些原版数据同步到我们的系统中。

## 需要更新的内容

### 1. 更新 `src/lib/sbti-scoring.ts` 中的 27 种人格数据
用原版数据替换每种人格的：
- **pattern（维度模式）**：用原版每种人格的真实 H/M/L 15维度画像替换（当前 patterns 很多是编造的）
- **description（人格描述）**：用原版的长描述替换当前的简短描述
- **quote（金句）**：用原版的一句话金句替换
- **subtitle**：用原版的 tagline 替换
- **traits**：从原版描述中提取关键特征

以下是从原版提取的正确维度模式（S1-S3, E1-E3, A1-A3, Ac1-Ac3, So1-So3）：

| 人格 | 原版模式 | 当前代码模式 | 需改 |
|------|----------|-------------|------|
| CTRL | HHHHMHHMHHHHMHM | HHHHMMHMHHHHMHM | 部分偏差 |
| ATM-er | HHHHHMAHHHMHMML | MMHHLMMHMLMHLM | 完全不同 |
| Dior-s | MHMMHHMHMHHLMHM | LLLMMMMLLLMLMML | 完全不同 |
| BOSS | HHHHMHMMHHHHMHM | HHHMMHHHHHHHHMHH | 部分偏差 |
| ... | （全部27种均需校对） | | |

### 2. 更新数据库中的模板数据
通过 SQL migration 更新 `partner_assessment_templates` 表中 `sbti_personality` 的 `result_patterns`，使其与代码中的人格数据一致。

### 3. 更新维度描述文案
原版每个维度的 H/M/L 都有独特的描述文案（如 S1-H: "心里对自己大致有数，不太会被路人一句话打散"），需要将这些文案存储并在结果页展示。

### 4. 更新首页介绍
在测评开始前的介绍页可选择性添加原版的 FAQ 内容（如"SBTI 是什么"、"测试需要多长时间"等）。

## 技术细节

### 维度 H/M/L 描述映射（从原版提取）
每个维度有3种描述，根据用户得分的 H/M/L 展示对应文案：
- S1-H: "心里对自己大致有数，不太会被路人一句话打散。"
- S1-M: "自信值随天气波动，顺风能飞，逆风先缩。"
- S1-L: "对自己下手比别人还狠，夸你两句你都想先验明真伪。"
- （共 15×3 = 45 条描述）

这些描述需要嵌入到 `sbti-scoring.ts` 中，在结果计算时附加到 dimensionScores 上。

### 文件变更清单
| 文件 | 操作 |
|------|------|
| `src/lib/sbti-scoring.ts` | 重写全部27种人格的 pattern/description/quote/traits/subtitle，新增维度描述映射 |
| 数据库 migration | 同步更新 result_patterns |

### 图片说明
原版的27种人格图片（如 `https://www.sbti.ai/images/types/CTRL.png`）为外部资源，可以在结果页通过 URL 引用展示，或后续下载到自有存储。

