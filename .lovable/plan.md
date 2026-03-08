

# 剩余优化点实施方案

优化点 2（收益看板下钻）和优化点 4（分产品跟进提醒）已在之前完成。以下是剩余两个优化点的实施方案。

---

## 优化点 3：AI 文案增加图片生成

### 改动

在 `PartnerMarketingHub.tsx` 的文案生成结果区域下方，增加「生成配图」按钮。点击后调用 Lovable AI 的 `google/gemini-3-pro-image-preview` 模型，根据文案内容生成营销配图。

| 文件 | 改动 |
|------|------|
| `PartnerMarketingHub.tsx` | 生成结果下方加「生成配图」按钮，调用边缘函数生成图片，展示预览+下载 |
| 新建 `supabase/functions/generate-partner-image/index.ts` | 调用 Lovable AI 图片模型，返回图片 URL，存储到 `partner-assets` bucket |

### 流程
1. 用户生成文案后 → 出现「生成配图」按钮
2. 点击后 → 调用边缘函数，传入文案内容+文案类型
3. 边缘函数 → 用 Lovable AI 生成图片 → 上传到 partner-assets → 返回 URL
4. 前端展示图片预览 + 下载按钮

---

## 优化点 1：知乐运营数据共享看板（临时手动录入版）

等 API 确认前，先做手动录入框架。

### 数据库
新建 `partner_shared_metrics` 表，字段包括：
- `partner_id`, `metric_date`, `metric_type`（如 mini_program_visits, wechat_article_reads 等）
- `metric_value`, `notes`, `recorded_by`

### UI
新建 `PartnerSharedDataDashboard.tsx`，包含：
- 数据录入表单（管理员手动输入日期+各指标数值）
- 趋势图表（用 Recharts 展示访问量、转化率等趋势）
- 集成到行业合伙人详情页的 Tab 中

| 文件 | 改动 |
|------|------|
| 新建 `PartnerSharedDataDashboard.tsx` | 数据录入表单 + Recharts 趋势图 |
| 数据库迁移 | 创建 `partner_shared_metrics` 表 + RLS |
| `IndustryPartnerDetail.tsx` | 新增「数据看板」Tab |
| `IndustryPartnerDashboard.tsx` | 同步新增 Tab |

---

## 实施顺序

先做优化点 3（AI 配图），再做优化点 1（共享看板框架）。

