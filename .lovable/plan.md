

# 修复商品图片显示 + 支持详情图片上传

## 问题分析

### 1. 图片显示不一致的原因
`partner-assets` 存储桶是**私有桶**（`public: false`），但代码中使用了 `getPublicUrl()` 获取图片地址。私有桶的 public URL 是无法直接访问的，导致商品列表和详情页显示的图片无法加载或显示为占位图。而 AI 识别时使用了 `createSignedUrl()` 所以 AI 可以正确读取。

### 2. 缺少详情图上传
数据库 `health_store_products` 表已有 `detail_images` 字段（TEXT 数组），但前端表单没有上传入口，详情弹窗也没有展示。

## 解决方案

### 方案 A: 将 `partner-assets` 桶改为公开（推荐）
商品图片本就是面向所有用户展示的，设为公开桶最简单，`getPublicUrl()` 即可正常使用。

### 修改内容

| 文件 | 改动 |
|------|------|
| 数据库迁移 | 将 `partner-assets` 桶设为 `public = true` |
| `PartnerStoreProducts.tsx` | 新增详情图片多图上传区域（最多9张），带预览和删除；编辑时回显已有图片 |
| `ProductDetailDialog.tsx` | 头图下方展示详情图片列表（可滚动浏览） |

### 技术细节

**1. 存储桶改公开**
```sql
UPDATE storage.buckets SET public = true WHERE id = 'partner-assets';
```

**2. PartnerStoreProducts.tsx 改造**
- 表单中"商品图片"下方新增"详情图片"区域
- 支持多文件选择，网格预览（3列），单张可删除
- 上传路径：`store/{partnerId}/{timestamp}.{ext}`
- 保存时将 URL 数组写入 `detail_images` 字段
- 编辑商品时从数据库回填已有的 `detail_images`
- 头图区域改为带图片预览（显示当前已选或已有头图）

**3. ProductDetailDialog.tsx 改造**
- 在主图下方增加详情图片展示区域
- 纵向排列，点击可查看大图

