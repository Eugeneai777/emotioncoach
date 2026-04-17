
上次后台渲染挂了，没产物。需要重新拉起渲染并兜底。

## 执行
1. 检查 `/tmp/havruta-render.log` 和 `/mnt/documents/havruta_intro.mp4` 当前状态，看进度到哪了
2. 检查是否还有残留的 node 渲染进程，有就清掉
3. 重新跑 `cd remotion && nohup node scripts/render-remotion.mjs havruta-intro > /tmp/havruta-render.log 2>&1 &`，concurrency=8
4. 轮询日志 + 文件大小（每 30s 一次，最多 8 分钟）
5. 完成后用 `ffprobe` 校验时长 + aac 音轨；抽 200/1000/1800 三帧目检
6. `<lov-artifact>` 交付

## 兜底
若仍卡在最后 mux 阶段：手动用 ffmpeg 把 remotion 中间产物（pre-stitcher 临时帧目录或纯视频文件）和 9 段 mp3 直接合并出 mp4。
