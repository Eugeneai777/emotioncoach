## 方案 v2：底部 Sticky CTA（替代"中间滑动+上下固定"）

### 您的诉求
让【领取我的完整 PDF 诊断报告】始终可见，不被埋在长内容中。

### 商业架构师评估：为什么不建议"上下两端固定 + 中间滑动"

技术上可行（CSS `position:fixed` + `overflow-y:auto`），但**强烈不推荐**，原因如下：

| 维度 | "上下固定 + 中间滑动" | 仅"底部 Sticky CTA" |
|------|----------------------|-------------------|
| iOS Safari 兼容性 | ❌ 顶/底 fixed 在 iOS 滚动时频繁抖动、地址栏伸缩导致高度跳变 | ✅ 原生支持 `position:sticky`，无抖动 |
| 微信内置浏览器 | ❌ 微信 WebView 已知 fixed 元素回弹/键盘弹起遮挡 bug | ✅ 稳定 |
| 安卓键盘弹起 | ❌ 中间滚动容器会被压缩到几乎不可见 | ✅ 仅底部按钮被键盘推高 |
| 浏览器原生下拉刷新 | ❌ 双层滚动会拦截，体验割裂 | ✅ 保留原生体验 |
| 分享截图/保存图片 | ❌ 内嵌滚动容器无法截全 | ✅ 长截图正常 |
| 移动端历史滚动恢复 | ❌ 路由返回时滚动位置丢失 | ✅ 正常恢复 |
| 桌面端阅读体验 | ⚠️ 双滚动条混乱，鼠标滚轮容易"穿透" | ✅ 单一滚动 |
| 实施复杂度 | 高（需要测多端 + 处理键盘/地址栏事件） | 低 |

**结论：用「底部 Sticky CTA」可以达到 95% 的同等效果，且兼容性、稳定性远胜，强烈推荐采用此方案。**

---

### 推荐方案：底部 Sticky 双按钮栏

```text
─────────────────────────
  正常滚动的结果页内容
  （雷达图 / 状态 / 改善建议 / AI 解读 / 训练营 / ...）
─────────────────────────
┊  ↓ 滚动时这一栏固定在底部 ↓        ┊
┊                                    ┊
┊ [📋 领取我的完整诊断报告]   [🤖 AI] ┊  ← sticky bar
┊  由 EUGENE 顾问 · 24 小时内送达     ┊  ← 副文案
┊                                    ┊
─────────────────────────
```

#### 技术实现要点

1. **使用 `position: sticky` + `bottom: 0`**（非 `fixed`），挂在结果页内容容器内：
   - 自动避开外层导航与安全区
   - iOS / 安卓 / PC 全兼容，无双层滚动
   - 用 Tailwind `sticky bottom-0 z-30` 即可

2. **iOS 安全区适配**：`pb-[env(safe-area-inset-bottom)]`，避免被 Home 指示条遮挡

3. **背景与可读性**：
   - 半透明白底 + `backdrop-blur-md` + 顶部细分割阴影 `shadow-[0_-2px_12px_rgba(0,0,0,0.06)]`
   - 主按钮高度 `h-12`，副文案 `text-[11px]`，整栏高度约 80px

4. **滚动覆盖避免**：在结果页内容末尾加 `pb-24`，防止最后一段被 sticky 栏遮住

5. **智能隐藏（可选优化）**：
   - 当用户滚到页面底部、原位的"动作按钮区"已露出时，sticky 栏自动淡出
   - 用 IntersectionObserver 监听底部锚点，避免重复出现两个相同按钮
   - 移动端 / 桌面端均生效

6. **桌面端适配**：sticky 栏仅在内容容器内吸底（不是整个 viewport），保留卡片式阅读体验，宽度跟随中央 max-w 容器

7. **不再需要原"动作按钮区"中的 PDF CTA**：因 sticky 栏已承担其角色，原区块改为只保留"分享/历史/重测"次级动作

#### 埋点
- `pdf_claim_sticky_view`：sticky 栏首次进入视窗
- `pdf_claim_sticky_clicked`：用户点击 sticky 主按钮
- 与 `pdf_claim_sheet_opened` 串联评估转化路径

---

### 仍保留 v1 方案中其他三项优化

1. **文案去"运营化"** → 全链路替换为「EUGENE 顾问 / 私人顾问 / 24 小时 / 1v1 解读」
2. **改善建议升级** → 男版按 `vitalityStatusPercent` 三档（≥60 / 40-59 / <40）的场景化「7 天有劲恢复行动」清单（参照女版 `bloomActions` 模式，今晚/本周可落地）
3. **训练营卡保留** → 与 PDF CTA 分层（PDF 引流为主，训练营付费为辅）

---

### 改动文件（仅 UI 层，零业务逻辑）

1. **`src/components/dynamic-assessment/DynamicAssessmentResult.tsx`**
   - 在 `isMaleMidlifeVitality && !isLiteMode` 分支末尾，渲染容器底部新增 `<StickyClaimBar />`
   - 内容容器追加 `pb-24` 避免遮挡
   - 移除原 1081-1099 行中重复的 PDF CTA（避免双按钮）
   - 男版改善建议改为 `vitalityActions` 场景化清单（替换通用 tips 渲染）
   - 文案统一切换为顾问语境

2. **`src/components/dynamic-assessment/MaleVitalityClaimStickyBar.tsx`**（新建）
   - sticky 底栏组件，含主 CTA + 副文案
   - IntersectionObserver 智能隐藏
   - 桌面/移动端响应式

3. **`src/components/dynamic-assessment/MaleVitalityPdfClaimSheet.tsx`**
   - SheetTitle、三步引导、按钮文案改为顾问语境
   - "运营/运营企微/运营企业微信" → "EUGENE 顾问 / 私人顾问"

4. **`src/components/dynamic-assessment/MaleVitalityPdfClaimCard.tsx`**
   - 海报全部"运营"字样替换为"EUGENE 顾问"
   - 保留视觉风格不变

### 不改动
- 数据库、领取码生成逻辑、useClaimCode、admin 后台
- 女版 women_competitiveness 任何文案与逻辑
- 训练营卡片定价与跳转

### 验证清单
- [ ] iPhone Safari / 微信 / 安卓微信 / Chrome Desktop 均无抖动、无遮挡、无双滚动
- [ ] iOS Home 指示条不遮挡 sticky 按钮
- [ ] 安卓输入法弹起时 sticky 栏行为正常
- [ ] 滚动到底部，sticky 栏淡出，不与原次级动作区重复
- [ ] 男版改善建议显示三档场景化清单
- [ ] 全链路无"运营"字样
- [ ] 女版完全不变
- [ ] 长截图保存正常

确认后开始实施。