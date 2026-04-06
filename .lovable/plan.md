

# 中年觉醒 HeyGen 数字人视频

## 目标
用 HeyGen API 生成一个面向中年男性的剧情视频，包含真人数字人出镜、对话声音和画面，最终推广「7天有劲训练营」。

## 方案概览

通过 Edge Function 调用 HeyGen API，生成多段数字人视频片段（每段对应一个剧情场景），然后用 Remotion 将这些片段与文字动画、背景音乐组合成完整的营销视频。

## 执行步骤

### 第 1 步：探测可用 Avatar 和 Voice
编写脚本调用 HeyGen API，获取可用的中文男性 avatar 和中文 voice，选定合适的 avatar_id 和 voice_id。

- `GET https://api.heygen.com/v2/avatars`（X-API-KEY 鉴权）
- `GET https://api.heygen.com/v2/voices`
- 筛选中文/男性角色

### 第 2 步：创建 `heygen-video` Edge Function
新建 `supabase/functions/heygen-video/index.ts`，功能：
- 接收剧情台词（多段 scene）
- 调用 HeyGen `POST /v2/video/generate` 为每段生成数字人视频
- 轮询 `GET /v1/video_status.get?video_id=xxx` 等待完成
- 返回每段视频的下载 URL

请求体结构：
```json
{
  "video_inputs": [{
    "character": { "type": "avatar", "avatar_id": "选定ID" },
    "voice": { "type": "text", "voice_id": "选定中文voice", "input_text": "台词" },
    "background": { "type": "color", "value": "#1a1a2e" }
  }],
  "dimension": { "width": 1080, "height": 1920 }
}
```

### 第 3 步：生成 5 段剧情视频
用脚本调用 Edge Function，生成以下场景的数字人片段：

| 场景 | 台词内容 | 时长 |
|------|---------|------|
| 痛点共鸣 | "42岁，年薪50万，每天凌晨三点醒来，盯着天花板，感觉活得像个没有感觉的机器。" | ~10s |
| 对话演示 | "有一天我试着跟AI教练说了一句：老哥，我压力有点大。它说：你现在最想改变的是什么？" | ~12s |
| 转折觉醒 | "做完压力测评那天晚上，我第一次睡了整觉。不是问题消失了，是我终于看见了问题。" | ~10s |
| 产品介绍 | "7天有劲训练营，AI情绪教练24小时在线，专业冥想课程，还有1V1辅导和同频社群。" | ~10s |
| CTA结尾 | "兄弟，给自己7天时间，找回你的劲。现在就加入，链接在评论区。" | ~8s |

### 第 4 步：下载视频片段 + Remotion 合成
- 下载 HeyGen 生成的 MP4 到 `remotion/public/heygen/`
- 新建 Remotion 组合 `MidlifeCrisisHeyGen.tsx`，用 `<Video>` 组件嵌入数字人片段
- 在片段之间加入文字动画过渡（复用 PainPoint、TextReveal 等组件）
- 片段 5 结尾叠加品牌 Logo + `wechat.eugenewe.net` 链接
- 渲染最终 MP4 输出到 `/mnt/documents/video_laoge_heygen.mp4`

### 第 5 步：注册 Composition 并渲染
- 在 `Root.tsx` 注册 `video-laoge-heygen`（1080x1920, ~50s）
- 用 `render-remotion.mjs` 渲染

## 新增/修改文件清单

| 文件 | 操作 |
|------|------|
| `supabase/functions/heygen-video/index.ts` | 新建 — HeyGen 视频生成 Edge Function |
| `remotion/src/MidlifeCrisisHeyGen.tsx` | 新建 — 主组合，串联数字人片段+文字动画 |
| `remotion/src/Root.tsx` | 修改 — 注册新 Composition |

## 技术要点
- HeyGen API 鉴权：`X-API-KEY: $HEYGEN_API_KEY`
- 视频生成是异步的，需轮询状态直到 `completed`
- 竖屏 1080x1920 格式
- 所有外部链接使用 `https://wechat.eugenewe.net`

