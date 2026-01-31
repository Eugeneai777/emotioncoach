

# 财富训练营冥想音频无法播放问题诊断报告

## 问题描述
用户反馈：财富训练营从第二天开始无法播放冥想音频

## 诊断结果

### 根本原因：音频文件未部署到生产环境

经过排查，发现所有冥想音频文件在生产环境都返回 **404 Not Found**：

| 音频路径 | 状态 |
|----------|------|
| `/meditation/D1_探索与金钱的关系.mp3` | 404 |
| `/audio/wealth-meditations/D2_探索与金钱的关系.mp3` | 404 |
| `/audio/wealth-meditations/D3_探索与金钱的关系.mp3` | 404 |
| ... Day 4-7 同样 404 | |

### 次要问题：数据库路径不一致

数据库 `wealth_meditations` 表中的 `audio_url` 字段存在路径不一致：

| Day | 数据库中的 audio_url | 文件系统中的位置 |
|-----|---------------------|-----------------|
| 1 | `/meditation/D1_探索与金钱的关系.mp3` | `public/meditation/D1_探索与金钱的关系.mp3` |
| 2-7 | `/audio/wealth-meditations/D{n}_探索与金钱的关系.mp3` | `public/audio/wealth-meditations/D{n}_探索与金钱的关系.mp3` |

虽然两个目录都有对应的文件，但路径不统一会造成维护困难。

### 为什么 Day 1 可能曾经能播放？

1. 用户可能有浏览器缓存
2. Day 1 文件可能在某次部署中被正确上传过

---

## 修复方案

### 方案 A：将音频文件迁移到 Lovable Cloud Storage（推荐）

大型媒体文件不适合放在代码仓库中，建议：

1. **创建 Storage bucket**：`meditation-audio`
2. **上传音频文件**到 Storage
3. **更新数据库**：将 `audio_url` 改为 Storage 的公开 URL
4. **删除 public 目录中的音频文件**

优点：
- 不占用代码仓库空间
- 更可靠的 CDN 分发
- 支持更大的文件

### 方案 B：确保静态文件正确部署

1. 检查音频文件是否在 Git 中被正确跟踪（可能因文件过大未被提交）
2. 确保部署流程包含 `public/` 目录下的所有静态资源
3. 统一数据库中的路径格式

### 方案 C：使用外部音频托管服务

将音频上传到第三方服务（如阿里云 OSS、腾讯云 COS），然后更新数据库 URL。

---

## 推荐执行步骤

### 第一步：使用 Storage 存储音频（解决根本问题）

```sql
-- 1. 创建 storage bucket（需要在 Lovable Cloud 后台操作）
-- bucket 名称: meditation-audio
-- 访问权限: public (公开读)

-- 2. 上传音频文件后，更新数据库
UPDATE wealth_meditations 
SET audio_url = 'https://[project-id].supabase.co/storage/v1/object/public/meditation-audio/D1_探索与金钱的关系.mp3'
WHERE day_number = 1;

-- 对 Day 2-7 执行类似操作
```

### 第二步：统一路径格式

确保所有冥想都使用统一的 Storage URL 格式：
```
https://vlsuzskvykddwrxbmcbu.supabase.co/storage/v1/object/public/meditation-audio/D{n}_探索与金钱的关系.mp3
```

### 第三步：清理代码库中的大文件

删除 `public/audio/` 和 `public/meditation/` 目录中的音频文件，减少仓库体积。

---

## 技术说明

### 当前代码流程（正常）

```text
用户进入打卡页面
       ↓
useQuery 获取 wealth_meditations
       ↓
返回 audio_url（如 /audio/wealth-meditations/D2_...mp3）
       ↓
WealthMeditationPlayer 接收 audioUrl
       ↓
<audio src={encodeURI(audioUrl)} />
       ↓
❌ 浏览器请求该路径，服务器返回 404
       ↓
音频无法播放
```

### 修复后流程

```text
用户进入打卡页面
       ↓
useQuery 获取 wealth_meditations
       ↓
返回 audio_url（Storage 完整 URL）
       ↓
WealthMeditationPlayer 接收 audioUrl
       ↓
<audio src={Storage公开URL} />
       ↓
✅ 从 CDN 加载音频成功
       ↓
正常播放
```

---

## 立即行动项

1. **创建 Storage bucket** `meditation-audio`，设为公开访问
2. **手动上传** 7 个冥想音频文件到 Storage
3. **执行 SQL** 更新 `wealth_meditations` 表的 `audio_url` 字段
4. **测试** Day 1-7 的音频是否都能正常播放

需要我协助创建 Storage bucket 并更新数据库吗？

