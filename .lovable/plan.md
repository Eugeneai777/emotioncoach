

# 视频生成页面完善 — 端到端5段叙事视频生产

## 当前问题

### 问题1：AI剧本生成不生效
`VideoGenerator.tsx` 调用 `chat` 边缘函数生成剧本，但 `chat` 函数会**覆盖传入的 system prompt**，替换为情绪教练的 companion prompt。用户传入的 `VIDEO_SCRIPT_SYSTEM_PROMPT` 被完全忽略。

### 问题2：只生成原始数字人视频
当前流程：TTS → 上传音频 → 即梦AI生成数字人视频 → 结束。输出的是一个没有 B-Roll、没有字幕、没有产品展示的纯数字人口播视频。没有与 Remotion 的 `DigitalHumanBRoll` 模板对接。

### 问题3：缺少视频混剪渲染能力
Remotion 渲染需要 headless Chrome + ffmpeg，无法在浏览器或 Edge Function 中运行。需要一个服务端渲染方案。

## 解决方案

### 1. 新建 `video-script-ai` 边缘函数
专用于视频剧本生成，直接调用 Lovable AI Gateway，使用 `VIDEO_SCRIPT_SYSTEM_PROMPT` 作为 system prompt。**输出结构化 JSON**（非纯文本），包含5段内容 + 字幕时间轴 + B-Roll 建议。

输出格式：
```json
{
  "script": "完整口播文案",
  "segments": [
    { "type": "hook", "text": "你是不是也这样？", "startSec": 0, "endSec": 3 },
    { "type": "pain", "text": "凌晨三点...", "startSec": 3, "endSec": 10, "highlight": "焦虑" },
    { "type": "product", "text": "试试AI教练...", "startSec": 10, "endSec": 18 },
    { "type": "result", "text": "用了一周...", "startSec": 18, "endSec": 25 },
    { "type": "question", "text": "你有没有这种感觉？", "startSec": 25, "endSec": 30 }
  ],
  "closingQuestion": "你有没有这种感觉？",
  "closingCta": "评论区告诉我 👇"
}
```

### 2. 新建 `render-video` 边缘函数
使用 Remotion Lambda 或 Remotion Serverless 渲染最终混剪视频。考虑到 Edge Function 的时间限制，采用异步方案：
- 将 Remotion composition props（数字人视频URL + 字幕JSON + B-Roll配置）保存到数据库
- 触发远程渲染（或降级方案：直接返回数字人视频 + 字幕配置JSON供本地渲染）

**降级方案**（如无 Remotion Lambda）：前端将生成的数字人视频 + 结构化字幕配置导出为 JSON，用户可通过已有的 `render-remotion.mjs` 脚本本地渲染混剪视频。

### 3. 重构前端页面
- AI生成剧本 → 调用新的 `video-script-ai` 函数 → 返回结构化数据
- 展示5段预览（可编辑每段文案）
- 生成视频后，展示最终结果

## 文件清单

| 文件 | 操作 | 说明 |
|------|------|------|
| `supabase/functions/video-script-ai/index.ts` | 新建 | 专用剧本AI生成，输出结构化JSON |
| `src/pages/VideoGenerator.tsx` | 重构 | 5段可视化编辑、结构化剧本展示 |
| `src/hooks/useVideoGeneration.ts` | 更新 | 支持结构化剧本参数 |
| `src/config/videoScriptConfig.ts` | 更新 | 增强 prompt 要求输出 JSON 格式 |

## 实施步骤

1. 创建 `video-script-ai` 边缘函数 — 调用 Lovable AI Gateway，输出结构化5段剧本JSON
2. 重构 `VideoGenerator.tsx` — 剧本生成后展示5段可编辑卡片（Hook/痛点/产品/效果/提问），每段显示时长和字幕样式
3. 更新 `useVideoGeneration` hook — 将结构化字幕数据与数字人视频URL一起保存，生成完成后提供完整的 Remotion composition props
4. 视频生成完成后，展示数字人原始视频预览 + 导出 Remotion 配置 JSON（用于后续混剪渲染）

