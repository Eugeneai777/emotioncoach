
## 扩展范围确认

用户要求：**所有测评的售前页（未测评状态）**点击「分享海报」都要能生成 / 保存 / 转发，与 SBTI 标准一致。当前已知问题集中在「财富卡点」，但需统一排查并修复全站。

## 现状盘点

全站测评售前/结果页分享入口分两类：

| 类型 | 共享组件 | 售前未测评行为 | 桌面行为 |
|---|---|---|---|
| **A. SBTI、SCL-90、PHQ-9、35+女性、动态测评** | `ShareDialogBase` + `executeOneClickShare` | ✅ 已支持「promo」推广卡（无需数据，html2canvas） | ✅ 上一轮已统一走 `ShareImagePreview` |
| **B. 财富卡点** | `WealthInviteCardDialog`（独立实现） | ❌ 默认 `value` Tab 强依赖测评数据，未测评 toast 报错退出 | ❌ 桌面仍走 `<a download>` 静默下载 |
| **C. 其他自定义分享卡**（训练营邀请卡、Insight 卡等） | `executeOneClickShare` | N/A（非售前入口） | ✅ 已统一 |

需要排查的潜在风险点：
- 各 `DynamicAssessmentPage` 派生售前页是否都正确传 `defaultTab="promo"` 给 `ShareDialogBase`
- 是否有页面像 `WealthBlockAssessment` 一样硬写 `defaultTab="value"`
- 任何使用 `WealthInviteCardDialog` 模式（独立卡片对话框）的其他测评

## 修复方案

### 改动 1：财富卡点（核心修复）
- `src/pages/WealthBlockAssessment.tsx`：顶部 PageHeader Share 按钮 `defaultTab` 改为 `currentResult ? "value" : "promo"`
- `src/components/wealth-camp/WealthInviteCardDialog.tsx`：
  - `handleServerGenerate` 桌面端改走 `ShareImagePreview`（与 SBTI 一致）
  - `value` Tab 在无 `assessmentData` 时不报错，自动切到 `promo` 或用默认占位
  - `CARD_OPTIONS` 中 `value` Tab 仅在有数据时显示

### 改动 2：全站售前页 defaultTab 排查
扫描所有 `<ShareDialogBase` 和 `<WealthInviteCardDialog` 调用点，确认：
- 售前页（无 result 状态时）默认 Tab 必须是 `promo`（推广卡，无数据依赖）
- 已测评结果页才用 `value`/`result` Tab
- 修正任何硬写 `defaultTab="value"` 但未保护数据缺失的入口

### 改动 3：通用兜底（防御性）
在 `ShareDialogBase` 内部增加：当 Tab 切到需要数据的卡片但数据缺失时，自动 fallback 到 `promo` Tab 而非报错，避免未来新接入测评再踩同样的坑。

## 兼容性矩阵（统一后）

| 测评 | 售前 PC | 售前 微信 | 售前 H5 | 结果页 全端 |
|---|---|---|---|---|
| SBTI | ✅ | ✅ | ✅ | ✅ |
| 财富卡点 | ✅（修复） | ✅（修复） | ✅（修复） | ✅（修复） |
| SCL-90 / PHQ-9 / 35+女性 / 中场觉醒力 / 动态测评 | ✅ 验证 | ✅ 验证 | ✅ 验证 | ✅ 验证 |

## 不改动

- 海报视觉、二维码 URL、partner 归因
- 移动端长按保存逻辑
- `uploadShareImage` 上传链路
- 各测评业务计分/数据持久化逻辑

## 交付物

- `src/pages/WealthBlockAssessment.tsx`：动态 `defaultTab`
- `src/components/wealth-camp/WealthInviteCardDialog.tsx`：桌面预览 + 数据缺失降级 + Tab 条件显示
- `src/components/share/ShareDialogBase.tsx`：通用 Tab 数据缺失自动降级到 `promo`
- 全站售前页 `defaultTab` 排查并修正硬写为 `value` 的入口
- 自测：SBTI、财富卡点、SCL-90、35+女性、PHQ-9 共 5 个测评，售前 PC/微信/H5 共 15 个组合
