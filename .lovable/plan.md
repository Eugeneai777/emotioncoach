

## 实施方案：角标优化 + 兼容性保障

### 改动内容

**文件：`src/pages/MiniAppEntry.tsx`**

3 处修改：

**1) 角标文案**（第 26、35 行）
```
"¥9.9测评" → "🔍 测一测"
```

**2) 角标位置 + 样式**（第 310-312 行）

从右上角移到右下角，避免遮挡插画水印，增加呼吸动画：

```
// 之前
className="absolute top-1.5 right-1.5 z-20 bg-white/85 backdrop-blur-sm rounded-full px-2 py-0.5 shadow-sm active:scale-95 transition-transform"
<span className="text-[10px] font-bold text-orange-600">

// 之后
className="absolute bottom-1.5 right-1.5 z-20 bg-white/90 backdrop-blur-sm rounded-full px-2 py-0.5 shadow-md active:scale-95 transition-transform animate-pulse"
<span className="text-[10px] font-bold text-orange-600">
```

### 兼容性说明

| 场景 | 保障措施 |
|------|----------|
| 手机端位置 | `bottom-1.5 right-1.5` 在卡片 `min-h-[96px]` 内不会与文字区重叠（文字区 `mt-auto` 在左侧，角标在右下角） |
| 桌面端 | 卡片是 `grid-cols-3` 布局，角标使用 `absolute` 定位，自适应卡片尺寸 |
| 小程序 WebView | `animate-pulse` 是纯 CSS 动画，已有 `reduceMotion` 检测逻辑会自动降级 |
| 点击跳转 | `e.stopPropagation()` 阻止卡片导航，Sheet 内 `navigate(route)` 跳转，逻辑不变 |

### 不改动

- `AssessmentPickerSheet.tsx` — 保持原样，弹窗内仍展示 ¥9.9 价格
- 数据库 — 已在之前完成配置，无需再改
- 构建错误 — `@swc/core` native binding 是平台临时问题，与代码无关

