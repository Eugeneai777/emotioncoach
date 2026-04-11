

# 在门户轮播中添加 SBTI 人格测试卡片

## 改动内容

### 1. 在 `src/pages/MiniAppEntry.tsx` 的 `promoSlides` 数组中新增一项

在现有卡片之后（如 `identity-bloom` 之后）添加：

```ts
{
  id: "sbti",
  emoji: "🎭",
  title: "SBTI人格测试",
  subtitle: "你是哪种互联网人格？",
  tag: "全网爆火",
  gradient: "from-purple-600 to-pink-500",
  route: "/assessment/sbti_personality",
}
```

### 2. 更新 `handleSlideClick` 中的按钮文案

在轮播按钮文案处，为 `sbti` 卡片显示"开始测评 →"：

```ts
{slide.id === "assessment" ? "立即测评 →" : slide.id === "sbti" ? "开始测评 →" : "了解详情 →"}
```

### 文件变更
- `src/pages/MiniAppEntry.tsx` — 仅两处小改动，无需新建文件

