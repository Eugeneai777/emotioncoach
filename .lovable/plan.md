

# 有劲AI · 一句话帮你搞定生活 — 实施方案

## 概述

将现有 `/youjin-life` 页面从 `/mini-app` 的副本改造为全新的 AI 生活助手应用。新增 3 个子页面路由、1 个 Edge Function、3 张数据库表，以及约 10 个前端组件。

---

## 路由结构

```text
/youjin-life              ← 首页（AI入口，完全重写）
/youjin-life/chat         ← AI对话页
/youjin-life/assess       ← 生活效率测评
/youjin-life/profile      ← 用户中心
```

---

## 实施步骤（3 轮）

### 第一轮：首页 + AI对话 + 后端

**1. 重写 `src/pages/YoujinLife.tsx`**
- 删除当前所有 mini-app 内容（人群入口、轮播、见证等）
- 新内容：
  - 标题区："一句话，帮你搞定今天" + 副标题
  - 核心输入框（文字 + 语音按钮 + "立即搞定"按钮），示例提示词轮播
  - 3 个快捷入口卡片（情绪一下/生活一下/帮我选），点击预填 prompt 跳转对话页
  - 今日 AI 卡片区（今日建议/待办/提醒，localStorage 模拟）
  - 最近记录列表（从数据库加载）
  - 4-tab 底部导航（首页/对话/测评/我的）
- UI：白底、柔和渐变、大圆角、Apple 极简风

**2. 新建 `src/pages/YoujinLifeChat.tsx`**
- ChatGPT 风格对话界面（气泡结构）
- 输入框（文字 + 语音，复用 `microphoneManager` + Web Speech API）
- AI 思考中骨架屏动画
- 三种内嵌卡片组件：
  - `SuggestionCard`：2-3 方案 + 推荐理由
  - `ActionCard`：立即预约/一键执行/联系服务按钮
  - `FollowUpCard`：设置提醒/加入待办/继续优化
- AI 回复通过 SSE 流式渲染（复用 `LaogeChat` 的 SSE 解析模式）
- 卡片通过解析 AI 回复中的特殊标记（如 `[SUGGESTION]`、`[ACTION]`、`[FOLLOWUP]`）自动渲染

**3. 新建 Edge Function `supabase/functions/youjin-life-chat/index.ts`**
- 使用 Lovable AI Gateway（`google/gemini-3-flash-preview`），流式 SSE
- System prompt 实现：
  - 意图自动识别（情绪/决策/生活服务/复杂）
  - 强制回答结构：共情 → 分析 → 2-3 方案 → 执行建议
  - 三种模式（情绪/决策/执行）由 prompt 根据输入自动切换
  - 内置服务市场模拟数据（保洁/维修/搬家/家政，含价格/评分/距离）
  - 记忆上下文：接收完整对话历史 + 用户偏好 JSON
- 处理 429/402 错误并返回给前端

**4. 数据库迁移（3 张新表）**
- `youjin_conversations`：`id`, `user_id` (nullable), `messages` (JSONB), `intent_type`, `created_at`
- `youjin_user_preferences`：`id`, `user_id`, `preferences` (JSONB), `location`, `history` (JSONB), `created_at`, `updated_at`
- `youjin_todos`：`id`, `user_id`, `title`, `status` (pending/done), `reminder_at`, `created_at`
- RLS：用户只能访问自己的数据
- 认证：复用现有 Auth 系统（手机号+密码登录已实现）

**5. 路由注册**
- 在 `App.tsx` 添加 `/youjin-life/chat`、`/youjin-life/assess`、`/youjin-life/profile` 路由

**6. 底部导航组件**
- 新建 `src/components/youjin-life/YoujinBottomNav.tsx`，4 个 tab

### 第二轮：测评系统

**7. 新建 `src/pages/YoujinLifeAssess.tsx`**
- 5-8 道选择题（生活效率/决策习惯/情绪管理）
- 完成后调用 AI 生成报告（生活效率/决策能力/情绪状态评分 + 改善建议）
- 结果页 html2canvas 一键生成分享海报
- 底部推荐训练营入口（链接 `/camps`）

### 第三轮：用户中心 + 商业模块

**8. 新建 `src/pages/YoujinLifeProfile.tsx`**
- 用户画像（偏好标签、历史行为）
- 会员状态展示（免费版 vs Pro，纯 UI 模拟）
- 最近对话列表 + 待办事项管理
- 快捷链接：我的订单 → `/my-page`、我的测评 → `/energy-studio`、训练营 → `/camps`

**9. 记忆系统完善**
- 对话历史存入 `youjin_conversations`
- 用户偏好自动提取存入 `youjin_user_preferences`
- 支持"按上次那个来"等指令（通过 prompt 注入历史偏好）

**10. 商业模块 UI**
- 会员对比卡片（免费 vs Pro）
- 训练营推荐入口（情绪/财富/关系，链接现有 `/camps`）
- 服务抽佣展示（纯前端模拟）

---

## 技术要点

| 项目 | 方案 |
|------|------|
| AI 模型 | Lovable AI Gateway, `google/gemini-3-flash-preview` |
| 流式输出 | SSE，复用现有解析模式 |
| 语音输入 | Web Speech API (SpeechRecognition) + 现有 microphoneManager |
| 数据库 | 3 张新表 + RLS |
| 认证 | 复用现有 Auth 系统 |
| 海报生成 | html2canvas |
| UI | Tailwind + Framer Motion + shadcn/ui，白底极简 Apple 风格 |

---

## 不涉及的改动

- 不修改现有 `/mini-app` 页面
- 不修改现有 edge functions、支付系统
- 不修改自动生成文件（client.ts、types.ts、.env）

---

## 新建文件清单

```text
src/pages/YoujinLife.tsx              (重写)
src/pages/YoujinLifeChat.tsx          (新建)
src/pages/YoujinLifeAssess.tsx        (新建)
src/pages/YoujinLifeProfile.tsx       (新建)
src/components/youjin-life/YoujinBottomNav.tsx
src/components/youjin-life/SuggestionCard.tsx
src/components/youjin-life/ActionCard.tsx
src/components/youjin-life/FollowUpCard.tsx
src/components/youjin-life/ChatBubble.tsx
src/components/youjin-life/QuickEntryCard.tsx
supabase/functions/youjin-life-chat/index.ts
```

批准后从第一轮开始实施。

