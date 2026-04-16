

# 点数充值入口 — 增加 ¥99 档位

## 更新内容

在之前的 3 档基础上增加第 4 档 ¥99 套餐，最终 4 档如下：

| 套餐 | 价格 | 点数 | 定位 |
|------|------|------|------|
| 体验包 | ¥9.9 | 50 点 | 轻度用户尝鲜 |
| 标准包 | ¥49.9 | 300 点 | 日常使用 |
| 畅享包 | ¥99 | 800 点 | 高频用户性价比之选 |
| 365会员 | ¥365 | 1000 点 | 重度用户（复用已有 member365） |

## 实现方案

### 1. 新建 `src/components/QuotaRechargeDialog.tsx`

套餐选择弹窗，4 档卡片式布局（2×2 网格），每档显示价格、点数、单价对比。选择后调用 `UnifiedPayDialog` 完成支付。¥99 档标注"最超值"推荐标签。

### 2. 修改 `src/components/VoiceUsageSection.tsx`

在汇总条（第 202-221 行）右侧增加「充值」按钮，余额低于 20 点时按钮高亮。集成 QuotaRechargeDialog，支付成功后自动刷新余额。

## 修改文件

| 文件 | 改动 |
|------|------|
| `src/components/QuotaRechargeDialog.tsx` | **新建**：4 档套餐选择 + UnifiedPayDialog 集成 |
| `src/components/VoiceUsageSection.tsx` | 汇总条增加充值按钮，集成弹窗，成功回调刷新余额 |

约 2 个文件，~150 行新代码。

