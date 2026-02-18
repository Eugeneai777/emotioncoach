
# 修复商品详情长文本未被精简的问题

## 问题根因

`smartSplitContent` 函数第 42 行的逻辑：

```
if (/^[✅•]/.test(line) || line.length <= 30)
```

任何以 `✅` 开头的行都会直接跳过，不做拆分。但旧数据中的 `✅` 行可能是 60-100 字的长段落（如截图 2 所示），导致展示效果冗长。

管理后台（截图 1）显示的是新生成的精简文案，而商城（截图 2）显示的是旧数据发布时保存的长文本。

## 修改方案

仅修改 **1 个文件**：`src/components/store/ProductDetailDialog.tsx`

### 修改 `smartSplitContent` 函数（第 42 行）

将判断逻辑改为：以 `✅` 开头 **且长度不超过 35 字** 才跳过。超过 35 字的 `✅` 行，去掉前缀后重新按句号拆分再加回前缀。

修改后的逻辑：

```
function smartSplitContent(lines: string[]): string[] {
  const result: string[] = [];
  for (const line of lines) {
    const isShort = line.length <= 35;
    const hasBullet = /^[✅•]/.test(line);

    if (isShort) {
      result.push(line);
    } else if (hasBullet) {
      // 有 ✅ 前缀但太长，去掉前缀后重新拆分
      const cleaned = line.replace(/^[✅•]\s*/, '');
      const sentences = cleaned.split(/[，。！？、]/).map(s => s.trim()).filter(s => s.length > 0);
      if (sentences.length > 1) {
        // 取前 2-3 个关键短句作为精简版
        sentences.slice(0, 2).forEach(s => result.push('✅ ' + s));
      } else {
        // 无法拆分则截断
        result.push('✅ ' + cleaned.slice(0, 25) + '...');
      }
    } else {
      const sentences = line.split(/[。！？]/).map(s => s.trim()).filter(s => s.length > 0);
      if (sentences.length > 1) {
        sentences.forEach(s => result.push('✅ ' + s));
      } else {
        result.push('✅ ' + line);
      }
    }
  }
  return result;
}
```

核心改动：
- 短文本（35 字以内）：保持原样
- 长文本有 `✅` 前缀：去掉前缀，按中文标点（逗号、句号、顿号等）拆分，每个短句重新加 `✅`，最多保留 2 条
- 长文本无前缀：按句号拆分并加 `✅` 前缀（保持现有逻辑）

## 效果

- 旧数据中的长 `✅` 段落会被自动拆分为 2 条精简要点
- 新数据（已经是短句格式）不受影响
- 管理后台和商城展示风格统一
