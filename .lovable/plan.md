

# 计划：构建 老哥AI — 中年男人AI参谋

## 概述
创建一个独立的移动优先AI工具页面，面向35-55岁男性用户。深蓝+白色配色，简洁硬朗设计。首页包含5个AI工具 + 每日一句话功能。

## 新建文件

### 1. 页面：`src/pages/LaogeAI.tsx`
- 深蓝渐变背景的英雄区（老哥AI品牌）
- 5个CTA按钮，点击展开对应工具的输入表单
- 底部"今日老哥一句话"每日互动区
- 所有工具在同一页面内以卡片/对话框形式展开

### 2. 组件：`src/components/laoge/LaogeToolCard.tsx`
每个工具的输入表单 + AI回复展示的可复用卡片组件。

### 3. 组件：`src/components/laoge/LaogeChat.tsx`
共享AI交互组件：收集用户输入 → 调用边缘函数 → 用Markdown展示"老哥风格"回复。

### 4. 边缘函数：`supabase/functions/laoge-ai/index.ts`
单一函数，通过 `tool` 参数分支处理5个工具 + 每日一句：
- `decision` — 决策顾问（情况 + A/B方案）
- `opportunity` — 赚钱雷达（行业、城市、资源）
- `career` — 事业卡点诊断（行业、收入、痛点）
- `stress` — 压力指数测试（5项评分 → 计算指数 + 建议）
- `health` — 健康风险扫描（年龄、睡眠、运动、体重）
- `daily` — 每日一句话（短输入 → 短回复）

使用 Lovable AI 网关（`google/gemini-3-flash-preview`），无需API密钥。

### 5. 路由：`App.tsx` 添加 `/laoge` 路由

## 设计细节
- **配色**：深蓝 `#1a2332` / `#2a3a4f` + 白色文字 + 强调蓝 `#4a9eff`
- **字体**：粗体、干净、无装饰
- **布局**：单页移动优先，工具以卡片表单内联展开
- **每个工具**：输入表单 → 提交 → 结构化AI回复卡片
- **每日区域**：单行输入 + 简短AI回复

## AI人格（系统提示词）
```
你是"老哥"，一个有丰富阅历的中年男人AI参谋。
风格：直接、冷静、务实、像大哥一样说话。
禁止：心理咨询腔、学术用语、长篇大论。
要求：每段建议简短有力，说人话，给可执行的建议。
```

## 汇总
| 文件 | 操作 |
|------|------|
| `src/pages/LaogeAI.tsx` | 新建主页面 |
| `src/components/laoge/LaogeToolCard.tsx` | 新建工具卡片组件 |
| `src/components/laoge/LaogeChat.tsx` | 新建AI交互组件 |
| `supabase/functions/laoge-ai/index.ts` | 新建边缘函数 |
| `src/App.tsx` | 添加 `/laoge` 路由 |
| `supabase/config.toml` | 添加函数配置（不编辑，系统自动处理） |

无需新建数据库表（无状态工具）。

