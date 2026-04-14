

# 有劲专属模式 — 选完产品后推荐3个爆款主题

## 概述

在有劲AI专属模式下，用户选完转化产品后，自动调用AI生成3个爆款主题推荐。用户可以点选其中一个，也可以自己输入自定义主题。

## 实现步骤

### 1. 新增 Edge Function 逻辑（复用 `drama-script-ai`）

在 `drama-script-ai` edge function 中新增一个 `action: "suggest_themes"` 模式：
- 输入：选中的产品列表 + 目标人群
- AI 根据产品卖点 + 人群痛点，返回 3 个爆款主题建议
- 输出格式：`{ themes: [{ title: "主题标题", description: "一句话说明为什么这个主题容易爆" }] }`
- 使用轻量模型（gemini-2.5-flash）快速返回

### 2. 改造前端 `DramaScriptGenerator.tsx`

**流程变化**：
1. 用户选完产品后，自动触发主题推荐请求（或显示「获取推荐主题」按钮）
2. 展示 3 张推荐主题卡片，点击即填入主题输入框
3. 主题输入框保持可编辑，用户可以自定义
4. 点击生成按钮开始生成脚本

**新增状态**：
- `suggestedThemes: { title: string; description: string }[]`
- `loadingThemes: boolean`

**触发时机**：当 `selectedProducts.size > 0` 且产品选择发生变化时，自动请求推荐（加 debounce 防抖）

**UI 位置**：在产品选择区和主题输入框之间，插入推荐主题卡片区域：
- 3 张横排卡片，显示标题 + 爆款理由
- 点击卡片高亮选中并填入主题输入框
- 加载中显示骨架屏

### 3. 无数据库变更，无新密钥

