
# 生成 7 张小红书封面图 -- 马上系列

## 方案

创建一个新的 Edge Function `generate-xiaohongshu-covers`，一次性生成 7 张红金马年配色的小红书封面图，上传到存储桶并返回所有图片 URL。

同时创建一个前端管理页面，方便触发生成和预览/下载图片。

## 7 张封面主题与提示词设计

每张图片使用统一的视觉风格指令 + 各自的主题关键词：

| # | 主题 | 核心视觉元素 |
|---|------|-------------|
| 1 | 马上觉醒 | 骏马从迷雾中觉醒，睁开发光的眼睛，金光破晓 |
| 2 | 马上发财 | 骏马奔腾踏金币，金元宝飞溅，红色祥云 |
| 3 | 马上回血 | 骏马从低谷跃起，伤口化为金色光芒，浴火重生 |
| 4 | 马上看见 | 骏马站在山巅俯瞰，第三只眼发出金光，洞察全局 |
| 5 | 马上破局 | 骏马冲破金色锁链/围墙，碎片飞溅，力量感 |
| 6 | 马上翻身 | 骏马从深渊跃向天空，红金祥云托底，逆转姿态 |
| 7 | 马上出发 | 骏马站在起跑线，面向日出，红色丝带飘扬 |

**统一风格指令**：
- 配色：中国红 + 金色为主色调，暗红/黑色为辅助
- 比例：3:4 竖版（小红书封面标准）
- 风格：国潮插画，大气磅礴，适合社交媒体
- 禁止出现任何文字/字母/数字（文字后期叠加）

## 实现步骤

### 1. 新建 Edge Function `generate-xiaohongshu-covers`

路径：`supabase/functions/generate-xiaohongshu-covers/index.ts`

- 接收参数：`{ themes: string[] }` 或无参数（使用内置 7 个主题）
- 依次调用 Lovable AI Gateway（`google/gemini-3-pro-image-preview`）生成每张图
- 每张图生成后上传到 `community-images` 存储桶，路径为 `xiaohongshu/mashang-{theme}-{timestamp}.png`
- 返回 7 个图片公开 URL
- 不扣费（管理员用途）
- 每张图之间加适当延时避免速率限制

### 2. 新建前端页面 `XiaohongshuCoversGenerator`

路径：`src/pages/XiaohongshuCovers.tsx`

- 一个简单的管理页面，包含：
  - "生成封面" 按钮
  - 7 张图片的预览网格（3:4 比例卡片）
  - 每张图下方显示主题名称
  - 生成进度条（1/7, 2/7...）
  - 每张图可单独点击下载
- 添加路由 `/xiaohongshu-covers`

### 3. 添加路由

在 `App.tsx` 中注册 `/xiaohongshu-covers` 路由。

## 技术细节

- 使用 `google/gemini-3-pro-image-preview` 模型确保高质量输出
- 7 张图串行生成（避免并发触发速率限制），前端实时显示进度
- 图片上传到已有的 `community-images` 存储桶
- Edge Function 超时设置需注意：7 张图可能需要较长时间，考虑改为单张生成模式，前端循环调用 7 次
- 实际实现时 Edge Function 改为单张生成（接收单个 theme），前端逐一调用 7 次，避免超时
