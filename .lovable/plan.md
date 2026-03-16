

## 用 AI 生成6个人群入口插画配图

### 方案概述
创建一个边缘函数，在应用首次加载时用 AI 生成6张风格统一的插画图，上传到存储桶，然后在按钮中显示。同时提供预生成机制，避免用户等待。

### 实现步骤

**1. 创建边缘函数 `generate-audience-illustrations`**
- 为6个人群（宝妈、职场、情侣、青少年、中年、银发）各生成一张插画
- 使用 `google/gemini-3.1-flash-image-preview` 模型（快速+高质量）
- Prompt 统一风格：扁平插画、暖色调、无文字、正方形、适合小程序卡片
- 生成后上传到 storage bucket `audience-illustrations`
- 结果存入数据库表 `audience_illustrations`，缓存 URL

**2. 创建数据库表 `audience_illustrations`**
```sql
create table public.audience_illustrations (
  id uuid primary key default gen_random_uuid(),
  audience_id text unique not null,
  image_url text not null,
  created_at timestamptz default now()
);
alter table public.audience_illustrations enable row level security;
create policy "Anyone can read" on public.audience_illustrations for select using (true);
```

**3. 创建 storage bucket `audience-illustrations`**（公开读取）

**4. 修改 `src/pages/MiniAppEntry.tsx`**
- 页面加载时查询 `audience_illustrations` 表获取已有图片
- 如果某个 audience 没有图片，显示渐变背景兜底
- 用 `<img>` 替换 emoji 圆形容器和右上角水印 emoji
- 图片作为卡片背景右侧装饰（半透明叠加），保留渐变底色
- 卡片布局改为左文字+右插画的结构

**5. 添加管理触发机制**
- 在边缘函数中一次性批量生成6张图
- 可通过 curl 手动触发，或在管理后台添加按钮
- 已有图片则跳过，支持强制重新生成

### 插画 Prompt 示例
```
"为心理健康小程序生成一张扁平风格插画：一位温柔的妈妈抱着孩子，
背景是柔和的粉色渐变，风格简洁可爱，无文字，正方形构图，
适合作为移动端小卡片配图。"
```

### 用户体验
- 首次部署后手动触发一次生成（约30秒全部完成）
- 之后所有用户直接加载缓存的图片 URL
- 如果图片未生成，graceful fallback 到当前渐变+emoji 样式

