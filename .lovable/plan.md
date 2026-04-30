## 商业架构诊断（中年男性视角）

中年男性用户的核心特质：**时间稀缺、决策果断、要"私密+可掌控"**。当前【男人有劲状态评估】详情页与结果页的三处摩擦点：

1. **"查看历史记录"埋在最底部**：滚过 7 个 Block 才能看见，复测用户被当首次用户对待。
2. **重新测评入口只在结果页**：详情页对老用户没有"再测一次"快捷入口。
3. **结果无法离线带走**：只有"分享海报"路径（带二维码、营销味重），缺少"私密的完整报告"出口给用户存档/给医生看/同步家人。

---

## 优化方案

### 一、详情页顶部「老用户快捷区」（条件渲染，仅 vitality）

`hasHistory === true` 时，在 Hero 下方、描述卡之前插入一张紧凑卡：

```text
┌─────────────────────────────────────────────┐
│  👋 欢迎回来,你已有 N 次记录                  │
│  上次:04/30 · 状态电量 62%(半电)             │
│  [📊 查看历史]   [🔄 再测一次(看变化)]       │
└─────────────────────────────────────────────┘
```

- 男性向语言："再测一次（看变化）"——强调收益，不是动作。
- 复用 `getStatusBand()` + `toVitalityStatusScore()` 显示上次状态摘要。
- 底部"查看历史记录"按钮保留，不破坏现有路径。
- 首次用户零渲染，零影响其它测评。

### 二、结果页「保存完整报告」按钮（仅 vitality）

底部 Action Buttons 区新增主推按钮：

```text
[💾 保存完整报告]
[📊 查看历史记录]   [🔄 重新测评]
```

点击后弹底部 Sheet：

```text
┌────────────────────────────────────┐
│  保存完整报告                       │
├────────────────────────────────────┤
│ 📷 保存为长图 (推荐)                │
│ ▼ 更多格式                          │
│   📄 保存为 PDF                     │
└────────────────────────────────────┘
```

**报告内容（与海报区分）**：
- 头部：标题、姓名（可隐藏）、测评日期
- 状态电量总分 + 三档分级文案
- 6 维雷达图（翻转后的状态指数）
- 每维得分 + 男性向解读（复用 `getDeltaCopy`）
- AI 个性化洞察全文
- 本周一个动作（`getActionForWeakestDimension`）
- 页脚：免责声明 + 极小品牌水印
- **不带二维码、不带营销 CTA**——这是私密报告，不是分享海报

### 三、微信环境下载分端策略（核心）

| 环境 | 图片保存 | PDF 保存 |
|---|---|---|
| PC / 系统浏览器 | ✅ 直接下载 | ✅ 直接下载 |
| 微信 H5 | ✅ 弹长图预览 → 长按保存到相册 | 弹引导卡 + 复制专属链接 |
| 微信小程序 web-view | ✅ 弹长图预览 → 长按保存（兜底复制链接） | 弹引导卡 + 复制专属链接 |

**默认路径**：图片（长按保存，微信原生交互，零学习成本）。
**PDF 折叠在「更多格式」里**：避开大多数用户，只暴露给真正想要 PDF 的少数人。

#### 微信内点 PDF 时的引导卡：

```text
┌────────────────────────────────────────┐
│  📄 PDF 需在浏览器中打开下载            │
│                                        │
│  微信暂不支持直接保存 PDF              │
│                                        │
│  方式一:复制链接到浏览器               │
│  ┌──────────────────────────────────┐ │
│  │  📋 复制专属链接                  │ │
│  └──────────────────────────────────┘ │
│  打开浏览器 → 粘贴 → 自动跳到保存按钮  │
│                                        │
│  方式二:点右上角 ··· → 在浏览器打开    │
│  (静态 SVG 图示标出位置)               │
│                                        │
│  ┌──────────────────────────────────┐ │
│  │  📷 改为保存图片(更简单)          │ │
│  └──────────────────────────────────┘ │
└────────────────────────────────────────┘
```

#### 复制的专属链接结构

```
https://wechat.eugenewe.net/assessment/male_midlife_vitality?recordId=xxx&autoSave=pdf
```

- `recordId=xxx`：精确定位到这次测评结果（从 `partner_assessment_results.id` 取）。
- `autoSave=pdf`：浏览器打开后落地页自动滚动到结果页 + 顶部高亮闪烁「💾 保存 PDF」按钮 3 秒，引导用户点击。
- 用 `wechat.eugenewe.net` 域名，符合【External Domain Standard】。

#### 落地页自动定位逻辑（`DynamicAssessmentResult.tsx`）

