## 目标

把 `/assessment/women_competitiveness` 结果页对标 `/assessment/male_midlife_vitality`，做到**视觉、转化、品牌、可分享性、私域留档**全维度统一。

## 信息架构（最终结果页自上而下）

1. Hero：表情图标 + 进度环 + **"绽放指数 N%"** 徽章 + 分档共情文案（4 档）
2. 双栏布局（≥lg）：左侧能力雷达放大；右侧维度卡 + 特征 + 改善建议
3. **品牌化分享按钮**："分享我的35+绽放报告"（rose→purple 渐变）
4. AI 个性化洞察
5. AI 教练深度解读（已存在）
6. **双训练营推荐卡**：7天有劲（已加） + 身份绽放（新增，呼应 Bloom 系列）
7. **保存完整报告**按钮 → 弹窗 → 长图 / PDF（微信内自动跳浏览器引导）
8. QR 卡 / 历史记录 / 重新测评

## 命名口径

- 总分展示统一改为 **「绽放指数 N%」**
- 雷达标题 → 「绽放力雷达」
- 私密报告标题 → 「35+ 绽放报告」
- 分享按钮文案 → 「分享我的35+绽放报告」

## 4 档分档共情文案（绽放指数）

- ≥80：「你已经在绽放期：底盘稳，资源、能量、关系都在你这边。可以开始把它放大成系统性影响力。」
- 60–79：「你具备绽放底气，只是被多线消耗稀释了。重启节奏感后会快速回弹。」
- 40–59：「你不是不行，是 35+ 的你同时在扛太多线。先把电量充回来，再谈竞争力。」
- <40：「当前已经在低电量运行。不建议硬撑，先把睡眠、情绪、节奏修复，再谈外部突破。」

## 技术方案

### 1. `DynamicAssessmentResult.tsx`
- 新增 `isWomenCompetitiveness = template.assessment_key === 'women_competitiveness'`
- Hero 区徽章：和男人有劲一样替换为「绽放指数 N%」（不翻转分数，直接用 `scorePercent`）
- Hero 描述：用 `competitivenessSummary`（4 档分档）替换默认 `primaryPattern.description`
- 双栏布局：复用现有 `isMaleMidlifeVitality` 的 grid 写法，扩展条件为 `isMaleMidlifeVitality || isWomenCompetitiveness`
- 雷达标题：在 `isWomenCompetitiveness` 时显示「绽放力雷达」
- 已加的 7天有劲推荐卡下方追加身份绽放卡（rose→purple 系列，跳 `/camp-intro/identity_bloom`）
- 加品牌化分享按钮（位置同男人有劲：tips 之后、AI 洞察之前）
- 加「保存完整报告」按钮（条件：`isWomenCompetitiveness && aiInsight && !isLiteMode`），复用现有 `showSaveSheet` / `handleSaveAsImage` / `handleSaveAsPdf` 逻辑，但 `reportCardRef` 改为指向新组件
- 隐藏 share card 区追加 `isWomenCompetitiveness` 分支：渲染新分享卡 + 新报告卡

### 2. 新建 `src/components/dynamic-assessment/WomenCompetitivenessShareCard.tsx`
- 复制 `MaleMidlifeVitalityShareCard` 结构
- 渐变色：`linear-gradient(145deg, #831843 0%, #6d28d9 56%, #ec4899 100%)`（rose→violet→pink）
- footer ctaTitle：「扫码看你的35+绽放力」；sharePath：`/assessment/women_competitiveness`
- 不做翻转（分数越高越好）

### 3. 新建 `src/components/dynamic-assessment/WomenCompetitivenessReportCard.tsx`
- 复制 `MaleVitalityReportCard` 结构
- 配色改为 rose/purple 三档：`full=#FDF2F8/#9D174D/#EC4899`，`half=#FEF3C7/#92400E/#F59E0B`，`low=#FFE4E6/#9F1239/#F43F5E`
- 标题「35+ 绽放报告」，弱项行动文案改为 35+ 女性场景（职场/家庭/自我重启），可在组件内写一份独立的 `getActionForWomenWeakest(label)`
- 文件名 `35+绽放报告_${date}.pdf` / `_${date}.png`

### 4. 不动的部分
- 不打开 Lite 模式（女性测评是付费墙，与 Lite 冲突）
- 不动数据库、不动评分逻辑、不动其他测评行为
- `useEffect(autoSavePdf)` 已是通用代码，会自动覆盖女性测评

## 验证

1. 浏览器进入 `/assessment/women_competitiveness` 历史报告页：确认徽章变「绽放指数 N%」、双栏雷达放大、双训练营卡、品牌化分享按钮、保存完整报告按钮均出现
2. 点击保存完整报告 → 长图导出，截图查看私密报告版式正常
3. 点击品牌化分享按钮 → 分享卡片预览展示 rose→purple 配色
4. 移动端 viewport（375）下确认双栏自动塌成单列、所有按钮可点