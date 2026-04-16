

# 在语音通话记录区块增加「剩余点数」显示

## 问题

当前汇总条只显示「总消耗 X 点」和「总时长 X 分钟」，缺少用户最关心的「剩余点数」信息。

## 方案

在 `VoiceUsageSection.tsx` 的汇总条中增加剩余点数显示，数据来自 `user_accounts` 表的 `remaining_quota` 字段。

### 修改内容

**文件**：`src/components/VoiceUsageSection.tsx`

1. 新增查询 `user_accounts` 表获取 `remaining_quota`（generated column = total_quota - used_quota）
2. 在汇总条最前面添加「剩余 X 点」，用绿色图标区分

汇总条效果：

```text
⚡ 剩余 220 点 · 🔥 本月消耗 24 点 · 🕐 总时长 3 分钟
```

仅改一个文件，增加一个简单查询。

