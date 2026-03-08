

## 实施计划：A 历史页视觉升级 + B 分享海报功能

---

### A. 历史记录页视觉升级

**文件**: `src/components/dynamic-assessment/DynamicAssessmentHistory.tsx`

改动要点：
- 外层容器改为渐变背景 `bg-gradient-to-b from-primary/5 via-background to-background`，与介绍页/结果页统一
- 卡片改为 glassmorphism 风格：`backdrop-blur-sm bg-card/90 border-primary/10`
- 列表项用 `framer-motion` 添加交错 fadeUp 动画（`staggerChildren`）
- 对比面板也应用 glassmorphism + 入场动画
- 空状态插画加大 emoji 并增加 scale-in 动画
- 加载骨架屏改为 shimmer 效果

---

### B. 分享海报功能

参照现有 `CompetitivenessShareCard` + `ShareImagePreview` + `executeOneClickShare` 的成熟模式。

**1. 新建分享卡片组件**
- 文件: `src/components/dynamic-assessment/DynamicAssessmentShareCard.tsx`
- 使用 `forwardRef`，固定宽度 340px，inline styles（html2canvas 兼容）
- 内容：评分环形图、维度得分条、主要类型标签、品牌标识
- 接收 props：`totalScore, maxScore, dimensionScores, primaryPattern, emoji, title, displayName, avatarUrl`

**2. 修改结果页集成分享**
- 文件: `src/components/dynamic-assessment/DynamicAssessmentResult.tsx`
- 替换现有简单 `handleShare`（仅复制文字）为图片海报分享流程
- 添加隐藏的 `DynamicAssessmentShareCard`（`position: absolute, left: -9999px`）
- 使用 `executeOneClickShare` + `generateCardBlob` 生成图片
- 使用 `ShareImagePreview` 组件展示生成的海报（支持长按保存）
- 获取用户头像/昵称（从 profiles 表）

**3. 复用现有基础设施**
- `src/utils/shareCardConfig.ts` — `generateCardBlob`
- `src/utils/oneClickShare.ts` — `executeOneClickShare`
- `src/components/ui/share-image-preview.tsx` — 全屏预览
- `src/utils/avatarUtils.ts` — 头像代理

