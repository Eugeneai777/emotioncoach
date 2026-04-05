

# 生成一篇示范公众号文章（含 AI 配图）

## 目标
用脚本直接生成一篇完整的微信公众号文章，AI 原创故事（不局限于已有 testimonials），带 AI 生成插画，输出为可预览的 HTML 文件。

## 方案

### 1. 用 AI 生成文章内容
调用 Lovable AI (`google/gemini-3-flash-preview`) 生成一篇围绕有劲AI产品的原创公众号文章：
- AI 自创用户故事（人物、场景、情感转变）
- 结构：共鸣开头 → 故事展开 → 情绪价值 → 产品植入 → 行动号召
- 输出为公众号风格 HTML（带排版、配色、间距）

### 2. 用 AI 生成 2-3 张插画
调用 Lovable AI 图片模型 (`google/gemini-3-pro-image-preview`) 根据文章场景生成温暖治愈风插画，保存为 base64 内嵌到 HTML。

### 3. 组装为完整 HTML
将文章内容 + 插画组装成微信公众号排版风格的 HTML 文件，输出到 `/mnt/documents/wechat_article_sample.html`。

## 执行步骤
1. 编写 Python 脚本，调用 AI 生成文章文案（含标题、摘要、正文）
2. 根据文案中的场景描述，生成 2-3 张配图
3. 组装为带内联样式的 HTML（模拟公众号排版）
4. 输出文件供预览

## 产出
- `/mnt/documents/wechat_article_sample.html` — 一篇完整的示范文章

