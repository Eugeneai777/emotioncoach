

# 优化原价设置体验

## 需求理解
让管理员可以：
1. 手动输入任意原价数字
2. 明确选择"不显示原价"（不显示划线价）

## 当前逻辑分析
- 原价为 0 或小于现价时，预览区不显示划线价
- 但输入框始终显示数字 0，用户可能不清楚"0 = 不显示"

## 解决方案

### 方案一：添加"不显示原价"开关（推荐）
在原价输入框上方添加一个 Switch 开关，让用户明确选择是否显示划线价：
- 开启：显示原价输入框，可设置任意数字
- 关闭：隐藏输入框，原价自动设为 0，不显示划线价

### 方案二：允许输入框为空
修改输入框逻辑，允许留空表示不显示原价

---

## 推荐实现方案（方案一）

### 修改文件
`src/components/admin/camps/PricingTab.tsx`

### 改动内容

1. **添加 Switch 组件导入**
```tsx
import { Switch } from "@/components/ui/switch";
```

2. **修改原价区域布局**
```tsx
<div className="space-y-2">
  <div className="flex items-center justify-between">
    <Label htmlFor="original_price">原价 (¥)</Label>
    <div className="flex items-center gap-2">
      <span className="text-xs text-muted-foreground">显示划线价</span>
      <Switch
        checked={formData.original_price > 0}
        onCheckedChange={(checked) => {
          if (!checked) {
            updateFormData({ original_price: 0 });
          } else {
            // 默认设为现价的1.2倍作为参考
            updateFormData({ original_price: Math.round(formData.price * 1.2) });
          }
        }}
      />
    </div>
  </div>
  
  {formData.original_price > 0 && (
    <Input
      id="original_price"
      type="number"
      value={formData.original_price}
      onChange={(e) =>
        updateFormData({
          original_price: parseFloat(e.target.value) || 0,
        })
      }
      min={0}
      step={0.01}
    />
  )}
  
  <p className="text-xs text-muted-foreground">
    {formData.original_price > 0 
      ? "用于划线价显示" 
      : "关闭后不显示划线价"}
  </p>
</div>
```

---

## 预期效果

| 操作 | 结果 |
|:-----|:-----|
| 开关关闭 | 隐藏输入框，原价=0，不显示划线价 |
| 开关开启 | 显示输入框，可输入任意数字 |
| 输入框手动改为 0 | 开关自动关闭 |

---

## 文件清单

| 文件 | 操作 |
|:-----|:-----|
| src/components/admin/camps/PricingTab.tsx | 修改：添加 Switch 开关控制原价显示 |

