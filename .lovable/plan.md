

# 中年觉醒 — 真人素材混剪版视频

## 目标
用免费真人视频素材（Pexels）混剪 + 文字动画 + AI 语音旁白，制作一个面向中年男性的剧情营销视频，推广「7天有劲训练营」。

## 创意方向

**风格**: 电影感纪录片混剪 — 暗色调真实生活画面配大字幕，类似抖音/小红书爆款情感视频。

**剧本（沿用已有3段式）**:
1. **深夜痛点** — 加班、失眠、胸闷画面 + 旁白独白
2. **转折觉醒** — 晨光、运动、放松画面 + AI教练帮助的叙述
3. **产品推广** — 品牌CTA + 训练营介绍

**视觉**: 暗色电影画面 + 白/暖色大字 + 轻微Ken Burns（缓慢推拉）效果

## 执行步骤

### 第 1 步：下载 Pexels 免费素材
从 Pexels 下载 6-8 段免费视频素材：
- 深夜办公室/加班
- 男人疲惫/失眠
- 城市夜景/车窗雨
- 日出/晨跑/自然
- 家庭温馨/微笑
- 冥想/放松

使用 Pexels API（免费）或直接下载 URL。

### 第 2 步：创建新场景组件
复用现有 Remotion 项目结构，新建：

| 文件 | 说明 |
|------|------|
| `remotion/src/scenes/MidlifeOpening.tsx` | 痛点场景 — 暗色素材 + 大字独白 |
| `remotion/src/scenes/MidlifeTurning.tsx` | 转折场景 — 暖色素材 + 改变叙述 |
| `remotion/src/scenes/MidlifeCTA.tsx` | CTA场景 — 品牌推广（复用BrandOutro样式） |
| `remotion/src/MidlifeStockVideo.tsx` | 主组合 — 串联3段 + 转场 |

### 第 3 步：生成 AI 语音旁白
用 Lovable AI 支持的模型生成语音脚本，通过 Edge Function 调用 TTS（或直接使用素材+字幕无声版）。

### 第 4 步：组合与渲染
- 每段素材叠加半透明暗层 + 文字动画
- Ken Burns 缓慢推拉效果增加电影感
- 场景间用 `wipe` 或 `fade` 转场
- 竖屏 1080x1920，约 30 秒（避免渲染超时）
- 渲染输出到 `/mnt/documents/`

## 技术要点
- 使用 `<Video>` 组件播放素材片段，`startFrom` + `endAt` 裁剪
- Ken Burns 效果通过 `interpolate()` 控制 `scale` 和 `translate`
- 字幕用现有 `TextReveal` 组件
- 控制在 25-30 秒内，确保渲染不超时
- 复用现有 fonts、Background、BrandOutro 等组件

