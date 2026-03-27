

# 方案 B：Whisper 转录真人音频 + 修复 Day 7

## 现状

- Day 2-7 的 `title` 和 `duration_seconds` 已更新正确
- Day 2-6 音频已替换成功，**Day 7 音频未替换成功**（需重新上传）
- Day 2-7 的 `script` 字段仍是旧的 AI 生成文案（"回到呼吸"、"允许情绪"等），与真人音频内容不匹配

## 执行步骤

### 1. 重新上传 Day 7 音频
将 `D7创造外在世界的冥想_5MB.mp3` 上传到 `stress-meditations` 存储桶覆盖 `day-7.mp3`

### 2. Whisper 转录 Day 2-7 音频
使用 OpenAI Whisper API（项目已有 `OPENAI_API_KEY`）对 6 个上传的 MP3 文件进行中文语音转文字，获取完整冥想引导词

### 3. 更新数据库 script 字段
将转录结果写入 `stress_meditations` 表的 `script` 字段（通过 insert 工具执行 UPDATE）

### 不受影响
- Day 1 保持不变
- 前端代码无需改动（script 从数据库动态读取）
- 标题、时长字段保持当前值

