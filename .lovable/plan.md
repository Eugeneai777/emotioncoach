
# 替换第二天冥想音频

## 目标
用上传的新音频文件替换财富训练营第二天的冥想音频。

## 当前状态
- **Day 2 音频 URL**: `https://vlsuzskvykddwrxbmcbu.supabase.co/storage/v1/object/public/meditation-audio/day2-wealth-meditation.mp3`
- **存储位置**: Supabase Storage `meditation-audio` 存储桶
- **新文件**: `D2_探索与金钱的关系-2.mp3`

## 实现步骤

### 步骤 1: 上传新音频到存储桶
将用户上传的文件复制到项目，然后通过 Supabase Storage API 上传到 `meditation-audio` 存储桶。

为保持一致性，新文件将使用相同文件名：`day2-wealth-meditation.mp3`

### 步骤 2: 替换现有文件
由于使用相同文件名，上传后会自动覆盖原有文件，数据库中的 URL 无需修改。

## 技术细节

| 项目 | 内容 |
|------|------|
| 源文件 | `user-uploads://D2_探索与金钱的关系-2.mp3` |
| 目标存储桶 | `meditation-audio` |
| 目标文件名 | `day2-wealth-meditation.mp3` |
| 数据库更新 | 无需更新（URL 保持不变）|

## 操作方式

我将通过以下方式完成替换：

1. 将上传的音频文件复制到项目临时目录
2. 使用 Supabase Storage upsert 功能上传并覆盖原文件
3. 验证新音频可正常访问

## 注意事项

- 替换后，用户浏览器可能需要清除缓存才能听到新版本
- 如果之前有用户离线缓存了旧音频，需要重新缓存
