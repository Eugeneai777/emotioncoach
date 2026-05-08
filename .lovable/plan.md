# 后台情绪健康测评 - 增加 PDF 凭证下载

## 现状

- `AssessmentRespondentDrawer` 已经支持「男人有劲」(`male_midlife_vitality`) 的「下载 PDF 报告」「复制发送话术」按钮
- 情绪健康测评 (`emotion_health`) 走的是独立表 `emotion_health_assessments`，前端用 `EmotionHealthPdfClaimSheet` + `EmotionHealthPdfClaimCard` 生成「她能量报告·专属凭证」PNG
- 管理员当前点开测评者抽屉，能看到领取码（如 `9MY EJQ`），但没有下载凭证图 / 复制话术的入口，只能让用户自己生成

## 目标

让管理员在后台抽屉里：
1. 一键复制发送话术（含领取码）
2. 一键下载该用户的「专属凭证 PNG」（与用户端完全一致），便于 助教 直接发给用户

## 改动范围（仅 UI / 前端）

### 1. `AssessmentRespondentDrawer.tsx`
- 新增对 `template?.assessmentKey === "emotion_health"` 的分支，渲染两个按钮：
  - **复制发送话术**：拷贝 `您好，您的领取码是 ${claimCode}……` 文案
  - **下载凭证图片**：直接调用 `EmotionHealthPdfClaimCard` + `generateCardBlob` 在抽屉内离屏渲染并下载 PNG（不开新窗口）
- 离屏渲染需要传入 `battery / energyIndex / anxietyIndex / stressIndex / patternName / blockedName`，这些可从 `row.dimensionScores` 取（hook 已写入）

### 2. `useAdminEmotionHealthInsights.ts`
- 在 `respondents` 中追加 `blockedDimension`（目前只存了 `primaryPattern`），便于凭证卡显示「卡点维度」
- 不动数据库、不动 RLS

### 3. （可选）小图标
- 顶部领取码 Badge 旁边沿用现有复制行为，不变

## 不改动

- 数据库 / RLS / 触发器
- `emotion_health_assessments` 表结构
- 用户端 `EmotionHealthPdfClaimSheet` 的逻辑
- `male_midlife_vitality` 现有「打开新窗口下载 PDF」流程

## 技术细节

- 复用现有 `generateCardBlob(cardRef, { forceScale: 1.6 })`，输出 PNG
- 头像走 `safePreloadAvatar`（已在 Sheet 中实现，复制相同逻辑到 Drawer 中的本地子组件）
- 下载文件名：`情绪健康专属凭证_{displayName}_{claimCode}.png`
- 状态管理：`generating` / `previewUrl`，缓存按 `claimCode` 维度

## 验证

- 后台 `/admin/assessments/builtin/emotion-health/insights` → 点测评者 → 抽屉底部出现「复制话术」「下载凭证图片」按钮
- 下载得到的 PNG 与用户端 `/emotion-health` PdfClaimSheet 输出完全一致
- 「男人有劲」抽屉无回归
