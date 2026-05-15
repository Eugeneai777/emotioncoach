# 男人有劲状态评估 · 3 项优化

## 1. 结果页弹窗 → 只显示企微二维码

**触发点**：结果页 `🎯 拆解你的认知盲区,拿专属行动方案` 按钮（DynamicAssessmentResult.tsx:1367）当前打开 `MaleVitalityPdfClaimSheet`（含三步引导、领取码、专属凭证海报、复制/保存按钮）。

**改造方案**：
- 新建轻量 `MaleVitalityWeChatSheet.tsx`，内容只保留：
  - 标题：`加顾问微信 · 拆解你的盲区`
  - 一段引导文案（1-2 行，与盲区卡片承接）
  - 大尺寸企微二维码图（取 `template.qr_image_url`，约 240×240）
  - "长按识别二维码 / 备注「有劲」"提示
  - 底部一个关闭按钮
- 移除：三步引导列表、专属凭证海报截图（cardRef / generateCardBlob）、领取码骨架屏、复制领取码、保存到本地、领取码展示
- 结果页将原 `<MaleVitalityPdfClaimSheet ...>` 替换为 `<MaleVitalityWeChatSheet open onOpenChange qrImageUrl qrTitle/>`，删除不再需要的 props
- `MaleVitalityPdfClaimSheet.tsx` / `MaleVitalityPdfClaimCard.tsx` 暂保留文件不删（避免影响其它引用，如有），但结果页不再引用
- `claimCode / loadingClaimCode` 在结果页保留生成逻辑（顾问后台仍可对账），仅 UI 不再展示

## 2. 小程序端图/音频题修复

**当前问题**：
- `q1_spiral.png` 254KB（偏大），`q6_door.jpg` 33KB（OK）
- 音频用 `new Audio(url)` + `.play()`，相对路径 `/assessment-media/xxx.mp3`，在微信 WebView（尤其 iOS 微信小程序 web-view）会出现：未触发预加载导致首次点击长时间无响应、缺少 `playsinline` 字段、URL 解析慢

**改造方案**：

**2a. 静态资源优化**
- 把 `q1_spiral.png` 转换并替换为同名（或新增）`q1_spiral.webp`，目标 ≤ 60KB；保留 png 兜底
- 给 `<img>` 加 `width/height` 显式尺寸 + `decoding="async"` + `fetchpriority="high"`（题目首屏图）
- 进入题目时对下一题的图/音频做 `<link rel="preload">` 注入或 `new Image().src = ...` 预热

**2b. `QuestionMedia.tsx` 健壮化**
- 图片：加 onError 兜底（显示占位 + `点击重试`），使用 `loading="eager"`（当前题）/`lazy`（其他）
- 音频：
  - 改为在组件挂载时即创建 `Audio` 实例并 `audio.preload = "metadata"`，`playsinline=true`、`webkit-playsinline=true`
  - 首次点击时若 `readyState < 2`，显示 `加载中…` spinner，并在 `canplay` 后自动 play（同一 user gesture 内）
  - 显式 `audio.load()` 触发；增加 timeout 5s 失败提示 `加载失败,点击重试`
  - URL 处理：若是相对路径 `/assessment-media/...`，转换为基于 `window.location.origin` 的绝对 URL（部分小程序 webview 对相对路径解析异常）

**2c. 数据库 URL 升级（可选，本次只在前端做绝对化，DB 内容不动）**

## 3. 售前页内容与新题库对齐

**当前不一致**：
- 售前页 `radarPreview` 使用 6 维度（精力续航/睡眠修复/压力调节/关键时刻信心/关系温度/行动恢复力），与实际题库 5 维度（神经紧绷/慢性疲劳/情绪底色/心因表现焦虑/核心动力）不匹配
- 痛点文案 (`painPoints`) 没体现新增的多模态题型（视觉旋转图、声音、半开的门、色盘等）
- 对比块（traditional vs ours）笼统

**改造方案** — 仅修改 `src/components/dynamic-assessment/DynamicAssessmentIntro.tsx` 中 `male_midlife_vitality` 配置块：

- **radarPreview** 改为 5 维（与题库 1:1）：神经紧绷 / 慢性疲劳 / 情绪底色 / 心因表现焦虑 / 核心动力，emoji 与示例分数同步
- **painPoints** 改为 3-4 条，贴近实际题目的场景：
  - 🌪️ 看一张图、听一段声音，就能感觉到身体的紧绷
  - 🌙 闹钟一响,像被卡车碾过又被拼回来
  - 📱 晚上 11 点老板一句"在吗",心脏先漏一拍
  - 🚪 半开的门后,直觉在等你交代什么
- **comparison.ours** 改为：用图 / 声音 / 颜色 / 场景 4 类多模态题,5 分钟看清你的"神经紧绷-疲劳-情绪-焦虑-动力"链路
- **scene.tags** 改为：神经紧绷 / 睡不深 / 关键时刻心慌 / 提不起劲
- **authority** 中"围绕精力、睡眠、压力、关系和信心"改为"围绕神经紧绷、慢性疲劳、情绪底色、心因焦虑、核心动力"

## 影响范围与兼容

- **改动文件**（约 4 个）：
  - 新增 `src/components/dynamic-assessment/MaleVitalityWeChatSheet.tsx`
  - 编辑 `src/components/dynamic-assessment/DynamicAssessmentResult.tsx`（替换 Sheet 引用）
  - 编辑 `src/components/dynamic-assessment/QuestionMedia.tsx`（音频健壮化、URL 绝对化、图片属性）
  - 编辑 `src/components/dynamic-assessment/DynamicAssessmentIntro.tsx`（售前页配置 5 维 + 文案）
  - 资源 `public/assessment-media/q1_spiral.webp` 新增（压缩版本）
- **不动**：测评题目数据（`partner_assessment_templates.questions`）、维度计分逻辑、维度内打乱逻辑、其它评估
- **回滚**：单文件可独立回退；`MaleVitalityPdfClaimSheet` 保留供后续复用

## 验收

1. 结果页点击 `🎯 拆解你的认知盲区...` → 只看到二维码 + 提示语，无领取码/凭证截图
2. 微信小程序 web-view 内：q1 图 < 1s 出图；q4/q7 音频点击后 ≤ 2s 开始播放，二次点击立即响应
3. 售前页雷达预览/痛点/对比块文案与实际测评 5 维度完全对齐