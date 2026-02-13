
# 个人主页直接编辑昵称和头像

## 概述
在用户个人主页的信息卡片区域增加"就地编辑"能力，点击头像可直接上传新头像，点击昵称可直接修改，无需跳转设置页面。

---

## 修改文件

**`src/pages/UserProfile.tsx`**

### 1. 新增状态和逻辑
- 添加 `isEditingName` 状态控制昵称编辑模式
- 添加 `editName` 状态存储编辑中的昵称
- 添加 `isUploadingAvatar` 状态控制头像上传状态
- 添加隐藏的 `<input type="file">` 和 `fileInputRef`
- 添加 `handleAvatarUpload` 函数：选择图片 -> 压缩 -> 上传到 `community-images` 存储桶 -> 更新 `profiles` 表 -> 刷新本地状态
- 添加 `handleNameSave` 函数：更新 `profiles` 表的 `display_name` 字段

### 2. 头像区域改造（仅自己的主页）
- 头像上添加半透明遮罩层，悬停时显示相机图标，点击触发文件选择
- 上传中显示 loading 动画
- 复用已有的图片压缩逻辑（参考 `AvatarUploader` 组件）

### 3. 昵称区域改造（仅自己的主页）
- 昵称旁显示小编辑图标（Pencil），点击进入编辑模式
- 编辑模式下昵称变为 Input 输入框 + 确认/取消按钮
- 点击确认保存到数据库，点击取消恢复原值

### 4. 保留"编辑资料"按钮
- 顶部的"编辑资料"按钮保留，用于编辑更多字段（签名、心情等）

---

## 交互流程

```text
头像编辑:
  点击头像 -> 弹出文件选择 -> 压缩图片 -> 上传存储桶 -> 更新数据库 -> 刷新页面显示

昵称编辑:
  点击编辑图标 -> 输入框出现 -> 输入新昵称 -> 点击确认 -> 更新数据库 -> 刷新显示
```

---

## 技术细节

- 图片压缩复用与 `AvatarUploader` 相同的 canvas 缩放逻辑（400x400, JPEG 0.85 质量）
- 上传路径：`avatars/{timestamp}.{ext}`，存储桶 `community-images`（已存在且公开）
- 仅当 `isOwnProfile === true` 时才显示编辑交互
- 新增导入：`Pencil`, `Check`, `X`, `Camera`, `Loader2` 图标；`Input` 组件；`useToast`
