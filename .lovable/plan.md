

# 优化方案：链接中国生活服务平台

## 现状

当前 ActionCard 按钮点击只弹 toast "功能即将上线"，没有实际跳转。服务数据是 AI prompt 中的模拟数据，无外部链接。

## 方案

### 1. ActionCard 支持外链跳转

给 Action 接口新增可选 `url` 字段，点击按钮时用 `window.open(url)` 跳转外部平台。

### 2. 服务类型 → 平台映射

根据 AI 识别的服务类型，自动关联对应的中国主流平台：

| 服务类型 | 推荐平台 | 链接 |
|---------|---------|------|
| 保洁/家政 | 58到家 | `https://daojia.58.com` |
| 维修 | 啄木鸟家庭维修 | `https://www.zmn.cn` |
| 搬家 | 货拉拉 | `https://www.huolala.cn` |
| 外卖/吃什么 | 美团 | `https://www.meituan.com` |
| 跑腿/代办 | 闪送 | `https://www.ishansong.com` |

### 3. 更新 AI System Prompt

在 Edge Function 的 system prompt 执行模式中，让 AI 在推荐服务时输出平台名称和类别标识，前端根据类别自动匹配外链。

### 4. 新增 ServiceLinkCard 组件

在 ChatBubble 中新增一种卡片类型，展示：
- 平台 logo/图标 + 名称
- 一句话描述（如 "去58到家找附近保洁"）
- 跳转按钮

## 改动文件

| 文件 | 操作 |
|------|------|
| `src/components/youjin-life/ActionCard.tsx` | Action 接口加 `url`，按钮支持外链 |
| `src/components/youjin-life/ServiceLinkCard.tsx` | 新建，平台链接卡片 |
| `src/components/youjin-life/ChatBubble.tsx` | 解析新卡片标记 `[SERVICE_LINK]` |
| `supabase/functions/youjin-life-chat/index.ts` | prompt 中加入平台推荐指引 |

不改动任何现有业务逻辑。

