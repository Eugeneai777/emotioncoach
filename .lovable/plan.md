

# 修复小红书封面生成器

## 问题原因

Edge Function 日志显示错误：
```
StorageApiError: Invalid key: xiaohongshu/mashang-觉醒-1771224179013.png
```

Supabase Storage 不支持中文字符作为文件名。图片由 AI 成功生成，但在上传到存储桶时因文件名包含中文而失败。

## 修复方案

修改 `supabase/functions/generate-xiaohongshu-covers/index.ts`，将文件名中的中文主题替换为拼音：

| 中文 | 拼音 |
|------|------|
| 觉醒 | juexing |
| 发财 | facai |
| 回血 | huixue |
| 看见 | kanjian |
| 破局 | poju |
| 翻身 | fanshen |
| 出发 | chufa |

## 具体改动

仅修改一个文件：`supabase/functions/generate-xiaohongshu-covers/index.ts`

1. 添加一个中文到拼音的映射表：
```typescript
const THEME_PINYIN: Record<string, string> = {
  "觉醒": "juexing",
  "发财": "facai",
  "回血": "huixue",
  "看见": "kanjian",
  "破局": "poju",
  "翻身": "fanshen",
  "出发": "chufa",
};
```

2. 将文件名生成行从：
```typescript
const fileName = `xiaohongshu/mashang-${theme}-${Date.now()}.png`;
```
改为：
```typescript
const fileName = `xiaohongshu/mashang-${THEME_PINYIN[theme] || theme}-${Date.now()}.png`;
```

无需修改前端代码或其他文件。
