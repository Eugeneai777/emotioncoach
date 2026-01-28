

## 合伙人计划分享卡片模板选择功能

### 当前状态分析

| 组件 | 当前实现 | 模板选择 |
|:-----|:---------|:---------|
| `IntroShareDialog` | 3种模板（简洁版/价值版/场景版） | ✅ 有选择器 |
| `PosterLayoutSelector` | 6种布局风格 | ✅ 有选择器 |
| `ShareCardStyleSelector` | 4种配色（默认/温暖/专业/简约） | ✅ 有选择器 |
| **`PartnerPlanShareCard`** | 仅1种固定样式 | ❌ 无选择 |

当前 `PartnerPlanShareCard` 只有一种橙色渐变的固定设计，用户无法选择不同风格。

---

### 优化方案

#### 新增4种分享卡片模板

| 模板ID | 名称 | 风格特点 |
|:-------|:-----|:---------|
| `classic` | 经典橙 | 当前默认样式，温暖的橙色渐变 |
| `professional` | 专业蓝 | 商务蓝灰色调，突出数据可信度 |
| `minimal` | 极简白 | 大量留白，黑白为主，干净现代 |
| `energetic` | 活力紫 | 紫色渐变，年轻活力感 |

---

### 技术实现

#### 1. 创建模板配置文件

**新建 `src/config/partnerShareCardStyles.ts`**：

```typescript
export type PartnerCardTemplate = 'classic' | 'professional' | 'minimal' | 'energetic';

export interface PartnerCardStyleConfig {
  id: PartnerCardTemplate;
  label: string;
  previewGradient: string; // 用于选择器缩略图
  styles: {
    background: string;
    headerBg: string;
    headerText: string;
    accentColor: string;
    cardBg: string;
    textColor: string;
    mutedColor: string;
    ctaGradient: string;
  };
}

export const PARTNER_CARD_STYLES: Record<PartnerCardTemplate, PartnerCardStyleConfig> = {
  classic: {
    id: 'classic',
    label: '经典橙',
    previewGradient: 'from-orange-400 to-amber-400',
    styles: { /* 当前橙色样式 */ }
  },
  professional: {
    id: 'professional', 
    label: '专业蓝',
    previewGradient: 'from-slate-500 to-blue-600',
    styles: { /* 蓝灰商务风 */ }
  },
  minimal: {
    id: 'minimal',
    label: '极简白',
    previewGradient: 'from-gray-100 to-white',
    styles: { /* 黑白极简风 */ }
  },
  energetic: {
    id: 'energetic',
    label: '活力紫',
    previewGradient: 'from-purple-500 to-pink-500',
    styles: { /* 紫粉活力风 */ }
  }
};
```

#### 2. 创建模板选择器组件

**新建 `src/components/partner/PartnerCardTemplateSelector.tsx`**：

```tsx
export function PartnerCardTemplateSelector({
  selectedTemplate,
  onTemplateChange
}: Props) {
  return (
    <div className="grid grid-cols-4 gap-2">
      {Object.values(PARTNER_CARD_STYLES).map((style) => (
        <button
          key={style.id}
          onClick={() => onTemplateChange(style.id)}
          className={cn(
            "relative p-2 rounded-lg border-2 transition-all",
            selectedTemplate === style.id 
              ? "border-primary ring-2 ring-primary/20" 
              : "border-transparent hover:border-muted-foreground/30"
          )}
        >
          <div className={cn(
            "w-full h-8 rounded-md bg-gradient-to-br",
            style.previewGradient
          )} />
          <span className="text-[10px] text-muted-foreground">
            {style.label}
          </span>
        </button>
      ))}
    </div>
  );
}
```

#### 3. 修改 PartnerPlanShareCard 支持模板

**修改 `src/components/partner/PartnerPlanShareCard.tsx`**：

```tsx
interface PartnerPlanShareCardProps {
  template?: PartnerCardTemplate; // 新增模板参数
  className?: string;
}

const PartnerPlanShareCard = forwardRef<HTMLDivElement, PartnerPlanShareCardProps>(
  ({ template = 'classic' }, ref) => {
    const styles = PARTNER_CARD_STYLES[template].styles;
    
    return (
      <div
        ref={ref}
        style={{
          width: '360px',
          padding: '24px',
          background: styles.background, // 使用模板样式
          // ... 其他样式动态化
        }}
      >
        {/* 根据 styles 渲染内容 */}
      </div>
    );
  }
);
```

#### 4. 修改 YoujinPartnerPlan 页面

**修改 `src/pages/YoujinPartnerPlan.tsx`**：

```tsx
import { PartnerCardTemplateSelector } from '@/components/partner/PartnerCardTemplateSelector';

// 新增状态
const [selectedTemplate, setSelectedTemplate] = useState<PartnerCardTemplate>('classic');

// 在 Dialog 中添加模板选择器
<Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
  <DialogContent>
    {/* 模板选择器 */}
    <PartnerCardTemplateSelector
      selectedTemplate={selectedTemplate}
      onTemplateChange={setSelectedTemplate}
    />
    
    {/* 卡片预览 */}
    <PartnerPlanShareCard template={selectedTemplate} />
  </DialogContent>
</Dialog>

// 隐藏截图卡片也使用选中的模板
<PartnerPlanShareCard ref={posterRef} template={selectedTemplate} />
```

---

### 涉及文件

| 操作 | 文件 | 说明 |
|:-----|:-----|:-----|
| 新建 | `src/config/partnerShareCardStyles.ts` | 4种模板配色配置 |
| 新建 | `src/components/partner/PartnerCardTemplateSelector.tsx` | 模板选择器UI |
| 修改 | `src/components/partner/PartnerPlanShareCard.tsx` | 支持多模板渲染 |
| 修改 | `src/pages/YoujinPartnerPlan.tsx` | 集成模板选择功能 |

---

### 4种模板视觉预览

```text
┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│  🟠 经典橙    │  │  🔵 专业蓝    │  │  ⚪ 极简白    │  │  🟣 活力紫    │
│  橙→琥珀渐变  │  │  蓝→灰渐变   │  │  白底黑字    │  │  紫→粉渐变   │
│  温暖亲切    │  │  稳重可信    │  │  干净现代    │  │  年轻活力    │
└──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘
```

### 预期效果

1. **分享Dialog** 顶部新增模板选择器（4个颜色块）
2. **实时预览** 切换模板时卡片即时更新
3. **一键分享** 使用当前选中的模板生成图片
4. **与项目其他分享组件风格一致**（参考 `ShareCardStyleSelector`）

