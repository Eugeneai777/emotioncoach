

# 即梦API文/图生视频集成 — 漫剧脚本一键生成视频

## 概述

在漫剧分镜脚本生成器中新增「一键生视频」功能，利用即梦视频生成3.0 Pro API，将每个分镜的 imagePrompt 直接提交为文生视频任务，生成短视频片段，最终可合并为完整漫剧视频。

## 技术方案

### 1. 新建 Edge Function `jimeng-video-gen`

复用现有 `jimeng-digital-human` 中的 Volcengine HMAC-SHA256 签名逻辑，新建独立函数调用即梦视频3.0 Pro API：

- **提交任务**：`Action=CVSync2AsyncSubmitTask`，`req_key=jimeng_ti2v_v30_pro`
  - 参数：`prompt`（来自分镜 imagePrompt）、`aspect_ratio`（默认 9:16 竖屏）、`frames`（121=5秒 或 241=10秒）、可选 `image_urls`（首帧图片，支持图生视频）
- **查询任务**：`Action=CVSync2AsyncGetResult`，`req_key=jimeng_ti2v_v30_pro`
  - 返回 `status`（in_queue/generating/done）和 `video_url`
- 复用已有的 `VOLCENGINE_ACCESS_KEY_ID` 和 `VOLCENGINE_SECRET_ACCESS_KEY` 密钥

### 2. 改造前端 `DramaScriptGenerator.tsx`

在脚本生成结果区域，每个分镜卡片新增：
- 「生成视频」按钮 → 单独提交该分镜的 imagePrompt 到 `jimeng-video-gen`
- 视频时长选择（5秒/10秒）
- 任务状态实时轮询显示（排队中 → 生成中 → 完成）
- 完成后内嵌视频预览 + 下载按钮

底部新增「全部生成」按钮：
- 按顺序逐个提交所有分镜
- 显示整体进度条
- 全部完成后提供「合并下载」（调用已有的 `merge-videos` edge function）

### 3. 视频参数配置

在输入区新增视频生成设置卡片：
- 画面比例：16:9 / 9:16 / 1:1（默认 9:16 竖屏短视频）
- 单片段时长：5秒 / 10秒（默认 5秒）
- 可选首帧图片 URL（支持先用即梦文生图生成首帧再生视频）

## 流程图

```text
分镜脚本生成完毕
    │
    ▼
用户点击「生成视频」（单个或全部）
    │
    ▼
前端 → jimeng-video-gen (submit)
    │  参数: prompt, aspect_ratio, frames
    ▼
返回 task_id → 前端轮询 (每5秒)
    │
    ▼
jimeng-video-gen (query) → status/video_url
    │
    ▼
完成 → 预览 + 下载
    │
    ▼（可选）
全部完成 → merge-videos → 合并成片
```

## 注意事项

- 视频 URL 有效期仅 1 小时，前端需提示及时下载
- 即梦视频生成耗时较长（1-3分钟/片段），需要良好的进度反馈
- 无需新增密钥，复用现有 Volcengine 凭证
- 无需新建数据库表

