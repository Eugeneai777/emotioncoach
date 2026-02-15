

## 合并卡片 — 移除 BloomOverviewCard，飞轮置顶

### 重复分析

| 数据 | BloomOverviewCard | MyFlywheelOverview | 重复？ |
|------|-------------------|-------------------|--------|
| 累计收益 | 有 | 有（总收益） | 重复 |
| 可提现 | 有 | 有 | 重复 |
| 直推人数 | 有 | 有（Level 1 人数） | 重复 |
| 二级人数 | 有 | 无 | 独有 |
| 身份/佣金 | 有 | 无 | 独有 |
| 提现按钮 | 有 | 无 | 收益Tab已有 |

### 改动方案

**移除 BloomOverviewCard**，将其独有信息合并到 MyFlywheelOverview 的标题栏中。

#### MyFlywheelOverview 改后布局

```text
+------------------------------------------+
| 🦋 绽放合伙人 · 30%+10%    🎯 我的飞轮   |
|                                          |
| [1 测评] → [2 有劲] → [3 绽放] → [4 合伙人]|
|  23人      5人       2人       1人       |
|  ¥227     ¥1,495    ¥xxx     ¥4,950     |
|    21%→     40%→      50%→               |
|                                          |
| 总收益 ¥8,672  可提现 ¥3,200              |
+------------------------------------------+
```

标题行左侧显示身份标签（含品牌色），右侧保留"我的飞轮"标题。一张卡片搞定所有信息。

### 技术细节

**修改文件 1：** `src/components/partner/MyFlywheelOverview.tsx`
- 新增 props：`partnerType?: string`（'bloom' | 'youjin'）、`partnerLevel?: string`
- 标题行改为两端布局：左侧身份标签（如 `🦋 绽放合伙人 · 30%+10%`），右侧 `🎯 我的飞轮`
- 身份标签根据 partnerType 显示不同品牌色（绽放紫粉/有劲橙黄）

**修改文件 2：** `src/pages/Partner.tsx`
- 第 191 行：移除 `<BloomOverviewCard partner={partner} />`
- 第 194 行：给 MyFlywheelOverview 传入 `partnerType={partner.partner_type}` 和 `partnerLevel={partner.partner_level}`
- 移除第 11 行的 BloomOverviewCard import
