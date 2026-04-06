

# 即梦AI (OmniHuman1.5) 数字人集成 — 替换 HeyGen

## 背景

您希望使用即梦AI（火山引擎）的数字人能力替代 HeyGen。即梦AI 提供 **OmniHuman1.5** 模型，输入一张图片 + 一段音频，即可生成数字人口播视频。

## 即梦 vs HeyGen 关键差异

| 维度 | HeyGen | 即梦AI OmniHuman1.5 |
|------|--------|---------------------|
| 输入 | 选择平台预设 avatar + 输入文字 | 上传自定义人像图片 + 音频文件 |
| TTS | 内置（选 voice_id 即可） | 需自己提供音频（可用现有火山 TTS） |
| 认证 | 简单 API Key | AWS V4 签名（Access Key + Secret Key） |
| API 地址 | api.heygen.com | visual.volcengineapi.com |
| 异步模式 | 提交 → 轮询 video_id | 提交 CVSubmitTask → 轮询 CVGetResult |

## 需要的密钥

项目目前没有火山引擎视觉智能 API 的 Access Key。需要新增两个 Secret：
- **`VOLCENGINE_ACCESS_KEY_ID`** — 火山引擎控制台 → 密钥管理 获取
- **`VOLCENGINE_SECRET_ACCESS_KEY`** — 同上

## 实现方案

### 1. 新建边缘函数 `jimeng-digital-human`

**文件**: `supabase/functions/jimeng-digital-human/index.ts`

功能：
- **`submit`** — 提交数字人视频生成任务
  - 接收：`image_url`（人像图片）、`audio_url`（音频）、`prompt`（可选提示词）、`resolution`（720/1080）
  - 调用 `visual.volcengineapi.com?Action=CVSubmitTask&Version=2022-08-31`
  - `req_key`: `jimeng_realman_avatar_picture_omni_v15`
  - 返回 `task_id`

- **`query`** — 查询任务状态
  - 接收：`task_id`
  - 调用 `visual.volcengineapi.com?Action=CVGetResult&Version=2022-08-31`
  - 返回 `status`（processing/in_queue/generating/done）+ `video_url`

- **AWS V4 签名**：在函数内实现 HMAC-SHA256 签名逻辑（Region: `cn-north-1`, Service: `cv`），使用 Deno 原生 `crypto.subtle` API

### 2. 工作流程（TTS + 数字人联动）

```text
文案输入
  ↓
火山引擎 TTS (现有 volcengine-tts 函数)
  ↓ 生成音频 URL
即梦 OmniHuman1.5 (新函数)
  ↓ 图片 + 音频 → 提交任务
轮询任务状态
  ↓ done → 获取 video_url
下载 MP4 → 用于 Remotion 混剪
```

### 3. 保留 HeyGen 函数作为备选

不删除 `heygen-video` 函数，两套方案并存，按需切换。

## 修改文件清单

| 文件 | 操作 | 说明 |
|------|------|------|
| `supabase/functions/jimeng-digital-human/index.ts` | 新建 | 即梦AI数字人 submit + query |
| 新增 2 个 Secret | 配置 | `VOLCENGINE_ACCESS_KEY_ID` + `VOLCENGINE_SECRET_ACCESS_KEY` |

## 实施步骤

1. 请您先确认是否已开通火山引擎即梦AI「数字人快速模式 OmniHuman1.5」服务
2. 配置 Access Key 密钥
3. 创建边缘函数，实现 V4 签名 + 提交/查询逻辑
4. 测试：上传一张人像图 + 用现有 TTS 生成音频 → 生成数字人视频

