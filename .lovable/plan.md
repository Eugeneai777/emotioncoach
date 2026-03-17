

## 计划：FamilyPhotoUploader 改为双按钮布局

当前 `FamilyPhotoUploader.tsx` 仍是单按钮（只有上传），之前的双按钮修改似乎未生效。需要重新实现。

### 修改内容

**1. `src/components/elder-care/FamilyPhotoUploader.tsx`**
- 添加邀请亲友逻辑：查询/创建 `family_album_shares` 的 `share_token`，生成分享链接
- 添加 `Share2, Check, Loader2` 等图标引入
- 将 UI 改为 `flex gap-2` 双按钮行：
  - 左按钮：上传照片（带计数 `photoCount/50`）
  - 右按钮：邀请亲友（点击生成链接并复制/分享）
- 添加 `handleInvite` 函数（复用 `FamilyAlbumShareButton` 中的逻辑：Web Share API → clipboard fallback）

**2. `src/components/elder-care/FamilyPhotoWaterfall.tsx`**（如果标题栏还有 share 按钮则移除）

不需要数据库变更，`family_album_shares` 表已存在。

