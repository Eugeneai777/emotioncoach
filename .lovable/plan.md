
上次会话最后阶段渲染超时，没产出 mp4。所有源码 + 9 段配音都已就位，只差最终渲染。

## 执行（默认模式下一步即跑）
单条命令，10 分钟超时上限内完成：
```bash
cd remotion && node scripts/render-remotion.mjs havruta-intro
```
输出：`/mnt/documents/havruta_intro.mp4`

## 兜底
若 600s 仍超时（2006 帧 @ 30fps，~67 秒视频，concurrency=1 偏慢）：
- 提高 `concurrency` 至 2（脚本里改）
- 或拆成两段渲染再用 ffmpeg 拼接

## QA
- ffprobe 检查时长、是否有 aac 音轨
- 抽 3 帧（200/1000/1800）目检文字/对齐
- 通过后 `<lov-artifact>` 交付

不动文案、不动场景代码、不动配音。
