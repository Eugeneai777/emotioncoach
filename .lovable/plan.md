
问题定位

- 我先看了当前代码与可见日志快照：这次卡住并不是后端 `merge-videos` 在跑，因为 `/video-generator` 当前并不会调用它。
- 实际路径是：`src/hooks/useVideoGeneration.ts` 在多片段场景下直接调用 `src/utils/videoMerger.ts` 的 `mergeVideosClientSide()`，也就是浏览器本地合成。
- 你截图里的文案“正在加载视频处理引擎（首次约需30秒）...”正好来自 `videoMerger.ts`，说明卡点就在 `ffmpeg.load()` 之前后这一段。

根因评估

1. 当前 FFmpeg 加载配置不稳
- `@ffmpeg/ffmpeg` 版本是 `0.12.10`
- 但代码里加载的是 CDN 上的 `@ffmpeg/core@0.12.6`
- 并且 `ffmpeg.load()` 没有传 `workerURL`
- 这个组合在 Vite 环境里很容易出现 `load()` 长时间 pending，UI 就会一直停在“合并片段”。

2. 当前失败兜底会制造“假成功”
- 合并失败后，代码会把 `videoUrls[0]` 当成 `videoUrl` 返回，并继续走 `done`
- 所以页面会显示“完成”，但用户看到的其实只是第一段视频 + 一堆短片下载链接
- 这正是你前面遇到“不是合到一起的视频，而是全部短片”的直接原因

实施方案

1. 修复前端合成引擎加载
- 统一 FFmpeg 核心版本，避免 `ffmpeg` 与 `core` 混用不同版本
- 在 `ffmpeg.load()` 中补上 `workerURL`
- 给 `load()` 增加超时保护，避免无限卡住
- 把 FFmpeg 的加载/执行日志透传到 `segmentProgress`，让页面明确显示是卡在：
  - 加载内核
  - 下载片段
  - 写入虚拟文件
  - 执行 concat
  - 读取输出文件

2. 修正状态机，不再把失败伪装成成功
- 合并失败时不再把第一段当成最终成片
- 新增明确结果分支：例如“片段已生成，但自动合并失败”
- 只有真正拿到 `mergedBlob` 并上传成功后，才设置最终 `videoUrl`
- 失败时结果区只展示：
  - 片段列表
  - 明确错误信息
  - 重试合并按钮（只重跑合并，不重做前面的语音/数字人生成）

3. 优化进度与结果 UI
- `src/pages/VideoGenerator.tsx` 中把“合并片段”这一步拆成更细的提示
- 成功时显示“完整成片”
- 失败时显示“仅生成了分段视频”
- 避免用户再次误以为系统已经合成完成

4. 做稳定性加固
- 多片段时优先传更稳的分辨率策略（建议默认 720p 或提供“稳定优先”）
- 合并前先校验每个片段 URL 可访问
- 对首次 FFmpeg 资源加载失败增加一次自动重试
- 保留分段下载作为兜底，但不再冒充最终结果

5. 清理误导性旧方案
- 当前 `supabase/functions/merge-videos/index.ts` 是二进制拼 MP4，这不是可靠的 MP4 合并方式
- 这次先不把修复重点放到它上面，因为当前页面根本没调用它
- 我会同步把代码路径梳理清楚，避免后续排查再被这个旧函数误导

涉及文件

- `src/utils/videoMerger.ts`
  - 修 FFmpeg 加载方式、版本对齐、worker、超时、日志
- `src/hooks/useVideoGeneration.ts`
  - 修合并状态机、失败分支、重试逻辑
- `src/pages/VideoGenerator.tsx`
  - 修进度提示与结果展示，杜绝“假成功”
- 视情况补充：
  - `package.json`
  - `vite.config.ts`
  用于增强 FFmpeg 在 Vite 下的加载稳定性

技术说明

```text
当前真实流程
分段生成成功
   -> 浏览器 ffmpeg.wasm 合并
   -> 上传 merged.mp4
   -> 展示最终视频

当前故障点
ffmpeg.load() 卡住 / merge 失败被吞掉
   -> 页面一直停在“合并片段”
   或
   -> 页面显示完成，但实际只是第一段视频
```

验收标准

- 不再长时间卡死在“正在合并视频片段”
- 合并成功时，结果区只显示真正完整成片
- 合并失败时，页面明确提示失败，不再把第一段伪装成最终视频
- 我会按这几种情况验证：
  - 首次加载 FFmpeg
  - 二次生成（命中缓存）
  - 2~5 段片段合并
  - 弱网/加载失败/合并失败分支
