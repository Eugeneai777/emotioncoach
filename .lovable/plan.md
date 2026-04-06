

# 视频生成页面 — 一站式数字人短视频创作

## 现状

- ✅ Remotion 混剪架构已完成（DigitalHumanBRoll + 4个组件）
- ✅ 即梦AI数字人边缘函数已部署（jimeng-digital-human）
- ✅ 火山引擎TTS边缘函数已部署（volcengine-tts）
- ❌ 没有前端生成页面
- ❌ 没有 Storage bucket 存储音频中转文件

## 需要解决的核心问题

TTS 返回 base64 音频，但即梦AI需要**音频公开URL**。需要一个 Storage bucket 做中转。

## 实现方案

### 1. 数据库迁移 — 创建 Storage bucket

创建 `video-assets` 公开存储桶，用于存放 TTS 生成的音频文件，供即梦AI读取。

### 2. 新建 `src/hooks/useVideoGeneration.ts`

封装完整生成流程：

```text
Step 1: 调用 volcengine-tts → 获取 base64 音频
Step 2: base64 → Blob → 上传到 video-assets bucket → 获取公开URL
Step 3: 调用 jimeng-digital-human submit（图片URL + 音频URL）→ 获取 task_id
Step 4: 每5秒轮询 jimeng-digital-human query → 直到 status=done → 获取 video_url
```

暴露状态：`idle | generating_audio | uploading_audio | submitting_task | generating_video | done | error`

### 3. 新建 `src/pages/VideoGenerator.tsx`

页面布局：
- **配置区**：人像图片URL输入、音色下拉选择（温柔女声/沉稳男声等）、分辨率选择
- **文案区**：多行文本输入视频脚本
- **生成按钮**：一键启动全流程
- **进度条**：实时显示当前阶段（✅/🔄/⏳）
- **结果区**：视频预览播放器 + 下载链接

### 4. 修改 `src/App.tsx`

添加 `/video-generator` 路由。

## 文件清单

| 文件 | 操作 |
|------|------|
| 数据库迁移 SQL | 新建 — 创建 `video-assets` Storage bucket + 公开读取策略 |
| `src/hooks/useVideoGeneration.ts` | 新建 |
| `src/pages/VideoGenerator.tsx` | 新建 |
| `src/App.tsx` | 修改 — 添加路由 |

