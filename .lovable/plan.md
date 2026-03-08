

# 知乐有劲飞轮优化方案

感谢你提供的详细优化建议。基于对现有代码和业务的分析，我将这 4 个优化点按可实施性分为**立即可做**和**需等待外部数据**两类。

---

## 优化点总览

| 优化点 | 核心内容 | 可行性 |
|--------|----------|--------|
| 1. 知乐运营数据共享看板 | 小程序流量、公众号数据 | ⏳ 需 3.9 号沟通后确认 API |
| 2. 收益看板增强 | 提现按钮 + 数据下钻 + 搜索 | ✅ 立即可做 |
| 3. AI 文案增加图片/视频 | 接入图片生成能力 | ✅ 可做（用 Lovable AI 图片模型） |
| 4. 跟进提醒分产品细化 | 按产品类型设规则 + 用户活跃看板 | ✅ 立即可做 |

---

## 建议实施顺序

### 第一批：立即实施（优化点 2 + 4）

#### 优化点 2：收益看板增强

当前 `YoujinPartnerDashboard.tsx` 的收益 Tab 已有 `WithdrawalForm`，但 `PartnerOverviewCard` 的"立即提现"按钮仅切换到收益 Tab。需要增强：

**2a. 数据下钻子页面**
- 点击"累计收益" → 弹出订单明细 Dialog（复用 `CommissionHistory` 数据，增加搜索/筛选）
- 点击"可提现" → 弹出提现记录 + 提现按钮
- 点击"已提现" → 弹出已完成提现列表
- 点击"直推用户" → 弹出用户列表 + 每人购买的产品明细
- 点击"二级用户" → 同上（level=2）

**2b. 搜索功能**
- 订单明细 Dialog 内增加搜索框（按用户名、产品名搜索）
- 提现记录增加日期范围筛选

**技术方案**：
- 新建 `src/components/partner/EarningsDetailDialog.tsx` — 统一的数据下钻弹窗
- 修改 `PartnerOverviewCard.tsx` — 每个数据指标可点击，触发对应弹窗
- 查询 `partner_commissions`、`partner_referrals`、`partner_withdrawals` 表

#### 优化点 4：跟进提醒分产品细化

当前 `PartnerFollowupReminders` 只有一个 `inactive_days_threshold` 字段。

**4a. 分产品类型规则**
- 数据库：扩展 `partner_followup_settings` 表，增加 `product_rules` JSONB 字段存储各产品规则：
  ```json
  {
    "camp": { "enabled": true, "trigger": "no_checkin_days", "threshold": 3 },
    "assessment": { "enabled": true, "trigger": "no_login_days", "threshold": 7 },
    "tool": { "enabled": true, "trigger": "no_open_days", "threshold": 5 }
  }
  ```
- UI：设置面板从单一数字改为分产品卡片式规则配置

**4b. 用户端活跃度看板**（合伙人查看学员活跃度）
- 在学员详情中增加活跃度面板，按模块展示最近活动时间

**4c. 自动推送资料包**
- 触发提醒时附带对应产品的复盘指南链接

**技术方案**：
- 数据库迁移：`partner_followup_settings` 增加 `product_rules` 列
- 修改 `PartnerFollowupReminders.tsx` — 设置面板改为分产品配置 UI
- 新建活跃度统计查询逻辑

---

### 第二批：可预做框架（优化点 3）

#### 优化点 3：AI 文案增加图片生成

当前 `PartnerMarketingHub` 只生成文字文案。可利用 Lovable AI 支持的 `google/gemini-3-pro-image-preview` 模型生成配图。

**技术方案**：
- 在文案生成后增加"生成配图"按钮
- 调用 Lovable AI 图片模型生成营销海报/配图
- 生成的图片存储到 `partner-assets` bucket

---

### 第三批：等待外部数据（优化点 1）

#### 优化点 1：知乐运营数据共享看板

这部分需要你 3.9 号和知乐运营确认后才能实施。我可以先做好：
- 新建 `PartnerSharedDataDashboard.tsx` 组件框架
- 预留数据表结构（`partner_shared_metrics` 表）
- 等 API 接口确认后接入数据同步

目前可先设计一个**手动录入**的临时方案：合伙人或管理员手动输入关键数据（小程序访问量、公众号阅读量等），后续替换为 API 自动同步。

---

## 建议先做哪些？

考虑到你下周要教知乐团队使用后台，建议优先实施**优化点 2（收益看板下钻 + 提现）**，这是合伙人最直接需要的功能。然后做**优化点 4（跟进提醒细化）**。

需要我开始实施哪个优化点？

