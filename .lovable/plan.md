

# 智能记账功能：对话式记账 + 月度消费报告

## 概述

在 /youjin-life 生态中加入"对话式记账"能力，用户通过自然语言（如"午饭花了35"、"打车18块"）即可完成记账，并可生成月度消费报告。

## 现状

项目已有 `finance_records` 表和 `FinanceTracker` 组件（表单式记账），但与 youjin-life 对话系统完全独立。

## 方案

### 1. 更新 AI System Prompt（对话式记账）

修改 `supabase/functions/youjin-life-chat/index.ts`，在执行模式中增加记账场景：
- AI 识别记账意图（"午饭35"、"今天花了多少"、"本月消费报告"）
- 输出结构化标记 `[EXPENSE]{"amount":35,"category":"餐饮","note":"午饭"}[/EXPENSE]`
- 查询类输出 `[EXPENSE_QUERY]{"type":"monthly_report","month":"2026-03"}[/EXPENSE_QUERY]`

### 2. 前端解析与写入

修改 `src/pages/YoujinLifeChat.tsx`：
- 解析 `[EXPENSE]` 标记，自动调用 `finance_records` 表插入记录
- 解析 `[EXPENSE_QUERY]` 标记，查询数据库生成报告

修改 `src/components/youjin-life/ChatBubble.tsx`：
- 新增 `ExpenseCard` 卡片类型，展示记账确认（金额、分类、备注 + ✅ 已记录）
- 新增 `ExpenseReportCard` 卡片，展示月度消费饼图/分类汇总

### 3. 新增组件

| 文件 | 说明 |
|------|------|
| `src/components/youjin-life/ExpenseCard.tsx` | 记账确认卡片（金额、分类、备注） |
| `src/components/youjin-life/ExpenseReportCard.tsx` | 月度报告卡片（分类汇总 + 简单柱状/饼图） |

### 4. 首页快捷入口

在 `src/pages/YoujinLife.tsx` 的 `quickServices` 网格中添加"记账"入口：
- emoji: 💰，label: "记账"，prompt: "帮我记一笔账"
- bg: "bg-green-50"

### 5. 数据层

复用已有的 `finance_records` 表，无需新建表。月度报告通过前端查询 `finance_records` 按月分组聚合。

## 改动文件

| 文件 | 操作 |
|------|------|
| `supabase/functions/youjin-life-chat/index.ts` | prompt 增加记账意图识别与标记输出 |
| `src/pages/YoujinLifeChat.tsx` | 解析 EXPENSE/EXPENSE_QUERY 标记，执行数据库操作 |
| `src/components/youjin-life/ChatBubble.tsx` | 新增 expense/expense_report 卡片类型解析 |
| `src/components/youjin-life/ExpenseCard.tsx` | 新建，记账确认卡片 |
| `src/components/youjin-life/ExpenseReportCard.tsx` | 新建，月度报告卡片 |
| `src/pages/YoujinLife.tsx` | quickServices 增加"记账"入口 |

不改动数据库结构，复用已有 `finance_records` 表。

