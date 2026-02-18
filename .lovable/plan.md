

# 商品详情排版优化：图标修复 + 内容精简

## 问题分析

1. **图标不显示**：Emoji 图标（🎯💢💡🌟）在部分设备/浏览器渲染为乱码（◎、☹）。需要替换为可靠的 Lucide 图标。
2. **内容太啰嗦**：数据库中已有的产品描述是 AI 改版前生成的长文本，`smartSplitContent` 按句号拆分后没有加 `✅` 前缀，显示仍为缩进段落，视觉上密集难读。

## 修改方案

仅修改 **1 个文件**：`src/components/store/ProductDetailDialog.tsx`

### 1. 用 Lucide 图标替代 Emoji

将 `SECTION_META` 中的 emoji 字符串替换为 Lucide React 图标组件：

| 板块 | 原图标 | 新图标 |
|------|--------|--------|
| 适合谁 | 🎯 | `<Target />` |
| 解决什么问题 | 💢 | `<AlertCircle />` |
| 我们如何帮你 | 💡 | `<Lightbulb />` |
| 你将收获 | 🌟 | `<Star />` |
| 默认 | 📌 | `<Pin />` |

图标统一使用 `w-4 h-4 inline` 样式，颜色跟随标题栏背景色系。

### 2. 智能拆分时自动加 `✅` 前缀

修改 `smartSplitContent` 函数：当长文本被按句号拆分后，自动为每条添加 `✅` 前缀，确保显示为清晰的要点列表而非大段文字。

```
function smartSplitContent(lines: string[]): string[] {
  const result: string[] = [];
  for (const line of lines) {
    if (/^[✅•]/.test(line) || line.length <= 30) {
      result.push(line);
    } else {
      const sentences = line.split(/[。！？]/).map(s => s.trim()).filter(s => s.length > 0);
      if (sentences.length > 1) {
        sentences.forEach(s => result.push(`✅ ${s}`));  // 自动加前缀
      } else if (line.length > 30) {
        result.push(`✅ ${line}`);  // 单句但较长，也加前缀
      } else {
        result.push(line);
      }
    }
  }
  return result;
}
```

### 3. 渲染样式优化

- 有 `✅` 前缀的行：去掉缩进，使用 `text-foreground/80` 颜色，保持左对齐
- 标题栏图标改为 Lucide 组件，带对应颜色
- 区块间距和内边距保持现有 `space-y-3`、`px-4 py-3`

## 效果

- 图标在所有设备上可靠显示（SVG 渲染）
- 旧数据的长文本自动转换为 `✅` 要点列表，清晰易读
- 新生成的数据本身就是 `✅` 格式，无需额外处理
