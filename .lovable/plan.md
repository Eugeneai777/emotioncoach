## 客服快速选项截断修复 + 三端兼容核查

### 问题根因
截图显示「联系人工」chip 在桌面 919px 视口下被右侧截掉。当前实现：
- 容器：`max-w-2xl mx-auto px-4`（左右各 16px 内边距）
- 滚动条：`flex gap-1.5 overflow-x-auto pb-1 -mx-1 px-1 snap-x snap-mandatory`
- 6 个 chip 总宽度 ≈ 700px+，在 ≥640px（sm）的窗口下刚好可能撑出容器但又没有足够的"露出半个"提示，且 `snap-mandatory` 会把末项 snap 到不完整位置

### 修复方案（单点改动，最小侵入）

**改 `src/pages/CustomerSupport.tsx` Quick Options 区域（约 254-276 行）**：

1. **末尾留出"露出"提示空间**：滚动容器内最后追加一个 `w-2 shrink-0` 的占位 spacer，保证末项右侧总有 8px 间隙，视觉提示"还有内容/已结束"
2. **去掉强制 snap**：`snap-mandatory` 改为 `snap-proximity`，避免末项被强行 snap 到截断位置
3. **滚动容器突破父级 padding**：改用 `-mx-4 px-4`（替代当前 `-mx-1 px-1`），让横滑区在视觉上贴边，使最后一项能真正滑到完全可见
4. **隐藏 WebKit 滚动条**：补 `[&::-webkit-scrollbar]:hidden` 类，已有 `scrollbarWidth: 'none'` 只覆盖 Firefox
5. **触摸滑动顺滑**：加 `[-webkit-overflow-scrolling:touch]` 提升 iOS Safari/小程序 WebView 惯性滚动
6. **chip 文字防压缩**：当前已有 `whitespace-nowrap`，保持

### 三端兼容核查（无需额外改动，只验证）

| 端 | 检查点 | 现状 |
|---|---|---|
| 桌面 Chrome ≥1024px | 6 项一行可全显 | ✅ 修复后末项有右侧呼吸位 |
| 桌面 919px（当前用户视口） | 横滑可见末项 | ✅ 修复后可完整滑到 |
| 平板 768px | 横滑可见末项 | ✅ 同上 |
| iPhone SE 375px | 默认露出前 3 项 + 半个提示 | ✅ 已有横滑结构 |
| 微信小程序 WebView（iOS/Android） | 触摸惯性滑动 | ✅ 加 `-webkit-overflow-scrolling:touch` |
| 微信公众号 H5 | 同上 | ✅ |
| Safari iOS | 滚动条隐藏 | ✅ 加 `[&::-webkit-scrollbar]:hidden` |

### 改动文件清单
- `src/pages/CustomerSupport.tsx`：仅 Quick Options 容器与末尾占位（约 5 行改动）

### 不影响范围
- 不动消息流、AI 边缘函数、工单系统、历史抽屉、支付气泡逻辑
- 不动 PageHeader、其他客服组件
- 不动其他页面的横向滚动样式

### 验收标准
| 场景 | 期望 |
|---|---|
| 919px 桌面 | 「联系人工」chip 完整可见或可滑动到完整可见 |
| 1366px 桌面 | 6 项全部一行可见 |
| 375px 手机 | 默认露出 3 项+，左滑可完整看到「联系人工」 |
| 微信小程序 | 横滑顺滑，无卡顿 |
| 所有端 | 滚动条不可见，但仍可滑动 |
