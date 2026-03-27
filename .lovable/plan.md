

# 冥想打卡页三项优化

## 问题分析

### 问题一：播放异常
代码第 133-143 行 `togglePlay` 直接调用 `audio.play()`，5MB 音频文件在 `preload="auto"` 下仍可能未缓冲完成就被触发播放，浏览器抛出异常后被 catch 并显示"网络异常"。第 205 行 `encodeURI()` 可能对已编码的 Supabase URL 产生双重编码导致 404。此外缺少 loading/buffering 状态，用户不知道音频正在加载中，重复点击。

### 问题二：Day 1 文案不匹配
Day 1 的 `script` 仍是旧的 AI 生成文本（476 字，"你好，欢迎来到第一天的解压冥想..."），与实际真人录音内容不一致。需用 Whisper 转录 Day 1 音频并更新。

### 问题三：文案排版不合理
当前第 383-390 行仅按 `\n` 分行渲染，Whisper 转录文本是连续长段落，缺少段落间距、标题层级、引导语/正文区分，阅读体验差。

## 修复方案

### 1. 播放器健壮性优化（StressMeditation.tsx）

- **移除 `encodeURI()`**：第 205 行 `encodeURI(meditation.audio_url)` → 直接使用原始 URL，Supabase 存储 URL 本身已正确编码
- **新增 `isBuffering` 状态**：监听 `audio` 的 `waiting`/`canplay` 事件，播放按钮在 buffering 时显示 `Loader2` 旋转图标
- **`togglePlay` 增加重试逻辑**：play 失败后先 `audio.load()` 再 `play()`，仅在二次失败后才 toast 错误
- **播放按钮防抖**：添加 `isLoadingPlay` 状态，防止用户快速双击

### 2. Day 1 文案更新（数据库）

- 使用 Whisper API 转录 `day-1.mp3` 音频为中文文字
- 通过 SQL UPDATE 将转录结果写入 `stress_meditations` 表 Day 1 的 `script` 字段
- 同时校验 `duration_seconds` 是否与实际音频时长一致

### 3. 冥想文案排版优化（StressMeditation.tsx）

将第 382-391 行的文案渲染逻辑升级：

- **智能分段**：按句号/感叹号等自然断句处增加段落间距，每 3-5 句自动分段
- **引导语高亮**：识别开头问候语（"亲爱的伙伴们"/"今天是..."）用稍大字号 + 加粗显示
- **呼吸指令样式**：识别"吸气"/"吐气"/"屏住呼吸"等关键词用特殊颜色标注
- **段落间距**：从 `space-y-3` 改为分段后 `space-y-4`，段内行距 `leading-7`
- **阅读舒适度**：文字大小从 `text-sm` 调整为 `text-base`，增加 `px-2` 内边距

### 不受影响

- 音频文件本身无需更改（Day 1 保持原真人录音）
- 支付逻辑、打卡逻辑、训练营流程不变
- Day 2-7 音频和标题保持当前状态

