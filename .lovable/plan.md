

## 优化「探索更多」AI 插图风格

### 问题
当前所有插图使用统一的细线条风格（`LINE_ART_STYLE`），在小尺寸下几乎不可见。边缘函数已经在上一轮更新了三种风格常量（`BLOCK_STYLE`、`SCENE_STYLE`、`AVATAR_STYLE`），但需要确认 prompt 质量并触发强制重新生成。

### 修改内容

**1. Edge Function prompt 微调**（`supabase/functions/generate-audience-illustrations/index.ts`）

当前三种风格常量已存在且合理，无需大改。微调点：
- `BLOCK_STYLE`：在末尾追加 `"vibrant colors, NOT thin lines, NOT wireframe"` 强调避免细线
- `SCENE_STYLE`：追加 `"visible at 40px thumbnail size, NOT thin outlines"`
- `AVATAR_STYLE`：追加 `"bold features, high contrast"`

**2. MiniAppEntry.tsx 尺寸/透明度调整**

已在上一轮完成大部分调整（`w-11 h-11`、`w-24 opacity-25`、`bg-white/60 shadow-sm`）。当前代码已是目标状态，无需再改。

**3. 触发重新生成**

调用 Edge Function `generate-audience-illustrations`，传 `{ force: true, audience_ids: ["block_daily_tools", "block_assessments", "block_training", "block_health_store", "scene_anxiety", "scene_workplace", "scene_relationship", "scene_growth", "avatar_0", ..., "avatar_11"] }` 重新生成所有非人群入口的插图。

### 执行步骤
1. 微调 Edge Function 中三个风格常量的描述词
2. 部署更新后的 Edge Function
3. 调用 Edge Function（`force: true`）触发重新生成全部 `block_*`、`scene_*`、`avatar_*` 插图

### 技术细节
- Edge Function 使用 `google/gemini-3.1-flash-image-preview` 模型生成图片
- 图片存储在 `audience-illustrations` storage bucket（公开）
- 前端从 `audience_illustrations` 表读取 `image_url`，无需改动

