

# 关系日记：自动聚合AI教练交互记录

## 概述

将"关系日记"tab 从占位状态升级为自动聚合所有婚姻教练交互记录的时间线视图。数据来源三个渠道：
1. **吵架复盘** — 用户输入 + AI分析结果
2. **沟通教练** — 用户输入 + AI建议
3. **语音婚姻教练** — 通话时长 + 对话摘要

## 数据库

创建 `marriage_diary_entries` 表：

| 字段 | 类型 | 说明 |
|------|------|------|
| id | uuid PK | |
| user_id | uuid NOT NULL | 关联用户 |
| source | text NOT NULL | `quarrel` / `coach` / `voice` |
| user_input | text | 用户原始输入 |
| ai_result | text | AI返回的分析/建议 |
| duration_seconds | int | 语音通话时长（仅voice） |
| created_at | timestamptz | 记录时间 |

RLS：用户只能读写自己的记录。

## 代码改动

### 1. MarriageQuarrelTool.tsx
- 添加 `onResultSaved` 回调 prop
- AI返回结果后，自动插入 `marriage_diary_entries`（source = mode）
- 需要用户登录才保存

### 2. MarriageAITools.tsx
- 语音教练结束后，自动保存一条 `voice` 类型日记（从 `CoachVoiceChat` 的 transcript 提取）
- 给 `CoachVoiceChat` 传入 `onBriefingSaved` 回调，在回调中写入日记

### 3. 关系日记 Tab（新组件 MarriageDiary.tsx）
- 按时间倒序展示所有日记条目
- 每条显示：来源图标（吵架/沟通/语音）、时间、用户输入摘要
- 点击展开查看完整 AI 分析结果
- 空状态引导用户使用其他工具

### 4. Edge Function: marriage-realtime-token
- 在 `CoachVoiceChat` 的 `recordSession` 中，marriage 语音教练走专属逻辑：将 transcript 保存到 `marriage_diary_entries` 而非 `vibrant_life_sage_briefings`

## 实现顺序

1. 创建数据库表 + RLS
2. 修改 `MarriageQuarrelTool` 自动保存日记
3. 修改 `MarriageAITools` 语音结束后保存日记
4. 实现 `MarriageDiary` 组件替换占位内容

