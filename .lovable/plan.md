## 背景与商业价值

**目标用户**：35-55 岁高压中年男性，他们做完测评后有强烈的"被理解、被跟进"需求。运营如果能在 24-48h 内基于测评结果定向触达（电话/微信），转化率显著高于群发。

**现状**：测评数据 (`partner_assessment_results`) 已落库（截至现在 6 个用户、11 次测评），但后台没有"按测评维度查看人员"的入口，运营拿不到名单。

**已有基础**（无需重建）：
- `partner_assessment_templates` + `partner_assessment_results` 表已完整记录（含 user_id、维度分、主导类型、AI 洞察、时间）
- `usePartnerAssessmentAnalytics` hook 已实现单测评的统计聚合（人数/分布/趋势）
- RLS 已允许 `admin` 全量读取
- 后台侧边栏「内容管理 → 测评管理」入口已存在

## 方案：聚焦"测评数据洞察"，分两层

```text
┌─────────────────────────────────────────────────┐
│ /admin/assessments  现有「测评管理」列表        │
│  [男人有劲状态评估]   …  [📊 数据洞察] ← 新增  │
└─────────────────────────────────────────────────┘
                        ↓ 点击
┌─────────────────────────────────────────────────┐
│ /admin/assessments/:id/insights  新增详情页     │
│                                                 │
│ ① 顶部 KPI 卡片                                │
│    总测评人数 / 总测评次数 / 今日新增 / 7日新增│
│    复测率 (次数 ÷ 人数)                         │
│                                                 │
│ ② 用户画像板块                                  │
│    ├ 主导类型分布 (饼图)                        │
│    ├ 分数分布 (柱状图)                          │
│    ├ 各维度均分 (横向条)                        │
│    └ 30日趋势 (折线)                            │
│                                                 │
│ ③ 测评者名单 (核心运营工具)                    │
│    表格列：头像｜昵称｜手机号｜主导类型         │
│            ｜总分｜测评时间｜操作               │
│    操作：[查看明细] [复制手机号] [拨打]         │
│    筛选：主导类型 / 分数区间 / 时间区间         │
│    搜索：按昵称/手机号                          │
│    导出：CSV (含手机号、类型、分数、时间)       │
│                                                 │
│ ④ 单条明细抽屉                                  │
│    完整答题、维度雷达、AI 洞察、历史复测列表    │
└─────────────────────────────────────────────────┘
```

**为什么这样切分**：中年男性用户对"被打标签 + 被针对性沟通"接受度高于推送。给运营的是"姓名+电话+类型+分数"的可执行清单，而不是只看图表。

## 文件改动清单

**新增**
1. `src/components/admin/AssessmentInsightsDetail.tsx` — 详情页主组件（KPI + 图表 + 名单 + 抽屉）
2. `src/hooks/useAdminAssessmentInsights.ts` — 拉取单个 template 的全量结果 + join profiles（display_name, avatar_url, phone, phone_country_code, created_at）
3. `src/components/admin/AssessmentRespondentDrawer.tsx` — 单个用户明细抽屉（答题/维度/AI 洞察）

**修改**
1. `src/components/admin/AssessmentsManagement.tsx` — 每行卡片新增「📊 数据洞察」按钮，链接到详情页
2. `src/components/admin/AdminLayout.tsx` — 新增路由 `assessments/:templateId/insights`

**复用**（无需修改）
- `usePartnerAssessmentAnalytics`（聚合逻辑直接复用，传 templateId 而非 partnerId 时小改一下，或新写 hook 只查单个）
- `recharts`（项目已用）
- `AdminPageLayout` / `AdminStatCard` 现有共享组件

## 关键技术点

- **RLS**：admin 已可读 `partner_assessment_results` 与 `profiles`（admin 角色 has_role 校验）。无需改库。
- **隐私**：手机号在表格里默认中间 4 位脱敏 `188****3978`，「复制」按钮取完整号；操作日志在第二期再加。
- **性能**：单测评目前 11 条，预期半年内 < 5000 条，前端一次性拉取 + 客户端筛选即可，无需分页。超过 1000 条时给 hook 加 `.limit(1000)` 警告。
- **导出**：纯前端 CSV 生成（Blob + a.download），含表头中文。
- **可扩展**：详情页用通用组件，后续其他测评（绽放、SCL90、SBTI）都能复用同一入口和详情页，只换 templateId。

## 不做的事

- 不做权限分级（partner_admin 不进入此页，避免跨合伙人数据泄漏）—— 入口仅 admin 可见。
- 不做"自动外呼/微信群发"集成（涉及合规与第三方资质，二期评估）。
- 不重写测评数据采集逻辑（已稳定）。

## 上线后运营 SOP（建议）

1. 每日 10:00 / 20:00 进入 `/admin/assessments` → 男人有劲 → 数据洞察
2. 按"今日新增 + 主导类型 = 压力绷弦型/失衡警示型"筛选
3. 复制手机号，按话术（不同类型不同话术）联系
4. 7 日后复看复测率，验证触达效果

是否按此方案实施？批准后切换默认模式开始编码。