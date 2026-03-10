

## 搭建7天解压冥想音频系统

你已经提供了第1天的冥想文案，项目已配置好 ElevenLabs API。我将搭建完整的音频生成和播放系统。

### 整体方案

1. **创建 `stress_meditations` 数据库表** — 结构类似 `wealth_meditations`，增加 `camp_type` 字段
2. **插入第1天冥想文案** — 将你提供的文本存入数据库
3. **创建音频生成 Edge Function** — 用 ElevenLabs TTS 将文案转为语音引导音频，存储到 Storage bucket
4. **创建解压冥想播放页面** — `/stress-meditation/:dayNumber`，含播放器、进度条、文案显示
5. **修复打卡页导航** — `CampCheckIn.tsx` 中 `/tools` 改为跳转到对应天数的冥想播放页
6. **管理端批量生成工具** — 提供一键生成全部7天音频的功能

### 技术细节

**数据库表 `stress_meditations`：**
- `day_number`, `title`, `description`, `script`（完整文案）, `audio_url`（生成后填入）, `duration_seconds`, `camp_type` 默认 `emotion_stress_7`

**音频生成 Edge Function `generate-stress-meditation`：**
- 接收 `day_number`，从数据库读取文案
- 用 ElevenLabs TTS（`eleven_multilingual_v2` 模型 + 中文温暖声音 Brian）生成音频
- 上传到 Storage bucket `stress-meditations`
- 更新数据库 `audio_url` 字段

**播放页面：**
- 复用现有 `MeditationLibraryCard` 风格
- 显示当天冥想标题、时长、文案
- 内置音频播放器（播放/暂停/进度条）
- 支持离线缓存（复用 `useAudioCache`）

**打卡页修复：**
- 根据用户当前训练天数，跳转到 `/stress-meditation/{dayNumber}`

### 需要你做的

提供剩余6天（Day 2-7）的冥想文案。我会先用第1天的文案搭建完整框架，后续文案可随时补充。

