

## 电脑端快速选项完整显示方案

### 问题确认
- **移动端（≤768px）**：可横滑看到全部 6 项 ✅
- **电脑端（≥1024px）**：鼠标无法触发横滑（无触摸手势 + 滚动条已隐藏），导致「联系人工」永久看不到 ❌

根因：当前用 `overflow-x-auto` + 隐藏滚动条，依赖触摸滑动，鼠标用户无入口。

### 修复方案（响应式分流）

**改 `src/pages/CustomerSupport.tsx` Quick Options 区域**：

桌面端（`md:` 断点 ≥768px）切换为**自动换行 flex-wrap**，移动端保留横滑。

```tsx
<div className="
  flex gap-1.5 pb-1
  overflow-x-auto md:overflow-x-visible
  md:flex-wrap
  -mx-4 px-4 md:mx-0 md:px-0
  snap-x snap-proximity md:snap-none
  [-webkit-overflow-scrolling:touch]
  [&::-webkit-scrollbar]:hidden
">
  {quickOptions.map(...)}
  <div className="shrink-0 w-2 md:hidden" aria-hidden />
</div>
```

### 关键变化
| 断点 | 行为 |
|---|---|
| `<768px` 手机 | 单行横滑，触摸惯性，最后留 8px spacer |
| `≥768px` 平板/桌面 | 自动换行（最多 2 行），全部 6 项一眼可见 |

### 三端兼容验证
| 端 | 视口 | 期望 |
|---|---|---|
| iPhone SE | 375px | 横滑可见全部 6 项 |
| iPad | 768px | 换行全显 |
| 桌面 919px（用户当前） | 919px | 换行全显，「联系人工」可见 |
| 桌面 1366px | 1366px | 一行可全显或紧凑换行 |
| 微信小程序 WebView | - | 横滑模式不变 |

### 改动文件
- `src/pages/CustomerSupport.tsx`：仅 Quick Options 容器 className 调整（约 3 行）

### 不影响范围
- 不动消息流、AI、工单、历史抽屉、支付气泡
- 不动其他横向滚动组件
- 不动 PageHeader 与其他页面

### 验收标准
| 场景 | 期望 |
|---|---|
| 919px 电脑端 | 6 项全部一眼可见，无需滑动 |
| 1366px 电脑端 | 6 项一行/紧凑两行全显 |
| 375px 手机 | 横滑顺滑，可达「联系人工」 |
| 微信小程序 | 横滑行为不变 |

