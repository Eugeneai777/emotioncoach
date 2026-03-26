

# 统一 /promo/synergy 主标题为「7天有劲训练营」

## 改动内容

**文件**: `src/pages/SynergyPromoPage.tsx`

### 第 543-551 行：替换 Hero 主标题

当前标题是「情绪解压 × 关系修复 × 身心调理」，改为：

```tsx
<h1 className="text-3xl sm:text-4xl md:text-5xl font-black leading-tight mb-4 tracking-tight">
  <span className="bg-gradient-to-r from-violet-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent">
    7天有劲训练营
  </span>
</h1>
```

### 第 553-558 行：统一副标题（移除 source 判断）

不再区分 `source=laoge`，统一副标题：

```tsx
<p className="text-slate-400 text-sm sm:text-base leading-relaxed mb-8 max-w-md mx-auto">
  情绪解压 · 关系修复 · 身心调理<br />
  AI教练 + 专业教练 + 知乐胶囊，三重陪伴一站式解决
</p>
```

### 自动创建训练营 camp_name 同步

搜索 `autoCreateAndEnterCamp` 中的 `camp_name` 赋值，改为 `'7天有劲训练营'`。

### SuccessPanel 文案同步

将成功页中涉及训练营名称的文案统一为「7天有劲训练营」。

## 不受影响
- 支付流程、跳转逻辑、课程内容零改动
- 其他页面不受影响

