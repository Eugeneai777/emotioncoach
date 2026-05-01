## 修复【男人有劲】测评两个问题

### 问题1: 修复"保存完整报告"绕过登录漏洞

**根因**: `保存完整报告` 按钮显示条件是 `aiInsight && isMaleMidlifeVitality`,但 `generateInsight()` 在未登录时仍然执行,导致未登录用户也能拿到完整 PDF/长图。

**修复**(双重保险 + 节省 AI Token):
1. **`src/pages/DynamicAssessmentPage.tsx` `generateInsight()` 顶部加守卫**:`if (isLiteMode) return;`
2. **`src/components/dynamic-assessment/DynamicAssessmentResult.tsx` 保存按钮显示条件加 `&& !isLiteMode`**(L937)
3. **lite 登录卡 CTA 文案升级**(L688-704):
   - 主标题:`登录解锁完整报告 + 私密 PDF`
   - 副标题:`6 维深度诊断 · AI 私人解读 · 一键保存私密 PDF`
   - 强化"保存"是登录后的特权

### 问题2: 重新测评题目顺序随机化

**评估**: 题库共 20 题 / 6 维度(分布不均: stress/energy 各 4 题, 其余各 3 题)。**不做抽题**(样本太薄会破坏评估信效度),只做**全量 20 题 Fisher-Yates 顺序打乱**,既满足"题目都不一样"的体感,又保留维度完整性。

**修复**(`src/pages/DynamicAssessmentPage.tsx`):
1. **新增 `retakeNonce` state**(初值 0),作为 useMemo 依赖触发重洗
2. **扩展 `questions` useMemo**: 对 `male_midlife_vitality` 走"全量 + Fisher-Yates shuffle"分支,依赖 `[allQuestions.length, retakeNonce]`
3. **`handleRetake()` 中 `setRetakeNonce(n => n + 1)`**: 每次重测触发重洗
4. **首次进入也用洗牌后顺序**(更自然)

### 兼容性确认
- ✅ 已登录/已购买用户: 行为不变,保存功能正常
- ✅ 训练营支付链路: 不依赖测评题目顺序,无影响
- ✅ 分享海报/雷达图: 基于 result 总分/维度分,与题目顺序无关
- ✅ 历史记录: 每条用当时 `answers` 索引存储,顺序变化不影响存量数据
- ✅ 三端(H5/微信WebView/桌面): 纯前端逻辑,无兼容性风险
- ✅ 不涉及数据库 schema、RLS、边缘函数

### 改动文件
- `src/pages/DynamicAssessmentPage.tsx` (~10 行)
- `src/components/dynamic-assessment/DynamicAssessmentResult.tsx` (~5 行)