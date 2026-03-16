

## 计划：最简家庭相册（孩子上传，老人查看，限50张）

### 数据库变更

**1. 创建 `family-photos` Storage bucket**
```sql
INSERT INTO storage.buckets (id, name, public) VALUES ('family-photos', 'family-photos', true);
```

**2. Storage RLS 策略**
- authenticated 用户可上传到自己 `user_id/` 目录
- 所有人可读（老人可能未登录）

**3. 创建 `family_photos` 表**
```sql
CREATE TABLE public.family_photos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  photo_url text NOT NULL,
  caption text,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.family_photos ENABLE ROW LEVEL SECURITY;
```

**4. RLS 策略**
- SELECT: anon + authenticated 均可读（老人可能未登录，通过 `user_id` 过滤）
- INSERT: authenticated，`user_id = auth.uid()`
- DELETE: authenticated，`user_id = auth.uid()`

### 前端组件

**5. 新建 `src/components/elder-care/FamilyPhotoUploader.tsx`**
- 孩子端上传组件，放在 ElderModeEntryCard 中
- 复用已有图片压缩逻辑（参考 ImageUploader.tsx）
- 上传前检查数量限制（查询当前照片数，≥50 则提示已满）
- 上传到 `family-photos` bucket，写入 `family_photos` 表
- 可选添加简短文字说明

**6. 新建 `src/components/elder-care/ChildPhotosCard.tsx`**
- 老人端查看组件，放在 ElderCarePage 中
- 从 localStorage 读取 `child_user_id`（`getChildRef()`）
- 查询 `family_photos` 表，`user_id = childRef`，按 `created_at DESC` 取最近照片
- 横向滚动相册，大圆角，温暖配色，适合老人
- 点击可放大查看
- 无 childRef 或无照片时不显示

**7. 修改 `ElderModeEntryCard.tsx`**
- 在已有卡片中新增「上传照片给长辈」按钮，展开 FamilyPhotoUploader

**8. 修改 `ElderCarePage.tsx`**
- 在功能入口下方插入 `<ChildPhotosCard />`

### 限制策略
- 前端上传前查询 `SELECT count(*) FROM family_photos WHERE user_id = auth.uid()`，≥50 拒绝上传
- 支持删除旧照片腾出空间

