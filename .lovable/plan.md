

## 有劲合伙人计划页面一键分享优化方案

### 问题分析

当前页面的分享实现与项目标准的**一键分享**模式不一致：

| 对比项 | 当前实现（手动） | 标准模式（一键分享） |
|:-------|:----------------|:-------------------|
| 技术方案 | 直接调用 `html2canvas` | 使用 `useOneClickShare` hook |
| 用户操作 | 打开Dialog → 点击保存海报 → 下载 | 点击按钮 → 自动分享/预览 |
| 环境适配 | 仅下载功能 | iOS/Android/微信/桌面多环境适配 |
| 预览组件 | 无 | `ShareImagePreview` 长按保存引导 |

---

### 优化目标

1. **将浮动CTA的"分享"按钮升级为一键分享**
2. **保留Dialog作为备选分享方式**（复制链接等）
3. **复用现有海报设计**，仅调整技术实现

---

### 技术方案

#### 1. 引入 `useOneClickShare` hook

```tsx
import { useOneClickShare } from '@/hooks/useOneClickShare';
import ShareImagePreview from '@/components/ui/share-image-preview';
```

#### 2. 创建合伙人计划专用分享卡片组件

需要将当前的 `posterRef` 海报抽离为独立组件 `PartnerPlanShareCard`，以便 `useOneClickShare` hook 正确引用：

```tsx
// src/components/partner/PartnerPlanShareCard.tsx
const PartnerPlanShareCard = forwardRef<HTMLDivElement>((_, ref) => {
  return (
    <div ref={ref} className="w-[360px] p-6 bg-[#fff8f0] rounded-xl">
      {/* 现有海报内容 */}
    </div>
  );
});
```

#### 3. 修改浮动CTA按钮

将"分享"按钮直接触发 `triggerShare`：

```tsx
<Button 
  variant="outline" 
  className="flex-1 h-12"
  onClick={triggerShare}
  disabled={isSharing}
>
  {isSharing ? (
    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
  ) : (
    <Share2 className="h-4 w-4 mr-2" />
  )}
  {isSharing ? '生成中...' : '一键分享'}
</Button>
```

#### 4. 添加 ShareImagePreview 组件

用于微信/iOS环境的长按保存引导：

```tsx
<ShareImagePreview
  open={showImagePreview}
  onClose={closePreview}
  imageUrl={previewImageUrl}
/>
```

#### 5. 保留 Dialog 备选

页面底部的"分享此页"区域仍可打开 Dialog，提供复制链接、下载海报等选项。

---

### 修改内容汇总

| 操作 | 文件 | 说明 |
|:-----|:-----|:-----|
| 新建 | `src/components/partner/PartnerPlanShareCard.tsx` | 抽离海报为独立组件 |
| 修改 | `src/pages/YoujinPartnerPlan.tsx` | 集成 `useOneClickShare` |

### 代码变更细节

**新建 PartnerPlanShareCard.tsx：**
- 将当前 `posterRef` 内容移入
- 使用 `forwardRef` 以便传递 ref 给 hook
- 保持现有样式和内容不变

**修改 YoujinPartnerPlan.tsx：**
1. 添加导入：`useOneClickShare`、`ShareImagePreview`、`PartnerPlanShareCard`
2. 初始化 hook 并预加载数据
3. 替换浮动CTA按钮的 `handleShare` 为 `triggerShare`
4. 添加隐藏的 `PartnerPlanShareCard`（用于截图）
5. 添加 `ShareImagePreview` 组件

---

### 预期效果

1. **一步操作**：点击"分享"按钮即刻生成图片并触发分享
2. **多环境适配**：
   - iOS：调用系统分享面板
   - Android：调用系统分享面板
   - 微信H5：显示图片预览+长按保存引导
   - 桌面：下载图片
3. **与项目其他分享组件保持一致**

