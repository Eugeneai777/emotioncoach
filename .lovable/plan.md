

## 在财富反应模式卡片中显示全部 4 种类型

在当前的"你的财富反应模式"卡片底部，新增一个横向展示区，显示全部 4 种类型（和谐型、追逐型、逃避型、创伤型），并高亮用户所属的类型。

### 设计方案

在"系统建议"区块下方，新增一行 4 个小标签，横向排列：

```text
🟢 和谐型   🟡 追逐型   🔵 逃避型   🔴 创伤型
```

- 用户当前类型：白色背景 + 对应颜色文字 + 加粗 + 轻微放大
- 其他类型：半透明白色背景（`bg-white/10`）+ 白色文字 + 较小字号
- 每个标签显示 emoji + 名称 + 一句话 tagline

### 技术细节

**文件：`src/components/wealth-block/WealthBlockResult.tsx`**

在第 292 行（系统建议 `</div>` 之后），插入一个新的区块：

1. 标题行："📊 四种财富反应模式"
2. 遍历 `patternInfo` 的 4 个 key（harmony, chase, avoid, trauma）
3. 每个渲染为一个小卡片/标签，包含 emoji、名称、tagline
4. 判断是否为当前用户类型（`result.reactionPattern`），高亮显示
5. 使用 2x2 网格布局（`grid grid-cols-2 gap-2`），移动端友好

### 视觉效果

| 状态 | 样式 |
|------|------|
| 当前类型 | `bg-white/30 border border-white/50` + 字号 `text-sm font-bold` |
| 其他类型 | `bg-white/10` + 字号 `text-xs` + `opacity-60` |

