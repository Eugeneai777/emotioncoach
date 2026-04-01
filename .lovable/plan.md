

# 替换黛汐老师头像并统一为圆形

## 方案

1. **复制新头像到项目资源目录**：将用户上传的图片复制为 `src/assets/coach-daixi.jpg`（覆盖原文件）

2. **修改 `src/pages/SynergyPromoPage.tsx`**：
   - 移除 leadCoach 头像 `<img>` 上的 `style={{ objectPosition: 'center 20%' }}`，因为新照片构图合适，不需要偏移
   - leadCoach 头像容器已经是 `rounded-full`（圆形），与其他教练一致，无需改动容器样式

### 文件变更

| 文件 | 操作 |
|---|---|
| `src/assets/coach-daixi.jpg` | 替换为新上传的头像 |
| `src/pages/SynergyPromoPage.tsx` | 第720行移除 `objectPosition` 样式 |