- 检测 URL 参数 `?recordId=xxx`：从历史中读取该条记录直接渲染，跳过测评流程。
- 检测 `?autoSave=pdf`：组件挂载后 800ms 滚动到 Action Buttons 区，给「保存完整报告」按钮加 3 秒高亮脉冲动画 + 顶部 Toast「点这里保存 PDF ↓」。
- 用户在浏览器中点击即可直接触发下载，体验丝滑。

---

## 技术实现

### 文件清单（5 个文件）

1. **修改** `src/components/dynamic-assessment/DynamicAssessmentIntro.tsx`
   - 新增 props：`lastRecord?: DynamicAssessmentRecord`、`historyCount?: number`
   - 仅 `isMaleMidlifeVitality && hasHistory && lastRecord` 时渲染顶部快捷卡
   - 两个按钮分别复用现有 `onShowHistory` 和 `onStart` 回调

2. **修改** `src/pages/DynamicAssessmentPage.tsx`
   - 向 Intro 传 `lastRecord = history?.[0]` 和 `historyCount = history?.length`
   - 检测 URL `?recordId=xxx`：load 该记录后直接进结果页（绕过 intro/测评流程）
   - 透传 `?autoSave=pdf` 给结果组件

3. **修改** `src/components/dynamic-assessment/DynamicAssessmentResult.tsx`
   - 新增「保存完整报告」按钮 + Save Format Sheet（默认图片，PDF 在"更多格式"内）
   - 环境检测（复用 `src/lib/platformDetector.ts`）：
     - 微信/小程序 + 图片 → `ShareImagePreview` 长按保存模式
     - 微信/小程序 + PDF → 弹 `WeChatPdfGuideSheet`
     - 浏览器 → 直接 `<a download>` 触发
   - 接受 prop `autoSavePdf`：触发滚动 + 按钮高亮脉冲

4. **新增** `src/components/dynamic-assessment/MaleVitalityReportCard.tsx`
   - A4 比例（750×1060）报告组件，inline styles 兼容 html2canvas
   - 复用 `maleMidlifeVitalityCopy.ts` 全部文案
   - 不依赖 framer-motion（避免截到中间帧）

5. **新增** `src/components/dynamic-assessment/WeChatPdfGuideSheet.tsx`
   - 微信内 PDF 引导组件
   - "复制专属链接"按钮：拼装 `wechat.eugenewe.net/...?recordId=xxx&autoSave=pdf` → `navigator.clipboard.writeText()` → Toast 反馈
   - "改为保存图片"按钮：关闭 Sheet 并触发图片保存路径
   - 静态 SVG 图示（"右上角 ···" 位置）

6. **新增** `src/utils/exportReportToPdf.ts`
   - `html2canvas → toBlob → jspdf 多页切割（A4 595×842pt）`
   - 复用现有 `src/utils/shareCardConfig.ts` 的 generateCanvas 配置
   - 浏览器环境：`pdf.save(filename)` 直接下载
   - 微信环境：不调用，由上层 Sheet 拦截

### 三端兼容矩阵

| 端 | 顶部快捷卡 | 保存图片 | 保存 PDF |
|---|---|---|---|
| H5 iOS Safari | ✅ | ✅ 直接下载 | ✅ 直接下载 |
| H5 Android Chrome | ✅ | ✅ 直接下载 | ✅ 直接下载 |
| 微信 H5 | ✅ | ✅ 长按保存预览 | 引导卡 + 复制链接 |
| 微信小程序 web-view | ✅ | ✅ 长按保存（兜底复制链接） | 引导卡 + 复制链接 |
| PC 浏览器 | ✅ | ✅ 直接下载 | ✅ 直接下载 |

---

## 不做的事（控制范围）

- 不改数据库、不动 edge function、不动 OG 配置
- 不替换现有"分享海报"路径（私密报告与营销海报双轨并行）
- 不引入 AI 文案生成（全部规则映射）
- 顶部快捷卡 + 报告组件首版仅 `male_midlife_vitality` 生效，其它测评零影响
- 不做小程序原生 `wx.saveImageToPhotosAlbum` 桥接（项目无 jweixin-bridge，徒增复杂度）

---

## 商业价值闭环

- 老用户回访效率 ↑：3 屏滑动压缩到 0.5 屏
- 复测频次 ↑：顶部"看变化"主动提示价值
- 用户留存物 ↑：私密 PDF/图片 = 主动归档 = 长期记忆锚点
- 微信生态友好：默认图片走原生长按，PDF 走外跳但有"专属链接 + 自动定位"丝滑兜底
- 不损害分享海报转化：两条路径独立

预计代码量 ≈ 550 行。零数据库变更，零新增依赖（html2canvas / jspdf 已在用）。
