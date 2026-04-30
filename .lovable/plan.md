## 背景

用户在 `/assessment/male_midlife_vitality` 进入「测评历史」后，看到历史卡片列表（如截图共 2 条记录）。当前每张卡片整体可点击会触发 `onViewRecord` 进入完整结果与分享页，但**没有任何视觉或文案引导**告诉中年男性用户"点击卡片即可查看完整测评结果"。需要补足"下一步"指引，并保证在**手机 H5、微信小程序 WebView、PC** 三端均稳定一致。

## 设计目标（商业架构师视角）

1. **降低认知摩擦**：用一句中年男性熟悉、克制、不娇气的话术告诉他下一步做什么。
2. **显性化转化路径**：历史 → 单条结果详情 → 分享/再测，是核心二次留存与社交裂变路径。
3. **视觉一致**：沿用结果页深色金属/能量配色（teal + amber），保持"有劲、稳重、男性化"的产品调性。
4. **三端兼容稳定**：移动端 H5、微信小程序 WebView（含 Android `mmwebsdk`）、PC 端展示一致，不依赖花哨动画或 hover 状态。

## 改动范围

仅修改：
- `src/components/dynamic-assessment/DynamicAssessmentHistory.tsx`

只在 `assessmentKey === 'male_midlife_vitality'`、且记录数 ≥ 1、且未进入对比模式时生效，不影响其它测评（SCL90 / SBTI / 女性 / 伴侣等）。

## 跨端兼容设计原则

| 风险点 | 处理方案 |
|---|---|
| 小程序 WebView 不稳定支持 `backdrop-filter` | 引导横幅与 CTA 行**不使用** `backdrop-blur`，改用纯色 + 透明度 |
| `hover` 在触屏端无效 | CTA 文字本身用 `font-semibold` + teal 主色，**不依赖 hover 形成按钮感**；hover 仅作 PC 端锦上添花 |
| iOS Safari 对 `gap` + `flex` 在小屏的换行差异 | 引导横幅使用 `flex items-start gap-2`，主副文案用 `flex-1 min-w-0`，避免溢出 |
| 微信 WebView 字体回退 | 沿用项目 Tailwind 默认字体栈（已含 PingFang / 微软雅黑），不引入 web font |
| Android MP 触控热区 | 卡片本身就是大热区；新增 CTA 行不绑独立 `onClick`，统一冒泡到卡片 `onClick`，避免重复触发与 webview reentrancy（符合 Core 规范"navigate first, then close dialog"） |
| 安全区 / 视觉一致 | 不改变现有 `max-w-lg md:max-w-2xl mx-auto p-4` 容器，复用现有响应式断点 |
| PC 端宽屏 | 引导横幅在 `md:` 断点下不拉伸成大块，保持 `max-w-2xl` 容器内自然宽度，文案一行展示更舒服 |

## 具体改动

### 1. 列表顶部新增「下一步引导」横幅（仅男人有劲）

插入位置：在 `records.length === 0` 之外的有数据分支，`<motion.div className="space-y-3 pb-4">` **之前**。

```tsx
{isMaleMidlifeVitality && !compareMode && (
  <div
    className="mb-3 rounded-xl border border-teal-600/25 bg-gradient-to-r from-teal-600/10 to-amber-500/10 px-4 py-3 flex items-start gap-2.5"
    role="note"
  >
    <MousePointerClick className="w-4 h-4 mt-0.5 text-teal-700 dark:text-teal-400 shrink-0" />
    <div className="flex-1 min-w-0">
      <p className="text-sm font-semibold text-foreground leading-snug">
        点击下方任一记录,查看完整状态报告
      </p>
      <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">
        含 6 维评分 · AI 个性化建议 · 一键分享海报
      </p>
    </div>
  </div>
)}
```

视觉规格：
- 不使用 `backdrop-blur`（小程序兼容）
- `MousePointerClick` 来自 lucide-react，避免 emoji 在 Android 小程序的字体差异
- 文案用半角逗号避免不同输入法/字体下中文逗号渲染差异
- 对比模式下隐藏，避免与"请选择 2 条记录"提示冲突

### 2. 每张历史卡片底部新增「查看完整报告 →」行内 CTA（仅男人有劲非对比模式）

在现有 `dimScores` Badge 行之后追加：

```tsx
{isMaleMidlifeVitality && !compareMode && onViewRecord && (
  <div
    className="flex items-center justify-end gap-1 mt-3 pt-2.5 border-t border-border/40
               text-xs font-semibold text-teal-700 dark:text-teal-400
               group-hover:text-teal-800 dark:group-hover:text-teal-300 transition-colors"
  >
    查看完整报告 & 分享海报
    <ChevronRight className="w-3.5 h-3.5" />
  </div>
)}
```

- **不绑独立 onClick**：让点击事件冒泡到卡片根的 `onViewRecord(record)`，避免双触发与小程序 WebView reentrancy
- 文字本身 600 字重 + teal 主色，触屏端无 hover 也具按钮感
- `border-t` 形成视觉分隔，告知用户"下方为操作区"

### 3. 可访问性与点击区域语义化

非 SBTI 卡片根 `<Card>` 在 `onViewRecord && !compareMode` 时增加：
- `role="button"`
- `tabIndex={0}`
- `aria-label={\`查看 ${format(new Date(record.created_at), 'yyyy年MM月dd日')} 的完整测评报告\`}`

让读屏器与键盘用户也可访问；不改变实际 onClick 逻辑。

### 4. 不动的部分

- SBTI 折叠卡逻辑（保持原本的展开/收起 + 「查看完整结果 & 分享」按钮）
- 对比模式与删除逻辑
- 顶部 Hero Header 与对比横幅
- 其它测评类型的展示

## 文案选型说明（中年男性接受度）

采用：**"点击下方任一记录,查看完整状态报告"** + **"含 6 维评分 · AI 个性化建议 · 一键分享海报"**
- 直给、不卖弄；"状态报告"贴近职场体检语境，比"测评结果"更稳重
- 副文案点出价值钩子：评分 / AI 建议 / 海报，对应留存与裂变三件套

## 三端验收清单

| 端 | 验收点 |
|---|---|
| 手机 H5（iOS Safari + Android Chrome） | 引导横幅与卡片 CTA 一行内显示不溢出；点击卡片任意位置正确进入完整结果页 |
| 微信小程序 WebView（iOS + Android `mmwebsdk` / `mmw`） | 渐变背景与边框正常显示；无 `backdrop-blur` 模糊残影；点击不出现重复跳转 |
| PC（≥1024px） | 引导横幅在 `max-w-2xl` 容器内自然宽度；卡片 hover 时 CTA 文字加深；其它测评页无任何变化 |
| 对比模式 | 引导横幅与卡片 CTA 自动隐藏；"请选择 2 条记录"提示正常显示 |
| 其它测评（SCL90/SBTI/女性/伴侣） | 历史页**完全无视觉变化**，回归测试通过 |
