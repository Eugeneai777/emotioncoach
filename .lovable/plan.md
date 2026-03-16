

## 计划：家人相册改为小红书瀑布流展示

### 目标
将 `/elder-care` 页面的家人相册从当前横向滚动改为小红书风格的双列瀑布流展示，类似有劲社区（CommunityWaterfall），同时保留上传功能在首页下方。

### 实现方案

**1. 新建 `src/components/elder-care/FamilyPhotoWaterfall.tsx`**
- 双列瀑布流布局（参考 CommunityWaterfall 的左右两列结构）
- 查询 `family_photos` 表，按 `created_at DESC` 排序
- 每张照片卡片：圆角图片 + 可选 caption + 上传时间
- 点击放大查看（复用现有 fullscreen viewer 逻辑）
- 支持分页加载更多（每次加载 20 张）
- 温暖的橙色系配色，适合老人界面

**2. 修改 `src/components/elder-care/ChildPhotosCard.tsx`**
- 替换现有横向滚动为新的瀑布流组件，或直接在此组件内改造
- 保留 `targetUserId` 逻辑（支持查看自己或关联孩子的照片）

**3. 修改 `src/pages/ElderCarePage.tsx`**
- 调整布局：上传按钮保持在功能入口下方
- 瀑布流相册放在上传按钮下方，作为主内容区
- 结构：功能入口 → 上传按钮 → 瀑布流相册 → 安全守护等

**4. 瀑布流卡片设计**
- 双列 masonry 布局，`grid grid-cols-2 gap-3`
- 每张照片卡片：圆角白色卡片 + 图片 + caption（如有）+ 时间戳
- 图片自适应高度（类似小红书不同高度的卡片效果）
- 新上传的照片显示「新」标签

