

## 海报中心优化方案

### 问题分析

1. **显示问题**
   - 部分页面仍使用 `min-h-screen`，导致移动端滚动异常
   - 认证加载状态页面未使用标准化滚动容器
   - 合伙人检查页面未使用标准化滚动容器

2. **缺少一键分享功能**
   - 快速模式 `PosterGenerator.tsx` 仅有"下载海报"按钮
   - 专家模式预览页仅有"保存到相册"按钮
   - 两者都缺少针对 WeChat/iOS 的一键分享和图片预览功能

### 解决方案

#### 1. 统一滚动容器标准

将所有剩余的 `min-h-screen` 替换为标准化容器：

```tsx
<div 
  className="h-screen overflow-y-auto overscroll-contain ..."
  style={{ WebkitOverflowScrolling: 'touch' }}
>
```

涉及位置：
- 认证加载/登录提示页面 (第 51-58 行)
- 合伙人检查页面 (第 63-67 行, 72-79 行)

#### 2. 快速模式添加一键分享 (PosterGenerator.tsx)

**导入依赖：**
```typescript
import { executeOneClickShare } from '@/utils/oneClickShare';
import ShareImagePreview from '@/components/ui/share-image-preview';
import { getShareEnvironment } from '@/utils/shareUtils';
```

**新增状态：**
```typescript
const [showImagePreview, setShowImagePreview] = useState(false);
const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);
const [isSharing, setIsSharing] = useState(false);
```

**新增一键分享函数：**
```typescript
const handleOneClickShare = async () => {
  if (!posterRef.current) return;
  
  setIsSharing(true);
  
  await executeOneClickShare({
    cardRef: posterRef,
    cardName: `${template.name}-推广海报`,
    onProgress: (status) => {
      if (status === 'generating') {
        toast.loading('正在生成海报...');
      } else if (status === 'done') {
        toast.dismiss();
        toast.success('分享成功');
      } else if (status === 'error') {
        toast.dismiss();
      }
    },
    onShowPreview: (blobUrl) => {
      toast.dismiss();
      setPreviewImageUrl(blobUrl);
      setShowImagePreview(true);
    },
    onError: (error) => {
      toast.dismiss();
      toast.error(error);
    }
  });
  
  setIsSharing(false);
};
```

**更新 UI 按钮：**
将单一的"下载海报"按钮替换为两个按钮：
- 一键分享（主按钮，橙色渐变）
- 下载海报（次要按钮，outline 样式）

**添加 ShareImagePreview 组件：**
```tsx
<ShareImagePreview
  open={showImagePreview}
  onClose={() => {
    setShowImagePreview(false);
    if (previewImageUrl) URL.revokeObjectURL(previewImageUrl);
    setPreviewImageUrl(null);
  }}
  imageUrl={previewImageUrl}
/>
```

#### 3. 专家模式添加一键分享 (PosterCenter.tsx)

在专家模式预览页面（第 486-588 行）进行类似修改：

**新增状态变量：**
```typescript
const [showPosterPreview, setShowPosterPreview] = useState(false);
const [posterPreviewUrl, setPosterPreviewUrl] = useState<string | null>(null);
const [isPosterSharing, setIsPosterSharing] = useState(false);
```

**新增一键分享函数：**
```typescript
const handlePosterShare = async () => {
  // 类似 handleOneClickShare 的实现
};
```

**更新按钮布局：**
将"保存到相册"改为双按钮：
- 一键分享（主按钮）
- 保存到相册（次要按钮）

**添加 ShareImagePreview 组件**

### 文件修改清单

| 文件 | 修改内容 |
|:-----|:---------|
| `src/pages/PosterCenter.tsx` | 1. 修复剩余 `min-h-screen` 问题<br>2. 专家模式添加一键分享状态和函数<br>3. 添加 ShareImagePreview 组件 |
| `src/components/poster/PosterGenerator.tsx` | 1. 导入分享相关工具<br>2. 添加分享状态和函数<br>3. 更新按钮布局<br>4. 添加 ShareImagePreview 组件 |

### 技术细节

#### 分享流程逻辑

```text
用户点击"一键分享"
      │
      ▼
执行 executeOneClickShare()
      │
      ├── 生成 Canvas → 转 Blob
      │
      ▼
┌─────────────────────────────────────────┐
│ 环境检测                                 │
├─────────────────────────────────────────┤
│ 小程序环境     → 显示 ShareImagePreview  │
│ iOS/Android   → navigator.share (原生)  │
│ 失败时回退     → ShareImagePreview      │
│ 桌面端         → 尝试 WebShare / 下载    │
└─────────────────────────────────────────┘
```

#### 按钮布局设计

```
┌────────────────────────────────────┐
│  🚀 一键分享                        │  ← 主按钮（橙色渐变）
├────────────────────────────────────┤
│  💾 下载海报                        │  ← 次要按钮（outline）
└────────────────────────────────────┘
```

