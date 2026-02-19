

# 活动列表数字凸显优化

## 问题
当前活动列表中的数据列（投放、观看、购买、金额）使用 `text-muted-foreground` 颜色，与标题文字视觉权重相同，运营人员难以快速扫描关键转化数据。

## 优化方案

### 修改文件：`src/components/partner/PartnerLandingPageList.tsx`

1. **数字加粗加深**：将观看、购买、金额的数字从 `text-muted-foreground` 改为 `font-semibold text-foreground`
2. **非零高亮**：观看数 > 0 时用蓝色，购买数 > 0 时用绿色，金额 > 0 时用橙色，零值保持灰色
3. **字号微调**：数据列字号从默认 `text-xs` 保持不变，但通过加粗和颜色对比增强视觉层级

### 具体样式映射
- 观看：非零时 `font-semibold text-blue-600`，零时 `text-muted-foreground`
- 购买：非零时 `font-semibold text-emerald-600`，零时 `text-muted-foreground`
- 金额：非零时 `font-semibold text-orange-600`，零时 `text-muted-foreground`
- 投放：保持当前样式（文本信息，非核心指标）

