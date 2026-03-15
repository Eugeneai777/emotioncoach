

# 优化 /mini-app Hero 区文字

## 当前状态
Hero 区是品牌 Logo + "有劲AI" + "每个人的生活教练"，纯文本，无视觉亮点。

## 优化方案

**文件：`src/pages/MiniAppEntry.tsx`**

在品牌区下方（第60行后），添加一个 awakening 风格的 Hero 标语区：

- 使用 Sparkles 图标 + 渐变文字居中排版
- 主标语：**"频繁记录自己，可以改命"**（渐变 `from-amber-600 to-orange-500`）
- 副标语：**"这不是玄学，是神经科学"**（`text-muted-foreground`）
- 淡入动画 + `translateZ(0)` GPU 加速
- 直接导入并使用 `<AwakeningHeroCard />` 组件，无需重复代码

品牌区本身保持不变（Logo + 名称），Hero 标语作为独立区块置于品牌区和人群入口之间。

