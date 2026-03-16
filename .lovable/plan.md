

## 优化「探索更多」AI 插图方案

### 问题
当前所有插图使用同一个 `LINE_ART_STYLE`（极简细线条、无填充），在小尺寸下几乎不可见，缺乏视觉层次。

### 方案：为不同区域使用不同插图风格

| 区域 | 当前风格 | 新风格 | 理由 |
|------|---------|--------|------|
| 四大板块 | 细线条无填充 | **粗线条 + 单色块填充**（墨蓝色） | 作为图标需要高辨识度 |
| 使用场景 | 细线条无填充 | **柔和水彩速写风** — 淡色填充 + 手绘笔触 | 营造情感氛围，装饰性更强 |
| 用户头像 | 细线条肖像 | **彩色扁平卡通头像** — 圆形构图、柔和肤色 | 头像需要温暖亲切感 |
| 背景装饰 | 与图标共用同一张图 | 保持不变，但提高 opacity | 装饰用途，提高可见度即可 |

### 具体修改

**1. Edge Function — 更新 prompt 风格**
`supabase/functions/generate-audience-illustrations/index.ts`

- 去掉统一的 `LINE_ART_STYLE`，改为三个分区风格常量：
  - `BLOCK_STYLE`：`"bold thick black line art with solid single-color fill (navy blue), clean shapes, high contrast, suitable as app icon at small size"`
  - `SCENE_STYLE`：`"soft watercolor sketch style, gentle pastel color washes with loose hand-drawn outlines, dreamy and emotional atmosphere"`  
  - `AVATAR_STYLE`：`"flat cartoon avatar portrait, round face, warm skin tones, soft pastel background, friendly expression, suitable as small profile picture"`
- 对应更新所有 `block_*`、`scene_*`、`avatar_*` 的 prompt

**2. MiniAppEntry.tsx — 增大尺寸和透明度**

- 四大板块：图标 `w-8 h-8` → `w-11 h-11`，装饰 `w-20 opacity-15` → `w-24 opacity-25`
- 使用场景：图标 `w-7 h-7` → `w-10 h-10`，装饰 `w-14 opacity-10` → `w-18 opacity-20`
- 用户头像：`w-6 h-6` → `w-8 h-8`
- 图标容器添加 `bg-white/60 shadow-sm` 让插画浮起来

**3. 触发重新生成**
- 调用 Edge Function 时传 `force: true` 重新生成所有 `block_*`、`scene_*`、`avatar_*` 插图

