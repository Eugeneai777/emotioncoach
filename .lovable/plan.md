

## 有劲合伙人计划分享模块问题修复方案

### 问题汇总

| 问题 | 现状 | 目标 |
|:-----|:-----|:-----|
| 模板标签不显示 | 中间2个标签空白 | 4个模板标签全部正确显示 |
| Dialog缺少一键分享 | 只有"复制链接"和"保存海报" | 新增"一键分享"主按钮 |
| 未使用统一分享模块 | 自定义 Dialog + html2canvas | 使用 ShareDialogBase 或统一按钮布局 |

---

### 修复方案

#### 1. 修复模板选择器标签显示问题

**问题原因**：`PartnerCardTemplateSelector` 组件的预览色块使用 Tailwind 渐变类，但渐变颜色可能未被正确编译。

**修复方案**：
```tsx
// 当前（可能有问题）
<div className={cn("w-full h-6 rounded-md bg-gradient-to-br", style.previewGradient)} />

// 修复：使用内联样式确保渐变正确渲染
const gradientStyles: Record<PartnerCardTemplate, string> = {
  classic: 'linear-gradient(to bottom right, #fb923c, #fbbf24)',
  professional: 'linear-gradient(to bottom right, #64748b, #2563eb)',
  minimal: 'linear-gradient(to bottom right, #f3f4f6, #ffffff)',
  energetic: 'linear-gradient(to bottom right, #a855f7, #ec4899)',
};

<div style={{ background: gradientStyles[style.id] }} className="w-full h-6 rounded-md border border-black/5" />
```

#### 2. 在 Dialog 中添加一键分享按钮

当前 Dialog 按钮布局：
```text
┌────────────────┬────────────────┐
│   复制链接      │   保存海报      │
└────────────────┴────────────────┘
```

优化为统一的三按钮布局：
```text
┌──────────────────────────────────┐
│        ✨ 一键分享 (主按钮)        │
├────────────────┬────────────────┤
│   复制链接      │   保存海报      │
└────────────────┴────────────────┘
```

**代码实现**：
```tsx
<div className="space-y-3 pt-4">
  {/* 一键分享 - 主按钮 */}
  <Button
    className="w-full h-12 bg-gradient-to-r from-orange-500 to-amber-500"
    onClick={handleOneClickShare}
    disabled={isSharing}
  >
    {isSharing ? <Loader2 className="animate-spin mr-2" /> : <Share2 className="mr-2" />}
    {isSharing ? '生成中...' : '一键分享'}
  </Button>
  
  {/* 辅助按钮 */}
  <div className="grid grid-cols-2 gap-3">
    <Button variant="outline" onClick={handleCopyLink}>
      <Copy className="mr-2" /> 复制链接
    </Button>
    <Button variant="outline" onClick={handleGeneratePoster}>
      <Download className="mr-2" /> 保存海报
    </Button>
  </div>
</div>
```

#### 3. 统一分享模块对比与建议

项目已有两个标准化分享模块：

| 模块 | 适用场景 | 特点 |
|:-----|:---------|:-----|
| `ShareDialogBase` | 测评结果、训练营分享等 | 完整的预览/生成/分享流程 |
| `executeOneClickShare` | 快速一键分享 | 直接触发系统分享或预览 |

**当前页面推荐**：保持现有自定义 Dialog，但将一键分享按钮添加进来，因为：
- 页面已有完整的模板选择器UI
- 需要保留模板切换预览功能
- 只需在现有Dialog中增加一键分享入口

---

### 涉及文件

| 文件 | 修改内容 |
|:-----|:---------|
| `src/components/partner/PartnerCardTemplateSelector.tsx` | 修复渐变预览显示问题 |
| `src/pages/YoujinPartnerPlan.tsx` | Dialog中添加一键分享按钮 |
| `src/config/partnerShareCardStyles.ts` | 添加内联渐变样式配置（可选） |

### 修改详情

**PartnerCardTemplateSelector.tsx 修复**：
1. 将 Tailwind 渐变类改为内联样式
2. 确保所有4个模板标签正确显示

**YoujinPartnerPlan.tsx 优化**：
1. 在 Dialog 按钮区域添加"一键分享"主按钮
2. 调整按钮布局为"主按钮 + 双辅助按钮"
3. 一键分享按钮调用现有的 `handleOneClickShare` 函数

---

### 预期效果

1. **模板选择器**：4个风格选项（经典橙、专业蓝、极简白、活力紫）全部正确显示
2. **Dialog 按钮**：新增"一键分享"主按钮，支持 iOS/Android 系统分享、微信长按保存
3. **与项目统一**：按钮布局与其他分享组件保持一致（主按钮 + 辅助按钮）

