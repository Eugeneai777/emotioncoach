

# 数字人 + B-Roll 混剪模板 — 在当前项目中新增

## 为什么不需要新项目

当前项目 `remotion/` 目录已包含：
- `VideoComposition` — 纯文字动画版
- `MidlifeCrisisHeyGen` — 数字人全屏版  
- `MidlifeStockVideo` — 素材混剪版

新模板复用现有的字体、组件（TextReveal、Background）、渲染脚本和素材目录，放在同一项目中更高效。

## 新增文件

| 文件 | 说明 |
|------|------|
| `remotion/src/DigitalHumanBRoll.tsx` | 主组合：数字人底层 + B-Roll 切入 + 字幕 + 产品展示 |
| `remotion/src/components/BRollCutaway.tsx` | B-Roll 切入组件（Ken Burns + 多种切入效果） |
| `remotion/src/components/DynamicSubtitle.tsx` | 动态字幕（逐句高亮、关键词变色、4种风格） |
| `remotion/src/components/ProductShowcase.tsx` | 产品截图展示（手机 mockup + 标注动画） |
| `remotion/src/components/EngagementHook.tsx` | 结尾提问卡片（引发评论讨论） |

## 修改文件

| 文件 | 说明 |
|------|------|
| `remotion/src/Root.tsx` | 注册新 Composition `video-dh-broll` |
| `remotion/scripts/render-remotion.mjs` | 支持渲染新 composition ID |

## 实现要点

1. **5段叙事结构**（30s = 900帧 @30fps）：
   - Hook(3s) → 痛点(7s) → 产品介绍(8s) → 效果展示(7s) → 提问(5s)

2. **层级叠加**：数字人视频持续播放作为底层，B-Roll 通过 `<Sequence>` 在特定时间段覆盖，字幕始终在最上层

3. **复用现有素材**测试：用 `heygen/midlife.mp4` 作为数字人，`stock/` 目录素材作为 B-Roll

4. **Props 驱动**：所有内容通过 props 传入，可快速生成不同主题的视频

