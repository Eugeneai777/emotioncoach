## 问题诊断

**1. 残留「EUGENE」文案**（凭证海报 `MaleVitalityPdfClaimCard.tsx`，上次只改了 alt 没改可视文案）：
- L85：`EUGENE · 你的专属凭证`
- L240：`长按识别二维码，添加你的 EUGENE 专属顾问`（图中红框 1）
- L278：`扫码添加 · EUGENE 私人顾问`（图中红框 2）
- L289：`仅供本人使用，请勿外传 · EUGENE 出品`

**2. 凭证图加载慢的根因**
- `MaleVitalityPdfClaimSheet.tsx` 打开 Sheet 后才开始：等 150ms → html2canvas 离屏渲染 750px 海报 → `forceScale: 2`（实际渲染 1500px 大画布）
- 卡片内含两张图：远程头像 `avatarUrl`（跨域、网络等待）+ 本地企微 QR（小，问题不大）
- 头像 `crossOrigin="anonymous"` 若服务端 CORS 不全或网络慢，html2canvas 会等待或降级，整体首屏 1.5-3s 起
- 每次开 Sheet 都重新生成（无缓存），重复打开依旧慢

## 优化方案（仅前端展示层，不动业务/DB/领取码逻辑）

### A. 文案修复（一次性）
将 `MaleVitalityPdfClaimCard.tsx` 中 4 处 `EUGENE` 全部替换为「有劲」品牌：
- L85 → `有劲 · 你的专属凭证`
- L240 → `↓ 长按识别二维码，添加你的「有劲顾问」 ↓`
- L278 → `扫码添加 · 有劲私人顾问`
- L289 → `仅供本人使用，请勿外传 · 有劲出品`

### B. 凭证图性能与稳定性优化（多端兼容）

**B1. 头像预加载 + 跨域降级（核心瓶颈）**
- 在 `useEffect` 内 `generateCardBlob` 之前，先用 `new Image()` + `crossOrigin="anonymous"` 异步预解码头像，设 1.5s 超时
- 若加载失败 / 超时 / 跨域被污染：传 `avatarUrl=undefined` 给海报，降级为「首字母彩色块」（已有兜底逻辑），避免 html2canvas 卡死或产生空白头像
- 微信内置浏览器对跨域图片极不稳定，这一步是首屏速度收益最大的

**B2. 调小渲染清晰度，权衡体积与速度**
- `forceScale` 从 `2` 降到 `1.6`（750 → 1200px 输出，朋友圈/聊天窗口完全够用）
- iOS 老机型 / 安卓低端机内存压力降一档，html2canvas 提速约 30-40%

**B3. 结果缓存，避免重复生成**
- 在 `MaleVitalityPdfClaimSheet` 顶层用 `useRef` 缓存 `{ key: claimCode, url, blob }`
- 同一 `claimCode` 二次打开 Sheet 直接复用缓存 URL（0ms），仅在卸载时统一 `revokeObjectURL`
- 缓存 key 用 `claimCode + statusPercent`，避免数据变化时拿到旧图

**B4. 首屏即时反馈（感知速度）**
- 当前是「全屏 spinner → 突然出图」，体验上显得慢
- 改为：Sheet 打开瞬间即显示「凭证骨架屏」（深色渐变占位 + 6 位大数字 `claimCode` + 「凭证生成中…」文字 + QR 占位框），让用户立刻看到核心信息（领取码已经先到手），右下角小 spinner 表示高清图正在准备
- 高清图 ready 后淡入替换骨架屏（200ms transition）

**B5. 移除等待 150ms 的硬延迟**
- 当前 `await new Promise(r => setTimeout(r, 150))` 是为了等离屏 DOM 渲染
- 改用 `requestAnimationFrame` × 2（双 RAF）确保布局完成，比 setTimeout(150) 平均快 100ms+，且更稳

**B6. JPEG 输出（如 generateCardBlob 已支持）**
- 检查 `generateCardBlob` 是否已默认 JPEG（项目其它海报多为 JPEG）；若为 PNG，海报这种渐变图改 JPEG q=0.9，体积下降 60%，下载/长按保存更快

### C. 多端兼容性确认（不需新改动，仅复核）

| 端 | 关键风险 | 现状/方案 |
|---|---|---|
| 微信 H5 (iOS) | 跨域头像污染 canvas | B1 降级兜底 |
| 微信 H5 (Android) | html2canvas 字体回退 | 已用 PingFang/YaHei 系统字体，OK |
| 微信小程序 webview | 同 H5 | 同上 |
| iOS Safari | safe-area + 长按保存 | Sheet 已 `pb-[safe-area]`，长按提示已有 |
| 桌面浏览器 | 海报较大 | B2 缩到 1200px，下载按钮已有 |
| 弱网 / 4G | 远程头像超时 | B1 1.5s 超时降级 |

### D. 不改动的部分（明确边界）
- 不动 `useClaimCode.ts`（领取码生成逻辑）
- 不动数据库 / RLS / edge function
- 不动 `DynamicAssessmentResult.tsx` 主体（除非 B 中需要）
- 不动女版（`women_competitiveness`）凭证流程
- 不动训练营、支付、会员逻辑

## 涉及文件

1. `src/components/dynamic-assessment/MaleVitalityPdfClaimCard.tsx` — 4 处文案替换
2. `src/components/dynamic-assessment/MaleVitalityPdfClaimSheet.tsx` — 头像预加载兜底、缓存、骨架屏、双 RAF、scale 调整
3.（可能）查阅 `src/utils/shareCardConfig.ts` 确认 `generateCardBlob` 的默认 mimeType / quality，若为 PNG 切到 JPEG

## 预期收益

- 文案 100% 统一为「有劲」品牌，消除中年男性用户认知门槛
- 首次生成时间：典型 4G 微信 H5 从 ~2.0s → ~0.7s（头像降级 + scale 降低 + 双 RAF）
- 二次打开：从 ~2.0s → 即时（缓存命中）
- 体感：骨架屏让用户「秒看到领取码」，等待感大幅下降
