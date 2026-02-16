

# 修改AI提示词，让封面直接生成中文文字

## 改动内容

仅修改一个文件：`supabase/functions/generate-xiaohongshu-covers/index.ts`

修改 `THEME_PROMPTS` 中的7个提示词，将每个提示词中的：
- 删除 "No text, no letters, no numbers, no characters whatsoever."
- 添加明确的中文文字渲染指令，要求在画面中央或顶部醒目位置渲染对应的"马上XX"四个大字

## 具体改动

将每个主题的 prompt 末尾从：

```
... No text, no letters, no numbers, no characters whatsoever. Suitable for social media cover image.
```

改为类似：

```
... Display the large Chinese text "马上觉醒" prominently in the center of the image using bold calligraphic style with golden strokes and red outline. The text should be the focal point. Suitable for social media cover image.
```

每个主题对应自己的文字：
- 觉醒 -> "马上觉醒"
- 发财 -> "马上发财"
- 回血 -> "马上回血"
- 看见 -> "马上看见"
- 破局 -> "马上破局"
- 翻身 -> "马上翻身"
- 出发 -> "马上出发"

## 风险提示

AI 生成中文文字可能出现以下情况：
- 笔画变形或缺失
- 字体不够美观
- 文字位置不理想

如果效果不理想，后续可以切换为 HTML/CSS 叠加方案作为备选。

