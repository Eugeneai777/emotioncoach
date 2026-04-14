

# 有劲AI专属脚本生成器

## 概述

在现有「AI漫剧分镜脚本」基础上，新增一个**有劲AI专属模式**，用户可以选择具体的有劲AI产品/页面作为脚本的转化目标，AI 会将产品卖点自然植入到剧情中，最终输出带有转化链接和引导话术的漫剧脚本。

## 产品目录（内置到前端）

将有劲AI现有产品分为 4 类供选择：

| 分类 | 产品 | 路由 |
|------|------|------|
| 📊 测评 | 情绪健康测评、财富卡点测评、35+女性竞争力、中场觉醒力、SCL-90 | 对应路由 |
| 🏕 训练营 | 7天有劲训练营、财富觉醒营、身份绽放营、情绪绽放营 | 对应路由 |
| 🛠 工具 | 情绪SOS、呼吸练习、AI教练对话 | 对应路由 |
| 🛒 商城 | 知乐胶囊、协同套餐 | 对应路由 |

## 实施步骤

### 1. 改造前端 `DramaScriptGenerator.tsx`

- 新增「脚本类型」切换：**通用漫剧** / **有劲AI专属**
- 选择「有劲AI专属」后显示产品选择区：
  - 4 个分类标签页（测评/训练营/工具/商城）
  - 每个分类下多选产品卡片
- 新增「目标人群」选择（女性/中年男性/职场人/通用）
- 新增「转化方式」选择（剧情植入 / 结尾推荐 / 角色使用）
- 结果展示增加：
  - 每个分镜标注关联的产品
  - 脚本末尾生成「转化文案」和「评论区引导话术」
  - 一键复制含产品链接的完整文案

### 2. 改造 Edge Function `drama-script-ai`

- 新增参数：`mode`（generic/youjin）、`products`（选中产品列表）、`targetAudience`、`conversionStyle`
- 当 mode=youjin 时，系统 Prompt 增加：
  - 有劲AI品牌定位和产品卖点说明
  - 要求在剧情中自然植入产品使用场景
  - 输出增加 `conversionScript`（转化文案）和 `commentHook`（评论区话术）字段
  - 每个 scene 增加 `relatedProduct` 字段标注关联产品

### 3. 输出结构扩展

```text
{
  // ...原有字段
  conversionScript: "视频描述文案（含产品链接占位符）",
  commentHook: "评论区置顶引导话术",
  scenes: [
    {
      // ...原有字段
      relatedProduct?: "emotion_health_assessment"  // 关联产品key
    }
  ]
}
```

## 技术要点

- 产品目录硬编码在前端（含 name、route、卖点描述），通过 props 传给 edge function
- 产品链接使用 `https://wechat.eugenewe.net` 外部域名标准
- 无需新建数据库表或 edge function，复用现有 `drama-script-ai` 即可
- 侧边栏入口保持不变，页面内通过 tab 切换模式

