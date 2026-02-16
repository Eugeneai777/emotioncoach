

## 放大底部图例和提示文字

当前底部区间图例和提示文字太小，难以阅读。将整体字号提升一级。

### 修改内容

**文件：`src/components/wealth-block/EnhancedHealthGauge.tsx`**

1. **区间图例字号升级**（渐变保留，但整体放大）：
   - 🔴 0-39：`text-[9px]` → `text-xs`（12px）
   - 🟠 40-59：`text-[10px]` → `text-[13px]`
   - 🟡 60-79：`text-[11px]` → `text-sm`（14px）
   - 🟢 80-100：`text-[12px] font-medium` → `text-[15px] font-semibold`

2. **底部提示文字**：
   - `text-[10px]` → `text-xs`（12px）

### 修改文件

| 文件 | 修改内容 |
|------|---------|
| `src/components/wealth-block/EnhancedHealthGauge.tsx` | 图例字号从 9-12px 升至 12-15px，底部提示从 10px 升至 12px |

