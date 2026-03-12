

## 教练照片上传优化方案

### 现状
- `CoachEditDialog.tsx` 编辑弹窗中**没有头像/照片上传功能**
- `human_coaches` 表已有 `avatar_url` 字段，但编辑时无法修改
- 列表页通过 `Avatar` 组件显示圆形头像，未按 3:4 比例展示

### 方案

#### 1. 创建 Storage Bucket
新建 `coach-photos` 公开存储桶，用于存放教练照片。添加 RLS 策略允许管理员上传。

#### 2. CoachEditDialog 增加照片上传
- 在编辑弹窗顶部添加 3:4 比例的照片预览区域
- 点击可选择图片文件，上传前自动压缩（复用 `compressImage` 逻辑）
- 上传到 `coach-photos/{coachId}/` 路径
- 保存时将 `avatar_url` 一并更新到数据库

#### 3. 列表页展示优化
- `ApprovedCoachesList` 和 `CoachApplicationsList` 中将圆形 `Avatar` 替换为 3:4 比例的照片卡片（使用 `aspect-ratio: 3/4` + `object-cover`）
- 无照片时显示首字母 fallback

#### 4. 涉及文件
| 文件 | 改动 |
|------|------|
| 新建 migration SQL | 创建 `coach-photos` bucket + RLS |
| `CoachEditDialog.tsx` | 添加照片上传组件、压缩、预览 |
| `ApprovedCoachesList.tsx` | 照片改为 3:4 比例展示 |
| `CoachApplicationsList.tsx` | 照片改为 3:4 比例展示 |
| `CoachApplicationDetail.tsx` | 详情弹窗中照片 3:4 展示 |

